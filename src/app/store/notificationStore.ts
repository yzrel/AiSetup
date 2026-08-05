/**
 * Author: Yzrel Jade B. Eborde
 */

import { api } from "../api/client";
import type { ApiNotification } from "../api/types";
import {
  AdminView,
  AuthUser,
  authStore,
  normalizeAdminView,
} from "./authStore";
import { applicantStore } from "./applicantStore";
import {
  staffCoversProvince,
  resolveApplicantProvince,
} from "../utils/provincialOffice";
import { getAuthToken } from "../api/authToken";

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

export type NotificationInput = Omit<
  AppNotification,
  "id" | "read" | "timestamp"
> & {
  id?: string;
  read?: boolean;
  timestamp?: string;
};

let notifications: AppNotification[] = [];
let listeners: (() => void)[] = [];
let hydrateInFlight: Promise<void> | null = null;

function notify() {
  listeners.forEach((l) => l());
}

function fromApi(n: ApiNotification): AppNotification {
  return {
    id: n.id,
    audience: n.audience,
    applicantId: n.applicantId,
    officeId: n.officeId,
    kind: n.kind,
    title: n.title,
    message: n.message,
    read: !!n.read,
    urgent: n.urgent,
    timestamp: n.timestamp,
    view: normalizeAdminView(n.view) ?? undefined,
  };
}

function toApiPayload(n: AppNotification) {
  return {
    id: n.id,
    audience: n.audience,
    applicantId: n.applicantId,
    officeId: n.officeId,
    kind: n.kind,
    title: n.title,
    message: n.message,
    read: n.read,
    urgent: n.urgent,
    timestamp: n.timestamp,
    view: n.view,
  };
}

function matchesUser(n: AppNotification, user: AuthUser): boolean {
  if (n.audience === "applicant") {
    if (authStore.isStaff(user.role)) return false;
    const app =
      applicantStore.getById(user.id) ??
      applicantStore.getByEmail(user.email);
    const applicantId = user.applicantId ?? app?.id;
    return !!applicantId && n.applicantId === applicantId;
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

function upsertLocal(entry: AppNotification) {
  notifications = [entry, ...notifications.filter((n) => n.id !== entry.id)];
}

function buildEntry(notification: NotificationInput): AppNotification {
  return {
    ...notification,
    id:
      notification.id ??
      `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    read: notification.read ?? false,
    timestamp: notification.timestamp ?? new Date().toISOString(),
  };
}

async function persistEntries(entries: AppNotification[]) {
  if (!getAuthToken() || entries.length === 0) return;
  try {
    const saved = await api.createNotifications(entries.map(toApiPayload));
    for (const row of saved) {
      upsertLocal(fromApi(row));
    }
    notify();
  } catch (err) {
    console.warn("Failed to persist notifications", err);
  }
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

  add: (notification: NotificationInput) => {
    const entry = buildEntry(notification);
    upsertLocal(entry);
    notify();
    void persistEntries([entry]);
    return entry;
  },

  /** Optimistic multi-add + single batch POST (staff + applicant pairs). */
  addMany: (items: NotificationInput[]) => {
    const entries = items.map(buildEntry);
    for (const entry of entries) {
      upsertLocal(entry);
    }
    notify();
    void persistEntries(entries);
    return entries;
  },

  markRead: (id: string) => {
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    notify();
    if (!getAuthToken()) return;
    void api.markNotificationRead(id).catch((err) => {
      console.warn("Failed to mark notification read", err);
    });
  },

  markAllRead: (user: AuthUser | null) => {
    const ids = new Set(notificationStore.getForUser(user).map((n) => n.id));
    notifications = notifications.map((n) =>
      ids.has(n.id) ? { ...n, read: true } : n,
    );
    notify();
    if (!getAuthToken()) return;
    void api.markAllNotificationsRead().catch((err) => {
      console.warn("Failed to mark all notifications read", err);
    });
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },

  hydrateFromBackend: async () => {
    if (!getAuthToken()) {
      notifications = [];
      notify();
      return;
    }
    if (hydrateInFlight) return hydrateInFlight;
    hydrateInFlight = (async () => {
      try {
        const rows = await api.listNotifications();
        notifications = rows.map(fromApi);
        notify();
      } catch (err) {
        console.warn("Failed to hydrate notifications", err);
      } finally {
        hydrateInFlight = null;
      }
    })();
    return hydrateInFlight;
  },

  /** @deprecated Use hydrateFromBackend — kept for any leftover call sites. */
  resyncFromApplicants: () => {
    void notificationStore.hydrateFromBackend();
  },
};
