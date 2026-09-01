/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { applicantStore } from "../../store/applicantStore";
import { getCloseOutForm, saveCloseOutDraft } from "../projectCloseOut";
import { syncPropertyTransferFromPrior } from "../propertyTransferReceipt";
import { DOST_REGION_12_DIRECTOR_NAME, DOST_REGION_12_OFFICE } from "../../constants/region12";

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline in tests"))),
  );
});

function addCloseOutApplicant(suffix: string, enterpriseName: string, applicationId?: string) {
  const app = applicantStore.add({
    applicantName: "PTR Test",
    designation: "Owner",
    enterpriseName,
    contactNumber: "09170000000",
    emailAddress: `ptr-${suffix}@example.com`,
    businessType: "DTI",
    businessNature: "",
    businessSector: "Food Processing",
    yearsOfOperation: "5",
    enterpriseType: "",
    msmeSize: "Small",
    assetSize: "",
    region: "South Cotabato",
    address: "Koronadal City, South Cotabato",
    currentModule: "project-closeout",
    qualified: true,
    moduleData: {},
  });
  if (applicationId) {
    applicantStore.update(app.id, { applicationId });
  }
  return applicantStore.getById(app.id)!;
}

describe("Form 005 PTR prefill", () => {
  it("sync fills blank PTR fields from applicant without overwriting edits", () => {
    const applicant = addCloseOutApplicant("sync", "Sample Coop", "LOI-2026-000777");

    saveCloseOutDraft(applicant.id, {
      ...getCloseOutForm(applicant),
      equipmentInventory: [
        {
          id: "eq-1",
          qty: "1",
          description: "Packaging line",
          amount: "500000",
          propertyNo: "PL-01",
          dateAcquired: "2025-03-01",
          remarks: "",
        },
      ],
      ptrFromAccountableOfficer: "Custom From Office",
      ptrApprovedByName: "Staff Override Name",
    });

    const refreshed = applicantStore.getById(applicant.id)!;
    const synced = syncPropertyTransferFromPrior(getCloseOutForm(refreshed), refreshed);

    expect(synced.ptrFromAccountableOfficer).toBe("Custom From Office");
    expect(synced.ptrApprovedByName).toBe("Staff Override Name");
    expect(synced.ptrToAccountableOfficer).toBe("Sample Coop");
    expect(synced.ptrEntityName).toBe(DOST_REGION_12_OFFICE);
    expect(synced.ptrNo).toBe("PTR-LOI-2026-000777");
    expect(synced.ptrTransferType).toBe("reassignment");
    expect(synced.ptrReasonForTransfer).toBe("Physical Transfer Only");
    expect(synced.ptrApprovedByDesignation).toBe("Regional Director");
    expect(synced.ptrReceivedBy).toBe("Sample Coop");
    expect(synced.equipmentInventory[0]?.conditionOfPpe).toBe("Good");
  });

  it("maps legacy equipment acknowledgement filename on hydrate", () => {
    const applicant = addCloseOutApplicant("legacy", "Legacy Co");
    applicantStore.update(applicant.id, {
      moduleData: {
        projectCloseOut: {
          form: {
            equipmentInventory: [],
            certificateOfOwnershipIssued: false,
            equipmentAcknowledgementFileName: "legacy-ack.pdf",
          },
        },
      },
    });
    const refreshed = applicantStore.getById(applicant.id)!;
    expect(getCloseOutForm(refreshed).propertyTransferSignedFileName).toBe(
      "legacy-ack.pdf",
    );
  });
});

describe("Form 005 PTR prefill defaults", () => {
  it("uses regional director name as default approver when blank", () => {
    const applicant = addCloseOutApplicant("defaults", "Default Co");
    const synced = syncPropertyTransferFromPrior(getCloseOutForm(applicant), applicant);
    expect(synced.ptrApprovedByName).toBe(DOST_REGION_12_DIRECTOR_NAME);
  });
});
