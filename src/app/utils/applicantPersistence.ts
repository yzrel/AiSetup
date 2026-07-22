/**
 * Author: Yzrel Jade B. Eborde
 */

import { api, ApiError } from "../api/client";
import type { ApiApplicantRecord, ApiTnaFormPayload } from "../api/types";
import type { Applicant } from "../store/applicantStore";

/** Top-level applicant fields synced as the backend `profile` payload. */
function buildProfile(applicant: Applicant): Record<string, unknown> {
  const { id: _id, moduleData: _moduleData, ...profile } = applicant;
  return profile;
}

/** Passwords stay in the users table — never in applicant blobs. */
function stripSensitive(moduleData: Record<string, any>): Record<string, any> {
  if (!("password" in moduleData)) return moduleData;
  const { password: _password, ...rest } = moduleData;
  return rest;
}

function toApplicantRecord(applicant: Applicant): ApiApplicantRecord {
  return {
    id: applicant.id,
    applicationId: applicant.applicationId,
    enterpriseName: applicant.enterpriseName,
    currentModule: applicant.currentModule,
    moduleData: stripSensitive(applicant.moduleData),
    profile: buildProfile(applicant),
    updatedAt: applicant.lastUpdated,
  };
}

/** Sync case state to Spring Boot (required SoR). Throws on failure. */
export async function syncApplicantToBackend(
  applicant: Applicant,
): Promise<void> {
  await api.saveApplicantRecord(toApplicantRecord(applicant));
}

/** Fire-and-forget wrapper that logs sync failures. */
export function syncApplicantToBackendBestEffort(applicant: Applicant): void {
  void syncApplicantToBackend(applicant).catch((err) => {
    // #region agent log
    fetch('http://127.0.0.1:7919/ingest/215832d4-6965-4326-be26-4bf61789267b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5b70a'},body:JSON.stringify({sessionId:'c5b70a',hypothesisId:'H-A',location:'applicantPersistence.ts:syncBestEffort',message:'blob sync FAILED',data:{applicantId:applicant.id,currentModule:applicant.currentModule,status:err instanceof ApiError?err.status:null,error:err instanceof ApiError?err.message:String(err)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.warn(
      "[aisetup] Failed to sync applicant to backend:",
      err instanceof ApiError ? err.message : err,
    );
  });
}

/**
 * Partial TNA Form 01 sync via PUT /applicants/{id}/tna1.
 * Ensures the applicant blob exists first so a cold backend does not 404.
 */
export async function syncTna1FormToBackend(
  applicant: Applicant,
  payload: Omit<ApiTnaFormPayload, "applicantId">,
): Promise<void> {
  await syncApplicantToBackend(applicant);
  await api.saveTnaForm({
    applicantId: applicant.id,
    form: payload.form,
    tables: payload.tables,
    submitted: payload.submitted,
  });
}

/**
 * Server-side publish for staff-authored modules (audit trail + publish flag)
 * via PUT /applicants/{id}/modules/{moduleKey}. Fire-and-forget: the full blob
 * sync from applicantStore.update persists the same data as a fallback.
 */
export function publishModuleToBackendBestEffort(
  applicantId: string,
  moduleKey: string,
  data: Record<string, unknown>,
  published = true,
): void {
  void api
    .patchApplicantModule(applicantId, moduleKey, { data, published })
    .then((saved) => {
      // #region agent log
      fetch('http://127.0.0.1:7919/ingest/215832d4-6965-4326-be26-4bf61789267b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5b70a'},body:JSON.stringify({sessionId:'c5b70a',hypothesisId:'H-E',location:'applicantPersistence.ts:publishModule',message:'module patch OK',data:{applicantId,moduleKey,published,serverModuleKeys:Object.keys(saved?.moduleData??{})},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    })
    .catch((err) => {
      // #region agent log
      fetch('http://127.0.0.1:7919/ingest/215832d4-6965-4326-be26-4bf61789267b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5b70a'},body:JSON.stringify({sessionId:'c5b70a',hypothesisId:'H-E',location:'applicantPersistence.ts:publishModule',message:'module patch FAILED',data:{applicantId,moduleKey,published,status:err instanceof ApiError?err.status:null,error:err instanceof ApiError?err.message:String(err)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.warn(
        `[aisetup] Failed to publish ${moduleKey} to backend:`,
        err instanceof ApiError ? err.message : err,
      );
    });
}

/**
 * Mirrors an uploaded document into the backend file store
 * (POST /applicants/{id}/files). The base64 copy in moduleData remains the
 * source for previews/print; this adds a durable server-side file record.
 */
export function uploadFileToBackendBestEffort(
  applicantId: string,
  moduleKey: string,
  file: File,
): void {
  void api.uploadApplicantFile(applicantId, moduleKey, file).catch((err) => {
    console.warn(
      "[aisetup] Failed to upload file to backend:",
      err instanceof ApiError ? err.message : err,
    );
  });
}

export function syncTna1FormToBackendBestEffort(
  applicant: Applicant,
  payload: Omit<ApiTnaFormPayload, "applicantId">,
): void {
  void syncTna1FormToBackend(applicant, payload).catch((err) => {
    console.warn(
      "[aisetup] Failed to sync TNA1 to backend:",
      err instanceof ApiError ? err.message : err,
    );
  });
}

/** Fetch all persisted applicant records; null when the backend is unreachable. */
export async function fetchBackendApplicants(): Promise<
  ApiApplicantRecord[] | null
> {
  try {
    return await api.listApplicantRecords();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      // Applicants cannot list — hydrate their own record separately.
      return [];
    }
    console.warn(
      "[aisetup] Backend applicant list unavailable:",
      err instanceof ApiError ? err.message : err,
    );
    return null;
  }
}

export async function fetchBackendApplicant(
  id: string,
): Promise<ApiApplicantRecord | null> {
  try {
    return await api.getApplicant(id);
  } catch (err) {
    console.warn(
      "[aisetup] Backend applicant fetch unavailable:",
      err instanceof ApiError ? err.message : err,
    );
    return null;
  }
}
