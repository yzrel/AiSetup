/**
 * Persists shell navigation across page refresh.
 */

import type { AdminView } from "./authStore";

const VIEW_STORAGE_KEY = "aisetup.app.currentView";
const AUTH_PAGE_KEY = "aisetup.auth.page";
const LOGIN_PORTAL_KEY = "aisetup.auth.loginPortal";

export type AuthPage = "landing" | "login" | "register";
export type LoginPortal = "applicant" | "staff";

export function loadCurrentView(): AdminView | null {
  try {
    const raw =
      sessionStorage.getItem(VIEW_STORAGE_KEY) ??
      localStorage.getItem(VIEW_STORAGE_KEY);
    return raw ? (raw as AdminView) : null;
  } catch {
    return null;
  }
}

export function saveCurrentView(view: AdminView): void {
  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, view);
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    /* storage unavailable */
  }
}

export function clearCurrentView(): void {
  try {
    sessionStorage.removeItem(VIEW_STORAGE_KEY);
    localStorage.removeItem(VIEW_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function loadAuthPage(): AuthPage {
  try {
    const raw =
      sessionStorage.getItem(AUTH_PAGE_KEY) ??
      localStorage.getItem(AUTH_PAGE_KEY);
    if (raw === "login" || raw === "register" || raw === "landing") {
      return raw;
    }
  } catch {
    /* storage unavailable */
  }
  return "landing";
}

export function saveAuthPage(page: AuthPage): void {
  try {
    sessionStorage.setItem(AUTH_PAGE_KEY, page);
    localStorage.setItem(AUTH_PAGE_KEY, page);
  } catch {
    /* storage unavailable */
  }
}

export function loadLoginPortal(): LoginPortal | null {
  try {
    const raw =
      sessionStorage.getItem(LOGIN_PORTAL_KEY) ??
      localStorage.getItem(LOGIN_PORTAL_KEY);
    if (raw === "applicant" || raw === "staff") return raw;
  } catch {
    /* storage unavailable */
  }
  return null;
}

export function saveLoginPortal(portal: LoginPortal | null): void {
  try {
    if (portal) {
      sessionStorage.setItem(LOGIN_PORTAL_KEY, portal);
      localStorage.setItem(LOGIN_PORTAL_KEY, portal);
    } else {
      sessionStorage.removeItem(LOGIN_PORTAL_KEY);
      localStorage.removeItem(LOGIN_PORTAL_KEY);
    }
  } catch {
    /* storage unavailable */
  }
}

export function clearAuthUiState(): void {
  saveAuthPage("landing");
  saveLoginPortal(null);
}
