/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect, useRef } from "react";
import {
  Upload, FileText, CheckCircle, AlertCircle, X, Info,
  ClipboardCheck, Eye, UserCheck, ShieldCheck, RefreshCw,
  ChevronRight, Building, Banknote, ArrowRight, BadgeCheck,
  AlertTriangle, Pencil, Send, Clock,
} from "lucide-react";
import { applicantStore, Applicant } from "../store/applicantStore";
import { AuthUser, authStore } from "../store/authStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { StaffApplicantPicker, StaffApplicantBanner } from "./StaffApplicantPicker";
import { moduleStepPillClass } from "./moduleTheme";
import { formatFormMention } from "../constants/setupForms";
import { appendStaffAssessment } from "../utils/clientAssessment";
import { notifyRequirementsSubmitted, notifyRequirementsDecision } from "../utils/notificationHelpers";
import { allowWhenDemo, isDemoModeActive } from "../utils/demoMode";
import {
  buildRequirementUploadList,
  countRequiredUploads,
  persistRequirementUploads,
  type StoredRequirementUpload,
} from "../utils/submissionRequirements";
import {
  getProprietorTrackLabel,
  isNonSingleProprietor,
} from "../utils/proprietorTrack";
import { readFileAsModuleDocument } from "../utils/readFileAsDataUrl";
import { SubmittedFileActions } from "./SubmittedFileActions";

interface SubmissionRequirementsProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

interface DocumentUpload extends StoredRequirementUpload {
  file?: File;
}

type StepId =
  | "documents"
  | "staff-review"
  | "changes-requested"
  | "routing";

// ── Style helpers ─────────────────────────────────────────────────────────────
const DOST_BLUE = "#0C2461";
const DOST_MID  = "#1a3a7a";
const DOST_LIGHT = "#00AEEF";

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

const STEPS: { id: StepId; label: string; icon: React.ReactNode }[] = [
  { id: "documents",        label: "Submit Documents",   icon: <Upload className="w-4 h-4" /> },
  { id: "staff-review",     label: "Staff Verification", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "changes-requested",label: "Revision",           icon: <Pencil className="w-4 h-4" /> },
  { id: "routing",          label: "Routing",            icon: <ArrowRight className="w-4 h-4" /> },
];

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="w-full border border-gray-100 bg-blue-50/50 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 font-medium min-h-[40px]">
        {value || <span className="text-gray-300 font-normal">—</span>}
      </div>
    </div>
  );
}

