/**
 * Author: Yzrel Jade B. Eborde
 */

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  Save,
  Upload,
} from "lucide-react";
import { AuthUser } from "../store/authStore";
import { applicantStore, Applicant } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { DOST_BLUE, ModuleWorkflowLayout, type ModuleStep } from "./ModuleWorkflowLayout";
import type { PisOngoingFiling, PrePisDraftForm, SignedPrePisDocument } from "../api/types";
import { getSignedMoa } from "../utils/approvalLetter";
import { notifySigningDayComplete } from "../utils/notificationHelpers";
import {
  buildPisOngoingDraft,
  canCompleteSigningDay,
  completeSigningDay,
  downloadPrePisPdf,
  getPisStoredOrEmpty,
  getPrePisDraft,
  hasApprovalLetterAcknowledged,
  isSigningDayComplete,
  printPisOngoingPdf,
  removeSignedPrePis,
  savePisOngoingFiling,
  savePrePisDraft,
  saveSignedPrePis,
  syncPrePisDraft,
  validateSignedPrePisUpload,
  validatePisOngoingFiling,
  sortPisOngoingFilings,
  normalizePisOngoingFiling,
} from "../utils/projectInformationSheet";
import { PrePisEditor } from "./PrePisEditor";
import { PrePisPreview } from "./PrePisPreview";
import { PisOngoingEditor } from "./PisOngoingEditor";
import { PisOngoingPreview } from "./PisOngoingPreview";
import { SignedMoaUploadPanel } from "./SignedMoaUploadPanel";
import { SignedDocumentUpload } from "./SignedDocumentUpload";

const STAFF_STEPS: ModuleStep[] = [
  { id: "overview", label: "Overview", icon: <FileText className="w-4 h-4" /> },
  { id: "prep", label: "Prepare Pre-PIS", icon: <FileText className="w-4 h-4" /> },
  { id: "upload", label: "Upload signed Pre-PIS", icon: <Upload className="w-4 h-4" /> },
  { id: "complete", label: "Unlock LandBank", icon: <Banknote className="w-4 h-4" /> },
];

const STAFF_STEP_IDS = ["overview", "prep", "upload", "complete"] as const;

type StaffStepId = (typeof STAFF_STEP_IDS)[number];
type TabId = "signing-day" | "ongoing";

interface ProjectInformationSheetProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

