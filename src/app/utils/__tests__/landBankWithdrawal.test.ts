/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import type { ModuleDocument, WithdrawalTranchePackage } from "../../api/types";
import {
  availableProposalBudgetItems,
  emptyLandBankForm,
  emptyTranchePackage,
  getSelectedSupplierBlock,
  getTrancheEquipment,
  isTranche1Complete,
  isTranche2Complete,
  isTranche3Complete,
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
    expect(form.tranches.third.tranche).toBe(3);
    expect(form.tranches.first.suppliers).toEqual([]);
  });

  it("migrates legacy supplierName and flat equipment into one supplier block", () => {
    const form = normalizeLandBankForm({
      tranches: {
        first: {
          tranche: 1,
          supplierName: "ACME Corp",
          equipment: [{ id: "e1", item: "Mixer", amount: "100000" }],
        } as Partial<import("../../api/types").WithdrawalTranchePackage>,
        second: emptyTranchePackage(2),
        third: emptyTranchePackage(3),
      },
    });
    expect(form.tranches.first.suppliers).toHaveLength(1);
    expect(form.tranches.first.suppliers[0].name).toBe("ACME Corp");
    expect(form.tranches.first.suppliers[0].equipment).toHaveLength(1);
    expect(form.tranches.first.selectedSupplierId).toBe(form.tranches.first.suppliers[0].id);
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
        third: emptyTranchePackage(3),
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

  it("T3 requires only the signed letter (same as T2)", () => {
    expect(isTranche3Complete(emptyTranchePackage(3))).toBe(false);
    expect(
      isTranche3Complete({ ...emptyTranchePackage(3), signedLetter: doc("t3.pdf") }),
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

describe("supplier blocks", () => {
  it("resolves selected supplier for letter generation", () => {
    const form = normalizeLandBankForm({
      tranches: {
        first: {
          tranche: 1,
          suppliers: [
            { id: "s1", name: "Alpha", equipment: [] },
            { id: "s2", name: "Beta", equipment: [{ id: "e1", item: "Oven", amount: "50000" }] },
          ],
          selectedSupplierId: "s2",
        },
        second: emptyTranchePackage(2),
        third: emptyTranchePackage(3),
      },
    });
    const selected = getSelectedSupplierBlock(form.tranches.first);
    expect(selected?.name).toBe("Beta");
    expect(getTrancheEquipment(form.tranches.first)).toHaveLength(1);
  });

  it("excludes budget lines already linked via sourceBudgetItemId on any tranche", () => {
    const form = normalizeLandBankForm({
      tranches: {
        first: {
          tranche: 1,
          suppliers: [
            {
              id: "s1",
              name: "Sup",
              equipment: [
                {
                  id: "e1",
                  item: "Machine A",
                  amount: "100000",
                  sourceBudgetItemId: "budget-row-1",
                },
              ],
            },
          ],
          selectedSupplierId: "s1",
        },
        second: emptyTranchePackage(2),
        third: emptyTranchePackage(3),
      },
    });

    const applicant = {
      id: "a1",
      applicationId: "LOI-2026-000001",
      applicantName: "Test",
      designation: "Owner",
      enterpriseName: "Test Co",
      emailAddress: "test@example.com",
      contactNumber: "09170000000",
      province: "South Cotabato",
      qualified: true,
      currentModule: "landbank-withdrawal",
      moduleData: {
        projectProposal: {
          form: {
            budgetItems: [
              { id: "budget-row-1", item: "Machine A", setupShare: "100000" },
              { id: "budget-row-2", item: "Machine B", setupShare: "200000" },
            ],
          },
        },
      },
    } as import("../../store/applicantStore").Applicant;

    const available = availableProposalBudgetItems(applicant, form);
    const ids = available.map((b) => b.id);
    expect(ids).toContain("budget-row-2");
    expect(ids).not.toContain("budget-row-1");
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
    const supplier = { id: "s1", name: "ACME", equipment: [] };
    updateTranchePackage(form, 2, {
      suppliers: [supplier],
      selectedSupplierId: "s1",
    });
    expect(form.tranches.second.suppliers).toEqual([]);
  });
});
