/**
 * Author: Yzrel Jade B. Eborde
 *
 * On-screen preview mounts PropertyTransferReceiptDocument (100% Word fidelity).
 * Responsive: horizontal scroll shell on narrow viewports.
 */

import type { ProjectCloseOutForm } from "../api/types";
import { DocumentPrintButton } from "./DocumentActionButtons";
import { PreviewToolbar } from "./PreviewLayout";
import { PropertyTransferReceiptDocument } from "./propertyTransferReceipt/PropertyTransferReceiptDocument";
import {
  printPropertyTransferReceiptPdf,
  type PrintPropertyTransferReceiptOptions,
} from "../utils/propertyTransferReceiptPrint";

interface PropertyTransferReceiptPreviewProps {
  form: ProjectCloseOutForm;
  applicationId?: string;
  onPrint?: () => void;
  compact?: boolean;
}

export function PropertyTransferReceiptPreview({
  form,
  applicationId,
  onPrint,
  compact = false,
}: PropertyTransferReceiptPreviewProps) {
  const handlePrint =
    onPrint ??
    (() =>
      void printPropertyTransferReceiptPdf({
        form,
        applicationId,
      }));

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && (
        <PreviewToolbar className="justify-between items-start sm:items-center ptr-screen-only flex-col sm:flex-row gap-2">
          <p className="text-xs text-gray-500 max-w-md">
            Official SETUP Form 005 (Annex A-5) layout. Preview matches the printed government
            form exactly. Scroll horizontally on small screens to view the full sheet.
          </p>
          <DocumentPrintButton onClick={handlePrint} className="w-full sm:w-auto" />
        </PreviewToolbar>
      )}

      <div
        id="property-transfer-receipt-preview"
        className="ptr-form-document official-doc-preview-shell overflow-x-auto flex justify-start sm:justify-center py-4 px-2 sm:px-4 bg-gray-100 print:bg-white print:py-0 print:px-0"
      >
        <PropertyTransferReceiptDocument form={form} />
      </div>
    </div>
  );
}

export function printPropertyTransferReceipt(options: PrintPropertyTransferReceiptOptions) {
  return printPropertyTransferReceiptPdf(options);
}
