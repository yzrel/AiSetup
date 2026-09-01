/**
 * Author: Yzrel Jade B. Eborde
 */

import { AdminView } from "../store/authStore";
import {
  Applicant,
  MODULE_LABELS,
  MODULE_ORDER,
  type ModuleStatus,
} from "../store/applicantStore";
import { notificationStore } from "../store/notificationStore";
import { resolveApplicantOfficeId } from "./provincialOffice";
import { staffContextStore } from "../store/staffContextStore";
import { formatFormMention } from "../constants/setupForms";
import { emailApplicantNotice } from "./applicantStatusMail";

function staffOffice(applicant: Applicant) {
  return resolveApplicantOfficeId(applicant);
}

/**
 * Modules that already emit a customer in-app notice on the same submit
 * that advances the workflow. `notifyModuleCompleted` still emails, but
 * skips a second generic "step completed" banner.
 */
const MODULES_WITH_APPLICANT_STEP_NOTICE: ReadonlySet<ModuleStatus> = new Set([
  "prescreening",
  "letter-of-intent",
  "requirements",
  "tna1",
  "tna2",
  "project-proposal",
  "conduct-rtec",
  "approval-letter",
  "landbank-withdrawal",
  "procurement-liquidation",
  "refund-delinquent",
  "project-closeout",
]);

export function notifyRequirementsSubmitted(applicant: Applicant) {
  const officeId = staffOffice(applicant);
  notificationStore.addMany([
    {
      id: `req-staff-${applicant.id}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId,
      kind: "action",
      title: "Requirements awaiting review",
      message: `${applicant.enterpriseName} submitted documentary requirements for verification.`,
      urgent: true,
      view: "requirements",
    },
    {
      id: `req-applicant-${applicant.id}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "info",
      title: "Requirements submitted",
      message: "Your documents are with your provincial DOST office for review.",
      view: "requirements",
    },
  ]);
}

export interface StaffVerificationFlaggedItem {
  name: string;
  remark?: string;
}

function simpleHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

/**
 * Immediate in-app (+ email when remark non-empty) when staff flags a document
 * or updates its remark during staff verification.
 */
export function notifyStaffVerificationRemark(options: {
  applicant: Applicant;
  moduleKey: string;
  moduleLabel: string;
  documentId: string;
  documentName: string;
  remark: string;
  view: AdminView;
}): void {
  const {
    applicant,
    moduleKey,
    moduleLabel,
    documentId,
    documentName,
    remark,
    view,
  } = options;
  const trimmed = remark.trim();
  const title = "Document flagged for revision";
  const message = trimmed
    ? `DOST staff flagged "${documentName}" under ${moduleLabel}: ${trimmed}`
    : `DOST staff flagged "${documentName}" under ${moduleLabel}. Please review remarks in the portal.`;
  const hash = simpleHash(`${documentId}|${trimmed}`);
  notificationStore.add({
    id: `staff-verify-remark-${applicant.id}-${moduleKey}-${documentId}-${hash}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "warning",
    title,
    message,
    urgent: true,
    view,
  });
  if (trimmed) {
    emailApplicantNotice({
      applicant,
      title,
      message,
      module: moduleKey,
    });
  }
}

/**
 * Final revision decision: consolidated in-app + email with all flagged items.
 */
export function notifyStaffVerificationRevisionSummary(options: {
  applicant: Applicant;
  moduleKey: string;
  moduleLabel: string;
  flaggedItems: StaffVerificationFlaggedItem[];
  staffNotes?: string;
  view: AdminView;
  title?: string;
  inAppMessage?: string;
}): void {
  const {
    applicant,
    moduleKey,
    moduleLabel,
    flaggedItems,
    staffNotes,
    view,
    title = "Revisions requested",
    inAppMessage,
  } = options;
  const count = flaggedItems.length;
  const message =
    inAppMessage ??
    (count > 0
      ? `DOST staff requested corrections to ${count} document(s) under ${moduleLabel}. Please review and resubmit.`
      : `DOST staff requested corrections under ${moduleLabel}. Please review and resubmit.`);

  notificationStore.add({
    id: `staff-verify-revision-${applicant.id}-${moduleKey}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "warning",
    title,
    message,
    urgent: true,
    view,
  });

  const lines: string[] = [
    `DOST staff requested revisions to your ${moduleLabel} submission.`,
  ];
  if (flaggedItems.length > 0) {
    lines.push("", "Flagged documents:");
    for (const item of flaggedItems) {
      const remark = item.remark?.trim();
      lines.push(remark ? `• ${item.name} — ${remark}` : `• ${item.name}`);
    }
  }
  const notes = staffNotes?.trim();
  if (notes) {
    lines.push("", `Staff notes: ${notes}`);
  }
  lines.push("", "Please sign in to AiSETUP, review the remarks, and resubmit.");

  emailApplicantNotice({
    applicant,
    title,
    message: lines.join("\n"),
    module: moduleKey,
  });
}

