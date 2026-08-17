/**
 * Author: Yzrel Jade B. Eborde
 */

import { AdminView } from "../store/authStore";
import { Applicant } from "../store/applicantStore";
import { notificationStore } from "../store/notificationStore";
import { resolveApplicantOfficeId } from "./provincialOffice";
import { staffContextStore } from "../store/staffContextStore";
import { formatFormMention } from "../constants/setupForms";

function staffOffice(applicant: Applicant) {
  return resolveApplicantOfficeId(applicant);
}

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

export function notifyRequirementsDecision(
  applicant: Applicant,
  decision: "approved" | "needs-revision",
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
    notificationStore.add({
      id: `req-revision-${applicant.id}-${Date.now()}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "warning",
      title: "Revisions requested",
      message: "DOST staff flagged documents that need correction. Please review and resubmit.",
      urgent: true,
      view: "requirements",
    });
  }
}

export function notifyPrescreeningResult(applicant: Applicant, qualified: boolean) {
  if (qualified) {
    notificationStore.addMany([
      {
        id: `prescreen-${applicant.id}-ok`,
        audience: "applicant",
        applicantId: applicant.id,
        kind: "success",
        title: "Pre-screening passed",
        message: "You meet the SETUP requirements. Continue with enterprise registration.",
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
    return;
  }
  notificationStore.add({
    id: `prescreen-${applicant.id}-no`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "warning",
    title: "Not qualified for SETUP",
    message:
      "You do not yet meet SETUP requirements. Review recommended DOST programs for your sector on the pre-screening page.",
    view: "prescreening",
    urgent: true,
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

export function notifyTna1Resubmission(applicant: Applicant) {
  notificationStore.add({
    id: `tna1-resubmit-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "warning",
    title: `${formatFormMention("tna01")} resubmission requested`,
    message: `DOST staff requested corrections to your ${formatFormMention("tna01")}. Please update and resubmit.`,
    urgent: true,
    view: "tna1",
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
    title: "Signed MOA on file",
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
      "Signed MOA and PDCs are on file. DOST staff will prepare your LandBank documents. You can view published letters under LandBank & Withdrawal.",
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
  notificationStore.addMany([
    {
      id: `closeout-applicant-${applicant.id}-${stamp}`,
      audience: "applicant",
      applicantId: applicant.id,
      kind: "success",
      title: "Project close-out complete",
      message:
        "Your SETUP project close-out and certificate of ownership have been recorded.",
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
