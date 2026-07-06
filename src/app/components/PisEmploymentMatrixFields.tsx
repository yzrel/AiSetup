/**
 * Author: Yzrel Jade B. Eborde
 */

import type { PisEmploymentMatrix, PisHireBlock, PisSexCounts } from "../api/types";

interface PisEmploymentMatrixFieldsProps {
  employment: PisEmploymentMatrix;
  onChange: (employment: PisEmploymentMatrix) => void;
}

function SexInputs({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PisSexCounts;
  onChange: (v: PisSexCounts) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <span className="text-xs text-gray-600">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="Male"
        value={value.male}
        onChange={(e) => onChange({ ...value, male: e.target.value })}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
      />
      <input
        type="text"
        inputMode="numeric"
        placeholder="Female"
        value={value.female}
        onChange={(e) => onChange({ ...value, female: e.target.value })}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
      />
    </div>
  );
}

function HireBlockFields({
  title,
  block,
  onChange,
}: {
  title: string;
  block: PisHireBlock;
  onChange: (block: PisHireBlock) => void;
}) {
  return (
    <div className="space-y-2 border border-gray-100 rounded-lg p-3">
      <p className="text-xs font-bold text-gray-700">{title}</p>
      <SexInputs
        label="Regular"
        value={block.regular}
        onChange={(regular) => onChange({ ...block, regular })}
      />
      <SexInputs
        label="Part-time"
        value={block.partTime}
        onChange={(partTime) => onChange({ ...block, partTime })}
      />
      <SexInputs
        label="PWD"
        value={block.pwd}
        onChange={(pwd) => onChange({ ...block, pwd })}
      />
      <SexInputs
        label="Senior Citizen"
        value={block.seniorCitizen}
        onChange={(seniorCitizen) => onChange({ ...block, seniorCitizen })}
      />
    </div>
  );
}

export function PisEmploymentMatrixFields({
  employment,
  onChange,
}: PisEmploymentMatrixFieldsProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Employment counts use 1 man-month (20 working days) = 1 employment. Enter Male /
        Female for each category.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <HireBlockFields
          title="Direct — Company Hire"
          block={employment.companyHire}
          onChange={(companyHire) => onChange({ ...employment, companyHire })}
        />
        <HireBlockFields
          title="Direct — Sub-contractor Hire"
          block={employment.subcontractorHire}
          onChange={(subcontractorHire) =>
            onChange({ ...employment, subcontractorHire })
          }
        />
      </div>
      <div className="space-y-2 border border-gray-100 rounded-lg p-3">
        <p className="text-xs font-bold text-gray-700">Indirect Employment</p>
        <SexInputs
          label="Backward"
          value={employment.indirectBackward}
          onChange={(indirectBackward) =>
            onChange({ ...employment, indirectBackward })
          }
        />
        <SexInputs
          label="Forward"
          value={employment.indirectForward}
          onChange={(indirectForward) =>
            onChange({ ...employment, indirectForward })
          }
        />
        <SexInputs
          label="PWD"
          value={employment.indirectPwd}
          onChange={(indirectPwd) => onChange({ ...employment, indirectPwd })}
        />
        <SexInputs
          label="Senior Citizen"
          value={employment.indirectSeniorCitizen}
          onChange={(indirectSeniorCitizen) =>
            onChange({ ...employment, indirectSeniorCitizen })
          }
        />
      </div>
    </div>
  );
}

function sexCell(c: PisSexCounts): string {
  const m = c.male.trim() || "—";
  const f = c.female.trim() || "—";
  return `M: ${m} / F: ${f}`;
}

/** Compact employment table for print/preview */
export function PisEmploymentMatrixPreview({
  employment,
}: {
  employment: PisEmploymentMatrix;
}) {
  const rows: [string, string][] = [
    ["Company Hire — Regular", sexCell(employment.companyHire.regular)],
    ["Company Hire — Part-time", sexCell(employment.companyHire.partTime)],
    ["Company Hire — PWD", sexCell(employment.companyHire.pwd)],
    ["Company Hire — Senior Citizen", sexCell(employment.companyHire.seniorCitizen)],
    ["Sub-contractor — Regular", sexCell(employment.subcontractorHire.regular)],
    ["Sub-contractor — Part-time", sexCell(employment.subcontractorHire.partTime)],
    ["Sub-contractor — PWD", sexCell(employment.subcontractorHire.pwd)],
    [
      "Sub-contractor — Senior Citizen",
      sexCell(employment.subcontractorHire.seniorCitizen),
    ],
    ["Indirect — Backward", sexCell(employment.indirectBackward)],
    ["Indirect — Forward", sexCell(employment.indirectForward)],
    ["Indirect — PWD", sexCell(employment.indirectPwd)],
    ["Indirect — Senior Citizen", sexCell(employment.indirectSeniorCitizen)],
  ];

  return (
    <table className="w-full border-collapse text-xs mb-3">
      <thead>
        <tr>
          <th className="border border-gray-300 bg-gray-50 px-2 py-1 text-left">Category</th>
          <th className="border border-gray-300 bg-gray-50 px-2 py-1 text-left">Male / Female</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="border border-gray-300 px-2 py-1">{label}</td>
            <td className="border border-gray-300 px-2 py-1">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
