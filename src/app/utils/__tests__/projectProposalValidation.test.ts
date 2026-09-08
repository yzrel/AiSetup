/**
 * Author: Yzrel Jade B. Eborde
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ProjectProposalAttachment } from "../../api/types";
import { demoModeStore } from "../../store/demoModeStore";
import {
  buildProjectProposalValidationChecks,
  emptyProjectProposalForm,
  validateProjectProposalSubmit,
} from "../projectProposal";

function attachment(
  kind: ProjectProposalAttachment["kind"],
  fileName: string,
): ProjectProposalAttachment {
  return {
    id: `${kind}-1`,
    kind,
    fileName,
    mimeType: "image/png",
    uploadedAt: new Date().toISOString(),
  };
}

function minimallyCompleteForm() {
  const form = emptyProjectProposalForm();
  form.projectTitle = "Packaging Line Upgrade";
  form.proponentName = "Juan Dela Cruz";
  form.amountRequested = "500000";
  form.generalObjective = "Improve packaging capacity and reduce rejects.";
  form.firmName = "Flow Test Foods";
  form.organizationType = "Sole Proprietorship";
  form.contactPerson = "Juan Dela Cruz";
  form.rawMaterialsTable = [["Flour", "1000 kg", "Local mill"]];
  form.marketSituation = "Growing regional demand for packaged goods.";
  form.equipmentTable = [
    ["Sealer", "1", "2020", "Good", "50000", "5", "25000", ""],
  ];
  form.scheduleTable = [
    ["Procurement", "1", "", "", "", "", "", "", "", "", "", "", ""],
  ];
  form.wasteVolumeMonthly = "50 kg";
  form.budgetItems = [
    {
      id: "b1",
      item: "Vacuum sealer",
      qty: "1",
      unitCost: "200000",
      setupShare: "200000",
      lgiaShare: "0",
      total: "200000",
    },
  ];
  form.riskRows = [
    {
      id: "r1",
      objective: "Install equipment on schedule",
      risk: "Supplier delay",
      assumption: "Lead time is 8 weeks",
      plan: "Order early and keep alternate fabricator",
    },
  ];
  return form;
}

const requiredAttachments: ProjectProposalAttachment[] = [
  attachment("vicinityMap", "vicinity.png"),
  attachment("plantLayout", "layout.png"),
];

describe("project proposal validation checks", () => {
  beforeEach(() => {
    demoModeStore.setEnabled(false);
  });

  afterEach(() => {
    demoModeStore.setEnabled(false);
  });

  it("marks required fields MISSING on an empty form", () => {
    const form = emptyProjectProposalForm();
    const checks = buildProjectProposalValidationChecks(form, []);
    expect(checks.length).toBeGreaterThan(10);
    expect(checks.every((c) => c.section)).toBe(true);
    const failed = checks.filter((c) => !c.passed);
    expect(failed.length).toBeGreaterThan(8);
    expect(failed.map((c) => c.label)).toEqual(
      expect.arrayContaining([
        "Project Title",
        "Firm Name",
        "Vicinity Map",
        "Plant Layout",
        "Equipment Table",
        "Project Schedule",
        "Risk Management",
      ]),
    );
    const errors = validateProjectProposalSubmit(form, []);
    expect(errors.length).toBe(failed.length);
    expect(errors).toEqual(failed.map((c) => c.error));
  });

  it("passes all checks for a minimally complete proposal", () => {
    const form = minimallyCompleteForm();
    const checks = buildProjectProposalValidationChecks(
      form,
      requiredAttachments,
    );
    expect(checks.every((c) => c.passed)).toBe(true);
    expect(validateProjectProposalSubmit(form, requiredAttachments)).toEqual(
      [],
    );
  });

  it("accepts product demand in place of market situation", () => {
    const form = minimallyCompleteForm();
    form.marketSituation = "";
    form.productDemandSupply = "Demand exceeds current capacity.";
    const checks = buildProjectProposalValidationChecks(
      form,
      requiredAttachments,
    );
    expect(
      checks.find((c) => c.label === "Market Situation / Product Demand")
        ?.passed,
    ).toBe(true);
  });

  it("demo mode clears submit errors but still reports MISSING checks", () => {
    const form = emptyProjectProposalForm();
    demoModeStore.setEnabled(true);
    const checks = buildProjectProposalValidationChecks(form, []);
    expect(checks.some((c) => !c.passed)).toBe(true);
    expect(validateProjectProposalSubmit(form, [])).toEqual([]);
  });
});
