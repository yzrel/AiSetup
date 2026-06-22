/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import type {
  PisOngoingFiling,
  PisSemester,
  PrePisDraftForm,
  PrePisGadRow,
  ProjectInformationSheetStored,
  SignedPrePisDocument,
} from "../api/types";
import { getApprovalLetterForm, getApprovalLetterStored, getSignedMoa } from "./approvalLetter";
import { resolveProvincialOffice } from "./loiLetter";
import { getProjectProposalForm } from "./projectProposal";
import { getPublishedTna2 } from "./tnaForm02";

const DOST_BLUE = "#0C2461";

function applicantProvince(applicant: Applicant | null): string {
  if (!applicant) return "";
  const md = applicant.moduleData ?? {};
  return String(md.province ?? applicant.address?.split(",").pop()?.trim() ?? "");
}

function resolvePstoContact(applicant: Applicant | null) {
  const psto = resolveProvincialOffice(applicantProvince(applicant));
  return { pstoOfficeName: psto.officeName, pstoDirectorTitle: psto.title };
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyPrePisDraft(): PrePisDraftForm {
  return {
    labName: "",
    projectTitle: "",
    dostPersonnelInCharge: "",
    dostInput: "",
    cooperatorInput: "",
    datePrepared: new Date().toISOString().split("T")[0],
    status: "New",
    organizationName: "",
    organizationAddress: "",
    orgType: "",
    natureOfBusiness: "",
    sectors: "",
    yearEstablished: "",
    classification: "",
    mainProducts: "",
    technologyEmployed: "",
    productionCapacity: "",
    standardsCertifications: "",
    personInCharge: "",
    staffComplement: "",
    contactNumbers: "",
    briefDescription: "",
    implementingAgency: "",
    costLgu: "",
    costDost: "",
    costCooperators: "",
    costTotal: "",
    generalObjective: "",
    specificObjectives: [""],
    methodology: "",
    beneficiaries: "",
    expectedOutputs: {
      finalProduct: "",
      publication: "",
      policy: "",
      peopleServices: "",
      partnership: "",
      economic: "",
      others: "",
    },
    partnerFunding: "",
    partnerGrant: "",
    partnerOthers: "",
    schedulePreImplementation: "",
    scheduleImplementation: "",
    scheduleOperation: "",
    projectLocation: "",
    rdDirective: "",
    rdExpectedOutput: "",
    rdStartDate: "",
    rdCompletionDate: "",
    gadRows: [{ id: uid(), genderIssues: "", gadObjectives: "", gadActivities: "" }],
  };
}

export function hasApprovalLetterAcknowledged(applicant: Applicant | null): boolean {
  if (!applicant) return false;
  return !!getApprovalLetterStored(applicant)?.acknowledged;
}

export function hasSignedMoaPrerequisite(applicant: Applicant | null): boolean {
  return !!getSignedMoa(applicant);
}

export function buildPrePisDraft(applicant: Applicant | null): PrePisDraftForm {
  if (!applicant) return emptyPrePisDraft();

  const pp = getProjectProposalForm(applicant);
  const approval = getApprovalLetterForm(applicant);
  const tna2 = getPublishedTna2(applicant);
  const psto = resolvePstoContact(applicant);
  const staffTotal =
    (parseInt(pp.employeesMale, 10) || 0) + (parseInt(pp.employeesFemale, 10) || 0);

  const setupCost = approval.approvedAmount || pp.amountRequested;
  const totalCost = pp.projectCost || setupCost;
  const setupNum = parseFloat(String(setupCost).replace(/[^\d.]/g, "")) || 0;
  const totalNum = parseFloat(String(totalCost).replace(/[^\d.]/g, "")) || 0;
  const coopNum = totalNum > setupNum ? totalNum - setupNum : 0;

  return {
    labName: `LAB - ${pp.firmName || applicant.enterpriseName}`,
    projectTitle: pp.projectTitle || approval.projectTitle,
    dostPersonnelInCharge: psto.pstoOfficeName,
    dostInput: setupCost,
    cooperatorInput: coopNum > 0 ? `Php ${coopNum.toLocaleString("en-PH")}` : "",
    datePrepared: new Date().toISOString().split("T")[0],
    status: "New",
    organizationName: pp.firmName || applicant.enterpriseName,
    organizationAddress: pp.firmAddress || applicant.address,
    orgType: pp.organizationType,
    natureOfBusiness: pp.businessActivity || pp.profitType,
    sectors: pp.businessActivity || applicant.businessSector || "",
    yearEstablished: pp.yearEstablished,
    classification: pp.msmeSize,
    mainProducts: pp.productsServices,
    technologyEmployed: pp.productionProcess || tna2?.productionProcessAnalysis?.summary || "",
    productionCapacity: pp.capacityVolumeNarrative,
    standardsCertifications: "",
    personInCharge: pp.contactPerson || applicant.applicantName,
    staffComplement: String(staffTotal || pp.employeesIndirect || ""),
    contactNumbers: [pp.contactNumber, pp.email].filter(Boolean).join(" / "),
    briefDescription: pp.enterpriseBackground || pp.generalObjective,
    implementingAgency: pp.firmName || applicant.enterpriseName,
    costLgu: "",
    costDost: setupCost,
    costCooperators: coopNum > 0 ? `Php ${coopNum.toLocaleString("en-PH")}` : "",
    costTotal: totalCost,
    generalObjective: pp.generalObjective,
    specificObjectives: pp.specificObjectives.filter((s) => s.trim()).length
      ? pp.specificObjectives.filter((s) => s.trim())
      : [""],
    methodology: pp.productionProcess || tna2?.proposedInterventions?.join("; ") || "",
    beneficiaries: pp.productsServices || "Enterprise workers and local community",
    expectedOutputs: {
      finalProduct: pp.expectedOutputBullets[0] || "",
      publication: "",
      policy: "",
      peopleServices: pp.expectedOutputBullets[1] || "",
      partnership: "",
      economic: pp.expectedOutputBullets[2] || "",
      others: "",
    },
    partnerFunding: "",
    partnerGrant: "",
    partnerOthers: "",
    schedulePreImplementation: "",
    scheduleImplementation: "",
    scheduleOperation: "",
    projectLocation: pp.firmAddress || applicant.address,
    rdDirective: "",
    rdExpectedOutput: "",
    rdStartDate: "",
    rdCompletionDate: "",
    gadRows: [{ id: uid(), genderIssues: "", gadObjectives: "", gadActivities: "" }],
  };
}

export function getProjectInformationSheetStored(
  applicant: Applicant | null,
): ProjectInformationSheetStored | null {
  if (!applicant?.moduleData?.projectInformationSheet) return null;
  return applicant.moduleData.projectInformationSheet as ProjectInformationSheetStored;
}

export function getPrePisDraft(applicant: Applicant | null): PrePisDraftForm {
  const stored = getProjectInformationSheetStored(applicant);
  if (stored?.prePisDraft?.projectTitle?.trim()) return stored.prePisDraft;
  return buildPrePisDraft(applicant);
}

export function getPisStoredOrEmpty(applicant: Applicant | null): ProjectInformationSheetStored {
  const stored = getProjectInformationSheetStored(applicant);
  if (stored) return stored;
  return {
    prePisDraft: buildPrePisDraft(applicant),
    signingDayComplete: false,
    ongoingFilings: [],
  };
}

export function savePrePisDraft(applicantId: string, draft: PrePisDraftForm): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getPisStoredOrEmpty(applicant);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      projectInformationSheet: {
        ...existing,
        prePisDraft: draft,
        updatedAt: new Date().toISOString(),
      } satisfies ProjectInformationSheetStored,
    },
  });
}

