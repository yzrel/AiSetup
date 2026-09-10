/**
 * Author: Yzrel Jade B. Eborde
 *
 * Role-aware work queue for cooperator cases awaiting staff review or approval.
 */

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { applicantStore } from "../store/applicantStore";
import { authStore, type AdminView, type AuthUser } from "../store/authStore";
import { staffContextStore } from "../store/staffContextStore";
import { applicantMatchesSearch } from "../utils/applicantText";
import {
  handoffActionView,
  listPendingReview,
  type HandoffActor,
  type PendingReviewMode,
  type PendingReviewRow,
} from "../utils/workflowHandoff";
import {
  getApplicantsForStaff,
  getOfficeName,
  getStaffProvinces,
  resolveApplicantOfficeId,
  resolveApplicantProvince,
} from "../utils/provincialOffice";
import { MODULE_PAGE } from "./moduleTheme";
import {
  ResponsiveDataView,
  type ResponsiveColumn,
} from "./ui/responsive-data-view";

interface PendingReviewProps {
  user: AuthUser;
  onNavigate: (view: AdminView) => void;
}

const STAFF_ACTORS: HandoffActor[] = [
  "agent",
  "provincial-director",
  "rtec-staff",
  "regional-director",
  "casework",
];

function formatUpdated(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value || "—";
  return new Date(parsed).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function actorBadgeClass(actor: HandoffActor): string {
  switch (actor) {
    case "provincial-director":
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    case "rtec-staff":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "regional-director":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "casework":
      return "bg-cyan-50 text-cyan-700 border-cyan-100";
    default:
      return "bg-blue-50 text-blue-700 border-blue-100";
  }
}

export function PendingReview({ user, onNavigate }: PendingReviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [mode, setMode] = useState<PendingReviewMode>("mine");
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [actor, setActor] = useState<HandoffActor | "">("");

  useEffect(
    () => applicantStore.subscribe(() => setRefreshKey((value) => value + 1)),
    [],
  );

  const scopedApplicants = useMemo(
    () => getApplicantsForStaff(user),
    // refreshKey intentionally invalidates data read from the singleton store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, refreshKey],
  );
  const allPending = useMemo(
    () => listPendingReview(scopedApplicants, user, "all"),
    [scopedApplicants, user],
  );
  const myPending = useMemo(
    () => listPendingReview(scopedApplicants, user, "mine"),
    [scopedApplicants, user],
  );
  const queue = mode === "mine" ? myPending : allPending;
  const provinces = getStaffProvinces(user);

  const filtered = useMemo(() => {
    const query = search.trim();
    return queue.filter(({ applicant, handoff }) => {
      if (
        province &&
        resolveApplicantProvince(applicant).toLowerCase() !==
          province.toLowerCase()
      ) {
        return false;
      }
      if (actor && handoff.waitingOnRole !== actor) return false;
      return applicantMatchesSearch(applicant, query);
    });
  }, [queue, search, province, actor]);

  const counts = useMemo(
    () => ({
      provincial: allPending.filter(
        ({ handoff }) => handoff.waitingOnRole === "provincial-director",
      ).length,
      rtec: allPending.filter(
        ({ handoff }) => handoff.waitingOnRole === "rtec-staff",
      ).length,
      regional: allPending.filter(
        ({ handoff }) => handoff.waitingOnRole === "regional-director",
      ).length,
    }),
    [allPending],
  );

  const openAction = (row: PendingReviewRow) => {
    staffContextStore.setSelectedApplicant(row.applicant.id);
    const target = handoffActionView(row.handoff);
    if (authStore.canAccessView(user.role, target)) {
      onNavigate(target);
      return;
    }
    onNavigate(
      row.handoff.waitingOnRole === "rtec-staff" &&
        authStore.canAccessView(user.role, "conduct-rtec")
        ? "conduct-rtec"
        : "clients",
    );
  };

  const columns: ResponsiveColumn<PendingReviewRow>[] = [
    {
      key: "enterprise",
      header: "Cooperator",
      mobileLabel: "Cooperator",
      cell: ({ applicant }) => (
        <div>
          <p className="font-semibold text-gray-800">
            {applicant.enterpriseName}
          </p>
          <p className="text-xs text-gray-400">{applicant.applicationId}</p>
        </div>
      ),
    },
    {
      key: "office",
      header: "Province / Office",
      mobileLabel: "Province / Office",
      cell: ({ applicant }) => (
        <div className="text-xs">
          <p className="font-medium text-gray-700">
            {resolveApplicantProvince(applicant) || "Region XII"}
          </p>
          <p className="text-gray-400">
            {getOfficeName(resolveApplicantOfficeId(applicant))}
          </p>
        </div>
      ),
    },
    {
      key: "waiting",
      header: "Waiting on",
      mobileLabel: "Waiting on",
      cell: ({ handoff }) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${actorBadgeClass(handoff.waitingOnRole)}`}
        >
          {handoff.waitingOnLabel}
        </span>
      ),
    },
    {
      key: "action",
      header: "Required action",
      mobileLabel: "Required action",
      cell: ({ handoff }) => (
        <span className="text-xs text-gray-600">{handoff.nextAction}</span>
      ),
    },
    {
      key: "updated",
      header: "Last updated",
      mobileLabel: "Last updated",
      className: "whitespace-nowrap",
      cell: ({ applicant }) => (
        <span className="text-xs text-gray-500">
          {formatUpdated(applicant.lastUpdated)}
        </span>
      ),
    },
    {
      key: "open",
      header: "",
      hideOnMobile: true,
      className: "text-right",
      cell: () => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0C2461]">
          Open <ArrowRight className="h-3.5 w-3.5" />
        </span>
      ),
    },
  ];

  const cards = [
    {
      label: "My queue",
      value: myPending.length,
      icon: ClipboardCheck,
      color: "bg-[#0C2461]",
    },
    {
      label: "All pending",
      value: allPending.length,
      icon: Users,
      color: "bg-[#00AEEF]",
    },
    {
      label: "Provincial Director",
      value: counts.provincial,
      icon: Building2,
      color: "bg-indigo-600",
    },
    {
      label: "RTEC",
      value: counts.rtec,
      icon: ShieldCheck,
      color: "bg-amber-500",
    },
    {
      label: "Regional Director",
      value: counts.regional,
      icon: ShieldCheck,
      color: "bg-purple-600",
    },
  ];

  return (
    <div className={`${MODULE_PAGE} mx-auto max-w-7xl space-y-5`}>
      <div>
        <h1 className="text-xl font-black text-gray-800">Pending Review</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cooperators waiting for staff review, validation, or approval.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div
              className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}
            >
              <Icon className="h-4.5 w-4.5 text-white" />
            </div>
            <p className="text-2xl font-black text-gray-800">{value}</p>
            <p className="text-xs font-semibold text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="space-y-3 border-b border-gray-100 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-gray-800">Review queue</h2>
              <p className="text-xs text-gray-400">
                Oldest updated cases appear first.
              </p>
            </div>
            <div className="inline-flex self-start rounded-lg bg-gray-100 p-1">
              {(["mine", "all"] as PendingReviewMode[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    mode === value
                      ? "bg-white text-[#0C2461] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {value === "mine" ? "My queue" : "All pending"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search cooperator or application ID"
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <select
              value={province}
              onChange={(event) => setProvince(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              aria-label="Filter by province"
            >
              <option value="">All provinces in scope</option>
              {provinces.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={actor}
              onChange={(event) =>
                setActor(event.target.value as HandoffActor | "")
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              aria-label="Filter by waiting role"
            >
              <option value="">All review roles</option>
              {STAFF_ACTORS.map((value) => (
                <option key={value} value={value}>
                  {value === "casework"
                    ? "DOST staff"
                    : value === "agent"
                      ? "DOST Agent"
                      : value === "rtec-staff"
                        ? "RTEC Staff"
                        : value === "provincial-director"
                          ? "Provincial Director"
                          : "Regional Director"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ResponsiveDataView
          rows={filtered}
          columns={columns}
          getRowKey={({ applicant }) => applicant.id}
          onRowClick={openAction}
          emptyMessage={
            mode === "mine"
              ? "No cooperators waiting on your review."
              : "No pending staff reviews in your scope."
          }
          className="p-4 sm:p-5"
          desktopClassName="overflow-hidden rounded-xl border border-gray-100"
        />
      </div>
    </div>
  );
}
