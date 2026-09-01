/**
 * Author: Yzrel Jade B. Eborde
 *
 * RTEC Staff (SETUP Guidelines 3.0) — Form 002 evaluator, not a case worker.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/authToken", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/authToken")>();
  return {
    ...actual,
    getAuthToken: vi.fn(() => "test-token"),
  };
});

vi.mock("../applicantPersistence", () => ({
  fetchBackendApplicants: vi.fn(),
  fetchBackendApplicant: vi.fn(),
  syncApplicantToBackendBestEffort: vi.fn(),
  syncModuleKeyToBackendBestEffort: vi.fn(),
}));

import { authStore, type AuthUser } from "../../store/authStore";
import { applicantStore } from "../../store/applicantStore";
import {
  appendRtecReviewComment,
  getRtecReportForm,
  getRtecReviewComments,
} from "../rtecReport";

function rtecUser(): AuthUser {
  return {
    id: "rtec-001",
    email: "rtec@dost.gov.ph",
    firstName: "RTEC",
    middleName: "",
    lastName: "Evaluator",
    role: "rtec-staff",
    enterpriseName: "DOST SOCCSKSARGEN — RTEC",
    officeId: "regional",
    verified: true,
  };
}

describe("rtec-staff access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applicantStore.resetForTests();
    authStore.logout();
  });

  it("limits shell views to evaluation surfaces and defaults to Conduct of RTEC", () => {
    const allowed = authStore.getAllowedViews("rtec-staff");
    expect(allowed).toEqual(
      expect.arrayContaining([
        "dashboard",
        "tna1",
        "tna2",
        "project-proposal",
        "requirements",
        "conduct-rtec",
        "clients",
        "client-files",
      ]),
    );
    expect(allowed).not.toContain("prescreening");
    expect(allowed).not.toContain("approval-letter");
    expect(allowed).not.toContain("landbank-withdrawal");
    expect(allowed).not.toContain("account-management");
    expect(allowed).not.toContain("sent-emails");
    expect(authStore.getDefaultView("rtec-staff")).toBe("conduct-rtec");
    expect(authStore.canAccessDashboardTab("rtec-staff", "analytics")).toBe(
      false,
    );
    expect(authStore.canAccessDashboardTab("rtec-staff", "alerts")).toBe(true);
    expect(authStore.isRtecStaff("rtec-staff")).toBe(true);
  });

  it("appends review comments to Section IV without wiping existing recommendation", () => {
    const app = applicantStore.add({
      applicantName: "Juan Dela Cruz",
      designation: "Owner",
      enterpriseName: "Acme Foods",
      contactNumber: "09171234567",
      emailAddress: "juan@example.com",
      businessType: "DTI",
      businessNature: "Processing",
      businessSector: "Food",
      yearsOfOperation: "5",
      enterpriseType: "",
      msmeSize: "Micro",
      assetSize: "1000000",
      region: "South Cotabato",
      address: "Koronadal City, South Cotabato",
      currentModule: "conduct-rtec",
      qualified: true,
      moduleData: {},
    });
    applicantStore.update(app.id, {
      moduleData: {
        ...app.moduleData,
        rtecReport: {
          form: {
            ...getRtecReportForm(applicantStore.getById(app.id)),
            recommendation: "Proceed subject to PSTO monitoring.",
          },
          submitted: false,
        },
      },
    });

    const added = appendRtecReviewComment(
      app.id,
      rtecUser(),
      "tna1",
      "Plant layout does not match the process flow.",
    );
    expect(added?.text).toContain("Plant layout");

    const stored = applicantStore.getById(app.id);
    const rec = getRtecReportForm(stored).recommendation;
    expect(rec.startsWith("Proceed subject to PSTO monitoring.")).toBe(true);
    expect(rec).toContain("TNA Form 01");
    expect(rec).toContain("Plant layout does not match the process flow.");
    expect(getRtecReviewComments(stored)).toHaveLength(1);
  });
});
