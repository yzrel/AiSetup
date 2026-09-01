/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  isSetupPrioritySector,
  LEGACY_PRIORITY_SECTOR_ALIASES,
  normalizePrioritySector,
  PP_BUSINESS_ACTIVITY_PAIRS,
  SETUP_PRIORITY_SECTORS,
} from "../../constants/prioritySectors";

describe("priority sectors catalog", () => {
  it("lists 20 official SETUP priority sectors", () => {
    expect(SETUP_PRIORITY_SECTORS).toHaveLength(20);
  });

  it("builds Form 001 business-activity pairs as 10 rows × 2 columns", () => {
    expect(PP_BUSINESS_ACTIVITY_PAIRS).toHaveLength(10);
    const flat = PP_BUSINESS_ACTIVITY_PAIRS.flat();
    expect(flat).toHaveLength(20);
    for (const pair of PP_BUSINESS_ACTIVITY_PAIRS) {
      expect(pair).toHaveLength(2);
      expect(pair[0].trim().length).toBeGreaterThan(0);
      expect(pair[1].trim().length).toBeGreaterThan(0);
    }
    expect(PP_BUSINESS_ACTIVITY_PAIRS[9][1]).toMatch(/please specify/i);
  });

  it("accepts canonical and legacy sector labels for eligibility", () => {
    expect(isSetupPrioritySector("Food processing")).toBe(true);
    expect(isSetupPrioritySector("Food Processing")).toBe(true);
    expect(isSetupPrioritySector("Electronics and ICT Services")).toBe(true);
    expect(isSetupPrioritySector("Not a sector")).toBe(false);
  });

  it("normalizes legacy stored values to canonical labels", () => {
    expect(normalizePrioritySector("Food Processing")).toBe("Food processing");
    expect(normalizePrioritySector("Marine and Aquaculture")).toBe(
      "Fishing and aquaculture",
    );
    expect(
      normalizePrioritySector(
        "Electronics and ICT Services",
      ),
    ).toBe("Information and Communication");
  });

  it("maps every legacy alias to a canonical sector", () => {
    for (const canonical of Object.values(LEGACY_PRIORITY_SECTOR_ALIASES)) {
      expect(SETUP_PRIORITY_SECTORS).toContain(canonical);
    }
  });
});

describe("SETUP MSME assisted landing stats", () => {
  it("Micro, Small, and Medium sizes sum to the regional total", async () => {
    const { SETUP_MSME_ASSISTED_BY_SIZE, SETUP_MSME_ASSISTED_TOTAL } =
      await import("../setupBrochure");
    const sum = SETUP_MSME_ASSISTED_BY_SIZE.reduce(
      (acc, row) => acc + row.count,
      0,
    );
    expect(sum).toBe(SETUP_MSME_ASSISTED_TOTAL);
    expect(SETUP_MSME_ASSISTED_BY_SIZE.map((r) => r.label)).toEqual([
      "Micro",
      "Small",
      "Medium",
    ]);
  });
});
