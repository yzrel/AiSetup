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
  WithdrawalSupplierBlock,
  WithdrawalTrancheNum,
  WithdrawalTranchePackage,
} from "../api/types";
import { getApprovalLetterForm, getSignedMoa } from "./approvalLetter";
import { getProjectProposalForm } from "./projectProposal";
import { isDemoModeActive } from "./demoMode";
import { hasLbpIntroductionPublished } from "./lbpIntroductionLetter";
import { hasPdcsRecordedForDisbursement } from "./refundDelinquent";
import { a4PageRule, A4_MARGIN_DEFAULT } from "./printPage";
import { escapeHtml, printHtmlDocument } from "./printHtml";
import { getSignedDocument, getSignedDocuments } from "./documentDelivery";
import { sumWithdrawalEquipment } from "./withdrawalRequestLetter";
import { normalizeLandBankStored } from "./normalizeCriticalModuleData";

const MODULE_KEY = "landBank";

export type TrancheMapKey = "first" | "second" | "third";

/** Staff-facing withdrawal / authority letter tranches. T3 is legacy-only. */
export type ActiveWithdrawalTranche = 1 | 2;

export const ACTIVE_WITHDRAWAL_TRANCHES: readonly ActiveWithdrawalTranche[] = [1, 2];

export function isActiveWithdrawalTranche(
  tranche: WithdrawalTrancheNum,
): tranche is ActiveWithdrawalTranche {
  return tranche === 1 || tranche === 2;
}

/** Signed-document map keys used by DocumentDeliveryPanel */
export const WITHDRAWAL_SIGNED_KEY = {
  first: "withdrawal-request-t1",
  second: "withdrawal-request-t2",
  third: "withdrawal-request-t3",
} as const;

export function trancheMapKey(tranche: WithdrawalTrancheNum): TrancheMapKey {
  if (tranche === 1) return "first";
  if (tranche === 2) return "second";
  return "third";
}

export function trancheSignedKey(tranche: WithdrawalTrancheNum): string {
  return WITHDRAWAL_SIGNED_KEY[trancheMapKey(tranche)];
}

export function trancheDisplayLabel(tranche: WithdrawalTrancheNum): string {
  if (tranche === 1) return "1st";
  if (tranche === 2) return "2nd";
  return "3rd";
}

