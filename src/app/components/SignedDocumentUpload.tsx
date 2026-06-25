/**
 * Author: Yzrel Jade B. Eborde
 */

import { useRef } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { FORM_GRID_2, ACTION_ROW } from "./moduleTheme";

const MAX_BYTES = 8 * 1024 * 1024;

export interface SignedDocumentValue {
  fileName: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
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
}: SignedDocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > MAX_BYTES) {
      alert("File must be under 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onUpload({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
        uploadedAt: new Date().toISOString(),
        uploadedBy,
      });
    };
    reader.readAsDataURL(file);
  };

  if (readOnly) {
    if (!document) {
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
        <p className="text-sm text-gray-600">
          {document.fileName} · {new Date(document.uploadedAt).toLocaleDateString()}
        </p>
        <p className="text-xs text-gray-500">
          Uploaded by DOST staff ({document.uploadedBy})
        </p>
        {signedDate && (
          <p className="text-xs text-gray-500">
            {dateLabel}: {new Date(signedDate).toLocaleDateString("en-PH", { dateStyle: "long" })}
          </p>
        )}
        <a
          href={document.dataUrl}
          download={document.fileName}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0C2461] hover:underline"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
        {document.mimeType === "application/pdf" && (
          <iframe
            src={document.dataUrl}
            title={label}
            className="w-full h-64 border border-gray-200 rounded-lg"
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
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {document ? (
        <div className={`${ACTION_ROW} flex-wrap items-center bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2`}>
          <FileText className="w-4 h-4 text-emerald-700" />
          <span className="text-sm text-emerald-800 flex-1">{document.fileName}</span>
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
    </div>
  );
}
