/**
 * Author: Yzrel Jade B. Eborde
 *
 * End-to-end handoff coverage for the stuck-case fix: Requirements routing →
 * RTEC Mark Complete → Send to Regional Director → RD decision → publish →
 * conforme, plus the navigation fallback for RTEC staff.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/client", () => ({
  api: {
    getApplicant: vi.fn(async () => {
      throw new Error("offline in tests");
    }),
    saveApplicantRecord: vi.fn(async () => undefined),
    updateApplicantHeader: vi.fn(async () => undefined),
    patchApplicantModule: vi.fn(async () => undefined),
    acknowledgeApprovalLetter: vi.fn(async () => undefined),
    listNotifications: vi.fn(async () => []),
    createNotifications: vi.fn(async (p: unknown[]) => p),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    health: vi.fn(async () => ({ smtpEnabled: false })),
    sendMail: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status = 500;
  },
}));

import { applicantStore, Applicant } from "../../store/applicantStore";
import { authStore } from "../../store/authStore";
import { demoModeStore } from "../../store/demoModeStore";
import {
  acknowledgeApprovalLetter,
  emptyApprovalLetterForm,
  endorseApprovalLetterToRd,
  hasRdApprovedNotice,
  isApprovalLetterEndorsedToRd,
  publishApprovalLetter,
  recordRdDecision,
  saveApprovalLetterDraft,
} from "../approvalLetter";
import {
  buildSubmittedRtecReport,
  canMarkRtecComplete,
  getRtecReportForm,
} from "../rtecReport";
import { isApplicantViewLocked } from "../applicantProgress";
import { getWorkflowHandoff } from "../workflowHandoff";

function seedCase(): Applicant {
  return applicantStore.add({
    applicantName: "Diana Renelei Eborde",
    designation: "Proprietor",
    enterpriseName: "Alaina's Bakeshoppe and Catering Services",
    contactNumber: "09041342392",
    emailAddress: `pipeline-${Date.now()}-${Math.random()}@example.com`,
    businessType: "DTI",
    businessNature: "",
    businessSector: "Food Processing",
    yearsOfOperation: "5",
    enterpriseType: "",
    msmeSize: "Micro",
    assetSize: "",
    region: "Region XII (SOCCSKSARGEN)",
    address: "Cotabato City, Cotabato",
    currentModule: "requirements",
    qualified: true,
    moduleData: {
      province: "Cotabato",
      documentsSubmitted: true,
      staffDecision: "approved",
      projectProposal: {
        submitted: true,
        form: { projectTitle: "Bakery equipment upgrade" },
      },
    },
  });
}

function current(id: string): Applicant {
  return applicantStore.getById(id)!;
}

describe("RTEC handoff pipeline", () => {
  beforeEach(() => {
    demoModeStore.setEnabled(false);
  });

  it("blocks Mark Complete until provincial staff confirm routing", () => {
    const seeded = seedCase();

    // Diana's exact state: requirements approved, routing never confirmed.
    expect(canMarkRtecComplete(current(seeded.id)).ok).toBe(false);
    expect(getWorkflowHandoff(current(seeded.id)).stage).toBe(
      "requirements-routing",
    );

    // Confirm routing is the handoff that hands the case to RTEC.
    applicantStore.update(seeded.id, {
      currentModule: "conduct-rtec",
      moduleData: {
        ...seeded.moduleData,
        routingDecision: "conduct-rtec",
      },
    });

    const routed = current(seeded.id);
    expect(canMarkRtecComplete(routed).ok).toBe(true);
    const handoff = getWorkflowHandoff(routed);
    expect(handoff.stage).toBe("rtec-evaluation");
    expect(handoff.waitingOnRole).toBe("rtec-staff");
  });

  it("unlocks the cooperator's Approval Letter through the full happy path", () => {
    const seeded = seedCase();
    applicantStore.update(seeded.id, {
      currentModule: "conduct-rtec",
      moduleData: { ...seeded.moduleData, routingDecision: "conduct-rtec" },
    });

    // Locked while RTEC still holds the case.
    expect(isApplicantViewLocked(current(seeded.id), "approval-letter")).toBe(
      true,
    );

    // RTEC Mark Complete: report + assessment + advance in one write.
    const routed = current(seeded.id);
    applicantStore.update(seeded.id, {
      currentModule: "approval-letter",
      moduleData: {
        ...routed.moduleData,
        rtecReport: buildSubmittedRtecReport(routed, getRtecReportForm(routed)),
        assessments: [
          {
            stage: "post-proposal",
            decision: "rtec-completed",
            assessedBy: "rtec@dost.gov.ph",
            assessedAt: new Date().toISOString(),
          },
        ],
      },
    });

    // Approval Letter view is reachable as soon as the case lands there.
    expect(isApplicantViewLocked(current(seeded.id), "approval-letter")).toBe(
      false,
    );
    expect(getWorkflowHandoff(current(seeded.id)).stage).toBe("approval-draft");

    // Casework drafts, then explicitly endorses for RD decision.
    const form = emptyApprovalLetterForm();
    saveApprovalLetterDraft(seeded.id, form);
    expect(isApprovalLetterEndorsedToRd(current(seeded.id))).toBe(false);

    expect(endorseApprovalLetterToRd(seeded.id, form, "agent@dost.gov.ph").ok).toBe(
      true,
    );
    expect(getWorkflowHandoff(current(seeded.id)).waitingOnRole).toBe(
      "regional-director",
    );

    // RD approves, casework publishes, cooperator signs conforme.
    recordRdDecision(seeded.id, "approved", "rd@dost.gov.ph", form);
    expect(getWorkflowHandoff(current(seeded.id)).stage).toBe("approval-publish");

    expect(publishApprovalLetter(seeded.id, form).ok).toBe(true);
    expect(hasRdApprovedNotice(current(seeded.id))).toBe(true);
    expect(getWorkflowHandoff(current(seeded.id)).stage).toBe("approval-conforme");

    acknowledgeApprovalLetter(seeded.id, "Diana Renelei Eborde");
    expect(getWorkflowHandoff(current(seeded.id)).stage).toBe("post-conforme");
  });

  it("keeps the MPEX branch out of the RTEC pipeline", () => {
    const seeded = seedCase();
    applicantStore.update(seeded.id, {
      moduleData: { ...seeded.moduleData, routingDecision: "mpex" },
    });

    const mpex = current(seeded.id);
    expect(getWorkflowHandoff(mpex).stage).toBe("mpex");
    expect(canMarkRtecComplete(mpex).ok).toBe(false);
  });
});

describe("post-Mark-Complete navigation", () => {
  it("sends RTEC staff to a view they can actually open", () => {
    // The fallback in App.tsx keys off this permission, so assert the premise.
    expect(authStore.canAccessView("rtec-staff", "approval-letter")).toBe(false);
    expect(authStore.canAccessView("rtec-staff", "clients")).toBe(true);

    for (const role of ["agent", "provincial-director", "regional-director", "admin"] as const) {
      expect(authStore.canAccessView(role, "approval-letter")).toBe(true);
    }
  });
});
