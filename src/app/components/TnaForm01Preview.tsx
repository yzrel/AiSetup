/**
 * Author: Yzrel Jade B. Eborde
 */

import { DocumentPrintButton } from "./DocumentActionButtons";
import { PreviewToolbar } from "./PreviewLayout";
import { TnaForm01Document } from "./tnaForm01/TnaForm01Document";
import {
  printTnaForm01Pdf,
  type PrintTnaForm01Options,
} from "../utils/tnaForm01Print";

interface TnaForm01PreviewProps {
  applicant: { id?: string; applicationId?: string } | null;
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
  const handlePrint =
    onPrint ??
    (() =>
      void printTnaForm01Pdf({
        form,
        tables,
        applicantId: applicant?.id,
        applicationId: applicant?.applicationId,
      }));

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && (
        <PreviewToolbar className="justify-between items-start sm:items-center tna-screen-only">
          <p className="text-xs text-gray-500 max-w-md">
            Official DOST TNA Form 01 (Annex 1-1) layout. Printed PDF matches the government form
            without portal metadata.
            {aiGenerated !== undefined && (
              <span className="block mt-1 text-gray-400">
                Content: {aiGenerated ? "AI-assisted" : "Template-assisted"}
              </span>
            )}
          </p>
          <DocumentPrintButton onClick={handlePrint} />
        </PreviewToolbar>
      )}

      <div
        id="tna-form-01-preview"
        className="tna-form-document official-doc-preview-shell overflow-x-auto flex justify-start sm:justify-center py-4 px-2 sm:px-4 bg-gray-100 print:bg-white print:py-0 print:px-0"
      >
        <TnaForm01Document
          form={form}
          tables={tables}
          applicantId={applicant?.id}
        />
      </div>
    </div>
  );
}

export function printTnaForm01(options: PrintTnaForm01Options) {
  return printTnaForm01Pdf(options);
}
