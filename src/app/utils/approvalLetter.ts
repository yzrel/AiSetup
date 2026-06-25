/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant, MODULE_ORDER } from "../store/applicantStore";
import type { ApprovalLetterForm, ApprovalLetterStored, SignedMoaDocument } from "../api/types";
import {
  DOST_REGION_12_ADDRESS,
  DOST_REGION_12_DIRECTOR_NAME,
} from "../constants/region12";
import { resolveProvincialOffice } from "./loiLetter";
import { getProjectProposalForm } from "./projectProposal";
import { getRtecReportForm, getRtecReportStored } from "./rtecReport";
import { isDemoModeActive } from "./demoMode";
import { a4PageRule, A4_MARGIN_LETTER } from "./printPage";

const DOST_BLUE = "#0C2461";

export const APPROVAL_LETTER_ADDRESS = DOST_REGION_12_ADDRESS;

export function formatApprovalDisplayDate(isoDate?: string): string {
  if (!isoDate?.trim()) {
    return new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const parsed = new Date(isoDate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return isoDate;
}

export function generateReferenceNumber(applicant: Applicant | null): string {
  const year = new Date().getFullYear();
  const yy = String(year).slice(-2);
  const id = applicant?.applicationId ?? "000";
  const suffix = id.replace(/[^\d]/g, "").slice(-3) || "141";
  return `SETUPiFund/DOSTXII/${yy}/${suffix}`;
}

function applicantProvince(applicant: Applicant | null): string {
  if (!applicant) return "";
  const md = applicant.moduleData ?? {};
  return String(md.province ?? applicant.address?.split(",").pop()?.trim() ?? "");
}

export function resolvePstoContact(applicant: Applicant | null): {
  pstoDirectorTitle: string;
  pstoOfficeName: string;
} {
  const psto = resolveProvincialOffice(applicantProvince(applicant));
  return {
    pstoDirectorTitle: psto.title || "Provincial Director",
    pstoOfficeName: psto.officeName,
  };
}


function inferRefundTermYears(ppRefundSchedule: string[][]): string {
  const dataRows = ppRefundSchedule.slice(1).filter((r) => r.some((c) => c.trim()));
  if (dataRows.length >= 5) return "five (5)";
  if (dataRows.length >= 3) return `${dataRows.length} (${dataRows.length})`;
  return "five (5)";
}

function defaultDesignation(applicant: Applicant | null, ppOrgType: string): string {
  if (ppOrgType?.trim()) return ppOrgType;
  const md = applicant?.moduleData ?? {};
  return String(applicant?.designation ?? md.registrationType ?? "Proprietor");
}

export function buildApprovalLetterBody(form: ApprovalLetterForm): string[] {
  if (form.bodyParagraphs?.length) return form.bodyParagraphs;

  return [
    `This refers to your application for SETUP assistance for the project entitled "${form.projectTitle}" with reference number ${form.referenceNumber}. We are pleased to inform you that the Regional Technical Evaluation Committee (RTEC) has approved your project proposal.`,
    `The approval is subject to the following conditions: (1) refund of the iFund over ${form.refundTermYears} years; (2) insurance cost of the acquired equipment shall not exceed ${form.insuranceRatePercent}% of the total project cost; and (3) the DOST assistance shall not be used for operating expenses.`,
    `The Memorandum of Agreement (MOA) shall be executed through the Provincial Science and Technology Office (PSTO) linkages. You may contact the ${form.pstoDirectorTitle} of the ${form.pstoOfficeName} when you are ready to proceed with the MOA signing.`,
    `Congratulations on your approved SETUP project! We encourage you to proceed with your application and comply with the disbursement formalities through your respective PSTO within the prescribed time frame.`,
  ];
}

export function emptyApprovalLetterForm(): ApprovalLetterForm {
  const now = new Date();
  return {
    seriesYear: String(now.getFullYear()),
    approvalDate: now.toISOString().split("T")[0],
    referenceNumber: "",
    recipientName: "",
    recipientDesignation: "Proprietor",
    enterpriseName: "",
    enterpriseAddress: "",
    projectTitle: "",
    approvedAmount: "",
    refundTermYears: "five (5)",
    insuranceRatePercent: "0.50",
    pstoDirectorTitle: "Provincial Director",
    pstoOfficeName: "",
    signatoryName: DOST_REGION_12_DIRECTOR_NAME,
    signatoryTitle: "Regional Director",
    conformeDeadlineDays: "15",
    published: false,
  };
}

export function hasRtecReportPrerequisite(applicant: Applicant | null): boolean {
  if (!applicant) return false;

  const stored = getRtecReportStored(applicant);
  if (stored?.submitted) return true;

  const approvalStored = getApprovalLetterStored(applicant);
  if (approvalStored?.published || approvalStored?.acknowledged) return true;

  const moduleIdx = MODULE_ORDER.indexOf(applicant.currentModule);
  const rtecIdx = MODULE_ORDER.indexOf("conduct-rtec");
  if (moduleIdx > rtecIdx) return true;

  const form = stored?.form ?? getRtecReportForm(applicant);
  const complianceDone =
    form.complianceItems.length > 0 &&
    form.complianceItems.every((item) => item.status);
  if (
    form.recommendation?.trim() &&
    form.signatures?.chairperson?.trim() &&
    complianceDone
  ) {
    return true;
  }

  const assessments = (applicant.moduleData?.assessments ?? []) as {
    decision?: string;
  }[];
  if (assessments.some((a) => a.decision === "rtec-completed")) return true;

  return false;
}

export function buildApprovalLetterDraft(applicant: Applicant | null): ApprovalLetterForm {
  if (!applicant) return emptyApprovalLetterForm();

  const pp = getProjectProposalForm(applicant);
  const rtec = getRtecReportForm(applicant);
  const psto = resolvePstoContact(applicant);
  const now = new Date();

  const setupAmount =
    rtec.projectCostSetup ||
    pp.amountRequested ||
    applicant.approvedAmount ||
    "";

  const recipientName = (pp.contactPerson || applicant.applicantName || "").toUpperCase();

  return {
    seriesYear: String(now.getFullYear()),
    approvalDate: now.toISOString().split("T")[0],
    referenceNumber: generateReferenceNumber(applicant),
    recipientName,
    recipientDesignation: defaultDesignation(applicant, pp.organizationType),
    enterpriseName: pp.firmName || applicant.enterpriseName,
    enterpriseAddress: pp.firmAddress || applicant.address,
    projectTitle: pp.projectTitle,
    approvedAmount: setupAmount,
    refundTermYears: inferRefundTermYears(pp.refundSchedule),
    insuranceRatePercent: "0.50",
    pstoDirectorTitle: psto.pstoDirectorTitle,
    pstoOfficeName: psto.pstoOfficeName,
    signatoryName: DOST_REGION_12_DIRECTOR_NAME,
    signatoryTitle: "Regional Director",
    conformeDeadlineDays: "15",
    published: false,
  };
}

export function getApprovalLetterStored(
  applicant: Applicant | null,
): ApprovalLetterStored | null {
  if (!applicant?.moduleData?.approvalLetter) return null;
  return applicant.moduleData.approvalLetter as ApprovalLetterStored;
}

export function getApprovalLetterForm(applicant: Applicant | null): ApprovalLetterForm {
  const stored = getApprovalLetterStored(applicant);
  if (stored?.form) {
    return {
      ...stored.form,
      signatoryName: stored.form.signatoryName?.trim() || DOST_REGION_12_DIRECTOR_NAME,
    };
  }
  return buildApprovalLetterDraft(applicant);
}

export function syncApprovalLetterFromRtec(
  existing: ApprovalLetterForm,
  applicant: Applicant,
): ApprovalLetterForm {
  const draft = buildApprovalLetterDraft(applicant);
  return {
    ...existing,
    referenceNumber: existing.referenceNumber?.trim()
      ? existing.referenceNumber
      : draft.referenceNumber,
    recipientName: existing.recipientName?.trim()
      ? existing.recipientName
      : draft.recipientName,
    recipientDesignation: existing.recipientDesignation?.trim()
      ? existing.recipientDesignation
      : draft.recipientDesignation,
    enterpriseName: draft.enterpriseName,
    enterpriseAddress: draft.enterpriseAddress,
    projectTitle: draft.projectTitle,
    approvedAmount: draft.approvedAmount,
    pstoDirectorTitle: existing.pstoDirectorTitle?.trim()
      ? existing.pstoDirectorTitle
      : draft.pstoDirectorTitle,
    pstoOfficeName: existing.pstoOfficeName?.trim()
      ? existing.pstoOfficeName
      : draft.pstoOfficeName,
    refundTermYears: existing.refundTermYears?.trim()
      ? existing.refundTermYears
      : draft.refundTermYears,
  };
}

export function saveApprovalLetterDraft(
  applicantId: string,
  form: ApprovalLetterForm,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getApprovalLetterStored(applicant);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      approvalLetter: {
        form: { ...form, published: existing?.published ?? false },
        published: existing?.published ?? false,
        publishedAt: existing?.publishedAt,
        acknowledged: existing?.acknowledged ?? false,
        acknowledgedAt: existing?.acknowledgedAt,
        updatedAt: new Date().toISOString(),
      } satisfies ApprovalLetterStored,
    },
  });
}

