/**
 * Author: Yzrel Jade B. Eborde
 */

import { Applicant } from "../store/applicantStore";
import { financialStatementUploadLabel } from "../constants/financialStatementLabels";
import { normalizePrioritySector } from "../constants/setupBrochure";
import { RTEC_COMPLIANCE_ITEMS } from "./rtecReport";
import {
  needsArticlesOfIncorporation,
  needsBoardResolution,
} from "./orgTypeRequirements";
import { projectedFinancialStatementLabel } from "./projectedFsDuration";
import {
  getRequirementEquipmentList,
  QUOTATIONS_PO_GUIDANCE,
  SUPPLIER_UNAVAILABILITY_HINT,
} from "./requirementEquipment";
import { normalizeRequirementStaffReview } from "./normalizeCriticalModuleData";

export { isNonSingleProprietor, isNonSingleProprietor as isNonSoleProprietorship } from "./proprietorTrack";
export {
  needsArticlesOfIncorporation,
  needsBoardResolution,
  needsOrgGovernanceDocs,
  getApplicantOrganizationType,
} from "./orgTypeRequirements";
export {
  resolveProjectedFsYears,
  projectedFinancialStatementLabel,
} from "./projectedFsDuration";
export {
  getRequirementEquipmentList,
  QUOTATIONS_PO_GUIDANCE,
  SUPPLIER_UNAVAILABILITY_HINT,
} from "./requirementEquipment";
export { financialStatementUploadLabel } from "../constants/financialStatementLabels";

export interface RequirementDocumentDef {
  id: string;
  complianceId: string;
  name: string;
  required: boolean;
  /** Requires articles of incorporation (coops / associations / SEC / CDA). */
  conditionalArticles?: boolean;
  /** Requires board / legislative resolution (corps, coops, SUCs, LGUs). */
  conditionalResolution?: boolean;
  /** Required only when the applicant's priority sector is in this list */
  conditionalSector?: string[];
  /** Per-equipment row derived from TNA Form 02 / Form 001 */
  equipmentId?: string;
  /** Helper text shown under the document name */
  hint?: string;
}

/** Step 4 uploads aligned with SETUP Guidelines Revision 3.0 / RTEC Form 002 compliance IDs */
export const SUBMISSION_REQUIREMENT_DOCS: RequirementDocumentDef[] = [
  {
    id: "permits",
    complianceId: "permits",
    name: "Business permits and licenses (LGU and other agencies)",
    required: true,
  },
  {
    id: "registration",
    complianceId: "registration",
    name: "Certificate of registration (DTI / SEC / CDA)",
    required: true,
  },
  {
    id: "financial",
    complianceId: "financial",
    name: "Financial statements with notarized sworn statement",
    required: true,
  },
  {
    id: "projected",
    complianceId: "projected",
    name: "Projected financial statements",
    required: true,
  },
  {
    id: "official-receipt",
    complianceId: "official-receipt",
    name: "Photocopy of official receipt",
    required: true,
  },
  {
    id: "articles",
    complianceId: "articles",
    name: "Articles of incorporation (cooperatives and associations)",
    required: false,
    conditionalArticles: true,
  },
  {
    id: "affidavit",
    complianceId: "affidavit",
    name: "Sworn affidavit (no relation to approving authority; no bad debt)",
    required: true,
  },
  {
    id: "resolution",
    complianceId: "resolution",
    name: "Board / legislative resolution authorizing assistance and signatory",
    required: false,
    conditionalResolution: true,
  },
  {
    id: "quotations",
    complianceId: "quotations",
    name: "Three (3) quotations per equipment from suppliers / fabricators",
    required: true,
    hint: QUOTATIONS_PO_GUIDANCE,
  },
  {
    id: "drawings",
    complianceId: "drawings",
    name: "Technical specifications, design / drawing / picture of equipment (per TNA Form 02)",
    required: true,
  },
  {
    id: "supplier-unavailability-affidavit",
    complianceId: "supplier-unavailability-affidavit",
    name: "Affidavit of supplier unavailability (emergency / calamity)",
    required: false,
    hint: SUPPLIER_UNAVAILABILITY_HINT,
  },
  {
    id: "ecc",
    complianceId: "ecc",
    name: "ECC or Certificate of Non-Coverage (CNC) — if in environmentally critical area",
    required: false,
  },
  {
    id: "fda-certificate",
    complianceId: "fda-certificate",
    name: "FDA License to Operate / Certificate (food sector enterprises)",
    required: false,
    conditionalSector: ["Food processing", "Beverage manufacturing"],
  },
];

