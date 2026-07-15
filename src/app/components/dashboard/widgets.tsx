/**
 * Author: Yzrel Jade B. Eborde
 *
 * Small presentational widgets shared by the dashboard tabs.
 */

import React from "react";
import { FileText, MapPin, TrendingDown, TrendingUp } from "lucide-react";
import type { ResponsiveColumn } from "../ui/responsive-data-view";
import { recentAppStatusConfig, type RecentApp } from "./dashboardData";

export function RecentAppStatusBadge({ status }: { status: string }) {
  const sc =
    recentAppStatusConfig[status] || recentAppStatusConfig["Pre-Screening"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
      {status}
    </span>
  );
}

export const recentAppColumns: ResponsiveColumn<RecentApp>[] = [
  {
    key: "name",
    header: "Enterprise",
    mobileLabel: "Enterprise",
    className: "px-5 py-3.5",
    cell: (app) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#0C2461]/10 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-[#0C2461]" />
        </div>
        <span className="font-semibold text-gray-800 text-xs">{app.name}</span>
      </div>
    ),
  },
  {
    key: "region",
    header: "Region",
    mobileLabel: "Region",
    className: "px-5 py-3.5",
    cell: (app) => (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <MapPin className="w-3 h-3 shrink-0" />
        {app.region}
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    mobileLabel: "Type",
    className: "px-5 py-3.5 text-xs text-gray-500",
    cell: (app) => app.type,
  },
  {
    key: "amount",
    header: "Amount",
    mobileLabel: "Amount",
    className: "px-5 py-3.5 text-xs font-bold text-gray-800",
    cell: (app) => app.amount,
  },
  {
    key: "module",
    header: "Current Stage",
    mobileLabel: "Stage",
    className: "px-5 py-3.5",
    cell: (app) => (
      <span className="text-[10px] bg-[#0C2461]/8 text-[#0C2461] font-semibold px-2 py-0.5 rounded">
        {app.module}
      </span>
    ),
  },
  {
    key: "date",
    header: "Date",
    mobileLabel: "Date",
    className: "px-5 py-3.5 text-[11px] text-gray-400 whitespace-nowrap",
    cell: (app) => app.date,
  },
  {
    key: "status",
    header: "Status",
    mobileLabel: "Status",
    className: "px-5 py-3.5",
    cell: (app) => <RecentAppStatusBadge status={app.status} />,
  },
];

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
  trendUp = true,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  trend: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm shrink-0`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
        >
          {trendUp ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-gray-800 leading-none mb-1">
          {value}
        </p>
        <p className="text-sm font-semibold text-gray-600">
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export function SectionTitle({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-gray-800">
        {children}
      </h2>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
