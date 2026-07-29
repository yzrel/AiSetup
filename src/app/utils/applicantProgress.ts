/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  Applicant,
  MODULE_LABELS,
  MODULE_ORDER,
  ModuleStatus,
  normalizeCurrentModule,
} from "../store/applicantStore";
import { AdminView } from "../store/authStore";
import { isDemoModeActive } from "./demoMode";
import { formatFormMention } from "../constants/setupForms";
import {
  buildRequirementUploadList,
  countRequiredUploads,
} from "./submissionRequirements";
import {
  getOfficialChecklistStepCount,
  getProprietorTrackLabel,
} from "./proprietorTrack";
import { getSignedMoa } from "./approvalLetter";
import { hasPdcsRecordedForDisbursement } from "./refundDelinquent";

function countRequiredDocuments(applicant: Applicant | null): number {
  const uploads = buildRequirementUploadList(applicant);
  return countRequiredUploads(uploads).required;
}

const MODULE_TO_VIEW: Record<ModuleStatus, AdminView | null> = {
  prescreening: "prescreening",
  registration: "registration",
  "letter-of-intent": "letter-of-intent",
  requirements: "requirements",
  tna1: "tna1",
  tna2: "tna2",
  "project-proposal": "project-proposal",
  "conduct-rtec": null,
  "approval-letter": "approval-letter",
  "project-information-sheet": "landbank-withdrawal",
  "landbank-withdrawal": "landbank-withdrawal",
  "procurement-liquidation": "procurement-liquidation",
  "refund-delinquent": "refund-delinquent",
  "project-closeout": "project-closeout",
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
  "project-information-sheet": "landbank-withdrawal",
  "landbank-withdrawal": "landbank-withdrawal",
  "procurement-liquidation": "procurement-liquidation",
  "refund-delinquent": "refund-delinquent",
  "project-closeout": "project-closeout",
};

export type ProgressStatus = "completed" | "current" | "upcoming";

export interface ApplicantProgressStep {
  label: string;
  module: ModuleStatus;
  view: AdminView | null;
  status: ProgressStatus;
}

function stepsAfterTna(_applicant: Applicant | null): ModuleStatus[] {
  return ["project-proposal", "requirements"];
}

function postApprovalSteps(applicant: Applicant | null): ModuleStatus[] {
  if (!applicant) return [];
  const currentIdx = MODULE_ORDER.indexOf(
    normalizeCurrentModule(applicant.currentModule),
  );
  const approvalIdx = MODULE_ORDER.indexOf("approval-letter");
  const landbankIdx = MODULE_ORDER.indexOf("landbank-withdrawal");
  const procurementIdx = MODULE_ORDER.indexOf("procurement-liquidation");
  const closeoutIdx = MODULE_ORDER.indexOf("project-closeout");
  const steps: ModuleStatus[] = [];
  if (currentIdx >= approvalIdx) {
    steps.push("approval-letter");
  }
  if (currentIdx >= landbankIdx) {
    steps.push("landbank-withdrawal", "procurement-liquidation");
  }
  if (currentIdx >= procurementIdx) {
    steps.push("refund-delinquent");
  }
  if (currentIdx >= closeoutIdx) {
    steps.push("project-closeout");
  }
  return steps;
}

function evaluationSteps(applicant: Applicant | null): ModuleStatus[] {
  if (!applicant) return [];
  const currentIdx = MODULE_ORDER.indexOf(
    normalizeCurrentModule(applicant.currentModule),
  );
  const rtecIdx = MODULE_ORDER.indexOf("conduct-rtec");
  if (currentIdx >= rtecIdx) {
    return ["conduct-rtec"];
  }
  return [];
}

export function getApplicantDashboardSteps(
  applicant: Applicant | null,
): ApplicantProgressStep[] {
  const modules: ModuleStatus[] = [
    "prescreening",
    "registration",
    "letter-of-intent",
    "tna1",
    "tna2",
    ...stepsAfterTna(applicant),
    ...evaluationSteps(applicant),
    ...postApprovalSteps(applicant),
  ];

  const current = normalizeCurrentModule(
    applicant?.currentModule ?? "prescreening",
  );
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
  const resolved = normalizeCurrentModule(module);
  if (resolved === "conduct-rtec" || resolved === "completed") {
    return "dashboard";
  }
  return MODULE_TO_VIEW[resolved] ?? "prescreening";
}

export function isAwaitingStaffReview(applicant: Applicant | null): boolean {
  if (!applicant) return false;
  const current = normalizeCurrentModule(applicant.currentModule);
  if (current === "conduct-rtec") return true;
  if (current === "approval-letter") {
    const stored = applicant.moduleData?.approvalLetter as
      | { published?: boolean }
      | undefined;
    return !stored?.published;
  }
  if (current === "landbank-withdrawal") {
    return !getSignedMoa(applicant) || !hasPdcsRecordedForDisbursement(applicant);
  }
  return false;
}