function newRowId(): string {
  return `we-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newSupplierId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptySupplierBlock(name = ""): WithdrawalSupplierBlock {
  return {
    id: newSupplierId(),
    name,
    equipment: [],
  };
}

export function emptyTranchePackage(tranche: WithdrawalTrancheNum): WithdrawalTranchePackage {
  return {
    tranche,
    suppliers: [],
    selectedSupplierId: null,
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
      third: emptyTranchePackage(3),
    },
  };
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

function normalizeEquipmentRows(
  raw: WithdrawalEquipmentRow[] | WithdrawalEquipmentRow | undefined,
): WithdrawalEquipmentRow[] {
  if (Array.isArray(raw)) return raw;
  if (raw) return [raw];
  return [];
}

function normalizeSuppliers(
  raw: Partial<WithdrawalTranchePackage> | undefined,
): WithdrawalSupplierBlock[] {
  if (raw?.suppliers?.length) {
    return raw.suppliers.map((s) => ({
      id: s.id || newSupplierId(),
      name: s.name ?? "",
      equipment: normalizeEquipmentRows(s.equipment),
    }));
  }

  const legacyName = raw?.supplierName?.trim() ?? "";
  const legacyEquipment = normalizeEquipmentRows(raw?.equipment);
  if (legacyName || legacyEquipment.length) {
    const block = emptySupplierBlock(legacyName);
    block.equipment = legacyEquipment;
    return [block];
  }

  return [];
}

function resolveSelectedSupplierId(
  suppliers: WithdrawalSupplierBlock[],
  rawId: string | null | undefined,
): string | null {
  if (rawId && suppliers.some((s) => s.id === rawId)) return rawId;
  const named = suppliers.find((s) => s.name.trim());
  return named?.id ?? suppliers[0]?.id ?? null;
}

function normalizeDocList(
  raw: ModuleDocument[] | ModuleDocument | undefined,
): ModuleDocument[] {
  if (Array.isArray(raw)) return raw;
  if (raw) return [raw];
  return [];
}

function normalizeTranche(
  raw: Partial<WithdrawalTranchePackage> | undefined,
  tranche: WithdrawalTrancheNum,
): WithdrawalTranchePackage {
  const base = emptyTranchePackage(tranche);
  if (!raw) return base;
  const suppliers = normalizeSuppliers(raw);
  return {
    ...base,
    ...raw,
    tranche,
    suppliers,
    selectedSupplierId: resolveSelectedSupplierId(suppliers, raw.selectedSupplierId),
    quotations: normalizeDocList(raw.quotations),
    equipmentPhotos: normalizeDocList(raw.equipmentPhotos),
    signedLetter: raw.signedLetter ?? null,
  };
}

/** All equipment rows across supplier blocks on a tranche package. */
export function getTrancheEquipment(pkg: WithdrawalTranchePackage): WithdrawalEquipmentRow[] {
  return pkg.suppliers.flatMap((s) => s.equipment);
}

export function getSelectedSupplierBlock(
  pkg: WithdrawalTranchePackage,
): WithdrawalSupplierBlock | null {
  if (!pkg.suppliers.length) return null;
  if (pkg.selectedSupplierId) {
    const found = pkg.suppliers.find((s) => s.id === pkg.selectedSupplierId);
    if (found) return found;
  }
  return pkg.suppliers.find((s) => s.name.trim()) ?? pkg.suppliers[0] ?? null;
}

export function getTrancheSupplierName(pkg: WithdrawalTranchePackage): string {
  return getSelectedSupplierBlock(pkg)?.name.trim() ?? "";
}

export function sumTrancheEquipment(pkg: WithdrawalTranchePackage): number {
  return sumWithdrawalEquipment(getTrancheEquipment(pkg));
}

/** Normalize legacy LandBank forms and overlay signed letters from delivery map. */
export function normalizeLandBankForm(
  form: LandBankForm | (Partial<LandBankForm> & { accountSnapshot?: ModuleDocument | null }),
  applicant?: Applicant | null,
): LandBankForm {
  const first = normalizeTranche(form.tranches?.first, 1);
  const second = normalizeTranche(form.tranches?.second, 2);
  const third = normalizeTranche(form.tranches?.third, 3);

  if (!first.signedLetter && form.withdrawalLetter) {
    first.signedLetter = form.withdrawalLetter;
    if (!first.status || first.status === "draft") first.status = "signed";
  }

  if (applicant) {
    const signedByTranche: [WithdrawalTranchePackage, string][] = [
      [first, WITHDRAWAL_SIGNED_KEY.first],
      [second, WITHDRAWAL_SIGNED_KEY.second],
      [third, WITHDRAWAL_SIGNED_KEY.third],
    ];
    for (const [pkg, key] of signedByTranche) {
      const signed = getSignedDocument(applicant, key);
      if (signed && !pkg.signedLetter) {
        pkg.signedLetter = signed;
        if (!pkg.status || pkg.status === "draft" || pkg.status === "sent") {
          pkg.status = "signed";
        }
      }
    }
  }

  return {
    accountSnapshot: form.accountSnapshot ?? null,
    withdrawalLetter: form.withdrawalLetter ?? first.signedLetter ?? null,
    withdrawalRemarks: form.withdrawalRemarks ?? "",
    authorityLetterGenerated: form.authorityLetterGenerated ?? false,
    tranches: { first, second, third },
  };
}

export function getLandBankStored(applicant: Applicant | null): LandBankStored | null {
  if (!applicant?.moduleData?.[MODULE_KEY]) return null;
  const normalized = normalizeLandBankStored(applicant.moduleData[MODULE_KEY]);
  return (normalized as LandBankStored | undefined) ?? null;
}

export function getLandBankForm(applicant: Applicant | null): LandBankForm {
  const stored = getLandBankStored(applicant);
  if (stored?.form) return normalizeLandBankForm(stored.form, applicant);
  return emptyLandBankForm();
}

export function getTranchePackage(
  form: LandBankForm,
  tranche: WithdrawalTrancheNum,
): WithdrawalTranchePackage {
  return form.tranches[trancheMapKey(tranche)];
}

export function updateTranchePackage(
  form: LandBankForm,
  tranche: WithdrawalTrancheNum,
  patch: Partial<WithdrawalTranchePackage>,
): LandBankForm {
  const key = trancheMapKey(tranche);
  const current = getTranchePackage(form, tranche);
  const nextPkg: WithdrawalTranchePackage = { ...current, ...patch, tranche };
  if (patch.suppliers) {
    nextPkg.selectedSupplierId = resolveSelectedSupplierId(
      nextPkg.suppliers,
      patch.selectedSupplierId ?? nextPkg.selectedSupplierId,
    );
  }
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

export function isTranche3Complete(pkg: WithdrawalTranchePackage): boolean {
  return !!pkg.signedLetter;
}

export function isTrancheComplete(
  pkg: WithdrawalTranchePackage,
  tranche: WithdrawalTrancheNum,
): boolean {
  if (tranche === 1) return isTranche1Complete(pkg);
  if (tranche === 2) return isTranche2Complete(pkg);
  return isTranche3Complete(pkg);
}

export function isWithdrawalRequestReady(form: LandBankForm): boolean {
  return isTranche1Complete(form.tranches.first);
}

/** Authority letter may be issued for T1 alone; T2 is optional. T3 is not offered. */
export function isAuthorityLetterReady(
  form: LandBankForm,
  tranche: WithdrawalTrancheNum,
): boolean {
  if (tranche === 1) return isTranche1Complete(form.tranches.first);
  if (tranche === 2) return isTranche2Complete(form.tranches.second);
  return false;
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
  tranche3Amount: string;
}

function formatPeso(num: number): string {
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseAmount(amount: string): number {
  return parseFloat(String(amount).replace(/[^\d.]/g, "")) || 0;
}

export function overviewTrancheAmount(
  overview: LandBankOverview,
  tranche: WithdrawalTrancheNum,
): string {
  if (tranche === 1) return overview.tranche1Amount;
  if (tranche === 2) return overview.tranche2Amount;
  return overview.tranche3Amount;
}

export function getLandBankOverview(applicant: Applicant | null): LandBankOverview {
  const empty = {
    projectTitle: "—",
    enterpriseName: "—",
    accountHolder: "—",
    approvedAmount: "₱0",
    remainingBalance: "₱0",
    totalWithdrawal: "₱0.00",
    tranche1Amount: "₱0.00",
    tranche2Amount: "₱0.00",
    tranche3Amount: "₱0.00",
  };
  if (!applicant) return empty;

  const form = getLandBankForm(applicant);
  const approval = getApprovalLetterForm(applicant);
  const pp = getProjectProposalForm(applicant);
  const amount = approval.approvedAmount || pp.amountRequested || "₱0";
  const t1 = sumTrancheEquipment(form.tranches.first);
  const t2 = sumTrancheEquipment(form.tranches.second);
  const t3 = sumTrancheEquipment(form.tranches.third);
  const withdrawn = t1 + t2 + t3;
  const approvedNum = parseAmount(amount);
  const remaining = Math.max(0, approvedNum - withdrawn);

  return {
    projectTitle: pp.projectTitle || approval.projectTitle || "—",
    enterpriseName: pp.firmName || applicant.enterpriseName || "—",
    accountHolder: approval.recipientName || pp.proponentName || applicant.applicantName || "—",
    approvedAmount: amount,
    remainingBalance: formatPeso(remaining),
    totalWithdrawal: formatPeso(withdrawn),
    tranche1Amount: formatPeso(t1),
    tranche2Amount: formatPeso(t2),
    tranche3Amount: formatPeso(t3),
  };
}

export function hasLandBankPrerequisite(applicant: Applicant | null): boolean {
  return !!getSignedMoa(applicant) && hasPdcsRecordedForDisbursement(applicant);
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
  for (const key of ["first", "second", "third"] as const) {
    const letter = normalized.tranches[key].signedLetter;
    if (letter) {
      signedDocuments[WITHDRAWAL_SIGNED_KEY[key]] = letter;
    }
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
      "Upload the signed MOA and record post-dated checks (PDCs) before LandBank enrollment.",
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
  const selected = getSelectedSupplierBlock(pkg);
  if (!selected?.name.trim()) errors.push("Supplier name is required.");
  const equipment = selected?.equipment.filter((r) => r.item.trim()) ?? [];
  if (equipment.length === 0) {
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
    if (pkg.tranche === 3 && !isTranche3Complete(pkg)) {
      errors.push("3rd tranche requires a signed letter request.");
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

function authorityTrancheWord(tranche: ActiveWithdrawalTranche): string {
  return tranche === 1 ? "first" : "second";
}

export function downloadAuthorityLetterPdf(
  applicant: Applicant | null,
  applicationId?: string,
  tranche: WithdrawalTrancheNum = 1,
): void {
  if (!applicant || !isActiveWithdrawalTranche(tranche)) return;
  const overview = getLandBankOverview(applicant);
  const form = getLandBankForm(applicant);
  const pkg = getTranchePackage(form, tranche);
  const supplierName = getTrancheSupplierName(pkg);
  const approval = getApprovalLetterForm(applicant);
  const ref = approval.referenceNumber || applicationId || applicant.applicationId || "—";
  const title = applicationId
    ? `Authority-Letter-T${tranche}-${applicationId}`
    : `Authority-Letter-Withdraw-T${tranche}`;
  const withdrawAmount = overviewTrancheAmount(overview, tranche);
  const trancheWord = authorityTrancheWord(tranche);

  markAuthorityLetterGenerated(applicant.id);

  const html = `
    <div style="font-family: Georgia, serif; font-size: 12px; line-height: 1.6; color: #1f2937;">
      <p style="text-align:center;font-size:11px;margin:0 0 4px;">Republic of the Philippines</p>
      <p style="text-align:center;font-weight:bold;margin:0 0 16px;">DEPARTMENT OF SCIENCE AND TECHNOLOGY</p>
      <p style="text-align:center;font-weight:bold;margin:0 0 24px;">AUTHORITY TO WITHDRAW — SETUP FUND (${trancheWord.toUpperCase()} TRANCHE)</p>
      <p><strong>Reference:</strong> ${escapeHtml(ref)}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}</p>
      <p style="margin-top:20px;">To: Land Bank of the Philippines</p>
      <p style="text-align:justify;margin-top:16px;">
        This is to authorize <strong>${escapeHtml(overview.accountHolder)}</strong>, representing
        <strong>${escapeHtml(overview.enterpriseName)}</strong>, to withdraw the ${trancheWord} tranche of SETUP
        project funds from the dedicated savings account for the project titled
        <strong>${escapeHtml(overview.projectTitle)}</strong>, in the amount of
        <strong>${escapeHtml(withdrawAmount)}</strong>
        ${supplierName ? ` for equipment procurement at <strong>${escapeHtml(supplierName)}</strong>` : ""},
        subject to DOST SETUP guidelines and documentary requirements.
      </p>
      <p style="text-align:justify;margin-top:12px;">
        Remaining project balance after this withdrawal: <strong>${escapeHtml(overview.remainingBalance)}</strong>.
      </p>
      <p style="margin-top:48px;font-weight:bold;">DOST SOCCSKSARGEN — SETUP 4.0</p>
      <p style="font-size:10px;color:#6b7280;margin-top:32px;text-align:center;">
        Generated via AiSETUP · Demo document for presentation purposes
      </p>
    </div>
  `;

  printHtmlDocument(
    title,
    html,
    `${a4PageRule(A4_MARGIN_DEFAULT)} body { font-family: Georgia, serif; }`,
  );
}

/** Proposal budget lines not yet assigned to any tranche supplier (by sourceBudgetItemId). */
export function availableProposalBudgetItems(
  applicant: Applicant | null,
  form: LandBankForm,
): ProjectProposalBudgetRow[] {
  const pp = getProjectProposalForm(applicant);
  const used = new Set(
    [
      ...getTrancheEquipment(form.tranches.first),
      ...getTrancheEquipment(form.tranches.second),
      ...getTrancheEquipment(form.tranches.third),
    ]
      .map((r) => r.sourceBudgetItemId)
      .filter(Boolean) as string[],
  );
  return (pp.budgetItems ?? []).filter(
    (b) => b.item.trim() && !used.has(b.id),
  );
}
