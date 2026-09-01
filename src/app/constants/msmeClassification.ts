/**
 * Author: Yzrel Jade B. Eborde
 *
 * MSME size thresholds — aligned with TNA Form 01 Attachment A and prescreening ranges.
 */

export type MsmeSize = "Micro" | "Small" | "Medium";

export const MSME_ASSET_MICRO_MAX = 3_000_000;
export const MSME_ASSET_SMALL_MAX = 15_000_000;
export const MSME_ASSET_MEDIUM_MAX = 100_000_000;

export const MSME_EMPLOYEE_MICRO_MAX = 9;
export const MSME_EMPLOYEE_SMALL_MAX = 99;
export const MSME_EMPLOYEE_MEDIUM_MAX = 199;

/** Prescreening classification range dropdown labels. */
export const MSME_CLASSIFICATION_RANGES = [
  "₱0 - ₱3M",
  "₱3M - ₱15M",
  "₱15M - ₱100M",
] as const;

export type MsmeClassificationRange = (typeof MSME_CLASSIFICATION_RANGES)[number];

/** Prescreening employee classification range dropdown labels (DTI table). */
export const MSME_EMPLOYEE_CLASSIFICATION_RANGES = [
  "1 - 9",
  "10 - 99",
  "100 - 199",
] as const;

export type MsmeEmployeeClassificationRange =
  (typeof MSME_EMPLOYEE_CLASSIFICATION_RANGES)[number];

export const MSME_SIZE_ORDER: Record<MsmeSize, number> = {
  Micro: 0,
  Small: 1,
  Medium: 2,
};
