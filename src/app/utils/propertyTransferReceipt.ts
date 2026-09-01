/**
 * Author: Yzrel Jade B. Eborde
 *
 * Form 005 Property Transfer Receipt — prefill / sync (pick-if-blank).
 */

import type { Applicant } from "../store/applicantStore";
import type { EquipmentInventoryRow, ProjectCloseOutForm } from "../api/types";
import { derivePtrNo } from "../constants/propertyTransferReceiptLayout";
import {
  DOST_REGION_12_DIRECTOR_NAME,
  DOST_REGION_12_OFFICE,
} from "../constants/region12";

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

function pick(local: string | undefined, upstream: string): string {
  return trimText(local) ? trimText(local) : upstream;
}

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

function syncInventoryConditions(rows: EquipmentInventoryRow[]): EquipmentInventoryRow[] {
  return rows.map((row) => ({
    ...row,
    conditionOfPpe: pick(row.conditionOfPpe, "Good"),
  }));
}

export function buildPropertyTransferReceiptDefaults(
  applicant: Applicant | null,
  form: ProjectCloseOutForm,
): Partial<ProjectCloseOutForm> {
  const cooperator =
    trimText(form.inventoryProjectCooperator) || trimText(applicant?.enterpriseName);
  const applicationId = trimText(applicant?.applicationId);

  return {
    ptrEntityName: DOST_REGION_12_OFFICE,
    ptrFromAccountableOfficer: DOST_REGION_12_OFFICE,
    ptrToAccountableOfficer: cooperator,
    ptrNo: derivePtrNo(applicationId),
    ptrDate: todayIsoDate(),
    ptrTransferType: "reassignment",
    ptrReasonForTransfer: "Physical Transfer Only",
    ptrApprovedByName: DOST_REGION_12_DIRECTOR_NAME,
    ptrApprovedByDesignation: "Regional Director",
    ptrReceivedBy: cooperator,
    equipmentInventory: syncInventoryConditions(form.equipmentInventory),
  };
}

/** Pick-if-blank sync from applicant and Form 006 inventory — never overwrites staff edits. */
export function syncPropertyTransferFromPrior(
  form: ProjectCloseOutForm,
  applicant: Applicant | null,
): ProjectCloseOutForm {
  const defaults = buildPropertyTransferReceiptDefaults(applicant, form);
  const cooperator =
    trimText(form.inventoryProjectCooperator) || trimText(applicant?.enterpriseName);
  const applicationId = trimText(applicant?.applicationId);

  const syncedInventory = form.equipmentInventory.map((row, idx) => {
    const defaultRow = defaults.equipmentInventory?.[idx];
    return {
      ...row,
      conditionOfPpe: pick(row.conditionOfPpe, defaultRow?.conditionOfPpe ?? "Good"),
    };
  });

  return {
    ...form,
    ptrEntityName: pick(form.ptrEntityName, defaults.ptrEntityName ?? ""),
    ptrFundCluster: pick(form.ptrFundCluster, defaults.ptrFundCluster ?? ""),
    ptrFromAccountableOfficer: pick(
      form.ptrFromAccountableOfficer,
      defaults.ptrFromAccountableOfficer ?? "",
    ),
    ptrToAccountableOfficer: pick(form.ptrToAccountableOfficer, cooperator),
    ptrNo: pick(form.ptrNo, derivePtrNo(applicationId)),
    ptrDate: pick(form.ptrDate, defaults.ptrDate ?? ""),
    ptrTransferType: form.ptrTransferType?.trim()
      ? form.ptrTransferType
      : (defaults.ptrTransferType ?? ""),
    ptrTransferTypeOther: pick(form.ptrTransferTypeOther, ""),
    ptrReasonForTransfer: pick(
      form.ptrReasonForTransfer,
      form.ptrPhysicalTransferOnly
        ? "Physical Transfer Only"
        : (defaults.ptrReasonForTransfer ?? ""),
    ),
    ptrApprovedByName: pick(form.ptrApprovedByName, defaults.ptrApprovedByName ?? ""),
    ptrApprovedByDesignation: pick(
      form.ptrApprovedByDesignation,
      defaults.ptrApprovedByDesignation ?? "",
    ),
    ptrApprovedByDate: pick(form.ptrApprovedByDate, form.ptrDate ?? defaults.ptrDate ?? ""),
    ptrReleasedIssuedBy: pick(form.ptrReleasedIssuedBy, ""),
    ptrReceivedBy: pick(form.ptrReceivedBy, cooperator),
    equipmentInventory: syncedInventory,
  };
}
