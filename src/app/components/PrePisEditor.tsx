/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ReactNode } from "react";
import type { PrePisDraftForm } from "../api/types";
import { FORM_008_ASSISTANCE_OPTIONS } from "../constants/pisFormLayout";
import { PisEmploymentMatrixFields } from "./PisEmploymentMatrixFields";

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
  rows = 2,
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

export function PrePisEditor({ draft, onChange }: PrePisEditorProps) {
  const patch = (partial: Partial<PrePisDraftForm>) =>
    onChange({ ...draft, ...partial });

  const toggleAssistance = (id: string) => {
    const set = new Set(draft.dostAssistance);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    patch({ dostAssistance: [...set] });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Prepare SETUP Form 008 (Pre-Implementation PIS) for printing before MOA signing
        day. The printed form is filled and signed on-site; the uploaded scan is the
        official record.
      </p>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">Project identification</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>For the period</FieldLabel>
            <TextInput
              value={draft.periodLabel}
              onChange={(periodLabel) => patch({ periodLabel })}
              placeholder="e.g. Pre-implementation"
            />
          </div>
          <div>
            <FieldLabel>Project code</FieldLabel>
            <TextInput
              value={draft.projectCode}
              onChange={(projectCode) => patch({ projectCode })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Project title</FieldLabel>
            <TextInput
              value={draft.projectTitle}
              onChange={(projectTitle) => patch({ projectTitle })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">Firm and owner</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Name of firm</FieldLabel>
            <TextInput value={draft.firmName} onChange={(firmName) => patch({ firmName })} />
          </div>
          <div>
            <FieldLabel>Type of organization / enterprise</FieldLabel>
            <TextInput value={draft.orgType} onChange={(orgType) => patch({ orgType })} />
          </div>
          <div>
            <FieldLabel>Owner / contact person — name</FieldLabel>
            <TextInput
              value={draft.ownerName}
              onChange={(ownerName) => patch({ ownerName })}
            />
          </div>
          <div>
            <FieldLabel>Sex</FieldLabel>
            <TextInput value={draft.ownerSex} onChange={(ownerSex) => patch({ ownerSex })} />
          </div>
          <div>
            <FieldLabel>Birthday</FieldLabel>
            <TextInput
              value={draft.ownerBirthday}
              onChange={(ownerBirthday) => patch({ ownerBirthday })}
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div>
            <FieldLabel>Year firm established</FieldLabel>
            <TextInput
              value={draft.yearEstablished}
              onChange={(yearEstablished) => patch({ yearEstablished })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Business address (factory location)</FieldLabel>
            <TextInput
              value={draft.businessAddress}
              onChange={(businessAddress) => patch({ businessAddress })}
            />
          </div>
          <div>
            <FieldLabel>Landline</FieldLabel>
            <TextInput value={draft.landline} onChange={(landline) => patch({ landline })} />
          </div>
          <div>
            <FieldLabel>Fax</FieldLabel>
            <TextInput value={draft.fax} onChange={(fax) => patch({ fax })} />
          </div>
          <div>
            <FieldLabel>Mobile phone</FieldLabel>
            <TextInput
              value={draft.mobilePhone}
              onChange={(mobilePhone) => patch({ mobilePhone })}
            />
          </div>
          <div>
            <FieldLabel>Email address</FieldLabel>
            <TextInput value={draft.email} onChange={(email) => patch({ email })} />
          </div>
          <div>
            <FieldLabel>Date SETUP assistance approved</FieldLabel>
            <TextInput
              value={draft.dateAssistanceApproved}
              onChange={(dateAssistanceApproved) => patch({ dateAssistanceApproved })}
            />
          </div>
          <div>
            <FieldLabel>Date prepared</FieldLabel>
            <TextInput
              value={draft.datePrepared}
              onChange={(datePrepared) => patch({ datePrepared })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">Total assets (prior to SETUP)</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          {(
            [
              ["assetsLand", "Land"],
              ["assetsBuilding", "Building"],
              ["assetsEquipment", "Equipment"],
              ["assetsWorkingCapital", "Working capital"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <TextInput value={draft[key]} onChange={(v) => patch({ [key]: v })} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">Total employment generated</h3>
        <PisEmploymentMatrixFields
          employment={draft.employment}
          onChange={(employment) => patch({ employment })}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">Production and sales</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Total volume of production — local</FieldLabel>
            <TextInput
              value={draft.productionVolumeLocal}
              onChange={(productionVolumeLocal) => patch({ productionVolumeLocal })}
            />
          </div>
          <div>
            <FieldLabel>Total volume of production — export</FieldLabel>
            <TextInput
              value={draft.productionVolumeExport}
              onChange={(productionVolumeExport) => patch({ productionVolumeExport })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Production details (unit of measurement)</FieldLabel>
            <TextArea
              value={draft.productionDetails}
              onChange={(productionDetails) => patch({ productionDetails })}
            />
          </div>
          <div>
            <FieldLabel>Total gross sales — local (₱)</FieldLabel>
            <TextInput
              value={draft.grossSalesLocal}
              onChange={(grossSalesLocal) => patch({ grossSalesLocal })}
            />
          </div>
          <div>
            <FieldLabel>Total gross sales — export (₱)</FieldLabel>
            <TextInput
              value={draft.grossSalesExport}
              onChange={(grossSalesExport) => patch({ grossSalesExport })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Country/ies of destination</FieldLabel>
            <TextInput
              value={draft.exportDestinations}
              onChange={(exportDestinations) => patch({ exportDestinations })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#0C2461]">
          Assistance obtained from DOST (Pre-Implementation)
        </h3>
        <div className="space-y-2">
          {FORM_008_ASSISTANCE_OPTIONS.map((opt) => (
            <label key={opt.id} className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={draft.dostAssistance.includes(opt.id)}
                onChange={() => toggleAssistance(opt.id)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <div>
          <FieldLabel>Specify (training / consultancy / others)</FieldLabel>
          <TextArea
            value={draft.assistanceSpecify}
            onChange={(assistanceSpecify) => patch({ assistanceSpecify })}
          />
        </div>
      </section>

      <section>
        <FieldLabel>Prepared by (Proponent)</FieldLabel>
        <TextInput
          value={draft.preparedBy}
          onChange={(preparedBy) => patch({ preparedBy })}
        />
      </section>
    </div>
  );
}
