/**
 * Author: Yzrel Jade B. Eborde
 *
 * Inline preview for uploaded attachments (images, PDFs, other docs).
 */

import { StoredFileImage } from "./StoredFilePreview";
import { SubmittedFileActions } from "./SubmittedFileActions";
import { isImageFile, isPdfFile, useStoredFileSrc } from "../utils/storedFilePreview";

export interface InlineAttachmentPreviewProps {
  fileName: string;
  dataUrl?: string;
  fileId?: string;
  mimeType?: string;
  applicantId?: string;
  moduleKey?: string;
  alt?: string;
  /** Tailwind max-height class for image thumbnails. */
  imageClassName?: string;
  /** Tailwind height class for PDF iframe. */
  pdfHeightClassName?: string;
}

export function InlineAttachmentPreview({
  fileName,
  dataUrl,
  fileId,
  mimeType,
  applicantId,
  moduleKey,
  alt,
  imageClassName = "max-h-40 mx-auto rounded border border-gray-200",
  pdfHeightClassName = "h-48",
}: InlineAttachmentPreviewProps) {
  const fileRef = {
    dataUrl,
    fileId,
    fileName,
    mimeType,
    moduleKey,
  };
  const { src, loading } = useStoredFileSrc(applicantId, fileRef);
  const isImage = isImageFile(mimeType, fileName, dataUrl);
  const isPdf = isPdfFile(mimeType, fileName, dataUrl);

  if (!fileName) return null;

  if (isImage) {
    return (
      <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
        <StoredFileImage
          applicantId={applicantId}
          file={fileRef}
          alt={alt ?? fileName}
          className={imageClassName}
          loadingClassName="text-xs text-gray-400 py-4"
        />
        <SubmittedFileActions
          fileName={fileName}
          mimeType={mimeType}
          dataUrl={dataUrl}
          fileId={fileId}
          applicantId={applicantId}
          compact
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
        {loading && !src && !dataUrl ? (
          <p className="text-xs text-gray-400 py-2">Loading preview…</p>
        ) : src || dataUrl ? (
          <iframe
            src={src ?? dataUrl}
            title={alt ?? fileName}
            className={`w-full ${pdfHeightClassName} border border-gray-200 rounded-lg bg-white`}
          />
        ) : null}
        <SubmittedFileActions
          fileName={fileName}
          mimeType={mimeType}
          dataUrl={dataUrl}
          fileId={fileId}
          applicantId={applicantId}
          compact
        />
      </div>
    );
  }

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      <SubmittedFileActions
        fileName={fileName}
        mimeType={mimeType}
        dataUrl={dataUrl}
        fileId={fileId}
        applicantId={applicantId}
        compact
      />
    </div>
  );
}
