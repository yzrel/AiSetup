/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 005 — Property Transfer Receipt (Annex A-5) printable layout.
 * Preview and print mount this component (100% Word fidelity).
 */

import type { EquipmentInventoryRow, ProjectCloseOutForm } from "../../api/types";
import {
  PTR_COLUMNS,
  PTR_COLUMN_WIDTH_PCT,
  PTR_TITLE,
  PTR_TRANSFER_TYPES,
  padPtrRowsForDocument,
  ptrDisplayValue,
} from "../../constants/propertyTransferReceiptLayout";

export interface PropertyTransferReceiptDocumentProps {
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
    conditionOfPpe: "",
  };
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span className="ptr-form-checkbox" aria-hidden="true">
      {checked ? "\u2611" : "\u2610"}
    </span>
  );
}

export function PropertyTransferReceiptDocument({ form }: PropertyTransferReceiptDocumentProps) {
  const dataRows = padPtrRowsForDocument(form.equipmentInventory ?? [], emptyDocRow);
  const transferType = form.ptrTransferType ?? "";

  return (
    <div className="ptr-form-document-root">
      <section className="ptr-form-page">
        <div className="ptr-form-page-body">
          <h1 className="ptr-form-title">{PTR_TITLE}</h1>

          <div className="ptr-form-entity-line">
            <span className="ptr-form-inline-field">
              <span className="ptr-form-field-label">Entity Name:</span>
              <span className="ptr-form-field-value">
                {ptrDisplayValue(form.ptrEntityName) || "\u00a0"}
              </span>
            </span>
            <span className="ptr-form-inline-field">
              <span className="ptr-form-field-label">Fund Cluster:</span>
              <span className="ptr-form-field-value">
                {ptrDisplayValue(form.ptrFundCluster) || "\u00a0"}
              </span>
            </span>
          </div>

          <div className="ptr-form-header-grid">
            <p className="ptr-form-field-line">
              <span className="ptr-form-field-label">
                From Accountable Officer/Agency/Fund Cluster:
              </span>
              <span className="ptr-form-field-value">
                {ptrDisplayValue(form.ptrFromAccountableOfficer) || "\u00a0"}
              </span>
            </p>
            <p className="ptr-form-field-line">
              <span className="ptr-form-field-label">
                To Accountable Officer/Agency/Fund Cluster:
              </span>
              <span className="ptr-form-field-value">
                {ptrDisplayValue(form.ptrToAccountableOfficer) || "\u00a0"}
              </span>
            </p>
            <p className="ptr-form-field-line ptr-form-field-half">
              <span className="ptr-form-field-label">PTR No.:</span>
              <span className="ptr-form-field-value">
                {ptrDisplayValue(form.ptrNo) || "\u00a0"}
              </span>
            </p>
            <p className="ptr-form-field-line ptr-form-field-half">
              <span className="ptr-form-field-label">Date:</span>
              <span className="ptr-form-field-value">
                {ptrDisplayValue(form.ptrDate) || "\u00a0"}
              </span>
            </p>
          </div>

          <div className="ptr-form-transfer-type">
            <p className="ptr-form-transfer-type-label">Transfer Type: (check only one)</p>
            <div className="ptr-form-transfer-options">
              {PTR_TRANSFER_TYPES.map(({ value, label }) => (
                <span key={value} className="ptr-form-transfer-option">
                  <CheckBox checked={transferType === value} />
                  <span>{label}</span>
                  {value === "other" && transferType === "other" && (
                    <span className="ptr-form-other-specify">
                      {ptrDisplayValue(form.ptrTransferTypeOther) || "________"}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <table className="ptr-form-table">
            <colgroup>
              {PTR_COLUMN_WIDTH_PCT.map((w) => (
                <col key={w} style={{ width: w }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {PTR_COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, idx) => (
                <tr key={row.id || `ptr-row-${idx}`}>
                  <td className="ptr-center">{ptrDisplayValue(row.dateAcquired)}</td>
                  <td>{ptrDisplayValue(row.propertyNo)}</td>
                  <td>{ptrDisplayValue(row.description)}</td>
                  <td className="ptr-right">{ptrDisplayValue(row.amount)}</td>
                  <td>{ptrDisplayValue(row.conditionOfPpe)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ptr-form-reason">
            <p className="ptr-form-field-label">Reason for Transfer:</p>
            <p className="ptr-form-reason-narrative">
              {ptrDisplayValue(form.ptrReasonForTransfer) || "\u00a0"}
            </p>
          </div>

          <div className="ptr-form-approved-block">
            <p className="ptr-form-field-label">Approved by:</p>
            <div className="ptr-form-approved-grid">
              <span>Signature: ________________________</span>
              <span>
                Printed Name:{" "}
                {ptrDisplayValue(form.ptrApprovedByName) || "________________________"}
              </span>
              <span>
                Designation:{" "}
                {ptrDisplayValue(form.ptrApprovedByDesignation) || "________________________"}
              </span>
              <span>
                Date: {ptrDisplayValue(form.ptrApprovedByDate) || "____________________"}
              </span>
            </div>
          </div>

          <div className="ptr-form-release-grid">
            <div className="ptr-form-sig-block">
              <p className="ptr-form-field-label">Released/Issued by:</p>
              <p className="ptr-form-sig-line">
                {ptrDisplayValue(form.ptrReleasedIssuedBy) || "\u00a0"}
              </p>
            </div>
            <div className="ptr-form-sig-block">
              <p className="ptr-form-field-label">Received by:</p>
              <p className="ptr-form-sig-line">
                {ptrDisplayValue(form.ptrReceivedBy) || "\u00a0"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
