/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import { buildRequirementUploadList } from "../submissionRequirements";
import { QUOTATIONS_PO_GUIDANCE } from "../requirementEquipment";

describe("submissionRequirements compliance", () => {
  it("includes supplier unavailability affidavit as optional", () => {
    const list = buildRequirementUploadList(null);
    const affidavit = list.find((d) => d.id === "supplier-unavailability-affidavit");
    expect(affidavit).toBeDefined();
    expect(affidavit?.required).toBe(false);
  });

  it("expands per-equipment quotation and drawing rows from published TNA2", () => {
    const applicant = {
      msmeSize: "Small",
      moduleData: {
        tna2Document: {
          published: true,
          recommendedEquipment: [
            { name: "Vacuum sealer", specifications: "10L chamber" },
            { name: "Label printer" },
          ],
        },
      },
    } as Applicant;
    const list = buildRequirementUploadList(applicant);
    expect(list.some((d) => d.id === "quotations-vacuum-sealer-0")).toBe(true);
    expect(list.some((d) => d.id === "drawings-label-printer-1")).toBe(true);
    expect(list.some((d) => d.id === "quotations")).toBe(false);
    expect(list.find((d) => d.id.startsWith("quotations-"))?.hint).toBe(QUOTATIONS_PO_GUIDANCE);
  });

  it("uses aggregate quotations when no equipment list", () => {
    const list = buildRequirementUploadList({ msmeSize: "Small", moduleData: {} } as Applicant);
    expect(list.some((d) => d.id === "quotations")).toBe(true);
    expect(list.some((d) => d.id.startsWith("quotations-"))).toBe(false);
  });
});