export function getAwaitingStaffReviewMessage(
  applicant: Applicant | null,
): { title: string; body: string } {
  if (!applicant) {
    return {
      title: "Under review by DOST",
      body: "Your application is with DOST personnel for evaluation. You will be notified when you can proceed.",
    };
  }
  const current = normalizeCurrentModule(applicant.currentModule);
  if (current === "conduct-rtec") {
    return {
      title: "RTEC evaluation in progress",
      body: `DOST is preparing your ${formatFormMention("002")} review. You will be notified when the approval letter is ready for your conforme.`,
    };
  }
  if (current === "approval-letter") {
    return {
      title: "Approval letter being prepared",
      body: "DOST is finalizing your Notice of Approval. You will be able to acknowledge conforme once it is published.",
    };
  }
  if (current === "landbank-withdrawal") {
    return {
      title: "MOA and PDCs in progress",
      body: "DOST is coordinating MOA signing and post-dated check (PDC) recording. LandBank enrollment unlocks after both are on file.",
    };
  }
  return {
    title: "Under review by DOST",
    body: "Your application is with DOST personnel for evaluation. You will be notified when you can proceed.",
  };
}

export function isRoutedToMpex(applicant: Applicant | null): boolean {
  return applicant?.moduleData?.routingDecision === "mpex";
}

/** Unqualified applicant who selected a recommended non-SETUP program (program LOI track). */
export function isOnProgramTrack(applicant: Applicant | null): boolean {
  if (!applicant || applicant.qualified) return false;
  return Boolean(String(applicant.moduleData?.selectedProgramId ?? "").trim());
}

export function getModuleIndex(module: ModuleStatus): number {
  const idx = MODULE_ORDER.indexOf(normalizeCurrentModule(module));
  return idx === -1 ? 0 : idx;
}

export function isApplicantViewLocked(
  applicant: Applicant | null,
  view: AdminView,
): boolean {
  if (view === "dashboard" || view === "my-account" || view === "sent-emails")
    return false;

  if (isRoutedToMpex(applicant)) {
    return view !== "requirements";
  }

  // Program referral track: only pre-screening + program LOI (no SETUP seed-fund modules).
  if (isOnProgramTrack(applicant)) {
    return view !== "prescreening" && view !== "letter-of-intent";
  }

  const viewModule = VIEW_TO_MODULE[view];
  if (!viewModule) return true;

  const currentIdx = getModuleIndex(applicant?.currentModule ?? "prescreening");
  const viewIdx = getModuleIndex(viewModule);

  return viewIdx > currentIdx;
}

export function canApplicantAccessView(
  applicant: Applicant | null,
  view: AdminView,
): boolean {
  if (isDemoModeActive()) return true;
  return !isApplicantViewLocked(applicant, view);
}

export interface ApplicantDashboardStats {
  statusLabel: string;
  stageLabel: string;
  stepTrend: string;
  proprietorTrackLabel: string;
  officialChecklistSteps: number;
  documentsSubmitted: number;
  documentsRequired: number;
  documentsSub: string;
  documentsTrend: string;
}

export function getApplicantDashboardStats(
  applicant: Applicant | null,
): ApplicantDashboardStats {
  const current = normalizeCurrentModule(
    applicant?.currentModule ?? "prescreening",
  );
  const currentIdx = getModuleIndex(current);
  const totalSteps = MODULE_ORDER.length;
  const stageLabel = MODULE_LABELS[current] ?? "Pre-Screening";

  let statusLabel = "In Progress";
  if (current === "completed") {
    statusLabel = "Completed";
  } else if (isRoutedToMpex(applicant)) {
    statusLabel = "MPEX Track";
  } else if (isOnProgramTrack(applicant)) {
    statusLabel = "Program Referral";
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

  const documentsRequired = countRequiredDocuments(applicant);
  const uploads = applicant?.moduleData?.requirementUploads as
    | { uploaded?: boolean }[]
    | undefined;
  const documentsSubmitted = uploads
    ? uploads.filter((u) => u.uploaded).length
    : applicant?.moduleData?.documentsSubmitted
      ? (applicant.moduleData.documentsSubmittedList?.length ?? documentsRequired)
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
    stepTrend: `Module ${currentIdx + 1} of ${totalSteps} · ${getOfficialChecklistStepCount(applicant)}-step ${getProprietorTrackLabel(applicant)} track`,
    proprietorTrackLabel: getProprietorTrackLabel(applicant),
    officialChecklistSteps: getOfficialChecklistStepCount(applicant),
    documentsSubmitted,
    documentsRequired,
    documentsSub,
    documentsTrend:
      remaining > 0 ? `${remaining} remaining` : "All required docs in",
  };
}
