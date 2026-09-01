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
  notifyTna1Resubmission,
} from "../notificationHelpers";
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
