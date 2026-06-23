/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant, ModuleStatus } from "../store/applicantStore";
import type {
  DelinquencyStatus,
  PDCEntry,
  RefundDelinquentForm,
  RefundDelinquentStored,
  RefundScheduleRow,
} from "../api/types";
import { getApprovalLetterForm } from "./approvalLetter";
import { getProjectProposalForm } from "./projectProposal";
import { hasProcurementComplete } from "./procurementLiquidation";
import { formatCurrency } from "./landBankWithdrawal";
import { resolveApplicantProvince } from "./provincialOffice";
import { isDemoModeActive } from "./demoMode";

const MODULE_KEY = "refund";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyRefundForm(): RefundDelinquentForm {
  return {
    pdcs: [],
    pdcsRecorded: false,
    refundSchedule: [],
    delinquencyStatus: "monitoring-required",
    soaIssued: false,
  };
}

export function getRefundStored(applicant: Applicant | null): RefundDelinquentStored | null {
  if (!applicant?.moduleData?.[MODULE_KEY]) return null;
  return applicant.moduleData[MODULE_KEY] as RefundDelinquentStored;
}

export function getRefundForm(applicant: Applicant | null): RefundDelinquentForm {
  const stored = getRefundStored(applicant);
  if (stored?.form?.refundSchedule?.length) return stored.form;
  return syncRefundFromProposal(applicant);
}

