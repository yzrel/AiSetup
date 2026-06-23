/**
 * Author: Yzrel Jade B. Eborde
 *
 * Single vs Non-Single proprietor classification derived from registrationType.
 * DTI → Single Proprietor (30 official checklist steps)
 * SEC / CDA → Non-Single Proprietor (32 official checklist steps)
 */

import type { Applicant } from "../store/applicantStore";

export type RegistrationAgency = "DTI" | "SEC" | "CDA";

export function normalizeRegistrationType(value: string): RegistrationAgency | string {
  const t = value.toUpperCase();
  if (t === "DTI" || t.includes("SOLE") || t.includes("PROPRIETOR")) return "DTI";
  if (t === "CDA" || t.includes("COOP")) return "CDA";
  if (t === "SEC" || t.includes("CORP") || t.includes("PARTNER")) return "SEC";
  return value;
}

export function getApplicantRegistrationType(
  applicant: Applicant | null,
): RegistrationAgency | string {
  if (!applicant) return "DTI";
  const md = applicant.moduleData ?? {};
  const raw = String(md.registrationType ?? applicant.businessType ?? "DTI");
  return normalizeRegistrationType(raw);
}

export function isSingleProprietor(applicant: Applicant | null): boolean {
  return getApplicantRegistrationType(applicant) === "DTI";
}

export function isNonSingleProprietor(applicant: Applicant | null): boolean {
  const reg = getApplicantRegistrationType(applicant);
  return reg === "SEC" || reg === "CDA";
}

/** @deprecated Use isNonSingleProprietor — kept for existing imports */
export function isNonSoleProprietorship(applicant: Applicant | null): boolean {
  return isNonSingleProprietor(applicant);
}

export function getOfficialChecklistStepCount(applicant: Applicant | null): 30 | 32 {
  return isNonSingleProprietor(applicant) ? 32 : 30;
}

export function getProprietorTrackLabel(applicant: Applicant | null): string {
  return isNonSingleProprietor(applicant)
    ? "Non-Single Proprietor"
    : "Single Proprietor";
}

/** Default registration type when landing-page CTA pre-fills registration */
export type RegistrationPrefill = RegistrationAgency;

export function registrationPrefillFromLanding(
  track: "single-proprietor" | "non-single-proprietor",
): RegistrationAgency {
  return track === "non-single-proprietor" ? "SEC" : "DTI";
}
