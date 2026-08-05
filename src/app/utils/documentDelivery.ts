/**
 * Author: Yzrel Jade B. Eborde
 *
 * Document delivery helpers — sending module printables to DOST admin/staff
 * and distributing signed-document receipts (proof of delivery) by email.
 * Always records to the in-app outbox; when SMTP is configured, also delivers
 * via POST /mail/send (best-effort, non-blocking).
 */

import { api } from "../api/client";
import { AdminView, AuthUser, authStore } from "../store/authStore";
import { Applicant, applicantStore } from "../store/applicantStore";
import {
  emailOutboxStore,
  OutboxAttachment,
  OutboxEmail,
} from "../store/emailOutboxStore";
import { notificationStore } from "../store/notificationStore";
import { resolveApplicantOfficeId } from "./provincialOffice";
// TEMP: restore with PSTO / records email delivery:
// import { getOfficeContact, resolveApplicantOfficeId } from "./provincialOffice";
import type { SignedDocumentValue } from "../components/SignedDocumentUpload";
import { syncModuleKeyToBackendBestEffort } from "./applicantPersistence";
import { normalizeSignedDocumentsMap } from "./normalizeCriticalModuleData";

// TEMP: restore when PSTO / regional records should receive mail again.
// const REGIONAL_RECORDS_EMAIL = "records@region12.dost.gov.ph";

/** Cache /health smtpEnabled so document sends do not hit health every time. */
const SMTP_CACHE_MS = 60_000;
let smtpEnabledCache: { value: boolean; at: number } | null = null;

/** Stay under Gmail’s ~25 MB message limit for inline (non-fileId) payloads. */
const MAX_INLINE_BASE64_CHARS = Math.floor(15 * 1024 * 1024 * 1.37);

export interface SignedDocumentRecord extends SignedDocumentValue {
  signedDate?: string;
  notes?: string;
}

/**
 * Resolves the applicant's PSTO office id for notifications / audit.
 * PSTO + regional records emails are disabled for now — clients only receive mail.
 */
function dostRecipients(applicant: Applicant): {
  to: string[];
  officeId: string;
} {
  const officeId = resolveApplicantOfficeId(applicant);
  // TEMP: clients only — do not email PSTO / regional records.
  // const office = getOfficeContact(officeId);
  // const to = [office.email];
  // if (office.email !== REGIONAL_RECORDS_EMAIL) {
  //   to.push(REGIONAL_RECORDS_EMAIL);
  // }
  // return { to, officeId };
  return { to: [], officeId };
}

function notificationView(moduleKey: string): AdminView {
  if (moduleKey.startsWith("withdrawal-request")) return "landbank-withdrawal";
  return (moduleKey as AdminView) || "landbank-withdrawal";
}

async function isSmtpEnabled(): Promise<boolean> {
  const now = Date.now();
  if (smtpEnabledCache && now - smtpEnabledCache.at < SMTP_CACHE_MS) {
    return smtpEnabledCache.value;
  }
  try {
    const health = await api.health();
    smtpEnabledCache = { value: !!health.smtpEnabled, at: now };
    return smtpEnabledCache.value;
  } catch {
    smtpEnabledCache = { value: false, at: now };
    return false;
  }
}

function attachmentsForApi(attachments: OutboxAttachment[]) {
  return attachments.map((a) => {
    const payload: {
      fileName?: string;
      mimeType?: string;
      fileId?: string;
      contentBase64?: string;
    } = {
      fileName: a.fileName,
      mimeType: a.mimeType,
    };
    if (a.fileId) {
      payload.fileId = a.fileId;
    } else if (a.dataUrl) {
      const raw = a.dataUrl.includes(",")
        ? a.dataUrl.slice(a.dataUrl.indexOf(",") + 1)
        : a.dataUrl;
      if (raw.length <= MAX_INLINE_BASE64_CHARS) {
        payload.contentBase64 = a.dataUrl;
      }
    }
    return payload;
  });
}

