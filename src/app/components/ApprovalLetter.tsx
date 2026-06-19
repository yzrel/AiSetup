/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import {
  CheckCircle,
  Download,
  FileText,
  Mail,
  Printer,
  ChevronDown,
  Building2,
  User,
  Calendar,
  DollarSign,
  Hash,
  Clock,
  Shield,
} from "lucide-react";

// ── Step Progress Bar ─────────────────────────────────────────────────────────

function StepBar({
  current = 9,
  total = 10,
}: {
  current?: number;
  total?: number;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
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

// ── Approval Summary Card ─────────────────────────────────────────────────────

function ApprovalSummaryCard({
  showRef = false,
}: {
  showRef?: boolean;
}) {
  const items = [
    {
      icon: <User className="w-3.5 h-3.5" />,
      text: "Juan Dela Cruz",
    },
    {
      icon: <Building2 className="w-3.5 h-3.5" />,
      text: "ABC Food Processing",
    },
    {
      icon: <DollarSign className="w-3.5 h-3.5" />,
      text: "₱2,000,000 🇵🇭",
    },
    {
      icon: <Calendar className="w-3.5 h-3.5" />,
      text: "April 30, 2024",
    },
    ...(showRef
      ? [
          {
            icon: <Hash className="w-3.5 h-3.5" />,
            text: "AL-2024-000145",
          },
        ]
      : []),
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="font-semibold text-gray-700 mb-3 text-sm">
        Approval Summary:
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Official Letter Preview ───────────────────────────────────────────────────

function LetterPreview() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Letter header */}
      <div className="bg-blue-700 text-white px-5 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded flex items-center justify-center shrink-0">
          <span className="text-blue-700 font-bold text-xs">
            ai
          </span>
        </div>
        <div>
          <p className="font-bold text-sm uppercase tracking-wide">
            Department of Science and Technology
          </p>
          <p className="text-xs text-blue-200">
            Small Enterprise Technology Upgrading Program
            (SETUP)
          </p>
        </div>
        <div className="ml-auto text-right text-xs text-blue-200">
          <p>April 30, 2024</p>
          <p>Amt: ₱2,000,000</p>
        </div>
      </div>

      {/* Letter body */}
      <div className="p-5 text-xs text-gray-700 leading-relaxed space-y-3">
        <p className="text-right text-gray-500">
          April 30, 2024
        </p>

        <div>
          <p className="font-bold">Juan Dela Cruz</p>
          <p className="text-gray-500">
            Agri. Jae-rammed Stoner
          </p>
          <p className="text-gray-500">
            123 Mabini St., Cotabato, SOCCSKSARGEN
          </p>
        </div>

        <p>Sir/Ma'am: Juan M&A Cruz</p>

        <p className="text-justify text-gray-600">
          We are pleased to inform you that the DOST-SETUP
          Regional Evaluation Committee has granted final
          approval for your submitted SETUP Project Proposal for{" "}
          <strong>
            Production Efficiency Improvement at ABC Food
            Processing
          </strong>
          . The approved amount of <strong>₱2,000,000</strong>{" "}
          will be released in accordance with the Memorandum of
          Agreement to be signed between your enterprise and the
          DOST Regional Office. Please acknowledge receipt by
          clicking the button below and prepare for MOA signing.
        </p>

        <p className="text-gray-500 italic text-[10px]">
          Notes: Please acknowledge receipt of this Approval
          Letter and prepare for MOA signing.
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ApprovalLetterProps {
  onSubmitSuccess?: () => void;
}

export function ApprovalLetter({ onSubmitSuccess }: ApprovalLetterProps = {}) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ── Page Header ── */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            <span className="text-gray-400 font-normal">
              
            </span>{" "}
            Approval Letter
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            After approval, the system should auto-generate the
            Approval Letter using prior project data and
            acknowledge receipt to proceed to MOA signing.
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
          <span className="font-semibold text-gray-800">
            LOI-2024-000145
          </span>
          <span className="font-semibold text-gray-800">
            TN0322-000145
          </span>
        </div>

        {/* ── Step bar ── */}
        <div className="mb-6">
          <StepBar current={9} total={10} />
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Main panel ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Module header card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-2 font-semibold text-sm">
                <FileText className="w-4 h-4" />
                Module 9 – Approval Letter
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700">
                  DOST has approved your project proposal.
                  Please review the official Approval Letter and
                  acknowledge receipt to MOA signing.
                </p>
              </div>
            </div>

            {/* Proposal Information */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-800">
                  Proposal Information
                </h3>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors">
                    <Printer className="w-3.5 h-3.5" />
                    Gate filed
                  </button>
                  <button className="flex items-center gap-1.5 text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors">
                    <Shield className="w-3.5 h-3.5" />
                    DESNUETION
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0">
                    Project Title:
                  </span>
                  <span className="font-medium text-gray-800">
                    Production Efficiency Improvement at ABC
                    Food Processing
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0">
                    Reference Numbers:
                  </span>
                  <span className="font-medium text-gray-800">
                    LOI-2024-000145&nbsp;&nbsp;TN0322-000145
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0">
                    Approved Amount:
                  </span>
                  <span className="font-bold text-gray-800">
                    ₱2,000,000
                  </span>
                </div>
                <p className="text-xs text-gray-400 italic">
                  Notes: Please acknowledge receipt of this
                  Approval Letter.
                </p>
              </div>
            </div>

            {/* Approval Letter (Auto-Generated) */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold">
                    ai
                  </span>
                </div>
                <span className="font-semibold text-sm text-blue-700">
                  Approval Letter
                </span>
                <span className="text-xs text-gray-400 italic">
                  (Auto-Generated)
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex gap-6 text-sm">
                  <span>
                    <span className="text-gray-500">
                      Reference Number:
                    </span>
                    &nbsp;
                    <span className="font-semibold text-gray-800">
                      AL-2024-000145
                    </span>
                  </span>
                  <span>
                    <span className="text-gray-500">
                      Date of Approval:
                    </span>
                    &nbsp;
                    <span className="font-semibold text-gray-800">
                      April 30, 2024
                    </span>
                  </span>
                </div>

                <LetterPreview />

                <p className="text-xs text-gray-400 italic">
                  Notes: Please acknowledge receipt of this
                  Approval Letter and prepare for MOA signing.
                </p>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setAcknowledged(true)}
                    className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors ${
                      acknowledged
                        ? "bg-green-700 text-white cursor-default"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {acknowledged
                      ? "Approval Acknowledged"
                      : "Acknowledge Approval"}
                  </button>
                  <button className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    Download Approval Letter (PDF)
                  </button>
                </div>

                {/* Email notice */}
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  An email confirmation will also be sent to
                  you.
                </div>
              </div>
            </div>

            {/* Module 10 teaser */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-700">
                  Module 10 – MOA Preparation and Signing
                </span>
              </div>
              <span className="text-xs text-blue-500">
                Next step →
              </span>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-4">
            <ApprovalSummaryCard showRef={false} />

            {/* Illustration */}
            <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg h-44 flex items-center justify-center relative overflow-hidden">
              <div className="text-center z-10">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                  <CheckCircle className="w-9 h-9 text-green-500" />
                </div>
                <p className="text-xs text-blue-700 font-semibold">
                  Approval Granted
                </p>
                <p className="text-xs text-gray-500">
                  DOST SETUP
                </p>
              </div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-green-200 rounded-full opacity-40 translate-x-6 translate-y-6" />
            </div>

            <ApprovalSummaryCard showRef={true} />

            {/* Download buttons */}
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 border border-blue-300 text-blue-600 text-sm font-medium py-2.5 rounded-lg hover:bg-blue-50 transition-colors">
                <FileText className="w-4 h-4" />
                Contact IPTSiQ3
              </button>
              <button
                onClick={() => setAcknowledged(true)}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Acknowledge Approval
              </button>
              <button className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Download Approval Letter (PDF)
              </button>
              <button className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Download DOCX Version
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}