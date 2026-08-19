/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import moduleOrder from "@shared/module-order.json";
import moduleKeys from "@shared/module-keys.json";
import region12Offices from "@shared/region12-offices.json";
import { MODULE_ORDER } from "../../store/applicantStore";
import {
  DOST_REGION_12_CONTACTS,
  REGION_12_PROVINCE_TO_OFFICE,
} from "../../constants/setupBrochure";
import { resolveOfficeIdForProvince } from "../provincialOffice";

describe("shared domain contracts", () => {
  it("FE MODULE_ORDER matches shared/module-order.json", () => {
    expect(MODULE_ORDER).toEqual(moduleOrder);
    expect(MODULE_ORDER[0]).toBe("prescreening");
    expect(MODULE_ORDER[MODULE_ORDER.length - 1]).toBe("completed");
  });

  it("shared module-keys lists include approvalLetter and objectModuleKeys", () => {
    expect(moduleKeys.publishGatedKeys).toContain("approvalLetter");
    expect(moduleKeys.staffOwnedModuleKeys).toContain("signedMoa");
    expect(moduleKeys.staffOwnedModuleKeys).toContain("landBank");
    expect(moduleKeys.staffOnlyPatchKeys).toContain("approvalLetter");
    expect(moduleKeys.staffOnlyPatchKeys).toContain("landBank");
    expect(moduleKeys.objectModuleKeys).toContain("projectProposal");
    expect(moduleKeys.objectModuleKeys).toContain("tna2Document");
    expect(moduleKeys.objectModuleKeys).toContain("procurement");
    expect(moduleKeys.objectModuleKeys).toContain("refund");
    expect(moduleKeys.objectModuleKeys).toContain("financialProjection");
  });

  it("FE office contacts match shared/region12-offices.json", () => {
    expect(DOST_REGION_12_CONTACTS.map((c) => c.id)).toEqual(
      region12Offices.contacts.map((c) => c.id),
    );
    expect(REGION_12_PROVINCE_TO_OFFICE).toEqual(region12Offices.provinceToOffice);
    expect(resolveOfficeIdForProvince("South Cotabato")).toBe("south-cotabato");
    expect(resolveOfficeIdForProvince("General Santos City")).toBe(
      "gensan-sarangani",
    );
  });
});
