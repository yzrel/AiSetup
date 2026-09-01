/**
 * Author: Yzrel Jade B. Eborde
 *
 * Projected FS horizon — SETUP Guidelines tie year count to proposed project duration.
 */

import type { Applicant } from "../store/applicantStore";

const DEFAULT_PROJECTED_YEARS = 5;
const MIN_PROJECTED_YEARS = 1;
const MAX_PROJECTED_YEARS = 5;

function parseMonthsFromText(value: string): number {
  const text = value.trim().toLowerCase();
  if (!text) return 0;
  const monthMatch = text.match(/(\d+)\s*month/);
  if (monthMatch) return parseInt(monthMatch[1], 10);
  const yearMatch = text.match(/(\d+)\s*year/);
  if (yearMatch) return parseInt(yearMatch[1], 10) * 12;
  const bare = text.match(/^(\d+)$/);
  if (bare) {
    const n = parseInt(bare[1], 10);
    return n <= 10 ? n * 12 : n;
  }
  return 0;
}

/** Resolve projected FS year count from LOI timeline / Form 001 / MOA duration. */
export function resolveProjectedFsYears(applicant: Applicant | null): number {
  if (!applicant) return DEFAULT_PROJECTED_YEARS;
  const md = applicant.moduleData ?? {};

  const candidates = [
    String(md.timeline ?? ""),
    String(
      (md.approvalLetter as { moaForm?: { projectDurationMonths?: string } } | undefined)
        ?.moaForm?.projectDurationMonths ?? "",
    ),
    String(
      (md.moaAnnexD as { form?: { projectDurationMonths?: string } } | undefined)?.form
        ?.projectDurationMonths ?? "",
    ),
    String(md.repaymentTerm ?? ""),
  ];

  for (const raw of candidates) {
    const months = parseMonthsFromText(raw);
    if (months > 0) {
      const years = Math.ceil(months / 12);
      return Math.min(Math.max(years, MIN_PROJECTED_YEARS), MAX_PROJECTED_YEARS);
    }
    const yearOnly = raw.match(/(\d+)\s*year/i);
    if (yearOnly) {
      const years = parseInt(yearOnly[1], 10);
      if (years >= MIN_PROJECTED_YEARS) {
        return Math.min(years, MAX_PROJECTED_YEARS);
      }
    }
  }

  return DEFAULT_PROJECTED_YEARS;
}

export function projectedFinancialStatementLabel(applicant: Applicant | null): string {
  const years = resolveProjectedFsYears(applicant);
  const suffix = years === 1 ? "year" : "years";
  return `Projected financial statements (next ${years} ${suffix}, per project duration)`;
}
