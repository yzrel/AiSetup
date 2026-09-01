/**
 * Author: Yzrel Jade B. Eborde
 *
 * Annex B — Line-Item Budget table for the bound Proforma MOA packet.
 */

import type { MoaAnnexCForm } from "../../api/types";
import type { MoaAnnexBData } from "../../utils/moaAnnexPacket";
import { underlineOr } from "../../constants/moaAnnexCLayout";

interface MoaAnnexBLibTableProps {
  form: MoaAnnexCForm;
  data: MoaAnnexBData;
}

function cell(value: string): string {
  return value.trim() || "\u00a0";
}

export function MoaAnnexBLibTable({ form, data }: MoaAnnexBLibTableProps) {
  const repName =
    form.cooperatorSignatoryName.trim() ||
    form.representativeName.trim() ||
    form.enterpriseName.trim();
  const rdName =
    form.dostSignatoryName.trim() || form.regionalDirector.trim();

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

      <table className="moa-form-annex-table">
        <thead>
          <tr>
            <th>Item of Expenditure</th>
            <th>Qty</th>
            <th>Unit Cost</th>
            <th>SETUP</th>
            {data.showLgia ? <th>LGIA</th> : null}
            <th>Cooperator</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              <td>{cell(row.item)}</td>
              <td className="moa-form-annex-num">{cell(row.qty)}</td>
              <td className="moa-form-annex-num">{cell(row.unitCost)}</td>
              <td className="moa-form-annex-num">{cell(row.setup)}</td>
              {data.showLgia ? (
                <td className="moa-form-annex-num">{cell(row.lgia)}</td>
              ) : null}
              <td className="moa-form-annex-num">{cell(row.cooperator)}</td>
            </tr>
          ))}
          <tr className="moa-form-annex-total">
            <td colSpan={3}>Total</td>
            <td className="moa-form-annex-num">
              {data.setupTotal ? `Php ${data.setupTotal}` : "\u00a0"}
            </td>
            {data.showLgia ? (
              <td className="moa-form-annex-num">
                {data.lgiaTotal ? `Php ${data.lgiaTotal}` : "\u00a0"}
              </td>
            ) : null}
            <td className="moa-form-annex-num">
              {data.projectTotal ? `Php ${data.projectTotal}` : "\u00a0"}
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
            <p className="moa-form-sig-name">{underlineOr(rdName, 24)}</p>
            <p className="moa-form-sig-role">Regional Director, DOST XII</p>
          </div>
        </div>
      </div>
    </div>
  );
}
