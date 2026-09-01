/**
 * Author: Yzrel Jade B. Eborde
 *
 * Customer status emails (pre-screening result, module/step completion).
 * Records to the Sent Emails outbox and delivers via SMTP when configured.
 */

import { authStore } from "../store/authStore";
import { Applicant } from "../store/applicantStore";
import { emailOutboxStore, OutboxEmail } from "../store/emailOutboxStore";
import { resolveApplicantOfficeId } from "./provincialOffice";
import { deliverViaSmtpBestEffort } from "./smtpDelivery";

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
