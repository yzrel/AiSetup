/**
 * Author: Yzrel Jade B. Eborde
 *
 * Resolve preview/download URLs for module uploads after dataUrl is stripped on sync.
 * Prefer in-session dataUrl; otherwise fetch bytes via fileId from the durable file store.
 */

import { useEffect, useState } from "react";
import { api } from "../api/client";

export type StoredFileRef = {
  dataUrl?: string;
  fileId?: string;
};

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
  if (!applicantId || !file.fileId) return undefined;
  const { blob } = await api.downloadApplicantFile(applicantId, file.fileId);
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
      if (item.dataUrl || !applicantId || !item.fileId) return item;
      try {
        const { blob } = await api.downloadApplicantFile(applicantId, item.fileId);
        const url = URL.createObjectURL(blob);
        blobUrls.push(url);
        return { ...item, dataUrl: url };
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

    if (!applicantId || !fileId) {
      setSrc(undefined);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    void api
      .downloadApplicantFile(applicantId, fileId)
      .then(({ blob }) => {
        if (cancelled) return;
        createdBlobUrl = URL.createObjectURL(blob);
        setSrc(createdBlobUrl);
        setLoading(false);
        // #region agent log
        fetch("http://127.0.0.1:7919/ingest/215832d4-6965-4326-be26-4bf61789267b", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "a4e6b2",
          },
          body: JSON.stringify({
            sessionId: "a4e6b2",
            runId: "post-fix",
            hypothesisId: "H-B",
            location: "storedFilePreview.ts:useStoredFileSrc",
            message: "resolved preview from fileId",
            data: {
              applicantId,
              fileId,
              blobSize: blob.size,
              blobType: blob.type,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      })
      .catch(() => {
        if (cancelled) return;
        setSrc(undefined);
        setLoading(false);
        setError(true);
        // #region agent log
        fetch("http://127.0.0.1:7919/ingest/215832d4-6965-4326-be26-4bf61789267b", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "a4e6b2",
          },
          body: JSON.stringify({
            sessionId: "a4e6b2",
            runId: "post-fix",
            hypothesisId: "H-C",
            location: "storedFilePreview.ts:useStoredFileSrc",
            message: "fileId download failed",
            data: { applicantId, fileId },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      });

    return () => {
      cancelled = true;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [applicantId, dataUrl, fileId]);

  return { src, loading, error };
}
