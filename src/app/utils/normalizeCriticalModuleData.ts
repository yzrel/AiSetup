/**
 * Author: Yzrel Jade B. Eborde
 *
 * Normalize-on-read for critical moduleData keys. Keeps legacy blobs usable
 * without a full schema rewrite.
 */

import type {
  ApprovalLetterForm,
  ApprovalLetterStored,
  SignedMoaDocument,
} from "../api/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Coerce a JSON array, or a single object (1-element array collapsed by
 * PowerShell ConvertTo-Json), into a list. Scalars become [].
 */
export function asObjectList<T = unknown>(value: unknown): T[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "object") return [value as T];
  return [];
}

function coerceArrayKeys(
  target: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const key of keys) {
    if (key in out) out[key] = asObjectList(out[key]);
  }
  return out;
}

/** Shared publish-document coerce: object + form object + published boolean. */
export function normalizePublishDocumentStored(
  raw: unknown,
): Record<string, unknown> | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const out: Record<string, unknown> = { ...obj };
  if (obj.form != null) {
    const form = asRecord(obj.form);
    if (form) out.form = form;
    else delete out.form;
  }
  if ("published" in obj) {
    out.published = asBool(obj.published);
  }
  if ("submitted" in obj) {
    out.submitted = asBool(obj.submitted);
  }
  return out;
}

export function normalizeSignedMoaDocument(
  raw: unknown,
): SignedMoaDocument | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const fileName = asString(obj.fileName);
  const moaSignedDate = asString(obj.moaSignedDate);
  const fileId = asString(obj.fileId);
  const notes = typeof obj.notes === "string" ? obj.notes : undefined;
  const signingVenue =
    typeof obj.signingVenue === "string" ? obj.signingVenue : undefined;
  // Allow metadata-only drafts (date/venue/notes) before a scan is attached.
  if (!fileName.trim() && !moaSignedDate.trim() && !fileId.trim() && !notes && !signingVenue) {
    return undefined;
  }
  return {
    fileName,
    mimeType: asString(obj.mimeType, "application/octet-stream"),
    dataUrl: typeof obj.dataUrl === "string" ? obj.dataUrl : undefined,
    uploadedAt: asString(obj.uploadedAt),
    uploadedBy: asString(obj.uploadedBy),
    moaSignedDate,
    signingVenue,
    notes,
    fileId: fileId || undefined,
    hasFileContent:
      typeof obj.hasFileContent === "boolean" ? obj.hasFileContent : undefined,
  };
}

export function normalizeApprovalLetterStored(
  raw: unknown,
): ApprovalLetterStored | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const formRaw = asRecord(obj.form) ?? {};
  const form = { ...formRaw } as unknown as ApprovalLetterForm;
  const body = formRaw.bodyParagraphs;
  if (Array.isArray(body)) {
    form.bodyParagraphs = body.map((line) => String(line ?? ""));
  } else if (typeof body === "string" && body.trim()) {
    form.bodyParagraphs = [body];
  } else if (body && typeof body === "object") {
    form.bodyParagraphs = [String(body)];
  }
  const published = asBool(obj.published) || asBool(formRaw.published);
  const rdRaw = typeof obj.rdDecision === "string" ? obj.rdDecision.trim() : "";
  const rdDecision =
    rdRaw === "approved" || rdRaw === "disapproved" ? rdRaw : null;
  return {
    form,
    published,
    publishedAt: typeof obj.publishedAt === "string" ? obj.publishedAt : undefined,
    acknowledged: asBool(obj.acknowledged),
    acknowledgedAt:
      typeof obj.acknowledgedAt === "string" ? obj.acknowledgedAt : undefined,
    rdDecision,
    rdDecidedBy:
      typeof obj.rdDecidedBy === "string" ? obj.rdDecidedBy : undefined,
    rdDecidedAt:
      typeof obj.rdDecidedAt === "string" ? obj.rdDecidedAt : undefined,
    rdRemarks: typeof obj.rdRemarks === "string" ? obj.rdRemarks : undefined,
    signedMoa: normalizeSignedMoaDocument(obj.signedMoa),
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : undefined,
  };
}

