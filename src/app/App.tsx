/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { PrescreeningForm } from "./components/PrescreeningForm";
import { EnterpriseRegistration } from "./components/EnterpriseRegistration";
import { LetterOfIntent } from "./components/LetterOfIntent";
import { SubmissionRequirements } from "./components/SubmissionRequirements";
import { TechnologyNeedsAssessment1 } from "./components/TechnologyNeedsAssessment1";
import { TNA2TechnicalReport } from "./components/TNA2TechnicalReport";
import { ProjectProposal } from "./components/ProjectProposal";
import { ConductOfRTEC } from "./components/ConductOfRTEC";
import { ApprovalLetter } from "./components/ApprovalLetter";
import { LandBankAndWithdrawal } from "./components/LandBankAndWithdrawal";
import { ProcurementAndLiquidation } from "./components/ProcurementAndLiquidation";
import { RefundAndDelinquent } from "./components/RefundAndDelinquent";
import { ProjectCloseOut } from "./components/ProjectCloseOut";
import { AccountManagement } from "./components/AccountManagement";
import { LandBankBranchesAdmin } from "./components/LandBankBranchesAdmin";
import { ClientManagement } from "./components/ClientManagement";
import { ClientFilesAdmin } from "./components/ClientFilesAdmin";
import { StaffClientBar } from "./components/StaffClientBar";
import { NotificationBell } from "./components/NotificationPanel";
import { MyAccount } from "./components/MyAccount";
import { EmailOutbox } from "./components/EmailOutbox";
import { DOSTChatbot } from "./components/DOSTChatbot";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { LandingPage } from "./components/LandingPage";
import { DOSTMark } from "./components/DOSTLogos";
import { DostLogoLoader } from "./components/DostLogoLoader";
import { authStore, AuthUser, AdminView, ROLE_LABELS, normalizeAdminView, isAdminView } from "./store/authStore";
import { loadCurrentView, saveCurrentView, loadAuthPage, saveAuthPage } from "./store/navigationStore";
import { applicantStore, MODULE_ORDER, type ModuleStatus } from "./store/applicantStore";
import { staffContextStore } from "./store/staffContextStore";
import { demoModeStore } from "./store/demoModeStore";
import { notificationStore } from "./store/notificationStore";
import { landbankBranchStore } from "./store/landbankBranchStore";
import { getAuthToken } from "./api/authToken";
import { resolveApplicantForUser } from "./utils/resolveApplicant";
import { moduleToApplicantView, canApplicantAccessView, isApplicantViewLocked, isOnProgramTrack, getModuleIndex } from "./utils/applicantProgress";
import { isSentEmailsNavUnlocked } from "./utils/documentDelivery";
import { notifyModuleCompleted } from "./utils/notificationHelpers";
import { getSetupFormTitle } from "./constants/setupForms";
import { emailOutboxStore } from "./store/emailOutboxStore";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import {
  LayoutDashboard,
  ClipboardCheck,
  UserPlus,
  FileText,
  Upload,
  ChevronDown,
  ChevronRight,
  BarChart2,
  Settings,
  LogOut,
  Search,
  Cpu,
  User,
  Users,
  FolderOpen,
  Menu,
  X,
  Shield,
  Mail,
  Landmark,
} from "lucide-react";

type ViewType = AdminView;

const MODULE_TRANSITION_MIN_MS = 450;
const MODULE_HYDRATE_MAX_MS = 8_000;
const AUTH_TRANSITION_MIN_MS = 450;

function shouldShowViewTransitionLoader(view: string): boolean {
  return isAdminView(view);
}

function resolveViewForUser(user: AuthUser | null): ViewType {
  if (!user) return "dashboard";

  if (authStore.isClientRole(user.role)) {
    const app = resolveApplicantForUser(user);
    if (app?.currentModule) {
      const progressView = moduleToApplicantView(app.currentModule);
      const progressIdx = getModuleIndex(app.currentModule);
      const saved = loadCurrentView();
      // Keep a saved view only when it is at or ahead of persisted progress
      // and still unlocked (e.g. user was browsing an earlier-completed step).
      // Never keep a saved "prescreening" when the case has already advanced.
      if (
        saved &&
        saved !== "prescreening" &&
        authStore.canAccessView(user.role, saved) &&
        canApplicantAccessView(app, saved)
      ) {
        const savedModule = MODULE_ORDER.find((m) => moduleToApplicantView(m) === saved);
        const savedIdx = savedModule ? getModuleIndex(savedModule) : -1;
        if (savedIdx >= progressIdx) {
          return saved;
        }
      }
      return progressView === "dashboard" ? "dashboard" : progressView;
    }
  }

  const saved = loadCurrentView();
  if (saved && authStore.canAccessView(user.role, saved)) {
    if (
      authStore.isClientRole(user.role) &&
      !canApplicantAccessView(resolveApplicantForUser(user), saved)
    ) {
      /* fall through — applicant not hydrated yet or view locked */
    } else if (!authStore.isClientRole(user.role)) {
      return saved;
    }
  }

  if (authStore.isClientRole(user.role)) {
    return "prescreening";
  }

  return authStore.getDefaultView(user.role);
}

