/**
 * Author: Yzrel Jade B. Eborde
 *
 * SETUP Form 002 official compliance mapping (Word Annex A-2 — 14 rows).
 */

import { describe, expect, it } from "vitest";
import {
  RTEC_COMPLIANCE_COLUMNS,
  RTEC_OFFICIAL_COMPLIANCE_IDS,
  RTEC_OFFICIAL_COMPLIANCE_ITEMS,
  toOfficialComplianceItems,
} from "../../constants/rtecReportLayout";
import { RTEC_COMPLIANCE_ITEMS } from "../rtecReport";

describe("Form 002 official compliance (Word Annex A-2)", () => {
  it("has exactly 14 official rows and no portal-only extras", () => {
    expect(RTEC_OFFICIAL_COMPLIANCE_ITEMS).toHaveLength(14);
    expect(RTEC_OFFICIAL_COMPLIANCE_IDS).toEqual([
      "loi",
      "tna1",
      "tna2",
      "form001",
      "permits",
      "financial",
      "projected",
      "official-receipt",
      "registration",
      "articles",
      "affidavit",
      "resolution",
      "quotations",
      "drawings",
    ]);
    expect(RTEC_OFFICIAL_COMPLIANCE_IDS).not.toContain("ecc");
    expect(RTEC_OFFICIAL_COMPLIANCE_IDS).not.toContain("fda-certificate");
    expect(RTEC_OFFICIAL_COMPLIANCE_IDS).not.toContain(
      "supplier-unavailability-affidavit",
    );
  });

  it("keeps portal editor list longer with extras", () => {
    expect(RTEC_COMPLIANCE_ITEMS.length).toBeGreaterThan(14);
    const portalIds = RTEC_COMPLIANCE_ITEMS.map((i) => i.id);
    expect(portalIds).toContain("ecc");
    expect(portalIds).toContain("fda-certificate");
    expect(portalIds).toContain("supplier-unavailability-affidavit");
  });

  it("print columns are Requirements | Complied | Not Complied (no N/A)", () => {
    expect([...RTEC_COMPLIANCE_COLUMNS]).toEqual([
      "Requirements",
      "Complied",
      "Not Complied",
    ]);
  });

  it("maps editor statuses onto Word labels and drops extras", () => {
    const mapped = toOfficialComplianceItems([
      { id: "loi", status: "complied" },
      { id: "articles", status: "na" },
      { id: "drawings", status: "not_complied" },
      { id: "ecc", status: "complied" },
      {
        id: "fda-certificate",
        status: "na",
      },
    ]);

    expect(mapped).toHaveLength(14);
    expect(mapped.map((r) => r.id)).toEqual([...RTEC_OFFICIAL_COMPLIANCE_IDS]);
    expect(mapped.find((r) => r.id === "loi")?.status).toBe("complied");
    expect(mapped.find((r) => r.id === "articles")?.status).toBe("na");
    expect(mapped.find((r) => r.id === "drawings")?.status).toBe("not_complied");
    expect(mapped.find((r) => r.id === "drawings")?.label).toBe(
      "Complete technical design/drawing of all equipment to be purchased/fabricated",
    );
    expect(mapped.some((r) => r.id === "ecc")).toBe(false);
  });
});
