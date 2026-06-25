/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import { PreviewToolbar } from "./PreviewLayout";
import { TnaForm01Document } from "./tnaForm01/TnaForm01Document";
import { printTnaForm01Pdf } from "../utils/tnaForm01Print";

interface TnaForm01PreviewProps {
  applicant: { applicationId?: string } | null;
  form: Record<string, unknown>;
  tables: {
    rawMaterials: string[][];
    production: string[][];
    equipment: string[][];
  };
  aiGenerated?: boolean;
  onPrint?: () => void;
  compact?: boolean;
}

export function TnaForm01Preview({
  applicant,
  form,
  tables,
  aiGenerated,
  onPrint,
  compact = false,
}: TnaForm01PreviewProps) {
  const handlePrint = onPrint ?? (() => printTnaForm01Pdf(applicant?.applicationId));

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && (
        <PreviewToolbar className="justify-between items-start sm:items-center tna-screen-only">
          <p className="text-xs text-gray-500 max-w-md">
            Official DOST TNA Form 01 (Annex B-11) layout. Printed PDF matches the government form
            without portal metadata.
            {aiGenerated !== undefined && (
              <span className="block mt-1 text-gray-400">
                Content: {aiGenerated ? "AI-assisted" : "Template-assisted"}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#0C2461] text-white hover:opacity-90"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </PreviewToolbar>
      )}

      <div
        id="tna-form-01-preview"
        className="tna-form-document overflow-x-auto flex justify-center py-4 px-2 sm:px-4 bg-gray-100 print:bg-white print:py-0 print:px-0"
      >
        <TnaForm01Document form={form} tables={tables} />
      </div>
    </div>
  );
}

export function printTnaForm01(applicationId?: string) {
  printTnaForm01Pdf(applicationId);
}
