/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createNotifications,
  health,
  sendMail,
  getAuthToken,
} = vi.hoisted(() => ({
  createNotifications: vi.fn(),
  health: vi.fn(),
  sendMail: vi.fn(),
  getAuthToken: vi.fn(() => "test-token"),
}));

vi.mock("../../api/client", () => ({
  api: {
    listNotifications: vi.fn(async () => []),
    createNotifications,
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    health,
    sendMail,
  },
}));

vi.mock("../../api/authToken", () => ({
  getAuthToken,
}));

import { Applicant } from "../../store/applicantStore";
import { emailOutboxStore } from "../../store/emailOutboxStore";
import { notificationStore } from "../../store/notificationStore";
import {
  notifyModuleCompleted,
  notifyPrescreeningResult,
  notifyStaffVerificationRemark,
  notifyStaffVerificationRevisionSummary,
  notifyRequirementsDecision,
  notifyTna1DirectorValidated,
  notifyTna1Resubmission,
  notifyTna1Reviewed,
  notifyTna2Published,
  notifyRtecSubmitted,
  notifyRtecReady,
  notifyApprovalLetterPublished,
  notifyApprovalLetterRdDecision,
  notifyApprovalLetterAwaitingRd,
  notifyTna1AwaitingDirector,
} from "../notificationHelpers";
import { staffMailboxEmails } from "../applicantStatusMail";
import { shouldNotifyRequirementRemark } from "../submissionRequirements";

function sampleApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: "app-notify-1",
    applicationId: "LOI-2026-100001",
    applicantName: "Juan Dela Cruz",
    designation: "Owner",
    enterpriseName: "Test Foods",
    contactNumber: "09170000000",
    emailAddress: "juan@testfoods.example",
    businessType: "DTI",
    businessNature: "",
    businessSector: "Food Processing",
    yearsOfOperation: "5",
    enterpriseType: "",
    msmeSize: "Small",
    assetSize: "",
    region: "South Cotabato",
    address: "Koronadal",
    currentModule: "prescreening",
    qualified: true,
    submittedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    moduleData: { province: "South Cotabato" },
    ...overrides,
  };
}

function outboxFor(applicantId: string) {
  return emailOutboxStore.getAll().filter((e) => e.applicantId === applicantId);
}

describe("notifyPrescreeningResult", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("notifies and emails the customer when qualified", () => {
    const applicant = sampleApplicant({ id: "app-q", qualified: true });
    notifyPrescreeningResult(applicant, true);

    const notices = notificationStore.getAll();
    expect(notices.some((n) => n.id === "prescreen-app-q-ok")).toBe(true);
    expect(notices.some((n) => n.audience === "staff")).toBe(true);

    const mail = outboxFor("app-q");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].kind).toBe("status");
    expect(mail[0].to).toEqual(["juan@testfoods.example"]);
    expect(mail[0].subject).toContain("Pre-screening passed");
    expect(mail[0].body).toContain("You meet the SETUP requirements");
  });

  it("notifies and emails the customer when not qualified", () => {
    const applicant = sampleApplicant({
      id: "app-nq",
      qualified: false,
      emailAddress: "unqualified@example.com",
    });
    notifyPrescreeningResult(applicant, false);

    const notices = notificationStore.getAll();
    expect(notices.some((n) => n.id === "prescreen-app-nq-no")).toBe(true);
    expect(notices.find((n) => n.id === "prescreen-app-nq-no")?.kind).toBe(
      "warning",
    );

    const mail = outboxFor("app-nq");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].to).toEqual(["unqualified@example.com"]);
    expect(mail[0].subject).toContain("Not qualified for SETUP");
    expect(mail[0].body).toContain("do not yet meet SETUP requirements");
  });
});

