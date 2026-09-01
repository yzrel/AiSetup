/**
 * Author: Yzrel Jade B. Eborde
 *
 * DOST → LandBank Letter to Untag (Module 16), nested under procurement.untagLetter.
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import { publishModuleToBackendBestEffort } from "./applicantPersistence";
import { isDemoModeActive } from "./demoMode";
import type {
  ProcurementStored,
  UntagLetterForm,
  UntagLetterStored,
} from "../api/types";
import {
  DOST_REGION_12_DIRECTOR_NAME,
  DOST_REGION_12_OFFICE,
} from "../constants/region12";
import { getApprovalLetterForm } from "./approvalLetter";
import { formatApprovalDisplayDate } from "./approvalLetter";
import {
  managerSalutation,
  resolveLbpBranchByBranchName,
  resolveLbpBranchForApplicant,
} from "./lbpIntroductionLetter";
import { getLandBankStored } from "./landBankWithdrawal";
import { getProjectProposalForm } from "./projectProposal";
import {
  emptyProcurementForm,
  getProcurementStored,
  normalizeProcurementForm,
} from "./procurementLiquidation";
import { getRefundForm } from "./refundDelinquent";
import { a4PageRule, A4_MARGIN_LETTER } from "./printPage";
import { printHtmlDocument } from "./printHtml";
import { getDostOfficialLetterheadPrintStyles } from "../components/DostOfficialLetterhead";

const MODULE_KEY = "procurement";

function pickAccountFromRemarks(remarks: string): string {
  const m = remarks.match(/\bSA[\s-]?\d[\d\s-]{5,}\d\b/i);
  if (m) return m[0].replace(/\s+/g, " ").trim();
  const digits = remarks.match(/\b\d{4}[- ]?\d{4}[- ]?\d{2,}\b/);
  return digits ? digits[0].trim() : "";
}

/** Best-effort seed from LandBank withdrawal remarks or refund PDCs. */
export function resolveSetupAccountNumber(applicant: Applicant | null): string {
  if (!applicant) return "";
  const landBank = getLandBankStored(applicant);
  const remarks = landBank?.form?.withdrawalRemarks ?? "";
  const fromRemarks = pickAccountFromRemarks(remarks);
  if (fromRemarks) return fromRemarks;

  try {
    const pdcs = getRefundForm(applicant).pdcs ?? [];
    for (const pdc of pdcs) {
      const acct = String(pdc.accountNumber ?? "").trim();
      if (acct) return acct;
    }
  } catch {
    /* refund island may be absent */
  }
  return "";
}

export function emptyUntagLetterForm(): UntagLetterForm {
  const now = new Date();
  return {
    letterDate: now.toISOString().split("T")[0],
    branchManagerName: "",
    branchManagerTitle: "Branch Manager",
    landbankBranch: "",
    branchCityProvince: "",
    proponentName: "",
    enterpriseName: "",
    projectTitle: "",
    accountNumber: "",
    signatoryName: DOST_REGION_12_DIRECTOR_NAME,
    signatoryTitle: "Regional Director",
    regionalOfficeName: DOST_REGION_12_OFFICE,
  };
}

export function getUntagLetterStored(
  applicant: Applicant | null,
): UntagLetterStored | null {
  return getProcurementStored(applicant)?.untagLetter ?? null;
}

export function getUntagLetterForm(applicant: Applicant | null): UntagLetterForm {
  const stored = getUntagLetterStored(applicant);
  if (stored?.form) return stored.form;
  return syncUntagLetterFromUpstream(applicant);
}

export function hasUntagLetterPublished(applicant: Applicant | null): boolean {
  return !!getUntagLetterStored(applicant)?.published;
}

export function syncUntagLetterFromUpstream(
  applicant: Applicant | null,
  existing?: UntagLetterForm | null,
): UntagLetterForm {
  const base = emptyUntagLetterForm();
  if (!applicant) return existing ?? base;

  const approval = getApprovalLetterForm(applicant);
  const pp = getProjectProposalForm(applicant);
  const intro = getLandBankStored(applicant)?.introductionLetter?.form;
  const branch = resolveLbpBranchForApplicant(applicant);

  const draft: UntagLetterForm = {
    ...base,
    branchId: intro?.branchId || branch.branchId || undefined,
    branchManagerName:
      intro?.branchManagerName || branch.branchManagerName,
    branchManagerTitle:
      intro?.branchManagerTitle || branch.branchManagerTitle || "Branch Manager",
    landbankBranch: intro?.landbankBranch || branch.landbankBranch,
    branchAddress: intro?.branchAddress || branch.branchAddress || undefined,
    branchCityProvince:
      intro?.branchCityProvince || branch.branchCityProvince,
    proponentName:
      intro?.proponentName ||
      approval.recipientName ||
      pp.proponentName ||
      applicant.applicantName,
    enterpriseName:
      intro?.enterpriseName ||
      pp.firmName ||
      approval.enterpriseName ||
      applicant.enterpriseName,
    projectTitle:
      intro?.projectTitle || pp.projectTitle || approval.projectTitle,
    accountNumber: resolveSetupAccountNumber(applicant),
  };

  if (!existing) return draft;

  const pick = (local: string, upstream: string) =>
    local.trim() ? local : upstream;

  return {
    ...draft,
    ...existing,
    branchManagerName: pick(existing.branchManagerName, draft.branchManagerName),
    branchManagerTitle: pick(existing.branchManagerTitle, draft.branchManagerTitle),
    landbankBranch: pick(existing.landbankBranch, draft.landbankBranch),
    branchCityProvince: pick(existing.branchCityProvince, draft.branchCityProvince),
    proponentName: pick(existing.proponentName, draft.proponentName),
    enterpriseName: pick(existing.enterpriseName, draft.enterpriseName),
    projectTitle: pick(existing.projectTitle, draft.projectTitle),
    accountNumber: pick(existing.accountNumber, draft.accountNumber),
  };
}

