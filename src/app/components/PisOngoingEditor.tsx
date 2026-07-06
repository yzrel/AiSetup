/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ReactNode } from "react";
import type { PisOngoingFiling, PisSemester } from "../api/types";
import { FORM_009_ASSISTANCE_OPTIONS } from "../constants/pisFormLayout";
import { formatSemesterLabel } from "../utils/projectInformationSheet";
import { PisEmploymentMatrixFields } from "./PisEmploymentMatrixFields";

interface PisOngoingEditorProps {
  filing: PisOngoingFiling;
  onChange: (filing: PisOngoingFiling) => void;
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
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
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
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
    />
  );
}

export function PisOngoingEditor({ filing, onChange }: PisOngoingEditorProps) {
  const patch = (partial: Partial<PisOngoingFiling>) => {
    const next = { ...filing, ...partial };
    if (partial.reportingYear !== undefined || partial.semester !== undefined) {
      const year = partial.reportingYear ?? filing.reportingYear;
      const semester = partial.semester ?? filing.semester;
      next.periodLabel = formatSemesterLabel(year, semester);
    }
    onChange(next);
  };

  const toggleAssistance = (id: string) => {
    const set = new Set(filing.dostAssistance);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    patch({ dostAssistance: [...set] });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        SETUP Form 009 ongoing PIS is filed <strong>once per semester</strong> (1st
        Semester: January–June; 2nd Semester: July–December). Firm fields below are
        filled only if information changed from Pre-PIS.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Reporting year</FieldLabel>
          <TextInput
            value={filing.reportingYear}
            onChange={(reportingYear) => patch({ reportingYear })}
            placeholder="2025"
          />
        </div>
        <div>
          <FieldLabel>Semester</FieldLabel>
          <select
            value={filing.semester}
            onChange={(e) => patch({ semester: e.target.value as PisSemester })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            <option value="1">1st Semester (Jan–Jun)</option>
            <option value="2">2nd Semester (Jul–Dec)</option>
          </select>
        </div>
        <div>
          <FieldLabel>Period label</FieldLabel>
          <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            {filing.periodLabel ||
              formatSemesterLabel(filing.reportingYear, filing.semester)}
          </p>
        </div>
        <div>
          <FieldLabel>Project code</FieldLabel>
          <TextInput
            value={filing.projectCode}
            onChange={(projectCode) => patch({ projectCode })}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Project title</FieldLabel>
          <TextInput
            value={filing.projectTitle}
            onChange={(projectTitle) => patch({ projectTitle })}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#0C2461] mb-2">
          Firm details (fill only if changed)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Name of firm</FieldLabel>
            <TextInput value={filing.firmName} onChange={(firmName) => patch({ firmName })} />
          </div>
          <div>
            <FieldLabel>Owner / contact person</FieldLabel>
            <TextInput
              value={filing.ownerName}
              onChange={(ownerName) => patch({ ownerName })}
            />
          </div>
          <div>
            <FieldLabel>Sex</FieldLabel>
            <TextInput value={filing.ownerSex} onChange={(ownerSex) => patch({ ownerSex })} />
          </div>
          <div>
            <FieldLabel>Birthday</FieldLabel>
            <TextInput
              value={filing.ownerBirthday}
              onChange={(ownerBirthday) => patch({ ownerBirthday })}
            />
          </div>
          <div>
            <FieldLabel>Type of organization</FieldLabel>
            <TextInput value={filing.orgType} onChange={(orgType) => patch({ orgType })} />
          </div>
          <div>
            <FieldLabel>Business address</FieldLabel>
            <TextInput
              value={filing.businessAddress}
              onChange={(businessAddress) => patch({ businessAddress })}
            />
          </div>
          <div>
            <FieldLabel>Landline</FieldLabel>
            <TextInput value={filing.landline} onChange={(landline) => patch({ landline })} />
          </div>
          <div>
            <FieldLabel>Fax</FieldLabel>
            <TextInput value={filing.fax} onChange={(fax) => patch({ fax })} />
          </div>
          <div>
            <FieldLabel>Mobile phone</FieldLabel>
            <TextInput
              value={filing.mobilePhone}
              onChange={(mobilePhone) => patch({ mobilePhone })}
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput value={filing.email} onChange={(email) => patch({ email })} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#0C2461] mb-2">Total assets (₱)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
              <TextInput value={filing[key]} onChange={(v) => patch({ [key]: v })} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#0C2461] mb-2">
          Total employment generated (period covered)
        </h3>
        <PisEmploymentMatrixFields
          employment={filing.employment}
          onChange={(employment) => patch({ employment })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Production volume (local)</FieldLabel>
          <TextInput
            value={filing.productionVolumeLocal}
            onChange={(productionVolumeLocal) => patch({ productionVolumeLocal })}
          />
        </div>
        <div>
          <FieldLabel>Production volume (export)</FieldLabel>
          <TextInput
            value={filing.productionVolumeExport}
            onChange={(productionVolumeExport) => patch({ productionVolumeExport })}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Production details</FieldLabel>
          <TextArea
            value={filing.productionDetails}
            onChange={(productionDetails) => patch({ productionDetails })}
          />
        </div>
        <div>
          <FieldLabel>Gross sales (local)</FieldLabel>
          <TextInput
            value={filing.grossSalesLocal}
            onChange={(grossSalesLocal) => patch({ grossSalesLocal })}
          />
        </div>
        <div>
          <FieldLabel>Gross sales (export)</FieldLabel>
          <TextInput
            value={filing.grossSalesExport}
            onChange={(grossSalesExport) => patch({ grossSalesExport })}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Export destinations</FieldLabel>
          <TextInput
            value={filing.exportDestinations}
            onChange={(exportDestinations) => patch({ exportDestinations })}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#0C2461] mb-2">
          Assistance obtained from DOST
        </h3>
        <div className="space-y-2">
          {FORM_009_ASSISTANCE_OPTIONS.map((opt) => (
            <label key={opt.id} className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={filing.dostAssistance.includes(opt.id)}
                onChange={() => toggleAssistance(opt.id)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <FieldLabel>Specify (training / consultancy / others)</FieldLabel>
          <TextArea
            value={filing.assistanceSpecify}
            onChange={(assistanceSpecify) => patch({ assistanceSpecify })}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Prepared by (PSTD / CASTD / CSTD)</FieldLabel>
        <TextInput
          value={filing.preparedBy}
          onChange={(preparedBy) => patch({ preparedBy })}
        />
      </div>
    </div>
  );
}
