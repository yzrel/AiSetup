/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  PP_SCHEDULE_MONTHS,
  PP_SCHEDULE_WEEKS_PER_MONTH,
} from "../../constants/projectProposalLayout";
import {
  isScheduleMonthChecked,
  normalizeScheduleTable,
} from "../../utils/projectProposal";

function cellText(value: string | undefined): string {
  return String(value ?? "").trim();
}

export function ScheduleGanttTable({
  rows,
  weeksPerMonth = PP_SCHEDULE_WEEKS_PER_MONTH,
}: {
  rows: string[][];
  /** 1 = one cell per month (preview). 4 = visual week grid (print). */
  weeksPerMonth?: number;
}) {
  const normalized = normalizeScheduleTable(rows);
  const filled = normalized.filter(
    (row) =>
      cellText(row[0]).length > 0 ||
      PP_SCHEDULE_MONTHS.some((_, mi) => isScheduleMonthChecked(row[mi + 1])),
  );
  const body = filled.length ? filled : [Array(1 + PP_SCHEDULE_MONTHS.length).fill("")];
  const slots = Math.max(1, weeksPerMonth);
  const weekSlots = Array.from({ length: slots }, (_, i) => i);
  const monthCellClass = slots === 1 ? "pp-form-gantt-month" : "pp-form-gantt-week";

  return (
    <table className="pp-form-table pp-form-gantt">
      <thead>
        <tr>
          <th className="pp-form-gantt-activity">Activity</th>
          {PP_SCHEDULE_MONTHS.map((month) => (
            <th
              key={month}
              colSpan={slots === 1 ? undefined : slots}
              className={slots === 1 ? "pp-form-gantt-month" : undefined}
            >
              {month}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, ri) => (
          <tr key={ri}>
            <td className="pp-form-gantt-activity">
              {cellText(row[0]) || "\u00a0"}
            </td>
            {PP_SCHEDULE_MONTHS.map((month, mi) => {
              const on = isScheduleMonthChecked(row[mi + 1]);
              return weekSlots.map((week) => (
                <td
                  key={`${month}-${week}`}
                  className={on ? `pp-form-gantt-bar ${monthCellClass}` : monthCellClass}
                >
                  {"\u00a0"}
                </td>
              ));
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