export function buildUntagLetterBody(form: UntagLetterForm): string[] {
  return [
    `We are pleased to inform you that ${form.enterpriseName} managed by ${form.proponentName} has acquired the equipment for the project entitled, "${form.projectTitle}" under the DOST SETUP.`,
    `In this regard, may we request your good office to UNTAG the savings account of the firm with account no. ${form.accountNumber}.`,
    "Thank you.",
  ];
}

function writeUntagLetter(
  applicantId: string,
  letter: UntagLetterStored,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const procurement = getProcurementStored(applicant);
  const form = normalizeProcurementForm(procurement?.form);
  const next: ProcurementStored = {
    form,
    untagLetter: letter,
    submitted: procurement?.submitted,
    submittedAt: procurement?.submittedAt,
    submittedBy: procurement?.submittedBy,
    updatedAt: new Date().toISOString(),
  };
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: next,
    },
  });
}

export function saveUntagLetterDraft(
  applicantId: string,
  form: UntagLetterForm,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getUntagLetterStored(applicant);
  writeUntagLetter(applicantId, {
    form,
    published: existing?.published ?? false,
    publishedAt: existing?.publishedAt,
    publishedBy: existing?.publishedBy,
    updatedAt: new Date().toISOString(),
  });
}

export function validateUntagLetterPublish(form: UntagLetterForm): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!form.branchManagerName?.trim()) {
    errors.push("LandBank branch manager name is required.");
  }
  if (!form.landbankBranch?.trim()) errors.push("LandBank branch is required.");
  if (!form.branchCityProvince?.trim()) {
    errors.push("Branch city/province is required.");
  }
  if (!form.proponentName?.trim()) errors.push("Proponent name is required.");
  if (!form.enterpriseName?.trim()) errors.push("Enterprise name is required.");
  if (!form.projectTitle?.trim()) errors.push("Project title is required.");
  if (!form.accountNumber?.trim()) {
    errors.push("LandBank savings account number is required.");
  }
  if (!form.signatoryName?.trim()) errors.push("Signatory name is required.");
  return errors;
}

export function publishUntagLetter(
  applicantId: string,
  form: UntagLetterForm,
  publishedBy: string,
): string[] {
  const errors = validateUntagLetterPublish(form);
  if (errors.length) return errors;

  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return ["Applicant not found."];

  const now = new Date().toISOString();
  const untagLetter: UntagLetterStored = {
    form: { ...form },
    published: true,
    publishedAt: now,
    publishedBy,
    updatedAt: now,
  };
  writeUntagLetter(applicantId, untagLetter);

  const procurement = getProcurementStored(
    applicantStore.getById(applicantId) ?? null,
  );
  publishModuleToBackendBestEffort(
    applicantId,
    MODULE_KEY,
    {
      form: procurement?.form ?? emptyProcurementForm(),
      untagLetter,
      updatedAt: now,
    },
    false,
  );
  return [];
}

export function getUntagLetterPrintStyles(): string {
  return `
    ${a4PageRule(A4_MARGIN_LETTER)}
    body { font-family: Georgia, 'Segoe UI', serif; padding: 0; color: #1f2937; font-size: 12px; line-height: 1.5; }
    ${getDostOfficialLetterheadPrintStyles()}
    .untag-date { margin-bottom: 20px; font-size: 12px; }
    .untag-addressee { margin-bottom: 16px; font-size: 12px; }
    .untag-addressee .untag-name { font-weight: 700; text-transform: uppercase; }
    .untag-salutation { margin-bottom: 16px; font-size: 12px; font-weight: 600; }
    .untag-greeting { margin-bottom: 16px; font-size: 12px; font-weight: 600; }
    .untag-body p { text-align: justify; margin: 0 0 12px; }
    .untag-closing { margin-top: 24px; }
    .untag-sig-name { font-weight: 700; text-transform: uppercase; margin-top: 32px; }
  `;
}

export function printUntagLetter(applicationId?: string) {
  const el = document.getElementById("untag-letter-preview");
  const title = applicationId
    ? `Letter-to-Untag-${applicationId}`
    : "Letter-to-Untag";
  if (!el) {
    window.print();
    return;
  }
  printHtmlDocument(title, el.innerHTML, getUntagLetterPrintStyles());
}

export function downloadUntagLetterPdf(applicationId?: string) {
  printUntagLetter(applicationId);
}

export {
  formatApprovalDisplayDate,
  managerSalutation,
  resolveLbpBranchByBranchName,
};
