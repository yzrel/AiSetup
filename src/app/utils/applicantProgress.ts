/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  Applicant,
  MODULE_LABELS,
  MODULE_ORDER,
  ModuleStatus,
} from "../store/applicantStore";
import { AdminView } from "../store/authStore";

const REQUIRED_DOCUMENT_COUNT = 8;

const MODULE_TO_VIEW: Record<ModuleStatus, AdminView | null> = {
  prescreening: "prescreening",
  registration: "registration",
  "letter-of-intent": "letter-of-intent",
  requirements: "requirements",
  tna1: "tna1",
  tna2: "tna2",
  "project-proposal": "project-proposal",
  "conduct-rtec": null,
  "approval-letter": null,
  "landbank-withdrawal": "landbank-withdrawal",
  "procurement-liquidation": "procurement-liquidation",
  "refund-delinquent": null,
  completed: null,
};

const VIEW_TO_MODULE: Partial<Record<AdminView, ModuleStatus>> = {
  prescreening: "prescreening",
  registration: "registration",
  "letter-of-intent": "letter-of-intent",
  requirements: "requirements",
  tna1: "tna1",
  tna2: "tna2",
  "project-proposal": "project-proposal",
  "conduct-rtec": "conduct-rtec",
  "approval-letter": "approval-letter",
  "landbank-withdrawal": "landbank-withdrawal",
  "procurement-liquidation": "procurement-liquidation",
  "refund-delinquent": "refund-delinquent",
};

export type ProgressStatus = "completed" | "current" | "upcoming";

export interface ApplicantProgressStep {
  label: string;
  module: ModuleStatus;
  view: AdminView | null;
  status: ProgressStatus;
}

function stepsAfterRequirements(applicant: Applicant | null): ModuleStatus[] {
  if (applicant?.moduleData?.routingDecision === "mpex") {
    return [];
  }
  if (applicant?.moduleData?.routingDecision === "project-proposal") {
    return ["project-proposal"];
  }
  return ["tna1", "tna2", "project-proposal"];
}

function postApprovalSteps(applicant: Applicant | null): ModuleStatus[] {
  if (!applicant) return [];
  const currentIdx = MODULE_ORDER.indexOf(applicant.currentModule);
  const landbankIdx = MODULE_ORDER.indexOf("landbank-withdrawal");
  if (currentIdx < landbankIdx) return [];
  return ["landbank-withdrawal", "procurement-liquidation"];
}

export function getApplicantDashboardSteps(
  applicant: Applicant | null,
): ApplicantProgressStep[] {
  const modules: ModuleStatus[] = [
    "prescreening",
    "registration",
    "letter-of-intent",
    "requirements",
    ...stepsAfterRequirements(applicant),
    ...postApprovalSteps(applicant),
  ];

  const current = applicant?.currentModule ?? "prescreening";
  const currentIdx = MODULE_ORDER.indexOf(current);

  return modules.map((mod) => {
    const modIdx = MODULE_ORDER.indexOf(mod);
    let status: ProgressStatus = "upcoming";
    if (modIdx < currentIdx) status = "completed";
    else if (modIdx === currentIdx) status = "current";

    return {
      label: MODULE_LABELS[mod],
      module: mod,
      view: MODULE_TO_VIEW[mod],
      status,
    };
  });
}

export function moduleToApplicantView(
  module: ModuleStatus,
): AdminView | "dashboard" {
  if (
    module === "conduct-rtec" ||
    module === "approval-letter" ||
    module === "refund-delinquent" ||
    module === "completed"
  ) {
    return "dashboard";
  }
  return MODULE_TO_VIEW[module] ?? "prescreening";
}

export function isAwaitingStaffReview(applicant: Applicant | null): boolean {
  if (!applicant) return false;
  return (
    applicant.currentModule === "conduct-rtec" ||
    applicant.currentModule === "approval-letter"
  );
}

export function isRoutedToMpex(applicant: Applicant | null): boolean {
  return applicant?.moduleData?.routingDecision === "mpex";
}

export function getModuleIndex(module: ModuleStatus): number {
  const idx = MODULE_ORDER.indexOf(module);
  return idx === -1 ? 0 : idx;
}

/** Applicants may open dashboard, my-account, and modules up to their current step. Staff bypass this in App.tsx. */
export function canApplicantAccessView(
  applicant: Applicant | null,
  view: AdminView,
): boolean {
  if (view === "dashboard" || view === "my-account") return true;

  if (isRoutedToMpex(applicant)) {
    return view === "requirements";
  }

  const viewModule = VIEW_TO_MODULE[view];
  if (!viewModule) return false;

  const currentIdx = getModuleIndex(applicant?.currentModule ?? "prescreening");
  const viewIdx = getModuleIndex(viewModule);

  // Requirements approved but currentModule not yet advanced — unlock TNA1
  if (
    view === "tna1" &&
    applicant?.moduleData?.staffDecision === "approved" &&
    currentIdx <= getModuleIndex("requirements")
  ) {
    return true;
  }

  return viewIdx <= currentIdx;
}

export interface ApplicantDashboardStats {
  statusLabel: string;
  stageLabel: string;
  stepTrend: string;
  documentsSubmitted: number;
  documentsRequired: number;
  documentsSub: string;
  documentsTrend: string;
}

export function getApplicantDashboardStats(
  applicant: Applicant | null,
): ApplicantDashboardStats {
  const current = applicant?.currentModule ?? "prescreening";
  const currentIdx = getModuleIndex(current);
  const totalSteps = MODULE_ORDER.length;
  const stageLabel = MODULE_LABELS[current] ?? "Pre-Screening";

  let statusLabel = "In Progress";
  if (current === "completed") {
    statusLabel = "Completed";
  } else if (isRoutedToMpex(applicant)) {
    statusLabel = "MPEX Track";
  } else if (isAwaitingStaffReview(applicant)) {
    statusLabel = "Under DOST Review";
  } else if (
    applicant?.moduleData?.documentsSubmitted &&
    !applicant?.moduleData?.staffDecision
  ) {
    statusLabel = "Awaiting Review";
  } else if (applicant?.moduleData?.staffDecision === "needs-revision") {
    statusLabel = "Revisions Needed";
  }

  const documentsRequired = REQUIRED_DOCUMENT_COUNT;
  const documentsSubmitted = applicant?.moduleData?.documentsSubmitted
    ? (applicant.moduleData.documentsSubmittedList?.length ??
      documentsRequired)
    : 0;
  const remaining = Math.max(0, documentsRequired - documentsSubmitted);

  let documentsSub = "Requirements pending";
  if (applicant?.moduleData?.staffDecision === "approved") {
    documentsSub = "Documents verified";
  } else if (applicant?.moduleData?.staffDecision === "needs-revision") {
    documentsSub = "Corrections requested";
  } else if (applicant?.moduleData?.documentsSubmitted) {
    documentsSub = "With provincial office";
  }

  return {
    statusLabel,
    stageLabel,
    stepTrend: `Step ${currentIdx + 1} of ${totalSteps}`,
    documentsSubmitted,
    documentsRequired,
    documentsSub,
    documentsTrend:
      remaining > 0 ? `${remaining} remaining` : "All required docs in",
  };
}
