/**
 * Persists the active admin-shell view across page refresh (same tab).
 */

import type { AdminView } from "./authStore";

const VIEW_STORAGE_KEY = "aisetup.app.currentView";

export function loadCurrentView(): AdminView | null {
  try {
    const raw = sessionStorage.getItem(VIEW_STORAGE_KEY);
    return raw ? (raw as AdminView) : null;
  } catch {
    return null;
  }
}

export function saveCurrentView(view: AdminView): void {
  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    /* storage unavailable */
  }
}

export function clearCurrentView(): void {
  try {
    sessionStorage.removeItem(VIEW_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
