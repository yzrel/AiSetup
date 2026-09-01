/**
 * Author: Yzrel Jade B. Eborde
 */

import React, { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  RefreshCw,
  Save,
  Send,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { AuthUser, authStore } from "../store/authStore";
import { applicantStore } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import {
  ModuleWorkflowLayout,
  ACTION_ROW,
  type ModuleStep,
} from "./ModuleWorkflowLayout";
import { DOST_BLUE, MODULE_SHELL } from "./moduleTheme";
import { SignedDocumentUpload } from "./SignedDocumentUpload";
import { LbpIntroductionLetterEditor } from "./LbpIntroductionLetterEditor";
import { LbpIntroductionLetterPreview } from "./LbpIntroductionLetterPreview";
import { DocumentDeliveryPanel } from "./DocumentDeliveryPanel";
import type { LbpIntroductionLetterForm, ModuleDocument, WithdrawalTrancheNum } from "../api/types";
import { appendStaffAssessment } from "../utils/clientAssessment";
import {
  notifyLandBankComplete,
  notifyLbpIntroductionPublished,
} from "../utils/notificationHelpers";
import { getSignedMoa } from "../utils/approvalLetter";
import {
  getDisbursementPdcSummary,
  hasApprovalLetterAcknowledged,
  preparePdcsForDisbursement,
} from "../utils/projectInformationSheet";
import {
  downloadLbpIntroductionPdf,
  getLbpIntroductionForm,
  getLbpIntroductionStored,
  hasLbpIntroductionPublished,
  publishLbpIntroduction,
  saveLbpIntroductionDraft,
  syncLbpIntroductionFromUpstream,
  validateLbpIntroductionPublish,
} from "../utils/lbpIntroductionLetter";
import {
  downloadAuthorityLetterPdf,
  getLandBankForm,
  getLandBankOverview,
  getLandBankStored,
  hasLandBankPrerequisite,
  isTranche1Complete,
  isTranche2Complete,
  isTranche3Complete,
  isWithdrawalRequestReady,
  saveLandBankDraft,
  submitLandBank,
  validateLandBankSubmit,
} from "../utils/landBankWithdrawal";
import { allowWhenDemo, gateOpen } from "../utils/demoMode";
import { WithdrawalTranchePanel } from "./WithdrawalTranchePanel";
import { hasPdcsRecordedForDisbursement } from "../utils/refundDelinquent";

type StepId =
  | "prerequisites"
  | "introduction"
  | "account"
  | "withdrawal"
  | "authority";
type WithdrawalTrancheTab = WithdrawalTrancheNum;

const STEP_IDS: StepId[] = [
  "prerequisites",
  "introduction",
  "account",
  "withdrawal",
  "authority",
];

const STEPS: ModuleStep[] = [
  { id: "prerequisites", label: "MOA & PDCs", icon: <Upload className="w-4 h-4" /> },
  { id: "introduction", label: "LBP Introduction", icon: <FileText className="w-4 h-4" /> },
  { id: "account", label: "Account Opening", icon: <Building2 className="w-4 h-4" /> },
  { id: "withdrawal", label: "Withdrawal Request", icon: <Send className="w-4 h-4" /> },
  { id: "authority", label: "Authority Letter", icon: <Banknote className="w-4 h-4" /> },
];

const ACCOUNT_REQUIREMENTS = [
  "Valid government-issued IDs of the account holder",
  "Business registration documents (DTI / SEC / CDA)",
  "Mayor's or Business Permit",
  "SETUP Project Approval or Endorsement from DOST",
  "Completed LandBank account opening forms",
  "Initial deposit required by LandBank",
];

function moduleCardHeader(icon: ReactNode, label: string) {
  return (
    <div
      className="text-white px-5 py-3 font-semibold text-sm flex items-center gap-2"
      style={{ background: DOST_BLUE }}
    >
      {icon}
      {label}
    </div>
  );
}

interface LandBankAndWithdrawalProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

export function LandBankAndWithdrawal({
  user,
  onSubmitSuccess,
}: LandBankAndWithdrawalProps = {}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [step, setStep] = useState<StepId>("prerequisites");
  const [withdrawalTrancheTab, setWithdrawalTrancheTab] = useState<WithdrawalTrancheTab>(1);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [uploadDate, setUploadDate] = useState("");
  const [authorityTranche, setAuthorityTranche] = useState<WithdrawalTrancheNum>(1);
  const [lbpForm, setLbpForm] = useState<LbpIntroductionLetterForm | null>(null);
  const [lbpSaveNotice, setLbpSaveNotice] = useState("");
  const [lbpPublishNotice, setLbpPublishNotice] = useState("");
  const [, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  const loadLbpForm = useCallback(() => {
    if (!applicant) {
      setLbpForm(null);
      return;
    }
    setLbpForm(getLbpIntroductionForm(applicant));
  }, [applicant]);

  useEffect(() => {
    const unsub = applicantStore.subscribe(() => {
      reload();
      loadLbpForm();
    });
    return unsub;
  }, [reload, loadLbpForm]);

  useEffect(() => {
    loadLbpForm();
  }, [applicant?.id, loadLbpForm]);

  const form = applicant ? getLandBankForm(applicant) : null;
  const overview = getLandBankOverview(applicant);
  const stored = applicant ? getLandBankStored(applicant) : null;
  const lbpStored = applicant ? getLbpIntroductionStored(applicant) : null;
  const introPublished = hasLbpIntroductionPublished(applicant);
  const prerequisiteOk = hasLandBankPrerequisite(applicant);
  const signedMoa = getSignedMoa(applicant);
  const pdcSummary = getDisbursementPdcSummary(applicant);
  const pdcsRecorded = hasPdcsRecordedForDisbursement(applicant);
  const accountReady = !!form?.accountSnapshot;
  const withdrawalUnlocked = gateOpen(accountReady);
  const withdrawalReady = form ? isWithdrawalRequestReady(form) : false;
  const tranche1Ready = form ? isTranche1Complete(form.tranches.first) : false;
  const tranche2Ready = form ? isTranche2Complete(form.tranches.second) : false;
  const tranche3Ready = form ? isTranche3Complete(form.tranches.third) : false;
  const authorityReady = !!(stored?.submitted || form?.authorityLetterGenerated);
  const uploadedBy = user?.email ?? "applicant";
  const showStaffWorkflow = isStaff;
  /** Clients browse every stage as a scrollable read-only stack. */
  const sectionsToShow: StepId[] = showStaffWorkflow ? [step] : STEP_IDS;

  const stepIndex = STEP_IDS.indexOf(step);

  /** Highest step index the user may open (0-based). */
  const maxReached = (() => {
    if (stored?.submitted) return STEP_IDS.length - 1;
    let reached = 0;
    if (allowWhenDemo(prerequisiteOk)) reached = 1;
    if (allowWhenDemo(prerequisiteOk && introPublished)) reached = 2;
    if (allowWhenDemo(prerequisiteOk && introPublished && accountReady)) reached = 3;
    if (
      allowWhenDemo(
        prerequisiteOk && introPublished && accountReady && withdrawalReady,
      )
    ) {
      reached = 4;
    }
    return reached;
  })();

  const canGoNext = (() => {
    if (step === "prerequisites") return allowWhenDemo(prerequisiteOk);
    if (step === "introduction") return allowWhenDemo(introPublished);
    if (step === "account") return allowWhenDemo(accountReady);
    if (step === "withdrawal") return allowWhenDemo(withdrawalReady);
    return false;
  })();

  useEffect(() => {
    const notes = form?.accountSnapshot?.notes?.trim();
    if (notes) {
      setUploadDate(notes);
    }
  }, [form?.accountSnapshot?.notes, form?.accountSnapshot?.uploadedAt]);

  const goBack = () => {
    setStep(STEP_IDS[Math.max(0, stepIndex - 1)]);
  };

  const goNext = () => {
    if (!canGoNext) return;
    setStep(STEP_IDS[Math.min(STEP_IDS.length - 1, stepIndex + 1)]);
  };

  const handleSaveDoc = (field: "accountSnapshot", doc: ModuleDocument) => {
    if (!showStaffWorkflow || !applicant || !form) return;
    saveLandBankDraft(applicant.id, { ...form, [field]: doc });
  };

  const handleRemoveDoc = (field: "accountSnapshot") => {
    if (!showStaffWorkflow || !applicant || !form) return;
    saveLandBankDraft(applicant.id, { ...form, [field]: null });
  };

  const handleLbpSave = () => {
    if (!showStaffWorkflow || !applicant || !lbpForm) return;
    saveLbpIntroductionDraft(applicant.id, lbpForm);
    setLbpSaveNotice("Draft saved.");
    setTimeout(() => setLbpSaveNotice(""), 3000);
  };

  const handleLbpChange = (next: LbpIntroductionLetterForm) => {
    if (!showStaffWorkflow) return;
    setLbpForm(next);
    if (!applicant) return;
    saveLbpIntroductionDraft(applicant.id, next);
  };

  const handleLbpSync = () => {
    if (!showStaffWorkflow || !applicant) return;
    const synced = syncLbpIntroductionFromUpstream(applicant, lbpForm);
    setLbpForm(synced);
    saveLbpIntroductionDraft(applicant.id, synced);
    setLbpSaveNotice("Synced from approval letter and project proposal.");
    setTimeout(() => setLbpSaveNotice(""), 3000);
  };

  const handleLbpPublish = () => {
    if (!showStaffWorkflow || !applicant || !lbpForm) return;
    const errors = validateLbpIntroductionPublish(lbpForm);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    setSubmitErrors([]);
    const publishErrors = publishLbpIntroduction(applicant.id, lbpForm, uploadedBy);
    if (publishErrors.length) {
      setSubmitErrors(publishErrors);
      return;
    }
    if (user && authStore.isStaff(user.role)) {
      applicantStore.update(applicant.id, {
        ...appendStaffAssessment(applicant, {
          stage: "landbank-withdrawal",
          decision: "lbp-intro-published",
          assessedBy: user.email,
          assessedAt: new Date().toISOString(),
          remarks: "Letter of Introduction to LBP published",
        }),
      });
    }
    notifyLbpIntroductionPublished(applicant);
    setLbpPublishNotice("Letter of Introduction published to applicant.");
    setTimeout(() => setLbpPublishNotice(""), 5000);
    loadLbpForm();
  };

  const handleLbpDownload = () => {
    downloadLbpIntroductionPdf(applicant?.applicationId);
  };

  const handleWithdrawalContinue = () => {
    if (!showStaffWorkflow || !applicant || !form) return;
    if (!allowWhenDemo(accountReady)) {
      setSubmitErrors(["Upload the LandBank account snapshot first."]);
      setStep("account");
      return;
    }
    if (!allowWhenDemo(withdrawalReady)) {
      setSubmitErrors([
        "Complete 1st tranche: signed letter request, quotations, and equipment photos.",
      ]);
      return;
    }
    setSubmitErrors([]);
    setStep("authority");
  };

  const handleAuthorityDownload = () => {
    if (!applicant || !form) return;
    const ready =
      authorityTranche === 1
        ? isTranche1Complete(form.tranches.first)
        : authorityTranche === 2
          ? isTranche2Complete(form.tranches.second)
          : isTranche3Complete(form.tranches.third);
    if (!allowWhenDemo(ready)) {
      setSubmitErrors([
        authorityTranche === 1
          ? "Complete the 1st tranche letter request (signed letter, quotations, photos) before downloading authority."
          : authorityTranche === 2
            ? "Upload the signed 2nd tranche letter request before downloading authority."
            : "Upload the signed 3rd tranche letter request before downloading authority.",
      ]);
      setStep("withdrawal");
      return;
    }
    downloadAuthorityLetterPdf(applicant, applicant.applicationId, authorityTranche);
    reload();
  };

  const handleSubmit = () => {
    if (!showStaffWorkflow) {
      setSubmitErrors(["Only DOST staff can submit LandBank & withdrawal."]);
      return;
    }
    if (!applicant) {
      setSubmitErrors(["Select an applicant to continue."]);
      return;
    }
    const errors = validateLandBankSubmit(applicant);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    const submitErrs = submitLandBank(applicant.id, uploadedBy);
    if (submitErrs.length) {
      setSubmitErrors(submitErrs);
      return;
    }
    applicantStore.update(applicant.id, {
      ...appendStaffAssessment(applicant, {
        stage: "landbank-withdrawal",
        decision: "submitted",
        assessedBy: uploadedBy,
        assessedAt: new Date().toISOString(),
        remarks: "LandBank account and withdrawal documents verified.",
      }),
    });
    notifyLandBankComplete(applicant);
    setSubmitErrors([]);
    onSubmitSuccess?.();
  };

  const alerts = (
    <>
      {!applicant && showStaffWorkflow && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Select an applicant to prepare LandBank documents.
        </div>
      )}
      {!prerequisiteOk && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            {showStaffWorkflow
              ? "Signed MOA must be uploaded in Approval Letter, and staff must record post-dated checks (PDCs) on the MOA & PDCs step before LandBank enrollment."
              : "DOST staff are completing your signed MOA and PDC prerequisites. You can view LandBank documents here once they are ready."}{" "}
            {!hasApprovalLetterAcknowledged(applicant) &&
              showStaffWorkflow &&
              "Approval letter conforme is also required."}
          </p>
        </div>
      )}
      {prerequisiteOk && !introPublished && !showStaffWorkflow && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Your PSTO is preparing the Letter of Introduction to Land Bank of the
            Philippines. You will be notified when it is published and may download
            it here.
          </p>
        </div>
      )}
      {!showStaffWorkflow && introPublished && !stored?.submitted && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            LandBank account opening and withdrawal documents are prepared by DOST
            staff. This page is view-only — download published letters and review
            documents on file below.
          </p>
        </div>
      )}
      {lbpSaveNotice && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {lbpSaveNotice}
        </div>
      )}
      {lbpPublishNotice && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {lbpPublishNotice}
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

  const landBankDocsReadOnly = !showStaffWorkflow || !!stored?.submitted;

  return (
    <ModuleWorkflowLayout
      title="LandBank & Withdrawal"
      subtitle={
        showStaffWorkflow
          ? "Staff prepare account opening, withdrawal request, and authority letter. Cooperators may view published documents only."
          : "View published LandBank letters and documents prepared by DOST staff."
      }
      user={user}
      steps={showStaffWorkflow ? STEPS : undefined}
      currentStep={showStaffWorkflow ? step : undefined}
      maxReached={showStaffWorkflow ? maxReached : undefined}
      onStepClick={
        showStaffWorkflow ? (id) => setStep(id as StepId) : undefined
      }
      showStaffPicker={showStaffWorkflow}
      staffPickerLabel="Review applicant"
      alerts={alerts}
      insetBody={false}
      maxWidth="5xl"
    >
      <div className={showStaffWorkflow ? undefined : "space-y-5"}>
      {sectionsToShow.includes("prerequisites") && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <Upload className="w-4 h-4" />,
            "Prerequisites — Signed MOA & PDCs",
          )}
          <div className="p-5 space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Signed Memorandum of Agreement
              </p>
              {signedMoa ? (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Signed MOA on file
                  {signedMoa.moaSignedDate
                    ? ` — ${new Date(signedMoa.moaSignedDate).toLocaleDateString("en-PH", {
                        dateStyle: "long",
                      })}`
                    : ""}
                  {signedMoa.fileName ? ` (${signedMoa.fileName})` : ""}. Uploaded in
                  Approval Letter.
                </p>
              ) : showStaffWorkflow ? (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Upload the signed MOA in the Approval Letter module (Signed MOA
                  step). LandBank does not accept MOA uploads here.
                </p>
              ) : (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Awaiting DOST staff to upload the signed MOA in Approval Letter after
                  on-site signing.
                </p>
              )}
            </div>

            <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Pre-disbursement PDCs
              </p>
              <p className="text-xs text-gray-600">
                Record post-dated checks covering the refund schedule (term + 1 for
                technology transfer fee at 0.5%) before fund release.
              </p>
              <p className="text-xs text-gray-700">
                Scheduled PDCs: <strong>{pdcSummary.count || "—"}</strong>
                {pdcSummary.ttf !== "—" && (
                  <> · TTF: <strong>{pdcSummary.ttf}</strong></>
                )}
                {pdcsRecorded && (
                  <span className="ml-2 text-green-700 font-semibold">Recorded</span>
                )}
              </p>
              {showStaffWorkflow && applicant && !pdcsRecorded && (
                <button
                  type="button"
                  onClick={() => {
                    preparePdcsForDisbursement(applicant.id);
                    reload();
                  }}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ background: DOST_BLUE }}
                >
                  Generate &amp; record PDC schedule
                </button>
              )}
              {!showStaffWorkflow && !pdcsRecorded && (
                <p className="text-xs text-amber-800">
                  DOST staff will generate and record your PDC schedule. You can
                  review status here once recorded.
                </p>
              )}
            </div>

            {prerequisiteOk && (
              <p className="text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Prerequisites complete — continue to Letter of Introduction.
              </p>
            )}
          </div>
        </div>
      )}

      {sectionsToShow.includes("introduction") && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <FileText className="w-4 h-4" />,
            "Letter of Introduction to LBP",
          )}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-500">
              DOST publishes this letter so you can open a dedicated SETUP savings
              passbook account at LandBank.
            </p>
            {showStaffWorkflow && applicant && lbpForm && !introPublished && (
              <>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleLbpSync}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync from upstream
                  </button>
                  <button
                    type="button"
                    onClick={handleLbpSave}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <Save className="w-4 h-4" />
                    Save draft
                  </button>
                  <button
                    type="button"
                    onClick={handleLbpPublish}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg text-white"
                    style={{ background: DOST_BLUE }}
                  >
                    <Send className="w-4 h-4" />
                    Publish to applicant
                  </button>
                </div>
                <LbpIntroductionLetterEditor form={lbpForm} onChange={handleLbpChange} />
              </>
            )}

            {showStaffWorkflow && introPublished && lbpForm && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Published
                {lbpStored?.publishedAt
                  ? ` on ${new Date(lbpStored.publishedAt).toLocaleDateString()}`
                  : ""}
                . Applicant may download and present at LandBank.
              </div>
            )}

            {!showStaffWorkflow && !introPublished && (
              <p className="text-sm text-gray-600">
                DOST staff will publish the Letter of Introduction after the signed MOA
                and PDCs are on file. When published, download it here and present it
                at your LandBank branch when opening your SETUP savings passbook
                account.
              </p>
            )}

            {(gateOpen(introPublished) || showStaffWorkflow) && lbpForm && (
              <>
                <LbpIntroductionLetterPreview
                  form={lbpForm}
                  applicationId={applicant?.applicationId}
                  onPrint={
                    gateOpen(introPublished) || showStaffWorkflow
                      ? handleLbpDownload
                      : undefined
                  }
                  showToolbar={gateOpen(introPublished) || showStaffWorkflow}
                />
                <DocumentDeliveryPanel
                  applicant={applicant}
                  user={user}
                  moduleKey="landbank-withdrawal"
                  documentTitle="LBP Letter of Introduction"
                  readOnly={landBankDocsReadOnly}
                />
              </>
            )}
          </div>
        </div>
      )}

      {sectionsToShow.includes("account") && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <Building2 className="w-4 h-4" />,
            "Opening of LandBank Savings Account",
          )}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-500">
              {showStaffWorkflow
                ? "Record the LandBank savings account dedicated to the SETUP project after the cooperator opens it with the Letter of Introduction."
                : "DOST staff record your LandBank account snapshot after you open the SETUP savings passbook. View the document on file below when available."}
            </p>
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-amber-800">System Advisory</p>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Present the published Letter of Introduction when opening your SETUP
                savings passbook account. The account will be held/tagged until DOST
                issues a letter of authority for withdrawals.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ul className="space-y-1.5">
                  {ACCOUNT_REQUIREMENTS.map((req) => (
                    <li
                      key={req}
                      className="flex items-start gap-2 text-xs text-amber-800"
                    >
                      <span className="mt-0.5 w-3.5 h-3.5 bg-amber-300 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-amber-900">
                        ·
                      </span>
                      {req}
                    </li>
                  ))}
                </ul>
                <div className="bg-green-50 border border-green-200 rounded-lg flex flex-col items-center justify-center py-6 gap-2">
                  <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center shadow">
                    <Building2 className="w-9 h-9 text-white" />
                  </div>
                  <p className="font-bold text-green-700 text-sm tracking-wide">
                    LANDBANK
                  </p>
                  <p className="text-xs text-green-600">Land Bank of the Philippines</p>
                </div>
              </div>
            </div>

            {!introPublished && (
              <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  {showStaffWorkflow
                    ? "Account snapshot upload is locked until the Letter of Introduction is published."
                    : "Account documents appear here after DOST staff publish the Letter of Introduction and record your account snapshot."}
                </p>
              </div>
            )}

            {applicant && form && gateOpen(introPublished) && (
              <SignedDocumentUpload
                label="LandBank account snapshot"
                document={form.accountSnapshot}
                signedDate={uploadDate}
                onSignedDateChange={(date) => {
                  if (!showStaffWorkflow) return;
                  setUploadDate(date);
                  if (form.accountSnapshot) {
                    handleSaveDoc("accountSnapshot", {
                      ...form.accountSnapshot,
                      notes: date || undefined,
                    });
                  }
                }}
                onUpload={(doc) =>
                  handleSaveDoc("accountSnapshot", { ...doc, notes: uploadDate })
                }
                onRemove={() => handleRemoveDoc("accountSnapshot")}
                uploadedBy={uploadedBy}
                readOnly={landBankDocsReadOnly}
                dateLabel="Account opened on"
                applicantId={applicant.id}
                moduleKey="landBank"
              />
            )}
            {accountReady && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <Shield className="w-3.5 h-3.5" />
                LandBank account verified — proceed to withdrawal request
              </div>
            )}
          </div>
        </div>
      )}

      {sectionsToShow.includes("withdrawal") && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <FileText className="w-4 h-4" />,
            "Letter Request for Withdrawal",
          )}
          <div className="p-5 space-y-5">
            <p className="text-sm text-gray-500">
              {showStaffWorkflow
                ? "Generate and process Letter Requests for Withdrawal for the 1st, 2nd, and 3rd tranches using equipment from the project proposal budgetary requirement."
                : "Review withdrawal letter packages prepared by DOST staff for each tranche."}
            </p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700">
                  Project Overview
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">{overview.projectTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      Total Withdrawal: {overview.totalWithdrawal}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">{overview.enterpriseName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      Approved Project Amount: {overview.approvedAmount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      1st Tranche: {overview.tranche1Amount}
                      {tranche1Ready ? " ✓" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      2nd Tranche: {overview.tranche2Amount}
                      {tranche2Ready ? " ✓" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      3rd Tranche: {overview.tranche3Amount}
                      {tranche3Ready ? " ✓" : ""}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-700">
                      Remaining Balance: {overview.remainingBalance}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  {accountReady ? (
                    <div className="flex items-center gap-1.5 bg-green-100 border border-green-300 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      <Shield className="w-3.5 h-3.5" />
                      LANDBANK ACCOUNT VERIFIED
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                      {showStaffWorkflow
                        ? "Complete account snapshot first"
                        : "Awaiting staff to record account snapshot"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {applicant && form && (
              <>
                <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                  {(
                    [
                      { n: 1 as const, label: "1st Tranche", ready: tranche1Ready },
                      { n: 2 as const, label: "2nd Tranche", ready: tranche2Ready },
                      { n: 3 as const, label: "3rd Tranche", ready: tranche3Ready },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.n}
                      type="button"
                      onClick={() => setWithdrawalTrancheTab(tab.n)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        withdrawalTrancheTab === tab.n
                          ? "text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      style={
                        withdrawalTrancheTab === tab.n
                          ? { background: DOST_BLUE }
                          : undefined
                      }
                    >
                      {tab.label}
                      {tab.ready && <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                <WithdrawalTranchePanel
                  applicant={applicant}
                  user={user}
                  form={form}
                  tranche={withdrawalTrancheTab}
                  readOnly={landBankDocsReadOnly || !withdrawalUnlocked}
                  isStaff={showStaffWorkflow}
                />

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Remarks</label>
                  <textarea
                    rows={2}
                    value={form.withdrawalRemarks}
                    onChange={(e) => {
                      if (!showStaffWorkflow || stored?.submitted) return;
                      saveLandBankDraft(applicant.id, {
                        ...form,
                        withdrawalRemarks: e.target.value,
                      });
                    }}
                    disabled={landBankDocsReadOnly || !withdrawalUnlocked}
                    placeholder="Additional remarks for withdrawal request..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none disabled:opacity-60"
                  />
                </div>

                {showStaffWorkflow && !stored?.submitted && (
                  <button
                    type="button"
                    onClick={handleWithdrawalContinue}
                    disabled={!allowWhenDemo(withdrawalReady && accountReady)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Continue to Authority Letter
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {sectionsToShow.includes("authority") && (
        <div className={`${MODULE_SHELL} border border-gray-200`}>
          {moduleCardHeader(
            <Banknote className="w-4 h-4" />,
            "Authority Letter to Withdraw",
          )}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              {showStaffWorkflow
                ? "After the withdrawal request is complete, generate the authority letter for the selected tranche."
                : "When DOST staff complete your withdrawal documents, download the authority letter and present it at your LandBank branch with valid government-issued IDs."}
            </p>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  {
                    n: 1 as const,
                    label: "1st Tranche",
                    ready: tranche1Ready,
                    amount: overview.tranche1Amount,
                  },
                  {
                    n: 2 as const,
                    label: "2nd Tranche",
                    ready: tranche2Ready,
                    amount: overview.tranche2Amount,
                  },
                  {
                    n: 3 as const,
                    label: "3rd Tranche",
                    ready: tranche3Ready,
                    amount: overview.tranche3Amount,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.n}
                  type="button"
                  onClick={() => setAuthorityTranche(tab.n)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    authorityTranche === tab.n
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    authorityTranche === tab.n ? { background: DOST_BLUE } : undefined
                  }
                >
                  {tab.label} ({tab.amount})
                  {tab.ready && <CheckCircle className="w-3 h-3" />}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-sm text-gray-700">Withdrawal Summary</p>
                <div className="space-y-2 text-xs">
                  {[
                    {
                      icon: <User className="w-3.5 h-3.5" />,
                      label: "Account Holder",
                      value: overview.accountHolder,
                    },
                    {
                      icon: <Building2 className="w-3.5 h-3.5" />,
                      label: "Enterprise",
                      value: overview.enterpriseName,
                    },
                    {
                      icon: <Banknote className="w-3.5 h-3.5" />,
                      label: "Approved Amount",
                      value: overview.approvedAmount,
                    },
                    {
                      icon: <Banknote className="w-3.5 h-3.5" />,
                      label: `Amount to Withdraw (T${authorityTranche})`,
                      value:
                        authorityTranche === 1
                          ? overview.tranche1Amount
                          : authorityTranche === 2
                            ? overview.tranche2Amount
                            : overview.tranche3Amount,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-blue-400">{row.icon}</span>
                      <span className="text-gray-500 w-36 shrink-0">{row.label}:</span>
                      <span className="font-semibold text-gray-800">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-gray-700 mb-2">
                    Download Authority Letter
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Download the authority letter for the selected tranche and present it
                    to your nearest LandBank branch together with valid IDs.
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleAuthorityDownload}
                    disabled={
                      !allowWhenDemo(
                        authorityTranche === 1
                          ? tranche1Ready
                          : authorityTranche === 2
                            ? tranche2Ready
                            : tranche3Ready,
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    style={{ background: DOST_BLUE }}
                  >
                    <Download className="w-4 h-4" />
                    Download Authority Letter (PDF)
                  </button>
                  <button
                    type="button"
                    onClick={handleAuthorityDownload}
                    disabled={
                      !allowWhenDemo(
                        authorityTranche === 1
                          ? tranche1Ready
                          : authorityTranche === 2
                            ? tranche2Ready
                            : tranche3Ready,
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download DOCX Version
                  </button>
                </div>
              </div>
            </div>

            {authorityReady && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-700">
                  Your Authority Letter to Withdraw has been generated and is ready for
                  download. Present this letter at any LandBank branch along with valid
                  government-issued IDs.
                </p>
              </div>
            )}

            {showStaffWorkflow && !stored?.submitted && onSubmitSuccess && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  !allowWhenDemo(
                    prerequisiteOk && introPublished && accountReady && withdrawalReady,
                  )
                }
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: DOST_BLUE }}
              >
                Submit &amp; Continue to Procurement &amp; Liquidation →
              </button>
            )}
            {!showStaffWorkflow && stored?.submitted && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-700">
                  LandBank &amp; withdrawal is complete. You may proceed to procurement
                  and liquidation when unlocked.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {showStaffWorkflow && (
      <div className={`${ACTION_ROW} flex-wrap pt-2 border-t border-gray-100 print:hidden`}>
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        {step !== "authority" && (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
            style={{ background: DOST_BLUE }}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      )}
      </div>
    </ModuleWorkflowLayout>
  );
}
