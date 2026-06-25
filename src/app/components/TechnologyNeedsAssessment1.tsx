/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { authStore, AuthUser } from "../store/authStore";
import { applicantStore, Applicant } from "../store/applicantStore";
import {
  mergeTnaSavedData,
  EMPTY_TNA_TABLES,
  buildInitialTnaForm,
} from "../store/tnaFormDefaults";
import { api, ApiError } from "../api/client";
import { aiGenerateErrorMessage } from "../utils/apiErrors";
import type { Tna1DocumentResponse } from "../api/types";
import {
  buildLocalTna1Document,
  buildTna1DocumentSnapshot,
  buildTna1GenerationPayload,
  mergeAiTnaSuggestions,
} from "../utils/tnaForm01";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { StaffApplicantPicker, StaffApplicantBanner } from "./StaffApplicantPicker";
import { ModuleFormHeader } from "./ModuleFormHeader";
import { formatFormMention } from "../constants/setupForms";
import { moduleStepPillClass, MODULE_HEADER, MODULE_BODY } from "./moduleTheme";
import { appendStaffAssessment } from "../utils/clientAssessment";
import { notifyTna1Submitted, notifyTna1Reviewed, notifyTna1Resubmission } from "../utils/notificationHelpers";
import { TnaForm01Preview, printTnaForm01 } from "./TnaForm01Preview";
import { PrioritySectorSelect } from "./PrioritySectorSelect";
import { applicantAiContext, useAiFieldSuggest } from "../utils/aiAssist";
import { AiAssistNotice, AiAssistTextarea } from "./AiAssistField";
import { allowWhenDemo } from "../utils/demoMode";

// ─── Shared style constants (mirrors LOI exactly) ────────────────────────────
const DOST_BLUE = "#0C2461";
const DOST_MID  = "#1a3a7a";

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";
const sectionTitle =
  "text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2";

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  { id: "identification", label: "Enterprise Info",     icon: "🏭" },
  { id: "attachment-a",  label: "Enterprise Profile",   icon: "📋" },
  { id: "benchmark",     label: "Benchmark Info",       icon: "📊" },
  { id: "concerns",      label: "Problems & Marketing", icon: "⚠️" },
  { id: "finance-hr",    label: "Finance & HR",         icon: "💼" },
  { id: "validation",    label: "Validation",           icon: "✅" },
  { id: "complete",      label: "Form Preview",       icon: "📄" },
  { id: "staff-review",  label: "Staff Review",         icon: "🔍" },
  { id: "analysis",      label: "AI Analysis",          icon: "🤖" },
  { id: "reports",       label: "Reports",              icon: "📄" },
];

// ─── Step header (identical pattern to LOI StepHeader) ───────────────────────
function StepHeader({ current }) {
  const currentIdx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <div className={moduleStepPillClass({ active, done, locked: false })}>
              {done ? <span className="text-green-300">✓</span> : <span>{s.icon}</span>}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="text-white/30 text-xs shrink-0">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Readonly blue field (same as LOI ReadonlyField) ─────────────────────────
function ReadonlyField({ label, value }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="w-full border border-gray-100 bg-blue-50/40 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 font-medium min-h-[40px]">
        {value || <span className="text-gray-300 font-normal">—</span>}
      </div>
    </div>
  );
}

// ─── Validation row (same as LOI ValidationRow) ──────────────────────────────
function ValidationRow({ label, value, passed }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
        {passed ? "✓" : "!"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm mt-0.5 truncate ${passed ? "text-gray-800" : "text-red-500 italic"}`}>
          {value || "Missing — please complete in previous steps"}
        </p>
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
        {passed ? "OK" : "MISSING"}
      </span>
    </div>
  );
}

import { EditableTableResponsive } from "./ui/editable-table-responsive";

// ─── Checkbox clause (same pattern as LOI agreement clauses) ─────────────────
function ClauseCheck({ checked, onChange, title, text }) {
  return (
    <label className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
      checked ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:border-gray-300"
    }`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
      <div>
        {title && <p className="font-semibold text-gray-800 text-xs mb-1">{title}</p>}
        <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
      </div>
    </label>
  );
}

function FileAttachmentField({
  label,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  fileName,
  onFile,
  hint,
}: {
  label: string;
  accept?: string;
  fileName: string;
  onFile: (name: string, dataUrl: string) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onFile(file.name, String(reader.result ?? ""));
            reader.readAsDataURL(file);
          }}
        />
        {fileName ? (
          <p className="text-sm font-medium text-[#0C2461]">📎 {fileName}</p>
        ) : (
          <p className="text-sm text-gray-500">Click to upload (PDF, image, or document)</p>
        )}
      </div>
      {fileName && (
        <button
          type="button"
          onClick={() => onFile("", "")}
          className="text-xs text-red-500 hover:underline mt-1"
        >
          Remove file
        </button>
      )}
    </div>
  );
}

