/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  FINANCIAL_STATEMENT_BROCHURE_LABEL,
  financialStatementBrochureLabel,
  financialStatementUploadLabel,
  isMicroEnterprise,
} from "../../constants/financialStatementLabels";
import { buildRequirementUploadList } from "../submissionRequirements";
import type { Applicant } from "../../store/applicantStore";

describe("financial statement year labels", () => {
  it("detects micro enterprises", () => {
    expect(isMicroEnterprise("Micro")).toBe(true);
    expect(isMicroEnterprise("Small")).toBe(false);
  });

  it("uses 1-year label for micro upload copy", () => {
    expect(financialStatementUploadLabel("Micro")).toMatch(/at least 1 year/i);
    expect(financialStatementUploadLabel("Small")).toMatch(/past 3 years/i);
  });

  it("uses 1-year brochure copy for micro", () => {
    expect(financialStatementBrochureLabel("Micro")).toMatch(/one \(1\) year/i);
    expect(financialStatementBrochureLabel("Medium")).toMatch(/three \(3\) years/i);
  });

  it("buildRequirementUploadList applies micro-specific financial label", () => {
    const applicant = {
      msmeSize: "Micro",
      moduleData: {},
    } as Applicant;
    const financial = buildRequirementUploadList(applicant).find((d) => d.id === "financial");
    expect(financial?.name).toMatch(/at least 1 year/i);
  });

  it("keeps deprecated static constants as SME default", () => {
    expect(FINANCIAL_STATEMENT_BROCHURE_LABEL).toMatch(/three \(3\) years/i);
  });
});
