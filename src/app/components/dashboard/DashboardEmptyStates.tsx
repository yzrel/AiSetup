/**
 * Author: Yzrel Jade B. Eborde
 *
 * Empty-state helper when staff dashboard charts have no live rows.
 */

export function DashboardChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center">
      <p className="text-xs text-gray-500">{message}</p>
    </div>
  );
}

export function DashboardScopeEmptyBanner() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      No cooperators in scope. Charts reflect live database cases only — register or
      open a case to populate the dashboard.
    </div>
  );
}
