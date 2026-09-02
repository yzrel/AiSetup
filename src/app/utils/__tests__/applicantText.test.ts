/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import { applicantMatchesSearch, coerceApplicantStringFields } from "../applicantText";
import { resolveApplicantProvince } from "../provincialOffice";

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

describe("coerceApplicantStringFields", () => {
  it("replaces null profile strings with empty strings", () => {
    const coerced = coerceApplicantStringFields(
      baseApplicant({
        applicantName: null as unknown as string,
        address: null as unknown as string,
        emailAddress: null as unknown as string,
      }),
    );
    expect(coerced.applicantName).toBe("");
    expect(coerced.address).toBe("");
    expect(() => resolveApplicantProvince(coerced)).not.toThrow();
  });
});

describe("applicantMatchesSearch", () => {
  it("matches enterprise name case-insensitively", () => {
    expect(applicantMatchesSearch(baseApplicant(), "test enterprise")).toBe(true);
  });

  it("does not throw when searchable fields are null before coercion", () => {
    expect(() =>
      applicantMatchesSearch(
        baseApplicant({
          enterpriseName: null as unknown as string,
          applicantName: null as unknown as string,
        }),
        "abc",
      ),
    ).not.toThrow();
  });
});
