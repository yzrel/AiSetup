/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  PP_FINANCIAL_CAPACITY_DASH_ITEMS,
  PP_IDA_COLUMNS,
  PP_IDA_ROI_CAPTION,
} from "../../constants/projectProposalLayout";
import type { InvestmentDecisionAnalysis } from "../../utils/projectProposal";

const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

export function InvestmentDecisionAnalysisEditor({
  analysis,
}: {
  analysis: InvestmentDecisionAnalysis;
}) {
  return (
    <div className="mt-4">
      <label className={labelCls}>
        Financial capacity — {PP_FINANCIAL_CAPACITY_DASH_ITEMS[4]}
      </label>
      <p className="text-xs text-gray-600 mb-2">
        Year incomes are projected net income after tax. Project cost is the
        budgetary requirement total when present, otherwise the cover Project
        Cost. This table is computed — it is not edited here.
      </p>
      <p className="text-xs font-semibold text-gray-700 mb-1.5">
        {PP_IDA_ROI_CAPTION}
      </p>

      <div className="md:hidden space-y-2">
        {analysis.rows.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 flex justify-between gap-3"
          >
            <span className={`text-xs text-gray-700 ${row.bold ? "font-bold" : ""}`}>
              {row.label}
            </span>
            <span className={`text-xs text-right ${row.bold ? "font-bold" : ""}`}>
              {row.value || "—"}
            </span>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {PP_IDA_COLUMNS.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 font-semibold text-gray-600 border-b border-gray-200 text-left"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysis.rows.map((row, ri) => (
              <tr key={row.label} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td
                  className={`px-3 py-1.5 border border-gray-100 ${row.bold ? "font-bold" : ""}`}
                >
                  {row.label}
                </td>
                <td
                  className={`px-3 py-1.5 border border-gray-100 text-right ${row.bold ? "font-bold" : ""}`}
                >
                  {row.value || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
