/**
 * Author: Yzrel Jade B. Eborde
 */

import { api, ApiError } from "../api/client";
import type {
  ApiCreateLandBankBranchRequest,
  ApiLandBankBranch,
  ApiUpdateLandBankBranchRequest,
} from "../api/types";
import { getAuthToken } from "../api/authToken";
import { authStore } from "./authStore";

export type LandBankBranchRecord = ApiLandBankBranch;

let branches: LandBankBranchRecord[] = [];
let hydrated = false;
let hydrateInFlight: Promise<void> | null = null;
let lastError: string | null = null;
const listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

function setBranches(list: LandBankBranchRecord[]) {
  branches = list;
  hydrated = true;
  lastError = null;
  notify();
}

function setError(message: string) {
  lastError = message;
  notify();
}

export const landbankBranchStore = {
  getAll: () => branches,
  getActive: () => branches.filter((b) => b.active),
  isHydrated: () => hydrated,
  getLastError: () => lastError,

  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },

  /** Test helper — replaces in-memory list without API. */
  setBranchesForTests: (rows: LandBankBranchRecord[]) => {
    branches = rows;
    hydrated = true;
    lastError = null;
    notify();
  },

  resetForTests: () => {
    branches = [];
    hydrated = false;
    hydrateInFlight = null;
    lastError = null;
    notify();
  },

  hydrateFromBackend: async (force = false) => {
    const user = authStore.getUser();
    if (!user || !authStore.isStaff(user.role) || !getAuthToken()) {
      return;
    }
    if (hydrated && !force) return;
    if (hydrateInFlight) return hydrateInFlight;

    hydrateInFlight = (async () => {
      try {
        const list = await api.listLandBankBranches(false);
        setBranches(list);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Could not load LandBank branches from the database.";
        setError(message);
      } finally {
        hydrateInFlight = null;
      }
    })();

    return hydrateInFlight;
  },

  createBranch: async (payload: ApiCreateLandBankBranchRequest) => {
    const created = await api.createLandBankBranch(payload);
    branches = [...branches, created].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    lastError = null;
    notify();
    return created;
  },

  updateBranch: async (id: string, payload: ApiUpdateLandBankBranchRequest) => {
    const updated = await api.updateLandBankBranch(id, payload);
    branches = branches
      .map((b) => (b.id === id ? updated : b))
      .sort((a, b) => a.name.localeCompare(b.name));
    lastError = null;
    notify();
    return updated;
  },

  deactivateBranch: async (id: string) => {
    const updated = await api.deactivateLandBankBranch(id);
    branches = branches.map((b) => (b.id === id ? updated : b));
    lastError = null;
    notify();
    return updated;
  },
};