describe("notifyModuleCompleted", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("emails and notifies the customer after registration", () => {
    const applicant = sampleApplicant({
      id: "app-reg",
      currentModule: "letter-of-intent",
    });
    notifyModuleCompleted(applicant, "registration");

    expect(
      notificationStore
        .getAll()
        .some((n) => n.id === "step-complete-app-reg-registration"),
    ).toBe(true);

    const mail = outboxFor("app-reg");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].kind).toBe("status");
    expect(mail[0].subject).toContain("Registration completed");
    expect(mail[0].body).toContain("Letter of Intent");
  });

  it("emails the customer after LOI without a duplicate generic in-app notice", () => {
    const applicant = sampleApplicant({
      id: "app-loi",
      currentModule: "requirements",
    });
    notifyModuleCompleted(applicant, "letter-of-intent");

    expect(
      notificationStore
        .getAll()
        .some((n) => n.id === "step-complete-app-loi-letter-of-intent"),
    ).toBe(false);

    const mail = outboxFor("app-loi");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].subject).toContain("Letter of Intent completed");
  });

  it("skips email when the customer has no address", () => {
    const applicant = sampleApplicant({
      id: "app-no-mail",
      emailAddress: "",
    });
    notifyModuleCompleted(applicant, "registration");
    expect(outboxFor("app-no-mail")).toHaveLength(0);
    expect(
      notificationStore
        .getAll()
        .some((n) => n.id === "step-complete-app-no-mail-registration"),
    ).toBe(true);
  });
});

describe("shouldNotifyRequirementRemark", () => {
  it("notifies when newly flagged", () => {
    expect(
      shouldNotifyRequirementRemark({
        prevStatus: "",
        nextStatus: "flagged",
        nextRemark: "",
        notifiedRemark: undefined,
      }),
    ).toBe(true);
  });

  it("notifies when remark text changes to a new value", () => {
    expect(
      shouldNotifyRequirementRemark({
        prevStatus: "flagged",
        nextStatus: "flagged",
        nextRemark: "Please revise this",
        notifiedRemark: "",
      }),
    ).toBe(true);
  });

  it("dedups the same remark text", () => {
    expect(
      shouldNotifyRequirementRemark({
        prevStatus: "flagged",
        nextStatus: "flagged",
        nextRemark: "Please revise this",
        notifiedRemark: "Please revise this",
      }),
    ).toBe(false);
  });

  it("does not notify for OK status", () => {
    expect(
      shouldNotifyRequirementRemark({
        prevStatus: "flagged",
        nextStatus: "ok",
        nextRemark: "n/a",
        notifiedRemark: "",
      }),
    ).toBe(false);
  });
});

describe("notifyStaffVerificationRemark", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("creates in-app notice and email when remark is non-empty", () => {
    const applicant = sampleApplicant({ id: "app-remark" });
    notifyStaffVerificationRemark({
      applicant,
      moduleKey: "requirements",
      moduleLabel: "Submission Requirements",
      documentId: "quotations",
      documentName: "Three (3) quotations",
      remark: "Please revise this",
      view: "requirements",
    });

    const notices = notificationStore.getAll();
    expect(
      notices.some(
        (n) =>
          n.audience === "applicant" &&
          n.title === "Document flagged for revision" &&
          n.message.includes("Please revise this"),
      ),
    ).toBe(true);

    const mail = outboxFor("app-remark");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].subject).toContain("Document flagged for revision");
    expect(mail[0].body).toContain("Please revise this");
  });

  it("creates in-app only when flagged without remark", () => {
    const applicant = sampleApplicant({ id: "app-flag-only" });
    notifyStaffVerificationRemark({
      applicant,
      moduleKey: "requirements",
      moduleLabel: "Submission Requirements",
      documentId: "financial",
      documentName: "Financial statements",
      remark: "",
      view: "requirements",
    });

    expect(
      notificationStore
        .getAll()
        .some(
          (n) =>
            n.applicantId === "app-flag-only" &&
            n.title === "Document flagged for revision",
        ),
    ).toBe(true);
    expect(outboxFor("app-flag-only")).toHaveLength(0);
  });

  it("uses stable id so the same remark does not duplicate", () => {
    const applicant = sampleApplicant({ id: "app-dedup" });
    const opts = {
      applicant,
      moduleKey: "requirements",
      moduleLabel: "Submission Requirements",
      documentId: "quotations",
      documentName: "Quotations",
      remark: "Same text",
      view: "requirements" as const,
    };
    notifyStaffVerificationRemark(opts);
    notifyStaffVerificationRemark(opts);
    const matches = notificationStore
      .getAll()
      .filter(
        (n) =>
          n.applicantId === "app-dedup" &&
          n.title === "Document flagged for revision",
      );
    expect(matches).toHaveLength(1);
  });
});

