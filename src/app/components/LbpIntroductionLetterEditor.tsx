/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ReactNode } from "react";
import type { LbpIntroductionLetterForm } from "../api/types";
import {
  amountToWordsPeso,
  formatPesoDisplay,
} from "../utils/lbpIntroductionLetter";
import { LandBankBranchPicker } from "./LandBankBranchPicker";

interface LbpIntroductionLetterEditorProps {
  form: LbpIntroductionLetterForm;
  onChange: (form: LbpIntroductionLetterForm) => void;
  readOnly?: boolean;
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
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 read-only:bg-gray-50"
    />
  );
}

export function LbpIntroductionLetterEditor({
  form,
  onChange,
  readOnly,
}: LbpIntroductionLetterEditorProps) {
  const patch = (partial: Partial<LbpIntroductionLetterForm>) =>
    onChange({ ...form, ...partial });

  const handleAmountChange = (approvedAmount: string) => {
    const num = parseFloat(approvedAmount.replace(/[^\d.]/g, "")) || 0;
    patch({
      approvedAmount: num > 0 ? `₱${formatPesoDisplay(num)}` : approvedAmount,
      approvedAmountWords: amountToWordsPeso(num),
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Letter of Introduction to Land Bank of the Philippines. Select a branch from
        the staff directory or enter details manually. Sync from applicant data to
        refresh project and amount details.
      </p>

      <div>
        <FieldLabel>Letter date</FieldLabel>
        <input
          type="date"
          value={form.letterDate}
          onChange={(e) => patch({ letterDate: e.target.value })}
          readOnly={readOnly}
          className="w-full sm:max-w-xs text-sm border border-gray-200 rounded-lg px-3 py-2 read-only:bg-gray-50"
        />
      </div>

      <LandBankBranchPicker form={form} onChange={onChange} readOnly={readOnly} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Enterprise</FieldLabel>
          <TextInput
            value={form.enterpriseName}
            onChange={(enterpriseName) => patch({ enterpriseName })}
            readOnly={readOnly}
          />
        </div>
        <div>
          <FieldLabel>Proponent / manager</FieldLabel>
          <TextInput
            value={form.proponentName}
            onChange={(proponentName) => patch({ proponentName })}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Project title</FieldLabel>
        <TextInput
          value={form.projectTitle}
          onChange={(projectTitle) => patch({ projectTitle })}
          readOnly={readOnly}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Approved amount</FieldLabel>
          <TextInput
            value={form.approvedAmount}
            onChange={handleAmountChange}
            placeholder="₱1,000,000.00"
            readOnly={readOnly}
          />
        </div>
        <div>
          <FieldLabel>Amount in words</FieldLabel>
          <TextInput
            value={form.approvedAmountWords}
            onChange={(approvedAmountWords) => patch({ approvedAmountWords })}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Signatory name</FieldLabel>
          <TextInput
            value={form.signatoryName}
            onChange={(signatoryName) => patch({ signatoryName })}
            readOnly={readOnly}
          />
        </div>
        <div>
          <FieldLabel>Signatory title</FieldLabel>
          <TextInput
            value={form.signatoryTitle}
            onChange={(signatoryTitle) => patch({ signatoryTitle })}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
