/**
 * Author: Yzrel Jade B. Eborde
 *
 * Shared applicantStore subscription hooks — replaces the copy-pasted
 * subscribe blocks that individual module screens used to declare.
 */

import { useEffect, useRef, useState } from "react";
import { applicantStore, type Applicant } from "../store/applicantStore";

/** Re-render the component whenever the applicant store changes. */
export function useApplicantStoreVersion(): number {
  const [version, bump] = useState(0);
  useEffect(() => applicantStore.subscribe(() => bump((n) => n + 1)), []);
  return version;
}

/**
 * Invoke `onChange` with the fresh applicant record whenever the store
 * updates. The latest callback is always used, so callers don't need to
 * memoize it.
 */
export function useApplicantSubscription(
  applicantId: string | undefined,
  onChange: (applicant: Applicant) => void,
): void {
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    if (!applicantId) return;
    return applicantStore.subscribe(() => {
      const updated = applicantStore.getById(applicantId);
      if (updated) handlerRef.current(updated);
    });
  }, [applicantId]);
}
