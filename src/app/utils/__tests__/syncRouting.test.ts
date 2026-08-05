/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Applicant } from "../../store/applicantStore";

const getApplicant = vi.fn();
const updateApplicantHeader = vi.fn();
const patchApplicantModule = vi.fn();
const saveApplicantRecord = vi.fn();

vi.mock("../../api/client", () => {
  class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
      this.name = "ApiError";
    }
  }
  return {
    ApiError,
    api: {
      getApplicant: (...args: unknown[]) => getApplicant(...args),
      updateApplicantHeader: (...args: unknown[]) => updateApplicantHeader(...args),
      patchApplicantModule: (...args: unknown[]) => patchApplicantModule(...args),
      saveApplicantRecord: (...args: unknown[]) => saveApplicantRecord(...args),
    },
  };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function sampleApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: "app-1",
    applicationId: "LOI-2026-100001",
    applicantName: "Test",
    designation: "Owner",
    enterpriseName: "Test Co",
    contactNumber: "09171234567",
    emailAddress: "test@example.com",
    businessType: "DTI",
    businessNature: "",
    businessSector: "Food",
    yearsOfOperation: "3",
    enterpriseType: "",
    msmeSize: "Micro",
    assetSize: "",
    region: "Region XII (SOCCSKSARGEN)",
    address: "Koronadal",
    currentModule: "letter-of-intent",
    qualified: true,
    submittedAt: "",
    lastUpdated: new Date().toISOString(),
    moduleData: {
      loiDocument: { bodyParagraphs: ["Hello"] },
      tinNumber: "123",
    },
    ...overrides,
  };
}

describe("syncApplicantToBackend routing", () => {
  beforeEach(() => {
    vi.resetModules();
    getApplicant.mockReset();
    updateApplicantHeader.mockReset();
    patchApplicantModule.mockReset();
    saveApplicantRecord.mockReset();
  });

  it("cold-creates via full PUT when getApplicant returns 404", async () => {
    const { ApiError } = await import("../../api/client");
    getApplicant.mockRejectedValue(new ApiError("missing", 404));
    saveApplicantRecord.mockResolvedValue({});

    const { syncApplicantToBackend } = await import("../applicantPersistence");
    await syncApplicantToBackend(sampleApplicant());

    expect(saveApplicantRecord).toHaveBeenCalledTimes(1);
    expect(patchApplicantModule).not.toHaveBeenCalled();
    expect(updateApplicantHeader).not.toHaveBeenCalled();
  });

  it("patches modules before header when case exists", async () => {
    getApplicant.mockResolvedValue({});
    updateApplicantHeader.mockResolvedValue({});
    patchApplicantModule.mockResolvedValue({});
    saveApplicantRecord.mockResolvedValue({});

    const { syncApplicantToBackend } = await import("../applicantPersistence");
    await syncApplicantToBackend(sampleApplicant());

    expect(getApplicant).toHaveBeenCalledWith("app-1");
    expect(updateApplicantHeader).toHaveBeenCalledTimes(1);
    expect(patchApplicantModule).toHaveBeenCalled();
    const keys = patchApplicantModule.mock.calls.map((c) => c[1]);
    expect(keys).toContain("loiDocument");
    expect(keys).toContain("caseMeta");

    // Module patches must land before currentModule advance (branch caps).
    const firstPatchOrder = patchApplicantModule.mock.invocationCallOrder[0];
    const headerOrder = updateApplicantHeader.mock.invocationCallOrder[0];
    expect(firstPatchOrder).toBeLessThan(headerOrder);

    // Legacy blob is best-effort fire-and-forget
    expect(saveApplicantRecord).toHaveBeenCalled();
  });
});
