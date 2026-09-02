/**
 * Author: Yzrel Jade B. Eborde
 *
 * Staff analytics tab: monthly trends, fund disbursement, quarter comparison —
 * live from scoped applicants only.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { AuthUser } from "../../store/authStore";
import {
  DASHBOARD_PROVINCE_ALL,
  filterApplicantsByProvince,
  getApplicantsForStaff,
} from "../../utils/provincialOffice";
import {
  buildFundDisbursementChartData,
  getMonthlyTrendsData,
  getOwnerSexBreakdown,
  getQuarterComparisonData,
  getRegistrantGenderBreakdown,
  getWorkforceGenderBreakdown,
  getWorkforceGenderTotals,
} from "../../utils/dashboardMetrics";
import { SectionTitle } from "./widgets";
import {
  DashboardChartEmpty,
  DashboardScopeEmptyBanner,
} from "./DashboardEmptyStates";

export function AnalyticsTab({
  user,
  provinceFilter = DASHBOARD_PROVINCE_ALL,
}: {
  user: AuthUser;
  provinceFilter?: string;
}) {
  const scoped = filterApplicantsByProvince(
    getApplicantsForStaff(user),
    provinceFilter,
  );
  const hasScopedApplicants = scoped.length > 0;
  const monthlyTrends = getMonthlyTrendsData(scoped);
  const fundChartData = buildFundDisbursementChartData(scoped);
  const quarterRows = getQuarterComparisonData(scoped);
  const registrantGender = getRegistrantGenderBreakdown(scoped);
  const ownerSex = getOwnerSexBreakdown(scoped);
  const workforceGender = getWorkforceGenderBreakdown(scoped);
  const workforceDisplay = getWorkforceGenderTotals(scoped);

  return (
    <div className="space-y-5">
      {!hasScopedApplicants && <DashboardScopeEmptyBanner />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly trend */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SectionTitle sub="Applications, approvals, and releases per month">
            Monthly Trends
          </SectionTitle>
          <div className="h-48 sm:h-[240px]">
          {monthlyTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrends}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="month"
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
              />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#0C2461"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0C2461" }}
                name="Applications"
              />
              <Line
                type="monotone"
                dataKey="approved"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981" }}
                name="Approved"
              />
              <Line
                type="monotone"
                dataKey="released"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#f59e0b" }}
                name="Released"
              />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <DashboardChartEmpty message="No monthly trend data for cooperators in scope." />
          )}
          </div>
          <div className="flex gap-4 mt-2 justify-center">
            {[
              ["#0C2461", "Applications"],
              ["#10b981", "Approved"],
              ["#f59e0b", "Released"],
            ].map(([c, l]) => (
              <div
                key={l}
                className="flex items-center gap-1.5 text-xs text-gray-500"
              >
                <div
                  className="w-3 h-0.5 rounded"
                  style={{ background: c }}
                />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Fund disbursement area chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SectionTitle sub="Monthly fund disbursement in millions ₱">
            Fund Disbursement
          </SectionTitle>
          <div className="h-48 sm:h-[240px]">
          {fundChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fundChartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₱${v}M`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "none",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  fontSize: 12,
                }}
                formatter={(v: number) => [
                  `₱${v}M`,
                  "Released",
                ]}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#00AEEF"
                strokeWidth={2.5}
                fill="rgba(0, 174, 239, 0.15)"
                dot={{ r: 4, fill: "#00AEEF" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <DashboardChartEmpty message="No fund disbursement data yet." />
          )}
          </div>
        </div>
      </div>

      {/* GAD / sex-disaggregated statistics */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <SectionTitle sub="DOST GAD — sex-disaggregated registrant, owner, and workforce data">
          Gender and Development (GAD) Statistics
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Workforce Male
            </p>
            <p className="text-xl font-bold text-[#0C2461] mt-0.5">
              {workforceDisplay.male.toLocaleString("en-PH")}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Workforce Female
            </p>
            <p className="text-xl font-bold text-[#00AEEF] mt-0.5">
              {workforceDisplay.female.toLocaleString("en-PH")}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Jobs (M+F)
            </p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {workforceDisplay.total.toLocaleString("en-PH")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Registrant gender
            </p>
            <div className="h-44 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={registrantGender}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {registrantGender.map((row) => (
                      <Cell key={row.name} fill={row.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "none",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {registrantGender.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center gap-1.5 text-[11px] text-gray-500"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: row.fill }}
                  />
                  {row.name} ({row.count})
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Enterprise owner sex (PIS)
            </p>
            <div className="h-44 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ownerSex}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {ownerSex.map((row) => (
                      <Cell key={row.name} fill={row.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "none",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {ownerSex.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center gap-1.5 text-[11px] text-gray-500"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: row.fill }}
                  />
                  {row.name} ({row.count})
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Workforce employment (M / F)
            </p>
            <div className="h-44 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workforceGender} barSize={36}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
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
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {workforceGender.map((row) => (
                      <Cell key={row.name} fill={row.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <SectionTitle sub="Current vs previous quarter">
          Quarter Comparison
        </SectionTitle>
        {quarterRows.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {quarterRows.map((item) => {
            const improved = item.lower
              ? item.current < item.previous
              : item.current > item.previous;
            const pct =
              item.previous === 0
                ? item.current === 0
                  ? 0
                  : 100
                : Math.round(
                    Math.abs((item.current - item.previous) / item.previous) *
                      100,
                  );
            return (
              <div
                key={item.label}
                className="text-center p-4 bg-gray-50 rounded-xl"
              >
                <p className="text-xs text-gray-500 mb-3 font-medium">
                  {item.label}
                </p>
                <div className="flex items-end justify-center gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">
                      {item.previousLabel}
                    </p>
                    <p className="text-lg font-bold text-gray-400">
                      {item.unit}
                      {item.previous}
                      {item.suffix}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 mb-2" />
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">
                      {item.currentLabel}
                    </p>
                    <p
                      className={`text-xl font-black ${improved ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {item.unit}
                      {item.current}
                      {item.suffix}
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${improved ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
                >
                  {improved ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {pct}% {improved ? "better" : "worse"}
                </div>
              </div>
            );
          })}
        </div>
        ) : (
          <DashboardChartEmpty message="No quarter comparison data for cooperators in scope." />
        )}
      </div>
    </div>
  );
}
