/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import type {
  LiquidationEntry,
  ModuleDocument,
  ProcurementDocument,
  ProcurementForm,
  ProcurementLineItem,
  ProcurementStored,
} from "../api/types";
import { getLandBankOverview, hasLandBankComplete } from "./landBankWithdrawal";
import { formatCurrency } from "./landBankWithdrawal";
import { isDemoModeActive } from "./demoMode";
import { normalizeFormModuleStored } from "./normalizeCriticalModuleData";

const MODULE_KEY = "procurement";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyProcurementForm(): ProcurementForm {
  return {
    documents: [],
    items: [],
    liquidations: [],
    untagged: false,
  };
}

export function normalizeProcurementForm(
  form: Partial<ProcurementForm> | null | undefined,
): ProcurementForm {
  const base = emptyProcurementForm();
  if (!form) return base;

  const legacyDocs = Array.isArray(form.liquidationDocuments)
    ? form.liquidationDocuments
    : form.liquidationDocuments
      ? [form.liquidationDocuments]
      : [];
  let liquidations = Array.isArray(form.liquidations)
    ? [...form.liquidations]
    : form.liquidations
      ? [form.liquidations]
      : [];

  if (liquidations.length === 0 && legacyDocs.length > 0) {
    liquidations = [
      {
        id: uid(),
        title: "Legacy liquidation",
        amount: "",
        date: legacyDocs[0]?.uploadedAt ?? "",
        remarks: "",
        attachments: legacyDocs,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  liquidations = liquidations.map((entry) => ({
    id: entry.id || uid(),
    title: entry.title ?? "",
    amount: entry.amount ?? "",
    date: entry.date ?? "",
    remarks: entry.remarks ?? "",
    attachments: Array.isArray(entry.attachments) ? entry.attachments : [],
    createdAt: entry.createdAt ?? new Date().toISOString(),
    createdBy: entry.createdBy,
    updatedAt: entry.updatedAt,
  }));

  return {
    documents: Array.isArray(form.documents)
      ? form.documents
      : form.documents
        ? [form.documents]
        : [],
    items: Array.isArray(form.items)
      ? form.items
      : form.items
        ? [form.items]
        : [],
    liquidations,
    staffReview: form.staffReview,
    untagged: !!form.untagged,
    untaggedAt: form.untaggedAt,
  };
}

export function hasLiquidationFiled(form: ProcurementForm | null): boolean {
  if (!form) return false;
  return form.liquidations.some((e) => e.attachments.length > 0);
}

export function getProcurementStored(applicant: Applicant | null): ProcurementStored | null {
  if (!applicant?.moduleData?.[MODULE_KEY]) return null;
  const normalized = normalizeFormModuleStored(applicant.moduleData[MODULE_KEY]);
  return (normalized as ProcurementStored | undefined) ?? null;
}

export function getProcurementForm(applicant: Applicant | null): ProcurementForm {
  const stored = getProcurementStored(applicant);
  return normalizeProcurementForm(stored?.form);
}

export function hasProcurementPrerequisite(applicant: Applicant | null): boolean {
  return hasLandBankComplete(applicant);
}

export function hasProcurementComplete(applicant: Applicant | null): boolean {
  return !!getProcurementStored(applicant)?.submitted;
}

export interface ProcurementFinancialSummary {
  approvedAmount: string;
  totalDisbursed: string;
  remainingBalance: string;
}

export function getProcurementFinancialSummary(
  applicant: Applicant | null,
): ProcurementFinancialSummary {
  const overview = getLandBankOverview(applicant);
  const form = getProcurementForm(applicant);
  const disbursed = form.items.reduce((sum, item) => {
    const val = parseFloat(String(item.totalCost).replace(/[^\d.]/g, "")) || 0;
    return sum + val;
  }, 0);
  const approved =
    parseFloat(overview.approvedAmount.replace(/[^\d.]/g, "")) || 0;
  const remaining = Math.max(0, approved - disbursed);
  return {
    approvedAmount: overview.approvedAmount,
    totalDisbursed: formatCurrency(disbursed),
    remainingBalance: formatCurrency(remaining),
  };
}

export function saveProcurementDraft(applicantId: string, form: ProcurementForm): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getProcurementStored(applicant);
  const normalized = normalizeProcurementForm(form);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form: normalized,
        untagLetter: existing?.untagLetter,
        submitted: existing?.submitted,
        submittedAt: existing?.submittedAt,
        submittedBy: existing?.submittedBy,
        updatedAt: new Date().toISOString(),
      } satisfies ProcurementStored,
    },
  });
}

export function addProcurementDocument(
  applicantId: string,
  moduleDoc: ModuleDocument,
  amount?: string,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getProcurementForm(applicant);
  const doc: ProcurementDocument = {
    id: uid(),
    fileName: moduleDoc.fileName,
    mimeType: moduleDoc.mimeType,
    dataUrl: moduleDoc.dataUrl,
    uploadedBy: moduleDoc.uploadedBy,
    uploadedAt: moduleDoc.uploadedAt.split("T")[0],
    fileId: moduleDoc.fileId,
    amount,
  };
  saveProcurementDraft(applicantId, {
    ...form,
    documents: [...form.documents, doc],
  });
}

