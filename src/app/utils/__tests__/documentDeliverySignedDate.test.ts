/**
 * Author: Yzrel Jade B. Eborde
 *
 * Signed-document metadata (signedDate) must survive refresh without
 * re-uploading the scan or re-sending receipt emails.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { applicantStore } from "../../store/applicantStore";
import { emailOutboxStore } from "../../store/emailOutboxStore";
import {
  getSignedDocument,
  saveSignedDocumentWithReceipts,
  sendPrintableToDost,
  updateSignedDocumentMeta,
} from "../documentDelivery";

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in tests"))),
  );
});

describe("updateSignedDocumentMeta", () => {
  it("persists signedDate onto an existing signed document without new outbox mail", () => {
    const app = applicantStore.add({
      applicantName: "Signed Date Test",
      designation: "Owner",
      enterpriseName: "Date Test Co",
      contactNumber: "09170002222",
      emailAddress: `signed-date-${Date.now()}@example.com`,
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

    const beforeMail = emailOutboxStore.getAll().length;

    saveSignedDocumentWithReceipts({
      applicant: app,
      user: null,
      moduleKey: "approval-letter",
      documentTitle: "Approval Letter (Notice of Approval)",
      document: {
        fileName: "APproval.pdf",
        mimeType: "application/pdf",
        dataUrl: "data:application/pdf;base64,dGVzdA==",
        uploadedAt: "2026-07-29T00:00:00.000Z",
        uploadedBy: "staff@example.com",
        // signedDate omitted — matches upload-then-set-date bug
      },
    });

    expect(getSignedDocument(applicantStore.getById(app.id)!, "approval-letter")?.signedDate).toBeUndefined();
    expect(emailOutboxStore.getAll().length).toBeGreaterThan(beforeMail);

    const mailAfterUpload = emailOutboxStore.getAll().length;

    const updated = updateSignedDocumentMeta(app, "approval-letter", {
      signedDate: "2026-07-29",
    });

    expect(updated?.signedDate).toBe("2026-07-29");
    expect(
      getSignedDocument(applicantStore.getById(app.id)!, "approval-letter")?.signedDate,
    ).toBe("2026-07-29");
    expect(
      getSignedDocument(applicantStore.getById(app.id)!, "approval-letter")?.fileName,
    ).toBe("APproval.pdf");
    // Metadata-only update must not send another receipt pair
    expect(emailOutboxStore.getAll().length).toBe(mailAfterUpload);
  });

  it("is a no-op when no signed file is on file yet", () => {
    const app = applicantStore.add({
      applicantName: "No File Yet",
      designation: "Owner",
      enterpriseName: "Empty Co",
      contactNumber: "09170003333",
      emailAddress: `no-file-${Date.now()}@example.com`,
      businessType: "DTI",
      businessNature: "",
      businessSector: "Food Processing",
      yearsOfOperation: "2",
      enterpriseType: "",
      msmeSize: "Micro",
      assetSize: "",
      region: "South Cotabato",
      address: "Koronadal",
      currentModule: "approval-letter",
      qualified: true,
      moduleData: { province: "South Cotabato" },
    });

    expect(updateSignedDocumentMeta(app, "approval-letter", { signedDate: "2026-07-29" })).toBeNull();
    expect(getSignedDocument(applicantStore.getById(app.id)!, "approval-letter")).toBeNull();
  });
});

describe("sendPrintableToDost attachments", () => {
  it("auto-attaches the signed copy on file when no explicit attachment is passed", () => {
    const app = applicantStore.add({
      applicantName: "LOI Sender",
      designation: "Owner",
      enterpriseName: "Eborde Enterprise",
      contactNumber: "09170004444",
      emailAddress: `loi-send-${Date.now()}@example.com`,
      businessType: "DTI",
      businessNature: "",
      businessSector: "Food Processing",
      yearsOfOperation: "5",
      enterpriseType: "",
      msmeSize: "Small",
      assetSize: "",
      region: "North Cotabato",
      address: "Kidapawan",
      currentModule: "letter-of-intent",
      qualified: true,
      moduleData: {
        province: "North Cotabato",
        signedDocuments: {
          "letter-of-intent": {
            fileName: "LOI EBORDE.pdf",
            mimeType: "application/pdf",
            fileId: "file-loi-eborde-1",
            uploadedAt: "2026-08-03T00:00:00.000Z",
            uploadedBy: "staff@example.com",
            signedDate: "2026-08-03",
          },
        },
      },
    });

    const email = sendPrintableToDost({
      applicant: app,
      user: null,
      moduleKey: "letter-of-intent",
      documentTitle: "Letter of Intent",
    });

    expect(email.attachments).toHaveLength(1);
    expect(email.attachments[0]?.fileName).toBe("LOI EBORDE.pdf");
    expect(email.attachments[0]?.fileId).toBe("file-loi-eborde-1");
    expect(email.body).toContain("Please find attached");
    expect(email.body).not.toContain("No file is attached");
    // PSTO/records delivery is temporarily disabled — client is the sole To.
    expect(email.to).toEqual([app.emailAddress]);
    expect(email.to.some((a) => a.includes("@region12.dost.gov.ph"))).toBe(false);
    expect(email.cc.some((a) => a.includes("@region12.dost.gov.ph"))).toBe(false);
  });
});
