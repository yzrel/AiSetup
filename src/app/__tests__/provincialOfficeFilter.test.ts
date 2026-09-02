/**
 * Province filter helpers for staff dashboard scope.
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../store/applicantStore";
import {
  DASHBOARD_PROVINCE_ALL,
  filterApplicantsByProvince,
} from "../utils/provincialOffice";

function baseApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: "a1",
    applicationId: "LOI-2026-000001",
    applicantName: "Test User",
    designation: "Owner",
    enterpriseName: "Test Enterprise",
    contactNumber: "09171234567",
    emailAddress: "test@example.com",
    businessType: "Manufacturing",
    businessNature: "Food",
    businessSector: "Food Processing",
    yearsOfOperation: "5",
    enterpriseType: "Single Proprietorship",
    msmeSize: "Small",
    assetSize: "₱3M",
    region: "Region XII (SOCCSKSARGEN)",
    address: "Koronadal City, South Cotabato",
    currentModule: "prescreening",
    qualified: true,
    submittedAt: "2026-01-15T10:00:00.000Z",
    lastUpdated: "2026-01-20T10:00:00.000Z",
    moduleData: { province: "South Cotabato" },
    ...overrides,
  };
}

describe("filterApplicantsByProvince", () => {
  const applicants = [
    baseApplicant({
      id: "1",
      moduleData: { province: "South Cotabato" },
    }),
    baseApplicant({
      id: "2",
      address: "General Santos City",
      moduleData: { province: "General Santos City" },
    }),
    baseApplicant({
      id: "3",
      address: "Kidapawan City, Cotabato",
      moduleData: { province: "Cotabato" },
    }),
  ];

  it("returns all when filter is all", () => {
    expect(
      filterApplicantsByProvince(applicants, DASHBOARD_PROVINCE_ALL),
    ).toHaveLength(3);
  });

  it("returns all when filter is blank", () => {
    expect(filterApplicantsByProvince(applicants, "")).toHaveLength(3);
  });

  it("filters to a single province (case-insensitive)", () => {
    const rows = filterApplicantsByProvince(applicants, "south cotabato");
    expect(rows.map((a) => a.id)).toEqual(["1"]);
  });

  it("returns empty when no applicants match", () => {
    expect(
      filterApplicantsByProvince(applicants, "Sarangani"),
    ).toHaveLength(0);
  });

  it("does not throw when address and region are null on the applicant", () => {
    const row = baseApplicant({
      id: "null-addr",
      address: null as unknown as string,
      region: null as unknown as string,
      moduleData: {},
    });
    expect(() => filterApplicantsByProvince([row], "Cotabato")).not.toThrow();
    expect(filterApplicantsByProvince([row], "Cotabato")).toHaveLength(0);
  });
});
