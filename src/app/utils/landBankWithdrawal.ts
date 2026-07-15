/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import type {
  LandBankForm,
  LandBankStored,
  ModuleDocument,
  ProjectProposalBudgetRow,
  WithdrawalEquipmentRow,
  WithdrawalTranchePackage,
} from "../api/types";
import { getApprovalLetterForm } from "./approvalLetter";
import { getProjectProposalForm } from "./projectProposal";
import { isSigningDayComplete } from "./projectInformationSheet";
import { isDemoModeActive } from "./demoMode";
import { hasLbpIntroductionPublished } from "./lbpIntroductionLetter";
import { hasPdcsRecordedForDisbursement } from "./refundDelinquent";
import { formatFormMention } from "../constants/setupForms";
import { a4PageRule, A4_MARGIN_DEFAULT } from "./printPage";
import { getSignedDocument, getSignedDocuments } from "./documentDelivery";
import { sumWithdrawalEquipment } from "./withdrawalRequestLetter";

const MODULE_KEY = "landBank";

/** Signed-document map keys used by DocumentDeliveryPanel */
export const WITHDRAWAL_SIGNED_KEY = {
  first: "withdrawal-request-t1",
  second: "withdrawal-request-t2",
} as const;

export function emptyTranchePackage(tranche: 1 | 2): WithdrawalTranchePackage {
  return {
    tranche,
    supplierName: "",
    equipment: [],
    signedLetter: null,
    quotations: [],
    equipmentPhotos: [],
    status: "draft",
  };
}

export function emptyLandBankForm(): LandBankForm {
  return {
    accountSnapshot: null,
    withdrawalLetter: null,
    withdrawalRemarks: "",
    authorityLetterGenerated: false,
    tranches: {
      first: emptyTranchePackage(1),
      second: emptyTranchePackage(2),
    },
  };
}

