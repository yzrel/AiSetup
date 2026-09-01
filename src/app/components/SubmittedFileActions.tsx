/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import { Download, Eye, X } from "lucide-react";
import { ACTION_ROW } from "./moduleTheme";
import { useStoredFileSrc } from "../utils/storedFilePreview";
import { isImageFile, isPdfFile } from "../utils/storedFilePreview";

export interface SubmittedFileActionsProps {
  fileName: string;
  mimeType?: string;
  dataUrl?: string;
  fileId?: string;
  applicantId?: string;
  compact?: boolean;
}

export function SubmittedFileActions({
  fileName,
  mimeType,
  dataUrl,
  fileId,
  applicantId,
  compact,
}: SubmittedFileActionsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const { src, loading } = useStoredFileSrc(applicantId, {
    dataUrl,
    fileId,
    fileName,
  });
  const viewable = Boolean(
    src || dataUrl || (applicantId && (fileId || fileName)),
  );

  if (!viewable && !loading) {
    return (
      <span
        className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg"
        title="Only the filename was saved. Ask the cooperator to re-upload for preview."
      >
        Content unavailable
      </span>
    );
  }

  const btnClass = compact
    ? "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 text-[#0C2461] hover:bg-blue-50"
    : "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-[#0C2461] hover:bg-blue-50";

  const href = src ?? dataUrl;

  return (
    <>
      <div className={`${ACTION_ROW} flex-shrink-0`}>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          disabled={loading && !href}
          className={btnClass}
        >
          <Eye className="w-3.5 h-3.5" />
          {loading && !href ? "Loading…" : "View"}
        </button>
        {href ? (
          <a href={href} download={fileName} className={btnClass}>
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        ) : null}
      </div>

      {previewOpen && href && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800 truncate pr-4">{fileName}</p>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={href}
                  download={fileName}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0C2461] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 min-h-[200px]">
              {isPdfFile(mimeType, fileName) ? (
                <iframe
                  src={href}
                  title={fileName}
                  className="w-full h-[70vh] border border-gray-200 rounded-lg bg-white"
                />
              ) : isImageFile(mimeType, fileName) ? (
                <img
                  src={href}
                  alt={fileName}
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg border border-gray-200"
                />
              ) : (
                <div className="text-center py-12 text-sm text-gray-600">
                  <p className="mb-3">Preview is not available for this file type.</p>
                  <a
                    href={href}
                    download={fileName}
                    className="inline-flex items-center gap-2 text-[#0C2461] font-semibold hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    Download {fileName}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
