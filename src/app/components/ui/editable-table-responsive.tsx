/**
 * Author: Yzrel Jade B. Eborde
 */

import { Plus, Trash2 } from "lucide-react";

const DOST_BLUE = "#0C2461";

export interface EditableTableResponsiveProps {
  columns: string[];
  rows: string[][];
  onChange: (rows: string[][]) => void;
  onAddRow: () => void;
  addLabel?: string;
  /** Show delete button per row. Default on for every editor table. */
  deletable?: boolean;
  headerVariant?: "dost" | "gray";
  /** Column indexes that display computed values (not editable). */
  readOnlyColumns?: number[];
  /** Column indexes that use a wrapping textarea (e.g. Particulars). */
  multilineColumns?: number[];
  columnClassNames?: string[];
  tableClassName?: string;
}

function emptyRow(columnCount: number): string[] {
  return Array(columnCount).fill("");
}

export function EditableTableResponsive({
  columns,
  rows,
  onChange,
  onAddRow,
  addLabel = "+ Add Row",
  deletable = true,
  headerVariant = "dost",
  readOnlyColumns,
  multilineColumns,
  columnClassNames,
  tableClassName,
}: EditableTableResponsiveProps) {
  const readOnly = new Set(readOnlyColumns ?? []);
  const multiline = new Set(multilineColumns ?? []);
  const dost = headerVariant === "dost";

  const updateCell = (ri: number, ci: number, value: string) => {
    if (readOnly.has(ci)) return;
    const next = rows.map((r) => [...r]);
    while (next[ri].length < columns.length) next[ri].push("");
    next[ri][ci] = value;
    onChange(next);
  };

  const deleteRow = (ri: number) => {
    const next = rows.filter((_, j) => j !== ri);
    onChange(next.length ? next : [emptyRow(columns.length)]);
  };

  const inputCls =
    "w-full min-w-0 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300";
  const readOnlyCls = "bg-gray-50 text-gray-800 cursor-default";

  const renderCell = (row: string[], ri: number, ci: number, desktop: boolean) => {
    const value = row[ci] ?? "";
    const locked = readOnly.has(ci);
    const wrap = multiline.has(ci);
    const moneyish = locked && !wrap;
    const shared = desktop
      ? dost
        ? `w-full min-w-0 border-none bg-transparent text-xs px-2 py-1.5 leading-snug outline-none rounded ${
            locked ? readOnlyCls : "focus:bg-blue-50"
          }`
        : `w-full min-w-0 px-2 py-1.5 leading-snug border border-gray-100 rounded ${locked ? readOnlyCls : ""}`
      : `${inputCls} ${locked ? readOnlyCls : ""}`;

    return (
      <input
        value={value}
        readOnly={locked}
        onChange={(e) => updateCell(ri, ci, e.target.value)}
        className={`${shared} ${moneyish ? "tabular-nums whitespace-nowrap" : ""}`}
        title={value}
        aria-label={columns[ci]}
      />
    );
  };

  const stickyDelete =
    "sticky right-0 z-[1] w-11 min-w-[2.75rem] shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.18)]";

  return (
    <div className="mb-3">
      <div className="md:hidden space-y-3">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2"
          >
            {columns.map((col, ci) => (
              <div key={ci}>
                <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">
                  {col}
                </label>
                {renderCell(row, ri, ci, false)}
              </div>
            ))}
            {deletable && (
              <button
                type="button"
                onClick={() => deleteRow(ri)}
                className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1"
                aria-label="Delete row"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove row
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto isolate border border-gray-200 rounded-lg">
        <table
          className={`w-full text-xs border-collapse table-auto ${tableClassName ?? ""}`.trim()}
        >
          <thead>
            <tr
              className={headerVariant === "gray" ? "bg-gray-50" : undefined}
              style={dost ? { background: DOST_BLUE } : undefined}
            >
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-2 py-2 font-semibold text-left align-bottom whitespace-normal break-words leading-tight ${
                    columnClassNames?.[i] ?? "min-w-[5.5rem]"
                  } ${
                    dost
                      ? "text-white"
                      : "text-gray-600 border-b border-gray-200"
                  }`}
                >
                  {col}
                </th>
              ))}
              {deletable && (
                <th
                  className={`${stickyDelete} ${
                    dost ? "text-white" : "bg-gray-50 border-b border-gray-200"
                  }`}
                  style={dost ? { background: DOST_BLUE } : undefined}
                  aria-label="Delete"
                />
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const stripe = ri % 2 === 0 ? "bg-white" : "bg-gray-50";
              return (
                <tr key={ri} className={stripe}>
                  {columns.map((_, ci) => (
                    <td
                      key={ci}
                      className={`border border-gray-100 p-0.5 align-middle ${columnClassNames?.[ci] ?? ""}`}
                    >
                      {renderCell(row, ri, ci, true)}
                    </td>
                  ))}
                  {deletable && (
                    <td className={`border border-gray-100 ${stickyDelete} ${stripe} text-center`}>
                      <button
                        type="button"
                        onClick={() => deleteRow(ri)}
                        className="inline-flex items-center justify-center p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        aria-label="Delete row"
                        title="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAddRow}
        className={`mt-2 flex items-center gap-1 text-xs font-semibold ${
          dost
            ? "px-3 py-1 text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
            : "text-[#0C2461] hover:underline"
        }`}
      >
        {headerVariant === "gray" ? <Plus className="w-3 h-3" /> : null}
        {addLabel}
      </button>
    </div>
  );
}
