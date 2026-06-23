/**
 * Author: Yzrel Jade B. Eborde
 */

import { demoModeStore } from "../store/demoModeStore";

export function isDemoModeActive(): boolean {
  return demoModeStore.isEnabled();
}

export function allowWhenDemo(required: boolean): boolean {
  return isDemoModeActive() || required;
}

/** Opens gated module content when the real condition passes or demo mode is active. */
export function gateOpen(required: boolean): boolean {
  return allowWhenDemo(required);
}

/** Unlocks workflow step navigation while preserving real maxReached for locked styling. */
export function demoWorkflowMaxReached(
  maxReached: number,
  lastIndex: number,
): number {
  return isDemoModeActive() ? lastIndex : maxReached;
}
