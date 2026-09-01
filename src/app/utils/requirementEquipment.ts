/**
 * Author: Yzrel Jade B. Eborde
 *
 * Equipment rows for per-equipment requirement uploads (TNA Form 02 / Form 001).
 */

import type { Applicant } from "../store/applicantStore";
import type { ProjectProposalBudgetRow, Tna2EquipmentRow, Tna2StoredDocument } from "../api/types";
import { getProjectProposalForm, getProjectProposalStored } from "./projectProposal";
import { getPublishedTna2, getTna2Draft } from "./tnaForm02";

export interface RequirementEquipmentItem {
  id: string;
  name: string;
  specifications?: string;
}

function slugify(value: string, index: number): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base ? `${base}-${index}` : `equipment-${index}`;
}

function fromTna2Rows(rows: Tna2EquipmentRow[]): RequirementEquipmentItem[] {
  return rows
    .map((row, index) => ({
      id: slugify(row.name || "equipment", index),
      name: String(row.name ?? "").trim(),
      specifications: row.specifications?.trim() || undefined,
    }))
    .filter((row) => row.name.length > 0);
}

function fromNameList(names: string[]): RequirementEquipmentItem[] {
  return names
    .map((name, index) => ({
      id: slugify(name, index),
      name: name.trim(),
    }))
    .filter((row) => row.name.length > 0);
}

function splitEquipmentNames(text: string): string[] {
  return text
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isLibEquipmentRow(row: ProjectProposalBudgetRow): boolean {
  const item = String(row.item ?? "").trim();
  if (!item) return false;
  if (/^working capital$/i.test(item)) return false;
  if (/^technology upgrading package$/i.test(item)) return false;
  return true;
}

function equipmentFromTna2(doc: Tna2StoredDocument | null): RequirementEquipmentItem[] {
  if (!doc) return [];
  const fromRecommended = fromTna2Rows(
    Array.isArray(doc.recommendedEquipment) ? doc.recommendedEquipment : [],
  );
  if (fromRecommended.length > 0) return fromRecommended;

  const fromInterventionRows = (doc.interventionRows ?? [])
    .map((row, index) => ({
      id: slugify(row.equipment || "equipment", index),
      name: String(row.equipment ?? "").trim(),
      specifications: undefined,
    }))
    .filter((row) => row.name.length > 0);
  if (fromInterventionRows.length > 0) return fromInterventionRows;

  return [];
}

function equipmentFromInterventionText(text: string): RequirementEquipmentItem[] {
  return fromNameList(splitEquipmentNames(text));
}

function equipmentFromInterventionTable(table: string[][] | undefined): RequirementEquipmentItem[] {
  if (!Array.isArray(table)) return [];
  return fromNameList(
    table
      .map((row) => String(row?.[0] ?? "").trim())
      .filter(Boolean),
  );
}

/** Equipment to acquire — TNA Form 02, Form 001 LIB, intervention narrative, or published document. */
export function getRequirementEquipmentList(
  applicant: Applicant | null,
): RequirementEquipmentItem[] {
  if (!applicant) return [];

  const tna2 = getPublishedTna2(applicant) ?? getTna2Draft(applicant);
  const fromTna2 = equipmentFromTna2(tna2);
  if (fromTna2.length > 0) return fromTna2;

  const pp = getProjectProposalForm(applicant);
  const fromBudget = (pp.budgetItems ?? [])
    .filter(isLibEquipmentRow)
    .map((row, index) => ({
      id: slugify(row.item || "equipment", index),
      name: String(row.item ?? "").trim(),
    }));
  if (fromBudget.length > 0) return fromBudget;

  const fromFormIntervention = equipmentFromInterventionText(
    String(pp.interventionEquipment ?? ""),
  );
  if (fromFormIntervention.length > 0) return fromFormIntervention;

  const fromCostTable = equipmentFromInterventionTable(pp.interventionCostTable);
  if (fromCostTable.length > 0) return fromCostTable;

  const storedDoc = getProjectProposalStored(applicant)?.document;
  const fromDocIntervention = equipmentFromInterventionText(
    String(storedDoc?.interventionEquipment ?? ""),
  );
  if (fromDocIntervention.length > 0) return fromDocIntervention;

  return equipmentFromInterventionTable(storedDoc?.interventionCostTable);
}

/** Sign-board / MOA clause 2.25 — semicolon-separated equipment list with specs when known. */
export function formatProposedEquipmentText(
  items: RequirementEquipmentItem[],
): string {
  return items
    .map((item) =>
      item.specifications
        ? `${item.name} (${item.specifications})`
        : item.name,
    )
    .join("; ");
}

export function resolveProposedEquipmentText(applicant: Applicant | null): string {
  return formatProposedEquipmentText(getRequirementEquipmentList(applicant));
}

export const QUOTATIONS_PO_GUIDANCE =
  "DOST Purchase Order conditions: warranty of equipment and after-sales support, terms of payment, and retention of payment (where applicable). Submit three (3) quotations per equipment item.";

export const SUPPLIER_UNAVAILABILITY_HINT =
  "If sufficient suppliers cannot be found (e.g. emergency or calamity), submit an affidavit stating the unavailability of suppliers for the needed equipment in the area.";
