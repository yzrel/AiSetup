/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  MSME_ASSET_MEDIUM_MAX,
  MSME_ASSET_MICRO_MAX,
  MSME_ASSET_SMALL_MAX,
  MSME_CLASSIFICATION_RANGES,
  MSME_EMPLOYEE_CLASSIFICATION_RANGES,
  MSME_EMPLOYEE_MEDIUM_MAX,
  MSME_EMPLOYEE_MICRO_MAX,
  MSME_EMPLOYEE_SMALL_MAX,
  MSME_SIZE_ORDER,
  type MsmeClassificationRange,
  type MsmeEmployeeClassificationRange,
  type MsmeSize,
} from "../constants/msmeClassification";

export type { MsmeSize } from "../constants/msmeClassification";

const RANGE_TO_SIZE: Record<MsmeClassificationRange, MsmeSize> = {
  "₱0 - ₱3M": "Micro",
  "₱3M - ₱15M": "Small",
  "₱15M - ₱100M": "Medium",
};

const EMPLOYEE_RANGE_TO_SIZE: Record<MsmeEmployeeClassificationRange, MsmeSize> = {
  "1 - 9": "Micro",
  "10 - 99": "Small",
  "100 - 199": "Medium",
};

export function parseAssetAmount(assetSize: string): number | null {
  const digits = String(assetSize ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function classifyByAssetAmount(amount: number): MsmeSize | "" {
  if (amount <= MSME_ASSET_MICRO_MAX) return "Micro";
  if (amount <= MSME_ASSET_SMALL_MAX) return "Small";
  if (amount <= MSME_ASSET_MEDIUM_MAX) return "Medium";
  return "";
}

export function classifyByClassificationRange(
  classificationRange: string,
): MsmeSize | "" {
  const range = String(classificationRange ?? "").trim();
  if (!range) return "";
  return RANGE_TO_SIZE[range as MsmeClassificationRange] ?? "";
}

export function classifyByAsset(input: {
  assetSize?: string;
  classificationRange?: string;
}): MsmeSize | "" {
  const amount = parseAssetAmount(String(input.assetSize ?? ""));
  if (amount !== null) return classifyByAssetAmount(amount);
  return classifyByClassificationRange(String(input.classificationRange ?? ""));
}

export function classifyByEmployees(count: number): MsmeSize | "" {
  if (!Number.isFinite(count) || count <= 0) return "";
  if (count <= MSME_EMPLOYEE_MICRO_MAX) return "Micro";
  if (count <= MSME_EMPLOYEE_SMALL_MAX) return "Small";
  if (count <= MSME_EMPLOYEE_MEDIUM_MAX) return "Medium";
  return "";
}

export function classifyByEmployeeClassificationRange(
  employeeClassificationRange: string,
): MsmeSize | "" {
  const range = String(employeeClassificationRange ?? "").trim();
  if (!range) return "";
  return EMPLOYEE_RANGE_TO_SIZE[range as MsmeEmployeeClassificationRange] ?? "";
}

export function classifyByEmployee(input: {
  numberOfEmployees?: string;
  employeeClassificationRange?: string;
}): MsmeSize | "" {
  const count = parseEmployeeCount(String(input.numberOfEmployees ?? ""));
  if (count !== null) return classifyByEmployees(count);
  return classifyByEmployeeClassificationRange(
    String(input.employeeClassificationRange ?? ""),
  );
}

export function parseEmployeeCount(value: string): number | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const count = parseInt(trimmed, 10);
  if (!Number.isFinite(count) || count < 0) return null;
  return count;
}

function higherMsmeSize(a: MsmeSize, b: MsmeSize): MsmeSize {
  return MSME_SIZE_ORDER[a] >= MSME_SIZE_ORDER[b] ? a : b;
}

/** DTI rule: higher of asset-based and employee-based classification. */
export function deriveMsmeSize(input: {
  assetSize?: string;
  classificationRange?: string;
  numberOfEmployees?: string;
  employeeClassificationRange?: string;
}): MsmeSize | "" {
  const assetClass = classifyByAsset(input);
  const employeeClass = classifyByEmployee(input);

  if (assetClass && employeeClass) {
    return higherMsmeSize(assetClass, employeeClass);
  }
  return assetClass || employeeClass;
}

/**
 * Prescreening MSME size — asset size and/or range + employee range only (no headcount field).
 * When the user edits classification range directly, that selection drives the asset dimension.
 */
export function derivePrescreeningMsmeSize(
  input: {
    assetSize?: string;
    classificationRange?: string;
    employeeClassificationRange?: string;
  },
  changedField?: "assetSize" | "classificationRange" | "employeeClassificationRange",
): MsmeSize | "" {
  let assetClass: MsmeSize | "" = "";
  if (changedField === "classificationRange") {
    assetClass = classifyByClassificationRange(input.classificationRange ?? "");
  } else {
    const amount = parseAssetAmount(String(input.assetSize ?? ""));
    if (amount !== null) {
      assetClass = classifyByAssetAmount(amount);
    } else {
      assetClass = classifyByClassificationRange(input.classificationRange ?? "");
    }
  }

  const employeeClass = classifyByEmployeeClassificationRange(
    input.employeeClassificationRange ?? "",
  );

  if (assetClass && employeeClass) {
    return higherMsmeSize(assetClass, employeeClass);
  }
  return assetClass || employeeClass;
}

/** Map numeric asset amount to prescreening range dropdown value. */
export function classificationRangeForAssetAmount(amount: number): MsmeClassificationRange | "" {
  if (!Number.isFinite(amount) || amount < 0) return "";
  if (amount <= MSME_ASSET_MICRO_MAX) return MSME_CLASSIFICATION_RANGES[0];
  if (amount <= MSME_ASSET_SMALL_MAX) return MSME_CLASSIFICATION_RANGES[1];
  if (amount <= MSME_ASSET_MEDIUM_MAX) return MSME_CLASSIFICATION_RANGES[2];
  return "";
}

/** Map employee headcount to prescreening employee range dropdown value. */
export function employeeClassificationRangeForCount(
  count: number,
): MsmeEmployeeClassificationRange | "" {
  if (!Number.isFinite(count) || count <= 0) return "";
  if (count <= MSME_EMPLOYEE_MICRO_MAX) return MSME_EMPLOYEE_CLASSIFICATION_RANGES[0];
  if (count <= MSME_EMPLOYEE_SMALL_MAX) return MSME_EMPLOYEE_CLASSIFICATION_RANGES[1];
  if (count <= MSME_EMPLOYEE_MEDIUM_MAX) return MSME_EMPLOYEE_CLASSIFICATION_RANGES[2];
  return "";
}

export function isAboveMsmeEmployeeLimit(count: number): boolean {
  return Number.isFinite(count) && count > MSME_EMPLOYEE_MEDIUM_MAX;
}

export function isAboveMsmeAssetLimit(amount: number): boolean {
  return Number.isFinite(amount) && amount > MSME_ASSET_MEDIUM_MAX;
}
