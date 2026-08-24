/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchBackendApplicants, fetchBackendApplicant } = vi.hoisted(() => ({
  fetchBackendApplicants: vi.fn(),
  fetchBackendApplicant: vi.fn(),
}));

vi.mock("../../api/authToken", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/authToken")>();
  return {
    ...actual,
    getAuthToken: vi.fn(() => "test-token"),
  };
});

vi.mock("../../utils/applicantPersistence", () => ({
  fetchBackendApplicants,
  fetchBackendApplicant,
  syncApplicantToBackendBestEffort: vi.fn(),
}));

import { authStore, type AuthUser } from "../authStore";
import { applicantStore } from "../applicantStore";

function staffUser(): AuthUser {
  return {
    id: "admin-001",
    email: "admin@dost.gov.ph",
    firstName: "DOST",
    middleName: "",
    lastName: "Admin",
    role: "admin",
    enterpriseName: "DOST SOCCSKSARGEN — Regional Office",
    officeId: "regional",
    verified: true,
  };
}

describe("applicantStore.hydrateFromBackend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applicantStore.resetForTests();
    authStore.logout();
    authStore.login(staffUser());
  });

  it("starts empty and loads MySQL cases after a failed fetch then retry", async () => {
    fetchBackendApplicants.mockResolvedValueOnce(null);
    await applicantStore.hydrateFromBackend();
    expect(applicantStore.getAll()).toEqual([]);

    fetchBackendApplicants.mockResolvedValueOnce([
      {
        id: "99d74117-0ebb-4539-a86b-bee4f7d3800c",
        applicationId: "LOI-2024-0003K1",
        enterpriseName: "Three K Printshop",
        currentModule: "project-closeout",
        moduleData: { province: "Cotabato" },
        profile: {
          applicantName: "Printshop Owner",
          address: "219 F. Cajelo St., Poblacion, Antipas, Cotabato",
        },
        updatedAt: "2026-08-19T08:04:02.523706Z",
      },
      {
        id: "1785725766162",
        applicationId: "LOI-2026-278772",
        enterpriseName: "Eborde Enterprise",
        currentModule: "tna2",
        moduleData: { province: "South Cotabato" },
        profile: { applicantName: "Yzrel Eborde" },
        updatedAt: "2026-08-18T03:19:36.807793Z",
      },
    ]);
    await applicantStore.hydrateFromBackend();
    const names = applicantStore.getAll().map((a) => a.enterpriseName);
    expect(names).toEqual(["Three K Printshop", "Eborde Enterprise"]);
    expect(applicantStore.getById("1")).toBeUndefined();
  });

  it("replaces the live list with the successful staff SoR response", async () => {
    fetchBackendApplicants.mockResolvedValue([
      {
        id: "1",
        applicationId: "LOI-2024-000145",
        enterpriseName: "ABC Food Processing",
        currentModule: "tna2",
        moduleData: {},
        profile: {},
        updatedAt: "2026-08-19T00:19:21.603553Z",
      },
    ]);
    await applicantStore.hydrateFromBackend();
    expect(applicantStore.getAll().map((a) => a.id)).toEqual(["1"]);
    expect(applicantStore.getById("4")).toBeUndefined();
  });

  it("clears demo seeds when the staff list returns empty", async () => {
    applicantStore.loadDemoSeedsForTests();
    expect(applicantStore.getById("1")?.enterpriseName).toBe(
      "ABC Food Processing",
    );

    fetchBackendApplicants.mockResolvedValue([]);
    await applicantStore.hydrateFromBackend();
    expect(applicantStore.getAll()).toEqual([]);
  });
});
