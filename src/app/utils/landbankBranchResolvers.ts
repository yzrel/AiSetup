/**
 * Author: Yzrel Jade B. Eborde
 */

import type { Applicant } from "../store/applicantStore";
import {
  landbankBranchStore,
  type LandBankBranchRecord,
} from "../store/landbankBranchStore";
import { resolveApplicantOfficeId } from "./provincialOffice";

export interface LandBankBranchLetterDefaults {
  branchId: string;
  landbankBranch: string;
  branchAddress: string;
  branchCityProvince: string;
  branchManagerName: string;
  branchManagerTitle: string;
}

export function emptyLandBankBranchDefaults(): LandBankBranchLetterDefaults {
  return {
    branchId: "",
    landbankBranch: "",
    branchAddress: "",
    branchCityProvince: "",
    branchManagerName: "",
    branchManagerTitle: "Branch Manager",
  };
}

export function branchToLetterDefaults(
  branch: LandBankBranchRecord,
): LandBankBranchLetterDefaults {
  return {
    branchId: branch.id,
    landbankBranch: branch.name,
    branchAddress: branch.address,
    branchCityProvince: branch.cityProvince,
    branchManagerName: branch.managerName,
    branchManagerTitle: branch.managerTitle || "Branch Manager",
  };
}

export function resolveLandBankBranchById(
  branchId: string | undefined,
): LandBankBranchLetterDefaults | null {
  if (!branchId?.trim()) return null;
  const branch = landbankBranchStore
    .getAll()
    .find((b) => b.id === branchId && b.active);
  return branch ? branchToLetterDefaults(branch) : null;
}

export function resolveLandBankBranchByName(
  branchName: string,
): LandBankBranchLetterDefaults | null {
  const key = branchName.trim().toLowerCase();
  if (!key) return null;
  const branch = landbankBranchStore
    .getActive()
    .find((b) => b.name.trim().toLowerCase() === key);
  if (branch) return branchToLetterDefaults(branch);
  const fuzzy = landbankBranchStore
    .getActive()
    .find((b) => key.includes(b.name.trim().toLowerCase()) || b.name.trim().toLowerCase().includes(key));
  return fuzzy ? branchToLetterDefaults(fuzzy) : null;
}

export function resolveLandBankBranchForApplicant(
  applicant: Applicant | null,
): LandBankBranchLetterDefaults {
  if (!applicant) return emptyLandBankBranchDefaults();
  const officeId = resolveApplicantOfficeId(applicant);
  const byOffice = landbankBranchStore
    .getActive()
    .find((b) => b.officeId === officeId);
  if (byOffice) return branchToLetterDefaults(byOffice);
  const first = landbankBranchStore.getActive()[0];
  return first ? branchToLetterDefaults(first) : emptyLandBankBranchDefaults();
}
