/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import {
  needsArticlesOfIncorporation,
  needsBoardResolution,
} from "../orgTypeRequirements";
import { buildRequirementUploadList } from "../submissionRequirements";

function applicant(partial: Partial<Applicant>): Applicant {
  return {
    id: "t1",
    applicationId: "LOI-2026-000001",
    enterpriseName: "Test Co",
    msmeSize: "Small",
    moduleData: {},
    ...partial,
  } as Applicant;
}

describe("orgTypeRequirements", () => {
  it("requires resolution for LGU org type even when DTI registered", () => {
    const a = applicant({
      moduleData: {
        registrationType: "DTI",
        tna1: { form: { organizationType: "LGU" } },
      },
    });
    expect(needsBoardResolution(a)).toBe(true);
    expect(buildRequirementUploadList(a).find((d) => d.id === "resolution")?.required).toBe(true);
  });

  it("requires resolution for SUC org type", () => {
    const a = applicant({
      moduleData: {
        tna1: { form: { organizationType: "SUC" } },
      },
    });
    expect(needsBoardResolution(a)).toBe(true);
  });

  it("does not require resolution for sole proprietorship", () => {
    const a = applicant({
      moduleData: {
        registrationType: "DTI",
        tna1: { form: { organizationType: "Sole Proprietorship (DTI)" } },
      },
    });
    expect(needsBoardResolution(a)).toBe(false);
  });

  it("requires articles for cooperatives", () => {
    const a = applicant({
      moduleData: {
        tna1: { form: { organizationType: "Cooperative" } },
      },
    });
    expect(needsArticlesOfIncorporation(a)).toBe(true);
  });
});
