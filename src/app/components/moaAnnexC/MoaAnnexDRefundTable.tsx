/**
 * Author: Yzrel Jade B. Eborde
 *
 * Annex D — Schedule of Refund (calendar-year grid) for the bound MOA packet.
 */

import type { MoaAnnexCForm } from "../../api/types";
import type { MoaAnnexDGrid } from "../../utils/moaAnnexPacket";
import { underlineOr } from "../../constants/moaAnnexCLayout";

interface MoaAnnexDRefundTableProps {
  form: MoaAnnexCForm;
  grid: MoaAnnexDGrid;
}

function cell(value: string | undefined): string {
  const v = String(value ?? "").trim();
  return v ? (v.startsWith("P") ? v : `P${v}`) : "\u00a0";
}

export function MoaAnnexDRefundTable({ form, grid }: MoaAnnexDRefundTableProps) {
  const repName =
    form.cooperatorSignatoryName.trim() ||
    form.representativeName.trim() ||
    form.enterpriseName.trim();

  return (
    <div className="moa-form-annex-sheet">
      <p className="moa-form-annex-cover">
        Project Title: &quot;{form.projectTitle.trim() || "______"}&quot;
      </p>
      <p className="moa-form-annex-cover">
        Cooperator: {form.enterpriseName.trim() || "______"}
      </p>
      {repName ? (
        <p className="moa-form-annex-cover">{repName}</p>
      ) : null}
      <p className="moa-form-annex-cover">
        PROJECT COST: {grid.projectCost || "______"}
      </p>
      <p className="moa-form-annex-cover">
        REFUND SCHEDULE: {grid.refundScheduleLabel}
      </p>
      <p className="moa-form-annex-cover">
        MANNER OF REFUND: {grid.manner}
      </p>

      <table className="moa-form-annex-table moa-form-annex-refund">
        <thead>
          <tr>
            <th>Month</th>
            {grid.years.map((year) => (
              <th key={year}>{year}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {grid.monthNames.map((monthName) => {
            let rowTotal = 0;
            return (
              <tr key={monthName}>
                <td>{monthName}</td>
                {grid.years.map((year) => {
                  const key = `${monthName}-${year}`;
                  const raw = grid.cells[key];
                  if (raw) rowTotal += parseFloat(raw.replace(/[^\d.]/g, "")) || 0;
                  return (
                    <td key={year} className="moa-form-annex-num">
                      {cell(raw)}
                    </td>
                  );
                })}
                <td className="moa-form-annex-num">
                  {rowTotal > 0
                    ? `P${rowTotal.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "\u00a0"}
                </td>
              </tr>
            );
          })}
          <tr className="moa-form-annex-total">
            <td>TOTAL</td>
            {grid.years.map((year) => (
              <td key={year} className="moa-form-annex-num">
                {grid.yearTotals[year] ? `P${grid.yearTotals[year]}` : "\u00a0"}
              </td>
            ))}
            <td className="moa-form-annex-num">
              {grid.grandTotal ? `P${grid.grandTotal}` : "\u00a0"}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="moa-form-annex-conforme">
        <p>Conforme:</p>
        <div className="moa-form-signatures moa-form-annex-conforme-sigs">
          <div className="moa-form-sig-col">
            <div className="moa-form-sig-space" />
            <p className="moa-form-sig-name">{underlineOr(repName, 24)}</p>
            <p className="moa-form-sig-role">Cooperator</p>
          </div>
          <div className="moa-form-sig-col">
            <div className="moa-form-sig-space" />
            <p className="moa-form-sig-name">
              {underlineOr(
                form.dostSignatoryName || form.regionalDirector,
                24,
              )}
            </p>
            <p className="moa-form-sig-role">Regional Director, DOST XII</p>
          </div>
        </div>
      </div>
    </div>
  );
}
