/**
 * Author: Yzrel Jade B. Eborde
 *
 * Fallback / demo datasets used when live applicant aggregates are empty,
 * plus status badge configs shared by the dashboard tabs.
 */

import React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { REGION_12_LABEL, REGION_12_PROVINCES } from "../../constants/region12";

// ── Payment Monitoring Data ───────────────────────────────────────────────────

export type PaymentStatus =
  | "overdue"
  | "late"
  | "current"
  | "delinquent";

export interface PaymentRecord {
  id: string;
  applicantId?: string;
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

export const FALLBACK_PAYMENT_RECORDS: PaymentRecord[] = [
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

// ── Chart / table fallback (used when live series is empty) ───────────────────

export const pipelineData = [
  { stage: "Pre-Screen", count: 45, fill: "#0C2461" },
  { stage: "Registered", count: 38, fill: "#1a3a7a" },
  { stage: "Documents", count: 32, fill: "#00AEEF" },
  { stage: "Assessment", count: 25, fill: "#0891b2" },
  { stage: "Evaluation", count: 20, fill: "#10b981" },
  { stage: "Approved", count: 18, fill: "#059669" },
  { stage: "Released", count: 12, fill: "#f59e0b" },
];

export const monthlyData = [
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

export const FALLBACK_FUND_DISBURSEMENT = [
  { month: "Oct", amount: 5.2 },
  { month: "Nov", amount: 6.8 },
  { month: "Dec", amount: 4.1 },
  { month: "Jan", amount: 9.4 },
  { month: "Feb", amount: 8.7 },
  { month: "Mar", amount: 11.2 },
  { month: "Apr", amount: 12.0 },
];

export const regionData = [
  { name: REGION_12_PROVINCES[0], value: 35, color: "#0C2461" },
  { name: REGION_12_PROVINCES[4], value: 28, color: "#00AEEF" },
  { name: REGION_12_PROVINCES[2], value: 22, color: "#10b981" },
  { name: REGION_12_PROVINCES[1], value: 18, color: "#f59e0b" },
  { name: REGION_12_PROVINCES[3], value: 12, color: "#8b5cf6" },
];

export const recentApps = [
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

export type RecentApp = (typeof recentApps)[number];

export const topSectors = [
  { sector: "Food Processing", count: 42, pct: 68 },
  { sector: "Agri-processing", count: 28, pct: 45 },
  { sector: "Manufacturing", count: 21, pct: 34 },
  { sector: "ICT Services", count: 14, pct: 23 },
  { sector: "Handicrafts", count: 9, pct: 15 },
];

export const FALLBACK_PROGRAM_KPIS = [
  { label: "Avg. Processing Time", value: "42 days" },
  { label: "Approval Rate", value: "78%" },
  { label: "Avg. Grant Amount", value: "₱2.3M" },
  { label: "Enterprises Upgraded", value: "94" },
  { label: "Jobs Created / Retained", value: "1,240" },
];

export const FALLBACK_REGISTRANT_GENDER = [
  { name: "Male", count: 58, fill: "#0C2461" },
  { name: "Female", count: 41, fill: "#00AEEF" },
  { name: "Prefer not to say", count: 5, fill: "#94a3b8" },
];

export const FALLBACK_OWNER_SEX = [
  { name: "Male", count: 62, fill: "#0C2461" },
  { name: "Female", count: 31, fill: "#10b981" },
  { name: "Unspecified", count: 11, fill: "#94a3b8" },
];

export const FALLBACK_WORKFORCE_GENDER = [
  { name: "Male", count: 720, fill: "#0C2461" },
  { name: "Female", count: 520, fill: "#00AEEF" },
];

export const FALLBACK_QUARTER_COMPARISON = [
  {
    label: "New Applications",
    previous: 68,
    current: 83,
    previousLabel: "Q3",
    currentLabel: "Q4",
    unit: "",
  },
  {
    label: "Approvals",
    previous: 14,
    current: 18,
    previousLabel: "Q3",
    currentLabel: "Q4",
    unit: "",
  },
  {
    label: "Funds Released",
    previous: 29.4,
    current: 42.0,
    previousLabel: "Q3",
    currentLabel: "Q4",
    unit: "₱",
    suffix: "M",
  },
  {
    label: "Avg. Processing Days",
    previous: 48,
    current: 42,
    previousLabel: "Q3",
    currentLabel: "Q4",
    unit: "",
    lower: true,
  },
  {
    label: "Rejection Rate",
    previous: 28,
    current: 22,
    previousLabel: "Q3",
    currentLabel: "Q4",
    unit: "",
    suffix: "%",
    lower: true,
  },
  {
    label: "Enterprises Graduated",
    previous: 71,
    current: 94,
    previousLabel: "Q3",
    currentLabel: "Q4",
    unit: "",
  },
];

export const FALLBACK_LAST_UPDATED = "April 28, 2026 · FY 2024–2025";
// ── Status configs ────────────────────────────────────────────────────────────

export const paymentStatusConfig: Record<
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

export const pdcConfig: Record<
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

export const recentAppStatusConfig: Record<
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
