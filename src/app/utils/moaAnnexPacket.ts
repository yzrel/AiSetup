/**
 * Author: Yzrel Jade B. Eborde
 *
 * Annex B/C/D data for the bound Proforma MOA packet.
 * Sources: Form 001 budget + schedule, MOA form refund terms.
 */

import type { Applicant } from "../store/applicantStore";
import type { MoaAnnexCForm, ProjectProposalBudgetRow } from "../api/types";
import { getProjectProposalForm } from "./projectProposal";
import { computeRefundSchedule, parseTermYears } from "./refundSchedule";

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_NAMES_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function parseMoney(value: string): number {
  const n = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatLibAmount(raw: string): string {
  const n = parseMoney(raw);
  if (!n) return "";
  return n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatProjectCost(raw: string): string {
  const n = parseMoney(raw);
  if (!n) return "";
  return `PhP ${n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function budgetCounterpart(row: ProjectProposalBudgetRow): string {
  const totalNum = parseMoney(row.total);
  const setupNum = parseMoney(row.setupShare);
  const lgiaNum = parseMoney(row.lgiaShare ?? "");
  if (totalNum > setupNum + lgiaNum) {
    return String(totalNum - setupNum - lgiaNum);
  }
  return "";
}

export interface MoaAnnexBLibRow {
  item: string;
  qty: string;
  unitCost: string;
  setup: string;
  cooperator: string;
  lgia: string;
}

export interface MoaAnnexBData {
  rows: MoaAnnexBLibRow[];
  setupTotal: string;
  cooperatorTotal: string;
  lgiaTotal: string;
  projectTotal: string;
  showLgia: boolean;
}

export interface MoaAnnexDGrid {
  monthNames: readonly string[];
  years: number[];
  /** key `${monthName}-${year}` */
  cells: Record<string, string>;
  yearTotals: Record<number, string>;
  grandTotal: string;
  projectCost: string;
  refundScheduleLabel: string;
  manner: string;
}

export interface MoaAnnexPacketContext {
  annexB: MoaAnnexBData | null;
  scheduleTable: string[][] | null;
  annexD: MoaAnnexDGrid | null;
}

function resolveSigningIso(form: MoaAnnexCForm): string {
  const day = String(form.signingDay ?? "").trim();
  const month = String(form.signingMonth ?? "").trim();
  const year2 = String(form.signingYear ?? "").trim();
  if (day && month && year2) {
    const d = new Date(`${month} ${day}, 20${year2}`);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  }
  return new Date().toISOString().split("T")[0];
}

export function buildMoaAnnexBData(
  applicant: Applicant | null,
  form: MoaAnnexCForm,
): MoaAnnexBData | null {
  if (!applicant) return null;
  const pp = getProjectProposalForm(applicant);
  const items = (pp.budgetItems ?? []).filter(
    (b) =>
      b.item.trim() ||
      b.total.trim() ||
      b.setupShare.trim() ||
      b.unitCost.trim(),
  );
  if (!items.length) return null;

  const showLgia = items.some((b) => parseMoney(b.lgiaShare ?? "") > 0);
  const rows: MoaAnnexBLibRow[] = items.map((b) => ({
    item: b.item.trim(),
    qty: b.qty.trim() || "1",
    unitCost: formatLibAmount(b.unitCost || b.total),
    setup: formatLibAmount(b.setupShare),
    cooperator: formatLibAmount(budgetCounterpart(b)),
    lgia: formatLibAmount(b.lgiaShare ?? ""),
  }));

  let setupSum = 0;
  let coopSum = 0;
  let lgiaSum = 0;
  let totalSum = 0;
  for (const b of items) {
    setupSum += parseMoney(b.setupShare);
    lgiaSum += parseMoney(b.lgiaShare ?? "");
    totalSum += parseMoney(b.total);
    coopSum += parseMoney(budgetCounterpart(b));
  }

  const approvedSetup = parseMoney(form.approvedAmount);
  const setupTotal =
    approvedSetup > 0 ? approvedSetup : setupSum > 0 ? setupSum : 0;
  const projectTotal =
    parseMoney(pp.projectCost) || totalSum || setupTotal + coopSum + lgiaSum;

  return {
    rows,
    setupTotal: formatLibAmount(String(setupTotal)),
    cooperatorTotal: formatLibAmount(String(coopSum)),
    lgiaTotal: formatLibAmount(String(lgiaSum)),
    projectTotal: formatLibAmount(String(projectTotal)),
    showLgia,
  };
}

export function buildMoaAnnexDCalendarGrid(
  form: MoaAnnexCForm,
): MoaAnnexDGrid | null {
  const amount = parseMoney(form.approvedAmount);
  if (!amount) return null;

  const termYears = parseTermYears(
    form.refundTermYearsDigit || form.refundTermYears,
  );
  const projectStart = resolveSigningIso(form);
  const result = computeRefundSchedule({
    approvedAmount: amount,
    termYears,
    projectStartDate: projectStart,
  });

  if (!result.refundSchedule.length) return null;

  const years = new Set<number>();
  const cells: Record<string, string> = {};

  for (const row of result.refundSchedule) {
    const match = String(row.date).match(/^(\w+)\s+(\d{4})$/);
    if (!match) continue;
    const abbr = match[1];
    const year = parseInt(match[2], 10);
    const mi = MONTH_ABBR.indexOf(abbr as (typeof MONTH_ABBR)[number]);
    if (mi < 0) continue;
    years.add(year);
    const monthName = MONTH_NAMES_FULL[mi];
    cells[`${monthName}-${year}`] = row.amount;
  }

  const sortedYears = [...years].sort((a, b) => a - b);
  if (!sortedYears.length) return null;

  const yearTotals: Record<number, string> = {};
  let grand = 0;
  for (const year of sortedYears) {
    let sum = 0;
    for (const monthName of MONTH_NAMES_FULL) {
      const cell = cells[`${monthName}-${year}`];
      if (cell) sum += parseMoney(cell);
    }
    yearTotals[year] =
      sum > 0
        ? sum.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "";
    grand += sum;
  }

  const firstYear = sortedYears[0];
  const lastYear = sortedYears[sortedYears.length - 1];
  const refundScheduleLabel =
    firstYear === lastYear ? String(firstYear) : `${firstYear}-${lastYear}`;

  return {
    monthNames: MONTH_NAMES_FULL,
    years: sortedYears,
    cells,
    yearTotals,
    grandTotal: grand.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    projectCost: formatProjectCost(form.approvedAmount),
    refundScheduleLabel,
    manner: "Monthly",
  };
}

export function buildMoaAnnexPacketContext(
  applicant: Applicant | null,
  form: MoaAnnexCForm,
): MoaAnnexPacketContext {
  const pp = applicant ? getProjectProposalForm(applicant) : null;
  const schedule =
    pp?.scheduleTable?.length && pp.scheduleTable.some((r) => r.some((c) => c.trim()))
      ? pp.scheduleTable
      : null;

  return {
    annexB: buildMoaAnnexBData(applicant, form),
    scheduleTable: schedule,
    annexD: buildMoaAnnexDCalendarGrid(form),
  };
}
