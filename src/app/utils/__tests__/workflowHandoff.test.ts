/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import { Applicant, ModuleStatus } from "../../store/applicantStore";
import {
  getWorkflowHandoff,
  handoffNotifyRoles,
  formatHandoffStrip,
  handoffActionView,
  isInRoleQueue,
  isStaffPendingHandoff,
  listPendingReview,
} from "../workflowHandoff";
import { getAwaitingStaffReviewMessage } from "../applicantProgress";
import { canMarkRtecComplete } from "../rtecReport";

function caseAt(
  currentModule: ModuleStatus,
  moduleData: Record<string, unknown> = {},
): Applicant {
  return {
    id: "app-handoff",
    applicationId: "LOI-2026-408723",
    applicantName: "Diana Renelei Eborde",
    designation: "Proprietor",
    enterpriseName: "Alaina's Bakeshoppe and Catering Services",
    contactNumber: "09041342392",
    emailAddress: "cooperator@example.com",
    businessType: "DTI",
    businessNature: "",
    businessSector: "Food Processing",
    yearsOfOperation: "5",
    enterpriseType: "",
    msmeSize: "Micro",
    assetSize: "",
    region: "Cotabato",
    address: "Cotabato",
    currentModule,
    qualified: true,
    submittedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    moduleData: { province: "Cotabato", ...moduleData },
  } as Applicant;
}

describe("getWorkflowHandoff", () => {
  it("waits on the cooperator through the self-service modules", () => {
    for (const module of [
      "prescreening",
      "registration",
      "letter-of-intent",
      "project-proposal",
    ] as ModuleStatus[]) {
      expect(getWorkflowHandoff(caseAt(module)).waitingOnRole).toBe(
        "cooperator",
      );
    }
  });

  it("routes TNA Form 01 from cooperator to agent to provincial director", () => {
    expect(getWorkflowHandoff(caseAt("tna1")).waitingOnRole).toBe("cooperator");

    const submitted = caseAt("tna1", { tna1: { submitted: true } });
    expect(getWorkflowHandoff(submitted).waitingOnRole).toBe("agent");

    const reviewed = caseAt("tna1", {
      tna1: { submitted: true, staffReviewed: true },
    });
    const handoff = getWorkflowHandoff(reviewed);
    expect(handoff.stage).toBe("tna1-awaiting-director");
    expect(handoff.waitingOnRole).toBe("provincial-director");

    const validated = caseAt("tna1", {
      tna1: { submitted: true, staffReviewed: true, directorValidated: true },
    });
    expect(getWorkflowHandoff(validated).stage).toBe("tna2-publish");
  });

  it("moves Requirements from upload to review to routing", () => {
    expect(getWorkflowHandoff(caseAt("requirements")).stage).toBe(
      "requirements-upload",
    );

    const submitted = caseAt("requirements", { documentsSubmitted: true });
    expect(getWorkflowHandoff(submitted).stage).toBe("requirements-review");

    const approved = caseAt("requirements", {
      documentsSubmitted: true,
      staffDecision: "approved",
    });
    const handoff = getWorkflowHandoff(approved);
    expect(handoff.stage).toBe("requirements-routing");
    expect(handoff.waitingOnRole).toBe("agent");
  });

  it("reports the MPEX branch regardless of currentModule", () => {
    const mpex = caseAt("requirements", {
      documentsSubmitted: true,
      staffDecision: "approved",
      routingDecision: "mpex",
    });
    expect(getWorkflowHandoff(mpex).stage).toBe("mpex");
    expect(getWorkflowHandoff(caseAt("conduct-rtec", { routingDecision: "mpex" })).stage).toBe(
      "mpex",
    );
  });

  it("waits on RTEC staff only once routing is confirmed", () => {
    const unrouted = caseAt("conduct-rtec", { staffDecision: "approved" });
    expect(getWorkflowHandoff(unrouted).stage).toBe("requirements-routing");

    const routed = caseAt("conduct-rtec", {
      staffDecision: "approved",
      routingDecision: "conduct-rtec",
    });
    const handoff = getWorkflowHandoff(routed);
    expect(handoff.stage).toBe("rtec-evaluation");
    expect(handoff.waitingOnRole).toBe("rtec-staff");
  });

  it("only waits on the Regional Director after an explicit endorsement", () => {
    const drafting = caseAt("approval-letter", {
      routingDecision: "conduct-rtec",
      approvalLetter: { published: false },
    });
    const draft = getWorkflowHandoff(drafting);
    expect(draft.stage).toBe("approval-draft");
    expect(draft.waitingOnRole).toBe("casework");

    const endorsed = caseAt("approval-letter", {
      routingDecision: "conduct-rtec",
      approvalLetter: {
        published: false,
        readyForRdAt: "2026-09-10T01:00:00.000Z",
      },
    });
    const awaiting = getWorkflowHandoff(endorsed);
    expect(awaiting.stage).toBe("approval-awaiting-rd");
    expect(awaiting.waitingOnRole).toBe("regional-director");
  });

  it("walks the approval letter through publish, conforme, and post-conforme", () => {
    const approved = caseAt("approval-letter", {
      approvalLetter: { published: false, rdDecision: "approved" },
    });
    expect(getWorkflowHandoff(approved).stage).toBe("approval-publish");

    const published = caseAt("approval-letter", {
      approvalLetter: { published: true, rdDecision: "approved" },
    });
    const conforme = getWorkflowHandoff(published);
    expect(conforme.stage).toBe("approval-conforme");
    expect(conforme.waitingOnRole).toBe("cooperator");

    const acknowledged = caseAt("approval-letter", {
      approvalLetter: { published: true, rdDecision: "approved", acknowledged: true },
    });
    expect(getWorkflowHandoff(acknowledged).stage).toBe("post-conforme");
  });

  it("reports the disapproved branch back to casework", () => {
    const disapproved = caseAt("approval-letter", {
      approvalLetter: { published: false, rdDecision: "disapproved" },
    });
    const handoff = getWorkflowHandoff(disapproved);
    expect(handoff.stage).toBe("approval-disapproved");
    expect(handoff.waitingOnRole).toBe("casework");
  });
});

