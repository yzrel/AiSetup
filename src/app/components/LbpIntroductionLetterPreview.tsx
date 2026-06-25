/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import type { LbpIntroductionLetterForm } from "../api/types";
import { PreviewToolbar } from "./PreviewLayout";
import {
  DOST_REGION_12_ADDRESS,
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
        id="lbp-introduction-preview"
        className="print-a4-sheet bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-10 text-gray-800 font-serif"
      >
        <div className="lbp-letterhead text-center mb-6">
          <img
            src="/assets/dost-logo-mark.png"
            alt="DOST"
            className="h-14 mx-auto mb-2"
          />
          <p className="text-xs">Republic of the Philippines</p>
          <p className="text-sm font-bold uppercase tracking-wide">
            Department of Science and Technology
          </p>
          <p className="text-sm font-semibold">{form.regionalOfficeName}</p>
        </div>

        <div className="lbp-date text-sm mb-6">{displayDate}</div>

        <div className="lbp-addressee text-sm mb-4 space-y-0.5">
          <p className="lbp-name font-bold">{form.branchManagerName.toUpperCase()}</p>
          <p>{form.branchManagerTitle}</p>
          <p className="font-medium">Land Bank of the Philippines</p>
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

        <div className="lbp-footer mt-10 pt-3 border-t border-gray-200 text-center text-[9px] text-gray-500 leading-relaxed">
          <p>Postal Address: {DOST_REGION_12_ADDRESS}</p>
          <p>https://region12.dost.gov.ph/ · email: records@region12.dost.gov.ph</p>
          <p>Tel: 083-826-0114 / 083-826-0115</p>
          {applicationId && (
            <p className="mt-1 text-gray-400">Application ID: {applicationId}</p>
          )}
        </div>
      </div>
    </div>
  );
}
