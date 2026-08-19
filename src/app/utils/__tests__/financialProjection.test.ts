/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  computeFinancialProjection,
  computeIncomeTax,
  emptyFinancialProjectionInputs,
  excelNpv,
  formatIrr,
  graduatedPit,
  irrNewton,
  parseMoney,
} from "../financialProjection";
import { prefillFinancialProjectionInputs } from "../financialProjectionStore";
import {
  buildDefaultRefundSchedule,
  emptyProjectProposalForm,
} from "../projectProposal";
import { applicantStore } from "../../store/applicantStore";
import type { FinancialProjectionInputs } from "../../api/types";

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in tests"))),
  );
});

function filledInputs(): FinancialProjectionInputs {
  return {
    ...emptyFinancialProjectionInputs(),
    productName: "Dried mango",
    equipment: [{ id: "e1", name: "Dryer", amount: 500_000, lifeYears: 5 }],
    preoperating: [{ id: "p1", name: "Product development", amount: 50_000, lifeYears: 5 }],
    products: [
      {
        id: "pr1",
        name: "Dried mango",
        srpQ1: 100,
        srpQ2: 100,
        srpQ3: 100,
        srpQ4: 100,
        costQ1: 40,
        qtyQ1: 1000,
        qtyQ2: 1000,
        qtyQ3: 1000,
        qtyQ4: 1000,
      },
    ],
    loanAmount: 200_000,
    loanTermYears: 5,
    loanInterestRate: 0.1,
    equity: 300_000,
    inventoryYear1: 20_000,
    salesGrowth: 0.1,
    cosIncrease: 0.05,
    salaryIncrease: 0.05,
    inflation: 0.03,
    marketing: 10_000,
    salaries: 120_000,
    logistics: 5_000,
    itSoftware: 2_000,
    transportation: 3_000,
    rental: 24_000,
    utilities: 6_000,
    communication: 2_400,
    taxesLicenses: 1_200,
    otherExpenses: 1_000,
    taxMethod: "sole8",
    setupRefundByYear: [0, 50_000, 50_000, 50_000, 50_000],
  };
}

