/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  CASE_META_KEY,
  splitModuleDataForSync,
} from "./applicantPersistence";

describe("splitModuleDataForSync", () => {
  it("puts plain module objects in modules and scalars in caseMeta", () => {
    const { modules, caseMeta } = splitModuleDataForSync({
      tinNumber: "123",
      accountStatus: "active",
      documentsSubmitted: true,
      assessments: [{ id: 1 }],
      loiDocument: { body: "hello" },
      tna1: { form: { sector: "Food" }, submitted: true },
      projectProposal: { form: {}, submitted: false },
    });

    expect(modules.loiDocument).toEqual({ body: "hello" });
    expect(modules.tna1).toEqual({ form: { sector: "Food" }, submitted: true });
    expect(modules.projectProposal).toEqual({ form: {}, submitted: false });
    expect(modules).not.toHaveProperty("tinNumber");

    expect(caseMeta).toEqual({
      tinNumber: "123",
      accountStatus: "active",
      documentsSubmitted: true,
      assessments: [{ id: 1 }],
    });
  });

  it("merges nested caseMeta into the scalar bag", () => {
    const { modules, caseMeta } = splitModuleDataForSync({
      [CASE_META_KEY]: { tinNumber: "old", flag: true },
      tinNumber: "new",
      landBank: { form: {} },
    });

    expect(modules.landBank).toEqual({ form: {} });
    expect(caseMeta).toEqual({
      tinNumber: "new",
      flag: true,
    });
  });
});
