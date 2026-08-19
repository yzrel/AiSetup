/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { applicantStore } from "../../store/applicantStore";
import { collectApplicantSubmittedFiles } from "../applicantSubmittedFiles";

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in tests"))),
  );
});

describe("collectApplicantSubmittedFiles", () => {
  it("does not throw when requirement uploads and PIS filings are objects", () => {
    const app = applicantStore.add({
      applicantName: "Files Test",
      designation: "Owner",
      enterpriseName: "Files Co",
      contactNumber: "09170000000",
      emailAddress: `files-${Date.now()}@example.com`,
      businessType: "DTI",
      businessNature: "",
      businessSector: "Food Processing",
      yearsOfOperation: "5",
      enterpriseType: "",
      msmeSize: "Small",
      assetSize: "",
      region: "South Cotabato",
      address: "Koronadal City, South Cotabato",
      currentModule: "requirements",
      qualified: true,
      moduleData: {
        requirementUploads: {
          projected: {
            id: "projected",
            name: "Projected financial statements",
            uploaded: true,
            fileName: "projected.pdf",
          },
        },
        projectInformationSheet: {
          prePisDraft: { projectTitle: "Test" },
          ongoingFilings: {
            "0": { id: "f1", periodLabel: "Jan–Jun 2026", filedAt: "2026-07-01" },
          },
        },
      },
    });

    expect(() =>
      collectApplicantSubmittedFiles(app, { scope: "loi-onward" }),
    ).not.toThrow();
    const files = collectApplicantSubmittedFiles(app, { scope: "loi-onward" });
    expect(Array.isArray(files)).toBe(true);
    expect(files.some((f) => f.fileName === "projected.pdf")).toBe(true);
  });
});