describe("notifyStaffVerificationRevisionSummary", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("emails a summary listing multiple flagged items", () => {
    const applicant = sampleApplicant({ id: "app-summary" });
    notifyStaffVerificationRevisionSummary({
      applicant,
      moduleKey: "requirements",
      moduleLabel: "Submission Requirements",
      flaggedItems: [
        { name: "Financial statements", remark: "Missing year 2023" },
        { name: "Quotations", remark: "Need three suppliers" },
      ],
      staffNotes: "Overall incomplete",
      view: "requirements",
    });

    expect(
      notificationStore
        .getAll()
        .some(
          (n) =>
            n.applicantId === "app-summary" && n.title === "Revisions requested",
        ),
    ).toBe(true);

    const mail = outboxFor("app-summary");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].body).toContain("Financial statements");
    expect(mail[0].body).toContain("Missing year 2023");
    expect(mail[0].body).toContain("Quotations");
    expect(mail[0].body).toContain("Overall incomplete");
  });
});

describe("notifyRequirementsDecision revision path", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("emails the customer when revisions are requested", () => {
    const applicant = sampleApplicant({ id: "app-req-rev" });
    notifyRequirementsDecision(applicant, "needs-revision", {
      flaggedItems: [{ name: "Registration", remark: "Blurry scan" }],
      staffNotes: "Please re-upload",
    });
    const mail = outboxFor("app-req-rev");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].body).toContain("Blurry scan");
  });
});

describe("notifyTna1Resubmission", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("emails and notifies on TNA1 resubmission request", () => {
    const applicant = sampleApplicant({ id: "app-tna1-rev" });
    notifyTna1Resubmission(applicant, {
      flaggedItems: [{ name: "Production Plan", remark: "Incomplete" }],
      staffNotes: "Update tables",
    });
    expect(
      notificationStore
        .getAll()
        .some((n) => n.applicantId === "app-tna1-rev" && n.kind === "warning"),
    ).toBe(true);
    const mail = outboxFor("app-tna1-rev");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].body).toContain("Production Plan");
  });
});

describe("notifyTna1Reviewed", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("emails and notifies the client on staff approval", () => {
    const applicant = sampleApplicant({ id: "app-tna1-approved" });
    notifyTna1Reviewed(applicant);
    expect(
      notificationStore
        .getAll()
        .some(
          (n) =>
            n.applicantId === "app-tna1-approved" &&
            n.audience === "applicant" &&
            n.kind === "success",
        ),
    ).toBe(true);
    const mail = outboxFor("app-tna1-approved");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].kind).toBe("status");
    expect(mail[0].subject).toContain("approved");
    expect(mail[0].body).toContain("Provincial Director validation");
  });

  it("skips email when the customer has no address", () => {
    const applicant = sampleApplicant({
      id: "app-tna1-approved-no-mail",
      emailAddress: "",
    });
    notifyTna1Reviewed(applicant);
    expect(outboxFor("app-tna1-approved-no-mail")).toHaveLength(0);
    expect(
      notificationStore
        .getAll()
        .some(
          (n) =>
            n.applicantId === "app-tna1-approved-no-mail" &&
            n.audience === "applicant",
        ),
    ).toBe(true);
  });
});

