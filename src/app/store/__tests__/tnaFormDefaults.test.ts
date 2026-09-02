/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../applicantStore";
import {
  mergeTnaSavedData,
  orgStructureFromProposal,
} from "../tnaFormDefaults";

function applicantWithOrgChart(overrides?: Partial<Applicant>): Applicant {
  return {
    id: "3k-1",
    applicationId: "LOI-2024-0003K1",
    applicantName: "Marlon Cesar B. Orfrecio",
    designation: "Proprietor",
    enterpriseName: "Three K Printshop",
    contactNumber: "09170000000",
    emailAddress: "threek@printshop.demo",
    businessType: "DTI",
    businessNature: "Printing",
    businessSector: "ICT",
    yearsOfOperation: "10",
    enterpriseType: "",
    msmeSize: "Micro",
    assetSize: "",
    region: "Cotabato",
    address: "Antipas, Cotabato",
    currentModule: "tna1",
    qualified: true,
    submittedAt: "",
    lastUpdated: "",
    moduleData: {
      projectProposal: {
        attachments: [
          {
            kind: "orgChart",
            fileName: "Business-Organizational-Chart-1-scaled.jpg",
            fileId: "org-file-1",
            mimeType: "image/jpeg",
          },
        ],
      },
    },
    ...overrides,
  } as Applicant;
}

describe("orgStructureFromProposal", () => {
  it("copies Form 001 org-chart metadata into TNA Form 01 fields", () => {
    expect(orgStructureFromProposal(applicantWithOrgChart())).toEqual({
      orgStructureFileName: "Business-Organizational-Chart-1-scaled.jpg",
      orgStructureFileData: "",
      orgStructureFileId: "org-file-1",
      orgStructureFileMime: "image/jpeg",
    });
  });

  it("returns empty slots when no org chart is on file", () => {
    expect(orgStructureFromProposal(null).orgStructureFileName).toBe("");
  });
});

describe("mergeTnaSavedData", () => {
  it("prefills blank Organizational Structure from the proposal attachment", () => {
    const { form } = mergeTnaSavedData(applicantWithOrgChart(), {
      form: { orgStructureFileName: "" },
    });
    expect(form.orgStructureFileName).toBe(
      "Business-Organizational-Chart-1-scaled.jpg",
    );
    expect(form.orgStructureFileId).toBe("org-file-1");
  });

  it("does not overwrite an existing TNA org-structure upload", () => {
    const { form } = mergeTnaSavedData(applicantWithOrgChart(), {
      form: {
        orgStructureFileName: "custom-chart.png",
        orgStructureFileId: "custom-id",
        orgStructureFileMime: "image/png",
      },
    });
    expect(form.orgStructureFileName).toBe("custom-chart.png");
    expect(form.orgStructureFileId).toBe("custom-id");
  });
});
