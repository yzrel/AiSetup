// ── Auth Store ─────────────────────────────────────────────────────────────────

export type UserRole = "applicant" | "client" | "agent" | "admin";

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
  | "landbank-withdrawal"
  | "procurement-liquidation"
  | "refund-delinquent"
  | "account-management";

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
}

/** Views each role may access in the admin shell */
const VIEW_PERMISSIONS: Record<AdminView, UserRole[]> = {
  dashboard: ["admin", "agent", "client", "applicant"],
  prescreening: ["admin", "agent", "client", "applicant"],
  registration: ["admin", "agent", "client", "applicant"],
  "letter-of-intent": ["admin", "agent", "client", "applicant"],
  requirements: ["admin", "agent", "client", "applicant"],
  tna1: ["admin", "agent", "client", "applicant"],
  tna2: ["admin", "agent"],
  "project-proposal": ["admin", "agent"],
  "conduct-rtec": ["admin"],
  "approval-letter": ["admin"],
  "landbank-withdrawal": ["admin", "agent", "client", "applicant"],
  "procurement-liquidation": ["admin", "agent", "client", "applicant"],
  "refund-delinquent": ["admin"],
  "account-management": ["admin", "agent"],
};

const DASHBOARD_TAB_PERMISSIONS: Record<DashboardTab, UserRole[]> = {
  overview: ["admin", "agent", "client", "applicant"],
  analytics: ["admin", "agent"],
  alerts: ["admin", "agent"],
  registry: ["admin", "agent"],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  agent: "DOST Agent",
  client: "Client",
  applicant: "Applicant",
};

let currentUser: AuthUser | null = null;
let listeners: (() => void)[] = [];

const notify = () => listeners.forEach((l) => l());

export const authStore = {
  getUser: () => currentUser,

  isLoggedIn: () => currentUser !== null,

  login: (user: AuthUser) => {
    currentUser = user;
    notify();
  },

  logout: () => {
    currentUser = null;
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

  isStaff: (role: UserRole) => role === "admin" || role === "agent",

  isClientRole: (role: UserRole) => role === "client" || role === "applicant",

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
