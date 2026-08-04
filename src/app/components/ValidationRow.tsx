/**
 * Author: Yzrel Jade B. Eborde
 */

import { AlertCircle, CheckCircle } from "lucide-react";

/** Shared OK / MISSING row for LOI and TNA validation checklists. */
export function ValidationRow({
  label,
  value,
  passed,
  missingHint = "Missing — please complete in previous steps",
}: {
  label: string;
  value?: string;
  passed: boolean;
  missingHint?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
        }`}
      >
        {passed ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p
          className={`text-sm mt-0.5 truncate ${
            passed ? "text-gray-800" : "text-red-500 italic"
          }`}
        >
          {value || missingHint}
        </p>
      </div>
      <span
        className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
          passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}
      >
        {passed ? "OK" : "MISSING"}
      </span>
    </div>
  );
}
