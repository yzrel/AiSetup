/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FolderOpen, Search } from "lucide-react";
import {
  applicantStore,
  Applicant,
  MODULE_LABELS,
} from "../store/applicantStore";
import { AuthUser, AdminView, isRtecStaff } from "../store/authStore";
import { staffContextStore } from "../store/staffContextStore";
import { ClientSubmittedFilesPanel } from "./ClientSubmittedFilesPanel";
import { RtecReviewCommentPanel } from "./RtecReviewCommentPanel";
import {
  getApplicantsForStaff,
  getOfficeName,
  getStaffProvinces,
  resolveApplicantOfficeId,
  resolveApplicantProvince,
} from "../utils/provincialOffice";
import { MODULE_PAGE } from "./moduleTheme";

interface ClientFilesAdminProps {
  user: AuthUser;
  onNavigate: (view: AdminView) => void;
}

export function ClientFilesAdmin({ user, onNavigate }: ClientFilesAdminProps) {
  const reviewOnly = isRtecStaff(user.role);
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    staffContextStore.getSelectedApplicantId(),
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsubs = [
      applicantStore.subscribe(() => setRefreshKey((n) => n + 1)),
      staffContextStore.subscribe(() => {
        const id = staffContextStore.getSelectedApplicantId();
        if (id) setSelectedId(id);
        setRefreshKey((n) => n + 1);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const scoped = useMemo(() => getApplicantsForStaff(user), [user, refreshKey]);
  const provinces = getStaffProvinces(user);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((a) => {
      if (provinceFilter && resolveApplicantProvince(a) !== provinceFilter) {
        return false;
      }
      if (!q) return true;
      return (
        a.enterpriseName.toLowerCase().includes(q) ||
        a.applicantName.toLowerCase().includes(q) ||
        a.applicationId.toLowerCase().includes(q) ||
        a.emailAddress.toLowerCase().includes(q)
      );
    });
  }, [scoped, search, provinceFilter]);

  const selected = selectedId
    ? applicantStore.getById(selectedId) ?? null
    : null;

  const handleSelect = (applicant: Applicant) => {
    setSelectedId(applicant.id);
    staffContextStore.setSelectedApplicant(applicant.id);
  };

  return (
    <div className={`${MODULE_PAGE} space-y-5`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0C2461]/10 flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-[#0C2461]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900">Cooperator Files</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Browse attachments and generated official documents from Letter of
              Intent through Project Close-Out for each cooperator in your scope.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div
          className={`lg:col-span-2 space-y-4 ${selected ? "hidden lg:block" : ""}`}
        >
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cooperators..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461]/20"
              />
            </div>
            {user.role === "admin" && (
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
              >
                <option value="">All provinces</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
              {filtered.length} cooperator{filtered.length !== 1 ? "s" : ""}
            </div>
            <div className="divide-y divide-gray-50 max-h-[560px] overflow-y-auto">
              {filtered.length === 0 && (
                <p className="p-6 text-sm text-gray-400 text-center">
                  No cooperators match your filters.
                </p>
              )}
              {filtered.map((a) => {
                const active = selectedId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleSelect(a)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      active ? "bg-blue-50/80 border-l-4 border-l-[#0C2461]" : ""
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {a.enterpriseName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {a.applicantName} · {a.applicationId}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {resolveApplicantProvince(a) || "—"} ·{" "}
                      {getOfficeName(resolveApplicantOfficeId(a)).replace(
                        " Provincial Office",
                        "",
                      )}{" "}
                      · {MODULE_LABELS[a.currentModule]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="lg:hidden inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#0C2461] mb-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to list
                  </button>
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {selected.enterpriseName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selected.applicantName} · {selected.applicationId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("clients")}
                  className="text-xs font-semibold text-[#0C2461] hover:underline shrink-0"
                >
                  Open case file →
                </button>
              </div>

              <ClientSubmittedFilesPanel
                applicant={selected}
                onNavigate={onNavigate}
                scope="loi-onward"
                title="Cooperator attachments & generated documents"
              />
              {reviewOnly && (
                <RtecReviewCommentPanel
                  user={user}
                  applicantId={selected.id}
                  sourceView="client-files"
                />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">Select a cooperator</p>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                Choose a cooperator to view all attachments and generated official
                documents from Letter of Intent through close-out.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
