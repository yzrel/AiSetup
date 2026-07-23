/**
 * Author: Yzrel Jade B. Eborde
 *
 * Document delivery helpers — sending module printables to DOST admin/staff
 * and distributing signed-document receipts (proof of delivery) by email.
 * Email sending is simulated through the in-app outbox store.
 */

import { AdminView, AuthUser, authStore } from "../store/authStore";
import { Applicant, applicantStore } from "../store/applicantStore";
import {
  emailOutboxStore,
  OutboxAttachment,
  OutboxEmail,
} from "../store/emailOutboxStore";
import { notificationStore } from "../store/notificationStore";
import {
  getOfficeContact,
  resolveApplicantOfficeId,
} from "./provincialOffice";
import type { SignedDocumentValue } from "../components/SignedDocumentUpload";
import { syncModuleKeyToBackendBestEffort } from "./applicantPersistence";

const REGIONAL_RECORDS_EMAIL = "records@region12.dost.gov.ph";

export interface SignedDocumentRecord extends SignedDocumentValue {
  signedDate?: string;
  notes?: string;
}

function dostRecipients(applicant: Applicant): {
  to: string[];
  officeId: string;
} {
  const officeId = resolveApplicantOfficeId(applicant);
  const office = getOfficeContact(officeId);
  const to = [office.email];
  if (office.email !== REGIONAL_RECORDS_EMAIL) {
    to.push(REGIONAL_RECORDS_EMAIL);
  }
  return { to, officeId };
}

function notificationView(moduleKey: string): AdminView {
  if (moduleKey.startsWith("withdrawal-request")) return "landbank-withdrawal";
  return (moduleKey as AdminView) || "landbank-withdrawal";
}

/**
 * Sends a module printable (generated document) to the applicant's PSTO and
 * the DOST regional records office, with a copy to the client.
 */
export function sendPrintableToDost(options: {
  applicant: Applicant;
  user: AuthUser | null;
  moduleKey: string;
  documentTitle: string;
  attachment?: OutboxAttachment | null;
}): OutboxEmail {
  const { applicant, user, moduleKey, documentTitle, attachment } = options;
  const { to, officeId } = dostRecipients(applicant);
  const view = notificationView(moduleKey);

  const email = emailOutboxStore.send({
    kind: "printable",
    to,
    cc: applicant.emailAddress ? [applicant.emailAddress] : [],
    subject: `[aiSETUP] ${documentTitle} — ${applicant.enterpriseName} (${applicant.applicationId})`,
    body:
      `Good day,\n\n` +
      `Please find attached the ${documentTitle} of ${applicant.enterpriseName} ` +
      `(Application ID: ${applicant.applicationId}) submitted through the aiSETUP system.\n\n` +
      `This document was transmitted electronically for your review and records.\n\n` +
      `Respectfully,\naiSETUP — DOST Region XII`,
    attachments: attachment
      ? [attachment]
      : [{ fileName: `${documentTitle} - ${applicant.applicationId}.pdf` }],
    sentBy: user?.email ?? applicant.emailAddress,
    applicantId: applicant.id,
    officeId,
    module: moduleKey,
  });

  notificationStore.add({
    audience: "staff",
    applicantId: applicant.id,
    officeId,
    kind: "action",
    title: `${documentTitle} received by email`,
    message: `${applicant.enterpriseName} sent the ${documentTitle} to DOST for review.`,
    view,
  });
  notificationStore.add({
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: `${documentTitle} sent to DOST`,
    message: `Your ${documentTitle} was emailed to your PSTO and the DOST Region XII records office. A copy was sent to ${applicant.emailAddress || "your email"}.`,
    view,
  });

  return email;
}

/**
 * Sends a generated printable primarily to the client for wet-ink signing,
 * with a copy to the PSTO / regional records office.
 */
export function sendPrintableToClient(options: {
  applicant: Applicant;
  user: AuthUser | null;
  moduleKey: string;
  documentTitle: string;
  attachment?: OutboxAttachment | null;
}): OutboxEmail {
  const { applicant, user, moduleKey, documentTitle, attachment } = options;
  const { to: dostTo, officeId } = dostRecipients(applicant);
  const view = notificationView(moduleKey);
  const clientEmail = applicant.emailAddress?.trim();

  const email = emailOutboxStore.send({
    kind: "printable",
    to: clientEmail ? [clientEmail] : dostTo,
    cc: clientEmail ? dostTo : [],
    subject: `[aiSETUP] Please sign — ${documentTitle} (${applicant.applicationId})`,
    body:
      `Good day ${applicant.applicantName},\n\n` +
      `Please find attached the ${documentTitle} for ${applicant.enterpriseName} ` +
      `(Application ID: ${applicant.applicationId}).\n\n` +
      `Kindly print, sign, and upload the signed copy back through aiSETUP.\n\n` +
      `Respectfully,\naiSETUP — DOST Region XII`,
    attachments: attachment
      ? [attachment]
      : [{ fileName: `${documentTitle} - ${applicant.applicationId}.pdf` }],
    sentBy: user?.email ?? applicant.emailAddress,
    applicantId: applicant.id,
    officeId,
    module: moduleKey,
  });

  notificationStore.add({
    audience: "applicant",
    applicantId: applicant.id,
    kind: "action",
    title: `Sign and return: ${documentTitle}`,
    message: `Your ${documentTitle} was emailed for signature. Print, sign, and upload the signed copy in LandBank & Withdrawal.`,
    view,
  });
  notificationStore.add({
    audience: "staff",
    applicantId: applicant.id,
    officeId,
    kind: "info",
    title: `${documentTitle} sent to client`,
    message: `${documentTitle} for ${applicant.enterpriseName} was emailed to ${clientEmail || "the client"} for signature.`,
    view,
  });

  return email;
}

