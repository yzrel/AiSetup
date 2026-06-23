/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ReactNode } from "react";
import type { ApprovalLetterForm } from "../api/types";
import { formatFormMention } from "../constants/setupForms";
import { DOST_REGION_12_DIRECTOR_NAME } from "../constants/region12";

interface ApprovalLetterEditorProps {
  form: ApprovalLetterForm;
  onChange: (form: ApprovalLetterForm) => void;
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

export function ApprovalLetterEditor({ form, onChange }: ApprovalLetterEditorProps) {
  const patch = (partial: Partial<ApprovalLetterForm>) =>
    onChange({ ...form, ...partial });

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Edit {formatFormMention("003")} variable fields. Body paragraphs are generated from the
        official template; sync from RTEC to refresh project and PSTO details.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Series year</FieldLabel>
          <TextInput
            value={form.seriesYear}
            onChange={(seriesYear) => patch({ seriesYear })}
          />
        </div>
        <div>
          <FieldLabel>Approval date</FieldLabel>
          <input
            type="date"
            value={form.approvalDate}
            onChange={(e) => patch({ approvalDate: e.target.value })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <FieldLabel>Reference number</FieldLabel>
          <TextInput
            value={form.referenceNumber}
            onChange={(referenceNumber) => patch({ referenceNumber })}
            placeholder="SETUPiFund/DOSTXII/25/141"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Recipient name</FieldLabel>
          <TextInput
            value={form.recipientName}
            onChange={(recipientName) => patch({ recipientName })}
          />
        </div>
        <div>
          <FieldLabel>Designation</FieldLabel>
          <TextInput
            value={form.recipientDesignation}
            onChange={(recipientDesignation) => patch({ recipientDesignation })}
            placeholder="Proprietor"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Enterprise name</FieldLabel>
        <TextInput
          value={form.enterpriseName}
          onChange={(enterpriseName) => patch({ enterpriseName })}
        />
      </div>

      <div>
        <FieldLabel>Enterprise address</FieldLabel>
        <TextArea
          value={form.enterpriseAddress}
          onChange={(enterpriseAddress) => patch({ enterpriseAddress })}
          rows={3}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Project title</FieldLabel>
          <TextInput
            value={form.projectTitle}
            onChange={(projectTitle) => patch({ projectTitle })}
          />
        </div>
        <div>
          <FieldLabel>Approved SETUP amount</FieldLabel>
          <TextInput
            value={form.approvedAmount}
            onChange={(approvedAmount) => patch({ approvedAmount })}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Refund term (years)</FieldLabel>
          <TextInput
            value={form.refundTermYears}
            onChange={(refundTermYears) => patch({ refundTermYears })}
            placeholder="five (5)"
          />
        </div>
        <div>
          <FieldLabel>Insurance rate (%)</FieldLabel>
          <TextInput
            value={form.insuranceRatePercent}
            onChange={(insuranceRatePercent) => patch({ insuranceRatePercent })}
            placeholder="0.50"
          />
        </div>
        <div>
          <FieldLabel>Conforme deadline (days)</FieldLabel>
          <TextInput
            value={form.conformeDeadlineDays}
            onChange={(conformeDeadlineDays) => patch({ conformeDeadlineDays })}
            placeholder="15"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>PSTO director title</FieldLabel>
          <TextInput
            value={form.pstoDirectorTitle}
            onChange={(pstoDirectorTitle) => patch({ pstoDirectorTitle })}
            placeholder="Provincial Director"
          />
        </div>
        <div>
          <FieldLabel>PSTO office name</FieldLabel>
          <TextInput
            value={form.pstoOfficeName}
            onChange={(pstoOfficeName) => patch({ pstoOfficeName })}
            placeholder="PSTO - South Cotabato"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div>
          <FieldLabel>Signatory name</FieldLabel>
          <TextInput
            value={form.signatoryName || DOST_REGION_12_DIRECTOR_NAME}
            onChange={(signatoryName) => patch({ signatoryName })}
          />
        </div>
        <div>
          <FieldLabel>Signatory title</FieldLabel>
          <TextInput
            value={form.signatoryTitle}
            onChange={(signatoryTitle) => patch({ signatoryTitle })}
            placeholder="Regional Director"
          />
        </div>
      </div>
    </div>
  );
}
