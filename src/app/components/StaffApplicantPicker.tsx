/**
 * Author: Yzrel Jade B. Eborde
 */

import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { AuthUser } from "../store/authStore";
import { StaffApplicantCombobox } from "./StaffApplicantCombobox";
import {
  MODULE_HEADER_HINT,
  MODULE_HEADER_LABEL,
  MODULE_HEADER_PICKER,
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
    scopedApplicants,
    selectedApplicantId,
    setSelectedApplicantId,
    hasSelection,
  } = useStaffApplicant(user);

  if (!isStaff) return null;

  return (
    <div className={className}>
      <label className={`${MODULE_HEADER_LABEL} block`}>{label}</label>
      <StaffApplicantCombobox
        applicants={scopedApplicants}
        value={selectedApplicantId}
        onChange={setSelectedApplicantId}
        placeholder="Select enterprise…"
        showApplicationId
        allowClear
        variant="module"
      />
      {!hasSelection && (
        <p className={MODULE_HEADER_HINT}>
          Select a cooperator from Cooperators or the header bar to begin assessment.
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
      No active cooperator selected. Open <strong>Cooperators</strong> or use the header bar to
      select an applicant before reviewing this module.
    </div>
  );
}