function StepHeader({
  current,
  steps,
  maxReached,
  onStepClick,
}: {
  current: StepId;
  steps: typeof STEPS;
  maxReached: number;
  onStepClick?: (id: StepId) => void;
}) {
  const currentIdx = steps.findIndex(s => s.id === current);
  const demoMode = isDemoModeActive();
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {steps.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const locked = i > maxReached;
        const clickable = !!onStepClick && (!locked || demoMode);
        const pill = (
          <div className={moduleStepPillClass({ active, done, locked })}>
            {done ? <CheckCircle className="w-3.5 h-3.5 text-green-300" /> : s.icon}
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
        );
        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick(s.id)}
                className="border-0 bg-transparent p-0 cursor-pointer"
              >
                {pill}
              </button>
            ) : (
              pill
            )}
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-white/25 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function SubmissionRequirements({ user, onSubmitSuccess }: SubmissionRequirementsProps = {}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const showStaffSteps = isStaff || isDemoModeActive();
  const [step, setStep]         = useState<StepId>("documents");
  const [maxReached, setMaxReached] = useState(0);
  const [awaitingStaffReview, setAwaitingStaffReview] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Routing decision (staff — after TNA, before project proposal)
  const [routingDecision, setRoutingDecision] = useState<"conduct-rtec" | "mpex" | null>(null);
  const [routeToMpex, setRouteToMpex] = useState(false);

  const [documents, setDocuments] = useState<DocumentUpload[]>([]);

  // Staff remarks per document
  const [staffRemarks, setStaffRemarks] = useState<Record<string, { status: "ok" | "flagged" | ""; remark: string }>>({});
  const [staffNotes, setStaffNotes]     = useState("");
  const [staffDecision, setStaffDecision] = useState<"approved" | "needs-revision" | "">("");
  const [staffName, setStaffName]       = useState("");

  // Client revision state
  const [revisionNotes, setRevisionNotes] = useState("");

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Auto-load applicant from store
  useEffect(() => {
    if (applicant?.moduleData?.documentsSubmitted && !isStaff) {
      setAwaitingStaffReview(true);
    }
    if (applicant?.moduleData?.staffDecision === "needs-revision") {
      setStep("changes-requested");
    } else if (isStaff && applicant?.moduleData?.documentsSubmitted) {
      setStep("staff-review");
    }
    if (applicant) {
      setDocuments(buildRequirementUploadList(applicant));
    }
    if (applicant?.moduleData?.routingDecision === "mpex") {
      setRouteToMpex(true);
    }

    const init: Record<string, { status: "ok" | "flagged" | ""; remark: string }> = {};
    (applicant ? buildRequirementUploadList(applicant) : []).forEach(d => { init[d.id] = { status: "", remark: "" }; });
    setStaffRemarks(init);
  }, [applicant?.id, isStaff]);

  const advanceStep = (next: StepId) => {
    const idx = STEPS.findIndex(s => s.id === next);
    setMaxReached(m => Math.max(m, idx));
    setStep(next);
  };

  // ── Document helpers ───────────────────────────────────────────────────────
  const uploadDoc = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !applicant) return;
    try {
      const moduleDoc = await readFileAsModuleDocument(
        file,
        applicant.emailAddress || applicant.applicantName,
      );
      setDocuments((docs) => {
        const next = docs.map((d) =>
          d.id === id
            ? {
                ...d,
                uploaded: true,
                file,
                fileName: moduleDoc.fileName,
                mimeType: moduleDoc.mimeType,
                dataUrl: moduleDoc.dataUrl,
                fileSizeBytes: file.size,
                uploadedAt: moduleDoc.uploadedAt,
              }
            : d,
        );
        persistRequirementUploads(applicant.id, next, applicantStore);
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
      if (fileRefs.current[id]) fileRefs.current[id]!.value = "";
    }
  };
  const removeDoc = (id: string) => {
    setDocuments((docs) => {
      const next = docs.map((d) =>
        d.id === id
          ? {
              ...d,
              uploaded: false,
              file: undefined,
              fileName: undefined,
              mimeType: undefined,
              dataUrl: undefined,
              fileSizeBytes: undefined,
              uploadedAt: undefined,
            }
          : d,
      );
      if (applicant) persistRequirementUploads(applicant.id, next, applicantStore);
      return next;
    });
    if (fileRefs.current[id]) fileRefs.current[id]!.value = "";
  };

  const { required: requiredCount, uploaded: uploadedReq } = countRequiredUploads(documents);
  const pct            = requiredCount ? Math.round((uploadedReq / requiredCount) * 100) : 0;
  const allRequiredUp  = uploadedReq === requiredCount && requiredCount > 0;

  // Staff flagged docs
  const flaggedDocs = Object.entries(staffRemarks).filter(([, v]) => v.status === "flagged");
  const allStaffMarked = documents.filter(d => d.uploaded).every(d => staffRemarks[d.id]?.status !== "");
  const staffDecisionReady = allStaffMarked && staffDecision !== "" && staffName.trim().length > 2;

  const handleApplicantSubmit = () => {
    if (!applicant) return;
    persistRequirementUploads(applicant.id, documents, applicantStore);
    applicantStore.update(applicant.id, {
      moduleData: {
        ...applicant.moduleData,
        documentsSubmitted: true,
        documentsSubmittedList: documents.filter(d => d.uploaded).map(d => d.name),
        requirementUploads: documents,
        requirementsSubmittedAt: new Date().toISOString(),
      },
    });
    setAwaitingStaffReview(true);
    notifyRequirementsSubmitted(applicant);
  };

  const recordRequirementsAssessment = (decision: string, remarks?: string) => {
    if (!applicant || !user) return;
    applicantStore.update(applicant.id, {
      ...appendStaffAssessment(applicant, {
        stage: "requirements",
        decision,
        assessedBy: user.email,
        assessedAt: new Date().toISOString(),
        remarks,
      }),
    });
  };

  // Final submit — persist routing and advance applicant to the next module
  const handleFinalSubmit = () => {
    if (!applicant) return;
    const decision = routeToMpex ? "mpex" : "conduct-rtec";
    const nextModule =
      decision === "mpex"
        ? ("requirements" as const)
        : ("conduct-rtec" as const);
    applicantStore.update(applicant.id, {
      currentModule: nextModule,
      moduleData: {
        ...applicant.moduleData,
        documentsSubmitted: documents.filter((d) => d.uploaded).map((d) => d.name),
        requirementUploads: documents,
        staffVerifiedBy: staffName,
        staffDecision,
        routingDecision: decision,
        requirementsSubmittedAt: new Date().toISOString(),
      },
    });
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* ── HEADER ── */}
        <div className="p-6 text-white" style={{ background: `linear-gradient(135deg,${DOST_BLUE},${DOST_MID})` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-blue-800 font-black text-sm">ai</span>
            </div>
            <div>
              <h1 className="text-xl font-black">Submission of Requirements</h1>
              <p className="text-white/60 text-sm">Step 4 — Documentary Submission & Verification</p>
            </div>
          </div>
          <StepHeader
            current={step}
            steps={
              showStaffSteps
                ? STEPS
                : STEPS.filter(
                    (s) => s.id === "documents" || s.id === "changes-requested",
                  )
            }
            maxReached={maxReached}
            onStepClick={
              showStaffSteps ? (id) => setStep(id as StepId) : undefined
            }
          />
          {isStaff && (
            <StaffApplicantPicker
              user={user}
              label="Review applicant requirements"
              className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20"
            />
          )}
        </div>
        <StaffApplicantBanner user={user} />

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1 — DOCUMENT SUBMISSION
        ══════════════════════════════════════════════════════════════════ */}
        {step === "documents" && (
          <div className="p-6 space-y-6">

            {awaitingStaffReview && !isStaff && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-0.5">Submitted — Awaiting DOST Review</p>
                  <p>Your requirements have been submitted. Your provincial DOST office will verify your documents and notify you if revisions are needed.</p>
                </div>
              </div>
            )}

            {/* Auto-fill notice */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-0.5">Applicant Information — Auto-filled</p>
                <p className="text-blue-600">Fields below are pulled from your Pre-Screening and Registration data. No re-entry required.</p>
              </div>
            </div>

            {applicant && isNonSingleProprietor(applicant) && (
              <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-xl p-4">
                <Building className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-sm text-sky-900">
                  <p className="font-semibold mb-0.5">{getProprietorTrackLabel(applicant)} checklist</p>
                  <p>
                    Based on your SEC/CDA registration, Board Resolution and Articles of
                    Incorporation are required in addition to the single proprietor documents.
                  </p>
                </div>
              </div>
            )}

            {/* Auto-filled applicant info */}
            {applicant ? (
              <div>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-500" /> Applicant Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadonlyField label="Enterprise Name"  value={applicant.enterpriseName} />
                  <ReadonlyField label="Applicant Name"   value={applicant.applicantName} />
                  <ReadonlyField label="Contact Number"   value={applicant.contactNumber} />
                  <ReadonlyField label="Email Address"    value={applicant.emailAddress} />
                  <ReadonlyField label="Region"           value={applicant.region} />
                  <ReadonlyField label="Application ID"   value={applicant.applicationId} />
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                No applicant data found. Please complete Pre-Screening first.
              </div>
            )}

            {/* Guidelines */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Document Submission Guidelines</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-600">
                  <li>All documents marked with asterisk (*) are required</li>
                  <li>Accepted file formats: PDF, JPG, PNG (Max 10MB per file)</li>
                  <li>Ensure all documents are clear and readable</li>
                  <li>Documents should be up-to-date and certified when applicable</li>
                </ul>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-gray-800">Upload Progress</h3>
                <span className="text-sm font-bold text-gray-600">{uploadedReq} / {requiredCount} Required</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${DOST_LIGHT},${DOST_BLUE})` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{pct}% Complete</p>
            </div>

            {/* Required Documents */}
            <div>
              <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Required Documents</h2>
              <div className="space-y-3">
                {documents.filter(d => d.required).map(doc => (
                  <div key={doc.id} className={`border rounded-xl p-4 transition-all ${doc.uploaded ? "border-green-200 bg-green-50/40" : "border-gray-200 hover:border-blue-200"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {doc.uploaded
                          ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          : <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800">{doc.name} *</p>
                          {doc.uploaded && doc.file && (
                            <p className="text-xs text-gray-400 truncate">{doc.file.name} · {(doc.file.size / 1024).toFixed(1)} KB</p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {doc.uploaded ? (
                          <button onClick={() => removeDoc(doc.id)} className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <X className="w-3 h-3" /> Remove
                          </button>
                        ) : (
                          <label className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-90 transition-all" style={{ background: DOST_BLUE }}>
                            <Upload className="w-3 h-3" /> Upload
                            <input ref={el => fileRefs.current[doc.id] = el} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDoc(doc.id, e)} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Documents */}
            <div>
              <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Optional Documents</h2>
              <div className="space-y-3">
                {documents.filter(d => !d.required).map(doc => (
                  <div key={doc.id} className={`border rounded-xl p-4 transition-all ${doc.uploaded ? "border-blue-200 bg-blue-50/30" : "border-gray-100 hover:border-gray-200"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {doc.uploaded
                          ? <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          : <Upload className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-700">{doc.name}</p>
                          {doc.uploaded && doc.file && (
                            <p className="text-xs text-gray-400 truncate">{doc.file.name} · {(doc.file.size / 1024).toFixed(1)} KB</p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {doc.uploaded ? (
                          <button onClick={() => removeDoc(doc.id)} className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <X className="w-3 h-3" /> Remove
                          </button>
                        ) : (
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <Upload className="w-3 h-3" /> Upload
                            <input ref={el => fileRefs.current[doc.id] = el} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDoc(doc.id, e)} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className={labelCls}>Additional Notes</label>
              <textarea rows={3} className={inputCls} placeholder="Any additional information or notes regarding your submission" value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} />
            </div>

            {/* Declaration */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border-l-4 cursor-pointer transition-all ${declarationChecked ? "bg-amber-50 border-amber-400" : "bg-amber-50/50 border-amber-300"}`}>
              <input type="checkbox" checked={declarationChecked} onChange={e => setDeclarationChecked(e.target.checked)} className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Declaration:</strong> I hereby certify that all documents submitted are authentic and accurate. I understand that providing false information may result in disqualification.
              </p>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => { setDraftSaved(true); setTimeout(() => setDraftSaved(false), 2000); }}
                className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm"
              >
                {draftSaved ? "✓ Saved!" : "Save Draft"}
              </button>
              <button
                onClick={() => {
                  if (isStaff) advanceStep("staff-review");
                  else handleApplicantSubmit();
                }}
                disabled={!allowWhenDemo(allRequiredUp && declarationChecked && (!awaitingStaffReview || isStaff))}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: "#059669" }}
              >
                <Send className="w-4 h-4" />{" "}
                {isStaff ? "Continue to Staff Review" : awaitingStaffReview ? "Submitted" : "Submit All Requirements"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2 — STAFF VERIFICATION
        ══════════════════════════════════════════════════════════════════ */}
        {step === "staff-review" && isStaff && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <ShieldCheck className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-800">
                <p className="font-semibold mb-0.5">Provincial Staff Verification Module</p>
                <p>Review all submitted documents and applicant information. Mark each document as verified (OK) or flag for revision. Add remarks where needed before making a final decision.</p>
              </div>
            </div>

            {/* Applicant summary for staff */}
            {applicant && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-500" /> Applicant Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    ["Enterprise", applicant.enterpriseName],
                    ["Applicant", applicant.applicantName],
                    ["Contact", applicant.contactNumber],
                    ["Email", applicant.emailAddress],
                    ["MSME Size", applicant.msmeSize],
                    ["Region", applicant.region],
                    ["Business Type", applicant.businessType],
                    ["Sector", applicant.businessSector],
                    ["App ID", applicant.applicationId],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-white border border-gray-100 rounded-lg p-2.5">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">{k}</p>
                      <p className="text-gray-800 font-medium mt-0.5 truncate">{v || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document verification table */}
            <div>
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">
                Document Review ({documents.filter(d => d.uploaded).length} submitted)
              </h3>
              <div className="space-y-3">
                {documents.filter(d => d.uploaded).map(doc => {
                  const sr = staffRemarks[doc.id] ?? { status: "", remark: "" };
                  return (
                    <div key={doc.id} className={`border rounded-xl p-4 transition-all ${sr.status === "ok" ? "border-green-200 bg-green-50/30" : sr.status === "flagged" ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800">
                            {doc.name} {doc.required && <span className="text-red-400">*</span>}
                          </p>
                          {doc.uploaded && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {doc.fileName}
                              {doc.fileSizeBytes
                                ? ` · ${(doc.fileSizeBytes / 1024).toFixed(1)} KB`
                                : doc.file
                                  ? ` · ${(doc.file.size / 1024).toFixed(1)} KB`
                                  : ""}
                            </p>
                          )}
                          {doc.uploaded && (doc.dataUrl || doc.fileName) && (
                            <div className="mt-2">
                              <SubmittedFileActions
                                fileName={doc.fileName ?? "document"}
                                mimeType={doc.mimeType}
                                dataUrl={doc.dataUrl}
                                compact
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setStaffRemarks(r => ({ ...r, [doc.id]: { ...r[doc.id], status: "ok" } }))}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${sr.status === "ok" ? "bg-green-600 text-white border-green-600" : "text-green-700 border-green-300 hover:bg-green-50"}`}
                          >
                            <CheckCircle className="w-3 h-3" /> OK
                          </button>
                          <button
                            onClick={() => setStaffRemarks(r => ({ ...r, [doc.id]: { ...r[doc.id], status: "flagged" } }))}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${sr.status === "flagged" ? "bg-red-500 text-white border-red-500" : "text-red-600 border-red-300 hover:bg-red-50"}`}
                          >
                            <AlertCircle className="w-3 h-3" /> Flag
                          </button>
                        </div>
                      </div>
                      {sr.status === "flagged" && (
                        <div className="mt-3">
                          <input
                            type="text"
                            className={inputCls + " text-xs"}
                            placeholder="Enter reason for flagging this document..."
                            value={sr.remark}
                            onChange={e => setStaffRemarks(r => ({ ...r, [doc.id]: { ...r[doc.id], remark: e.target.value } }))}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Staff overall notes */}
            <div>
              <label className={labelCls}>Staff Verification Notes</label>
              <textarea rows={3} className={inputCls} placeholder="Overall findings, recommendations, or observations..." value={staffNotes} onChange={e => setStaffNotes(e.target.value)} />
            </div>

            {/* Staff decision */}
            <div>
              <label className={labelCls}>Verification Decision *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${staffDecision === "approved" ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-200"}`}>
                  <input type="radio" name="staffDecision" value="approved" checked={staffDecision === "approved"} onChange={() => setStaffDecision("approved")} className="w-4 h-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-bold text-sm text-gray-800">✓ Approve Submission</p>
                    <p className="text-xs text-gray-500 mt-0.5">All documents are complete and verified. Proceed to application routing.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${staffDecision === "needs-revision" ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-red-200"}`}>
                  <input type="radio" name="staffDecision" value="needs-revision" checked={staffDecision === "needs-revision"} onChange={() => setStaffDecision("needs-revision")} className="w-4 h-4 mt-0.5 text-red-500" />
                  <div>
                    <p className="font-bold text-sm text-gray-800">⚠ Request Revisions</p>
                    <p className="text-xs text-gray-500 mt-0.5">Some documents need correction or replacement before proceeding.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Staff name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Verifying Staff Name *</label>
                <input type="text" className={inputCls} placeholder="e.g. Maria Santos" value={staffName} onChange={e => setStaffName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Date of Verification</label>
                <input type="date" className={inputCls} defaultValue={new Date().toISOString().split("T")[0]} readOnly />
              </div>
            </div>

            {/* Flagged summary */}
            {flaggedDocs.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1.5">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {flaggedDocs.length} Document(s) Flagged for Revision
                </p>
                {flaggedDocs.map(([id, v]) => {
                  const doc = documents.find(d => d.id === id);
                  return (
                    <div key={id} className="flex gap-2 text-xs text-red-700">
                      <span className="text-red-400">•</span>
                      <span><strong>{doc?.name}</strong>{v.remark ? ` — ${v.remark}` : ""}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => advanceStep("documents")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
              <button
                onClick={() => {
                  recordRequirementsAssessment(
                    staffDecision,
                    staffNotes || undefined,
                  );
                  notifyRequirementsDecision(
                    applicant!,
                    staffDecision === "approved" ? "approved" : "needs-revision",
                  );
                  if (staffDecision === "approved") {
                    applicantStore.update(applicant!.id, {
                      moduleData: {
                        ...applicant!.moduleData,
                        staffVerifiedBy: staffName,
                        staffDecision: "approved",
                        requirementsApprovedAt: new Date().toISOString(),
                      },
                    });
                  }
                  advanceStep(staffDecision === "approved" ? "routing" : "changes-requested");
                }}
                disabled={!allowWhenDemo(staffDecisionReady)}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: staffDecision === "approved" ? "#059669" : "#dc2626" }}
              >
                {staffDecision === "approved" ? "Approve & Proceed to Routing →" : staffDecision === "needs-revision" ? "Send for Revision →" : "Submit Decision →"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3 — CHANGES REQUESTED (client revision)
        ══════════════════════════════════════════════════════════════════ */}
        {step === "changes-requested" && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <RefreshCw className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-0.5">Revisions Requested by Provincial Staff</p>
                <p>The verifying staff has identified issues with your submission. Please review the remarks below, re-upload the flagged documents, and resubmit.</p>
              </div>
            </div>

            {/* Flagged items for client */}
            <div>
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">
                Documents Requiring Correction
              </h3>
              <div className="space-y-3">
                {flaggedDocs.length > 0 ? flaggedDocs.map(([id, sr]) => {
                  const doc = documents.find(d => d.id === id);
                  if (!doc) return null;
                  return (
                    <div key={id} className="border-2 border-red-200 bg-red-50/40 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-gray-800">{doc.name}</p>
                            {sr.remark && <p className="text-xs text-red-600 mt-1 bg-red-50 border border-red-100 rounded px-2 py-1">Staff Note: {sr.remark}</p>}
                          </div>
                        </div>
                        {doc.uploaded && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Re-uploaded</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {doc.uploaded ? (
                          <button onClick={() => removeDoc(doc.id)} className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1.5">
                            <X className="w-3 h-3" /> Remove
                          </button>
                        ) : (
                          <label className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-90" style={{ background: DOST_BLUE }}>
                            <Upload className="w-3 h-3" /> Re-upload Document
                            <input ref={el => fileRefs.current[doc.id] = el} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDoc(doc.id, e)} />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" /> No specific documents flagged. Please check staff notes below.
                  </div>
                )}
              </div>
            </div>

            {/* Staff notes */}
            {staffNotes && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Staff Verification Notes</p>
                <p className="text-sm text-gray-700">{staffNotes}</p>
                <p className="text-xs text-gray-400 mt-2">— {staffName}</p>
              </div>
            )}

            {/* Client revision notes */}
            <div>
              <label className={labelCls}>Your Response / Revision Notes</label>
              <textarea rows={3} className={inputCls} placeholder="Describe the changes you made or any clarifications..." value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => advanceStep("staff-review")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back to Review</button>
              <button
                onClick={() => advanceStep("staff-review")}
                disabled={flaggedDocs.some(([id]) => !documents.find(d => d.id === id)?.uploaded)}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}
              >
                Resubmit for Verification →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 4 — ROUTING DECISION (post-TNA document review)
        ══════════════════════════════════════════════════════════════════ */}
        {step === "routing" && isStaff && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-0.5">Application Routing</p>
                <p>
                  TNA is complete and supporting documents are verified. Route the enterprise to{" "}
                  {formatFormMention("001", "both")} or to the MPEX capacity-building track.
                  Formal {formatFormMention("002")} evaluation occurs after the project proposal is submitted.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${!routeToMpex ? "border-green-400 bg-green-50 shadow-md" : "border-gray-200 bg-gray-50"}`}>
                <input
                  type="radio"
                  name="routeTrack"
                  className="sr-only"
                  checked={!routeToMpex}
                  onChange={() => setRouteToMpex(false)}
                />
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!routeToMpex ? "bg-green-500" : "bg-gray-300"}`}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-gray-800">{formatFormMention("002")}</p>
                    <p className="text-xs text-gray-500">Module 8</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Proceed to {formatFormMention("002")} evaluation. Requirements and {formatFormMention("001")} are on file.
                </p>
              </label>

              <label className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${routeToMpex ? "border-orange-400 bg-orange-50 shadow-md" : "border-gray-200 bg-gray-50"}`}>
                <input
                  type="radio"
                  name="routeTrack"
                  className="sr-only"
                  checked={routeToMpex}
                  onChange={() => setRouteToMpex(true)}
                />
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${routeToMpex ? "bg-orange-500" : "bg-gray-300"}`}>
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-gray-800">MPEX Pre-requisite</p>
                    <p className="text-xs text-gray-500">Capacity building track</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Enterprise requires MPEX training before re-applying for SETUP assistance.
                </p>
              </label>
            </div>

            <button
              onClick={() => {
                setRoutingDecision(routeToMpex ? "mpex" : "conduct-rtec");
                handleFinalSubmit();
                onSubmitSuccess?.();
              }}
              className="w-full py-4 rounded-xl text-white font-black text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: routeToMpex ? "#d97706" : "#059669" }}
            >
              {routeToMpex
                ? <><ArrowRight className="w-5 h-5" /> Confirm & Route to MPEX</>
                : <><CheckCircle className="w-5 h-5" /> Confirm & Proceed to RTEC Evaluation</>}
            </button>

            <button onClick={() => advanceStep("staff-review")} className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to Staff Verification
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
