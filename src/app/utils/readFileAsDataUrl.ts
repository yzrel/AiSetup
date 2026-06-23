/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ModuleDocument } from "../api/types";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function readFileAsModuleDocument(
  file: File,
  uploadedBy: string,
): Promise<ModuleDocument> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(new Error("File must be under 8 MB."));
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
