/**
 * Author: Yzrel Jade B. Eborde
 */

import { Plus, Trash2 } from "lucide-react";
import { PP_SCHEDULE_MONTHS } from "../../constants/projectProposalLayout";
import {
  emptyScheduleRow,
  isScheduleMonthChecked,
  normalizeScheduleTable,
} from "../../utils/projectProposal";

const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

export function ScheduleGanttEditor({
  rows,
  onChange,
}: {
  rows: string[][];
  onChange: (rows: string[][]) => void;
}) {
  const list = normalizeScheduleTable(rows);

  const updateRow = (ri: number, nextRow: string[]) => {
    onChange(list.map((row, i) => (i === ri ? nextRow : row)));
  };

  const setActivity = (ri: number, value: string) => {
    const next = [...list[ri]];
    next[0] = value;
    updateRow(ri, next);
  };

  const toggleMonth = (ri: number, monthIndex: number) => {
    const col = monthIndex + 1;
    const next = [...list[ri]];
    next[col] = isScheduleMonthChecked(next[col]) ? "" : "1";
    updateRow(ri, next);
  };

  const deleteRow = (ri: number) => {
    const remaining = list.filter((_, i) => i !== ri);
    onChange(remaining.length ? remaining : [emptyScheduleRow()]);
  };

  return (
    <div>
      <label className={labelCls}>Schedule of Activities</label>
      <p className="text-xs text-gray-600 mb-2">
        Check each month the activity will take place (M1–M8).
      </p>

      <div className="md:hidden space-y-3">
        {list.map((row, ri) => (
          <div
            key={ri}
            className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2"
          >
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">
                Activity
              </label>
              <input
                value={row[0] ?? ""}
                onChange={(e) => setActivity(ri, e.target.value)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>
            <fieldset>
              <legend className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
                Months
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {PP_SCHEDULE_MONTHS.map((month, mi) => (
                  <label
                    key={month}
                    className="flex items-center gap-1.5 text-xs text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={isScheduleMonthChecked(row[mi + 1])}
                      onChange={() => toggleMonth(ri, mi)}
                      className="rounded border-gray-300"
                    />
                    {month}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              onClick={() => deleteRow(ri)}
              className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1"
            >
              <Trash2 className="w-3 h-3" /> Remove row
            </button>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 font-semibold text-left text-gray-600 border-b border-gray-200">
                Activity
              </th>
              {PP_SCHEDULE_MONTHS.map((month) => (
                <th
                  key={month}
                  className="px-2 py-2 font-semibold text-center text-gray-600 border-b border-gray-200 whitespace-nowrap"
                >
                  {month}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {list.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-100 p-0.5">
                  <input
                    value={row[0] ?? ""}
                    onChange={(e) => setActivity(ri, e.target.value)}
                    className="w-full px-2 py-0.5 leading-tight border border-gray-100 rounded"
                  />
                </td>
                {PP_SCHEDULE_MONTHS.map((month, mi) => (
                  <td
                    key={month}
                    className="border border-gray-100 p-0.5 text-center align-middle"
                  >
                    <input
                      type="checkbox"
                      checked={isScheduleMonthChecked(row[mi + 1])}
                      onChange={() => toggleMonth(ri, mi)}
                      className="rounded border-gray-300"
                      aria-label={`${row[0] || "Activity"} ${month}`}
                    />
                  </td>
                ))}
                <td className="px-1">
                  <button
                    type="button"
                    onClick={() => deleteRow(ri)}
                    className="text-red-400 hover:text-red-600"
                    aria-label="Remove activity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => onChange([...list, emptyScheduleRow()])}
        className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#0C2461] hover:underline"
      >
        <Plus className="w-3 h-3" /> Add row
      </button>
    </div>
  );
}
