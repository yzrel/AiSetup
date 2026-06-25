/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST SETUP TNA Form 02 printable layout constants.
 */

export { displayValue, formatDisplayDate } from "./tnaForm01Layout";

export const TNA_FORM_02_TITLE =
  "DOST TNA FORM 02 - TECHNOLOGY NEEDS ASSESSMENT REPORT";

export const TNA_FORM_02_FOOTER_PREFIX =
  "SETUP Guidelines – Annex B-12 - DOST TNA Form 02";

export const TNA_FORM_02_SECTION_ENTERPRISE = "I. Enterprise Profile";
export const TNA_FORM_02_SECTION_SITE_VALIDATION = "II. Site Validation Findings";
export const TNA_FORM_02_SECTION_PRODUCTION = "III. Production Process Analysis";
export const TNA_FORM_02_SECTION_TECHNOLOGY_GAPS = "IV. Technology Gap Analysis";
export const TNA_FORM_02_SECTION_INTERVENTIONS = "V. Proposed Technology Intervention";
export const TNA_FORM_02_SECTION_EQUIPMENT = "VI. Recommended Equipment List";
export const TNA_FORM_02_SECTION_PRODUCTIVITY = "VII. Expected Productivity Improvement";

export const TNA_FORM_02_EQUIPMENT_COLUMNS = [
  "No.",
  "Equipment",
  "Specifications",
  "Qty",
  "Est. Cost (PhP)",
  "Priority",
] as const;

export const TNA_FORM_02_KPI_COLUMNS = [
  "Indicator",
  "Before",
  "After",
  "Change",
] as const;

export function tnaForm02Footer(page: number, total: number): string {
  return `${TNA_FORM_02_FOOTER_PREFIX} — Page ${page} of ${total}`;
}
