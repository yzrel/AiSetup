/**
 * Author: Yzrel Jade B. Eborde
 */

import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { AuthUser } from "../store/authStore";
import {
  MODULE_HEADER_HINT,
  MODULE_HEADER_LABEL,
  MODULE_HEADER_PICKER,
  MODULE_HEADER_SELECT,
} from "./moduleTheme";

interface StaffApplicantPickerProps {
  user?: AuthUser | null;
  label?: string;
  className?: string;
}

export function StaffApplicantPicker({
  user,
  label = "Review applicant",
  className = MODULE_HEADER_PICKER,
}: StaffApplicantPickerProps) {
  const {
    isStaff,
    applicant,
    scopedApplicants,
    setSelectedApplicantId,
    hasSelection,
  } = useStaffApplicant(user);

  if (!isStaff) return null;

  return (
    <div className={className}>
      <label className={`${MODULE_HEADER_LABEL} block`}>{label}</label>
      <select
        value={applicant?.id ?? ""}
        onChange={(e) => setSelectedApplicantId(e.target.value || null)}
        className={`${MODULE_HEADER_SELECT} truncate`}
      >
        <option value="">Select enterprise…</option>
        {scopedApplicants.map((a) => (
          <option key={a.id} value={a.id} className="truncate">
            {a.enterpriseName} — {a.applicationId}
          </option>
        ))}
      </select>
      {!hasSelection && (
        <p className={MODULE_HEADER_HINT}>
          Select a client from Clients or the header bar to begin assessment.
        </p>
      )}
    </div>
  );
}

export function StaffApplicantBanner({ user }: { user?: AuthUser | null }) {
  const { isStaff, applicant, hasSelection } = useStaffApplicant(user);
  if (!isStaff || hasSelection) return null;
  return (
    <div className="mx-4 sm:mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
      No active client selected. Open <strong>Clients</strong> or use the header bar to
      select an applicant before reviewing this module.
    </div>
  );
}
