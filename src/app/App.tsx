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
import { ProjectInformationSheet } from "./components/ProjectInformationSheet";
import { LandBankAndWithdrawal } from "./components/LandBankAndWithdrawal";
import { ProcurementAndLiquidation } from "./components/ProcurementAndLiquidation";
import { RefundAndDelinquent } from "./components/RefundAndDelinquent";
import { ProjectCloseOut } from "./components/ProjectCloseOut";
import { AccountManagement } from "./components/AccountManagement";
import { ClientManagement } from "./components/ClientManagement";
import { StaffClientBar } from "./components/StaffClientBar";
import { NotificationBell } from "./components/NotificationPanel";
import { MyAccount } from "./components/MyAccount";
import { DOSTChatbot } from "./components/DOSTChatbot";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { LandingPage } from "./components/LandingPage";
// import { ClientPortal } from "./components/ClientPortal";
import { authStore, AuthUser, AdminView, ROLE_LABELS } from "./store/authStore";
import { applicantStore } from "./store/applicantStore";
import { staffContextStore } from "./store/staffContextStore";
import { demoModeStore } from "./store/demoModeStore";
import { resolveApplicantForUser } from "./utils/resolveApplicant";
import { moduleToApplicantView, canApplicantAccessView, isApplicantViewLocked } from "./utils/applicantProgress";
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
  Menu,
  X,
  Shield,
} from "lucide-react";

type ViewType = AdminView;

import { DOSTMark } from "./components/DOSTLogos";
import { DemoModeLogoTrigger } from "./components/DemoModeLogoTrigger";

