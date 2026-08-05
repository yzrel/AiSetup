/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  enrichTna2Summary,
  normalizeFindingsByArea,
  prefillFindingsFromTna1,
} from "../tnaForm02";
import type { Tna2DocumentResponse } from "../../api/types";
import { TNA_FORM_02_FINDINGS_TEMPLATE } from "../../constants/tnaForm02Layout";

describe("normalizeFindingsByArea", () => {
  it("does not crash when section title is missing", () => {
    expect(() =>
      normalizeFindingsByArea([
        { title: undefined as unknown as string, content: "x" },
        { title: "", content: "y" },
      ]),
    ).not.toThrow();
  });

  it("accepts legacy area key instead of title", () => {
    const sections = normalizeFindingsByArea([
      {
        // legacy full-field / API shape
        area: "1. Strategic Direction",
        content: "Legacy blob",
      } as { title: string; content: string },
    ]);
    expect(sections[0].title).toBe("1. Strategic Direction");
  });
});

function emptyFindingsTemplate() {
  return TNA_FORM_02_FINDINGS_TEMPLATE.map((s) => ({
    title: s.title,
    subsections: s.subsections.map((sub) => ({ ...sub, content: "" })),
  }));
}

function findingsById(findings: ReturnType<typeof prefillFindingsFromTna1>) {
  return Object.fromEntries(
    findings.flatMap((s) => (s.subsections ?? []).map((sub) => [sub.id, sub.content ?? ""])),
  );
}

describe("prefillFindingsFromTna1", () => {
  it("does not put expectedOutcome or plan fields into Mission Statement", () => {
    const outcome =
      "Upon successful implementation, Eborde Enterprise anticipates improved production efficiency.";
    const findings = prefillFindingsFromTna1(emptyFindingsTemplate(), {
      plan5Years: "Expand capacity in five years",
      plan10Years: "Enter export markets",
      reasonsForAssistance: "Upgrade packaging line",
      expectedOutcome: outcome,
    });
    const byId = findingsById(findings);
    expect(byId.mission).toBe("");
    expect(byId.vision).toBe("");
    expect(byId.plans).toContain("Expand capacity in five years");
    expect(byId.plans).toContain(outcome);
    expect(byId.plans).not.toMatch(/^Upon successful implementation/);
  });

  it("maps multi-target TNA1 sources to primary subsections only", () => {
    const safety = "PPE required; fire extinguishers inspected monthly.";
    const processFlow = "Receive → Sort → Dry → Pack → Ship";
    const waste = "Organic waste composted; plastics segregated.";
    const problems = "Manual packing bottlenecks at peak season.";
    const cgmp = "Basic GMP practiced; no formal HACCP.";

    const byId = findingsById(
      prefillFindingsFromTna1(emptyFindingsTemplate(), {
        safetyMeasures: safety,
        processFlow,
        wasteManagement: waste,
        productionProblemsConcerns: problems,
        cgmpHaccp: cgmp,
        hiringCriteria: "Experience preferred",
        employeeIncentives: "Attendance bonus",
        trainingDevelopment: "On-the-job training",
        employeesMale: "5",
        employeesFemale: "4",
      }),
    );

    expect(byId.ohs).toBe(safety);
    expect(byId["work-environment"]).toBe("");

    expect(byId["production-system"]).toBe(processFlow);
    expect(byId.operational).toBe("");

    expect(byId["waste-management"]).toBe(waste);
    expect(byId["methods-of-disposal"]).toBe("");

    expect(byId["production-planning"]).toBe(problems);
    expect(byId["work-study"]).toBe("");
    expect(byId["equipment-mgmt"]).toBe("");

    expect(byId["qa-system"]).toBe(cgmp);
    expect(byId["product-quality"]).toBe("");

    expect(byId["human-resources"]).toContain("Hiring criteria");
    expect(byId["human-resources"]).not.toContain("Attendance bonus");
    expect(byId["human-resources"]).not.toContain("On-the-job training");
    expect(byId.compensation).toBe("Attendance bonus");
    expect(byId["technical-training"]).toBe("On-the-job training");
  });
});

describe("enrichTna2Summary", () => {
  it("tolerates string legacy fields from full-field payloads", () => {
    const raw = {
      documentRef: "TNA2-TEST",
      assessmentDate: "2026-08-06",
      enterpriseProfile: { enterpriseName: "Full Field Foods Corp" },
      findingsByArea: [{ area: "Production", content: "Bottleneck" }],
      siteValidationFindings: "Site ok",
      productionProcessAnalysis: "Process ok",
      technologyGaps: "No vacuum",
      proposedInterventions: "Buy sealer",
      recommendedEquipment: "Sealer",
      productivityImprovement: "40% uplift",
      tnaTeam: { leader: "Lead Engr", members: "A, B" },
      assessor: { name: "Lead", position: "SRS" },
      generatedAt: new Date().toISOString(),
      aiGenerated: false,
    } as unknown as Tna2DocumentResponse;

    const doc = enrichTna2Summary(raw);
    expect(doc.siteValidationFindings).toEqual(["Site ok"]);
    expect(doc.technologyGaps).toEqual(["No vacuum"]);
    expect(doc.tnaTeam?.leader.name).toBe("Lead Engr");
    expect(doc.tnaTeam?.members.map((m) => m.name)).toEqual(["A", "B"]);
    expect(doc.findingsByArea?.length).toBeGreaterThan(0);
  });
});
