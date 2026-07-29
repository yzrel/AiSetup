/**
 * Author: Yzrel Jade B. Eborde
 *
 * Whole-blob applicant sync must stay under the backend moduleData size cap.
 * Binary previews live as data:/base64 in memory for the session UI; they must
 * not be written into applicant_records.module_data_json. Durable bytes belong
 * in the file_uploads store (POST /applicants/{id}/files).
 */

const DATA_URL_PREFIX = "data:";
/** Strings longer than this that look like data URLs are omitted from sync. */
const HEAVY_STRING_MIN = 512;

function isHeavyDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(DATA_URL_PREFIX) &&
    value.length >= HEAVY_STRING_MIN
  );
}

/**
 * Deep-clone a value for backend sync, omitting embedded file bodies.
 * Metadata (fileName, mimeType, uploadedAt, fileId, …) is preserved.
 */
export function stripHeavyPayloads<T>(value: T): T {
  return stripValue(value) as T;
}

function stripValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripValue);
  }
  if (value === null || typeof value !== "object") {
    if (isHeavyDataUrl(value)) return undefined;
    return value;
  }

  const input = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(input)) {
    if (key === "dataUrl" && isHeavyDataUrl(child)) {
      out.hasFileContent = true;
      continue;
    }
    if (key === "selfie" && isHeavyDataUrl(child)) {
      out.selfieUploaded = true;
      continue;
    }
    if (key.endsWith("FileData") && isHeavyDataUrl(child)) {
      const flagKey = key.replace(/FileData$/, "FileUploaded");
      out[flagKey] = true;
      continue;
    }
    if (isHeavyDataUrl(child)) {
      continue;
    }
    const stripped = stripValue(child);
    if (stripped !== undefined) {
      out[key] = stripped;
    }
  }

  return out;
}

/** Slim a TNA Form 01 `form` map before PUT /applicants/{id}/tna1. */
export function stripTna1FormForSync(
  form: Record<string, unknown>,
): Record<string, unknown> {
  return stripHeavyPayloads(form);
}
