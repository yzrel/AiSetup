/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Applicant } from "../store/applicantStore";

/** Local state that resets when staff switches the active client. */
export function useApplicantSyncedState<T>(
  applicant: Applicant | null,
  derive: (app: Applicant | null) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const deriveRef = useRef(derive);
  deriveRef.current = derive;

  const [state, setState] = useState<T>(() => deriveRef.current(applicant));

  useEffect(() => {
    setState(deriveRef.current(applicant));
  }, [applicant?.id, applicant?.lastUpdated]);

  return [state, setState];
}

/** Side effects when the active client changes (reset flags, step index, etc.). */
export function useApplicantChangeEffect(
  applicant: Applicant | null,
  effect: (app: Applicant | null) => void,
): void {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    effectRef.current(applicant);
  }, [applicant?.id, applicant?.lastUpdated]);
}
