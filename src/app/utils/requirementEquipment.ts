/**
 * Author: Yzrel Jade B. Eborde
 *
 * Equipment rows for per-equipment requirement uploads (TNA Form 02 / Form 001).
 */

import type { Applicant } from "../store/applicantStore";
import type { Tna2EquipmentRow } from "../api/types";
import { getPublishedTna2 } from "./tnaForm02";
import { getProjectProposalForm } from "./projectProposal";

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

/** Equipment to acquire — published TNA Form 02 first, then Form 001 budget / intervention text. */
export function getRequirementEquipmentList(
  applicant: Applicant | null,
): RequirementEquipmentItem[] {
  const tna2 = getPublishedTna2(applicant);
  const fromTna2 = fromTna2Rows(
    Array.isArray(tna2?.recommendedEquipment) ? tna2.recommendedEquipment : [],
  );
  if (fromTna2.length > 0) return fromTna2;

  const pp = getProjectProposalForm(applicant);
  if (!pp) return [];

  const fromBudget = (pp.budgetItems ?? [])
    .map((row, index) => ({
      id: slugify(row.item || "equipment", index),
      name: String(row.item ?? "").trim(),
    }))
    .filter((row) => row.name.length > 0 && !/working capital/i.test(row.name));

  if (fromBudget.length > 0) return fromBudget;

  const intervention = String(pp.interventionEquipment ?? "").trim();
  if (!intervention) return [];

  return intervention
    .split(/[,;]+/)
    .map((part, index) => ({
      id: slugify(part, index),
      name: part.trim(),
    }))
    .filter((row) => row.name.length > 0);
}

export const QUOTATIONS_PO_GUIDANCE =
  "DOST Purchase Order conditions: warranty of equipment and after-sales support, terms of payment, and retention of payment (where applicable). Submit three (3) quotations per equipment item.";

export const SUPPLIER_UNAVAILABILITY_HINT =
  "If sufficient suppliers cannot be found (e.g. emergency or calamity), submit an affidavit stating the unavailability of suppliers for the needed equipment in the area.";
