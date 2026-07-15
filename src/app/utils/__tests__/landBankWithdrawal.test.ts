/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { ModuleDocument, WithdrawalTranchePackage } from "../../api/types";
import {
  emptyLandBankForm,
  emptyTranchePackage,
  isTranche1Complete,
  isTranche2Complete,
  isWithdrawalRequestReady,
  normalizeLandBankForm,
  updateTranchePackage,
} from "../landBankWithdrawal";

function doc(name: string): ModuleDocument {
  return {
    fileName: name,
    mimeType: "application/pdf",
    dataUrl: "data:application/pdf;base64,",
    uploadedAt: "2026-07-01T00:00:00.000Z",
    uploadedBy: "applicant",
  };
}

describe("normalizeLandBankForm", () => {
  it("fills defaults for a partial legacy shape", () => {
    const form = normalizeLandBankForm({});
    expect(form.accountSnapshot).toBeNull();
    expect(form.withdrawalRemarks).toBe("");
    expect(form.authorityLetterGenerated).toBe(false);
    expect(form.tranches.first.tranche).toBe(1);
    expect(form.tranches.second.tranche).toBe(2);
    expect(form.tranches.first.equipment).toEqual([]);
  });

  it("migrates the deprecated single withdrawalLetter into tranche 1", () => {
    const letter = doc("signed-letter.pdf");
    const form = normalizeLandBankForm({ withdrawalLetter: letter });
    expect(form.tranches.first.signedLetter).toEqual(letter);
    expect(form.tranches.first.status).toBe("signed");
    expect(form.tranches.second.signedLetter).toBeNull();
  });

  it("does not overwrite an existing tranche 1 signed letter", () => {
    const existing = doc("existing.pdf");
    const legacy = doc("legacy.pdf");
    const form = normalizeLandBankForm({
      withdrawalLetter: legacy,
      tranches: {
        first: { ...emptyTranchePackage(1), signedLetter: existing, status: "signed" },
        second: emptyTranchePackage(2),
      },
    });
    expect(form.tranches.first.signedLetter).toEqual(existing);
  });
});

describe("tranche completion rules", () => {
  const signedT1 = (): WithdrawalTranchePackage => ({
    ...emptyTranchePackage(1),
    signedLetter: doc("t1.pdf"),
    quotations: [doc("quote.pdf")],
    equipmentPhotos: [doc("photo.jpg")],
  });

  it("T1 requires signed letter, a quotation, and an equipment photo", () => {
    expect(isTranche1Complete(signedT1())).toBe(true);
    expect(isTranche1Complete({ ...signedT1(), signedLetter: null })).toBe(false);
    expect(isTranche1Complete({ ...signedT1(), quotations: [] })).toBe(false);
    expect(isTranche1Complete({ ...signedT1(), equipmentPhotos: [] })).toBe(false);
  });

  it("T2 requires only the signed letter", () => {
    expect(isTranche2Complete(emptyTranchePackage(2))).toBe(false);
    expect(
      isTranche2Complete({ ...emptyTranchePackage(2), signedLetter: doc("t2.pdf") }),
    ).toBe(true);
  });

  it("withdrawal request readiness follows tranche 1 completion", () => {
    const form = emptyLandBankForm();
    expect(isWithdrawalRequestReady(form)).toBe(false);
    const ready = updateTranchePackage(form, 1, {
      signedLetter: doc("t1.pdf"),
      quotations: [doc("quote.pdf")],
      equipmentPhotos: [doc("photo.jpg")],
    });
    expect(isWithdrawalRequestReady(ready)).toBe(true);
  });
});

describe("updateTranchePackage", () => {
  it("mirrors the tranche 1 signed letter into the legacy withdrawalLetter field", () => {
    const letter = doc("t1.pdf");
    const next = updateTranchePackage(emptyLandBankForm(), 1, { signedLetter: letter });
    expect(next.withdrawalLetter).toEqual(letter);
    expect(next.tranches.first.signedLetter).toEqual(letter);
  });

  it("does not mutate the input form", () => {
    const form = emptyLandBankForm();
    updateTranchePackage(form, 2, { supplierName: "ACME" });
    expect(form.tranches.second.supplierName).toBe("");
  });
});
