/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import {
  CheckCircle,
  Download,
  FileText,
  ChevronRight,
  AlertTriangle,
  Clock,
  CreditCard,
  Calendar,
  BarChart2,
  Shield,
  User,
  RefreshCw,
  Eye,
  AlertCircle,
  TrendingDown,
  Bell,
  ClipboardList,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus =
  | "monitoring-required"
  | "current"
  | "delayed"
  | "delinquent"
  | "under-evaluation";

interface PDCEntry {
  id: string;
  checkNumber: string;
  dueDate: string;
  accountNumber: string;
  amount: string;
  status: "pending" | "cleared" | "bounced";
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function StepFlow({
  steps,
  activeIndex,
}: {
  steps: {
    label: string;
    icon: React.ReactNode;
    color: string;
  }[];
  activeIndex: number;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap mb-5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 overflow-x-auto">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              i === activeIndex
                ? `${step.color} text-white`
                : i < activeIndex
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < activeIndex ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              step.icon
            )}
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  number,
  title,
  collapsible = false,
}: {
  number: number;
  title: string;
  collapsible?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
        {number}
      </span>
      <h3 className="font-bold text-sm text-gray-800">
        {title}
      </h3>
      {collapsible && (
        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto rotate-90" />
      )}
    </div>
  );
}

