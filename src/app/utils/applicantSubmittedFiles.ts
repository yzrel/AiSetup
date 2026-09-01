/**
 * Author: Yzrel Jade B. Eborde
 */

import type { Applicant } from "../store/applicantStore";
import type { AdminView } from "../store/authStore";
import type {
  LiquidationEntry,
  ModuleDocument,
  PDCEntry,
  PisOngoingFiling,
  ProcurementDocument,
  ProjectProposalAttachment,
  SignedMoaDocument,
  SignedPrePisDocument,
} from "../api/types";
import type { StoredRequirementUpload } from "./submissionRequirements";
import { getProjectProposalStored } from "./projectProposal";
import { getApprovalLetterStored } from "./approvalLetter";
import { getProjectInformationSheetStored } from "./projectInformationSheet";
import { getLandBankStored, WITHDRAWAL_SIGNED_KEY } from "./landBankWithdrawal";
import { getProcurementForm } from "./procurementLiquidation";
import { getSignedDocuments } from "./documentDelivery";
import { getTna2Draft } from "./tnaForm02";
import { getRtecReportStored, getRtecReportForm } from "./rtecReport";
import { getRefundForm } from "./refundDelinquent";
import { getCloseOutForm } from "./projectCloseOut";
import { printTnaForm02Pdf } from "./tnaForm02Print";
import { printProjectProposalPdf } from "./projectProposalPrint";
import { printRtecReportPdf } from "./rtecReportPrint";
import { asObjectList } from "./normalizeCriticalModuleData";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Array, id-keyed map, or a single collapsed row — never throw on for-of. */
function asRowList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!isPlainObject(value)) return [];
  const vals = Object.values(value);
  const asMap =
    vals.length > 0 &&
    vals.every((v) => isPlainObject(v)) &&
    !("fileName" in value) &&
    !("mimeType" in value) &&
    !("dataUrl" in value);
  return (asMap ? vals : [value]) as T[];
}

export type SubmittedFileCategory =
  | "registration"
  | "requirements"
  | "loi"
  | "tna1"
  | "tna2"
  | "proposal"
  | "rtec"
  | "approval"
  | "pis"
  | "landbank"
  | "procurement"
  | "refund"
  | "closeout"
  | "server"
  | "other";

export type SubmittedFileKind = "upload" | "generated" | "server";

/** Print handlers that work without the module preview mounted. */
export type GeneratedPrintKey = "tna2" | "proposal" | "rtec";

export interface ApplicantSubmittedFile {
  id: string;
  category: SubmittedFileCategory;
  label: string;
  fileName: string;
  mimeType?: string;
  dataUrl?: string;
  uploadedAt?: string;
  sourceModule: string;
  viewable: boolean;
  kind?: SubmittedFileKind;
  /** Navigate to this module to view/print (generated docs that need preview DOM). */
  navigateView?: AdminView;
  /** Standalone print when createRoot-based helpers exist. */
  printKey?: GeneratedPrintKey;
  /** Backend file_uploads row id for durable downloads. */
  serverFileId?: string;
}

export const SUBMITTED_FILE_CATEGORY_LABELS: Record<SubmittedFileCategory, string> = {
  registration: "Registration",
  requirements: "Requirements",
  loi: "Letter of Intent",
  tna1: "TNA Form 01",
  tna2: "TNA Form 02",
  proposal: "Project Proposal",
  rtec: "RTEC Report",
  approval: "Approval / MOA",
  pis: "Project Information Sheet",
  landbank: "LandBank",
  procurement: "Procurement",
  refund: "Refund",
  closeout: "Project Close-Out",
  server: "Server uploads",
  other: "Other",
};

/** Categories from LOI through closeout (Client Files default scope). */
export const LOI_ONWARD_CATEGORIES: SubmittedFileCategory[] = [
  "loi",
  "requirements",
  "tna1",
  "tna2",
  "proposal",
  "rtec",
  "approval",
  "pis",
  "landbank",
  "procurement",
  "refund",
  "closeout",
  "server",
  "other",
];

export const CATEGORY_TO_VIEW: Partial<Record<SubmittedFileCategory, AdminView>> = {
  registration: "registration",
  requirements: "requirements",
  loi: "letter-of-intent",
  tna1: "tna1",
  tna2: "tna2",
  proposal: "project-proposal",
  rtec: "conduct-rtec",
  approval: "approval-letter",
  pis: "project-information-sheet",
  landbank: "landbank-withdrawal",
  procurement: "procurement-liquidation",
  refund: "refund-delinquent",
  closeout: "project-closeout",
};

