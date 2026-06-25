/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Filter,
  Search,
  Users,
} from "lucide-react";
import {
  applicantStore,
  Applicant,
  MODULE_LABELS,
  ModuleStatus,
} from "../store/applicantStore";
import { AuthUser, AdminView } from "../store/authStore";
import { staffContextStore } from "../store/staffContextStore";
import { ClientCaseDetail } from "./ClientCaseDetail";
import {
  countNeedsAssessment,
  getOverallAssessmentLabel,
  needsStaffAssessment,
} from "../utils/clientAssessment";
import {
  getApplicantsForStaff,
  getOfficeName,
  getStaffProvinces,
  resolveApplicantOfficeId,
  resolveApplicantProvince,
} from "../utils/provincialOffice";

interface ClientManagementProps {
  user: AuthUser;
  onNavigate: (view: AdminView) => void;
  initialSelectedId?: string | null;
}

export function ClientManagement({
  user,
  onNavigate,
  initialSelectedId,
}: ClientManagementProps) {
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleStatus | "">("");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? staffContextStore.getSelectedApplicantId(),
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

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
      staffContextStore.setSelectedApplicant(initialSelectedId);
    }
  }, [initialSelectedId]);

  const scoped = useMemo(() => getApplicantsForStaff(user), [user, refreshKey]);
  const provinces = getStaffProvinces(user);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((a) => {
      if (provinceFilter && resolveApplicantProvince(a) !== provinceFilter)
        return false;
      if (moduleFilter && a.currentModule !== moduleFilter) return false;
      if (reviewOnly && !needsStaffAssessment(a)) return false;
      if (!q) return true;
      return (
        a.enterpriseName.toLowerCase().includes(q) ||
        a.applicantName.toLowerCase().includes(q) ||
        a.applicationId.toLowerCase().includes(q) ||
        a.emailAddress.toLowerCase().includes(q)
      );
    });
  }, [scoped, search, provinceFilter, moduleFilter, reviewOnly]);

  const selected = selectedId
    ? applicantStore.getById(selectedId) ?? null
    : null;

  const blockedCount = scoped.filter((a) =>
    applicantStore.isAccountBlocked(a),
  ).length;
  const needsReviewCount = countNeedsAssessment(scoped);

  const handleSelect = (applicant: Applicant) => {
    setSelectedId(applicant.id);
    staffContextStore.setSelectedApplicant(applicant.id);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Clients in scope", value: scoped.length, icon: Users },
          {
            label: "Needs assessment",
            value: needsReviewCount,
            icon: AlertCircle,
            accent: needsReviewCount > 0,
          },
          {
            label: "Blocked accounts",
            value: blockedCount,
            icon: Building2,
          },
          {
            label: "Your office",
            value: user.officeId === "regional" ? "Regional" : "Provincial",
            icon: Building2,
            sub: user.assignedProvinces?.join(", "),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon
                className={`w-4 h-4 ${stat.accent ? "text-amber-500" : "text-[#0C2461]"}`}
              />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <p
              className={`text-2xl font-black ${stat.accent ? "text-amber-600" : "text-gray-900"}`}
            >
              {stat.value}
            </p>
            {stat.sub && (
              <p className="text-[10px] text-gray-500 mt-1 truncate">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className={`lg:col-span-2 space-y-4 ${selected ? "hidden lg:block" : ""}`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461]/20"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-400" />
              {user.role === "admin" && (
                <select
                  value={provinceFilter}
                  onChange={(e) => setProvinceFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                >
                  <option value="">All provinces</option>
                  {provinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={moduleFilter}
                onChange={(e) =>
                  setModuleFilter(e.target.value as ModuleStatus | "")
                }
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
              >
                <option value="">All stages</option>
                {(Object.keys(MODULE_LABELS) as ModuleStatus[]).map((m) => (
                  <option key={m} value={m}>
                    {MODULE_LABELS[m]}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={reviewOnly}
                  onChange={(e) => setReviewOnly(e.target.checked)}
                  className="rounded"
                />
                Needs review
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
              {filtered.length} client{filtered.length !== 1 ? "s" : ""}
            </div>
            <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
              {filtered.length === 0 && (
                <p className="p-6 text-sm text-gray-400 text-center">
                  No clients match your filters.
                </p>
              )}
              {filtered.map((a) => {
                const active = selectedId === a.id;
                const label = getOverallAssessmentLabel(a);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleSelect(a)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${active ? "bg-blue-50/80 border-l-4 border-l-[#0C2461]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
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
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 text-right space-y-1">
                        <span className="block text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {MODULE_LABELS[a.currentModule]}
                        </span>
                        <span
                          className={`block text-[10px] font-semibold ${
                            label === "Needs review"
                              ? "text-amber-600"
                              : label === "In progress"
                                ? "text-blue-600"
                                : "text-emerald-600"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <ClientCaseDetail
              applicant={selected}
              user={user}
              onBack={() => setSelectedId(null)}
              onNavigate={onNavigate}
              onOpenAccountManagement={() => onNavigate("account-management")}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">Select a client</p>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                Choose a client from the list to view their case file, timeline,
                and assessment tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
