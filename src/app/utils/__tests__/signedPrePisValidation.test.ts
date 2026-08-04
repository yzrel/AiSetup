/**
 * Author: Yzrel Jade B. Eborde
 */

import { afterEach, describe, expect, it } from "vitest";
import { demoModeStore } from "../../store/demoModeStore";
import { validateSignedPrePisUpload } from "../projectInformationSheet";

describe("validateSignedPrePisUpload demo behavior", () => {
  afterEach(() => {
    demoModeStore.setEnabled(false);
  });

  it("returns blocking errors when demo is off", () => {
    demoModeStore.setEnabled(false);
    const result = validateSignedPrePisUpload("", "", "2026-01-01");
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("clears errors but keeps date mismatch warnings in demo", () => {
    demoModeStore.setEnabled(true);
    const result = validateSignedPrePisUpload("2026-02-01", "pre.pdf", "2026-01-01");
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((w) => /differs from MOA/i.test(w))).toBe(true);
  });
});
