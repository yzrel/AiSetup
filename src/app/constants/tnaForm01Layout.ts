/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST SETUP TNA Form 01 (Annex B-11) layout constants.
 */

import { DOST_REGION_12_OFFICE } from "./region12";

export const TNA_FORM_01_TITLE =
  "DOST TNA FORM 01 - APPLICATION FOR TECHNOLOGY NEEDS ASSESSMENT";
export const TNA_FORM_01_SUBTITLE = "DOST TNA Form 01";
export const TNA_FORM_01_FOOTER_PREFIX =
  "SETUP Guidelines – Annex B-11 - DOST TNA Form 01";
export const TNA_FORM_01_TOTAL_PAGES = 14;

export const TNA_FORM_01_REGIONAL_OFFICE = DOST_REGION_12_OFFICE;
export const TNA_FORM_01_REGIONAL_SHORT = "DOST XII";

export function tnaForm01Footer(page: number, total = TNA_FORM_01_TOTAL_PAGES): string {
  return `${TNA_FORM_01_FOOTER_PREFIX} — Page ${page} of ${total}`;
}

/** Verbatim General Agreements (Annex B-11) with regional placeholders filled for Region XII */
export const TNA_FORM_01_GENERAL_AGREEMENTS = [
  `The applicant shall, at the earliest opportunity, make available to the ${TNA_FORM_01_REGIONAL_OFFICE} (${TNA_FORM_01_REGIONAL_SHORT}) all information (manuals, procedures, etc.) required to establish the technology status of the selected core business functions and management systems;`,
  `If ${TNA_FORM_01_REGIONAL_SHORT} is not satisfied that all the requirements for business registration are complied with, it shall inform the applicant of the observed deficiencies before starting the assessment;`,
  `When the required inputs to the assessment are already supplied by the applicant, including Attachment A, the ${TNA_FORM_01_REGIONAL_SHORT} will assess the firm through the core business functions and management systems, whichever is applicable, to identify technology needs and verify compliance to standards vis-à-vis existing practices;`,
  `When the ${TNA_FORM_01_REGIONAL_SHORT} has completed the technology assessment, a report will be prepared on the results of the assessment with accompanying recommendations and opportunities for improvement. The report prepared will define the scope of activities, functions, management practices and locations assessed. The applicant shall not claim or otherwise imply that the report applies to other locations, product or activities not covered by the report;`,
  `The applicant agrees that the report will not be used until permission has been granted by the ${TNA_FORM_01_REGIONAL_SHORT};`,
  `The applicant agrees that the receipt or acknowledgment of the report ends the assessment stage; any technical assistance ensuing from the recommendations of the report will be viewed as a separate project.`,
] as const;

export const TNA_FORM_01_UNDERTAKING = `I agree to undertake and observe the above General Agreements as stipulated by the ${TNA_FORM_01_REGIONAL_OFFICE}.`;

export const TNA_FORM_01_RAW_MATERIAL_COLUMNS = [
  "Raw Material",
  "Source",
  "Unit Cost (₱)",
  "Volume Used/Year",
] as const;

export const TNA_FORM_01_PRODUCTION_COLUMNS = [
  "Product",
  "Volume of Production/Year",
  "Unit Cost of Production (₱)",
  "Annual Cost of Production (₱)",
] as const;

export const TNA_FORM_01_EQUIPMENT_COLUMNS = [
  "Type of Equipment",
  "Specifications",
  "Capacity",
  "No. of Units",
  "Year Acquired",
] as const;

export const TNA_FORM_01_BUSINESS_ACTIVITIES = [
  { id: "food", label: "Food processing", hint: "(please specify specific commodity)" },
  { id: "furniture", label: "Furniture", hint: "(please specify specific commodity)" },
  { id: "gifts", label: "Gifts, decors, handicrafts", hint: "(please specify commodity)" },
  { id: "metals", label: "Metals and engineering", hint: "(please specify specific commodity)" },
  { id: "agri", label: "Agriculture/Marine/Aquaculture", hint: "(please specify specific commodity)" },
  { id: "others", label: "Others, please specify", hint: "" },
] as const;