function SidebarLogo() {
  return (
    <DemoModeLogoTrigger>
      <div className="flex items-center gap-3">
        <DOSTMark size={36} />
      <div>
        <div className="flex items-center gap-1 leading-none">
          <span className="text-white font-black text-[15px] tracking-tight">
            ai
          </span>
          <span className="text-[#00AEEF] font-black text-[15px] tracking-tight">
            SETUP
          </span>
        </div>
        <p className="text-white/35 text-[9px] tracking-wide mt-0.5">
          DOST Region XII · SETUP 4.0
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

const menuGroups = [
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
        module: "Step 1",
      },
      {
        id: "registration" as ViewType,
        label: "Enterprise Registration",
        icon: UserPlus,
        module: "Step 2",
      },
      {
        id: "letter-of-intent" as ViewType,
        label: "Letter of Intent",
        icon: FileText,
        module: "Step 3",
      },
    ],
  },
  {
    label: "Assessment",
    items: [
      {
        id: "tna1" as ViewType,
        label: "TNA 1 Assessment",
        icon: BarChart2,
        module: "Module 5",
      },
      {
        id: "tna2" as ViewType,
        label: "TNA 2 Technical Report",
        icon: FileText,
        module: "Module 6",
      },
      {
        id: "project-proposal" as ViewType,
        label: "Project Proposal",
        icon: ClipboardCheck,
        module: "Module 7",
      },
      {
        id: "requirements" as ViewType,
        label: "Submit Requirements",
        icon: Upload,
        module: "Step 4",
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
        module: "Module 8",
      },
      {
        id: "approval-letter" as ViewType,
        label: "Approval Letter",
        icon: FileText,
        module: "Module 9",
      },
      {
        id: "project-information-sheet" as ViewType,
        label: "Project Information Sheet",
        icon: ClipboardCheck,
        module: "Module 10",
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
        module: "Mod 11–13",
      },
      {
        id: "procurement-liquidation" as ViewType,
        label: "Procurement & Liquidation",
        icon: ClipboardCheck,
        module: "Mod 14–16",
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
        module: "Mod 17",
      },
      {
        id: "project-closeout" as ViewType,
        label: "Project Close-Out",
        icon: ClipboardCheck,
        module: "Mod 18",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        id: "clients" as ViewType,
        label: "Clients",
        icon: Users,
        module: "Admin",
      },
      {
        id: "account-management" as ViewType,
        label: "Account Management",
        icon: Settings,
        module: "Settings",
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
    title: "TNA 1 Assessment",
    subtitle: "Module 5 — Technology Needs Assessment",
  },
  tna2: {
    title: "TNA 2 Technical Report",
    subtitle: "Module 6 — Technical Analysis",
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
    title: "Project Information Sheet",
    subtitle: "Module 10 — Pre-Implementation PIS, MOA Signing & Semester PIS",
  },
  "landbank-withdrawal": {
    title: "LandBank & Withdrawal",
    subtitle: "Modules 11–13 — Account & Fund Access",
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
    title: "Clients",
    subtitle: "Overview, case files & assessment",
  },
  "account-management": {
    title: "Account Management",
    subtitle: "Monitor & manage registered MSME accounts",
  },
  "my-account": {
    title: "My Account",
    subtitle: "Profile, password & registration details",
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
}: {
  currentView: ViewType;
  onNavigate: (v: ViewType) => void;
  collapsed: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  userRole: AuthUser["role"];
  applicant?: ReturnType<typeof resolveApplicantForUser>;
  demoMode: boolean;
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
        className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
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
                const locked =
                  authStore.isClientRole(userRole) &&
                  isApplicantViewLocked(applicant ?? null, item.id);
                const navigable = !locked || demoMode;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigable && onNavigate(item.id)}
                    disabled={!navigable}
                    title={
                      locked
                        ? demoMode
                          ? "Normally locked — demo mode lets you open this module"
                          : "Complete earlier application steps to unlock this module"
                        : undefined
                    }
                    className={`w-full flex items-center gap-3 px-3 py-[10px] rounded-lg transition-all mb-0.5 group text-left ${
                      locked
                        ? demoMode
                          ? "opacity-70 text-white/50 hover:bg-white/10 hover:text-white/75"
                          : "opacity-40 cursor-not-allowed text-white/35"
                        : active
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-white/55 hover:bg-white/10 hover:text-white/85"
                    }`}
                  >
                    <div
                      className={`w-0.5 h-5 rounded-full shrink-0 ${active ? "bg-[#00AEEF]" : "bg-transparent"}`}
                    />
                    <Icon
                      className={`w-4 h-4 shrink-0 ${active ? "text-[#00AEEF]" : "text-white/35 group-hover:text-white/60"}`}
                    />
                    <span className="text-[13px] font-medium leading-tight flex-1">
                      {item.label}
                    </span>
                    {item.module && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                          active
                            ? "bg-[#00AEEF]/20 text-[#00AEEF]"
                            : "bg-white/8 text-white/25"
                        }`}
                      >
                        {item.module}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
        <button
          onClick={() => authStore.logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/40 hover:bg-white/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[12px] font-medium">
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
  const [currentView, setCurrentView] =
    useState<ViewType>("dashboard");
  const [collapsed, setCollapsed] = useState<
    Record<string, boolean>
  >({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authPage, setAuthPage] = useState<
    "landing" | "login" | "register"
  >("landing");
  const [registrationPrefill, setRegistrationPrefill] = useState<
    "DTI" | "SEC" | "CDA"
  >("DTI");
  const [loginPortal, setLoginPortal] = useState<
    "applicant" | "staff" | null
  >(null);
  const [user, setUser] = useState<AuthUser | null>(
    authStore.getUser(),
  );
  const [demoMode, setDemoMode] = useState(demoModeStore.isEnabled());

  // Subscribe to auth changes
  useEffect(
    () =>
      authStore.subscribe(() => setUser(authStore.getUser())),
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

  // Applicants resume at their last saved module after sign-in
  useEffect(() => {
    if (!user) return;
    if (authStore.isClientRole(user.role)) {
      const app = resolveApplicantForUser(user);
      const target = app
        ? moduleToApplicantView(app.currentModule)
        : "prescreening";
      const view = target === "dashboard" ? "dashboard" : target;
      if (authStore.canAccessView(user.role, view)) {
        setCurrentView(view);
      } else {
        setCurrentView("dashboard");
      }
    }
  }, [user?.id]);

  // Redirect to an allowed view if the current one is restricted for this role
  useEffect(() => {
    if (!user || authStore.usesClientPortal(user)) return;
    if (!authStore.canAccessView(user.role, currentView)) {
      setCurrentView(authStore.getDefaultView(user.role));
    }
  }, [user, currentView]);

  // Show landing / login / register if not logged in
  if (!user) {
    if (authPage === "landing") {
      return (
        <LandingPage
          onLogin={() => {
            setLoginPortal("applicant");
            setAuthPage("login");
          }}
          onStaffLogin={() => {
            setLoginPortal("staff");
            setAuthPage("login");
          }}
          onRegister={(type) => {
            setRegistrationPrefill(
              type === "non-single-proprietor" ? "SEC" : "DTI",
            );
            setAuthPage("register");
          }}
        />
      );
    }
    if (authPage === "register") {
      return (
        <RegisterPage
          initialRegistrationType={registrationPrefill}
          onLogin={() => {
            setLoginPortal("applicant");
            setAuthPage("login");
          }}
          onSuccess={() => {
            setLoginPortal("applicant");
            setAuthPage("login");
          }}
          onHome={() => setAuthPage("landing")}
        />
      );
    }
    return (
      <LoginPage
        defaultPortal={loginPortal ?? undefined}
        onRegister={() => setAuthPage("register")}
        onHome={() => {
          setLoginPortal(null);
          setAuthPage("landing");
        }}
      />
    );
  }

  const toggleGroup = (label: string) =>
    setCollapsed((p) => ({ ...p, [label]: !p[label] }));

  const navigate = (view: ViewType) => {
    if (user && !authStore.canAccessView(user.role, view)) return;
    if (
      user &&
      authStore.isClientRole(user.role) &&
      !canApplicantAccessView(resolveApplicantForUser(user), view)
    ) {
      return;
    }
    setCurrentView(view);
    setDrawerOpen(false);
  };

  const activeApplicant = user
    ? resolveApplicantForUser(user)
    : null;

  // Community client portal — disabled; applicants use aiSETUP application workflow
  // if (authStore.usesClientPortal(user)) {
  //   return (
  //     <ClientPortal
  //       user={user}
  //       onLogout={() => authStore.logout()}
  //     />
  //   );
  // }

  const isRestrictedClient = authStore.isClientRole(user.role);
  const isStaff = authStore.isStaff(user.role);
  const { title, subtitle } = viewTitles[currentView];

  return (
    <div
      className="flex min-h-screen bg-[#EEF2F7]"
      style={{
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ══ DESKTOP SIDEBAR (hidden on mobile/tablet) ══ */}
      <aside className="hidden lg:flex w-[240px] bg-[#0C2461] flex-col shrink-0 shadow-2xl z-20">
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <SidebarLogo />
        </div>
        <SidebarNav
          currentView={currentView}
          onNavigate={navigate}
          collapsed={collapsed}
          onToggleGroup={toggleGroup}
          userRole={user.role}
          applicant={activeApplicant}
          demoMode={demoMode}
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
        className={`fixed top-0 left-0 h-full w-[270px] bg-[#0C2461] flex flex-col z-50 shadow-2xl transition-transform duration-300 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10 flex items-center justify-between">
          <SidebarLogo />
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-white/50 hover:text-white transition-colors ml-2 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarNav
          currentView={currentView}
          onNavigate={navigate}
          collapsed={collapsed}
          onToggleGroup={toggleGroup}
          userRole={user.role}
          applicant={activeApplicant}
          demoMode={demoMode}
        />
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Topbar ── */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-3 sm:px-6 shrink-0 shadow-sm z-10 gap-3">
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
          <div className="flex items-center gap-2 ml-auto shrink-0">
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
                onClick={() => authStore.logout()}
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
        <main className="flex-1 overflow-auto">
          {authStore.canAccessView(user.role, currentView) ? (
            <>
              {currentView === "dashboard" && (
                <Dashboard user={user} onNavigate={navigate} />
              )}
              {currentView === "prescreening" && (
                <PrescreeningForm
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, { currentModule: "registration" });
                    }
                    navigate("registration");
                  }}
                />
              )}
              {currentView === "registration" && (
                <EnterpriseRegistration
                  user={user}
                  onOpenAccount={() => navigate("my-account")}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, { currentModule: "letter-of-intent" });
                    }
                    navigate("letter-of-intent");
                  }}
                />
              )}
              {currentView === "letter-of-intent" && (
                <LetterOfIntent
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, { currentModule: "tna1" });
                    }
                    navigate("tna1");
                  }}
                />
              )}
              {currentView === "tna1" && (
                <TechnologyNeedsAssessment1
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, { currentModule: "tna2" });
                    }
                    navigate("tna2");
                  }}
                />
              )}
              {currentView === "tna2" && (
                <TNA2TechnicalReport
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, {
                        currentModule: "project-proposal",
                      });
                    }
                    navigate("project-proposal");
                  }}
                />
              )}
              {currentView === "project-proposal" && (
                <ProjectProposal
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, {
                        currentModule: "requirements",
                      });
                    }
                    navigate("requirements");
                  }}
                />
              )}
              {currentView === "requirements" && (
                <SubmissionRequirements
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (!app) return;
                    const routing = app.moduleData?.routingDecision;
                    if (routing === "mpex") {
                      navigate("dashboard");
                      return;
                    }
                    applicantStore.update(app.id, {
                      currentModule: "conduct-rtec",
                    });
                    navigate("dashboard");
                  }}
                />
              )}
              {currentView === "conduct-rtec" && (
                <ConductOfRTEC
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, {
                        currentModule: "approval-letter",
                      });
                    }
                    navigate("approval-letter");
                  }}
                />
              )}
              {currentView === "approval-letter" && (
                <ApprovalLetter
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, {
                        currentModule: "project-information-sheet",
                      });
                    }
                    navigate("project-information-sheet");
                  }}
                />
              )}
              {currentView === "project-information-sheet" && (
                <ProjectInformationSheet
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, {
                        currentModule: "landbank-withdrawal",
                      });
                    }
                    navigate("landbank-withdrawal");
                  }}
                />
              )}
              {currentView === "landbank-withdrawal" && (
                <LandBankAndWithdrawal
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, {
                        currentModule: "procurement-liquidation",
                      });
                    }
                    navigate("procurement-liquidation");
                  }}
                />
              )}
              {currentView === "procurement-liquidation" && (
                <ProcurementAndLiquidation
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, {
                        currentModule: "refund-delinquent",
                      });
                    }
                    navigate("refund-delinquent");
                  }}
                />
              )}
              {currentView === "refund-delinquent" && (
                <RefundAndDelinquent
                  user={user}
                  onSubmitSuccess={() => {
                    const app = resolveApplicantForUser(user);
                    if (app) {
                      applicantStore.update(app.id, {
                        currentModule: "project-closeout",
                      });
                    }
                    navigate("project-closeout");
                  }}
                />
              )}
              {currentView === "project-closeout" && (
                <ProjectCloseOut
                  user={user}
                  onSubmitSuccess={() => {
                    navigate("dashboard");
                  }}
                />
              )}
              {currentView === "clients" && (
                <ClientManagement user={user} onNavigate={navigate} />
              )}
              {currentView === "account-management" && (
                <AccountManagement user={user} />
              )}
              {currentView === "my-account" && <MyAccount user={user} />}
            </>
          ) : (
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
          )}
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
              <Cpu className="w-3 h-3" /> Powered by aiSETUP
            </span>
          </div>
          <p className="text-[10px] text-gray-300 hidden sm:block">
            SETUP Financial Assistance Program
          </p>
        </footer>
      </div>

      {/* ── Floating AI Chatbot (voice-enabled) ── */}
      <DOSTChatbot />
    </div>
  );
}