export function syncPrePisDraft(
  existing: PrePisDraftForm,
  applicant: Applicant,
): PrePisDraftForm {
  const draft = buildPrePisDraft(applicant);
  return {
    ...draft,
    datePrepared: existing.datePrepared || draft.datePrepared,
    status: existing.status || draft.status,
    gadRows: existing.gadRows.some((r) =>
      [r.genderIssues, r.gadObjectives, r.gadActivities].some((v) => v.trim()),
    )
      ? existing.gadRows
      : draft.gadRows,
  };
}

export function saveSignedPrePis(
  applicantId: string,
  document: SignedPrePisDocument,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getPisStoredOrEmpty(applicant);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      projectInformationSheet: {
        ...existing,
        signedPrePis: document,
        updatedAt: new Date().toISOString(),
      } satisfies ProjectInformationSheetStored,
    },
  });
}

export function removeSignedPrePis(applicantId: string): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getPisStoredOrEmpty(applicant);
  const { signedPrePis: _removed, ...rest } = existing;
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      projectInformationSheet: {
        ...rest,
        updatedAt: new Date().toISOString(),
      } satisfies ProjectInformationSheetStored,
    },
  });
}

export function validateSignedPrePisUpload(
  prePisSignedDate: string,
  fileName: string,
  moaSignedDate?: string,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!prePisSignedDate?.trim()) errors.push("Pre-PIS signed date is required.");
  if (!fileName?.trim()) errors.push("Signed Pre-PIS file is required.");
  if (moaSignedDate && prePisSignedDate && prePisSignedDate !== moaSignedDate) {
    warnings.push("Pre-PIS signed date differs from MOA signed date.");
  }
  return { errors, warnings };
}

