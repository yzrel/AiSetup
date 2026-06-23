/**
 * Author: Yzrel Jade B. Eborde
 */

import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import type { Applicant } from "../store/applicantStore";
import type { AdminView } from "../store/authStore";
import {
  collectApplicantSubmittedFiles,
  countViewableSubmittedFiles,
  SUBMITTED_FILE_CATEGORY_LABELS,
  type ApplicantSubmittedFile,
  type SubmittedFileCategory,
} from "../utils/applicantSubmittedFiles";
import { SubmittedFileActions } from "./SubmittedFileActions";

const CATEGORY_NAV: Array<SubmittedFileCategory | "all"> = [
  "all",
  "registration",
  "requirements",
  "loi",
  "tna1",
  "proposal",
  "approval",
  "pis",
  "landbank",
  "procurement",
];

const CATEGORY_TO_VIEW: Partial<Record<SubmittedFileCategory, AdminView>> = {
  registration: "registration",
  requirements: "requirements",
  loi: "letter-of-intent",
  tna1: "tna1",
  proposal: "project-proposal",
  approval: "approval-letter",
  pis: "project-information-sheet",
  landbank: "landbank-withdrawal",
  procurement: "procurement-liquidation",
};

interface ClientSubmittedFilesPanelProps {
  applicant: Applicant;
  onNavigate?: (view: AdminView) => void;
}

export function ClientSubmittedFilesPanel({
  applicant,
  onNavigate,
}: ClientSubmittedFilesPanelProps) {
  const [category, setCategory] = useState<SubmittedFileCategory | "all">("all");
  const [search, setSearch] = useState("");

  const allFiles = useMemo(
    () => collectApplicantSubmittedFiles(applicant),
    [applicant.id, applicant.lastUpdated, applicant.moduleData],
  );

  const counts = countViewableSubmittedFiles(allFiles);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allFiles.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (!q) return true;
      return (
        f.fileName.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.sourceModule.toLowerCase().includes(q)
      );
    });
  }, [allFiles, category, search]);

  const categoryCounts = useMemo(() => {
    const map = new Map<SubmittedFileCategory, number>();
    for (const f of allFiles) {
      map.set(f.category, (map.get(f.category) ?? 0) + 1);
    }
    return map;
  }, [allFiles]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Submitted documents
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {counts.total === 0
              ? "No client uploads on record yet."
              : `${counts.total} file${counts.total === 1 ? "" : "s"} · ${counts.viewable} viewable${
                  counts.missingContent > 0
                    ? ` · ${counts.missingContent} missing file content (re-upload needed)`
                    : ""
                }`}
          </p>
        </div>
      </div>

      {allFiles.length > 0 && (
        <>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or module..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2461]/20"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_NAV.map((cat) => {
              const count =
                cat === "all" ? allFiles.length : categoryCounts.get(cat) ?? 0;
              if (cat !== "all" && count === 0) return null;
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-[#0C2461] text-white border-[#0C2461]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {cat === "all" ? "All" : SUBMITTED_FILE_CATEGORY_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          {allFiles.length === 0
            ? "Uploaded files will appear here as the client progresses through the workflow."
            : "No documents match your filter."}
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
          {filtered.map((file) => (
            <SubmittedFileRow
              key={file.id}
              file={file}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SubmittedFileRow({
  file,
  onNavigate,
}: {
  file: ApplicantSubmittedFile;
  onNavigate?: (view: AdminView) => void;
}) {
  const targetView = CATEGORY_TO_VIEW[file.category];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50/80">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{file.label}</p>
        <p className="text-xs text-gray-500 truncate">{file.fileName}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {SUBMITTED_FILE_CATEGORY_LABELS[file.category]} · {file.sourceModule}
          {file.uploadedAt
            ? ` · ${new Date(file.uploadedAt).toLocaleDateString()}`
            : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <SubmittedFileActions
          fileName={file.fileName}
          mimeType={file.mimeType}
          dataUrl={file.dataUrl}
          compact
        />
        {onNavigate && targetView && (
          <button
            type="button"
            onClick={() => onNavigate(targetView)}
            className="text-[11px] font-semibold text-gray-500 hover:text-[#0C2461]"
          >
            Open module →
          </button>
        )}
      </div>
    </div>
  );
}
