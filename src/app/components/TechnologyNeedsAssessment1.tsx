/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 module shell: owns form/table state, draft persistence, AI
 * generation, staff review and director validation, and routes each wizard
 * step to the components in ./tna1/.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AuthUser, isRtecStaff } from "../store/authStore";
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
import { MODULE_HEADER } from "./moduleTheme";
import { appendStaffAssessment } from "../utils/clientAssessment";
import {
  notifyTna1Reviewed,
  notifyTna1Resubmission,
  notifyTna1AwaitingDirector,
  notifyTna1DirectorValidated,
  notifyStaffVerificationRemark,
} from "../utils/notificationHelpers";
import { shouldNotifyRequirementRemark } from "../utils/submissionRequirements";
import { resolveApplicantOfficeId, getOfficeContact } from "../utils/provincialOffice";
import { applicantAiContext, useAiFieldSuggest } from "../utils/aiAssist";
import { AiAssistNotice } from "./AiAssistField";
import { aiGenerateNotice } from "../utils/demoMode";
import { syncTna1FormToBackendBestEffort } from "../utils/applicantPersistence";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";

import type { Tna1Doc, Tna1StepContext, TnaFormState } from "./tna1/stepContext";
import { DOST_BLUE, DOST_MID, STEPS } from "./tna1/tna1Ui";
import { ModuleStepHeader } from "./ModuleWorkflowLayout";
import { RtecReviewCommentPanel } from "./RtecReviewCommentPanel";
import { IdentificationStep } from "./tna1/IdentificationStep";
import { AttachmentAStep } from "./tna1/AttachmentAStep";
import { BenchmarkStep } from "./tna1/BenchmarkStep";
import { ConcernsStep } from "./tna1/ConcernsStep";
import { FinanceHrStep } from "./tna1/FinanceHrStep";
import { ValidationStep } from "./tna1/ValidationStep";
import { CompleteStep } from "./tna1/CompleteStep";
import { StaffReviewStep } from "./tna1/StaffReviewStep";
import { ReportsStep } from "./tna1/ReportsStep";

const DEFAULT_TNA1_DOCS: Tna1Doc[] = [
  { id: "general-agreements", name: "General Agreements", required: true, uploaded: true, verified: false, flagged: false, remark: "", file: "general_agreements.pdf" },
  { id: "undertaking", name: "Undertaking", required: true, uploaded: true, verified: false, flagged: false, remark: "", file: "undertaking_signed.pdf" },
  { id: "enterprise-profile", name: "Enterprise Profile", required: true, uploaded: true, verified: false, flagged: false, remark: "", file: "enterprise_profile.pdf" },
  { id: "benchmark", name: "Benchmark Information", required: true, uploaded: true, verified: false, flagged: false, remark: "", file: "benchmark_data.pdf" },
  { id: "production-plan", name: "Production Plan", required: true, uploaded: false, verified: false, flagged: false, remark: "", file: null },
  { id: "marketing", name: "Marketing", required: true, uploaded: false, verified: false, flagged: false, remark: "", file: null },
  { id: "finance-hr", name: "Finance / Other Concerns", required: false, uploaded: false, verified: false, flagged: false, remark: "", file: null },
];

function hydrateTna1Docs(saved: Record<string, unknown> | undefined | null): Tna1Doc[] {
  const docReview = (saved?.docReview ?? {}) as Record<
    string,
    { status?: string; remark?: string }
  >;
  return DEFAULT_TNA1_DOCS.map((d) => {
    const review = docReview[d.id];
    const status = review?.status;
    return {
      ...d,
      verified: status === "ok",
      flagged: status === "flagged",
      remark: typeof review?.remark === "string" ? review.remark : "",
    };
  });
}

function docsToDocReview(docs: Tna1Doc[]): Record<string, { status: "ok" | "flagged"; remark: string }> {
  const out: Record<string, { status: "ok" | "flagged"; remark: string }> = {};
  for (const d of docs) {
    if (d.verified) out[d.id] = { status: "ok", remark: d.remark ?? "" };
    else if (d.flagged) out[d.id] = { status: "flagged", remark: d.remark ?? "" };
  }
  return out;
}

