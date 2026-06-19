/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  CheckCircle,
  Upload,
  X,
  AlertCircle,
  Eye,
  ChevronRight,
  Shield,
  Paperclip,
  ClipboardCheck,
  Banknote,
  UserCheck,
  Info,
} from "lucide-react";
import { applicantStore, Applicant } from "../store/applicantStore";
import { DOST_REGION_12_OFFICE, REGION_12_LABEL, REGION_12_PROVINCES } from "../constants/region12";
import { AuthUser, authStore } from "../store/authStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { StaffApplicantPicker, StaffApplicantBanner } from "./StaffApplicantPicker";
import { buildLoiAdditionalFromApplicant } from "../utils/applicantPrefill";
import { api, ApiError } from "../api/client";
import { aiGenerateErrorMessage } from "../utils/apiErrors";
import type { LoiDocumentResponse } from "../api/types";
import {
  buildLoiGenerationPayload,
  buildLocalLoiDocument,
} from "../utils/loiLetter";
import { LoiDocumentPreview } from "./LoiDocumentPreview";

interface LetterOfIntentProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

type StepId =
  | "review"
  | "additional"
  | "validation"
  | "general-agreement"
  | "production-plan"
  | "commitment-refund"
  | "complete";

const STEPS: { id: StepId; label: string; icon: React.ReactNode }[] = [
  { id: "review", label: "Review Info", icon: <UserCheck className="w-4 h-4" /> },
  { id: "additional", label: "Project Details", icon: <FileText className="w-4 h-4" /> },
  { id: "validation", label: "Validation", icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: "general-agreement", label: "General Agreement", icon: <Shield className="w-4 h-4" /> },
  { id: "production-plan", label: "Production Plan", icon: <Paperclip className="w-4 h-4" /> },
  { id: "commitment-refund", label: "Commitment of Refund", icon: <Banknote className="w-4 h-4" /> },
  { id: "complete", label: "Generated LOI", icon: <Eye className="w-4 h-4" /> },
];

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";
const sectionTitle =
  "text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2";

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="w-full border border-gray-100 bg-blue-50/40 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 font-medium min-h-[40px]">
        {value || <span className="text-gray-300 font-normal">—</span>}
      </div>
    </div>
  );
}