export function notifyRequirementsDecision(
  applicant: Applicant,
  decision: "approved" | "needs-revision",
  context?: {
    flaggedItems?: StaffVerificationFlaggedItem[];
    staffNotes?: string;
  },
) {
  if (decision === "approved") {
    notificationStore.add({
      id: `req-approved-${applicant.id}-${Date.now()}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "success",
      title: "Requirements approved",
      message: "Your submitted documents were verified. Proceed to the next application step.",
      view: "requirements",
    });
  } else {
    notifyStaffVerificationRevisionSummary({
      applicant,
      moduleKey: "requirements",
      moduleLabel: "Submission Requirements",
      flaggedItems: context?.flaggedItems ?? [],
      staffNotes: context?.staffNotes,
      view: "requirements",
      title: "Revisions requested",
      inAppMessage:
        "DOST staff flagged documents that need correction. Please review and resubmit.",
    });
  }
}

export function notifyPrescreeningResult(applicant: Applicant, qualified: boolean) {
  if (qualified) {
    const title = "Pre-screening passed";
    const message =
      "You meet the SETUP requirements. Continue with enterprise registration.";
    notificationStore.addMany([
      {
        id: `prescreen-${applicant.id}-ok`,
        audience: "applicant",
        applicantId: applicant.id,
        kind: "success",
        title,
        message,
        view: "registration",
      },
      {
        id: `prescreen-staff-${applicant.id}`,
        audience: "staff",
        applicantId: applicant.id,
        officeId: staffOffice(applicant),
        kind: "info",
        title: "New qualified applicant",
        message: `${applicant.enterpriseName} passed pre-screening and may proceed.`,
        view: "clients",
      },
    ]);
    emailApplicantNotice({
      applicant,
      title,
      message,
      module: "prescreening",
    });
    return;
  }
  const title = "Not qualified for SETUP";
  const message =
    "You do not yet meet SETUP requirements. Review recommended DOST programs for your sector on the pre-screening page.";
  notificationStore.add({
    id: `prescreen-${applicant.id}-no`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "warning",
    title,
    message,
    view: "prescreening",
    urgent: true,
  });
  emailApplicantNotice({
    applicant,
    title,
    message,
    module: "prescreening",
  });
}

/**
 * Customer email (and in-app when no more specific notice already fired)
 * after a workflow step is finished.
 */
export function notifyModuleCompleted(
  applicant: Applicant,
  completedModule: ModuleStatus,
) {
  const label = MODULE_LABELS[completedModule] ?? completedModule;
  const next = MODULE_ORDER[MODULE_ORDER.indexOf(completedModule) + 1];
  const nextLabel =
    next && next !== "completed" ? MODULE_LABELS[next] : undefined;
  const title = `${label} completed`;
  const message = nextLabel
    ? `You completed ${label}. You may now proceed to ${nextLabel} in the AiSETUP portal.`
    : `You completed ${label}.`;

  emailApplicantNotice({
    applicant,
    title,
    message,
    module: completedModule,
  });

  if (MODULES_WITH_APPLICANT_STEP_NOTICE.has(completedModule)) {
    return;
  }

  const view = (next && next !== "completed" ? next : completedModule) as AdminView;
  notificationStore.add({
    id: `step-complete-${applicant.id}-${completedModule}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title,
    message,
    view,
  });
}

export function notifyTna1Submitted(applicant: Applicant) {
  notificationStore.addMany([
    {
      id: `tna1-staff-${applicant.id}-${Date.now()}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId: staffOffice(applicant),
      kind: "action",
      title: `${formatFormMention("tna01")} submitted`,
      message: `${applicant.enterpriseName} submitted ${formatFormMention("tna01", "both")} for staff review.`,
      view: "tna1",
    },
    {
      id: `tna1-applicant-${applicant.id}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "info",
      title: `${formatFormMention("tna01")} submitted`,
      message: `Your assessment was submitted. DOST staff will review your ${formatFormMention("tna01")}.`,
      view: "tna1",
    },
  ]);
}

export function notifyTna1Reviewed(applicant: Applicant) {
  notificationStore.add({
    id: `tna1-reviewed-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: `${formatFormMention("tna01")} approved`,
    message: `DOST staff verified your ${formatFormMention("tna01")}. It now awaits Provincial Director validation.`,
    view: "tna1",
  });
}

export function notifyTna1AwaitingDirector(applicant: Applicant) {
  notificationStore.add({
    id: `tna1-awaiting-director-${applicant.id}-${Date.now()}`,
    audience: "staff",
    applicantId: applicant.id,
    officeId: staffOffice(applicant),
    kind: "action",
    title: `${formatFormMention("tna01")} awaiting director validation`,
    message: `${applicant.enterpriseName}'s ${formatFormMention("tna01")} passed staff review and awaits Provincial Director validation for this PSTO.`,
    view: "tna1",
  });
}

export function notifyTna1DirectorValidated(
  applicant: Applicant,
  directorName: string,
) {
  const stamp = Date.now();
  notificationStore.addMany([
    {
      id: `tna1-director-validated-${applicant.id}-${stamp}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "success",
      title: `${formatFormMention("tna01")} validated`,
      message: `${directorName} (Provincial Director) validated your ${formatFormMention("tna01")}. You may now proceed to TNA Form 02.`,
      view: "tna1",
    },
    {
      id: `tna1-director-validated-staff-${applicant.id}-${stamp}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId: staffOffice(applicant),
      kind: "success",
      title: `${formatFormMention("tna01")} validated by Provincial Director`,
      message: `${directorName} validated ${applicant.enterpriseName}'s ${formatFormMention("tna01")}.`,
      view: "tna1",
    },
  ]);
}

export function notifyTna1Resubmission(
  applicant: Applicant,
  context?: {
    flaggedItems?: StaffVerificationFlaggedItem[];
    staffNotes?: string;
  },
) {
  const label = formatFormMention("tna01");
  notifyStaffVerificationRevisionSummary({
    applicant,
    moduleKey: "tna1",
    moduleLabel: label,
    flaggedItems: context?.flaggedItems ?? [],
    staffNotes: context?.staffNotes,
    view: "tna1",
    title: `${label} resubmission requested`,
    inAppMessage: `DOST staff requested corrections to your ${label}. Please update and resubmit.`,
  });
}

export function notifyTna2Published(applicant: Applicant) {
  notificationStore.add({
    id: `tna2-published-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: `${formatFormMention("tna02")} published`,
    message: "Your technical report is now available. Review it and continue your application.",
    view: "tna2",
  });
}

export function notifyApprovalLetterPublished(applicant: Applicant) {
  notificationStore.add({
    id: `approval-published-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: `${formatFormMention("003")} published`,
    message:
      `Your ${formatFormMention("003", "both")} is ready. Review the letter and acknowledge conforme to proceed.`,
    urgent: true,
    view: "approval-letter",
  });
}

export function notifyMoaUploaded(applicant: Applicant) {
  notificationStore.add({
    id: `moa-uploaded-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "info",
    title: "Memorandum of Agreement on file",
    message:
      "Your signed Memorandum of Agreement has been recorded. DOST staff will continue LandBank account setup once PDCs are recorded. You can view progress under LandBank & Withdrawal.",
    view: "landbank-withdrawal",
  });
}

export function notifySigningDayComplete(applicant: Applicant) {
  notificationStore.add({
    id: `signing-day-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: "MOA and PDCs ready",
    message:
      "Memorandum of Agreement and PDCs are on file. DOST staff will prepare your LandBank documents. You can view published letters under LandBank & Withdrawal.",
    urgent: true,
    view: "landbank-withdrawal",
  });
}

export function notifyLbpIntroductionPublished(applicant: Applicant) {
  notificationStore.add({
    id: `lbp-intro-published-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: "Letter of Introduction to LBP published",
    message:
      "Your DOST Letter of Introduction to Land Bank of the Philippines is ready to view and download. Present it at your LandBank branch to open your SETUP savings passbook account. DOST staff will record account and withdrawal documents.",
    urgent: true,
    view: "landbank-withdrawal",
  });
}

export function notifyLandBankComplete(applicant: Applicant) {
  const stamp = Date.now();
  notificationStore.addMany([
    {
      id: `landbank-complete-${applicant.id}-${stamp}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "success",
      title: "LandBank & withdrawal complete",
      message:
        "Your LandBank account and withdrawal documents are on file and ready to view. Proceed to procurement and liquidation when unlocked.",
      view: "procurement-liquidation",
    },
    {
      id: `landbank-staff-${applicant.id}-${stamp}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId: staffOffice(applicant),
      kind: "info",
      title: "Withdrawal documents submitted",
      message: `${applicant.enterpriseName} LandBank & withdrawal marked complete (Modules 11–13).`,
      view: "landbank-withdrawal",
    },
  ]);
}

export function notifyProcurementComplete(applicant: Applicant) {
  const stamp = Date.now();
  notificationStore.addMany([
    {
      id: `procurement-complete-${applicant.id}-${stamp}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "success",
      title: "Procurement & liquidation complete",
      message:
        "Procurement, liquidation, and account untagging are complete. Refund monitoring will begin per your MOA schedule.",
      view: "refund-delinquent",
    },
    {
      id: `procurement-staff-${applicant.id}-${stamp}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId: staffOffice(applicant),
      kind: "action",
      title: "Refund monitoring required",
      message: `${applicant.enterpriseName} is ready for refund schedule and PDC monitoring.`,
      view: "refund-delinquent",
    },
  ]);
}

export function notifyRefundMonitoringComplete(applicant: Applicant) {
  notificationStore.add({
    id: `refund-complete-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: "SETUP project completed",
    message:
      "Refund monitoring is active. Continue making scheduled payments per your refund agreement.",
    view: "dashboard",
  });
}

export function notifyProjectProposalSubmitted(applicant: Applicant) {
  notificationStore.addMany([
    {
      id: `pp-staff-${applicant.id}-${Date.now()}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId: staffOffice(applicant),
      kind: "action",
      title: "Project Proposal submitted",
      message: `${applicant.enterpriseName} submitted ${formatFormMention("001", "both")} for review.`,
      view: "project-proposal",
    },
    {
      id: `pp-applicant-${applicant.id}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "success",
      title: "Project Proposal submitted",
      message: "Your project proposal was submitted. Proceed to the next application step when advised.",
      view: "project-proposal",
    },
  ]);
}

export function notifyLoiSubmitted(applicant: Applicant) {
  const officeId = staffOffice(applicant);
  notificationStore.addMany([
    {
      id: `loi-staff-${applicant.id}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId,
      kind: "action",
      title: "Letter of Intent submitted",
      message: `${applicant.enterpriseName} submitted a Letter of Intent for review.`,
      urgent: true,
      view: "letter-of-intent",
    },
    {
      id: `loi-applicant-${applicant.id}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "info",
      title: "Letter of Intent submitted",
      message:
        "Your Letter of Intent was recorded. Your provincial DOST office will continue with the next application steps.",
      view: "letter-of-intent",
    },
  ]);
}

export function notifyRtecSubmitted(applicant: Applicant) {
  const stamp = Date.now();
  notificationStore.addMany([
    {
      id: `rtec-applicant-${applicant.id}-${stamp}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "info",
      title: `${formatFormMention("002")} completed`,
      message:
        "Your RTEC evaluation is complete. DOST staff will prepare your Notice of Approval for Regional Director decision.",
      view: "dashboard",
    },
    {
      id: `rtec-staff-${applicant.id}-${stamp}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId: staffOffice(applicant),
      kind: "success",
      title: `${formatFormMention("002")} completed`,
      message: `${applicant.enterpriseName}'s RTEC report is complete. Proceed to Notice of Approval.`,
      view: "approval-letter",
    },
  ]);
}

export function notifyApprovalLetterRdDecision(
  applicant: Applicant,
  decision: "approved" | "disapproved",
) {
  const stamp = Date.now();
  const officeId = staffOffice(applicant);
  if (decision === "approved") {
    notificationStore.addMany([
      {
        id: `approval-rd-ok-applicant-${applicant.id}-${stamp}`,
        audience: "applicant",
        applicantId: applicant.id,
        kind: "success",
        title: "Regional Director approved",
        message: `The Regional Director approved your ${formatFormMention("003")}. Staff will publish the Notice of Approval shortly.`,
        view: "approval-letter",
      },
      {
        id: `approval-rd-ok-staff-${applicant.id}-${stamp}`,
        audience: "staff",
        applicantId: applicant.id,
        officeId,
        kind: "action",
        title: `${formatFormMention("003")} ready to publish`,
        message: `${applicant.enterpriseName} was approved by the Regional Director. Publish the Notice of Approval.`,
        urgent: true,
        view: "approval-letter",
      },
    ]);
    return;
  }
  notificationStore.addMany([
    {
      id: `approval-rd-no-applicant-${applicant.id}-${stamp}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "warning",
      title: "Regional Director disapproved",
      message: `The Regional Director disapproved your ${formatFormMention("003")}. DOST staff will advise on next steps.`,
      urgent: true,
      view: "approval-letter",
    },
    {
      id: `approval-rd-no-staff-${applicant.id}-${stamp}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId,
      kind: "warning",
      title: `${formatFormMention("003")} disapproved`,
      message: `${applicant.enterpriseName} was disapproved by the Regional Director. Re-endorse before another RD decision.`,
      urgent: true,
      view: "approval-letter",
    },
  ]);
}

export function notifyApprovalLetterConforme(applicant: Applicant) {
  notificationStore.add({
    id: `approval-conforme-staff-${applicant.id}-${Date.now()}`,
    audience: "staff",
    applicantId: applicant.id,
    officeId: staffOffice(applicant),
    kind: "action",
    title: "Conforme acknowledged",
    message: `${applicant.enterpriseName} acknowledged conforme on the Notice of Approval. Continue with LandBank & Withdrawal.`,
    view: "landbank-withdrawal",
  });
}

export function notifyCloseoutComplete(applicant: Applicant) {
  const stamp = Date.now();
  const title = "Project close-out complete";
  const message =
    "Your SETUP project close-out and certificate of ownership have been recorded.";
  notificationStore.addMany([
    {
      id: `closeout-applicant-${applicant.id}-${stamp}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "success",
      title,
      message,
      view: "project-closeout",
    },
    {
      id: `closeout-staff-${applicant.id}-${stamp}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId: staffOffice(applicant),
      kind: "success",
      title: "Project close-out recorded",
      message: `${applicant.enterpriseName} project close-out is complete.`,
      view: "project-closeout",
    },
  ]);
  emailApplicantNotice({
    applicant,
    title,
    message,
    module: "project-closeout",
  });
}

export function notifyDelinquencyFlagged(
  applicant: Applicant,
  status: "delinquent" | "under-evaluation",
) {
  const label =
    status === "delinquent" ? "Delinquent" : "Under Evaluation";
  notificationStore.add({
    id: `delinq-${applicant.id}-${status}-${Date.now()}`,
    audience: "staff",
    applicantId: applicant.id,
    officeId: staffOffice(applicant),
    kind: "warning",
    title: `Account flagged: ${label}`,
    message: `${applicant.enterpriseName} refund status set to ${label}. Coordinate follow-up with the provincial office.`,
    urgent: true,
    view: "refund-delinquent",
  });
}

export function notifyWithNavigation(
  notificationId: string,
  view: AdminView,
  applicantId?: string,
) {
  if (applicantId) {
    staffContextStore.setSelectedApplicant(applicantId);
  }
  notificationStore.markRead(notificationId);
  return view;
}
