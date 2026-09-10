/**
 * Author: Yzrel Jade B. Eborde
 *
 * Single source of truth for "who acts next" across the SETUP pipeline
 * (Pre-Screening through Approval Letter conforme).
 *
 * Applicant banners, staff module strips, and notification copy all read from
 * here so a cooperator, PSTO agent, Provincial Director, RTEC staff, and the
 * Regional Director always see the same handoff state for a case.
 */

import {
  Applicant,
  normalizeCurrentModule,
  type ModuleStatus,
} from "../store/applicantStore";
import {
  ROLE_LABELS,
  type AdminView,
  type AuthUser,
  type UserRole,
} from "../store/authStore";
import { formatFormMention } from "../constants/setupForms";
import { getApprovalLetterStored } from "./approvalLetter";
import { getRtecReportStored } from "./rtecReport";
import { getPublishedTna2 } from "./tnaForm02";

/** Who the case is waiting on. `cooperator` = the applicant themselves. */
export type HandoffActor =
  | "cooperator"
  | "agent"
  | "provincial-director"
  | "rtec-staff"
  | "regional-director"
  | "casework"
  | "none";

export type HandoffStage =
  | "prescreening"
  | "registration"
  | "letter-of-intent"
  | "tna1-submit"
  | "tna1-staff-review"
  | "tna1-awaiting-director"
  | "tna2-publish"
  | "project-proposal"
  | "requirements-upload"
  | "requirements-review"
  | "requirements-routing"
  | "mpex"
  | "rtec-evaluation"
  | "approval-draft"
  | "approval-awaiting-rd"
  | "approval-disapproved"
  | "approval-publish"
  | "approval-conforme"
  | "post-conforme";

export interface WorkflowHandoff {
  stage: HandoffStage;
  /** Role expected to act next. */
  waitingOnRole: HandoffActor;
  /** Human label for the actor (e.g. "Regional Director"). */
  waitingOnLabel: string;
  /** Short imperative describing the next action. */
  nextAction: string;
  /** Banner heading shown to the cooperator. */
  applicantTitle: string;
  /** Copy addressed to the cooperator. */
  applicantMessage: string;
  /** Copy addressed to DOST staff. */
  staffMessage: string;
}

/** Staff roles that may be addressed by a targeted notification. */
export const CASEWORK_NOTIFY_ROLES: UserRole[] = [
  "agent",
  "provincial-director",
];

const ACTOR_LABELS: Record<HandoffActor, string> = {
  cooperator: "Cooperator",
  agent: ROLE_LABELS.agent,
  "provincial-director": ROLE_LABELS["provincial-director"],
  "rtec-staff": ROLE_LABELS["rtec-staff"],
  "regional-director": ROLE_LABELS["regional-director"],
  casework: "DOST staff",
  none: "No action pending",
};

/**
 * Staff roles that should receive an in-app notification when a case reaches
 * this handoff. Empty means "no targeted staff row" (cooperator-only step).
 */
export function handoffNotifyRoles(actor: HandoffActor): UserRole[] {
  switch (actor) {
    case "agent":
      return ["agent", "provincial-director"];
    case "provincial-director":
      return ["provincial-director"];
    case "rtec-staff":
      return ["rtec-staff"];
    case "regional-director":
      return ["regional-director"];
    case "casework":
      return CASEWORK_NOTIFY_ROLES;
    default:
      return [];
  }
}

const PENDING_REVIEW_STAGES: ReadonlySet<HandoffStage> = new Set([
  "tna1-staff-review",
  "tna1-awaiting-director",
  "tna2-publish",
  "requirements-review",
  "requirements-routing",
  "rtec-evaluation",
  "approval-draft",
  "approval-awaiting-rd",
  "approval-disapproved",
  "approval-publish",
]);

export type PendingReviewMode = "mine" | "all";

export interface PendingReviewRow {
  applicant: Applicant;
  handoff: WorkflowHandoff;
}

/** True only for review/approval handoffs, excluding cooperator and monitoring work. */
export function isStaffPendingHandoff(handoff: WorkflowHandoff): boolean {
  return PENDING_REVIEW_STAGES.has(handoff.stage);
}

/** Resolve the module staff should open to complete a pending handoff. */
export function handoffActionView(handoff: WorkflowHandoff): AdminView {
  switch (handoff.stage) {
    case "tna1-staff-review":
    case "tna1-awaiting-director":
      return "tna1";
    case "tna2-publish":
      return "tna2";
    case "requirements-review":
    case "requirements-routing":
      return "requirements";
    case "rtec-evaluation":
      return "conduct-rtec";
    default:
      return "approval-letter";
  }
}

