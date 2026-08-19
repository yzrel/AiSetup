/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import { buildProjectProposalDraft } from "../projectProposal";
import { getPublishedTna2 } from "../tnaForm02";

describe("project proposal tolerates string tna2 lists", () => {
  it("does not throw when recommendedEquipment is a legacy string", () => {
    const applicant = {
      id: "ff-1",
      enterpriseName: "Full Field Foods Corp",
      applicantName: "Maria",
      designation: "Owner",
      address: "Koronadal",
      emailAddress: "ff@example.com",
      contactNumber: "09181234567",
      msmeSize: "Small",
      businessType: "DTI",
      businessSector: "Food",
      businessNature: "",
      yearsOfOperation: "5",
      assetSize: "",
      moduleData: {
        projectDescription: "Vacuum packaging line",
        expectedOutcome: "40% capacity",
        tna2Document: {
          published: true,
          recommendedEquipment: "Vacuum sealer, labeler",
          technologyGaps: "No vacuum",
          proposedInterventions: "Buy sealer",
          productionProcessAnalysis: "Process ok",
          productivityImprovement: "40% uplift",
          siteValidationFindings: "Site ok",
          findingsByArea: [],
          enterpriseProfile: { enterpriseName: "Full Field Foods Corp" },
        },
      },
    } as unknown as Applicant;

    const published = getPublishedTna2(applicant);
    expect(Array.isArray(published?.recommendedEquipment)).toBe(true);

    expect(() => buildProjectProposalDraft(applicant)).not.toThrow();
    const draft = buildProjectProposalDraft(applicant);
    expect(draft.projectTitle.length).toBeGreaterThan(0);
  });
});
