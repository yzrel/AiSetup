/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { landbankBranchStore } from "../../store/landbankBranchStore";
import {
  resolveLandBankBranchByName,
  resolveLandBankBranchForApplicant,
} from "../landbankBranchResolvers";
import { applicantStore } from "../../store/applicantStore";

beforeEach(() => {
  landbankBranchStore.resetForTests();
});

describe("landbankBranchResolvers", () => {
  it("resolves branch by name from hydrated store", () => {
    landbankBranchStore.setBranchesForTests([
      {
        id: "b1",
        name: "Kidapawan Branch",
        address: "Quezon Blvd.",
        cityProvince: "Kidapawan City, North Cotabato",
        managerName: "Ms. Test Manager",
        managerTitle: "Branch Manager",
        officeId: "cotabato",
        active: true,
      },
    ]);

    const resolved = resolveLandBankBranchByName("Kidapawan Branch");
    expect(resolved?.branchId).toBe("b1");
    expect(resolved?.branchManagerName).toBe("Ms. Test Manager");
    expect(resolved?.branchAddress).toBe("Quezon Blvd.");
  });

  it("suggests branch by applicant PSTO office", () => {
    landbankBranchStore.setBranchesForTests([
      {
        id: "b2",
        name: "Koronadal Branch",
        address: "Main St.",
        cityProvince: "Koronadal City",
        managerName: "Mr. Koronadal",
        managerTitle: "Branch Manager",
        officeId: "south-cotabato",
        active: true,
      },
    ]);

    const applicant = applicantStore.add({
      applicantName: "Test",
      designation: "Owner",
      enterpriseName: "Test Co",
      contactNumber: "0917",
      emailAddress: `lbp-branch-${Date.now()}@test.com`,
      businessType: "DTI",
      businessNature: "",
      businessSector: "Food",
      yearsOfOperation: "3",
      enterpriseType: "",
      msmeSize: "Micro",
      assetSize: "",
      region: "Region XII (SOCCSKSARGEN)",
      address: "Koronadal City, South Cotabato",
      currentModule: "landbank-withdrawal",
      qualified: true,
      moduleData: {},
    });

    const resolved = resolveLandBankBranchForApplicant(applicant);
    expect(resolved.landbankBranch).toBe("Koronadal Branch");
    expect(resolved.branchManagerName).toBe("Mr. Koronadal");
  });
});
