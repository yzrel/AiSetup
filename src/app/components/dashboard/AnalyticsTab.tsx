/**
 * Author: Yzrel Jade B. Eborde
 *
 * Staff analytics tab: monthly trends, fund disbursement, quarter comparison.
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { AuthUser } from "../../store/authStore";
import { getApplicantsForStaff } from "../../utils/provincialOffice";
import { getFundDisbursementChartData } from "../../utils/refundDelinquent";
import { monthlyData } from "./dashboardData";
import { SectionTitle } from "./widgets";

export function AnalyticsTab({ user }: { user: AuthUser }) {
  const fundChartData = getFundDisbursementChartData(
    getApplicantsForStaff(user),
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly trend */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SectionTitle sub="Applications, approvals, and releases per month">
            Monthly Trends
          </SectionTitle>
          <div className="h-48 sm:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
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
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <SectionTitle sub="Current vs previous quarter">
          Quarter Comparison
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              label: "New Applications",
              q3: 68,
              q4: 83,
              unit: "",
            },
            {
              label: "Approvals",
              q3: 14,
              q4: 18,
              unit: "",
            },
            {
              label: "Funds Released",
              q3: 29.4,
              q4: 42.0,
              unit: "₱",
              suffix: "M",
            },
            {
              label: "Avg. Processing Days",
              q3: 48,
              q4: 42,
              unit: "",
              lower: true,
            },
            {
              label: "Rejection Rate",
              q3: 28,
              q4: 22,
              unit: "",
              suffix: "%",
              lower: true,
            },
            {
              label: "Enterprises Graduated",
              q3: 71,
              q4: 94,
              unit: "",
            },
          ].map((item) => {
            const improved = item.lower
              ? item.q4 < item.q3
              : item.q4 > item.q3;
            const pct = Math.round(
              Math.abs((item.q4 - item.q3) / item.q3) * 100,
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
                      Q3
                    </p>
                    <p className="text-lg font-bold text-gray-400">
                      {item.unit}
                      {item.q3}
                      {item.suffix}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 mb-2" />
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">
                      Q4
                    </p>
                    <p
                      className={`text-xl font-black ${improved ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {item.unit}
                      {item.q4}
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
      </div>
    </div>
  );
}