/** Fire-and-forget SMTP delivery; outbox remains the audit trail either way. */
function deliverViaSmtpBestEffort(email: OutboxEmail): void {
  void (async () => {
    if (!email.to.length) return;
    if (!(await isSmtpEnabled())) return;
    try {
      await api.sendMail({
        to: email.to,
        cc: email.cc.length ? email.cc : undefined,
        subject: email.subject,
        body: email.body,
        applicantId: email.applicantId,
        attachments: attachmentsForApi(email.attachments),
      });
    } catch (err) {
      console.warn(
        "[documentDelivery] SMTP send failed; outbox entry kept",
        err,
      );
    }
  })();
}

/** True when the outbox attachment has payload bytes (fileId or data URL). */
function hasRealAttachment(
  attachment?: OutboxAttachment | null,
): attachment is OutboxAttachment {
  if (!attachment) return false;
  if (attachment.fileId?.trim()) return true;
  if (attachment.dataUrl?.trim()) return true;
  return false;
}

/**
 * Prefer an explicit attachment; otherwise use the signed copy already on file
 * for this module (fileId and/or dataUrl) so Send-to-DOST never drops it.
 */
function resolveSendAttachment(
  applicant: Applicant,
  moduleKey: string,
  explicit?: OutboxAttachment | null,
): OutboxAttachment | null {
  if (hasRealAttachment(explicit)) return explicit;
  const current = applicantStore.getById(applicant.id) ?? applicant;
  const signed = getSignedDocument(current, moduleKey);
  if (!signed?.fileName?.trim()) return null;
  const fromSigned: OutboxAttachment = {
    fileName: signed.fileName,
    mimeType: signed.mimeType || "application/pdf",
    dataUrl: signed.dataUrl,
    fileId: signed.fileId,
  };
  return hasRealAttachment(fromSigned) ? fromSigned : null;
}

function printableBody(options: {
  greeting: string;
  documentTitle: string;
  enterpriseName: string;
  applicationId: string;
  hasAttachment: boolean;
  closingNote: string;
}): string {
  const {
    greeting,
    documentTitle,
    enterpriseName,
    applicationId,
    hasAttachment,
    closingNote,
  } = options;
  const main = hasAttachment
    ? `Please find attached the ${documentTitle} of ${enterpriseName} ` +
      `(Application ID: ${applicationId}) submitted through the aiSETUP system.`
    : `This notice concerns the ${documentTitle} of ${enterpriseName} ` +
      `(Application ID: ${applicationId}) submitted through the aiSETUP system. ` +
      `No file is attached to this email — open the document in the aiSETUP portal if needed.`;
  return (
    `${greeting}\n\n` +
    `${main}\n\n` +
    `${closingNote}\n\n` +
    `Respectfully,\naiSETUP — DOST SOCCSKSARGEN`
  );
}

/**
 * Sends a module printable to the client only for now.
 * (Previously: PSTO + regional records To, client on Cc.)
 */
export function sendPrintableToDost(options: {
  applicant: Applicant;
  user: AuthUser | null;
  moduleKey: string;
  documentTitle: string;
  attachment?: OutboxAttachment | null;
}): OutboxEmail {
  const { applicant, user, moduleKey, documentTitle, attachment } = options;
  const { officeId } = dostRecipients(applicant);
  const view = notificationView(moduleKey);
  const resolved = resolveSendAttachment(applicant, moduleKey, attachment);
  const realAttachment = hasRealAttachment(resolved);
  const clientEmail = applicant.emailAddress?.trim();

  // TEMP: clients only.
  // const { to: dostTo, officeId } = dostRecipients(applicant);
  // const to = dostTo;
  // const cc = applicant.emailAddress ? [applicant.emailAddress] : [];
  const to = clientEmail ? [clientEmail] : [];
  const cc: string[] = [];

  const email = emailOutboxStore.send({
    kind: "printable",
    to,
    cc,
    subject: `AiSetup ${documentTitle} — ${applicant.enterpriseName} (${applicant.applicationId})`,
    body: printableBody({
      greeting: "Good day,",
      documentTitle,
      enterpriseName: applicant.enterpriseName,
      applicationId: applicant.applicationId,
      hasAttachment: realAttachment,
      closingNote:
        "This document was transmitted electronically for your review and records.",
    }),
    attachments: realAttachment ? [resolved] : [],
    sentBy: user?.email ?? applicant.emailAddress,
    applicantId: applicant.id,
    officeId,
    module: moduleKey,
  });
  deliverViaSmtpBestEffort(email);

  notificationStore.addMany([
    {
      audience: "staff",
      applicantId: applicant.id,
      officeId,
      kind: "action",
      title: `${documentTitle} received by email`,
      message: `${applicant.enterpriseName} sent the ${documentTitle} to DOST for review.`,
      view,
    },
    {
      audience: "applicant",
      applicantId: applicant.id,
      kind: "success",
      title: `${documentTitle} sent to DOST`,
      // TEMP: clients only — was: emailed to PSTO and regional records, copy to client.
      message: `Your ${documentTitle} was emailed to ${applicant.emailAddress || "your email"}.`,
      view,
    },
  ]);

  return email;
}