export function completeSigningDay(applicantId: string, completedBy: string): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getPisStoredOrEmpty(applicant);
  const now = new Date().toISOString();
  applicantStore.update(applicantId, {
    currentModule: "landbank-withdrawal",
    moduleData: {
      ...applicant.moduleData,
      projectInformationSheet: {
        ...existing,
        signingDayComplete: true,
        completedAt: now,
        completedBy,
        updatedAt: now,
      } satisfies ProjectInformationSheetStored,
    },
  });
}

export function isSigningDayComplete(applicant: Applicant | null): boolean {
  if (!applicant) return false;
  const stored = getProjectInformationSheetStored(applicant);
  return !!stored?.signingDayComplete && !!getSignedMoa(applicant);
}

export function canCompleteSigningDay(applicant: Applicant | null): boolean {
  if (!applicant) return false;
  const stored = getProjectInformationSheetStored(applicant);
  return !!getSignedMoa(applicant) && !stored?.signingDayComplete;
}

export function getCurrentReportingSemester(date = new Date()): {
  reportingYear: string;
  semester: PisSemester;
} {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month <= 6) {
    return { reportingYear: String(year), semester: "1" };
  }
  return { reportingYear: String(year), semester: "2" };
}

export function formatSemesterLabel(
  reportingYear: string,
  semester: PisSemester,
): string {
  const ordinal = semester === "1" ? "1st" : "2nd";
  return `${ordinal} Semester ${reportingYear}`;
}

export function normalizePisOngoingFiling(filing: PisOngoingFiling): PisOngoingFiling {
  const filed = filing.filedAt ? new Date(filing.filedAt) : new Date();
  const inferred = getCurrentReportingSemester(filed);
  const reportingYear = filing.reportingYear?.trim() || inferred.reportingYear;
  const semester = filing.semester ?? inferred.semester;
  return {
    ...filing,
    reportingYear,
    semester,
    periodLabel: formatSemesterLabel(reportingYear, semester),
  };
}

export function validatePisOngoingFiling(
  filing: PisOngoingFiling,
  existingFilings: PisOngoingFiling[],
): string[] {
  const errors: string[] = [];
  const normalized = normalizePisOngoingFiling(filing);
  if (!normalized.reportingYear?.trim()) {
    errors.push("Reporting year is required.");
  }
  const duplicate = existingFilings
    .filter((f) => f.id !== filing.id)
    .map(normalizePisOngoingFiling)
    .some(
      (f) =>
        f.reportingYear === normalized.reportingYear &&
        f.semester === normalized.semester,
    );
  if (duplicate) {
    errors.push(`A PIS filing for ${normalized.periodLabel} already exists.`);
  }
  return errors;
}

export function sortPisOngoingFilings(filings: PisOngoingFiling[]): PisOngoingFiling[] {
  return [...filings]
    .map(normalizePisOngoingFiling)
    .sort((a, b) => {
      const yearDiff = Number(b.reportingYear) - Number(a.reportingYear);
      if (yearDiff !== 0) return yearDiff;
      return Number(b.semester) - Number(a.semester);
    });
}

