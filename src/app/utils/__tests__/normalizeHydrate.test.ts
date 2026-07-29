/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  normalizeLandBankStored,
  normalizeLoiDocument,
  normalizeModuleDataForHydrate,
  normalizeTna1Stored,
  normalizeApprovalLetterStored,
} from "../normalizeCriticalModuleData";
import { stripHeavyPayloads, stripTna1FormForSync } from "../stripModuleDataForSync";

describe("normalizeModuleDataForHydrate", () => {
  it("drops corrupt known-key scalars and keeps valid shapes", () => {
    const hydrated = normalizeModuleDataForHydrate({
      approvalLetter: "bad",
      loiDocument: { bodyParagraphs: ["Hello"], thruAddressee: { officeName: "PSTO" } },
      tna1: { form: { sector: "Food" }, tables: { a: 1 }, submitted: "yes" },
      projectProposal: { form: { title: "P" }, submitted: "no" },
      tna2Document: { published: true, form: {} },
      rtecReport: "corrupt",
      conductRtec: { published: false },
      requirementStaffReview: { staffNotes: "ok" },
      lbpIntroductionLetter: { published: true, form: {} },
      landBank: { form: {}, signedMoa: "forged", introductionLetter: { published: true, form: {} } },
      procurement: { form: {}, submitted: "yes" },
      refund: { form: { term: "5" }, submitted: true },
      projectCloseOut: "nope",
      signedDocuments: {
        "letter-of-intent": { fileName: "loi.pdf", fileId: "1" },
        junk: { mimeType: "x" },
      },
      coreProducts: "Mango",
    });

    expect(hydrated.approvalLetter).toBeUndefined();
    expect(hydrated.loiDocument).toMatchObject({ bodyParagraphs: ["Hello"] });
    expect(hydrated.tna1).toMatchObject({
      form: { sector: "Food" },
      submitted: false,
    });
    expect(hydrated.projectProposal).toMatchObject({
      form: { title: "P" },
      submitted: false,
    });
    expect(hydrated.tna2Document).toMatchObject({ published: true, form: {} });
    expect(hydrated.rtecReport).toBeUndefined();
    expect(hydrated.conductRtec).toMatchObject({ published: false });
    expect(hydrated.requirementStaffReview).toMatchObject({ staffNotes: "ok" });
    expect(hydrated.lbpIntroductionLetter).toMatchObject({ published: true });
    expect(hydrated.landBank).toMatchObject({
      form: {},
      introductionLetter: { published: true },
    });
    expect((hydrated.landBank as { signedMoa?: unknown }).signedMoa).toBeUndefined();
    expect(hydrated.procurement).toMatchObject({ form: {}, submitted: false });
    expect(hydrated.refund).toMatchObject({ form: { term: "5" }, submitted: true });
    expect(hydrated.projectCloseOut).toBeUndefined();
    expect(Object.keys(hydrated.signedDocuments as object)).toEqual([
      "letter-of-intent",
    ]);
    expect(hydrated.coreProducts).toBe("Mango");
  });

  it("normalizes approval letter published from legacy form flag", () => {
    expect(
      normalizeApprovalLetterStored({
        form: { projectTitle: "X", published: true },
        published: false,
      })?.published,
    ).toBe(true);
  });
});

describe("LOI / TNA1 strip helpers", () => {
  it("keeps LOI user text while stripping heavy dataUrls", () => {
    const heavy = `data:application/pdf;base64,${"A".repeat(600)}`;
    const slim = stripHeavyPayloads({
      loiDocument: {
        bodyParagraphs: ["We respectfully submit our LOI."],
        attachment: { fileName: "scan.pdf", dataUrl: heavy, fileId: "f1" },
      },
    });
    expect(slim).toEqual({
      loiDocument: {
        bodyParagraphs: ["We respectfully submit our LOI."],
        attachment: {
          fileName: "scan.pdf",
          fileId: "f1",
          hasFileContent: true,
        },
      },
    });
  });

  it("stripTna1FormForSync clears FileData bodies and keeps names", () => {
    const heavy = `data:image/png;base64,${"B".repeat(600)}`;
    const slim = stripTna1FormForSync({
      sector: "Food Processing",
      productionPlanFileName: "plan.pdf",
      productionPlanFileData: heavy,
    });
    expect(slim).toEqual({
      sector: "Food Processing",
      productionPlanFileName: "plan.pdf",
      productionPlanFileUploaded: true,
    });
  });

  it("normalizeTna1Stored coerces form/tables objects", () => {
    expect(normalizeTna1Stored({ form: "x", tables: null, submitted: true })).toEqual({
      form: {},
      tables: {},
      submitted: true,
    });
    expect(normalizeLoiDocument("nope")).toBeUndefined();
    expect(normalizeLandBankStored("nope")).toBeUndefined();
  });
});
