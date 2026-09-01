/**
 * Author: Yzrel Jade B. Eborde
 *
 * Live dashboard aggregators from scoped applicants (DB-hydrated via applicantStore).
 * Charts use withLiveOrFallback so sample rows in dashboardData remain empty-state demos.
 */

import {
  Applicant,
  MODULE_LABELS,
  MODULE_ORDER,
  type ModuleStatus,
} from "../store/applicantStore";
import { REGION_12_PROVINCES } from "../constants/region12";
import { resolveApplicantProvince } from "./provincialOffice";
import { getApprovalLetterForm, getApprovalLetterStored } from "./approvalLetter";
import { getProjectProposalForm } from "./projectProposal";
import {
  getLandBankForm,
  getLandBankStored,
  WITHDRAWAL_SIGNED_KEY,
  sumTrancheEquipment,
} from "./landBankWithdrawal";
import { getSignedDocument } from "./documentDelivery";
import { getProjectInformationSheetStored } from "./projectInformationSheet";
import type { PisEmploymentMatrix, PisSexCounts } from "../api/types";

export type RecentApplicationRow = {
  name: string;
  status: string;
  date: string;
  type: string;
  amount: string;
  region: string;
  module: string;
};

const PIPELINE_STAGES = [
  { stage: "Pre-Screen", fill: "#0C2461", modules: ["prescreening"] as ModuleStatus[] },
  {
    stage: "Registered",
    fill: "#1a3a7a",
    modules: ["registration", "letter-of-intent"] as ModuleStatus[],
  },
  { stage: "Documents", fill: "#00AEEF", modules: ["requirements"] as ModuleStatus[] },
  {
    stage: "Assessment",
    fill: "#0891b2",
    modules: ["tna1", "tna2"] as ModuleStatus[],
  },
  {
    stage: "Evaluation",
    fill: "#10b981",
    modules: ["project-proposal", "conduct-rtec"] as ModuleStatus[],
  },
  {
    stage: "Approved",
    fill: "#059669",
    modules: ["approval-letter", "project-information-sheet"] as ModuleStatus[],
  },
  {
    stage: "Released",
    fill: "#f59e0b",
    modules: [
      "landbank-withdrawal",
      "procurement-liquidation",
      "refund-delinquent",
      "project-closeout",
      "completed",
    ] as ModuleStatus[],
  },
] as const;

const REGION_COLORS = [
  "#0C2461",
  "#00AEEF",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
];

const APPROVAL_IDX = MODULE_ORDER.indexOf("approval-letter");

export type PipelineRow = { stage: string; count: number; fill: string };
export type RegionRow = { name: string; value: number; color: string };
export type SectorRow = { sector: string; count: number; pct: number };
export type MonthlyTrendRow = {
  month: string;
  applications: number;
  approved: number;
  released: number;
};
export type FundDisbursementRow = { month: string; amount: number };
export type ProgramKpi = {
  label: string;
  value: string | null;
};
export type QuarterComparisonRow = {
  label: string;
  previous: number;
  current: number;
  previousLabel: string;
  currentLabel: string;
  unit?: string;
  suffix?: string;
  lower?: boolean;
};

/** Prefer live series; use sample fallback when live is empty. */
export function withLiveOrFallback<T>(
  live: T[],
  fallback: T[],
  isEmpty?: (live: T[]) => boolean,
): T[] {
  const empty = isEmpty ? isEmpty(live) : live.length === 0;
  return empty ? fallback : live;
}

export function parsePesoAmount(amount: string | number | undefined | null): number {
  if (typeof amount === "number") return Number.isFinite(amount) ? amount : 0;
  if (!amount) return 0;
  return parseFloat(String(amount).replace(/[^\d.]/g, "")) || 0;
}

export function parseFlexibleDate(value: string | undefined | null): Date | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed);
  return null;
}

function formatCompactGrant(amount: number): string {
  if (amount <= 0) return "₱0";
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `₱${m >= 10 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₱${(amount / 1_000).toFixed(0)}K`;
  }
  return `₱${amount.toLocaleString("en-PH")}`;
}

