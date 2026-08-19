/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  PP_IDA_COLUMNS,
  PP_IDA_ROI_CAPTION,
} from "../../constants/projectProposalLayout";
import type { InvestmentDecisionAnalysis } from "../../utils/projectProposal";

export function InvestmentDecisionAnalysisTable({
  analysis,
}: {
  analysis: InvestmentDecisionAnalysis;
}) {
  return (
    <table className="pp-form-table pp-form-ida-table">
      <thead>
        <tr>
          <th colSpan={2}>{PP_IDA_ROI_CAPTION}</th>
        </tr>
        <tr>
          {PP_IDA_COLUMNS.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {analysis.rows.map((row) => (
          <tr key={row.label}>
            <td className={row.bold ? "pp-form-ida-emphasis" : undefined}>
              {row.label}
            </td>
            <td
              className={`pp-form-num${row.bold ? " pp-form-ida-emphasis" : ""}`}
            >
              {row.value || "\u00a0"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
