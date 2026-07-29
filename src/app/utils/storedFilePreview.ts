/**
 * Author: Yzrel Jade B. Eborde
 *
 * Resolve preview/download URLs for module uploads after dataUrl is stripped on sync.
 * Prefer in-session dataUrl; otherwise fetch bytes via fileId from the durable file store.
 * When fileId is missing (legacy TNA fields), match by moduleKey + original fileName.
 */

import { useEffect, useState } from "react";
import { api } from "../api/client";

export type StoredFileRef = {
  dataUrl?: string;
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  /** Backend moduleKey used when uploading (e.g. tna1-plantLayout). */
  moduleKey?: string;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

export function isImageFile(
  mimeType?: string | null,
  fileName?: string | null,
  dataUrl?: string | null,
): boolean {
  if (mimeType?.startsWith("image/")) return true;
  if (dataUrl?.startsWith("data:image/")) return true;
  return IMAGE_EXT.test(fileName ?? "");
}

export function isPdfFile(
  mimeType?: string | null,
  fileName?: string | null,
  dataUrl?: string | null,
): boolean {
  if (mimeType?.includes("pdf")) return true;
  if (dataUrl?.startsWith("data:application/pdf")) return true;
  return (fileName ?? "").toLowerCase().endsWith(".pdf");
}

type ListedFile = {
  id: string;
  moduleKey?: string;
  originalFilename?: string;
  contentType?: string;
};

const listCache = new Map<string, Promise<ListedFile[]>>();

function listApplicantFilesCached(applicantId: string): Promise<ListedFile[]> {
  const existing = listCache.get(applicantId);
  if (existing) return existing;
  const pending = api
    .listApplicantFiles(applicantId)
    .then((rows) =>
      rows.map((r) => ({
        id: r.id,
        moduleKey: r.moduleKey,
        originalFilename: r.originalFilename,
        contentType: r.contentType,
      })),
    )
    .catch(() => {
      listCache.delete(applicantId);
      return [] as ListedFile[];
    });
  listCache.set(applicantId, pending);
  return pending;
}

/** Drop cached file lists after a new upload so previews can rediscover fileIds. */
export function invalidateApplicantFileListCache(applicantId?: string): void {
  if (!applicantId) {
    listCache.clear();
    return;
  }
  listCache.delete(applicantId);
}

function moduleKeyMatches(stored: string | undefined, wanted: string | undefined): boolean {
  if (!wanted) return true;
  if (!stored) return false;
  // Backend sometimes stores comma-joined keys from merge paths.
  return stored.split(",").map((s) => s.trim()).includes(wanted);
}

async function resolveFileIdFromListing(
  applicantId: string,
  file: StoredFileRef,
): Promise<string | undefined> {
  if (!file.fileName && !file.moduleKey) return undefined;
  const rows = await listApplicantFilesCached(applicantId);
  const byNameAndModule = rows.find(
    (r) =>
      moduleKeyMatches(r.moduleKey, file.moduleKey) &&
      r.originalFilename === file.fileName,
  );
  if (byNameAndModule) return byNameAndModule.id;

  if (file.fileName) {
    const byName = rows.find((r) => r.originalFilename === file.fileName);
    if (byName) return byName.id;
  }

  if (file.moduleKey) {
    const byModule = rows.find((r) => moduleKeyMatches(r.moduleKey, file.moduleKey));
    if (byModule) return byModule.id;
  }
  return undefined;
}

/**
 * Resolve a usable object/data URL for preview. Caller must revoke blob: URLs when done
 * if they manage the lifecycle themselves; the React hook handles revoke automatically.
 */
export async function resolveStoredFileSrc(
  applicantId: string | undefined,
  file: StoredFileRef | null | undefined,
): Promise<string | undefined> {
  if (!file) return undefined;
  if (file.dataUrl) return file.dataUrl;
  if (!applicantId) return undefined;

  let fileId = file.fileId;
  if (!fileId) {
    fileId = await resolveFileIdFromListing(applicantId, file);
  }
  if (!fileId) return undefined;

  const { blob } = await api.downloadApplicantFile(applicantId, fileId);
  return URL.createObjectURL(blob);
}

/** Copy items, filling missing dataUrl from the file store (for print / one-shot render). */
export async function hydrateStoredFileDataUrls<T extends StoredFileRef>(
  applicantId: string | undefined,
  items: T[],
): Promise<{ items: T[]; revoke: () => void }> {
  const blobUrls: string[] = [];
  const next = await Promise.all(
    items.map(async (item) => {
      if (item.dataUrl || !applicantId) return item;
      try {
        const src = await resolveStoredFileSrc(applicantId, item);
        if (!src || src === item.dataUrl) return item;
        if (src.startsWith("blob:")) blobUrls.push(src);
        return { ...item, dataUrl: src };
      } catch {
        return item;
      }
    }),
  );
  return {
    items: next,
    revoke: () => {
      for (const url of blobUrls) URL.revokeObjectURL(url);
    },
  };
}

export function useStoredFileSrc(
  applicantId: string | undefined,
  file: StoredFileRef | null | undefined,
): { src: string | undefined; loading: boolean; error: boolean } {
  const dataUrl = file?.dataUrl;
  const fileId = file?.fileId;
  const fileName = file?.fileName;
  const moduleKey = file?.moduleKey;
  const [src, setSrc] = useState<string | undefined>(dataUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let createdBlobUrl: string | undefined;

    if (dataUrl) {
      setSrc(dataUrl);
      setLoading(false);
      setError(false);
      return;
    }

    if (!applicantId || (!fileId && !fileName && !moduleKey)) {
      setSrc(undefined);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    void resolveStoredFileSrc(applicantId, {
      fileId,
      fileName,
      moduleKey,
    })
      .then((resolved) => {
        if (cancelled) {
          if (resolved?.startsWith("blob:")) URL.revokeObjectURL(resolved);
          return;
        }
        if (!resolved) {
          setSrc(undefined);
          setLoading(false);
          setError(true);
          return;
        }
        if (resolved.startsWith("blob:")) createdBlobUrl = resolved;
        setSrc(resolved);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSrc(undefined);
        setLoading(false);
        setError(true);
      });

    return () => {
      cancelled = true;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [applicantId, dataUrl, fileId, fileName, moduleKey]);

  return { src, loading, error };
}