export function normalizeSignedDocumentsMap(
  raw: unknown,
): Record<string, Record<string, unknown>> {
  const obj = asRecord(raw);
  if (!obj) return {};
  const out: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of Object.entries(obj)) {
    const entry = asRecord(value);
    if (!entry) continue;
    const fileName = asString(entry.fileName).trim();
    if (!fileName && !asString(entry.fileId).trim()) continue;
    out[key] = {
      ...entry,
      fileName: fileName || asString(entry.fileName),
      hasFileContent: asBool(entry.hasFileContent, Boolean(entry.dataUrl || entry.fileId)),
    };
  }
  return out;
}

/** Coerce LOI document blob; drop non-objects. */
export function normalizeLoiDocument(
  raw: unknown,
): Record<string, unknown> | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const out = coerceArrayKeys(obj, ["bodyParagraphs"]);
  const regional = asRecord(out.regionalAddressee);
  if (regional) {
    out.regionalAddressee = coerceArrayKeys(regional, ["lines", "addressLines"]);
  }
  const thru = asRecord(out.thruAddressee);
  if (thru) {
    out.thruAddressee = coerceArrayKeys(thru, ["lines", "addressLines"]);
  }
  return out;
}

/**
 * Ensure TNA1 payload has object form/tables and boolean submitted.
 */
export function normalizeTna1Stored(raw: unknown): Record<string, unknown> | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const form = asRecord(obj.form) ?? {};
  const tablesRaw = asRecord(obj.tables) ?? {};
  const tables = coerceArrayKeys(tablesRaw, [
    "rawMaterials",
    "production",
    "equipment",
  ]);
  return {
    ...obj,
    form,
    tables,
    submitted: asBool(obj.submitted),
  };
}

export function normalizeFinancialProjectionStored(
  raw: unknown,
): Record<string, unknown> | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const inputs = asRecord(obj.inputs);
  if (!inputs) return undefined;
  const out: Record<string, unknown> = {
    ...obj,
    inputs: coerceArrayKeys(inputs, [
      "equipment",
      "preoperating",
      "products",
      "setupRefundByYear",
    ]),
    source: "wizard",
    submitted: asBool(obj.submitted),
  };
  if (obj.snapshot != null) {
    const snapshot = asRecord(obj.snapshot);
    if (snapshot) out.snapshot = snapshot;
    else delete out.snapshot;
  }
  if (typeof obj.frozenAt === "string") out.frozenAt = obj.frozenAt;
  else delete out.frozenAt;
  return out;
}

export function normalizeProjectProposalStored(
  raw: unknown,
): Record<string, unknown> | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const form = coerceArrayKeys(asRecord(obj.form) ?? {}, [
    "specificObjectives",
    "rawMaterialsTable",
    "rawMaterialCostTable",
    "rawMaterialAllocationTable",
    "compensationTable",
    "productPriceTable",
    "marketStrategies",
    "equipmentTable",
    "interventionCostTable",
    "fabricatorTable",
    "scheduleTable",
    "expectedOutputBullets",
    "liquidityRatioTable",
    "quickRatioTable",
    "roiTable",
    "budgetItems",
    "refundSchedule",
    "riskRows",
  ]);
  const out: Record<string, unknown> = {
    ...obj,
    form,
    attachments: asObjectList(obj.attachments),
    submitted: asBool(obj.submitted),
  };
  if ("published" in obj) {
    out.published = asBool(obj.published);
  }
  return out;
}

export function normalizeTna2Stored(
  raw: unknown,
): Record<string, unknown> | undefined {
  return normalizePublishDocumentStored(raw);
}