/**
 * Sends a generated printable to the client for wet-ink signing.
 * (Previously also Cc'd PSTO / regional records.)
 */
export function sendPrintableToClient(options: {
  applicant: Applicant;
  user: AuthUser | null;
  moduleKey: string;
  documentTitle: string;
  attachment?: OutboxAttachment | null;
}): OutboxEmail {
  const { applicant, user, moduleKey, documentTitle, attachment } = options;
  const { officeId } = dostRecipients(applicant);
  const view = notificationView(moduleKey);
  const clientEmail = applicant.emailAddress?.trim();
  const resolved = resolveSendAttachment(applicant, moduleKey, attachment);
  const realAttachment = hasRealAttachment(resolved);

  // TEMP: clients only — do not Cc PSTO / regional records.
  // const { to: dostTo, officeId } = dostRecipients(applicant);
  // to: clientEmail ? [clientEmail] : dostTo,
  // cc: clientEmail ? dostTo : [],
  const email = emailOutboxStore.send({
    kind: "printable",
    to: clientEmail ? [clientEmail] : [],
    cc: [],
    subject: `AiSetup Please sign — ${documentTitle} (${applicant.applicationId})`,
    body: printableBody({
      greeting: `Good day ${applicant.applicantName},`,
      documentTitle,
      enterpriseName: applicant.enterpriseName,
      applicationId: applicant.applicationId,
      hasAttachment: realAttachment,
      closingNote:
        "Kindly print, sign, and upload the signed copy back through aiSETUP.",
    }),
    attachments: realAttachment ? [resolved] : [],
    sentBy: user?.email ?? applicant.emailAddress,
    applicantId: applicant.id,
    officeId,
    module: moduleKey,
  });
  deliverViaSmtpBestEffort(email);

  notificationStore.addMany([
    {
      audience: "applicant",
      applicantId: applicant.id,
      kind: "action",
      title: `Sign and return: ${documentTitle}`,
      message: `Your ${documentTitle} was emailed for signature. Print, sign, and upload the signed copy in LandBank & Withdrawal.`,
      view,
    },
    {
      audience: "staff",
      applicantId: applicant.id,
      officeId,
      kind: "info",
      title: `${documentTitle} sent to client`,
      message: `${documentTitle} for ${applicant.enterpriseName} was emailed to ${clientEmail || "the client"} for signature.`,
      view,
    },
  ]);

  return email;
}

/** Reads the signed documents map from an applicant record. */
export function getSignedDocuments(
  applicant: Applicant | null,
): Record<string, SignedDocumentRecord> {
  return normalizeSignedDocumentsMap(
    applicant?.moduleData?.signedDocuments,
  ) as unknown as Record<string, SignedDocumentRecord>;
}

/**
 * Administration → Sent Emails unlocks after a client has uploaded a signed
 * document (outbox signed-receipt visible to the user, or any applicant with
 * a signedDocuments entry).
 */