export function syncRefundFromProposal(applicant: Applicant | null): RefundDelinquentForm {
  const base = getRefundStored(applicant)?.form ?? emptyRefundForm();
  if (!applicant) return base;

  const pp = getProjectProposalForm(applicant);
  const approval = getApprovalLetterForm(applicant);
  const amount =
    parseFloat(
      (approval.approvedAmount || pp.amountRequested || "0").replace(/[^\d.]/g, ""),
    ) || 0;
  const termYears = parseInt(approval.refundTermYears.replace(/\D/g, ""), 10) || 5;
  const monthly = amount > 0 && termYears > 0 ? Math.round(amount / termYears / 12) : 0;

  const schedule: RefundScheduleRow[] = [];
  let balance = amount;
  const startYear = new Date().getFullYear() + 1;
  for (let m = 0; m < Math.min(12, termYears * 12); m++) {
    const month = m % 12;
    const year = startYear + Math.floor(m / 12);
    balance = Math.max(0, balance - monthly);
    schedule.push({
      date: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} ${year}`,
      amount: formatCurrency(monthly),
      balance: formatCurrency(balance),
      status: m === 0 ? "Due" : "Scheduled",
    });
  }

  const pdcs: PDCEntry[] =
    base.pdcs.length > 0
      ? base.pdcs
      : schedule.slice(0, 4).map((row, i) => ({
          id: uid(),
          checkNumber: `PDC-${String(i + 1).padStart(4, "0")}`,
          dueDate: row.date,
          accountNumber: applicant.applicationId ?? `ACC-${applicant.id.slice(0, 6)}`,
          amount: row.amount,
          status: "pending" as const,
        }));

  return {
    ...base,
    pdcs,
    refundSchedule: schedule.length ? schedule : base.refundSchedule,
  };
}

export function hasRefundPrerequisite(applicant: Applicant | null): boolean {
  return hasProcurementComplete(applicant);
}

export function hasRefundComplete(applicant: Applicant | null): boolean {
  return !!getRefundStored(applicant)?.submitted;
}

export function saveRefundDraft(applicantId: string, form: RefundDelinquentForm): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getRefundStored(applicant);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form,
        submitted: existing?.submitted,
        submittedAt: existing?.submittedAt,
        submittedBy: existing?.submittedBy,
        updatedAt: new Date().toISOString(),
      } satisfies RefundDelinquentStored,
    },
  });
}

export function recordPdcs(applicantId: string): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = syncRefundFromProposal(applicant);
  saveRefundDraft(applicantId, { ...form, pdcsRecorded: true });
}

export function setDelinquencyStatus(
  applicantId: string,
  status: DelinquencyStatus,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getRefundForm(applicant);
  saveRefundDraft(applicantId, { ...form, delinquencyStatus: status });
}

export function validateRefundSubmit(applicant: Applicant | null): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!hasRefundPrerequisite(applicant)) {
    errors.push("Complete Procurement & Liquidation (Modules 14–16) before refund monitoring.");
  }
  const form = getRefundForm(applicant);
  if (!form.pdcsRecorded) {
    errors.push("Record post-dated checks (PDCs) before completing monitoring setup.");
  }
  if (form.pdcs.length === 0) {
    errors.push("Refund schedule must include at least one PDC entry.");
  }
  return errors;
}

export function submitRefund(applicantId: string, submittedBy: string): string[] {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return ["Applicant not found."];
  const errors = validateRefundSubmit(applicant);
  if (errors.length) return errors;

  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form: getRefundForm(applicant),
        submitted: true,
        submittedAt: new Date().toISOString(),
        submittedBy,
        updatedAt: new Date().toISOString(),
      } satisfies RefundDelinquentStored,
    },
  });
  return [];
}

export type PaymentMonitorStatus = "overdue" | "late" | "current" | "delinquent";

export interface PaymentMonitorRecord {
  id: string;
  applicantId: string;
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
  status: PaymentMonitorStatus;
  contactPerson: string;
  phone: string;
  monthlyAmortization: string;
}

function mapDelinquencyToPaymentStatus(
  status: DelinquencyStatus,
): PaymentMonitorStatus {
  switch (status) {
    case "delinquent":
    case "under-evaluation":
      return "delinquent";
    case "delayed":
      return "overdue";
    case "current":
      return "current";
    default:
      return "late";
  }
}

function mapDelinquencyToPdcStatus(
  form: RefundDelinquentForm,
): "bounced" | "pending" | "cleared" | "none" {
  const bounced = form.pdcs.some((p) => p.status === "bounced");
  const pending = form.pdcs.some((p) => p.status === "pending");
  const cleared = form.pdcs.every((p) => p.status === "cleared");
  if (bounced) return "bounced";
  if (cleared && form.pdcs.length > 0) return "cleared";
  if (pending) return "pending";
  return "none";
}

const MONITORING_MODULES: ModuleStatus[] = [
  "refund-delinquent",
  "completed",
];

export function getPaymentMonitorRecords(
  applicants: Applicant[],
): PaymentMonitorRecord[] {
  return applicants
    .filter((a) => MONITORING_MODULES.includes(a.currentModule))
    .map((applicant) => {
      const form = getRefundForm(applicant);
      const pp = getProjectProposalForm(applicant);
      const approval = getApprovalLetterForm(applicant);
      const approved = approval.approvedAmount || pp.amountRequested || "₱0";
      const monthly = form.refundSchedule[0]?.amount ?? "₱0";
      const nextPdc = form.pdcs.find((p) => p.status === "pending" || p.status === "bounced");
      const bouncedCount = form.pdcs.filter((p) => p.status === "bounced").length;
      const status = mapDelinquencyToPaymentStatus(form.delinquencyStatus);

      return {
        id: applicant.applicationId ?? applicant.id,
        applicantId: applicant.id,
        enterprise: applicant.enterpriseName,
        region: resolveApplicantProvince(applicant) || "—",
        type: pp.organizationType || "SME",
        approvedAmount: approved,
        totalBalance: form.refundSchedule[form.refundSchedule.length - 1]?.balance ?? approved,
        lastPayment: form.lastPaymentDate ?? "—",
        dueDate: nextPdc?.dueDate ?? "—",
        daysOverdue: status === "delinquent" ? 30 : status === "overdue" ? 14 : 0,
        missedPayments: bouncedCount,
        pdcStatus: mapDelinquencyToPdcStatus(form),
        status,
        contactPerson: applicant.applicantName,
        phone: applicant.contactNumber,
        monthlyAmortization: monthly,
      };
    });
}

export function getFundDisbursementChartData(applicants: Applicant[]) {
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const counts = months.map((month, i) => {
    const count = applicants.filter((a) => {
      const submitted = getRefundStored(a)?.submittedAt;
      if (!submitted) return i < 3;
      const d = new Date(submitted);
      return d.getMonth() === (i + 9) % 12;
    }).length;
    return { month, amount: count * 1.2 + 5 };
  });
  return counts;
}

export function isRefundReadOnly(role: string): boolean {
  return role === "client" || role === "applicant";
}

export function isRefundStaff(role: string): boolean {
  return role === "admin" || role === "agent";
}
