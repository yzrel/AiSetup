/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  computeRawMaterialCostRow,
  emptyProjectProposalForm,
  emptyRawMaterialAllocationRow,
  emptyRawMaterialCostRow,
  rawMaterialAllocationFooterRow,
  rawMaterialCostFooterRow,
  recomputeRawMaterialCostTable,
  sumRawMaterialAllocationColumns,
  sumRawMaterialCostColumns,
} from "../projectProposal";
import { normalizeProjectProposalStored } from "../normalizeCriticalModuleData";

describe("computeRawMaterialCostRow", () => {
  it("computes batch = Qty × Unit Cost, Weekly = batch × batches, Monthly = Weekly × 4, Annually = Monthly × 12", () => {
    expect(
      computeRawMaterialCostRow(["Flour", "10", "kg", "25", "", "3", "", "", "", "Local mill"]),
    ).toEqual([
      "Flour",
      "10",
      "kg",
      "25",
      "₱250.00",
      "3",
      "₱750.00",
      "₱3,000.00",
      "₱36,000.00",
      "Local mill",
    ]);
  });

  it("leaves period amounts blank when qty, unit cost, or batches is missing", () => {
    expect(computeRawMaterialCostRow(["Sugar", "", "kg", "40", "", "2"])[4]).toBe("");
    expect(computeRawMaterialCostRow(["Sugar", "5", "kg", "", "", "2"])[6]).toBe("");
    expect(computeRawMaterialCostRow(["Sugar", "5", "kg", "40", "", ""])[8]).toBe("");
  });
});

describe("sumRawMaterialCostColumns", () => {
  it("returns empty totals for blank rows", () => {
    expect(sumRawMaterialCostColumns([emptyRawMaterialCostRow()])).toEqual({
      batch: "",
      weekly: "",
      monthly: "",
      annually: "",
    });
  });

  it("sums per-batch, weekly, monthly, and annually", () => {
    const rows = recomputeRawMaterialCostTable([
      ["Flour", "10", "kg", "25", "", "3"],
      ["Sugar", "2", "kg", "50", "", "3"],
    ]);
    const totals = sumRawMaterialCostColumns(rows);
    expect(totals.batch).toBe("₱350.00");
    expect(totals.weekly).toBe("₱1,050.00");
    expect(totals.monthly).toBe("₱4,200.00");
    expect(totals.annually).toBe("₱50,400.00");
  });

  it("does not total Qty, UOM, # of batches, or Source", () => {
    const footer = rawMaterialCostFooterRow([
      ["Flour", "10", "kg", "25", "", "3", "", "", "", "Mill"],
    ]);
    expect(footer[0]).toBe("Total");
    expect(footer[1]).toBe("");
    expect(footer[2]).toBe("");
    expect(footer[5]).toBe("");
    expect(footer[9]).toBe("");
    expect(footer[4]).toBe("₱250.00");
  });
});

describe("raw materials allocation totals", () => {
  it("sums Ratio and Weekly", () => {
    expect(
      sumRawMaterialAllocationColumns([
        ["Flour", "60", "100"],
        ["Sugar", "40", "50"],
      ]),
    ).toEqual({
      ratio: "100",
      weekly: "150",
    });
    expect(
      rawMaterialAllocationFooterRow([
        ["Flour", "60%", "100"],
        ["Sugar", "40%", "50"],
      ]),
    ).toEqual(["Total", "100", "150"]);
  });

  it("defaults three empty cells", () => {
    expect(emptyProjectProposalForm().rawMaterialAllocationTable).toEqual([
      emptyRawMaterialAllocationRow(),
    ]);
    expect(emptyProjectProposalForm().rawMaterialCostTable[0]).toHaveLength(10);
  });
});

describe("capacity tables hydrate", () => {
  it("wraps PowerShell-collapsed singleton cost and allocation tables", () => {
    const stored = normalizeProjectProposalStored({
      form: {
        rawMaterialCostTable: {
          0: "Flour",
          1: "10",
          2: "kg",
          3: "25",
          4: "250",
          5: "3",
          6: "750",
          7: "3000",
          8: "36000",
          9: "Mill",
        },
        rawMaterialAllocationTable: { 0: "Flour", 1: "60", 2: "100" },
      },
    });
    const form = stored?.form as {
      rawMaterialCostTable: unknown[];
      rawMaterialAllocationTable: unknown[];
    };
    expect(form.rawMaterialCostTable).toHaveLength(1);
    expect(form.rawMaterialAllocationTable).toHaveLength(1);
  });
});
