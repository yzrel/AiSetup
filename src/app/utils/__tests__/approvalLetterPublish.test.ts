/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { applicantStore } from "../../store/applicantStore";
import {
  emptyApprovalLetterForm,
  ensureApprovalLetterPublished,
  getApprovalLetterStored,
  publishApprovalLetter,
  saveApprovalLetterDraft,
} from "../approvalLetter";
import {
  mergeApprovalLetterPreservePublished,
  normalizeApprovalLetterStored,
  normalizeSignedDocumentsMap,
} from "../normalizeCriticalModuleData";

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in tests"))),
  );
});

function seedApplicant() {
  return applicantStore.add({
    applicantName: "Publish Test",
    designation: "Owner",
    enterpriseName: "Publish Co",
    contactNumber: "09171234567",
    emailAddress: `pub-test-${Date.now()}@example.com`,
    businessType: "DTI",
    businessNature: "",
    businessSector: "Food Processing",
    yearsOfOperation: "5",
    enterpriseType: "",
    msmeSize: "Small",
    assetSize: "",
    region: "Region XII (SOCCSKSARGEN)",
    address: "Koronadal City, South Cotabato",
    currentModule: "approval-letter",
    qualified: true,
    moduleData: {},
  });
}

describe("normalizeCriticalModuleData", () => {
  it("normalizes approval letter published flags from legacy shapes", () => {
    const stored = normalizeApprovalLetterStored({
      form: { projectTitle: "X", published: true },
      published: false,
      acknowledged: "yes",
    });
    expect(stored?.published).toBe(true);
    expect(stored?.acknowledged).toBe(false);
    expect(stored?.form.projectTitle).toBe("X");
  });

  it("keeps published true when merging a stale draft", () => {
    const merged = mergeApprovalLetterPreservePublished(
      {
        form: emptyApprovalLetterForm(),
        published: true,
        publishedAt: "2026-07-01T00:00:00Z",
        acknowledged: false,
      },
      {
        form: { ...emptyApprovalLetterForm(), projectTitle: "Stale" },
        published: false,
        acknowledged: false,
      },
    );
    expect(merged.published).toBe(true);
    expect(merged.publishedAt).toBe("2026-07-01T00:00:00Z");
    expect(merged.form.projectTitle).toBe("Stale");
  });

  it("filters invalid signedDocuments entries", () => {
    const docs = normalizeSignedDocumentsMap({
      "letter-of-intent": { fileName: "loi.pdf", fileId: "1" },
      junk: { mimeType: "application/pdf" },
    });
    expect(Object.keys(docs)).toEqual(["letter-of-intent"]);
  });
});

describe("approval letter publish merge", () => {
  it("draft save after publish does not clear published", () => {
    const applicant = seedApplicant();
    const form = {
      ...emptyApprovalLetterForm(),
      projectTitle: "Approved Project",
    };
    publishApprovalLetter(applicant.id, form);
    expect(
      getApprovalLetterStored(applicantStore.getById(applicant.id)!)?.published,
    ).toBe(true);

    saveApprovalLetterDraft(applicant.id, {
      ...form,
      projectTitle: "Edited Title",
      published: false,
    });
    const stored = getApprovalLetterStored(applicantStore.getById(applicant.id)!);
    expect(stored?.published).toBe(true);
    expect(stored?.form.projectTitle).toBe("Edited Title");
  });

  it("ensureApprovalLetterPublished restores wiped flag", () => {
    const applicant = seedApplicant();
    const form = emptyApprovalLetterForm();
    applicantStore.update(applicant.id, {
      moduleData: {
        approvalLetter: {
          form,
          published: false,
          acknowledged: false,
          publishedAt: "2026-07-15T00:00:00Z",
        },
      },
    });
    ensureApprovalLetterPublished(applicant.id, form);
    const stored = getApprovalLetterStored(applicantStore.getById(applicant.id)!);
    expect(stored?.published).toBe(true);
    expect(stored?.publishedAt).toBe("2026-07-15T00:00:00Z");
  });

  it("getApprovalLetterStored returns null for corrupt scalar blobs", () => {
    const applicant = seedApplicant();
    applicantStore.update(applicant.id, {
      moduleData: { approvalLetter: "corrupt" },
    });
    expect(getApprovalLetterStored(applicantStore.getById(applicant.id)!)).toBeNull();
  });
});
