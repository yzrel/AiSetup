/**
 * Shared "Date established" input — label, date picker, hint below (grid-safe).
 */

import {
  DATE_ESTABLISHED_HINT,
  DATE_ESTABLISHED_LABEL,
} from "../constants/enterpriseProfileFields";

const defaultLabelCls = "block text-sm font-medium text-gray-700 mb-1";
const defaultInputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
const defaultHintCls = "text-xs text-gray-500 mt-1 leading-snug";

export function DateEstablishedField({
  value,
  onChange,
  required,
  labelClassName = defaultLabelCls,
  inputClassName = defaultInputCls,
  hintClassName = defaultHintCls,
  max = new Date().toISOString().split("T")[0],
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  labelClassName?: string;
  inputClassName?: string;
  hintClassName?: string;
  max?: string;
}) {
  return (
    <div>
      <label className={labelClassName}>
        {DATE_ESTABLISHED_LABEL}
        {required ? " *" : ""}
      </label>
      <input
        type="date"
        className={inputClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        required={required}
      />
      <p className={hintClassName}>{DATE_ESTABLISHED_HINT}</p>
    </div>
  );
}
