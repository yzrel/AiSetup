/**
 * Author: Yzrel Jade B. Eborde
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  Save,
  Send,
  ThumbsDown,
  ThumbsUp,
  Upload,
  XCircle,
} from "lucide-react";
import { AuthUser, authStore } from "../store/authStore";
import { applicantStore, Applicant } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { useApplicantSubscription } from "../hooks/useApplicantSubscription";
import { ModuleWorkflowLayout, ACTION_ROW, type ModuleStep } from "./ModuleWorkflowLayout";
import { appendStaffAssessment } from "../utils/clientAssessment";
import { notifyApprovalLetterPublished, notifyApprovalLetterRdDecision, notifyApprovalLetterConforme } from "../utils/notificationHelpers";
import type { ApprovalLetterForm } from "../api/types";
import {
  acknowledgeApprovalLetter,
  canPublishApprovalLetter,
  getApprovalLetterForm,
  getApprovalLetterStored,
  getSignedMoa,
  hasRdApprovedNotice,
  hasRtecReportPrerequisite,
  publishApprovalLetter,
  recordRdDecision,
  saveApprovalLetterDraft,
  syncApprovalLetterFromRtec,
  ensureApprovalLetterPublished,
  validateApprovalLetterAcknowledge,
  validateApprovalLetterPublish,
} from "../utils/approvalLetter";
import { allowWhenDemo, gateOpen, isDemoModeActive } from "../utils/demoMode";
import { ApprovalLetterEditor } from "./ApprovalLetterEditor";
import { ApprovalLetterPreview } from "./ApprovalLetterPreview";
import { DocumentDeliveryPanel } from "./DocumentDeliveryPanel";
import {
  SignedMoaUploadPanel,
  type SignedMoaUploadPanelHandle,
} from "./SignedMoaUploadPanel";
import { getApprovalRoutingNote } from "../utils/moaAnnexD";
import { formatFormMention } from "../constants/setupForms";

const STEPS: ModuleStep[] = [
  { id: "overview", label: "Overview", icon: <FileText className="w-4 h-4" /> },
  { id: "details", label: "Notice of Approval details", icon: <FileText className="w-4 h-4" /> },
  { id: "publish", label: "Publish", icon: <Send className="w-4 h-4" /> },
  { id: "moa", label: "Signed MOA", icon: <Upload className="w-4 h-4" /> },
];

const STEP_IDS = ["overview", "details", "publish", "moa"] as const;

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
  const [decisionNotice, setDecisionNotice] = useState("");
  const [lastRdDecision, setLastRdDecision] = useState<
    "approved" | "disapproved" | null
  >(null);
  const [conformeName, setConformeName] = useState("");
  const [ackNotice, setAckNotice] = useState("");
  const [, setMoaRefresh] = useState(0);
  const moaPanelRef = useRef<SignedMoaUploadPanelHandle>(null);

  const isRegionalDirector = user?.role === "regional-director";

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

  useApplicantSubscription(applicant?.id, loadForm);

  const rtecReady = hasRtecReportPrerequisite(applicant);
  const stored = applicant ? getApprovalLetterStored(applicant) : null;
  const assessedPublished = (
    (applicant?.moduleData?.assessments ?? []) as { decision?: string }[]
  ).some((a) => a.decision === "approval-published");
  // Assessment recovers cases where a stale store update wiped published=true.
  const isPublished =
    !!stored?.published || !!form?.published || assessedPublished;
  const isAcknowledged = !!stored?.acknowledged;
  const rdDecision = stored?.rdDecision ?? null;
  const rdApproved = rdDecision === "approved";
  const rdDisapproved = rdDecision === "disapproved";
  const canPublish = canPublishApprovalLetter(applicant);
  const signedMoa = getSignedMoa(applicant);
  const uploadedBy = user?.email ?? "staff";

  // Repair wiped publish flag so refresh/logout keep MOA unlocked.
  useEffect(() => {
    if (!applicant || !form || !assessedPublished) return;
    if (stored?.published) return;
    ensureApprovalLetterPublished(applicant.id, { ...form, published: true });
    setForm((prev) => (prev ? { ...prev, published: true } : prev));
  }, [applicant?.id, assessedPublished, stored?.published]);

  const handleSave = () => {
    if (!applicant || !form) return;
    if (step === "moa") {
      moaPanelRef.current?.saveDraft();
    }
    // Staff re-endorsement clears a prior RD disapproval so RD can decide again.
    saveApprovalLetterDraft(applicant.id, form, {
      clearRdDisapproval: isStaff && !isRegionalDirector,
    });
    setSaveNotice(
      rdDisapproved && isStaff && !isRegionalDirector
        ? "Draft saved. Prior Regional Director disapproval cleared for re-endorsement."
        : "Draft saved.",
    );
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const handleFormChange = (next: ApprovalLetterForm) => {
    setForm(next);
    if (!applicant) return;
    saveApprovalLetterDraft(applicant.id, next, {
      clearRdDisapproval: isStaff && !isRegionalDirector,
    });
  };

  const handleSync = () => {
    if (!applicant || !form) return;
    const synced = syncApprovalLetterFromRtec(form, applicant);
    setForm(synced);
    saveApprovalLetterDraft(applicant.id, synced, {
      clearRdDisapproval: isStaff && !isRegionalDirector,
    });
    setSaveNotice("Synced from RTEC / Project Proposal.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const handleRdDecision = (decision: "approved" | "disapproved") => {
    if (!applicant || !form || !user) return;
    if (!isRegionalDirector) return;
    const nextForm = recordRdDecision(
      applicant.id,
      decision,
      user.email,
      form,
    );
    if (nextForm) setForm(nextForm);
    setSubmitErrors([]);
    setLastRdDecision(decision);
    if (decision === "approved") {
      setDecisionNotice(
        "Approved. Notice of Approval generated — proceed to Publish when ready.",
      );
      setStep("publish");
    } else {
      setDecisionNotice(
        "Disapproved. Notice of Approval cannot be published until staff re-endorse and the Regional Director decides again.",
      );
    }
    setTimeout(() => {
      setDecisionNotice("");
      setLastRdDecision(null);
    }, 6000);
    notifyApprovalLetterRdDecision(applicant, decision);
  };

  const handlePublish = () => {
    if (!applicant || !form) return;
    const errors = validateApprovalLetterPublish(form, applicant);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    setSubmitErrors([]);
    const result = publishApprovalLetter(applicant.id, form);
    if (!result.ok) {
      setSubmitErrors([result.error ?? "Could not publish."]);
      return;
    }
    // Re-read after publish — appending assessment with the pre-publish
    // applicant would overwrite approvalLetter.published back to false.
    const publishedApplicant = applicantStore.getById(applicant.id) ?? applicant;
    if (user && authStore.isStaff(user.role)) {
      applicantStore.update(applicant.id, {
        ...appendStaffAssessment(publishedApplicant, {
          stage: "post-proposal",
          decision: "approval-published",
          assessedBy: user.email,
          assessedAt: new Date().toISOString(),
          remarks: "SETUP Notice of Approval published",
        }),
      });
    }
    notifyApprovalLetterPublished(publishedApplicant);
    setPublishNotice("Notice of Approval published to applicant.");
    setTimeout(() => setPublishNotice(""), 5000);
    setForm({ ...form, published: true });
  };

  const handleAcknowledge = () => {
    if (!applicant || !form) return;
    if (!hasRdApprovedNotice(applicant) && !isDemoModeActive()) {
      setSubmitErrors([
        "The Regional Director must Approve and staff must publish the Notice of Approval before you can acknowledge.",
      ]);
      return;
    }
    const errors = validateApprovalLetterAcknowledge(conformeName);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    setSubmitErrors([]);
    acknowledgeApprovalLetter(applicant.id, conformeName.trim());
    applicantStore.update(applicant.id, { currentModule: "landbank-withdrawal" });
    notifyApprovalLetterConforme(applicant);
    setAckNotice(
      "Conforme acknowledged. Proceed to LandBank & Withdrawal for MOA and account setup.",
    );
    setTimeout(() => setAckNotice(""), 5000);
    onSubmitSuccess?.();
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const showStaffWorkflow = isStaff;
  const demoStaffSteps = showStaffWorkflow;
  const showRdActions =
    showStaffWorkflow &&
    isRegionalDirector &&
    !!applicant &&
    allowWhenDemo(rtecReady) &&
    !isPublished;

  return (
    <ModuleWorkflowLayout
      formKey="003"
      subtitle="Official DOST approval letter issued after RTEC evaluation. Staff prepare; the Regional Director Approves or Disapproves; staff publish. The applicant acknowledges conforme, then proceeds to LandBank & Withdrawal (signed MOA and PDCs required before fund release)."
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
                  Complete and mark the {formatFormMention("002")} before issuing the Notice of
                  Approval.
                </p>
              </div>
            </div>
          )}
          {applicant &&
            showStaffWorkflow &&
            rtecReady &&
            !isPublished &&
            !rdDecision && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-900">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold">Awaiting Regional Director decision</p>
                  <p className="mt-1">
                    After a signed RTEC report, only the Regional Director may Approve or
                    Disapprove before the Notice of Approval can be published.
                    {isDemoModeActive() &&
                      " Demo mode may bypass the publish gate with this warning visible."}
                  </p>
                </div>
              </div>
            )}
          {applicant && showStaffWorkflow && rdApproved && !isPublished && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-sm text-emerald-800">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Regional Director approved</p>
                <p className="mt-1">
                  {stored?.rdDecidedBy
                    ? `Decided by ${stored.rdDecidedBy}`
                    : "Approved"}
                  {stored?.rdDecidedAt
                    ? ` · ${new Date(stored.rdDecidedAt).toLocaleString("en-PH")}`
                    : ""}
                  . Staff may publish the Notice of Approval to the applicant.
                </p>
              </div>
            </div>
          )}
          {applicant && showStaffWorkflow && rdDisapproved && !isPublished && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-800">
              <XCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Regional Director disapproved</p>
                <p className="mt-1">
                  Publishing is blocked. Staff may revise the draft and re-endorse; the
                  Regional Director can then decide again.
                  {stored?.rdDecidedBy
                    ? ` (${stored.rdDecidedBy}`
                    : ""}
                  {stored?.rdDecidedAt
                    ? ` · ${new Date(stored.rdDecidedAt).toLocaleString("en-PH")})`
                    : stored?.rdDecidedBy
                      ? ")"
                      : ""}
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
                        Publish the Notice of Approval (Publish step) before uploading the signed
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
                        ref={moaPanelRef}
                        applicant={applicant}
                        uploadedBy={uploadedBy}
                        user={user}
                        isAcknowledged={isAcknowledged}
                        requireAcknowledged={false}
                        onSaved={() => setMoaRefresh((n) => n + 1)}
                      />
                    )
                  )}

                  {signedMoa?.fileName && signedMoa.moaSignedDate && (
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

              {!showStaffWorkflow && signedMoa && applicant && (
                <SignedMoaUploadPanel
                  applicant={applicant}
                  uploadedBy={signedMoa.uploadedBy}
                  user={user}
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
                <>
                  {getApprovalRoutingNote(form) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 mb-4">
                      {getApprovalRoutingNote(form)}
                    </div>
                  )}
                  <ApprovalLetterEditor form={form} onChange={handleFormChange} />
                </>
              )}

              {(step === "publish" || !showStaffWorkflow) && (
                <>
                  <ApprovalLetterPreview
                    form={form}
                    applicationId={applicant.applicationId}
                    showToolbar={false}
                  />
                  <DocumentDeliveryPanel
                    applicant={applicant}
                    user={user}
                    moduleKey="approval-letter"
                    documentTitle="Approval Letter (Notice of Approval)"
                  />
                </>
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
                  Conforme acknowledged. Proceed to LandBank &amp; Withdrawal. DOST will
                  schedule MOA signing with your PSTO — staff upload the signed MOA there
                  (you do not upload it yourself).
                </p>
              )}

              {!showStaffWorkflow && isAcknowledged && signedMoa && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Conforme acknowledged. Signed MOA is on file. Continue to LandBank &amp;
                  Withdrawal for account setup once PDCs are recorded.
                </p>
              )}

              {showStaffWorkflow && (
                <div className={`${ACTION_ROW} flex-wrap pt-2 border-t border-gray-100`}>
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
                  {showRdActions && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRdDecision("approved")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRdDecision("disapproved")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Disapprove
                      </button>
                    </>
                  )}
                  {step === "publish" && !isPublished && (
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={!allowWhenDemo(rtecReady && canPublish)}
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
              {decisionNotice && (
                <p
                  className={`text-xs rounded-lg px-3 py-2 flex items-center gap-2 border ${
                    lastRdDecision === "disapproved"
                      ? "text-red-800 bg-red-50 border-red-200"
                      : "text-emerald-800 bg-emerald-50 border-emerald-200"
                  }`}
                >
                  {lastRdDecision === "disapproved" ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {decisionNotice}
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
