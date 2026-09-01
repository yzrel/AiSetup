/**
 * Author: Yzrel Jade B. Eborde
 *
 * Letter Request for Withdrawal (1st / 2nd / 3rd tranche) — printable HTML matching
 * the DOST SETUP letter-request template (equipment list + supplier + total).
 */

import type { Applicant } from "../store/applicantStore";
import type {
  WithdrawalEquipmentRow,
  WithdrawalLetterDraft,
  WithdrawalSupplierBlock,
  WithdrawalTrancheNum,
  WithdrawalTranchePackage,
} from "../api/types";
import {
  DOST_REGION_12_ADDRESS,
  DOST_REGION_12_DIRECTOR_NAME,
  DOST_REGION_12_OFFICE,
} from "../constants/region12";
import { getProjectProposalForm } from "./projectProposal";
import { getApprovalLetterForm } from "./approvalLetter";
import { a4PageRule, A4_MARGIN_LETTER } from "./printPage";
import { printHtmlDocument } from "./printHtml";

function resolveSelectedSupplier(
  pkg: WithdrawalTranchePackage,
): WithdrawalSupplierBlock | null {
  if (!pkg.suppliers?.length) return null;
  if (pkg.selectedSupplierId) {
    const found = pkg.suppliers.find((s) => s.id === pkg.selectedSupplierId);
    if (found) return found;
  }
  return pkg.suppliers.find((s) => s.name.trim()) ?? pkg.suppliers[0] ?? null;
}

function resolveTrancheSupplierName(pkg: WithdrawalTranchePackage): string {
  return resolveSelectedSupplier(pkg)?.name.trim() ?? "";
}

const DEFAULT_OFFICE_LINES = [
  DOST_REGION_12_OFFICE.toUpperCase().replace("NO.", "NO."),
  "DOST XII-PNHLSC, Paraiso, Koronadal City",
];

