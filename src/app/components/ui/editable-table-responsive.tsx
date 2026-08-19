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
  /** Show delete button per row (Project Proposal tables) */
  deletable?: boolean;
  headerVariant?: "dost" | "gray";
  /** Column indexes that display computed values (not editable). */
  readOnlyColumns?: number[];
  /** Column indexes that use a wrapping textarea (e.g. Particulars). */
  multilineColumns?: number[];
  columnClassNames?: string[];
  tableClassName?: string;
}

export function EditableTableResponsive({
  columns,
  rows,
  onChange,
  onAddRow,
  addLabel = "+ Add Row",
  deletable = false,
  headerVariant = "dost",
  readOnlyColumns,
  multilineColumns,
  columnClassNames,
  tableClassName,
}: EditableTableResponsiveProps) {
  const readOnly = new Set(readOnlyColumns ?? []);
  const multiline = new Set(multilineColumns ?? []);

  const updateCell = (ri: number, ci: number, value: string) => {
    if (readOnly.has(ci)) return;
    const next = rows.map((r) => [...r]);
    while (next[ri].length < columns.length) next[ri].push("");
    next[ri][ci] = value;
    onChange(next);
  };

  const deleteRow = (ri: number) => {
    onChange(rows.filter((_, j) => j !== ri));
  };

  const inputCls =
    "w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300";
  const readOnlyCls = "bg-gray-50 text-gray-700 cursor-default";

  const renderCell = (row: string[], ri: number, ci: number, desktop: boolean) => {
    const value = row[ci] ?? "";
    const locked = readOnly.has(ci);
    const wrap = multiline.has(ci);
    const shared = desktop
      ? headerVariant === "dost"
        ? `w-full border-none bg-transparent text-xs px-2 py-1 leading-tight outline-none rounded ${
            locked ? readOnlyCls : "focus:bg-blue-50"
          }`
        : `w-full px-2 py-0.5 leading-tight border border-gray-100 rounded ${locked ? readOnlyCls : ""}`
      : `${inputCls} ${locked ? readOnlyCls : ""}`;

    if (wrap) {
      return (
        <input
          value={value}
          readOnly={locked}
          onChange={(e) => updateCell(ri, ci, e.target.value)}
          className={`${shared} min-w-0`}
          title={value}
        />
      );
    }

    return (
      <input
        value={value}
        readOnly={locked}
        onChange={(e) => updateCell(ri, ci, e.target.value)}
        className={shared}
      />
    );
  };

  return (
    <div className="mb-3">
      {/* Mobile: card per row */}
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
              >
                <Trash2 className="w-3 h-3" /> Remove row
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
        <table
          className={`w-full text-xs border-collapse ${tableClassName ?? ""}`.trim()}
        >
          <thead>
            <tr
              className={headerVariant === "gray" ? "bg-gray-50" : undefined}
              style={headerVariant === "dost" ? { background: DOST_BLUE } : undefined}
            >
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-3 py-2 font-semibold text-left ${
                    i === 0 ? "whitespace-normal" : "whitespace-nowrap"
                  } ${columnClassNames?.[i] ?? ""} ${
                    headerVariant === "dost"
                      ? "text-white"
                      : "text-gray-600 border-b border-gray-200"
                  }`}
                >
                  {col}
                </th>
              ))}
              {deletable && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {columns.map((_, ci) => (
                  <td
                    key={ci}
                    className={`border border-gray-100 p-0.5 align-middle ${columnClassNames?.[ci] ?? ""}`}
                  >
                    {renderCell(row, ri, ci, true)}
                  </td>
                ))}
                {deletable && (
                  <td className="px-1">
                    <button
                      type="button"
                      onClick={() => deleteRow(ri)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAddRow}
        className={`mt-2 flex items-center gap-1 text-xs font-semibold ${
          headerVariant === "dost"
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
