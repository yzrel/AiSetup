/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  TNA_FORM_01_CAPITAL_CLASSES,
  TNA_FORM_01_FOOTER_PREFIX,
  TNA_FORM_01_ORGANIZATION_TYPES,
  TNA_FORM_01_TITLE,
  TNA_FORM_01_VALIDATED_BY_LABEL,
  mapOrganizationType,
  sumHeadcount,
  tnaForm01Footer,
} from "../../constants/tnaForm01Layout";

describe("TNA Form 01 Annex 1-1 layout constants", () => {
  it("uses the Word pack title and footer", () => {
    expect(TNA_FORM_01_TITLE).toBe(
      "DOST TNA FORM 01 - Application for Technology Needs Assessment",
    );
    expect(TNA_FORM_01_FOOTER_PREFIX).toContain("Annex 1-1");
    expect(TNA_FORM_01_FOOTER_PREFIX).toContain("Revision 3.0");
    expect(tnaForm01Footer(2, 12)).toBe(
      `${TNA_FORM_01_FOOTER_PREFIX} Page 2 of 12`,
    );
  });

  it("matches Word capital-class and organization checkboxes", () => {
    expect(TNA_FORM_01_CAPITAL_CLASSES.map((c) => c.label)).toEqual([
      "Micro (not less than P3M)",
      "Small (more than P3M – P15M)",
      "Medium (more than P15M – P100 M)",
    ]);
    expect(TNA_FORM_01_ORGANIZATION_TYPES).toContain("LGU");
    expect(mapOrganizationType("LGU").org).toBe("LGU");
    expect(mapOrganizationType("LGU").profit).toBeNull();
    expect(mapOrganizationType("Sole Proprietorship (DTI)").org).toBe(
      "Single proprietorship",
    );
    expect(TNA_FORM_01_VALIDATED_BY_LABEL).toContain("PSTD/CASTD/CSTD");
  });

  it("sums employee headcount only from filled cells", () => {
    expect(sumHeadcount("", "")).toBe("");
    expect(sumHeadcount("2", "3", "")).toBe("5");
  });
});
