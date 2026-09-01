/**
 * End-to-end system flow test: drives the real applicant store and the same
 * gate helpers the screens call, from client registration all the way to the
 * terminal "completed" state, plus the unqualified and MPEX branches.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applicantStore,
  MODULE_ORDER,
  type Applicant,
} from "../store/applicantStore";
import { demoModeStore } from "../store/demoModeStore";
import { evaluatePrescreening } from "../utils/prescreeningEligibility";
import {
  buildLocalLoiDocument,
  buildLoiGenerationPayload,
} from "../utils/loiLetter";
import {
  buildLocalTna2Document,
  buildTna2GenerationPayload,
  getPublishedTna2,
  publishTna2Document,
} from "../utils/tnaForm02";
import {
  getProjectProposalForm,
  submitProjectProposal,
} from "../utils/projectProposal";
import {
  computeFinancialProjection,
  emptyFinancialProjectionInputs,
} from "../utils/financialProjection";
import {
  freezeFinancialProjectionLocal,
  hasFrozenFinancialProjection,
} from "../utils/financialProjectionStore";
import {
  buildRequirementUploadList,
  countRequiredUploads,
  persistRequirementUploads,
} from "../utils/submissionRequirements";
import {
  buildRtecReportDraft,
  hasRtecPrerequisites,
  submitRtecReport,
  validateRtecReportSubmit,
} from "../utils/rtecReport";
import {
  acknowledgeApprovalLetter,
  buildApprovalLetterDraft,
  getApprovalLetterStored,
  hasRtecReportPrerequisite,
  publishApprovalLetter,
  recordRdDecision,
  saveSignedMoa,
  validateApprovalLetterPublish,
} from "../utils/approvalLetter";
import {
  hasApprovalLetterAcknowledged,
  preparePdcsForDisbursement,
} from "../utils/projectInformationSheet";
import {
  getLbpIntroductionForm,
  hasLbpIntroductionPublished,
  publishLbpIntroduction,
} from "../utils/lbpIntroductionLetter";
import {
  getLandBankForm,
  hasLandBankComplete,
  hasLandBankPrerequisite,
  saveLandBankDraft,
  submitLandBank,
  validateLandBankSubmit,
} from "../utils/landBankWithdrawal";
import {
  getProcurementForm,
  hasProcurementComplete,
  saveProcurementDraft,
  submitProcurement,
  validateProcurementSubmit,
} from "../utils/procurementLiquidation";
import {
  hasPdcsRecordedForDisbursement,
  hasRefundComplete,
  submitRefund,
  validateRefundSubmit,
} from "../utils/refundDelinquent";
import {
  getCloseOutForm,
  saveCloseOutDraft,
  submitCloseOut,
  validateCloseOutSubmit,
} from "../utils/projectCloseOut";
import {
  canApplicantAccessView,
  getApplicantDashboardStats,
  isApplicantViewLocked,
  isAwaitingStaffReview,
  isOnProgramTrack,
  isRoutedToMpex,
  moduleToApplicantView,
} from "../utils/applicantProgress";
import type { ModuleDocument } from "../api/types";
import { DOST_PROGRAMS } from "../constants/dostProgramRecommendations";

// ── Test fixtures ──────────────────────────────────────────────────────────────

const QUALIFYING_PRESCREENING = {
  businessSector: "Food Processing",
  businessNature: "Registered with DTI or SEC for manufacturing",
  yearsOfOperation: "5",
  msmeSize: "Small",
  exportClassification: "Domestic with export potential",
};

function moduleDocument(fileName: string, uploadedBy: string): ModuleDocument {
  return {
    fileName,
    mimeType: "application/pdf",
    dataUrl: "data:application/pdf;base64,dGVzdA==",
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };
}

/** Mirrors the RegisterPage.tsx `applicantStore.add` payload. */
function registerApplicant(email: string): Applicant {
  return applicantStore.add({
    applicantName: "Test Applicant",
    designation: "Owner/Applicant",
    enterpriseName: "Flow Test Foods",
    contactNumber: "09170000000",
    emailAddress: email,
    businessType: "DTI",
    businessNature: "",
    businessSector: "Food Processing",
    yearsOfOperation: "",
    enterpriseType: "",
    msmeSize: "",
    assetSize: "",
    region: "South Cotabato",
    address: "1 Test St., Koronadal City, South Cotabato",
    currentModule: "prescreening",
    qualified: false,
    moduleData: {
      accountStatus: "active",
      province: "South Cotabato",
      tinNumber: "123-456-789-000",
      registrationType: "DTI",
      registrationNumber: "DTI-12-9999999",
      companyStartDate: "2019-01-01",
      registeredAt: new Date().toISOString(),
    },
  });
}

