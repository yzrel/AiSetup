/**
 * Author: Yzrel Jade B. Eborde
 *
 * Signed MOA persistence: draft/publish must not wipe signedMoa, and save+email
 * must record DOST receipts in the outbox.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { applicantStore } from "../../store/applicantStore";
import { emailOutboxStore } from "../../store/emailOutboxStore";
import {
  buildApprovalLetterDraft,
  getSignedMoa,
  publishApprovalLetter,
  saveApprovalLetterDraft,
  saveSignedMoa,
  saveSignedMoaDraft,
} from "../approvalLetter";
import { sendSignedMoaReceiptsToDost } from "../documentDelivery";

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in tests"))),
  );
});

function seedApplicant() {
  return applicantStore.add({
    applicantName: "MOA Test Applicant",
    designation: "Owner",
    enterpriseName: "MOA Test Enterprise",
    contactNumber: "09171234567",
    emailAddress: `moa-test-${Date.now()}@example.com`,
    businessType: "DTI",
    businessNature: "",
    businessSector: "Food Processing",
    yearsOfOperation: "5",
    enterpriseType: "",
    msmeSize: "Small",
    assetSize: "",
    region: "South Cotabato",
    address: "Koronadal City, South Cotabato",
    currentModule: "approval-letter",
    qualified: true,
    moduleData: {
      province: "South Cotabato",
      accountStatus: "active",
    },
  });
}

describe("signed MOA persistence", () => {
  let applicantId: string;

  beforeEach(() => {
    const app = seedApplicant();
    applicantId = app.id;
    const form = buildApprovalLetterDraft(app);
    saveApprovalLetterDraft(applicantId, form);
  });

  it("preserves signedMoa when Save Draft rewrites the approval letter", () => {
    saveSignedMoa(applicantId, {
      fileName: "signed-moa.pdf",
      mimeType: "application/pdf",
      dataUrl: "data:application/pdf;base64,dGVzdA==",
      uploadedAt: "2026-07-29T00:00:00.000Z",
      uploadedBy: "staff@example.com",
      moaSignedDate: "2026-07-29",
      signingVenue: "PSTO COTABATO",
      notes: "Wet-ink scan",
    });

    const before = getSignedMoa(applicantStore.getById(applicantId)!);
    expect(before?.signingVenue).toBe("PSTO COTABATO");

    const form = buildApprovalLetterDraft(applicantStore.getById(applicantId)!);
    saveApprovalLetterDraft(applicantId, { ...form, projectTitle: "Updated title" });

    const after = getSignedMoa(applicantStore.getById(applicantId)!);
    expect(after).toEqual(before);
  });

  it("preserves signedMoa when publishing the approval letter", () => {
    saveSignedMoa(applicantId, {
      fileName: "signed-moa.pdf",
      mimeType: "application/pdf",
      uploadedAt: "2026-07-29T00:00:00.000Z",
      uploadedBy: "staff@example.com",
      moaSignedDate: "2026-07-29",
      signingVenue: "PSTO COTABATO",
    });

    const form = buildApprovalLetterDraft(applicantStore.getById(applicantId)!);
    publishApprovalLetter(applicantId, form);

    const after = getSignedMoa(applicantStore.getById(applicantId)!);
    expect(after?.fileName).toBe("signed-moa.pdf");
    expect(after?.signingVenue).toBe("PSTO COTABATO");
  });

  it("keeps a draft flush (date/venue/notes, no file) across a subsequent letter draft save", () => {
    saveSignedMoaDraft(applicantId, {
      fileName: "",
      mimeType: "",
      uploadedAt: "2026-07-29T01:00:00.000Z",
      uploadedBy: "staff@example.com",
      moaSignedDate: "2026-07-29",
      signingVenue: "PSTO COTABATO",
      notes: "Awaiting scan",
    });

    const form = buildApprovalLetterDraft(applicantStore.getById(applicantId)!);
    saveApprovalLetterDraft(applicantId, form);

    const after = getSignedMoa(applicantStore.getById(applicantId)!);
    expect(after?.moaSignedDate).toBe("2026-07-29");
    expect(after?.signingVenue).toBe("PSTO COTABATO");
    expect(after?.notes).toBe("Awaiting scan");
    expect(after?.fileName).toBe("");
  });

  it("saves signed MOA even when approvalLetter shell was missing", () => {
    const bare = applicantStore.add({
      applicantName: "Bare MOA",
      designation: "Owner",
      enterpriseName: "Bare Co",
      contactNumber: "09170001111",
      emailAddress: `bare-moa-${Date.now()}@example.com`,
      businessType: "DTI",
      businessNature: "",
      businessSector: "Food Processing",
      yearsOfOperation: "3",
      enterpriseType: "",
      msmeSize: "Micro",
      assetSize: "",
      region: "South Cotabato",
      address: "Koronadal",
      currentModule: "approval-letter",
      qualified: true,
      moduleData: { province: "South Cotabato" },
    });

    saveSignedMoa(bare.id, {
      fileName: "moa.pdf",
      mimeType: "application/pdf",
      uploadedAt: "2026-07-29T02:00:00.000Z",
      uploadedBy: "staff@example.com",
      moaSignedDate: "2026-07-28",
    });

    expect(getSignedMoa(applicantStore.getById(bare.id)!)?.fileName).toBe("moa.pdf");
  });

  it("emails DOST (and client) receipts when sendSignedMoaReceiptsToDost runs", () => {
    const app = applicantStore.getById(applicantId)!;
    const beforeCount = emailOutboxStore.getAll().length;

    sendSignedMoaReceiptsToDost({
      applicant: app,
      user: {
        id: "staff-1",
        email: "staff@region12.dost.gov.ph",
        firstName: "Staff",
        middleName: "",
        lastName: "User",
        role: "admin",
        enterpriseName: "DOST XII",
        verified: true,
      },
      document: {
        fileName: "signed-moa.pdf",
        mimeType: "application/pdf",
        dataUrl: "data:application/pdf;base64,dGVzdA==",
        uploadedAt: "2026-07-29T03:00:00.000Z",
        uploadedBy: "staff@region12.dost.gov.ph",
        signedDate: "2026-07-29",
        notes: "Signed at PSTO",
      },
    });

    const sent = emailOutboxStore
      .getAll()
      .slice(0, emailOutboxStore.getAll().length - beforeCount)
      .filter((e) => e.applicantId === applicantId && e.module === "signedMoa");

    // Client receipt + DOST copy
    expect(sent.length).toBeGreaterThanOrEqual(2);
    expect(sent.some((e) => e.to.includes(app.emailAddress))).toBe(true);
    expect(
      sent.some((e) =>
        e.subject.includes("Signed Memorandum of Agreement (MOA)"),
      ),
    ).toBe(true);
  });
});
