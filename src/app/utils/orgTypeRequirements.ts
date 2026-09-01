/**
 * Author: Yzrel Jade B. Eborde
 *
 * Org-type rules for Step 4 governance documents (articles, board resolution).
 * SETUP Guidelines 3.0 — corps, cooperatives, SUCs, LGUs, and non–sole proprietors.
 */

import type { Applicant } from "../store/applicantStore";
import {
  getApplicantRegistrationType,
  isNonSingleProprietor,
} from "./proprietorTrack";
import { getProjectProposalForm } from "./projectProposal";

export function getApplicantOrganizationType(applicant: Applicant | null): string {
  if (!applicant) return "";
  const md = applicant.moduleData ?? {};
  const tna1Form = (md.tna1 as { form?: Record<string, unknown> } | undefined)?.form;
  const fromTna = String(tna1Form?.organizationType ?? "").trim();
  if (fromTna) return fromTna;
  return String(getProjectProposalForm(applicant)?.organizationType ?? "").trim();
}

function normalizedOrg(applicant: Applicant | null): string {
  return getApplicantOrganizationType(applicant).toLowerCase();
}

export function isSoleProprietorshipOrg(applicant: Applicant | null): boolean {
  const org = normalizedOrg(applicant);
  if (!org) return getApplicantRegistrationType(applicant) === "DTI";
  return (
    org.includes("sole propriet") ||
    (org.includes("proprietor") && org.includes("dti")) ||
    org === "dti"
  );
}

/** Board / legislative resolution — corps, coops, SUCs, LGUs, and other non–sole props. */
export function needsBoardResolution(applicant: Applicant | null): boolean {
  if (isNonSingleProprietor(applicant)) return true;
  if (isSoleProprietorshipOrg(applicant)) return false;
  const org = normalizedOrg(applicant);
  if (!org) return false;
  const triggers = [
    "lgu",
    "suc",
    "state university",
    "corporation",
    "corp",
    "cooperative",
    "coop",
    "association",
    "partnership",
    "organization",
  ];
  return triggers.some((t) => org.includes(t));
}

/** Articles of incorporation — cooperatives, associations, and SEC/CDA registrants. */
export function needsArticlesOfIncorporation(applicant: Applicant | null): boolean {
  const reg = getApplicantRegistrationType(applicant);
  if (reg === "SEC" || reg === "CDA") return true;
  const org = normalizedOrg(applicant);
  return org.includes("coop") || org.includes("association");
}

/** @deprecated Use needsBoardResolution or needsArticlesOfIncorporation */
export function needsOrgGovernanceDocs(applicant: Applicant | null): boolean {
  return needsBoardResolution(applicant) || needsArticlesOfIncorporation(applicant);
}
