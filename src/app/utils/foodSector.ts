/**
 * Author: Yzrel Jade B. Eborde
 */

/**
 * SETUP priority sectors treated as "food sector" — these require an FDA
 * License to Operate number (enterprise profile) and FDA certificate upload
 * (submit requirements).
 */
export const FOOD_SECTORS: string[] = ["Food Processing"];

export function isFoodSector(
  businessSector: string | undefined | null,
): boolean {
  return !!businessSector && FOOD_SECTORS.includes(businessSector);
}
