/**
 * Author: Yzrel Jade B. Eborde
 *
 * Build encoded financial context for staff AI iFund assessment (Guidelines 3.0).
 * Uses structured cooperator fields only — does not OCR uploaded FS PDFs.
 */

import type { Applicant } from "../store/applicantStore";
import { getProjectProposalForm } from "./projectProposal";
import { getFinancialProjectionStored } from "./financialProjectionStore";
import { getPublishedTna2, getTna2Draft } from "./tnaForm02";
import { buildRequirementUploadList } from "./submissionRequirements";

export function buildIfundAssessmentContext(
  applicant: Applicant | null,
): Record<string, unknown> {
  if (!applicant) return {};
  const md = applicant.moduleData ?? {};
  const pp = getProjectProposalForm(applicant);
  const projection = getFinancialProjectionStored(applicant);
  const tna2 = getPublishedTna2(applicant) ?? getTna2Draft(applicant);
  const uploads = buildRequirementUploadList(applicant);
  const fsUpload = uploads.find((u) => u.id === "financial");
  const projectedUpload = uploads.find((u) => u.id === "projected");

  const equipmentCosts = (tna2?.recommendedEquipment ?? [])
    .map((row) => ({
      name: row.name ?? "",
      estimatedCost: row.estimatedCost ?? "",
      quantity: row.quantity ?? "",
      priority: row.priority ?? "",
    }))
    .filter((row) => row.name.trim() || String(row.estimatedCost).trim());

  const budgetItems = (pp.budgetItems ?? []).map((row) => ({
    item: row.item,
    qty: row.qty,
    unitCost: row.unitCost,
    setupShare: row.setupShare,
    lgiaShare: row.lgiaShare,
    total: row.total,
  }));

  const snapshot = projection?.snapshot;
  const financialProjection =
    snapshot || projection?.inputs
      ? {
          loanAmount: projection?.inputs?.loanAmount,
          loanTermYears: projection?.inputs?.loanTermYears,
          equity: projection?.inputs?.equity,
          setupRefundByYear: projection?.inputs?.setupRefundByYear,
          npv: snapshot?.npv,
          irr: snapshot?.irr,
          ratios: snapshot?.ratios,
        }
      : null;

  return {
    enterpriseName: applicant.enterpriseName,
    msmeSize: applicant.msmeSize,
    yearsOfOperation: applicant.yearsOfOperation,
    businessSector: applicant.businessSector,
    commitmentAmount: String(md.commitmentAmount ?? ""),
    budget: String(md.budget ?? ""),
    repaymentTerm: String(md.repaymentTerm ?? ""),
    amountRequested: pp.amountRequested ?? "",
    projectCost: pp.projectCost ?? "",
    budgetItems,
    financialAnalysis: pp.financialAnalysis ?? "",
    partialBudgetAnalysis: pp.partialBudgetAnalysis ?? "",
    refundSchedule: pp.refundSchedule ?? [],
    financialProjection,
    tnaEquipmentCosts: equipmentCosts,
    financialStatementsUploaded: Boolean(fsUpload?.uploaded || fsUpload?.fileName),
    projectedFinancialStatementsUploaded: Boolean(
      projectedUpload?.uploaded ||
        projectedUpload?.fileName ||
        projectedUpload?.generatedFrom ||
        projection?.snapshot,
    ),
  };
}

export const IFUND_ASSESSMENT_NOTICE =
  "This proposed fund amount is an assessment of the financial document fields encoded by the cooperator (Form 001 budget and request, financial analysis, projected statements / financial projection, TNA equipment costs, and LOI request). It is not an official approval. Review and edit before applying to DOST-SETUP.";
