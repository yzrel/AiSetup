/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  PTR_EMPTY_DATA_ROWS,
  PTR_GRID_COL_TWIPS,
  PTR_TITLE,
  PTR_TRANSFER_TYPES,
  derivePtrNo,
  padPtrRowsForDocument,
} from "../../constants/propertyTransferReceiptLayout";

describe("Form 005 PTR layout", () => {
  it("exposes Annex A-5 title and Word blank-row count", () => {
    expect(PTR_TITLE).toBe("SETUP Form 005 - Property Transfer Receipt");
    expect(PTR_EMPTY_DATA_ROWS).toBe(10);
  });

  it("defines four transfer type options", () => {
    expect(PTR_TRANSFER_TYPES).toHaveLength(4);
    expect(PTR_TRANSFER_TYPES.map((t) => t.value)).toEqual([
      "donation",
      "relocate",
      "reassignment",
      "other",
    ]);
  });

  it("derives PTR number from application id", () => {
    expect(derivePtrNo("LOI-2026-000123")).toBe("PTR-LOI-2026-000123");
    expect(derivePtrNo("PTR-LOI-2026-000123")).toBe("PTR-LOI-2026-000123");
  });

  it("derives column width percentages from Word gridCol twips", () => {
    expect(PTR_GRID_COL_TWIPS).toHaveLength(5);
    const sum = PTR_GRID_COL_TWIPS.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(9000);
  });

  it("pads document rows to Word blank-sheet length", () => {
    const padded = padPtrRowsForDocument(
      [{ description: "Printer" }],
      () => ({ description: "" }),
    );
    expect(padded).toHaveLength(PTR_EMPTY_DATA_ROWS);
    expect(padded[0].description).toBe("Printer");
  });
});
