/**
 * Author: Yzrel Jade B. Eborde
 *
 * Persist projected financial statements as moduleData.financialProjection
 * (PUT /applicants/{id}/modules/financialProjection → applicant_module_data).
 */

import type { Applicant } from "../store/applicantStore";
import { applicantStore } from "../store/applicantStore";
import type {
  FinancialNamedAmountRow,
  FinancialProjectionDocumentResponse,
  FinancialProjectionInputs,
  FinancialProjectionSnapshot,
  FinancialProjectionStored,
  FinancialTaxMethod,
  FinancialYear1ProductLine,
  ProjectProposalForm,
  Tna2EquipmentRow,
} from "../api/types";
import { api, ApiError } from "../api/client";
import { syncModuleKeyToBackendBestEffort } from "./applicantPersistence";
import { asObjectList, normalizeFinancialProjectionStored } from "./normalizeCriticalModuleData";
import {
  computeFinancialProjection,
  emptyFinancialProjectionInputs,
  emptyNamedRow,
  emptyProductLine,
  FINANCIAL_PROJECTION_KEY,
  newRowId,
  parseMoney,
  snapshotToRatioTables,
} from "./financialProjection";
import { getProjectProposalForm, getProjectProposalStored } from "./projectProposal";
import { getPublishedTna2 } from "./tnaForm02";
import {
  buildRequirementUploadList,
  persistRequirementUploads,
} from "./submissionRequirements";

function asStored(raw: unknown): FinancialProjectionStored | null {
  const normalized = normalizeFinancialProjectionStored(raw);
  if (!normalized) return null;
  const inputs = {
    ...emptyFinancialProjectionInputs(),
    ...(normalized.inputs as FinancialProjectionInputs),
  };
  const refund = Array.isArray(inputs.setupRefundByYear)
    ? [...inputs.setupRefundByYear]
    : [0, 0, 0, 0, 0];
  while (refund.length < 5) refund.push(0);
  inputs.setupRefundByYear = refund.slice(0, 5);
  if (!inputs.equipment?.length) inputs.equipment = [emptyNamedRow()];
  if (!inputs.preoperating?.length) inputs.preoperating = [emptyNamedRow()];
  if (!inputs.products?.length) inputs.products = [emptyProductLine()];
  return {
    inputs,
    snapshot: normalized.snapshot as FinancialProjectionSnapshot | undefined,
    frozenAt: typeof normalized.frozenAt === "string" ? normalized.frozenAt : undefined,
    source: "wizard",
    submitted: normalized.submitted === true,
  };
}

export function getFinancialProjectionStored(
  applicant: Applicant | null | undefined,
): FinancialProjectionStored | null {
  if (!applicant?.moduleData) return null;
  return asStored(applicant.moduleData[FINANCIAL_PROJECTION_KEY]);
}

export function hasFrozenFinancialProjection(
  applicant: Applicant | null | undefined,
): boolean {
  const stored = getFinancialProjectionStored(applicant);
  return Boolean(stored?.frozenAt && stored.snapshot);
}

export function inputsAreBlank(inputs: FinancialProjectionInputs): boolean {
  const amt = (rows: FinancialNamedAmountRow[]) =>
    rows.some((r) => parseMoney(r.amount) > 0 || (r.name ?? "").trim());
  const prod = (rows: FinancialYear1ProductLine[]) =>
    rows.some(
      (r) =>
        (r.name ?? "").trim() ||
        parseMoney(r.srpQ1) > 0 ||
        parseMoney(r.qtyQ1) > 0,
    );
  return (
    !(inputs.productName ?? "").trim() &&
    !amt(inputs.equipment) &&
    !amt(inputs.preoperating) &&
    !prod(inputs.products) &&
    parseMoney(inputs.equity) <= 0 &&
    parseMoney(inputs.loanAmount) <= 0 &&
    parseMoney(inputs.salaries) <= 0 &&
    parseMoney(inputs.marketing) <= 0 &&
    (inputs.setupRefundByYear ?? []).every((n) => parseMoney(n) <= 0)
  );
}

function persistIsland(
  applicantId: string,
  stored: FinancialProjectionStored,
): FinancialProjectionStored {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return stored;
  const next: FinancialProjectionStored = {
    ...stored,
    source: "wizard",
  };
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [FINANCIAL_PROJECTION_KEY]: next,
    },
  });
  const updated = applicantStore.getById(applicantId);
  if (updated) {
    syncModuleKeyToBackendBestEffort(
      updated,
      FINANCIAL_PROJECTION_KEY,
      next as unknown as Record<string, unknown>,
    );
  }
  return next;
}

export function saveFinancialProjectionDraft(
  applicantId: string,
  inputs: FinancialProjectionInputs,
): FinancialProjectionStored {
  const prev = getFinancialProjectionStored(applicantStore.getById(applicantId));
  return persistIsland(applicantId, {
    inputs,
    snapshot: prev?.snapshot,
    frozenAt: prev?.frozenAt,
    source: "wizard",
    submitted: prev?.submitted,
  });
}

