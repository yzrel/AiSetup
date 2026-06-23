/**
 * Author: Yzrel Jade B. Eborde
 */

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Save,
  Send,
  Upload,
} from "lucide-react";
import { AuthUser, authStore } from "../store/authStore";
import { applicantStore, Applicant } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { DOST_BLUE, ModuleWorkflowLayout, type ModuleStep } from "./ModuleWorkflowLayout";
import { appendStaffAssessment } from "../utils/clientAssessment";
import { notifyApprovalLetterPublished } from "../utils/notificationHelpers";
import type { ApprovalLetterForm } from "../api/types";
import {
  acknowledgeApprovalLetter,
  downloadApprovalLetterPdf,
  getApprovalLetterForm,
  getApprovalLetterStored,
  getSignedMoa,
  hasRtecReportPrerequisite,
  publishApprovalLetter,
  saveApprovalLetterDraft,
  syncApprovalLetterFromRtec,
  validateApprovalLetterAcknowledge,
  validateApprovalLetterPublish,
} from "../utils/approvalLetter";
import { allowWhenDemo, gateOpen, isDemoModeActive } from "../utils/demoMode";
import { ApprovalLetterEditor } from "./ApprovalLetterEditor";
import { ApprovalLetterPreview } from "./ApprovalLetterPreview";
import { SignedMoaUploadPanel } from "./SignedMoaUploadPanel";

const STEPS: ModuleStep[] = [
  { id: "overview", label: "Overview", icon: <FileText className="w-4 h-4" /> },
  { id: "details", label: "Form 003 details", icon: <FileText className="w-4 h-4" /> },
  { id: "preview", label: "Preview & PDF", icon: <Eye className="w-4 h-4" /> },
  { id: "publish", label: "Publish", icon: <Send className="w-4 h-4" /> },
  { id: "moa", label: "Signed MOA", icon: <Upload className="w-4 h-4" /> },
];

const STEP_IDS = ["overview", "details", "preview", "publish", "moa"] as const;

type StepId = (typeof STEP_IDS)[number];

interface ApprovalLetterProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

