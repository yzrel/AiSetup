/**
 * Author: Yzrel Jade B. Eborde
 */

import { AdminView, AuthUser, authStore } from "./authStore";
import { Applicant, applicantStore } from "./applicantStore";
import {
  resolveApplicantOfficeId,
  staffCoversProvince,
  resolveApplicantProvince,
} from "../utils/provincialOffice";
import { needsStaffAssessment } from "../utils/clientAssessment";

export type NotificationKind = "info" | "success" | "warning" | "action";

export interface AppNotification {
  id: string;
  audience: "applicant" | "staff";
  /** Applicant record this notification relates to */
  applicantId?: string;
  /** Provincial office scope for staff notifications */
  officeId?: string;
  kind: NotificationKind;
  title: string;
  message: string;
  read: boolean;
  urgent?: boolean;
  timestamp: string;
  /** Optional in-app navigation target */
  view?: AdminView;
}

let notifications: AppNotification[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

function seedFromApplicants() {
  const seeded: AppNotification[] = [];
  const now = Date.now();

  for (const app of applicantStore.getAll()) {
    const officeId = resolveApplicantOfficeId(app);

    if (app.moduleData?.documentsSubmitted && !app.moduleData?.staffDecision) {
      seeded.push({
        id: `seed-req-${app.id}`,
        audience: "staff",
        applicantId: app.id,
        officeId,
        kind: "action",
        title: "Requirements awaiting review",
        message: `${app.enterpriseName} submitted documentary requirements for verification.`,
        read: false,
        urgent: true,
        timestamp: new Date(now - 3600000).toISOString(),
        view: "requirements",
      });
      seeded.push({
        id: `seed-req-applicant-${app.id}`,
        audience: "applicant",
        applicantId: app.id,
        kind: "info",
        title: "Requirements submitted",
        message: "Your documents are with your provincial DOST office for review.",
        read: false,
        timestamp: new Date(now - 3500000).toISOString(),
        view: "requirements",
      });
    }

    if (app.moduleData?.staffDecision === "needs-revision") {
      seeded.push({
        id: `seed-revision-${app.id}`,
        audience: "applicant",
        applicantId: app.id,
        kind: "warning",
        title: "Revisions requested",
        message: "DOST staff flagged documents that need correction. Please resubmit.",
        read: false,
        urgent: true,
        timestamp: new Date(now - 7200000).toISOString(),
        view: "requirements",
      });
    }

    if (app.moduleData?.tna1?.submitted && !app.moduleData?.tna1?.staffReviewed) {
      seeded.push({
        id: `seed-tna1-${app.id}`,
        audience: "staff",
        applicantId: app.id,
        officeId,
        kind: "action",
        title: "TNA Form 01 submitted",
        message: `${app.enterpriseName} submitted TNA Form 01 for staff review.`,
        read: false,
        timestamp: new Date(now - 5400000).toISOString(),
        view: "tna1",
      });
    }

    const tna2 = app.moduleData?.tna2Document;
    if (tna2?.published) {
      seeded.push({
        id: `seed-tna2-published-${app.id}`,
        audience: "applicant",
        applicantId: app.id,
        kind: "success",
        title: "TNA Form 02 published",
        message: "Your technical report is now available. Review and continue your application.",
        read: app.currentModule !== "tna2",
        timestamp: tna2.publishedAt ?? new Date(now - 86400000).toISOString(),
        view: "tna2",
      });
    } else if (
      app.currentModule === "tna2" &&
      needsStaffAssessment(app)
    ) {
      seeded.push({
        id: `seed-tna2-staff-${app.id}`,
        audience: "staff",
        applicantId: app.id,
        officeId,
        kind: "action",
        title: "TNA Form 02 pending",
        message: `Generate and publish TNA Form 02 for ${app.enterpriseName}.`,
        read: false,
        timestamp: new Date(now - 1800000).toISOString(),
        view: "tna2",
      });
    }

    if (
      app.currentModule === "conduct-rtec" ||
      app.currentModule === "approval-letter"
    ) {
      seeded.push({
        id: `seed-rtec-${app.id}`,
        audience: "applicant",
        applicantId: app.id,
        kind: "info",
        title: "Under DOST evaluation",
        message: "Your project proposal is with DOST for RTEC evaluation and approval.",
        read: false,
        timestamp: new Date(now - 43200000).toISOString(),
        view: "dashboard",
      });
    }
  }

  notifications = seeded;
}

seedFromApplicants();

function matchesUser(n: AppNotification, user: AuthUser): boolean {
  if (n.audience === "applicant") {
    if (authStore.isStaff(user.role)) return false;
    const app =
      applicantStore.getById(user.id) ??
      applicantStore.getByEmail(user.email);
    return !!app && n.applicantId === app.id;
  }

  if (!authStore.isStaff(user.role)) return false;

  if (user.role === "admin" || user.officeId === "regional") return true;

  if (n.officeId && user.officeId) {
    return n.officeId === user.officeId;
  }

  if (n.applicantId) {
    const app = applicantStore.getById(n.applicantId);
    if (!app) return false;
    return staffCoversProvince(user, resolveApplicantProvince(app));
  }

  return false;
}

export const notificationStore = {
  getAll: () => notifications,

  getForUser: (user: AuthUser | null): AppNotification[] => {
    if (!user) return [];
    return notifications
      .filter((n) => matchesUser(n, user))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  },

  getUnreadCount: (user: AuthUser | null): number =>
    notificationStore.getForUser(user).filter((n) => !n.read).length,

  add: (notification: Omit<AppNotification, "id" | "read" | "timestamp"> & {
    id?: string;
    read?: boolean;
    timestamp?: string;
  }) => {
    const entry: AppNotification = {
      ...notification,
      id: notification.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: notification.read ?? false,
      timestamp: notification.timestamp ?? new Date().toISOString(),
    };
    notifications = [entry, ...notifications.filter((n) => n.id !== entry.id)];
    notify();
    return entry;
  },

  markRead: (id: string) => {
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    notify();
  },

  markAllRead: (user: AuthUser | null) => {
    const ids = new Set(notificationStore.getForUser(user).map((n) => n.id));
    notifications = notifications.map((n) =>
      ids.has(n.id) ? { ...n, read: true } : n,
    );
    notify();
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },

  resyncFromApplicants: () => {
    seedFromApplicants();
    notify();
  },
};
