/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ReactNode } from "react";
import type { PisOngoingFiling, PisSemester } from "../api/types";
import { formatSemesterLabel } from "../utils/projectInformationSheet";

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

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Form 009 ongoing PIS is filed <strong>once per semester</strong> (1st Semester:
        January–June; 2nd Semester: July–December) during project implementation.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
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
        <div>
          <FieldLabel>Firm name</FieldLabel>
          <TextInput value={filing.firmName} onChange={(firmName) => patch({ firmName })} />
        </div>
        <div>
          <FieldLabel>Owner / manager</FieldLabel>
          <TextInput value={filing.ownerName} onChange={(ownerName) => patch({ ownerName })} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#0C2461] mb-2">Assets (Php)</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <FieldLabel>Land</FieldLabel>
            <TextInput
              value={filing.assetsLand}
              onChange={(assetsLand) => patch({ assetsLand })}
            />
          </div>
          <div>
            <FieldLabel>Building</FieldLabel>
            <TextInput
              value={filing.assetsBuilding}
              onChange={(assetsBuilding) => patch({ assetsBuilding })}
            />
          </div>
          <div>
            <FieldLabel>Equipment</FieldLabel>
            <TextInput
              value={filing.assetsEquipment}
              onChange={(assetsEquipment) => patch({ assetsEquipment })}
            />
          </div>
          <div>
            <FieldLabel>Working capital</FieldLabel>
            <TextInput
              value={filing.assetsWorkingCapital}
              onChange={(assetsWorkingCapital) => patch({ assetsWorkingCapital })}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#0C2461] mb-2">Employment</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <FieldLabel>Direct male</FieldLabel>
            <TextInput
              value={filing.employmentDirectMale}
              onChange={(employmentDirectMale) => patch({ employmentDirectMale })}
            />
          </div>
          <div>
            <FieldLabel>Direct female</FieldLabel>
            <TextInput
              value={filing.employmentDirectFemale}
              onChange={(employmentDirectFemale) => patch({ employmentDirectFemale })}
            />
          </div>
          <div>
            <FieldLabel>Indirect male</FieldLabel>
            <TextInput
              value={filing.employmentIndirectMale}
              onChange={(employmentIndirectMale) => patch({ employmentIndirectMale })}
            />
          </div>
          <div>
            <FieldLabel>Indirect female</FieldLabel>
            <TextInput
              value={filing.employmentIndirectFemale}
              onChange={(employmentIndirectFemale) => patch({ employmentIndirectFemale })}
            />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
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
        <div className="sm:col-span-2">
          <FieldLabel>Prepared by</FieldLabel>
          <TextInput
            value={filing.preparedBy}
            onChange={(preparedBy) => patch({ preparedBy })}
          />
        </div>
      </div>
    </div>
  );
}
