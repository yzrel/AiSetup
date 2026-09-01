/**
 * Author: Yzrel Jade B. Eborde
 *
 * On-screen preview mounts RtecReportDocument (100% Word fidelity).
 */

import type { RtecReportForm } from "../api/types";
import { DocumentEditButton, DocumentPrintButton } from "./DocumentActionButtons";
import { PreviewToolbar } from "./PreviewLayout";
import { RtecReportDocument } from "./rtecReport/RtecReportDocument";
import { printRtecReportPdf } from "../utils/rtecReportPrint";

interface RtecReportPreviewProps {
  form: RtecReportForm;
  applicationId?: string;
  applicantId?: string;
  onPrint?: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

export function RtecReportPreview({
  form,
  applicationId,
  applicantId,
  onPrint,
  onEdit,
  compact = false,
}: RtecReportPreviewProps) {
  const handlePrint =
    onPrint ??
    (() => void printRtecReportPdf(form, applicationId, applicantId));

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && (
        <PreviewToolbar className="justify-between items-start sm:items-center rtec-screen-only gap-2">
          <p className="text-xs text-gray-500 max-w-md">
            Official SETUP Form 002 (Annex A-2) layout. Preview matches the printed
            government form exactly.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {onEdit && (
              <DocumentEditButton onClick={onEdit} label="Edit report" />
            )}
            <DocumentPrintButton onClick={handlePrint} />
          </div>
        </PreviewToolbar>
      )}

      <div
        id="rtec-report-preview"
        className="rtec-form-document official-doc-preview-shell overflow-x-auto flex justify-start sm:justify-center py-4 px-2 sm:px-4 bg-gray-100 print:bg-white print:py-0 print:px-0"
      >
        <RtecReportDocument form={form} applicantId={applicantId} />
      </div>
    </div>
  );
}

export function printRtecReport(
  form: RtecReportForm,
  applicationId?: string,
  applicantId?: string,
) {
  return printRtecReportPdf(form, applicationId, applicantId);
}
