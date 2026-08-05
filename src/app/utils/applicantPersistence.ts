/**
 * Author: Yzrel Jade B. Eborde
 *
 * Hybrid SoR sync: per-module rows are primary; case header is thin;
 * whole-blob PUT is best-effort compat only.
 */

import { toast } from "sonner";
import { api, ApiError } from "../api/client";
import type { ApiApplicantRecord, ApiTnaFormPayload } from "../api/types";
import type { Applicant } from "../store/applicantStore";
import {
  stripHeavyPayloads,
  stripTna1FormForSync,
} from "./stripModuleDataForSync";

/** Reserved module row for top-level scalar / array flags (must match BE). */
export const CASE_META_KEY = "caseMeta";

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
    moduleData: stripHeavyPayloads(stripSensitive(applicant.moduleData)),
    profile: buildProfile(applicant),
    updatedAt: applicant.lastUpdated,
  };
}

function syncErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}

function notifySyncFailure(context: string, err: unknown): void {
  const detail = syncErrorMessage(err);
  console.warn(`[aisetup] ${context}:`, detail);
  toast.error("Could not save progress to the server", {
    description: detail,
    duration: 8000,
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Split moduleData into object module rows + scalar/array caseMeta bag.
 * Every SETUP module object key becomes its own DB row.
 */
export function splitModuleDataForSync(moduleData: Record<string, unknown>): {
  modules: Record<string, Record<string, unknown>>;
  caseMeta: Record<string, unknown>;
} {
  const modules: Record<string, Record<string, unknown>> = {};
  const caseMeta: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(moduleData ?? {})) {
    if (key === CASE_META_KEY) {
      if (isPlainObject(value)) {
        Object.assign(caseMeta, value);
      }
      continue;
    }
    if (isPlainObject(value)) {
      modules[key] = value;
    } else {
      caseMeta[key] = value;
    }
  }
  return { modules, caseMeta };
}

/**
 * Push each module object (+ caseMeta) via PUT /modules/{key} so large cases
 * land in applicant_module_data even when the legacy whole-blob PUT fails.
 */
async function syncStructuredModules(
  applicantId: string,
  moduleData: Record<string, unknown>,
): Promise<{ ok: number; failed: number }> {
  const { modules, caseMeta } = splitModuleDataForSync(moduleData);
  const entries: Array<[string, Record<string, unknown>]> = [
    ...Object.entries(modules),
  ];
  if (Object.keys(caseMeta).length > 0) {
    entries.push([CASE_META_KEY, caseMeta]);
  }

  let ok = 0;
  let failed = 0;
  await Promise.all(
    entries.map(async ([moduleKey, value]) => {
      try {
        await api.patchApplicantModule(applicantId, moduleKey, {
          data: stripHeavyPayloads(value),
        });
        ok += 1;
      } catch (err) {
        // Staff-only keys 403 for applicants; size/validation errors are non-fatal
        // here because sibling modules may still persist.
        if (
          err instanceof ApiError &&
          (err.status === 403 || err.status === 404)
        ) {
          return;
        }
        failed += 1;
        console.warn(
          `[aisetup] Per-module sync skipped for ${moduleKey}:`,
          syncErrorMessage(err),
        );
      }
    }),
  );
  return { ok, failed };
}

async function syncHeader(
  record: ApiApplicantRecord,
): Promise<"ok" | "missing"> {
  try {
    await api.updateApplicantHeader(record.id, {
      enterpriseName: record.enterpriseName,
      currentModule: record.currentModule,
      profile: (record.profile ?? {}) as Record<string, unknown>,
    });
    return "ok";
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return "missing";
    }
    throw err;
  }
}

/**
 * Sync case state to Spring Boot (required SoR).
 * Primary path: per-module rows (incl. caseMeta branch flags) then header
 * currentModule — so program-referral / MPEX caps see metadata before advance.
 * Whole-blob PUT is best-effort only.
 */
export async function syncApplicantToBackend(
  applicant: Applicant,
): Promise<void> {
  const record = toApplicantRecord(applicant);

  // Existence probe without advancing currentModule (header advance can 403
  // when branch metadata is not on the server yet).
  try {
    await api.getApplicant(record.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await api.saveApplicantRecord(record);
      return;
    }
    throw err;
  }

  const { ok, failed } = await syncStructuredModules(
    applicant.id,
    (record.moduleData ?? {}) as Record<string, unknown>,
  );

  const headerStatus = await syncHeader(record);
  if (headerStatus === "missing") {
    // Race: case disappeared between probe and header — cold create.
    await api.saveApplicantRecord(record);
    return;
  }

  // Legacy blob dual-write for rollback/compat — never fail the primary path.
  void api.saveApplicantRecord(record).catch((blobErr) => {
    console.warn(
      "[aisetup] Legacy whole-blob sync failed (per-module rows may still be saved):",
      syncErrorMessage(blobErr),
    );
  });

  if (ok === 0 && failed > 0) {
    throw new Error(
      `Could not persist any module rows (${failed} failed). Check server logs.`,
    );
  }
}

/** Fire-and-forget wrapper that logs sync failures and surfaces them in the UI. */
export function syncApplicantToBackendBestEffort(applicant: Applicant): void {
  void syncApplicantToBackend(applicant).catch((err) => {
    notifySyncFailure("Failed to sync applicant to backend", err);
  });
}

/**
 * Targeted module-key save used by draft/publish helpers across all modules.
 * Falls back to creating the applicant row when the case is cold.
 */
export async function syncModuleKeyToBackend(
  applicant: Applicant,
  moduleKey: string,
  data: Record<string, unknown>,
  published?: boolean,
): Promise<void> {
  const slim = stripHeavyPayloads(data);
  try {
    await api.patchApplicantModule(applicant.id, moduleKey, {
      data: slim,
      published,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await syncApplicantToBackend(applicant);
      await api.patchApplicantModule(applicant.id, moduleKey, {
        data: slim,
        published,
      });
      return;
    }
    throw err;
  }

  if (applicant.applicationId) {
    void syncHeader(toApplicantRecord(applicant)).catch((headerErr) => {
      if (!(headerErr instanceof ApiError && headerErr.status === 404)) {
        console.warn(
          "[aisetup] Header sync after module patch failed:",
          syncErrorMessage(headerErr),
        );
      }
    });
  }
}

export function syncModuleKeyToBackendBestEffort(
  applicant: Applicant,
  moduleKey: string,
  data: Record<string, unknown>,
  published?: boolean,
): void {
  void syncModuleKeyToBackend(applicant, moduleKey, data, published).catch(
    (err) => {
      notifySyncFailure(`Failed to sync ${moduleKey} to backend`, err);
    },
  );
}

/**
 * Partial TNA Form 01 sync via PUT /applicants/{id}/tna1.
 * Does not wait on the whole-blob PUT — oversized legacy blobs must not block
 * form field persistence. Header + sibling modules sync best-effort afterward.
 */
export async function syncTna1FormToBackend(
  applicant: Applicant,
  payload: Omit<ApiTnaFormPayload, "applicantId">,
): Promise<void> {
  const form = stripTna1FormForSync(
    (payload.form ?? {}) as Record<string, unknown>,
  );
  const tnaBody = {
    applicantId: applicant.id,
    form,
    tables: payload.tables,
    submitted: payload.submitted,
  };

  try {
    await api.saveTnaForm(tnaBody);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await syncApplicantToBackend(applicant);
      await api.saveTnaForm(tnaBody);
    } else {
      throw err;
    }
  }

  void syncApplicantToBackend(applicant).catch((blobErr) => {
    notifySyncFailure(
      "Failed to sync full applicant record after TNA1",
      blobErr,
    );
  });
}

/**
 * Server-side publish for staff-authored modules (audit trail + publish flag)
 * via PUT /applicants/{id}/modules/{moduleKey}.
 */
export function publishModuleToBackendBestEffort(
  applicantId: string,
  moduleKey: string,
  data: Record<string, unknown>,
  published = true,
): void {
  void api
    .patchApplicantModule(applicantId, moduleKey, {
      data: stripHeavyPayloads(data),
      published,
    })
    .catch((err) => {
      notifySyncFailure(`Failed to publish ${moduleKey} to backend`, err);
    });
}

/**
 * Upload a document into the backend file store (POST /applicants/{id}/files).
 * Returns file metadata (including id) on success; null on failure.
 */
export async function uploadFileToBackend(
  applicantId: string,
  moduleKey: string,
  file: File,
): Promise<Record<string, unknown> | null> {
  try {
    return await api.uploadApplicantFile(applicantId, moduleKey, file);
  } catch (err) {
    notifySyncFailure("Failed to upload file to backend", err);
    return null;
  }
}

/**
 * Mirrors an uploaded document into the backend file store.
 * The base64 copy may remain in memory for previews; durable storage is the file API.
 */
export function uploadFileToBackendBestEffort(
  applicantId: string,
  moduleKey: string,
  file: File,
): void {
  void uploadFileToBackend(applicantId, moduleKey, file);
}

export function syncTna1FormToBackendBestEffort(
  applicant: Applicant,
  payload: Omit<ApiTnaFormPayload, "applicantId">,
): void {
  void syncTna1FormToBackend(applicant, payload).catch((err) => {
    notifySyncFailure("Failed to sync TNA1 to backend", err);
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
