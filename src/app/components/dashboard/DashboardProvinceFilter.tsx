/**
 * Author: Yzrel Jade B. Eborde
 *
 * Staff dashboard province filter — narrows charts/KPIs within role scope.
 */

import { MapPin } from "lucide-react";
import { DASHBOARD_PROVINCE_ALL } from "../../utils/provincialOffice";

export function DashboardProvinceFilter({
  provinces,
  value,
  onChange,
}: {
  provinces: string[];
  value: string;
  onChange: (province: string) => void;
}) {
  if (provinces.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <MapPin className="w-4 h-4 text-[#0C2461] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">Province filter</p>
          <p className="text-xs text-gray-400">
            Charts and KPIs below use applicants in your scope
            {value !== DASHBOARD_PROVINCE_ALL ? `, limited to ${value}` : ""}.
          </p>
        </div>
      </div>
      <label className="flex flex-col gap-1 sm:items-end shrink-0 w-full sm:w-auto">
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
          Province
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full sm:w-56 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        >
          <option value={DASHBOARD_PROVINCE_ALL}>
            All provinces (in my scope)
          </option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
