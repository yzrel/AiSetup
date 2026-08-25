/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 006 — Inventory of Equipment (Annex A-6) layout constants.
 * Source: Form 006 - Inventory of Equipment.docx — SETUP Guidelines (Revision 3.0).
 */

/** Word blank sheet data rows (before TOTAL). */
export const IOE_EMPTY_DATA_ROWS = 5;

export const IOE_TITLE = "SETUP Form 006 - Inventory of Equipment";

export const IOE_TABLE_CAPTION = "INVENTORY OF ACQUIRED EQUIPMENT (SETUP FUNDED)";

export const IOE_FOOTER_PREFIX =
  "SETUP Guidelines (Revision 3.0) Annex A-6: SETUP Form 006 - Inventory of Equipment";

/** A4, Word pgMar 1440 twips = 1 in = 25.4 mm all sides. */
export const IOE_PAGE_MARGIN_IN = 1;
export const IOE_PAGE_MARGIN_MM = 25.4;

/**
 * Word tblGrid widths (twips). Sum = 9236.
 * Percentages used for colgroup / CSS.
 */
export const IOE_GRID_COL_TWIPS = [923, 2154, 1269, 1596, 1904, 1390] as const;

const IOE_GRID_SUM = IOE_GRID_COL_TWIPS.reduce((a, b) => a + b, 0);

export const IOE_COLUMN_WIDTH_PCT = IOE_GRID_COL_TWIPS.map(
  (w) => `${((w / IOE_GRID_SUM) * 100).toFixed(2)}%`,
) as [string, string, string, string, string, string];

export const IOE_COLUMNS = [
  { key: "qty", label: "QTY", widthPct: IOE_COLUMN_WIDTH_PCT[0] },
  {
    key: "description",
    label: "Name of Equipment/ Description/ Specification",
    widthPct: IOE_COLUMN_WIDTH_PCT[1],
  },
  { key: "amount", label: "AMOUNT", widthPct: IOE_COLUMN_WIDTH_PCT[2] },
  { key: "propertyNo", label: "PROPERTY No.", widthPct: IOE_COLUMN_WIDTH_PCT[3] },
  { key: "dateAcquired", label: "DATE ACQUIRED", widthPct: IOE_COLUMN_WIDTH_PCT[4] },
  { key: "remarks", label: "REMARKS", widthPct: IOE_COLUMN_WIDTH_PCT[5] },
] as const;

export type IoeColumnKey = (typeof IOE_COLUMNS)[number]["key"];

export function ioeFooter(page: number, total: number): string {
  return `${IOE_FOOTER_PREFIX} Page ${page} of ${total}`;
}

export function displayValue(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

/** Parse a currency-like amount string to a number (ignores ₱ , spaces). */
export function parseInventoryAmount(raw: string): number {
  const cleaned = raw.replace(/[₱,\s]/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatInventoryAmountTotal(total: number): string {
  if (!total) return "";
  return total.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function sumInventoryAmounts(
  rows: { amount?: string }[],
): number {
  return rows.reduce((sum, r) => sum + parseInventoryAmount(String(r.amount ?? "")), 0);
}

/**
 * Pad inventory rows to at least Word blank-sheet length for official document.
 * Extra filled rows are kept beyond the minimum.
 */
export function padInventoryRowsForDocument<T extends { description?: string }>(
  rows: T[],
  emptyRow: () => T,
  minRows = IOE_EMPTY_DATA_ROWS,
): T[] {
  const list = rows.length > 0 ? [...rows] : [];
  while (list.length < minRows) {
    list.push(emptyRow());
  }
  return list;
}
