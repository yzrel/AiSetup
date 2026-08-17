/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { applicantStore } from "../../store/applicantStore";
import {
  emptyApprovalLetterForm,
  ensureApprovalLetterPublished,
  getApprovalLetterStored,
  hasRdApprovedNotice,
  publishApprovalLetter,
  recordRdDecision,
  saveApprovalLetterDraft,
} from "../approvalLetter";
import {
  getAwaitingStaffReviewMessage,
  isApplicantViewLocked,
  isAwaitingStaffReview,
} from "../applicantProgress";
import { demoModeStore } from "../../store/demoModeStore";
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
  it("blocks publish without Regional Director approval", () => {
    const applicant = seedApplicant();
    const form = {
      ...emptyApprovalLetterForm(),
      projectTitle: "Approved Project",
      referenceNumber: "REF-1",
      recipientName: "A",
      enterpriseName: "E",
      enterpriseAddress: "Addr",
      pstoOfficeName: "PSTO",
      signatoryName: "RD",
    };
    const result = publishApprovalLetter(applicant.id, form);
    expect(result.ok).toBe(false);
    expect(
      getApprovalLetterStored(applicantStore.getById(applicant.id)!)?.published,
    ).not.toBe(true);
  });

  it("draft save after publish does not clear published", () => {
    const applicant = seedApplicant();
    const form = {
      ...emptyApprovalLetterForm(),
      projectTitle: "Approved Project",
    };
    recordRdDecision(applicant.id, "approved", "rd@dost.gov.ph", form);
    const result = publishApprovalLetter(applicant.id, form);
    expect(result.ok).toBe(true);
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
    expect(stored?.rdDecision).toBe("approved");
  });

  it("staff draft save clears prior RD disapproval for re-endorsement", () => {
    const applicant = seedApplicant();
    const form = emptyApprovalLetterForm();
    recordRdDecision(applicant.id, "disapproved", "rd@dost.gov.ph", form);
    expect(
      getApprovalLetterStored(applicantStore.getById(applicant.id)!)?.rdDecision,
    ).toBe("disapproved");

    saveApprovalLetterDraft(applicant.id, form, { clearRdDisapproval: true });
    const stored = getApprovalLetterStored(applicantStore.getById(applicant.id)!);
    expect(stored?.rdDecision).toBeNull();
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
          rdDecision: "approved",
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

  it("normalizes rdDecision on hydrate", () => {
    const stored = normalizeApprovalLetterStored({
      form: { projectTitle: "X" },
      published: false,
      acknowledged: false,
      rdDecision: "approved",
      rdDecidedBy: "rd@dost.gov.ph",
      rdDecidedAt: "2026-08-06T00:00:00Z",
    });
    expect(stored?.rdDecision).toBe("approved");
    expect(stored?.rdDecidedBy).toBe("rd@dost.gov.ph");
  });
});

describe("client RD approval progression gate", () => {
  beforeEach(() => {
    demoModeStore.setEnabled(false);
  });

  afterEach(() => {
    demoModeStore.setEnabled(false);
  });

  it("locks landbank until RD approved and published", () => {
    const applicant = seedApplicant();
    const form = emptyApprovalLetterForm();
    saveApprovalLetterDraft(applicant.id, form);

    let app = applicantStore.getById(applicant.id)!;
    expect(hasRdApprovedNotice(app)).toBe(false);
    expect(isApplicantViewLocked(app, "landbank-withdrawal")).toBe(true);
    expect(isAwaitingStaffReview(app)).toBe(true);
    expect(getAwaitingStaffReviewMessage(app).title).toMatch(/Regional Director/i);

    recordRdDecision(applicant.id, "approved", "rd@dost.gov.ph", form);
    app = applicantStore.getById(applicant.id)!;
    expect(hasRdApprovedNotice(app)).toBe(false);
    expect(isApplicantViewLocked(app, "landbank-withdrawal")).toBe(true);
    expect(getAwaitingStaffReviewMessage(app).title).toMatch(/being prepared/i);

    expect(publishApprovalLetter(applicant.id, form).ok).toBe(true);
    app = applicantStore.getById(applicant.id)!;
    expect(hasRdApprovedNotice(app)).toBe(true);
    expect(isApplicantViewLocked(app, "landbank-withdrawal")).toBe(true); // still at approval-letter module
    expect(isAwaitingStaffReview(app)).toBe(false);

    applicantStore.update(applicant.id, { currentModule: "landbank-withdrawal" });
    app = applicantStore.getById(applicant.id)!;
    expect(isApplicantViewLocked(app, "landbank-withdrawal")).toBe(false);
  });

  it("shows disapproved awaiting message and keeps later modules locked", () => {
    const applicant = seedApplicant();
    const form = emptyApprovalLetterForm();
    recordRdDecision(applicant.id, "disapproved", "rd@dost.gov.ph", form);
    const app = applicantStore.getById(applicant.id)!;
    expect(getAwaitingStaffReviewMessage(app).title).toMatch(/not approved/i);
    expect(hasRdApprovedNotice(app)).toBe(false);

    applicantStore.update(applicant.id, { currentModule: "landbank-withdrawal" });
    const jumped = applicantStore.getById(applicant.id)!;
    expect(isApplicantViewLocked(jumped, "landbank-withdrawal")).toBe(true);
    expect(isAwaitingStaffReview(jumped)).toBe(true);
  });
});
