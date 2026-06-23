/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import type { ProjectCloseOutForm, ProjectCloseOutStored } from "../api/types";
import { hasRefundComplete } from "./refundDelinquent";
import { isDemoModeActive } from "./demoMode";
import { formatFormMention } from "../constants/setupForms";

const MODULE_KEY = "projectCloseOut";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyCloseOutForm(): ProjectCloseOutForm {
  return {
    equipmentInventory: [
      { id: uid(), description: "", serialNumber: "", acquisitionCost: "", location: "" },
    ],
    certificateOfOwnershipIssued: false,
  };
}

export function getCloseOutStored(applicant: Applicant | null): ProjectCloseOutStored | null {
  if (!applicant?.moduleData?.[MODULE_KEY]) return null;
  return applicant.moduleData[MODULE_KEY] as ProjectCloseOutStored;
}

export function getCloseOutForm(applicant: Applicant | null): ProjectCloseOutForm {
  return getCloseOutStored(applicant)?.form ?? emptyCloseOutForm();
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
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form,
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
  if (!form.equipmentAcknowledgementFileName?.trim()) {
    errors.push("Upload equipment acknowledgement receipt.");
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
