/**
 * Author: Yzrel Jade B. Eborde
 */

import { AdminView } from "../store/authStore";
import { Applicant } from "../store/applicantStore";
import { notificationStore } from "../store/notificationStore";
import { resolveApplicantOfficeId } from "./provincialOffice";
import { staffContextStore } from "../store/staffContextStore";

function staffOffice(applicant: Applicant) {
  return resolveApplicantOfficeId(applicant);
}

export function notifyRequirementsSubmitted(applicant: Applicant) {
  const officeId = staffOffice(applicant);
  notificationStore.add({
    id: `req-staff-${applicant.id}`,
    audience: "staff",
    applicantId: applicant.id,
    officeId,
    kind: "action",
    title: "Requirements awaiting review",
    message: `${applicant.enterpriseName} submitted documentary requirements for verification.`,
    urgent: true,
    view: "requirements",
  });
  notificationStore.add({
    id: `req-applicant-${applicant.id}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "info",
    title: "Requirements submitted",
    message: "Your documents are with your provincial DOST office for review.",
    view: "requirements",
  });
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
  notificationStore.add({
    id: `prescreen-${applicant.id}-${qualified ? "ok" : "no"}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: qualified ? "success" : "warning",
    title: qualified ? "Pre-screening passed" : "Not qualified for SETUP",
    message: qualified
      ? "You meet the SETUP requirements. Continue with enterprise registration."
      : "You do not yet meet SETUP requirements. Review recommended DOST programs for your sector on the pre-screening page.",
    view: qualified ? "registration" : "prescreening",
    urgent: !qualified,
  });
  if (qualified) {
    notificationStore.add({
      id: `prescreen-staff-${applicant.id}`,
      audience: "staff",
      applicantId: applicant.id,
      officeId: staffOffice(applicant),
      kind: "info",
      title: "New qualified applicant",
      message: `${applicant.enterpriseName} passed pre-screening and may proceed.`,
      view: "clients",
    });
  }
}

export function notifyTna1Submitted(applicant: Applicant) {
  notificationStore.add({
    id: `tna1-staff-${applicant.id}-${Date.now()}`,
    audience: "staff",
    applicantId: applicant.id,
    officeId: staffOffice(applicant),
    kind: "action",
    title: "TNA Form 01 submitted",
    message: `${applicant.enterpriseName} submitted TNA Form 01 for staff review.`,
    view: "tna1",
  });
  notificationStore.add({
    id: `tna1-applicant-${applicant.id}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "info",
    title: "TNA Form 01 submitted",
    message: "Your assessment was submitted. DOST staff will review your TNA Form 01.",
    view: "tna1",
  });
}

export function notifyTna1Reviewed(applicant: Applicant) {
  notificationStore.add({
    id: `tna1-reviewed-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: "TNA Form 01 approved",
    message: "DOST staff verified your TNA Form 01. AI analysis and reports will follow.",
    view: "tna1",
  });
}

export function notifyTna1Resubmission(applicant: Applicant) {
  notificationStore.add({
    id: `tna1-resubmit-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "warning",
    title: "TNA Form 01 resubmission requested",
    message: "DOST staff requested corrections to your TNA Form 01. Please update and resubmit.",
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
    title: "TNA Form 02 published",
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
    title: "SETUP Notice of Approval published",
    message:
      "Your SETUP Form 003 Notice of Approval is ready. Review the letter and acknowledge conforme to proceed.",
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
      "Your signed Memorandum of Agreement has been recorded. Pre-PIS will be completed on the same signing day.",
    view: "project-information-sheet",
  });
}

export function notifySigningDayComplete(applicant: Applicant) {
  notificationStore.add({
    id: `signing-day-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: "MOA signing day complete",
    message:
      "Signed MOA is on file. You may proceed to LandBank account setup.",
    urgent: true,
    view: "landbank-withdrawal",
  });
}

export function notifyLandBankComplete(applicant: Applicant) {
  notificationStore.add({
    id: `landbank-complete-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: "LandBank & withdrawal complete",
    message:
      "Your LandBank account and withdrawal documents are on file. Proceed to procurement and liquidation.",
    view: "procurement-liquidation",
  });
  notificationStore.add({
    id: `landbank-staff-${applicant.id}-${Date.now()}`,
    audience: "staff",
    applicantId: applicant.id,
    officeId: staffOffice(applicant),
    kind: "info",
    title: "Withdrawal documents submitted",
    message: `${applicant.enterpriseName} completed LandBank & withdrawal (Modules 11–13).`,
    view: "landbank-withdrawal",
  });
}

export function notifyProcurementComplete(applicant: Applicant) {
  notificationStore.add({
    id: `procurement-complete-${applicant.id}-${Date.now()}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: "Procurement & liquidation complete",
    message:
      "Procurement, liquidation, and account untagging are complete. Refund monitoring will begin per your MOA schedule.",
    view: "refund-delinquent",
  });
  notificationStore.add({
    id: `procurement-staff-${applicant.id}-${Date.now()}`,
    audience: "staff",
    applicantId: applicant.id,
    officeId: staffOffice(applicant),
    kind: "action",
    title: "Refund monitoring required",
    message: `${applicant.enterpriseName} is ready for refund schedule and PDC monitoring.`,
    view: "refund-delinquent",
  });
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
  notificationStore.add({
    id: `pp-staff-${applicant.id}-${Date.now()}`,
    audience: "staff",
    applicantId: applicant.id,
    officeId: staffOffice(applicant),
    kind: "action",
    title: "Project Proposal submitted",
    message: `${applicant.enterpriseName} submitted SETUP Form 001 (Project Proposal) for review.`,
    view: "project-proposal",
  });
  notificationStore.add({
    id: `pp-applicant-${applicant.id}`,
    audience: "applicant",
    applicantId: applicant.id,
    kind: "success",
    title: "Project Proposal submitted",
    message: "Your project proposal was submitted. Proceed to the next application step when advised.",
    view: "project-proposal",
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
