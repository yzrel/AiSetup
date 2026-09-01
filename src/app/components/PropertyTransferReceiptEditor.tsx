/**
 * Author: Yzrel Jade B. Eborde
 *
 * Staff editor for SETUP Form 005 — Property Transfer Receipt (Annex A-5).
 * Responsive: stacked fields on mobile, card layout for property rows.
 */

import type { ReactNode } from "react";
import type { EquipmentInventoryRow, ProjectCloseOutForm, PtrTransferType } from "../api/types";
import { PTR_TRANSFER_TYPES } from "../constants/propertyTransferReceiptLayout";
import { FORM_GRID_2, FORM_GRID_3 } from "./moduleTheme";

interface PropertyTransferReceiptEditorProps {
  form: ProjectCloseOutForm;
  onChange: (form: ProjectCloseOutForm) => void;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold text-[#0C2461]">{children}</h3>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
  );
}

export function PropertyTransferReceiptEditor({
  form,
  onChange,
}: PropertyTransferReceiptEditorProps) {
  const patch = (partial: Partial<ProjectCloseOutForm>) => onChange({ ...form, ...partial });

  const updateRow = (id: string, field: keyof EquipmentInventoryRow, value: string) => {
    patch({
      equipmentInventory: form.equipmentInventory.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Edit Form 005 fields for the official Property Transfer Receipt. Equipment rows are
        shared with Form 006 inventory. Use Sync to fill blanks from case data without
        overwriting your edits.
      </p>

      <section className="space-y-3">
        <SectionTitle>Header</SectionTitle>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Entity Name</FieldLabel>
            <TextInput
              value={form.ptrEntityName ?? ""}
              onChange={(ptrEntityName) => patch({ ptrEntityName })}
            />
          </div>
          <div>
            <FieldLabel>Fund Cluster</FieldLabel>
            <TextInput
              value={form.ptrFundCluster ?? ""}
              onChange={(ptrFundCluster) => patch({ ptrFundCluster })}
            />
          </div>
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>From Accountable Officer / Agency / Fund Cluster</FieldLabel>
            <TextInput
              value={form.ptrFromAccountableOfficer ?? ""}
              onChange={(ptrFromAccountableOfficer) => patch({ ptrFromAccountableOfficer })}
            />
          </div>
          <div>
            <FieldLabel>To Accountable Officer / Agency / Fund Cluster</FieldLabel>
            <TextInput
              value={form.ptrToAccountableOfficer ?? ""}
              onChange={(ptrToAccountableOfficer) => patch({ ptrToAccountableOfficer })}
            />
          </div>
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>PTR No.</FieldLabel>
            <TextInput value={form.ptrNo ?? ""} onChange={(ptrNo) => patch({ ptrNo })} />
          </div>
          <div>
            <FieldLabel>Date</FieldLabel>
            <TextInput
              type="date"
              value={form.ptrDate ?? ""}
              onChange={(ptrDate) => patch({ ptrDate })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Transfer Type (check only one)</SectionTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {PTR_TRANSFER_TYPES.map(({ value, label }) => (
            <label
              key={value}
              className="inline-flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 min-w-0"
            >
              <input
                type="radio"
                name="ptrTransferType"
                checked={form.ptrTransferType === value}
                onChange={() => patch({ ptrTransferType: value as PtrTransferType })}
                className="shrink-0"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {form.ptrTransferType === "other" && (
          <div className="max-w-md">
            <FieldLabel>Specify other transfer type</FieldLabel>
            <TextInput
              value={form.ptrTransferTypeOther ?? ""}
              onChange={(ptrTransferTypeOther) => patch({ ptrTransferTypeOther })}
            />
          </div>
        )}
        <div>
          <FieldLabel>Reason for Transfer</FieldLabel>
          <textarea
            value={form.ptrReasonForTransfer ?? ""}
            onChange={(e) => patch({ ptrReasonForTransfer: e.target.value })}
            rows={3}
            placeholder="e.g. Physical Transfer Only — transfer of ownership upon full refund completion"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Property transferred (shared with Form 006)</SectionTitle>
        <div className="space-y-3">
          {form.equipmentInventory.map((row, index) => (
            <div
              key={row.id}
              className="border border-gray-100 rounded-lg p-3 space-y-2 bg-white"
            >
              <p className="text-xs font-semibold text-gray-500">Item {index + 1}</p>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <FieldLabel>Date Acquired</FieldLabel>
                  <TextInput
                    value={row.dateAcquired}
                    onChange={(v) => updateRow(row.id, "dateAcquired", v)}
                  />
                </div>
                <div>
                  <FieldLabel>Property No.</FieldLabel>
                  <TextInput
                    value={row.propertyNo}
                    onChange={(v) => updateRow(row.id, "propertyNo", v)}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <FieldLabel>Description</FieldLabel>
                  <TextInput
                    value={row.description}
                    onChange={(v) => updateRow(row.id, "description", v)}
                  />
                </div>
                <div>
                  <FieldLabel>Amount</FieldLabel>
                  <TextInput
                    value={row.amount}
                    onChange={(v) => updateRow(row.id, "amount", v)}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-5">
                  <FieldLabel>Condition of PPE</FieldLabel>
                  <TextInput
                    value={row.conditionOfPpe ?? ""}
                    onChange={(v) => updateRow(row.id, "conditionOfPpe", v)}
                    placeholder="e.g. Good"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Add or edit equipment rows in the Form 006 inventory section above; changes appear here
          automatically.
        </p>
      </section>

      <section className="space-y-3">
        <SectionTitle>Signatures</SectionTitle>
        <div className={FORM_GRID_3}>
          <div>
            <FieldLabel>Approved by — Printed Name</FieldLabel>
            <TextInput
              value={form.ptrApprovedByName ?? ""}
              onChange={(ptrApprovedByName) => patch({ ptrApprovedByName })}
            />
          </div>
          <div>
            <FieldLabel>Designation</FieldLabel>
            <TextInput
              value={form.ptrApprovedByDesignation ?? ""}
              onChange={(ptrApprovedByDesignation) => patch({ ptrApprovedByDesignation })}
            />
          </div>
          <div>
            <FieldLabel>Approval Date</FieldLabel>
            <TextInput
              type="date"
              value={form.ptrApprovedByDate ?? ""}
              onChange={(ptrApprovedByDate) => patch({ ptrApprovedByDate })}
            />
          </div>
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Released / Issued by</FieldLabel>
            <TextInput
              value={form.ptrReleasedIssuedBy ?? ""}
              onChange={(ptrReleasedIssuedBy) => patch({ ptrReleasedIssuedBy })}
            />
          </div>
          <div>
            <FieldLabel>Received by</FieldLabel>
            <TextInput
              value={form.ptrReceivedBy ?? ""}
              onChange={(ptrReceivedBy) => patch({ ptrReceivedBy })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