const SIDEBAR_WIDTH = "280px";
const SIDEBAR_DRAWER_WIDTH = "300px";
import { DemoModeLogoTrigger } from "./components/DemoModeLogoTrigger";

function SidebarLogo() {
  return (
    <DemoModeLogoTrigger>
      <div className="flex items-center gap-3">
        <DOSTMark size={36} />
      <div>
        <div className="flex items-center gap-1 leading-none">
          <span className="text-white font-black text-[15px] tracking-tight">
            Ai
          </span>
          <span className="text-[#00AEEF] font-black text-[15px] tracking-tight">
            SETUP
          </span>
        </div>
        <p className="text-white/35 text-[9px] tracking-wide mt-0.5">
          DOST SOCCSKSARGEN · SETUP 4.0
        </p>
      </div>
    </div>
    </DemoModeLogoTrigger>
  );
}

function TopbarLogo() {
  return (
    <DemoModeLogoTrigger>
      <div className="flex items-center gap-2.5 shrink-0">
        <DOSTMark size={36} />
      <div className="flex flex-col leading-none hidden sm:flex">
        <span className="text-[8px] font-semibold tracking-[0.18em] text-gray-400 uppercase">
          Republic of the Philippines
        </span>
        <span className="text-[12px] font-bold text-gray-800 tracking-wide">
          Dept. of Science &amp; Technology
        </span>
      </div>
    </div>
    </DemoModeLogoTrigger>
  );
}

interface MenuItem {
  id: ViewType;
  label: string;
  icon: typeof LayoutDashboard;
}

