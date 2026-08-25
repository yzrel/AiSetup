/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 006 — Inventory of Equipment (Annex A-6) printable layout.
 * Source: Form 006 - Inventory of Equipment.docx — SETUP Guidelines (Revision 3.0).
 * Preview and print must mount this component (100% Word fidelity).
 */

import type { EquipmentInventoryRow, ProjectCloseOutForm } from "../../api/types";
import {
  IOE_COLUMN_WIDTH_PCT,
  IOE_TABLE_CAPTION,
  IOE_TITLE,
  displayValue,
  formatInventoryAmountTotal,
  padInventoryRowsForDocument,
  sumInventoryAmounts,
} from "../../constants/inventoryOfEquipmentLayout";

export interface InventoryOfEquipmentDocumentProps {
  form: ProjectCloseOutForm;
}

function emptyDocRow(): EquipmentInventoryRow {
  return {
    id: `blank-${Math.random().toString(36).slice(2, 8)}`,
    qty: "",
    description: "",
    amount: "",
    propertyNo: "",
    dateAcquired: "",
    remarks: "",
  };
}

export function InventoryOfEquipmentDocument({ form }: InventoryOfEquipmentDocumentProps) {
  const dataRows = padInventoryRowsForDocument(
    form.equipmentInventory ?? [],
    emptyDocRow,
  );
  const total = sumInventoryAmounts(form.equipmentInventory ?? []);
  const totalDisplay = formatInventoryAmountTotal(total);

  return (
    <div className="ioe-form-document-root">
      <section className="ioe-form-page">
        <div className="ioe-form-page-body">
          <h1 className="ioe-form-title">{IOE_TITLE}</h1>

          <div className="ioe-form-header-fields">
            <p className="ioe-form-field-line">
              <span className="ioe-form-field-label">Project Title:</span>
              <span className="ioe-form-field-value">
                {displayValue(form.inventoryProjectTitle) || "\u00a0"}
              </span>
            </p>
            <p className="ioe-form-field-line">
              <span className="ioe-form-field-label">Project Cooperator:</span>
              <span className="ioe-form-field-value">
                {displayValue(form.inventoryProjectCooperator) || "\u00a0"}
              </span>
            </p>
          </div>

          <table className="ioe-form-table">
            <colgroup>
              {IOE_COLUMN_WIDTH_PCT.map((w) => (
                <col key={w} style={{ width: w }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th colSpan={6} className="ioe-form-table-caption">
                  {IOE_TABLE_CAPTION}
                </th>
              </tr>
              <tr>
                <th className="ioe-col-qty">QTY</th>
                <th className="ioe-col-desc">
                  Name of Equipment/ Description/ Specification
                </th>
                <th className="ioe-col-amount">AMOUNT</th>
                <th className="ioe-col-property">
                  PROPERTY
                  <br />
                  No.
                </th>
                <th className="ioe-col-date">DATE ACQUIRED</th>
                <th className="ioe-col-remarks">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, idx) => (
                <tr key={row.id || `row-${idx}`}>
                  <td className="ioe-col-qty ioe-center">{displayValue(row.qty)}</td>
                  <td className="ioe-col-desc">{displayValue(row.description)}</td>
                  <td className="ioe-col-amount ioe-right">{displayValue(row.amount)}</td>
                  <td className="ioe-col-property">{displayValue(row.propertyNo)}</td>
                  <td className="ioe-col-date ioe-center">{displayValue(row.dateAcquired)}</td>
                  <td className="ioe-col-remarks">{displayValue(row.remarks)}</td>
                </tr>
              ))}
              <tr className="ioe-total-row">
                <td className="ioe-col-qty" />
                <td className="ioe-col-desc ioe-total-label">TOTAL</td>
                <td className="ioe-col-amount ioe-right ioe-total-amount">{totalDisplay}</td>
                <td className="ioe-col-property" />
                <td className="ioe-col-date" />
                <td className="ioe-col-remarks" />
              </tr>
            </tbody>
          </table>

          <div className="ioe-form-signatures">
            <div className="ioe-sig-block">
              <p className="ioe-sig-label">Inventory Conducted by:</p>
              <p className="ioe-sig-line">
                {displayValue(form.inventoryConductedBy) || "________________________"}
              </p>
              <p className="ioe-sig-role">Regional Office Representative</p>
              <p className="ioe-sig-date">
                Date:{" "}
                {displayValue(form.inventoryConductedDate) || "____________________"}
              </p>
            </div>
            <div className="ioe-sig-block">
              <p className="ioe-sig-label">Witnessed by:</p>
              <p className="ioe-sig-line">
                {displayValue(form.inventoryWitnessedBy) ||
                  "_________________________________"}
              </p>
              <p className="ioe-sig-role">
                Cooperator/Cooperator&apos;s Authorized Representative
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
