/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  compensationTableFooterRow,
  computeCompensationRow,
  emptyCompensationRow,
  emptyProjectProposalForm,
  recomputeCompensationTable,
  sumCompensationColumns,
} from "../projectProposal";
import { normalizeProjectProposalStored } from "../normalizeCriticalModuleData";

describe("computeCompensationRow", () => {
  it("computes Weekly = Daily Rate × Days × workers, Monthly = Weekly × 4, Annually = Monthly × 12", () => {
    expect(computeCompensationRow(["Production Supervisor", "1", "250", "3", "", "", ""])).toEqual([
      "Production Supervisor",
      "1",
      "250",
      "3",
      "₱750.00",
      "₱3,000.00",
      "₱36,000.00",
    ]);
    expect(computeCompensationRow(["Production Worker", "2", "350", "3"])).toEqual([
      "Production Worker",
      "2",
      "350",
      "3",
      "₱2,100.00",
      "₱8,400.00",
      "₱100,800.00",
    ]);
  });

  it("leaves period amounts blank when days or rate or workers is missing", () => {
    expect(computeCompensationRow(["Packer", "2", "350", ""])[4]).toBe("");
    expect(computeCompensationRow(["Packer", "", "350", "6"])[5]).toBe("");
    expect(computeCompensationRow(["Packer", "2", "", "6"])[6]).toBe("");
  });

  it("migrates legacy 6-column rows by inserting Days", () => {
    const migrated = computeCompensationRow([
      "Operator",
      "1",
      "100",
      "600",
      "2400",
      "28800",
    ]);
    expect(migrated[3]).toBe("");
    expect(migrated[4]).toBe("");
  });
});

describe("sumCompensationColumns", () => {
  it("returns empty totals for empty or blank rows", () => {
    expect(sumCompensationColumns(undefined)).toEqual({
      rate: "",
      weekly: "",
      monthlySalary: "",
      annually: "",
    });
    expect(sumCompensationColumns([])).toEqual({
      rate: "",
      weekly: "",
      monthlySalary: "",
      annually: "",
    });
    expect(sumCompensationColumns([emptyCompensationRow()])).toEqual({
      rate: "",
      weekly: "",
      monthlySalary: "",
      annually: "",
    });
  });

  it("totals daily payroll as rate × workers and sums computed period columns", () => {
    const rows = recomputeCompensationTable([
      ["Supervisor", "1", "250", "3"],
      ["Worker", "2", "350", "3"],
    ]);
    const totals = sumCompensationColumns(rows);
    expect(totals.rate).toBe("₱950.00");
    expect(totals.weekly).toBe("₱2,850.00");
    expect(totals.monthlySalary).toBe("₱11,400.00");
    expect(totals.annually).toBe("₱136,800.00");
  });

  it("does not total Particulars, # of workers, or Days", () => {
    const footer = compensationTableFooterRow([
      ["Operator", "10", "100", "6", "", "", ""],
    ]);
    expect(footer).toEqual([
      "Total",
      "",
      "₱1,000.00",
      "",
      "₱6,000.00",
      "₱24,000.00",
      "₱288,000.00",
    ]);
  });
});

describe("compensationTable hydrate", () => {
  it("defaults seven empty cells on a new form", () => {
    const form = emptyProjectProposalForm();
    expect(form.compensationTable).toEqual([emptyCompensationRow()]);
    expect(form.compensationTable[0]).toHaveLength(7);
  });

  it("wraps a PowerShell-collapsed singleton compensation table", () => {
    const stored = normalizeProjectProposalStored({
      form: {
        compensationTable: {
          0: "Operator",
          1: "2",
          2: "500",
          3: "6",
          4: "6000",
          5: "24000",
          6: "288000",
        },
        submitted: false,
      },
    });
    const form = stored?.form as { compensationTable: unknown[] };
    expect(form.compensationTable).toHaveLength(1);
  });
});