export function isSentEmailsNavUnlocked(user: AuthUser | null): boolean {
  if (!user) return false;
  if (
    emailOutboxStore
      .getForUser(user)
      .some((e) => e.kind === "signed-receipt")
  ) {
    return true;
  }
  return applicantStore
    .getAll()
    .some((a) => Object.keys(getSignedDocuments(a)).length > 0);
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

  const { officeId } = dostRecipients(applicant);
  // TEMP: clients only — was: const { to, officeId } = dostRecipients(applicant);
  const uploadedByStaff = !!user && authStore.isStaff(user.role);
  const uploaderLabel = uploadedByStaff
    ? `DOST staff (${user?.email})`
    : `${applicant.applicantName} (${applicant.emailAddress})`;
  const attachment: OutboxAttachment = {
    fileName: document.fileName,
    mimeType: document.mimeType,
    dataUrl: document.dataUrl,
    fileId: document.fileId,
  };
  const realAttachment = hasRealAttachment(attachment);

  // Receipt to the client — proof of delivery of the signed document.
  const clientReceipt = emailOutboxStore.send({
    kind: "signed-receipt",
    to: applicant.emailAddress ? [applicant.emailAddress] : [],
    cc: [],
    subject: `AiSetup Receipt — Signed ${documentTitle} on file (${applicant.applicationId})`,
    body:
      `Good day ${applicant.applicantName},\n\n` +
      `This confirms that the signed ${documentTitle} for ${applicant.enterpriseName} ` +
      `(Application ID: ${applicant.applicationId}) was uploaded by ${uploaderLabel} ` +
      `on ${new Date(document.uploadedAt).toLocaleString("en-PH")} and is now on file.\n\n` +
      `Keep this email as your receipt / proof of delivery.\n\n` +
      `Respectfully,\naiSETUP — DOST SOCCSKSARGEN`,
    attachments: realAttachment ? [attachment] : [],
    sentBy: user?.email ?? applicant.emailAddress,
    applicantId: applicant.id,
    officeId,
    module: moduleKey,
  });
  deliverViaSmtpBestEffort(clientReceipt);

  // TEMP: clients only — do not email signed-copy receipts to PSTO / records.
  // const staffAttachNote = realAttachment
  //   ? " The document is attached for your records."
  //   : " Open the signed file in the aiSETUP portal for your records.";
  // const staffReceipt = emailOutboxStore.send({
  //   kind: "signed-receipt",
  //   to,
  //   cc: [],
  //   subject: `AiSetup Signed ${documentTitle} uploaded — ${applicant.enterpriseName} (${applicant.applicationId})`,
  //   body:
  //     `Good day,\n\n` +
  //     `The signed ${documentTitle} of ${applicant.enterpriseName} ` +
  //     `(Application ID: ${applicant.applicationId}) was uploaded by ${uploaderLabel}.` +
  //     `${staffAttachNote}\n\n` +
  //     `Respectfully,\naiSETUP — DOST SOCCSKSARGEN`,
  //   attachments: realAttachment ? [attachment] : [],
  //   sentBy: user?.email ?? applicant.emailAddress,
  //   applicantId: applicant.id,
  //   officeId,
  //   module: moduleKey,
  // });
  // deliverViaSmtpBestEffort(staffReceipt);

  notificationStore.addMany([
    {
      audience: "staff",
      applicantId: applicant.id,
      officeId,
      kind: "info",
      title: `Signed ${documentTitle} on file`,
      message: `${applicant.enterpriseName} — signed ${documentTitle} uploaded by ${uploaderLabel}.`,
      view,
    },
    {
      audience: "applicant",
      applicantId: applicant.id,
      kind: "success",
      title: `Signed ${documentTitle} recorded`,
      message: `Your signed ${documentTitle} is on file. A receipt was emailed to ${applicant.emailAddress || "your email"}.`,
      view,
    },
  ]);
}

/**
 * Emails signed MOA receipts to the client and DOST PSTO / regional records
 * via the in-app outbox. Metadata stays under approvalLetter.signedMoa —
 * this helper only sends mail (does not rewrite signedDocuments).
 */