describe("handoffNotifyRoles", () => {
  it("addresses each handoff to the role that must act", () => {
    expect(handoffNotifyRoles("regional-director")).toEqual([
      "regional-director",
    ]);
    expect(handoffNotifyRoles("rtec-staff")).toEqual(["rtec-staff"]);
    expect(handoffNotifyRoles("provincial-director")).toEqual([
      "provincial-director",
    ]);
    expect(handoffNotifyRoles("casework")).toEqual([
      "agent",
      "provincial-director",
    ]);
  });

  it("produces no staff row for cooperator-only steps", () => {
    expect(handoffNotifyRoles("cooperator")).toEqual([]);
    expect(handoffNotifyRoles("none")).toEqual([]);
  });
});

describe("pending review queue", () => {
  const agentReview = caseAt("tna1", {
    tna1: { submitted: true },
  });
  const directorReview = caseAt("tna1", {
    tna1: { submitted: true, staffReviewed: true },
  });
  const rtecReview = caseAt("conduct-rtec", {
    staffDecision: "approved",
    routingDecision: "conduct-rtec",
  });
  const regionalReview = caseAt("approval-letter", {
    approvalLetter: {
      published: false,
      readyForRdAt: "2026-09-10T01:00:00.000Z",
    },
  });
  const cooperatorStep = caseAt("registration");

  it("keeps only review and approval handoffs", () => {
    expect(isStaffPendingHandoff(getWorkflowHandoff(agentReview))).toBe(true);
    expect(isStaffPendingHandoff(getWorkflowHandoff(regionalReview))).toBe(
      true,
    );
    expect(isStaffPendingHandoff(getWorkflowHandoff(cooperatorStep))).toBe(
      false,
    );
    expect(
      isStaffPendingHandoff(getWorkflowHandoff(caseAt("refund-delinquent"))),
    ).toBe(false);
  });

  it("assigns cases to the responsible role", () => {
    expect(
      isInRoleQueue(getWorkflowHandoff(agentReview), "agent"),
    ).toBe(true);
    expect(
      isInRoleQueue(getWorkflowHandoff(directorReview), "provincial-director"),
    ).toBe(true);
    expect(
      isInRoleQueue(getWorkflowHandoff(rtecReview), "rtec-staff"),
    ).toBe(true);
    expect(
      isInRoleQueue(
        getWorkflowHandoff(regionalReview),
        "regional-director",
      ),
    ).toBe(true);
    expect(
      isInRoleQueue(getWorkflowHandoff(regionalReview), "agent"),
    ).toBe(false);
  });

  it("gives admins all pending cases and filters other personal queues", () => {
    const applicants = [
      agentReview,
      directorReview,
      rtecReview,
      regionalReview,
      cooperatorStep,
    ];
    expect(
      listPendingReview(applicants, { role: "admin" }, "mine"),
    ).toHaveLength(4);
    expect(
      listPendingReview(applicants, { role: "rtec-staff" }, "mine"),
    ).toHaveLength(1);
    expect(
      listPendingReview(applicants, { role: "rtec-staff" }, "all"),
    ).toHaveLength(4);
  });

  it("maps each handoff to its action module", () => {
    expect(handoffActionView(getWorkflowHandoff(directorReview))).toBe("tna1");
    expect(handoffActionView(getWorkflowHandoff(rtecReview))).toBe(
      "conduct-rtec",
    );
    expect(handoffActionView(getWorkflowHandoff(regionalReview))).toBe(
      "approval-letter",
    );
  });
});

