/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import type { ProjectProposalAttachment } from "../../api/types";
import {
  getProjectProposalAttachments,
  mergeProposalAttachmentsFromTna,
} from "../projectProposal";

function tnaAttachmentApplicant(
  files: Record<string, string>,
  proposalAttachments: ProjectProposalAttachment[] = [],
): Applicant {
  return {
    id: "att-fwd-1",
    enterpriseName: "Attachment Foods",
    applicantName: "Juan",
    designation: "Owner",
    address: "Koronadal",
    emailAddress: "att@example.com",
    contactNumber: "09180000000",
    msmeSize: "Small",
    businessType: "DTI",
    businessSector: "Food",
    businessNature: "",
    yearsOfOperation: "5",
    assetSize: "",
    moduleData: {
      tna1: {
        submitted: true,
        form: files,
      },
      projectProposal: {
        attachments: proposalAttachments,
        form: {},
        submitted: false,
      },
    },
  } as unknown as Applicant;
}

describe("mergeProposalAttachmentsFromTna", () => {
  it("prefills productionPlan, plantLayout, and processFlow from TNA when slots are empty", () => {
    const applicant = tnaAttachmentApplicant({
      productionPlanFileName: "plan.pdf",
      productionPlanFileMime: "application/pdf",
      productionPlanFileId: "plan-id",
      plantLayoutFileName: "layout.jpg",
      plantLayoutFileMime: "image/jpeg",
      plantLayoutFileData: "data:image/jpeg;base64,abc",
      processFlowFileName: "flow.png",
      processFlowFileMime: "image/png",
      processFlowFileData: "data:image/png;base64,xyz",
    });

    const merged = mergeProposalAttachmentsFromTna(applicant, []);
    expect(merged).toHaveLength(3);
    expect(merged.map((a) => a.kind).sort()).toEqual([
      "plantLayout",
      "processFlow",
      "productionPlan",
    ]);
    expect(merged.find((a) => a.kind === "productionPlan")?.fileName).toBe(
      "plan.pdf",
    );
    expect(merged.find((a) => a.kind === "plantLayout")?.dataUrl).toBe(
      "data:image/jpeg;base64,abc",
    );
    expect(merged.find((a) => a.kind === "processFlow")?.fileName).toBe(
      "flow.png",
    );
  });

  it("prefills orgChart from TNA Organizational Structure when the slot is empty", () => {
    const applicant = tnaAttachmentApplicant({
      orgStructureFileName: "threek-org.jpg",
      orgStructureFileMime: "image/jpeg",
      orgStructureFileId: "org-1",
    });
    const merged = mergeProposalAttachmentsFromTna(applicant, []);
    expect(merged.find((a) => a.kind === "orgChart")?.fileName).toBe(
      "threek-org.jpg",
    );
    expect(merged.find((a) => a.kind === "orgChart")?.fileId).toBe("org-1");
  });

  it("does not overwrite existing proposal attachments", () => {
    const existing: ProjectProposalAttachment[] = [
      {
        id: "existing-pl",
        kind: "plantLayout",
        fileName: "custom-layout.pdf",
        mimeType: "application/pdf",
        uploadedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const applicant = tnaAttachmentApplicant(
      {
        plantLayoutFileName: "tna-layout.jpg",
        plantLayoutFileMime: "image/jpeg",
        processFlowFileName: "flow.png",
        processFlowFileMime: "image/png",
      },
      existing,
    );

    const merged = mergeProposalAttachmentsFromTna(applicant, existing);
    expect(merged.filter((a) => a.kind === "plantLayout")).toHaveLength(1);
    expect(merged.find((a) => a.kind === "plantLayout")?.fileName).toBe(
      "custom-layout.pdf",
    );
    expect(merged.some((a) => a.kind === "processFlow")).toBe(true);
  });

  it("returns existing list unchanged when TNA has no uploads", () => {
    const existing: ProjectProposalAttachment[] = [
      {
        id: "vm-1",
        kind: "vicinityMap",
        fileName: "site.png",
        mimeType: "image/png",
        uploadedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const applicant = tnaAttachmentApplicant({}, existing);
    expect(mergeProposalAttachmentsFromTna(applicant, existing)).toEqual(
      existing,
    );
  });
});

describe("getProjectProposalAttachments", () => {
  it("includes TNA prefills via mergeProposalAttachmentsFromTna", () => {
    const applicant = tnaAttachmentApplicant({
      processFlowFileName: "diagram.jpg",
      processFlowFileMime: "image/jpeg",
    });
    const attachments = getProjectProposalAttachments(applicant);
    expect(attachments.some((a) => a.kind === "processFlow")).toBe(true);
  });
});
