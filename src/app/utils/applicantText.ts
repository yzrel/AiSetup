/**
 * Author: Yzrel Jade B. Eborde
 *
 * Safe string coercion for applicant profile fields (JSON null/undefined tolerant).
 */

import type { Applicant } from "../store/applicantStore";

export function asApplicantString(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

const APPLICANT_STRING_KEYS = [
  "applicantName",
  "designation",
  "enterpriseName",
  "contactNumber",
  "emailAddress",
  "businessType",
  "businessNature",
  "businessSector",
  "yearsOfOperation",
  "enterpriseType",
  "msmeSize",
  "assetSize",
  "region",
  "address",
  "submittedAt",
  "lastUpdated",
] as const satisfies readonly (keyof Applicant)[];

/** Coerce nullable profile strings so UI filters and province resolution never throw. */
export function coerceApplicantStringFields(applicant: Applicant): Applicant {
  const next = { ...applicant };
  for (const key of APPLICANT_STRING_KEYS) {
    next[key] = asApplicantString(next[key]);
  }
  next.enterpriseName = asApplicantString(
    next.enterpriseName,
    asApplicantString(applicant.enterpriseName),
  );
  return next;
}

/** Case-insensitive haystack for staff client search boxes. */
export function applicantMatchesSearch(applicant: Applicant, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    applicant.enterpriseName,
    applicant.applicantName,
    applicant.applicationId,
    applicant.emailAddress,
    applicant.region,
  ]
    .map((v) => asApplicantString(v))
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