/** Whether the pending handoff belongs in a staff member's personal queue. */
export function isInRoleQueue(
  handoff: WorkflowHandoff,
  role: UserRole,
): boolean {
  if (!isStaffPendingHandoff(handoff)) return false;
  if (role === "admin") return true;
  return handoffNotifyRoles(handoff.waitingOnRole).includes(role);
}

/** Build a role-aware pending review queue from an already office-scoped list. */
export function listPendingReview(
  applicants: Applicant[],
  user: Pick<AuthUser, "role">,
  mode: PendingReviewMode = "mine",
): PendingReviewRow[] {
  return applicants
    .map((applicant) => ({
      applicant,
      handoff: getWorkflowHandoff(applicant),
    }))
    .filter(({ handoff }) =>
      mode === "mine"
        ? isInRoleQueue(handoff, user.role)
        : isStaffPendingHandoff(handoff),
    )
    .sort((a, b) => {
      const aTime = Date.parse(a.applicant.lastUpdated);
      const bTime = Date.parse(b.applicant.lastUpdated);
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return a.applicant.enterpriseName.localeCompare(
          b.applicant.enterpriseName,
        );
      }
      return aTime - bTime;
    });
}

interface Tna1Flags {
  submitted: boolean;
  staffReviewed: boolean;
  directorValidated: boolean;
}

function tna1Flags(applicant: Applicant | null): Tna1Flags {
  const tna1 = applicant?.moduleData?.tna1 as
    | {
        submitted?: boolean;
        staffReviewed?: boolean;
        directorValidated?: boolean;
      }
    | undefined;
  return {
    submitted: !!tna1?.submitted,
    staffReviewed: !!tna1?.staffReviewed,
    directorValidated: !!tna1?.directorValidated,
  };
}

function isMpexTrack(applicant: Applicant | null): boolean {
  return applicant?.moduleData?.routingDecision === "mpex";
}

function requirementsApproved(applicant: Applicant | null): boolean {
  return applicant?.moduleData?.staffDecision === "approved";
}

/** `setup` is a legacy routing value from older e2e tooling, accepted on read. */
function routedToRtec(applicant: Applicant | null): boolean {
  const routing = applicant?.moduleData?.routingDecision;
  return routing === "conduct-rtec" || routing === "setup";
}

/** Banner headings shown to the cooperator per stage. */
const STAGE_TITLES: Record<HandoffStage, string> = {
  prescreening: "Pre-screening pending",
  registration: "Enterprise registration pending",
  "letter-of-intent": "Letter of Intent pending",
  "tna1-submit": "TNA application pending",
  "tna1-staff-review": "Under review by DOST",
  "tna1-awaiting-director": "Awaiting Provincial Director validation",
  "tna2-publish": "TNA Report being prepared",
  "project-proposal": "Project Proposal pending",
  "requirements-upload": "Requirements pending",
  "requirements-review": "Submitted — Awaiting DOST Review",
  "requirements-routing": "Documents verified — awaiting routing",
  mpex: "Routed to MPEX track",
  "rtec-evaluation": "RTEC evaluation in progress",
  "approval-draft": "Approval letter being prepared",
  "approval-awaiting-rd": "Awaiting Regional Director decision",
  "approval-disapproved": "Application not approved",
  "approval-publish": "Approval letter being finalized",
  "approval-conforme": "Notice of Approval ready for conforme",
  "post-conforme": "Under review by DOST",
};

function build(
  stage: HandoffStage,
  waitingOnRole: HandoffActor,
  nextAction: string,
  applicantMessage: string,
  staffMessage: string,
): WorkflowHandoff {
  return {
    stage,
    waitingOnRole,
    waitingOnLabel: ACTOR_LABELS[waitingOnRole],
    nextAction,
    applicantTitle: STAGE_TITLES[stage],
    applicantMessage,
    staffMessage,
  };
}

