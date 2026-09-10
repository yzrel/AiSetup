/**
 * Author: Yzrel Jade B. Eborde
 *
 * Customer and DOST staff status emails (pre-screening, module completion).
 * Records to the Sent Emails outbox and delivers via SMTP when configured.
 */

import { authStore } from "../store/authStore";
import { Applicant } from "../store/applicantStore";
import { emailOutboxStore, OutboxEmail } from "../store/emailOutboxStore";
import { getOfficeContact, resolveApplicantOfficeId } from "./provincialOffice";
import { deliverViaSmtpBestEffort } from "./smtpDelivery";

function uniqueValidEmails(
  addresses: Array<string | undefined | null>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of addresses) {
    const email = raw?.trim();
    if (!email || !email.includes("@")) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(email);
  }
  return out;
}

/** PSTO mailbox for the case, plus regional records when that address differs. */
export function staffMailboxEmails(applicant: Applicant): string[] {
  const officeId = resolveApplicantOfficeId(applicant);
  const office = getOfficeContact(officeId);
  const regional = getOfficeContact("regional");
  return uniqueValidEmails([office.email, regional.email]);
}

export function emailApplicantNotice(options: {
  applicant: Applicant;
  title: string;
  message: string;
  module?: string;
}): OutboxEmail | null {
  const { applicant, title, message, module } = options;
  const to = applicant.emailAddress?.trim();
  if (!to || !to.includes("@")) {
    return null;
  }

  const greeting = applicant.applicantName?.trim()
    ? `Dear ${applicant.applicantName.trim()},`
    : "Dear Applicant,";
  const lines = [
    greeting,
    "",
    message,
    "",
    applicant.enterpriseName
      ? `Enterprise: ${applicant.enterpriseName}`
      : null,
    applicant.applicationId
      ? `Application ID: ${applicant.applicationId}`
      : null,
    "",
    "You can also view this update in the AiSETUP portal under Notifications.",
    "",
    "This is an automated message from DOST SOCCSKSARGEN (Region XII) AiSETUP.",
  ];
  const body = lines.filter((line) => line !== null).join("\n");

  const email = emailOutboxStore.send({
    kind: "status",
    to: [to],
    cc: [],
    subject: `AiSETUP — ${title}`,
    body,
    attachments: [],
    sentBy: authStore.getUser()?.email ?? "AiSETUP",
    applicantId: applicant.id,
    officeId: resolveApplicantOfficeId(applicant),
    module,
  });
  deliverViaSmtpBestEffort(email);
  return email;
}

export function emailStaffNotice(options: {
  applicant: Applicant;
  title: string;
  message: string;
  module?: string;
}): OutboxEmail | null {
  const { applicant, title, message, module } = options;
  const officeId = resolveApplicantOfficeId(applicant);
  const to = staffMailboxEmails(applicant);
  if (to.length === 0) {
    return null;
  }

  const officeName = getOfficeContact(officeId).name;
  const lines = [
    "Dear DOST staff,",
    "",
    message,
    "",
    applicant.enterpriseName
      ? `Enterprise: ${applicant.enterpriseName}`
      : null,
    applicant.applicationId
      ? `Application ID: ${applicant.applicationId}`
      : null,
    applicant.applicantName
      ? `Cooperator: ${applicant.applicantName}`
      : null,
    officeName ? `Office: ${officeName}` : null,
    "",
    "You can also view this update in the AiSETUP portal under Notifications.",
    "",
    "This is an automated message from DOST SOCCSKSARGEN (Region XII) AiSETUP.",
  ];
  const body = lines.filter((line) => line !== null).join("\n");

  const email = emailOutboxStore.send({
    kind: "status",
    to,
    cc: [],
    subject: `AiSETUP — ${title}`,
    body,
    attachments: [],
    sentBy: authStore.getUser()?.email ?? "AiSETUP",
    applicantId: applicant.id,
    officeId,
    module,
  });
  deliverViaSmtpBestEffort(email);
  return email;
}
