/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ReactNode } from "react";
import type { PrePisDraftForm, PrePisGadRow } from "../api/types";

interface PrePisEditorProps {
  draft: PrePisDraftForm;
  onChange: (draft: PrePisDraftForm) => void;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
  );
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PrePisEditor({ draft, onChange }: PrePisEditorProps) {
  const patch = (partial: Partial<PrePisDraftForm>) =>
    onChange({ ...draft, ...partial });

  const updateGad = (id: string, partial: Partial<PrePisGadRow>) => {
    patch({
      gadRows: draft.gadRows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    });
  };

  const addGadRow = () => {
    patch({
      gadRows: [
        ...draft.gadRows,
        { id: uid(), genderIssues: "", gadObjectives: "", gadActivities: "" },
      ],
    });
  };

  const removeGadRow = (id: string) => {
    if (draft.gadRows.length <= 1) return;
    patch({ gadRows: draft.gadRows.filter((r) => r.id !== id) });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Prepare the Pre-PIS draft for printing before MOA signing day. The printed
        form is filled and signed on-site; the uploaded scan is the official record.
      </p>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">Header</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>LAB name</FieldLabel>
            <TextInput value={draft.labName} onChange={(labName) => patch({ labName })} />
          </div>
          <div>
            <FieldLabel>Date prepared</FieldLabel>
            <TextInput
              value={draft.datePrepared}
              onChange={(datePrepared) => patch({ datePrepared })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Project title</FieldLabel>
            <TextInput
              value={draft.projectTitle}
              onChange={(projectTitle) => patch({ projectTitle })}
            />
          </div>
          <div>
            <FieldLabel>DOST personnel in-charge</FieldLabel>
            <TextInput
              value={draft.dostPersonnelInCharge}
              onChange={(dostPersonnelInCharge) => patch({ dostPersonnelInCharge })}
            />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <TextInput value={draft.status} onChange={(status) => patch({ status })} />
          </div>
          <div>
            <FieldLabel>DOST input</FieldLabel>
            <TextInput value={draft.dostInput} onChange={(dostInput) => patch({ dostInput })} />
          </div>
          <div>
            <FieldLabel>Cooperator&apos;s input</FieldLabel>
            <TextInput
              value={draft.cooperatorInput}
              onChange={(cooperatorInput) => patch({ cooperatorInput })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">I. Implementing Agency</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel>Organization name</FieldLabel>
            <TextInput
              value={draft.organizationName}
              onChange={(organizationName) => patch({ organizationName })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Address</FieldLabel>
            <TextArea
              value={draft.organizationAddress}
              onChange={(organizationAddress) => patch({ organizationAddress })}
              rows={2}
            />
          </div>
          <div>
            <FieldLabel>Type of organization</FieldLabel>
            <TextInput value={draft.orgType} onChange={(orgType) => patch({ orgType })} />
          </div>
          <div>
            <FieldLabel>Nature of business</FieldLabel>
            <TextInput
              value={draft.natureOfBusiness}
              onChange={(natureOfBusiness) => patch({ natureOfBusiness })}
            />
          </div>
          <div>
            <FieldLabel>Sectors</FieldLabel>
            <TextInput value={draft.sectors} onChange={(sectors) => patch({ sectors })} />
          </div>
          <div>
            <FieldLabel>Year established</FieldLabel>
            <TextInput
              value={draft.yearEstablished}
              onChange={(yearEstablished) => patch({ yearEstablished })}
            />
          </div>
          <div>
            <FieldLabel>Classification</FieldLabel>
            <TextInput
              value={draft.classification}
              onChange={(classification) => patch({ classification })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Main products / services</FieldLabel>
            <TextArea
              value={draft.mainProducts}
              onChange={(mainProducts) => patch({ mainProducts })}
            />
          </div>
          <div>
            <FieldLabel>Technology employed</FieldLabel>
            <TextArea
              value={draft.technologyEmployed}
              onChange={(technologyEmployed) => patch({ technologyEmployed })}
              rows={2}
            />
          </div>
          <div>
            <FieldLabel>Production capacity</FieldLabel>
            <TextArea
              value={draft.productionCapacity}
              onChange={(productionCapacity) => patch({ productionCapacity })}
              rows={2}
            />
          </div>
          <div>
            <FieldLabel>Person in-charge</FieldLabel>
            <TextInput
              value={draft.personInCharge}
              onChange={(personInCharge) => patch({ personInCharge })}
            />
          </div>
          <div>
            <FieldLabel>Staff complement</FieldLabel>
            <TextInput
              value={draft.staffComplement}
              onChange={(staffComplement) => patch({ staffComplement })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Contact numbers</FieldLabel>
            <TextInput
              value={draft.contactNumbers}
              onChange={(contactNumbers) => patch({ contactNumbers })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">II. Core Project Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel>Brief description</FieldLabel>
            <TextArea
              value={draft.briefDescription}
              onChange={(briefDescription) => patch({ briefDescription })}
            />
          </div>
          <div>
            <FieldLabel>Cost — LGU</FieldLabel>
            <TextInput value={draft.costLgu} onChange={(costLgu) => patch({ costLgu })} />
          </div>
          <div>
            <FieldLabel>Cost — DOST</FieldLabel>
            <TextInput value={draft.costDost} onChange={(costDost) => patch({ costDost })} />
          </div>
          <div>
            <FieldLabel>Cost — Cooperators</FieldLabel>
            <TextInput
              value={draft.costCooperators}
              onChange={(costCooperators) => patch({ costCooperators })}
            />
          </div>
          <div>
            <FieldLabel>Cost — Total</FieldLabel>
            <TextInput value={draft.costTotal} onChange={(costTotal) => patch({ costTotal })} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>General objective</FieldLabel>
            <TextArea
              value={draft.generalObjective}
              onChange={(generalObjective) => patch({ generalObjective })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Methodology</FieldLabel>
            <TextArea
              value={draft.methodology}
              onChange={(methodology) => patch({ methodology })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Beneficiaries</FieldLabel>
            <TextInput
              value={draft.beneficiaries}
              onChange={(beneficiaries) => patch({ beneficiaries })}
            />
          </div>
          <div>
            <FieldLabel>Schedule — pre-implementation</FieldLabel>
            <TextInput
              value={draft.schedulePreImplementation}
              onChange={(schedulePreImplementation) => patch({ schedulePreImplementation })}
            />
          </div>
          <div>
            <FieldLabel>Schedule — implementation</FieldLabel>
            <TextInput
              value={draft.scheduleImplementation}
              onChange={(scheduleImplementation) => patch({ scheduleImplementation })}
            />
          </div>
          <div>
            <FieldLabel>Schedule — operation</FieldLabel>
            <TextInput
              value={draft.scheduleOperation}
              onChange={(scheduleOperation) => patch({ scheduleOperation })}
            />
          </div>
          <div>
            <FieldLabel>Project location</FieldLabel>
            <TextInput
              value={draft.projectLocation}
              onChange={(projectLocation) => patch({ projectLocation })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">III. Gender and Development</h3>
        {draft.gadRows.map((row, i) => (
          <div key={row.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-600">Row {i + 1}</span>
              {draft.gadRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGadRow(row.id)}
                  className="text-xs text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            <TextArea
              value={row.genderIssues}
              onChange={(genderIssues) => updateGad(row.id, { genderIssues })}
              rows={2}
            />
            <TextArea
              value={row.gadObjectives}
              onChange={(gadObjectives) => updateGad(row.id, { gadObjectives })}
              rows={2}
            />
            <TextArea
              value={row.gadActivities}
              onChange={(gadActivities) => updateGad(row.id, { gadActivities })}
              rows={2}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addGadRow}
          className="text-sm font-semibold text-[#0C2461]"
        >
          + Add GAD row
        </button>
      </section>
    </div>
  );
}
