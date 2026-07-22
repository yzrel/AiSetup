/**
 * Author: Yzrel Jade B. Eborde
 */

const STORAGE_KEY = "aisetup.demoMode";

/** Production builds never allow demo unlock (VITE_APP_ENV=production). */
export function isDemoModeAllowedByBuild(): boolean {
  return import.meta.env.VITE_APP_ENV !== "production";
}

let enabled = false;
let listeners: (() => void)[] = [];

function loadFromSession() {
  try {
    if (!isDemoModeAllowedByBuild()) {
      enabled = false;
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    enabled = sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    enabled = false;
  }
}

function persist() {
  try {
    if (enabled && isDemoModeAllowedByBuild()) {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function notify() {
  listeners.forEach((l) => l());
}

function alertIfEnabled(wasEnabled: boolean) {
  if (enabled && !wasEnabled) {
    window.alert(
      "Demo mode enabled. Workflow restrictions are bypassed for this session.",
    );
  }
}

loadFromSession();

export const demoModeStore = {
  isEnabled: () => enabled && isDemoModeAllowedByBuild(),

  setEnabled: (value: boolean) => {
    if (!isDemoModeAllowedByBuild()) {
      enabled = false;
      persist();
      notify();
      return;
    }
    const wasEnabled = enabled;
    enabled = value;
    persist();
    alertIfEnabled(wasEnabled);
    notify();
  },

  toggle: () => {
    if (!isDemoModeAllowedByBuild()) {
      window.alert("Demo mode is disabled in production builds.");
      return;
    }
    const wasEnabled = enabled;
    enabled = !enabled;
    persist();
    alertIfEnabled(wasEnabled);
    notify();
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
};