/** Mirrors the PrescreeningForm.tsx submit payload for an existing applicant. */
function submitPrescreening(
  applicant: Applicant,
  input: typeof QUALIFYING_PRESCREENING,
) {
  const result = evaluatePrescreening(input);
  applicantStore.update(applicant.id, {
    businessNature: input.businessNature,
    businessSector: input.businessSector,
    yearsOfOperation: input.yearsOfOperation,
    msmeSize: input.msmeSize,
    currentModule: result.qualified ? "registration" : "prescreening",
    qualified: result.qualified,
    moduleData: {
      ...applicant.moduleData,
      coreProducts: "Dried mangoes, banana chips",
      exportClassification: input.exportClassification,
      prescreening: {
        failedReasons: result.failedReasons,
        recommendedProgramIds: result.recommendedProgramIds,
        evaluatedAt: new Date().toISOString(),
      },
    },
  });
  return result;
}

function getApplicant(id: string): Applicant {
  const applicant = applicantStore.getById(id);
  if (!applicant) throw new Error(`Applicant ${id} not found`);
  return applicant;
}

let emailCounter = 0;
function nextEmail(): string {
  emailCounter += 1;
  return `flow-test-${emailCounter}@example.com`;
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeAll(() => {
  // Backend sync is best-effort; keep the network out of the tests entirely.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in tests"))),
  );
  // Demo mode toggling calls window.alert, which jsdom does not implement.
  vi.stubGlobal("alert", vi.fn());
});

beforeEach(() => {
  demoModeStore.setEnabled(false);
});

afterEach(() => {
  demoModeStore.setEnabled(false);
});

// ── Test A — happy path: registration → completed ─────────────────────────────

