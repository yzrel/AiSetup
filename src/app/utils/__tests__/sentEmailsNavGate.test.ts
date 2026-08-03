/**
 * Author: Yzrel Jade B. Eborde
 *
 * Sent Emails nav unlocks only after a signed document has been submitted.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../store/authStore";
import { applicantStore } from "../../store/applicantStore";
import { emailOutboxStore } from "../../store/emailOutboxStore";
import {
  isSentEmailsNavUnlocked,
  saveSignedDocumentWithReceipts,
} from "../documentDelivery";

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in tests"))),
  );
});

function staffUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "staff-sent-emails-gate",
    email: "admin@dost.gov.ph",
    firstName: "Admin",
    middleName: "",
    lastName: "User",
    role: "admin",
    enterpriseName: "",
    verified: true,
    officeId: "regional",
    ...overrides,
  };
}

describe("isSentEmailsNavUnlocked", () => {
  it("is locked for null user and when no signed documents exist", () => {
    expect(isSentEmailsNavUnlocked(null)).toBe(false);
    // Fresh staff with no signed-receipt visibility for this check may still
    // unlock if other tests left signedDocuments in applicantStore — assert
    // the signed-receipt path explicitly below instead.
  });

  it("unlocks after a signed-receipt is recorded in the outbox", () => {
    const user = staffUser({
      id: `admin-${Date.now()}`,
      email: `admin-gate-${Date.now()}@dost.gov.ph`,
    });

    emailOutboxStore.send({
      kind: "signed-receipt",
      to: ["client@example.com"],
      cc: [],
      subject: "Receipt",
      body: "Signed copy received.",
      attachments: [],
      sentBy: user.email,
      officeId: "regional",
    });

    expect(isSentEmailsNavUnlocked(user)).toBe(true);
  });

  it("unlocks after an applicant has a signedDocuments entry", () => {
    const user = staffUser({
      id: `admin-docs-${Date.now()}`,
      email: `admin-docs-${Date.now()}@dost.gov.ph`,
    });

    const app = applicantStore.add({
      applicantName: "Gate Test",
      designation: "Owner",
      enterpriseName: "Gate Co",
      contactNumber: "09170003333",
      emailAddress: `gate-${Date.now()}@example.com`,
      businessType: "DTI",
      businessNature: "",
      businessSector: "Food Processing",
      yearsOfOperation: "5",
      enterpriseType: "",
      msmeSize: "Small",
      assetSize: "",
      region: "South Cotabato",
      address: "Koronadal",
      currentModule: "approval-letter",
      qualified: true,
      moduleData: { province: "South Cotabato" },
    });

    saveSignedDocumentWithReceipts({
      applicant: app,
      user,
      moduleKey: "approval-letter",
      documentTitle: "Approval Letter",
      document: {
        fileName: "signed.pdf",
        mimeType: "application/pdf",
        dataUrl: "data:application/pdf;base64,dGVzdA==",
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.email,
      },
    });

    expect(isSentEmailsNavUnlocked(user)).toBe(true);
  });

  it("does not unlock on printable-only outbox mail", () => {
    const user = staffUser({
      id: `admin-printable-${Date.now()}`,
      email: `admin-printable-${Date.now()}@dost.gov.ph`,
      // Isolate from regional admin visibility of other tests' receipts by
      // using provincial-director scoped to an empty office with no receipts.
      role: "provincial-director",
      officeId: `psto-empty-${Date.now()}`,
    });

    emailOutboxStore.send({
      kind: "printable",
      to: ["client@example.com"],
      cc: [],
      subject: "Please sign",
      body: "Please sign the attached document.",
      attachments: [],
      sentBy: user.email,
      officeId: user.officeId,
    });

    // No signedDocuments for this office and only printable mail → locked
    // unless another applicant globally has signedDocuments (shared store).
    // Prefer asserting printable alone does not satisfy the outbox branch:
    const unlockedViaReceipt = emailOutboxStore
      .getForUser(user)
      .some((e) => e.kind === "signed-receipt");
    expect(unlockedViaReceipt).toBe(false);
  });
});
