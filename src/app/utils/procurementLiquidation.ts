/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import type {
  ModuleDocument,
  ProcurementDocument,
  ProcurementForm,
  ProcurementStored,
} from "../api/types";
import { getLandBankOverview, hasLandBankComplete } from "./landBankWithdrawal";
import { formatCurrency } from "./landBankWithdrawal";
import { isDemoModeActive } from "./demoMode";

const MODULE_KEY = "procurement";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyProcurementForm(): ProcurementForm {
  return {
    documents: [],
    items: [],
    liquidationDocuments: [],
    untagged: false,
  };
}

export function getProcurementStored(applicant: Applicant | null): ProcurementStored | null {
  if (!applicant?.moduleData?.[MODULE_KEY]) return null;
  return applicant.moduleData[MODULE_KEY] as ProcurementStored;
}

export function getProcurementForm(applicant: Applicant | null): ProcurementForm {
  const stored = getProcurementStored(applicant);
  return stored?.form ?? emptyProcurementForm();
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
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form,
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

export function addLiquidationDocument(
  applicantId: string,
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
  };
  saveProcurementDraft(applicantId, {
    ...form,
    liquidationDocuments: [...form.liquidationDocuments, doc],
  });
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
  if (form.liquidationDocuments.length === 0) {
    errors.push("Upload at least one liquidation document.");
  }
  if (!form.untagged) {
    errors.push("Complete account untagging before proceeding to monitoring.");
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
        submitted: true,
        submittedAt: new Date().toISOString(),
        submittedBy,
        updatedAt: new Date().toISOString(),
      } satisfies ProcurementStored,
    },
  });
  return [];
}
