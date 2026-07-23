/**
 * Author: Yzrel Jade B. Eborde
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { AuthUser } from "../store/authStore";
import { applicantStore } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { useApplicantStoreVersion } from "../hooks/useApplicantSubscription";
import { ModuleWorkflowLayout, type ModuleStep } from "./ModuleWorkflowLayout";
import type { DelinquencyStatus, ModuleDocument, PDCEntry, PDCStatus } from "../api/types";
import { DOST_BLUE, MODULE_SHELL } from "./moduleTheme";
import { appendStaffAssessment } from "../utils/clientAssessment";
import { getApprovalLetterForm } from "../utils/approvalLetter";
import { notifyRefundMonitoringComplete } from "../utils/notificationHelpers";
import {
  getRefundForm,
  getRefundStored,
  hasRefundPrerequisite,
  isRefundReadOnly,
  isRefundStaff,
  recordPdcs,
  saveRefundDraft,
  setDelinquencyStatus,
  setPdcPaymentReceipt,
  submitRefund,
  syncRefundFromProposal,
  updatePdcStatus,
  validateRefundSubmit,
} from "../utils/refundDelinquent";
import { allowWhenDemo } from "../utils/demoMode";
import { readAndUploadModuleDocument } from "../utils/readFileAsDataUrl";
import { SubmittedFileActions } from "./SubmittedFileActions";

const STEPS: ModuleStep[] = [
  { id: "record-pdcs", label: "Record PDCs", icon: <CreditCard className="w-4 h-4" /> },
  { id: "refund-schedule", label: "Refund Schedule", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "payments", label: "Payments", icon: <CheckCircle className="w-4 h-4" /> },
  { id: "monitoring", label: "Monitoring", icon: <Eye className="w-4 h-4" /> },
];

type StepId = "record-pdcs" | "refund-schedule" | "payments" | "monitoring";

const PDC_STATUS_COLOR = {
  pending: "blue",
  cleared: "green",
  bounced: "red",
} as const;

const PDC_STATUS_LABEL: Record<PDCStatus, string> = {
  pending: "Pending",
  cleared: "Cleared (Paid)",
  bounced: "Bounced",
};

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
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${c}`}>
      {label}
    </span>
  );
}

function PdcReceiptCell({
  row,
  editable,
  uploadedBy,
  applicantId,
  onReceiptChange,
  onError,
}: {
  row: PDCEntry;
  editable: boolean;
  uploadedBy: string;
  applicantId?: string;
  onReceiptChange: (pdcId: string, receipt: ModuleDocument | null) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const doc = await readAndUploadModuleDocument(file, uploadedBy, {
        applicantId,
        moduleKey: "refund",
      });
      onReceiptChange(row.id, doc);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not upload receipt.");
    }
  };

  return (
    <div className="space-y-1.5 min-w-0">
      {row.paymentReceipt?.dataUrl || row.paymentReceipt?.fileId ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="text-[11px] text-gray-700 truncate max-w-[120px]"
            title={row.paymentReceipt.fileName}
          >
            {row.paymentReceipt.fileName}
          </span>
          <SubmittedFileActions
            fileName={row.paymentReceipt.fileName}
            mimeType={row.paymentReceipt.mimeType}
            dataUrl={row.paymentReceipt.dataUrl}
            fileId={row.paymentReceipt.fileId}
            applicantId={applicantId}
            compact
          />
          {editable && (
            <button
              type="button"
              onClick={() => onReceiptChange(row.id, null)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Remove receipt"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : editable ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 text-[#0C2461] hover:bg-blue-50"
          >
            <Upload className="w-3 h-3" />
            Upload receipt
          </button>
        </>
      ) : (
        <span className="text-[11px] text-gray-400">—</span>
      )}
    </div>
  );
}

function PdcStatusControl({
  row,
  editable,
  uploadedBy,
  applicantId,
  onStatusChange,
  onReceiptChange,
  onError,
}: {
  row: PDCEntry;
  editable: boolean;
  uploadedBy: string;
  applicantId?: string;
  onStatusChange: (pdcId: string, status: PDCStatus) => void;
  onReceiptChange: (pdcId: string, receipt: ModuleDocument | null) => void;
  onError: (message: string) => void;
}) {
  const clearedPickerRef = useRef<HTMLInputElement>(null);

  if (!editable) {
    return (
      <StatusBadge
        label={PDC_STATUS_LABEL[row.status]}
        color={PDC_STATUS_COLOR[row.status]}
      />
    );
  }

  return (
    <div className="space-y-1">
      <select
        value={row.status}
        aria-label={`${row.checkNumber} status`}
        className="w-full max-w-[160px] text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800"
        onChange={(e) => {
          const next = e.target.value as PDCStatus;
          if (next === "cleared" && !row.paymentReceipt?.dataUrl && !row.paymentReceipt?.fileId) {
            clearedPickerRef.current?.click();
            return;
          }
          onStatusChange(row.id, next);
        }}
      >
        <option value="pending">Pending</option>
        <option value="cleared">Cleared (Paid)</option>
        <option value="bounced">Bounced</option>
      </select>
      <input
        ref={clearedPickerRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const doc = await readAndUploadModuleDocument(file, uploadedBy, {
              applicantId,
              moduleKey: "refund",
            });
            onReceiptChange(row.id, doc);
          } catch (err) {
            onError(err instanceof Error ? err.message : "Could not upload receipt.");
          }
        }}
      />
    </div>
  );
}

interface PDCTableProps {
  rows: PDCEntry[];
  editable?: boolean;
  uploadedBy?: string;
  applicantId?: string;
  onStatusChange?: (pdcId: string, status: PDCStatus) => void;
  onReceiptChange?: (pdcId: string, receipt: ModuleDocument | null) => void;
  onError?: (message: string) => void;
}

function PDCTable({
  rows,
  editable = false,
  uploadedBy = "staff",
  applicantId,
  onStatusChange,
  onReceiptChange,
  onError,
}: PDCTableProps) {
  const handleStatus = onStatusChange ?? (() => undefined);
  const handleReceipt = onReceiptChange ?? (() => undefined);
  const handleError = onError ?? (() => undefined);
  const showReceiptCol = editable || rows.some((r) => r.paymentReceipt);
  const gridCols = showReceiptCol ? "grid-cols-6" : "grid-cols-5";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
      <div className="md:hidden p-3 space-y-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="font-semibold text-gray-800">{r.checkNumber}</span>
              <PdcStatusControl
                row={r}
                editable={editable}
                uploadedBy={uploadedBy}
                applicantId={applicantId}
                onStatusChange={handleStatus}
                onReceiptChange={handleReceipt}
                onError={handleError}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Due</span>
                {r.dueDate}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Amount</span>
                <span className="font-semibold text-gray-800">{r.amount}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Account</span>
                {r.accountNumber}
              </div>
              {showReceiptCol && (
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">
                    Bank receipt
                  </span>
                  <PdcReceiptCell
                    row={r}
                    editable={editable}
                    uploadedBy={uploadedBy}
                    applicantId={applicantId}
                    onReceiptChange={handleReceipt}
                    onError={handleError}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <div
          className={`text-white grid ${gridCols} px-3 py-2 font-semibold gap-2 min-w-[640px]`}
          style={{ background: DOST_BLUE }}
        >
          {(showReceiptCol
            ? ["Check Number", "Due Date", "Account Number", "Amount", "Status", "Receipt"]
            : ["Check Number", "Due Date", "Account Number", "Amount", "Status"]
          ).map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {rows.map((r) => (
          <div
            key={r.id}
            className={`grid ${gridCols} gap-2 px-3 py-2 border-t border-gray-100 hover:bg-gray-50 min-w-[640px] items-center`}
          >
            <span className="font-medium text-gray-800">{r.checkNumber}</span>
            <span className="text-gray-600">{r.dueDate}</span>
            <span className="text-gray-600">{r.accountNumber}</span>
            <span className="font-semibold text-gray-800">{r.amount}</span>
            <PdcStatusControl
              row={r}
              editable={editable}
              uploadedBy={uploadedBy}
              applicantId={applicantId}
              onStatusChange={handleStatus}
              onReceiptChange={handleReceipt}
              onError={handleError}
            />
            {showReceiptCol && (
              <PdcReceiptCell
                row={r}
                editable={editable}
                uploadedBy={uploadedBy}
                applicantId={applicantId}
                onReceiptChange={handleReceipt}
                onError={handleError}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const DELINQUENCY_LABELS: Record<
  DelinquencyStatus,
  { label: string; color: "green" | "amber" | "red" | "blue" | "gray" }
> = {
  "monitoring-required": { label: "Monitoring Required", color: "blue" },
  current: { label: "Payment Current", color: "green" },
  delayed: { label: "Payment Delayed", color: "amber" },
  delinquent: { label: "Delinquent", color: "red" },
  "under-evaluation": { label: "Under Evaluation", color: "amber" },
};

interface RefundAndDelinquentProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

export function RefundAndDelinquent({
  user,
  onSubmitSuccess,
}: RefundAndDelinquentProps = {}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const readOnly = user ? isRefundReadOnly(user.role) : false;
  const staffMode = user ? isRefundStaff(user.role) : isStaff;
  const [step, setStep] = useState<StepId>("record-pdcs");
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  useApplicantStoreVersion();

  useEffect(() => {
    if (applicant && !getRefundStored(applicant)) {
      const synced = syncRefundFromProposal(applicant);
      saveRefundDraft(applicant.id, synced);
    }
  }, [applicant?.id]);

  const form = applicant ? getRefundForm(applicant) : null;
  const stored = applicant ? getRefundStored(applicant) : null;
  const prerequisiteOk = hasRefundPrerequisite(applicant);
  const refundTerm = applicant ? getApprovalLetterForm(applicant).refundTermYears : "";
  const delinquency = form
    ? DELINQUENCY_LABELS[form.delinquencyStatus]
    : DELINQUENCY_LABELS.current;
  const uploadedBy = user?.email ?? "staff";
  const pdcEditable = staffMode && !readOnly && !!applicant;

  const maxReached = stored?.submitted
    ? 3
    : form?.pdcsRecorded
      ? 2
      : form?.pdcs.length
        ? 1
        : 0;

  const handlePdcError = useCallback((message: string) => {
    setSubmitErrors([message]);
  }, []);

  const handlePdcStatusChange = useCallback(
    (pdcId: string, status: PDCStatus) => {
      if (!applicant || !pdcEditable) return;
      const err = updatePdcStatus(applicant.id, pdcId, status);
      if (err) {
        setSubmitErrors([err]);
        return;
      }
      setSubmitErrors([]);
    },
    [applicant, pdcEditable],
  );

  const handlePdcReceiptChange = useCallback(
    (pdcId: string, receipt: ModuleDocument | null) => {
      if (!applicant || !pdcEditable) return;
      const err = setPdcPaymentReceipt(applicant.id, pdcId, receipt);
      if (err) {
        setSubmitErrors([err]);
        return;
      }
      setSubmitErrors([]);
    },
    [applicant, pdcEditable],
  );

  const handleRecordPdcs = () => {
    if (!applicant || readOnly) return;
    recordPdcs(applicant.id);
  };

  const handleSubmit = () => {
    if (!applicant) {
      setSubmitErrors(["Select an applicant to continue."]);
      return;
    }
    if (readOnly) return;
    const errors = validateRefundSubmit(applicant);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    const submitErrs = submitRefund(applicant.id, uploadedBy);
    if (submitErrs.length) {
      setSubmitErrors(submitErrs);
      return;
    }
    applicantStore.update(applicant.id, {
      currentModule: "completed",
      ...appendStaffAssessment(applicant, {
        stage: "refund-delinquent",
        decision: "submitted",
        assessedBy: uploadedBy,
        assessedAt: new Date().toISOString(),
        remarks: "Refund monitoring setup complete.",
      }),
    });
    notifyRefundMonitoringComplete(applicant);
    setSubmitErrors([]);
    onSubmitSuccess?.();
  };

  const pdcTable = form ? (
    <PDCTable
      rows={form.pdcs}
      editable={pdcEditable}
      uploadedBy={uploadedBy}
      applicantId={applicant?.id}
      onStatusChange={handlePdcStatusChange}
      onReceiptChange={handlePdcReceiptChange}
      onError={handlePdcError}
    />
  ) : null;

  const alerts = (
    <>
      {readOnly && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <Eye className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Read-only view of your refund schedule and payment status.</p>
        </div>
      )}
      {!prerequisiteOk && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Complete Procurement &amp; Liquidation (Modules 14–16) before refund monitoring.</p>
        </div>
      )}
      {submitErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 space-y-1">
          {submitErrors.map((e) => (
            <p key={e}>• {e}</p>
          ))}
        </div>
      )}
    </>
  );

  return (
    <ModuleWorkflowLayout
      title="Refund & Delinquent Accounts"
      subtitle="Module 17 — Repayment Monitoring"
      user={user}
      steps={STEPS}
      currentStep={step}
      maxReached={maxReached}
      onStepClick={(id) => setStep(id as StepId)}
      showStaffPicker={staffMode}
      staffPickerLabel="Monitor applicant"
      alerts={alerts}
      insetBody={false}
      maxWidth="5xl"
    >
      <div className="text-sm text-gray-500 max-w-3xl space-y-2">
        <p>
          After project implementation, the cooperator repays SETUP assistance per the agreed
          refund schedule. Upon MOA signing, post-dated checks (PDCs) are provided for payments
          after the one-year grace period.
        </p>
        {refundTerm && (
          <p className="text-xs text-gray-400">Refund term: {refundTerm}</p>
        )}
      </div>

      {step === "record-pdcs" && form && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          <div
            className="text-white px-5 py-3 font-semibold text-sm flex items-center gap-2"
            style={{ background: DOST_BLUE }}
          >
            <RefreshCw className="w-4 h-4" />
            Module 17 — Refund Schedule Management
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <Clock className="w-4 h-4" />
                Withdrawal Grace Period
              </div>
              <span className="text-xs text-amber-700">One-year grace before PDCs take effect</span>
            </div>
            {pdcEditable && (
              <p className="text-xs text-gray-500">
                Update PDC status as payments clear. Marking Cleared (Paid) requires a bank receipt
                screenshot.
              </p>
            )}
            {pdcTable}
            {!readOnly && (
              <button
                type="button"
                onClick={handleRecordPdcs}
                className={`flex items-center justify-center gap-2 w-full max-w-sm py-2.5 text-sm font-semibold rounded-lg text-white ${
                  form.pdcsRecorded ? "bg-green-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                {form.pdcsRecorded ? "PDCs Recorded ✓" : "Record PDCs"}
              </button>
            )}
          </div>
        </div>
      )}

      {step === "refund-schedule" && form && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          <div
            className="text-white px-5 py-3 font-semibold text-sm flex items-center gap-2"
            style={{ background: DOST_BLUE }}
          >
            <FileText className="w-4 h-4" />
            Generated Refund Schedule
          </div>
          <div className="p-4 sm:p-5 space-y-5">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800">PDC status &amp; receipts</h3>
              {pdcEditable && (
                <p className="text-xs text-gray-500">
                  Change status and upload bank receipt screenshots for cleared (paid) PDCs.
                </p>
              )}
              {pdcTable}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
              <div className="md:hidden p-3 space-y-3">
                {form.refundSchedule.map((row, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 grid grid-cols-2 gap-2 text-gray-700"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">Date</span>
                      {row.date}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">Status</span>
                      {row.status}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">Amount</span>
                      {row.amount}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">Balance</span>
                      {row.balance}
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <div
                  className="text-white grid grid-cols-4 px-3 py-2 font-semibold gap-2"
                  style={{ background: DOST_BLUE }}
                >
                  {["Date", "Amount", "Balance", "Status"].map((h) => (
                    <span key={h}>{h}</span>
                  ))}
                </div>
                {form.refundSchedule.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 gap-2 px-3 py-2 border-t border-gray-100 text-gray-700"
                  >
                    <span>{row.date}</span>
                    <span>{row.amount}</span>
                    <span>{row.balance}</span>
                    <span>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
            {!readOnly && (
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg"
              >
                <Download className="w-4 h-4" />
                Download Refund Schedule
              </button>
            )}
          </div>
        </div>
      )}

      {step === "payments" && form && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          <div
            className="text-white px-5 py-3 font-semibold text-sm flex items-center gap-2"
            style={{ background: DOST_BLUE }}
          >
            <CheckCircle className="w-4 h-4" />
            Payment Recording
          </div>
          <div className="p-5 text-sm text-gray-600 space-y-3">
            <p>
              {form.lastPaymentDate
                ? `Last payment recorded: ${form.lastPaymentDate}`
                : "No payments recorded yet."}
            </p>
            <p>
              Record payments by clearing PDCs on the{" "}
              <strong>Record PDCs</strong> or <strong>Refund Schedule</strong> tabs and uploading
              a bank receipt screenshot for each Cleared (Paid) check.
            </p>
            <p className="text-xs text-gray-500">
              Cleared PDCs:{" "}
              <strong>{form.pdcs.filter((p) => p.status === "cleared").length}</strong> /{" "}
              {form.pdcs.length}
            </p>
            {staffMode && !readOnly && (
              <p className="text-xs text-gray-500">
                PSTO officers record payments against issued statements of account (SOA).
              </p>
            )}
          </div>
        </div>
      )}

      {step === "monitoring" && form && applicant && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          <div
            className={`text-white px-5 py-3 font-semibold text-sm flex items-center gap-2 ${
              form.delinquencyStatus === "delinquent" ||
              form.delinquencyStatus === "under-evaluation"
                ? "bg-red-600"
                : ""
            }`}
            style={
              form.delinquencyStatus !== "delinquent" &&
              form.delinquencyStatus !== "under-evaluation"
                ? { background: DOST_BLUE }
                : undefined
            }
          >
            <BarChart2 className="w-4 h-4" />
            Delinquent Account Management
            <StatusBadge label={delinquency.label} color={delinquency.color} />
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              After MOA signing, cooperators submit post-dated checks (PDCs) per the agreed refund
              schedule. DOST monitors payment status and flags delinquent accounts for evaluation.
            </p>

            {staffMode && !readOnly && (
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "current",
                    "delayed",
                    "delinquent",
                    "under-evaluation",
                  ] as DelinquencyStatus[]
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setDelinquencyStatus(applicant.id, status)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Set: {DELINQUENCY_LABELS[status].label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Enterprise Summary</h3>
                <div className="text-xs space-y-1 text-gray-700">
                  <div className="flex justify-between">
                    <span>Enterprise</span>
                    <span className="font-medium">{applicant.enterpriseName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contact</span>
                    <span>{applicant.applicantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PDCs on file</span>
                    <span>{form.pdcs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleared (paid)</span>
                    <span>{form.pdcs.filter((p) => p.status === "cleared").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bounced checks</span>
                    <span>{form.pdcs.filter((p) => p.status === "bounced").length}</span>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Monitoring Checklist</h3>
                <ul className="text-xs space-y-1.5 text-gray-700">
                  {[
                    "PDC schedule recorded",
                    "Refund schedule generated",
                    "Payment monitoring active",
                    "Delinquency status tracked",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {(form.delinquencyStatus === "delinquent" ||
              form.delinquencyStatus === "under-evaluation") && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  <span className="font-semibold">Delinquency Notice:</span> This account has been
                  flagged for delayed payments. Coordinate with your DOST provincial office
                  immediately.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-gray-700">PSTO Officer</span>
              <span>— monitors PDC status and generates collection notices when needed.</span>
            </div>
          </div>
        </div>
      )}

      {!stored?.submitted && onSubmitSuccess && staffMode && !readOnly && (
        <div className="print:hidden pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allowWhenDemo(prerequisiteOk)}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: DOST_BLUE }}
          >
            Complete Monitoring Setup →
          </button>
        </div>
      )}
    </ModuleWorkflowLayout>
  );
}
