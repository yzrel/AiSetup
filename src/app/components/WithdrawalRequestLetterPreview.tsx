/**
 * Author: Yzrel Jade B. Eborde
 *
 * On-screen preview for Letter Request for Withdrawal (mirrors print layout).
 */

import type {
  WithdrawalLetterDraft,
  WithdrawalSupplierBlock,
  WithdrawalTranchePackage,
} from "../api/types";
import { DocumentPrintButton } from "./DocumentActionButtons";
import { PreviewToolbar } from "./PreviewLayout";
import {
  formatWithdrawalPhp,
  sumWithdrawalEquipment,
  trancheLabel,
} from "../utils/withdrawalRequestLetter";

interface WithdrawalRequestLetterPreviewProps {
  draft: WithdrawalLetterDraft;
  pkg: WithdrawalTranchePackage;
  selectedSupplier: WithdrawalSupplierBlock | null;
  applicationId?: string;
  onPrint?: () => void;
  compact?: boolean;
  showToolbar?: boolean;
}

export function WithdrawalRequestLetterPreview({
  draft,
  pkg,
  selectedSupplier,
  applicationId,
  onPrint,
  compact,
  showToolbar = true,
}: WithdrawalRequestLetterPreviewProps) {
  const equipment = selectedSupplier?.equipment ?? [];
  const supplierName =
    (draft.supplierName || selectedSupplier?.name || "").trim() || "—";
  const total = sumWithdrawalEquipment(equipment);
  const firm = draft.firmName.trim() || "—";
  const rows = equipment.filter((r) => r.item.trim() || r.amount.trim());

  return (
    <div className={compact ? "" : "space-y-4"}>
      {showToolbar && onPrint && (
        <PreviewToolbar className="justify-end">
          <DocumentPrintButton onClick={onPrint} />
        </PreviewToolbar>
      )}

      <div
        id="withdrawal-request-preview"
        className="print-a4-sheet bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-10 text-gray-900 font-serif text-sm leading-relaxed"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        <p className="mb-6">{draft.letterDate}</p>

        <div className="mb-5 space-y-0.5">
          <p className="font-semibold">{draft.addresseeName}</p>
          <p>{draft.addresseeTitle}</p>
          {draft.officeLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <p className="mb-4 font-semibold">SIR:</p>

        <p className="text-justify mb-3.5 indent-8">
          Once again, we thank you for the opportunity you have given{" "}
          <strong>{firm}</strong> as one of the DOST XII firm-beneficiaries under
          Small Enterprise Technology Upgrading Program (SETUP).
        </p>

        <p className="text-justify mb-3.5 indent-8">
          We would like to immediately commence upgrading of our production. In this
          connection, may we request for the release of the{" "}
          <strong>{trancheLabel(pkg.tranche)} tranche</strong> of DOST-SETUP
          assistance for the purchase of the following equipment at{" "}
          <strong>{supplierName}</strong>.
        </p>

        <ul className="list-disc ml-7 mb-2 space-y-1">
          {rows.length === 0 ? (
            <li>—</li>
          ) : (
            rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap justify-between gap-x-6 gap-y-0.5"
              >
                <span>{row.item.trim() || "—"}</span>
                <span className="whitespace-nowrap">{formatWithdrawalPhp(row.amount)}</span>
              </li>
            ))
          )}
        </ul>

        <p className="flex justify-between gap-6 ml-7 mb-4 font-semibold">
          <span>Total =</span>
          <span className="whitespace-nowrap">{formatWithdrawalPhp(total)}</span>
        </p>

        <p className="text-justify mb-3.5 indent-8">
          Please find attached copy of canvass of equipment for reference.
        </p>

        <p className="mb-7">Thank you.</p>
        <p className="mb-14">Very truly yours,</p>

        <p className="font-bold">{draft.ownerName.trim() || "—"}</p>
        <p>{draft.ownerDesignation.trim() || "Owner"}</p>
        <p>{firm}</p>

        {applicationId && (
          <p className="mt-8 text-[10px] text-gray-400">Application ID: {applicationId}</p>
        )}
      </div>
    </div>
  );
}
