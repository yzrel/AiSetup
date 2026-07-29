/**
 * Author: Yzrel Jade B. Eborde
 */

import { useRef, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { api } from "../api/client";
import { readAndUploadModuleDocument } from "../utils/readFileAsDataUrl";
import { isImageFile, isPdfFile, useStoredFileSrc } from "../utils/storedFilePreview";
import { StoredFileImage } from "./StoredFilePreview";
import { FORM_GRID_2, ACTION_ROW } from "./moduleTheme";

const MAX_BYTES = 15 * 1024 * 1024;

export interface SignedDocumentValue {
  fileName: string;
  mimeType: string;
  /** Session preview; omitted from backend blob sync. */
  dataUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  fileId?: string;
  /** Set when dataUrl was stripped for sync but bytes live in file_uploads. */
  hasFileContent?: boolean;
}

interface SignedDocumentUploadProps {
  label: string;
  document: SignedDocumentValue | null;
  signedDate: string;
  onSignedDateChange: (date: string) => void;
  venue?: string;
  onVenueChange?: (venue: string) => void;
  notes?: string;
  onNotesChange?: (notes: string) => void;
  onUpload: (doc: SignedDocumentValue) => void;
  onRemove: () => void;
  uploadedBy: string;
  readOnly?: boolean;
  staffOnly?: boolean;
  dateLabel?: string;
  showVenue?: boolean;
  /** When set, uploads are also mirrored into the backend file store. */
  applicantId?: string;
  moduleKey?: string;
}

async function downloadStoredFile(
  applicantId: string,
  fileId: string,
  fallbackName: string,
): Promise<void> {
  const { blob, fileName } = await api.downloadApplicantFile(applicantId, fileId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || fallbackName;
  a.click();
  URL.revokeObjectURL(url);
}

function hasStoredFile(document: SignedDocumentValue | null): boolean {
  if (!document) return false;
  return Boolean(
    document.dataUrl ||
      document.fileId ||
      document.hasFileContent ||
      document.fileName,
  );
}

function SignedFilePreview({
  document,
  applicantId,
  label,
}: {
  document: SignedDocumentValue;
  applicantId?: string;
  label: string;
}) {
  const { src } = useStoredFileSrc(applicantId, document);
  const isImage = isImageFile(document.mimeType, document.fileName, document.dataUrl);
  const isPdf = isPdfFile(document.mimeType, document.fileName, document.dataUrl);

  if (isImage) {
    return (
      <StoredFileImage
        applicantId={applicantId}
        file={document}
        alt={label}
        className="max-h-48 mx-auto rounded border border-gray-200"
      />
    );
  }
  if (isPdf && src) {
    return (
      <iframe
        src={src}
        title={label}
        className="w-full h-64 border border-gray-200 rounded-lg"
      />
    );
  }
  if (!document.dataUrl && document.fileId && !src) {
    return (
      <p className="text-xs text-gray-500">
        Preview loading from the server file store…
      </p>
    );
  }
  return null;
}

export function SignedDocumentUpload({
  label,
  document,
  signedDate,
  onSignedDateChange,
  venue,
  onVenueChange,
  notes,
  onNotesChange,
  onUpload,
  onRemove,
  uploadedBy,
  readOnly,
  staffOnly,
  dateLabel = "Signed date",
  showVenue,
  applicantId,
  moduleKey,
}: SignedDocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      alert("File must be under 15 MB.");
      return;
    }
    try {
      const doc = await readAndUploadModuleDocument(file, uploadedBy, {
        applicantId,
        moduleKey: moduleKey ?? "general",
      });
      onUpload({
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        dataUrl: doc.dataUrl,
        uploadedAt: doc.uploadedAt,
        uploadedBy: doc.uploadedBy,
        fileId: doc.fileId,
        hasFileContent: Boolean(doc.fileId || doc.dataUrl),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    if (document.dataUrl) {
      const a = window.document.createElement("a");
      a.href = document.dataUrl;
      a.download = document.fileName;
      a.click();
      return;
    }
    if (!applicantId || !document.fileId) {
      alert("File is stored on the server but preview is unavailable in this session.");
      return;
    }
    setDownloadBusy(true);
    try {
      await downloadStoredFile(applicantId, document.fileId, document.fileName);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadBusy(false);
    }
  };

  if (readOnly) {
    if (!hasStoredFile(document) && !signedDate && !venue && !notes) {
      return (
        <p className="text-sm text-gray-500 italic">No {label.toLowerCase()} uploaded yet.</p>
      );
    }
    return (
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FileText className="w-4 h-4 text-[#0C2461]" />
          {label}
        </div>
        {hasStoredFile(document) && (
          <>
            <p className="text-sm text-gray-600">
              {document!.fileName} · {new Date(document!.uploadedAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500">
              Uploaded by DOST staff ({document!.uploadedBy})
            </p>
          </>
        )}
        {signedDate && (
          <p className="text-xs text-gray-500">
            {dateLabel}: {new Date(signedDate).toLocaleDateString("en-PH", { dateStyle: "long" })}
          </p>
        )}
        {showVenue && venue?.trim() && (
          <p className="text-xs text-gray-500">Signing venue: {venue}</p>
        )}
        {notes?.trim() && (
          <p className="text-xs text-gray-500">Notes: {notes}</p>
        )}
        {hasStoredFile(document) && (document!.dataUrl || document!.fileId) && (
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloadBusy}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0C2461] hover:underline disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {downloadBusy ? "Downloading…" : "Download"}
          </button>
        )}
        {hasStoredFile(document) && !document!.dataUrl && document!.fileId && (
          <p className="text-xs text-gray-500">
            Preview loads from the server file store after reload.
          </p>
        )}
        {hasStoredFile(document) && (
          <SignedFilePreview
            document={document!}
            applicantId={applicantId}
            label={label}
          />
        )}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-gray-800">{label}</p>
        {staffOnly && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#0C2461]/10 text-[#0C2461]">
            Staff upload only
          </span>
        )}
      </div>
      <div className={FORM_GRID_2}>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
            {dateLabel} *
          </label>
          <input
            type="date"
            value={signedDate}
            onChange={(e) => onSignedDateChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        {showVenue && onVenueChange && (
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Signing venue
            </label>
            <input
              type="text"
              value={venue ?? ""}
              onChange={(e) => onVenueChange(e.target.value)}
              placeholder="PSTO office"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            />
          </div>
        )}
      </div>
      {onNotesChange && (
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Notes</label>
          <input
            type="text"
            value={notes ?? ""}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      {hasStoredFile(document) ? (
        <div className={`${ACTION_ROW} flex-wrap items-center bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2`}>
          <FileText className="w-4 h-4 text-emerald-700" />
          <span className="text-sm text-emerald-800 flex-1">{document!.fileName}</span>
          {(document!.dataUrl || document!.fileId) && (
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={downloadBusy}
              className="text-xs font-semibold text-[#0C2461] disabled:opacity-60"
            >
              {downloadBusy ? "…" : "Download"}
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-semibold text-[#0C2461]"
          >
            Replace
          </button>
          <button type="button" onClick={onRemove} className="text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:border-[#0C2461] hover:text-[#0C2461]"
        >
          <Upload className="w-4 h-4" />
          Upload signed scan (PDF or image)
        </button>
      )}
      {hasStoredFile(document) && (
        <SignedFilePreview
          document={document!}
          applicantId={applicantId}
          label={label}
        />
      )}
    </div>
  );
}
