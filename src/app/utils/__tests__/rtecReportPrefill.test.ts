/**
 * Author: Yzrel Jade B. Eborde
 *
 * Form 002 blank-field enrichment from prior Form 001 / TNA1 data.
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import { emptyProjectProposalForm } from "../projectProposal";
import {
  enrichRtecSnapshotFromPriorModules,
  syncRtecFromProjectProposal,
  emptyRtecReportForm,
} from "../rtecReport";

function minimalApplicant(
  overrides: Partial<Applicant> & { moduleData?: Applicant["moduleData"] } = {},
): Applicant {
  return {
    id: "app-1",
    applicationId: "LOI-2026-000001",
    enterpriseName: "Acme Foods",
    applicantName: "Juan Dela Cruz",
    designation: "Owner",
    emailAddress: "juan@example.com",
    contactNumber: "09171234567",
    address: "Koronadal City",
    msmeSize: "Micro",
    businessType: "Sole Proprietorship",
    businessSector: "Food",
    businessNature: "Processing",
    yearsOfOperation: "5",
    assetSize: "1000000",
    qualified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    moduleData: {
      ...(overrides.moduleData ?? {}),
    },
    ...overrides,
  } as Applicant;
}

describe("enrichRtecSnapshotFromPriorModules", () => {
  it("enriches blank waste from wasteKinds / wasteDisposalMethods", () => {
    const pp = {
      ...emptyProjectProposalForm(),
      wasteManagement: "",
      wasteKinds: "Paper scraps",
      wasteDisposalMethods: "Recycling via LGU",
    };
    const out = enrichRtecSnapshotFromPriorModules(pp, null);
    expect(out.wasteManagement).toContain("Paper scraps");
    expect(out.wasteManagement).toContain("Recycling via LGU");
  });

  it("enriches blank waste from TNA1 when Form 001 waste fields empty", () => {
    const pp = {
      ...emptyProjectProposalForm(),
      wasteManagement: "",
      wasteKinds: "",
      wasteDisposalMethods: "",
    };
    const applicant = minimalApplicant({
      moduleData: {
        tna1: {
          form: { wasteManagement: "Segregate and compost organics" },
          tables: { rawMaterials: [], production: [], equipment: [] },
          submitted: true,
        },
      },
    });
    const out = enrichRtecSnapshotFromPriorModules(pp, applicant);
    expect(out.wasteManagement).toBe("Segregate and compost organics");
  });

  it("enriches blank equipmentNarrative from equipmentTable", () => {
    const pp = {
      ...emptyProjectProposalForm(),
      equipmentNarrative: "",
      equipmentTable: [["Dryer", "2", "Stainless"], ["", "", ""]],
    };
    const out = enrichRtecSnapshotFromPriorModules(pp, null);
    expect(out.equipmentNarrative).toContain("Dryer");
    expect(out.equipmentNarrative).toContain("Qty: 2");
    expect(out.equipmentNarrative).toContain("Spec: Stainless");
  });

  it("seeds marketing and management blanks from related Form 001 fields", () => {
    const pp = {
      ...emptyProjectProposalForm(),
      firmName: "Acme Foods",
      contactPerson: "Juan Dela Cruz",
      distributionChannel: "Local markets",
      competitors: "Nearby bakeries",
      marketSituation: "",
      existingMarketingProblems: "",
      skillsExpertise: "",
      compensation: "",
      compensationTable: [["Operator", "3", "500", "6", "", "", ""]],
    };
    const out = enrichRtecSnapshotFromPriorModules(pp, null);
    expect(out.marketSituation).toContain("Local markets");
    expect(out.existingMarketingProblems).toContain("Nearby bakeries");
    expect(out.skillsExpertise).toContain("Juan Dela Cruz");
    expect(out.compensation).toContain("Operator");
  });

  it("preserves non-blank locals (staff overrides)", () => {
    const pp = {
      ...emptyProjectProposalForm(),
      wasteManagement: "Staff waste text",
      wasteKinds: "Paper",
      equipmentNarrative: "Staff equipment text",
      equipmentTable: [["Dryer", "1", ""]],
      marketSituation: "Staff market text",
      distributionChannel: "Online",
      existingMarketingProblems: "Staff problems",
      competitors: "Rival Co",
      skillsExpertise: "Staff skills",
      compensation: "Staff pay narrative",
      compensationTable: [["Helper", "1", "400", "", "", "", ""]],
    };
    const out = enrichRtecSnapshotFromPriorModules(pp, null);
    expect(out.wasteManagement).toBe("Staff waste text");
    expect(out.equipmentNarrative).toBe("Staff equipment text");
    expect(out.marketSituation).toBe("Staff market text");
    expect(out.existingMarketingProblems).toBe("Staff problems");
    expect(out.skillsExpertise).toBe("Staff skills");
    expect(out.compensation).toBe("Staff pay narrative");
  });
});

describe("syncRtecFromProjectProposal enrichment", () => {
  it("does not wipe non-blank RTEC waste after Sync", () => {
    const upstream = {
      ...emptyProjectProposalForm(),
      projectTitle: "Upgrade",
      wasteManagement: "",
      wasteKinds: "Upstream kinds",
    };
    const existing = emptyRtecReportForm(
      {
        ...upstream,
        wasteManagement: "Kept staff waste",
      },
      [],
    );
    const applicant = minimalApplicant({
      moduleData: {
        projectProposal: {
          form: upstream,
          submitted: true,
        },
      },
    });
    // getProjectProposalForm reads stored form; enrichment after pick must keep staff text
    const synced = syncRtecFromProjectProposal(existing, applicant);
    expect(synced.proposalSnapshot.wasteManagement).toBe("Kept staff waste");
  });
});
