/**
 * Author: Yzrel Jade B. Eborde
 *
 * Shared style tokens, step definitions, and presentational widgets for the
 * TNA Form 01 module (split out of TechnologyNeedsAssessment1.tsx).
 */

import { useRef } from "react";
import { InlineAttachmentPreview } from "../InlineAttachmentPreview";
import { readAndUploadModuleDocument } from "../../utils/readFileAsDataUrl";
export { ValidationRow } from "../ValidationRow";

// ─── Shared style constants (mirrors LOI exactly) ────────────────────────────
export const DOST_BLUE = "#0C2461";
export const DOST_MID = "#1a3a7a";

export const inputCls =
  "w-full min-w-0 max-w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed";
export const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";
export const sectionTitle =
  "text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2";

// ─── Step definitions (rendered via shared ModuleStepHeader) ─────────────────
export const STEPS = [
  { id: "identification", label: "Enterprise Info",     icon: "🏭" },
  { id: "attachment-a",  label: "Enterprise Profile",   icon: "📋" },
  { id: "benchmark",     label: "Benchmark Info",       icon: "📊" },
  { id: "concerns",      label: "Problems & Marketing", icon: "⚠️" },
  { id: "finance-hr",    label: "Finance & HR",         icon: "💼" },
  { id: "validation",    label: "Validation",           icon: "✅" },
  { id: "complete",      label: "Form Preview",       icon: "📄" },
  { id: "staff-review",  label: "Staff Review",         icon: "🔍" },
  { id: "reports",       label: "Complete",             icon: "✅" },
];

// ─── Readonly blue field (same as LOI ReadonlyField) ─────────────────────────
export function ReadonlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="w-full border border-gray-100 bg-blue-50/40 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 font-medium min-h-[40px]">
        {value || <span className="text-gray-300 font-normal">—</span>}
      </div>
    </div>
  );
}

// ─── Checkbox clause (same pattern as LOI agreement clauses) ─────────────────
export function ClauseCheck({
  checked,
  onChange,
  title,
  text,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
  text: string;
}) {
  return (
    <label className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
      checked ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:border-gray-300"
    }`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
      <div>
        {title && <p className="font-semibold text-gray-800 text-xs mb-1">{title}</p>}
        <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
      </div>
    </label>
  );
}

export function FileAttachmentField({
  label,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  fileName,
  fileData,
  fileId,
  mimeType,
  onFile,
  hint,
  applicantId,
  moduleKey,
}: {
  label: string;
  accept?: string;
  fileName: string;
  fileData?: string;
  fileId?: string;
  mimeType?: string;
  onFile: (
    name: string,
    dataUrl: string,
    meta?: { fileId?: string; mimeType?: string },
  ) => void;
  hint?: string;
  /** When set, also mirrors the file into POST /applicants/{id}/files. */
  applicantId?: string;
  moduleKey?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void (async () => {
              try {
                const doc = await readAndUploadModuleDocument(
                  file,
                  "applicant",
                  applicantId
                    ? { applicantId, moduleKey: moduleKey ?? "tna1" }
                    : undefined,
                );
                onFile(doc.fileName, doc.dataUrl ?? "", {
                  fileId: doc.fileId,
                  mimeType: doc.mimeType,
                });
              } catch {
                onFile("", "");
              }
            })();
          }}
        />
        {fileName ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#0C2461]">📎 {fileName}</p>
            <InlineAttachmentPreview
              fileName={fileName}
              dataUrl={fileData}
              fileId={fileId}
              mimeType={mimeType}
              applicantId={applicantId}
              moduleKey={moduleKey}
              alt={label || fileName}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">Click to upload (PDF, image, or document)</p>
        )}
      </div>
      {fileName && (
        <button
          type="button"
          onClick={() => onFile("", "")}
          className="text-xs text-red-500 hover:underline mt-1"
        >
          Remove file
        </button>
      )}
    </div>
  );
}

// ─── Info callout banner ──────────────────────────────────────────────────────
export function InfoBanner({
  icon = "ℹ️",
  color = "blue",
  title,
  text,
}: {
  icon?: string;
  color?: "blue" | "amber" | "green" | "red" | "purple";
  title?: string;
  text: string;
}) {
  const themes = {
    blue:   "bg-blue-50 border-blue-100 text-blue-700",
    amber:  "bg-amber-50 border-amber-200 text-amber-800",
    green:  "bg-green-50 border-green-300 text-green-800",
    red:    "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
  };
  return (
    <div className={`flex items-start gap-3 border rounded-xl p-4 ${themes[color]}`}>
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p className="leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ─── AI Loading indicator ─────────────────────────────────────────────────────
export function AILoader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="w-5 h-5 border-2 border-blue-800 border-t-transparent rounded-full animate-spin flex-shrink-0" />
      <span className="text-sm font-semibold text-blue-800">{label}…</span>
    </div>
  );
}