describe("financial projection engine", () => {
  it("does not divide by zero when SRP is empty", () => {
    const snap = computeFinancialProjection(emptyFinancialProjectionInputs());
    expect(snap.incomeStatement.grossSales[0]).toBe(0);
    expect(snap.incomeStatement.costOfSales[0]).toBe(0);
    expect(snap.balanced).toBe(true);
  });

  it("uses straight-line depreciation and amortization", () => {
    const snap = computeFinancialProjection(filledInputs());
    expect(snap.equipmentTotal).toBe(500_000);
    expect(snap.preoperatingTotal).toBe(50_000);
    expect(snap.depreciationAnnual).toBe(100_000);
    expect(snap.amortizationAnnual).toBe(10_000);
  });

  it("computes year-1 sales as qty times SRP and COS with 1.01 cost step-up", () => {
    const snap = computeFinancialProjection(filledInputs());
    expect(snap.incomeStatement.grossSales[0]).toBe(400_000);
    const expectedCos =
      1000 * 40 +
      1000 * 40 * 1.01 +
      1000 * 40 * 1.01 * 1.01 +
      1000 * 40 * 1.01 * 1.01 * 1.01;
    expect(snap.incomeStatement.costOfSales[0]).toBeCloseTo(expectedCos, 0);
  });

  it("grows years 2-5 sales and applies statutory 13% plus 13th month", () => {
    const snap = computeFinancialProjection(filledInputs());
    expect(snap.incomeStatement.grossSales[1]).toBeCloseTo(440_000, 2);
    expect(snap.incomeStatement.statutory[0]).toBeCloseTo(15_600, 2);
    expect(snap.incomeStatement.thirteenth[0]).toBeCloseTo(10_000, 2);
    expect(snap.incomeStatement.rental[2]).toBe(24_000);
  });

  it("puts SETUP refund on cash flow and keeps commercial loan principal separate", () => {
    const snap = computeFinancialProjection(filledInputs());
    expect(snap.cashFlow.setupRefund[0]).toBe(0);
    expect(snap.cashFlow.setupRefund[1]).toBe(50_000);
    expect(snap.cashFlow.principal[0]).toBe(40_000);
    expect(snap.cashFlow.loanProceeds[0]).toBe(200_000);
  });

  it("balances the statement of financial position", () => {
    const snap = computeFinancialProjection(filledInputs());
    expect(snap.balanced).toBe(true);
    const diff = snap.balanceSheet.identityDiff.every((d) => Math.abs(d) <= 1);
    expect(diff).toBe(true);
  });

  it("applies 8% of gross in excess of ₱250,000 when sales do not exceed ₱3M", () => {
    expect(computeIncomeTax("sole8", 200_000, 50_000)).toBe(0);
    expect(computeIncomeTax("sole8", 400_000, 50_000)).toBe(12_000);
    expect(computeIncomeTax("sole8", 3_000_000, 50_000)).toBe(220_000);
    expect(computeIncomeTax("sole8", 3_000_000.01, 500_000)).toBe(
      22_500 + 0.2 * 100_000,
    );
    expect(graduatedPit(500_000)).toBe(22_500 + 0.2 * 100_000);
    expect(computeIncomeTax("cit", 1_000_000, 4_000_000)).toBe(800_000);
  });

  it("stops depreciation after NBV is zero so a 3-year life still balances", () => {
    const snap = computeFinancialProjection({
      ...filledInputs(),
      equipment: [{ id: "e1", name: "Dryer", amount: 300_000, lifeYears: 3 }],
      preoperating: [{ id: "p1", name: "Dev", amount: 30_000, lifeYears: 3 }],
    });
    expect(snap.depreciationAnnual).toBe(100_000);
    expect(snap.incomeStatement.depreciation.slice(0, 3)).toEqual([
      100_000, 100_000, 100_000,
    ]);
    expect(snap.incomeStatement.depreciation[3]).toBe(0);
    expect(snap.incomeStatement.amortization[3]).toBe(0);
    expect(snap.balanceSheet.assetsNet[2]).toBe(0);
    expect(snap.balanced).toBe(true);
  });

  it("keeps gross-profit percent at full ratio precision", () => {
    const snap = computeFinancialProjection(filledInputs());
    const sales = snap.incomeStatement.grossSales[0];
    const gp = snap.incomeStatement.grossProfit[0];
    const ratio = snap.incomeStatement.gpPercent[0];
    expect(ratio).toBeCloseTo(gp / sales, 8);
    expect(ratio).not.toBe(Math.round(ratio * 100) / 100);
  });

  it("matches Excel NPV period convention", () => {
    expect(excelNpv(0.1, [110, 121])).toBeCloseTo(200, 6);
  });

  it("computes Excel-style IRR and rejects unconverged or same-sign series", () => {
    expect(irrNewton([-100, 110], 0.1)).toBeCloseTo(0.1, 6);
    expect(irrNewton([-1, -1, -1, -1, -1], 0.1)).toBeNull();
    expect(formatIrr(5.6e18)).toBe("—");
    expect(formatIrr(0.125)).toBe("12.50%");
  });
});

describe("financial projection prefill", () => {
  it("maps proposal Y1–Y4 refund totals onto projection years 2–5 with a grace year", () => {
    const schedule = buildDefaultRefundSchedule("200000", "4");
    const totalRow = schedule[schedule.length - 1];
    const app = applicantStore.add({
      applicantName: "Prefill Test",
      designation: "Owner",
      enterpriseName: "Prefill Co",
      contactNumber: "09170000000",
      emailAddress: `prefill-${Date.now()}@example.com`,
      businessType: "DTI",
      businessNature: "",
      businessSector: "Food Processing",
      yearsOfOperation: "5",
      enterpriseType: "",
      msmeSize: "Small",
      assetSize: "",
      region: "South Cotabato",
      address: "Koronadal City, South Cotabato",
      currentModule: "project-proposal",
      qualified: true,
      moduleData: {
        projectProposal: {
          form: {
            ...emptyProjectProposalForm(),
            refundSchedule: schedule,
          },
          source: "wizard",
        },
      },
    });
    const inputs = prefillFinancialProjectionInputs(app);
    expect(inputs.setupRefundByYear).toEqual([
      0,
      parseMoney(totalRow[1]),
      parseMoney(totalRow[2]),
      parseMoney(totalRow[3]),
      parseMoney(totalRow[4]),
    ]);
  });
});

describe("financial projection excel export", () => {
  it("builds a workbook with the 2024 template sheet names", async () => {
    const { buildFinancialProjectionWorkbook } = await import("../financialProjectionExcel");
    const wb = await buildFinancialProjectionWorkbook({
      inputs: filledInputs(),
      snapshot: computeFinancialProjection(filledInputs()),
      applicationId: "LOI-2026-000001",
      enterpriseName: "Eborde Enterprise",
    });
    expect(wb.worksheets.map((w) => w.name)).toEqual([
      "Year 0",
      "Year 1",
      "Income Statement",
      "Cash Flow",
      "Balance Sheet",
      "Ratios",
      "Parameters",
    ]);
  });
});
