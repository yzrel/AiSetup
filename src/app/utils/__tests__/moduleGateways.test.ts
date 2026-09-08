/**
 * Author: Yzrel Jade B. Eborde
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applicantStore, type Applicant } from "../../store/applicantStore";
import { demoModeStore } from "../../store/demoModeStore";
import {
  canAdvanceFrom,
  isModuleComplete,
  isContentGateBlockingView,
} from "../moduleGateways";

function baseApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: "gate-1",
    applicationId: "LOI-2026-GATE01",
    enterpriseName: "Gate Test Co",
    tinNumber: "123-456-789-000",
    emailAddress: "gate@example.com",
    contactNumber: "09171234567",
    currentModule: "prescreening",
    qualified: false,
    moduleData: {},
    lastUpdated: new Date().toISOString(),
    ...overrides,
  } as Applicant;
}

describe("moduleGateways", () => {
  beforeEach(() => {
    applicantStore.resetForTests();
    demoModeStore.setEnabled(false);
  });

  afterEach(() => {
    demoModeStore.setEnabled(false);
  });

  it("blocks leaving tna1 without director validation", () => {
    const applicant = baseApplicant({
      qualified: true,
      currentModule: "tna1",
      moduleData: {
        tna1: { submitted: true, staffReviewed: true, directorValidated: false },
      },
    });
    expect(isModuleComplete(applicant, "tna1")).toBe(false);
    expect(canAdvanceFrom(applicant, "tna1").ok).toBe(false);
  });

  it("allows tna1 → tna2 after PD validation", () => {
    const applicant = baseApplicant({
      qualified: true,
      currentModule: "tna1",
      moduleData: {
        tna1: { submitted: true, staffReviewed: true, directorValidated: true },
      },
    });
    expect(isModuleComplete(applicant, "tna1")).toBe(true);
    const gate = canAdvanceFrom(applicant, "tna1");
    expect(gate.ok).toBe(true);
    expect(gate.next).toBe("tna2");
  });

  it("allows tna1 → tna2 after staff + PD even if submitted was cleared", () => {
    const applicant = baseApplicant({
      qualified: true,
      currentModule: "tna1",
      moduleData: {
        tna1: { submitted: false, staffReviewed: true, directorValidated: true },
      },
    });
    expect(isModuleComplete(applicant, "tna1")).toBe(true);
    expect(canAdvanceFrom(applicant, "tna1").ok).toBe(true);
  });

  it("blocks project-proposal until TNA2 is published when still on tna2", () => {
    const applicant = baseApplicant({
      qualified: true,
      currentModule: "tna2",
      moduleData: {
        tna1: { submitted: true, staffReviewed: true, directorValidated: true },
        tna2Document: { published: false },
      },
    });
    expect(canAdvanceFrom(applicant, "tna2").ok).toBe(false);
    expect(isContentGateBlockingView(applicant, "project-proposal")).toBe(true);
  });

  it("does not lock current project-proposal view when TNA2 unpublished (in-flight)", () => {
    const applicant = baseApplicant({
      qualified: true,
      currentModule: "project-proposal",
      moduleData: {
        tna1: { submitted: true, staffReviewed: true, directorValidated: true },
        tna2Document: { published: false },
      },
    });
    expect(isContentGateBlockingView(applicant, "project-proposal")).toBe(false);
    expect(isContentGateBlockingView(applicant, "requirements")).toBe(true);
  });

  it("blocks landbank without conforme even when RD approved notice exists", () => {
    const applicant = baseApplicant({
      qualified: true,
      currentModule: "approval-letter",
      moduleData: {
        approvalLetter: {
          published: true,
          rdDecision: "approved",
          acknowledged: false,
        },
      },
    });
    expect(isModuleComplete(applicant, "approval-letter")).toBe(false);
    expect(isContentGateBlockingView(applicant, "landbank-withdrawal")).toBe(true);
  });

  it("keeps requirements locked until project proposal is staff-approved", () => {
    const waiting = baseApplicant({
      qualified: true,
      currentModule: "project-proposal",
      moduleData: {
        projectProposal: {
          submitted: true,
          staffReviewed: false,
          form: {},
          attachments: [],
        },
      },
    });
    expect(isModuleComplete(waiting, "project-proposal")).toBe(false);
    expect(canAdvanceFrom(waiting, "project-proposal").ok).toBe(false);

    const approved = baseApplicant({
      qualified: true,
      currentModule: "project-proposal",
      moduleData: {
        projectProposal: {
          submitted: true,
          staffReviewed: true,
          form: {},
          attachments: [],
        },
      },
    });
    expect(isModuleComplete(approved, "project-proposal")).toBe(true);
    expect(canAdvanceFrom(approved, "project-proposal").ok).toBe(true);
    expect(canAdvanceFrom(approved, "project-proposal").next).toBe(
      "requirements",
    );
  });

  it("blocks advancing from project-proposal until the proposal is submitted", () => {
    const applicant = baseApplicant({
      qualified: true,
      currentModule: "project-proposal",
      moduleData: {
        projectProposal: {
          submitted: false,
          form: {},
          attachments: [],
        },
      },
    });
    expect(isModuleComplete(applicant, "project-proposal")).toBe(false);
    expect(canAdvanceFrom(applicant, "project-proposal").ok).toBe(false);
  });
});
