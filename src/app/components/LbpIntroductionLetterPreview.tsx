/**
 * Author: Yzrel Jade B. Eborde
 */

import type { LbpIntroductionLetterForm } from "../api/types";
import { DocumentPrintButton } from "./DocumentActionButtons";
import { PreviewToolbar } from "./PreviewLayout";
import {
  DostOfficialLetterheadFooter,
  DostOfficialLetterheadHeader,
} from "./DostOfficialLetterhead";
import {
  buildLbpIntroductionBody,
  formatApprovalDisplayDate,
  managerSalutation,
} from "../utils/lbpIntroductionLetter";

interface LbpIntroductionLetterPreviewProps {
  form: LbpIntroductionLetterForm;
  applicationId?: string;
  onPrint?: () => void;
  compact?: boolean;
  showToolbar?: boolean;
}

export function LbpIntroductionLetterPreview({
  form,
  applicationId,
  onPrint,
  compact,
  showToolbar = true,
}: LbpIntroductionLetterPreviewProps) {
  const paragraphs = buildLbpIntroductionBody(form);
  const displayDate = formatApprovalDisplayDate(form.letterDate);

  return (
    <div className={compact ? "" : "space-y-4"}>
      {showToolbar && onPrint && (
        <PreviewToolbar className="justify-end">
          <DocumentPrintButton onClick={onPrint} />
        </PreviewToolbar>
      )}

      <div
        id="lbp-introduction-preview"
        className="print-a4-sheet bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-10 text-gray-800 font-serif"
      >
        <DostOfficialLetterheadHeader />

        <div className="lbp-date text-sm mb-6">{displayDate}</div>

        <div className="lbp-addressee text-sm mb-4 space-y-0.5">
          <p className="lbp-name font-bold">{form.branchManagerName.toUpperCase()}</p>
          <p>{form.branchManagerTitle}</p>
          <p className="font-medium">Land Bank of the Philippines</p>
          {form.branchAddress?.trim() ? <p>{form.branchAddress}</p> : null}
          <p>{form.landbankBranch}</p>
          <p>{form.branchCityProvince}</p>
        </div>

        <p className="lbp-salutation text-sm mb-4 font-semibold">
          {managerSalutation(form.branchManagerName)}
        </p>

        <p className="text-sm font-semibold mb-4">ISANG MAKA-AGHAM NA UMAGA!</p>

        <div className="lbp-body text-sm space-y-3">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-justify leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        <div className="lbp-closing text-sm mt-8">
          <p>Very truly yours,</p>
          <p className="lbp-sig-name font-bold mt-10">{form.signatoryName}</p>
          <p>{form.signatoryTitle}</p>
          <p className="text-xs mt-1">{form.regionalOfficeName}</p>
        </div>

        <DostOfficialLetterheadFooter applicationId={applicationId} />
      </div>
    </div>
  );
}