export const TNA_FORM_01_ORGANIZATION_TYPES = [
  "Single proprietorship",
  "Cooperative",
  "Partnership",
  "Corporation",
] as const;

export const TNA_FORM_01_PROFIT_TYPES = ["Profit", "Non-profit"] as const;

export const TNA_FORM_01_CAPITAL_CLASSES = [
  { id: "micro", label: "Micro (less than 1.5 M)" },
  { id: "small", label: "Small (1.5 – 15 M)" },
  { id: "medium", label: "Medium (15 – 100 M)" },
] as const;

export const TNA_FORM_01_EMPLOYMENT_CLASSES = [
  { id: "micro", label: "Micro (1 – 9)" },
  { id: "small", label: "Small (10 – 99)" },
  { id: "medium", label: "Medium (100 – 199)" },
] as const;

export const TNA_FORM_01_PACKAGING_ROWS = [
  { key: "packNutrition", remarksKey: "packNutritionRemarks", label: "Nutrition Evaluation" },
  { key: "packBarcode", remarksKey: "packBarcodeRemarks", label: "Bar Code" },
  { key: "packLabel", remarksKey: "packLabelRemarks", label: "Product Label" },
  { key: "packExpiry", remarksKey: "packExpiryRemarks", label: "Expiry Date" },
] as const;

export const TNA_FORM_01_EMPLOYEE_ROWS = [
  { label: "Direct Workers", maleKey: "employeesMale", femaleKey: "employeesFemale" },
  { label: "Production", maleKey: null, femaleKey: null },
  { label: "Non-production", maleKey: null, femaleKey: null },
  {
    label: "Indirect/Contract Workers",
    maleKey: "employeesIndirect",
    femaleKey: "employeesContract",
  },
] as const;

/** Map wizard MSME capital class to official checkbox id */
export function mapCapitalClassToOfficial(value: string): string | null {
  const v = value.toLowerCase();
  if (v.includes("micro")) return "micro";
  if (v.includes("small")) return "small";
  if (v.includes("medium")) return "medium";
  return null;
}

/** Map wizard employment class to official checkbox id */
export function mapEmploymentClassToOfficial(value: string): string | null {
  const v = value.toLowerCase();
  if (v.includes("micro")) return "micro";
  if (v.includes("small")) return "small";
  if (v.includes("medium")) return "medium";
  return null;
}

/** Derive business activity checkbox from sector + commodity */
export function deriveBusinessActivity(
  sector: string,
  commodity: string,
): (typeof TNA_FORM_01_BUSINESS_ACTIVITIES)[number]["id"] {
  const combined = `${sector} ${commodity}`.toLowerCase();
  if (
    combined.includes("food") ||
    combined.includes("processing") ||
    combined.includes("bakery") ||
    combined.includes("cassava")
  ) {
    return "food";
  }
  if (combined.includes("furniture") || combined.includes("wood")) return "furniture";
  if (
    combined.includes("gift") ||
    combined.includes("decor") ||
    combined.includes("handicraft")
  ) {
    return "gifts";
  }
  if (
    combined.includes("metal") ||
    combined.includes("engineering") ||
    combined.includes("fabricat")
  ) {
    return "metals";
  }
  if (
    combined.includes("agri") ||
    combined.includes("marine") ||
    combined.includes("aqua") ||
    combined.includes("fisher") ||
    combined.includes("farm")
  ) {
    return "agri";
  }
  return "others";
}

/** Map organization type string to official checkbox */
export function mapOrganizationType(value: string): {
  org: string | null;
  profit: string | null;
} {
  const v = value.toLowerCase();
  let org: string | null = null;
  if (v.includes("sole") || v.includes("proprietor") || v.includes("dti")) {
    org = "Single proprietorship";
  } else if (v.includes("cooperative") || v.includes("cda")) {
    org = "Cooperative";
  } else if (v.includes("partnership")) {
    org = "Partnership";
  } else if (v.includes("corporation") || v.includes("corp")) {
    org = "Corporation";
  }
  const profit = v.includes("non-profit") || v.includes("nonprofit") ? "Non-profit" : "Profit";
  return { org, profit };
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).trim();
}

export function formatDisplayDate(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
