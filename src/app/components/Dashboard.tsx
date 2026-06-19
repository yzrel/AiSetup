import React, { useState } from "react";
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Banknote,
  FileText,
  AlertCircle,
  MapPin,
  Calendar,
  Activity,
  Target,
  Award,
  Zap,
  ChevronRight,
  AlertTriangle,
  XCircle,
  CreditCard,
  PhoneCall,
  Mail,
  Filter,
  Search,
  ChevronDown,
  Eye,
} from "lucide-react";
import { ApplicantListView } from "./ApplicantListView";
import { authStore, AuthUser, DashboardTab } from "../store/authStore";
import { REGION_12_LABEL, REGION_12_PROVINCES } from "../constants/region12";

// ── Payment Monitoring Data ───────────────────────────────────────────────────

type PaymentStatus =
  | "overdue"
  | "late"
  | "current"
  | "delinquent";

interface PaymentRecord {
  id: string;
  enterprise: string;
  region: string;
  type: string;
  approvedAmount: string;
  totalBalance: string;
  lastPayment: string;
  dueDate: string;
  daysOverdue: number;
  missedPayments: number;
  pdcStatus: "bounced" | "pending" | "cleared" | "none";
  status: PaymentStatus;
  contactPerson: string;
  phone: string;
  monthlyAmortization: string;
}

const paymentRecords: PaymentRecord[] = [
  {
    id: "LOI-2024-000012",
    enterprise: "XYZ Manufacturing Co.",
    region: REGION_12_PROVINCES[4],
    type: "Medium",
    approvedAmount: "₱4,500,000",
    totalBalance: "₱3,240,000",
    lastPayment: "Jan 15, 2026",
    dueDate: "Feb 15, 2026",
    daysOverdue: 72,
    missedPayments: 3,
    pdcStatus: "bounced",
    status: "delinquent",
    contactPerson: "Maria Santos",
    phone: "09171234567",
    monthlyAmortization: "₱45,000",
  },
  {
    id: "LOI-2024-000034",
    enterprise: "Sunrise Agri-Products",
    region: REGION_12_PROVINCES[0],
    type: "Small",
    approvedAmount: "₱2,000,000",
    totalBalance: "₱1,560,000",
    lastPayment: "Feb 28, 2026",
    dueDate: "Mar 31, 2026",
    daysOverdue: 28,
    missedPayments: 1,
    pdcStatus: "pending",
    status: "overdue",
    contactPerson: "Jose Reyes",
    phone: "09189876543",
    monthlyAmortization: "₱28,000",
  },
  {
    id: "LOI-2023-000089",
    enterprise: "Northern Star Textiles",
    region: REGION_12_PROVINCES[2],
    type: "Small",
    approvedAmount: "₱1,800,000",
    totalBalance: "₱900,000",
    lastPayment: "Mar 10, 2026",
    dueDate: "Apr 10, 2026",
    daysOverdue: 18,
    missedPayments: 1,
    pdcStatus: "bounced",
    status: "overdue",
    contactPerson: "Ana Cruz",
    phone: "09201122334",
    monthlyAmortization: "₱22,500",
  },
  {
    id: "LOI-2024-000056",
    enterprise: "Pacific Seafood Processors",
    region: REGION_12_PROVINCES[1],
    type: "Medium",
    approvedAmount: "₱3,200,000",
    totalBalance: "₱2,880,000",
    lastPayment: "Mar 28, 2026",
    dueDate: "Apr 28, 2026",
    daysOverdue: 0,
    missedPayments: 0,
    pdcStatus: "pending",
    status: "late",
    contactPerson: "Ramon Dela Cruz",
    phone: "09154433221",
    monthlyAmortization: "₱38,000",
  },
  {
    id: "LOI-2023-000112",
    enterprise: "Mindanao Craft Industries",
    region: REGION_12_PROVINCES[3],
    type: "Micro",
    approvedAmount: "₱800,000",
    totalBalance: "₱720,000",
    lastPayment: "Mar 5, 2026",
    dueDate: "Apr 5, 2026",
    daysOverdue: 23,
    missedPayments: 1,
    pdcStatus: "none",
    status: "overdue",
    contactPerson: "Lorna Magtanggol",
    phone: "09278899001",
    monthlyAmortization: "₱10,000",
  },
  {
    id: "LOI-2024-000078",
    enterprise: "SOCCSKSARGEN Food Solutions",
    region: REGION_12_PROVINCES[0],
    type: "Small",
    approvedAmount: "₱2,500,000",
    totalBalance: "₱2,100,000",
    lastPayment: "Feb 1, 2026",
    dueDate: "Mar 1, 2026",
    daysOverdue: 58,
    missedPayments: 2,
    pdcStatus: "bounced",
    status: "delinquent",
    contactPerson: "Eduardo Villanueva",
    phone: "09335566778",
    monthlyAmortization: "₱32,000",
  },
];

