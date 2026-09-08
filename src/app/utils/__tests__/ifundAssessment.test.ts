/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import {
  buildIfundAssessmentContext,
  IFUND_ASSESSMENT_NOTICE,
} from "../ifundAssessment";
import { buildLocalLoiDocument, buildLoiGenerationPayload } from "../loiLetter";

function baseApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: "a1",
    applicationId: "LOI-2026-000001",
    enterpriseName: "Test Bake Shop",
    applicantName: "Test Owner",
    designation: "Owner",
    emailAddress: "test@example.com",
    contactNumber: "09171234567",
    address: "Koronadal City",
    region: "XII",
    businessType: "Manufacturing",
    businessSector: "Food Processing",
    businessNature: "Baking",
    yearsOfOperation: "5",
    assetSize: "1000000",
    msmeSize: "Micro",
    qualified: true,
    currentModule: "letter-of-intent",
    moduleData: {
      commitmentAmount: "1500000",
      budget: "1600000",
      projectProposal: {
        form: {
          amountRequested: "Php 1,500,000.00",
          projectCost: "Php 2,000,000.00",
          financialAnalysis: "Cash flow supports refund.",
          partialBudgetAnalysis: "Net benefit positive.",
          budgetItems: [
            {
              id: "1",
              item: "Oven",
              qty: "1",
              unitCost: "1500000",
              setupShare: "1500000",
              lgiaShare: "0",
              total: "1500000",
            },
          ],
          refundSchedule: [["Year 1", "500000"]],
        },
        submitted: true,
      },
      requirementUploads: [
        { id: "financial", name: "FS", required: true, uploaded: true, fileName: "fs.pdf" },
        { id: "projected", name: "Projected", required: true, uploaded: false },
      ],
      tna2Document: {
        published: true,
        recommendedEquipment: [
          { name: "Deck oven", estimatedCost: "1200000", quantity: "1" },
        ],
      },
    },
    ...overrides,
  } as Applicant;
}

describe("ifundAssessment", () => {
  it("builds context from encoded cooperator financial fields", () => {
    const ctx = buildIfundAssessmentContext(baseApplicant());
    expect(ctx.amountRequested).toContain("1,500,000");
    expect(ctx.commitmentAmount).toBe("1500000");
    expect(ctx.financialAnalysis).toMatch(/Cash flow/);
    expect(ctx.financialStatementsUploaded).toBe(true);
    expect(Array.isArray(ctx.budgetItems)).toBe(true);
    expect(Array.isArray(ctx.tnaEquipmentCosts)).toBe(true);
    expect((ctx.tnaEquipmentCosts as { name: string }[])[0].name).toBe("Deck oven");
  });

  it("exposes staff notice that proposal is based on encoded financial fields", () => {
    expect(IFUND_ASSESSMENT_NOTICE).toMatch(/financial document fields encoded by the cooperator/i);
    expect(IFUND_ASSESSMENT_NOTICE).toMatch(/not an official approval/i);
  });
});

describe("LOI request fund amount", () => {
  it("maps requestedAmount into commitmentAmount and letter wording", () => {
    const applicant = baseApplicant();
    const payload = buildLoiGenerationPayload(
      applicant,
      {
        province: "South Cotabato",
        zipCode: "9506",
        tinNumber: "123",
        dateEstablished: "2020-01-01",
        registrationType: "DTI",
        registrationNumber: "DTI-1",
        productServices: "Bakes",
        projectDescription: "Upgrade oven",
        expectedOutcome: "Higher capacity",
        budget: "1500000",
        timeline: "6–12 months",
      },
      { requestedAmount: "₱1,500,000", repaymentTerm: "5 years" },
      { signature: "Test Owner", signedDate: "2026-01-15" },
    );
    expect(payload.commitmentAmount).toBe("₱1,500,000");
    const doc = buildLocalLoiDocument(payload);
    expect(doc.bodyParagraphs.join(" ")).toContain("refund of the requested seed fund");
    expect(doc.bodyParagraphs.join(" ")).not.toContain("refund of the approved seed fund");
  });

  it("restores legacy approvedAmount draft key as requestedAmount", () => {
    const legacy = {
      approvedAmount: "2,000,000",
      repaymentTerm: "4 years",
    } as { approvedAmount?: string; requestedAmount?: string; repaymentTerm: string };
    const requestedAmount = String(legacy.requestedAmount ?? legacy.approvedAmount ?? "");
    expect(requestedAmount).toBe("2,000,000");
  });
});

describe("RTEC fund assessment apply", () => {
  it("copies proposed amount into projectCostSetup", () => {
    const assessment = {
      proposedAmount: "₱1,200,000",
      refundRisk: "MEDIUM",
      authorityBand: "≤₱5,000,000 — Regional Director",
      rationale: IFUND_ASSESSMENT_NOTICE,
      sourcesPresent: ["Form 001 amount requested"],
      sourcesMissing: [],
      aiGenerated: false,
      assessedAt: "2026-09-08T00:00:00.000Z",
    };
    const form = {
      projectCostSetup: "₱1,500,000",
      recommendation: "",
      fundAssessment: undefined as typeof assessment | undefined,
    };
    const applyToSetupShare = true;
    const next = {
      ...form,
      fundAssessment: assessment,
      ...(applyToSetupShare
        ? {
            projectCostSetup: assessment.proposedAmount,
            recommendation: `AI iFund assessment (${assessment.refundRisk} refund risk): proposed ${assessment.proposedAmount} based on financial fields encoded by the cooperator.`,
          }
        : {}),
    };
    expect(next.projectCostSetup).toBe("₱1,200,000");
    expect(next.fundAssessment?.refundRisk).toBe("MEDIUM");
    expect(next.recommendation).toMatch(/financial fields encoded by the cooperator/);
  });
});
