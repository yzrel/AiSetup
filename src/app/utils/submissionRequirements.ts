/**
 * Author: Yzrel Jade B. Eborde
 */

import { Applicant } from "../store/applicantStore";
import { RTEC_COMPLIANCE_ITEMS } from "./rtecReport";
import { isNonSingleProprietor } from "./proprietorTrack";

export { isNonSingleProprietor, isNonSingleProprietor as isNonSoleProprietorship } from "./proprietorTrack";

export interface RequirementDocumentDef {
  id: string;
  complianceId: string;
  name: string;
  required: boolean;
  /** Shown when org type is not sole proprietorship */
  conditionalOrg?: boolean;
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
    name: "Financial statements (past 3 years) with notarized sworn statement",
    required: true,
  },
  {
    id: "projected",
    complianceId: "projected",
    name: "Projected financial statements (next 5 years)",
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
    conditionalOrg: true,
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
    conditionalOrg: true,
  },
  {
    id: "quotations",
    complianceId: "quotations",
    name: "Three (3) quotations per equipment from suppliers / fabricators",
    required: true,
  },
  {
    id: "drawings",
    complianceId: "drawings",
    name: "Complete technical design / drawing of equipment",
    required: true,
  },
  {
    id: "ecc",
    complianceId: "ecc",
    name: "ECC or Certificate of Non-Coverage (CNC) — if in environmentally critical area",
    required: false,
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
}

export function buildRequirementUploadList(
  applicant: Applicant | null,
): StoredRequirementUpload[] {
  const stored = (applicant?.moduleData?.requirementUploads ??
    []) as StoredRequirementUpload[];
  const storedById = new Map(stored.map((s) => [s.id, s]));
  const needsOrgDocs = isNonSingleProprietor(applicant);

  return SUBMISSION_REQUIREMENT_DOCS.map((def) => {
    const prev = storedById.get(def.id);
    const required =
      def.required || (def.conditionalOrg === true && needsOrgDocs);
    return {
      id: def.id,
      complianceId: def.complianceId,
      name: def.name,
      required,
      uploaded: prev?.uploaded ?? false,
      fileName: prev?.fileName,
      mimeType: prev?.mimeType,
      dataUrl: prev?.dataUrl,
      fileSizeBytes: prev?.fileSizeBytes,
      uploadedAt: prev?.uploadedAt,
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

export function complianceLabel(complianceId: string): string {
  return (
    RTEC_COMPLIANCE_ITEMS.find((i) => i.id === complianceId)?.label ?? complianceId
  );
}