const SIGNED_KEY_META: Record<
  string,
  { category: SubmittedFileCategory; label: string; sourceModule: string; navigateView: AdminView }
> = {
  "letter-of-intent": {
    category: "loi",
    label: "Signed Letter of Intent",
    sourceModule: "Letter of Intent",
    navigateView: "letter-of-intent",
  },
  tna1: {
    category: "tna1",
    label: "Signed TNA Form 01",
    sourceModule: "TNA Form 01",
    navigateView: "tna1",
  },
  tna2: {
    category: "tna2",
    label: "Signed TNA Form 02",
    sourceModule: "TNA Form 02",
    navigateView: "tna2",
  },
  "project-proposal": {
    category: "proposal",
    label: "Signed Project Proposal",
    sourceModule: "Project Proposal",
    navigateView: "project-proposal",
  },
  "conduct-rtec": {
    category: "rtec",
    label: "Signed RTEC Report",
    sourceModule: "Conduct of RTEC",
    navigateView: "conduct-rtec",
  },
  "approval-letter": {
    category: "approval",
    label: "Signed Approval Letter",
    sourceModule: "Approval Letter",
    navigateView: "approval-letter",
  },
  "project-information-sheet": {
    category: "pis",
    label: "Signed Project Information Sheet",
    sourceModule: "Project Information Sheet",
    navigateView: "landbank-withdrawal",
  },
  prePis: {
    category: "pis",
    label: "Signed Pre-Implementation PIS",
    sourceModule: "Project Information Sheet",
    navigateView: "landbank-withdrawal",
  },
  "landbank-withdrawal": {
    category: "landbank",
    label: "Signed LandBank document",
    sourceModule: "LandBank & Withdrawal",
    navigateView: "landbank-withdrawal",
  },
  landBank: {
    category: "landbank",
    label: "Signed LandBank document",
    sourceModule: "LandBank & Withdrawal",
    navigateView: "landbank-withdrawal",
  },
  [WITHDRAWAL_SIGNED_KEY.first]: {
    category: "landbank",
    label: "Signed withdrawal letter (1st tranche)",
    sourceModule: "LandBank & Withdrawal",
    navigateView: "landbank-withdrawal",
  },
  [WITHDRAWAL_SIGNED_KEY.second]: {
    category: "landbank",
    label: "Signed withdrawal letter (2nd tranche)",
    sourceModule: "LandBank & Withdrawal",
    navigateView: "landbank-withdrawal",
  },
};

function pushModuleDocument(
  out: ApplicantSubmittedFile[],
  doc: ModuleDocument | null | undefined,
  opts: {
    id: string;
    category: SubmittedFileCategory;
    label: string;
    sourceModule: string;
  },
): void {
  if (!doc?.fileName) return;
  out.push({
    id: opts.id,
    category: opts.category,
    label: opts.label,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    dataUrl: doc.dataUrl,
    uploadedAt: doc.uploadedAt,
    sourceModule: opts.sourceModule,
    viewable: !!(doc.dataUrl || doc.fileId),
    kind: "upload",
    serverFileId: doc.fileId,
  });
}

function pushSignedDoc(
  out: ApplicantSubmittedFile[],
  doc: SignedMoaDocument | SignedPrePisDocument | null | undefined,
  opts: {
    id: string;
    category: SubmittedFileCategory;
    label: string;
    sourceModule: string;
  },
): void {
  if (!doc?.fileName) return;
  out.push({
    id: opts.id,
    category: opts.category,
    label: opts.label,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    dataUrl: doc.dataUrl,
    uploadedAt: doc.uploadedAt,
    sourceModule: opts.sourceModule,
    viewable: !!doc.dataUrl,
    kind: "upload",
  });
}

function pushAttachment(
  out: ApplicantSubmittedFile[],
  att: ProjectProposalAttachment,
): void {
  const kindLabels: Record<string, string> = {
    vicinityMap: "Vicinity map",
    plantLayout: "Plant layout",
    orgChart: "Organization chart",
    financialReports: "Financial reports",
  };
  out.push({
    id: `proposal-${att.id}`,
    category: "proposal",
    label: kindLabels[att.kind] ?? att.kind,
    fileName: att.fileName,
    mimeType: att.mimeType,
    dataUrl: att.dataUrl,
    uploadedAt: att.uploadedAt,
    sourceModule: "Project Proposal",
    viewable: !!(att.dataUrl || att.fileId),
    kind: "upload",
    serverFileId: att.fileId,
  });
}

