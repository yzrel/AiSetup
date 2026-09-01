/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import {
  projectedFinancialStatementLabel,
  resolveProjectedFsYears,
} from "../projectedFsDuration";
import { buildRequirementUploadList } from "../submissionRequirements";

describe("projectedFsDuration", () => {
  it("derives years from LOI timeline months", () => {
    const applicant = {
      moduleData: { timeline: "18 months" },
    } as Applicant;
    expect(resolveProjectedFsYears(applicant)).toBe(2);
    expect(projectedFinancialStatementLabel(applicant)).toMatch(/next 2 years/i);
  });

  it("defaults to 5 years when duration unknown", () => {
    expect(resolveProjectedFsYears(null)).toBe(5);
  });

  it("reflects duration on projected upload row", () => {
    const applicant = {
      msmeSize: "Small",
      moduleData: { timeline: "24 months" },
    } as Applicant;
    const projected = buildRequirementUploadList(applicant).find((d) => d.id === "projected");
    expect(projected?.name).toMatch(/next 2 years/i);
  });
});