function formatDisplayDate(value: string | undefined | null): string {
  const d = parseFlexibleDate(value);
  if (!d) return value?.trim() || "—";
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function moduleStage(mod: ModuleStatus): string {
  for (const row of PIPELINE_STAGES) {
    if ((row.modules as readonly string[]).includes(mod)) return row.stage;
  }
  const idx = MODULE_ORDER.indexOf(mod);
  if (idx < 0) return "Pre-Screen";
  if (idx <= MODULE_ORDER.indexOf("letter-of-intent")) return "Registered";
  if (idx <= MODULE_ORDER.indexOf("requirements")) return "Documents";
  if (idx <= MODULE_ORDER.indexOf("tna2")) return "Assessment";
  if (idx <= MODULE_ORDER.indexOf("conduct-rtec")) return "Evaluation";
  if (idx <= MODULE_ORDER.indexOf("approval-letter")) return "Approved";
  return "Released";
}

function recentStatusForModule(mod: ModuleStatus): string {
  if (mod === "prescreening") return "Pre-Screening";
  if (mod === "registration" || mod === "letter-of-intent") return "Registered";
  if (mod === "requirements") return "Requirements";
  if (
    mod === "tna1" ||
    mod === "tna2" ||
    mod === "project-proposal" ||
    mod === "conduct-rtec"
  ) {
    return "On Assessment";
  }
  if (APPROVAL_IDX >= 0 && MODULE_ORDER.indexOf(mod) >= APPROVAL_IDX) {
    return "Approved";
  }
  return "Pre-Screening";
}

function resolveSector(applicant: Applicant): string {
  const direct = applicant.businessSector?.trim();
  if (direct) return direct;
  const tna1 = applicant.moduleData?.tna1 as
    | { form?: { sector?: string; industrySector?: string } }
    | undefined;
  const fromTna =
    tna1?.form?.sector?.trim() || tna1?.form?.industrySector?.trim();
  if (fromTna) return fromTna;
  const profileSector = (applicant.moduleData?.profile as { sector?: string } | undefined)
    ?.sector?.trim();
  return profileSector || "Unspecified";
}

function approvalDate(applicant: Applicant): Date | null {
  const stored = getApprovalLetterStored(applicant);
  return (
    parseFlexibleDate(stored?.publishedAt) ||
    parseFlexibleDate(stored?.updatedAt) ||
    null
  );
}

function applicationDate(applicant: Applicant): Date | null {
  return (
    parseFlexibleDate(applicant.submittedAt) ||
    parseFlexibleDate(applicant.lastUpdated) ||
    null
  );
}

function releaseEvents(applicant: Applicant): { date: Date; amount: number }[] {
  const events: { date: Date; amount: number }[] = [];
  const form = getLandBankForm(applicant);
  const stored = getLandBankStored(applicant);
  const packages: {
    tranche: 1 | 2 | 3;
    amount: number;
    signedKey: string;
  }[] = [
    {
      tranche: 1,
      amount: sumTrancheEquipment(form.tranches.first),
      signedKey: WITHDRAWAL_SIGNED_KEY.first,
    },
    {
      tranche: 2,
      amount: sumTrancheEquipment(form.tranches.second),
      signedKey: WITHDRAWAL_SIGNED_KEY.second,
    },
    {
      tranche: 3,
      amount: sumTrancheEquipment(form.tranches.third),
      signedKey: WITHDRAWAL_SIGNED_KEY.third,
    },
  ];

  for (const pkg of packages) {
    if (pkg.amount <= 0) continue;
    const signed = getSignedDocument(applicant, pkg.signedKey);
    const letter =
      pkg.tranche === 1
        ? form.tranches.first.signedLetter
        : pkg.tranche === 2
          ? form.tranches.second.signedLetter
          : form.tranches.third.signedLetter;
    const date =
      parseFlexibleDate(signed?.uploadedAt) ||
      parseFlexibleDate(letter?.uploadedAt) ||
      parseFlexibleDate(stored?.submittedAt) ||
      parseFlexibleDate(stored?.updatedAt);
    if (!date) continue;
    events.push({ date, amount: pkg.amount });
  }
  return events;
}

function rollingMonthBuckets(count = 7, now = new Date()) {
  const buckets: { year: number; month: number; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  return buckets;
}

function inBucket(d: Date, year: number, month: number): boolean {
  return d.getFullYear() === year && d.getMonth() === month;
}

function calendarQuarter(d: Date): { year: number; quarter: number } {
  return { year: d.getFullYear(), quarter: Math.floor(d.getMonth() / 3) + 1 };
}

function shiftQuarter(
  year: number,
  quarter: number,
  delta: number,
): { year: number; quarter: number } {
  const abs = year * 4 + (quarter - 1) + delta;
  return { year: Math.floor(abs / 4), quarter: (abs % 4) + 1 };
}

function inQuarter(d: Date, year: number, quarter: number): boolean {
  const q = calendarQuarter(d);
  return q.year === year && q.quarter === quarter;
}

export function getPipelineChartData(applicants: Applicant[]): PipelineRow[] {
  if (applicants.length === 0) return [];
  const counts = new Map<string, number>();
  for (const stage of PIPELINE_STAGES) counts.set(stage.stage, 0);
  for (const a of applicants) {
    const stage = moduleStage(a.currentModule);
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }
  return PIPELINE_STAGES.map((s) => ({
    stage: s.stage,
    count: counts.get(s.stage) ?? 0,
    fill: s.fill,
  }));
}

export function getRegionBreakdownData(applicants: Applicant[]): RegionRow[] {
  if (applicants.length === 0) return [];
  const counts = new Map<string, number>();
  for (const province of REGION_12_PROVINCES) counts.set(province, 0);
  let known = 0;
  for (const a of applicants) {
    const province = resolveApplicantProvince(a);
    if (!province) continue;
    known += 1;
    counts.set(province, (counts.get(province) ?? 0) + 1);
  }
  if (known === 0) return [];
  return REGION_12_PROVINCES.map((name, i) => ({
    name,
    value: counts.get(name) ?? 0,
    color: REGION_COLORS[i % REGION_COLORS.length],
  })).filter((r) => r.value > 0);
}

export function getTopSectorsData(applicants: Applicant[], limit = 5): SectorRow[] {
  if (applicants.length === 0) return [];
  const counts = new Map<string, number>();
  for (const a of applicants) {
    const sector = resolveSector(a);
    counts.set(sector, (counts.get(sector) ?? 0) + 1);
  }
  const max = Math.max(...counts.values(), 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([sector, count]) => ({
      sector,
      count,
      pct: Math.round((count / max) * 100),
    }));
}

export function getRecentApplicationsRows(
  applicants: Applicant[],
  limit = 5,
): RecentApplicationRow[] {
  if (applicants.length === 0) return [];
  return [...applicants]
    .sort((a, b) => {
      const da =
        parseFlexibleDate(a.lastUpdated)?.getTime() ??
        parseFlexibleDate(a.submittedAt)?.getTime() ??
        0;
      const db =
        parseFlexibleDate(b.lastUpdated)?.getTime() ??
        parseFlexibleDate(b.submittedAt)?.getTime() ??
        0;
      return db - da;
    })
    .slice(0, limit)
    .map((a) => {
      const approval = getApprovalLetterForm(a);
      const pp = getProjectProposalForm(a);
      const amountNum = parsePesoAmount(
        approval.approvedAmount || pp.amountRequested,
      );
      return {
        name: a.enterpriseName || a.applicantName || "—",
        status: recentStatusForModule(a.currentModule),
        date: formatDisplayDate(a.lastUpdated || a.submittedAt),
        type: a.msmeSize || pp.organizationType || "—",
        amount: formatCompactGrant(amountNum),
        region: resolveApplicantProvince(a) || a.region || "—",
        module: MODULE_LABELS[a.currentModule] ?? a.currentModule,
      };
    });
}

export function getMonthlyTrendsData(
  applicants: Applicant[],
  now = new Date(),
): MonthlyTrendRow[] {
  if (applicants.length === 0) return [];
  const buckets = rollingMonthBuckets(7, now);
  const rows = buckets.map((b) => ({
    month: b.label,
    applications: 0,
    approved: 0,
    released: 0,
  }));

  let any = false;
  for (const a of applicants) {
    const appDate = applicationDate(a);
    if (appDate) {
      buckets.forEach((b, i) => {
        if (inBucket(appDate, b.year, b.month)) {
          rows[i].applications += 1;
          any = true;
        }
      });
    }
    const appr = approvalDate(a);
    if (appr) {
      buckets.forEach((b, i) => {
        if (inBucket(appr, b.year, b.month)) {
          rows[i].approved += 1;
          any = true;
        }
      });
    }
    for (const ev of releaseEvents(a)) {
      buckets.forEach((b, i) => {
        if (inBucket(ev.date, b.year, b.month)) {
          rows[i].released += 1;
          any = true;
        }
      });
    }
  }
  if (!any) return [];
  return rows;
}

export function getProgramKpis(applicants: Applicant[]): ProgramKpi[] {
  if (applicants.length === 0) {
    return [
      { label: "Avg. Processing Time", value: null },
      { label: "Approval Rate", value: null },
      { label: "Avg. Grant Amount", value: null },
      { label: "Enterprises Upgraded", value: null },
      { label: "Jobs Created / Retained", value: null },
    ];
  }

  const submitted = applicants.filter((a) => applicationDate(a));
  const approved = applicants.filter((a) => {
    const idx = MODULE_ORDER.indexOf(a.currentModule);
    return APPROVAL_IDX >= 0 && idx >= APPROVAL_IDX;
  });

  let processingSum = 0;
  let processingCount = 0;
  for (const a of approved) {
    const start = applicationDate(a);
    const end = approvalDate(a);
    if (!start || !end) continue;
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    if (days < 0) continue;
    processingSum += days;
    processingCount += 1;
  }

  let grantSum = 0;
  let grantCount = 0;
  for (const a of approved) {
    const approval = getApprovalLetterForm(a);
    const pp = getProjectProposalForm(a);
    const n = parsePesoAmount(approval.approvedAmount || pp.amountRequested);
    if (n <= 0) continue;
    grantSum += n;
    grantCount += 1;
  }

  const approvalRate =
    submitted.length > 0
      ? Math.round((approved.length / Math.max(submitted.length, 1)) * 100)
      : applicants.length > 0
        ? Math.round((approved.length / applicants.length) * 100)
        : null;

  const workforce = getWorkforceGenderTotals(applicants);

  return [
    {
      label: "Avg. Processing Time",
      value:
        processingCount > 0
          ? `${Math.round(processingSum / processingCount)} days`
          : null,
    },
    {
      label: "Approval Rate",
      value: approvalRate !== null ? `${approvalRate}%` : null,
    },
    {
      label: "Avg. Grant Amount",
      value:
        grantCount > 0 ? formatCompactGrant(grantSum / grantCount) : null,
    },
    { label: "Enterprises Upgraded", value: null },
    {
      label: "Jobs Created / Retained",
      value:
        workforce.total > 0
          ? workforce.total.toLocaleString("en-PH")
          : null,
    },
  ];
}

export function mergeProgramKpisWithFallback(
  live: ProgramKpi[],
  fallback: { label: string; value: string }[],
): { label: string; value: string }[] {
  return fallback.map((fb) => {
    const found = live.find((l) => l.label === fb.label);
    return {
      label: fb.label,
      value: found?.value?.trim() ? found.value : fb.value,
    };
  });
}

export function getQuarterComparisonData(
  applicants: Applicant[],
  now = new Date(),
): QuarterComparisonRow[] {
  if (applicants.length === 0) return [];

  const current = calendarQuarter(now);
  const previous = shiftQuarter(current.year, current.quarter, -1);
  const previousLabel = `Q${previous.quarter}`;
  const currentLabel = `Q${current.quarter}`;

  let appsPrev = 0;
  let appsCurr = 0;
  let apprPrev = 0;
  let apprCurr = 0;
  let fundsPrev = 0;
  let fundsCurr = 0;
  let procPrevSum = 0;
  let procPrevCount = 0;
  let procCurrSum = 0;
  let procCurrCount = 0;
  let rejectedPrev = 0;
  let rejectedCurr = 0;
  let graduatedPrev = 0;
  let graduatedCurr = 0;

  for (const a of applicants) {
    const appDate = applicationDate(a);
    if (appDate) {
      if (inQuarter(appDate, previous.year, previous.quarter)) appsPrev += 1;
      if (inQuarter(appDate, current.year, current.quarter)) appsCurr += 1;
    }

    const appr = approvalDate(a);
    if (appr) {
      if (inQuarter(appr, previous.year, previous.quarter)) apprPrev += 1;
      if (inQuarter(appr, current.year, current.quarter)) apprCurr += 1;
      const start = applicationDate(a);
      if (start) {
        const days = Math.round((appr.getTime() - start.getTime()) / 86_400_000);
        if (days >= 0) {
          if (inQuarter(appr, previous.year, previous.quarter)) {
            procPrevSum += days;
            procPrevCount += 1;
          }
          if (inQuarter(appr, current.year, current.quarter)) {
            procCurrSum += days;
            procCurrCount += 1;
          }
        }
      }
    }

    for (const ev of releaseEvents(a)) {
      if (inQuarter(ev.date, previous.year, previous.quarter)) {
        fundsPrev += ev.amount;
      }
      if (inQuarter(ev.date, current.year, current.quarter)) {
        fundsCurr += ev.amount;
      }
    }

    const decision = a.moduleData?.staffDecision;
    if (decision === "disqualified" || decision === "rejected") {
      const d = parseFlexibleDate(a.lastUpdated) || appDate;
      if (d && inQuarter(d, previous.year, previous.quarter)) rejectedPrev += 1;
      if (d && inQuarter(d, current.year, current.quarter)) rejectedCurr += 1;
    }

    if (a.currentModule === "completed" || a.currentModule === "project-closeout") {
      const d = parseFlexibleDate(a.lastUpdated) || appDate;
      if (d && inQuarter(d, previous.year, previous.quarter)) graduatedPrev += 1;
      if (d && inQuarter(d, current.year, current.quarter)) graduatedCurr += 1;
    }
  }

  const any =
    appsPrev +
      appsCurr +
      apprPrev +
      apprCurr +
      fundsPrev +
      fundsCurr +
      graduatedPrev +
      graduatedCurr >
    0;
  if (!any) return [];

  const rejectDenomPrev = Math.max(appsPrev, 1);
  const rejectDenomCurr = Math.max(appsCurr, 1);

  return [
    {
      label: "New Applications",
      previous: appsPrev,
      current: appsCurr,
      previousLabel,
      currentLabel,
    },
    {
      label: "Approvals",
      previous: apprPrev,
      current: apprCurr,
      previousLabel,
      currentLabel,
    },
    {
      label: "Funds Released",
      previous: Math.round((fundsPrev / 1_000_000) * 10) / 10,
      current: Math.round((fundsCurr / 1_000_000) * 10) / 10,
      previousLabel,
      currentLabel,
      unit: "₱",
      suffix: "M",
    },
    {
      label: "Avg. Processing Days",
      previous:
        procPrevCount > 0 ? Math.round(procPrevSum / procPrevCount) : 0,
      current:
        procCurrCount > 0 ? Math.round(procCurrSum / procCurrCount) : 0,
      previousLabel,
      currentLabel,
      lower: true,
    },
    {
      label: "Rejection Rate",
      previous: Math.round((rejectedPrev / rejectDenomPrev) * 100),
      current: Math.round((rejectedCurr / rejectDenomCurr) * 100),
      previousLabel,
      currentLabel,
      suffix: "%",
      lower: true,
    },
    {
      label: "Enterprises Graduated",
      previous: graduatedPrev,
      current: graduatedCurr,
      previousLabel,
      currentLabel,
    },
  ];
}

export function getStaffDashboardUpdatedLabel(
  applicants: Applicant[],
  fallback = "April 28, 2026 · FY 2024–2025",
): string {
  let latest: Date | null = null;
  for (const a of applicants) {
    const d = parseFlexibleDate(a.lastUpdated) || parseFlexibleDate(a.submittedAt);
    if (!d) continue;
    if (!latest || d.getTime() > latest.getTime()) latest = d;
  }
  if (!latest) return fallback;
  const formatted = latest.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${formatted}`;
}

/** Build fund disbursement rows (millions ₱) from LandBank tranche amounts. */
export function buildFundDisbursementChartData(
  applicants: Applicant[],
  now = new Date(),
): FundDisbursementRow[] {
  if (applicants.length === 0) return [];
  const buckets = rollingMonthBuckets(7, now);
  const amounts = buckets.map(() => 0);
  let any = false;
  for (const a of applicants) {
    for (const ev of releaseEvents(a)) {
      buckets.forEach((b, i) => {
        if (inBucket(ev.date, b.year, b.month)) {
          amounts[i] += ev.amount;
          any = true;
        }
      });
    }
  }
  if (!any) return [];
  return buckets.map((b, i) => ({
    month: b.label,
    amount: Math.round((amounts[i] / 1_000_000) * 100) / 100,
  }));
}

// ── Gender / GAD sex-disaggregated metrics ────────────────────────────────────

export type GenderBreakdownRow = {
  name: string;
  count: number;
  fill: string;
};

export type WorkforceGenderTotals = {
  male: number;
  female: number;
  total: number;
};

const REGISTRANT_GENDER_COLORS: Record<string, string> = {
  Male: "#0C2461",
  Female: "#00AEEF",
  "Prefer not to say": "#94a3b8",
  Unknown: "#cbd5e1",
};

const OWNER_SEX_COLORS: Record<string, string> = {
  Male: "#0C2461",
  Female: "#10b981",
  Unspecified: "#94a3b8",
};

export function normalizeRegistrantGender(raw: unknown): string {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "Unknown";
  if (s.includes("prefer") || s === "pnts" || s.includes("not to say")) {
    return "Prefer not to say";
  }
  if (s === "m" || s === "male" || s.startsWith("male")) return "Male";
  if (s === "f" || s === "female" || s.startsWith("female")) return "Female";
  return "Unknown";
}

export function normalizeOwnerSex(raw: unknown): string {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "Unspecified";
  if (s === "m" || s === "male" || s.startsWith("male")) return "Male";
  if (s === "f" || s === "female" || s.startsWith("female")) return "Female";
  return "Unspecified";
}

function parseHeadcount(raw: unknown): number {
  const n = parseInt(String(raw ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function addSexCounts(
  acc: { male: number; female: number },
  counts: PisSexCounts | undefined | null,
): void {
  if (!counts) return;
  acc.male += parseHeadcount(counts.male);
  acc.female += parseHeadcount(counts.female);
}

function sumPisEmploymentMatrix(
  employment: PisEmploymentMatrix | undefined | null,
): { male: number; female: number } {
  const acc = { male: 0, female: 0 };
  if (!employment) return acc;
  for (const block of [employment.companyHire, employment.subcontractorHire]) {
    if (!block) continue;
    addSexCounts(acc, block.regular);
    addSexCounts(acc, block.partTime);
    addSexCounts(acc, block.pwd);
    addSexCounts(acc, block.seniorCitizen);
  }
  addSexCounts(acc, employment.indirectBackward);
  addSexCounts(acc, employment.indirectForward);
  addSexCounts(acc, employment.indirectPwd);
  addSexCounts(acc, employment.indirectSeniorCitizen);
  return acc;
}

function tna1EmployeeCounts(applicant: Applicant): { male: number; female: number } {
  const tna1 = applicant.moduleData?.tna1 as
    | { form?: Record<string, unknown> }
    | undefined;
  const form = tna1?.form ?? {};
  return {
    male: parseHeadcount(form.employeesMale),
    female: parseHeadcount(form.employeesFemale),
  };
}

function proposalEmployeeCounts(applicant: Applicant): {
  male: number;
  female: number;
} {
  const form = getProjectProposalForm(applicant);
  return {
    male: parseHeadcount(form.employeesMale),
    female: parseHeadcount(form.employeesFemale),
  };
}

function applicantWorkforceCounts(applicant: Applicant): {
  male: number;
  female: number;
} {
  const pis = getProjectInformationSheetStored(applicant);
  const latestFiling = pis?.ongoingFilings?.length
    ? pis.ongoingFilings[pis.ongoingFilings.length - 1]
    : null;
  const employment =
    latestFiling?.employment ?? pis?.prePisDraft?.employment ?? null;
  const fromPis = sumPisEmploymentMatrix(employment);
  if (fromPis.male + fromPis.female > 0) return fromPis;

  const fromProposal = proposalEmployeeCounts(applicant);
  if (fromProposal.male + fromProposal.female > 0) return fromProposal;

  return tna1EmployeeCounts(applicant);
}

function ownerSexFromApplicant(applicant: Applicant): string {
  const pis = getProjectInformationSheetStored(applicant);
  const latestFiling = pis?.ongoingFilings?.length
    ? pis.ongoingFilings[pis.ongoingFilings.length - 1]
    : null;
  const raw =
    latestFiling?.ownerSex ??
    pis?.prePisDraft?.ownerSex ??
    "";
  return normalizeOwnerSex(raw);
}

function bucketToRows(
  counts: Record<string, number>,
  colors: Record<string, string>,
  order: string[],
): GenderBreakdownRow[] {
  return order
    .filter((name) => (counts[name] ?? 0) > 0)
    .map((name) => ({
      name,
      count: counts[name] ?? 0,
      fill: colors[name] ?? "#94a3b8",
    }));
}

export function getRegistrantGenderBreakdown(
  applicants: Applicant[],
): GenderBreakdownRow[] {
  if (applicants.length === 0) return [];
  const counts: Record<string, number> = {
    Male: 0,
    Female: 0,
    "Prefer not to say": 0,
    Unknown: 0,
  };
  for (const a of applicants) {
    const key = normalizeRegistrantGender(a.moduleData?.gender);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return bucketToRows(counts, REGISTRANT_GENDER_COLORS, [
    "Male",
    "Female",
    "Prefer not to say",
    "Unknown",
  ]);
}

export function getOwnerSexBreakdown(
  applicants: Applicant[],
): GenderBreakdownRow[] {
  if (applicants.length === 0) return [];
  const counts: Record<string, number> = {
    Male: 0,
    Female: 0,
    Unspecified: 0,
  };
  let anyOwner = false;
  for (const a of applicants) {
    const pis = getProjectInformationSheetStored(a);
    const hasOwner =
      Boolean(pis?.prePisDraft?.ownerSex?.trim()) ||
      Boolean(
        pis?.ongoingFilings?.some((f) => String(f.ownerSex ?? "").trim()),
      );
    if (!hasOwner) {
      counts.Unspecified += 1;
      continue;
    }
    anyOwner = true;
    const key = ownerSexFromApplicant(a);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  if (!anyOwner && counts.Unspecified === applicants.length) {
    // No PIS owner sex captured yet — treat as empty so fallback demo can show.
    return [];
  }
  return bucketToRows(counts, OWNER_SEX_COLORS, [
    "Male",
    "Female",
    "Unspecified",
  ]);
}

export function getWorkforceGenderTotals(
  applicants: Applicant[],
): WorkforceGenderTotals {
  let male = 0;
  let female = 0;
  for (const a of applicants) {
    const w = applicantWorkforceCounts(a);
    male += w.male;
    female += w.female;
  }
  return { male, female, total: male + female };
}

export function getWorkforceGenderBreakdown(
  applicants: Applicant[],
): GenderBreakdownRow[] {
  const totals = getWorkforceGenderTotals(applicants);
  if (totals.total <= 0) return [];
  return [
    { name: "Male", count: totals.male, fill: "#0C2461" },
    { name: "Female", count: totals.female, fill: "#00AEEF" },
  ].filter((r) => r.count > 0);
}

