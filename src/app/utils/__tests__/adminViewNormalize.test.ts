/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import { isAdminView, normalizeAdminView } from "../../store/authStore";

describe("admin view normalization", () => {
  it("accepts known views", () => {
    expect(isAdminView("dashboard")).toBe(true);
    expect(isAdminView("tna2")).toBe(true);
    expect(isAdminView("landbank-branches")).toBe(true);
    expect(normalizeAdminView("requirements")).toBe("requirements");
  });

  it("rejects unknown / corrupt view keys", () => {
    expect(isAdminView("not-a-view")).toBe(false);
    expect(isAdminView("")).toBe(false);
    expect(isAdminView(null)).toBe(false);
    expect(normalizeAdminView("garbage")).toBeNull();
  });

  it("aliases legacy PIS view to landbank-withdrawal", () => {
    expect(normalizeAdminView("project-information-sheet")).toBe(
      "landbank-withdrawal",
    );
  });
});