describe("system flow: registration through project close-out", () => {
  it("walks a qualified applicant through every module to the completed state", () => {
    // 1. Registration + login
    const registered = registerApplicant(nextEmail());
    const id = registered.id;

    expect(registered.applicationId).toMatch(/^LOI-\d{4}-\d{6}$/);
    expect(registered.currentModule).toBe("prescreening");
    // Credentials live server-side (POST /auth/login); the store only tracks the account record.
    expect(applicantStore.getByEmail(registered.emailAddress)?.id).toBe(id);
    expect(applicantStore.isAccountBlocked(registered)).toBe(false);
    // Future modules are locked while in prescreening
    expect(isApplicantViewLocked(registered, "tna1")).toBe(true);
    expect(isApplicantViewLocked(registered, "prescreening")).toBe(false);

    // 2. Prescreening (Step 1) — qualifying profile
    const evaluation = submitPrescreening(registered, QUALIFYING_PRESCREENING);
    expect(evaluation.qualified).toBe(true);
    expect(evaluation.recommendedPrograms).toHaveLength(0);
    expect(getApplicant(id).currentModule).toBe("registration");
    expect(getApplicant(id).qualified).toBe(true);

    // 3. Enterprise registration (Step 2)
    applicantStore.update(id, {
      enterpriseType: "Manufacturing",
      assetSize: "₱8,000,000",
      moduleData: {
        ...getApplicant(id).moduleData,
        companyDescription: "Processed fruit products for regional markets.",
        productServices: "Dried mangoes, banana chips",
        projectDescription:
          "Acquisition of a vacuum packaging line to raise capacity.",
        expectedOutcome: "Increase production capacity by 40%.",
        budget: "2000000",
        timeline: "18 months",
      },
      currentModule: "letter-of-intent",
    });

    // 4. Letter of Intent (Step 3) — SETUP LOI includes the refund commitment
    const loiPayload = buildLoiGenerationPayload(
      getApplicant(id),
      {
        dateEstablished: "2019-01-01",
        tinNumber: "123-456-789-000",
        province: "South Cotabato",
        zipCode: "9506",
        registrationType: "DTI",
        registrationNumber: "DTI-12-9999999",
        productServices: "Dried mangoes, banana chips",
        projectDescription:
          "Acquisition of a vacuum packaging line to raise capacity.",
        expectedOutcome: "Increase production capacity by 40%.",
        budget: "2,000,000",
        timeline: "18 months",
      },
      { approvedAmount: "₱2,000,000", repaymentTerm: "five (5) years" },
      { signature: "Test Applicant", signedDate: "2026-01-15" },
    );
    const loiDocument = buildLocalLoiDocument(loiPayload);
    expect(loiDocument.bodyParagraphs.join(" ")).toContain(
      "refund of the approved seed fund",
    );
    expect(loiDocument.thruAddressee.officeName).toBe("PSTO - South Cotabato");
    applicantStore.update(id, {
      moduleData: {
        ...getApplicant(id).moduleData,
        loiDocument,
        loiSubmittedAt: new Date().toISOString(),
      },
      currentModule: "tna1",
    });

    // 5. TNA Form 01 (Module 5)
    applicantStore.update(id, {
      moduleData: {
        ...getApplicant(id).moduleData,
        tna1: {
          submitted: true,
          submittedAt: new Date().toISOString(),
          form: {
            enterpriseName: "Flow Test Foods",
            contactPerson: "Test Applicant",
            position: "Owner",
            officeAddress: "1 Test St., Koronadal City, South Cotabato",
            officeTel: "09170000000",
            officeEmail: getApplicant(id).emailAddress,
            organizationType: "Sole Proprietorship (DTI)",
            sector: "Food Processing",
            commodity: "Food Processing",
            mainProduct: "Dried mangoes, banana chips",
            employeesMale: "6",
            employeesFemale: "5",
            productionProblemsConcerns: "Manual packing bottlenecks.",
            processFlow: "Receiving → slicing → dehydration → packaging",
            enterpriseBackground: "Processed fruit products manufacturer.",
            reasonsForAssistance: "Packaging line acquisition.",
          },
          tables: {
            rawMaterials: [["Fresh fruit", "Local farmers", "80", "5000 kg/year"]],
            production: [["Dried mangoes", "3000 kg/year", "120", "360000"]],
            equipment: [["Tray dehydrator", "50kg/batch", "50kg/day", "2", "2018"]],
          },
        },
      },
      currentModule: "tna2",
    });

    // 6. TNA Form 02 (Module 6) — staff publishes the technical report
    expect(getPublishedTna2(getApplicant(id))).toBeNull();
    const tna2Document = buildLocalTna2Document(
      buildTna2GenerationPayload(getApplicant(id)),
    );
    publishTna2Document(id, tna2Document);
    expect(getPublishedTna2(getApplicant(id))).not.toBeNull();
    applicantStore.update(id, { currentModule: "project-proposal" });

    // 7. Project Proposal (Module 7, SETUP Form 001)
    const proposalDraft = getProjectProposalForm(getApplicant(id));
    const proposalForm = {
      ...proposalDraft,
      projectTitle: "Vacuum Packaging Line Upgrade for Flow Test Foods",
      amountRequested: "Php 2,000,000.00",
      projectCost: "Php 2,500,000.00",
      contactPerson: proposalDraft.contactPerson || "Test Applicant",
      firmName: proposalDraft.firmName || "Flow Test Foods",
      firmAddress:
        proposalDraft.firmAddress || "1 Test St., Koronadal City, South Cotabato",
      employeesMale: proposalDraft.employeesMale || "6",
      employeesFemale: proposalDraft.employeesFemale || "5",
    };
    submitProjectProposal(id, proposalForm, []);
    const projectionInputs = {
      ...emptyFinancialProjectionInputs(),
      productName: "Dried mangoes",
      equipment: [{ id: "e1", name: "Vacuum sealer", amount: 500_000, lifeYears: 5 }],
      preoperating: [{ id: "p1", name: "Product development", amount: 50_000, lifeYears: 5 }],
      products: [
        {
          id: "pr1",
          name: "Dried mangoes",
          srpQ1: 100,
          srpQ2: 100,
          srpQ3: 100,
          srpQ4: 100,
          costQ1: 40,
          qtyQ1: 1000,
          qtyQ2: 1000,
          qtyQ3: 1000,
          qtyQ4: 1000,
        },
      ],
      loanAmount: 200_000,
      loanTermYears: 5,
      loanInterestRate: 0.1,
      equity: 300_000,
      inventoryYear1: 20_000,
      salesGrowth: 0.1,
      cosIncrease: 0.05,
      salaryIncrease: 0.05,
      inflation: 0.03,
      marketing: 10_000,
      salaries: 120_000,
      logistics: 5_000,
      itSoftware: 2_000,
      transportation: 3_000,
      rental: 24_000,
      utilities: 6_000,
      communication: 2_400,
      taxesLicenses: 1_200,
      otherExpenses: 1_000,
      taxMethod: "sole8" as const,
      setupRefundByYear: [0, 50_000, 50_000, 50_000, 50_000],
    };
    freezeFinancialProjectionLocal(
      id,
      projectionInputs,
      computeFinancialProjection(projectionInputs),
      new Date().toISOString(),
    );
    expect(hasFrozenFinancialProjection(getApplicant(id))).toBe(true);
    const projected = buildRequirementUploadList(getApplicant(id)).find((u) => u.id === "projected");
    expect(projected?.uploaded).toBe(true);
    expect(projected?.generatedFrom).toBe("financialProjection");
    applicantStore.update(id, { currentModule: "requirements" });

    // 8. Submission requirements (Step 4) — uploads + staff approval
    const uploads = buildRequirementUploadList(getApplicant(id)).map((u) => ({
      ...u,
      uploaded: u.required,
      fileName: u.required ? `${u.id}.pdf` : undefined,
      uploadedAt: u.required ? new Date().toISOString() : undefined,
    }));
    persistRequirementUploads(id, uploads, applicantStore);
    const counted = countRequiredUploads(
      buildRequirementUploadList(getApplicant(id)),
    );
    expect(counted.uploaded).toBe(counted.required);
    // RTEC is gated until staff approves the requirements
    expect(hasRtecPrerequisites(getApplicant(id))).toBe(false);
    applicantStore.update(id, {
      moduleData: {
        ...getApplicant(id).moduleData,
        documentsSubmitted: true,
        staffDecision: "approved",
        routingDecision: "setup",
      },
      currentModule: "conduct-rtec",
    });
    expect(isRoutedToMpex(getApplicant(id))).toBe(false);
    // Client is parked on the dashboard while RTEC runs (staff-only module)
    expect(moduleToApplicantView("conduct-rtec")).toBe("dashboard");
    expect(isAwaitingStaffReview(getApplicant(id))).toBe(true);

    // 9. Conduct of RTEC (Module 8, SETUP Form 002 — staff only)
    expect(hasRtecPrerequisites(getApplicant(id))).toBe(true);
    const rtecDraft = buildRtecReportDraft(getApplicant(id));
    const rtecForm = {
      ...rtecDraft,
      complianceItems: rtecDraft.complianceItems.map((item) => ({
        ...item,
        status: "complied" as const,
      })),
      recommendation:
        rtecDraft.recommendation || "RTEC recommends approval of the project.",
      signatures: {
        ...rtecDraft.signatures,
        chairperson: "Engr. Test Chairperson",
      },
    };
    expect(validateRtecReportSubmit(rtecForm)).toEqual([]);
    submitRtecReport(id, rtecForm);
    applicantStore.update(id, { currentModule: "approval-letter" });

    // 10. Approval letter (Module 9) — RD approve, publish gate, conforme, signed MOA
    expect(hasRtecReportPrerequisite(getApplicant(id))).toBe(true);
    expect(isAwaitingStaffReview(getApplicant(id))).toBe(true); // unpublished
    const approvalDraft = buildApprovalLetterDraft(getApplicant(id));
    expect(validateApprovalLetterPublish(approvalDraft, getApplicant(id)).length).toBeGreaterThan(0);
    recordRdDecision(id, "approved", "rd@dost.gov.ph", approvalDraft);
    expect(validateApprovalLetterPublish(approvalDraft, getApplicant(id))).toEqual([]);
    expect(publishApprovalLetter(id, approvalDraft).ok).toBe(true);
    expect(getApprovalLetterStored(getApplicant(id))?.published).toBe(true);
    expect(isAwaitingStaffReview(getApplicant(id))).toBe(false);
    acknowledgeApprovalLetter(id, "Test Applicant");
    expect(hasApprovalLetterAcknowledged(getApplicant(id))).toBe(true);
    applicantStore.update(id, { currentModule: "landbank-withdrawal" });
    expect(getApplicant(id).currentModule).toBe("landbank-withdrawal");

    // 11. LandBank & Withdrawal — MOA + PDC gates (no separate PIS module)
    expect(isAwaitingStaffReview(getApplicant(id))).toBe(true); // MOA/PDCs pending
    expect(hasLandBankPrerequisite(getApplicant(id))).toBe(false);
    saveSignedMoa(id, {
      ...moduleDocument("signed-moa.pdf", "Test Applicant"),
      moaSignedDate: "2026-02-01",
    });
    expect(hasLandBankPrerequisite(getApplicant(id))).toBe(false); // PDCs missing
    preparePdcsForDisbursement(id);
    expect(hasPdcsRecordedForDisbursement(getApplicant(id))).toBe(true);
    expect(hasLandBankPrerequisite(getApplicant(id))).toBe(true);
    expect(isAwaitingStaffReview(getApplicant(id))).toBe(false);

    // Legacy PIS module id normalizes to LandBank
    applicantStore.update(id, { currentModule: "project-information-sheet" });
    expect(getApplicant(id).currentModule).toBe("landbank-withdrawal");

    // 12. LandBank account / withdrawal after prerequisites
    const landBankErrorsBefore = validateLandBankSubmit(getApplicant(id));
    expect(landBankErrorsBefore.length).toBeGreaterThan(0); // LBP intro / docs still required
    expect(
      publishLbpIntroduction(
        id,
        getLbpIntroductionForm(getApplicant(id)),
        "Regional Director",
      ),
    ).toEqual([]);
    expect(hasLbpIntroductionPublished(getApplicant(id))).toBe(true);
    {
      const landBankBase = getLandBankForm(getApplicant(id));
      const t1Letter = moduleDocument("withdrawal-letter-t1.pdf", "Test Applicant");
      saveLandBankDraft(id, {
        ...landBankBase,
        accountSnapshot: moduleDocument("passbook-snapshot.pdf", "Test Applicant"),
        withdrawalLetter: t1Letter,
        tranches: {
          ...landBankBase.tranches,
          first: {
            ...landBankBase.tranches.first,
            signedLetter: t1Letter,
            quotations: [moduleDocument("quotation-t1.pdf", "Test Applicant")],
            equipmentPhotos: [moduleDocument("equipment-t1.jpg", "Test Applicant")],
            status: "signed",
          },
        },
      });
    }
    expect(validateLandBankSubmit(getApplicant(id))).toEqual([]);
    expect(submitLandBank(id, "Test Applicant")).toEqual([]);
    expect(hasLandBankComplete(getApplicant(id))).toBe(true);
    applicantStore.update(id, { currentModule: "procurement-liquidation" });

    // 13. Procurement & Liquidation (Modules 14–16)
    expect(validateProcurementSubmit(getApplicant(id)).length).toBeGreaterThan(0);
    saveProcurementDraft(id, {
      ...getProcurementForm(getApplicant(id)),
      documents: [
        {
          id: "doc-1",
          fileName: "official-receipt.pdf",
          uploadedAt: "2026-03-01",
          amount: "₱2,000,000",
        },
      ],
      items: [
        {
          id: "item-1",
          description: "Vacuum packaging machine",
          supplier: "PackTech Inc.",
          purchaseDate: "2026-03-01",
          quantity: 1,
          totalCost: "2,000,000",
        },
      ],
      liquidations: [
        {
          id: "liq-entry-1",
          title: "1st Tranche",
          amount: "₱2,000,000",
          date: "2026-03-05",
          remarks: "Equipment liquidation",
          attachments: [
            {
              id: "liq-1",
              fileName: "liquidation-report.pdf",
              uploadedAt: "2026-03-05",
            },
          ],
          createdAt: "2026-03-05T00:00:00.000Z",
          createdBy: "PSTO Staff",
        },
      ],
      untagged: true,
      untaggedAt: new Date().toISOString(),
    });
    expect(validateProcurementSubmit(getApplicant(id))).toEqual([]);
    expect(submitProcurement(id, "PSTO Staff")).toEqual([]);
    expect(hasProcurementComplete(getApplicant(id))).toBe(true);
    applicantStore.update(id, { currentModule: "refund-delinquent" });

    // 14. Refund & Delinquent monitoring (Module 17)
    expect(validateRefundSubmit(getApplicant(id))).toEqual([]);
    expect(submitRefund(id, "PSTO Staff")).toEqual([]);
    expect(hasRefundComplete(getApplicant(id))).toBe(true);
    // submitRefund advances the module itself
    expect(getApplicant(id).currentModule).toBe("project-closeout");

    // 15. Project Close-Out (Module 18) — terminal report gate then completed
    expect(validateCloseOutSubmit(getApplicant(id)).length).toBeGreaterThan(0);
    saveCloseOutDraft(id, {
      ...getCloseOutForm(getApplicant(id)),
      terminalReportFileName: "terminal-report.pdf",
      auditedFinancialFileName: "audited-financials.pdf",
      propertyTransferSignedFileName: "form-005-signed.pdf",
      ptrFromAccountableOfficer: "DOST Regional Office No. XII",
      ptrToAccountableOfficer: "ABC Food Processing",
      ptrDate: "2026-06-30",
      ptrTransferType: "reassignment",
      ptrReasonForTransfer: "Physical Transfer Only",
      ptrApprovedByName: "SAMMY P. MALAWAN",
      ptrReceivedBy: "ABC Food Processing",
      equipmentInventory: [
        {
          id: "eq-1",
          qty: "1",
          description: "Vacuum packaging machine",
          amount: "₱2,000,000",
          propertyNo: "VPM-001",
          dateAcquired: "2025-01-15",
          remarks: "Koronadal plant",
          conditionOfPpe: "Good",
        },
      ],
      certificateOfOwnershipIssued: true,
      certificateIssuedDate: "2026-06-30",
    });
    expect(submitCloseOut(id, "Test Applicant")).toEqual([]);

    // End of the system
    const finished = getApplicant(id);
    expect(finished.currentModule).toBe("completed");
    expect(MODULE_ORDER[MODULE_ORDER.length - 1]).toBe("completed");
    expect(getApplicantDashboardStats(finished).statusLabel).toBe("Completed");
    expect(moduleToApplicantView("completed")).toBe("dashboard");
    // Every module view is now unlocked history
    expect(isApplicantViewLocked(finished, "project-closeout")).toBe(false);
  });
});