function requirementsHandoff(applicant: Applicant | null): WorkflowHandoff {
  if (isMpexTrack(applicant)) {
    return build(
      "mpex",
      "casework",
      "Coordinate MPEX capacity building",
      "Your enterprise was routed to the MPEX capacity-building track before SETUP assistance can proceed.",
      "Case routed to MPEX. SETUP modules stay locked until the enterprise re-applies.",
    );
  }

  if (!applicant?.moduleData?.documentsSubmitted) {
    return build(
      "requirements-upload",
      "cooperator",
      "Upload documentary requirements",
      "Upload your documentary requirements so your provincial DOST office can verify them.",
      "Waiting for the cooperator to submit documentary requirements.",
    );
  }

  if (!requirementsApproved(applicant)) {
    return build(
      "requirements-review",
      "agent",
      "Verify submitted documents",
      "Your requirements are with your provincial DOST office for verification.",
      "Verify the submitted documents, then record the verification decision.",
    );
  }

  return build(
    "requirements-routing",
    "agent",
    "Confirm routing to RTEC evaluation",
    "Your documents are verified. Your provincial DOST office is routing your case for RTEC evaluation.",
    `Documents are verified. Confirm routing to ${formatFormMention("002")} evaluation to hand the case to RTEC Staff.`,
  );
}

function approvalLetterHandoff(applicant: Applicant | null): WorkflowHandoff {
  const stored = getApprovalLetterStored(applicant);

  if (stored?.rdDecision === "disapproved") {
    return build(
      "approval-disapproved",
      "casework",
      "Revise and re-endorse for Regional Director",
      "The Regional Director did not approve your Notice of Approval. DOST staff may revise and re-endorse your case.",
      "Regional Director disapproved the Notice. Revise the draft, then send it to the Regional Director again.",
    );
  }

  if (stored?.acknowledged) {
    return build(
      "post-conforme",
      "casework",
      "Proceed to MOA signing and LandBank enrollment",
      "Your conforme is recorded. DOST staff will continue with MOA signing and fund release.",
      "Cooperator conforme recorded. Continue with MOA signing and LandBank enrollment.",
    );
  }

  if (stored?.published) {
    return build(
      "approval-conforme",
      "cooperator",
      "Acknowledge conforme on the Notice of Approval",
      "Your Notice of Approval is published. Review it and sign your conforme to proceed.",
      "Notice published. Waiting for the cooperator to acknowledge conforme.",
    );
  }

  if (stored?.rdDecision === "approved") {
    return build(
      "approval-publish",
      "casework",
      "Publish the Notice of Approval",
      "The Regional Director approved your project. DOST staff are finalizing your Notice of Approval.",
      "Regional Director approved. Publish the Notice so the cooperator can sign conforme.",
    );
  }

  if (stored?.readyForRdAt) {
    return build(
      "approval-awaiting-rd",
      "regional-director",
      "Approve or disapprove the Notice of Approval",
      "Your RTEC evaluation is complete. The Regional Director must decide on your Notice of Approval before you can proceed.",
      "Notice of Approval is endorsed and awaiting the Regional Director's decision.",
    );
  }

  return build(
    "approval-draft",
    "casework",
    "Prepare the Notice of Approval and send it to the Regional Director",
    "Your RTEC evaluation is complete. DOST staff are preparing your Notice of Approval for the Regional Director.",
    "Prepare the Notice of Approval, then send it to the Regional Director for decision.",
  );
}

/**
 * Resolve the current handoff for a case. Derived from `currentModule` plus the
 * flags that actually gate each hop, so an out-of-order staff action cannot
 * make the banner claim progress the system of record does not have.
 */