export interface StoredRequirementUpload {
  id: string;
  complianceId: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  fileName?: string;
  mimeType?: string;
  dataUrl?: string;
  fileSizeBytes?: number;
  uploadedAt?: string;
  /** Backend file_uploads id when mirrored via the file API. */
  fileId?: string;
  /** Set when the projected FS row is generated from the financial projection island. */
  generatedFrom?: string;
  /** Per-equipment linkage */
  equipmentId?: string;
  hint?: string;
}

export type RequirementReviewStatus = "ok" | "flagged" | "";

export interface RequirementStaffRemark {
  status: RequirementReviewStatus;
  remark: string;
}

/** Persisted staff document-review draft (OK / Flag / remarks) under moduleData. */
export interface RequirementStaffReview {
  remarks: Record<string, RequirementStaffRemark>;
  staffNotes?: string;
  staffName?: string;
  updatedAt?: string;
  /** Last remark text notified per document id (dedup for immediate alerts). */
  notifiedRemarks?: Record<string, string>;
}

export const REQUIREMENT_STAFF_REVIEW_KEY = "requirementStaffReview";

const AGGREGATE_EQUIPMENT_DOC_IDS = new Set(["quotations", "drawings"]);

function resolveDocumentName(
  def: RequirementDocumentDef,
  applicant: Applicant | null,
): string {
  if (def.id === "financial") {
    return financialStatementUploadLabel(applicant?.msmeSize);
  }
  if (def.id === "projected") {
    return projectedFinancialStatementLabel(applicant);
  }
  return def.name;
}

function buildPerEquipmentDefs(
  applicant: Applicant | null,
): RequirementDocumentDef[] {
  const equipment = getRequirementEquipmentList(applicant);
  if (equipment.length === 0) return [];

  const defs: RequirementDocumentDef[] = [];
  for (const item of equipment) {
    defs.push({
      id: `quotations-${item.id}`,
      complianceId: "quotations",
      equipmentId: item.id,
      name: `Three (3) quotations — ${item.name}`,
      required: true,
      hint: QUOTATIONS_PO_GUIDANCE,
    });
    defs.push({
      id: `drawings-${item.id}`,
      complianceId: "drawings",
      equipmentId: item.id,
      name: `Technical specs / design / drawing / picture — ${item.name}`,
      required: true,
    });
  }
  return defs;
}

function expandRequirementDefs(applicant: Applicant | null): RequirementDocumentDef[] {
  const perEquipment = buildPerEquipmentDefs(applicant);
  const usePerEquipment = perEquipment.length > 0;
  const base = SUBMISSION_REQUIREMENT_DOCS.filter(
    (def) => !usePerEquipment || !AGGREGATE_EQUIPMENT_DOC_IDS.has(def.id),
  );
  if (!usePerEquipment) return base;

  const insertAt = base.findIndex((d) => d.id === "resolution");
  const head = insertAt >= 0 ? base.slice(0, insertAt + 1) : base;
  const tail = insertAt >= 0 ? base.slice(insertAt + 1) : [];
  return [...head, ...perEquipment, ...tail.filter((d) => !AGGREGATE_EQUIPMENT_DOC_IDS.has(d.id))];
}

function isDocumentRequired(
  def: RequirementDocumentDef,
  applicant: Applicant | null,
): boolean {
  if (def.required) return true;
  if (def.conditionalArticles && needsArticlesOfIncorporation(applicant)) return true;
  if (def.conditionalResolution && needsBoardResolution(applicant)) return true;
  if (def.conditionalSector) {
    const sector = normalizePrioritySector(applicant?.businessSector ?? "");
    return def.conditionalSector.includes(sector);
  }
  return false;
}