function newRowId(): string {
  return `we-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function budgetRowToWithdrawalEquipment(
  row: ProjectProposalBudgetRow,
): WithdrawalEquipmentRow {
  const amount = row.setupShare?.trim() || row.total?.trim() || row.unitCost?.trim() || "";
  return {
    id: newRowId(),
    item: row.item,
    amount,
    sourceBudgetItemId: row.id,
  };
}

function normalizeTranche(
  raw: Partial<WithdrawalTranchePackage> | undefined,
  tranche: 1 | 2,
): WithdrawalTranchePackage {
  const base = emptyTranchePackage(tranche);
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    tranche,
    supplierName: raw.supplierName ?? "",
    equipment: Array.isArray(raw.equipment) ? raw.equipment : [],
    quotations: Array.isArray(raw.quotations) ? raw.quotations : [],
    equipmentPhotos: Array.isArray(raw.equipmentPhotos) ? raw.equipmentPhotos : [],
    signedLetter: raw.signedLetter ?? null,
  };
}

/** Normalize legacy LandBank forms and overlay signed letters from delivery map. */
export function normalizeLandBankForm(
  form: LandBankForm | (Partial<LandBankForm> & { accountSnapshot?: ModuleDocument | null }),
  applicant?: Applicant | null,
): LandBankForm {
  const first = normalizeTranche(form.tranches?.first, 1);
  const second = normalizeTranche(form.tranches?.second, 2);

  // Migrate deprecated single withdrawalLetter → tranche 1 signed letter
  if (!first.signedLetter && form.withdrawalLetter) {
    first.signedLetter = form.withdrawalLetter;
    if (!first.status || first.status === "draft") first.status = "signed";
  }

  if (applicant) {
    const t1Signed = getSignedDocument(applicant, WITHDRAWAL_SIGNED_KEY.first);
    const t2Signed = getSignedDocument(applicant, WITHDRAWAL_SIGNED_KEY.second);
    if (t1Signed && !first.signedLetter) {
      first.signedLetter = t1Signed;
      if (!first.status || first.status === "draft" || first.status === "sent") {
        first.status = "signed";
      }
    }
    if (t2Signed && !second.signedLetter) {
      second.signedLetter = t2Signed;
      if (!second.status || second.status === "draft" || second.status === "sent") {
        second.status = "signed";
      }
    }
  }

  return {
    accountSnapshot: form.accountSnapshot ?? null,
    withdrawalLetter: form.withdrawalLetter ?? first.signedLetter ?? null,
    withdrawalRemarks: form.withdrawalRemarks ?? "",
    authorityLetterGenerated: form.authorityLetterGenerated ?? false,
    tranches: { first, second },
  };
}

export function getLandBankStored(applicant: Applicant | null): LandBankStored | null {
  if (!applicant?.moduleData?.[MODULE_KEY]) return null;
  return applicant.moduleData[MODULE_KEY] as LandBankStored;
}

export function getLandBankForm(applicant: Applicant | null): LandBankForm {
  const stored = getLandBankStored(applicant);
  if (stored?.form) return normalizeLandBankForm(stored.form, applicant);
  return emptyLandBankForm();
}

export function getTranchePackage(
  form: LandBankForm,
  tranche: 1 | 2,
): WithdrawalTranchePackage {
  return tranche === 1 ? form.tranches.first : form.tranches.second;
}

export function updateTranchePackage(
  form: LandBankForm,
  tranche: 1 | 2,
  patch: Partial<WithdrawalTranchePackage>,
): LandBankForm {
  const key = tranche === 1 ? "first" : "second";
  const current = getTranchePackage(form, tranche);
  const nextPkg: WithdrawalTranchePackage = { ...current, ...patch, tranche };
  const next: LandBankForm = {
    ...form,
    tranches: {
      ...form.tranches,
      [key]: nextPkg,
    },
  };
  next.withdrawalLetter = next.tranches.first.signedLetter ?? null;
  return next;
}

export function isTranche1Complete(pkg: WithdrawalTranchePackage): boolean {
  return (
    !!pkg.signedLetter &&
    (pkg.quotations?.length ?? 0) >= 1 &&
    (pkg.equipmentPhotos?.length ?? 0) >= 1
  );
}

export function isTranche2Complete(pkg: WithdrawalTranchePackage): boolean {
  return !!pkg.signedLetter;
}

export function isWithdrawalRequestReady(form: LandBankForm): boolean {
  return isTranche1Complete(form.tranches.first);
}

export interface LandBankOverview {
  projectTitle: string;
  enterpriseName: string;
  accountHolder: string;
  approvedAmount: string;
  remainingBalance: string;
  totalWithdrawal: string;
  tranche1Amount: string;
  tranche2Amount: string;
}

function formatPeso(num: number): string {
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseAmount(amount: string): number {
  return parseFloat(String(amount).replace(/[^\d.]/g, "")) || 0;
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
      tranche1Amount: "₱0.00",
      tranche2Amount: "₱0.00",
    };
  }
  const form = getLandBankForm(applicant);
  const approval = getApprovalLetterForm(applicant);
  const pp = getProjectProposalForm(applicant);
  const amount = approval.approvedAmount || pp.amountRequested || "₱0";
  const t1 = sumWithdrawalEquipment(form.tranches.first.equipment);
  const t2 = sumWithdrawalEquipment(form.tranches.second.equipment);
  const withdrawn = t1 + t2;
  const approvedNum = parseAmount(amount);
  const remaining = Math.max(0, approvedNum - withdrawn);

  return {
    projectTitle: pp.projectTitle || approval.projectTitle || "—",
    enterpriseName: pp.firmName || applicant.enterpriseName || "—",
    accountHolder: approval.recipientName || pp.ownerName || applicant.applicantName || "—",
    approvedAmount: amount,
    remainingBalance: formatPeso(remaining),
    totalWithdrawal: formatPeso(withdrawn),
    tranche1Amount: formatPeso(t1),
    tranche2Amount: formatPeso(t2),
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
  const normalized = normalizeLandBankForm(form, applicant);

  const signedDocuments = {
    ...getSignedDocuments(applicant),
  };
  if (normalized.tranches.first.signedLetter) {
    signedDocuments[WITHDRAWAL_SIGNED_KEY.first] = normalized.tranches.first.signedLetter;
  }
  if (normalized.tranches.second.signedLetter) {
    signedDocuments[WITHDRAWAL_SIGNED_KEY.second] = normalized.tranches.second.signedLetter;
  }

  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      signedDocuments,
      [MODULE_KEY]: {
        form: normalized,
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
  if (!isTranche1Complete(form.tranches.first)) {
    errors.push(
      "Complete 1st tranche: signed letter request, at least one quotation, and equipment photo(s).",
    );
  }
  return errors;
}

export function validateTranchePackage(
  pkg: WithdrawalTranchePackage,
  options?: { requireDocs?: boolean },
): string[] {
  const errors: string[] = [];
  if (!pkg.supplierName.trim()) errors.push("Supplier name is required.");
  if (pkg.equipment.filter((r) => r.item.trim()).length === 0) {
    errors.push("Add at least one equipment item from the project proposal budget.");
  }
  if (options?.requireDocs) {
    if (pkg.tranche === 1 && !isTranche1Complete(pkg)) {
      errors.push(
        "1st tranche requires a signed letter, quotations, and equipment photos.",
      );
    }
    if (pkg.tranche === 2 && !isTranche2Complete(pkg)) {
      errors.push("2nd tranche requires a signed letter request.");
    }
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
  form.tranches.first = {
    ...form.tranches.first,
    status: "complete",
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
  tranche: 1 | 2 = 1,
): void {
  if (!applicant) return;
  const overview = getLandBankOverview(applicant);
  const form = getLandBankForm(applicant);
  const pkg = getTranchePackage(form, tranche);
  const approval = getApprovalLetterForm(applicant);
  const ref = approval.referenceNumber || applicationId || applicant.applicationId || "—";
  const title = applicationId
    ? `Authority-Letter-T${tranche}-${applicationId}`
    : `Authority-Letter-Withdraw-T${tranche}`;
  const withdrawAmount =
    tranche === 1 ? overview.tranche1Amount : overview.tranche2Amount;
  const trancheWord = tranche === 1 ? "first" : "second";

  markAuthorityLetterGenerated(applicant.id);

  const html = `
    <div style="font-family: Georgia, serif; font-size: 12px; line-height: 1.6; color: #1f2937;">
      <p style="text-align:center;font-size:11px;margin:0 0 4px;">Republic of the Philippines</p>
      <p style="text-align:center;font-weight:bold;margin:0 0 16px;">DEPARTMENT OF SCIENCE AND TECHNOLOGY</p>
      <p style="text-align:center;font-weight:bold;margin:0 0 24px;">AUTHORITY TO WITHDRAW — SETUP FUND (${trancheWord.toUpperCase()} TRANCHE)</p>
      <p><strong>Reference:</strong> ${ref}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}</p>
      <p style="margin-top:20px;">To: Land Bank of the Philippines</p>
      <p style="text-align:justify;margin-top:16px;">
        This is to authorize <strong>${overview.accountHolder}</strong>, representing
        <strong>${overview.enterpriseName}</strong>, to withdraw the ${trancheWord} tranche of SETUP
        project funds from the dedicated savings account for the project titled
        <strong>${overview.projectTitle}</strong>, in the amount of
        <strong>${withdrawAmount}</strong>
        ${pkg.supplierName ? ` for equipment procurement at <strong>${pkg.supplierName}</strong>` : ""},
        subject to DOST SETUP guidelines and documentary requirements.
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
    <style>${a4PageRule(A4_MARGIN_DEFAULT)} body { font-family: Georgia, serif; }</style></head>
    <body>${html}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

/** Proposal budget lines not yet assigned to either tranche (by sourceBudgetItemId). */
export function availableProposalBudgetItems(
  applicant: Applicant | null,
  form: LandBankForm,
): ProjectProposalBudgetRow[] {
  const pp = getProjectProposalForm(applicant);
  const used = new Set(
    [...form.tranches.first.equipment, ...form.tranches.second.equipment]
      .map((r) => r.sourceBudgetItemId)
      .filter(Boolean) as string[],
  );
  return (pp.budgetItems ?? []).filter(
    (b) => b.item.trim() && !used.has(b.id),
  );
}