export function normalizeTna2DocumentStored(
  raw: unknown,
): Record<string, unknown> | undefined {
  return normalizePublishDocumentStored(raw);
}

export function normalizeRtecReportStored(
  raw: unknown,
): Record<string, unknown> | undefined {
  const base = normalizePublishDocumentStored(raw);
  if (!base) return undefined;
  const form = asRecord(base.form);
  if (form) {
    const next = coerceArrayKeys(form, [
      "constraintRows",
      "fabricatorRows",
      "complianceItems",
      "attachmentRefs",
    ]);
    const snapshot = asRecord(next.proposalSnapshot);
    if (snapshot) {
      next.proposalSnapshot = coerceArrayKeys(snapshot, [
        "specificObjectives",
        "marketStrategies",
        "budgetItems",
        "riskRows",
        "fabricatorTable",
        "expectedOutputBullets",
        "refundSchedule",
        "compensationTable",
        "rawMaterialCostTable",
        "rawMaterialAllocationTable",
      ]);
    }
    base.form = next;
  }
  return base;
}

export function normalizeConductRtecStored(
  raw: unknown,
): Record<string, unknown> | undefined {
  return normalizePublishDocumentStored(raw);
}

export function normalizeRequirementStaffReview(
  raw: unknown,
): Record<string, unknown> | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const out: Record<string, unknown> = { ...obj };
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "boolean" || value === null) {
      out[key] = value;
    } else if (typeof value === "string" || typeof value === "number") {
      out[key] = value;
    } else if (asRecord(value)) {
      out[key] = value;
    }
    // drop arrays / non-plain junk for integrity
  }
  return out;
}

export function normalizeLbpIntroductionLetterStored(
  raw: unknown,
): Record<string, unknown> | undefined {
  return normalizePublishDocumentStored(raw);
}

export function normalizeFormModuleStored(
  raw: unknown,
): Record<string, unknown> | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const form = coerceArrayKeys(asRecord(obj.form) ?? {}, [
    "documents",
    "items",
    "liquidations",
    "pdcs",
    "refundSchedule",
    "equipmentInventory",
  ]);
  return {
    ...obj,
    form,
    submitted: asBool(obj.submitted),
  };
}

/**
 * Coerce LandBank stored shape; keep introductionLetter typed when present.
 */
export function normalizeLandBankStored(
  raw: unknown,
): Record<string, unknown> | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;
  const out: Record<string, unknown> = { ...obj };
  if (obj.form != null && !asRecord(obj.form)) {
    delete out.form;
  } else if (asRecord(obj.form)) {
    const form = { ...asRecord(obj.form)! };
    const tranches = asRecord(form.tranches);
    if (tranches) {
      const nextTranches: Record<string, unknown> = { ...tranches };
      for (const key of ["first", "second"] as const) {
        const pack = asRecord(tranches[key]);
        if (pack) {
          nextTranches[key] = coerceArrayKeys(pack, [
            "equipment",
            "quotations",
            "equipmentPhotos",
          ]);
        }
      }
      form.tranches = nextTranches;
    }
    out.form = form;
  }
  const intro = obj.introductionLetter;
  if (intro != null) {
    const introNorm = normalizeLbpIntroductionLetterStored(intro);
    if (introNorm) out.introductionLetter = introNorm;
    else delete out.introductionLetter;
  }
  // Attestation must be boolean or absent — coerce non-booleans away on read.
  if (out.signedMoa != null && typeof out.signedMoa !== "boolean") {
    delete out.signedMoa;
  }
  return out;
}

function putNormalized(
  out: Record<string, unknown>,
  key: string,
  normalized: Record<string, unknown> | ApprovalLetterStored | undefined | null,
): void {
  if (normalized) out[key] = normalized;
  else delete out[key];
}

/**
 * Normalize critical keys once on hydrate from the backend SoR.
 * Corrupt known-key shapes are dropped rather than left as scalars/arrays.
 */
