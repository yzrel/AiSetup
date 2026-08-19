/**
 * Author: Yzrel Jade B. Eborde
 *
 * A4 projected financial statements (print-only).
 */

import type { FinancialProjectionSnapshot } from "../../../api/types";
import { formatIrr, formatPercent, formatPhp, snapshotStatementTables } from "../../../utils/financialProjection";

export function FinancialProjectionDocument({
  snapshot,
  applicationId,
  frozenAt,
}: {
  snapshot: FinancialProjectionSnapshot;
  applicationId?: string;
  frozenAt?: string;
}) {
  const tables = snapshotStatementTables(snapshot);

  const renderTable = (title: string, rows: string[][]) => (
    <section className="fp-form-block">
      <h2 className="fp-form-section-heading">{title}</h2>
      <table className="fp-form-table">
        <thead>
          <tr>
            {(rows[0] ?? []).map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell || "\u00a0"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  return (
    <div className="fp-form-document-root">
      <h1 className="fp-form-title">Projected Financial Statements (Next Five Years)</h1>
      <p className="fp-form-meta">
        {applicationId ? `Application ${applicationId}` : "DOST SETUP Region XII"}
        {frozenAt ? ` · Frozen ${new Date(frozenAt).toLocaleString("en-PH")}` : ""}
      </p>
      <p className="fp-form-meta">
        NPV {formatPhp(snapshot.npv)} · IRR {formatIrr(snapshot.irr)} ·{" "}
        {snapshot.balanced ? "Assets = Liabilities + Equity" : "Balance check failed"}
      </p>
      {renderTable("Income Statement", tables.income)}
      {renderTable("Cash Flow", tables.cashFlow)}
      {renderTable("Balance Sheet", tables.balance)}
      <section className="fp-form-block">
        <h2 className="fp-form-section-heading">Financial ratios</h2>
        <table className="fp-form-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Current assets</th>
              <th>Inventory</th>
              <th>Current liabilities</th>
              <th>Liquidity</th>
              <th>Quick</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.ratios.map((r) => (
              <tr key={r.year}>
                <td>{r.year}</td>
                <td>{formatPhp(r.currentAssets)}</td>
                <td>{formatPhp(r.inventory)}</td>
                <td>{formatPhp(r.currentLiabilities)}</td>
                <td>{r.liquidity == null ? "—" : r.liquidity.toFixed(2)}</td>
                <td>{r.quick == null ? "—" : r.quick.toFixed(2)}</td>
                <td>{formatPercent(r.roi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
