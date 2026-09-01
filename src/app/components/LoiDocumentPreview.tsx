/**
 * Author: Yzrel Jade B. Eborde
 */

import { useRef } from "react";
import { Printer } from "lucide-react";
import type { LoiDocumentResponse } from "../api/types";
import { coerceLoiDocument } from "../utils/loiLetter";
import { PreviewToolbar } from "./PreviewLayout";

interface LoiDocumentPreviewProps {
  document: LoiDocumentResponse;
  applicationId?: string;
  showToolbar?: boolean;
}

export function LoiDocumentPreview({
  document: raw,
  applicationId,
  showToolbar = true,
}: LoiDocumentPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const doc = coerceLoiDocument(raw) ?? raw;

  const letterhead = doc.letterhead ?? {
    enterpriseName: "",
    address: "",
    email: "",
    mobile: "",
    date: "",
  };
  const regional = doc.regionalAddressee ?? { name: "", title: "", lines: [] };
  const thru = doc.thruAddressee ?? { name: "", title: "", lines: [] };
  const signature = doc.signature ?? {
    typedName: "",
    printedName: "",
    designation: "",
    enterpriseName: "",
    dateSigned: "",
  };
  const bodyParagraphs = Array.isArray(doc.bodyParagraphs)
    ? doc.bodyParagraphs
    : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {showToolbar && (
        <PreviewToolbar className="justify-between items-start sm:items-center px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-bold text-gray-700">Letter of Intent — Document Preview</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {!doc.aiGenerated && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                Template draft (AI unavailable)
              </span>
            )}
            {doc.provincialOfficeDefaulted && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                PSTO defaulted to regional
              </span>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Download
            </button>
          </div>
        </PreviewToolbar>
      )}

      <div
        ref={printRef}
        id="loi-document-print"
        className="print-a4-sheet p-4 sm:p-8 md:p-10 space-y-5 text-sm text-gray-800 leading-relaxed font-serif bg-white max-h-[70vh] sm:max-h-[520px] overflow-y-auto print:max-h-none print:overflow-visible print:p-12"
      >
        {/* Enterprise letterhead */}
        <div className="space-y-0.5">
          <p className="font-black text-base uppercase tracking-wide">
            {letterhead.enterpriseName || "—"}
          </p>
          <p>{letterhead.address}</p>
          {letterhead.email && <p>Email: {letterhead.email}</p>}
          {letterhead.mobile && <p>Mobile: {letterhead.mobile}</p>}
          <p className="pt-3">{letterhead.date}</p>
        </div>

        <div className="h-4" />

        {/* Regional addressee */}
        <div className="space-y-0.5">
          {(regional.lines?.length ? regional.lines : [regional.name, regional.title])
            .filter(Boolean)
            .map((line, i) => (
              <p key={`regional-${i}`} className={i === 0 ? "font-semibold" : ""}>
                {line}
              </p>
            ))}
        </div>

        <div className="h-4" />

        {/* THRU provincial office */}
        <div className="space-y-0.5">
          {(thru.lines?.length ? thru.lines : [thru.name, thru.title, thru.officeName])
            .filter(Boolean)
            .map((line, i) => (
              <p key={`thru-${i}`} className={i === 0 ? "font-semibold" : ""}>
                {line}
              </p>
            ))}
        </div>

        <div className="h-4" />

        <p>{doc.salutation}</p>

        {bodyParagraphs.map((paragraph, i) => (
          <p key={`body-${i}`} className="text-justify">
            {paragraph}
          </p>
        ))}

        <p>{doc.closing}</p>

        <div className="mt-8 space-y-1">
          <p className="font-black text-gray-800 border-b border-gray-500 inline-block pr-20 italic pb-1">
            {signature.typedName}
          </p>
          <p className="font-semibold text-gray-800">{signature.printedName}</p>
          <p className="text-gray-600">{signature.designation}</p>
          <p className="text-gray-600">{signature.enterpriseName}</p>
          <p className="text-gray-400 text-xs mt-1">
            Date Signed: {signature.dateSigned}
          </p>
        </div>

        {(applicationId || doc.generatedAt) && (
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 space-y-0.5 print:mt-12">
            {applicationId && <p>Application ID: {applicationId}</p>}
            <p>
              Generated by DOST AiSETUP Portal ·{" "}
              {doc.generatedAt
                ? new Date(doc.generatedAt).toLocaleString("en-PH")
                : "—"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
