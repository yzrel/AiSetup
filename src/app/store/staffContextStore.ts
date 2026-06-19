/**
 * Author: Yzrel Jade B. Eborde
 */

const STORAGE_KEY = "aisetup.staff.selectedApplicantId";

let selectedApplicantId: string | null = null;
let listeners: (() => void)[] = [];

function loadFromSession() {
  try {
    selectedApplicantId = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    selectedApplicantId = null;
  }
}

function persist() {
  try {
    if (selectedApplicantId) {
      sessionStorage.setItem(STORAGE_KEY, selectedApplicantId);
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

loadFromSession();

export const staffContextStore = {
  getSelectedApplicantId: () => selectedApplicantId,

  setSelectedApplicant: (id: string | null) => {
    selectedApplicantId = id;
    persist();
    notify();
  },

  clearSelection: () => {
    selectedApplicantId = null;
    persist();
    notify();
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
};
