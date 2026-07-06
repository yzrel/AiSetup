/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 008 / 009 Project Information Sheet layout constants
 * (regional forms pack).
 */

import type {
  PisEmploymentMatrix,
  PisHireBlock,
  PisSexCounts,
} from "../api/types";

export const FORM_008_TITLE =
  "SETUP Form 008 - Pre-Implementation Project Information Sheet";

export const FORM_008_FOOTER =
  "Regional Guidelines on SETUP (Revision 3.0) Annex E: SETUP Form 008 — Pre-Implementation PIS";

export const FORM_009_TITLE =
  "SETUP Form 009 - Project Information Sheet for Ongoing Projects";

export const FORM_009_FOOTER =
  "SETUP Form 009 - Project Information Sheet for Ongoing Projects";

/** Form 008 — Assistance obtained from DOST (Pre-Implementation) */
export const FORM_008_ASSISTANCE_OPTIONS = [
  { id: "conceptualization", label: "1. Conceptualization" },
  { id: "proposal-preparation", label: "2. Proposal preparation" },
  { id: "others-specify", label: "3. Others (please specify)" },
  { id: "prod-process", label: "3.1 Production Technology — a. Process" },
  { id: "prod-equipment", label: "3.1 Production Technology — b. Equipment" },
  {
    id: "prod-qc",
    label: "3.1 Production Technology — c. Quality control / Laboratory testing/analysis",
  },
  { id: "packaging", label: "3.2 Packaging/Labeling" },
  { id: "post-harvest", label: "3.3 Post-harvest" },
  { id: "marketing", label: "3.4 Marketing assistance" },
  { id: "hr-training", label: "3.5 Human Resource Training (please specify)" },
  { id: "consultancy", label: "3.6 Consultancy Services (please specify)" },
  {
    id: "other-services",
    label: "3.7 Other Services (FDA Permit, LGU Registration, Bar Coding)",
  },
] as const;

/** Form 009 — Assistance obtained from DOST (ongoing) */
export const FORM_009_ASSISTANCE_OPTIONS = [
  { id: "prod-process", label: "A.1.1 Production Technology — Process" },
  { id: "prod-equipment", label: "A.1.2 Production Technology — Equipment" },
  {
    id: "prod-qc",
    label: "A.1.3 Production Technology — Quality Control / Laboratory Testing/Analysis",
  },
  { id: "packaging", label: "A.2 Packaging/Labeling" },
  { id: "post-harvest", label: "A.3 Post-harvest" },
  { id: "marketing", label: "A.4 Marketing assistance" },
  { id: "hr-training", label: "A.5 Human Resource Training (please specify)" },
  { id: "consultancy", label: "A.6 Consultancy Services (please specify)" },
  {
    id: "other-services",
    label: "A.7 Other Services (FDA Permit, LGU Registration, Bar Coding)",
  },
] as const;

export type Form008AssistanceId =
  (typeof FORM_008_ASSISTANCE_OPTIONS)[number]["id"];
export type Form009AssistanceId =
  (typeof FORM_009_ASSISTANCE_OPTIONS)[number]["id"];

export function emptySexCounts(): PisSexCounts {
  return { male: "", female: "" };
}

export function emptyHireBlock(): PisHireBlock {
  return {
    regular: emptySexCounts(),
    partTime: emptySexCounts(),
    pwd: emptySexCounts(),
    seniorCitizen: emptySexCounts(),
  };
}

export function emptyEmploymentMatrix(): PisEmploymentMatrix {
  return {
    companyHire: emptyHireBlock(),
    subcontractorHire: emptyHireBlock(),
    indirectBackward: emptySexCounts(),
    indirectForward: emptySexCounts(),
    indirectPwd: emptySexCounts(),
    indirectSeniorCitizen: emptySexCounts(),
  };
}

/** Seed company-hire regular counts from simple male/female totals. */
export function employmentFromSimple(
  directMale: string,
  directFemale: string,
  indirectMale = "",
  indirectFemale = "",
): PisEmploymentMatrix {
  const matrix = emptyEmploymentMatrix();
  matrix.companyHire.regular = { male: directMale, female: directFemale };
  matrix.indirectBackward = { male: indirectMale, female: indirectFemale };
  return matrix;
}

export function ensureEmploymentMatrix(
  employment?: PisEmploymentMatrix | null,
  legacy?: {
    employmentDirectMale?: string;
    employmentDirectFemale?: string;
    employmentIndirectMale?: string;
    employmentIndirectFemale?: string;
  },
): PisEmploymentMatrix {
  if (employment?.companyHire?.regular) return employment;
  return employmentFromSimple(
    legacy?.employmentDirectMale ?? "",
    legacy?.employmentDirectFemale ?? "",
    legacy?.employmentIndirectMale ?? "",
    legacy?.employmentIndirectFemale ?? "",
  );
}
