/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import {
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Mic,
  Globe,
  FileText,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckSquare,
  Square,
} from "lucide-react";

// ── Step Progress Bar ─────────────────────────────────────────────────────────

function StepBar({
  current = 8,
  total = 10,
}: {
  current?: number;
  total?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => i + 1).map(
        (n) => (
          <div
            key={n}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              n < current
                ? "bg-green-500 border-green-500 text-white"
                : n === current
                  ? "bg-blue-600 border-blue-600 text-white ring-2 ring-blue-300"
                  : "bg-white border-gray-300 text-gray-400"
            }`}
          >
            {n}
          </div>
        ),
      )}
    </div>
  );
}

// ── Status Tracker Tab ────────────────────────────────────────────────────────

type RTECStatus =
  | "for-scheduling"
  | "scheduled"
  | "under-evaluation";

function StatusTab({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
        active
          ? `${color} text-white`
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

// ── Timeline Item ─────────────────────────────────────────────────────────────

function TimelineItem({
  done,
  label,
  sub,
}: {
  done: boolean;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-green-500" : "bg-amber-100 border-2 border-amber-300"}`}
        >
          {done ? (
            <CheckCircle className="w-3.5 h-3.5 text-white" />
          ) : (
            <Square className="w-3 h-3 text-amber-400" />
          )}
        </div>
        <div className="w-px flex-1 bg-gray-200 my-1" />
      </div>
      <div className="pb-3 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800">
            {label}
          </p>
          {done && (
            <span className="text-xs text-blue-500 italic">
              Scheduled
            </span>
          )}
        </div>
        {sub && (
          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Checklist Sidebar ─────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  "Project Overview",
  "Objectives",
  "Technical Interventions",
  "Equipment Specifications",
  "Budget Breakdown",
  "Schedule of Activities",
  "Expected Outcomes",
];

// ── RTEC Members ──────────────────────────────────────────────────────────────

const RTEC_MEMBERS = [
  {
    name: "Engr. Mark Santos",
    role: "Skills and Expertise",
    avatar: "👨‍💼",
  },
  {
    name: "Dr. Maria Reyes",
    role: "Food Technology Expert",
    avatar: "👩‍🔬",
  },
  {
    name: "Mr. Pedro Dela Cruz",
    role: "Industry Consultant",
    avatar: "👨‍💻",
  },
];

// ── Budget Rows ───────────────────────────────────────────────────────────────

const BUDGET_ROWS = [
  {
    label: "Automatic Cooking/Sterilization System",
    amount: "₱900,000",
  },
  {
    label: "Semi Automatic Filing & Sealing Machine",
    amount: "₱900,000",
  },
  { label: "Quick Cooling System", amount: "₱900,000" },
  { label: "Other Direct Costs", amount: "₱500,000" },
];

// ── Main Component ────────────────────────────────────────────────────────────

interface ConductOfRTECProps {
  onSubmitSuccess?: () => void;
}

export function ConductOfRTEC({ onSubmitSuccess }: ConductOfRTECProps = {}) {
  const [language, setLanguage] = useState<
    "English" | "Filipino"
  >("English");
  const [activeStatus, setActiveStatus] =
    useState<RTECStatus>("scheduled");
  const [trackerOpen, setTrackerOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ── Page Header ── */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            <span className="text-gray-400 font-normal">
              
            </span>{" "}
            Conduct of RTEC
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            The Regional Technical Evaluation Committee will
            evaluate your submitted SETUP Project Proposal.
            Please monitor the status below.
          </p>
        </div>

        {/* ── Meta bar ── */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          <span>
            <span className="text-gray-400">
              Applicant Name
            </span>
            &nbsp;
            <span className="font-semibold text-gray-800">
              Juan Dela Cruz
            </span>
          </span>
          <span>
            <span className="text-gray-400">
              Application ID:
            </span>
            &nbsp;
            <span className="font-semibold text-gray-800">
              LOI-2024-000145
            </span>
          </span>
          <span className="font-semibold text-gray-800">
            TN0322-000145
          </span>
        </div>

        {/* ── Step bar + Download ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <StepBar current={8} total={10} />
          <button className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Main panel ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Proposal summary card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-2 font-semibold text-sm">
                <FileText className="w-4 h-4" />
                SETUP Project Proposal
              </div>
              <div className="p-4">
                <h2 className="font-bold text-gray-800 text-sm mb-2">
                  1. Production Efficiency Improvement at ABC
                  Food Processing
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  Reference Numbers: LOI-2024-000145
                  &nbsp;·&nbsp; TN0322-000145
                </p>

                <div className="flex flex-wrap items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs mb-3">
                  <span className="font-semibold text-blue-700">
                    Status: Scheduled for RTEC
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-3.5 h-3.5" />
                    May 3, 2024, 10:00 AM Onwards
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-3.5 h-3.5" />
                    Koronadal City, South Cotabato
                  </span>
                  <span className="text-blue-500 italic">
                    · Monitor the status below.
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  1. Application ID:{" "}
                  <span className="font-semibold text-gray-800">
                    LOI-2024-000145
                  </span>
                </p>
              </div>
            </div>

            {/* Tracker */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setTrackerOpen((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
              >
                <span className="font-semibold text-sm text-gray-800">
                  Upcoming RTEC Evaluation Status Tracker
                </span>
                {trackerOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {trackerOpen && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {/* Tabs */}
                  <div className="flex gap-2 my-3">
                    <StatusTab
                      label="For RTEC Scheduling"
                      active={activeStatus === "for-scheduling"}
                      color="bg-yellow-500"
                      onClick={() =>
                        setActiveStatus("for-scheduling")
                      }
                    />
                    <StatusTab
                      label="Scheduled for RTEC"
                      active={activeStatus === "scheduled"}
                      color="bg-green-600"
                      onClick={() =>
                        setActiveStatus("scheduled")
                      }
                    />
                    <StatusTab
                      label="Under RTEC Evaluation"
                      active={
                        activeStatus === "under-evaluation"
                      }
                      color="bg-blue-600"
                      onClick={() =>
                        setActiveStatus("under-evaluation")
                      }
                    />
                  </div>

                  {/* Evaluation Timeline */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <span className="font-semibold text-sm text-gray-700">
                        Evaluation Timeline
                      </span>
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="p-4">
                      <TimelineItem
                        done
                        label="Proposal Endorsed to RTEC"
                      />
                      <TimelineItem
                        done={false}
                        label="Scheduled for RTEC Evaluation"
                        sub="May 3, 2024, 10:00 AM Onwards, Koronadal City, South Cotabato"
                      />

                      {/* Budget breakdown inside timeline */}
                      <div className="ml-8 border border-gray-200 rounded-lg overflow-hidden mb-3">
                        <table className="w-full text-xs">
                          <tbody>
                            {BUDGET_ROWS.map((row, i) => (
                              <tr
                                key={i}
                                className="border-b border-gray-100 last:border-0"
                              >
                                <td className="px-3 py-2 text-gray-700">
                                  {row.label}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-gray-800">
                                  {row.amount}
                                </td>
                                <td className="px-3 py-2 w-6">
                                  <ChevronDown className="w-3 h-3 text-gray-300" />
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50">
                              <td className="px-3 py-2 font-bold text-gray-800">
                                Total
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-gray-800">
                                ₱2500,000
                              </td>
                              <td />
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <TimelineItem
                        done={false}
                        label="Pending Decision"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pending RTEC Evaluation */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setPendingOpen((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
              >
                <span className="font-semibold text-sm text-gray-800">
                  5. Pending RTEC Evaluation
                </span>
                {pendingOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {pendingOpen && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="space-y-3 mt-3">
                    {RTEC_MEMBERS.map((m) => (
                      <div
                        key={m.name}
                        className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2.5"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg shrink-0">
                          {m.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-800">
                            {m.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            ·· {m.role}
                          </span>
                          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
                            Assigned
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-700">
              We will inform you through the platform about any
              comments or decisions made by the RTEC. Please
              ensure your contact information is up to date
              (30-308 preferred crisis requests).
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-4">
            {/* Proposal Tracker */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-3 text-sm">
                Proposal Tracker:
              </p>
              <ul className="space-y-2">
                {[
                  {
                    label: "Approved by RTEC",
                    color: "text-green-500",
                  },
                  {
                    label: "Approved with Conditions",
                    color: "text-green-400",
                  },
                  {
                    label: "For Revision",
                    color: "text-yellow-500",
                  },
                  { label: "Deferred", color: "text-gray-400" },
                  {
                    label: "Disapproved",
                    color: "text-red-400",
                  },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle
                      className={`w-4 h-4 shrink-0 ${item.color}`}
                    />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Illustration */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-blue-700 font-medium">
                  RTEC Evaluation
                </p>
              </div>
            </div>

            {/* Proposal Checklist */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-3 text-sm">
                Proposal Checklist:
              </p>
              <ul className="space-y-2">
                {CHECKLIST_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                <FileText className="w-4 h-4" />
                Save as Draft
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                <CheckCircle className="w-4 h-4" />
                Generate Proposal
              </button>
            </div>

            {/* Voice + Language */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <button className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
                <Mic className="w-4 h-4" />
                Voice Input
              </button>
              <div className="ml-auto">
                <button
                  onClick={() =>
                    setLanguage(
                      language === "English"
                        ? "Filipino"
                        : "English",
                    )
                  }
                  className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {language}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Contact PSTO */}
            <button className="w-full flex items-center justify-center gap-2 border border-blue-300 text-blue-600 text-sm font-medium py-2.5 rounded-lg hover:bg-blue-50 transition-colors">
              <Clock className="w-4 h-4" />
              Contact PSTO?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}