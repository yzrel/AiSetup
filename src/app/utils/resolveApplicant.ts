import { applicantStore, Applicant } from "../store/applicantStore";
import { AuthUser } from "../store/authStore";

/** Resolve the applicant record for the current session (applicant or staff demo pick). */
export function resolveApplicantForUser(
  user?: AuthUser | null,
): Applicant | null {
  if (!user) {
    const all = applicantStore.getAll();
    return all.find((a) => a.qualified) ?? all[0] ?? null;
  }

  if (user.role === "admin" || user.role === "agent") {
    const all = applicantStore.getAll();
    return all.find((a) => a.qualified) ?? all[0] ?? null;
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
