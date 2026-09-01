/**
 * Author: Yzrel Jade B. Eborde
 *
 * On-screen preview mounts InventoryOfEquipmentDocument (100% Word fidelity).
 */

import type { ProjectCloseOutForm } from "../api/types";
import { DocumentPrintButton } from "./DocumentActionButtons";
import { PreviewToolbar } from "./PreviewLayout";
import { InventoryOfEquipmentDocument } from "./inventoryOfEquipment/InventoryOfEquipmentDocument";
import {
  printInventoryOfEquipmentPdf,
  type PrintInventoryOfEquipmentOptions,
} from "../utils/inventoryOfEquipmentPrint";

interface InventoryOfEquipmentPreviewProps {
  form: ProjectCloseOutForm;
  applicationId?: string;
  onPrint?: () => void;
  compact?: boolean;
}

export function InventoryOfEquipmentPreview({
  form,
  applicationId,
  onPrint,
  compact = false,
}: InventoryOfEquipmentPreviewProps) {
  const handlePrint =
    onPrint ??
    (() =>
      void printInventoryOfEquipmentPdf({
        form,
        applicationId,
      }));

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && (
        <PreviewToolbar className="justify-between items-start sm:items-center ioe-screen-only">
          <p className="text-xs text-gray-500 max-w-md">
            Official SETUP Form 006 (Annex A-6) layout. Preview matches the printed government
            form exactly.
          </p>
          <DocumentPrintButton onClick={handlePrint} />
        </PreviewToolbar>
      )}

      <div
        id="inventory-of-equipment-preview"
        className="ioe-form-document official-doc-preview-shell overflow-x-auto flex justify-start sm:justify-center py-4 px-2 sm:px-4 bg-gray-100 print:bg-white print:py-0 print:px-0"
      >
        <InventoryOfEquipmentDocument form={form} />
      </div>
    </div>
  );
}

export function printInventoryOfEquipment(options: PrintInventoryOfEquipmentOptions) {
  return printInventoryOfEquipmentPdf(options);
}