function StatusBadge({
  label,
  color,
}: {
  label: string;
  color: "green" | "amber" | "red" | "blue" | "gray";
}) {
  const c = {
    green: "bg-green-100 text-green-700 border-green-300",
    amber: "bg-amber-100 text-amber-700 border-amber-300",
    red: "bg-red-100 text-red-700 border-red-300",
    blue: "bg-blue-100 text-blue-700 border-blue-300",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  }[color];
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${c}`}
    >
      {label}
    </span>
  );
}

// ── PDC Schedule Table ────────────────────────────────────────────────────────

const SAMPLE_PDCS: PDCEntry[] = [
  {
    id: "1",
    checkNumber: "33210-1J9",
    dueDate: "01/03/24",
    accountNumber: "PHUECOS4816",
    amount: "₱4,610.1M",
    status: "pending",
  },
  {
    id: "2",
    checkNumber: "33230-1J4",
    dueDate: "01/03/25",
    accountNumber: "PACHOCE5946",
    amount: "₱4,610.1M",
    status: "cleared",
  },
  {
    id: "3",
    checkNumber: "34519-C9t",
    dueDate: "01/03/26",
    accountNumber: "ACOCCHU875",
    amount: "₱3,610.1M",
    status: "pending",
  },
  {
    id: "4",
    checkNumber: "KPCAM-1J5.4",
    dueDate: "01/03/27",
    accountNumber: "AC/P/CHOS575",
    amount: "₱3,610.1M",
    status: "bounced",
  },
];

function PDCTable({ rows }: { rows: PDCEntry[] }) {
  const statusColor = {
    pending: "blue",
    cleared: "green",
    bounced: "red",
  } as const;
  const statusLabel = {
    pending: "Pending",
    cleared: "Cleared",
    bounced: "Bounced",
  };
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
      <div className="bg-blue-600 text-white grid grid-cols-5 px-3 py-2 font-semibold gap-2">
        {[
          "Check Number",
          "Due Date",
          "Account Number",
          "Amount",
          "Status",
        ].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {rows.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-5 gap-2 px-3 py-2 border-t border-gray-100 hover:bg-gray-50"
        >
          <span className="font-medium text-gray-800">
            {r.checkNumber}
          </span>
          <span className="text-gray-600">{r.dueDate}</span>
          <span className="text-gray-600">
            {r.accountNumber}
          </span>
          <span className="font-semibold text-gray-800">
            {r.amount}
          </span>
          <StatusBadge
            label={statusLabel[r.status]}
            color={statusColor[r.status]}
          />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 15: Refund Schedule Management
// ═══════════════════════════════════════════════════════════════════════════════

function Module15Refund() {
  const [pdcsRecorded, setPdcsRecorded] = useState(false);

  const steps = [
    {
      label: "Record PDCs",
      icon: <CreditCard className="w-3 h-3" />,
      color: "bg-blue-600",
    },
    {
      label: "Generate Refund Schedule",
      icon: <RefreshCw className="w-3 h-3" />,
      color: "bg-blue-600",
    },
    {
      label: "Issue SOA",
      icon: <FileText className="w-3 h-3" />,
      color: "bg-blue-600",
    },
    {
      label: "Record Payments",
      icon: <CheckCircle className="w-3 h-3" />,
      color: "bg-blue-600",
    },
    {
      label: "Monitor Status",
      icon: <Eye className="w-3 h-3" />,
      color: "bg-blue-600",
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-blue-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Refund Schedule Management
      </div>

      <div className="p-5">
        {/* Progress indicator */}
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              Withdraw Grace Period
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-amber-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-4/5" />
            </div>
            <span className="text-xs font-semibold text-amber-700">
              Checks, May 2024
            </span>
          </div>
        </div>

        {/* Step flow */}
        <StepFlow steps={steps} activeIndex={0} />

        {/* Two-column sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: Recording PDCs */}
          <div className="border border-gray-200 rounded-lg p-4">
            <SectionHeader
              number={1}
              title="Recording of Post-Dated Checks (PDCs)"
            />

            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-700 mb-2 border-b border-blue-200 pb-1">
                <span>Dost Listed Refund Schedule</span>
                <span>Balance: Full Refunds</span>
              </div>
              <PDCTable rows={SAMPLE_PDCS} />
            </div>

            <button
              onClick={() => setPdcsRecorded(true)}
              className={`flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                pdcsRecorded
                  ? "bg-green-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {pdcsRecorded ? "PDCs Recorded ✓" : "Record PDCs"}
            </button>
          </div>

          {/* Section 2: Generate Refund Schedule */}
          <div className="border border-gray-200 rounded-lg p-4">
            <SectionHeader
              number={2}
              title="Generate Refund Schedule"
            />

            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-600 leading-relaxed space-y-1">
              <p>Generated refund schedule:</p>
              <p>
                The potential returns ...
              </p>
              <p className="text-blue-500 underline cursor-pointer">
                With meter refund status...
              </p>

              {/* Mock schedule table */}
              <div className="mt-3 border border-gray-200 rounded overflow-hidden">
                <div className="bg-blue-600 text-white grid grid-cols-4 text-[10px] px-2 py-1 font-semibold gap-1">
                  {["Date", "Amount", "Balance", "Status"].map(
                    (h) => (
                      <span key={h}>{h}</span>
                    ),
                  )}
                </div>
                {[
                  ["Jan 2025", "₱15,000", "₱1,985,000", "—"],
                  ["Feb 2025", "₱15,000", "₱1,970,000", "—"],
                  ["Mar 2025", "₱15,000", "₱1,955,000", "—"],
                  ["Apr 2025", "₱15,000", "₱1,940,000", "—"],
                ].map(([d, a, b, s], i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 gap-1 px-2 py-1 text-[10px] text-gray-700 border-t border-gray-100"
                  >
                    <span>{d}</span>
                    <span>{a}</span>
                    <span>{b}</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
              <Download className="w-4 h-4" />
              Download Refund Schedule
            </button>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-blue-400" />{" "}
            n&amp;6 hS;Od Accoment RDCIs
          </span>
          <span className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" /> Send by
            PSTO-Officer who update PDCs
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-green-500" />{" "}
            Check date: a0J
          </span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-blue-500" />{" "}
            Payment receipts
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 17: Delinquent Account Management — State A (Payment Current)
// ═══════════════════════════════════════════════════════════════════════════════

function Module17StateA() {
  const steps = [
    {
      label: "Payment Monitoring Required",
      icon: <Bell className="w-3 h-3" />,
      color: "bg-red-500",
    },
    {
      label: "Payment Current",
      icon: <CheckCircle className="w-3 h-3" />,
      color: "bg-green-600",
    },
    {
      label: "Payment Delayed",
      icon: <Clock className="w-3 h-3" />,
      color: "bg-amber-500",
    },
    {
      label: "Delinquent",
      icon: <AlertTriangle className="w-3 h-3" />,
      color: "bg-red-600",
    },
    {
      label: "Under Evaluation",
      icon: <Eye className="w-3 h-3" />,
      color: "bg-blue-600",
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-blue-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2">
        <TrendingDown className="w-4 h-4" />
        Delinquent Account Management
        <StatusBadge label="Payment Current" color="green" />
      </div>

      <div className="p-5">
        <StepFlow steps={steps} activeIndex={1} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: Detection */}
          <div className="border border-gray-200 rounded-lg p-4">
            <SectionHeader
              number={1}
              title="Detection of Delinquent Accounts"
              collapsible
            />
            <p className="text-sm text-gray-600 mb-4">
              After the MOA signing the cooperator will submit
              Post Dated Checks (PDCs) corresponding to the
              agreed refund schedule.
            </p>
            <button className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
              <CreditCard className="w-4 h-4" />
              Record PDCs
            </button>
          </div>

          {/* Right: mock dashboard */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Stoon Danten
            </p>
            <div className="bg-blue-50 rounded-lg p-3 space-y-1.5 text-xs mb-3">
              <p className="font-semibold text-blue-700 border-b border-blue-200 pb-1">
                Ewentouam Rletent !
              </p>
              {[
                ["CLAMM", "Chiannociana"],
                ["Dinum Channopame", "CONDOSIOM"],
                ["ZMF EUROSUM, VULGOUS", "CAN 08"],
              ].map(([a, b], i) => (
                <div
                  key={i}
                  className="flex justify-between text-gray-700"
                >
                  <span>{a}</span>
                  <span className="text-gray-500">{b}</span>
                </div>
              ))}
              <div className="text-right font-bold text-blue-700 pt-1 border-t border-blue-200">
                + dl 3001
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
              <Download className="w-4 h-4" />
              Download Refund Schedule
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="font-semibold text-gray-700">
            PSTO-Officer
          </span>
          <span>
            gegerate this coalt;- tineatte -a09-payments.
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 17: Delinquent Account Management — State B (Delayed / Delinquent)
// ═══════════════════════════════════════════════════════════════════════════════

function Module17StateB() {
  const steps = [
    {
      label: "Payment Monitoring Required",
      icon: <Bell className="w-3 h-3" />,
      color: "bg-red-500",
    },
    {
      label: "Payment Delayed",
      icon: <Clock className="w-3 h-3" />,
      color: "bg-amber-500",
    },
    {
      label: "Delinquent Account",
      icon: <AlertTriangle className="w-3 h-3" />,
      color: "bg-red-600",
    },
    {
      label: "Under Evaluation",
      icon: <Eye className="w-3 h-3" />,
      color: "bg-blue-600",
    },
  ];

  const pdcStatuses = [
    {
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      label: "Payment Current",
      color: "text-green-600",
    },
    {
      icon: (
        <AlertTriangle className="w-4 h-4 text-amber-500" />
      ),
      label: "Payment Delayed",
      color: "text-amber-600",
    },
    {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      label: "Delinquent Account",
      color: "text-red-600",
    },
  ];

  const monitoringItems = [
    "Pecortaling Rectired",
    "Ehvum - P/leomy gstovt",
    "Inroatoal 1, Lalev",
    "Drosapost, Uleov",
    "Bivum Satoalm",
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-red-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Delinquent Account Management
        <StatusBadge label="Under Evaluation" color="amber" />
      </div>

      <div className="p-5">
        <StepFlow steps={steps} activeIndex={3} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: Detection (expanded with states) */}
          <div className="border border-gray-200 rounded-lg p-4">
            <SectionHeader
              number={1}
              title="Detection of Delinquent Accounts"
              collapsible
            />

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 mb-4 flex flex-col gap-3">
              {/* Illustration placeholder */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow mx-auto">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              {pdcStatuses.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm"
                >
                  {s.icon}
                  <span
                    className={`text-sm font-semibold ${s.color}`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <button className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
              <Eye className="w-4 h-4" />
              Monitor Payment PDCs
            </button>
          </div>

          {/* Section 3: Monitoring of PDCs */}
          <div className="border border-gray-200 rounded-lg p-4">
            <SectionHeader
              number={3}
              title="Monitoring of Post-Dated Checks (PDCs)"
            />

            <div className="bg-blue-50 rounded-lg p-3 mb-4 space-y-1.5">
              <p className="text-xs font-semibold text-blue-700 border-b border-blue-200 pb-1">
                Fecortoling Rectired
              </p>
              {monitoringItems.slice(1).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-gray-700"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            {/* Right-side person illustration */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg h-20 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto shadow">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-[10px] text-blue-600 mt-1 font-medium">
                  PDC Monitoring
                </p>
              </div>
            </div>

            <button className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
              <Eye className="w-4 h-4" />
              Monitor Payment PDCs
            </button>
          </div>
        </div>

        {/* Alert banner */}
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            <span className="font-semibold">
              Delinquency Notice:
            </span>{" "}
            This account has been flagged for delayed payments.
            The PSTO Officer has been notified for evaluation.
            Please ensure all Post-Dated Checks are updated and
            coordinate with your DOST provincial office
            immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

interface RefundAndDelinquentProps {
  onSubmitSuccess?: () => void;
}

export function RefundAndDelinquent({ onSubmitSuccess }: RefundAndDelinquentProps = {}) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Module 15: Refund Schedule */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            <span className="text-gray-400 font-normal">
              
            </span>{" "}
            Refund Schedule Management
          </h1>
          <p className="text-gray-500 text-sm max-w-3xl mb-1">
            After the project has been implemented and
            monitored, the cooperator must begin the repayment
            of the SETUP assistance based on the agreed refund
            schedule.
          </p>
          <p className="text-gray-500 text-sm max-w-3xl mb-1">
            SETUP operates under a revolving fund mechanism,
            wherein the financial assistance provided to
            enterprises must be refunded to allow DOST to
            support additional enterprises in the future.
          </p>
          <p className="text-gray-500 text-sm max-w-3xl mb-4">
            Upon MOA signing, the cooperator shall provide Post
            Ibadal Datons (PDCs) corresponding to the scheduled
            payments that will take effect after the one-year
            grace period.
          </p>
          <Module15Refund />
        </div>

        {/* Module 17 State A: Payment Current */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            <span className="text-gray-400 font-normal">
              
            </span>{" "}
            Delinquent Account Management
            <span className="ml-2 text-base font-normal text-green-600">
              — Payment Current
            </span>
          </h1>
          <Module17StateA />
        </div>

        {/* Module 17 State B: Under Evaluation */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            <span className="text-gray-400 font-normal">
              
            </span>{" "}
            Delinquent Account Management
            <span className="ml-2 text-base font-normal text-red-500">
              — Delinquent / Under Evaluation
            </span>
          </h1>
          <Module17StateB />
        </div>
      </div>
    </div>
  );
}