describe("notifyTna1DirectorValidated", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("emails and notifies the client on director validation", () => {
    const applicant = sampleApplicant({ id: "app-tna1-director" });
    notifyTna1DirectorValidated(applicant, "Dir. Santos");
    expect(
      notificationStore
        .getAll()
        .some(
          (n) =>
            n.applicantId === "app-tna1-director" &&
            n.audience === "applicant" &&
            n.kind === "success",
        ),
    ).toBe(true);
    const mail = outboxFor("app-tna1-director");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].kind).toBe("status");
    expect(mail[0].subject).toContain("validated");
    expect(mail[0].body).toContain("Dir. Santos");
    expect(mail[0].body).toContain("TNA Form 02");
  });

  it("skips email when the customer has no address", () => {
    const applicant = sampleApplicant({
      id: "app-tna1-director-no-mail",
      emailAddress: "",
    });
    notifyTna1DirectorValidated(applicant, "Dir. Santos");
    expect(outboxFor("app-tna1-director-no-mail")).toHaveLength(0);
    expect(
      notificationStore
        .getAll()
        .some(
          (n) =>
            n.applicantId === "app-tna1-director-no-mail" &&
            n.audience === "applicant",
        ),
    ).toBe(true);
  });
});

describe("notifyTna2Published", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("notifies and emails the cooperator when TNA Form 02 is published", () => {
    const applicant = sampleApplicant({ id: "app-tna2-pub" });
    notifyTna2Published(applicant);

    expect(
      notificationStore
        .getAll()
        .some(
          (n) =>
            n.applicantId === "app-tna2-pub" &&
            n.audience === "applicant" &&
            n.kind === "success" &&
            n.view === "tna2",
        ),
    ).toBe(true);

    const mail = outboxFor("app-tna2-pub");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].kind).toBe("status");
    expect(mail[0].to).toEqual(["juan@testfoods.example"]);
    expect(mail[0].subject).toContain("published");
    expect(mail[0].body).toContain("Technology Needs Assessment Report");
    expect(mail[0].body).toContain("TNA Form 02");
    expect(mail[0].body).toContain("Project Proposal");
    expect(mail[0].module).toBe("tna2");
  });

  it("still notifies in-app when the cooperator has no email", () => {
    const applicant = sampleApplicant({
      id: "app-tna2-pub-no-mail",
      emailAddress: "",
    });
    notifyTna2Published(applicant);
    expect(outboxFor("app-tna2-pub-no-mail")).toHaveLength(0);
    expect(
      notificationStore
        .getAll()
        .some(
          (n) =>
            n.applicantId === "app-tna2-pub-no-mail" &&
            n.audience === "applicant",
        ),
    ).toBe(true);
  });
});

describe("notifyRtecSubmitted", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("notifies and emails the cooperator and DOST staff", () => {
    const applicant = sampleApplicant({ id: "app-rtec-done" });
    notifyRtecSubmitted(applicant);

    const notices = notificationStore.getAll();
    expect(
      notices.some(
        (n) =>
          n.applicantId === "app-rtec-done" &&
          n.audience === "applicant" &&
          n.message.includes("RTEC evaluation is complete"),
      ),
    ).toBe(true);
    expect(
      notices.some(
        (n) =>
          n.applicantId === "app-rtec-done" &&
          n.audience === "staff" &&
          n.view === "approval-letter" &&
          n.message.includes("Test Foods"),
      ),
    ).toBe(true);

    const mail = outboxFor("app-rtec-done");
    const cooperatorMail = mail.find((e) =>
      e.to.includes("juan@testfoods.example"),
    );
    expect(cooperatorMail).toBeDefined();
    expect(cooperatorMail?.kind).toBe("status");
    expect(cooperatorMail?.subject).toContain("RTEC Report completed");
    expect(cooperatorMail?.body).toContain("RTEC evaluation is complete");
    expect(cooperatorMail?.module).toBe("conduct-rtec");

    const staffMail = mail.find((e) =>
      e.to.some((addr) => addr !== "juan@testfoods.example"),
    );
    expect(staffMail).toBeDefined();
    expect(staffMail?.to).toEqual(staffMailboxEmails(applicant));
    expect(staffMail?.to).toContain("pstc_southcot@region12.dost.gov.ph");
    expect(staffMail?.to).toContain("records@region12.dost.gov.ph");
    expect(staffMail?.subject).toContain("RTEC Report completed");
    expect(staffMail?.body).toContain("Test Foods");
    expect(staffMail?.body).toContain(
      "send it to the Regional Director for decision",
    );
    expect(staffMail?.body).toContain("Juan Dela Cruz");
    expect(staffMail?.module).toBe("conduct-rtec");
  });

  it("still notifies both audiences when the cooperator has no email", () => {
    const applicant = sampleApplicant({
      id: "app-rtec-done-no-mail",
      emailAddress: "",
    });
    notifyRtecSubmitted(applicant);

    const notices = notificationStore.getAll();
    expect(
      notices.some(
        (n) =>
          n.applicantId === "app-rtec-done-no-mail" &&
          n.audience === "applicant",
      ),
    ).toBe(true);
    expect(
      notices.some(
        (n) =>
          n.applicantId === "app-rtec-done-no-mail" && n.audience === "staff",
      ),
    ).toBe(true);

    const mail = outboxFor("app-rtec-done-no-mail");
    expect(mail).toHaveLength(1);
    expect(mail[0].to).toEqual(staffMailboxEmails(applicant));
    expect(mail[0].to).not.toContain("");
  });
});