/** Reads the signed documents map from an applicant record. */
export function getSignedDocuments(
  applicant: Applicant | null,
): Record<string, SignedDocumentRecord> {
  return (applicant?.moduleData?.signedDocuments ?? {}) as Record<
    string,
    SignedDocumentRecord
  >;
}

export function getSignedDocument(
  applicant: Applicant | null,
  moduleKey: string,
): SignedDocumentRecord | null {
  return getSignedDocuments(applicant)[moduleKey] ?? null;
}

/**
 * Persists a signed document upload under `moduleData.signedDocuments` and
 * emails a receipt / proof of delivery to the client and DOST admin/staff.
 */
export function saveSignedDocumentWithReceipts(options: {
  applicant: Applicant;
  user: AuthUser | null;
  moduleKey: string;
  documentTitle: string;
  document: SignedDocumentRecord;
}): void {
  const { applicant, user, moduleKey, documentTitle, document } = options;
  const view = notificationView(moduleKey);

  const current = applicantStore.getById(applicant.id) ?? applicant;
  const nextSignedDocuments = {
    ...getSignedDocuments(current),
    [moduleKey]: document,
  };
  applicantStore.update(applicant.id, {
    moduleData: {
      ...current.moduleData,
      signedDocuments: nextSignedDocuments,
    },
  });

  // Targeted module-row write so wet-ink uploads survive even if the legacy
  // whole-blob PUT is oversized (shared by LOI, TNA, proposal, RTEC, etc.).
  const updated = applicantStore.getById(applicant.id) ?? current;
  syncModuleKeyToBackendBestEffort(updated, "signedDocuments", nextSignedDocuments);

  const { to, officeId } = dostRecipients(applicant);
  const uploadedByStaff = !!user && authStore.isStaff(user.role);
  const uploaderLabel = uploadedByStaff
    ? `DOST staff (${user?.email})`
    : `${applicant.applicantName} (${applicant.emailAddress})`;
  const attachment: OutboxAttachment = {
    fileName: document.fileName,
    mimeType: document.mimeType,
    dataUrl: document.dataUrl,
  };

  // Receipt to the client — proof of delivery of the signed document.
  emailOutboxStore.send({
    kind: "signed-receipt",
    to: applicant.emailAddress ? [applicant.emailAddress] : [],
    cc: [],
    subject: `[aiSETUP] Receipt — Signed ${documentTitle} on file (${applicant.applicationId})`,
    body:
      `Good day ${applicant.applicantName},\n\n` +
      `This confirms that the signed ${documentTitle} for ${applicant.enterpriseName} ` +
      `(Application ID: ${applicant.applicationId}) was uploaded by ${uploaderLabel} ` +
      `on ${new Date(document.uploadedAt).toLocaleString("en-PH")} and is now on file.\n\n` +
      `Keep this email as your receipt / proof of delivery.\n\n` +
      `Respectfully,\naiSETUP — DOST Region XII`,
    attachments: [attachment],
    sentBy: user?.email ?? applicant.emailAddress,
    applicantId: applicant.id,
    officeId,
    module: moduleKey,
  });

  // Copy to DOST admin/staff.
  emailOutboxStore.send({
    kind: "signed-receipt",
    to,
    cc: [],
    subject: `[aiSETUP] Signed ${documentTitle} uploaded — ${applicant.enterpriseName} (${applicant.applicationId})`,
    body:
      `Good day,\n\n` +
      `The signed ${documentTitle} of ${applicant.enterpriseName} ` +
      `(Application ID: ${applicant.applicationId}) was uploaded by ${uploaderLabel}. ` +
      `The document is attached for your records.\n\n` +
      `Respectfully,\naiSETUP — DOST Region XII`,
    attachments: [attachment],
    sentBy: user?.email ?? applicant.emailAddress,
    applicantId: applicant.id,
    officeId,
    module: moduleKey,
  });

  notificationStore.add({
    audience: "staff",
    applicantId: applicant.id,
    officeId,
    kind: "info",
    title: `Signed ${documentTitle} on file`,
    message: `${applicant.enterpriseName} — signed ${documentTitle} uploaded by ${uploaderLabel}.`,
    view,
  });
  notificationStore.add({
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: `Signed ${documentTitle} recorded`,
    message: `Your signed ${documentTitle} is on file. A receipt was emailed to ${applicant.emailAddress || "your email"} and to DOST staff.`,
    view,
  });
}

/** Removes a stored signed document for a module. */
export function removeSignedDocument(
  applicant: Applicant,
  moduleKey: string,
): void {
  const current = applicantStore.getById(applicant.id) ?? applicant;
  const docs = { ...getSignedDocuments(current) };
  delete docs[moduleKey];
  applicantStore.update(applicant.id, {
    moduleData: {
      ...current.moduleData,
      signedDocuments: docs,
    },
  });
  const updated = applicantStore.getById(applicant.id) ?? current;
  syncModuleKeyToBackendBestEffort(updated, "signedDocuments", docs);
}
