/**
 * Author: Yzrel Jade B. Eborde
 *
 * Status badge configs and types shared by the dashboard tabs.
 * Live chart/table rows come from dashboardMetrics — no sample enterprise fallbacks.
 */

import React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

// ── Payment Monitoring types ──────────────────────────────────────────────────

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

export interface RecentApp {
  name: string;
  status: string;
  date: string;
  type: string;
  amount: string;
  region: string;
  module: string;
}

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