export function TechnologyNeedsAssessment1({
  user,
  onSubmitSuccess,
}: {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}) {
  const [step, setStep] = useState("identification");
  const [maxReached, setMaxReached] = useState(0);
  const { applicant, isStaff } = useStaffApplicant(user);
  const reviewOnly = isRtecStaff(user?.role);
  const [staffMode, setStaffMode] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");

  const [form, setForm] = useState<TnaFormState>(() => buildInitialTnaForm(null));

  const [tables, setTables] = useState(EMPTY_TNA_TABLES);
  const [applicantSubmitted, setApplicantSubmitted] = useState(false);
  const [tnaGenerating, setTnaGenerating] = useState(false);
  const [tnaGenerateError, setTnaGenerateError] = useState<string | null>(null);
  const [tnaAiGenerated, setTnaAiGenerated] = useState<boolean | null>(null);
  const [staffNotes, setStaffNotes] = useState("");
  const [siteVisitDate, setSiteVisitDate] = useState("");
  const [siteVisitNotes, setSiteVisitNotes] = useState("");
  const [staffApproved, setStaffApproved] = useState(false);
  const [directorValidated, setDirectorValidated] = useState(false);
  const [directorValidatedBy, setDirectorValidatedBy] = useState("");
  const [directorValidatedAt, setDirectorValidatedAt] = useState("");

  // ── Document state ───────────────────────────────────────────────────────────
  const [docs, setDocs] = useState<Tna1Doc[]>(() =>
    DEFAULT_TNA1_DOCS.map((d) => ({ ...d })),
  );
  const [notifiedRemarks, setNotifiedRemarks] = useState<Record<string, string>>({});
  const docsRef = useRef(docs);
  const notifiedRemarksRef = useRef(notifiedRemarks);
  docsRef.current = docs;
  notifiedRemarksRef.current = notifiedRemarks;

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

  const formRef = useRef(form);
  const tablesRef = useRef(tables);
  const staffNotesRef = useRef(staffNotes);
  const siteVisitDateRef = useRef(siteVisitDate);
  const siteVisitNotesRef = useRef(siteVisitNotes);
  formRef.current = form;
  tablesRef.current = tables;
  staffNotesRef.current = staffNotes;
  siteVisitDateRef.current = siteVisitDate;
  siteVisitNotesRef.current = siteVisitNotes;

  const set = (k: string, v: unknown) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      formRef.current = next;
      return next;
    });
    scheduleTnaDraft();
  };
  const setT = (key: string, rows: string[][]) => {
    setTables((t) => {
      const next = { ...t, [key]: rows };
      tablesRef.current = next;
      return next;
    });
    scheduleTnaDraft();
  };

  const loadApplicantData = useCallback((app: Applicant | null) => {
    if (!app) return;
    const saved = app?.moduleData?.tna1;
    const merged = mergeTnaSavedData(app, saved);
    setForm(merged.form);
    setTables(merged.tables);
    formRef.current = merged.form;
    tablesRef.current = merged.tables;
    setApplicantSubmitted(!!saved?.submitted);
    setStaffApproved(!!saved?.staffReviewed);
    setDirectorValidated(!!saved?.directorValidated);
    setDirectorValidatedBy(String(saved?.directorValidatedBy ?? ""));
    setDirectorValidatedAt(String(saved?.directorValidatedAt ?? ""));
    const doc = app?.moduleData?.tna1Document as { aiGenerated?: boolean } | undefined;
    setTnaAiGenerated(doc?.aiGenerated ?? null);
    if (saved?.siteVisitDate) setSiteVisitDate(String(saved.siteVisitDate));
    if (saved?.siteVisitNotes) setSiteVisitNotes(String(saved.siteVisitNotes));
    const draftNotes = String(
      saved?.staffReviewNotesDraft ?? saved?.staffNotes ?? "",
    );
    if (draftNotes) setStaffNotes(draftNotes);
    const hydrated = hydrateTna1Docs(saved);
    setDocs(hydrated);
    docsRef.current = hydrated;
    const notified =
      saved?.notifiedRemarks && typeof saved.notifiedRemarks === "object"
        ? (saved.notifiedRemarks as Record<string, string>)
        : {};
    setNotifiedRemarks(notified);
    notifiedRemarksRef.current = notified;
    // Submitted / post-submit review: unlock all section tabs for navigation.
    if (saved?.submitted || saved?.staffReviewed || saved?.directorValidated) {
      setMaxReached(STEPS.length - 1);
    } else {
      setMaxReached(0);
    }
    setStep("identification");
  }, []);

  useEffect(() => {
    loadApplicantData(applicant);
  }, [applicant?.id, loadApplicantData]);

  // Progress-gate: bump unlock as the user reaches new sections (Back does not lock again).
  useEffect(() => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx >= 0) setMaxReached((m) => Math.max(m, idx));
  }, [step]);

  // After submit / staff approval, unlock the full workflow for tab navigation.
  useEffect(() => {
    if (applicantSubmitted || staffApproved || directorValidated) {
      setMaxReached(STEPS.length - 1);
    }
  }, [applicantSubmitted, staffApproved, directorValidated]);

  useEffect(() => {
    const fileName =
      String(form.productionPlanFileName ?? "").trim() ||
      String(applicant?.moduleData?.productionPlanFile ?? "").trim() ||
      null;
    const hasPlan =
      !!fileName || !!String(form.productionPlan ?? "").trim();
    setDocs((prev) => {
      const next = prev.map((d) =>
        d.id === "production-plan"
          ? {
              ...d,
              uploaded: hasPlan,
              file: fileName,
            }
          : d,
      );
      docsRef.current = next;
      return next;
    });
  }, [
    form.productionPlan,
    form.productionPlanFileName,
    applicant?.moduleData?.productionPlanFile,
  ]);

  const maybeNotifyTna1Remark = useCallback(
    (
      doc: Tna1Doc,
      prev: Tna1Doc | undefined,
      currentNotified: Record<string, string>,
    ): Record<string, string> => {
      if (!applicant) return currentNotified;
      const prevStatus = prev?.flagged ? "flagged" : prev?.verified ? "ok" : "";
      const nextStatus = doc.flagged ? "flagged" : doc.verified ? "ok" : "";
      if (
        !shouldNotifyRequirementRemark({
          prevStatus,
          nextStatus,
          nextRemark: doc.remark ?? "",
          notifiedRemark: currentNotified[doc.id],
        })
      ) {
        return currentNotified;
      }
      notifyStaffVerificationRemark({
        applicant,
        moduleKey: "tna1",
        moduleLabel: formatFormMention("tna01"),
        documentId: doc.id,
        documentName: doc.name,
        remark: doc.remark ?? "",
        view: "tna1",
      });
      return { ...currentNotified, [doc.id]: (doc.remark ?? "").trim() };
    },
    [applicant],
  );

  const persistDocReview = useCallback(
    (nextDocs: Tna1Doc[], opts?: { notifyDocId?: string }) => {
      const prevDocs = docsRef.current;
      setDocs(nextDocs);
      docsRef.current = nextDocs;
      if (!applicant) return;
      let nextNotified = notifiedRemarksRef.current;
      if (opts?.notifyDocId) {
        const nextDoc = nextDocs.find((d) => d.id === opts.notifyDocId);
        const prevDoc = prevDocs.find((d) => d.id === opts.notifyDocId);
        if (nextDoc) {
          nextNotified = maybeNotifyTna1Remark(
            nextDoc,
            prevDoc,
            notifiedRemarksRef.current,
          );
          if (nextNotified !== notifiedRemarksRef.current) {
            setNotifiedRemarks(nextNotified);
            notifiedRemarksRef.current = nextNotified;
          }
        }
      }
      applicantStore.update(applicant.id, {
        moduleData: {
          ...applicant.moduleData,
          tna1: {
            ...(applicant.moduleData?.tna1 ?? {}),
            form: formRef.current,
            tables: tablesRef.current,
            docReview: docsToDocReview(nextDocs),
            notifiedRemarks: nextNotified,
          },
        },
      });
    },
    [applicant, maybeNotifyTna1Remark],
  );

  const notifyDocRemarkDebounced = useDebouncedCallback(
    (docId: string, remark: string) => {
      if (!applicant) return;
      const current = docsRef.current;
      const doc = current.find((d) => d.id === docId);
      if (!doc || !doc.flagged) return;
      const withRemark = current.map((d) =>
        d.id === docId ? { ...d, remark } : d,
      );
      const nextDoc = withRemark.find((d) => d.id === docId)!;
      const nextNotified = maybeNotifyTna1Remark(
        nextDoc,
        doc,
        notifiedRemarksRef.current,
      );
      if (nextNotified === notifiedRemarksRef.current) return;
      setNotifiedRemarks(nextNotified);
      notifiedRemarksRef.current = nextNotified;
      setDocs(withRemark);
      docsRef.current = withRemark;
      applicantStore.update(applicant.id, {
        moduleData: {
          ...applicant.moduleData,
          tna1: {
            ...(applicant.moduleData?.tna1 ?? {}),
            form: formRef.current,
            tables: tablesRef.current,
            docReview: docsToDocReview(withRemark),
            notifiedRemarks: nextNotified,
          },
        },
      });
    },
    1500,
  );

  const persistStaffReview = useCallback(
    (decision: "approved" | "needs-revision") => {
      if (!applicant || !user) return;
      const currentDocs = docsRef.current;
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
              docReview: docsToDocReview(currentDocs),
              notifiedRemarks: notifiedRemarksRef.current,
              staffNotes: staffNotes || undefined,
            },
          },
        });
        notifyTna1Resubmission(applicant, {
          flaggedItems: currentDocs
            .filter((d) => d.flagged)
            .map((d) => ({ name: d.name, remark: d.remark })),
          staffNotes,
        });
        setApplicantSubmitted(false);
        setStaffApproved(false);
        setMaxReached(0);
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
            docReview: docsToDocReview(currentDocs),
            notifiedRemarks: notifiedRemarksRef.current,
          },
        },
      });
      notifyTna1Reviewed(applicant);
      notifyTna1AwaitingDirector(applicant);
      setStaffApproved(true);
      setStep("reports");
    },
    [applicant, user, staffNotes, siteVisitDate, siteVisitNotes, form, tables],
  );

  // ── Provincial Director validation (per PSTO) ─────────────────────────────
  const applicantOfficeId = applicant ? resolveApplicantOfficeId(applicant) : "";
  const isDirectorForApplicant =
    user?.role === "provincial-director" &&
    !!user.officeId &&
    user.officeId === applicantOfficeId;
  const canDirectorValidate =
    user?.role === "admin" || isDirectorForApplicant;

  const handleDirectorValidate = useCallback(() => {
    if (!applicant || !user) return;
    const now = new Date().toISOString();
    const dateOnly = now.slice(0, 10);
    const directorName = `${user.firstName} ${user.lastName}`.trim();
    const office = getOfficeContact(applicantOfficeId);
    const validatedByLabel = office
      ? `${directorName} — Provincial Director, ${office.name}`
      : `${directorName} — Provincial Director`;

    const savedForm = (applicant.moduleData?.tna1?.form ?? form) as Record<string, unknown>;
    const updatedForm = {
      ...savedForm,
      validatedByName: validatedByLabel,
      validatedDate: dateOnly,
    };
    const tna1Doc = applicant.moduleData?.tna1Document as
      | { form?: Record<string, unknown> }
      | undefined;

    applicantStore.update(applicant.id, {
      moduleData: {
        ...applicant.moduleData,
        tna1: {
          ...(applicant.moduleData?.tna1 ?? {}),
          form: updatedForm,
          directorValidated: true,
          directorValidatedBy: directorName,
          directorValidatedByEmail: user.email,
          directorValidatedOfficeId: user.officeId ?? applicantOfficeId,
          directorValidatedAt: now,
        },
        ...(tna1Doc
          ? {
              tna1Document: {
                ...tna1Doc,
                form: {
                  ...(tna1Doc.form ?? {}),
                  validatedByName: validatedByLabel,
                  validatedDate: dateOnly,
                },
              },
            }
          : {}),
      },
    });
    setForm((f) => ({
      ...f,
      validatedByName: validatedByLabel,
      validatedDate: dateOnly,
    }));
    setDirectorValidated(true);
    setDirectorValidatedBy(directorName);
    setDirectorValidatedAt(now);
    notifyTna1DirectorValidated(applicant, directorName);
  }, [applicant, user, form, applicantOfficeId]);

  const saveTnaDraft = useCallback(
    (submitted = false, opts?: { notice?: boolean }) => {
      if (!applicant || reviewOnly) return;
      const currentForm = formRef.current;
      const currentTables = tablesRef.current;
      const nextModuleData = {
        ...applicant.moduleData,
        tna1: {
          ...(applicant.moduleData?.tna1 ?? {}),
          form: currentForm,
          tables: currentTables,
          submitted,
          submittedAt: submitted
            ? new Date().toISOString()
            : applicant.moduleData?.tna1?.submittedAt,
          updatedAt: new Date().toISOString(),
          siteVisitDate: siteVisitDateRef.current || undefined,
          siteVisitNotes: siteVisitNotesRef.current || undefined,
          staffReviewNotesDraft: staffNotesRef.current || undefined,
          docReview: docsToDocReview(docsRef.current),
          notifiedRemarks: notifiedRemarksRef.current,
        },
      };
      applicantStore.update(applicant.id, {
        ...(submitted ? { currentModule: "tna1" as const } : {}),
        businessSector: String(currentForm.sector ?? applicant.businessSector),
        moduleData: nextModuleData,
      });
      const synced = applicantStore.getById(applicant.id);
      if (synced) {
        syncTna1FormToBackendBestEffort(synced, {
          form: currentForm as Record<string, unknown>,
          tables: {
            rawMaterials: currentTables.rawMaterials ?? [],
            production: currentTables.production ?? [],
            equipment: currentTables.equipment ?? [],
          },
          submitted,
        });
      }
      if (opts?.notice !== false) {
        setSaveNotice(submitted ? "TNA Form 01 submitted." : "Draft saved.");
        setTimeout(() => setSaveNotice(""), 3000);
      }
    },
    [applicant, reviewOnly],
  );

  const scheduleTnaDraft = useDebouncedCallback(() => {
    saveTnaDraft(false, { notice: false });
  }, 400);

  const persistStaffReviewDraft = useDebouncedCallback(() => {
    if (!applicant || !isStaff || reviewOnly) return;
    applicantStore.update(applicant.id, {
      moduleData: {
        ...applicant.moduleData,
        tna1: {
          ...(applicant.moduleData?.tna1 ?? {}),
          form: formRef.current,
          tables: tablesRef.current,
          siteVisitDate: siteVisitDateRef.current || undefined,
          siteVisitNotes: siteVisitNotesRef.current || undefined,
          staffReviewNotesDraft: staffNotesRef.current || undefined,
        },
      },
    });
  }, 400);

  const handleStaffNotesChange = (value: string) => {
    staffNotesRef.current = value;
    setStaffNotes(value);
    persistStaffReviewDraft();
  };
  const handleSiteVisitDateChange = (value: string) => {
    siteVisitDateRef.current = value;
    setSiteVisitDate(value);
    persistStaffReviewDraft();
  };
  const handleSiteVisitNotesChange = (value: string) => {
    siteVisitNotesRef.current = value;
    setSiteVisitNotes(value);
    persistStaffReviewDraft();
  };

  const goToStep = (next: string) => {
    if (applicant) saveTnaDraft(false, { notice: false });
    const idx = STEPS.findIndex((s) => s.id === next);
    if (idx >= 0) setMaxReached((m) => Math.max(m, idx));
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
        const notice = aiGenerateNotice(response.aiGenerated, "Suggestions");
        if (notice) setTnaGenerateError(notice);
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
    {
      label: "Production Plan",
      value: form.productionPlanFileName || form.productionPlan,
      passed: !!form.productionPlanFileName || !!String(form.productionPlan ?? "").trim(),
    },
    { label: "Organizational Structure", value: form.orgStructureFileName, passed: !!form.orgStructureFileName },
    { label: "Plant Lay-Out Upload",    value: form.plantLayoutFileName, passed: !!form.plantLayoutFileName },
    {
      label: "Process Flow",
      value: form.processFlowFileName || form.processFlow,
      passed:
        !!form.processFlowFileName ||
        !!String(form.processFlow ?? "").trim(),
    },
    { label: "Prepared Date",           value: form.preparedDate, passed: !!form.preparedDate },
  ];
  const allValid = validationChecks.every(c => c.passed);

  const previewForm = useMemo(
    () =>
      (applicant?.moduleData?.tna1Document?.form as Record<string, unknown>) ?? form,
    [applicant?.moduleData?.tna1Document, form],
  );
  const previewTables = useMemo(
    () =>
      (applicant?.moduleData?.tna1Document?.tables as typeof tables) ?? tables,
    [applicant?.moduleData?.tna1Document, tables],
  );

  const ctx: Tna1StepContext = {
    applicant,
    user,
    isStaff,
    staffMode,
    setStaffMode,
    form,
    set,
    tables,
    setT,
    setStep,
    goToStep,
    saveTnaDraft,
    applicantSubmitted,
    setApplicantSubmitted,
    onSubmitSuccess,
    tnaGenerating,
    tnaGenerateError,
    tnaAiGenerated,
    handleGenerateTna1,
    tnaAi,
    staffNotes,
    setStaffNotes: handleStaffNotesChange,
    siteVisitDate,
    setSiteVisitDate: handleSiteVisitDateChange,
    siteVisitNotes,
    setSiteVisitNotes: handleSiteVisitNotesChange,
    persistStaffReview,
    staffApproved,
    directorValidated,
    directorValidatedBy,
    directorValidatedAt,
    canDirectorValidate,
    isDirectorForApplicant,
    applicantOfficeId,
    handleDirectorValidate,
    docs,
    setDocs,
    uploadedDocs,
    allDocReviewed,
    persistDocReview,
    notifyDocRemarkDebounced,
    allGA,
    validationChecks,
    allValid,
    previewForm,
    previewTables,
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
                subtitle="DOST SETUP Program · Module 5"
              />
            </div>
            {isStaff && !reviewOnly && (
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
          <ModuleStepHeader
            steps={STEPS}
            current={step}
            maxReached={maxReached}
            onStepClick={(id) => goToStep(id)}
          />
          {saveNotice && (
            <p className="text-xs text-emerald-200 mt-2 font-medium">{saveNotice}</p>
          )}
          {applicant && !reviewOnly && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => saveTnaDraft(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white text-[#0C2461] hover:bg-white/90"
              >
                Save Draft
              </button>
              <span className="text-[11px] text-white/70">
                Saves progress without submitting.
              </span>
            </div>
          )}
          <StaffApplicantPicker user={user} label={`Review applicant ${formatFormMention("tna01")}`} />
        </div>
        <StaffApplicantBanner user={user} />
        <div className="px-6 pt-4">
          <AiAssistNotice message={tnaAiNotice} />
        </div>
        {step === "identification" && <IdentificationStep ctx={ctx} />}
        {step === "attachment-a" && <AttachmentAStep ctx={ctx} />}
        {step === "benchmark" && <BenchmarkStep ctx={ctx} />}
        {step === "concerns" && <ConcernsStep ctx={ctx} />}
        {step === "finance-hr" && <FinanceHrStep ctx={ctx} />}
        {step === "validation" && <ValidationStep ctx={ctx} />}
        {step === "complete" && <CompleteStep ctx={ctx} />}
        {step === "staff-review" && isStaff && <StaffReviewStep ctx={ctx} />}
        {step === "reports" && <ReportsStep ctx={ctx} />}
        {reviewOnly && user && step === STEPS[STEPS.length - 1].id && (
          <div className="px-4 sm:px-6 pb-6">
            <RtecReviewCommentPanel
              user={user}
              applicantId={applicant?.id}
              sourceView="tna1"
            />
          </div>
        )}

      </div>
    </div>
  );
}