export function ApprovalLetter({ user, onSubmitSuccess }: ApprovalLetterProps = {}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [step, setStep] = useState<StepId>("overview");
  const [form, setForm] = useState<ApprovalLetterForm | null>(null);
  const [saveNotice, setSaveNotice] = useState("");
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [publishNotice, setPublishNotice] = useState("");
  const [conformeName, setConformeName] = useState("");
  const [ackNotice, setAckNotice] = useState("");
  const [, setMoaRefresh] = useState(0);

  const loadForm = useCallback((app: Applicant | null) => {
    if (!app) {
      setForm(null);
      return;
    }
    const loaded = getApprovalLetterForm(app);
    setForm(loaded);
    if (loaded.conformeSignedName) setConformeName(loaded.conformeSignedName);
  }, []);

  useEffect(() => {
    loadForm(applicant);
  }, [applicant?.id, loadForm]);

  useEffect(() => {
    return applicantStore.subscribe(() => {
      if (applicant) {
        const updated = applicantStore.getById(applicant.id);
        if (updated) loadForm(updated);
      }
    });
  }, [applicant?.id, loadForm]);

  const rtecReady = hasRtecReportPrerequisite(applicant);
  const stored = applicant ? getApprovalLetterStored(applicant) : null;
  const isPublished = !!stored?.published || !!form?.published;
  const isAcknowledged = !!stored?.acknowledged;
  const signedMoa = getSignedMoa(applicant);
  const uploadedBy = user?.email ?? "staff";

  const handleSave = () => {
    if (!applicant || !form) return;
    saveApprovalLetterDraft(applicant.id, form);
    setSaveNotice("Draft saved.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const handleSync = () => {
    if (!applicant || !form) return;
    const synced = syncApprovalLetterFromRtec(form, applicant);
    setForm(synced);
    saveApprovalLetterDraft(applicant.id, synced);
    setSaveNotice("Synced from RTEC / Project Proposal.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const handleDownload = () => {
    downloadApprovalLetterPdf(applicant?.applicationId);
  };

  const handlePublish = () => {
    if (!applicant || !form) return;
    const errors = validateApprovalLetterPublish(form);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    setSubmitErrors([]);
    publishApprovalLetter(applicant.id, form);
    if (user && authStore.isStaff(user.role)) {
      applicantStore.update(applicant.id, {
        ...appendStaffAssessment(applicant, {
          stage: "post-proposal",
          decision: "approval-published",
          assessedBy: user.email,
          assessedAt: new Date().toISOString(),
          remarks: "SETUP Form 003 Notice of Approval published",
        }),
      });
    }
    notifyApprovalLetterPublished(applicant);
    setPublishNotice("Notice of Approval published to applicant.");
    setTimeout(() => setPublishNotice(""), 5000);
    setForm({ ...form, published: true });
  };

  const handleAcknowledge = () => {
    if (!applicant || !form) return;
    const errors = validateApprovalLetterAcknowledge(conformeName);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    setSubmitErrors([]);
    acknowledgeApprovalLetter(applicant.id, conformeName.trim());
    applicantStore.update(applicant.id, { currentModule: "project-information-sheet" });
    setAckNotice(
      "Conforme acknowledged. Awaiting MOA signing day with your PSTO.",
    );
    setTimeout(() => setAckNotice(""), 5000);
    onSubmitSuccess?.();
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const showStaffWorkflow = isStaff;
  const demoStaffSteps = showStaffWorkflow || isDemoModeActive();

  return (
    <ModuleWorkflowLayout
      title="SETUP Form 003 — Notice of Approval (Annex A-3)"
      subtitle="Official DOST approval letter issued after RTEC evaluation. Staff prepare and publish; the applicant acknowledges conforme before MOA signing day and Pre-PIS."
      user={user}
      steps={demoStaffSteps ? STEPS : undefined}
      currentStep={demoStaffSteps ? step : undefined}
      onStepClick={demoStaffSteps ? (id) => setStep(id as StepId) : undefined}
      staffPickerLabel="Review applicant approval letter"
      showStaffPicker={showStaffWorkflow}
      alerts={
        <>
          {!applicant && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              Select an applicant to view or prepare the Notice of Approval.
            </div>
          )}
          {applicant && showStaffWorkflow && !rtecReady && !isPublished && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">RTEC Report required</p>
                <p className="mt-1">
                  Complete and mark the RTEC Report (Form 002) before issuing the Notice of
                  Approval.
                </p>
              </div>
            </div>
          )}
          {applicant && !showStaffWorkflow && !isPublished && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              Your Notice of Approval is being prepared by DOST staff. You will be notified
              when it is published.
            </div>
          )}
        </>
      }
    >
      {applicant && form && (showStaffWorkflow || gateOpen(isPublished)) && (
        <div className="space-y-4">
              {showStaffWorkflow && step === "moa" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-[#0C2461] mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        Signed Memorandum of Agreement
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Staff upload only — attach the scanned signed MOA (PDF or image)
                        from on-site MOA signing day.
                      </p>
                    </div>
                  </div>

                  {!gateOpen(isPublished) ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-3">
                      <p>
                        Publish the Notice of Approval (step 4) before uploading the signed
                        MOA.
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep("publish")}
                        className="text-sm font-semibold text-[#0C2461] hover:underline"
                      >
                        Go to Publish step →
                      </button>
                    </div>
                  ) : (
                    applicant && (
                      <SignedMoaUploadPanel
                        applicant={applicant}
                        uploadedBy={uploadedBy}
                        isAcknowledged={isAcknowledged}
                        requireAcknowledged={false}
                        onSaved={() => setMoaRefresh((n) => n + 1)}
                      />
                    )
                  )}

                  {signedMoa && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Signed MOA on file —{" "}
                      {new Date(signedMoa.moaSignedDate).toLocaleDateString("en-PH", {
                        dateStyle: "long",
                      })}
                    </p>
                  )}
                </div>
              )}

              {showStaffWorkflow && step === "overview" && isPublished && applicant && (
                <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-800">Signed MOA</p>
                  <SignedMoaUploadPanel
                    applicant={applicant}
                    uploadedBy={uploadedBy}
                    isAcknowledged={isAcknowledged}
                    requireAcknowledged={false}
                    onSaved={() => setMoaRefresh((n) => n + 1)}
                  />
                </div>
              )}

              {!showStaffWorkflow && signedMoa && applicant && (
                <SignedMoaUploadPanel
                  applicant={applicant}
                  uploadedBy={signedMoa.uploadedBy}
                  readOnly
                />
              )}

              {showStaffWorkflow && step === "overview" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-[#0C2461] mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {form.projectTitle || "Untitled project"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {applicant.enterpriseName} · {applicant.applicationId}
                      </p>
                      <p className="text-sm text-gray-500">
                        Ref. {form.referenceNumber} · Approved: {form.approvedAmount || "—"}
                      </p>
                    </div>
                  </div>
                  {isPublished && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Published
                      {stored?.publishedAt
                        ? ` on ${new Date(stored.publishedAt).toLocaleDateString()}`
                        : ""}
                      {isAcknowledged ? " · Applicant acknowledged conforme" : ""}
                      {signedMoa
                        ? ` · MOA signed ${new Date(signedMoa.moaSignedDate).toLocaleDateString()}`
                        : ""}
                    </p>
                  )}
                </div>
              )}

              {showStaffWorkflow && step === "details" && (
                <ApprovalLetterEditor form={form} onChange={setForm} />
              )}

              {(step === "preview" || !showStaffWorkflow || step === "publish") && (
                <ApprovalLetterPreview
                  form={form}
                  applicationId={applicant.applicationId}
                  onPrint={handleDownload}
                  showToolbar
                />
              )}

              {!showStaffWorkflow && gateOpen(isPublished) && !isAcknowledged && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-800">Conforme acknowledgment</p>
                  <p className="text-sm text-gray-600">
                    Type your full name below to acknowledge receipt of this Notice of
                    Approval and agree to comply with the stated conditions.
                  </p>
                  <input
                    type="text"
                    value={conformeName}
                    onChange={(e) => setConformeName(e.target.value)}
                    placeholder={applicant.applicantName}
                    className="w-full max-w-md text-sm border border-gray-200 rounded-lg px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Acknowledge &amp; Continue
                  </button>
                </div>
              )}

              {!showStaffWorkflow && isAcknowledged && !signedMoa && (
                <p className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  Conforme acknowledged. DOST will schedule MOA signing with your PSTO.
                  Your signed MOA will be uploaded by DOST staff after the on-site signing
                  ceremony — you do not need to upload it yourself.
                </p>
              )}

              {!showStaffWorkflow && isAcknowledged && signedMoa && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Conforme acknowledged. Signed MOA is on file (uploaded by DOST staff).
                  LandBank setup will be enabled after signing day documents are complete.
                </p>
              )}

              {showStaffWorkflow && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(STEP_IDS[Math.max(0, stepIndex - 1)])}
                    disabled={stepIndex === 0}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40"
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
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={!allowWhenDemo(rtecReady)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#0C2461]/30 text-[#0C2461] text-sm font-semibold hover:bg-blue-50 disabled:opacity-40"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync from RTEC
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800"
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!allowWhenDemo(rtecReady)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                    style={{ background: DOST_BLUE }}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  {(step === "publish" || step === "preview") && !isPublished && (
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={!allowWhenDemo(rtecReady)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                      Publish to Applicant
                    </button>
                  )}
                </div>
              )}

              {saveNotice && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  {saveNotice}
                </p>
              )}
              {publishNotice && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {publishNotice}
                </p>
              )}
              {ackNotice && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {ackNotice}
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