describe("notifyModuleCompleted RTEC", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("does not send a second generic email after dedicated RTEC notices", () => {
    const applicant = sampleApplicant({ id: "app-rtec-advance" });
    notifyModuleCompleted(applicant, "conduct-rtec");
    expect(outboxFor("app-rtec-advance")).toHaveLength(0);
    expect(
      notificationStore
        .getAll()
        .some((n) => n.id === "step-complete-app-rtec-advance-conduct-rtec"),
    ).toBe(false);
  });
});

describe("notifyApprovalLetterPublished", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("notifies and emails the cooperator and DOST staff", () => {
    const applicant = sampleApplicant({ id: "app-noa-pub" });
    notifyApprovalLetterPublished(applicant);

    const notices = notificationStore.getAll();
    expect(
      notices.some(
        (n) =>
          n.applicantId === "app-noa-pub" &&
          n.audience === "applicant" &&
          n.urgent === true &&
          n.message.includes("acknowledge conforme"),
      ),
    ).toBe(true);
    expect(
      notices.some(
        (n) =>
          n.applicantId === "app-noa-pub" &&
          n.audience === "staff" &&
          n.view === "approval-letter" &&
          n.message.includes("Test Foods"),
      ),
    ).toBe(true);

    const mail = outboxFor("app-noa-pub");
    const cooperatorMail = mail.find((e) =>
      e.to.includes("juan@testfoods.example"),
    );
    expect(cooperatorMail).toBeDefined();
    expect(cooperatorMail?.subject).toContain("Notice of Approval published");
    expect(cooperatorMail?.body).toContain("Form 003");
    expect(cooperatorMail?.module).toBe("approval-letter");

    const staffMail = mail.find((e) =>
      e.to.some((addr) => addr !== "juan@testfoods.example"),
    );
    expect(staffMail).toBeDefined();
    expect(staffMail?.to).toEqual(staffMailboxEmails(applicant));
    expect(staffMail?.subject).toContain("Notice of Approval published");
    expect(staffMail?.body).toContain("Test Foods");
    expect(staffMail?.module).toBe("approval-letter");
  });
});

