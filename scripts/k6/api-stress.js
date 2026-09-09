/**
 * Local stress test for the aiSETUP backend (`http://localhost:8080/api`).
 *
 * Read traffic hits real DB rows; every write is aimed at one throwaway case
 * created in setup(), so a run cannot mutate staff documents or real applicants.
 * AI, OTP, mail, registration and admin mutations are deliberately never called:
 * they cost money, send messages, or create accounts.
 *
 * Run via `npm run stress:api` (see ./README.md).
 */
import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";

const tinyFile = open("./fixtures/tiny.txt", "b");

const BASE_URL = (__ENV.BASE_URL || "http://localhost:8080/api").replace(/\/$/, "");
const STAFF_EMAIL = __ENV.STAFF_EMAIL || "agent@dost.gov.ph";
const STAFF_PASSWORD = __ENV.STAFF_PASSWORD || "admin123";
const PROFILE = (__ENV.PROFILE || "load").toLowerCase();
// Fixed id so repeat runs re-use one case instead of adding a new row to the
// staff client list every time. Override to isolate a run.
const APPLICANT_ID = __ENV.APPLICANT_ID || "f6a1c0de-0000-4000-8000-a15e70000001";

const PROFILES = {
  smoke: {
    stages: [{ duration: "30s", target: 1 }],
    p95: 1500,
  },
  load: {
    stages: [
      { duration: "1m", target: 20 },
      { duration: "3m", target: 20 },
      { duration: "30s", target: 0 },
    ],
    p95: 800,
  },
  stress: {
    stages: [
      { duration: "1m", target: 50 },
      { duration: "3m", target: 50 },
      { duration: "30s", target: 0 },
    ],
    p95: 2000,
  },
  spike: {
    stages: [
      { duration: "30s", target: 5 },
      { duration: "10s", target: 80 },
      { duration: "30s", target: 80 },
      { duration: "20s", target: 5 },
      { duration: "10s", target: 0 },
    ],
    p95: 2000,
  },
};

const profile = PROFILES[PROFILE];
if (!profile) {
  throw new Error(
    `Unknown PROFILE "${PROFILE}". Expected one of: ${Object.keys(PROFILES).join(", ")}`,
  );
}

export const options = {
  stages: profile.stages,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
    http_req_duration: [`p(95)<${profile.p95}`],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

/**
 * Weighted traffic mix. Shares mirror what staff actually do all day: mostly
 * read the case list, occasionally write a module, rarely upload.
 */
const MIX = [
  { weight: 35, name: "GET /applicants", run: listApplicants },
  { weight: 20, name: "GET /applicants/{id}", run: getApplicant },
  { weight: 10, name: "GET /health", run: getHealth },
  { weight: 8, name: "GET /notifications", run: listNotifications },
  { weight: 5, name: "GET /landbank-branches", run: listLandBankBranches },
  { weight: 5, name: "GET /auth/me", run: getMe },
  { weight: 5, name: "GET /files", run: readFiles },
  { weight: 4, name: "PUT /applicants/{id}/header", run: writeHeader },
  { weight: 4, name: "PUT /applicants/{id}/modules/caseMeta", run: patchCaseMeta },
  { weight: 2, name: "POST /files", run: uploadFile },
  { weight: 2, name: "POST /financial-projection/generate", run: generateProjection },
];

const TOTAL_WEIGHT = MIX.reduce((sum, entry) => sum + entry.weight, 0);

const SEED_MODULE = "registration";

const PROJECTION_INPUTS = {
  equipment: [{ name: "Dryer", amount: 500000, lifeYears: 5 }],
  preoperating: [{ name: "Dev", amount: 50000, lifeYears: 5 }],
  products: [
    {
      name: "Dried mango",
      srpQ1: 100,
      srpQ2: 100,
      srpQ3: 100,
      srpQ4: 100,
      costQ1: 40,
      qtyQ1: 1000,
      qtyQ2: 1000,
      qtyQ3: 1000,
      qtyQ4: 1000,
    },
  ],
  loanAmount: 200000,
  loanTermYears: 5,
  loanInterestRate: 0.1,
  equity: 300000,
  inventoryYear1: 20000,
  salesGrowth: 0.1,
  salaries: 120000,
  taxMethod: "sole8",
  setupRefundByYear: [0, 50000, 50000, 50000, 50000],
};

function jsonHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export function setup() {
  const health = http.get(`${BASE_URL}/health`, { tags: { name: "setup GET /health" } });
  if (health.status !== 200) {
    exec.test.abort(
      `Backend not reachable at ${BASE_URL}/health (status ${health.status}). Start it with "npm run backend".`,
    );
  }

  const login = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: STAFF_EMAIL, password: STAFF_PASSWORD }),
    { headers: { "Content-Type": "application/json" }, tags: { name: "setup POST /auth/login" } },
  );
  if (login.status !== 200) {
    exec.test.abort(
      `Staff login failed for ${STAFF_EMAIL} (status ${login.status}). Check STAFF_EMAIL / STAFF_PASSWORD.`,
    );
  }
  const token = login.json("token");
  if (!token) {
    exec.test.abort("Login response had no token.");
  }

  // Throwaway case: all writes in the run target this record only. A repeat run
  // overwrites it (same id) rather than creating another one.
  const applicantId = APPLICANT_ID;
  const applicationId = "LOI-0000-000000";
  const enterpriseName = "k6 Stress Harness (delete me)";
  const nowIso = new Date().toISOString();

  const created = http.put(
    `${BASE_URL}/applicants/${applicantId}`,
    JSON.stringify({
      id: applicantId,
      applicationId,
      enterpriseName,
      currentModule: SEED_MODULE,
      moduleData: {},
      profile: {
        applicantName: "k6 Load Harness",
        region: "Region XII (SOCCSKSARGEN)",
        province: "South Cotabato",
        qualified: true,
        lastUpdated: nowIso,
      },
      updatedAt: nowIso,
    }),
    { headers: jsonHeaders(token), tags: { name: "setup PUT /applicants/{id}" } },
  );
  if (created.status !== 200) {
    exec.test.abort(
      `Could not create the throwaway case (status ${created.status}): ${created.body}`,
    );
  }

  const uploaded = http.post(
    `${BASE_URL}/applicants/${applicantId}/files`,
    {
      moduleKey: "general",
      file: http.file(tinyFile, "k6-seed.txt", "text/plain"),
    },
    { headers: authHeaders(token), tags: { name: "setup POST /files" } },
  );
  if (uploaded.status !== 200) {
    exec.test.abort(`Could not seed a file upload (status ${uploaded.status}): ${uploaded.body}`);
  }

  return {
    token,
    applicantId,
    applicationId,
    enterpriseName,
    fileId: uploaded.json("id"),
  };
}

