/**
 * Author: Yzrel Jade B. Eborde
 *
 * Annex C MOA prefill / pick-if-blank sync.
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import {
  amountToPesosWords,
  buildMoaAnnexCForm,
  computeMoaPdcCount,
  emptyMoaAnnexCForm,
  syncMoaAnnexCFromPrior,
} from "../moaAnnexC";

function minimalApplicant(
  overrides: Partial<Applicant> & { moduleData?: Applicant["moduleData"] } = {},
): Applicant {
  return {
    id: "app-moa-1",
    applicationId: "LOI-2026-000099",
    enterpriseName: "Acme Foods",
    applicantName: "Juan Dela Cruz",
    designation: "Owner",
    emailAddress: "juan@example.com",
    contactNumber: "09171234567",
    address: "Koronadal City, South Cotabato",
    msmeSize: "Micro",
    businessType: "Sole Proprietorship",
    businessSector: "Food",
    businessNature: "Processing",
    yearsOfOperation: "5",
    assetSize: "1000000",
    qualified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    moduleData: {
      province: "South Cotabato",
      tinNumber: "123-456-789-000",
      approvalLetter: {
        form: {
          seriesYear: "2026",
          approvalDate: "2026-06-15",
          referenceNumber: "SETUPiFund/DOSTXII/26/099",
          recipientName: "JUAN DELA CRUZ",
          recipientDesignation: "Proprietor",
          enterpriseName: "Acme Foods Corp",
          enterpriseAddress: "Brgy. Zone, Koronadal City",
          projectTitle: "Modernization of Food Processing Line",
          approvedAmount: "500000",
          refundTermYears: "five (5)",
          insuranceRatePercent: "0.50",
          pstoDirectorTitle: "Provincial Director",
          pstoOfficeName: "PSTO - South Cotabato",
          signatoryName: "SAMMY P. MALAWAN",
          signatoryTitle: "Regional Director",
          conformeDeadlineDays: "15",
          published: true,
        },
        published: true,
        acknowledged: false,
      },
      ...(overrides.moduleData ?? {}),
    },
    ...overrides,
  } as Applicant;
}

describe("amountToPesosWords", () => {
  it("converts common peso amounts with centavos clause", () => {
    expect(amountToPesosWords("500000")).toBe(
      "FIVE HUNDRED THOUSAND PESOS & 00/100",
    );
    expect(amountToPesosWords("P1,250,000")).toContain("MILLION");
    expect(amountToPesosWords("P1,250,000")).toContain("& 00/100");
    expect(amountToPesosWords("")).toBe("");
  });
});

describe("computeMoaPdcCount", () => {
  it("uses term years × 12 for MOA clause", () => {
    expect(computeMoaPdcCount("3")).toBe("36");
    expect(computeMoaPdcCount("5")).toBe("60");
  });
});

describe("buildMoaAnnexCForm", () => {
  it("prefills from Notice of Approval fields", () => {
    const form = buildMoaAnnexCForm(minimalApplicant());
    expect(form.enterpriseName).toBe("Acme Foods Corp");
    expect(form.projectTitle).toBe("Modernization of Food Processing Line");
    expect(form.approvedAmount).toBe("500000");
    expect(form.approvedAmountWords).toBe(
      "FIVE HUNDRED THOUSAND PESOS & 00/100",
    );
    expect(form.regionalDirector).toBe("SAMMY P. MALAWAN");
    expect(form.representativeName).toBe("JUAN DELA CRUZ");
    expect(form.pstoOfficeName).toBe("PSTO - South Cotabato");
    expect(form.refundTermYearsDigit).toBe("5");
    expect(form.pdcCount).toBe("60");
    expect(form.party2IdNo).toBe("123-456-789-000");
    expect(form.witness2Title).toBe("Provincial Director");
    expect(form.witness1Title).toBe("Chief, Technical Services Division");
    expect(form.regionLabel).toBe("XII");
  });

  it("prefills proposed equipment from published TNA Form 02", () => {
    const form = buildMoaAnnexCForm(
      minimalApplicant({
        moduleData: {
          tna2Document: {
            published: true,
            recommendedEquipment: [
              { name: "Vacuum packaging machine", specifications: "5 kg capacity" },
              { name: "Dehydrator", specifications: "" },
            ],
          },
        },
      }),
    );
    expect(form.signboardProposedEquipment).toContain("Vacuum packaging machine");
    expect(form.signboardProposedEquipment).toContain("Dehydrator");
  });
});

describe("syncMoaAnnexCFromPrior", () => {
  it("only fills blank fields", () => {
    const applicant = minimalApplicant();
    const existing = {
      ...emptyMoaAnnexCForm(),
      enterpriseName: "Staff Edited Enterprise",
      projectTitle: "",
      approvedAmount: "",
    };
    const synced = syncMoaAnnexCFromPrior(existing, applicant);
    expect(synced.enterpriseName).toBe("Staff Edited Enterprise");
    expect(synced.projectTitle).toBe("Modernization of Food Processing Line");
    expect(synced.approvedAmount).toBe("500000");
  });
});
