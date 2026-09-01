/**
 * Author: Yzrel Jade B. Eborde
 */

// ── Auth Store ─────────────────────────────────────────────────────────────────

import { staffContextStore } from "./staffContextStore";
import { clearAuthUiState, clearCurrentView } from "./navigationStore";
import { clearAuthToken } from "../api/authToken";

export type UserRole =
  | "applicant"
  | "client"
  | "agent"
  | "provincial-director"
  | "regional-director"
  | "rtec-staff"
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
  | "client-files"
  | "account-management"
  | "landbank-branches"
  | "my-account"
  | "sent-emails";

/** Runtime allow-list for persisted / API view keys (avoids shell crashes). */
export const KNOWN_ADMIN_VIEWS: readonly AdminView[] = [
  "dashboard",
  "prescreening",
  "registration",
  "letter-of-intent",
  "requirements",
  "tna1",
  "tna2",
  "project-proposal",
  "conduct-rtec",
  "approval-letter",
  "project-information-sheet",
  "landbank-withdrawal",
  "procurement-liquidation",
  "refund-delinquent",
  "project-closeout",
  "clients",
  "client-files",
  "account-management",
  "landbank-branches",
  "my-account",
  "sent-emails",
] as const;

export function isAdminView(value: unknown): value is AdminView {
  return (
    typeof value === "string" &&
    (KNOWN_ADMIN_VIEWS as readonly string[]).includes(value)
  );
}

/** Maps legacy aliases; returns null when unknown. */
export function normalizeAdminView(value: unknown): AdminView | null {
  if (!isAdminView(value)) return null;
  if (value === "project-information-sheet") return "landbank-withdrawal";
  return value;
}

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
  /** Backend applicant case id (may differ from auth user id). */
  applicantId?: string;
  avatarUrl?: string;
  verified: boolean;
  /** Which portal the user signed in through */
  portal?: LoginPortal;
  /** Provincial office scope for staff */
  officeId?: string;
  assignedProvinces?: string[];
}

/** Staff roles with admin-like regional access (all modules + account mgmt). */
const STAFF_ADMIN_LIKE: UserRole[] = ["admin", "regional-director"];
const STAFF_ALL: UserRole[] = [
  "admin",
  "regional-director",
  "agent",
  "provincial-director",
  "rtec-staff",
];
const STAFF_AND_CLIENT: UserRole[] = [
  ...STAFF_ALL,
  "client",
  "applicant",
];
/** PSTO / RPMO case workers — not the RTEC committee. */
const STAFF_CASEWORK: UserRole[] = [
  "admin",
  "regional-director",
  "agent",
  "provincial-director",
];
const STAFF_CASEWORK_AND_CLIENT: UserRole[] = [
  ...STAFF_CASEWORK,
  "client",
  "applicant",
];

/** Views each role may access in the admin shell */
const VIEW_PERMISSIONS: Record<AdminView, UserRole[]> = {
  dashboard: STAFF_AND_CLIENT,
  prescreening: STAFF_CASEWORK_AND_CLIENT,
  registration: STAFF_CASEWORK_AND_CLIENT,
  "letter-of-intent": STAFF_CASEWORK_AND_CLIENT,
  requirements: STAFF_AND_CLIENT,
  tna1: STAFF_AND_CLIENT,
  tna2: STAFF_AND_CLIENT,
  "project-proposal": STAFF_AND_CLIENT,
  "conduct-rtec": STAFF_ALL,
  "approval-letter": STAFF_CASEWORK_AND_CLIENT,
  "project-information-sheet": STAFF_CASEWORK_AND_CLIENT,
  "landbank-withdrawal": STAFF_CASEWORK_AND_CLIENT,
  "procurement-liquidation": STAFF_CASEWORK_AND_CLIENT,
  "refund-delinquent": STAFF_CASEWORK_AND_CLIENT,
  "project-closeout": STAFF_CASEWORK_AND_CLIENT,
  clients: STAFF_ALL,
  "client-files": STAFF_ALL,
  "account-management": STAFF_CASEWORK,
  "landbank-branches": STAFF_CASEWORK,
  "my-account": ["client", "applicant"],
  "sent-emails": STAFF_CASEWORK,
};

const DASHBOARD_TAB_PERMISSIONS: Record<DashboardTab, UserRole[]> = {
  overview: STAFF_AND_CLIENT,
  analytics: STAFF_CASEWORK,
  alerts: STAFF_ALL,
  registry: STAFF_ALL,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  agent: "DOST Agent",
  "provincial-director": "Provincial Director",
  "regional-director": "Regional Director",
  "rtec-staff": "RTEC Staff",
  client: "Client",
  applicant: "Applicant",
};

export function isRtecStaff(role: UserRole | null | undefined): boolean {
  return role === "rtec-staff";
}

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
    clearAuthToken();
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

  /** Client community portal — disabled; all applicants use AiSETUP application workflow */
  usesClientPortal: (_user: AuthUser) => {
    // if (user.portal === "client") return true;
    // if (user.portal === "admin") return false;
    // return user.role === "client" || user.role === "applicant";
    return false;
  },

  isStaff: (role: UserRole) => STAFF_ALL.includes(role),

  /** Review and Technical Evaluation Committee — Form 002 only (read other modules). */
  isRtecStaff: (role: UserRole) => role === "rtec-staff",

  /** Admin or Regional Director — region-wide access (not office-scoped). */
  isRegionalStaff: (role: UserRole) => STAFF_ADMIN_LIKE.includes(role),

  isClientRole: (role: UserRole) => role === "client" || role === "applicant",

  // Demo mode may skip workflow validators on the FE when the server allows it.
  // Staff-only views stay role-gated (RTEC and staff dashboards must never open to clients).
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
    if (role === "rtec-staff") return "conduct-rtec";
    const allowed = authStore.getAllowedViews(role);
    return allowed[0] ?? "dashboard";
  },

  getAllowedDashboardTabs: (role: UserRole): DashboardTab[] =>
    (Object.keys(DASHBOARD_TAB_PERMISSIONS) as DashboardTab[]).filter(
      (tab) => DASHBOARD_TAB_PERMISSIONS[tab].includes(role),
    ),
};
