/**
 * Author: Yzrel Jade B. Eborde
 */

import { api } from "../api/client";
import type { ApiApplicantRecord } from "../api/types";
import type { Applicant } from "../store/applicantStore";

/** Top-level applicant fields synced as the backend `profile` payload. */
function buildProfile(applicant: Applicant): Record<string, unknown> {
  const { id: _id, moduleData: _moduleData, ...profile } = applicant;
  return profile;
}

/** Passwords never leave the browser — demo auth is client-side only. */
function stripSensitive(moduleData: Record<string, any>): Record<string, any> {
  if (!("password" in moduleData)) return moduleData;
  const { password: _password, ...rest } = moduleData;
  return rest;
}

/** Best-effort sync to Spring Boot persistence (non-blocking). */
export function syncApplicantToBackend(applicant: Applicant): void {
  void api
    .saveApplicantRecord({
      id: applicant.id,
      applicationId: applicant.applicationId,
      enterpriseName: applicant.enterpriseName,
      currentModule: applicant.currentModule,
      moduleData: stripSensitive(applicant.moduleData),
      profile: buildProfile(applicant),
      updatedAt: applicant.lastUpdated,
    })
    .catch(() => {
      /* backend optional in demo / offline */
    });
}

/** Fetch all persisted applicant records; null when the backend is unreachable. */
export async function fetchBackendApplicants(): Promise<
  ApiApplicantRecord[] | null
> {
  try {
    return await api.listApplicantRecords();
  } catch {
    return null; // backend optional in demo / offline
  }
}