function pushProcurementDoc(
  out: ApplicantSubmittedFile[],
  doc: ProcurementDocument,
  kind: "procurement" | "liquidation",
): void {
  out.push({
    id: `${kind}-${doc.id}`,
    category: "procurement",
    label: kind === "liquidation" ? "Liquidation document" : "Procurement document",
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    dataUrl: doc.dataUrl,
    uploadedAt: doc.uploadedAt,
    sourceModule: "Procurement & Liquidation",
    viewable: !!(doc.dataUrl || doc.fileId),
    kind: "upload",
    serverFileId: doc.fileId,
  });
}

function pushTnaFile(
  out: ApplicantSubmittedFile[],
  fileName: string | undefined,
  dataUrl: string | undefined,
  label: string,
  id: string,
  opts?: { fileId?: string; mimeType?: string },
): void {
  if (!fileName?.trim()) return;
  const mimeType =
    opts?.mimeType ||
    (dataUrl?.startsWith("data:")
      ? dataUrl.split(";")[0].replace("data:", "")
      : undefined);
  out.push({
    id,
    category: "tna1",
    label,
    fileName,
    mimeType,
    dataUrl: dataUrl || undefined,
    serverFileId: opts?.fileId,
    sourceModule: "TNA Form 01",
    viewable: !!(dataUrl || opts?.fileId),
    kind: "upload",
  });
}

function pushRequirement(
  out: ApplicantSubmittedFile[],
  upload: StoredRequirementUpload,
): void {
  if (!upload.uploaded || !upload.fileName) return;
  out.push({
    id: `req-${upload.id}`,
    category: "requirements",
    label: upload.name,
    fileName: upload.fileName,
    mimeType: upload.mimeType,
    dataUrl: upload.dataUrl,
    uploadedAt: upload.uploadedAt,
    sourceModule: "Submit Requirements",
    viewable: !!upload.dataUrl,
    kind: "upload",
  });
}

function pushGenerated(
  out: ApplicantSubmittedFile[],
  opts: {
    id: string;
    category: SubmittedFileCategory;
    label: string;
    fileName: string;
    sourceModule: string;
    uploadedAt?: string;
    navigateView: AdminView;
    printKey?: GeneratedPrintKey;
  },
): void {
  out.push({
    id: opts.id,
    category: opts.category,
    label: opts.label,
    fileName: opts.fileName,
    uploadedAt: opts.uploadedAt,
    sourceModule: opts.sourceModule,
    viewable: false,
    kind: "generated",
    navigateView: opts.navigateView,
    printKey: opts.printKey,
  });
}

function alreadyHasDataUrl(out: ApplicantSubmittedFile[], dataUrl?: string): boolean {
  if (!dataUrl) return false;
  return out.some((f) => f.dataUrl === dataUrl);
}

function alreadyHasId(out: ApplicantSubmittedFile[], id: string): boolean {
  return out.some((f) => f.id === id);
}

export interface ServerFileRow {
  id: string;
  moduleKey?: string;
  originalFilename?: string;
  contentType?: string;
  sizeBytes?: number;
  createdAt?: string;
}

export function mergeServerFilesIntoCatalog(
  files: ApplicantSubmittedFile[],
  serverRows: ServerFileRow[],
): ApplicantSubmittedFile[] {
  const rows = asObjectList<ServerFileRow>(serverRows);
  if (!rows.length) return files;
  const existingNames = new Set(
    files.map((f) => `${(f.fileName || "").toLowerCase()}|${f.category}`),
  );
  const merged = [...files];
  for (const row of rows) {
    const fileName = String(row.originalFilename ?? "").trim();
    if (!fileName || !row.id) continue;
    const moduleKey = String(row.moduleKey ?? "general");
    const category = serverModuleKeyToCategory(moduleKey);
    const dedupeKey = `${fileName.toLowerCase()}|${category}`;
    if (existingNames.has(dedupeKey)) continue;
    existingNames.add(dedupeKey);
    merged.push({
      id: `server-${row.id}`,
      category: "server",
      label: fileName,
      fileName,
      mimeType: row.contentType,
      uploadedAt: row.createdAt,
      sourceModule: moduleKey,
      viewable: true,
      kind: "server",
      serverFileId: row.id,
    });
  }
  return merged;
}

