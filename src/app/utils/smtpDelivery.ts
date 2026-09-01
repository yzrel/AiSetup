/**
 * Author: Yzrel Jade B. Eborde
 *
 * Shared SMTP delivery for document mail and applicant status notices.
 * Always records to the outbox first; this module only attempts live send
 * when /health reports smtpEnabled.
 */

import { api } from "../api/client";
import type { OutboxAttachment, OutboxEmail } from "../store/emailOutboxStore";

const SMTP_CACHE_MS = 60_000;
let smtpEnabledCache: { value: boolean; at: number } | null = null;

/** Stay under Gmail’s ~25 MB message limit for inline (non-fileId) payloads. */
const MAX_INLINE_BASE64_CHARS = Math.floor(15 * 1024 * 1024 * 1.37);

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
export function deliverViaSmtpBestEffort(email: OutboxEmail): void {
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
      console.warn("[mail] SMTP send failed; outbox entry kept", err);
    }
  })();
}