describe("formatHandoffStrip", () => {
  it("names the waiting role and the next action", () => {
    const routed = caseAt("conduct-rtec", {
      staffDecision: "approved",
      routingDecision: "conduct-rtec",
    });
    expect(formatHandoffStrip(getWorkflowHandoff(routed))).toContain(
      "Waiting on RTEC Staff",
    );
  });
});

describe("applicant awaiting banner", () => {
  it("does not claim an RD decision is pending before endorsement", () => {
    const drafting = caseAt("approval-letter", {
      approvalLetter: { published: false },
    });
    const message = getAwaitingStaffReviewMessage(drafting);
    expect(message.title).toBe("Approval letter being prepared");
  });

  it("tells the cooperator when the Regional Director actually holds the case", () => {
    const endorsed = caseAt("approval-letter", {
      approvalLetter: { published: false, readyForRdAt: "2026-09-10T01:00:00.000Z" },
    });
    expect(getAwaitingStaffReviewMessage(endorsed).title).toBe(
      "Awaiting Regional Director decision",
    );
  });
});

describe("canMarkRtecComplete", () => {
  const complete = {
    staffDecision: "approved",
    routingDecision: "conduct-rtec",
    projectProposal: { submitted: true, form: { projectTitle: "Bakery upgrade" } },
  };

  it("allows completion once routing is confirmed and the case is on RTEC", () => {
    expect(canMarkRtecComplete(caseAt("conduct-rtec", complete)).ok).toBe(true);
  });

  /** Diana's case: approved requirements, but Confirm Routing never happened. */
  it("blocks completion when routing was never confirmed", () => {
    const unrouted = caseAt("requirements", {
      staffDecision: "approved",
      projectProposal: { submitted: true, form: { projectTitle: "Bakery upgrade" } },
    });
    const gate = canMarkRtecComplete(unrouted);
    expect(gate.ok).toBe(false);
    expect(gate.reason).toContain("Confirm & Proceed to RTEC Evaluation");
  });

  it("blocks completion while the case still sits on Requirements", () => {
    const gate = canMarkRtecComplete(caseAt("requirements", complete));
    expect(gate.ok).toBe(false);
    expect(gate.reason).toContain("not on Conduct of RTEC");
  });

  it("blocks completion when requirements are not staff-approved", () => {
    const gate = canMarkRtecComplete(
      caseAt("conduct-rtec", { routingDecision: "conduct-rtec" }),
    );
    expect(gate.ok).toBe(false);
  });

  it("accepts the legacy `setup` routing value", () => {
    const legacy = caseAt("conduct-rtec", { ...complete, routingDecision: "setup" });
    expect(canMarkRtecComplete(legacy).ok).toBe(true);
  });
});