/**
 * Whether an immediate customer alert should fire for this document review change.
 * Fires when newly flagged, or when remark text changes to a new non-empty value
 * not already recorded in notifiedRemarks.
 */
export function shouldNotifyRequirementRemark(options: {
  prevStatus: RequirementReviewStatus;
  nextStatus: RequirementReviewStatus;
  nextRemark: string;
  notifiedRemark?: string;
}): boolean {
  const { prevStatus, nextStatus, nextRemark, notifiedRemark } = options;
  if (nextStatus !== "flagged") return false;
  const trimmed = nextRemark.trim();
  if (prevStatus !== "flagged") {
    return true;
  }
  if (!trimmed) return false;
  return trimmed !== (notifiedRemark ?? "").trim();
}

export function getRequirementAdditionalNotes(
  applicant: Applicant | null | undefined,
): string {
  return typeof applicant?.moduleData?.requirementAdditionalNotes === "string"
    ? applicant.moduleData.requirementAdditionalNotes
    : "";
}

export function getRequirementRevisionNotes(
  applicant: Applicant | null | undefined,
): string {
  return typeof applicant?.moduleData?.requirementRevisionNotes === "string"
    ? applicant.moduleData.requirementRevisionNotes
    : "";
}

export function getRequirementStaffDecisionDraft(
  applicant: Applicant | null | undefined,
): "approved" | "needs-revision" | "" {
  const draft = applicant?.moduleData?.requirementStaffDecisionDraft;
  if (draft === "approved" || draft === "needs-revision") return draft;
  const saved = applicant?.moduleData?.staffDecision;
  if (saved === "approved" || saved === "needs-revision") return saved;
  return "";
}

export function persistRequirementNotes(
  applicantId: string,
  patch: {
    additionalNotes?: string;
    revisionNotes?: string;
    staffDecisionDraft?: "approved" | "needs-revision" | "";
  },
  store: {
    getById: (id: string) => Applicant | undefined;
    update: (id: string, patch: Partial<Applicant>) => void;
  },
): void {
  const applicant = store.getById(applicantId);
  if (!applicant) return;
  store.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      ...(patch.additionalNotes !== undefined
        ? { requirementAdditionalNotes: patch.additionalNotes }
        : {}),
      ...(patch.revisionNotes !== undefined
        ? { requirementRevisionNotes: patch.revisionNotes }
        : {}),
      ...(patch.staffDecisionDraft !== undefined
        ? { requirementStaffDecisionDraft: patch.staffDecisionDraft }
        : {}),
    },
  });
}

export function getRequirementStaffReview(
  applicant: Applicant | null | undefined,
): RequirementStaffReview {
  const normalized = normalizeRequirementStaffReview(
    applicant?.moduleData?.[REQUIREMENT_STAFF_REVIEW_KEY],
  );
  const raw = normalized as RequirementStaffReview | undefined;
  const remarks: Record<string, RequirementStaffRemark> = {};
  if (raw?.remarks && typeof raw.remarks === "object") {
    for (const [id, entry] of Object.entries(raw.remarks)) {
      const status =
        entry?.status === "ok" || entry?.status === "flagged" ? entry.status : "";
      remarks[id] = {
        status,
        remark: typeof entry?.remark === "string" ? entry.remark : "",
      };
    }
  }
  const notifiedRemarks: Record<string, string> = {};
  if (raw?.notifiedRemarks && typeof raw.notifiedRemarks === "object") {
    for (const [id, value] of Object.entries(raw.notifiedRemarks)) {
      if (typeof value === "string") notifiedRemarks[id] = value;
    }
  }
  return {
    remarks,
    staffNotes: typeof raw?.staffNotes === "string" ? raw.staffNotes : "",
    staffName: typeof raw?.staffName === "string" ? raw.staffName : "",
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : undefined,
    notifiedRemarks,
  };
}

/**
 * Persist in-progress staff OK/Flag marks so they survive refresh / navigation.
 * Uses a dedicated moduleData object (staff-owned on the backend merge path).
 */
