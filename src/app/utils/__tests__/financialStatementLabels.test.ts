/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  FINANCIAL_STATEMENT_BROCHURE_LABEL,
  FINANCIAL_STATEMENT_UPLOAD_LABEL,
} from "../../constants/financialStatementLabels";
import { SUBMISSION_REQUIREMENT_DOCS } from "../submissionRequirements";
import { RTEC_COMPLIANCE_ITEMS } from "../rtecReport";

describe("financial statement year labels", () => {
  it("uses a generic 3-year upload label without Micro exception", () => {
    const financial = SUBMISSION_REQUIREMENT_DOCS.find((d) => d.id === "financial");
    expect(financial?.name).toBe(FINANCIAL_STATEMENT_UPLOAD_LABEL);
    expect(financial?.name).toMatch(/past 3 years/i);
    expect(financial?.name).not.toMatch(/micro/i);
  });

  it("uses generic 3-year brochure copy without Micro exception", () => {
    expect(FINANCIAL_STATEMENT_BROCHURE_LABEL).toMatch(/three \(3\) years/i);
    expect(FINANCIAL_STATEMENT_BROCHURE_LABEL).not.toMatch(/micro/i);
  });

  it("keeps Micro vs SME distinction only on RTEC financial compliance row", () => {
    const financial = RTEC_COMPLIANCE_ITEMS.find((i) => i.id === "financial");
    expect(financial?.label).toMatch(/three \(3\) years/i);
    expect(financial?.label).toMatch(/one \(1\) year/i);
    expect(financial?.label).toMatch(/micro enterprises/i);
    expect(financial?.label).toMatch(/small and medium enterprises/i);
  });
});