export function publishApprovalLetter(
  applicantId: string,
  form: ApprovalLetterForm,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const now = new Date().toISOString();
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      approvalLetter: {
        form: { ...form, published: true },
        published: true,
        publishedAt: now,
        acknowledged: false,
        acknowledgedAt: undefined,
        updatedAt: now,
      } satisfies ApprovalLetterStored,
    },
    approvedAmount: form.approvedAmount || applicant.approvedAmount,
  });
}

export function acknowledgeApprovalLetter(
  applicantId: string,
  conformeSignedName: string,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getApprovalLetterStored(applicant);
  if (!existing?.form) return;
  const now = new Date().toISOString();
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      approvalLetter: {
        ...existing,
        form: {
          ...existing.form,
          acknowledgedAt: now,
          conformeSignedName,
        },
        acknowledged: true,
        acknowledgedAt: now,
        updatedAt: now,
      } satisfies ApprovalLetterStored,
    },
  });
}

export function validateApprovalLetterPublish(form: ApprovalLetterForm): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!form.projectTitle?.trim()) errors.push("Project title is required.");
  if (!form.referenceNumber?.trim()) errors.push("Reference number is required.");
  if (!form.recipientName?.trim()) errors.push("Recipient name is required.");
  if (!form.enterpriseName?.trim()) errors.push("Enterprise name is required.");
  if (!form.enterpriseAddress?.trim()) errors.push("Enterprise address is required.");
  if (!form.pstoOfficeName?.trim()) errors.push("PSTO office name is required.");
  if (!form.signatoryName?.trim()) errors.push("Signatory name is required.");
  return errors;
}

