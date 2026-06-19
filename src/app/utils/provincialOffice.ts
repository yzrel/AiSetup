/**
 * Author: Yzrel Jade B. Eborde
 */

import { DOST_REGION_12_CONTACTS } from "../constants/setupBrochure";
import { REGION_12_PROVINCES } from "../constants/region12";
import { applicantStore, Applicant } from "../store/applicantStore";
import { AuthUser } from "../store/authStore";

const PROVINCE_TO_OFFICE: Record<string, string> = {
  "south cotabato": "south-cotabato",
  cotabato: "cotabato",
  "north cotabato": "cotabato",
  "sultan kudarat": "sultan-kudarat",
  sarangani: "gensan-sarangani",
  "general santos city": "gensan-sarangani",
  "general santos": "gensan-sarangani",
};

export function normalizeProvinceKey(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveOfficeIdForProvince(province: string): string {
  const key = normalizeProvinceKey(province);
  if (!key) return "regional";
  return PROVINCE_TO_OFFICE[key] ?? "regional";
}

export function getOfficeContact(officeId: string) {
  return (
    DOST_REGION_12_CONTACTS.find((o) => o.id === officeId) ??
    DOST_REGION_12_CONTACTS[0]
  );
}

export function getOfficeName(officeId: string): string {
  return getOfficeContact(officeId).name;
}

export function resolveApplicantProvince(applicant: Applicant): string {
  const fromModule = String(applicant.moduleData?.province ?? "").trim();
  if (fromModule) return fromModule;

  const address = applicant.address.toLowerCase();
  for (const province of REGION_12_PROVINCES) {
    if (address.includes(province.toLowerCase())) return province;
  }

  if (applicant.region && applicant.region !== "Region XII (SOCCSKSARGEN)") {
    const match = REGION_12_PROVINCES.find(
      (p) => p.toLowerCase() === applicant.region.toLowerCase(),
    );
    if (match) return match;
  }

  return "";
}

export function resolveApplicantOfficeId(applicant: Applicant): string {
  return resolveOfficeIdForProvince(resolveApplicantProvince(applicant));
}

export function staffCoversProvince(user: AuthUser, province: string): boolean {
  if (user.role === "admin" || user.officeId === "regional") return true;
  if (user.assignedProvinces?.length) {
    const key = normalizeProvinceKey(province);
    return user.assignedProvinces.some(
      (p) => normalizeProvinceKey(p) === key,
    );
  }
  if (user.officeId) {
    return resolveOfficeIdForProvince(province) === user.officeId;
  }
  return false;
}

export function getApplicantsForStaff(user: AuthUser | null): Applicant[] {
  const all = applicantStore.getAll();
  if (!user || (user.role !== "admin" && user.role !== "agent")) {
    return all;
  }
  if (user.role === "admin") return all;
  return all.filter((a) =>
    staffCoversProvince(user, resolveApplicantProvince(a)),
  );
}

export function getStaffProvinces(user: AuthUser | null): string[] {
  if (!user || user.role === "admin") {
    return [...REGION_12_PROVINCES];
  }
  if (user.assignedProvinces?.length) return [...user.assignedProvinces];
  if (user.officeId) {
    return REGION_12_PROVINCES.filter(
      (p) => resolveOfficeIdForProvince(p) === user.officeId,
    );
  }
  return [];
}