export function getWorkflowHandoff(
  applicant: Applicant | null,
): WorkflowHandoff {
  if (!applicant) {
    return build(
      "prescreening",
      "cooperator",
      "Complete online pre-screening",
      "Complete pre-screening to start your SETUP application.",
      "No case selected.",
    );
  }

  if (isMpexTrack(applicant)) {
    return requirementsHandoff(applicant);
  }

  const current = normalizeCurrentModule(applicant.currentModule);

  switch (current) {
    case "prescreening":
      return build(
        "prescreening",
        "cooperator",
        "Complete online pre-screening",
        "Complete pre-screening to start your SETUP application.",
        "Waiting for the cooperator to finish pre-screening.",
      );

    case "registration":
      return build(
        "registration",
        "cooperator",
        "Complete enterprise registration",
        "Complete your enterprise registration details.",
        "Waiting for the cooperator to complete enterprise registration.",
      );

    case "letter-of-intent":
      return build(
        "letter-of-intent",
        "cooperator",
        "Submit the Letter of Intent",
        "Submit your Letter of Intent to your provincial DOST office.",
        "Waiting for the cooperator's Letter of Intent.",
      );

    case "tna1": {
      const flags = tna1Flags(applicant);
      if (!flags.submitted) {
        return build(
          "tna1-submit",
          "cooperator",
          `Submit ${formatFormMention("tna01")}`,
          `Complete and submit your ${formatFormMention("tna01")} application.`,
          `Waiting for the cooperator's ${formatFormMention("tna01")}.`,
        );
      }
      if (!flags.staffReviewed) {
        return build(
          "tna1-staff-review",
          "agent",
          `Review ${formatFormMention("tna01")}`,
          `Your ${formatFormMention("tna01")} is under review by your provincial DOST office.`,
          `Review the submitted ${formatFormMention("tna01")} and record the staff assessment.`,
        );
      }
      if (!flags.directorValidated) {
        return build(
          "tna1-awaiting-director",
          "provincial-director",
          `Validate ${formatFormMention("tna01")}`,
          `Your ${formatFormMention("tna01")} is awaiting Provincial Director validation.`,
          `Provincial Director validation is required on ${formatFormMention("tna01")} before the TNA Report.`,
        );
      }
      return build(
        "tna2-publish",
        "agent",
        `Prepare and publish ${formatFormMention("tna02")}`,
        `Your ${formatFormMention("tna01")} is validated. DOST staff are preparing your TNA Report.`,
        `${formatFormMention("tna01")} is validated. Prepare and publish ${formatFormMention("tna02")}.`,
      );
    }

    case "tna2": {
      if (!getPublishedTna2(applicant)) {
        return build(
          "tna2-publish",
          "agent",
          `Publish ${formatFormMention("tna02")}`,
          "DOST staff are preparing your TNA Report. You will be notified once it is published.",
          `Publish ${formatFormMention("tna02")} so the cooperator can proceed to the Project Proposal.`,
        );
      }
      return build(
        "project-proposal",
        "cooperator",
        `Prepare ${formatFormMention("001")}`,
        `Your TNA Report is published. Continue with your ${formatFormMention("001")}.`,
        "TNA Report published. Waiting for the cooperator's Project Proposal.",
      );
    }

    case "project-proposal":
      return build(
        "project-proposal",
        "cooperator",
        `Submit ${formatFormMention("001")}`,
        `Complete and submit your ${formatFormMention("001")}.`,
        `Waiting for the cooperator's ${formatFormMention("001")}.`,
      );

    case "requirements":
      return requirementsHandoff(applicant);

    case "conduct-rtec": {
      const stored = getRtecReportStored(applicant);
      if (!routedToRtec(applicant)) {
        return build(
          "requirements-routing",
          "agent",
          "Confirm routing to RTEC evaluation",
          "Your documents are verified. Your provincial DOST office is routing your case for RTEC evaluation.",
          `Routing is not recorded yet. Confirm routing to ${formatFormMention("002")} so RTEC Staff can mark the report complete.`,
        );
      }
      if (stored?.submitted) {
        return build(
          "approval-draft",
          "casework",
          "Prepare the Notice of Approval",
          "Your RTEC evaluation is complete. DOST staff are preparing your Notice of Approval.",
          "RTEC report is complete. Prepare the Notice of Approval.",
        );
      }
      return build(
        "rtec-evaluation",
        "rtec-staff",
        `Complete ${formatFormMention("002")}`,
        `DOST is preparing your ${formatFormMention("002")} review. You will be notified when the approval letter is ready for your conforme.`,
        `Complete ${formatFormMention("002")} for this case, then mark the report complete.`,
      );
    }

    case "approval-letter":
      return approvalLetterHandoff(applicant);

    case "completed":
      return build(
        "post-conforme",
        "none",
        "No action pending",
        "Your SETUP project is complete.",
        "Case complete.",
      );

    default:
      return build(
        "post-conforme",
        "casework",
        "Continue fund release and monitoring",
        "Your project is in the fund release and monitoring stages.",
        "Continue with fund release and monitoring for this case.",
      );
  }
}

/** Compact "Waiting on: …" strip text for staff module headers. */
export function formatHandoffStrip(handoff: WorkflowHandoff): string {
  if (handoff.waitingOnRole === "none") return handoff.nextAction;
  return `Waiting on ${handoff.waitingOnLabel} — ${handoff.nextAction}`;
}

/** Module keys whose handoff copy is authored here (used by banners/tests). */
export const HANDOFF_MODULES: readonly ModuleStatus[] = [
  "prescreening",
  "registration",
  "letter-of-intent",
  "tna1",
  "tna2",
  "project-proposal",
  "requirements",
  "conduct-rtec",
  "approval-letter",
];
