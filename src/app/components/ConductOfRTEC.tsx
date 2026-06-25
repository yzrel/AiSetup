/**
 * Author: Yzrel Jade B. Eborde
 */

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Save,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import { AuthUser } from "../store/authStore";
import { applicantStore, Applicant } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { DOST_BLUE, ModuleWorkflowLayout, ACTION_ROW, type ModuleStep } from "./ModuleWorkflowLayout";
import { appendStaffAssessment } from "../utils/clientAssessment";
import type { RtecReportForm } from "../api/types";
import {
  buildRtecReportDraft,
  downloadRtecReportPdf,
  getRtecReportForm,
  getRtecReportStored,
  hasProjectProposalPrerequisite,
  hasRtecPrerequisites,
  hasRequirementsApprovedPrerequisite,
  saveRtecReportDraft,
  submitRtecReport,
  syncRtecFromProjectProposal,
  validateRtecReportSubmit,
} from "../utils/rtecReport";
import { allowWhenDemo } from "../utils/demoMode";
import { formatFormMention } from "../constants/setupForms";
import { RtecReportEditor } from "./RtecReportEditor";
import { RtecReportPreview } from "./RtecReportPreview";

const STEPS: ModuleStep[] = [
  { id: "overview", label: "Overview", icon: <FileText className="w-4 h-4" /> },
  { id: "compliance", label: "II — Compliance", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "evaluation", label: "III — Evaluation", icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: "recommendation", label: "IV — Recommendation", icon: <ThumbsUp className="w-4 h-4" /> },
  { id: "preview", label: "Preview & PDF", icon: <Eye className="w-4 h-4" /> },
];

const STEP_IDS = ["overview", "compliance", "evaluation", "recommendation", "preview"] as const;

type StepId = (typeof STEP_IDS)[number];

interface ConductOfRTECProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

