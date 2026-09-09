/**
 * Thin launcher for the k6 API stress harness: picks a profile, makes sure the
 * results directory exists (k6 --summary-export will not create it), and turns
 * a missing k6 binary into an actionable message instead of ENOENT.
 *
 * Usage: node scripts/k6/run.mjs [smoke|load|stress|spike] [extra k6 args...]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PROFILES = ["smoke", "load", "stress", "spike"];
const here = import.meta.dirname;
const script = path.join(here, "api-stress.js");
const resultsDir = path.join(here, "results");

const [profileArg, ...passthrough] = process.argv.slice(2);
const profile = (profileArg || "load").toLowerCase();

if (!PROFILES.includes(profile)) {
  console.error(`Unknown profile "${profile}". Expected one of: ${PROFILES.join(", ")}`);
  process.exit(1);
}

const useShell = process.platform === "win32";

// Probe first: a shell-wrapped spawn reports "not recognized" as a plain exit
// code, which is indistinguishable from a failed test run.
const probe = spawnSync("k6", ["version"], { stdio: "ignore", shell: useShell });
if (probe.error || probe.status !== 0) {
  console.error(
    [
      "k6 was not found on PATH. Install it once, then re-run:",
      "  Windows:  winget install GrafanaLabs.k6",
      "  macOS:    brew install k6",
      "  Docs:     https://grafana.com/docs/k6/latest/set-up/install-k6/",
    ].join("\n"),
  );
  process.exit(1);
}

fs.mkdirSync(resultsDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const summaryPath = path.join(resultsDir, `${profile}-${stamp}.json`);

console.log(`Running k6 profile "${profile}" against ${process.env.BASE_URL || "http://localhost:8080/api"}`);
console.log(`Summary will be written to ${summaryPath}`);

const result = spawnSync(
  "k6",
  ["run", script, "--summary-export", summaryPath, ...passthrough],
  {
    stdio: "inherit",
    shell: useShell,
    env: { ...process.env, PROFILE: profile },
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

// k6 --summary-export copies setup()'s return value verbatim, which carries the
// staff JWT. Drop it before the file outlives the run.
if (fs.existsSync(summaryPath)) {
  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    if ("setup_data" in summary) {
      delete summary.setup_data;
      fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    }
  } catch (err) {
    console.error(`Could not sanitize ${summaryPath}, deleting it instead: ${err.message}`);
    fs.rmSync(summaryPath, { force: true });
  }
}

process.exit(result.status ?? 1);
