/**
 * Author: Yzrel Jade B. Eborde
 */

// ── Auth Store ─────────────────────────────────────────────────────────────────

import { staffContextStore } from "./staffContextStore";
import { clearAuthUiState, clearCurrentView } from "./navigationStore";

export type UserRole =
  | "applicant"
  | "client"
  | "agent"
  | "provincial-director"
  | "admin";

export type LoginPortal = "client" | "admin";

export type AdminView =
  | "dashboard"
  | "prescreening"
  | "registration"
  | "letter-of-intent"
  | "requirements"
  | "tna1"
  | "tna2"
  | "project-proposal"
  | "conduct-rtec"
  | "approval-letter"
  | "project-information-sheet"
  | "landbank-withdrawal"
  | "procurement-liquidation"
  | "refund-delinquent"
  | "project-closeout"
  | "clients"
  | "account-management"
  | "my-account"
  | "sent-emails";

export type DashboardTab = "overview" | "analytics" | "alerts" | "registry";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  role: UserRole;
  enterpriseName: string;
  applicationId?: string;
  avatarUrl?: string;
  verified: boolean;
  /** Which portal the user signed in through */
  portal?: LoginPortal;
  /** Provincial office scope for staff */
  officeId?: string;
  assignedProvinces?: string[];
}

/** Views each role may access in the admin shell */
const VIEW_PERMISSIONS: Record<AdminView, UserRole[]> = {
  dashboard: ["admin", "agent", "provincial-director", "client", "applicant"],
  prescreening: ["admin", "agent", "provincial-director", "client", "applicant"],
  registration: ["admin", "agent", "provincial-director", "client", "applicant"],
  "letter-of-intent": ["admin", "agent", "provincial-director", "client", "applicant"],
  requirements: ["admin", "agent", "provincial-director", "client", "applicant"],
  tna1: ["admin", "agent", "provincial-director", "client", "applicant"],
  tna2: ["admin", "agent", "provincial-director", "client", "applicant"],
  "project-proposal": ["admin", "agent", "provincial-director", "client", "applicant"],
  "conduct-rtec": ["admin", "agent", "provincial-director"],
  "approval-letter": ["admin", "agent", "provincial-director", "client", "applicant"],
  "project-information-sheet": ["admin", "agent", "provincial-director", "client", "applicant"],
  "landbank-withdrawal": ["admin", "agent", "provincial-director", "client", "applicant"],
  "procurement-liquidation": ["admin", "agent", "provincial-director", "client", "applicant"],
  "refund-delinquent": ["admin", "agent", "provincial-director", "client", "applicant"],
  "project-closeout": ["admin", "agent", "provincial-director", "client", "applicant"],
  clients: ["admin", "agent", "provincial-director"],
  "account-management": ["admin", "agent", "provincial-director"],
  "my-account": ["client", "applicant"],
  "sent-emails": ["admin", "agent", "provincial-director", "client", "applicant"],
};

const DASHBOARD_TAB_PERMISSIONS: Record<DashboardTab, UserRole[]> = {
  overview: ["admin", "agent", "provincial-director", "client", "applicant"],
  analytics: ["admin", "agent", "provincial-director"],
  alerts: ["admin", "agent", "provincial-director"],
  registry: ["admin", "agent", "provincial-director"],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  agent: "DOST Agent",
  "provincial-director": "Provincial Director",
  client: "Client",
  applicant: "Applicant",
};

let currentUser: AuthUser | null = loadStoredUser();
let listeners: (() => void)[] = [];

const AUTH_STORAGE_KEY = "aisetup.auth.user";

function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed?.role || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadStoredUser(): AuthUser | null {
  try {
    return (
      parseStoredUser(localStorage.getItem(AUTH_STORAGE_KEY)) ??
      parseStoredUser(sessionStorage.getItem(AUTH_STORAGE_KEY))
    );
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null): void {
  try {
    if (user) {
      const json = JSON.stringify(user);
      localStorage.setItem(AUTH_STORAGE_KEY, json);
      sessionStorage.setItem(AUTH_STORAGE_KEY, json);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable */
  }
}

const notify = () => listeners.forEach((l) => l());

export const authStore = {
  getUser: () => currentUser,

  isLoggedIn: () => currentUser !== null,

  /** Re-read persisted session (e.g. after full page reload). */
  hydrate: () => {
    currentUser = loadStoredUser();
  },

  login: (user: AuthUser) => {
    currentUser = user;
    persistUser(user);
    notify();
  },

  logout: () => {
    currentUser = null;
    persistUser(null);
    clearCurrentView();
    clearAuthUiState();
    staffContextStore.clearSelection();
    notify();
  },

  updateUser: (patch: Partial<AuthUser>) => {
    if (!currentUser) return;
    currentUser = { ...currentUser, ...patch };
    persistUser(currentUser);
    notify();
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },

  /** Client community portal — disabled; all applicants use aiSETUP application workflow */
  usesClientPortal: (_user: AuthUser) => {
    // if (user.portal === "client") return true;
    // if (user.portal === "admin") return false;
    // return user.role === "client" || user.role === "applicant";
    return false;
  },

  isStaff: (role: UserRole) =>
    role === "admin" || role === "agent" || role === "provincial-director",

  isClientRole: (role: UserRole) => role === "client" || role === "applicant",

  // Demo mode may skip workflow validators, but staff-only views stay
  // role-gated (RTEC and staff dashboards must never open to clients).
  canAccessView: (role: UserRole, view: AdminView) =>
    VIEW_PERMISSIONS[view]?.includes(role) ?? false,

  canAccessDashboardTab: (role: UserRole, tab: DashboardTab) =>
    DASHBOARD_TAB_PERMISSIONS[tab]?.includes(role) ?? false,

  getAllowedViews: (role: UserRole): AdminView[] =>
    (Object.keys(VIEW_PERMISSIONS) as AdminView[]).filter((view) =>
      VIEW_PERMISSIONS[view].includes(role),
    ),

  getDefaultView: (role: UserRole): AdminView => {
    if (role === "applicant" || role === "client") return "prescreening";
    const allowed = authStore.getAllowedViews(role);
    return allowed[0] ?? "dashboard";
  },

  getAllowedDashboardTabs: (role: UserRole): DashboardTab[] =>
    (Object.keys(DASHBOARD_TAB_PERMISSIONS) as DashboardTab[]).filter(
      (tab) => DASHBOARD_TAB_PERMISSIONS[tab].includes(role),
    ),
};