export function buildPisOngoingDraft(applicant: Applicant | null): PisOngoingFiling {
  const pp = getProjectProposalForm(applicant);
  const approval = getApprovalLetterForm(applicant);
  const { reportingYear, semester } = getCurrentReportingSemester();
  return {
    id: uid(),
    reportingYear,
    semester,
    periodLabel: formatSemesterLabel(reportingYear, semester),
    projectCode: approval.referenceNumber,
    projectTitle: pp.projectTitle,
    firmName: pp.firmName,
    ownerName: pp.contactPerson,
    assetsLand: "",
    assetsBuilding: "",
    assetsEquipment: "",
    assetsWorkingCapital: "",
    employmentDirectMale: pp.employeesMale,
    employmentDirectFemale: pp.employeesFemale,
    employmentIndirectMale: "",
    employmentIndirectFemale: pp.employeesIndirect,
    productionVolumeLocal: "",
    productionVolumeExport: "",
    productionDetails: pp.productsServices,
    grossSalesLocal: "",
    grossSalesExport: "",
    exportDestinations: "",
    dostAssistance: [],
    preparedBy: "",
    filedAt: new Date().toISOString(),
  };
}

export function savePisOngoingFiling(applicantId: string, filing: PisOngoingFiling): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getPisStoredOrEmpty(applicant);
  const normalized = normalizePisOngoingFiling(filing);
  const filings = existing.ongoingFilings.filter((f) => f.id !== normalized.id);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      projectInformationSheet: {
        ...existing,
        ongoingFilings: [...filings, normalized],
        updatedAt: new Date().toISOString(),
      } satisfies ProjectInformationSheetStored,
    },
  });
}

export function getPrePisPrintStyles(): string {
  return `
    @page { size: A4 portrait; margin: 12mm 12mm 18mm 12mm; }
    body { font-family: Georgia, 'Segoe UI', serif; font-size: 10px; line-height: 1.35; color: #1f2937; }
    h1 { font-size: 11px; font-weight: 800; text-align: center; margin: 0 0 8px; }
    h2 { font-size: 10px; font-weight: 700; color: ${DOST_BLUE}; margin: 12px 0 6px; }
    h3 { font-size: 9px; font-weight: 700; margin: 8px 0 4px; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 9px; }
    th, td { border: 1px solid #9ca3af; padding: 3px 5px; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 600; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin-bottom: 10px; font-size: 9px; }
    .meta-label { font-weight: 600; }
    p { margin: 4px 0; }
    .pis-page-break { page-break-before: always; break-before: page; }
    .pis-footer { margin-top: 16px; font-size: 8px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 6px; }
    ul { margin: 4px 0 4px 16px; padding: 0; }
  `;
}

export function printPrePisPdf(applicationId?: string) {
  const el = document.getElementById("pre-pis-preview");
  const title = applicationId
    ? `SETUP-Pre-PIS-${applicationId}`
    : "SETUP-Pre-PIS";
  if (!el) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>${title}</title>
    <style>${getPrePisPrintStyles()}</style></head>
    <body>${el.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export function downloadPrePisPdf(applicationId?: string) {
  printPrePisPdf(applicationId);
}

export function getPisOngoingPrintStyles(): string {
  return `
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: Georgia, serif; font-size: 10px; line-height: 1.4; }
    h1 { font-size: 12px; font-weight: 800; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9px; }
    th, td { border: 1px solid #9ca3af; padding: 4px; }
    th { background: ${DOST_BLUE}; color: white; }
  `;
}

export function printPisOngoingPdf(filingId: string, applicationId?: string) {
  const el = document.getElementById(`pis-ongoing-preview-${filingId}`);
  const title = applicationId
    ? `SETUP-Form-009-PIS-${applicationId}`
    : "SETUP-Form-009-PIS";
  if (!el) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>${title}</title>
    <style>${getPisOngoingPrintStyles()}</style></head>
    <body>${el.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export { DOST_BLUE as PIS_DOST_BLUE };
export type { PisSemester };
