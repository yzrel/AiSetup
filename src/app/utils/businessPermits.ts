/**
 * Author: Yzrel Jade B. Eborde
 */

import type { ModuleDocument } from "../api/types";

/** SETUP requires business permits for the last 3 consecutive years. */
export const BUSINESS_PERMIT_YEARS_REQUIRED = 3;

export interface BusinessPermitEntry {
  year: string;
  document: ModuleDocument | null;
}

export function emptyBusinessPermits(): BusinessPermitEntry[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: BUSINESS_PERMIT_YEARS_REQUIRED }, (_, i) => ({
    year: String(currentYear - (BUSINESS_PERMIT_YEARS_REQUIRED - 1) + i),
    document: null,
  }));
}

export function loadBusinessPermits(
  moduleData: Record<string, any> | undefined | null,
): BusinessPermitEntry[] {
  const raw = moduleData?.businessPermits;
  if (!Array.isArray(raw) || raw.length === 0) return emptyBusinessPermits();
  const entries: BusinessPermitEntry[] = raw
    .slice(0, BUSINESS_PERMIT_YEARS_REQUIRED)
    .map((e: any) => ({
      year: String(e?.year ?? ""),
      document: e?.document ?? null,
    }));
  while (entries.length < BUSINESS_PERMIT_YEARS_REQUIRED) {
    entries.push({ year: "", document: null });
  }
  return entries;
}

/**
 * Returns an error message when the permit set is incomplete or the years
 * are not consecutive (e.g. 2023, 2024, 2025); null when valid.
 */
export function validateBusinessPermits(
  entries: BusinessPermitEntry[],
): string | null {
  if (entries.length < BUSINESS_PERMIT_YEARS_REQUIRED) {
    return `Business permits for the last ${BUSINESS_PERMIT_YEARS_REQUIRED} years are required.`;
  }
  const years: number[] = [];
  for (const entry of entries) {
    if (!entry.document) {
      return "Please upload all three business permits (one per year).";
    }
    const year = Number(entry.year);
    if (!entry.year || !Number.isInteger(year) || year < 1900 || year > 2100) {
      return "Please enter a valid year for each business permit.";
    }
    years.push(year);
  }
  if (new Set(years).size !== years.length) {
    return "Business permit years must not repeat.";
  }
  const sorted = [...years].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      return "Business permit years must be consecutive (e.g. 2023, 2024, 2025).";
    }
  }
  return null;
}

export function businessPermitsComplete(
  moduleData: Record<string, any> | undefined | null,
): boolean {
  return validateBusinessPermits(loadBusinessPermits(moduleData)) === null;
}
