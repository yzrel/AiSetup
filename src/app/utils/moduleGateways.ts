/**
 * Author: Yzrel Jade B. Eborde
 *
 * Single FE source of truth for SETUP module completeness and advance gates.
 * Demo mode opens blocking checks; callers still show amber via validators.
 */

import {
  applicantStore,
  Applicant,
  MODULE_ORDER,
  ModuleStatus,
  normalizeCurrentModule,
} from "../store/applicantStore";
import type { UserRole } from "../store/authStore";
import { isDemoModeActive } from "./demoMode";
import {
  hasRdApprovedNotice,
  getSignedMoa,
} from "./approvalLetter";
import { hasApprovalLetterAcknowledged } from "./projectInformationSheet";
import { getPublishedTna2 } from "./tnaForm02";
import {
  getProjectProposalStored,
} from "./projectProposal";
import { hasLandBankComplete } from "./landBankWithdrawal";
import { hasProcurementComplete } from "./procurementLiquidation";
import { hasRefundComplete } from "./refundDelinquent";
import { hasCloseOutComplete } from "./projectCloseOut";
import { tin as tinValid, requiredTrimmed } from "./fieldValidators";

export interface ModuleGateResult {
  ok: boolean;
  reason?: string;
  next?: ModuleStatus;
}

function isOnProgramTrackLocal(applicant: Applicant | null): boolean {
  if (!applicant || applicant.qualified) return false;
  return Boolean(String(applicant.moduleData?.selectedProgramId ?? "").trim());
}

function isRoutedToMpexLocal(applicant: Applicant | null): boolean {
  return applicant?.moduleData?.routingDecision === "mpex";
}

