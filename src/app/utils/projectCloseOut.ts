/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import type {
  EquipmentInventoryRow,
  ProjectCloseOutForm,
  ProjectCloseOutStored,
} from "../api/types";
import { hasRefundComplete } from "./refundDelinquent";
import { isDemoModeActive } from "./demoMode";
import { formatFormMention } from "../constants/setupForms";
import { normalizeFormModuleStored } from "./normalizeCriticalModuleData";
import { sumInventoryAmounts } from "../constants/inventoryOfEquipmentLayout";

const MODULE_KEY = "projectCloseOut";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyInventoryRow(): EquipmentInventoryRow {
  return {
    id: uid(),
    qty: "",
    description: "",
    amount: "",
    propertyNo: "",
    dateAcquired: "",
    remarks: "",
  };
}

/** Map legacy close-out inventory columns onto Form 006 fields. */
export function normalizeInventoryRow(
  raw: Partial<EquipmentInventoryRow> | Record<string, unknown>,
): EquipmentInventoryRow {
  const r = raw as Record<string, unknown>;
  const description = String(r.description ?? "").trim();
  const amount = String(r.amount ?? r.acquisitionCost ?? "").trim();
  const propertyNo = String(r.propertyNo ?? r.serialNumber ?? "").trim();
  const remarks = String(r.remarks ?? r.location ?? "").trim();
  const qtyRaw = String(r.qty ?? "").trim();
  const qty = qtyRaw || (description ? "1" : "");
  return {
    id: String(r.id ?? uid()),
    qty,
    description: String(r.description ?? ""),
    amount,
    propertyNo,
    dateAcquired: String(r.dateAcquired ?? ""),
    remarks,
    conditionOfPpe: String(r.conditionOfPpe ?? "").trim() || undefined,
  };
}

export function emptyCloseOutForm(): ProjectCloseOutForm {
  return {
    equipmentInventory: [emptyInventoryRow()],
    certificateOfOwnershipIssued: false,
  };
}

function normalizeCloseOutForm(
  form: ProjectCloseOutForm,
  applicant: Applicant | null,
): ProjectCloseOutForm {
  const signed =
    form.propertyTransferSignedFileName?.trim() ||
    form.equipmentAcknowledgementFileName?.trim() ||
    "";
  const reason =
    form.ptrReasonForTransfer?.trim() ||
    (form.ptrPhysicalTransferOnly ? "Physical Transfer Only" : "");
  return {
    ...form,
    propertyTransferSignedFileName: signed || undefined,
    ptrReasonForTransfer: reason || undefined,
    inventoryProjectTitle:
      form.inventoryProjectTitle?.trim() || readModuleProjectTitle(applicant) || "",
    inventoryProjectCooperator:
      form.inventoryProjectCooperator?.trim() || applicant?.enterpriseName || "",
  };
}

function readModuleProjectTitle(applicant: Applicant | null): string {
  if (!applicant?.moduleData) return "";
  const md = applicant.moduleData;
  const fromProposal = (md.projectProposal as { form?: { projectTitle?: string } } | undefined)
    ?.form?.projectTitle;
  if (fromProposal?.trim()) return fromProposal.trim();
  const fromApproval = (md.approvalLetter as { form?: { projectTitle?: string } } | undefined)?.form
    ?.projectTitle;
  if (fromApproval?.trim()) return fromApproval.trim();
  const fromPis = (md.projectInformationSheet as { prePisDraft?: { projectTitle?: string } } | undefined)
    ?.prePisDraft?.projectTitle;
  if (fromPis?.trim()) return fromPis.trim();
  return "";
}

export function getCloseOutStored(applicant: Applicant | null): ProjectCloseOutStored | null {
  if (!applicant?.moduleData?.[MODULE_KEY]) return null;
  const normalized = normalizeFormModuleStored(applicant.moduleData[MODULE_KEY]);
  return (normalized as ProjectCloseOutStored | undefined) ?? null;
}

