/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  applyLoiRepaymentComputations,
  computeEstimatedMonthlyAmortization,
  defaultRepaymentStartDate,
  selectedTermYears,
} from "../refundSchedule";

describe("computeEstimatedMonthlyAmortization", () => {
  it("divides requested amount by months in the selected term", () => {
    expect(computeEstimatedMonthlyAmortization("1900000", "4 years")).toBe(
      "39,583.33",
    );
    expect(computeEstimatedMonthlyAmortization("₱1,200,000", "3 years")).toBe(
      "33,333.33",
    );
    expect(computeEstimatedMonthlyAmortization("2,000,000", "5 years")).toBe(
      "33,333.33",
    );
  });

  it("stays blank until both amount and term are present", () => {
    expect(computeEstimatedMonthlyAmortization("1900000", "")).toBe("");
    expect(computeEstimatedMonthlyAmortization("", "4 years")).toBe("");
  });
});

describe("selectedTermYears", () => {
  it("reads years from the LOI term labels", () => {
    expect(selectedTermYears("3 years")).toBe(3);
    expect(selectedTermYears("4 years")).toBe(4);
    expect(selectedTermYears("5 years")).toBe(5);
    expect(selectedTermYears("")).toBe(0);
  });
});

describe("defaultRepaymentStartDate", () => {
  it("fills one year after the reference date", () => {
    expect(defaultRepaymentStartDate(new Date(2026, 8, 8))).toBe("2027-09-08");
  });
});

describe("applyLoiRepaymentComputations", () => {
  it("computes amort and fills an empty start date", () => {
    const next = applyLoiRepaymentComputations(
      {
        requestedAmount: "1900000",
        repaymentTerm: "4 years",
        monthlyAmortization: "",
        startDate: "",
      },
      new Date(2026, 8, 8),
    );
    expect(next.monthlyAmortization).toBe("39,583.33");
    expect(next.startDate).toBe("2027-09-08");
  });

  it("keeps a start date the applicant already entered", () => {
    const next = applyLoiRepaymentComputations(
      {
        requestedAmount: "1900000",
        repaymentTerm: "4 years",
        monthlyAmortization: "1",
        startDate: "2028-01-15",
      },
      new Date(2026, 8, 8),
    );
    expect(next.startDate).toBe("2028-01-15");
    expect(next.monthlyAmortization).toBe("39,583.33");
  });
});
