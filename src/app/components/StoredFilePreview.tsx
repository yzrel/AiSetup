/**
 * Author: Yzrel Jade B. Eborde
 */

import { useStoredFileSrc, type StoredFileRef } from "../utils/storedFilePreview";

type StoredFileImageProps = {
  applicantId?: string;
  file: StoredFileRef | null | undefined;
  alt: string;
  className?: string;
  /** Shown while downloading from the file store. */
  loadingClassName?: string;
};

/** Image preview that falls back to downloading via fileId after logout/reload. */
export function StoredFileImage({
  applicantId,
  file,
  alt,
  className,
  loadingClassName = "text-xs text-gray-400 py-6",
}: StoredFileImageProps) {
  const { src, loading, error } = useStoredFileSrc(applicantId, file);

  if (loading) {
    return <p className={loadingClassName}>Loading preview…</p>;
  }
  if (!src) {
    if (error) {
      return <p className={loadingClassName}>Preview unavailable</p>;
    }
    return null;
  }
  return <img src={src} alt={alt} className={className} />;
}
