/**
 * Author: Yzrel Jade B. Eborde
 */

import { normalizePrioritySector } from "../constants/setupBrochure";

/**
 * SETUP priority sectors treated as "food sector" — these require an FDA
 * License to Operate number (enterprise profile) and FDA certificate upload
 * (submit requirements).
 */
export const FOOD_SECTORS: string[] = [
  "Food processing",
  "Beverage manufacturing",
];

export function isFoodSector(
  businessSector: string | undefined | null,
): boolean {
  if (!businessSector) return false;
  const normalized = normalizePrioritySector(businessSector);
  return FOOD_SECTORS.includes(normalized);
}
