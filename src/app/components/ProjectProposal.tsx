/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import {
  Save,
  Sparkles,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  Upload,
  Building2,
  MapPin,
  TrendingUp,
  Cog,
  Recycle,
  Banknote,
  Shield,
  Eye,
  Info,
} from "lucide-react";
import { EditableTableResponsive } from "./ui/editable-table-responsive";
import { AuthUser } from "../store/authStore";
import { applicantStore, Applicant } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { StaffApplicantPicker, StaffApplicantBanner } from "./StaffApplicantPicker";
import { ModuleFormHeader } from "./ModuleFormHeader";
import { formatFormMention } from "../constants/setupForms";
import { moduleStepPillClass, MODULE_HEADER, MODULE_BODY, ACTION_ROW } from "./moduleTheme";
import { api, ApiError } from "../api/client";
import type {
  ProjectProposalAttachment,
  ProjectProposalAttachmentKind,
  ProjectProposalBudgetRow,
  ProjectProposalDocumentResponse,
  ProjectProposalForm,
  ProjectProposalRiskRow,
} from "../api/types";
import {
  applyGeneratedDocument,
  buildLocalProjectProposalDocument,
  buildProjectProposalGenerationPayload,
  defaultExpectedOutputBullets,
  extractProposalFieldSuggestion,
  getProjectProposalAttachments,
  getProjectProposalForm,
  getProjectProposalStored,
  PROPOSAL_ATTACHMENT_LABELS,
  saveProjectProposalDraft,
  submitProjectProposal,
  sumBudgetItems,
  validateProjectProposalSubmit,
} from "../utils/projectProposal";
import type { ProposalAiField } from "../utils/projectProposal";
import { ProjectProposalPreview, printProjectProposal } from "./ProjectProposalPreview";
import { notifyProjectProposalSubmitted } from "../utils/notificationHelpers";
import { aiGenerateErrorMessage } from "../utils/apiErrors";
import { aiGenerateNotice } from "../utils/demoMode";
import { getPublishedTna2 } from "../utils/tnaForm02";
import { applicantAiContext, useAiFieldSuggest } from "../utils/aiAssist";
import {
  AiAssistNotice,
  AiAssistStringList,
  AiAssistTextarea,
} from "./AiAssistField";

const DOST_BLUE = "#0C2461";
const DOST_MID = "#1a3a7a";

type StepId =
  | "cover"
  | "company"
  | "site-ops"
  | "marketing"
  | "technology"
  | "waste"
  | "financial"
  | "risk"
  | "preview";

const STEPS: { id: StepId; label: string; icon: ReactNode }[] = [
  { id: "cover", label: "Cover", icon: <FileText className="w-4 h-4" /> },
  { id: "company", label: "Company Profile", icon: <Building2 className="w-4 h-4" /> },
  { id: "site-ops", label: "Plant & Materials", icon: <MapPin className="w-4 h-4" /> },
  { id: "marketing", label: "Marketing", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "technology", label: "Technology", icon: <Cog className="w-4 h-4" /> },
  { id: "waste", label: "Waste", icon: <Recycle className="w-4 h-4" /> },
  { id: "financial", label: "Financial", icon: <Banknote className="w-4 h-4" /> },
  { id: "risk", label: "Risk", icon: <Shield className="w-4 h-4" /> },
  { id: "preview", label: "Preview", icon: <Eye className="w-4 h-4" /> },
];

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";
const sectionTitle =
  "text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2";

function StepHeader({ current }: { current: StepId }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <div className={moduleStepPillClass({ active, done, locked: false })}>
              {done ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              ) : (
                s.icon
              )}
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

interface ProjectProposalProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function inputClsExtra(extra = "") {
  return `${inputCls} ${extra}`.trim();
}

