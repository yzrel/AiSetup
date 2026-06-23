/**
 * Author: Yzrel Jade B. Eborde
 */

const STORAGE_KEY = "aisetup.demoMode";

let enabled = false;
let listeners: (() => void)[] = [];

function loadFromSession() {
  try {
    enabled = sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    enabled = false;
  }
}

function persist() {
  try {
    if (enabled) {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors in demo
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
  isEnabled: () => enabled,

  setEnabled: (value: boolean) => {
    const wasEnabled = enabled;
    enabled = value;
    persist();
    alertIfEnabled(wasEnabled);
    notify();
  },

  toggle: () => {
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
