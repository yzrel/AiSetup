import { useState } from "react";
import {
  Upload,
  CheckCircle,
  FileText,
  AlertCircle,
  Building2,
  DollarSign,
  User,
  ChevronRight,
  Plus,
  Download,
  Send,
  Shield,
  Banknote,
} from "lucide-react";

// ── Shared: Section header ────────────────────────────────────────────────────

function ModuleHeader({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-gray-800">
        <span className="text-gray-400 font-normal">
          
        </span>{" "}
        {title}
      </h2>
      <p className="text-gray-500 text-sm mt-1">
        {description}
      </p>
    </div>
  );
}

// ── MODULE 11: LandBank Savings Account ──────────────────────────────────────

function Module11() {
  const [uploaded, setUploaded] = useState(false);

  const requirements = [
    "Valid government-issued IDs of the account holder",
    "Business registration documents (DTI / SEC / CDA)",
    "Mayors or Business Permit",
    "SETUP Project Approval or Endorsement from DOST",
    "Completed LandBank account opening forms",
    "Initial deposit required by LandBank",
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-blue-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        Module 11 — Opening of LandBank Savings Account
      </div>

      <div className="p-5 space-y-4">
        {/* System Advisory */}
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-amber-800">
              System Advisory Message:
            </p>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            To proceed with the SETUP fund downloading process,
            you are required to open a LandBank Savings Account.
            Please prepare the following:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Requirements list */}
            <ul className="space-y-1.5">
              {requirements.map((req, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-amber-800"
                >
                  <span className="mt-0.5 w-3.5 h-3.5 bg-amber-300 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-amber-900">
                    ·
                  </span>
                  {req}
                </li>
              ))}
            </ul>

            {/* LandBank illustration */}
            <div className="bg-green-50 border border-green-200 rounded-lg flex flex-col items-center justify-center py-6 gap-2">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center shadow">
                <Building2 className="w-9 h-9 text-white" />
              </div>
              <p className="font-bold text-green-700 text-sm tracking-wide">
                LANDBANK
              </p>
              <p className="text-xs text-green-600">
                Land Bank of the Philippines
              </p>
            </div>
          </div>
        </div>

        {/* Upload button */}
        <div>
          <input
            type="file"
            id="landbank-upload"
            className="hidden"
            onChange={() => setUploaded(true)}
          />
          <label
            htmlFor="landbank-upload"
            className={`flex items-center justify-center gap-2 w-full max-w-sm py-3 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
              uploaded
                ? "bg-green-600 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {uploaded ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploaded
              ? "Account Snapshot Uploaded ✓"
              : "Upload Account Snapshot"}
          </label>
          {uploaded && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> File uploaded
              successfully
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MODULE 12: Letter Request for Withdrawal ─────────────────────────────────

function Module12() {
  const [remarks, setRemarks] = useState("");
  const [fileUploaded, setFileUploaded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-blue-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Module 12 — Letter Request for Withdrawal
      </div>

      <div className="p-5 space-y-5">
        <p className="text-sm text-gray-600">
          Submit your Letter Request for Withdrawal to formally
          access disbursement funds for your SETUP Project.{" "}
          <span className="text-blue-500 underline cursor-pointer">
            Learn more here.
          </span>
        </p>

        {/* Project Overview */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              Project Overview
            </span>
          </div>
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-gray-700">
                  Production Efficiency Improvement at ABC Food
                  Processing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-gray-700">
                  Total Withdrawal: ₱0.00
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-gray-700">
                  ABC Food Processing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-gray-700">
                  Approved Project Amount: ₱2,000,000
                </span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-gray-700">
                  Remaining Balance: ₱2,000,000
                </span>
              </div>
            </div>

            {/* LandBank verified badge */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 bg-green-100 border border-green-300 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                <Shield className="w-3.5 h-3.5" />
                LANDBANK PERMIT VERIFIED
              </div>
              <span className="text-xs text-blue-500 italic">
                → Proceed to Letter Request for Withdrawal
              </span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 text-xs">
          {[
            {
              n: 1,
              label: "Fill out withdrawal request form",
              active: true,
            },
            {
              n: 2,
              label: "Upload withdrawal letter and amount",
              active: false,
            },
            {
              n: 3,
              label: "Request validation",
              active: false,
            },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${step.active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${step.active ? "bg-white text-blue-600" : "bg-gray-300 text-gray-500"}`}
                >
                  {step.n}
                </span>
                {step.label}
              </div>
              {i < 2 && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Withdrawal form */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Left: form */}
          <div className="md:col-span-3 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
              <span>Project Overview</span>
              <button className="text-blue-500">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium text-gray-800">
                  Production Efficiency &amp; ABC Food
                  Processing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="font-semibold text-gray-800">
                  ₱22,000,000
                </span>
                <span className="bg-amber-100 text-amber-700 border border-amber-200 rounded px-1 text-[10px]">
                  AWB8019
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Remarks: K[.fal]
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Remarks:
              </label>
              <textarea
                rows={2}
                placeholder="Additional remarks..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                id="withdrawal-pdf"
                className="hidden"
                onChange={() => setFileUploaded(true)}
              />
              <label
                htmlFor="withdrawal-pdf"
                className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors ${fileUploaded ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-800 text-white"}`}
              >
                <Upload className="w-3.5 h-3.5" />
                {fileUploaded
                  ? "PDF Uploaded ✓"
                  : "Upload Withdrawal Request (PDF)"}
              </label>
              <button className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                <Plus className="w-3 h-3" />
                Add F's
              </button>
            </div>
          </div>

          {/* Right: authority letter summary */}
          <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm text-gray-700 border-b border-gray-100 pb-2">
              <Shield className="w-4 h-4 text-green-500" />
              Authority Letter to Withdraw
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                {
                  label: "Juan Dela Cruz",
                  amount: "₱2,000,000",
                },
                {
                  label: "ABC Food Processing",
                  amount: "₱2,000,000",
                },
                { label: "Bisnteed", amount: "₱2,300,000" },
                {
                  label: "Remaining Balance",
                  amount: "₱2,500,000",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-gray-700">
                      {row.label}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {row.amount}
                  </span>
                </div>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors">
              <Send className="w-3.5 h-3.5" />
              Submit Withdrawal Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODULE 13: Authority Letter to Withdraw ───────────────────────────────────

function Module13() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-blue-600 text-white px-5 py-3 font-semibold text-sm flex items-center gap-2">
        <Banknote className="w-4 h-4" />
        Module 13 — Authority Letter to Withdraw
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-600">
          After the approved letter to withdraw for LandBank
          branch to withdraw funds.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Summary card */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-sm text-gray-700">
              Withdrawal Summary
            </p>
            <div className="space-y-2 text-xs">
              {[
                {
                  icon: <User className="w-3.5 h-3.5" />,
                  label: "Account Holder",
                  value: "Juan Dela Cruz",
                },
                {
                  icon: <Building2 className="w-3.5 h-3.5" />,
                  label: "Enterprise",
                  value: "ABC Food Processing",
                },
                {
                  icon: <DollarSign className="w-3.5 h-3.5" />,
                  label: "Approved Amount",
                  value: "₱2,000,000",
                },
                {
                  icon: <DollarSign className="w-3.5 h-3.5" />,
                  label: "Amount to Withdraw",
                  value: "₱2,000,000",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0"
                >
                  <span className="text-blue-400">
                    {row.icon}
                  </span>
                  <span className="text-gray-500 w-32 shrink-0">
                    {row.label}:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action card */}
          <div className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between gap-3">
            <div>
              <p className="font-semibold text-sm text-gray-700 mb-2">
                Download Authority Letter
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Download the authority letter and present it to
                your nearest LandBank branch together with valid
                IDs to process the withdrawal.
              </p>
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download Authority Letter (PDF)
              </button>
              <button className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Download DOCX Version
              </button>
            </div>
          </div>
        </div>

        {/* Status notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs text-green-700">
            Your Authority Letter to Withdraw has been generated
            and is ready for download. Please proceed to any
            LandBank branch and present this letter along with
            valid government-issued IDs.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface LandBankAndWithdrawalProps {
  onSubmitSuccess?: () => void;
}

export function LandBankAndWithdrawal({ onSubmitSuccess }: LandBankAndWithdrawalProps = {}) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Module 11 */}
        <div>
          <ModuleHeader
            number={11}
            title="Opening of LandBank Savings Account"
            description="DOST has approved your project proposal. Open a LandBank Savings Account dedicated to the SETUP project, which will serve as the official account where the SETUP financial assistance will be deposited and managed."
          />
          <Module11 />
        </div>

        {/* Module 12 */}
        <div>
          <ModuleHeader
            number={12}
            title="Letter Request for Withdrawal"
            description="Submit your Letter Request for Withdrawal to formally access disbursement funds for your SETUP Project."
          />
          <Module12 />
        </div>

        {/* Module 13 */}
        <div>
          <ModuleHeader
            number={13}
            title="Authority Letter to Withdraw"
            description="After the approved letter to withdraw for LandBank branch to withdraw funds."
          />
          <Module13 />
        </div>
      </div>
    </div>
  );
}