function AttachmentUpload({
  kind,
  attachment,
  required,
  onUpload,
  onRemove,
}: {
  kind: ProjectProposalAttachmentKind;
  attachment?: ProjectProposalAttachment;
  required?: boolean;
  onUpload: (att: ProjectProposalAttachment) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {PROPOSAL_ATTACHMENT_LABELS[kind]}
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
        </div>
        {attachment && (
          <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:underline">
            Remove
          </button>
        )}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              onUpload({
                id: uid(),
                kind,
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
                dataUrl: String(reader.result ?? ""),
                uploadedAt: new Date().toISOString(),
              });
            };
            reader.readAsDataURL(file);
          }}
        />
        {attachment ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#0C2461]">📎 {attachment.fileName}</p>
            {attachment.mimeType.startsWith("image/") && (
              <img src={attachment.dataUrl} alt={attachment.fileName} className="max-h-32 mx-auto rounded border" />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-500">
            <Upload className="w-5 h-5" />
            <p className="text-xs">Click to upload image or PDF</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TableEditor({
  label,
  headers,
  rows,
  onChange,
}: {
  label: string;
  headers: string[];
  rows: string[][];
  onChange: (rows: string[][]) => void;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <EditableTableResponsive
        columns={headers}
        rows={rows}
        onChange={onChange}
        onAddRow={() => onChange([...rows, Array(headers.length).fill("")])}
        addLabel="Add row"
        deletable
        headerVariant="gray"
      />
    </div>
  );
}

export function ProjectProposal({
  user,
  onSubmitSuccess,
}: ProjectProposalProps = {}) {
  const { applicant, isStaff } = useStaffApplicant(user);

  const [form, setForm] = useState<ProjectProposalForm>(() =>
    getProjectProposalForm(applicant),
  );
  const [attachments, setAttachments] = useState<ProjectProposalAttachment[]>(
    () => getProjectProposalAttachments(applicant),
  );
  const [document, setDocument] = useState<ProjectProposalDocumentResponse | null>(
    () => getProjectProposalStored(applicant)?.document ?? null,
  );
  const [step, setStep] = useState<StepId>("cover");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState("");
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(
    () => getProjectProposalStored(applicant)?.submitted ?? false,
  );

  const { bind: bindAi, notice: aiFieldNotice } = useAiFieldSuggest("project-proposal");

  const aiContext = useMemo(
    () => ({
      ...applicantAiContext(applicant),
      projectTitle: form.projectTitle,
      productsServices: form.productsServices,
      form,
    }),
    [applicant, form],
  );

  const loadApplicant = useCallback((app: Applicant | null) => {
    setForm(getProjectProposalForm(app));
    setAttachments(getProjectProposalAttachments(app));
    const stored = getProjectProposalStored(app);
    setDocument(stored?.document ?? null);
    setSubmitted(stored?.submitted ?? false);
    setSubmitErrors([]);
  }, []);

  useEffect(() => {
    loadApplicant(applicant);
  }, [applicant?.id, loadApplicant]);

  useEffect(() => {
    return applicantStore.subscribe(() => {
      if (applicant) {
        const updated = applicantStore.getById(applicant.id);
        if (updated) loadApplicant(updated);
      }
    });
  }, [applicant?.id, loadApplicant]);

  const patchForm = (patch: Partial<ProjectProposalForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const ai = (field: ProposalAiField) => {
    const bound = bindAi(
      field,
      aiContext,
      (value) => patchForm({ [field]: value } as Partial<ProjectProposalForm>),
      () => {
        if (!applicant) return "";
        const payload = buildProjectProposalGenerationPayload(applicant, form, attachments);
        const doc = buildLocalProjectProposalDocument(payload);
        return extractProposalFieldSuggestion(doc, field, form, payload);
      },
    );
    return {
      ...bound,
      onAiSuggest: applicant ? bound.onAiSuggest : undefined,
    };
  };

  const handleSaveDraft = () => {
    if (!applicant) return;
    saveProjectProposalDraft(applicant.id, form, attachments, document ?? undefined);
    setSaveNotice("Draft saved.");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const setAttachment = (att: ProjectProposalAttachment) => {
    setAttachments((prev) => [...prev.filter((a) => a.kind !== att.kind), att]);
  };

  const removeAttachment = (kind: ProjectProposalAttachmentKind) => {
    setAttachments((prev) => prev.filter((a) => a.kind !== kind));
  };

  const handleGenerate = async () => {
    if (!applicant || generating) return;
    handleSaveDraft();
    const payload = buildProjectProposalGenerationPayload(applicant, form, attachments);
    setGenerating(true);
    setGenerateError(null);

    let doc: ProjectProposalDocumentResponse;
    try {
      doc = await api.generateProjectProposal(payload);
      if (!doc.aiGenerated) {
        const notice = aiGenerateNotice(doc.aiGenerated, "Proposal");
        if (notice) setGenerateError(notice);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status < 500) {
        setGenerateError(aiGenerateErrorMessage(err, "Could not generate proposal."));
        setGenerating(false);
        return;
      }
      doc = buildLocalProjectProposalDocument(payload);
      setGenerateError(
        "Backend unavailable — generated from template. Run npm run backend for server-side generation.",
      );
    }

    const merged = applyGeneratedDocument(applicant.id, doc, form);
    setForm(merged);
    setDocument(doc);
    setStep("preview");
    setGenerating(false);
  };

  const handleSubmit = () => {
    if (!applicant || submitted) return;
    const errors = validateProjectProposalSubmit(form, attachments);
    if (errors.length) {
      setSubmitErrors(errors);
      return;
    }
    submitProjectProposal(applicant.id, form, attachments, document ?? undefined);
    notifyProjectProposalSubmitted(applicant);
    setSubmitted(true);
    onSubmitSuccess?.();
  };

  const updateBudgetItem = (id: string, patch: Partial<ProjectProposalBudgetRow>) => {
    setForm((prev) => ({
      ...prev,
      budgetItems: prev.budgetItems.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const updateRiskRow = (id: string, patch: Partial<ProjectProposalRiskRow>) => {
    setForm((prev) => ({
      ...prev,
      riskRows: prev.riskRows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  };

  const tna2Published = getPublishedTna2(applicant);
  const stored = getProjectProposalStored(applicant);
  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const isFirstStep = stepIdx <= 0;
  const isLastStep = stepIdx >= STEPS.length - 1;

  const goBack = () => {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1].id);
  };

  const goNext = () => {
    if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].id);
  };

  const renderStep = () => {
    switch (step) {
      case "cover":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Project Title</label>
              <input className={inputCls} value={form.projectTitle} onChange={(e) => patchForm({ projectTitle: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Proponent Name</label>
                <input className={inputCls} value={form.proponentName} onChange={(e) => patchForm({ proponentName: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Proponent Address</label>
                <input className={inputCls} value={form.proponentAddress} onChange={(e) => patchForm({ proponentAddress: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Project Cost</label>
                <input className={inputCls} value={form.projectCost} onChange={(e) => patchForm({ projectCost: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Amount Requested from SETUP</label>
                <input className={inputCls} value={form.amountRequested} onChange={(e) => patchForm({ amountRequested: e.target.value })} />
              </div>
            </div>
            <AiAssistTextarea
              label="General Objective"
              value={form.generalObjective}
              onChange={(generalObjective) => patchForm({ generalObjective })}
              {...ai("generalObjective")}
            />
            <AiAssistStringList
              label="Specific Objectives"
              items={form.specificObjectives}
              onChange={(specificObjectives) => patchForm({ specificObjectives })}
              {...ai("specificObjectives")}
            />
          </div>
        );

      case "company":
        return (
          <div className="space-y-6">
            <div>
              <h2 className={sectionTitle}>
                <Building2 className="w-4 h-4 text-blue-500" />
                Company Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Firm Name</label><input className={inputCls} value={form.firmName} onChange={(e) => patchForm({ firmName: e.target.value })} /></div>
                <div><label className={labelCls}>Firm Address</label><input className={inputCls} value={form.firmAddress} onChange={(e) => patchForm({ firmAddress: e.target.value })} /></div>
                <div><label className={labelCls}>Contact Person</label><input className={inputCls} value={form.contactPerson} onChange={(e) => patchForm({ contactPerson: e.target.value })} /></div>
                <div><label className={labelCls}>Contact Number</label><input className={inputCls} value={form.contactNumber} onChange={(e) => patchForm({ contactNumber: e.target.value })} /></div>
                <div><label className={labelCls}>Email</label><input className={inputCls} value={form.email} onChange={(e) => patchForm({ email: e.target.value })} /></div>
                <div><label className={labelCls}>Year Established</label><input className={inputCls} value={form.yearEstablished} onChange={(e) => patchForm({ yearEstablished: e.target.value })} /></div>
                <div><label className={labelCls}>Organization Type</label><input className={inputCls} value={form.organizationType} onChange={(e) => patchForm({ organizationType: e.target.value })} /></div>
                <div><label className={labelCls}>Profit / Non-profit</label><input className={inputCls} value={form.profitType} onChange={(e) => patchForm({ profitType: e.target.value })} /></div>
                <div><label className={labelCls}>MSME Size</label><input className={inputCls} value={form.msmeSize} onChange={(e) => patchForm({ msmeSize: e.target.value })} /></div>
                <div><label className={labelCls}>Employees Male / Female</label>
                  <div className="flex gap-2">
                    <input className={inputCls} placeholder="Male" value={form.employeesMale} onChange={(e) => patchForm({ employeesMale: e.target.value })} />
                    <input className={inputCls} placeholder="Female" value={form.employeesFemale} onChange={(e) => patchForm({ employeesFemale: e.target.value })} />
                  </div>
                </div>
                <div><label className={labelCls}>Employees Direct / Indirect</label>
                  <div className="flex gap-2">
                    <input className={inputCls} placeholder="Direct" value={form.employeesDirect} onChange={(e) => patchForm({ employeesDirect: e.target.value })} />
                    <input className={inputCls} placeholder="Indirect" value={form.employeesIndirect} onChange={(e) => patchForm({ employeesIndirect: e.target.value })} />
                  </div>
                </div>
                <div><label className={labelCls}>Registration Office</label><input className={inputCls} value={form.registrationOffice} onChange={(e) => patchForm({ registrationOffice: e.target.value })} /></div>
                <div><label className={labelCls}>Registration Number</label><input className={inputCls} value={form.registrationNumber} onChange={(e) => patchForm({ registrationNumber: e.target.value })} /></div>
                <div><label className={labelCls}>Registration Date</label><input className={inputCls} value={form.registrationDate} onChange={(e) => patchForm({ registrationDate: e.target.value })} /></div>
                <div><label className={labelCls}>Business Permit No.</label><input className={inputCls} value={form.businessPermitNumber} onChange={(e) => patchForm({ businessPermitNumber: e.target.value })} /></div>
                <div><label className={labelCls}>Business Permit Date</label><input className={inputCls} value={form.businessPermitDate} onChange={(e) => patchForm({ businessPermitDate: e.target.value })} /></div>
                <div><label className={labelCls}>Business Activity</label><input className={inputCls} value={form.businessActivity} onChange={(e) => patchForm({ businessActivity: e.target.value })} /></div>
                <div><label className={labelCls}>Priority Sector (Specify)</label><input className={inputCls} value={form.prioritySectorSpecify} onChange={(e) => patchForm({ prioritySectorSpecify: e.target.value })} /></div>
              </div>
              <div className="mt-4"><label className={labelCls}>Products / Services</label><input className={inputCls} value={form.productsServices} onChange={(e) => patchForm({ productsServices: e.target.value })} /></div>
              <AiAssistTextarea
                label="Brief Enterprise Background"
                value={form.enterpriseBackground}
                onChange={(enterpriseBackground) => patchForm({ enterpriseBackground })}
                minHeight="min-h-[100px]"
                {...ai("enterpriseBackground")}
              />
            </div>
            <div>
              <h2 className={sectionTitle}>Management & Organization</h2>
              <AttachmentUpload
                kind="orgChart"
                attachment={attachments.find((a) => a.kind === "orgChart")}
                onUpload={setAttachment}
                onRemove={() => removeAttachment("orgChart")}
              />
              <div className="mt-4">
                <AiAssistTextarea
                  label="Skills and Expertise"
                  value={form.skillsExpertise}
                  onChange={(skillsExpertise) => patchForm({ skillsExpertise })}
                  minHeight="min-h-[100px]"
                  {...ai("skillsExpertise")}
                />
              </div>
              <div className="mt-4">
                <AiAssistTextarea
                  label="Compensation"
                  value={form.compensation}
                  onChange={(compensation) => patchForm({ compensation })}
                  minHeight="min-h-[80px]"
                  {...ai("compensation")}
                />
              </div>
            </div>
          </div>
        );

      case "site-ops":
        return (
          <div className="space-y-6">
            <div>
              <h2 className={sectionTitle}>
                <MapPin className="w-4 h-4 text-blue-500" />
                Plant Site & Location
              </h2>
              <AiAssistTextarea
                label="Site Location Narrative"
                value={form.plantSiteNarrative}
                onChange={(plantSiteNarrative) => patchForm({ plantSiteNarrative })}
                minHeight="min-h-[100px]"
                {...ai("plantSiteNarrative")}
              />
              <div className="mt-4">
                <AttachmentUpload
                  kind="vicinityMap"
                  required
                  attachment={attachments.find((a) => a.kind === "vicinityMap")}
                  onUpload={setAttachment}
                  onRemove={() => removeAttachment("vicinityMap")}
                />
              </div>
            </div>
            <div>
              <h2 className={sectionTitle}>Production Capacity</h2>
              <AiAssistTextarea
                label="Capacity, Volume and Cost of Production"
                value={form.capacityVolumeNarrative}
                onChange={(capacityVolumeNarrative) => patchForm({ capacityVolumeNarrative })}
                minHeight="min-h-[120px]"
                {...ai("capacityVolumeNarrative")}
              />
            </div>
            <div>
              <h2 className={sectionTitle}>Raw Materials</h2>
              <AiAssistTextarea
                label="Narrative"
                value={form.rawMaterialsNarrative}
                onChange={(rawMaterialsNarrative) => patchForm({ rawMaterialsNarrative })}
                minHeight="min-h-[80px]"
                {...ai("rawMaterialsNarrative")}
              />
              <div className="mt-4">
                <TableEditor label="Raw Materials Table" headers={["Item", "Volume / Year", "Source"]} rows={form.rawMaterialsTable} onChange={(rawMaterialsTable) => patchForm({ rawMaterialsTable })} />
              </div>
            </div>
          </div>
        );

      case "marketing":
        return (
          <div className="space-y-4">
            <AiAssistTextarea label="Market Situation" value={form.marketSituation} onChange={(marketSituation) => patchForm({ marketSituation })} {...ai("marketSituation")} />
            <AiAssistTextarea label="Product Demand and Supply" value={form.productDemandSupply} onChange={(productDemandSupply) => patchForm({ productDemandSupply })} {...ai("productDemandSupply")} />
            <TableEditor label="Product Specifications and Price" headers={["Product / Specification", "Price"]} rows={form.productPriceTable} onChange={(productPriceTable) => patchForm({ productPriceTable })} />
            <AiAssistTextarea label="Distribution Channel" value={form.distributionChannel} onChange={(distributionChannel) => patchForm({ distributionChannel })} minHeight="min-h-[60px]" {...ai("distributionChannel")} />
            <AiAssistTextarea label="Competitors" value={form.competitors} onChange={(competitors) => patchForm({ competitors })} minHeight="min-h-[60px]" {...ai("competitors")} />
            <AiAssistStringList label="Market Plans / Strategies" items={form.marketStrategies} onChange={(marketStrategies) => patchForm({ marketStrategies })} {...ai("marketStrategies")} />
          </div>
        );

      case "technology":
        return (
          <div className="space-y-6">
            <div>
              <h2 className={sectionTitle}>
                <Cog className="w-4 h-4 text-blue-500" />
                Production & Equipment
              </h2>
              <AiAssistTextarea
                label="Production Process"
                value={form.productionProcess}
                onChange={(productionProcess) => patchForm({ productionProcess })}
                minHeight="min-h-[100px]"
                {...ai("productionProcess")}
              />
              <div className="mt-4">
                <AiAssistTextarea
                  label="Equipment Narrative"
                  value={form.equipmentNarrative}
                  onChange={(equipmentNarrative) => patchForm({ equipmentNarrative })}
                  minHeight="min-h-[60px]"
                  {...ai("equipmentNarrative")}
                />
              </div>
              <div className="mt-4">
                <TableEditor label="Existing Equipment" headers={["Type", "Quantity", "Year Acquired"]} rows={form.equipmentTable} onChange={(equipmentTable) => patchForm({ equipmentTable })} />
              </div>
            </div>
            <div>
              <h2 className={sectionTitle}>S&T Intervention</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <AiAssistTextarea label="Problem / Constraint" value={form.interventionProblem} onChange={(interventionProblem) => patchForm({ interventionProblem })} minHeight="min-h-[60px]" {...ai("interventionProblem")} />
                <AiAssistTextarea label="Proposed Intervention" value={form.interventionProposed} onChange={(interventionProposed) => patchForm({ interventionProposed })} minHeight="min-h-[60px]" {...ai("interventionProposed")} />
                <div><label className={labelCls}>Equipment</label><input className={inputCls} value={form.interventionEquipment} onChange={(e) => patchForm({ interventionEquipment: e.target.value })} /></div>
                <AiAssistTextarea label="Expected Impact" value={form.interventionImpact} onChange={(interventionImpact) => patchForm({ interventionImpact })} minHeight="min-h-[60px]" {...ai("interventionImpact")} />
              </div>
              <div className="mt-4">
                <AttachmentUpload kind="plantLayout" required attachment={attachments.find((a) => a.kind === "plantLayout")} onUpload={setAttachment} onRemove={() => removeAttachment("plantLayout")} />
              </div>
              <div className="mt-4">
                <TableEditor label="Intervention Cost Table" headers={["Equipment", "Qty", "Unit Cost", "Total"]} rows={form.interventionCostTable} onChange={(interventionCostTable) => patchForm({ interventionCostTable })} />
              </div>
            </div>
            <div className="rounded-xl border-2 border-[#0C2461]/15 bg-blue-50/40 p-5 space-y-4">
              <h2 className={sectionTitle}>
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Expected Output & Measured Results
              </h2>
              <p className="text-xs text-gray-600 -mt-2">
                Per {formatFormMention("001")} — list measurable outcomes after the intervention (e.g. productivity increase, quality improvement, reject rate, additional clients served).
              </p>
              <AiAssistStringList
                label="Expected Output / Impact"
                items={form.expectedOutputBullets}
                onChange={(expectedOutputBullets) => patchForm({ expectedOutputBullets })}
                hint="Use quantifiable results where possible (%, volume, number of clients)."
                placeholders={defaultExpectedOutputBullets(applicant?.enterpriseName ?? "the enterprise")}
                {...ai("expectedOutputBullets")}
              />
            </div>
            <div>
              <h2 className={sectionTitle}>Implementation Details</h2>
              <TableEditor label="Equipment Fabricators" headers={["Name", "Address", "Contact"]} rows={form.fabricatorTable} onChange={(fabricatorTable) => patchForm({ fabricatorTable })} />
              <div className="mt-4">
                <TableEditor label="Schedule of Activities" headers={["Activity", "Timeline"]} rows={form.scheduleTable} onChange={(scheduleTable) => patchForm({ scheduleTable })} />
              </div>
            </div>
          </div>
        );

      case "waste":
        return (
          <AiAssistTextarea
            label="Waste Management / Disposal"
            value={form.wasteManagement}
            onChange={(wasteManagement) => patchForm({ wasteManagement })}
            minHeight="min-h-[120px]"
            hint="Describe segregation, recycling, and proper disposal of process waste."
            {...ai("wasteManagement")}
          />
        );

      case "financial":
        return (
          <div className="space-y-4">
            <TableEditor label="Liquidity Ratio (Current Ratio)" headers={["Year", "Current Assets", "Current Liabilities", "Ratio"]} rows={form.liquidityRatioTable} onChange={(liquidityRatioTable) => patchForm({ liquidityRatioTable })} />
            <TableEditor label="Quick Ratio" headers={["Year", "Current Assets", "Inventory", "Current Liabilities", "Ratio"]} rows={form.quickRatioTable} onChange={(quickRatioTable) => patchForm({ quickRatioTable })} />
            <TableEditor label="Return on Investment" headers={["Year", "Net Income", "Investment", "ROI"]} rows={form.roiTable} onChange={(roiTable) => patchForm({ roiTable })} />
            <div><AiAssistTextarea label="Financial Analysis Narrative" value={form.financialAnalysis} onChange={(financialAnalysis) => patchForm({ financialAnalysis })} {...ai("financialAnalysis")} /></div>
            <div><label className={labelCls}>Financial Constraints Note</label><input className={inputCls} value={form.financialConstraintsNote} onChange={(e) => patchForm({ financialConstraintsNote: e.target.value })} /></div>
            <AttachmentUpload kind="financialReports" attachment={attachments.find((a) => a.kind === "financialReports")} onUpload={setAttachment} onRemove={() => removeAttachment("financialReports")} />
            <div>
              <label className={labelCls}>Budgetary Requirement</label>
              <div className="space-y-2">
                {form.budgetItems.map((item) => (
                  <div key={item.id}>
                    <div className="md:hidden rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Item</label>
                        <input className={inputCls} placeholder="Item" value={item.item} onChange={(e) => updateBudgetItem(item.id, { item: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Qty</label>
                          <input className={inputCls} placeholder="Qty" value={item.qty} onChange={(e) => updateBudgetItem(item.id, { qty: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Unit cost</label>
                          <input className={inputCls} placeholder="Unit cost" value={item.unitCost} onChange={(e) => updateBudgetItem(item.id, { unitCost: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">SETUP share</label>
                          <input className={inputCls} placeholder="SETUP share" value={item.setupShare} onChange={(e) => updateBudgetItem(item.id, { setupShare: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Total</label>
                          <input className={inputCls} placeholder="Total" value={item.total} onChange={(e) => updateBudgetItem(item.id, { total: e.target.value })} />
                        </div>
                      </div>
                      <button type="button" onClick={() => patchForm({ budgetItems: form.budgetItems.filter((b) => b.id !== item.id) })} className="text-xs text-red-500 font-semibold flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Remove line
                      </button>
                    </div>
                    <div className="hidden md:grid grid-cols-6 gap-2 items-center">
                      <input className={inputClsExtra("col-span-2")} placeholder="Item" value={item.item} onChange={(e) => updateBudgetItem(item.id, { item: e.target.value })} />
                      <input className={inputCls} placeholder="Qty" value={item.qty} onChange={(e) => updateBudgetItem(item.id, { qty: e.target.value })} />
                      <input className={inputCls} placeholder="Unit cost" value={item.unitCost} onChange={(e) => updateBudgetItem(item.id, { unitCost: e.target.value })} />
                      <input className={inputCls} placeholder="SETUP share" value={item.setupShare} onChange={(e) => updateBudgetItem(item.id, { setupShare: e.target.value })} />
                      <div className="flex gap-1">
                        <input className={inputCls} placeholder="Total" value={item.total} onChange={(e) => updateBudgetItem(item.id, { total: e.target.value })} />
                        <button type="button" onClick={() => patchForm({ budgetItems: form.budgetItems.filter((b) => b.id !== item.id) })} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => patchForm({ budgetItems: [...form.budgetItems, { id: uid(), item: "", qty: "1", unitCost: "", setupShare: "", total: "" }] })} className="text-xs text-[#0C2461] font-semibold flex items-center gap-1"><Plus className="w-3 h-3" /> Add budget line</button>
                <p className="text-xs text-gray-500">Budget total: {sumBudgetItems(form.budgetItems) || "—"}</p>
              </div>
            </div>
            <TableEditor label="Proposed Refund Schedule" headers={form.refundSchedule[0] ?? ["Months", "Y1", "Y2", "Y3", "Y4", "Total"]} rows={form.refundSchedule.slice(1)} onChange={(body) => patchForm({ refundSchedule: [form.refundSchedule[0], ...body] })} />
          </div>
        );

      case "risk":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Three-column risk management table per {formatFormMention("001")}.</p>
            {form.riskRows.map((row) => (
              <div key={row.id} className="grid sm:grid-cols-3 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div><label className={labelCls}>Risk</label><textarea className={inputClsExtra("min-h-[60px]")} value={row.risk} onChange={(e) => updateRiskRow(row.id, { risk: e.target.value })} /></div>
                <div><label className={labelCls}>Assumption</label><textarea className={inputClsExtra("min-h-[60px]")} value={row.assumption} onChange={(e) => updateRiskRow(row.id, { assumption: e.target.value })} /></div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Management Plan</label>
                  <textarea className={inputClsExtra("min-h-[60px] flex-1")} value={row.plan} onChange={(e) => updateRiskRow(row.id, { plan: e.target.value })} />
                  <button type="button" onClick={() => patchForm({ riskRows: form.riskRows.filter((r) => r.id !== row.id) })} className="text-xs text-red-500 self-end">Remove</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => patchForm({ riskRows: [...form.riskRows, { id: uid(), risk: "", assumption: "", plan: "" }] })} className="text-xs text-[#0C2461] font-semibold flex items-center gap-1"><Plus className="w-3 h-3" /> Add risk row</button>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!applicant || generating}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: "#7c3aed" }}
              >
                <Sparkles className="w-4 h-4" />
                {generating ? "Generating…" : "Generate with AI"}
              </button>
              <button type="button" onClick={() => printProjectProposal(form, document, attachments, applicant?.applicationId)} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#0C2461]/30 text-[#0C2461] text-sm font-bold hover:bg-blue-50">
                <FileText className="w-4 h-4" /> Print / PDF
              </button>
            </div>
            {generateError && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{generateError}</p>
            )}
            <ProjectProposalPreview
              form={form}
              document={document}
              attachments={attachments}
              applicationId={applicant?.applicationId}
              aiGenerated={document?.aiGenerated}
              submitted={submitted}
              onPrint={() => printProjectProposal(form, document, attachments, applicant?.applicationId)}
              compact
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className={`${MODULE_HEADER} text-white`}
          style={{ background: `linear-gradient(135deg,${DOST_BLUE} 0%,${DOST_MID} 100%)` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
              <span className="text-blue-800 font-black text-sm">ai</span>
            </div>
            <ModuleFormHeader
              formKey="001"
              subtitle={
                `Module 7${applicant ? ` · ${applicant.enterpriseName} · ${applicant.applicationId}` : ""}`
              }
            />
          </div>
          <StepHeader current={step} />
          <StaffApplicantPicker user={user} label="Review applicant proposal" />
        </div>

        <StaffApplicantBanner user={user} />

        {!tna2Published && applicant && !isStaff && (
          <div className="mx-6 mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              TNA Form 02 is not yet published. Prefill uses {formatFormMention("tna01")} and registration data.
            </p>
          </div>
        )}

        {submitted && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Project Proposal submitted
            {stored?.submittedAt
              ? ` on ${new Date(stored.submittedAt).toLocaleDateString()}`
              : ""}
            .
          </div>
        )}

        <div className={MODULE_BODY}>
          {step === "cover" && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-0.5">Prefilled from prior modules</p>
                <p className="text-blue-600">
                  Cover fields are pulled from your LOI, TNA forms, and registration. Edit as needed before generating the full proposal.
                </p>
              </div>
            </div>
          )}

          {step === "technology" && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Sparkles className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-0.5">Expected output & AI assist</p>
                <p className="text-blue-600">
                  Complete the <strong>Expected Output & Measured Results</strong> section with quantifiable outcomes.
                  Use <strong>AI Assist</strong> on any narrative field to draft text from your TNA and registration data.
                </p>
              </div>
            </div>
          )}

          {aiFieldNotice && <AiAssistNotice message={aiFieldNotice} />}

          {renderStep()}

          <div className={`${ACTION_ROW} pt-4 border-t border-gray-100`}>
            {!isFirstStep && (
              <button
                type="button"
                onClick={goBack}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm"
              >
                ← Back
              </button>
            )}
            {!isLastStep ? (
              <button
                type="button"
                onClick={() => {
                  handleSaveDraft();
                  goNext();
                }}
                disabled={!applicant}
                className="w-full sm:flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: DOST_BLUE }}
              >
                Continue →
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!applicant}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm disabled:opacity-40 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save draft
                </button>
                {!submitted && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!applicant}
                    className="w-full sm:flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ background: "#059669" }}
                  >
                    <CheckCircle className="w-4 h-4" /> Submit proposal
                  </button>
                )}
              </>
            )}
          </div>

          {saveNotice && (
            <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {saveNotice}
            </p>
          )}
          {submitErrors.length > 0 && (
            <ul className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 list-disc list-inside">
              {submitErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
