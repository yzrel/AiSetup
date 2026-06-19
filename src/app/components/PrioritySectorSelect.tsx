/**
 * Author: Yzrel Jade B. Eborde
 */

import { SETUP_PRIORITY_SECTORS } from "../constants/setupBrochure";

type PrioritySectorSelectProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
};

export function PrioritySectorSelect({
  value,
  onChange,
  className = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
  placeholder = "Select priority sector",
  required,
  id,
}: PrioritySectorSelectProps) {
  return (
    <select
      id={id}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">{placeholder}</option>
      {SETUP_PRIORITY_SECTORS.map((sector) => (
        <option key={sector} value={sector}>
          {sector}
        </option>
      ))}
    </select>
  );
}
