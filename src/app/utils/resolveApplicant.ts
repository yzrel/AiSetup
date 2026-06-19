/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import { AuthUser, authStore } from "../store/authStore";
import { staffContextStore } from "../store/staffContextStore";
import { getApplicantsForStaff } from "./provincialOffice";

/** Resolve the applicant record for the current session (applicant or staff demo pick). */
export function resolveApplicantForUser(
  user?: AuthUser | null,
): Applicant | null {
  if (!user) {
    const all = applicantStore.getAll();
    return all.find((a) => a.qualified) ?? all[0] ?? null;
  }

  if (authStore.isStaff(user.role)) {
    const scoped = getApplicantsForStaff(user);
    const selectedId = staffContextStore.getSelectedApplicantId();
    if (selectedId) {
      const selected = scoped.find((a) => a.id === selectedId);
      if (selected) return selected;
    }
    return scoped.find((a) => a.qualified) ?? scoped[0] ?? null;
  }

  return (
    applicantStore.getById(user.id) ??
    applicantStore.getByEmail(user.email) ??
    (user.applicationId
      ? applicantStore.getAll().find((a) => a.applicationId === user.applicationId)
      : null) ??
    null
  );
}
