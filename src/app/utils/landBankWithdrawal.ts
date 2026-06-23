/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import type { LandBankForm, LandBankStored } from "../api/types";
import { getApprovalLetterForm } from "./approvalLetter";
import { getProjectProposalForm } from "./projectProposal";
import { isSigningDayComplete } from "./projectInformationSheet";
import { isDemoModeActive } from "./demoMode";
import { hasLbpIntroductionPublished } from "./lbpIntroductionLetter";
import { hasPdcsRecordedForDisbursement } from "./refundDelinquent";
import { formatFormMention } from "../constants/setupForms";

const MODULE_KEY = "landBank";

export function emptyLandBankForm(): LandBankForm {
  return {
    accountSnapshot: null,
    withdrawalLetter: null,
    withdrawalRemarks: "",
    authorityLetterGenerated: false,
  };
}

export function getLandBankStored(applicant: Applicant | null): LandBankStored | null {
  if (!applicant?.moduleData?.[MODULE_KEY]) return null;
  return applicant.moduleData[MODULE_KEY] as LandBankStored;
}

export function getLandBankForm(applicant: Applicant | null): LandBankForm {
  const stored = getLandBankStored(applicant);
  if (stored?.form) return stored.form;
  return emptyLandBankForm();
}

export interface LandBankOverview {
  projectTitle: string;
  enterpriseName: string;
  accountHolder: string;
  approvedAmount: string;
  remainingBalance: string;
  totalWithdrawal: string;
}

export function getLandBankOverview(applicant: Applicant | null): LandBankOverview {
  if (!applicant) {
    return {
      projectTitle: "—",
      enterpriseName: "—",
      accountHolder: "—",
      approvedAmount: "₱0",
      remainingBalance: "₱0",
      totalWithdrawal: "₱0.00",
    };
  }
  const approval = getApprovalLetterForm(applicant);
  const pp = getProjectProposalForm(applicant);
  const amount = approval.approvedAmount || pp.amountRequested || "₱0";
  return {
    projectTitle: pp.projectTitle || approval.projectTitle || "—",
    enterpriseName: pp.firmName || applicant.enterpriseName || "—",
    accountHolder: approval.recipientName || pp.ownerName || applicant.applicantName || "—",
    approvedAmount: amount,
    remainingBalance: amount,
    totalWithdrawal: "₱0.00",
  };
}

export function hasLandBankPrerequisite(applicant: Applicant | null): boolean {
  return isSigningDayComplete(applicant) && hasPdcsRecordedForDisbursement(applicant);
}

export function hasLandBankComplete(applicant: Applicant | null): boolean {
  return !!getLandBankStored(applicant)?.submitted;
}

export function saveLandBankDraft(applicantId: string, form: LandBankForm): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getLandBankStored(applicant);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form,
        introductionLetter: existing?.introductionLetter,
        submitted: existing?.submitted,
        submittedAt: existing?.submittedAt,
        submittedBy: existing?.submittedBy,
        updatedAt: new Date().toISOString(),
      } satisfies LandBankStored,
    },
  });
}

export function validateLandBankSubmit(applicant: Applicant | null): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!hasLandBankPrerequisite(applicant)) {
    errors.push(
      `Complete MOA signing day, ${formatFormMention("008")}, and post-dated check (PDC) recording before LandBank enrollment.`,
    );
  }
  if (!hasLbpIntroductionPublished(applicant)) {
    errors.push("DOST must publish the Letter of Introduction to LBP before proceeding.");
  }
  const form = getLandBankForm(applicant);
  if (!form.accountSnapshot) {
    errors.push("Upload LandBank account snapshot.");
  }
  if (!form.withdrawalLetter) {
    errors.push("Upload withdrawal request letter (PDF).");
  }
  return errors;
}

export function submitLandBank(applicantId: string, submittedBy: string): string[] {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return ["Applicant not found."];
  const errors = validateLandBankSubmit(applicant);
  if (errors.length) return errors;

  const form = {
    ...getLandBankForm(applicant),
    authorityLetterGenerated: true,
  };

  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form,
        introductionLetter: getLandBankStored(applicant)?.introductionLetter,
        submitted: true,
        submittedAt: new Date().toISOString(),
        submittedBy,
        updatedAt: new Date().toISOString(),
      } satisfies LandBankStored,
    },
  });
  return [];
}

export function formatCurrency(amount: string | number): string {
  const num =
    typeof amount === "number"
      ? amount
      : parseFloat(String(amount).replace(/[^\d.]/g, "")) || 0;
  return `₱${num.toLocaleString("en-PH")}`;
}

export function markAuthorityLetterGenerated(applicantId: string): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getLandBankForm(applicant);
  saveLandBankDraft(applicantId, { ...form, authorityLetterGenerated: true });
}

export function downloadAuthorityLetterPdf(
  applicant: Applicant | null,
  applicationId?: string,
): void {
  if (!applicant) return;
  const overview = getLandBankOverview(applicant);
  const approval = getApprovalLetterForm(applicant);
  const ref = approval.referenceNumber || applicationId || applicant.applicationId || "—";
  const title = applicationId
    ? `Authority-Letter-${applicationId}`
    : "Authority-Letter-Withdraw";

  markAuthorityLetterGenerated(applicant.id);

  const html = `
    <div style="font-family: Georgia, serif; font-size: 12px; line-height: 1.6; color: #1f2937;">
      <p style="text-align:center;font-size:11px;margin:0 0 4px;">Republic of the Philippines</p>
      <p style="text-align:center;font-weight:bold;margin:0 0 16px;">DEPARTMENT OF SCIENCE AND TECHNOLOGY</p>
      <p style="text-align:center;font-weight:bold;margin:0 0 24px;">AUTHORITY TO WITHDRAW — SETUP FUND</p>
      <p><strong>Reference:</strong> ${ref}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}</p>
      <p style="margin-top:20px;">To: Land Bank of the Philippines</p>
      <p style="text-align:justify;margin-top:16px;">
        This is to authorize <strong>${overview.accountHolder}</strong>, representing
        <strong>${overview.enterpriseName}</strong>, to withdraw SETUP project funds from the
        dedicated savings account for the project titled
        <strong>${overview.projectTitle}</strong>, in the amount of
        <strong>${overview.approvedAmount}</strong>, subject to DOST SETUP guidelines and
        documentary requirements.
      </p>
      <p style="text-align:justify;margin-top:12px;">
        Remaining project balance after this withdrawal: <strong>${overview.remainingBalance}</strong>.
      </p>
      <p style="margin-top:48px;font-weight:bold;">DOST REGION XII — SETUP 4.0</p>
      <p style="font-size:10px;color:#6b7280;margin-top:32px;text-align:center;">
        Generated via aiSETUP · Demo document for presentation purposes
      </p>
    </div>
  `;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>${title}</title>
    <style>@page { size: A4 portrait; margin: 15mm; }</style></head>
    <body>${html}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
