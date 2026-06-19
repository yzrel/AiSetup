/**
 * Author: Yzrel Jade B. Eborde
 */

import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { AuthUser } from "../store/authStore";

interface StaffApplicantPickerProps {
  user?: AuthUser | null;
  label?: string;
  className?: string;
}

export function StaffApplicantPicker({
  user,
  label = "Review applicant",
  className = "mt-4 p-3 bg-white/10 rounded-xl border border-white/20",
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
      <label className="text-[10px] font-bold uppercase tracking-wide text-white/60 block mb-1.5">
        {label}
      </label>
      <select
        value={applicant?.id ?? ""}
        onChange={(e) => setSelectedApplicantId(e.target.value || null)}
        className="w-full text-sm rounded-lg px-3 py-2 text-gray-800 border-0"
      >
        <option value="">Select enterprise…</option>
        {scopedApplicants.map((a) => (
          <option key={a.id} value={a.id}>
            {a.enterpriseName} — {a.applicationId}
          </option>
        ))}
      </select>
      {!hasSelection && (
        <p className="text-[10px] text-white/50 mt-1.5">
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
    <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
      No active client selected. Open <strong>Clients</strong> or use the header bar to
      select an applicant before reviewing this module.
    </div>
  );
}
