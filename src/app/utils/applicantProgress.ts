import {
  Applicant,
  MODULE_LABELS,
  MODULE_ORDER,
  ModuleStatus,
} from "../store/applicantStore";
import { AdminView } from "../store/authStore";

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

export type ProgressStatus = "completed" | "current" | "upcoming";

export interface ApplicantProgressStep {
  label: string;
  module: ModuleStatus;
  view: AdminView | null;
  status: ProgressStatus;
}

function stepsAfterRequirements(applicant: Applicant | null): ModuleStatus[] {
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
