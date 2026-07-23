/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ModuleDocument } from "../api/types";
import { uploadFileToBackend } from "./applicantPersistence";

/**
 * Align with backend FileUploadService (15 MB) and Spring multipart max-file-size.
 * Session dataUrl previews still use this cap so memory stays bounded.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function readFileAsModuleDocument(
  file: File,
  uploadedBy: string,
): Promise<ModuleDocument> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(new Error("File must be under 15 MB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => {
      resolve({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: String(reader.result ?? ""),
        uploadedAt: new Date().toISOString(),
        uploadedBy,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Read a file for in-session preview and mirror bytes into the durable file store.
 * Returns a ModuleDocument with `fileId` when the upload succeeds.
 */
export async function readAndUploadModuleDocument(
  file: File,
  uploadedBy: string,
  opts?: { applicantId?: string; moduleKey?: string },
): Promise<ModuleDocument> {
  const doc = await readFileAsModuleDocument(file, uploadedBy);
  if (!opts?.applicantId) return doc;
  const uploaded = await uploadFileToBackend(
    opts.applicantId,
    opts.moduleKey ?? "general",
    file,
  );
  if (typeof uploaded?.id === "string") {
    return { ...doc, fileId: uploaded.id };
  }
  return doc;
}

/** Convert a data-URL (e.g. registration selfie) into a File for the upload API. */
export function dataUrlToFile(
  dataUrl: string,
  fileName: string,
): File | null {
  if (!dataUrl.startsWith("data:")) return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const header = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  const mimeMatch = /^data:([^;]+)/.exec(header);
  const mimeType = mimeMatch?.[1] || "application/octet-stream";
  try {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (bytes.byteLength > MAX_UPLOAD_BYTES) return null;
    return new File([bytes], fileName, { type: mimeType });
  } catch {
    return null;
  }
}
