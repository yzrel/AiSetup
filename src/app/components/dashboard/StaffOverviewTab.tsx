/**
 * Author: Yzrel Jade B. Eborde
 *
 * Staff dashboard overview: pipeline charts, sector/KPI panels, recent
 * applications, and the payment monitor — live from scoped applicants with
 * sample fallbacks when a series is empty.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  Clock,
  FileText,
  MapPin,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { ResponsiveDataView } from "../ui/responsive-data-view";
import { AdminView, AuthUser } from "../../store/authStore";
import { notificationStore } from "../../store/notificationStore";
import { staffContextStore } from "../../store/staffContextStore";
import { getApplicantsForStaff, filterApplicantsByProvince, DASHBOARD_PROVINCE_ALL } from "../../utils/provincialOffice";
import { getPaymentMonitorRecords } from "../../utils/refundDelinquent";
import {
  getPipelineChartData,
  getProgramKpis,
  getRecentApplicationsRows,
  getRegionBreakdownData,
  getRegistrantGenderBreakdown,
  getTopSectorsData,
  getWorkforceGenderTotals,
  mergeProgramKpisWithFallback,
  withLiveOrFallback,
} from "../../utils/dashboardMetrics";
import { timeAgo } from "../../utils/timeAgo";
import {
  FALLBACK_PAYMENT_RECORDS,
  FALLBACK_PROGRAM_KPIS,
  FALLBACK_REGISTRANT_GENDER,
  FALLBACK_WORKFORCE_GENDER,
  pipelineData,
  recentApps,
  regionData,
  topSectors,
} from "./dashboardData";
import { PaymentMonitor } from "./PaymentMonitor";
import { RecentAppStatusBadge, SectionTitle, recentAppColumns } from "./widgets";

const KPI_ICONS: Record<
  string,
  { icon: typeof Clock; color: string }
> = {
  "Avg. Processing Time": { icon: Clock, color: "text-blue-500" },
  "Approval Rate": { icon: Target, color: "text-emerald-500" },
  "Avg. Grant Amount": { icon: Award, color: "text-amber-500" },
  "Enterprises Upgraded": { icon: Zap, color: "text-purple-500" },
  "Jobs Created / Retained": { icon: Users, color: "text-[#0C2461]" },
};

export function StaffOverviewTab({
  user,
  onNavigate,
  provinceFilter = DASHBOARD_PROVINCE_ALL,
}: {
  user: AuthUser;
  onNavigate?: (view: AdminView) => void;
  provinceFilter?: string;
}) {
  const scopedApplicants = filterApplicantsByProvince(
    getApplicantsForStaff(user),
    provinceFilter,
  );
  const livePaymentRecords = getPaymentMonitorRecords(scopedApplicants);
  const paymentMonitorRecords = withLiveOrFallback(
    livePaymentRecords,
    FALLBACK_PAYMENT_RECORDS,
  );
  const livePipeline = getPipelineChartData(scopedApplicants);
  const chartPipeline = withLiveOrFallback(livePipeline, pipelineData);
  const liveRegions = getRegionBreakdownData(scopedApplicants);
  const chartRegions = withLiveOrFallback(liveRegions, regionData);
  const liveSectors = getTopSectorsData(scopedApplicants);
  const chartSectors = withLiveOrFallback(liveSectors, topSectors);
  const liveRecent = getRecentApplicationsRows(scopedApplicants);
  const chartRecent = withLiveOrFallback(liveRecent, recentApps);
  const programKpis = mergeProgramKpisWithFallback(
    getProgramKpis(scopedApplicants),
    FALLBACK_PROGRAM_KPIS,
  );
  const registrantGender = withLiveOrFallback(
    getRegistrantGenderBreakdown(scopedApplicants),
    FALLBACK_REGISTRANT_GENDER,
  );
  const workforceTotals = getWorkforceGenderTotals(scopedApplicants);
  const workforceDisplay =
    workforceTotals.total > 0
      ? workforceTotals
      : {
          male:
            FALLBACK_WORKFORCE_GENDER.find((r) => r.name === "Male")?.count ?? 0,
          female:
            FALLBACK_WORKFORCE_GENDER.find((r) => r.name === "Female")?.count ??
            0,
          total: FALLBACK_WORKFORCE_GENDER.reduce((s, r) => s + r.count, 0),
        };
  const userNotifications = notificationStore.getForUser(user);
  const unreadNotifications = userNotifications.filter((n) => !n.read);

  return (
    <>
      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Pipeline bar chart */}
        <div className="md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SectionTitle sub="Number of applicants at each stage">
            Application Pipeline
          </SectionTitle>
          <div className="h-48 sm:h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartPipeline} barSize={30}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "none",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  fontSize: 12,
                }}
                cursor={{ fill: "#f0f4ff" }}
              />
              <Bar
                dataKey="count"
                name="Applicants"
                radius={[6, 6, 0, 0]}
              >
                {chartPipeline.map((entry, i) => (
                  <Cell key={`bar-cell-${i}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Regional breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SectionTitle sub="Applications by province in Region XII">
            Region XII Breakdown
          </SectionTitle>
          <div className="h-36 sm:h-[130px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartRegions}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={58}
                dataKey="value"
                paddingAngle={3}
              >
                {chartRegions.map((r, i) => (
                  <Cell key={`pie-cell-${i}`} fill={r.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "none",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  fontSize: 11,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-1">
            {chartRegions.map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: r.color }}
                  />
                  <span className="text-gray-600">
                    {r.name}
                  </span>
                </div>
                <span className="font-bold text-gray-800">
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GAD strip */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <SectionTitle sub="Sex-disaggregated overview (DOST GAD)">
          Gender Snapshot
        </SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Registrant Male
            </p>
            <p className="text-lg font-bold text-[#0C2461] mt-0.5">
              {registrantGender.find((r) => r.name === "Male")?.count ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Registrant Female
            </p>
            <p className="text-lg font-bold text-[#00AEEF] mt-0.5">
              {registrantGender.find((r) => r.name === "Female")?.count ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Workforce M / F
            </p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              {workforceDisplay.male.toLocaleString("en-PH")} /{" "}
              {workforceDisplay.female.toLocaleString("en-PH")}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Jobs (M+F)
            </p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              {workforceDisplay.total.toLocaleString("en-PH")}
            </p>
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Top sectors */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SectionTitle sub="Most active industries">
            Top Sectors
          </SectionTitle>
          <div className="space-y-3">
            {chartSectors.map((s, i) => (
              <div key={s.sector}>
                <div className="flex justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#0C2461]/10 text-[#0C2461] text-[9px] font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-700">
                      {s.sector}
                    </span>
                  </div>
                  <span className="font-bold text-gray-800">
                    {s.count}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0C2461] to-[#00AEEF] transition-all"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SectionTitle sub="Key performance indicators">
            Program KPIs
          </SectionTitle>
          <div className="space-y-3">
            {programKpis.map((kpi) => {
              const meta = KPI_ICONS[kpi.label] ?? {
                icon: Target,
                color: "text-gray-500",
              };
              const Icon = meta.icon;
              return (
                <div
                  key={kpi.label}
                  className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-3.5 h-3.5 ${meta.color} shrink-0`}
                    />
                    <span className="text-xs text-gray-600">
                      {kpi.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    {kpi.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts preview */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle sub="Requires attention">
              Recent Alerts
            </SectionTitle>
            <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 font-bold px-2 py-0.5 rounded-full">
              {
                unreadNotifications.filter(
                  (n) =>
                    n.urgent ||
                    n.kind === "warning" ||
                    n.kind === "action",
                ).length
              }{" "}
              warnings
            </span>
          </div>
          <div className="space-y-2.5">
            {userNotifications.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`flex gap-2.5 p-2.5 rounded-lg text-xs ${
                  alert.kind === "warning" || alert.kind === "action"
                    ? "bg-amber-50 border border-amber-100"
                    : alert.kind === "success"
                      ? "bg-emerald-50 border border-emerald-100"
                      : "bg-blue-50 border border-blue-100"
                }`}
              >
                <AlertCircle
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    alert.kind === "warning" || alert.kind === "action"
                      ? "text-amber-500"
                      : alert.kind === "success"
                        ? "text-emerald-500"
                        : "text-blue-500"
                  }`}
                />
                <div>
                  <p className="font-semibold text-gray-800">{alert.title}</p>
                  <p className="text-gray-700 leading-snug">{alert.message}</p>
                  <p className="text-gray-400 mt-0.5">
                    {timeAgo(alert.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {userNotifications.length === 0 && (
              <p className="text-xs text-gray-400">No recent alerts.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent applications table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              Recent Applications
            </h2>
            <p className="text-xs text-gray-400">
              Latest submissions across all modules
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-[#0C2461] font-semibold hover:underline flex items-center gap-1"
            onClick={() => onNavigate?.("clients")}
          >
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <ResponsiveDataView
          columns={recentAppColumns}
          rows={chartRecent}
          getRowKey={(app, i) => `${app.name}-${i}`}
          mobileClassName="px-4 pb-4"
          desktopClassName="overflow-x-auto [&_th]:px-5 [&_th]:py-3 [&_th]:text-[11px] [&_th]:font-bold [&_th]:text-gray-400 [&_th]:uppercase [&_th]:tracking-wider [&_tr]:border-t [&_tr]:border-gray-50 [&_tr:hover]:bg-[#0C2461]/[0.02] [&_thead_tr]:bg-gray-50"
          renderMobileCard={(app) => (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-[#0C2461]/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#0C2461]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{app.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {app.region}
                  </p>
                </div>
                <RecentAppStatusBadge status={app.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Type</span>
                  <p className="text-gray-700">{app.type}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Amount</span>
                  <p className="font-bold text-gray-800">{app.amount}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Stage</span>
                  <p>
                    <span className="text-[10px] bg-[#0C2461]/8 text-[#0C2461] font-semibold px-2 py-0.5 rounded">
                      {app.module}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Date</span>
                  <p className="text-gray-500">{app.date}</p>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {/* ── Payment Monitoring ── */}
      <PaymentMonitor
        records={paymentMonitorRecords}
        onViewAccount={(applicantId) => {
          staffContextStore.setSelectedApplicant(applicantId);
          onNavigate?.("refund-delinquent");
        }}
      />
    </>
  );
}