export function persistRequirementStaffReview(
  applicantId: string,
  patch: {
    remarks?: Record<string, RequirementStaffRemark>;
    staffNotes?: string;
    staffName?: string;
    notifiedRemarks?: Record<string, string>;
  },
  store: {
    getById: (id: string) => Applicant | undefined;
    update: (id: string, patch: Partial<Applicant>) => void;
  },
): void {
  const applicant = store.getById(applicantId);
  if (!applicant) return;
  const prev = getRequirementStaffReview(applicant);
  const next: RequirementStaffReview = {
    remarks: patch.remarks ?? prev.remarks,
    staffNotes:
      patch.staffNotes !== undefined ? patch.staffNotes : prev.staffNotes,
    staffName: patch.staffName !== undefined ? patch.staffName : prev.staffName,
    notifiedRemarks:
      patch.notifiedRemarks !== undefined
        ? patch.notifiedRemarks
        : prev.notifiedRemarks,
    updatedAt: new Date().toISOString(),
  };
  store.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [REQUIREMENT_STAFF_REVIEW_KEY]: next,
    },
  });
}

export function buildRequirementUploadList(
  applicant: Applicant | null,
): StoredRequirementUpload[] {
  const stored = (applicant?.moduleData?.requirementUploads ??
    []) as StoredRequirementUpload[];
  const storedById = new Map(stored.map((s) => [s.id, s]));

  return expandRequirementDefs(applicant)
    .filter((def) => {
      if (def.conditionalSector) {
        const sector = normalizePrioritySector(applicant?.businessSector ?? "");
        return def.conditionalSector.includes(sector);
      }
      return true;
    })
    .map((def) => {
      const prev = storedById.get(def.id);
      const required = isDocumentRequired(def, applicant);
      const name = resolveDocumentName(def, applicant);
      return {
        id: def.id,
        complianceId: def.complianceId,
        name,
        required,
        uploaded: prev?.uploaded ?? false,
        fileName: prev?.fileName,
        mimeType: prev?.mimeType,
        dataUrl: prev?.dataUrl,
        fileSizeBytes: prev?.fileSizeBytes,
        uploadedAt: prev?.uploadedAt,
        fileId: prev?.fileId,
        generatedFrom: prev?.generatedFrom,
        equipmentId: def.equipmentId,
        hint: def.hint,
      };
    });
}

export function persistRequirementUploads(
  applicantId: string,
  uploads: StoredRequirementUpload[],
  applicantStore: {
    getById: (id: string) => Applicant | undefined;
    update: (id: string, patch: Partial<Applicant>) => void;
  },
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      requirementUploads: uploads.map(
        ({
          id,
          complianceId,
          name,
          required,
          uploaded,
          fileName,
          mimeType,
          dataUrl,
          fileSizeBytes,
          uploadedAt,
          fileId,
          generatedFrom,
          equipmentId,
          hint,
        }) => ({
          id,
          complianceId,
          name,
          required,
          uploaded,
          fileName,
          mimeType,
          dataUrl,
          fileSizeBytes,
          uploadedAt,
          fileId,
          generatedFrom,
          equipmentId,
          hint,
        }),
      ),
      documents: uploads.filter((u) => u.uploaded),
      documentsSubmittedList: uploads.filter((u) => u.uploaded).map((u) => u.name),
    },
  });
}

export function countRequiredUploads(uploads: StoredRequirementUpload[]): {
  required: number;
  uploaded: number;
} {
  const requiredDocs = uploads.filter((u) => u.required);
  return {
    required: requiredDocs.length,
    uploaded: requiredDocs.filter((u) => u.uploaded).length,
  };
}

/**
 * Official RTEC Form 002 compliance wording (includes Micro vs SME FS year rules).
 * Do **not** use for applicant upload labels — use `financialStatementUploadLabel` instead.
 */
export function complianceLabel(complianceId: string): string {
  return (
    RTEC_COMPLIANCE_ITEMS.find((i) => i.id === complianceId)?.label ?? complianceId
  );
}
