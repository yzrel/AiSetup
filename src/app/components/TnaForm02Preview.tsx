/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import type { Tna2DocumentResponse } from "../api/types";
import { PreviewToolbar } from "./PreviewLayout";
import { TnaForm02Document } from "./tnaForm02/TnaForm02Document";
import { printTnaForm02Pdf } from "../utils/tnaForm02Print";
import "../../styles/tnaForm02.css";

interface TnaForm02PreviewProps {
  document: Tna2DocumentResponse;
  applicationId?: string;
  aiGenerated?: boolean;
  published?: boolean;
  onPrint?: () => void;
  compact?: boolean;
}

export function TnaForm02Preview({
  document: doc,
  applicationId,
  aiGenerated,
  published,
  onPrint,
  compact = false,
}: TnaForm02PreviewProps) {
  const appId = applicationId ?? doc.applicationId ?? "—";

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && onPrint && (
        <PreviewToolbar className="justify-end">
          <button
            type="button"
            onClick={onPrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#0C2461] text-white hover:opacity-90"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </PreviewToolbar>
      )}

      <div
        id="tna-form-02-preview"
        className="tna2-form-doc tna2-form-screen-preview bg-white border border-gray-200 rounded-xl overflow-hidden"
      >
        {(aiGenerated !== undefined || published !== undefined) && (
          <div className="px-4 sm:px-6 py-2 border-b border-gray-100 text-xs text-gray-500 print:hidden">
            Document Ref:{" "}
            <span className="font-mono font-semibold text-gray-700">
              {doc.documentRef}
            </span>
            &nbsp;·&nbsp; Application ID:{" "}
            <span className="font-mono font-semibold text-gray-700">{appId}</span>
            {aiGenerated !== undefined && (
              <span className="ml-2">
                {aiGenerated ? "AI-assisted report" : "Template-assisted report"}
                {published ? " · Published to applicant" : " · Draft"}
              </span>
            )}
          </div>
        )}
        <TnaForm02Document document={doc} />
      </div>
    </div>
  );
}

export function printTnaForm02(
  document: Tna2DocumentResponse,
  applicationId?: string,
) {
  printTnaForm02Pdf(document, applicationId);
}