function serverModuleKeyToCategory(moduleKey: string): SubmittedFileCategory {
  const key = moduleKey.toLowerCase();
  if (key.includes("loi") || key === "letter-of-intent") return "loi";
  if (key.includes("tna2")) return "tna2";
  if (key.includes("tna1") || key === "tna1") return "tna1";
  if (key.includes("proposal")) return "proposal";
  if (key.includes("rtec")) return "rtec";
  if (key.includes("approval") || key.includes("moa") || key === "signedmoa") return "approval";
  if (key.includes("pis") || key.includes("prepis")) return "pis";
  if (key.includes("land") || key.includes("withdraw")) return "landbank";
  if (key.includes("procurement") || key.includes("liquid")) return "procurement";
  if (key.includes("refund")) return "refund";
  if (key.includes("close")) return "closeout";
  if (key.includes("requirement")) return "requirements";
  return "server";
}

export function runGeneratedPrint(
  applicant: Applicant,
  printKey: GeneratedPrintKey,
): void {
  const appId = applicant.applicationId;
  if (printKey === "tna2") {
    const doc = getTna2Draft(applicant);
    if (doc) printTnaForm02Pdf(doc, appId);
    return;
  }
  if (printKey === "proposal") {
    const stored = getProjectProposalStored(applicant);
    if (stored?.form) {
      printProjectProposalPdf(
        stored.form,
        stored.document,
        stored.attachments,
        appId,
        applicant.id,
      );
    }
    return;
  }
  if (printKey === "rtec") {
    void printRtecReportPdf(getRtecReportForm(applicant), appId, applicant.id);
  }
}