export function sendSignedMoaReceiptsToDost(options: {
  applicant: Applicant;
  user: AuthUser | null;
  document: SignedDocumentRecord;
}): void {
  const { applicant, user, document } = options;
  const documentTitle = "Memorandum of Agreement (MOA)";
  const moduleKey = "signedMoa";
  const { officeId } = dostRecipients(applicant);
  // TEMP: clients only — was: const { to, officeId } = dostRecipients(applicant);
  const uploadedByStaff = !!user && authStore.isStaff(user.role);
  const uploaderLabel = uploadedByStaff
    ? `DOST staff (${user?.email})`
    : `${applicant.applicantName} (${applicant.emailAddress})`;
  const attachment: OutboxAttachment = {
    fileName: document.fileName || `${documentTitle}.pdf`,
    mimeType: document.mimeType || "application/pdf",
    dataUrl: document.dataUrl,
    fileId: document.fileId,
  };
  const realAttachment = hasRealAttachment(attachment);

  const clientMoaReceipt = emailOutboxStore.send({
    kind: "signed-receipt",
    to: applicant.emailAddress ? [applicant.emailAddress] : [],
    cc: [],
    subject: `AiSetup Receipt — Signed ${documentTitle} on file (${applicant.applicationId})`,
    body:
      `Good day ${applicant.applicantName},\n\n` +
      `This confirms that the signed ${documentTitle} for ${applicant.enterpriseName} ` +
      `(Application ID: ${applicant.applicationId}) was uploaded by ${uploaderLabel} ` +
      `on ${new Date(document.uploadedAt).toLocaleString("en-PH")} and is now on file.\n\n` +
      (document.signedDate
        ? `MOA signed date: ${document.signedDate}.\n`
        : "") +
      (document.notes ? `Notes: ${document.notes}\n` : "") +
      `\nKeep this email as your receipt / proof of delivery.\n\n` +
      `Respectfully,\naiSETUP — DOST SOCCSKSARGEN`,
    attachments: realAttachment ? [attachment] : [],
    sentBy: user?.email ?? applicant.emailAddress,
    applicantId: applicant.id,
    officeId,
    module: moduleKey,
  });
  deliverViaSmtpBestEffort(clientMoaReceipt);

  // TEMP: clients only — do not email MOA receipts to PSTO / records.
  // const staffMoaAttachNote = realAttachment
  //   ? " The document is attached for your records."
  //   : " Open the signed file in the aiSETUP portal for your records.";
  // const staffMoaReceipt = emailOutboxStore.send({
  //   kind: "signed-receipt",
  //   to,
  //   cc: [],
  //   subject: `AiSetup Signed ${documentTitle} uploaded — ${applicant.enterpriseName} (${applicant.applicationId})`,
  //   body:
  //     `Good day,\n\n` +
  //     `The signed ${documentTitle} of ${applicant.enterpriseName} ` +
  //     `(Application ID: ${applicant.applicationId}) was uploaded by ${uploaderLabel}.` +
  //     `${staffMoaAttachNote}\n\n` +
  //     (document.signedDate
  //       ? `MOA signed date: ${document.signedDate}.\n`
  //       : "") +
  //     (document.notes ? `Notes: ${document.notes}\n` : "") +
  //     `\nRespectfully,\naiSETUP — DOST SOCCSKSARGEN`,
  //   attachments: realAttachment ? [attachment] : [],
  //   sentBy: user?.email ?? applicant.emailAddress,
  //   applicantId: applicant.id,
  //   officeId,
  //   module: moduleKey,
  // });
  // deliverViaSmtpBestEffort(staffMoaReceipt);
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

/**
 * Updates signed-document metadata (e.g. signedDate) without re-sending
 * receipt emails. No-op unless a file is already on file for the module key.
 */
export function updateSignedDocumentMeta(
  applicant: Applicant,
  moduleKey: string,
  patch: Partial<Pick<SignedDocumentRecord, "signedDate" | "notes">>,
): SignedDocumentRecord | null {
  const current = applicantStore.getById(applicant.id) ?? applicant;
  const existing = getSignedDocument(current, moduleKey);
  if (!existing?.fileName?.trim()) return null;

  const next: SignedDocumentRecord = { ...existing, ...patch };
  const nextSignedDocuments = {
    ...getSignedDocuments(current),
    [moduleKey]: next,
  };
  applicantStore.update(applicant.id, {
    moduleData: {
      ...current.moduleData,
      signedDocuments: nextSignedDocuments,
    },
  });
  const updated = applicantStore.getById(applicant.id) ?? current;
  syncModuleKeyToBackendBestEffort(updated, "signedDocuments", nextSignedDocuments);
  return next;
}
