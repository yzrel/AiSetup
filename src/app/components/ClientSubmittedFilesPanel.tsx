/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, Printer, Search } from "lucide-react";
import type { Applicant } from "../store/applicantStore";
import type { AdminView } from "../store/authStore";
import { api } from "../api/client";
import {
  CATEGORY_TO_VIEW,
  collectApplicantSubmittedFiles,
  countViewableSubmittedFiles,
  LOI_ONWARD_CATEGORIES,
  mergeServerFilesIntoCatalog,
  runGeneratedPrint,
  SUBMITTED_FILE_CATEGORY_LABELS,
  type ApplicantSubmittedFile,
  type ServerFileRow,
  type SubmittedFileCategory,
} from "../utils/applicantSubmittedFiles";
import { SubmittedFileActions } from "./SubmittedFileActions";
import { ACTION_ROW } from "./moduleTheme";

const ALL_CATEGORY_NAV: Array<SubmittedFileCategory | "all"> = [
  "all",
  "registration",
  "requirements",
  "loi",
  "tna1",
  "tna2",
  "proposal",
  "rtec",
  "approval",
  "pis",
  "landbank",
  "procurement",
  "refund",
  "closeout",
  "server",
];

const LOI_ONWARD_NAV: Array<SubmittedFileCategory | "all"> = [
  "all",
  ...LOI_ONWARD_CATEGORIES.filter((c) => c !== "other"),
];

interface ClientSubmittedFilesPanelProps {
  applicant: Applicant;
  onNavigate?: (view: AdminView) => void;
  /** Default "all" (case detail). Client Files uses "loi-onward". */
  scope?: "all" | "loi-onward";
  title?: string;
}

export function ClientSubmittedFilesPanel({
  applicant,
  onNavigate,
  scope = "all",
  title = "Submitted documents",
}: ClientSubmittedFilesPanelProps) {
  const [category, setCategory] = useState<SubmittedFileCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [serverRows, setServerRows] = useState<ServerFileRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setServerRows([]);
    void api
      .listApplicantFiles(applicant.id)
      .then((rows) => {
        if (cancelled) return;
        setServerRows(
          (Array.isArray(rows) ? rows : []).map((r) => ({
            id: String(r.id ?? ""),
            moduleKey: r.moduleKey,
            originalFilename: r.originalFilename,
            contentType: r.contentType,
            sizeBytes: typeof r.sizeBytes === "number" ? r.sizeBytes : undefined,
            createdAt: r.createdAt,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setServerRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [applicant.id, applicant.lastUpdated]);

  const baseFiles = useMemo(() => {
    try {
      return collectApplicantSubmittedFiles(applicant, { scope });
    } catch (err) {
      console.error("[aisetup] collectApplicantSubmittedFiles", err);
      return [];
    }
  }, [applicant.id, applicant.lastUpdated, applicant.moduleData, scope]);

  const allFiles = useMemo(
    () => mergeServerFilesIntoCatalog(baseFiles, serverRows),
    [baseFiles, serverRows],
  );

  const counts = countViewableSubmittedFiles(allFiles);
  const categoryNav = scope === "loi-onward" ? LOI_ONWARD_NAV : ALL_CATEGORY_NAV;

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
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {counts.total === 0
              ? "No documents on record yet."
              : `${counts.total} item${counts.total === 1 ? "" : "s"} · ${counts.viewable} viewable${
                  counts.generated > 0 ? ` · ${counts.generated} generated` : ""
                }${
                  counts.missingContent > 0
                    ? ` · ${counts.missingContent} missing file content`
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
            {categoryNav.map((cat) => {
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
            ? "Documents will appear here as the cooperator progresses from Letter of Intent onward."
            : "No documents match your filter."}
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
          {filtered.map((file) => (
            <SubmittedFileRow
              key={file.id}
              file={file}
              applicantId={applicant.id}
              applicant={applicant}
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
  applicantId,
  applicant,
  onNavigate,
}: {
  file: ApplicantSubmittedFile;
  applicantId: string;
  applicant: Applicant;
  onNavigate?: (view: AdminView) => void;
}) {
  const targetView = file.navigateView ?? CATEGORY_TO_VIEW[file.category];
  const [serverBusy, setServerBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleServerDownload = async (mode: "view" | "download") => {
    if (!file.serverFileId) return;
    setServerBusy(true);
    setServerError(null);
    try {
      const { blob, fileName, contentType } = await api.downloadApplicantFile(
        applicantId,
        file.serverFileId,
      );
      const url = URL.createObjectURL(blob);
      if (mode === "view") {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || file.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
      void contentType;
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setServerBusy(false);
    }
  };

  const kindBadge =
    file.kind === "generated"
      ? "Generated"
      : file.kind === "server"
        ? "Server"
        : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50/80">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-800 truncate">{file.label}</p>
          {kindBadge && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-50 text-[#0C2461] border border-blue-100">
              {kindBadge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{file.fileName}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {SUBMITTED_FILE_CATEGORY_LABELS[file.category]} · {file.sourceModule}
          {file.uploadedAt
            ? ` · ${new Date(file.uploadedAt).toLocaleDateString()}`
            : ""}
        </p>
        {serverError && (
          <p className="text-[10px] text-red-600 mt-1">{serverError}</p>
        )}
      </div>
      <div className={`${ACTION_ROW} flex-wrap items-center gap-2 shrink-0`}>
        {file.kind === "generated" ? (
          <>
            {file.printKey && (
              <button
                type="button"
                onClick={() => runGeneratedPrint(applicant, file.printKey!)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 text-[#0C2461] hover:bg-blue-50"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            )}
            {onNavigate && targetView && (
              <button
                type="button"
                onClick={() => onNavigate(targetView)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 text-[#0C2461] hover:bg-blue-50"
              >
                <Eye className="w-3.5 h-3.5" />
                Open module
              </button>
            )}
          </>
        ) : file.kind === "server" && file.serverFileId ? (
          <>
            <button
              type="button"
              disabled={serverBusy}
              onClick={() => void handleServerDownload("view")}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 text-[#0C2461] hover:bg-blue-50 disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
            <button
              type="button"
              disabled={serverBusy}
              onClick={() => void handleServerDownload("download")}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 text-[#0C2461] hover:bg-blue-50 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </>
        ) : (
          <SubmittedFileActions
            fileName={file.fileName}
            mimeType={file.mimeType}
            dataUrl={file.dataUrl}
            fileId={file.serverFileId}
            applicantId={applicantId}
            compact
          />
        )}
        {file.kind !== "generated" && onNavigate && targetView && (
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
