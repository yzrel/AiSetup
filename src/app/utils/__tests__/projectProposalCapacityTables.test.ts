/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  buildProjectProposalDraft,
  computeRawMaterialCostRow,
  emptyProjectProposalForm,
  emptyRawMaterialAllocationRow,
  emptyRawMaterialCostRow,
  rawMaterialAllocationFooterRow,
  rawMaterialAllocationRowsFromTna,
  rawMaterialCostFooterRow,
  rawMaterialCostRowsFromTna,
  recomputeRawMaterialCostTable,
  sumRawMaterialAllocationColumns,
  sumRawMaterialCostColumns,
} from "../projectProposal";
import { normalizeProjectProposalStored } from "../normalizeCriticalModuleData";
import type { Applicant } from "../../store/applicantStore";

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

const TNA_RAW_MATERIALS = [
  ["Cassava", "Local farm", "2", "7,500"],
  ["Sugar", "Trader", "40", "2,500"],
];

describe("TNA raw-material forwarding", () => {
  it("maps TNA volume, unit cost, and source into Raw Material Cost", () => {
    const rows = rawMaterialCostRowsFromTna(TNA_RAW_MATERIALS);
    expect(rows[0][0]).toBe("Cassava");
    expect(rows[0][1]).toBe("7,500");
    expect(rows[0][3]).toBe("2");
    expect(rows[0][9]).toBe("Local farm");
    expect(rows[1][0]).toBe("Sugar");
    expect(rows[1][9]).toBe("Trader");
  });

  it("maps TNA names, volume share, and volume into Raw Materials Allocation", () => {
    expect(rawMaterialAllocationRowsFromTna(TNA_RAW_MATERIALS)).toEqual([
      ["Cassava", "75", "7,500"],
      ["Sugar", "25", "2,500"],
    ]);
  });

  it("prefills allocation and cost on a new proposal from TNA Form 01 tables", () => {
    const applicant = {
      id: "pp-rm-1",
      enterpriseName: "Forward Foods",
      applicantName: "Maria",
      moduleData: {
        tna1: {
          submitted: true,
          form: {},
          tables: { rawMaterials: TNA_RAW_MATERIALS },
        },
      },
    } as unknown as Applicant;
    const draft = buildProjectProposalDraft(applicant);
    expect(draft.rawMaterialAllocationTable).toEqual([
      ["Cassava", "75", "7,500"],
      ["Sugar", "25", "2,500"],
    ]);
    expect(draft.rawMaterialCostTable[0][0]).toBe("Cassava");
    expect(draft.rawMaterialCostTable[1][0]).toBe("Sugar");
  });

  it("keeps TNA allocation when the stored proposal table is blank", () => {
    const applicant = {
      id: "pp-rm-2",
      enterpriseName: "Forward Foods",
      applicantName: "Maria",
      moduleData: {
        tna1: {
          submitted: true,
          form: {},
          tables: { rawMaterials: TNA_RAW_MATERIALS },
        },
      },
    } as unknown as Applicant;
    const draft = buildProjectProposalDraft(applicant, {
      rawMaterialAllocationTable: [["", "", ""]],
    });
    expect(draft.rawMaterialAllocationTable[0][0]).toBe("Cassava");
  });
});
