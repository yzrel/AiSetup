/**
 * Author: Yzrel Jade B. Eborde
 */

import { useCallback, useEffect, useState } from "react";
import { applicantStore, Applicant } from "../store/applicantStore";
import { AuthUser, authStore } from "../store/authStore";
import { staffContextStore } from "../store/staffContextStore";
import { getApplicantsForStaff } from "../utils/provincialOffice";
import { resolveApplicantForUser } from "../utils/resolveApplicant";

export function useStaffApplicant(user?: AuthUser | null) {
  const isStaff = user ? authStore.isStaff(user.role) : false;
  const [, bump] = useState(0);

  useEffect(() => {
    const unsubs = [
      staffContextStore.subscribe(() => bump((n) => n + 1)),
      applicantStore.subscribe(() => bump((n) => n + 1)),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const scopedApplicants = isStaff && user ? getApplicantsForStaff(user) : [];

  const applicant = resolveApplicantForUser(user);

  const setSelectedApplicant = useCallback(
    (next: Applicant | null) => {
      staffContextStore.setSelectedApplicant(next?.id ?? null);
    },
    [],
  );

  const setSelectedApplicantId = useCallback((id: string | null) => {
    staffContextStore.setSelectedApplicant(id);
  }, []);

  return {
    isStaff,
    applicant,
    scopedApplicants,
    selectedApplicantId: staffContextStore.getSelectedApplicantId(),
    setSelectedApplicant,
    setSelectedApplicantId,
    clearSelection: staffContextStore.clearSelection,
    hasSelection: !!staffContextStore.getSelectedApplicantId(),
  };
}