function formatPesoDisplay(amount: string | number): string {
  const num =
    typeof amount === "number"
      ? amount
      : parseFloat(String(amount).replace(/[^\d.]/g, "")) || 0;
  return num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function emptyWithdrawalLetterDraft(
  applicant: Applicant | null,
  supplierName = "",
): WithdrawalLetterDraft {
  const pp = getProjectProposalForm(applicant);
  const approval = getApprovalLetterForm(applicant);
  const today = new Date().toLocaleDateString("en-PH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return {
    letterDate: today,
    addresseeName: `ENGR. ${DOST_REGION_12_DIRECTOR_NAME}`,
    addresseeTitle: "Regional Director",
    officeLines: [
      "Department of Science and Technology",
      "REGIONAL OFFICE NO. XII",
      DEFAULT_OFFICE_LINES[1] ?? DOST_REGION_12_ADDRESS,
    ],
    firmName:
      pp.firmName || applicant?.enterpriseName || approval.enterpriseName || "",
    ownerName:
      pp.proponentName ||
      approval.recipientName ||
      applicant?.applicantName ||
      "",
    ownerDesignation: "Owner",
    supplierName,
  };
}

export function sumWithdrawalEquipment(rows: WithdrawalEquipmentRow[]): number {
  return rows.reduce((sum, row) => {
    const n = parseFloat(String(row.amount).replace(/[^\d.]/g, "")) || 0;
    return sum + n;
  }, 0);
}

export function formatWithdrawalPhp(amount: string | number): string {
  const num =
    typeof amount === "number"
      ? amount
      : parseFloat(String(amount).replace(/[^\d.]/g, "")) || 0;
  return `Php ${formatPesoDisplay(num)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function trancheLabel(tranche: WithdrawalTrancheNum): string {
  if (tranche === 1) return "first";
  if (tranche === 2) return "second";
  return "third";
}

export function buildWithdrawalRequestLetterHtml(
  draft: WithdrawalLetterDraft,
  pkg: WithdrawalTranchePackage,
  supplier?: WithdrawalSupplierBlock | null,
): string {
  const selected = supplier ?? resolveSelectedSupplier(pkg);
  const equipment = selected?.equipment ?? [];
  const firm = escapeHtml(draft.firmName.trim() || "—");
  const supplierName = escapeHtml(
    (draft.supplierName || selected?.name || resolveTrancheSupplierName(pkg)).trim() || "—",
  );
  const total = sumWithdrawalEquipment(equipment);
  const equipmentLines = equipment
    .filter((r) => r.item.trim() || r.amount.trim())
    .map((r) => {
      const item = escapeHtml(r.item.trim() || "—");
      const amt = formatWithdrawalPhp(r.amount);
      return `<li style="margin:4px 0; display:flex; justify-content:space-between; gap:24px;">
        <span>${item}</span>
        <span style="white-space:nowrap;">${amt}</span>
      </li>`;
    })
    .join("");

  const officeBlock = [
    escapeHtml(draft.addresseeName),
    escapeHtml(draft.addresseeTitle),
    ...draft.officeLines.map((l) => escapeHtml(l)),
  ]
    .filter(Boolean)
    .map((l) => `<div>${l}</div>`)
    .join("");

  const thankLead =
    "Once again, we thank you for the opportunity you have given";

  return `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #111; max-width: 700px;">
      <p style="margin:0 0 24px;">${escapeHtml(draft.letterDate)}</p>
      <div style="margin:0 0 20px; line-height:1.35;">
        ${officeBlock}
      </div>
      <p style="margin:0 0 16px;">SIR:</p>
      <p style="text-align:justify; margin:0 0 14px; text-indent:36px;">
        ${thankLead} <strong>${firm}</strong> as one
        of the DOST XII firm-beneficiaries under Small Enterprise Technology Upgrading Program
        (SETUP).
      </p>
      <p style="text-align:justify; margin:0 0 14px; text-indent:36px;">
        We would like to immediately commence upgrading of our production. In this connection, may
        we request for the release of the <strong>${trancheLabel(pkg.tranche)} tranche</strong> of
        DOST-SETUP assistance for the purchase of the following equipment at
        <strong>${supplierName}</strong>.
      </p>
      <ul style="margin:8px 0 8px 28px; padding:0; list-style:disc;">
        ${equipmentLines || "<li>—</li>"}
      </ul>
      <p style="margin:8px 0 16px 28px; display:flex; justify-content:space-between; gap:24px;">
        <span><strong>Total =</strong></span>
        <span style="white-space:nowrap;"><strong>${formatWithdrawalPhp(total)}</strong></span>
      </p>
      <p style="text-align:justify; margin:0 0 14px; text-indent:36px;">
        Please find attached copy of canvass of equipment for reference.
      </p>
      <p style="margin:0 0 28px;">Thank you.</p>
      <p style="margin:0 0 56px;">Very truly yours,</p>
      <p style="margin:0; font-weight:bold;">${escapeHtml(draft.ownerName.trim() || "—")}</p>
      <p style="margin:0;">${escapeHtml(draft.ownerDesignation.trim() || "Owner")}</p>
      <p style="margin:0;">${firm}</p>
    </div>
  `;
}

export function validateWithdrawalLetterGenerate(
  pkg: WithdrawalTranchePackage,
  draft: WithdrawalLetterDraft,
): string[] {
  const errors: string[] = [];
  const selected = resolveSelectedSupplier(pkg);
  if (!draft.firmName.trim()) errors.push("Enterprise / firm name is required.");
  const supplierName = (draft.supplierName || selected?.name || resolveTrancheSupplierName(pkg)).trim();
  if (!supplierName) {
    errors.push("Supplier name is required.");
  }
  const rows = (selected?.equipment ?? []).filter((r) => r.item.trim() || r.amount.trim());
  if (rows.length === 0) errors.push("Add at least one equipment item.");
  for (const row of rows) {
    if (!row.item.trim()) errors.push("Each equipment row needs an item name.");
    if (!row.amount.trim()) errors.push(`Amount is required for "${row.item || "item"}".`);
  }
  return [...new Set(errors)];
}

export function downloadWithdrawalRequestLetterPdf(
  draft: WithdrawalLetterDraft,
  pkg: WithdrawalTranchePackage,
  applicationId?: string,
  supplier?: WithdrawalSupplierBlock | null,
): void {
  const selected = supplier ?? resolveSelectedSupplier(pkg);
  const title = `Letter-Request-Withdrawal-T${pkg.tranche}-${applicationId || "SETUP"}`;
  const html = buildWithdrawalRequestLetterHtml(draft, pkg, selected);
  printHtmlDocument(
    title,
    html,
    `${a4PageRule(A4_MARGIN_LETTER)} body { font-family: 'Times New Roman', Times, serif; }`,
  );
}