export function normalizeModuleDataForHydrate(
  moduleData: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!moduleData) return {};
  const out: Record<string, unknown> = { ...moduleData };

  if ("approvalLetter" in out) {
    putNormalized(out, "approvalLetter", normalizeApprovalLetterStored(out.approvalLetter));
  }
  if ("loiDocument" in out) {
    putNormalized(out, "loiDocument", normalizeLoiDocument(out.loiDocument));
  }
  if ("tna1" in out) {
    putNormalized(out, "tna1", normalizeTna1Stored(out.tna1));
  }
  if ("projectProposal" in out) {
    putNormalized(out, "projectProposal", normalizeProjectProposalStored(out.projectProposal));
  }
  if ("financialProjection" in out) {
    putNormalized(
      out,
      "financialProjection",
      normalizeFinancialProjectionStored(out.financialProjection),
    );
  }
  if ("tna2" in out) {
    putNormalized(out, "tna2", normalizeTna2Stored(out.tna2));
  }
  if ("tna2Document" in out) {
    putNormalized(out, "tna2Document", normalizeTna2DocumentStored(out.tna2Document));
  }
  if ("rtecReport" in out) {
    putNormalized(out, "rtecReport", normalizeRtecReportStored(out.rtecReport));
  }
  if ("conductRtec" in out) {
    putNormalized(out, "conductRtec", normalizeConductRtecStored(out.conductRtec));
  }
  if ("requirementStaffReview" in out) {
    putNormalized(
      out,
      "requirementStaffReview",
      normalizeRequirementStaffReview(out.requirementStaffReview),
    );
  }
  if ("lbpIntroduction" in out) {
    putNormalized(
      out,
      "lbpIntroduction",
      normalizeLbpIntroductionLetterStored(out.lbpIntroduction),
    );
  }
  if ("lbpIntroductionLetter" in out) {
    putNormalized(
      out,
      "lbpIntroductionLetter",
      normalizeLbpIntroductionLetterStored(out.lbpIntroductionLetter),
    );
  }
  if ("landBank" in out) {
    putNormalized(out, "landBank", normalizeLandBankStored(out.landBank));
  }
  if ("procurement" in out) {
    putNormalized(out, "procurement", normalizeFormModuleStored(out.procurement));
  }
  if ("refund" in out) {
    putNormalized(out, "refund", normalizeFormModuleStored(out.refund));
  }
  if ("projectCloseOut" in out) {
    putNormalized(out, "projectCloseOut", normalizeFormModuleStored(out.projectCloseOut));
  }
  if ("signedDocuments" in out) {
    out.signedDocuments = normalizeSignedDocumentsMap(out.signedDocuments);
  }
  if ("signedMoa" in out) {
    const moa = normalizePublishDocumentStored(out.signedMoa);
    putNormalized(out, "signedMoa", moa);
  }
  return out;
}

/** Preserve published=true when merging a stale draft over a published letter. */
export function mergeApprovalLetterPreservePublished(
  existing: ApprovalLetterStored | null | undefined,
  incoming: ApprovalLetterStored,
): ApprovalLetterStored {
  if (!existing?.published) return incoming;
  return {
    ...incoming,
    published: true,
    publishedAt: existing.publishedAt ?? incoming.publishedAt,
    signedMoa: incoming.signedMoa ?? existing.signedMoa,
    acknowledged: incoming.acknowledged || existing.acknowledged,
    acknowledgedAt: incoming.acknowledgedAt ?? existing.acknowledgedAt,
    rdDecision: incoming.rdDecision ?? existing.rdDecision,
    rdDecidedBy: incoming.rdDecidedBy ?? existing.rdDecidedBy,
    rdDecidedAt: incoming.rdDecidedAt ?? existing.rdDecidedAt,
    rdRemarks: incoming.rdRemarks ?? existing.rdRemarks,
  };
}