export function ConductOfRTEC({ user, onSubmitSuccess }: ConductOfRTECProps = {}) {
  const { applicant } = useStaffApplicant(user);
  const [step, setStep] = useState<StepId>("overview");
  const [form, setForm] = useState<RtecReportForm | null>(null);
  const [saveNotice, setSaveNotice] = useState("");
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [completeNotice, setCompleteNotice] = useState("");

  const loadForm = useCallback((app: Applicant | null) => {
    if (!app) {
      setForm(null);
      return;
    }
    setForm(getRtecReportForm(app));
  }, []);

  useEffect(() => {
    loadForm(applicant);
  }, [applicant?.id, loadForm]);

  useEffect(() => {
    return applicantStore.subscribe(() => {
      if (applicant) {
        const updated = applicantStore.getById(applicant.id);
        if (updated) {
          setForm(getRtecReportForm(updated));
        }
      }
    });
  }, [applicant?.id]);

  const rtecReady = hasRtecPrerequisites(applicant);
  const ppReady = hasProjectProposalPrerequisite(applicant);
  const requirementsReady = hasRequirementsApprovedPrerequisite(applicant);
  const stored = applicant ? getRtecReportStored(applicant) : null;
  const isComplete = !!stored?.submitted;

  const handleSave = () => {
    if (!applicant || !form) return;
    saveRtecReportDraft(applicant.id, form);
    setSaveNotice("Draft saved.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const handleSync = () => {
    if (!applicant || !form) return;
    const synced = syncRtecFromProjectProposal(form, applicant);
    const withCompliance = {
      ...synced,
      complianceItems: synced.complianceItems.map((item) => {
        if (item.status) return item;
        const draft = buildRtecReportDraft(applicant);
        const suggested = draft.complianceItems.find((c) => c.id === item.id);
        return suggested?.status ? { ...item, status: suggested.status } : item;
      }),
    };
    setForm(withCompliance);
    saveRtecReportDraft(applicant.id, withCompliance);
    setSaveNotice("Synced from Project Proposal.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const handleDownload = () => {
    if (!form) return;
    downloadRtecReportPdf(applicant?.applicationId);
  };

  const handleComplete = () => {
    if (!applicant || !form) return;
    const errors = validateRtecReportSubmit(form);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    setSubmitErrors([]);
    submitRtecReport(applicant.id, form);
    if (user) {
      applicantStore.update(applicant.id, {
        ...appendStaffAssessment(applicant, {
          stage: "post-proposal",
          decision: "rtec-completed",
          assessedBy: user.email,
          assessedAt: new Date().toISOString(),
          remarks: "SETUP Form 002 RTEC Report completed",
        }),
        currentModule: "approval-letter",
      });
    } else {
      applicantStore.update(applicant.id, { currentModule: "approval-letter" });
    }
    setCompleteNotice("RTEC Report marked complete. Applicant advanced to Approval Letter.");
    setTimeout(() => setCompleteNotice(""), 5000);
    onSubmitSuccess?.();
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <ModuleWorkflowLayout
      formKey="002"
      subtitle="Staff prepare the RTEC Report from the Project Proposal snapshot. Section I and most of Section III render from the proposal; compliance, recommendation, and signatures are completed here before PDF download."
      user={user}
      steps={STEPS}
      currentStep={step}
      onStepClick={(id) => setStep(id as StepId)}
      staffPickerLabel="Review applicant RTEC report"
      alerts={
        <>
          {!applicant && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              Select an applicant to prepare the RTEC Report.
            </div>
          )}
          {applicant && !rtecReady && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">RTEC prerequisites incomplete</p>
                <p className="mt-1">
                  {!ppReady
                    ? `A submitted ${formatFormMention("001")} is required before RTEC evaluation.`
                    : !requirementsReady
                      ? "Documentary requirements must be verified and approved by staff before RTEC evaluation."
                      : "Complete all RTEC prerequisites before generating the report."}
                </p>
              </div>
            </div>
          )}
        </>
      }
    >
      {applicant && form && (
        <div className="space-y-4">
              {step === "overview" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-[#0C2461] mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {form.proposalSnapshot.projectTitle || "Untitled project"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {applicant.enterpriseName} · {applicant.applicationId}
                      </p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Proponent cost</p>
                      <p className="font-semibold">{form.projectCostProponent || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">DOST-SETUP</p>
                      <p className="font-semibold">{form.projectCostSetup || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-semibold">{form.projectCostTotal || "—"}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Use <strong>Sync from Project Proposal</strong> to refresh Section I and III
                    data from the latest {formatFormMention("001")} without losing RTEC-only edits (compliance,
                    recommendation, signatures).
                  </p>
                  {isComplete && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      RTEC Report completed
                      {stored?.submittedAt
                        ? ` on ${new Date(stored.submittedAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  )}
                </div>
              )}

              {step === "compliance" && (
                <RtecReportEditor
                  form={form}
                  onChange={setForm}
                  step="compliance"
                />
              )}

              {step === "evaluation" && (
                <RtecReportEditor
                  form={form}
                  onChange={setForm}
                  step="evaluation"
                />
              )}

              {step === "recommendation" && (
                <RtecReportEditor
                  form={form}
                  onChange={setForm}
                  step="recommendation"
                />
              )}

              {step === "preview" && (
                <RtecReportPreview
                  form={form}
                  applicationId={applicant.applicationId}
                  onPrint={handleDownload}
                />
              )}

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className={`${ACTION_ROW}`}>
                  <button
                    type="button"
                    onClick={() => setStep(STEP_IDS[Math.max(0, stepIndex - 1)])}
                    disabled={stepIndex === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStep(STEP_IDS[Math.min(STEP_IDS.length - 1, stepIndex + 1)])
                    }
                    disabled={stepIndex === STEPS.length - 1}
                    className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className={`${ACTION_ROW} flex-wrap`}>
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={!allowWhenDemo(rtecReady)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#0C2461]/30 text-[#0C2461] text-sm font-semibold hover:bg-blue-50 disabled:opacity-40"
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Sync from Project Proposal</span>
                    <span className="sm:hidden">Sync Proposal</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800"
                  >
                    <Save className="w-4 h-4 shrink-0" />
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!allowWhenDemo(rtecReady)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                    style={{ background: DOST_BLUE }}
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Download PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={!allowWhenDemo(rtecReady) || isComplete}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Mark RTEC Complete</span>
                    <span className="sm:hidden">Complete</span>
                  </button>
                </div>
              </div>

              {saveNotice && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  {saveNotice}
                </p>
              )}
              {completeNotice && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {completeNotice}
                </p>
              )}
              {submitErrors.length > 0 && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
                  {submitErrors.map((e) => (
                    <p key={e}>• {e}</p>
                  ))}
                </div>
              )}
        </div>
      )}
    </ModuleWorkflowLayout>
  );
}