export function ProjectInformationSheet({
  user,
  onSubmitSuccess,
}: ProjectInformationSheetProps = {}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [step, setStep] = useState<StaffStepId>("overview");
  const [tab, setTab] = useState<TabId>("signing-day");
  const [draft, setDraft] = useState<PrePisDraftForm | null>(null);
  const [saveNotice, setSaveNotice] = useState("");
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [completeNotice, setCompleteNotice] = useState("");
  const [prePisSignedDate, setPrePisSignedDate] = useState("");
  const [prePisNotes, setPrePisNotes] = useState("");
  const [pendingPrePisFile, setPendingPrePisFile] = useState<
    Omit<SignedPrePisDocument, "prePisSignedDate" | "notes"> | null
  >(null);
  const [ongoingFiling, setOngoingFiling] = useState<PisOngoingFiling | null>(null);
  const [selectedFilingId, setSelectedFilingId] = useState<string | null>(null);
  const [ongoingErrors, setOngoingErrors] = useState<string[]>([]);
  const [, setMoaRefresh] = useState(0);

  const loadDraft = useCallback((app: Applicant | null) => {
    if (!app) {
      setDraft(null);
      return;
    }
    setDraft(getPrePisDraft(app));
    const stored = getPisStoredOrEmpty(app);
    if (stored.signedPrePis) {
      setPrePisSignedDate(stored.signedPrePis.prePisSignedDate);
      setPrePisNotes(stored.signedPrePis.notes ?? "");
    } else {
      const moa = getSignedMoa(app);
      setPrePisSignedDate(moa?.moaSignedDate ?? "");
    }
  }, []);

  useEffect(() => {
    loadDraft(applicant);
  }, [applicant?.id, loadDraft]);

  useEffect(() => {
    return applicantStore.subscribe(() => {
      if (applicant) {
        const updated = applicantStore.getById(applicant.id);
        if (updated) loadDraft(updated);
      }
    });
  }, [applicant?.id, loadDraft]);

  const ackReady = hasApprovalLetterAcknowledged(applicant);
  const approvalAcknowledged = ackReady;
  const moa = getSignedMoa(applicant);
  const pisStored = applicant ? getPisStoredOrEmpty(applicant) : null;
  const signedPrePis = pisStored?.signedPrePis ?? null;
  const signingComplete = isSigningDayComplete(applicant);
  const canComplete = canCompleteSigningDay(applicant);
  const ongoingFilings = sortPisOngoingFilings(pisStored?.ongoingFilings ?? []);

  const handleSaveDraft = () => {
    if (!applicant || !draft) return;
    savePrePisDraft(applicant.id, draft);
    setSaveNotice("Pre-PIS draft saved.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const handleSync = () => {
    if (!applicant || !draft) return;
    const synced = syncPrePisDraft(draft, applicant);
    setDraft(synced);
    savePrePisDraft(applicant.id, synced);
    setSaveNotice("Synced from Project Proposal / Approval Letter.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const handleSaveSignedPrePis = () => {
    if (!applicant || !isStaff) return;
    const fileMeta = pendingPrePisFile ?? signedPrePis;
    if (!fileMeta) {
      setUploadErrors(["Upload a signed Pre-PIS scan first."]);
      return;
    }
    const { errors, warnings } = validateSignedPrePisUpload(
      prePisSignedDate,
      fileMeta.fileName,
      moa?.moaSignedDate,
    );
    setUploadErrors(errors);
    setUploadWarnings(warnings);
    if (errors.length) return;

    const doc: SignedPrePisDocument = {
      ...fileMeta,
      prePisSignedDate,
      notes: prePisNotes || undefined,
    };
    saveSignedPrePis(applicant.id, doc);
    setPendingPrePisFile(null);
    setSaveNotice("Signed Pre-PIS saved.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const handleCompleteSigningDay = () => {
    if (!applicant || !user) return;
    if (!canComplete) return;
    completeSigningDay(applicant.id, user.email);
    notifySigningDayComplete(applicant);
    setCompleteNotice("MOA signing complete. LandBank is now unlocked.");
    setTimeout(() => setCompleteNotice(""), 5000);
    onSubmitSuccess?.();
  };

  const startOngoingFiling = () => {
    const filing = buildPisOngoingDraft(applicant);
    setOngoingFiling(filing);
    setSelectedFilingId(filing.id);
  };

  const loadOngoingFiling = (id: string) => {
    const filing = ongoingFilings.find((f) => f.id === id);
    if (filing) {
      setOngoingFiling({ ...normalizePisOngoingFiling(filing) });
      setSelectedFilingId(id);
      setOngoingErrors([]);
    }
  };

  const uploadedBy = user?.email ?? "staff";

  const handleSaveOngoing = () => {
    if (!applicant || !ongoingFiling) return;
    const errors = validatePisOngoingFiling(
      ongoingFiling,
      pisStored?.ongoingFilings ?? [],
    );
    setOngoingErrors(errors);
    if (errors.length) return;
    savePisOngoingFiling(applicant.id, {
      ...normalizePisOngoingFiling(ongoingFiling),
      filedAt: new Date().toISOString(),
    });
    setSaveNotice("Semester PIS filing saved.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const stepIndex = STAFF_STEPS.findIndex((s) => s.id === step);

  return (
    <ModuleWorkflowLayout
      title="Project Information Sheet — MOA Signing Day"
      subtitle="Pre-PIS may be prepared and uploaded before or after MOA signing. LandBank is unlocked when the signed MOA is on file and staff complete MOA signing. Form 009 ongoing PIS is filed once per semester during implementation."
      user={user}
      steps={isStaff && tab === "signing-day" ? STAFF_STEPS : undefined}
      currentStep={isStaff && tab === "signing-day" ? step : undefined}
      onStepClick={
        isStaff && tab === "signing-day"
          ? (id) => setStep(id as StaffStepId)
          : undefined
      }
      staffPickerLabel="Review applicant PIS"
      alerts={
        <>
          {!applicant && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              Select an applicant to manage the Project Information Sheet.
            </div>
          )}
          {applicant && !ackReady && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Notice of Approval required</p>
                <p className="mt-1">
                  The applicant must acknowledge the SETUP Form 003 Notice of Approval
                  before MOA signing day workflow begins.
                </p>
              </div>
            </div>
          )}
          {applicant && ackReady && !isStaff && !signingComplete && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              Your Notice of Approval has been acknowledged. DOST will schedule MOA signing
              with your PSTO. After the signed MOA is recorded, your LandBank account setup
              will be enabled. Pre-PIS may be completed before or after MOA signing.
            </div>
          )}
          {applicant && ackReady && signingComplete && !isStaff && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              MOA signing day is complete. You may proceed to LandBank account setup.
            </div>
          )}
        </>
      }
    >
      {applicant && ackReady && draft && (
        <>
          <div className="flex gap-2 border-b border-gray-100 pb-3">
            <button
              type="button"
              onClick={() => setTab("signing-day")}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                tab === "signing-day"
                  ? "text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={tab === "signing-day" ? { background: DOST_BLUE } : undefined}
            >
              MOA Signing Day
            </button>
            <button
              type="button"
              onClick={() => setTab("ongoing")}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                tab === "ongoing"
                  ? "text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={tab === "ongoing" ? { background: DOST_BLUE } : undefined}
            >
              Form 009 Ongoing
            </button>
          </div>

          {tab === "signing-day" && (
            <div className="space-y-4">
                {(step === "overview" || !isStaff) && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-[#0C2461] mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {draft.projectTitle || "Untitled project"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {applicant.enterpriseName} · {applicant.applicationId}
                        </p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div
                        className={`rounded-lg px-3 py-2 border ${
                          moa
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        {moa
                          ? `Signed MOA on file — ${new Date(moa.moaSignedDate).toLocaleDateString()}`
                          : "Signed MOA pending — required to unlock LandBank"}
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 border ${
                          signedPrePis
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        {signedPrePis
                          ? `Signed Pre-PIS on file — ${new Date(signedPrePis.prePisSignedDate).toLocaleDateString()}`
                          : "Signed Pre-PIS optional — may be filed before or after MOA"}
                      </div>
                    </div>
                    {signingComplete && (
                      <p className="text-sm text-emerald-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Signing day complete
                        {pisStored?.completedAt
                          ? ` — ${new Date(pisStored.completedAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    )}
                    {isStaff && !moa && (
                      <div className="border border-[#0C2461]/20 rounded-xl p-4 space-y-3 bg-blue-50/40">
                        <p className="text-sm font-semibold text-gray-800">
                          Step 1 — Upload signed MOA
                        </p>
                        <SignedMoaUploadPanel
                          applicant={applicant}
                          uploadedBy={uploadedBy}
                          isAcknowledged={approvalAcknowledged}
                          onSaved={() => setMoaRefresh((n) => n + 1)}
                        />
                      </div>
                    )}
                    {isStaff && moa && (
                      <SignedMoaUploadPanel
                        applicant={applicant}
                        uploadedBy={uploadedBy}
                        readOnly
                      />
                    )}
                  </div>
                )}

                {isStaff && step === "prep" && (
                  <>
                    <PrePisEditor draft={draft} onChange={setDraft} />
                    <PrePisPreview
                      draft={draft}
                      applicationId={applicant.applicationId}
                      onPrint={() => downloadPrePisPdf(applicant.applicationId)}
                    />
                  </>
                )}

                {(step === "upload" || !isStaff) && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Pre-PIS is optional for LandBank. It may be prepared, printed, and
                      uploaded before or after MOA signing.
                    </p>
                    {isStaff ? (
                      <>
                        <SignedDocumentUpload
                          label="Signed Pre-PIS"
                          document={pendingPrePisFile ?? signedPrePis}
                          signedDate={prePisSignedDate}
                          onSignedDateChange={setPrePisSignedDate}
                          notes={prePisNotes}
                          onNotesChange={setPrePisNotes}
                          onUpload={(doc) => setPendingPrePisFile(doc)}
                          onRemove={() => {
                            if (!isStaff) return;
                            if (signedPrePis) removeSignedPrePis(applicant.id);
                            setPendingPrePisFile(null);
                          }}
                          uploadedBy={uploadedBy}
                          dateLabel="Pre-PIS signed date"
                          staffOnly
                        />
                        <button
                          type="button"
                          onClick={handleSaveSignedPrePis}
                          className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                          style={{ background: DOST_BLUE }}
                        >
                          Save signed Pre-PIS
                        </button>
                      </>
                    ) : signedPrePis ? (
                      <SignedDocumentUpload
                        label="Signed Pre-PIS"
                        document={signedPrePis}
                        signedDate={signedPrePis.prePisSignedDate}
                        onSignedDateChange={() => {}}
                        onUpload={() => {}}
                        onRemove={() => {}}
                        uploadedBy={signedPrePis.uploadedBy}
                        readOnly
                        dateLabel="Pre-PIS signed date"
                      />
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No signed Pre-PIS on file yet.
                      </p>
                    )}
                  </div>
                )}

                {isStaff && step === "complete" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Confirm the signed MOA is on file, then complete MOA signing to unlock
                      LandBank for the applicant. Signed Pre-PIS is optional and may be
                      uploaded before or after MOA signing.
                    </p>
                    {!moa && (
                      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Upload the signed MOA in the Overview step or Approval Letter module
                        before completing MOA signing.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleCompleteSigningDay}
                      disabled={!canComplete}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-40"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete MOA signing &amp; unlock LandBank
                    </button>
                  </div>
                )}

                {isStaff && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setStep(STAFF_STEP_IDS[Math.max(0, stepIndex - 1)])}
                      disabled={stepIndex === 0}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStep(
                          STAFF_STEP_IDS[Math.min(STAFF_STEP_IDS.length - 1, stepIndex + 1)],
                        )
                      }
                      disabled={stepIndex === STAFF_STEPS.length - 1}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="flex-1" />
                    {step === "prep" && (
                      <>
                        <button
                          type="button"
                          onClick={handleSync}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#0C2461]/30 text-[#0C2461] text-sm font-semibold"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Sync
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-semibold"
                        >
                          <Save className="w-4 h-4" />
                          Save draft
                        </button>
                      </>
                    )}
                  </div>
                )}

                {saveNotice && (
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    {saveNotice}
                  </p>
                )}
                {completeNotice && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    {completeNotice}
                  </p>
                )}
                {uploadErrors.length > 0 && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
                    {uploadErrors.map((e) => (
                      <p key={e}>• {e}</p>
                    ))}
                  </div>
                )}
                {uploadWarnings.length > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
                    {uploadWarnings.map((w) => (
                      <p key={w}>• {w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "ongoing" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Submit one Form 009 PIS per semester: <strong>1st Semester</strong>{" "}
                  (January–June) and <strong>2nd Semester</strong> (July–December).
                </p>
                {!signingComplete && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Pre-PIS signing day should be completed first; semester filings track
                    project progress during implementation.
                  </p>
                )}
                {isStaff && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startOngoingFiling}
                      className="px-4 py-2 rounded-lg bg-[#0C2461] text-white text-sm font-semibold"
                    >
                      New semester filing
                    </button>
                    {ongoingFilings.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => loadOngoingFiling(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          selectedFilingId === f.id
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {f.periodLabel}
                      </button>
                    ))}
                  </div>
                )}
                {ongoingErrors.length > 0 && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
                    {ongoingErrors.map((e) => (
                      <p key={e}>• {e}</p>
                    ))}
                  </div>
                )}
                {ongoingFiling && isStaff && (
                  <>
                    <PisOngoingEditor filing={ongoingFiling} onChange={setOngoingFiling} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveOngoing}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-semibold"
                      >
                        Save filing
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          printPisOngoingPdf(ongoingFiling.id, applicant.applicationId)
                        }
                        className="px-4 py-2 rounded-lg border border-[#0C2461] text-[#0C2461] text-sm font-semibold"
                      >
                        Print PDF
                      </button>
                    </div>
                    <PisOngoingPreview
                      filing={ongoingFiling}
                      applicationId={applicant.applicationId}
                    />
                  </>
                )}
                {!isStaff && ongoingFilings.length === 0 && (
                  <p className="text-sm text-gray-500">No semester PIS filings yet.</p>
                )}
                {!isStaff &&
                  ongoingFilings.map((f) => (
                    <PisOngoingPreview
                      key={f.id}
                      filing={f}
                      applicationId={applicant.applicationId}
                    />
                  ))}
              </div>
            )}
        </>
      )}
    </ModuleWorkflowLayout>
  );
}
