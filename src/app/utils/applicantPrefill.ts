/**
 * Author: Yzrel Jade B. Eborde
 */

import { Applicant } from "../store/applicantStore";
import { normalizeRegistrationType } from "./proprietorTrack";

export { normalizeRegistrationType };

export function yearFromDateEstablished(dateEstablished: string): string {
  if (!dateEstablished) return "";
  if (dateEstablished.includes("-")) return dateEstablished.split("-")[0];
  return dateEstablished;
}

export type LoIAdditionalFields = {
  dateEstablished: string;
  tinNumber: string;
  province: string;
  zipCode: string;
  registrationType: string;
  registrationNumber: string;
  productServices: string;
  projectDescription: string;
  expectedOutcome: string;
  budget: string;
  timeline: string;
};

export function buildLoiAdditionalFromApplicant(
  applicant: Applicant | null,
  current: Partial<LoIAdditionalFields> = {},
): LoIAdditionalFields {
  const md = applicant?.moduleData ?? {};
  const regType =
    String(current.registrationType || md.registrationType || "") ||
    normalizeRegistrationType(applicant?.businessType ?? "");

  return {
    dateEstablished: current.dateEstablished || String(md.dateEstablished ?? ""),
    tinNumber: current.tinNumber || String(md.tinNumber ?? ""),
    province:
      current.province ||
      String(md.province ?? "") ||
      (applicant?.region && !applicant.region.includes("SOCCSKSARGEN")
        ? applicant.region
        : ""),
    zipCode:
      current.zipCode || String(md.zipCode ?? md.postalCode ?? ""),
    registrationType: regType,
    registrationNumber:
      current.registrationNumber || String(md.registrationNumber ?? ""),
    productServices:
      current.productServices ||
      String(md.productServices ?? md.coreProducts ?? ""),
    projectDescription:
      current.projectDescription || String(md.projectDescription ?? ""),
    expectedOutcome:
      current.expectedOutcome || String(md.expectedOutcome ?? ""),
    budget: current.budget || String(md.budget ?? ""),
    timeline: current.timeline || String(md.timeline ?? ""),
  };
}
