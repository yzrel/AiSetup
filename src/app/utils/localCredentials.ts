/**
 * Author: Yzrel Jade B. Eborde
 */

// Demo auth is client-side only. Passwords are kept out of the backend sync
// payload and mirrored here so applicants can still log in after a reload.

const STORAGE_KEY = "aisetup.auth.credentials";

function load(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveLocalPassword(applicantId: string, password: string): void {
  try {
    const all = load();
    all[applicantId] = password;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}

export function getLocalPassword(applicantId: string): string | undefined {
  return load()[applicantId];
}
