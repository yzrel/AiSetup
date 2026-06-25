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

/** User-facing notice after AI Assist fills a field from template instead of live AI. */
export function aiAssistNotice(aiGenerated: boolean): string {
  if (aiGenerated) {
    return "AI suggestion applied. Review and edit before saving.";
  }
  if (isDemoModeActive()) {
    return "Template suggestion applied for demo. Review and edit before saving.";
  }
  return "Suggestion filled from template. Set ANTHROPIC_API_KEY in backend/.env and restart the backend for live AI output.";
}

/** User-facing notice after bulk document generation falls back to templates. */
export function aiGenerateNotice(aiGenerated: boolean, templateLabel: string): string | null {
  if (aiGenerated) return null;
  if (isDemoModeActive()) {
    return `${templateLabel} filled from the standard template for demo.`;
  }
  return `${templateLabel} generated using the standard template. Set ANTHROPIC_API_KEY in backend/.env and restart the backend for AI-drafted content.`;
}

/** Unlocks workflow step navigation while preserving real maxReached for locked styling. */
export function demoWorkflowMaxReached(
  maxReached: number,
  lastIndex: number,
): number {
  return isDemoModeActive() ? lastIndex : maxReached;
}
