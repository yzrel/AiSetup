/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import type { UntagLetterForm } from "../api/types";
import { PreviewToolbar } from "./PreviewLayout";
import {
  DostOfficialLetterheadFooter,
  DostOfficialLetterheadHeader,
} from "./DostOfficialLetterhead";
import {
  buildUntagLetterBody,
  formatApprovalDisplayDate,
  managerSalutation,
} from "../utils/untagLetter";

interface UntagLetterPreviewProps {
  form: UntagLetterForm;
  applicationId?: string;
  onPrint?: () => void;
  compact?: boolean;
  showToolbar?: boolean;
}

export function UntagLetterPreview({
  form,
  applicationId,
  onPrint,
  compact,
  showToolbar = true,
}: UntagLetterPreviewProps) {
  const paragraphs = buildUntagLetterBody(form);
  const displayDate = formatApprovalDisplayDate(form.letterDate);

  return (
    <div className={compact ? "" : "space-y-4"}>
      {showToolbar && onPrint && (
        <PreviewToolbar className="justify-end">
          <button
            type="button"
            onClick={onPrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#0C2461] text-white hover:opacity-90"
          >
            <Printer className="w-4 h-4" />
            Download PDF
          </button>
        </PreviewToolbar>
      )}

      <div
        id="untag-letter-preview"
        className="print-a4-sheet bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-10 text-gray-800 font-serif"
      >
        <DostOfficialLetterheadHeader />

        <div className="untag-date text-sm mb-6">{displayDate}</div>

        <div className="untag-addressee text-sm mb-4 space-y-0.5">
          <p className="untag-name font-bold">
            {form.branchManagerName.toUpperCase()}
          </p>
          <p>{form.branchManagerTitle}</p>
          <p className="font-medium">Land Bank of the Philippines</p>
          <p>{form.landbankBranch}</p>
          <p>{form.branchCityProvince}</p>
        </div>

        <p className="untag-salutation text-sm mb-4 font-semibold">
          {managerSalutation(form.branchManagerName)}
        </p>

        <p className="untag-greeting text-sm font-semibold mb-4">
          Isang maka-agham na araw!
        </p>

        <div className="untag-body text-sm space-y-3">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-justify leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        <div className="untag-closing text-sm mt-8">
          <p>Very truly yours,</p>
          <p className="untag-sig-name font-bold mt-10">{form.signatoryName}</p>
          <p>{form.signatoryTitle}</p>
          <p className="text-xs mt-1">{form.regionalOfficeName}</p>
        </div>

        <DostOfficialLetterheadFooter applicationId={applicationId} />
      </div>
    </div>
  );
}
