/**
 * Author: Yzrel Jade B. Eborde
 *
 * Payment Monitoring panel — overdue and delinquent SETUP loan accounts.
 */

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  CreditCard,
  Eye,
  Mail,
  MapPin,
  PhoneCall,
  Search,
} from "lucide-react";
import {
  paymentStatusConfig,
  pdcConfig,
  type PaymentRecord,
  type PaymentStatus,
} from "./dashboardData";

export function PaymentMonitor({
  records,
  onViewAccount,
}: {
  records: PaymentRecord[];
  onViewAccount?: (applicantId: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | PaymentStatus>(
    "all",
  );
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = records.filter((r) => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch =
      r.enterprise
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.region.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: records.length,
    delinquent: records.filter(
      (r) => r.status === "delinquent",
    ).length,
    overdue: records.filter(
      (r) => r.status === "overdue",
    ).length,
    late: records.filter((r) => r.status === "late")
      .length,
    current: records.filter(
      (r) => r.status === "current",
    ).length,
  };

  const totalOverdueBalance = records
    .filter((r) => r.status !== "current")
    .reduce((sum, r) => {
      const val = parseFloat(
        r.totalBalance.replace(/[₱,]/g, ""),
      );
      return sum + val;
    }, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-gray-800">
                Payment Monitoring — Overdue & Delinquent
                Accounts
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Enterprises with missed or late SETUP loan
              repayments · Total at-risk balance:{" "}
              <span className="font-bold text-red-600">
                ₱{(totalOverdueBalance / 1000000).toFixed(2)}M
              </span>
            </p>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200 w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search enterprise or ID..."
              className="bg-transparent text-xs text-gray-600 outline-none w-full sm:w-40 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            {
              key: "all",
              label: "All",
              count: counts.all,
              bg: "bg-gray-100",
              active: "bg-gray-700 text-white",
              text: "text-gray-600",
            },
            {
              key: "delinquent",
              label: "Delinquent",
              count: counts.delinquent,
              bg: "bg-red-50",
              active: "bg-red-600 text-white",
              text: "text-red-600",
            },
            {
              key: "overdue",
              label: "Overdue",
              count: counts.overdue,
              bg: "bg-orange-50",
              active: "bg-orange-500 text-white",
              text: "text-orange-600",
            },
            {
              key: "late",
              label: "Late",
              count: counts.late,
              bg: "bg-amber-50",
              active: "bg-amber-500 text-white",
              text: "text-amber-600",
            },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f.key
                  ? f.active + " border-transparent shadow-sm"
                  : f.bg +
                    " " +
                    f.text +
                    " border-gray-200 hover:border-gray-300"
              }`}
            >
              {f.label}
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-white/25" : "bg-white/80"}`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-gray-100">
        {[
          {
            label: "Delinquent",
            value: counts.delinquent,
            sub: "3+ months",
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "Overdue",
            value: counts.overdue,
            sub: "1–2 months",
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            label: "Late",
            value: counts.late,
            sub: "Due soon",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "At-Risk Balance",
            value:
              "₱" +
              (totalOverdueBalance / 1000000).toFixed(1) +
              "M",
            sub: "Total exposure",
            color: "text-red-700",
            bg: "bg-red-50",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`px-4 py-3 ${s.bg} ${i < 3 ? "border-r border-gray-100" : ""}`}
          >
            <p className={`text-xl font-black ${s.color}`}>
              {s.value}
            </p>
            <p className="text-xs font-semibold text-gray-600">
              {s.label}
            </p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden px-4 py-3 space-y-3 border-b border-gray-100">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            No records match your filter.
          </p>
        )}
        {filtered.map((record) => {
          const sc = paymentStatusConfig[record.status];
          const pdc = pdcConfig[record.pdcStatus];
          const isExpanded = expanded === record.id;
          const Icon = sc.icon;

          return (
            <div
              key={record.id}
              className={`rounded-xl border border-gray-200 p-4 space-y-3 ${sc.rowBg}`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : record.id)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 ${sc.bg} rounded-lg flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-4 h-4 ${sc.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 text-sm">
                      {record.enterprise}
                    </p>
                    <p className="text-[10px] text-gray-400">{record.type} Enterprise</p>
                    <p className="text-[11px] font-mono text-gray-500 mt-1">{record.id}</p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Balance</span>
                    <p className="font-bold text-gray-800">{record.totalBalance}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Due</span>
                    <p className="font-medium text-gray-700">{record.dueDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Overdue</span>
                    <p className="font-bold text-red-600">{record.daysOverdue} days</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}
                    >
                      {sc.label}
                    </span>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="pt-3 border-t border-gray-200 space-y-2 text-xs text-gray-600">
                  <p>
                    <span className="font-semibold text-gray-500">Contact:</span>{" "}
                    {record.contactPerson} · {record.phone}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">Monthly:</span>{" "}
                    {record.monthlyAmortization}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">PDC:</span> {pdc.label}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                "Enterprise",
                "ID / Region",
                "Balance",
                "Due Date",
                "Days Overdue",
                "Missed",
                "PDC",
                "Status",
                "",
              ].map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-8 text-center text-sm text-gray-400"
                >
                  No records match your filter.
                </td>
              </tr>
            )}
            {filtered.map((record) => {
              const sc = paymentStatusConfig[record.status];
              const pdc = pdcConfig[record.pdcStatus];
              const isExpanded = expanded === record.id;
              const Icon = sc.icon;

              return (
                <React.Fragment key={record.id}>
                  <tr
                    onClick={() =>
                      setExpanded(isExpanded ? null : record.id)
                    }
                    className={`border-t border-gray-50 cursor-pointer hover:bg-gray-50/80 transition-colors ${sc.rowBg}`}
                  >
                    {/* Enterprise */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 ${sc.bg} rounded-lg flex items-center justify-center shrink-0`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 ${sc.text}`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-xs leading-tight">
                            {record.enterprise}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {record.type} Enterprise
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ID / Region */}
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-mono font-semibold text-gray-600">
                        {record.id}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {record.region}
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-gray-800">
                        {record.totalBalance}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        of {record.approvedAmount}
                      </p>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700 font-medium">
                        {record.dueDate}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Last: {record.lastPayment}
                      </p>
                    </td>

                    {/* Days Overdue */}
                    <td className="px-4 py-3">
                      {record.daysOverdue > 0 ? (
                        <span
                          className={`text-xs font-black ${record.daysOverdue >= 60 ? "text-red-600" : record.daysOverdue >= 30 ? "text-orange-600" : "text-amber-600"}`}
                        >
                          {record.daysOverdue}d
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          —
                        </span>
                      )}
                    </td>

                    {/* Missed payments */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-bold ${record.missedPayments >= 3 ? "text-red-600" : record.missedPayments >= 1 ? "text-orange-500" : "text-gray-400"}`}
                      >
                        {record.missedPayments}x
                      </span>
                    </td>

                    {/* PDC Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pdc.bg} ${pdc.text}`}
                      >
                        {pdc.label}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                        />
                        {sc.label}
                      </span>
                    </td>

                    {/* Expand */}
                    <td className="px-4 py-3">
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <tr
                      key={record.id + "-detail"}
                      className={`border-t border-gray-100 ${sc.rowBg}`}
                    >
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Contact */}
                          <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                              Contact Information
                            </p>
                            <p className="text-xs font-semibold text-gray-800 mb-1">
                              {record.contactPerson}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                              <PhoneCall className="w-3 h-3 text-blue-400" />
                              {record.phone}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail className="w-3 h-3 text-blue-400" />
                              {record.enterprise
                                .toLowerCase()
                                .replace(/\s+/g, ".")}
                              @email.com
                            </div>
                          </div>

                          {/* Payment details */}
                          <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                              Payment Details
                            </p>
                            <div className="space-y-1.5">
                              {[
                                {
                                  label: "Monthly Amortization",
                                  value:
                                    record.monthlyAmortization,
                                },
                                {
                                  label: "Remaining Balance",
                                  value: record.totalBalance,
                                },
                                {
                                  label: "Missed Payments",
                                  value: `${record.missedPayments} month(s)`,
                                },
                                {
                                  label: "PDC Status",
                                  value:
                                    pdcConfig[record.pdcStatus]
                                      .label,
                                },
                              ].map((item) => (
                                <div
                                  key={item.label}
                                  className="flex justify-between text-xs"
                                >
                                  <span className="text-gray-500">
                                    {item.label}
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                              Actions
                            </p>
                            <div className="space-y-2">
                              <button className="w-full flex items-center gap-2 bg-[#0C2461] hover:bg-blue-800 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors">
                                <PhoneCall className="w-3 h-3" />{" "}
                                Send Collection Notice
                              </button>
                              <button className="w-full flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors">
                                <CreditCard className="w-3 h-3" />{" "}
                                Record PDC / Payment
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  record.applicantId &&
                                  onViewAccount?.(record.applicantId)
                                }
                                disabled={!record.applicantId || !onViewAccount}
                                className="w-full flex items-center gap-2 border border-gray-200 text-gray-600 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Eye className="w-3 h-3" /> View
                                Full Account
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-gray-400">
          Showing{" "}
          <span className="font-bold text-gray-600">
            {filtered.length}
          </span>{" "}
          of{" "}
          <span className="font-bold text-gray-600">
            {records.length}
          </span>{" "}
          monitored accounts
        </p>
        <button className="text-xs text-[#0C2461] font-semibold hover:underline flex items-center gap-1">
          Export Report <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
