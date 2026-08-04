/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import type {
  PisOngoingFiling,
  PisSemester,
  PrePisDraftForm,
  ProjectInformationSheetStored,
  SignedPrePisDocument,
} from "../api/types";
import { getApprovalLetterForm, getApprovalLetterStored, getSignedMoa } from "./approvalLetter";
import { getProjectProposalForm } from "./projectProposal";
import { isDemoModeActive } from "./demoMode";
import { a4PageRule, A4_MARGIN_DEFAULT, A4_MARGIN_PRE_PIS } from "./printPage";
import { printHtmlDocument } from "./printHtml";
import { formatFormMention } from "../constants/setupForms";
import {
  emptyEmploymentMatrix,
  employmentFromSimple,
  ensureEmploymentMatrix,
  FORM_008_ASSISTANCE_OPTIONS,
  FORM_009_ASSISTANCE_OPTIONS,
} from "../constants/pisFormLayout";
import {
  hasPdcsRecordedForDisbursement,
  initRefundScheduleAtMoa,
  recordPdcs,
  getRefundForm,
} from "./refundDelinquent";

const DOST_BLUE = "#0C2461";

export { FORM_008_ASSISTANCE_OPTIONS, FORM_009_ASSISTANCE_OPTIONS };

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyPrePisDraft(): PrePisDraftForm {
  return {
    periodLabel: "",
    projectTitle: "",
    projectCode: "",
    firmName: "",
    ownerName: "",
    ownerSex: "",
    ownerBirthday: "",
    orgType: "",
    businessAddress: "",
    landline: "",
    fax: "",
    mobilePhone: "",
    email: "",
    yearEstablished: "",
    dateAssistanceApproved: "",
    assetsLand: "",
    assetsBuilding: "",
    assetsEquipment: "",
    assetsWorkingCapital: "",
    employment: emptyEmploymentMatrix(),
    productionVolumeLocal: "",
    productionVolumeExport: "",
    productionDetails: "",
    grossSalesLocal: "",
    grossSalesExport: "",
    exportDestinations: "",
    dostAssistance: [],
    assistanceSpecify: "",
    preparedBy: "",
    datePrepared: new Date().toISOString().split("T")[0],
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
  const contact = pp.contactNumber || applicant.contactNumber || "";
  const isMobile = /^(\+?63|0)?9\d{9}$/.test(contact.replace(/[\s-]/g, ""));

  return {
    periodLabel: "",
    projectTitle: pp.projectTitle || approval.projectTitle,
    projectCode: approval.referenceNumber || "",
    firmName: pp.firmName || applicant.enterpriseName,
    ownerName: pp.contactPerson || applicant.applicantName,
    ownerSex: "",
    ownerBirthday: "",
    orgType: pp.organizationType,
    businessAddress: pp.firmAddress || applicant.address,
    landline: isMobile ? "" : contact,
    fax: "",
    mobilePhone: isMobile ? contact : "",
    email: pp.email || applicant.emailAddress || "",
    yearEstablished: pp.yearEstablished,
    dateAssistanceApproved: approval.approvalDate || "",
    assetsLand: "",
    assetsBuilding: "",
    assetsEquipment: "",
    assetsWorkingCapital: "",
    employment: employmentFromSimple(
      pp.employeesMale,
      pp.employeesFemale,
      "",
      pp.employeesIndirect,
    ),
    productionVolumeLocal: pp.capacityVolumeNarrative || "",
    productionVolumeExport: "",
    productionDetails: pp.productsServices || "",
    grossSalesLocal: "",
    grossSalesExport: "",
    exportDestinations: "",
    dostAssistance: [],
    assistanceSpecify: "",
    preparedBy: pp.contactPerson || applicant.applicantName,
    datePrepared: new Date().toISOString().split("T")[0],
  };
}

export function getProjectInformationSheetStored(
  applicant: Applicant | null,
): ProjectInformationSheetStored | null {
  if (!applicant?.moduleData?.projectInformationSheet) return null;
  return applicant.moduleData.projectInformationSheet as ProjectInformationSheetStored;
}

export function normalizePrePisDraft(draft: PrePisDraftForm): PrePisDraftForm {
  const base = emptyPrePisDraft();
  const legacy = draft as PrePisDraftForm & {
    organizationName?: string;
    organizationAddress?: string;
    personInCharge?: string;
    contactNumbers?: string;
  };
  return {
    ...base,
    ...draft,
    firmName: draft.firmName || legacy.organizationName || "",
    businessAddress: draft.businessAddress || legacy.organizationAddress || "",
    ownerName: draft.ownerName || legacy.personInCharge || "",
    employment: ensureEmploymentMatrix(draft.employment),
    dostAssistance: Array.isArray(draft.dostAssistance) ? draft.dostAssistance : [],
    assistanceSpecify: draft.assistanceSpecify ?? "",
    preparedBy: draft.preparedBy || legacy.personInCharge || "",
  };
}

export function getPrePisDraft(applicant: Applicant | null): PrePisDraftForm {
  const stored = getProjectInformationSheetStored(applicant);
  if (stored?.prePisDraft?.projectTitle?.trim()) {
    return normalizePrePisDraft(stored.prePisDraft);
  }
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
  const prev = normalizePrePisDraft(existing);
  const pick = (local: string, upstream: string) =>
    local.trim() ? local : upstream;
  return {
    ...draft,
    ...prev,
    projectTitle: pick(prev.projectTitle, draft.projectTitle),
    projectCode: pick(prev.projectCode, draft.projectCode),
    firmName: pick(prev.firmName, draft.firmName),
    ownerName: pick(prev.ownerName, draft.ownerName),
    businessAddress: pick(prev.businessAddress, draft.businessAddress),
    orgType: pick(prev.orgType, draft.orgType),
    landline: pick(prev.landline, draft.landline),
    fax: pick(prev.fax, draft.fax),
    mobilePhone: pick(prev.mobilePhone, draft.mobilePhone),
    email: pick(prev.email, draft.email),
    datePrepared: pick(prev.datePrepared, draft.datePrepared),
    ownerSex: pick(prev.ownerSex, draft.ownerSex),
    ownerBirthday: pick(prev.ownerBirthday, draft.ownerBirthday),
    yearEstablished: pick(prev.yearEstablished, draft.yearEstablished),
    dateAssistanceApproved: pick(prev.dateAssistanceApproved, draft.dateAssistanceApproved),
    assetsLand: pick(prev.assetsLand, draft.assetsLand),
    assetsBuilding: pick(prev.assetsBuilding, draft.assetsBuilding),
    assetsEquipment: pick(prev.assetsEquipment, draft.assetsEquipment),
    assetsWorkingCapital: pick(prev.assetsWorkingCapital, draft.assetsWorkingCapital),
    employment: prev.employment?.companyHire ? prev.employment : draft.employment,
    productionVolumeLocal: pick(prev.productionVolumeLocal, draft.productionVolumeLocal),
    productionVolumeExport: pick(prev.productionVolumeExport, draft.productionVolumeExport),
    productionDetails: pick(prev.productionDetails, draft.productionDetails),
    grossSalesLocal: pick(prev.grossSalesLocal, draft.grossSalesLocal),
    grossSalesExport: pick(prev.grossSalesExport, draft.grossSalesExport),
    exportDestinations: pick(prev.exportDestinations, draft.exportDestinations),
    dostAssistance: prev.dostAssistance.length ? prev.dostAssistance : draft.dostAssistance,
    assistanceSpecify: pick(prev.assistanceSpecify, draft.assistanceSpecify),
    preparedBy: pick(prev.preparedBy, draft.preparedBy),
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
  // Demo unlocks blockers only — keep soft warnings visible.
  if (isDemoModeActive()) return { errors: [], warnings };
  return { errors, warnings };
}

export function hasForm008Signed(applicant: Applicant | null): boolean {
  if (!applicant) return false;
  const stored = getProjectInformationSheetStored(applicant);
  return !!stored?.signedPrePis?.fileName?.trim();
}

export function completeSigningDay(applicantId: string, completedBy: string): string[] {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return ["Applicant not found."];
  if (!getSignedMoa(applicant)) {
    return ["Signed MOA must be on file before completing MOA signing day."];
  }
  if (!hasForm008Signed(applicant) && !isDemoModeActive()) {
    return [`Upload signed ${formatFormMention("008", "both")} before fund release.`];
  }
  if (!hasPdcsRecordedForDisbursement(applicant) && !isDemoModeActive()) {
    return ["Record post-dated checks (PDCs) covering the refund schedule before fund release."];
  }

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
  return [];
}

export function preparePdcsForDisbursement(applicantId: string): void {
  initRefundScheduleAtMoa(applicantId);
  recordPdcs(applicantId);
}

export function getDisbursementPdcSummary(applicant: Applicant | null): {
  count: number;
  ttf: string;
  recorded: boolean;
} {
  const form = getRefundForm(applicant);
  return {
    count: form.pdcs.length,
    ttf: form.technologyTransferFee ?? "—",
    recorded: form.pdcsRecorded,
  };
}

export function isSigningDayComplete(applicant: Applicant | null): boolean {
  if (!applicant) return false;
  const stored = getProjectInformationSheetStored(applicant);
  return !!stored?.signingDayComplete && !!getSignedMoa(applicant);
}

export function canCompleteSigningDay(applicant: Applicant | null): boolean {
  if (!applicant) return false;
  const stored = getProjectInformationSheetStored(applicant);
  return (
    !!getSignedMoa(applicant) &&
    !stored?.signingDayComplete &&
    (hasForm008Signed(applicant) || isDemoModeActive()) &&
    (hasPdcsRecordedForDisbursement(applicant) || isDemoModeActive())
  );
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
    ownerSex: filing.ownerSex ?? "",
    ownerBirthday: filing.ownerBirthday ?? "",
    orgType: filing.orgType ?? "",
    businessAddress: filing.businessAddress ?? "",
    landline: filing.landline ?? "",
    fax: filing.fax ?? "",
    mobilePhone: filing.mobilePhone ?? "",
    email: filing.email ?? "",
    employment: ensureEmploymentMatrix(filing.employment, filing),
    assistanceSpecify: filing.assistanceSpecify ?? "",
    dostAssistance: Array.isArray(filing.dostAssistance) ? filing.dostAssistance : [],
  };
}

export function validatePisOngoingFiling(
  filing: PisOngoingFiling,
  existingFilings: PisOngoingFiling[],
): string[] {
  if (isDemoModeActive()) return [];
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
  const prePis = applicant ? getPrePisDraft(applicant) : emptyPrePisDraft();
  const { reportingYear, semester } = getCurrentReportingSemester();
  return {
    id: uid(),
    reportingYear,
    semester,
    periodLabel: formatSemesterLabel(reportingYear, semester),
    projectCode: approval.referenceNumber || prePis.projectCode,
    projectTitle: pp.projectTitle || prePis.projectTitle,
    firmName: "",
    ownerName: "",
    ownerSex: "",
    ownerBirthday: "",
    orgType: "",
    businessAddress: "",
    landline: "",
    fax: "",
    mobilePhone: "",
    email: "",
    assetsLand: prePis.assetsLand,
    assetsBuilding: prePis.assetsBuilding,
    assetsEquipment: prePis.assetsEquipment,
    assetsWorkingCapital: prePis.assetsWorkingCapital,
    employment: employmentFromSimple(
      pp.employeesMale,
      pp.employeesFemale,
      "",
      pp.employeesIndirect,
    ),
    productionVolumeLocal: "",
    productionVolumeExport: "",
    productionDetails: pp.productsServices,
    grossSalesLocal: "",
    grossSalesExport: "",
    exportDestinations: "",
    dostAssistance: [],
    assistanceSpecify: "",
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
    ${a4PageRule(A4_MARGIN_PRE_PIS)}
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
    ? `SETUP-Form-008-PrePIS-${applicationId}`
    : "SETUP-Form-008-PrePIS";
  if (!el) return;
  printHtmlDocument(title, el.innerHTML, getPrePisPrintStyles());
}

export function downloadPrePisPdf(applicationId?: string) {
  printPrePisPdf(applicationId);
}

export function getPisOngoingPrintStyles(): string {
  return `
    ${a4PageRule(A4_MARGIN_DEFAULT)}
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
  printHtmlDocument(title, el.innerHTML, getPisOngoingPrintStyles());
}

export { DOST_BLUE as PIS_DOST_BLUE };
export type { PisSemester };
