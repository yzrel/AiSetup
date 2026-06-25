/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { cn } from "./utils";

export interface ResponsiveColumn<T> {
  key: string;
  header: ReactNode;
  /** Cell content for desktop table */
  cell: (row: T, index: number) => ReactNode;
  /** Hide this column in mobile card (e.g. actions rendered separately) */
  hideOnMobile?: boolean;
  /** Label shown above value in mobile card */
  mobileLabel?: string;
  className?: string;
}

export interface ResponsiveDataViewProps<T> {
  columns: ResponsiveColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  /** Custom mobile card; defaults to label/value pairs from columns */
  renderMobileCard?: (row: T, index: number) => ReactNode;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

function DefaultMobileCard<T>({
  row,
  index,
  columns,
  onRowClick,
}: {
  row: T;
  index: number;
  columns: ResponsiveColumn<T>[];
  onRowClick?: (row: T, index: number) => void;
}) {
  const visible = columns.filter((c) => !c.hideOnMobile);
  const Wrapper = onRowClick ? "button" : "div";

  return (
    <Wrapper
      type={onRowClick ? "button" : undefined}
      onClick={onRowClick ? () => onRowClick(row, index) : undefined}
      className={cn(
        "w-full text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors",
        onRowClick && "hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer",
      )}
    >
      <div className="space-y-2">
        {visible.map((col) => (
          <div key={col.key} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            {col.mobileLabel && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 shrink-0 sm:w-28">
                {col.mobileLabel}
              </span>
            )}
            <span className={cn("text-sm text-gray-800 min-w-0", col.className)}>
              {col.cell(row, index)}
            </span>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

export function ResponsiveDataView<T>({
  columns,
  rows,
  getRowKey,
  renderMobileCard,
  onRowClick,
  emptyMessage = "No records found.",
  className,
  mobileClassName,
  desktopClassName,
}: ResponsiveDataViewProps<T>) {
  if (rows.length === 0) {
    return (
      <div className={cn("py-8 text-center text-sm text-gray-500", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mobile cards */}
      <div className={cn("md:hidden space-y-3", mobileClassName)}>
        {rows.map((row, index) =>
          renderMobileCard ? (
            <div key={getRowKey(row, index)}>{renderMobileCard(row, index)}</div>
          ) : (
            <DefaultMobileCard
              key={getRowKey(row, index)}
              row={row}
              index={index}
              columns={columns}
              onRowClick={onRowClick}
            />
          ),
        )}
      </div>

      {/* Desktop table */}
      <div className={cn("hidden md:block", desktopClassName)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={getRowKey(row, index)}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
