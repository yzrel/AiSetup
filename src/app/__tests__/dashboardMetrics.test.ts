/**
 * Dashboard metrics aggregators — live vs sample fallback behavior.
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../store/applicantStore";
import {
  buildFundDisbursementChartData,
  getMonthlyTrendsData,
  getPipelineChartData,
  getProgramKpis,
  getRegionBreakdownData,
  getRegistrantGenderBreakdown,
  getTopSectorsData,
  getWorkforceGenderTotals,
  normalizeRegistrantGender,
  withLiveOrFallback,
} from "../utils/dashboardMetrics";
import { WITHDRAWAL_SIGNED_KEY } from "../utils/landBankWithdrawal";

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

describe("withLiveOrFallback", () => {
  it("returns fallback when live is empty", () => {
    expect(withLiveOrFallback([], [1, 2])).toEqual([1, 2]);
  });

  it("returns live when non-empty", () => {
    expect(withLiveOrFallback([9], [1, 2])).toEqual([9]);
  });

  it("honors custom emptiness check", () => {
    expect(
      withLiveOrFallback([{ n: 0 }], [{ n: 5 }], (rows) =>
        rows.every((r) => r.n === 0),
      ),
    ).toEqual([{ n: 5 }]);
  });
});

describe("getPipelineChartData", () => {
  it("returns empty for no applicants", () => {
    expect(getPipelineChartData([])).toEqual([]);
  });

  it("buckets known currentModule values", () => {
    const rows = getPipelineChartData([
      baseApplicant({ id: "1", currentModule: "prescreening" }),
      baseApplicant({ id: "2", currentModule: "tna1" }),
      baseApplicant({ id: "3", currentModule: "tna2" }),
      baseApplicant({ id: "4", currentModule: "approval-letter" }),
      baseApplicant({ id: "5", currentModule: "landbank-withdrawal" }),
    ]);
    const byStage = Object.fromEntries(rows.map((r) => [r.stage, r.count]));
    expect(byStage["Pre-Screen"]).toBe(1);
    expect(byStage["Assessment"]).toBe(2);
    expect(byStage["Approved"]).toBe(1);
    expect(byStage["Released"]).toBe(1);
  });
});

describe("getRegionBreakdownData / getTopSectorsData", () => {
  it("counts provinces and sectors", () => {
    const applicants = [
      baseApplicant({
        id: "1",
        businessSector: "Food Processing",
        moduleData: { province: "South Cotabato" },
      }),
      baseApplicant({
        id: "2",
        businessSector: "Food Processing",
        moduleData: { province: "Sarangani" },
      }),
      baseApplicant({
        id: "3",
        businessSector: "Electronics and ICT Services",
        moduleData: { province: "South Cotabato" },
      }),
    ];
    const regions = getRegionBreakdownData(applicants);
    expect(regions.find((r) => r.name === "South Cotabato")?.value).toBe(2);
    expect(regions.find((r) => r.name === "Sarangani")?.value).toBe(1);

    const sectors = getTopSectorsData(applicants);
    expect(sectors[0]?.sector).toBe("Food Processing");
    expect(sectors[0]?.count).toBe(2);
  });
});

describe("getMonthlyTrendsData", () => {
  it("ignores invalid dates and returns empty when none parse", () => {
    expect(
      getMonthlyTrendsData([
        baseApplicant({
          submittedAt: "not-a-date",
          lastUpdated: "also-bad",
          moduleData: {},
        }),
      ]),
    ).toEqual([]);
  });

  it("buckets a valid submission into the rolling window", () => {
    const now = new Date("2026-04-15T12:00:00.000Z");
    const rows = getMonthlyTrendsData(
      [
        baseApplicant({
          submittedAt: "2026-04-02T08:00:00.000Z",
          lastUpdated: "2026-04-02T08:00:00.000Z",
        }),
      ],
      now,
    );
    expect(rows.length).toBe(7);
    expect(rows[rows.length - 1]?.month).toBe("Apr");
    expect(rows[rows.length - 1]?.applications).toBe(1);
  });
});

describe("buildFundDisbursementChartData", () => {
  it("returns empty when no tranche amounts", () => {
    expect(buildFundDisbursementChartData([baseApplicant()])).toEqual([]);
  });

  it("sums tranche amounts into the signed month", () => {
    const now = new Date("2026-04-15T12:00:00.000Z");
    const applicant = baseApplicant({
      id: "lb1",
      currentModule: "landbank-withdrawal",
      moduleData: {
        province: "South Cotabato",
        landBank: {
          form: {
            accountSnapshot: null,
            withdrawalLetter: null,
            withdrawalRemarks: "",
            authorityLetterGenerated: false,
            tranches: {
              first: {
                tranche: 1,
                suppliers: [
                  {
                    id: "s1",
                    name: "Supplier",
                    equipment: [
                      { id: "e1", item: "Machine", amount: "₱1,200,000" },
                    ],
                  },
                ],
                selectedSupplierId: "s1",
                signedLetter: {
                  id: "doc1",
                  fileName: "t1.pdf",
                  uploadedAt: "2026-03-10T09:00:00.000Z",
                },
                quotations: [],
                equipmentPhotos: [],
                status: "complete",
              },
              second: {
                tranche: 2,
                suppliers: [],
                selectedSupplierId: null,
                signedLetter: null,
                quotations: [],
                equipmentPhotos: [],
                status: "draft",
              },
              third: {
                tranche: 3,
                suppliers: [],
                selectedSupplierId: null,
                signedLetter: null,
                quotations: [],
                equipmentPhotos: [],
                status: "draft",
              },
            },
          },
          submitted: true,
          submittedAt: "2026-03-10T09:00:00.000Z",
        },
        signedDocuments: {
          [WITHDRAWAL_SIGNED_KEY.first]: {
            id: "doc1",
            fileName: "t1.pdf",
            uploadedAt: "2026-03-10T09:00:00.000Z",
          },
        },
      },
    });

    const rows = buildFundDisbursementChartData([applicant], now);
    expect(rows.length).toBe(7);
    const mar = rows.find((r) => r.month === "Mar");
    expect(mar?.amount).toBe(1.2);
  });
});

describe("gender / GAD metrics", () => {
  it("normalizes registrant gender buckets", () => {
    expect(normalizeRegistrantGender("Male")).toBe("Male");
    expect(normalizeRegistrantGender("female")).toBe("Female");
    expect(normalizeRegistrantGender("Prefer not to say")).toBe(
      "Prefer not to say",
    );
    expect(normalizeRegistrantGender("")).toBe("Unknown");
  });

  it("aggregates registrant gender breakdown", () => {
    const rows = getRegistrantGenderBreakdown([
      baseApplicant({
        id: "1",
        moduleData: { province: "South Cotabato", gender: "Male" },
      }),
      baseApplicant({
        id: "2",
        moduleData: { province: "South Cotabato", gender: "Female" },
      }),
      baseApplicant({
        id: "3",
        moduleData: {
          province: "South Cotabato",
          gender: "Prefer not to say",
        },
      }),
    ]);
    const byName = Object.fromEntries(rows.map((r) => [r.name, r.count]));
    expect(byName.Male).toBe(1);
    expect(byName.Female).toBe(1);
    expect(byName["Prefer not to say"]).toBe(1);
  });

  it("sums workforce from proposal when PIS is absent", () => {
    const totals = getWorkforceGenderTotals([
      baseApplicant({
        id: "1",
        moduleData: {
          province: "South Cotabato",
          projectProposal: {
            form: {
              employeesMale: "12",
              employeesFemale: "8",
            },
          },
        },
      }),
    ]);
    expect(totals.male).toBe(12);
    expect(totals.female).toBe(8);
    expect(totals.total).toBe(20);
  });

  it("wires Jobs Created / Retained from workforce totals", () => {
    const kpis = getProgramKpis([
      baseApplicant({
        id: "1",
        currentModule: "approval-letter",
        moduleData: {
          province: "South Cotabato",
          tna1: {
            form: { employeesMale: "5", employeesFemale: "7" },
          },
        },
      }),
    ]);
    const jobs = kpis.find((k) => k.label === "Jobs Created / Retained");
    expect(jobs?.value).toBe("12");
  });
});