// ── Test B — unqualified branch (program LOI) ──────────────────────────────────

describe("system flow: unqualified applicant branch", () => {
  it("lets an unqualified startup pick a program and generate a program LOI without refund terms", () => {
    const registered = registerApplicant(nextEmail());
    const id = registered.id;

    const evaluation = submitPrescreening(registered, {
      businessSector: "Food Processing",
      businessNature: "Startup (Includes enterprises with or without revenue)",
      yearsOfOperation: "1",
      msmeSize: "Micro",
      exportClassification: "No",
    });

    expect(evaluation.qualified).toBe(false);
    expect(evaluation.failedReasons.some((r) => !r.ok)).toBe(true);
    expect(evaluation.recommendedPrograms.length).toBeGreaterThan(0);
    expect(evaluation.recommendedPrograms.length).toBeLessThanOrEqual(5);

    let applicant = getApplicant(id);
    expect(applicant.currentModule).toBe("prescreening");
    expect(applicant.qualified).toBe(false);
    expect(isApplicantViewLocked(applicant, "letter-of-intent")).toBe(true);

    // Pick a recommended program (mirrors DostProgramRecommendationCards onSelect)
    const chosen = evaluation.recommendedPrograms[0] ?? DOST_PROGRAMS.mpex;
    applicantStore.update(id, {
      currentModule: "letter-of-intent",
      moduleData: {
        ...getApplicant(id).moduleData,
        selectedProgramId: chosen.id,
        selectedProgramName: chosen.name,
      },
    });

    applicant = getApplicant(id);
    expect(isOnProgramTrack(applicant)).toBe(true);
    expect(isApplicantViewLocked(applicant, "letter-of-intent")).toBe(false);
    expect(isApplicantViewLocked(applicant, "prescreening")).toBe(false);
    expect(isApplicantViewLocked(applicant, "tna1")).toBe(true);
    expect(isApplicantViewLocked(applicant, "project-proposal")).toBe(true);
    expect(isApplicantViewLocked(applicant, "landbank-withdrawal")).toBe(true);

    const loiPayload = buildLoiGenerationPayload(
      applicant,
      {
        dateEstablished: "2025-01-01",
        tinNumber: "123-456-789-000",
        province: "South Cotabato",
        zipCode: "9506",
        registrationType: "DTI",
        registrationNumber: "DTI-12-0000001",
        productServices: "Startup food products",
        projectDescription: "Productivity and process improvement assistance",
        expectedOutcome: "Improved operations under the recommended program",
        budget: "",
        timeline: "",
      },
      { approvedAmount: "", repaymentTerm: "" },
      { signature: "Test Applicant", signedDate: "2026-01-15" },
    );
    expect(loiPayload.qualified).toBe(false);
    expect(loiPayload.programName).toBe(chosen.name);

    const loiDocument = buildLocalLoiDocument(loiPayload);
    const body = loiDocument.bodyParagraphs.join(" ");
    expect(body).toContain(chosen.name);
    expect(body.toLowerCase()).not.toMatch(/seed fund/);
    expect(body.toLowerCase()).not.toMatch(/\brefund\b/);

    applicantStore.update(id, {
      moduleData: {
        ...getApplicant(id).moduleData,
        loiDocument,
        loiSubmittedAt: new Date().toISOString(),
      },
    });
    const afterLoi = getApplicant(id);
    expect(getApplicantDashboardStats(afterLoi).statusLabel).toBe(
      "Program Referral",
    );
    // Program track stays on LOI — SETUP modules remain locked
    expect(afterLoi.currentModule).toBe("letter-of-intent");
    expect(isOnProgramTrack(afterLoi)).toBe(true);
    expect(isApplicantViewLocked(afterLoi, "letter-of-intent")).toBe(false);
    expect(isApplicantViewLocked(afterLoi, "tna1")).toBe(true);
    expect(isApplicantViewLocked(afterLoi, "requirements")).toBe(true);
    expect(isApplicantViewLocked(afterLoi, "project-proposal")).toBe(true);
  });
});