// ─── Info callout banner ──────────────────────────────────────────────────────
function InfoBanner({ icon = "ℹ️", color = "blue", title, text }) {
  const themes = {
    blue:   "bg-blue-50 border-blue-100 text-blue-700",
    amber:  "bg-amber-50 border-amber-200 text-amber-800",
    green:  "bg-green-50 border-green-300 text-green-800",
    red:    "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
  };
  return (
    <div className={`flex items-start gap-3 border rounded-xl p-4 ${themes[color]}`}>
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p className="leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ─── AI call helper ───────────────────────────────────────────────────────────
async function callAI(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

// ─── AI Loading indicator ─────────────────────────────────────────────────────
function AILoader({ label }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="w-5 h-5 border-2 border-blue-800 border-t-transparent rounded-full animate-spin flex-shrink-0" />
      <span className="text-sm font-semibold text-blue-800">{label}…</span>
    </div>
  );
}

// ─── Report viewer ────────────────────────────────────────────────────────────
function ReportViewer({ title, content, color, badge }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="px-4 sm:px-5 py-3 border-b border-gray-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        style={{ background: color }}
      >
        <p className="text-sm font-bold text-white flex flex-wrap items-center gap-2 min-w-0">
          <span>📄 {title}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 shrink-0">
            {badge}
          </span>
        </p>
        <button
          type="button"
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 min-h-11 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-white/15 border border-white/25 hover:bg-white/25 transition-colors whitespace-nowrap"
        >
          ⬇ Download
        </button>
      </div>
      <div className="p-4 sm:p-5 bg-gray-50 max-h-72 overflow-y-auto text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">
        {content}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export function TechnologyNeedsAssessment1({
  user,
  onSubmitSuccess,
}: {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}) {
  const [step, setStep] = useState("identification");
  const { applicant, isStaff } = useStaffApplicant(user);
  const [staffMode, setStaffMode] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");

  const [form, setForm] = useState(() => buildInitialTnaForm(null));

  const [tables, setTables] = useState(EMPTY_TNA_TABLES);
  const [applicantSubmitted, setApplicantSubmitted] = useState(false);
  const [tnaGenerating, setTnaGenerating] = useState(false);
  const [tnaGenerateError, setTnaGenerateError] = useState<string | null>(null);
  const [tnaAiGenerated, setTnaAiGenerated] = useState<boolean | null>(null);
  const [staffNotes, setStaffNotes] = useState("");
  const [siteVisitDate, setSiteVisitDate] = useState("");
  const [siteVisitNotes, setSiteVisitNotes] = useState("");
  const [staffApproved, setStaffApproved] = useState(false);

  const { bind: bindTnaAi, notice: tnaAiNotice } = useAiFieldSuggest("tna1");
  const tnaAiContext = useMemo(
    () => ({
      ...applicantAiContext(applicant),
      form,
      tables,
      mainProduct: form.mainProduct,
      sector: form.sector,
      commodity: form.commodity,
    }),
    [applicant, form, tables],
  );

  const tnaAi = (field: string, apply: (value: string) => void) => {
    const bound = bindTnaAi(
      field,
      tnaAiContext,
      (value) => apply(Array.isArray(value) ? value.join("\n") : value),
      () => {
        if (!applicant) return "";
        const payload = buildTna1GenerationPayload(applicant, form, tables);
        const doc = buildLocalTna1Document(payload);
        return String(doc.form[field] ?? "");
      },
    );
    return {
      ...bound,
      onAiSuggest: applicant ? bound.onAiSuggest : undefined,
    };
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setT = (key, rows) => setTables(t => ({ ...t, [key]: rows }));

  const loadApplicantData = useCallback((app: Applicant | null) => {
    if (!app) return;
    const saved = app?.moduleData?.tna1;
    const merged = mergeTnaSavedData(app, saved);
    setForm(merged.form);
    setTables(merged.tables);
    setApplicantSubmitted(!!saved?.submitted);
    const doc = app?.moduleData?.tna1Document as { aiGenerated?: boolean } | undefined;
    setTnaAiGenerated(doc?.aiGenerated ?? null);
  }, []);

  useEffect(() => {
    loadApplicantData(applicant);
  }, [applicant?.id, loadApplicantData]);

  const persistStaffReview = useCallback(
    (decision: "approved" | "needs-revision") => {
      if (!applicant || !user) return;
      if (decision === "needs-revision") {
        const assessmentUpdate = appendStaffAssessment(applicant, {
          stage: "tna1",
          decision: "needs-revision",
          assessedBy: user.email,
          assessedAt: new Date().toISOString(),
          remarks: staffNotes,
        });
        applicantStore.update(applicant.id, {
          ...assessmentUpdate,
          moduleData: {
            ...assessmentUpdate.moduleData,
            tna1: {
              ...(applicant.moduleData?.tna1 ?? {}),
              form,
              tables,
              submitted: false,
              staffReviewed: false,
            },
          },
        });
        notifyTna1Resubmission(applicant);
        setApplicantSubmitted(false);
        setStep("identification");
        return;
      }

      const assessmentUpdate = appendStaffAssessment(applicant, {
        stage: "tna1",
        decision: "approved",
        assessedBy: user.email,
        assessedAt: new Date().toISOString(),
        remarks: staffNotes,
      });
      applicantStore.update(applicant.id, {
        ...assessmentUpdate,
        moduleData: {
          ...assessmentUpdate.moduleData,
          tna1: {
            ...(applicant.moduleData?.tna1 ?? {}),
            form,
            tables,
            staffReviewed: true,
            staffReviewedAt: new Date().toISOString(),
            siteVisitDate: siteVisitDate || undefined,
            siteVisitNotes: siteVisitNotes || undefined,
            siteVisitCompleted: !!siteVisitDate,
          },
        },
      });
      notifyTna1Reviewed(applicant);
      setStaffApproved(true);
      setStep("analysis");
    },
    [applicant, user, staffNotes, siteVisitDate, siteVisitNotes, form, tables],
  );

  const saveTnaDraft = useCallback(
    (submitted = false) => {
      if (!applicant) return;
      applicantStore.update(applicant.id, {
        ...(submitted ? { currentModule: "tna1" as const } : {}),
        businessSector: String(form.sector ?? applicant.businessSector),
        moduleData: {
          ...applicant.moduleData,
          tna1: {
            form,
            tables,
            submitted,
            submittedAt: submitted ? new Date().toISOString() : applicant.moduleData?.tna1?.submittedAt,
            updatedAt: new Date().toISOString(),
          },
        },
      });
      setSaveNotice(submitted ? "TNA Form 01 submitted." : "Draft saved.");
      setTimeout(() => setSaveNotice(""), 3000);
    },
    [applicant, form, tables],
  );

  const goToStep = (next: string) => {
    if (applicant && !isStaff) saveTnaDraft(false);
    setStep(next);
  };

  const persistTna1Document = (
    mergedForm: Record<string, unknown>,
    mergedTables: typeof tables,
    document: Tna1DocumentResponse,
  ) => {
    if (!applicant) return;
    const snapshot = buildTna1DocumentSnapshot(
      mergedForm,
      mergedTables,
      document.aiGenerated,
      document.generatedAt,
    );
    applicantStore.update(applicant.id, {
      moduleData: {
        ...applicant.moduleData,
        tna1: {
          form: mergedForm,
          tables: mergedTables,
          submitted: applicant.moduleData?.tna1?.submitted ?? false,
          submittedAt: applicant.moduleData?.tna1?.submittedAt,
          updatedAt: new Date().toISOString(),
        },
        tna1Document: snapshot,
      },
    });
  };

  const handleGenerateTna1 = async () => {
    if (!applicant || tnaGenerating) return null;

    const payload = buildTna1GenerationPayload(applicant, form, tables);
    setTnaGenerating(true);
    setTnaGenerateError(null);

    let response: Tna1DocumentResponse;
    try {
      response = await api.generateTna1(payload);
      if (!response.aiGenerated) {
        setTnaGenerateError(
          "Suggestions generated using the standard template. Set ANTHROPIC_API_KEY on the backend for AI-drafted content.",
        );
      }
    } catch (err) {
      if (err instanceof ApiError && err.status < 500) {
        setTnaGenerateError(aiGenerateErrorMessage(err, "Could not generate form content. Please try again."));
        setTnaGenerating(false);
        return null;
      }
      response = buildLocalTna1Document(payload);
      setTnaGenerateError(
        "Backend unavailable — filled empty fields from template. Run npm run backend for server-side generation.",
      );
    }

    const merged = mergeAiTnaSuggestions(form, tables, response);
    setForm(merged.form);
    setTables(merged.tables);
    setTnaAiGenerated(response.aiGenerated);
    persistTna1Document(merged.form, merged.tables, response);
    setTnaGenerating(false);
    return response;
  };

  // ── Document state ───────────────────────────────────────────────────────────
  const [docs, setDocs] = useState([
    { name: "General Agreements",        required: true,  uploaded: true,  verified: false, flagged: false, file: "general_agreements.pdf" },
    { name: "Undertaking",               required: true,  uploaded: true,  verified: false, flagged: false, file: "undertaking_signed.pdf" },
    { name: "Enterprise Profile",        required: true,  uploaded: true,  verified: false, flagged: false, file: "enterprise_profile.pdf" },
    { name: "Benchmark Information",     required: true,  uploaded: true,  verified: false, flagged: false, file: "benchmark_data.pdf" },
    { name: "Production Plan",           required: true,  uploaded: true,  verified: false, flagged: false, file: "production_plan.pdf" },
    { name: "Marketing",                 required: true,  uploaded: false, verified: false, flagged: false, file: null },
    { name: "Finance / Other Concerns",  required: false, uploaded: false, verified: false, flagged: false, file: null },
  ]);

  // ── AI state ─────────────────────────────────────────────────────────────────
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult]   = useState(null);
  const [qualification,   setQualification]   = useState(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalContent, setProposalContent] = useState(null);
  const [rtecLoading,     setRtecLoading]     = useState(false);
  const [rtecContent,     setRtecContent]     = useState(null);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const allGA = [form.agreeGA1,form.agreeGA2,form.agreeGA3,form.agreeGA4,form.agreeGA5,form.agreeGA6].every(Boolean);
  const uploadedDocs  = docs.filter(d => d.uploaded);
  const allDocReviewed = uploadedDocs.length > 0 && uploadedDocs.every(d => d.verified || d.flagged);

  const validationChecks = [
    { label: "Enterprise Name",         value: form.enterpriseName,       passed: !!form.enterpriseName },
    { label: "Contact Person",          value: form.contactPerson,        passed: !!form.contactPerson },
    { label: "Office Address",          value: form.officeAddress,        passed: !!form.officeAddress },
    { label: "Sector",                  value: form.sector,               passed: !!form.sector },
    { label: "Commodity",               value: form.commodity,            passed: !!form.commodity },
    { label: "Main Product / Service",  value: form.mainProduct,          passed: !!form.mainProduct },
    { label: "Reasons for Assistance",  value: form.reasonsForAssistance, passed: !!form.reasonsForAssistance },
    { label: "Year Established",        value: form.yearEstablished,      passed: !!form.yearEstablished },
    { label: "Type of Organization",      value: form.organizationType,     passed: !!form.organizationType },
    { label: "Classification by Capital", value: form.capitalClassification, passed: !!form.capitalClassification },
    { label: "Employees (M / F)",         value: `${form.employeesMale} M, ${form.employeesFemale} F`, passed: !!form.employeesMale && !!form.employeesFemale },
    { label: "Employment Classification", value: form.employmentClass,      passed: !!form.employmentClass },
    { label: "General Agreements",      value: allGA ? "All 6 agreed" : "", passed: allGA },
    { label: "Undertaking Signature",   value: form.undertakingName,      passed: !!form.undertakingName },
    { label: "Raw Materials Table",     value: tables.rawMaterials[0]?.[0] ? "Entered" : "", passed: !!tables.rawMaterials[0]?.[0] },
    { label: "Production Problems",     value: form.productionProblemsConcerns, passed: !!form.productionProblemsConcerns },
    { label: "Plant Lay-Out Upload",    value: form.plantLayoutFileName, passed: !!form.plantLayoutFileName },
    {
      label: "Process Flow",
      value: form.processFlowMode === "attachment" ? form.processFlowFileName : form.processFlow,
      passed: form.processFlowMode === "attachment" ? !!form.processFlowFileName : !!form.processFlow,
    },
    { label: "Prepared Date",           value: form.preparedDate, passed: !!form.preparedDate },
  ];
  const allValid = validationChecks.every(c => c.passed);

  // ── AI handlers ──────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setAnalysisLoading(true);
    setQualification(null);
    try {
      const result = await callAI(`You are a DOST SETUP evaluator in the Philippines. Analyze this enterprise:
Enterprise: ${form.enterpriseName}
Sector: ${form.sector} | Commodity: ${form.commodity}
Employment: ${form.employmentClass} | Capital: PHP ${form.presentCapital}
Main Product: ${form.mainProduct}
Reasons for Assistance: ${form.reasonsForAssistance}
5-Year Plan: ${form.plan5Years}

Write 3–4 professional paragraphs covering: 1) Business viability, 2) Technology appropriateness, 3) SETUP eligibility, 4) Recommended interventions including whether lab testing or MPEX pre-requisite is needed.`);
      setAnalysisResult(result);

      const capitalAmt = parseInt((form.presentCapital || "0").replace(/,/g, ""));
      const needsMpex = form.plan10Years?.toLowerCase().includes("export") || form.reasonsForAssistance?.toLowerCase().includes("export");
      const needsLab  = ["food","pharma","cosmet"].some(k => form.sector?.toLowerCase().includes(k));
      const isSmall   = form.employmentClass?.toLowerCase().includes("micro") || form.employmentClass?.toLowerCase().includes("small");

      if (!isSmall || capitalAmt > 15000000) {
        setQualification({ status: "not_qualified",
          reasons: [
            { ok: isSmall, text: "Enterprise size must be Micro, Small, or Medium (max 99 employees)" },
            { ok: capitalAmt <= 15000000, text: `Capital PHP ${form.presentCapital} — must not exceed PHP 15M` },
          ],
          requirements: ["Re-apply when eligibility criteria are met."],
        });
      } else if (needsMpex) {
        setQualification({ status: "mpex",
          reasons: [
            { ok: true,  text: "SME size criteria met" },
            { ok: false, text: "Export-readiness requires MPEX pre-qualification" },
          ],
          requirements: [
            "Complete MPEX (Market Preparation for Export) assessment",
            "Obtain export certification from DTI-Export Marketing Bureau",
            "Submit Letter of Intent from foreign buyer or export market study",
          ],
          labTests: needsLab ? ["FDA-accredited product safety testing","Shelf-life and microbiological testing"] : [],
        });
      } else {
        setQualification({ status: "qualified",
          reasons: [
            { ok: true, text: "SME criteria met (size and capitalization)" },
            { ok: true, text: "Enterprise has documented technology needs" },
          ],
          labTests: needsLab ? [
            "Product quality and safety testing (FDA-accredited lab)",
            "Nutritional labeling compliance",
            "Shelf-life and stability testing",
          ] : [],
        });
      }
    } catch {
      setAnalysisResult("Analysis unavailable. Please check your connection.");
    }
    setAnalysisLoading(false);
  };

  const handleGenerateProposal = async () => {
    setProposalLoading(true);
    try {
      const result = await callAI(`Generate a formal DOST SETUP Project Proposal for:
Enterprise: ${form.enterpriseName} | Sector: ${form.sector}
Product: ${form.mainProduct} | Location: ${form.officeAddress}
Problem: ${form.reasonsForAssistance}
5-Year Plan: ${form.plan5Years}
Capital: PHP ${form.presentCapital}

Use sections: I. PROJECT BACKGROUND, II. OBJECTIVES, III. SCOPE AND LIMITATIONS, IV. TECHNOLOGY INTERVENTION PLAN, V. EXPECTED OUTCOMES & IMPACT, VI. BUDGET ESTIMATE, VII. IMPLEMENTATION TIMELINE. Keep it formal (~400 words).`);
      setProposalContent(result);
    } catch { setProposalContent("Unable to generate. Please try again."); }
    setProposalLoading(false);
  };

  const handleGenerateRTEC = async () => {
    setRtecLoading(true);
    try {
      const result = await callAI(`Generate a formal RTEC Evaluation Report for DOST SETUP:
Enterprise: ${form.enterpriseName} | Sector: ${form.sector}
Location: ${form.officeAddress}
Qualification Status: ${qualification?.status?.toUpperCase()}

Use sections: I. RTEC MEETING DETAILS, II. ENTERPRISE BACKGROUND, III. TECHNOLOGY ASSESSMENT FINDINGS, IV. COMMITTEE DELIBERATIONS, V. RECOMMENDATION, VI. CONDITIONS FOR APPROVAL, VII. COMMITTEE SIGNATURES. Formal, ~350 words.`);
      setRtecContent(result);
    } catch { setRtecContent("Unable to generate. Please try again."); }
    setRtecLoading(false);
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* ── Header (identical structure to LOI) ── */}
        <div className={`${MODULE_HEADER} text-white`} style={{ background: `linear-gradient(135deg,${DOST_BLUE} 0%,${DOST_MID} 100%)` }}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-blue-800 font-black text-sm">TNA</span>
              </div>
              <ModuleFormHeader
                formKey="tna01"
                title="Technology Needs Assessment 1"
                subtitle="DOST SETUP Program · Module 5"
              />
            </div>
            {isStaff && (
            <button
              onClick={() => setStaffMode(s => !s)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                staffMode
                  ? "bg-white text-blue-900 border-white"
                  : "bg-white/10 text-white border-white/30 hover:bg-white/20"
              }`}
            >
              {staffMode ? "🔓 Staff Mode ON" : "🔒 Staff Mode"}
            </button>
            )}
          </div>
          <StepHeader current={step} />
          {saveNotice && (
            <p className="text-xs text-emerald-200 mt-2 font-medium">{saveNotice}</p>
          )}
          <StaffApplicantPicker user={user} label={`Review applicant ${formatFormMention("tna01")}`} />
        </div>
        <StaffApplicantBanner user={user} />
        <div className="px-6 pt-4">
          <AiAssistNotice message={tnaAiNotice} />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1 — Enterprise Identification
        ══════════════════════════════════════════════════════════════════ */}
        {step === "identification" && (
          <div className={MODULE_BODY}>
            <InfoBanner icon="📋" color="blue"
              title={formatFormMention("tna01")}
              text="Please fill out all sections accurately. Your registration data is pre-filled where available. Progress is saved automatically as you continue." />

            {!applicant && user && !isStaff && (
              <InfoBanner icon="⚠️" color="amber"
                title="No application record linked"
                text="We could not find your enterprise record. Complete registration first, then return to this form." />
            )}

            {applicant && !isStaff && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-600">
                  Application: <span className="font-mono font-semibold">{applicant.applicationId}</span>
                  {applicant.moduleData?.tna1?.submitted && (
                    <span className="ml-2 text-emerald-700 font-semibold">· Submitted</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => saveTnaDraft(false)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0C2461] text-white hover:opacity-90"
                >
                  Save draft
                </button>
              </div>
            )}

            {/* Enterprise ID table */}
            <div>
              <h2 className={sectionTitle}>🏭 Enterprise Identification</h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
                {/* Name row */}
                <div className="flex flex-col md:grid md:grid-cols-[minmax(140px,180px)_1fr] border-b border-gray-100">
                  <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 md:flex md:items-center md:border-r md:border-gray-100 shrink-0">
                    Name of Enterprise <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="p-2 sm:p-1.5">
                    <input value={form.enterpriseName} onChange={e => set("enterpriseName", e.target.value)} className={`${inputCls} w-full`} />
                  </div>
                </div>
                {/* Contact + Position */}
                <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-100">
                  <div className="flex flex-col md:grid md:grid-cols-[minmax(120px,130px)_1fr] border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 md:flex md:items-center md:border-r md:border-gray-100 shrink-0">
                      Contact Person <span className="text-red-500 ml-1">*</span>
                    </div>
                    <div className="p-2 sm:p-1.5">
                      <input value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)} className={`${inputCls} w-full`} />
                    </div>
                  </div>
                  <div className="flex flex-col md:grid md:grid-cols-[minmax(130px,150px)_1fr]">
                    <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 md:flex md:items-center md:border-r md:border-gray-100 shrink-0">
                      Position in Enterprise
                    </div>
                    <div className="p-2 sm:p-1.5">
                      <input value={form.position} onChange={e => set("position", e.target.value)} className={`${inputCls} w-full`} />
                    </div>
                  </div>
                </div>
                {/* Office + Factory addresses */}
                {[
                  { label: "Office Address", keyAddr: "officeAddress", keyTel: "officeTel", keyFax: "officeFax", keyEmail: "officeEmail" },
                  { label: "Factory Address", keyAddr: "factoryAddress", keyTel: "factoryTel", keyFax: "factoryFax", keyEmail: "factoryEmail" },
                ].map((row, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0">
                    {/* Mobile: stacked fields */}
                    <div className="md:hidden p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-700 bg-gray-50 -mx-4 px-4 py-2 border-b border-gray-100">
                        {row.label}
                      </p>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Address</label>
                        <input value={form[row.keyAddr]} onChange={e => set(row.keyAddr, e.target.value)} className={`${inputCls} w-full`} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Tel. No.</label>
                          <input value={form[row.keyTel]} onChange={e => set(row.keyTel, e.target.value)} className={`${inputCls} w-full`} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Fax No.</label>
                          <input value={form[row.keyFax]} onChange={e => set(row.keyFax, e.target.value)} className={`${inputCls} w-full`} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">E-mail Address</label>
                        <input value={form[row.keyEmail]} onChange={e => set(row.keyEmail, e.target.value)} className={`${inputCls} w-full`} type="email" />
                      </div>
                    </div>
                    {/* Desktop: table row */}
                    <div className="hidden md:grid md:grid-cols-[minmax(140px,180px)_1fr_1fr_1fr]">
                      <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 flex items-center border-r border-gray-100">
                        {row.label}
                      </div>
                      <div className="p-1.5 border-r border-gray-100 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">Address</div>
                        <input value={form[row.keyAddr]} onChange={e => set(row.keyAddr, e.target.value)} className={`${inputCls} w-full`} />
                      </div>
                      <div className="p-1.5 border-r border-gray-100 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">Tel. No.</div>
                        <input value={form[row.keyTel]} onChange={e => set(row.keyTel, e.target.value)} className={`${inputCls} w-full`} />
                        <div className="text-xs text-gray-400 mb-1 mt-2">Fax No.</div>
                        <input value={form[row.keyFax]} onChange={e => set(row.keyFax, e.target.value)} className={`${inputCls} w-full`} />
                      </div>
                      <div className="p-1.5 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">E-mail Address</div>
                        <input value={form[row.keyEmail]} onChange={e => set(row.keyEmail, e.target.value)} className={`${inputCls} w-full`} type="email" />
                      </div>
                    </div>
                  </div>
                ))}
                {/* Website */}
                <div className="flex flex-col md:grid md:grid-cols-[minmax(140px,180px)_1fr]">
                  <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 md:flex md:items-center md:border-r md:border-gray-100 shrink-0">
                    Website
                  </div>
                  <div className="p-2 sm:p-1.5">
                    <input value={form.website} onChange={e => set("website", e.target.value)} className={`${inputCls} w-full`} placeholder="https://" />
                  </div>
                </div>
              </div>
            </div>

            {/* General Agreements */}
            <div>
              <h2 className={sectionTitle}>📜 General Agreements</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3 text-sm text-blue-900 leading-relaxed mb-4">
                {[
                  "The applicant shall make available to DOST all information (manuals, procedures, etc.) required to establish the technological status of the selected core business functions and management systems.",
                  "If DOST is not satisfied that all requirements for business registration are complied with, it shall inform the applicant of the observed deficiencies before starting the assessment.",
                  "When required inputs are supplied, DOST will assess the firm through core business functions to identify technological needs and verify compliance to standards.",
                  "When assessment is complete, DOST will prepare a report with recommendations. The applicant shall not claim the report applies to locations or activities not covered.",
                  "The applicant agrees that the report will not be used until permission has been granted by DOST.",
                  "The applicant agrees that receipt of the report ends the assessment stage; any technical assistance ensuing will be viewed as a separate project.",
                ].map((text, i) => (
                  <ClauseCheck key={i}
                    checked={form[`agreeGA${i+1}`]}
                    onChange={v => set(`agreeGA${i+1}`, v)}
                    title={`${i+1}. ${text}`}
                    text={``}/>
                ))}
              </div>

              {/* Undertaking */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Undertaking</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  I agree to undertake and observe the above General Agreements as stipulated by the Department of Science and Technology.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Signature over Printed Name <span className="text-red-500">*</span></label>
                   
                    <input value={form.undertakingName} onChange={e => set("undertakingName", e.target.value)}
                      className={inputCls} placeholder="Print full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Position in Enterprise</label>
                    <input value={form.undertakingPosition} onChange={e => set("undertakingPosition", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.undertakingDate} onChange={e => set("undertakingDate", e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => goToStep("attachment-a")} disabled={!allowWhenDemo(allGA && !!form.enterpriseName && !!form.contactPerson)}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: DOST_BLUE }}>
              Continue to Enterprise Profile →
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2 — Attachment A: Enterprise Profile
        ══════════════════════════════════════════════════════════════════ */}
        {step === "attachment-a" && (
          <div className={MODULE_BODY}>
            <InfoBanner icon="📎" color="blue" title="Attachment A — Enterprise Profile"
              text="Provide detailed background information about your enterprise. All fields marked * are required." />

            <div>
              <div className="bg-blue-900 text-white px-4 py-2.5 rounded-t-xl flex items-center gap-2 text-sm font-bold">
                <span>📎</span> ATTACHMENT A — Enterprise Profile
              </div>
              <div className="border border-t-0 border-gray-200 rounded-b-xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Name of Enterprise <span className="text-red-500">*</span></label>
                    <input value={form.enterpriseName} onChange={e => set("enterpriseName", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Production Site / Location</label>
                    <input value={form.productionSite} onChange={e => set("productionSite", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Business Permit No.</label>
                    <input value={form.businessPermitNo} onChange={e => set("businessPermitNo", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Year Registered</label>
                    <input type="number" value={form.yearRegistered} onChange={e => set("yearRegistered", e.target.value)} className={inputCls} />
                  </div>
                </div>
                <AiAssistTextarea
                  label="Brief Enterprise Background"
                  value={form.enterpriseBackground}
                  onChange={(enterpriseBackground) => set("enterpriseBackground", enterpriseBackground)}
                  inputClassName={inputCls}
                  labelClassName={labelCls}
                  minHeight="min-h-[80px]"
                  {...tnaAi("enterpriseBackground", (v) => set("enterpriseBackground", v))}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Year Established</label>
                    <input type="number" value={form.yearEstablished} onChange={e => set("yearEstablished", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Initial Capitalization (PHP)</label>
                    <input value={form.initialCapital} onChange={e => set("initialCapital", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Enterprise Registration No.</label>
                    <input value={form.registrationNo} onChange={e => set("registrationNo", e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Present Capitalization (PHP)</label>
                    <input value={form.presentCapital} onChange={e => set("presentCapital", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Classification According to Capital <span className="text-red-500">*</span></label>
                    <select value={form.capitalClassification} onChange={e => set("capitalClassification", e.target.value)} className={inputCls}>
                      <option value="">Select MSME classification…</option>
                      <option value="Micro">Micro — assets up to ₱3,000,000</option>
                      <option value="Small">Small — assets ₱3,000,001 to ₱15,000,000</option>
                      <option value="Medium">Medium — assets ₱15,000,001 to ₱100,000,000</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Type of Organization <span className="text-red-500">*</span></label>
                    <select value={form.organizationType} onChange={e => set("organizationType", e.target.value)} className={inputCls}>
                      <option value="">Select…</option>
                      <option>Sole Proprietorship (DTI)</option>
                      <option>Partnership (SEC)</option>
                      <option>Corporation (SEC)</option>
                      <option>One Person Corporation (SEC)</option>
                      <option>Cooperative (CDA)</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Classification by Employment <span className="text-red-500">*</span></label>
                    <select value={form.employmentClass} onChange={e => set("employmentClass", e.target.value)} className={inputCls}>
                      <option value="">Select…</option>
                      <option>Micro (1–9 employees)</option>
                      <option>Small (10–99 employees)</option>
                      <option>Medium (100–199 employees)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Number of Employees <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Male</span>
                      <input type="number" min="0" value={form.employeesMale} onChange={e => set("employeesMale", e.target.value)} className={inputCls} placeholder="0" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Female</span>
                      <input type="number" min="0" value={form.employeesFemale} onChange={e => set("employeesFemale", e.target.value)} className={inputCls} placeholder="0" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Indirect Workers</span>
                      <input type="number" min="0" value={form.employeesIndirect} onChange={e => set("employeesIndirect", e.target.value)} className={inputCls} placeholder="0" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Contract Workers</span>
                      <input type="number" min="0" value={form.employeesContract} onChange={e => set("employeesContract", e.target.value)} className={inputCls} placeholder="0" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Per TNA Form 01 — report direct employees (M/F) and indirect/contract workers separately.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Sector <span className="text-red-500">*</span></label>
                    <PrioritySectorSelect
                      required
                      value={form.sector}
                      onChange={(value) => set("sector", value)}
                      className={inputCls}
                      placeholder="Select priority sector"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Commodity <span className="text-red-500">*</span></label>
                    <input value={form.commodity} onChange={e => set("commodity", e.target.value)} className={inputCls} placeholder="e.g. Cassava-based products" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Specific Product / Service Offered <span className="text-red-500">*</span></label>
                  <textarea rows={2} value={form.mainProduct} onChange={e => set("mainProduct", e.target.value)} className={inputCls} />
                </div>
                <AiAssistTextarea
                  label="Reasons Why Assistance is Being Sought *"
                  value={form.reasonsForAssistance}
                  onChange={(reasonsForAssistance) => set("reasonsForAssistance", reasonsForAssistance)}
                  inputClassName={inputCls}
                  labelClassName={labelCls}
                  minHeight="min-h-[80px]"
                  {...tnaAi("reasonsForAssistance", (v) => set("reasonsForAssistance", v))}
                />

                {/* Consultations */}
                <div>
                  <label className={labelCls}>Have you consulted any other individual/organization for assistance?</label>
                  <div className="flex gap-6 mb-3">
                    {["Yes","No"].map(opt => (
                      <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="consulted" value={opt}
                          checked={form.consultedOther === opt} onChange={() => set("consultedOther", opt)}
                          className="w-4 h-4 text-blue-600" />
                        {opt}
                      </label>
                    ))}
                  </div>
                  {form.consultedOther === "Yes" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <label className={labelCls}>Which company / agency?</label>
                        <input value={form.consultedAgency} onChange={e => set("consultedAgency", e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Type of assistance sought</label>
                        <input value={form.assistanceType} onChange={e => set("assistanceType", e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  )}
                  {form.consultedOther === "No" && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <label className={labelCls}>Why not?</label>
                      <input value={form.whyNotConsulted} onChange={e => set("whyNotConsulted", e.target.value)} className={inputCls} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Enterprise's Plan for the Next 5 Years</label>
                    <textarea rows={2} value={form.plan5Years} onChange={e => set("plan5Years", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Enterprise's Plan for the Next 10 Years</label>
                    <textarea rows={2} value={form.plan10Years} onChange={e => set("plan10Years", e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Current Agreements and Alliances</label>
                  <textarea rows={2} value={form.agreements} onChange={e => set("agreements", e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("identification")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
              <button onClick={() => goToStep("benchmark")} disabled={!allowWhenDemo(!!form.sector && !!form.commodity && !!form.mainProduct && !!form.reasonsForAssistance && !!form.organizationType && !!form.capitalClassification)}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}>
                Continue to Benchmark Information →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3 — Benchmark Information
        ══════════════════════════════════════════════════════════════════ */}
        {step === "benchmark" && (
          <div className={MODULE_BODY}>
            <InfoBanner icon="📊" color="blue" title="Benchmark Information — Production & Supply Chain"
              text="Enter details about your raw materials, production output, and existing equipment. Click '+ Add Row' to add more entries." />

            <div>
              <h2 className={sectionTitle}>🌿 Raw Materials</h2>
              <EditableTableResponsive
                columns={["Raw Material","Source","Unit Cost (PHP)","Volume Used / Year"]}
                rows={tables.rawMaterials}
                onChange={rows => setT("rawMaterials", rows)}
                onAddRow={() => setT("rawMaterials", [...tables.rawMaterials, ["","","",""]])}
              />
            </div>
            <div>
              <h2 className={sectionTitle}>🏭 Production</h2>
              <EditableTableResponsive
                columns={["Product","Volume of Production / Year","Unit Cost of Production (PHP)","Annual Cost of Production (PHP)"]}
                rows={tables.production}
                onChange={rows => setT("production", rows)}
                onAddRow={() => setT("production", [...tables.production, ["","","",""]])}
              />
            </div>
            <div>
              <h2 className={sectionTitle}>⚙️ Existing Functional Production Equipment</h2>
              <EditableTableResponsive
                columns={["Type of Equipment","Specifications","Capacity","No. of Units","Year Acquired"]}
                rows={tables.equipment}
                onChange={rows => setT("equipment", rows)}
                onAddRow={() => setT("equipment", [...tables.equipment, ["","","","",""]])}
              />
            </div>

            <div>
              <h2 className={sectionTitle}>🔧 Production Problems and Concerns</h2>
              <AiAssistTextarea
                label="Production Problems and Concerns"
                value={form.productionProblemsConcerns}
                onChange={(productionProblemsConcerns) => set("productionProblemsConcerns", productionProblemsConcerns)}
                inputClassName={inputCls}
                labelClassName={labelCls}
                minHeight="min-h-[80px]"
                hint="Summarize key production issues identified during benchmarking (per TNA Form 01)."
                {...tnaAi("productionProblemsConcerns", (v) => set("productionProblemsConcerns", v))}
              />
              <div className="space-y-3 mt-4">
                {[
                  { label: "Production Waste Management System", key: "wasteManagement" },
                  { label: "Production Plan", key: "productionPlan" },
                  { label: "Inventory System", key: "inventorySystem" },
                  { label: "Maintenance Program", key: "maintenanceProgram" },
                  { label: "cGMP / HACCP Activities", key: "cgmpHaccp" },
                  { label: "Supplies / Purchasing System", key: "purchasingSystem" },
                ].map(item => (
                  <div key={item.key}>
                    <label className={labelCls}>{item.label}</label>
                    <textarea rows={2} value={form[item.key]} onChange={e => set(item.key, e.target.value)}
                      className={inputCls} placeholder={`Describe your ${item.label.toLowerCase()}…`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FileAttachmentField
                label="Plant Lay-Out"
                fileName={form.plantLayoutFileName}
                onFile={(name, data) => {
                  set("plantLayoutFileName", name);
                  set("plantLayoutFileData", data);
                }}
                hint="Upload floor plan or plant layout diagram (required attachment per TNA Form 01)."
              />
              <div>
                <p className="text-xs text-gray-400 mb-2">Enter as text description or upload a diagram.</p>
                <div className="flex gap-4 mb-3">
                  {(["text", "attachment"] as const).map((mode) => (
                    <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="processFlowMode"
                        checked={form.processFlowMode === mode}
                        onChange={() => set("processFlowMode", mode)}
                        className="w-4 h-4 text-blue-600"
                      />
                      {mode === "text" ? "Text description" : "File attachment"}
                    </label>
                  ))}
                </div>
                {form.processFlowMode === "text" ? (
                  <AiAssistTextarea
                    label="Process Flow"
                    value={form.processFlow}
                    onChange={(processFlow) => set("processFlow", processFlow)}
                    inputClassName={inputCls}
                    labelClassName={labelCls}
                    minHeight="min-h-[100px]"
                    hint="Describe the production process flow step by step"
                    {...tnaAi("processFlow", (v) => set("processFlow", v))}
                  />
                ) : (
                  <FileAttachmentField
                    label=""
                    fileName={form.processFlowFileName}
                    onFile={(name, data) => {
                      set("processFlowFileName", name);
                      set("processFlowFileData", data);
                    }}
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("attachment-a")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
              <button onClick={() => goToStep("concerns")}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}>
                Continue to Problems & Marketing →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 4 — Production Problems & Marketing
        ══════════════════════════════════════════════════════════════════ */}
        {step === "concerns" && (
          <div className={MODULE_BODY}>
            <InfoBanner icon="⚠️" color="amber" title="Production Problems, Concerns & Marketing"
              text="Review operational details from Benchmark Information and complete marketing and packaging compliance." />

            <div>
              <h2 className={sectionTitle}>🔧 Production Summary</h2>
              <ReadonlyField label="Production Problems and Concerns (from Benchmark)" value={form.productionProblemsConcerns || "—"} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <ReadonlyField label="Plant Lay-Out" value={form.plantLayoutFileName || "No file uploaded"} />
                <ReadonlyField
                  label="Process Flow"
                  value={
                    form.processFlowMode === "attachment"
                      ? form.processFlowFileName || "No file uploaded"
                      : form.processFlow || "—"
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => goToStep("benchmark")}
                className="text-xs text-[#0C2461] font-semibold hover:underline mt-2"
              >
                ← Edit in Benchmark Information
              </button>
            </div>

            <div>
              <h2 className={sectionTitle}>📣 Marketing</h2>
              <div className="space-y-3">
                {[
                  { label: "Marketing Plan",          key: "marketingPlan" },
                  { label: "Market Outlets and Number", key: "marketOutlets" },
                  { label: "Promotional Strategies",  key: "promotionalStrategies" },
                  { label: "Market Competitors",      key: "marketCompetitors" },
                ].map(item => (
                  <div key={item.key}>
                    <label className={labelCls}>{item.label}</label>
                    <textarea rows={2} value={form[item.key]} onChange={e => set(item.key, e.target.value)} className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className={labelCls}>Packaging Compliance</label>
                <p className="text-xs text-gray-400 mb-3">Indicate compliance status and provide remarks for each packaging requirement.</p>
                <div className="space-y-3">
                  {[
                    { label: "Nutrition Evaluation", key: "packNutrition", remarksKey: "packNutritionRemarks" },
                    { label: "Bar Code", key: "packBarcode", remarksKey: "packBarcodeRemarks" },
                    { label: "Product Label", key: "packLabel", remarksKey: "packLabelRemarks" },
                    { label: "Expiry Date", key: "packExpiry", remarksKey: "packExpiryRemarks" },
                  ].map(item => (
                    <div key={item.key} className={`p-4 rounded-xl border transition-all ${
                      form[item.key] ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"
                    }`}>
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
                        <input type="checkbox" checked={!!form[item.key]} onChange={e => set(item.key, e.target.checked)}
                          className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-800 font-semibold">{item.label}</span>
                      </label>
                      <input
                        value={form[item.remarksKey]}
                        onChange={e => set(item.remarksKey, e.target.value)}
                        className={inputCls}
                        placeholder={`Remarks for ${item.label.toLowerCase()}…`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("benchmark")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
              <button onClick={() => goToStep("finance-hr")}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}>
                Continue to Finance & HR →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 5 — Finance & Human Resources
        ══════════════════════════════════════════════════════════════════ */}
        {step === "finance-hr" && (
          <div className={MODULE_BODY}>
            <InfoBanner icon="💼" color="blue" title="Finance & Human Resources"
              text="Provide financial and HR information to complete your application profile." />

            <div>
              <h2 className={sectionTitle}>💰 Finance</h2>
              <div className="space-y-3">
                {[
                  { label: "Cash Flow or Other Related Documents", key: "cashFlow" },
                  { label: "Source(s) of Capital / Credit",        key: "capitalSource" },
                  { label: "Accounting System",                     key: "accountingSystem" },
                ].map(item => (
                  <div key={item.key}>
                    <label className={labelCls}>{item.label}</label>
                    <textarea rows={2} value={form[item.key]} onChange={e => set(item.key, e.target.value)} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>👥 Human Resources</h2>
              <div className="space-y-3">
                {[
                  { label: "Hiring and Criteria",         key: "hiringCriteria" },
                  { label: "Incentives to Employees",     key: "employeeIncentives" },
                  { label: "Training and Development",    key: "trainingDevelopment" },
                  { label: "Safety Measures Practiced",   key: "safetyMeasures" },
                  { label: "Other Employee Welfare",      key: "employeeWelfare" },
                ].map(item => (
                  <div key={item.key}>
                    <label className={labelCls}>{item.label}</label>
                    <textarea rows={2} value={form[item.key]} onChange={e => set(item.key, e.target.value)} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>📝 Other Concerns</h2>
              <AiAssistTextarea
                label="Other Concerns"
                value={form.otherConcerns}
                onChange={(otherConcerns) => set("otherConcerns", otherConcerns)}
                inputClassName={inputCls}
                labelClassName={labelCls}
                minHeight="min-h-[80px]"
                hint="Any other concerns or relevant information"
                {...tnaAi("otherConcerns", (v) => set("otherConcerns", v))}
              />
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Prepared by:</p>
                <div className="border-b-2 border-gray-400 min-h-8 mb-2" />
                <p className="text-xs text-gray-400 mb-3">Printed Name and Signature of Owner / Chair / Representative</p>
                <label className={labelCls}>Date</label>
                <input type="date" value={form.preparedDate} onChange={e => set("preparedDate", e.target.value)} className={inputCls} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Validated by:</p>
                <div className="border-b-2 border-gray-400 min-h-8 mb-2" />
                <p className="text-xs text-gray-400 mb-3">Printed Name and Signature of PSTD / CASTD / CSTD</p>
                <label className={labelCls}>Date</label>
                <input type="date" value={form.validatedDate} onChange={e => set("validatedDate", e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("concerns")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
              <button onClick={() => goToStep("validation")}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}>
                Proceed to Validation →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 6 — Validation (mirrors LOI validation step)
        ══════════════════════════════════════════════════════════════════ */}
        {step === "validation" && (
          <div className={MODULE_BODY}>
            <InfoBanner icon="✅" color="blue" title="Data Validation Check"
              text="All required fields must be complete before submitting for staff review. Fields marked MISSING must be corrected." />

            <div>
              <h2 className={sectionTitle}>
                ✅ Validation Results &nbsp;
                <span className="text-xs font-normal text-gray-400">
                  ({validationChecks.filter(c => c.passed).length}/{validationChecks.length} complete)
                </span>
              </h2>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                {validationChecks.map(check => <ValidationRow key={check.label} {...check} />)}
              </div>
            </div>

            <div className={`rounded-xl p-4 border-2 ${allValid ? "bg-green-50 border-green-300" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${allValid ? "text-green-600" : "text-red-500"}`}>{allValid ? "✅" : "❌"}</span>
                <div>
                  <p className={`font-bold ${allValid ? "text-green-800" : "text-red-700"}`}>
                    {allValid ? "All fields validated — ready to generate and submit!"
                              : `${validationChecks.filter(c => !c.passed).length} field(s) missing — go back and complete`}
                  </p>
                  <p className={`text-xs mt-0.5 ${allValid ? "text-green-600" : "text-red-500"}`}>
                    {allValid
                      ? "Use Generate with AI to complete empty narrative sections, then submit your TNA Form 01."
                      : "Return to the previous steps to fill in the missing information."}
                  </p>
                </div>
              </div>
            </div>

            {applicant && (!isStaff || staffMode) && (
              <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-purple-900">AI-assisted form completion</p>
                  {tnaAiGenerated === true && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      AI Generated
                    </span>
                  )}
                  {tnaAiGenerated === false && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Template fallback
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-700">
                  {isStaff
                    ? "Generate narrative sections and tables for the selected applicant. Existing entries are preserved."
                    : "Fills only empty narrative fields and tables. Your existing entries are preserved."}
                </p>
                {tnaGenerateError && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {tnaGenerateError}
                  </p>
                )}
                {tnaGenerating ? (
                  <AILoader label="Generating TNA Form 01 content" />
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleGenerateTna1()}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                    style={{ background: "#7c3aed" }}
                  >
                    🤖 Generate with AI
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setStep("finance-hr")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
              {applicantSubmitted && !isStaff ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold text-center flex items-center justify-center">
                    TNA Form 01 submitted. DOST will review your application.
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep("complete")}
                    className="px-5 py-3 rounded-xl border border-emerald-300 text-emerald-800 font-semibold text-sm hover:bg-emerald-50"
                  >
                    View form preview →
                  </button>
                </div>
              ) : (
              <button
                onClick={() => {
                  if (isStaff) goToStep("staff-review");
                  else {
                    saveTnaDraft(true);
                    setApplicantSubmitted(true);
                    if (applicant) notifyTna1Submitted(applicant);
                    goToStep("complete");
                  }
                }}
                disabled={!allowWhenDemo(allValid)}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}>
                {isStaff ? "Submit for Staff Review →" : "Submit TNA Form 01 ✓"}
              </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP — TNA Form 01 Preview (printable summary)
        ══════════════════════════════════════════════════════════════════ */}
        {step === "complete" && (
          <div className={MODULE_BODY}>
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5 text-center">
              <span className="text-3xl">✅</span>
              <h3 className="font-black text-green-800 text-lg mt-2">TNA Form 01 Recorded</h3>
              <p className="text-sm text-green-700 mt-1">
                Reference: <strong className="font-mono">{applicant?.applicationId ?? "—"}</strong>
                {applicant?.moduleData?.tna1?.submittedAt && (
                  <span className="block text-xs text-green-600 mt-1">
                    Submitted {new Date(applicant.moduleData.tna1.submittedAt).toLocaleString("en-PH")}
                  </span>
                )}
                {tnaAiGenerated !== null && (
                  <span className="block text-xs mt-1">
                    {tnaAiGenerated ? "Content: AI generated" : "Content: template fallback"}
                  </span>
                )}
              </p>
            </div>

            {!isStaff && applicant && (
              <div className="print:hidden flex flex-wrap gap-2 items-center justify-end">
                {tnaGenerating ? (
                  <AILoader label="Regenerating TNA Form 01 content" />
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleGenerateTna1()}
                    className="text-sm font-semibold px-4 py-2 rounded-lg text-white hover:opacity-90"
                    style={{ background: "#7c3aed" }}
                  >
                    🤖 Regenerate with AI
                  </button>
                )}
              </div>
            )}

            <TnaForm01Preview
              applicant={applicant}
              form={
                (applicant?.moduleData?.tna1Document?.form as Record<string, unknown>) ?? form
              }
              tables={
                (applicant?.moduleData?.tna1Document?.tables as typeof tables) ?? tables
              }
              aiGenerated={tnaAiGenerated ?? undefined}
              onPrint={printTnaForm01}
            />

            <div className="flex flex-col sm:flex-row gap-3 print:hidden">
              <button
                onClick={() => setStep("validation")}
                className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 text-sm"
              >
                ← Back to validation
              </button>
              {!isStaff && (
                <button
                  onClick={printTnaForm01}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ background: DOST_BLUE }}
                >
                  Print / Save as PDF
                </button>
              )}
              {onSubmitSuccess && !isStaff && (
                <button
                  type="button"
                  onClick={onSubmitSuccess}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ background: "#059669" }}
                >
                  Continue to TNA 2 →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 7 — Staff Review
        ══════════════════════════════════════════════════════════════════ */}
        {step === "staff-review" && isStaff && (
          <div className={MODULE_BODY}>
            {!staffMode ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-5xl">🔒</div>
                <h3 className="text-lg font-bold text-gray-700">Staff Mode Required</h3>
                <p className="text-sm text-gray-400">This section is restricted to authorized DOST Provincial Staff only.</p>
                <button onClick={() => setStaffMode(true)}
                  className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: DOST_BLUE }}>
                  🔓 Enable Staff Mode
                </button>
              </div>
            ) : (
              <>
                {/* Staff identity bar */}
                <div className="flex items-center gap-3 p-4 rounded-xl text-white" style={{ background: DOST_BLUE }}>
                  <div className="w-9 h-9 rounded-full bg-sky-400 flex items-center justify-center font-bold text-blue-900 text-sm">PS</div>
                  <div>
                    <p className="font-bold text-sm">Provincial Staff Review Mode</p>
                    <p className="text-xs text-white/60">Staff ID: PSTD-R12-001 · DOST Region XII · {new Date().toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sky-300">🔒 Secure Mode</span>
                  </div>
                </div>

                {/* Doc verification stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Uploaded",  value: uploadedDocs.length,                       icon: "📤", color: "text-blue-600" },
                    { label: "Verified",  value: docs.filter(d => d.verified).length,        icon: "✅", color: "text-green-600" },
                    { label: "Flagged",   value: docs.filter(d => d.flagged).length,          icon: "⚠️", color: "text-red-500" },
                    { label: "Pending",   value: uploadedDocs.filter(d => !d.verified && !d.flagged).length, icon: "⏳", color: "text-amber-500" },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="text-xl">{s.icon}</div>
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Document list */}
                <div>
                  <h2 className={sectionTitle}>📋 Document Verification Checklist</h2>
                  <div className="space-y-2">
                    {docs.map((doc, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                        doc.flagged  ? "bg-red-50 border-red-200"
                        : doc.verified ? "bg-green-50 border-green-200"
                        : doc.uploaded ? "bg-blue-50 border-blue-100"
                                       : "bg-gray-50 border-gray-100"
                      }`}>
                        <span className="text-lg">{doc.flagged ? "⚠️" : doc.verified ? "✅" : doc.uploaded ? "📄" : "⭕"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{doc.name}{doc.required && " *"}</p>
                          {doc.file && <p className="text-xs text-gray-400">{doc.file}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {doc.uploaded && !doc.verified && !doc.flagged && (
                            <>
                              <button onClick={() => setDocs(d => d.map((x, j) => j === i ? {...x, verified: true, flagged: false} : x))}
                                className="text-xs font-bold px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">✓ Verify</button>
                              <button onClick={() => setDocs(d => d.map((x, j) => j === i ? {...x, flagged: true, verified: false} : x))}
                                className="text-xs font-bold px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">⚑ Flag</button>
                            </>
                          )}
                          {!doc.uploaded && (
                            <span className="text-xs text-gray-400 italic">Not uploaded</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enterprise data review */}
                <div>
                  <h2 className={sectionTitle}>🏭 Encoded Enterprise Data</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ["Enterprise Name",    form.enterpriseName],
                      ["Contact Person",     form.contactPerson],
                      ["Office Address",     form.officeAddress],
                      ["Sector",             form.sector],
                      ["Commodity",          form.commodity],
                      ["Employment Class",   form.employmentClass],
                      ["Present Capital",    `PHP ${form.presentCapital}`],
                      ["Year Established",   form.yearEstablished],
                    ].map(([k, v], i) => <ReadonlyField key={i} label={k} value={v} />)}
                  </div>
                </div>

                {/* Staff remarks */}
                <div>
                  <label className={labelCls}>📅 TNA Site Visit Date</label>
                  <input
                    type="date"
                    value={siteVisitDate}
                    onChange={(e) => setSiteVisitDate(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>📝 Staff Remarks / Site Visit Notes</label>
                  <textarea rows={3} value={staffNotes} onChange={e => setStaffNotes(e.target.value)}
                    className={inputCls} placeholder="Enter site visit observations, verification notes, or concerns…" />
                  <textarea rows={2} value={siteVisitNotes} onChange={e => setSiteVisitNotes(e.target.value)}
                    className={`${inputCls} mt-2`} placeholder="Optional: field validation summary for TNA Form 02…" />
                </div>

                {!allDocReviewed && (
                  <InfoBanner icon="⚠️" color="amber"
                    text="All uploaded documents must be verified or flagged before approval." />
                )}

                <div className="flex gap-3">
                  <button onClick={() => persistStaffReview("approved")}
                    disabled={!allowWhenDemo(allDocReviewed)}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: "#059669" }}>
                    ✅ Approve & Proceed to AI Analysis →
                  </button>
                  <button onClick={() => persistStaffReview("needs-revision")}
                    className="px-5 py-3 rounded-xl border border-amber-300 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-all">
                    🔄 Request Resubmission
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 8 — AI Analysis
        ══════════════════════════════════════════════════════════════════ */}
        {step === "analysis" && (
          <div className={MODULE_BODY}>
            <InfoBanner icon="🤖" color="purple" title="AI-Powered Enterprise Analysis"
              text="Generate an intelligent assessment of the enterprise's SETUP eligibility, technology needs, and qualification status." />

            {!analysisResult && !analysisLoading && (
              <button onClick={handleAnalyze}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                style={{ background: "#6A1B9A" }}>
                🔍 Generate AI Analysis
              </button>
            )}
            {analysisLoading && <AILoader label="Generating enterprise analysis" />}

            {analysisResult && (
              <>
                <div className="border border-purple-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-purple-700 border-b border-purple-200">
                    <p className="text-sm font-bold text-white flex items-center gap-2">🤖 AI Assessment Analysis
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">AI Generated</span>
                    </p>
                    <button onClick={handleAnalyze}
                      className="text-xs text-white/80 bg-white/15 border border-white/25 px-3 py-1.5 rounded-lg hover:bg-white/25 transition-colors">
                      🔄 Re-analyze
                    </button>
                  </div>
                  <div className="p-5 bg-purple-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">{analysisResult}</div>
                </div>

                {/* Qualification panel */}
                {qualification && (
                  <div className={`rounded-xl overflow-hidden border-2 ${
                    qualification.status === "qualified"     ? "border-green-400"
                    : qualification.status === "mpex"        ? "border-purple-400"
                                                             : "border-red-400"
                  }`}>
                    <div className={`px-5 py-4 flex items-center gap-3 ${
                      qualification.status === "qualified" ? "bg-green-600"
                      : qualification.status === "mpex"    ? "bg-purple-700"
                                                           : "bg-red-600"
                    } text-white`}>
                      <span className="text-2xl">{qualification.status === "qualified" ? "✅" : qualification.status === "mpex" ? "🔬" : "❌"}</span>
                      <div>
                        <p className="font-bold text-base">
                          {qualification.status === "qualified" ? "Enterprise Qualified for SETUP"
                          : qualification.status === "mpex"     ? "MPEX Pre-requisite Required"
                                                                : "Enterprise Not Qualified"}
                        </p>
                        <p className="text-xs opacity-80">
                          {qualification.status === "qualified" ? "Proceed to generate Project Proposal"
                          : qualification.status === "mpex"     ? "Complete MPEX requirements before SETUP enrollment"
                                                                : "Does not meet minimum SETUP criteria"}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 bg-white space-y-3">
                      {qualification.reasons?.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span>{r.ok ? "✅" : "⚠️"}</span>
                          <span className={`text-sm ${r.ok ? "text-green-700" : "text-amber-700"}`}>{r.text}</span>
                        </div>
                      ))}
                      {qualification.requirements?.length > 0 && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100 space-y-2">
                          <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                            {qualification.status === "mpex" ? "MPEX Pre-requisite Requirements:" : "Additional Requirements:"}
                          </p>
                          {qualification.requirements.map((r, i) => (
                            <div key={i} className="flex gap-2 text-xs text-purple-700"><span>📋</span><span>{r}</span></div>
                          ))}
                        </div>
                      )}
                      {qualification.labTests?.length > 0 && (
                        <div className="p-3 bg-teal-50 rounded-lg border border-teal-100 space-y-2">
                          <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">Laboratory Testing Required:</p>
                          {qualification.labTests.map((t, i) => (
                            <div key={i} className="flex gap-2 text-xs text-teal-700"><span>🔬</span><span>{t}</span></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep("staff-review")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
                  <button onClick={() => setStep("reports")} disabled={!allowWhenDemo(!!qualification)}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: DOST_BLUE }}>
                    Proceed to Reports →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 9 — Reports
        ══════════════════════════════════════════════════════════════════ */}
        {step === "reports" && (
          <div className={MODULE_BODY}>
            <InfoBanner icon="📄" color="blue" title="Auto-Generated Reports"
              text="Generate the Project Proposal from TNA1 data, then generate the RTEC Report once no further changes are needed." />

            {/* Status strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "Staff Verification", done: staffApproved,   icon: "🔍" },
                { label: "Project Proposal",   done: !!proposalContent, icon: "📋" },
                { label: "RTEC Report",        done: !!rtecContent,   icon: "📊" },
              ].map((s, i) => (
                <div key={i} className={`text-center p-4 rounded-xl border ${s.done ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}>
                  <div className="text-2xl">{s.icon}</div>
                  <p className="text-xs font-bold text-gray-700 mt-1">{s.label}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {s.done ? "Complete ✓" : "Pending"}
                  </span>
                </div>
              ))}
            </div>

            {/* Project Proposal */}
            {!proposalContent && (
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <h2 className={sectionTitle}>📋 Project Proposal</h2>
                <p className="text-sm text-gray-500">Auto-generated from TNA1 enterprise data and AI analysis. Review the analysis result first, then generate.</p>
                {proposalLoading
                  ? <AILoader label="Generating Project Proposal" />
                  : <button onClick={handleGenerateProposal} disabled={!allowWhenDemo(!!analysisResult)}
                      className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                      style={{ background: DOST_BLUE }}>
                      📋 Generate Project Proposal
                    </button>
                }
              </div>
            )}
            {proposalContent && <ReportViewer title="Project Proposal" content={proposalContent} color="#1565C0" badge="Auto-Generated" />}

            {/* RTEC Report */}
            {proposalContent && !rtecContent && (
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <h2 className={sectionTitle}>📊 RTEC Evaluation Report</h2>
                <InfoBanner icon="💡" color="amber" text="Review the Project Proposal above. If no more changes are needed, generate the RTEC Report." />
                {rtecLoading
                  ? <AILoader label="Generating RTEC Report" />
                  : <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={handleGenerateRTEC}
                        className="flex-1 min-h-11 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                        style={{ background: "#00695C" }}>
                        📊 Generate RTEC Report — No More Changes
                      </button>
                      <button onClick={() => setProposalContent(null)}
                        className="min-h-11 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm whitespace-nowrap">
                        ✏ Edit Proposal
                      </button>
                    </div>
                }
              </div>
            )}
            {rtecContent && <ReportViewer title="RTEC Evaluation Report" content={rtecContent} color="#00695C" badge="Auto-Generated" />}

            {/* Completion banner */}
            {rtecContent && (
              <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="text-3xl shrink-0">🎉</span>
                  <div className="min-w-0">
                    <p className="font-black text-green-800 text-base">TNA1 Module Complete!</p>
                    <p className="text-sm text-green-600">All reports generated. Proceed to TNA2 Technical Report.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSubmitSuccess?.()}
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 min-h-11 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ background: "#059669" }}
                >
                  ▶ Proceed to TNA2
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}