function tna1Flags(applicant: Applicant | null): {
  submitted: boolean;
  staffReviewed: boolean;
  directorValidated: boolean;
} {
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

function hasLoiDocument(applicant: Applicant | null): boolean {
  if (!applicant?.moduleData?.loiDocument) return false;
  return typeof applicant.moduleData.loiDocument === "object";
}

function hasRegistrationComplete(applicant: Applicant | null): boolean {
  if (!applicant) return false;
  const tin = String(applicant.moduleData?.tinNumber ?? "");
  if (requiredTrimmed(applicant.enterpriseName, "Enterprise name")) return false;
  if (tinValid(tin)) return false;
  return true;
}

function hasRtecSubmitted(applicant: Applicant | null): boolean {
  const report =
    (applicant?.moduleData?.rtecReport as { submitted?: boolean } | undefined) ??
    (applicant?.moduleData?.conductRtec as { submitted?: boolean } | undefined);
  return !!report?.submitted;
}

/**
 * Official required content / staff flags for a module before the next hop.
 */
export function isModuleComplete(
  applicant: Applicant | null,
  module: ModuleStatus,
): boolean {
  if (!applicant) return false;
  const mod = normalizeCurrentModule(module);

  switch (mod) {
    case "prescreening":
      return applicant.qualified === true || isOnProgramTrackLocal(applicant);
    case "registration":
      return hasRegistrationComplete(applicant);
    case "letter-of-intent":
      return hasLoiDocument(applicant);
    case "tna1": {
      const f = tna1Flags(applicant);
      return f.submitted && f.staffReviewed && f.directorValidated;
    }
    case "tna2":
      return !!getPublishedTna2(applicant);
    case "project-proposal": {
      const stored = getProjectProposalStored(applicant);
      return !!(stored?.submitted && stored?.staffReviewed);
    }
    case "requirements":
      return (
        applicant.moduleData?.staffDecision === "approved" &&
        (applicant.moduleData?.routingDecision === "conduct-rtec" ||
          applicant.moduleData?.routingDecision === "mpex")
      );
    case "conduct-rtec":
      return hasRtecSubmitted(applicant);
    case "approval-letter":
      return (
        hasRdApprovedNotice(applicant) &&
        hasApprovalLetterAcknowledged(applicant)
      );
    case "landbank-withdrawal":
    case "project-information-sheet":
      return hasLandBankComplete(applicant);
    case "procurement-liquidation":
      return hasProcurementComplete(applicant);
    case "refund-delinquent":
      return hasRefundComplete(applicant);
    case "project-closeout":
      return hasCloseOutComplete(applicant);
    case "completed":
      return true;
    default:
      return false;
  }
}

export function nextModuleAfter(module: ModuleStatus): ModuleStatus | null {
  const idx = MODULE_ORDER.indexOf(normalizeCurrentModule(module));
  if (idx < 0 || idx >= MODULE_ORDER.length - 1) return null;
  return MODULE_ORDER[idx + 1];
}

/**
 * Whether advancing from `module` to the next MODULE_ORDER step is allowed.
 * Demo mode always allows (amber warnings remain in UI validators).
 */
export function canAdvanceFrom(
  applicant: Applicant | null,
  module: ModuleStatus,
  _role?: UserRole | null,
): ModuleGateResult {
  if (isDemoModeActive()) {
    const next = nextModuleAfter(module);
    return { ok: true, next: next ?? undefined };
  }
  if (!applicant) {
    return { ok: false, reason: "No applicant case loaded." };
  }

  const from = normalizeCurrentModule(module);
  const next = nextModuleAfter(from);
  if (!next) {
    return { ok: false, reason: "Already at the terminal module." };
  }

  if (isOnProgramTrackLocal(applicant)) {
    if (
      from === "letter-of-intent" ||
      MODULE_ORDER.indexOf(next) > MODULE_ORDER.indexOf("letter-of-intent")
    ) {
      return {
        ok: false,
        reason: "Program referral track ends at the Letter of Intent.",
      };
    }
  }

  if (isRoutedToMpexLocal(applicant) && from === "requirements") {
    return {
      ok: false,
      reason: "MPEX-routed cases stay on Submission Requirements.",
    };
  }

  if (!isModuleComplete(applicant, from)) {
    return {
      ok: false,
      reason: `Complete ${from} before proceeding.`,
      next,
    };
  }

  if (next === "tna2" && !tna1Flags(applicant).directorValidated) {
    return {
      ok: false,
      reason: "Provincial Director must validate TNA Form 01 first.",
      next,
    };
  }
  if (next === "project-proposal" && !getPublishedTna2(applicant)) {
    return {
      ok: false,
      reason: "Staff must publish TNA Form 02 before the Project Proposal.",
      next,
    };
  }
  if (next === "conduct-rtec") {
    if (applicant.moduleData?.staffDecision !== "approved") {
      return {
        ok: false,
        reason: "Requirements must be staff-approved before RTEC.",
        next,
      };
    }
    if (applicant.moduleData?.routingDecision !== "conduct-rtec") {
      return {
        ok: false,
        reason: "Case is not routed to Conduct of RTEC.",
        next,
      };
    }
  }
  if (next === "landbank-withdrawal") {
    if (!hasRdApprovedNotice(applicant)) {
      return {
        ok: false,
        reason: "Notice of Approval must be RD-approved and published.",
        next,
      };
    }
    if (!hasApprovalLetterAcknowledged(applicant)) {
      return {
        ok: false,
        reason:
          "Applicant must acknowledge conforme on the Notice of Approval.",
        next,
      };
    }
  }

  return { ok: true, next };
}

/**
 * Apply a module advance when the gate allows. Returns the gate result.
 */
export function tryAdvanceModule(
  applicantId: string,
  fromModule: ModuleStatus,
  role?: UserRole | null,
): ModuleGateResult {
  const applicant = applicantStore.getById(applicantId) ?? null;
  const result = canAdvanceFrom(applicant, fromModule, role);
  if (!result.ok || !result.next) return result;
  applicantStore.update(applicantId, { currentModule: result.next });
  return result;
}

/**
 * Extra content locks for applicant views (beyond currentModule index).
 * Does not rewind currentModule; only blocks opening later views early.
 * RD + conforme still lock LandBank+ even if currentModule jumped ahead.
 */
export function isContentGateBlockingView(
  applicant: Applicant | null,
  viewModule: ModuleStatus,
): boolean {
  if (!applicant || isDemoModeActive()) return false;
  const viewIdx = MODULE_ORDER.indexOf(normalizeCurrentModule(viewModule));
  if (viewIdx < 0) return false;

  const currentIdx = MODULE_ORDER.indexOf(
    normalizeCurrentModule(applicant.currentModule),
  );
  const tna2Idx = MODULE_ORDER.indexOf("tna2");
  const ppIdx = MODULE_ORDER.indexOf("project-proposal");
  const approvalIdx = MODULE_ORDER.indexOf("approval-letter");

  if (viewIdx > approvalIdx) {
    if (!hasRdApprovedNotice(applicant)) return true;
    if (!hasApprovalLetterAcknowledged(applicant)) return true;
  }

  if (viewIdx > currentIdx) {
    if (viewIdx >= tna2Idx && !tna1Flags(applicant).directorValidated) {
      return true;
    }
    if (viewIdx >= ppIdx && !getPublishedTna2(applicant)) {
      return true;
    }
  }

  void getSignedMoa;
  return false;
}

/** Expose TNA1 PD flag for UI (CompleteStep disable). */
export function hasTna1DirectorValidated(applicant: Applicant | null): boolean {
  return tna1Flags(applicant).directorValidated;
}
