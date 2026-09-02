/**
 * Author: Yzrel Jade B. Eborde
 *
 * Dashboard shell: header, role-aware stat cards, and tab routing.
 * Tab contents live in ./dashboard/*.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Banknote,
  Calendar,
  CheckCircle,
  FileText,
  PhoneCall,
  Users,
} from "lucide-react";
import { ApplicantListView } from "./ApplicantListView";
import { authStore, AdminView, AuthUser, DashboardTab } from "../store/authStore";
import { applicantStore } from "../store/applicantStore";
import { notificationStore } from "../store/notificationStore";
import { staffContextStore } from "../store/staffContextStore";
import { resolveApplicantForUser } from "../utils/resolveApplicant";
import { getApplicantDashboardStats } from "../utils/applicantProgress";
import {
  DASHBOARD_PROVINCE_ALL,
  filterApplicantsByProvince,
  getApplicantsForStaff,
  getOfficeContact,
  getStaffProvinces,
  resolveApplicantOfficeId,
  resolveApplicantProvince,
} from "../utils/provincialOffice";
import { getStaffDashboardUpdatedLabel } from "../utils/dashboardMetrics";
import { StatCard } from "./dashboard/widgets";
import { DashboardProvinceFilter } from "./dashboard/DashboardProvinceFilter";
import { ApplicantOverviewTab } from "./dashboard/ApplicantOverviewTab";
import { StaffOverviewTab } from "./dashboard/StaffOverviewTab";
import { AnalyticsTab } from "./dashboard/AnalyticsTab";
import { AlertsTab } from "./dashboard/AlertsTab";

export function Dashboard({
  user,
  onNavigate,
}: {
  user: AuthUser;
  onNavigate?: (view: AdminView) => void;
}) {
  const allowedTabs = authStore.getAllowedDashboardTabs(user.role);
  const isClientView = authStore.isClientRole(user.role);
  const [, bump] = useState(0);
  const [provinceFilter, setProvinceFilter] = useState(DASHBOARD_PROVINCE_ALL);

  useEffect(() => {
    const unsubs = [
      applicantStore.subscribe(() => bump((n) => n + 1)),
      notificationStore.subscribe(() => bump((n) => n + 1)),
      staffContextStore.subscribe(() => bump((n) => n + 1)),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const application = resolveApplicantForUser(user);
  const applicantStats = getApplicantDashboardStats(application);
  const staffProvinces = useMemo(
    () => (isClientView ? [] : getStaffProvinces(user)),
    [isClientView, user],
  );
  const scopedApplicants = useMemo(() => {
    if (isClientView) return [];
    return filterApplicantsByProvince(
      getApplicantsForStaff(user),
      provinceFilter,
    );
    // bump refreshes when applicantStore / staffContext changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bump is intentional refresh token
  }, [isClientView, user, provinceFilter, bump]);
  const staffActiveCount = scopedApplicants.filter(
    (a) => a.currentModule !== "completed",
  ).length;
  const staffApprovedCount = scopedApplicants.filter(
    (a) =>
      a.currentModule === "landbank-withdrawal" ||
      a.currentModule === "procurement-liquidation" ||
      a.currentModule === "completed",
  ).length;
  const provincialOffice = application
    ? getOfficeContact(resolveApplicantOfficeId(application))
    : null;
  const applicantProvince = application
    ? resolveApplicantProvince(application)
    : "";
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    allowedTabs[0] ?? "overview",
  );

  const showProvinceFilter =
    !isClientView &&
    (activeTab === "overview" || activeTab === "analytics") &&
    staffProvinces.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-800">
            {isClientView ? "My Application Dashboard" : "SETUP Program Dashboard"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {isClientView
              ? `${user.enterpriseName}${user.applicationId ? ` · ${user.applicationId}` : ""}`
              : scopedApplicants.length === 0
                ? "No cooperators in scope"
                : `Last updated: ${getStaffDashboardUpdatedLabel(scopedApplicants, "—")}`}
          </p>
        </div>
        {allowedTabs.length > 1 && (
          <div className="flex items-center gap-2">
            {allowedTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-[#0C2461] text-white shadow-sm"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {tab === "registry" && (
                  <Users className="w-3 h-3" />
                )}
                {tab === "overview" && isClientView ? "my application" : tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {isClientView && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Limited access</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You can view and complete your application steps. Evaluation, approval,
              and program-wide reports are restricted to DOST personnel.
            </p>
          </div>
        </div>
      )}

      {showProvinceFilter && (
        <DashboardProvinceFilter
          provinces={staffProvinces}
          value={provinceFilter}
          onChange={setProvinceFilter}
        />
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isClientView ? (
          <>
            <StatCard
              label="Application Status"
              value={applicantStats.statusLabel}
              sub={applicantStats.stageLabel}
              icon={Activity}
              color="bg-[#0C2461]"
              trend={applicantStats.stepTrend}
            />
            <StatCard
              label="Documents Submitted"
              value={`${applicantStats.documentsSubmitted} / ${applicantStats.documentsRequired}`}
              sub={applicantStats.documentsSub}
              icon={FileText}
              color="bg-[#00AEEF]"
              trend={applicantStats.documentsTrend}
            />
            <StatCard
              label="Enterprise"
              value={user.enterpriseName.split(" ")[0]}
              sub={user.enterpriseName}
              icon={Users}
              color="bg-emerald-600"
              trend="Registered"
            />
            <StatCard
              label="Provincial S&T Office"
              value={applicantProvince ? applicantProvince.split(" ")[0] : "—"}
              sub={provincialOffice?.name ?? "Based on your province"}
              icon={PhoneCall}
              color="bg-amber-500"
              trend={provincialOffice?.phone ?? "Region XII"}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Total Applicants"
              value={String(scopedApplicants.length)}
              sub={
                provinceFilter === DASHBOARD_PROVINCE_ALL
                  ? "In your scope"
                  : provinceFilter
              }
              icon={Users}
              color="bg-[#0C2461]"
              trend={`${staffActiveCount} active`}
            />
            <StatCard
              label="Active Applications"
              value={String(staffActiveCount)}
              sub="Currently in progress"
              icon={Activity}
              color="bg-[#00AEEF]"
              trend={`${scopedApplicants.filter((a) => a.moduleData?.documentsSubmitted && !a.moduleData?.staffDecision).length} awaiting docs review`}
            />
            <StatCard
              label="Approved Projects"
              value={String(staffApprovedCount)}
              sub="Post-approval stage"
              icon={CheckCircle}
              color="bg-emerald-600"
              trend={`${scopedApplicants.filter((a) => a.currentModule === "project-proposal" || a.currentModule === "conduct-rtec").length} in evaluation`}
            />
            <StatCard
              label="Needs Assessment"
              value={String(
                scopedApplicants.filter((a) => {
                  const md = a.moduleData;
                  return (
                    (md?.documentsSubmitted && !md?.staffDecision) ||
                    (md?.tna1?.submitted && !md?.tna1?.staffReviewed) ||
                    (a.currentModule === "tna2" && !md?.tna2Document?.published)
                  );
                }).length,
              )}
              sub="Staff action required"
              icon={Banknote}
              color="bg-amber-500"
              trend="Open Cooperators hub"
            />
          </>
        )}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" &&
        (isClientView ? (
          <ApplicantOverviewTab user={user} onNavigate={onNavigate} />
        ) : (
          <StaffOverviewTab
            user={user}
            onNavigate={onNavigate}
            provinceFilter={provinceFilter}
          />
        ))}

      {/* ── Analytics Tab (staff only) ── */}
      {activeTab === "analytics" &&
        authStore.canAccessDashboardTab(user.role, "analytics") && (
          <AnalyticsTab user={user} provinceFilter={provinceFilter} />
        )}

      {/* ── Alerts Tab ── */}
      {activeTab === "alerts" &&
        authStore.canAccessDashboardTab(user.role, "alerts") && (
          <AlertsTab user={user} onNavigate={onNavigate} />
        )}

      {/* ── Applicant Registry Tab ── */}
      {activeTab === "registry" && authStore.canAccessDashboardTab(user.role, "registry") && (
        <div className="space-y-4">
          {onNavigate && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-sm text-gray-600">
                Manage cooperator case files, assessments, and provincial scope in Cooperators.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("clients")}
                className="text-sm font-bold text-[#0C2461] hover:underline shrink-0"
              >
                Open Cooperators →
              </button>
            </div>
          )}
          <ApplicantListView
            user={user}
            module="prescreening"
            title="All Applicants"
          />
        </div>
      )}
    </div>
  );
}