export function addProcurementItem(applicantId: string): ProcurementLineItem {
  const item: ProcurementLineItem = {
    id: uid(),
    description: "",
    supplier: "",
    purchaseDate: "",
    quantity: 1,
    totalCost: "",
  };
  const applicant = applicantStore.getById(applicantId);
  if (applicant) {
    const form = getProcurementForm(applicant);
    saveProcurementDraft(applicantId, {
      ...form,
      items: [...form.items, item],
    });
  }
  return item;
}

export function updateProcurementItem(
  applicantId: string,
  itemId: string,
  patch: Partial<ProcurementLineItem>,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getProcurementForm(applicant);
  saveProcurementDraft(applicantId, {
    ...form,
    items: form.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
  });
}

export function removeProcurementItem(applicantId: string, itemId: string): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getProcurementForm(applicant);
  saveProcurementDraft(applicantId, {
    ...form,
    items: form.items.filter((i) => i.id !== itemId),
  });
}

export function addLiquidation(
  applicantId: string,
  createdBy?: string,
): LiquidationEntry {
  const entry: LiquidationEntry = {
    id: uid(),
    title: "",
    amount: "",
    date: "",
    remarks: "",
    attachments: [],
    createdAt: new Date().toISOString(),
    createdBy,
  };
  const applicant = applicantStore.getById(applicantId);
  if (applicant) {
    const form = getProcurementForm(applicant);
    saveProcurementDraft(applicantId, {
      ...form,
      liquidations: [...form.liquidations, entry],
    });
  }
  return entry;
}

export function updateLiquidation(
  applicantId: string,
  entryId: string,
  patch: Partial<Omit<LiquidationEntry, "id" | "attachments" | "createdAt">>,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getProcurementForm(applicant);
  saveProcurementDraft(applicantId, {
    ...form,
    liquidations: form.liquidations.map((e) =>
      e.id === entryId
        ? { ...e, ...patch, updatedAt: new Date().toISOString() }
        : e,
    ),
  });
}

export function removeLiquidation(applicantId: string, entryId: string): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getProcurementForm(applicant);
  saveProcurementDraft(applicantId, {
    ...form,
    liquidations: form.liquidations.filter((e) => e.id !== entryId),
  });
}

export function addLiquidationAttachment(
  applicantId: string,
  entryId: string,
  moduleDoc: ModuleDocument,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getProcurementForm(applicant);
  const doc: ProcurementDocument = {
    id: uid(),
    fileName: moduleDoc.fileName,
    mimeType: moduleDoc.mimeType,
    dataUrl: moduleDoc.dataUrl,
    uploadedBy: moduleDoc.uploadedBy,
    uploadedAt: moduleDoc.uploadedAt.split("T")[0],
    fileId: moduleDoc.fileId,
  };
  saveProcurementDraft(applicantId, {
    ...form,
    liquidations: form.liquidations.map((e) =>
      e.id === entryId
        ? {
            ...e,
            attachments: [...e.attachments, doc],
            updatedAt: new Date().toISOString(),
          }
        : e,
    ),
  });
}

export function removeLiquidationAttachment(
  applicantId: string,
  entryId: string,
  attachmentId: string,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getProcurementForm(applicant);
  saveProcurementDraft(applicantId, {
    ...form,
    liquidations: form.liquidations.map((e) =>
      e.id === entryId
        ? {
            ...e,
            attachments: e.attachments.filter((a) => a.id !== attachmentId),
            updatedAt: new Date().toISOString(),
          }
        : e,
    ),
  });
}

/** @deprecated Prefer addLiquidationAttachment on a LiquidationEntry. */
export function addLiquidationDocument(
  applicantId: string,
  moduleDoc: ModuleDocument,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getProcurementForm(applicant);
  let entryId = form.liquidations[0]?.id;
  if (!entryId) {
    const created = addLiquidation(applicantId, moduleDoc.uploadedBy);
    entryId = created.id;
  }
  addLiquidationAttachment(applicantId, entryId, moduleDoc);
}

export function setAccountUntagged(applicantId: string): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const form = getProcurementForm(applicant);
  saveProcurementDraft(applicantId, {
    ...form,
    untagged: true,
    untaggedAt: new Date().toISOString(),
  });
}

export function validateProcurementSubmit(applicant: Applicant | null): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!hasProcurementPrerequisite(applicant)) {
    errors.push("Complete LandBank & Withdrawal (Modules 11–13) before procurement.");
  }
  const form = getProcurementForm(applicant);
  if (form.documents.length === 0) {
    errors.push("Upload at least one procurement document (OR, invoice, or delivery receipt).");
  }
  if (form.items.length === 0) {
    errors.push("Add at least one procurement line item.");
  }
  if (!hasLiquidationFiled(form)) {
    errors.push(
      "Staff must add at least one liquidation with at least one attachment.",
    );
  }
  if (!form.untagged) {
    errors.push("Complete account untagging before proceeding to monitoring.");
  }
  if (!getProcurementStored(applicant)?.untagLetter?.published) {
    errors.push("Publish the Letter to Untag before submitting this module.");
  }
  return errors;
}

export function submitProcurement(applicantId: string, submittedBy: string): string[] {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return ["Applicant not found."];
  const errors = validateProcurementSubmit(applicant);
  if (errors.length) return errors;

  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form: getProcurementForm(applicant),
        untagLetter: getProcurementStored(applicant)?.untagLetter,
        submitted: true,
        submittedAt: new Date().toISOString(),
        submittedBy,
        updatedAt: new Date().toISOString(),
      } satisfies ProcurementStored,
    },
  });
  return [];
}