// ── Data ──────────────────────────────────────────────────────────────────────

const pipelineData = [
  { stage: "Pre-Screen", count: 45, fill: "#0C2461" },
  { stage: "Registered", count: 38, fill: "#1a3a7a" },
  { stage: "Documents", count: 32, fill: "#00AEEF" },
  { stage: "Assessment", count: 25, fill: "#0891b2" },
  { stage: "Evaluation", count: 20, fill: "#10b981" },
  { stage: "Approved", count: 18, fill: "#059669" },
  { stage: "Released", count: 12, fill: "#f59e0b" },
];

const monthlyData = [
  { month: "Oct", applications: 22, approved: 8, released: 4 },
  { month: "Nov", applications: 28, approved: 10, released: 6 },
  { month: "Dec", applications: 18, approved: 7, released: 5 },
  { month: "Jan", applications: 34, approved: 12, released: 8 },
  { month: "Feb", applications: 31, approved: 14, released: 9 },
  {
    month: "Mar",
    applications: 42,
    approved: 16,
    released: 11,
  },
  {
    month: "Apr",
    applications: 38,
    approved: 18,
    released: 12,
  },
];

const fundData = [
  { month: "Oct", amount: 8.2 },
  { month: "Nov", amount: 11.5 },
  { month: "Dec", amount: 7.8 },
  { month: "Jan", amount: 14.2 },
  { month: "Feb", amount: 13.6 },
  { month: "Mar", amount: 18.9 },
  { month: "Apr", amount: 16.4 },
];

const regionData = [
  { name: REGION_12_PROVINCES[0], value: 35, color: "#0C2461" },
  { name: REGION_12_PROVINCES[4], value: 28, color: "#00AEEF" },
  { name: REGION_12_PROVINCES[2], value: 22, color: "#10b981" },
  { name: REGION_12_PROVINCES[1], value: 18, color: "#f59e0b" },
  { name: REGION_12_PROVINCES[3], value: 12, color: "#8b5cf6" },
];

const recentApps = [
  {
    name: "ABC Food Processing",
    status: "Approved",
    date: "Apr 27, 2026",
    type: "Small",
    amount: "₱2.0M",
    region: REGION_12_LABEL,
    module: "Module 9",
  },
  {
    name: "Tech Innovations Inc.",
    status: "On Assessment",
    date: "Apr 25, 2026",
    type: "Medium",
    amount: "₱4.2M",
    region: REGION_12_PROVINCES[4],
    module: "Module 5",
  },
  {
    name: "Digital Solutions Co.",
    status: "Registered",
    date: "Apr 24, 2026",
    type: "Micro",
    amount: "₱1.8M",
    region: REGION_12_PROVINCES[2],
    module: "Step 2",
  },
  {
    name: "Smart Systems Corp.",
    status: "Requirements",
    date: "Apr 23, 2026",
    type: "Small",
    amount: "₱3.5M",
    region: REGION_12_PROVINCES[1],
    module: "Step 4",
  },
  {
    name: "CloudTech Enterprises",
    status: "Pre-Screening",
    date: "Apr 22, 2026",
    type: "Medium",
    amount: "₱5.0M",
    region: REGION_12_PROVINCES[3],
    module: "Step 1",
  },
];

const alerts = [
  {
    type: "warning",
    msg: "3 applications pending RTEC evaluation for over 30 days",
    time: "2h ago",
  },
  {
    type: "info",
    msg: "New LandBank account verification required for 5 enterprises",
    time: "4h ago",
  },
  {
    type: "success",
    msg: "ABC Food Processing — MOA signed successfully",
    time: "1d ago",
  },
  {
    type: "warning",
    msg: "PDC payment overdue: XYZ Manufacturing Co.",
    time: "2d ago",
  },
];

const topSectors = [
  { sector: "Food Processing", count: 42, pct: 68 },
  { sector: "Agri-processing", count: 28, pct: 45 },
  { sector: "Manufacturing", count: 21, pct: 34 },
  { sector: "ICT Services", count: 14, pct: 23 },
  { sector: "Handicrafts", count: 9, pct: 15 },
];

// ── Payment Status Config ─────────────────────────────────────────────────────

const paymentStatusConfig: Record<
  PaymentStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ElementType;
    rowBg: string;
  }
> = {
  delinquent: {
    label: "Delinquent",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    icon: XCircle,
    rowBg: "bg-red-50/50",
  },
  overdue: {
    label: "Overdue",
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    icon: AlertTriangle,
    rowBg: "bg-orange-50/30",
  },
  late: {
    label: "Late",
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: Clock,
    rowBg: "bg-amber-50/30",
  },
  current: {
    label: "Current",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    icon: CheckCircle,
    rowBg: "",
  },
};

const pdcConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  bounced: {
    label: "Bounced",
    bg: "bg-red-100",
    text: "text-red-600",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-100",
    text: "text-amber-600",
  },
  cleared: {
    label: "Cleared",
    bg: "bg-green-100",
    text: "text-green-600",
  },
  none: {
    label: "No PDC",
    bg: "bg-gray-100",
    text: "text-gray-500",
  },
};

// ── Payment Monitoring Panel ──────────────────────────────────────────────────

function PaymentMonitor() {
  const [filter, setFilter] = useState<"all" | PaymentStatus>(
    "all",
  );
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = paymentRecords.filter((r) => {
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
    all: paymentRecords.length,
    delinquent: paymentRecords.filter(
      (r) => r.status === "delinquent",
    ).length,
    overdue: paymentRecords.filter(
      (r) => r.status === "overdue",
    ).length,
    late: paymentRecords.filter((r) => r.status === "late")
      .length,
    current: paymentRecords.filter(
      (r) => r.status === "current",
    ).length,
  };

  const totalOverdueBalance = paymentRecords
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
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
                              <button className="w-full flex items-center gap-2 border border-gray-200 text-gray-600 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
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
            {paymentRecords.length}
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

const statusConfig: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  Approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  "On Assessment": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  Registered: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  Requirements: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  "Pre-Screening": {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
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

function SectionTitle({
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

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function Dashboard({ user }: { user: AuthUser }) {
  const allowedTabs = authStore.getAllowedDashboardTabs(user.role);
  const isClientView = authStore.isClientRole(user.role);
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    allowedTabs[0] ?? "overview",
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
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
              : "Last updated: April 28, 2026 · FY 2024–2025"}
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

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isClientView ? (
          <>
            <StatCard
              label="Application Status"
              value="In Progress"
              sub="Pre-Screening stage"
              icon={Activity}
              color="bg-[#0C2461]"
              trend="Step 1 of 13"
            />
            <StatCard
              label="Documents Submitted"
              value="2 / 8"
              sub="Requirements pending"
              icon={FileText}
              color="bg-[#00AEEF]"
              trend="6 remaining"
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
              label="Assigned Agent"
              value="Pending"
              sub="Will be assigned after review"
              icon={PhoneCall}
              color="bg-amber-500"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Total Applicants"
              value="170"
              sub="Across all modules"
              icon={Users}
              color="bg-[#0C2461]"
              trend="+12 this month"
            />
            <StatCard
              label="Active Applications"
              value="83"
              sub="Currently in progress"
              icon={Activity}
              color="bg-[#00AEEF]"
              trend="+5 this week"
            />
            <StatCard
              label="Approved Projects"
              value="18"
              sub="78% approval rate"
              icon={CheckCircle}
              color="bg-emerald-600"
              trend="+3 this month"
            />
            <StatCard
              label="Funds Released"
              value="₱42M"
              sub="FY 2024–2025 total"
              icon={Banknote}
              color="bg-amber-500"
              trend="₱4.1M this month"
            />
          </>
        )}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <>
          {isClientView ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <SectionTitle sub="Track your SETUP application progress">
                Application Progress
              </SectionTitle>
              <div className="mt-4 space-y-3">
                {[
                  { step: "Pre-Screening", status: "current" },
                  { step: "Enterprise Registration", status: "upcoming" },
                  { step: "Letter of Intent", status: "upcoming" },
                  { step: "Submit Requirements", status: "upcoming" },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      item.status === "current"
                        ? "border-[#0C2461]/20 bg-blue-50"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    {item.status === "current" ? (
                      <Clock className="w-5 h-5 text-[#0C2461] shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-gray-300 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.step}</p>
                      <p className="text-xs text-gray-400 capitalize">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Use the sidebar to complete each application step. DOST will review
                assessments and approvals on your behalf.
              </p>
            </div>
          ) : (
            <>
          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pipeline bar chart */}
            <div className="md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle sub="Number of applicants at each stage">
                Application Pipeline
              </SectionTitle>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={pipelineData} barSize={30}>
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
                    {pipelineData.map((entry, i) => (
                      <Cell key={`bar-cell-${i}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Regional breakdown */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle sub="Applications by province in Region XII">
                Region XII Breakdown
              </SectionTitle>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={58}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {regionData.map((r, i) => (
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
              <div className="space-y-1.5 mt-1">
                {regionData.map((r) => (
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

          {/* Second row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Top sectors */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle sub="Most active industries">
                Top Sectors
              </SectionTitle>
              <div className="space-y-3">
                {topSectors.map((s, i) => (
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
                {[
                  {
                    label: "Avg. Processing Time",
                    value: "42 days",
                    icon: Clock,
                    color: "text-blue-500",
                  },
                  {
                    label: "Approval Rate",
                    value: "78%",
                    icon: Target,
                    color: "text-emerald-500",
                  },
                  {
                    label: "Avg. Grant Amount",
                    value: "₱2.3M",
                    icon: Award,
                    color: "text-amber-500",
                  },
                  {
                    label: "Enterprises Upgraded",
                    value: "94",
                    icon: Zap,
                    color: "text-purple-500",
                  },
                  {
                    label: "Jobs Created / Retained",
                    value: "1,240",
                    icon: Users,
                    color: "text-[#0C2461]",
                  },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={kpi.label}
                      className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-3.5 h-3.5 ${kpi.color} shrink-0`}
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
                    alerts.filter((a) => a.type === "warning")
                      .length
                  }{" "}
                  warnings
                </span>
              </div>
              <div className="space-y-2.5">
                {alerts.slice(0, 3).map((alert, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 p-2.5 rounded-lg text-xs ${
                      alert.type === "warning"
                        ? "bg-amber-50 border border-amber-100"
                        : alert.type === "success"
                          ? "bg-emerald-50 border border-emerald-100"
                          : "bg-blue-50 border border-blue-100"
                    }`}
                  >
                    <AlertCircle
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        alert.type === "warning"
                          ? "text-amber-500"
                          : alert.type === "success"
                            ? "text-emerald-500"
                            : "text-blue-500"
                      }`}
                    />
                    <div>
                      <p className="text-gray-700 leading-snug">
                        {alert.msg}
                      </p>
                      <p className="text-gray-400 mt-0.5">
                        {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
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
              <button className="text-xs text-[#0C2461] font-semibold hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    {[
                      "Enterprise",
                      "Region",
                      "Type",
                      "Amount",
                      "Current Stage",
                      "Date",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map((app, i) => {
                    const sc =
                      statusConfig[app.status] ||
                      statusConfig["Pre-Screening"];
                    return (
                      <tr
                        key={i}
                        className="border-t border-gray-50 hover:bg-[#0C2461]/[0.02] transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-[#0C2461]/10 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5 text-[#0C2461]" />
                            </div>
                            <span className="font-semibold text-gray-800 text-xs">
                              {app.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {app.region}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          {app.type}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-gray-800">
                          {app.amount}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] bg-[#0C2461]/8 text-[#0C2461] font-semibold px-2 py-0.5 rounded">
                            {app.module}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[11px] text-gray-400 whitespace-nowrap">
                          {app.date}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                            />
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Payment Monitoring ── */}
          <PaymentMonitor />
            </>
          )}
        </>
      )}

      {/* ── Analytics Tab (staff only) ── */}
      {activeTab === "analytics" && authStore.canAccessDashboardTab(user.role, "analytics") && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Monthly trend */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle sub="Applications, approvals, and releases per month">
                Monthly Trends
              </SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
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
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={fundData}>
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

          {/* Comparison table */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <SectionTitle sub="Current vs previous quarter">
              Quarter Comparison
            </SectionTitle>
            <div className="grid grid-cols-3 gap-6">
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
      )}

      {/* ── Alerts Tab ── */}
      {activeTab === "alerts" && authStore.canAccessDashboardTab(user.role, "alerts") && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 mb-2">
            {[
              {
                label: "Warnings",
                count: 2,
                color:
                  "bg-amber-50 border-amber-200 text-amber-700",
              },
              {
                label: "Notifications",
                count: 1,
                color:
                  "bg-blue-50 border-blue-200 text-blue-700",
              },
              {
                label: "Completed",
                count: 1,
                color:
                  "bg-emerald-50 border-emerald-200 text-emerald-700",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-4 text-center ${s.color}`}
              >
                <p className="text-2xl font-black">{s.count}</p>
                <p className="text-xs font-semibold">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex gap-3 p-4 rounded-xl border text-sm ${
                alert.type === "warning"
                  ? "bg-amber-50 border-amber-200"
                  : alert.type === "success"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-blue-50 border-blue-200"
              }`}
            >
              <AlertCircle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  alert.type === "warning"
                    ? "text-amber-500"
                    : alert.type === "success"
                      ? "text-emerald-500"
                      : "text-blue-500"
                }`}
              />
              <div className="flex-1">
                <p className="text-gray-800 font-medium">
                  {alert.msg}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {alert.time}
                </p>
              </div>
              <button className="text-xs font-semibold text-gray-500 hover:text-gray-700 shrink-0">
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Applicant Registry Tab ── */}
      {activeTab === "registry" && authStore.canAccessDashboardTab(user.role, "registry") && (
        <ApplicantListView
          module="prescreening"
          title="All Applicants"
        />
      )}
    </div>
  );
}