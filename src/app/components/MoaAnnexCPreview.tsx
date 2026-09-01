/**
 * Author: Yzrel Jade B. Eborde
 *
 * On-screen preview mounts MoaAnnexCDocument (100% Word fidelity).
 */

import type { Applicant } from "../store/applicantStore";
import type { MoaAnnexCForm } from "../api/types";
import { buildMoaAnnexPacketContext } from "../utils/moaAnnexPacket";
import { DocumentEditButton, DocumentPrintButton } from "./DocumentActionButtons";
import { PreviewToolbar } from "./PreviewLayout";
import { MoaAnnexCDocument } from "./moaAnnexC/MoaAnnexCDocument";
import { printMoaAnnexCPdf } from "../utils/moaAnnexCPrint";

interface MoaAnnexCPreviewProps {
  form: MoaAnnexCForm;
  applicant?: Applicant | null;
  applicationId?: string;
  onPrint?: () => void;
  onEdit?: () => void;
  compact?: boolean;
  /** When false, toolbar actions are provided by the host screen (e.g. Approval Letter step). */
  showToolbar?: boolean;
}

export function MoaAnnexCPreview({
  form,
  applicant = null,
  applicationId,
  onPrint,
  onEdit,
  compact = false,
  showToolbar = true,
}: MoaAnnexCPreviewProps) {
  const packet = buildMoaAnnexPacketContext(applicant, form);
  const handlePrint =
    onPrint ?? (() => void printMoaAnnexCPdf(form, applicationId, applicant));

  return (
    <div className={compact ? "" : "space-y-4"}>
      {showToolbar && !compact && (
        <PreviewToolbar className="justify-between items-start sm:items-center moa-screen-only gap-2">
          <p className="text-xs text-gray-500 max-w-md">
            Official Proforma MOA (Annex C) layout. Preview matches the printed
            government form.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {onEdit && <DocumentEditButton onClick={onEdit} label="Edit MOA" />}
            <DocumentPrintButton onClick={handlePrint} />
          </div>
        </PreviewToolbar>
      )}

      <div
        id="moa-annex-c-preview"
        className="moa-form-document official-doc-preview-shell overflow-x-auto flex justify-start sm:justify-center py-4 px-2 sm:px-4 bg-gray-100 print:bg-white print:py-0 print:px-0"
      >
        <MoaAnnexCDocument form={form} packet={packet} />
      </div>
    </div>
  );
}

export function printMoaAnnexC(
  form: MoaAnnexCForm,
  applicationId?: string,
  applicant?: Applicant | null,
) {
  return printMoaAnnexCPdf(form, applicationId, applicant);
}