export function collectApplicantSubmittedFiles(
  applicant: Applicant | null,
  options?: { scope?: "all" | "loi-onward" },
): ApplicantSubmittedFile[] {
  if (!applicant) return [];

  const scope = options?.scope ?? "all";
  const md = applicant.moduleData ?? {};
  const files: ApplicantSubmittedFile[] = [];

  if (scope === "all") {
    const selfie = String(md.selfie ?? "");
    if (selfie.startsWith("data:")) {
      files.push({
        id: "registration-selfie",
        category: "registration",
        label: "Identity verification selfie",
        fileName: "selfie.jpg",
        mimeType: selfie.split(";")[0]?.replace("data:", "") || "image/jpeg",
        dataUrl: selfie,
        sourceModule: "Registration",
        viewable: true,
        kind: "upload",
      });
    }
  }

  for (const upload of asRowList<StoredRequirementUpload>(md.requirementUploads)) {
    pushRequirement(files, upload);
  }

  const tna1Form = (md.tna1 as { form?: Record<string, string>; submitted?: boolean; submittedAt?: string } | undefined);
  const tna1FormFields = tna1Form?.form;
  const tnaProductionPlanName = String(tna1FormFields?.productionPlanFileName ?? "").trim();
  const tnaProductionPlanData = String(tna1FormFields?.productionPlanFileData ?? "");
  if (tnaProductionPlanName) {
    pushTnaFile(
      files,
      tnaProductionPlanName,
      tnaProductionPlanData,
      "Production plan",
      "tna1-production-plan",
      {
        fileId: String(tna1FormFields?.productionPlanFileId ?? "").trim() || undefined,
        mimeType: String(tna1FormFields?.productionPlanFileMime ?? "").trim() || undefined,
      },
    );
  } else {
    const productionPlanDoc = md.productionPlanDocument as ModuleDocument | undefined;
    if (productionPlanDoc?.fileName) {
      pushModuleDocument(files, productionPlanDoc, {
        id: "loi-production-plan",
        category: "loi",
        label: "Production plan",
        sourceModule: "Letter of Intent",
      });
    } else if (md.productionPlanFile) {
      files.push({
        id: "loi-production-plan-meta",
        category: "loi",
        label: "Production plan",
        fileName: String(md.productionPlanFile),
        sourceModule: "Letter of Intent",
        viewable: false,
        kind: "upload",
      });
    }
  }

  if (tna1FormFields) {
    pushTnaFile(
      files,
      tna1FormFields.plantLayoutFileName,
      tna1FormFields.plantLayoutFileData,
      "Plant layout",
      "tna1-plant-layout",
      {
        fileId: String(tna1FormFields.plantLayoutFileId ?? "").trim() || undefined,
        mimeType: String(tna1FormFields.plantLayoutFileMime ?? "").trim() || undefined,
      },
    );
    pushTnaFile(
      files,
      tna1FormFields.processFlowFileName,
      tna1FormFields.processFlowFileData,
      "Process flow diagram",
      "tna1-process-flow",
      {
        fileId: String(tna1FormFields.processFlowFileId ?? "").trim() || undefined,
        mimeType: String(tna1FormFields.processFlowFileMime ?? "").trim() || undefined,
      },
    );
  }

  if (md.loiDocument) {
    const loi = md.loiDocument as { generatedAt?: string };
    pushGenerated(files, {
      id: "generated-loi",
      category: "loi",
      label: "Generated Letter of Intent",
      fileName: `LOI-${applicant.applicationId || applicant.id}.pdf`,
      sourceModule: "Letter of Intent",
      uploadedAt: loi.generatedAt,
      navigateView: "letter-of-intent",
    });
  }

  if (tna1Form?.submitted) {
    pushGenerated(files, {
      id: "generated-tna1",
      category: "tna1",
      label: "Generated TNA Form 01",
      fileName: `TNA-Form-01-${applicant.applicationId || applicant.id}.pdf`,
      sourceModule: "TNA Form 01",
      uploadedAt: tna1Form?.submittedAt,
      navigateView: "tna1",
    });
  }

  const tna2 = getTna2Draft(applicant);
  if (tna2) {
    pushGenerated(files, {
      id: "generated-tna2",
      category: "tna2",
      label: tna2.published ? "Published TNA Form 02" : "Draft TNA Form 02",
      fileName: `TNA-Form-02-${applicant.applicationId || applicant.id}.pdf`,
      sourceModule: "TNA Form 02",
      uploadedAt: tna2.publishedAt ?? tna2.generatedAt,
      navigateView: "tna2",
      printKey: "tna2",
    });
  }

  const proposal = getProjectProposalStored(applicant);
  for (const att of asRowList<ProjectProposalAttachment>(proposal?.attachments)) {
    pushAttachment(files, att);
  }
  if (proposal?.document || proposal?.form) {
    pushGenerated(files, {
      id: "generated-proposal",
      category: "proposal",
      label: proposal.submitted
        ? "Generated Project Proposal"
        : "Draft Project Proposal",
      fileName: `SETUP-Form-001-${applicant.applicationId || applicant.id}.pdf`,
      sourceModule: "Project Proposal",
      uploadedAt: proposal.document?.generatedAt ?? proposal.submittedAt,
      navigateView: "project-proposal",
      printKey: "proposal",
    });
  }

  const rtec = getRtecReportStored(applicant);
  if (rtec?.form || rtec?.submitted) {
    pushGenerated(files, {
      id: "generated-rtec",
      category: "rtec",
      label: rtec.submitted ? "Submitted RTEC Report" : "Draft RTEC Report",
      fileName: `SETUP-Form-002-${applicant.applicationId || applicant.id}.pdf`,
      sourceModule: "Conduct of RTEC",
      uploadedAt: rtec.submittedAt,
      navigateView: "conduct-rtec",
      printKey: "rtec",
    });
  }

  const approval = getApprovalLetterStored(applicant);
  pushSignedDoc(files, approval?.signedMoa, {
    id: "approval-signed-moa",
    category: "approval",
    label: "Signed MOA",
    sourceModule: "Approval Letter",
  });
  if (approval?.form) {
    pushGenerated(files, {
      id: "generated-approval",
      category: "approval",
      label: approval.published
        ? "Published Approval Letter"
        : "Draft Approval Letter",
      fileName: `SETUP-Form-003-${applicant.applicationId || applicant.id}.pdf`,
      sourceModule: "Approval Letter",
      uploadedAt: approval.publishedAt,
      navigateView: "approval-letter",
    });
  }

  const pis = getProjectInformationSheetStored(applicant);
  pushSignedDoc(files, pis?.signedPrePis, {
    id: "pis-signed-pre-pis",
    category: "pis",
    label: "Signed Pre-Implementation PIS",
    sourceModule: "Project Information Sheet",
  });
  if (pis?.prePisDraft?.projectTitle?.trim()) {
    pushGenerated(files, {
      id: "generated-pre-pis",
      category: "pis",
      label: "Pre-Implementation PIS (Form 008)",
      fileName: `SETUP-Form-008-${applicant.applicationId || applicant.id}.pdf`,
      sourceModule: "Project Information Sheet",
      navigateView: "landbank-withdrawal",
    });
  }
  for (const filing of asRowList<PisOngoingFiling>(pis?.ongoingFilings)) {
    pushGenerated(files, {
      id: `generated-pis-ongoing-${filing.id}`,
      category: "pis",
      label: `Ongoing PIS — ${filing.periodLabel || filing.id}`,
      fileName: `SETUP-Form-009-${filing.id}.pdf`,
      sourceModule: "Project Information Sheet",
      uploadedAt: filing.filedAt,
      navigateView: "landbank-withdrawal",
    });
  }

  const landBank = getLandBankStored(applicant);
  const intro = landBank?.introductionLetter;
  if (intro?.form || intro?.published) {
    pushGenerated(files, {
      id: "generated-lbp-intro",
      category: "landbank",
      label: intro.published
        ? "Published Letter of Introduction to LBP"
        : "Draft Letter of Introduction to LBP",
      fileName: `LBP-Introduction-${applicant.applicationId || applicant.id}.pdf`,
      sourceModule: "LandBank & Withdrawal",
      uploadedAt: intro.publishedAt,
      navigateView: "landbank-withdrawal",
    });
  }
  pushModuleDocument(files, landBank?.form?.accountSnapshot ?? null, {
    id: "landbank-snapshot",
    category: "landbank",
    label: "LandBank account snapshot",
    sourceModule: "LandBank & Withdrawal",
  });
  const t1 = landBank?.form?.tranches?.first;
  const t2 = landBank?.form?.tranches?.second;
  pushModuleDocument(
    files,
    t1?.signedLetter ?? landBank?.form?.withdrawalLetter ?? null,
    {
      id: "landbank-withdrawal-t1",
      category: "landbank",
      label: "Withdrawal letter request (1st tranche)",
      sourceModule: "LandBank & Withdrawal",
    },
  );
  pushModuleDocument(files, t2?.signedLetter ?? null, {
    id: "landbank-withdrawal-t2",
    category: "landbank",
    label: "Withdrawal letter request (2nd tranche)",
    sourceModule: "LandBank & Withdrawal",
  });
  const t3 = landBank?.form?.tranches?.third;
  pushModuleDocument(files, t3?.signedLetter ?? null, {
    id: "landbank-withdrawal-t3",
    category: "landbank",
    label: "Withdrawal letter request (3rd tranche)",
    sourceModule: "LandBank & Withdrawal",
  });
  for (const [i, doc] of asRowList<ModuleDocument>(t1?.quotations).entries()) {
    pushModuleDocument(files, doc, {
      id: `landbank-quotation-t1-${i}`,
      category: "landbank",
      label: `Equipment quotation (1st tranche) — ${doc.fileName}`,
      sourceModule: "LandBank & Withdrawal",
    });
  }
  for (const [i, doc] of asRowList<ModuleDocument>(t1?.equipmentPhotos).entries()) {
    pushModuleDocument(files, doc, {
      id: `landbank-photo-t1-${i}`,
      category: "landbank",
      label: `Equipment photo (1st tranche) — ${doc.fileName}`,
      sourceModule: "LandBank & Withdrawal",
    });
  }
  for (const [i, doc] of asRowList<ModuleDocument>(t2?.quotations).entries()) {
    pushModuleDocument(files, doc, {
      id: `landbank-quotation-t2-${i}`,
      category: "landbank",
      label: `Equipment quotation (2nd tranche) — ${doc.fileName}`,
      sourceModule: "LandBank & Withdrawal",
    });
  }
  for (const [i, doc] of asRowList<ModuleDocument>(t2?.equipmentPhotos).entries()) {
    pushModuleDocument(files, doc, {
      id: `landbank-photo-t2-${i}`,
      category: "landbank",
      label: `Equipment photo (2nd tranche) — ${doc.fileName}`,
      sourceModule: "LandBank & Withdrawal",
    });
  }

  const procurementForm = getProcurementForm(applicant);
  for (const doc of asRowList<ProcurementDocument>(procurementForm.documents)) {
    pushProcurementDoc(files, doc, "procurement");
  }
  for (const entry of asRowList<LiquidationEntry>(procurementForm.liquidations)) {
    for (const [i, doc] of asRowList(entry.attachments).entries()) {
      pushModuleDocument(
        files,
        {
          fileName: doc.fileName,
          mimeType: doc.mimeType ?? "application/octet-stream",
          dataUrl: doc.dataUrl,
          uploadedAt: doc.uploadedAt,
          uploadedBy: doc.uploadedBy ?? "",
          fileId: doc.fileId,
        },
        {
          id: `liquidation-${entry.id}-${doc.id || i}`,
          category: "procurement",
          label: entry.title.trim()
            ? `Liquidation — ${entry.title} — ${doc.fileName}`
            : `Liquidation document — ${doc.fileName}`,
          sourceModule: "Procurement & Liquidation",
        },
      );
    }
  }

  let refundForm;
  try {
    refundForm = getRefundForm(applicant);
  } catch (err) {
    console.error("[aisetup] getRefundForm", err);
    refundForm = { pdcs: [] };
  }
  for (const pdc of asRowList<PDCEntry>(refundForm.pdcs)) {
    if (pdc.paymentReceipt?.fileName) {
      pushModuleDocument(files, pdc.paymentReceipt, {
        id: `refund-receipt-${pdc.id}`,
        category: "refund",
        label: `Payment receipt — PDC ${pdc.dueDate || pdc.id}`,
        sourceModule: "Refund & Delinquent",
      });
    }
  }

  const closeOut = getCloseOutForm(applicant);
  const closeOutMeta: Array<[string | undefined, string, string]> = [
    [closeOut.terminalReportFileName, "Terminal report", "closeout-terminal"],
    [closeOut.auditedFinancialFileName, "Audited financial statement", "closeout-financial"],
    [
      closeOut.propertyTransferSignedFileName ?? closeOut.equipmentAcknowledgementFileName,
      "Property Transfer Receipt (signed)",
      "closeout-ptr-signed",
    ],
  ];
  for (const [name, label, id] of closeOutMeta) {
    if (!name?.trim()) continue;
    files.push({
      id,
      category: "closeout",
      label,
      fileName: name.trim(),
      sourceModule: "Project Close-Out",
      viewable: false,
      kind: "upload",
      navigateView: "project-closeout",
    });
  }

  const signedMap = getSignedDocuments(applicant);
  for (const [key, doc] of Object.entries(signedMap)) {
    if (!doc?.fileName) continue;
    const meta = SIGNED_KEY_META[key];
    const id = `signed-${key}`;
    if (alreadyHasId(files, id)) continue;
    if (alreadyHasDataUrl(files, doc.dataUrl)) continue;
    // Skip duplicates already collected under module-specific fields
    if (
      key === "approval-letter" &&
      files.some((f) => f.id === "approval-signed-moa")
    ) {
      continue;
    }
    if (
      (key === "prePis" || key === "project-information-sheet") &&
      files.some((f) => f.id === "pis-signed-pre-pis" && f.dataUrl === doc.dataUrl)
    ) {
      continue;
    }
    if (
      (key === WITHDRAWAL_SIGNED_KEY.first || key === WITHDRAWAL_SIGNED_KEY.second) &&
      alreadyHasDataUrl(files, doc.dataUrl)
    ) {
      continue;
    }
    files.push({
      id,
      category: meta?.category ?? "other",
      label: meta?.label ?? `Signed document (${key})`,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      dataUrl: doc.dataUrl,
      uploadedAt: doc.uploadedAt,
      sourceModule: meta?.sourceModule ?? key,
      viewable: !!(doc.dataUrl || doc.fileId),
      kind: "upload",
      navigateView: meta?.navigateView,
      serverFileId: doc.fileId,
    });
  }

  const filtered =
    scope === "loi-onward"
      ? files.filter((f) => LOI_ONWARD_CATEGORIES.includes(f.category))
      : files;

  return filtered.sort((a, b) => {
    const cat = a.category.localeCompare(b.category);
    if (cat !== 0) return cat;
    return (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "");
  });
}

export function countViewableSubmittedFiles(files: ApplicantSubmittedFile[]): {
  total: number;
  viewable: number;
  missingContent: number;
  generated: number;
} {
  const viewable = files.filter((f) => f.viewable || f.kind === "server").length;
  const generated = files.filter((f) => f.kind === "generated").length;
  return {
    total: files.length,
    viewable,
    missingContent: files.filter(
      (f) => f.kind !== "generated" && !f.viewable && f.kind !== "server",
    ).length,
    generated,
  };
}