export function markProjectedRequirementGenerated(
  applicantId: string,
  applicationId?: string,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const list = buildRequirementUploadList(applicant);
  const next = list.map((row) =>
    row.id === "projected"
      ? {
          ...row,
          uploaded: true,
          fileName:
            row.fileId && row.generatedFrom !== "financialProjection"
              ? row.fileName
              : `Projected-FS-${applicationId || applicant.applicationId || applicantId}.print`,
          mimeType: row.fileId ? row.mimeType : "application/vnd.aisetup.projection",
          uploadedAt: new Date().toISOString(),
          generatedFrom: row.fileId ? row.generatedFrom : "financialProjection",
        }
      : row,
  );
  persistRequirementUploads(applicantId, next, applicantStore);
}

export function applySnapshotToProposalRatios(
  applicantId: string,
  snapshot: FinancialProjectionSnapshot,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const pp = getProjectProposalStored(applicant);
  if (!pp) return;
  const tables = snapshotToRatioTables(snapshot);
  const form: ProjectProposalForm = {
    ...pp.form,
    ...tables,
  };
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      projectProposal: {
        ...pp,
        form,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}

export function freezeFinancialProjectionLocal(
  applicantId: string,
  inputs: FinancialProjectionInputs,
  snapshot: FinancialProjectionSnapshot,
  frozenAt: string,
): FinancialProjectionStored {
  const stored = persistIsland(applicantId, {
    inputs,
    snapshot,
    frozenAt,
    source: "wizard",
    submitted: true,
  });
  const applicant = applicantStore.getById(applicantId);
  markProjectedRequirementGenerated(applicantId, applicant?.applicationId);
  applySnapshotToProposalRatios(applicantId, snapshot);
  return stored;
}

export async function generateAndFreezeFinancialProjection(
  applicantId: string,
  inputs: FinancialProjectionInputs,
): Promise<FinancialProjectionStored> {
  const applicant = applicantStore.getById(applicantId);
  const payload = {
    applicationId: applicant?.applicationId,
    applicantId,
    inputs,
  };
  let doc: FinancialProjectionDocumentResponse;
  try {
    doc = await api.generateFinancialProjection(payload);
  } catch (err) {
    if (err instanceof ApiError && err.status > 0 && err.status < 500) {
      throw err;
    }
    const snapshot = computeFinancialProjection(inputs);
    const frozenAt = new Date().toISOString();
    doc = {
      applicationId: applicant?.applicationId,
      generatedAt: frozenAt,
      inputs,
      snapshot,
      frozenAt,
      source: "wizard",
      submitted: true,
    };
  }
  return freezeFinancialProjectionLocal(
    applicantId,
    doc.inputs ?? inputs,
    doc.snapshot,
    doc.frozenAt || doc.generatedAt,
  );
}

export function prefillFinancialProjectionInputs(
  applicant: Applicant,
): FinancialProjectionInputs {
  const existing = getFinancialProjectionStored(applicant);
  if (existing && !inputsAreBlank(existing.inputs)) {
    return existing.inputs;
  }
  const form = getProjectProposalForm(applicant);
  const tna2 = getPublishedTna2(applicant);
  const next = emptyFinancialProjectionInputs();
  next.productName = (form.productsServices || form.projectTitle || "").trim();

  const org = (form.organizationType || "").toLowerCase();
  next.taxMethod = (org.includes("corp") ? "cit" : "sole8") as FinancialTaxMethod;

  const equipment: FinancialNamedAmountRow[] = [];
  for (const row of asObjectList<string[]>(form.interventionCostTable)) {
    const name = String(row[0] ?? "").trim();
    const qty = parseMoney(row[1]) || 1;
    const unit = parseMoney(row[2]);
    const total = parseMoney(row[3]) || qty * unit;
    if (!name && total <= 0) continue;
    equipment.push({
      id: newRowId(),
      name: name || "Equipment",
      amount: total,
      lifeYears: 5,
    });
  }
  const recEq = asObjectList<Tna2EquipmentRow>(tna2?.recommendedEquipment);
  if (equipment.length === 0) {
    for (const row of recEq) {
      const amount = parseMoney(row.estimatedCost);
      if (!row.name && amount <= 0) continue;
      equipment.push({
        id: newRowId(),
        name: row.name || "Equipment",
        amount,
        lifeYears: 5,
      });
    }
  }
  next.equipment = equipment.length ? equipment : [emptyNamedRow()];

  const products: FinancialYear1ProductLine[] = [];
  for (const row of form.productPriceTable ?? []) {
    const name = String(row[0] ?? "").trim();
    const srp = parseMoney(row[1]);
    if (!name && srp <= 0) continue;
    products.push({
      ...emptyProductLine(),
      name: name || next.productName || "Main product",
      srpQ1: srp,
      srpQ2: srp,
      srpQ3: srp,
      srpQ4: srp,
    });
  }
  next.products = products.length ? products : [emptyProductLine()];

  const refund = [0, 0, 0, 0, 0];
  const schedule = asObjectList<string[]>(form.refundSchedule);
  const totalRow = [...schedule].reverse().find((r) =>
    String(r[0] ?? "").toLowerCase().includes("total"),
  );
  if (totalRow) {
    refund[0] = 0;
    refund[1] = parseMoney(totalRow[1]);
    refund[2] = parseMoney(totalRow[2]);
    refund[3] = parseMoney(totalRow[3]);
    refund[4] = parseMoney(totalRow[4]);
  }
  next.setupRefundByYear = refund;
  return next;
}