// ── Test C — MPEX routing branch ───────────────────────────────────────────────

describe("system flow: MPEX routing branch", () => {
  it("parks an applicant routed to MPEX outside the SETUP track", () => {
    const registered = registerApplicant(nextEmail());
    const id = registered.id;
    submitPrescreening(registered, QUALIFYING_PRESCREENING);
    applicantStore.update(id, {
      currentModule: "requirements",
      moduleData: {
        ...getApplicant(id).moduleData,
        documentsSubmitted: true,
        staffDecision: "approved",
        routingDecision: "mpex",
      },
    });

    const applicant = getApplicant(id);
    expect(isRoutedToMpex(applicant)).toBe(true);
    expect(getApplicantDashboardStats(applicant).statusLabel).toBe("MPEX Track");

    // Only the requirements view stays reachable (plus dashboard/account)
    expect(isApplicantViewLocked(applicant, "requirements")).toBe(false);
    expect(isApplicantViewLocked(applicant, "dashboard")).toBe(false);
    expect(isApplicantViewLocked(applicant, "my-account")).toBe(false);
    expect(isApplicantViewLocked(applicant, "prescreening")).toBe(true);
    expect(isApplicantViewLocked(applicant, "letter-of-intent")).toBe(true);
    expect(isApplicantViewLocked(applicant, "project-proposal")).toBe(true);
    expect(isApplicantViewLocked(applicant, "approval-letter")).toBe(true);
    expect(isApplicantViewLocked(applicant, "landbank-withdrawal")).toBe(true);
    expect(isApplicantViewLocked(applicant, "project-closeout")).toBe(true);
  });
});

// ── Test D — demo-mode bypass ──────────────────────────────────────────────────

describe("system flow: demo mode bypasses validators and locks", () => {
  it("skips submit validators and view locks while demo mode is active", () => {
    const registered = registerApplicant(nextEmail());
    const applicant = getApplicant(registered.id);

    // Real gates hold for a fresh applicant
    expect(validateLandBankSubmit(applicant).length).toBeGreaterThan(0);
    expect(validateCloseOutSubmit(applicant).length).toBeGreaterThan(0);
    expect(canApplicantAccessView(applicant, "project-closeout")).toBe(false);

    demoModeStore.setEnabled(true);

    expect(validateLandBankSubmit(applicant)).toEqual([]);
    expect(validateCloseOutSubmit(applicant)).toEqual([]);
    expect(canApplicantAccessView(applicant, "project-closeout")).toBe(true);

    demoModeStore.setEnabled(false);
    expect(canApplicantAccessView(applicant, "project-closeout")).toBe(false);
  });
});
