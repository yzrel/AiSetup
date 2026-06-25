/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ReactNode } from "react";
import { cn } from "./ui/utils";

/** Label/value row — stacks on mobile, side-by-side on sm+ */
export function PreviewFieldRow({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value?: ReactNode;
  className?: string;
}) {
  const display =
    value === true
      ? "Yes"
      : value === false
        ? "No"
        : value ?? "—";

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-[minmax(140px,200px)_1fr] gap-1 sm:gap-2 py-1.5 border-b border-gray-100 text-sm print:grid-cols-[200px_1fr]",
        className,
      )}
    >
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-800 break-words">{display}</span>
    </div>
  );
}

export interface PreviewTableColumn {
  key: string;
  header: ReactNode;
  /** Label for mobile card rows */
  mobileLabel?: string;
}

export function PreviewTable({
  columns,
  rows,
  className,
}: {
  columns: PreviewTableColumn[];
  rows: string[][];
  className?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className={className}>
      {/* Mobile: card per row */}
      <div className="sm:hidden space-y-3 print:hidden">
        {rows.map((cells, rowIndex) => (
          <div
            key={rowIndex}
            className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2"
          >
            {columns.map((col, colIndex) => (
              <div key={col.key} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  {col.mobileLabel ?? col.header}
                </span>
                <span className="text-sm text-gray-800 break-words">
                  {cells[colIndex] ?? "—"}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop: standard table */}
      <div className="hidden sm:block overflow-x-auto print:block print:overflow-visible">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-3 py-2 font-semibold text-gray-700 whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100">
                {cells.map((cell, colIndex) => (
                  <td key={colIndex} className="px-3 py-2 text-gray-800 align-top">
                    {cell ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Print / download toolbar — stacks on mobile */
export function PreviewToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center print:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Section wrapper for preview documents */
export function PreviewSection({
  title,
  children,
  pageBreak,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  pageBreak?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 tna-print-section",
        pageBreak && "tna-page-break",
        className,
      )}
    >
      {title && (
        <h3 className="text-sm font-bold text-white px-3 py-2 rounded-t-lg bg-[#0C2461]">
          {title}
        </h3>
      )}
      <div className="border border-gray-200 border-t-0 rounded-b-lg p-3 sm:p-4 bg-white">
        {children}
      </div>
    </div>
  );
}