export default function (data) {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const entry of MIX) {
    roll -= entry.weight;
    if (roll <= 0) {
      entry.run(data);
      break;
    }
  }
  sleep(0.2 + Math.random() * 0.3);
}

function expectOk(res, name) {
  check(res, {
    [`${name} -> 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
}

function getHealth() {
  const res = http.get(`${BASE_URL}/health`, { tags: { name: "GET /health" } });
  expectOk(res, "GET /health");
}

function listApplicants(data) {
  const res = http.get(`${BASE_URL}/applicants`, {
    headers: authHeaders(data.token),
    tags: { name: "GET /applicants" },
  });
  expectOk(res, "GET /applicants");
}

function getApplicant(data) {
  const res = http.get(`${BASE_URL}/applicants/${data.applicantId}`, {
    headers: authHeaders(data.token),
    tags: { name: "GET /applicants/{id}" },
  });
  expectOk(res, "GET /applicants/{id}");
}

function listNotifications(data) {
  const res = http.get(`${BASE_URL}/notifications`, {
    headers: authHeaders(data.token),
    tags: { name: "GET /notifications" },
  });
  expectOk(res, "GET /notifications");
}

function listLandBankBranches(data) {
  const res = http.get(`${BASE_URL}/landbank-branches?activeOnly=true`, {
    headers: authHeaders(data.token),
    tags: { name: "GET /landbank-branches" },
  });
  expectOk(res, "GET /landbank-branches");
}

function getMe(data) {
  const res = http.get(`${BASE_URL}/auth/me`, {
    headers: authHeaders(data.token),
    tags: { name: "GET /auth/me" },
  });
  expectOk(res, "GET /auth/me");
}

function readFiles(data) {
  const list = http.get(`${BASE_URL}/applicants/${data.applicantId}/files`, {
    headers: authHeaders(data.token),
    tags: { name: "GET /files" },
  });
  expectOk(list, "GET /files");
  if (!data.fileId) {
    return;
  }
  const download = http.get(`${BASE_URL}/applicants/${data.applicantId}/files/${data.fileId}`, {
    headers: authHeaders(data.token),
    tags: { name: "GET /files/{fileId}" },
  });
  expectOk(download, "GET /files/{fileId}");
}

/**
 * Keeps `currentModule` where setup() left it: bumping it would trip the
 * workflow gates instead of measuring the write path.
 */
function writeHeader(data) {
  const res = http.put(
    `${BASE_URL}/applicants/${data.applicantId}/header`,
    JSON.stringify({
      enterpriseName: data.enterpriseName,
      currentModule: SEED_MODULE,
      profile: {
        applicantName: "k6 Load Harness",
        region: "Region XII (SOCCSKSARGEN)",
        province: "South Cotabato",
        qualified: true,
        lastUpdated: new Date().toISOString(),
      },
    }),
    { headers: jsonHeaders(data.token), tags: { name: "PUT /applicants/{id}/header" } },
  );
  expectOk(res, "PUT /applicants/{id}/header");
}

/**
 * `caseMeta` is a plain map key (not one of shared/module-keys.json
 * objectModuleKeys), and `published` is omitted so nothing gets published.
 */
function patchCaseMeta(data) {
  const res = http.put(
    `${BASE_URL}/applicants/${data.applicantId}/modules/caseMeta`,
    JSON.stringify({
      data: {
        k6LastTouchedAt: new Date().toISOString(),
        k6Vu: exec.vu.idInTest,
        k6Iteration: exec.scenario.iterationInTest,
      },
    }),
    {
      headers: jsonHeaders(data.token),
      tags: { name: "PUT /applicants/{id}/modules/caseMeta" },
    },
  );
  expectOk(res, "PUT /applicants/{id}/modules/caseMeta");
}

function uploadFile(data) {
  const res = http.post(
    `${BASE_URL}/applicants/${data.applicantId}/files`,
    {
      moduleKey: "general",
      file: http.file(tinyFile, `k6-${exec.vu.idInTest}-${exec.scenario.iterationInTest}.txt`, "text/plain"),
    },
    { headers: authHeaders(data.token), tags: { name: "POST /files" } },
  );
  expectOk(res, "POST /files");
}

function generateProjection(data) {
  const res = http.post(
    `${BASE_URL}/financial-projection/generate`,
    JSON.stringify({
      applicationId: data.applicationId,
      applicantId: data.applicantId,
      inputs: PROJECTION_INPUTS,
    }),
    {
      headers: jsonHeaders(data.token),
      tags: { name: "POST /financial-projection/generate" },
    },
  );
  expectOk(res, "POST /financial-projection/generate");
  check(res, {
    "projection balanced": (r) => r.status === 200 && r.json("snapshot.balanced") === true,
  });
}
