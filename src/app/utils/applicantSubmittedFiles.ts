/**
 * Author: Yzrel Jade B. Eborde
 */

import type { Applicant } from "../store/applicantStore";
import type {
  ModuleDocument,
  ProcurementDocument,
  ProjectProposalAttachment,
  SignedMoaDocument,
  SignedPrePisDocument,
} from "../api/types";
import type { StoredRequirementUpload } from "./submissionRequirements";
import { getProjectProposalStored } from "./projectProposal";
import { getApprovalLetterStored } from "./approvalLetter";
import { getProjectInformationSheetStored } from "./projectInformationSheet";
import { getLandBankStored } from "./landBankWithdrawal";
import { getProcurementStored } from "./procurementLiquidation";

export type SubmittedFileCategory =
  | "registration"
  | "requirements"
  | "loi"
  | "tna1"
  | "proposal"
  | "approval"
  | "pis"
  | "landbank"
  | "procurement"
  | "other";

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
}

export const SUBMITTED_FILE_CATEGORY_LABELS: Record<SubmittedFileCategory, string> = {
  registration: "Registration",
  requirements: "Requirements",
  loi: "Letter of Intent",
  tna1: "TNA Form 01",
  proposal: "Project Proposal",
  approval: "Approval / MOA",
  pis: "Project Information Sheet",
  landbank: "LandBank",
  procurement: "Procurement",
  other: "Other",
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
    viewable: !!doc.dataUrl,
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
    viewable: !!att.dataUrl,
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
    viewable: !!doc.dataUrl,
  });
}

function pushTnaFile(
  out: ApplicantSubmittedFile[],
  fileName: string | undefined,
  dataUrl: string | undefined,
  label: string,
  id: string,
): void {
  if (!fileName?.trim()) return;
  out.push({
    id,
    category: "tna1",
    label,
    fileName,
    mimeType: dataUrl?.startsWith("data:") ? dataUrl.split(";")[0].replace("data:", "") : undefined,
    dataUrl: dataUrl || undefined,
    sourceModule: "TNA Form 01",
    viewable: !!dataUrl,
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
  });
}

export function collectApplicantSubmittedFiles(
  applicant: Applicant | null,
): ApplicantSubmittedFile[] {
  if (!applicant) return [];

  const md = applicant.moduleData ?? {};
  const files: ApplicantSubmittedFile[] = [];

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
    });
  }

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
    });
  }

  for (const upload of (md.requirementUploads ?? []) as StoredRequirementUpload[]) {
    pushRequirement(files, upload);
  }

  const tna1Form = (md.tna1 as { form?: Record<string, string> } | undefined)?.form;
  if (tna1Form) {
    pushTnaFile(
      files,
      tna1Form.plantLayoutFileName,
      tna1Form.plantLayoutFileData,
      "Plant layout",
      "tna1-plant-layout",
    );
    pushTnaFile(
      files,
      tna1Form.processFlowFileName,
      tna1Form.processFlowFileData,
      "Process flow diagram",
      "tna1-process-flow",
    );
  }

  const proposal = getProjectProposalStored(applicant);
  for (const att of proposal?.attachments ?? []) {
    pushAttachment(files, att);
  }

  const approval = getApprovalLetterStored(applicant);
  pushSignedDoc(files, approval?.signedMoa, {
    id: "approval-signed-moa",
    category: "approval",
    label: "Signed MOA",
    sourceModule: "Approval Letter",
  });

  const pis = getProjectInformationSheetStored(applicant);
  pushSignedDoc(files, pis?.signedPrePis, {
    id: "pis-signed-pre-pis",
    category: "pis",
    label: "Signed Pre-Implementation PIS",
    sourceModule: "Project Information Sheet",
  });

  const landBank = getLandBankStored(applicant);
  pushModuleDocument(files, landBank?.form?.accountSnapshot ?? null, {
    id: "landbank-snapshot",
    category: "landbank",
    label: "LandBank account snapshot",
    sourceModule: "LandBank & Withdrawal",
  });
  pushModuleDocument(files, landBank?.form?.withdrawalLetter ?? null, {
    id: "landbank-withdrawal",
    category: "landbank",
    label: "Withdrawal letter",
    sourceModule: "LandBank & Withdrawal",
  });

  const procurement = getProcurementStored(applicant);
  for (const doc of procurement?.form?.documents ?? []) {
    pushProcurementDoc(files, doc, "procurement");
  }
  for (const doc of procurement?.form?.liquidationDocuments ?? []) {
    pushProcurementDoc(files, doc, "liquidation");
  }

  return files.sort((a, b) => {
    const cat = a.category.localeCompare(b.category);
    if (cat !== 0) return cat;
    return (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "");
  });
}

export function countViewableSubmittedFiles(files: ApplicantSubmittedFile[]): {
  total: number;
  viewable: number;
  missingContent: number;
} {
  const viewable = files.filter((f) => f.viewable).length;
  return {
    total: files.length,
    viewable,
    missingContent: files.length - viewable,
  };
}
