/**
 * Author: Yzrel Jade B. Eborde
 *
 * Debounced callback for mid-form auto-persist (text fields ~400ms).
 */

import { useEffect, useMemo, useRef } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs = 400,
): T {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useMemo(() => {
    const debounced = ((...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    }) as T;
    return debounced;
  }, [delayMs]);
}
