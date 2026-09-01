/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 005 — Property Transfer Receipt (Annex A-5) layout constants.
 * Source: Form 005 - Property Transfer Receipt.docx — SETUP Guidelines (Revision 3.0).
 */

/** Word blank property rows (between header and Reason for Transfer). */
export const PTR_EMPTY_DATA_ROWS = 10;

export const PTR_TITLE = "SETUP Form 005 - Property Transfer Receipt";

export const PTR_FOOTER_PREFIX =
  "SETUP Guidelines (Revision 3.0) Annex A-5: SETUP Form 005 - Property Transfer Receipt";

/** A4, Word pgMar 1440 twips = 1 in = 25.4 mm all sides. */
export const PTR_PAGE_MARGIN_IN = 1;
export const PTR_PAGE_MARGIN_MM = 25.4;

export type PtrTransferType = "donation" | "relocate" | "reassignment" | "other" | "";

export const PTR_TRANSFER_TYPES: {
  value: Exclude<PtrTransferType, "">;
  label: string;
}[] = [
  { value: "donation", label: "Donation" },
  { value: "relocate", label: "Relocate" },
  { value: "reassignment", label: "Reassignment" },
  { value: "other", label: "Other (Specify)" },
];

/** Default narrative for successful SETUP completion (ownership to cooperator). */
export const PTR_DEFAULT_REASON_FOR_TRANSFER = "Physical Transfer Only";

/**
 * Property table column widths (twips) from Word tblGrid near property headers.
 * Date Acquired | Property No. | Description | Amount | Condition of PPE
 */
export const PTR_GRID_COL_TWIPS = [1625, 1625, 3068, 1269, 1649] as const;

const PTR_GRID_SUM = PTR_GRID_COL_TWIPS.reduce((a, b) => a + b, 0);

export const PTR_COLUMN_WIDTH_PCT = PTR_GRID_COL_TWIPS.map(
  (w) => `${((w / PTR_GRID_SUM) * 100).toFixed(2)}%`,
) as [string, string, string, string, string];

export const PTR_COLUMNS = [
  { key: "dateAcquired", label: "Date Acquired", widthPct: PTR_COLUMN_WIDTH_PCT[0] },
  { key: "propertyNo", label: "Property No.", widthPct: PTR_COLUMN_WIDTH_PCT[1] },
  { key: "description", label: "Description", widthPct: PTR_COLUMN_WIDTH_PCT[2] },
  { key: "amount", label: "Amount", widthPct: PTR_COLUMN_WIDTH_PCT[3] },
  {
    key: "conditionOfPpe",
    label: "Condition of PPE",
    widthPct: PTR_COLUMN_WIDTH_PCT[4],
  },
] as const;

export function ptrFooter(page: number, total: number): string {
  return `${PTR_FOOTER_PREFIX} Page ${page} of ${total}`;
}

export function ptrDisplayValue(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function ptrTransferTypeLabel(type: PtrTransferType, other?: string): string {
  if (!type) return "";
  if (type === "other") return other?.trim() ? `Other: ${other.trim()}` : "Other (Specify)";
  return PTR_TRANSFER_TYPES.find((t) => t.value === type)?.label ?? type;
}

/** Pad property rows to Word blank-sheet length for official document. */
export function padPtrRowsForDocument<T extends { description?: string }>(
  rows: T[],
  emptyRow: () => T,
  minRows = PTR_EMPTY_DATA_ROWS,
): T[] {
  const filled = rows.filter((r) => ptrDisplayValue(r.description));
  const list = filled.length > 0 ? [...filled] : [];
  while (list.length < minRows) {
    list.push(emptyRow());
  }
  return list;
}

export function derivePtrNo(applicationId: string): string {
  const id = applicationId.trim();
  if (!id) return "";
  return id.startsWith("PTR-") ? id : `PTR-${id}`;
}
