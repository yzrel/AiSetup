/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  IOE_COLUMN_WIDTH_PCT,
  IOE_EMPTY_DATA_ROWS,
  IOE_GRID_COL_TWIPS,
  IOE_TITLE,
  formatInventoryAmountTotal,
  padInventoryRowsForDocument,
  parseInventoryAmount,
  sumInventoryAmounts,
} from "../../constants/inventoryOfEquipmentLayout";
import { normalizeInventoryRow } from "../../utils/projectCloseOut";

describe("Form 006 inventory layout", () => {
  it("exposes Annex A-6 title and Word blank-row count", () => {
    expect(IOE_TITLE).toBe("SETUP Form 006 - Inventory of Equipment");
    expect(IOE_EMPTY_DATA_ROWS).toBe(5);
  });

  it("derives column width percentages from Word gridCol twips", () => {
    expect(IOE_GRID_COL_TWIPS).toEqual([923, 2154, 1269, 1596, 1904, 1390]);
    expect(IOE_COLUMN_WIDTH_PCT).toHaveLength(6);
    const sum = IOE_COLUMN_WIDTH_PCT.reduce(
      (acc, pct) => acc + Number.parseFloat(pct),
      0,
    );
    expect(sum).toBeGreaterThan(99.9);
    expect(sum).toBeLessThan(100.1);
  });

  it("sums and formats inventory amounts", () => {
    expect(parseInventoryAmount("₱1,570,000")).toBe(1570000);
    expect(
      sumInventoryAmounts([{ amount: "1000" }, { amount: "₱2,500.5" }, { amount: "" }]),
    ).toBe(3500.5);
    expect(formatInventoryAmountTotal(1570000)).toMatch(/1[,.]570[,.]000/);
  });

  it("pads document rows to Word blank-sheet length", () => {
    const padded = padInventoryRowsForDocument(
      [{ description: "Printer" }],
      () => ({ description: "" }),
    );
    expect(padded).toHaveLength(IOE_EMPTY_DATA_ROWS);
    expect(padded[0].description).toBe("Printer");
  });
});

describe("Form 006 inventory normalize", () => {
  it("maps legacy close-out columns onto Form 006 fields", () => {
    const row = normalizeInventoryRow({
      id: "legacy-1",
      description: "10.5 ft. Large Format Printer",
      serialNumber: "LF-001",
      acquisitionCost: "1570000",
      location: "219 F. Cajelo St.",
    });
    expect(row).toMatchObject({
      id: "legacy-1",
      qty: "1",
      description: "10.5 ft. Large Format Printer",
      amount: "1570000",
      propertyNo: "LF-001",
      remarks: "219 F. Cajelo St.",
      dateAcquired: "",
    });
  });

  it("prefers new Form 006 fields over legacy when both present", () => {
    const row = normalizeInventoryRow({
      id: "new-1",
      qty: "2",
      description: "Cutter",
      amount: "50000",
      propertyNo: "P-9",
      dateAcquired: "2024-06-01",
      remarks: "Plant A",
      serialNumber: "old-serial",
      acquisitionCost: "1",
      location: "old-loc",
    });
    expect(row).toMatchObject({
      qty: "2",
      amount: "50000",
      propertyNo: "P-9",
      remarks: "Plant A",
      dateAcquired: "2024-06-01",
    });
  });
});