describe("notifyApprovalLetterRdDecision", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("notifies and emails both audiences when the Regional Director approves", () => {
    const applicant = sampleApplicant({ id: "app-noa-rd-ok" });
    notifyApprovalLetterRdDecision(applicant, "approved");

    const notices = notificationStore.getAll();
    expect(
      notices.some(
        (n) =>
          n.applicantId === "app-noa-rd-ok" &&
          n.audience === "applicant" &&
          n.title === "Regional Director approved",
      ),
    ).toBe(true);
    expect(
      notices.some(
        (n) =>
          n.applicantId === "app-noa-rd-ok" &&
          n.audience === "staff" &&
          n.kind === "action",
      ),
    ).toBe(true);

    const mail = outboxFor("app-noa-rd-ok");
    const cooperatorMail = mail.find((e) =>
      e.to.includes("juan@testfoods.example"),
    );
    expect(cooperatorMail?.subject).toContain("Regional Director approved");
    expect(cooperatorMail?.body).toContain("publish the Notice of Approval");
    expect(cooperatorMail?.module).toBe("approval-letter");

    const staffMail = mail.find((e) =>
      e.to.some((addr) => addr !== "juan@testfoods.example"),
    );
    expect(staffMail?.to).toEqual(staffMailboxEmails(applicant));
    expect(staffMail?.subject).toContain("ready to publish");
    expect(staffMail?.body).toContain("Test Foods");
  });

  it("notifies and emails both audiences when the Regional Director disapproves", () => {
    const applicant = sampleApplicant({ id: "app-noa-rd-no" });
    notifyApprovalLetterRdDecision(applicant, "disapproved");

    expect(
      notificationStore
        .getAll()
        .some(
          (n) =>
            n.applicantId === "app-noa-rd-no" &&
            n.audience === "applicant" &&
            n.kind === "warning",
        ),
    ).toBe(true);

    const mail = outboxFor("app-noa-rd-no");
    const cooperatorMail = mail.find((e) =>
      e.to.includes("juan@testfoods.example"),
    );
    expect(cooperatorMail?.subject).toContain("Regional Director disapproved");
    const staffMail = mail.find((e) =>
      e.to.some((addr) => addr !== "juan@testfoods.example"),
    );
    expect(staffMail?.to).toEqual(staffMailboxEmails(applicant));
    expect(staffMail?.body).toContain("Re-endorse");
  });
});

describe("handoff notifications", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    health.mockResolvedValue({ smtpEnabled: false });
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("addresses the RTEC-ready handoff to RTEC staff", () => {
    const applicant = sampleApplicant({ id: "app-rtec-ready" });
    notifyRtecReady(applicant);

    const rows = notificationStore
      .getAll()
      .filter((n) => n.applicantId === "app-rtec-ready");

    const rtecRow = rows.find((n) => n.targetRoles?.includes("rtec-staff"));
    expect(rtecRow).toBeDefined();
    expect(rtecRow?.audience).toBe("staff");
    expect(rtecRow?.view).toBe("conduct-rtec");
    expect(rtecRow?.urgent).toBe(true);

    // Casework keeps a non-actionable copy so PSTO can see where the case went.
    const caseworkRow = rows.find(
      (n) => n.audience === "staff" && n.targetRoles?.includes("agent"),
    );
    expect(caseworkRow?.kind).toBe("info");

    expect(rows.some((n) => n.audience === "applicant")).toBe(true);
  });

  it("addresses the approval endorsement to the Regional Director only", () => {
    const applicant = sampleApplicant({ id: "app-awaiting-rd" });
    notifyApprovalLetterAwaitingRd(applicant);

    const rows = notificationStore
      .getAll()
      .filter((n) => n.applicantId === "app-awaiting-rd");

    const rdRow = rows.find((n) => n.audience === "staff");
    expect(rdRow?.targetRoles).toEqual(["regional-director"]);
    expect(rdRow?.kind).toBe("action");
    expect(rdRow?.view).toBe("approval-letter");

    const mail = outboxFor("app-awaiting-rd");
    expect(mail.length).toBeGreaterThan(0);
    expect(mail[0].to).toEqual(staffMailboxEmails(applicant));
  });

  it("routes the completed RTEC report to casework, not to RTEC staff", () => {
    const applicant = sampleApplicant({ id: "app-rtec-done" });
    notifyRtecSubmitted(applicant);

    const staffRow = notificationStore
      .getAll()
      .find((n) => n.applicantId === "app-rtec-done" && n.audience === "staff");
    expect(staffRow?.targetRoles).toEqual(["agent", "provincial-director"]);
    expect(staffRow?.view).toBe("approval-letter");
  });

  it("directs TNA Form 01 validation to the Provincial Director only", () => {
    const applicant = sampleApplicant({ id: "app-tna1-pd" });
    notifyTna1AwaitingDirector(applicant);

    const row = notificationStore
      .getAll()
      .find((n) => n.applicantId === "app-tna1-pd" && n.audience === "staff");
    expect(row?.targetRoles).toEqual(["provincial-director"]);
  });
});
