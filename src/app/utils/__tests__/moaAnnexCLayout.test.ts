/**
 * Author: Yzrel Jade B. Eborde
 *
 * Annex C layout constants smoke checks.
 */

import { describe, expect, it } from "vitest";
import {
  MOA_ANNEX_LABELS,
  MOA_FIRST_PARTY_OBLIGATIONS,
  MOA_FOOTER_PREFIX,
  MOA_PAGE_MARGIN_MM,
  MOA_PAGE_PADDING,
  MOA_REFUND_TITLE,
  MOA_SECOND_PARTY_OBLIGATIONS,
  MOA_TITLE,
  moaSectionLabel,
  moaSubLabel,
  moaSubSubLabel,
} from "../../constants/moaAnnexCLayout";

describe("Annex C layout constants", () => {
  it("uses Annex C footer and MOA title", () => {
    expect(MOA_TITLE).toBe("MEMORANDUM OF AGREEMENT");
    expect(MOA_FOOTER_PREFIX).toContain("Annex C");
    expect(MOA_FOOTER_PREFIX).toContain("Proforma MOA");
  });

  it("keeps Word multilevel FIRST/SECOND PARTY obligation labels", () => {
    expect(MOA_FIRST_PARTY_OBLIGATIONS.length).toBe(9);
    expect(MOA_SECOND_PARTY_OBLIGATIONS.length).toBe(25);
    expect(moaSectionLabel(3)).toBe("3.");
    expect(moaSubLabel(1, 0)).toBe("1.1");
    expect(moaSubLabel(2, 24)).toBe("2.25");
    expect(moaSubSubLabel(2, 17, 0)).toBe("2.18.1");
    expect(MOA_REFUND_TITLE).toBe("REFUND");
  });

  it("references Annexes A–E", () => {
    expect(MOA_ANNEX_LABELS.A).toContain("ANNEX A");
    expect(MOA_ANNEX_LABELS.E).toContain("ANNEX E");
  });

  it("uses 1 in page inset on all sides (no stacked Word paragraph indent)", () => {
    expect(MOA_PAGE_MARGIN_MM).toBe(25.4);
    expect(MOA_PAGE_PADDING.left).toBe(25.4);
    expect(MOA_PAGE_PADDING.right).toBe(25.4);
    expect(MOA_PAGE_PADDING.top).toBe(25.4);
    expect(MOA_PAGE_PADDING.bottom).toBe(25.4);
  });
});
