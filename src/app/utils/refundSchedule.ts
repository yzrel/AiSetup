/**
 * Author: Yzrel Jade B. Eborde
 */

import type { PDCEntry, RefundScheduleRow } from "../api/types";
import { formatCurrency } from "./landBankWithdrawal";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const REFUND_TERM_OPTIONS = [
  { value: "3", label: "3 years" },
  { value: "4", label: "4 years" },
  { value: "5", label: "5 years" },
] as const;

export const REFUND_GRACE_MONTHS = 12;
export const TECHNOLOGY_TRANSFER_FEE_RATE = 0.005;

export interface RefundScheduleInput {
  approvedAmount: number;
  termYears: number;
  projectStartDate?: string;
  equipmentAcquisitionCost?: number;
}

export interface RefundScheduleResult {
  refundSchedule: RefundScheduleRow[];
  pdcs: PDCEntry[];
  technologyTransferFee: number;
  totalRefundWithTtf: number;
  monthlyAmortization: number;
  pdcCount: number;
  refundStartDate: Date;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseTermYears(raw: string | number | undefined): number {
  if (typeof raw === "number") return Math.min(5, Math.max(3, raw));
  const digits = String(raw ?? "").replace(/\D/g, "");
  const n = parseInt(digits, 10);
  if (n >= 3 && n <= 5) return n;
  return 5;
}

/** Years from a selected term label like "4 years". 0 if none is selected. */
export function selectedTermYears(raw: string | number | undefined): number {
  if (typeof raw === "number") return raw >= 3 && raw <= 5 ? raw : 0;
  const digits = String(raw ?? "").replace(/\D/g, "");
  const n = parseInt(digits, 10);
  if (n >= 3 && n <= 5) return n;
  return 0;
}

export function parseFundAmount(raw: string | number | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : 0;
  return parseFloat(String(raw ?? "").replace(/[^\d.]/g, "")) || 0;
}

export function formatMonthlyAmortization(amount: number): string {
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Requested amount ÷ months in the selected repayment term (3–5 years). */
export function computeEstimatedMonthlyAmortization(
  requestedAmount: string | number | undefined,
  repaymentTerm: string | number | undefined,
): string {
  const years = selectedTermYears(repaymentTerm);
  const amount = parseFundAmount(requestedAmount);
  if (years <= 0 || amount <= 0) return "";
  const monthly = Math.round((amount / (years * 12)) * 100) / 100;
  return formatMonthlyAmortization(monthly);
}

export function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** SETUP refund starts after a one-year grace period. */
export function defaultRepaymentStartDate(from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setFullYear(d.getFullYear() + 1);
  return toIsoDateLocal(d);
}

export function applyLoiRepaymentComputations<
  T extends {
    requestedAmount: string;
    repaymentTerm: string;
    monthlyAmortization: string;
    startDate: string;
  },
>(fields: T, now: Date = new Date()): T {
  return {
    ...fields,
    monthlyAmortization: computeEstimatedMonthlyAmortization(
      fields.requestedAmount,
      fields.repaymentTerm,
    ),
    startDate: String(fields.startDate ?? "").trim()
      ? fields.startDate
      : defaultRepaymentStartDate(now),
  };
}

export function computeRefundSchedule(input: RefundScheduleInput): RefundScheduleResult {
  const termYears = Math.min(5, Math.max(3, input.termYears || 5));
  const amount = input.approvedAmount > 0 ? input.approvedAmount : 0;
  const equipCost = input.equipmentAcquisitionCost ?? amount;
  const ttf = Math.round(equipCost * TECHNOLOGY_TRANSFER_FEE_RATE * 100) / 100;
  const totalWithTtf = amount + ttf;

  const startBase = input.projectStartDate
    ? new Date(input.projectStartDate)
    : new Date();
  const refundStart = new Date(startBase);
  refundStart.setMonth(refundStart.getMonth() + REFUND_GRACE_MONTHS);

  const totalMonths = termYears * 12;
  const monthly =
    totalMonths > 0 ? Math.round((amount / totalMonths) * 100) / 100 : 0;

  const refundSchedule: RefundScheduleRow[] = [];
  let balance = amount;
  for (let m = 0; m < totalMonths; m++) {
    const d = new Date(refundStart);
    d.setMonth(d.getMonth() + m);
    balance = Math.max(0, Math.round((balance - monthly) * 100) / 100);
    refundSchedule.push({
      date: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      amount: formatCurrency(monthly),
      balance: formatCurrency(balance),
      status: m === 0 ? "Due" : "Scheduled",
    });
  }

  const pdcCount = totalMonths + 1;
  const pdcs: PDCEntry[] = [];
  for (let i = 0; i < pdcCount; i++) {
    const d = new Date(refundStart);
    if (i < totalMonths) {
      d.setMonth(d.getMonth() + i);
      pdcs.push({
        id: uid(),
        checkNumber: `PDC-${String(i + 1).padStart(4, "0")}`,
        dueDate: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        accountNumber: "",
        amount: formatCurrency(monthly),
        status: "pending",
      });
    } else {
      d.setMonth(d.getMonth() + totalMonths);
      pdcs.push({
        id: uid(),
        checkNumber: `PDC-${String(i + 1).padStart(4, "0")}`,
        dueDate: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        accountNumber: "",
        amount: formatCurrency(ttf),
        status: "pending",
        note: "Technology transfer fee (0.5%)",
      });
    }
  }

  return {
    refundSchedule,
    pdcs,
    technologyTransferFee: ttf,
    totalRefundWithTtf: totalWithTtf,
    monthlyAmortization: monthly,
    pdcCount,
    refundStartDate: refundStart,
  };
}