const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard" as ViewType,
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Application Steps",
    items: [
      {
        id: "prescreening" as ViewType,
        label: "Pre-Screening",
        icon: ClipboardCheck,
      },
      {
        id: "registration" as ViewType,
        label: "Enterprise Registration",
        icon: UserPlus,
      },
      {
        id: "letter-of-intent" as ViewType,
        label: "Letter of Intent",
        icon: FileText,
      },
    ],
  },
  {
    label: "Assessment",
    items: [
      {
        id: "tna1" as ViewType,
        label: "Application for TNA",
        icon: BarChart2,
      },
      {
        id: "tna2" as ViewType,
        label: "TNA Report",
        icon: FileText,
      },
      {
        id: "project-proposal" as ViewType,
        label: "Project Proposal",
        icon: ClipboardCheck,
      },
      {
        id: "requirements" as ViewType,
        label: "Submit Requirements",
        icon: Upload,
      },
    ],
  },
  {
    label: "Evaluation & Approval",
    items: [
      {
        id: "conduct-rtec" as ViewType,
        label: "Conduct of RTEC",
        icon: BarChart2,
      },
      {
        id: "approval-letter" as ViewType,
        label: "Approval Letter",
        icon: FileText,
      },
    ],
  },
  {
    label: "Fund Release",
    items: [
      {
        id: "landbank-withdrawal" as ViewType,
        label: "LandBank & Withdrawal",
        icon: Upload,
      },
      {
        id: "procurement-liquidation" as ViewType,
        label: "Procurement & Liquidation",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "Monitoring",
    items: [
      {
        id: "refund-delinquent" as ViewType,
        label: "Refund & Delinquent Mgmt",
        icon: BarChart2,
      },
      {
        id: "project-closeout" as ViewType,
        label: "Project Close-Out",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        id: "clients" as ViewType,
        label: "Cooperators",
        icon: Users,
      },
      {
        id: "client-files" as ViewType,
        label: "Cooperator Files",
        icon: FolderOpen,
      },
      {
        id: "sent-emails" as ViewType,
        label: "Sent Emails",
        icon: Mail,
      },
      {
        id: "landbank-branches" as ViewType,
        label: "LandBank Branches",
        icon: Landmark,
      },
      {
        id: "account-management" as ViewType,
        label: "Account Management",
        icon: Settings,
      },
    ],
  },
];

const viewTitles: Record<
  ViewType,
  { title: string; subtitle: string }
> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "SETUP Program Overview",
  },
  prescreening: {
    title: "Pre-Screening",
    subtitle: "Step 1 — Eligibility Check",
  },
  registration: {
    title: "Enterprise Registration",
    subtitle: "Step 2 — Business Profile",
  },
  "letter-of-intent": {
    title: "Letter of Intent",
    subtitle: "Step 3 — LOI Submission",
  },
  requirements: {
    title: "Submit Requirements",
    subtitle: "Step 4 — Documentary Submission",
  },
  tna1: {
    title: getSetupFormTitle("tna01"),
    subtitle: "Module 5 — Technology Needs Assessment",
  },
  tna2: {
    title: getSetupFormTitle("tna02"),
    subtitle: "Module 6 — Technology Needs Assessment Report",
  },
  "project-proposal": {
    title: "Project Proposal",
    subtitle: "Module 7 — SETUP Project Plan",
  },
  "conduct-rtec": {
    title: "Conduct of RTEC",
    subtitle: "Module 8 — RTEC Report",
  },
  "approval-letter": {
    title: "Approval Letter",
    subtitle: "Module 9 — Notice of Approval",
  },
  "project-information-sheet": {
    title: "LandBank & Withdrawal",
    subtitle: "Module 10+ — Account & Fund Access",
  },
  "landbank-withdrawal": {
    title: "LandBank & Withdrawal",
    subtitle: "Module 10+ — Account & Fund Access",
  },
  "procurement-liquidation": {
    title: "Procurement & Liquidation",
    subtitle: "Modules 14–16 — Equipment & Financial Docs",
  },
  "refund-delinquent": {
    title: "Refund & Delinquent Management",
    subtitle: "Module 17 — Repayment Monitoring",
  },
  "project-closeout": {
    title: "Project Close-Out",
    subtitle: "Module 18 — Terminal Report, Equipment Inventory & Ownership",
  },
  clients: {
    title: "Cooperators",
    subtitle: "Overview, case files & assessment",
  },
  "client-files": {
    title: "Cooperator Files",
    subtitle: "Attachments & generated documents by cooperator",
  },
  "account-management": {
    title: "Account Management",
    subtitle: "Monitor & manage registered MSME accounts",
  },
  "landbank-branches": {
    title: "LandBank Branches",
    subtitle: "Branch directory for LBP introduction & untag letters",
  },
  "my-account": {
    title: "My Account",
    subtitle: "Profile, password & registration details",
  },
  "sent-emails": {
    title: "Sent Emails",
    subtitle: "Simulated email outbox — documents & receipts",
  },
};

