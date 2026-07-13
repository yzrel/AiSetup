/**
 * Author: Yzrel Jade B. Eborde
 *
 * Simulated email outbox. The system is not wired to a live SMTP server yet;
 * every "sent" email is recorded here so clients and DOST staff can see the
 * delivery trail (printables sent to DOST, signed-document receipts, etc.).
 */

import { AuthUser, authStore } from "./authStore";
import { applicantStore } from "./applicantStore";

export type OutboxEmailKind = "printable" | "signed-receipt";

export interface OutboxAttachment {
  fileName: string;
  mimeType?: string;
  /** Base64 data URL — kept in memory only (not persisted to localStorage) */
  dataUrl?: string;
}

export interface OutboxEmail {
  id: string;
  kind: OutboxEmailKind;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachments: OutboxAttachment[];
  sentAt: string;
  sentBy: string;
  applicantId?: string;
  /** Provincial office scope for staff visibility */
  officeId?: string;
  /** Module the email originated from (view key) */
  module?: string;
}

const STORAGE_KEY = "aisetup.email.outbox";
const MAX_STORED = 200;

let emails: OutboxEmail[] = load();
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

function load(): OutboxEmail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    // Attachments can hold multi-MB base64 payloads; persist metadata only.
    const slim = emails.slice(0, MAX_STORED).map((e) => ({
      ...e,
      attachments: e.attachments.map(({ fileName, mimeType }) => ({
        fileName,
        mimeType,
      })),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch {
    /* storage unavailable or full */
  }
}

function matchesUser(email: OutboxEmail, user: AuthUser): boolean {
  if (authStore.isStaff(user.role)) {
    if (user.role === "admin" || user.officeId === "regional") return true;
    if (email.officeId && user.officeId) {
      return email.officeId === user.officeId;
    }
    return true;
  }
  // Clients see emails related to their own applicant record or addressed
  // to their email address.
  const app =
    applicantStore.getById(user.id) ?? applicantStore.getByEmail(user.email);
  if (app && email.applicantId === app.id) return true;
  const address = user.email.toLowerCase();
  return (
    email.to.some((t) => t.toLowerCase() === address) ||
    email.cc.some((c) => c.toLowerCase() === address)
  );
}

export const emailOutboxStore = {
  getAll: (): OutboxEmail[] => emails,

  getForUser: (user: AuthUser | null): OutboxEmail[] => {
    if (!user) return [];
    return emails
      .filter((e) => matchesUser(e, user))
      .sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      );
  },

  send: (
    email: Omit<OutboxEmail, "id" | "sentAt"> & {
      id?: string;
      sentAt?: string;
    },
  ): OutboxEmail => {
    const entry: OutboxEmail = {
      ...email,
      id:
        email.id ??
        `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sentAt: email.sentAt ?? new Date().toISOString(),
    };
    emails = [entry, ...emails.filter((e) => e.id !== entry.id)];
    persist();
    notify();
    return entry;
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
};
