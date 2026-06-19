import { useState, useEffect, useRef } from "react";
import {
  Upload, FileText, CheckCircle, AlertCircle, X, Info,
  ClipboardCheck, Eye, UserCheck, ShieldCheck, RefreshCw,
  ChevronRight, Building, Banknote, ArrowRight, BadgeCheck,
  AlertTriangle, Pencil, Send,
} from "lucide-react";
import { applicantStore, Applicant } from "../store/applicantStore";
import { AuthUser } from "../store/authStore";
import { resolveApplicantForUser } from "../utils/resolveApplicant";

interface SubmissionRequirementsProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

interface DocumentUpload {
  id: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  file?: File;
  remarks?: string;
  staffVerified?: "ok" | "flagged" | null;
  staffRemark?: string;
}

type StepId =
  | "documents"
  | "staff-review"
  | "changes-requested"
  | "rtec"
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
  { id: "rtec",             label: "RTEC Report",        icon: <ClipboardCheck className="w-4 h-4" /> },
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

function StepHeader({ current, steps, maxReached }: { current: StepId; steps: typeof STEPS; maxReached: number }) {
  const currentIdx = steps.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {steps.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const locked = i > maxReached;
        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              active ? "bg-white text-blue-900 shadow-sm"
              : done  ? "bg-white/20 text-white"
              : locked ? "bg-white/5 text-white/30"
              : "bg-white/10 text-white/50"
            }`}>
              {done ? <CheckCircle className="w-3.5 h-3.5 text-green-300" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-white/25 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function SubmissionRequirements({ user, onSubmitSuccess }: SubmissionRequirementsProps = {}) {
  const [step, setStep]         = useState<StepId>("documents");
  const [maxReached, setMaxReached] = useState(0);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // RTEC state
  const [rtec, setRtec] = useState({
    evaluatorName: "",
    evaluationDate: new Date().toISOString().split("T")[0],
    overallScore: "",
    technicalScore: "",
    financialScore: "",
    marketScore: "",
    managementScore: "",
    findings: "",
    recommendations: "",
    rtecQualified: null as boolean | null,
  });

  // Routing decision
  const [routingDecision, setRoutingDecision] = useState<"project-proposal" | "mpex" | null>(null);

  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { id: "dti",      name: "DTI/SEC/CDA Registration Certificate", required: true,  uploaded: false },
    { id: "permit",   name: "Business Permit",                       required: true,  uploaded: false },
    { id: "tin",      name: "TIN Certificate",                       required: true,  uploaded: false },
    { id: "mayor",    name: "Mayor's Permit",                        required: true,  uploaded: false },
    { id: "proposal", name: "Project Proposal",                      required: true,  uploaded: false },
    { id: "financial",name: "Financial Statements (Latest)",          required: true,  uploaded: false },
    { id: "profile",  name: "Company Profile",                       required: true,  uploaded: false },
    { id: "catalog",  name: "Product/Service Catalog",               required: false, uploaded: false },
    { id: "market",   name: "Market Study/Analysis",                 required: false, uploaded: false },
    { id: "drawings", name: "Technical Drawings/Specifications",     required: false, uploaded: false },
    { id: "certif",   name: "Quality Certifications (if any)",       required: false, uploaded: false },
    { id: "endorsement", name: "Letter of Endorsement (if any)",     required: false, uploaded: false },
  ]);

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
    setApplicant(resolveApplicantForUser(user));

    const init: Record<string, { status: "ok" | "flagged" | ""; remark: string }> = {};
    documents.forEach(d => { init[d.id] = { status: "", remark: "" }; });
    setStaffRemarks(init);
  }, [user?.id, user?.email, user?.role]);

  const advanceStep = (next: StepId) => {
    const idx = STEPS.findIndex(s => s.id === next);
    setMaxReached(m => Math.max(m, idx));
    setStep(next);
  };

  // ── Document helpers ───────────────────────────────────────────────────────
  const uploadDoc = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, uploaded: true, file } : d));
  };
  const removeDoc = (id: string) => {
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, uploaded: false, file: undefined } : d));
    if (fileRefs.current[id]) fileRefs.current[id]!.value = "";
  };

  const requiredDocs   = documents.filter(d => d.required);
  const uploadedReq    = requiredDocs.filter(d => d.uploaded).length;
  const pct            = Math.round((uploadedReq / requiredDocs.length) * 100);
  const allRequiredUp  = uploadedReq === requiredDocs.length;

  // Staff flagged docs
  const flaggedDocs = Object.entries(staffRemarks).filter(([, v]) => v.status === "flagged");
  const allStaffMarked = documents.filter(d => d.uploaded).every(d => staffRemarks[d.id]?.status !== "");
  const staffDecisionReady = allStaffMarked && staffDecision !== "" && staffName.trim().length > 2;

  // RTEC score
  const rtecReady =
    rtec.evaluatorName && rtec.evaluationDate && rtec.overallScore &&
    rtec.findings && rtec.recommendations && rtec.rtecQualified !== null;

  // Final submit
  const handleFinalSubmit = () => {
    if (!applicant) return;
    applicantStore.update(applicant.id, {
      currentModule: "requirements",
      moduleData: {
        ...applicant.moduleData,
        documentsSubmitted: documents.filter(d => d.uploaded).map(d => d.name),
        staffVerifiedBy: staffName,
        staffDecision,
        rtecScore: rtec.overallScore,
        rtecQualified: rtec.rtecQualified,
        routingDecision,
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
          <StepHeader current={step} steps={STEPS} maxReached={maxReached} />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1 — DOCUMENT SUBMISSION
        ══════════════════════════════════════════════════════════════════ */}
        {step === "documents" && (
          <div className="p-6 space-y-6">

            {/* Auto-fill notice */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-0.5">Applicant Information — Auto-filled</p>
                <p className="text-blue-600">Fields below are pulled from your Pre-Screening and Registration data. No re-entry required.</p>
              </div>
            </div>

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
                <span className="text-sm font-bold text-gray-600">{uploadedReq} / {requiredDocs.length} Required</span>
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
                onClick={() => advanceStep("staff-review")}
                disabled={!allRequiredUp || !declarationChecked}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: "#059669" }}
              >
                <Send className="w-4 h-4" /> Submit All Requirements
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2 — STAFF VERIFICATION
        ══════════════════════════════════════════════════════════════════ */}
        {step === "staff-review" && (
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
                          {doc.file && <p className="text-xs text-gray-400 mt-0.5">{doc.file.name} · {(doc.file.size / 1024).toFixed(1)} KB</p>}
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
                    <p className="text-xs text-gray-500 mt-0.5">All documents are complete and verified. Proceed to RTEC evaluation.</p>
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
                onClick={() => advanceStep(staffDecision === "approved" ? "rtec" : "changes-requested")}
                disabled={!staffDecisionReady}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: staffDecision === "approved" ? "#059669" : "#dc2626" }}
              >
                {staffDecision === "approved" ? "Approve & Proceed to RTEC →" : staffDecision === "needs-revision" ? "Send for Revision →" : "Submit Decision →"}
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
            STEP 4 — RTEC GENERATION REPORT
        ══════════════════════════════════════════════════════════════════ */}
        {step === "rtec" && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <ClipboardCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-0.5">RTEC Evaluation Report Generation</p>
                <p>The Regional Technology Expert Committee (RTEC) evaluates the applicant's technology readiness, financial capacity, and market viability. Complete the assessment scores and findings below.</p>
              </div>
            </div>

            {/* Applicant info for evaluator */}
            {applicant && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  ["Enterprise",  applicant.enterpriseName],
                  ["Applicant",   applicant.applicantName],
                  ["MSME Size",   applicant.msmeSize],
                  ["Application", applicant.applicationId],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">{k}</p>
                    <p className="text-gray-800 font-semibold mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Evaluator info */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" /> Evaluator Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>RTEC Evaluator Name *</label>
                  <input type="text" className={inputCls} placeholder="Full name of evaluator" value={rtec.evaluatorName} onChange={e => setRtec(r => ({ ...r, evaluatorName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Evaluation Date *</label>
                  <input type="date" className={inputCls} value={rtec.evaluationDate} onChange={e => setRtec(r => ({ ...r, evaluationDate: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Scoring */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-blue-500" /> Assessment Scores (0–100)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: "technicalScore",   label: "Technical Readiness" },
                  { key: "financialScore",   label: "Financial Capacity" },
                  { key: "marketScore",      label: "Market Viability" },
                  { key: "managementScore",  label: "Management Capability" },
                ].map(f => {
                  const val = parseInt(rtec[f.key as keyof typeof rtec] as string) || 0;
                  const color = val >= 75 ? "text-green-600" : val >= 50 ? "text-amber-600" : "text-red-500";
                  return (
                    <div key={f.key}>
                      <label className={labelCls}>{f.label}</label>
                      <input
                        type="number" min="0" max="100"
                        className={`${inputCls} font-bold text-center text-lg ${color}`}
                        placeholder="0"
                        value={rtec[f.key as keyof typeof rtec] as string}
                        onChange={e => {
                          const scores = { ...rtec, [f.key]: e.target.value };
                          const vals = [scores.technicalScore, scores.financialScore, scores.marketScore, scores.managementScore].map(Number).filter(Boolean);
                          const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / 4) : 0;
                          setRtec({ ...scores, overallScore: String(avg) });
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Overall score computed */}
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Overall Average Score</p>
                  <p className="text-xs text-gray-400 mt-0.5">Auto-computed from the four criteria above</p>
                </div>
                <div className={`text-4xl font-black ${parseInt(rtec.overallScore) >= 75 ? "text-green-600" : parseInt(rtec.overallScore) >= 50 ? "text-amber-500" : "text-red-500"}`}>
                  {rtec.overallScore || "—"}
                  <span className="text-base font-normal text-gray-400"> / 100</span>
                </div>
              </div>
            </div>

            {/* Findings & Recommendations */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> Report Narrative
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Findings *</label>
                  <textarea rows={4} className={inputCls} placeholder="Summarize the findings from the RTEC evaluation. Include observed technology gaps, existing capabilities, and notable factors." value={rtec.findings} onChange={e => setRtec(r => ({ ...r, findings: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Recommendations *</label>
                  <textarea rows={4} className={inputCls} placeholder="Provide specific recommendations for the applicant. Mention priority technology interventions, training needs, or areas requiring attention." value={rtec.recommendations} onChange={e => setRtec(r => ({ ...r, recommendations: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* RTEC qualification decision */}
            <div>
              <label className={labelCls}>RTEC Qualification Decision *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${rtec.rtecQualified === true ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-200"}`}>
                  <input type="radio" name="rtecQual" checked={rtec.rtecQualified === true} onChange={() => setRtec(r => ({ ...r, rtecQualified: true }))} className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-gray-800 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Qualified</p>
                    <p className="text-xs text-gray-500 mt-0.5">Enterprise meets RTEC criteria. Proceed to Project Proposal stage.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${rtec.rtecQualified === false ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-200"}`}>
                  <input type="radio" name="rtecQual" checked={rtec.rtecQualified === false} onChange={() => setRtec(r => ({ ...r, rtecQualified: false }))} className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-gray-800 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-orange-500" /> Not Yet Qualified</p>
                    <p className="text-xs text-gray-500 mt-0.5">Enterprise needs capacity building. Route to MPEX Pre-requisite.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => advanceStep("staff-review")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
              <button
                onClick={() => {
                  setRoutingDecision(rtec.rtecQualified ? "project-proposal" : "mpex");
                  advanceStep("routing");
                }}
                disabled={!rtecReady}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}
              >
                Generate RTEC Report & Route →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 5 — ROUTING DECISION
        ══════════════════════════════════════════════════════════════════ */}
        {step === "routing" && (
          <div className="p-6 space-y-6">

            {/* RTEC report summary */}
            <div className={`rounded-2xl p-6 border-2 ${rtec.rtecQualified ? "bg-green-50 border-green-400" : "bg-orange-50 border-orange-400"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0 ${rtec.rtecQualified ? "bg-green-500" : "bg-orange-500"}`}>
                  {rtec.rtecQualified ? "✓" : "!"}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-black ${rtec.rtecQualified ? "text-green-800" : "text-orange-800"}`}>
                    RTEC Result: {rtec.rtecQualified ? "Qualified" : "Not Yet Qualified"}
                  </h3>
                  <p className={`text-sm mt-0.5 ${rtec.rtecQualified ? "text-green-600" : "text-orange-600"}`}>
                    {rtec.rtecQualified
                      ? `${applicant?.enterpriseName} has passed the RTEC evaluation with an overall score of ${rtec.overallScore}/100.`
                      : `${applicant?.enterpriseName} requires capacity building before proceeding. Score: ${rtec.overallScore}/100.`}
                  </p>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  ["Technical",   rtec.technicalScore],
                  ["Financial",   rtec.financialScore],
                  ["Market",      rtec.marketScore],
                  ["Management",  rtec.managementScore],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white/70 rounded-xl p-3 text-center border border-white">
                    <p className="text-xs text-gray-500">{k}</p>
                    <p className={`text-2xl font-black ${parseInt(v) >= 75 ? "text-green-600" : parseInt(v) >= 50 ? "text-amber-500" : "text-red-500"}`}>{v || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Routing cards */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-500" /> Application Routing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Project Proposal */}
                <div className={`rounded-2xl border-2 p-5 transition-all ${rtec.rtecQualified ? "border-green-400 bg-green-50 shadow-md" : "border-gray-200 bg-gray-50 opacity-50"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rtec.rtecQualified ? "bg-green-500" : "bg-gray-300"}`}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-gray-800">Project Proposal</p>
                      <p className="text-xs text-gray-500">Module 7</p>
                    </div>
                    {rtec.rtecQualified && <span className="ml-auto text-xs bg-green-600 text-white px-2.5 py-1 rounded-full font-bold">SELECTED</span>}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    The enterprise is ready to develop a full DOST SETUP project proposal for technology adoption and fund utilization planning.
                  </p>
                </div>

                {/* MPEX Pre-requisite */}
                <div className={`rounded-2xl border-2 p-5 transition-all ${!rtec.rtecQualified ? "border-orange-400 bg-orange-50 shadow-md" : "border-gray-200 bg-gray-50 opacity-50"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!rtec.rtecQualified ? "bg-orange-500" : "bg-gray-300"}`}>
                      <Banknote className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-gray-800">MPEX Pre-requisite</p>
                      <p className="text-xs text-gray-500">Capacity Building Track</p>
                    </div>
                    {!rtec.rtecQualified && <span className="ml-auto text-xs bg-orange-500 text-white px-2.5 py-1 rounded-full font-bold">SELECTED</span>}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    The enterprise will undergo the MPEX (MSME Productivity Extension) pre-requisite training and capacity-building program before re-applying for SETUP.
                  </p>
                </div>
              </div>
            </div>

            {/* RTEC report preview */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> RTEC Evaluation Report
                </p>
                <button className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                  Print / Download
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-gray-700 leading-relaxed font-serif max-h-72 overflow-y-auto">
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Republic of the Philippines</p>
                  <p className="font-black text-base text-gray-800">Department of Science and Technology</p>
                  <p className="text-xs text-gray-500">Regional Technology Expert Committee (RTEC) Evaluation Report</p>
                  <div className="border-t border-b border-gray-200 py-2 mt-3">
                    <p className="font-black">RTEC EVALUATION REPORT</p>
                  </div>
                </div>
                <p>Date: {rtec.evaluationDate} &nbsp;|&nbsp; Evaluator: {rtec.evaluatorName}</p>
                <p><strong>Enterprise:</strong> {applicant?.enterpriseName} &nbsp;|&nbsp; <strong>App ID:</strong> {applicant?.applicationId}</p>
                <p><strong>MSME Size:</strong> {applicant?.msmeSize} &nbsp;|&nbsp; <strong>Sector:</strong> {applicant?.businessSector}</p>
                <p><strong>Overall Score:</strong> {rtec.overallScore}/100 ({rtec.rtecQualified ? "QUALIFIED" : "NOT YET QUALIFIED"})</p>
                <p><strong>Findings:</strong> {rtec.findings}</p>
                <p><strong>Recommendations:</strong> {rtec.recommendations}</p>
                <p><strong>Routing Decision:</strong> {rtec.rtecQualified ? "Proceed to Project Proposal (Module 7)" : "Route to MPEX Pre-requisite Program"}</p>
                <p className="text-xs text-gray-400 border-t pt-3">Generated by DOST aiSETUP Portal · {new Date().toLocaleString("en-PH")}</p>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={() => {
                handleFinalSubmit();
                onSubmitSuccess?.();
              }}
              className="w-full py-4 rounded-xl text-white font-black text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: rtec.rtecQualified ? "#059669" : "#d97706" }}
            >
              {rtec.rtecQualified
                ? <><CheckCircle className="w-5 h-5" /> Confirm & Proceed to Project Proposal</>
                : <><ArrowRight className="w-5 h-5" /> Confirm & Route to MPEX Pre-requisite</>}
            </button>

            {/* Back */}
            <button onClick={() => advanceStep("rtec")} className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to RTEC Evaluation
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