/* ── Sidebar Nav Content (shared between desktop + mobile drawer) ── */
function SidebarNav({
  currentView,
  onNavigate,
  collapsed,
  onToggleGroup,
  userRole,
  applicant,
  demoMode,
  sentEmailsUnlocked,
  onLogout,
}: {
  currentView: ViewType;
  onNavigate: (v: ViewType) => void;
  collapsed: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  userRole: AuthUser["role"];
  applicant?: ReturnType<typeof resolveApplicantForUser>;
  demoMode: boolean;
  /** Staff: Sent Emails enabled after a signed document upload. */
  sentEmailsUnlocked: boolean;
  onLogout: () => void;
}) {
  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        authStore.canAccessView(userRole, item.id),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <nav
        className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <button
              onClick={() => onToggleGroup(group.label)}
              className="w-full flex items-center justify-between px-2 py-1.5 mt-2 mb-0.5"
            >
              <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/35">
                {group.label}
              </span>
              {collapsed[group.label] ? (
                <ChevronRight className="w-2.5 h-2.5 text-white/25" />
              ) : (
                <ChevronDown className="w-2.5 h-2.5 text-white/25" />
              )}
            </button>
            {!collapsed[group.label] &&
              group.items.map((item) => {
                const Icon = item.icon;
                const active = currentView === item.id;
                const moduleLocked =
                  authStore.isClientRole(userRole) &&
                  isApplicantViewLocked(applicant ?? null, item.id);
                const sentEmailsLocked =
                  item.id === "sent-emails" && !sentEmailsUnlocked;
                const locked = moduleLocked || sentEmailsLocked;
                const navigable =
                  (!moduleLocked || demoMode) && !sentEmailsLocked;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigable && onNavigate(item.id)}
                    disabled={!navigable}
                    title={
                      sentEmailsLocked
                        ? "Available after a cooperator uploads a signed document."
                        : moduleLocked
                          ? demoMode
                            ? "Normally locked — demo mode lets you open this module"
                            : "Complete earlier application steps to unlock this module"
                          : undefined
                    }
                    className={`w-full flex items-center gap-3 px-3.5 py-3 min-h-[48px] rounded-lg transition-all mb-0.5 group text-left ${
                      locked && !navigable
                        ? "opacity-40 cursor-not-allowed text-white/35"
                        : locked && demoMode
                          ? "opacity-70 text-white/50 hover:bg-white/10 hover:text-white/75"
                        : active
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-white/55 hover:bg-white/10 hover:text-white/85"
                    }`}
                  >
                    <div
                      className={`w-0.5 h-5 rounded-full shrink-0 ${active ? "bg-[#00AEEF]" : "bg-transparent"}`}
                    />
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 ${active ? "text-[#00AEEF]" : "text-white/35 group-hover:text-white/60"}`}
                    />
                    <span className="text-[14px] font-medium leading-snug flex-1 min-w-0">
                      {item.label}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-white/10 space-y-0.5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-medium">
            Logout
          </span>
        </button>
        {/* <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-center opacity-20">
          <DOSTMark size={22} />
        </div> */}
      </div>
    </>
  );
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [currentView, setCurrentViewState] =
    useState<ViewType>(() => resolveViewForUser(authStore.getUser()));
  const [collapsed, setCollapsed] = useState<
    Record<string, boolean>
  >({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authPage, setAuthPageState] = useState<
    "landing" | "login" | "register"
  >(() => loadAuthPage());
  const [registrationPrefill, setRegistrationPrefill] = useState<
    "DTI" | "SEC" | "CDA"
  >("DTI");
  /** One-shot banner on LoginPage after RegisterPage success / "back to login". */
  const [fromRegistration, setFromRegistration] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(
    authStore.getUser(),
  );
  const [demoMode, setDemoMode] = useState(demoModeStore.isEnabled());
  /** Bumps when applicantStore hydrates/updates so sidebar unlocks after refresh. */
  const [, setApplicantStoreEpoch] = useState(0);
  /** Bumps when email outbox changes so Sent Emails unlocks after signed upload. */
  const [, setEmailOutboxEpoch] = useState(0);
  /** After this, stop blocking the shell on a failed/slow first hydrate. */
  const [hydrateWaitExpired, setHydrateWaitExpired] = useState(false);
  /** Brief branded overlay when opening a SETUP module view. */
  const [moduleLoading, setModuleLoading] = useState(false);
  /** Fullscreen loader during sign-out (persists across shell → landing). */
  const [authTransition, setAuthTransition] = useState<{
    active: boolean;
    label: string;
  } | null>(null);

  const authTransitionOverlay =
    authTransition?.active ? (
      <DostLogoLoader variant="overlay" label={authTransition.label} />
    ) : null;

  const setAuthPage = (page: "landing" | "login" | "register") => {
    setAuthPageState(page);
    saveAuthPage(page);
    if (page !== "login") {
      setFromRegistration(false);
    }
  };

  const handleLogout = () => {
    setAuthTransition({ active: true, label: "Signing out…" });
    setFromRegistration(false);
    setAuthPage("landing");
    authStore.logout();
    window.setTimeout(
      () => setAuthTransition(null),
      AUTH_TRANSITION_MIN_MS,
    );
  };

  // Restore persisted auth session before rendering public pages
  useEffect(() => {
    authStore.hydrate();
    let restored = authStore.getUser();
    if (restored && !getAuthToken()) {
      authStore.logout();
      restored = null;
    }
    setUser(restored);
    if (restored) {
      setCurrentViewState(resolveViewForUser(restored));
    }
    setAuthReady(true);
    // Pull persisted applicants when a session token is present
    void applicantStore.hydrateFromBackend(!!restored).then(async () => {
      const active = authStore.getUser();
      if (
        active &&
        authStore.isStaff(active.role) &&
        applicantStore.getAll().length === 0 &&
        getAuthToken()
      ) {
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
        await applicantStore.hydrateFromBackend(true);
      }
      if (active) {
        await notificationStore.hydrateFromBackend();
        if (authStore.isStaff(active.role)) {
          await landbankBranchStore.hydrateFromBackend();
        }
      }
      const nextView = resolveViewForUser(active);
      if (active && authStore.isClientRole(active.role) && nextView) {
        setCurrentViewState(nextView);
        saveCurrentView(nextView);
      }
      setApplicantStoreEpoch((n) => n + 1);
    });
  }, []);

  // Refresh notifications when returning to the tab (cross-user delivery without websockets).
  useEffect(() => {
    const onFocus = () => {
      if (authStore.getUser() && getAuthToken()) {
        void applicantStore.hydrateFromBackend(true);
        void notificationStore.hydrateFromBackend();
        const u = authStore.getUser();
        if (u && authStore.isStaff(u.role)) {
          void landbankBranchStore.hydrateFromBackend(true);
        }
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Light polling so logged-in users see cross-session alerts without WebSockets.
  useEffect(() => {
    if (!user || !getAuthToken()) return;
    const id = window.setInterval(() => {
      if (authStore.getUser() && getAuthToken()) {
        void applicantStore.hydrateFromBackend();
        void notificationStore.hydrateFromBackend();
        const u = authStore.getUser();
        if (u && authStore.isStaff(u.role)) {
          void landbankBranchStore.hydrateFromBackend();
        }
      }
    }, 45_000);
    return () => window.clearInterval(id);
  }, [user]);

  // Subscribe to auth changes
  useEffect(
    () =>
      authStore.subscribe(() => {
        const next = authStore.getUser();
        setUser(next);
        if (next) setFromRegistration(false);
      }),
    [],
  );

  useEffect(
    () =>
      applicantStore.subscribe(() => setApplicantStoreEpoch((n) => n + 1)),
    [],
  );

  useEffect(
    () => emailOutboxStore.subscribe(() => setEmailOutboxEpoch((n) => n + 1)),
    [],
  );

  useEffect(
    () => demoModeStore.subscribe(() => setDemoMode(demoModeStore.isEnabled())),
    [],
  );

  // Close drawer on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Prevent body scroll when drawer open on mobile
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Restore or assign view after sign-in (fresh login has no saved view)
  useEffect(() => {
    if (!user) return;
    const view = resolveViewForUser(user);
    setCurrentViewState(view);
    saveCurrentView(view);
  }, [user?.id]);

  // Redirect to an allowed view if the current one is restricted for this role
  useEffect(() => {
    if (!user || authStore.usesClientPortal(user)) return;
    if (!authStore.canAccessView(user.role, currentView)) {
      const fallback = authStore.getDefaultView(user.role);
      setCurrentViewState(fallback);
      saveCurrentView(fallback);
    } else if (
      currentView === "sent-emails" &&
      !isSentEmailsNavUnlocked(user)
    ) {
      const fallback = authStore.getDefaultView(user.role);
      setCurrentViewState(fallback);
      saveCurrentView(fallback);
    } else if (
      authStore.isClientRole(user.role) &&
      !canApplicantAccessView(resolveApplicantForUser(user), currentView)
    ) {
      const fallback = resolveViewForUser(user);
      setCurrentViewState(fallback);
      saveCurrentView(fallback);
    }
  }, [user, currentView]);

  // Heal corrupted persisted view keys without crashing the shell.
  useEffect(() => {
    const normalized = normalizeAdminView(currentView);
    if (!normalized) {
      const fallback = resolveViewForUser(user);
      setCurrentViewState(fallback);
      saveCurrentView(fallback);
      return;
    }
    if (normalized !== currentView) {
      setCurrentViewState(normalized);
      saveCurrentView(normalized);
    }
  }, [currentView, user]);

  const setCurrentView = (view: ViewType) => {
    const resolved = normalizeAdminView(view) ?? "dashboard";
    setCurrentViewState(resolved);
    saveCurrentView(resolved);
  };

  const applicantsHydrated = applicantStore.isHydrated();
  const showHydrateGate =
    !!user && !applicantsHydrated && !hydrateWaitExpired;

  // Cap how long we block the shell waiting for the first SoR hydrate.
  useEffect(() => {
    if (!user || applicantsHydrated) {
      setHydrateWaitExpired(false);
      return;
    }
    const id = window.setTimeout(
      () => setHydrateWaitExpired(true),
      MODULE_HYDRATE_MAX_MS,
    );
    return () => window.clearTimeout(id);
  }, [user, applicantsHydrated]);

  // Branded overlay when opening any app view (SETUP + Administration + dashboard).
  const pendingModuleView = normalizeAdminView(currentView) ?? "dashboard";
  useEffect(() => {
    if (!user || !shouldShowViewTransitionLoader(pendingModuleView)) {
      setModuleLoading(false);
      return;
    }

    setModuleLoading(true);
    let cancelled = false;
    const started = Date.now();

    const tryClear = () => {
      if (cancelled) return;
      const elapsed = Date.now() - started;
      const minOk = elapsed >= MODULE_TRANSITION_MIN_MS;
      const dataOk =
        applicantStore.isHydrated() || elapsed >= MODULE_HYDRATE_MAX_MS;
      if (minOk && dataOk) {
        setModuleLoading(false);
      }
    };

    tryClear();
    const tick = window.setInterval(tryClear, 50);
    const unsub = applicantStore.subscribe(tryClear);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
      unsub();
    };
  }, [user, pendingModuleView]);

  if (!authReady) {
    return (
      <>
        <DostLogoLoader variant="fullscreen" label="Loading session…" />
        {authTransitionOverlay}
      </>
    );
  }

  // Show landing / login / register if not logged in
  if (!user) {
    if (authPage === "landing") {
      return (
        <>
          <LandingPage
            onLogin={() => setAuthPage("login")}
            onRegister={(type) => {
              setRegistrationPrefill(
                type === "non-single-proprietor" ? "SEC" : "DTI",
              );
              setAuthPage("register");
            }}
          />
          {authTransitionOverlay}
        </>
      );
    }
    if (authPage === "register") {
      return (
        <>
          <RegisterPage
            initialRegistrationType={registrationPrefill}
            onLogin={() => {
              setFromRegistration(false);
              setAuthPage("login");
            }}
            onSuccess={() => {
              setFromRegistration(true);
              setAuthPage("login");
            }}
            onHome={() => setAuthPage("landing")}
          />
          {authTransitionOverlay}
        </>
      );
    }
    return (
      <>
        <LoginPage
          fromRegistration={fromRegistration}
          onRegister={() => setAuthPage("register")}
          onHome={() => setAuthPage("landing")}
        />
        {authTransitionOverlay}
      </>
    );
  }

  const toggleGroup = (label: string) =>
    setCollapsed((p) => ({ ...p, [label]: !p[label] }));

  const navigate = (view: ViewType) => {
    const target = normalizeAdminView(view);
    if (!target) return;
    if (user && !authStore.canAccessView(user.role, target)) return;
    if (
      user &&
      authStore.isClientRole(user.role) &&
      !canApplicantAccessView(resolveApplicantForUser(user), target)
    ) {
      return;
    }
    if (target === "sent-emails" && user && !isSentEmailsNavUnlocked(user)) {
      return;
    }
    setCurrentView(target);
    setDrawerOpen(false);
  };

  const activeApplicant = user
    ? resolveApplicantForUser(user)
    : null;

  /**
   * Marks the given module complete: advances the applicant to the next
   * module per MODULE_ORDER and navigates to it (or to `navigateTo`).
   */
  const advanceFrom = (module: ModuleStatus, navigateTo?: ViewType) => {
    const next = MODULE_ORDER[MODULE_ORDER.indexOf(module) + 1];
    const app = resolveApplicantForUser(user);
    if (app && next) {
      applicantStore.update(app.id, { currentModule: next });
    }
    if (app && module !== "prescreening") {
      notifyModuleCompleted(applicantStore.getById(app.id) ?? app, module);
    }
    const fallbackView =
      normalizeAdminView(navigateTo) ??
      normalizeAdminView(next) ??
      normalizeAdminView(module) ??
      "dashboard";
    navigate(fallbackView);
  };

  const isRestrictedClient = authStore.isClientRole(user.role);
  const isStaff = authStore.isStaff(user.role);
  const sentEmailsUnlocked = isSentEmailsNavUnlocked(user);
  const safeView = normalizeAdminView(currentView) ?? "dashboard";
  const { title, subtitle } = viewTitles[safeView] ?? {
    title: "Dashboard",
    subtitle: "SETUP Program Overview",
  };

  return (
    <div
      className="flex h-screen w-full max-w-full overflow-hidden bg-[#EEF2F7]"
      style={{
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ══ DESKTOP SIDEBAR (hidden on mobile/tablet) ══ */}
      <aside
        className="hidden lg:flex bg-[#0C2461] flex-col shrink-0 h-full min-h-0 overflow-hidden shadow-2xl z-20"
        style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH }}
      >
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <SidebarLogo />
        </div>
        <SidebarNav
          currentView={safeView}
          onNavigate={navigate}
          collapsed={collapsed}
          onToggleGroup={toggleGroup}
          userRole={user.role}
          applicant={activeApplicant}
          demoMode={demoMode}
          sentEmailsUnlocked={sentEmailsUnlocked}
          onLogout={handleLogout}
        />
      </aside>

      {/* ══ MOBILE DRAWER OVERLAY ══ */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ══ MOBILE DRAWER PANEL ══ */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#0C2461] flex flex-col z-50 shadow-2xl transition-transform duration-300 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: SIDEBAR_DRAWER_WIDTH, minWidth: SIDEBAR_DRAWER_WIDTH }}
      >
        {/* Drawer header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/10 flex items-center justify-between">
          <SidebarLogo />
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-white/50 hover:text-white transition-colors ml-2 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarNav
          currentView={safeView}
          onNavigate={navigate}
          collapsed={collapsed}
          onToggleGroup={toggleGroup}
          userRole={user.role}
          applicant={activeApplicant}
          demoMode={demoMode}
          sentEmailsUnlocked={sentEmailsUnlocked}
          onLogout={handleLogout}
        />
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* ── Topbar ── */}
        <header className="h-14 w-full min-w-0 bg-white border-b border-gray-200 flex items-center px-3 sm:px-6 shrink-0 shadow-sm z-10 gap-2 sm:gap-3">
          {/* Hamburger — mobile/tablet only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* DOST Logo */}
          <TopbarLogo />

          {/* Divider — desktop only */}
          <div className="hidden sm:block w-px h-7 bg-gray-200 shrink-0" />

          {/* Page title */}
          <div className="flex-1 min-w-0 hidden sm:block">
            <p className="text-sm font-bold text-gray-800 leading-tight truncate">
              {title}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight hidden md:block">
              {subtitle}
            </p>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0 min-w-0">
            {/* Search — hidden on small mobile */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                placeholder="Search..."
                className="bg-transparent text-[13px] text-gray-600 outline-none w-24 lg:w-28 placeholder:text-gray-400"
              />
            </div>

            {/* Bell */}
            <NotificationBell user={user} onNavigate={navigate} />

            <div className="w-px h-6 bg-gray-200 shrink-0" />

            {/* User info + logout */}
            <div className="flex items-center gap-1 shrink-0">
              {authStore.isClientRole(user.role) ? (
                <button
                  type="button"
                  onClick={() => navigate("my-account")}
                  title="My Account"
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-100 transition-colors text-left"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#0C2461]/20 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0C2461] flex items-center justify-center shrink-0">
                      <span className="text-white text-[11px] font-bold">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </span>
                    </div>
                  )}
                  <div className="hidden md:block max-w-[140px]">
                    <p className="text-[12px] font-semibold text-gray-800 leading-tight truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                        {ROLE_LABELS[user.role]}
                      </span>
                      {user.applicationId && (
                        <span className="text-[9px] text-gray-400 font-mono truncate">
                          {user.applicationId}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-1.5 py-1">
                  <div className="w-8 h-8 rounded-full bg-[#0C2461] flex items-center justify-center shrink-0">
                    <span className="text-white text-[11px] font-bold">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[12px] font-semibold text-gray-800 leading-tight">
                      {user.firstName} {user.lastName}
                    </p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {demoMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div>
              <p className="text-xs font-semibold text-amber-900">
                Demo mode: restrictions bypassed (warnings still shown)
              </p>
              <p className="text-[11px] text-amber-700">
                Toggle: 5× click DOST logo
              </p>
            </div>
            <button
              type="button"
              onClick={() => demoModeStore.setEnabled(false)}
              className="text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Turn off
            </button>
          </div>
        )}

        {isRestrictedClient && (
          <div className="bg-teal-50 border-b border-teal-200 px-4 sm:px-6 py-2 flex items-center gap-2 shrink-0">
            <Shield className="w-4 h-4 text-teal-700 shrink-0" />
            <p className="text-xs text-teal-800">
              Applicant access — you can complete your application steps only.
              Evaluation and approval modules require DOST personnel.
            </p>
          </div>
        )}

        {isStaff && (
          <StaffClientBar
            user={user}
            onNavigate={navigate}
            onOpenClients={() => navigate("clients")}
          />
        )}

        {/* ── Page content ── */}
        <main className="relative flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 pb-20 sm:pb-6">
          {(showHydrateGate || moduleLoading) && (
            <DostLogoLoader
              variant="overlay"
              label={showHydrateGate ? "Loading data…" : "Loading…"}
            />
          )}
          <AppErrorBoundary key={safeView} label={safeView}>
          {!showHydrateGate &&
          authStore.canAccessView(user.role, safeView) ? (
            <>
              {safeView === "dashboard" && (
                <Dashboard user={user} onNavigate={navigate} />
              )}
              {safeView === "prescreening" && (
                <PrescreeningForm
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app?.qualified) advanceFrom("prescreening");
                  }}
                  onProceedToLoi={() => navigate("letter-of-intent")}
                />
              )}
              {safeView === "registration" && (
                <EnterpriseRegistration
                  user={user}
                  onOpenAccount={() => navigate("my-account")}
                  onSubmitSuccess={() => advanceFrom("registration")}
                />
              )}
              {safeView === "letter-of-intent" && (
                <LetterOfIntent
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    // Program-referral LOI ends here — do not open SETUP modules (TNA1…).
                    if (app && isOnProgramTrack(app)) {
                      notifyModuleCompleted(app, "letter-of-intent");
                      navigate("dashboard");
                      return;
                    }
                    advanceFrom("letter-of-intent");
                  }}
                />
              )}
              {safeView === "tna1" && (
                <TechnologyNeedsAssessment1
                  user={user}
                  onSubmitSuccess={() => advanceFrom("tna1")}
                />
              )}
              {safeView === "tna2" && (
                <TNA2TechnicalReport
                  user={user}
                  onSubmitSuccess={() => advanceFrom("tna2")}
                />
              )}
              {safeView === "project-proposal" && (
                <ProjectProposal
                  user={user}
                  onSubmitSuccess={() => advanceFrom("project-proposal")}
                />
              )}
              {safeView === "requirements" && (
                <SubmissionRequirements
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (!app) return;
                    if (app.moduleData?.routingDecision === "mpex") {
                      notifyModuleCompleted(app, "requirements");
                      navigate("dashboard");
                      return;
                    }
                    advanceFrom("requirements", "dashboard");
                  }}
                />
              )}
              {safeView === "conduct-rtec" && (
                <ConductOfRTEC
                  user={user}
                  onSubmitSuccess={() => advanceFrom("conduct-rtec")}
                />
              )}
              {safeView === "approval-letter" && (
                <ApprovalLetter
                  user={user}
                  onSubmitSuccess={() => advanceFrom("approval-letter")}
                />
              )}
              {(safeView === "landbank-withdrawal" ||
                safeView === "project-information-sheet") && (
                <LandBankAndWithdrawal
                  user={user}
                  onSubmitSuccess={() => advanceFrom("landbank-withdrawal")}
                />
              )}
              {safeView === "procurement-liquidation" && (
                <ProcurementAndLiquidation
                  user={user}
                  onSubmitSuccess={() => advanceFrom("procurement-liquidation")}
                />
              )}
              {safeView === "refund-delinquent" && (
                <RefundAndDelinquent
                  user={user}
                  onSubmitSuccess={() => advanceFrom("refund-delinquent")}
                />
              )}
              {safeView === "project-closeout" && (
                <ProjectCloseOut
                  user={user}
                  onSubmitSuccess={() => {
                    navigate("dashboard");
                  }}
                />
              )}
              {safeView === "clients" && (
                <ClientManagement user={user} onNavigate={navigate} />
              )}
              {safeView === "client-files" && (
                <ClientFilesAdmin user={user} onNavigate={navigate} />
              )}
              {safeView === "account-management" && (
                <AccountManagement user={user} />
              )}
              {safeView === "landbank-branches" && (
                <LandBankBranchesAdmin user={user} />
              )}
              {safeView === "my-account" && <MyAccount user={user} />}
              {safeView === "sent-emails" && <EmailOutbox user={user} />}
            </>
          ) : !showHydrateGate ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
              <Shield className="w-12 h-12 text-gray-300 mb-4" />
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                Access Restricted
              </h2>
              <p className="text-sm text-gray-500 max-w-md">
                This section is only available to authorized DOST personnel.
                You can manage your application steps from the menu items
                available to your account.
              </p>
            </div>
          ) : null}
          </AppErrorBoundary>
        </main>

        {/* ── Footer ── */}
        <footer className="bg-white border-t border-gray-100 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400">
            <span>
              © {new Date().getFullYear()} Department of
              Science and Technology — Republic of the
              Philippines
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Powered by AiSETUP
            </span>
          </div>
          <p className="text-[10px] text-gray-300 hidden sm:block">
            SETUP Financial Assistance Program
          </p>
        </footer>
      </div>

      {/* ── Floating AI Chatbot (voice-enabled) ── */}
      <DOSTChatbot />
      {authTransitionOverlay}
    </div>
  );
}