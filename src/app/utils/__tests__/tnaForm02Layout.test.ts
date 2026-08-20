/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  TNA_FORM_02_FOOTER_PREFIX,
  TNA_FORM_02_FONT_BODY,
  TNA_FORM_02_FONT_SIZE_BODY_PT,
  TNA_FORM_02_FONT_SIZE_TITLE_PT,
  TNA_FORM_02_PAGE_MARGIN_MM,
  TNA_FORM_02_SCOPE_HEADING,
  TNA_FORM_02_TITLE,
  countTapScopedScopeItems,
  tnaForm02Footer,
} from "../../constants/tnaForm02Layout";

describe("TNA Form 02 Annex 1-2 layout constants", () => {
  it("uses the Word pack title and footer", () => {
    expect(TNA_FORM_02_TITLE).toBe(
      "DOST TNA FORM 02 - Technology Needs Assessment Report",
    );
    expect(TNA_FORM_02_FOOTER_PREFIX).toContain("Annex 1-2");
    expect(TNA_FORM_02_FOOTER_PREFIX).toContain("Revision 3.0");
    expect(tnaForm02Footer(1, 2)).toBe(
      `${TNA_FORM_02_FOOTER_PREFIX} Page 1 of 2`,
    );
  });

  it("matches Word pgMar margins and scope heading", () => {
    expect(TNA_FORM_02_PAGE_MARGIN_MM).toEqual({
      top: 24.0,
      right: 10.6,
      bottom: 19.1,
      left: 20.1,
    });
    expect(TNA_FORM_02_SCOPE_HEADING).toBe("SCOPE OF ASSESSMENT*");
  });

  it("uses Times New Roman body typography from the Word pack", () => {
    expect(TNA_FORM_02_FONT_BODY).toContain("Times New Roman");
    expect(TNA_FORM_02_FONT_SIZE_BODY_PT).toBe(12);
    expect(TNA_FORM_02_FONT_SIZE_TITLE_PT).toBe(14);
  });

  it("marks TAP-scoped scope items with leading asterisk in Word", () => {
    expect(countTapScopedScopeItems()).toBe(12);
  });
});
