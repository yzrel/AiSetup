/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ApprovalLetterForm } from "../api/types";
import { DocumentPrintButton } from "./DocumentActionButtons";
import { PreviewToolbar } from "./PreviewLayout";
import {
  DostOfficialLetterheadFooter,
  DostOfficialLetterheadHeader,
} from "./DostOfficialLetterhead";
import {
  buildApprovalLetterBody,
  formatApprovalDisplayDate,
  printApprovalLetter,
} from "../utils/approvalLetter";

interface ApprovalLetterPreviewProps {
  form: ApprovalLetterForm;
  applicationId?: string;
  onPrint?: () => void;
  compact?: boolean;
  showToolbar?: boolean;
}

export function ApprovalLetterPreview({
  form,
  applicationId,
  onPrint,
  compact,
  showToolbar = true,
}: ApprovalLetterPreviewProps) {
  const paragraphs = buildApprovalLetterBody(form);
  const displayDate = formatApprovalDisplayDate(form.approvalDate);
  const handlePrint = onPrint ?? (() => printApprovalLetter(applicationId));

  return (
    <div className={compact ? "" : "space-y-4"}>
      {showToolbar && !compact && (
        <PreviewToolbar className="justify-end">
          <DocumentPrintButton onClick={handlePrint} />
        </PreviewToolbar>
      )}

      <div
        id="approval-letter-preview"
        className="print-a4-sheet bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-10 text-gray-800 font-serif"
      >
        <DostOfficialLetterheadHeader formTitle="Approval Letter" />

        {/* Series + date */}
        <div className="al-meta text-right text-sm mb-6">
          <p>Series of {form.seriesYear}</p>
          <p>{displayDate}</p>
        </div>

        {/* Addressee */}
        <div className="al-addressee text-sm mb-5 space-y-0.5">
          <p className="al-name font-bold">{form.recipientName}</p>
          <p>{form.recipientDesignation}</p>
          <p className="font-medium">{form.enterpriseName}</p>
          <p className="whitespace-pre-wrap text-gray-700">{form.enterpriseAddress}</p>
        </div>

        {/* Reference */}
        <div className="al-ref text-sm mb-5 space-y-1">
          <p>
            <span className="font-semibold">Project Title:</span> {form.projectTitle}
          </p>
          <p>
            <span className="font-semibold">Ref. No.:</span> {form.referenceNumber}
          </p>
        </div>

        {/* Body */}
        <div className="al-body text-sm space-y-3">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-justify leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Closing + signature */}
        <div className="al-closing text-sm mt-8">
          <p>Very truly yours,</p>
          <p className="al-sig-name font-bold mt-10">{form.signatoryName}</p>
          <p>{form.signatoryTitle}</p>
        </div>

        {/* Conforme */}
        <div className="al-conforme text-sm mt-10 pt-6 border-t border-gray-200">
          <p className="font-semibold mb-2">Conforme:</p>
          {form.conformeSignedName ? (
            <>
              <p className="al-ack-name font-semibold border-b border-gray-400 inline-block pr-16 pb-1">
                {form.conformeSignedName}
              </p>
              {form.acknowledgedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Acknowledged on {formatApprovalDisplayDate(form.acknowledgedAt)}
                </p>
              )}
            </>
          ) : (
            <div className="al-sig-line border-b border-gray-400 max-w-xs min-h-8 mb-2" />
          )}
          <p className="text-justify text-xs text-gray-700 mt-3 leading-relaxed">
            I hereby acknowledge receipt of this Notice of Approval and agree to comply
            with the conditions stated herein within {form.conformeDeadlineDays} days from
            receipt of this letter.
          </p>
        </div>

        <DostOfficialLetterheadFooter applicationId={applicationId} />
      </div>
    </div>
  );
}