export function getCloseOutForm(applicant: Applicant | null): ProjectCloseOutForm {
  const form = getCloseOutStored(applicant)?.form;
  if (!form) {
    const empty = emptyCloseOutForm();
    if (!applicant) return empty;
    return normalizeCloseOutForm(
      {
        ...empty,
        inventoryProjectTitle: readModuleProjectTitle(applicant),
        inventoryProjectCooperator: applicant.enterpriseName ?? "",
      },
      applicant,
    );
  }
  const rawInventory = Array.isArray(form.equipmentInventory)
    ? form.equipmentInventory
    : form.equipmentInventory
      ? [form.equipmentInventory]
      : [];
  const equipmentInventory =
    rawInventory.length > 0
      ? rawInventory.map((r) => normalizeInventoryRow(r as unknown as Record<string, unknown>))
      : emptyCloseOutForm().equipmentInventory;

  return normalizeCloseOutForm(
    {
      ...form,
      equipmentInventory,
    },
    applicant,
  );
}

export function inventoryAmountTotal(form: ProjectCloseOutForm): number {
  return sumInventoryAmounts(form.equipmentInventory);
}

export function hasCloseOutPrerequisite(applicant: Applicant | null): boolean {
  return hasRefundComplete(applicant);
}

export function hasCloseOutComplete(applicant: Applicant | null): boolean {
  return !!getCloseOutStored(applicant)?.submitted;
}

export function saveCloseOutDraft(applicantId: string, form: ProjectCloseOutForm): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getCloseOutStored(applicant);
  const normalizedInventory = form.equipmentInventory.map((r) => normalizeInventoryRow(r));
  const nextForm: ProjectCloseOutForm = {
    ...form,
    equipmentInventory: normalizedInventory,
  };
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form: nextForm,
        submitted: existing?.submitted,
        submittedAt: existing?.submittedAt,
        submittedBy: existing?.submittedBy,
        updatedAt: new Date().toISOString(),
      } satisfies ProjectCloseOutStored,
    },
  });
}

export function validateCloseOutSubmit(applicant: Applicant | null): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!hasCloseOutPrerequisite(applicant)) {
    errors.push("Complete refund monitoring setup before project close-out.");
  }
  const form = getCloseOutForm(applicant);
  if (!form.terminalReportFileName?.trim()) {
    errors.push(`Upload ${formatFormMention("010", "both")}.`);
  }
  if (!form.auditedFinancialFileName?.trim()) {
    errors.push("Upload audited financial report.");
  }
  if (!form.ptrFromAccountableOfficer?.trim()) {
    errors.push(`Complete ${formatFormMention("005")} — From accountable officer.`);
  }
  if (!form.ptrToAccountableOfficer?.trim()) {
    errors.push(`Complete ${formatFormMention("005")} — To accountable officer.`);
  }
  if (!form.ptrDate?.trim()) {
    errors.push(`Complete ${formatFormMention("005")} — PTR date.`);
  }
  if (!form.ptrTransferType?.trim()) {
    errors.push(`Select ${formatFormMention("005")} transfer type.`);
  }
  if (!form.ptrReasonForTransfer?.trim()) {
    errors.push(`Complete ${formatFormMention("005")} — Reason for Transfer.`);
  }
  if (!form.ptrApprovedByName?.trim()) {
    errors.push(`Complete ${formatFormMention("005")} — Approved by name.`);
  }
  if (!form.ptrReceivedBy?.trim()) {
    errors.push(`Complete ${formatFormMention("005")} — Received by.`);
  }
  if (
    !form.equipmentInventory.some(
      (r) => r.description.trim() && r.propertyNo.trim(),
    )
  ) {
    errors.push("Complete at least one property row with description and property number.");
  }
  if (!form.propertyTransferSignedFileName?.trim()) {
    errors.push(`Upload signed ${formatFormMention("005")} scan.`);
  }
  if (form.equipmentInventory.every((r) => !r.description.trim())) {
    errors.push("Complete at least one equipment inventory row.");
  }
  if (!form.certificateOfOwnershipIssued) {
    errors.push("Confirm Certificate of Ownership and IRP issuance.");
  }
  return errors;
}

export function submitCloseOut(applicantId: string, submittedBy: string): string[] {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return ["Applicant not found."];
  const errors = validateCloseOutSubmit(applicant);
  if (errors.length) return errors;

  applicantStore.update(applicantId, {
    currentModule: "completed",
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form: getCloseOutForm(applicant),
        submitted: true,
        submittedAt: new Date().toISOString(),
        submittedBy,
        updatedAt: new Date().toISOString(),
      } satisfies ProjectCloseOutStored,
    },
  });
  return [];
}