function StepHeader({ current, steps }: { current: StepId; steps: typeof STEPS }) {
  const currentIdx = steps.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active
                  ? "bg-white text-blue-900 shadow-sm"
                  : done
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {done ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ValidationRow({ label, value, passed }: { label: string; value: string; passed: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
        {passed ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm mt-0.5 truncate ${passed ? "text-gray-800" : "text-red-500 italic"}`}>
          {value || "Missing — please update in previous steps"}
        </p>
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
        {passed ? "OK" : "MISSING"}
      </span>
    </div>
  );
}

export function LetterOfIntent({ user, onSubmitSuccess }: LetterOfIntentProps = {}) {
  const { applicant, isStaff } = useStaffApplicant(user);
  const [step, setStep] = useState<StepId>("review");

  const [additional, setAdditional] = useState({
    dateEstablished: "",
    tinNumber: "",
    province: "",
    zipCode: "",
    registrationType: "",
    registrationNumber: "",
    productServices: "",
    projectDescription: "",
    expectedOutcome: "",
    budget: "",
    timeline: "",
  });

  const [generalAgreement, setGeneralAgreement] = useState({
    agreeTerms: false,
    agreeAccuracy: false,
    agreeCooperate: false,
    agreeRefund: false,
    signature: "",
    signedDate: new Date().toISOString().split("T")[0],
  });

  const [productionPlanFile, setProductionPlanFile] = useState<File | null>(null);
  const [productionPlanNotes, setProductionPlanNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [commitmentRefund, setCommitmentRefund] = useState({
    approvedAmount: "",
    repaymentTerm: "",
    monthlyAmortization: "",
    startDate: "",
    agreeRefundTerms: false,
    agreeInterestFree: false,
    agreePDC: false,
    agreePenalty: false,
    commitSignature: "",
    commitDate: new Date().toISOString().split("T")[0],
  });

  const [loiDocument, setLoiDocument] = useState<LoiDocumentResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const loadApplicantData = (app: Applicant | null) => {
    if (!app) return;
    setAdditional((prev) => buildLoiAdditionalFromApplicant(app, prev));

    const saved = app.moduleData?.loiDocument as LoiDocumentResponse | undefined;
    if (saved?.bodyParagraphs?.length) {
      setLoiDocument(saved);
      setStep("complete");
      if (saved.signature) {
        setGeneralAgreement((prev) => ({
          ...prev,
          signature: saved.signature.typedName || prev.signature,
          signedDate: saved.signature.dateSigned || prev.signedDate,
          agreeTerms: true,
          agreeAccuracy: true,
          agreeCooperate: true,
          agreeRefund: true,
        }));
      }
      const md = app.moduleData ?? {};
      if (md.commitmentAmount || md.repaymentTerm) {
        setCommitmentRefund((prev) => ({
          ...prev,
          approvedAmount: String(md.commitmentAmount ?? prev.approvedAmount),
          repaymentTerm: String(md.repaymentTerm ?? prev.repaymentTerm),
          agreeRefundTerms: true,
          agreeInterestFree: true,
          agreePDC: true,
          agreePenalty: true,
          commitSignature: saved.signature?.typedName || prev.commitSignature,
        }));
      }
    } else {
      setLoiDocument(null);
      setStep("review");
    }
  };

  useEffect(() => {
    loadApplicantData(applicant);
  }, [applicant?.id]);

  const setAdd = (k: string, v: string) => setAdditional((prev) => ({ ...prev, [k]: v }));
  const setGA = (k: string, v: boolean | string) => setGeneralAgreement((prev) => ({ ...prev, [k]: v }));
  const setCR = (k: string, v: boolean | string) => setCommitmentRefund((prev) => ({ ...prev, [k]: v }));

  const validationChecks = [
    { label: "Applicant Name", value: applicant?.applicantName ?? "", passed: !!(applicant?.applicantName) },
    { label: "Designation / Position", value: applicant?.designation ?? "", passed: !!(applicant?.designation) },
    { label: "Enterprise Name", value: applicant?.enterpriseName ?? "", passed: !!(applicant?.enterpriseName) },
    { label: "Contact Number", value: applicant?.contactNumber ?? "", passed: !!(applicant?.contactNumber) },
    { label: "Email Address", value: applicant?.emailAddress ?? "", passed: !!(applicant?.emailAddress) },
    { label: "Region", value: applicant?.region ?? "", passed: !!(applicant?.region) },
    { label: "Business Type", value: applicant?.businessType ?? "", passed: !!(applicant?.businessType) },
    { label: "MSME Size", value: applicant?.msmeSize ?? "", passed: !!(applicant?.msmeSize) },
    { label: "TIN Number", value: additional.tinNumber, passed: !!(additional.tinNumber) },
    { label: "Date Established", value: additional.dateEstablished, passed: !!(additional.dateEstablished) },
    { label: "Registration Type", value: additional.registrationType, passed: !!(additional.registrationType) },
    { label: "Registration Number", value: additional.registrationNumber, passed: !!(additional.registrationNumber) },
    { label: "Products / Services", value: additional.productServices, passed: !!(additional.productServices) },
    { label: "Project Description", value: additional.projectDescription, passed: !!(additional.projectDescription) },
    { label: "Expected Outcome", value: additional.expectedOutcome, passed: !!(additional.expectedOutcome) },
    { label: "Estimated Budget", value: additional.budget, passed: !!(additional.budget) },
    { label: "Project Timeline", value: additional.timeline, passed: !!(additional.timeline) },
  ];

  const allValidationPassed = validationChecks.every((c) => c.passed);

  const generalAgreementComplete =
    generalAgreement.agreeTerms &&
    generalAgreement.agreeAccuracy &&
    generalAgreement.agreeCooperate &&
    generalAgreement.agreeRefund &&
    generalAgreement.signature.trim().length > 2;

  const productionPlanComplete =
    !!productionPlanFile || !!(applicant?.moduleData?.productionPlanFile);

  const commitmentComplete =
    commitmentRefund.agreeRefundTerms &&
    commitmentRefund.agreeInterestFree &&
    commitmentRefund.agreePDC &&
    commitmentRefund.agreePenalty &&
    commitmentRefund.commitSignature.trim().length > 2 &&
    !!(commitmentRefund.approvedAmount) &&
    !!(commitmentRefund.repaymentTerm) &&
    !!(commitmentRefund.startDate);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProductionPlanFile(file);
  };

  const buildCurrentPayload = () => {
    if (!applicant) return null;
    return buildLoiGenerationPayload(
      applicant,
      additional,
      {
        approvedAmount: commitmentRefund.approvedAmount,
        repaymentTerm: commitmentRefund.repaymentTerm,
      },
      {
        signature: generalAgreement.signature,
        signedDate: generalAgreement.signedDate,
      },
      productionPlanFile?.name ?? String(applicant.moduleData?.productionPlanFile ?? ""),
    );
  };

  const generateLoiDocument = async () => {
    const payload = buildCurrentPayload();
    if (!payload || generating) return null;

    setGenerating(true);
    setGenerateError(null);

    let document: LoiDocumentResponse;
    try {
      document = await api.generateLoi(payload);
      if (!document.aiGenerated) {
        setGenerateError(
          "Letter generated using the standard template. Set ANTHROPIC_API_KEY on the backend for AI-drafted paragraphs.",
        );
      }
    } catch (err) {
      if (err instanceof ApiError && err.status < 500) {
        setGenerateError(aiGenerateErrorMessage(err, "Could not generate letter. Please check your entries and try again."));
        setGenerating(false);
        return null;
      }
      document = buildLocalLoiDocument(payload);
      setGenerateError(
        "Backend unavailable — generated from template. Run npm run backend for server-side generation.",
      );
    }

    setLoiDocument(document);
    setGenerating(false);
    return document;
  };

  const persistLoiDocument = (document: LoiDocumentResponse) => {
    if (!applicant) return;
    applicantStore.update(applicant.id, {
      currentModule: "letter-of-intent",
      moduleData: {
        ...applicant.moduleData,
        dateEstablished: additional.dateEstablished,
        province: additional.province,
        zipCode: additional.zipCode,
        postalCode: additional.zipCode,
        productServices: additional.productServices,
        projectDescription: additional.projectDescription,
        budget: additional.budget,
        timeline: additional.timeline,
        tinNumber: additional.tinNumber,
        registrationType: additional.registrationType,
        registrationNumber: additional.registrationNumber,
        expectedOutcome: additional.expectedOutcome,
        productionPlanFile: productionPlanFile?.name ?? applicant.moduleData?.productionPlanFile,
        commitmentAmount: commitmentRefund.approvedAmount,
        repaymentTerm: commitmentRefund.repaymentTerm,
        loiSubmittedAt: new Date().toISOString(),
        loiDocument: document,
      },
    });
    setApplicant(
      applicantStore.getById(applicant.id) ?? {
        ...applicant,
        moduleData: { ...applicant.moduleData, loiDocument: document },
      },
    );
  };

  const handleFinalSubmit = async () => {
    if (!applicant || generating) return;
    const document = await generateLoiDocument();
    if (!document) return;
    persistLoiDocument(document);
    setStep("complete");
  };

  const handleRegenerate = async () => {
    const document = await generateLoiDocument();
    if (!document) return;
    persistLoiDocument(document);
  };

  const DOST_BLUE = "#0C2461";
  const DOST_MID = "#1a3a7a";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* ── Header ── */}
        <div className="p-6 text-white" style={{ background: `linear-gradient(135deg,${DOST_BLUE} 0%,${DOST_MID} 100%)` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-blue-800 font-black text-sm">ai</span>
            </div>
            <div>
              <h1 className="text-xl font-black">Letter of Intent</h1>
              <p className="text-white/60 text-sm">Submit your formal intent to participate in the SETUP Program</p>
            </div>
          </div>
          <StepHeader current={step} steps={STEPS} />
          <StaffApplicantPicker user={user} label="Review applicant LOI" />
        </div>
        <StaffApplicantBanner user={user} />

        {/* ────────────────────────────────────────────────────────────────────
            STEP 1 — Review Auto-filled Info
        ──────────────────────────────────────────────────────────────────── */}
        {step === "review" && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-0.5">Auto-filled from Pre-Screening / Registration</p>
                <p className="text-blue-600">
                  Fields highlighted in blue were pulled from your submitted pre-screening data.
                  Only white-background fields are editable here.
                </p>
              </div>
            </div>

            {applicant ? (
              <>
                {/* Enterprise Information */}
                <div>
                  <h2 className={sectionTitle}>
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    Enterprise Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReadonlyField label="Applicant Name" value={applicant.applicantName} />
                    <ReadonlyField label="Position / Designation" value={applicant.designation} />
                    <div className="sm:col-span-2">
                      <ReadonlyField label="Enterprise Name" value={applicant.enterpriseName} />
                    </div>
                    <ReadonlyField label="Contact Number" value={applicant.contactNumber} />
                    <ReadonlyField label="Email Address" value={applicant.emailAddress} />
                    <div>
                      <label className={labelCls}>Date Established *</label>
                      <input type="date" className={inputCls} value={additional.dateEstablished} onChange={(e) => setAdd("dateEstablished", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>TIN Number *</label>
                      <input type="text" className={inputCls} placeholder="XXX-XXX-XXX" value={additional.tinNumber} onChange={(e) => setAdd("tinNumber", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Business Address */}
                <div>
                  <h2 className={sectionTitle}>
                    <FileText className="w-4 h-4 text-blue-500" />
                    Business Address
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <ReadonlyField label="Complete Business Address" value={applicant.address} />
                    </div>
                    <div>
                      <label className={labelCls}>Province *</label>
                      <select className={inputCls} value={additional.province} onChange={(e) => setAdd("province", e.target.value)}>
                        <option value="">Select province</option>
                        {REGION_12_PROVINCES.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <ReadonlyField label="Region" value={applicant.region} />
                    <div>
                      <label className={labelCls}>Zip / Postal Code *</label>
                      <input type="text" className={inputCls} placeholder="e.g. 1600" value={additional.zipCode} onChange={(e) => setAdd("zipCode", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <h2 className={sectionTitle}>
                    <Shield className="w-4 h-4 text-blue-500" />
                    Business Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReadonlyField label="Business Type" value={applicant.businessType} />
                    <ReadonlyField label="Business Sector" value={applicant.businessSector} />
                    <ReadonlyField label="Business Nature" value={applicant.businessNature} />
                    <ReadonlyField label="MSME Size" value={applicant.msmeSize} />
                    <div>
                      <label className={labelCls}>Registration Type *</label>
                      <select className={inputCls} value={additional.registrationType} onChange={(e) => setAdd("registrationType", e.target.value)}>
                        <option value="">Select registration</option>
                        <option>DTI</option>
                        <option>SEC</option>
                        <option>CDA</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Registration Number *</label>
                      <input type="text" className={inputCls} placeholder="e.g. DTI-XXXX-XXXXX" value={additional.registrationNumber} onChange={(e) => setAdd("registrationNumber", e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Products / Services Offered *</label>
                      <textarea rows={3} className={inputCls} placeholder="List your main products or services" value={additional.productServices} onChange={(e) => setAdd("productServices", e.target.value)} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep("additional")}
                  disabled={!additional.dateEstablished || !additional.tinNumber || !additional.registrationType || !additional.registrationNumber || !additional.productServices}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: DOST_BLUE }}
                >
                  Continue to Project Details →
                </button>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <h3 className="font-bold text-amber-800 mb-1">No Pre-Screening Data Found</h3>
                <p className="text-sm text-amber-600">
                  Please complete the Pre-Screening module first. Your enterprise data will be auto-filled here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 2 — Project Details
        ──────────────────────────────────────────────────────────────────── */}
        {step === "additional" && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Provide details about your technology project and how SETUP can support your enterprise growth.
              </p>
            </div>

            <div>
              <h2 className={sectionTitle}>
                <FileText className="w-4 h-4 text-blue-500" />
                Project Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Project Description *</label>
                  <textarea rows={4} className={inputCls} placeholder="Describe your project and how SETUP can help achieve your technology goals" value={additional.projectDescription} onChange={(e) => setAdd("projectDescription", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Expected Outcome *</label>
                  <textarea rows={3} className={inputCls} placeholder="What measurable outcomes do you expect from this assistance?" value={additional.expectedOutcome} onChange={(e) => setAdd("expectedOutcome", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Estimated Budget (PHP) *</label>
                    <input type="text" className={inputCls} placeholder="₱0.00" value={additional.budget} onChange={(e) => setAdd("budget", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Project Timeline *</label>
                    <select className={inputCls} value={additional.timeline} onChange={(e) => setAdd("timeline", e.target.value)}>
                      <option value="">Select timeline</option>
                      <option>1–3 months</option>
                      <option>3–6 months</option>
                      <option>6–12 months</option>
                      <option>More than 12 months</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("review")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">
                ← Back
              </button>
              <button
                onClick={() => setStep("validation")}
                disabled={!additional.projectDescription || !additional.expectedOutcome || !additional.budget || !additional.timeline}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}
              >
                Proceed to Validation →
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 3 — Validation
        ──────────────────────────────────────────────────────────────────── */}
        {step === "validation" && (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <ClipboardCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-0.5">Data Validation Check</p>
                <p>All required fields must be complete before generating your Letter of Intent. Fields marked MISSING must be corrected before proceeding.</p>
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>
                <ClipboardCheck className="w-4 h-4 text-blue-500" />
                Validation Results &nbsp;
                <span className="text-xs font-normal text-gray-400">
                  ({validationChecks.filter((c) => c.passed).length}/{validationChecks.length} complete)
                </span>
              </h2>
              <div className="bg-white border border-gray-100 rounded-xl p-4 divide-y divide-gray-50">
                {validationChecks.map((check) => (
                  <ValidationRow key={check.label} {...check} />
                ))}
              </div>
            </div>

            <div className={`rounded-xl p-4 border-2 ${allValidationPassed ? "bg-green-50 border-green-300" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-3">
                {allValidationPassed
                  ? <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0" />
                  : <AlertCircle className="w-7 h-7 text-red-500 flex-shrink-0" />}
                <div>
                  <p className={`font-bold ${allValidationPassed ? "text-green-800" : "text-red-700"}`}>
                    {allValidationPassed
                      ? "All fields validated — ready to proceed!"
                      : `${validationChecks.filter((c) => !c.passed).length} field(s) missing — please go back and complete`}
                  </p>
                  <p className={`text-xs mt-0.5 ${allValidationPassed ? "text-green-600" : "text-red-500"}`}>
                    {allValidationPassed
                      ? "Your LOI data is complete. Proceed to review and sign the General Agreement."
                      : "Return to the previous steps to fill in the missing information."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("additional")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">
                ← Back
              </button>
              <button
                onClick={() => setStep("general-agreement")}
                disabled={!allValidationPassed}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}
              >
                Proceed to General Agreement →
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 4 — General Agreement
        ──────────────────────────────────────────────────────────────────── */}
        {step === "general-agreement" && (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-0.5">General Program Agreement</p>
                <p>Please read each clause carefully. You must check all boxes and provide your e-signature before your Letter of Intent can be generated.</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-5 text-sm text-gray-700 leading-relaxed">
              <div className="text-center border-b border-gray-200 pb-4">
                <p className="font-black text-base text-gray-800">GENERAL AGREEMENT</p>
                <p className="text-gray-500 text-xs mt-1">DOST SETUP 4.0 — Small Enterprise Technology Upgrading Program</p>
              </div>

              <p>
                This Agreement is entered into by and between the <strong>Department of Science and Technology (DOST)</strong> and <strong>{applicant?.enterpriseName ?? "[Enterprise Name]"}</strong>, hereinafter referred to as the "Beneficiary Enterprise."
              </p>
              <p>In consideration of the financial and technical assistance provided under the SETUP program, the Beneficiary Enterprise agrees to the following terms and conditions:</p>

              <div className="space-y-3">
                {[
                  {
                    key: "agreeTerms",
                    title: "1. Compliance with SETUP Guidelines",
                    text: "The Beneficiary Enterprise agrees to comply with all SETUP 4.0 policies, guidelines, implementing rules and regulations issued by DOST and its regional offices. Any violation shall be grounds for termination of assistance and demand for full reimbursement.",
                  },
                  {
                    key: "agreeAccuracy",
                    title: "2. Accuracy of Information",
                    text: "The Beneficiary Enterprise certifies that all information provided in this Letter of Intent and supporting documents is true, accurate, and complete to the best of their knowledge. Any misrepresentation shall be subject to legal action and cancellation of the grant.",
                  },
                  {
                    key: "agreeCooperate",
                    title: "3. Cooperation and Monitoring",
                    text: "The Beneficiary Enterprise agrees to cooperate fully with DOST personnel during monitoring, evaluation, and audit activities, including providing access to financial records, production facilities, and project documentation as required.",
                  },
                  {
                    key: "agreeRefund",
                    title: "4. Refund Obligation",
                    text: "The Beneficiary Enterprise acknowledges that SETUP funds constitute a seed fund subject to repayment under a 0% interest scheme. The enterprise agrees to the scheduled repayment plan and submission of Post-Dated Checks (PDCs) as required by DOST policy.",
                  },
                ].map((clause) => (
                  <label
                    key={clause.key}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      generalAgreement[clause.key as keyof typeof generalAgreement]
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={generalAgreement[clause.key as keyof typeof generalAgreement] as boolean}
                      onChange={(e) => setGA(clause.key, e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-xs mb-1">{clause.title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{clause.text}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Electronic Signature</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Type Your Full Name as Signature *</label>
                    <input
                      type="text"
                      className={`${inputCls} font-semibold italic`}
                      placeholder="e.g. Juan Dela Cruz"
                      value={generalAgreement.signature}
                      onChange={(e) => setGA("signature", e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">Typing your name constitutes your electronic signature</p>
                  </div>
                  <div>
                    <label className={labelCls}>Date Signed *</label>
                    <input type="date" className={inputCls} value={generalAgreement.signedDate} onChange={(e) => setGA("signedDate", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Agreement progress indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`font-bold ${generalAgreementComplete ? "text-green-600" : "text-gray-400"}`}>
                {[generalAgreement.agreeTerms, generalAgreement.agreeAccuracy, generalAgreement.agreeCooperate, generalAgreement.agreeRefund].filter(Boolean).length}/4 clauses agreed
              </span>
              {generalAgreement.signature.trim().length > 2
                ? <span className="text-green-600">· Signature provided ✓</span>
                : <span className="text-gray-400">· Signature required</span>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("validation")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">
                ← Back
              </button>
              <button
                onClick={() => setStep("production-plan")}
                disabled={!generalAgreementComplete}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}
              >
                Sign & Proceed to Production Plan →
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 5 — Production Plan Upload
        ──────────────────────────────────────────────────────────────────── */}
        {step === "production-plan" && (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Paperclip className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-0.5">Production Plan Upload</p>
                <p>Upload your enterprise's production plan document. Accepted formats: PDF, DOC, DOCX, XLS, XLSX (max 10MB). This will be reviewed by DOST evaluators during the assessment stage.</p>
              </div>
            </div>

            <div>
              <h2 className={sectionTitle}>
                <Paperclip className="w-4 h-4 text-blue-500" />
                Upload Production Plan Document
              </h2>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  productionPlanFile
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileChange} />
                {productionPlanFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-green-800">{productionPlanFile.name}</p>
                      <p className="text-xs text-green-600 mt-1">{(productionPlanFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setProductionPlanFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 transition-colors"
                    >
                      <X className="w-3 h-3" /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">Click to upload your Production Plan</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, XLS, XLSX · Max 10MB</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                      <Upload className="w-3.5 h-3.5" /> Browse Files
                    </div>
                  </div>
                )}
              </div>

              {/* Guide */}
              <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">What to include in your Production Plan:</p>
                <ul className="space-y-1.5">
                  {[
                    "Current production capacity and output volumes",
                    "Technology gaps or bottlenecks to be addressed by SETUP",
                    "Proposed equipment or technology to be acquired",
                    "Expected increase in production after technology adoption",
                    "Quality assurance and product standards targets",
                    "Employment impact and manpower requirements",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <label className={labelCls}>Additional Notes (Optional)</label>
                <textarea rows={3} className={inputCls} placeholder="Any additional notes about your production plan or technology requirements..." value={productionPlanNotes} onChange={(e) => setProductionPlanNotes(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("general-agreement")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">
                ← Back
              </button>
              <button
                onClick={() => setStep("commitment-refund")}
                disabled={!productionPlanComplete}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}
              >
                Proceed to Commitment of Refund →
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 6 — Commitment of Refund
        ──────────────────────────────────────────────────────────────────── */}
        {step === "commitment-refund" && (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Banknote className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-0.5">Commitment of Refund</p>
                <p>This is a formal letter of agreement confirming your enterprise's commitment to repay the SETUP seed fund under the agreed terms. Read all conditions carefully before signing.</p>
              </div>
            </div>

            {/* Repayment details */}
            <div>
              <h2 className={sectionTitle}>
                <Banknote className="w-4 h-4 text-amber-500" />
                Repayment Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Approved Fund Amount (₱) *</label>
                  <input type="text" className={inputCls} placeholder="e.g. 2,000,000" value={commitmentRefund.approvedAmount} onChange={(e) => setCR("approvedAmount", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Repayment Term *</label>
                  <select className={inputCls} value={commitmentRefund.repaymentTerm} onChange={(e) => setCR("repaymentTerm", e.target.value)}>
                    <option value="">Select term</option>
                    <option value="5 years">5 years (Micro Enterprise)</option>
                    <option value="7 years">7 years (Small Enterprise)</option>
                    <option value="10 years">10 years (Medium Enterprise)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Estimated Monthly Amortization (₱)</label>
                  <input type="text" className={inputCls} placeholder="Enter amount" value={commitmentRefund.monthlyAmortization} onChange={(e) => setCR("monthlyAmortization", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Repayment Start Date *</label>
                  <input type="date" className={inputCls} value={commitmentRefund.startDate} onChange={(e) => setCR("startDate", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Commitment letter body */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-5 text-sm text-gray-700 leading-relaxed">
              <div className="text-center border-b border-gray-200 pb-4">
                <p className="font-black text-base text-gray-800">COMMITMENT OF REFUND</p>
                <p className="text-gray-500 text-xs mt-1">Letter of Agreement — DOST SETUP Seed Fund Repayment</p>
              </div>

              <p>
                I, <strong>{applicant?.applicantName ?? "[Applicant Name]"}</strong>, {applicant?.designation ?? "[Designation]"} of <strong>{applicant?.enterpriseName ?? "[Enterprise Name]"}</strong>, hereby commit and bind myself/our enterprise to the following repayment obligations in connection with the SETUP seed fund assistance:
              </p>

              <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-2 gap-2 text-xs">
                <p><span className="font-semibold text-gray-600">Enterprise:</span> {applicant?.enterpriseName ?? "—"}</p>
                <p><span className="font-semibold text-gray-600">MSME Size:</span> {applicant?.msmeSize ?? "—"}</p>
                <p><span className="font-semibold text-gray-600">Approved Amount:</span> ₱{commitmentRefund.approvedAmount || "___________"}</p>
                <p><span className="font-semibold text-gray-600">Repayment Term:</span> {commitmentRefund.repaymentTerm || "___________"}</p>
                <p><span className="font-semibold text-gray-600">Monthly Amortization:</span> ₱{commitmentRefund.monthlyAmortization || "___________"}</p>
                <p><span className="font-semibold text-gray-600">Start Date:</span> {commitmentRefund.startDate || "___________"}</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: "agreeRefundTerms", text: "1. I/We agree to repay the full approved SETUP seed fund amount within the agreed repayment period as specified above." },
                  { key: "agreeInterestFree", text: "2. I/We understand that the fund is interest-free (0%) for the duration of the repayment term, provided repayment is made on schedule. Late payments may incur applicable penalties." },
                  { key: "agreePDC", text: "3. I/We commit to submit Post-Dated Checks (PDCs) covering the full repayment period to the DOST Region XII Office in Koronadal City prior to the official release of funds." },
                  { key: "agreePenalty", text: "4. I/We acknowledge that failure to repay on time or bouncing of PDCs may result in penalty charges, legal proceedings, and inclusion in the Delinquent Enterprises registry, which shall disqualify the enterprise from all future DOST programs." },
                ].map((clause) => (
                  <label
                    key={clause.key}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      commitmentRefund[clause.key as keyof typeof commitmentRefund]
                        ? "bg-amber-50 border-amber-300"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={commitmentRefund[clause.key as keyof typeof commitmentRefund] as boolean}
                      onChange={(e) => setCR(clause.key, e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0"
                    />
                    <p className="text-xs text-gray-700 leading-relaxed">{clause.text}</p>
                  </label>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Commitment Signature</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Type Full Name as Signature *</label>
                    <input
                      type="text"
                      className={`${inputCls} font-semibold italic`}
                      placeholder="e.g. Juan Dela Cruz"
                      value={commitmentRefund.commitSignature}
                      onChange={(e) => setCR("commitSignature", e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">Typing your name constitutes a legally binding electronic signature</p>
                  </div>
                  <div>
                    <label className={labelCls}>Date Signed *</label>
                    <input type="date" className={inputCls} value={commitmentRefund.commitDate} onChange={(e) => setCR("commitDate", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Commitment progress */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`font-bold ${commitmentComplete ? "text-green-600" : "text-gray-400"}`}>
                {[commitmentRefund.agreeRefundTerms, commitmentRefund.agreeInterestFree, commitmentRefund.agreePDC, commitmentRefund.agreePenalty].filter(Boolean).length}/4 clauses agreed
              </span>
              {commitmentRefund.commitSignature.trim().length > 2
                ? <span className="text-green-600">· Commitment signed ✓</span>
                : <span className="text-gray-400">· Signature required</span>}
            </div>

            <div className="flex gap-3 relative">
              {generating && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-gray-700">Generating your Letter of Intent…</p>
                  </div>
                </div>
              )}
              <button onClick={() => setStep("production-plan")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">
                ← Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={!commitmentComplete || generating}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: "#059669" }}
              >
                {generating ? "Generating Letter of Intent…" : "Sign & Generate Letter of Intent →"}
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 7 — Generated LOI Preview
        ──────────────────────────────────────────────────────────────────── */}
        {step === "complete" && loiDocument && (
          <div className="p-6 space-y-5">
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-5 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h3 className="font-black text-green-800 text-lg">Letter of Intent Generated!</h3>
              <p className="text-sm text-green-600 mt-1">
                Your LOI has been submitted and recorded in the DOST aiSETUP system. Reference: <strong>{applicant?.applicationId}</strong>
              </p>
              {generateError && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  {generateError}
                </p>
              )}
            </div>

            <LoiDocumentPreview
              document={loiDocument}
              applicationId={applicant?.applicationId}
            />

            {/* Summary strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-green-700">General Agreement</p>
                <p className="text-xs text-green-500 mt-0.5">Signed · {generalAgreement.signedDate}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <Paperclip className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-blue-700">Production Plan</p>
                <p className="text-xs text-blue-500 mt-0.5 truncate px-2">
                  {productionPlanFile?.name ?? String(applicant?.moduleData?.productionPlanFile ?? "Uploaded")}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                <Banknote className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-amber-700">Commitment of Refund</p>
                <p className="text-xs text-amber-500 mt-0.5">₱{commitmentRefund.approvedAmount} · {commitmentRefund.repaymentTerm}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 print:hidden">
              <button
                type="button"
                onClick={() => onSubmitSuccess?.()}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                style={{ background: "#059669" }}
              >
                Continue to Submit Requirements →
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm disabled:opacity-40"
              >
                {generating ? "Regenerating…" : "Regenerate Letter"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoiDocument(null);
                  setGenerateError(null);
                  setStep("review");
                  if (applicant) {
                    const md = { ...applicant.moduleData };
                    delete md.loiDocument;
                    delete md.loiSubmittedAt;
                    applicantStore.update(applicant.id, { moduleData: md });
                    setApplicant({ ...applicant, moduleData: md });
                  }
                }}
                className="text-sm text-gray-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