export function validateApprovalLetterAcknowledge(
  conformeSignedName: string,
): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!conformeSignedName?.trim()) {
    errors.push("Please type your full name to acknowledge the Notice of Approval.");
  }
  return errors;
}

export function getApprovalLetterPrintStyles(): string {
  return `
    ${a4PageRule(A4_MARGIN_LETTER)}
    body { font-family: Georgia, 'Segoe UI', serif; padding: 0; color: #1f2937; font-size: 12px; line-height: 1.5; }
    .al-letterhead { text-align: center; margin-bottom: 16px; }
    .al-letterhead img { height: 56px; margin: 0 auto 8px; display: block; }
    .al-letterhead p { margin: 2px 0; font-size: 11px; }
    .al-letterhead .al-form-title { font-weight: 700; font-size: 12px; margin-top: 6px; }
    .al-meta { text-align: right; margin-bottom: 20px; font-size: 11px; }
    .al-addressee { margin-bottom: 16px; font-size: 12px; }
    .al-addressee .al-name { font-weight: 700; text-transform: uppercase; }
    .al-ref { margin-bottom: 16px; font-size: 12px; }
    .al-body p { text-align: justify; margin: 0 0 12px; }
    .al-closing { margin-top: 24px; }
    .al-sig-name { font-weight: 700; text-transform: uppercase; margin-top: 32px; }
    .al-conforme { margin-top: 36px; page-break-inside: avoid; }
    .al-sig-line { border-bottom: 1px solid #374151; min-height: 28px; margin: 12px 0 8px; max-width: 280px; }
    .al-footer { margin-top: 32px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #6b7280; text-align: center; line-height: 1.4; }
    .al-ack-name { font-style: italic; font-size: 11px; }
  `;
}

export function printApprovalLetter(applicationId?: string) {
  const el = document.getElementById("approval-letter-preview");
  const title = applicationId
    ? `SETUP-Form-003-Approval-${applicationId}`
    : "SETUP-Form-003-Approval";
  if (!el) {
    window.print();
    return;
  }
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>${title}</title>
    <style>${getApprovalLetterPrintStyles()}</style></head>
    <body>${el.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export function downloadApprovalLetterPdf(applicationId?: string) {
  printApprovalLetter(applicationId);
}

export function getSignedMoa(applicant: Applicant | null): SignedMoaDocument | null {
  return getApprovalLetterStored(applicant)?.signedMoa ?? null;
}

export function saveSignedMoa(
  applicantId: string,
  document: SignedMoaDocument,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getApprovalLetterStored(applicant);
  if (!existing) return;
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      approvalLetter: {
        ...existing,
        signedMoa: document,
        updatedAt: new Date().toISOString(),
      } satisfies ApprovalLetterStored,
    },
  });
}

export function removeSignedMoa(applicantId: string): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getApprovalLetterStored(applicant);
  if (!existing) return;
  const { signedMoa: _removed, ...rest } = existing;
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      approvalLetter: {
        ...rest,
        updatedAt: new Date().toISOString(),
      } satisfies ApprovalLetterStored,
    },
  });
}

export function validateSignedMoaUpload(
  moaSignedDate: string,
  fileName: string,
): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!moaSignedDate?.trim()) errors.push("MOA signed date is required.");
  if (!fileName?.trim()) errors.push("Signed MOA file is required.");
  return errors;
}

export { DOST_BLUE as APPROVAL_DOST_BLUE };
