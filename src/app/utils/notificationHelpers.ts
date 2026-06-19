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
      ? "You meet the priority sector requirements. Continue with enterprise registration."
      : "Your enterprise must fall under a SETUP 4.0 priority sector to proceed.",
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
