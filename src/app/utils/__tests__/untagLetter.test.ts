/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { applicantStore } from "../../store/applicantStore";
import { demoModeStore } from "../../store/demoModeStore";
import { normalizeFormModuleStored } from "../normalizeCriticalModuleData";
import {
  buildUntagLetterBody,
  emptyUntagLetterForm,
  publishUntagLetter,
  resolveSetupAccountNumber,
  syncUntagLetterFromUpstream,
  validateUntagLetterPublish,
} from "../untagLetter";

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in tests"))),
  );
});

beforeEach(() => {
  demoModeStore.setEnabled(false);
});

function seedApplicant() {
  return applicantStore.add({
    applicantName: "Marlon Cesar B. Orfrecio",
    designation: "Owner",
    enterpriseName: "Three K Printshop",
    contactNumber: "09171234567",
    emailAddress: `untag-test-${Date.now()}@example.com`,
    businessType: "DTI",
    businessNature: "",
    businessSector: "Furniture, Jewelry, GHD and Creatives",
    yearsOfOperation: "5",
    enterpriseType: "",
    msmeSize: "Micro",
    assetSize: "",
    region: "Region XII (SOCCSKSARGEN)",
    address: "Antipas, Cotabato",
    currentModule: "procurement-liquidation",
    qualified: true,
    moduleData: {
      approvalLetter: {
        form: {
          recipientName: "Marlon Cesar B. Orfrecio",
          enterpriseName: "Three K Printshop",
          projectTitle: "Upgrading Printing Capabilities",
          approvedAmount: "₱1,570,000.00",
        },
        published: true,
      },
      projectProposal: {
        form: {
          firmName: "Three K Printshop",
          proponentName: "Marlon Cesar B. Orfrecio",
          projectTitle: "Upgrading Printing Capabilities",
        },
        submitted: true,
      },
      landBank: {
        form: {
          accountSnapshot: null,
          withdrawalLetter: null,
          withdrawalRemarks: "LandBank SA 0742-0134-21, Kidapawan Branch.",
          authorityLetterGenerated: false,
          tranches: {
            first: { tranche: 1, suppliers: [], selectedSupplierId: null },
            second: { tranche: 2, suppliers: [], selectedSupplierId: null },
            third: { tranche: 3, suppliers: [], selectedSupplierId: null },
          },
        },
        introductionLetter: {
          form: {
            letterDate: "2025-03-11",
            branchManagerName: "Ms. Girlie S. Elvena",
            branchManagerTitle: "Branch Manager",
            landbankBranch: "Kidapawan Branch",
            branchCityProvince: "Kidapawan City, North Cotabato",
            proponentName: "Marlon Cesar B. Orfrecio",
            enterpriseName: "Three K Printshop",
            projectTitle: "Upgrading Printing Capabilities",
            approvedAmount: "₱1,570,000.00",
            approvedAmountWords: "One Million Five Hundred Seventy Thousand Pesos & 00/100",
            signatoryName: "SAMMY P. MALAWAN",
            signatoryTitle: "Regional Director",
            regionalOfficeName: "DOST Regional Office No. XII",
          },
          published: true,
        },
      },
      procurement: {
        form: {
          documents: [],
          items: [],
          liquidations: [],
          untagged: false,
        },
      },
    },
  });
}

describe("untagLetter", () => {
  it("builds Letter to Untag body from form fields", () => {
    const form = {
      ...emptyUntagLetterForm(),
      enterpriseName: "Three K Printshop",
      proponentName: "Mr. Marlon Cesar B. Orfrecio",
      projectTitle: "Upgrading Printing Capabilities",
      accountNumber: "SA 0742-0134-21",
    };
    const body = buildUntagLetterBody(form);
    expect(body).toHaveLength(3);
    expect(body[0]).toContain("Three K Printshop");
    expect(body[0]).toContain("Upgrading Printing Capabilities");
    expect(body[1]).toContain("UNTAG");
    expect(body[1]).toContain("SA 0742-0134-21");
    expect(body[2]).toBe("Thank you.");
  });

  it("syncs defaults from approval, proposal, LBP intro, and account remarks", () => {
    const applicant = seedApplicant();
    const form = syncUntagLetterFromUpstream(applicant);
    expect(form.enterpriseName).toBe("Three K Printshop");
    expect(form.proponentName).toBe("Marlon Cesar B. Orfrecio");
    expect(form.projectTitle).toBe("Upgrading Printing Capabilities");
    expect(form.landbankBranch).toBe("Kidapawan Branch");
    expect(form.branchManagerName).toBe("Ms. Girlie S. Elvena");
    expect(resolveSetupAccountNumber(applicant)).toBe("SA 0742-0134-21");
    expect(form.accountNumber).toBe("SA 0742-0134-21");
  });

  it("keeps local edits when syncing from upstream", () => {
    const applicant = seedApplicant();
    const existing = {
      ...emptyUntagLetterForm(),
      enterpriseName: "Local Edit Co",
      accountNumber: "SA 9999-0000-00",
    };
    const synced = syncUntagLetterFromUpstream(applicant, existing);
    expect(synced.enterpriseName).toBe("Local Edit Co");
    expect(synced.accountNumber).toBe("SA 9999-0000-00");
    expect(synced.projectTitle).toBe("Upgrading Printing Capabilities");
  });

  it("validates required fields when demo mode is off", () => {
    const errors = validateUntagLetterPublish(emptyUntagLetterForm());
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("account"))).toBe(true);
  });

  it("publishes nested untagLetter under procurement", () => {
    const applicant = seedApplicant();
    const form = syncUntagLetterFromUpstream(applicant);
    const errors = publishUntagLetter(applicant.id, form, "agent@dost.gov.ph");
    expect(errors).toEqual([]);
    const stored = applicantStore.getById(applicant.id)?.moduleData?.procurement as {
      untagLetter?: { published?: boolean; form?: { accountNumber?: string } };
    };
    expect(stored?.untagLetter?.published).toBe(true);
    expect(stored?.untagLetter?.form?.accountNumber).toBe("SA 0742-0134-21");
  });

  it("normalizes nested untagLetter on read", () => {
    const normalized = normalizeFormModuleStored({
      form: { documents: [], items: [], liquidations: [], untagged: false },
      untagLetter: {
        form: { accountNumber: "SA 1", enterpriseName: "X" },
        published: "yes",
      },
      submitted: false,
    });
    expect(normalized?.untagLetter).toBeTruthy();
    const letter = normalized?.untagLetter as {
      published: boolean;
      form: Record<string, unknown>;
    };
    expect(letter.published).toBe(false);
    expect(letter.form.accountNumber).toBe("SA 1");
  });
});
