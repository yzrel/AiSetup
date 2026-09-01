/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { landbankBranchStore } from "../../store/landbankBranchStore";

beforeEach(() => {
  landbankBranchStore.resetForTests();
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "api-1",
            name: "API Branch",
            address: "Addr",
            cityProvince: "City",
            managerName: "Mgr",
            managerTitle: "Branch Manager",
            active: true,
          },
        ],
      }),
    ),
  );
});

describe("landbankBranchStore", () => {
  it("starts empty until hydrated", () => {
    expect(landbankBranchStore.getAll()).toEqual([]);
    expect(landbankBranchStore.isHydrated()).toBe(false);
  });

  it("hydrates from API when staff session is active", async () => {
    const { authStore } = await import("../../store/authStore");
    const { setAuthToken } = await import("../../api/authToken");
    setAuthToken("test-token");
    authStore.login({
      id: "staff-1",
      email: "agent@dost.gov.ph",
      firstName: "Agent",
      middleName: "",
      lastName: "User",
      role: "agent",
      enterpriseName: "DOST",
      verified: true,
      portal: "admin",
    });

    await landbankBranchStore.hydrateFromBackend(true);
    expect(landbankBranchStore.isHydrated()).toBe(true);
    expect(landbankBranchStore.getActive()[0]?.name).toBe("API Branch");
  });
});
