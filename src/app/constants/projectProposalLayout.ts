/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST SETUP Form 001 (Annex A-1) printable layout constants.
 */

export { displayValue, formatDisplayDate } from "./tnaForm01Layout";

export const PROJECT_PROPOSAL_TITLE = "SETUP Form 001 - Project Proposal Format";

export const PROJECT_PROPOSAL_EFFECTIVITY = "Effectivity: 2025";

export const PROJECT_PROPOSAL_FOOTER_PREFIX =
  "SETUP Guidelines (Revision 3.0) Annex A – 1 - SETUP Form 001 (SETUP Project Proposal Format)";

export const PP_SECTION_PROJECT_BACKGROUND = "PROJECT BACKGROUND:";
export const PP_SECTION_MARKETING = "MARKETING ASPECTS";
export const PP_SECTION_TECHNOLOGICAL = "TECHNOLOGICAL ASPECTS";
export const PP_SECTION_FINANCIAL = "FINANCIAL ASPECT";
export const PP_SECTION_RISK = "RISK MANAGEMENT";
export const PP_SECTION_WASTE = "WASTE MANAGEMENT/DISPOSAL";

export const PP_ORGANIZATION_TYPES = [
  "Single Proprietorship",
  "Partnership",
  "Cooperative",
  "Corporation",
] as const;

export const PP_PROFIT_TYPES = ["Profit", "Non-Profit"] as const;

export const PP_MSME_SIZES = [
  "Micro (P3M Total Asset Value or less)",
  "Small (P3,000,001 – P15M Total Asset Value)",
  "Medium (P15,000,001 – P100M Total Asset Value)",
] as const;

export const PP_REGISTRATION_OFFICES = ["DTI", "SEC", "CDA", "Others, please specify:"] as const;

/** Business activities in official 2-column grid order (left column, then right column per row). */
export const PP_BUSINESS_ACTIVITY_PAIRS: readonly [string, string][] = [
  [
    "Crop and animal production, hunting, and related service activities",
    "Chemicals and chemical products manufacturing",
  ],
  [
    "Forestry and Logging",
    "Basic pharmaceutical products and pharmaceutical preparations manufacturing",
  ],
  [
    "Fishing and Aquaculture",
    "Rubber and plastic products manufacturing",
  ],
  ["Food processing", "Non-metallic mineral products manufacturing"],
  ["Beverage manufacturing", "Fabricated metal products manufacturing"],
  [
    "Textile manufacturing",
    "Machinery and equipment, Not Elsewhere Classified (NEC) manufacturing",
  ],
  [
    "Wearing apparel manufacturing",
    "Other transport equipment manufacturing",
  ],
  [
    "Leather and related products manufacturing",
    "Furniture manufacturing",
  ],
  [
    "Wood and products of wood and cork manufacturing",
    "Information and Communication",
  ],
  [
    "Paper and paper products manufacturing",
    "Other regional priority industries approved by the Regional Development Council, please specify:",
  ],
];

export const PP_EXPECTED_OUTPUT_HEADINGS = [
  "Percentage increase in productivity",
  "Improved quality of product/s",
  "Contribution to the production line/process",
  "Percentage decrease in rejects",
  "Additional clients",
  "Others (please specify)",
] as const;

export const PP_RAW_MATERIAL_COLUMNS = [
  "Raw Materials",
  "Volume Used in a Year",
  "Sources of Raw Materials",
] as const;

export const PP_PRODUCT_PRICE_COLUMNS = ["PRODUCTS OFFERED", "PRICE PER UNIT"] as const;

export const PP_EQUIPMENT_COLUMNS = [
  "Type of Equipment",
  "No. of Units",
  "Year Acquired",
] as const;

export const PP_INTERVENTION_COLUMNS = [
  "Process/ Existing Practice/ Problem",
  "Proposed S&T Intervention",
  "Proposed S&T intervention-related equipment / skills upgrading",
  "Impact",
] as const;

export const PP_INTERVENTION_COST_COLUMNS = [
  "S&T Intervention-related equipment/specification",
  "Qty",
  "Unit Cost",
  "Total Cost",
] as const;

export const PP_FABRICATOR_COLUMNS = ["Name", "Address", "Contact No."] as const;

export const PP_LIQUIDITY_COLUMNS = [
  "YEAR",
  "CURRENT ASSET",
  "CURRENT LIABILITIES",
  "CURRENT RATIO (Current Assets / Current Liabilities)",
] as const;

export const PP_QUICK_RATIO_COLUMNS = [
  "YEAR",
  "CURRENT ASSET",
  "INVENTORY",
  "CURRENT LIABILITIES",
  "QUICK RATIO (Current Assets – Inventory) / Current Liabilities",
] as const;

export const PP_ROI_COLUMNS = [
  "YEAR",
  "NET PROFIT",
  "COST OF INVESTMENT",
  "ROI (%)",
] as const;

export const PP_BUDGET_COLUMNS = [
  "Item of Expenditure",
  "Qty",
  "Unit Cost",
  "Cost",
  "SETUP",
  "Cooperator",
  "Total",
] as const;

export const PP_RISK_COLUMNS = ["RISKS", "ASSUMPTIONS", "RISK MANAGEMENT PLAN"] as const;

export const PP_REFUND_NOTE =
  "(Note: Refund schedule shall be within a period of three (3) to five (5) years depending on the nature/amount of project.)";

export const PP_BUDGET_NOTE =
  "(note: cost-sharing of an item is not allowed due to issue on ownership)";

export const PP_RISK_FOOTNOTE = [
  "Note: Risk – refers to an uncertain event or condition that its occurrence has a negative effect on the project.",
  "Assumption – refers to an event or circumstance that its occurrence will lead to the success of the project.",
  "Risk Management Plan – proposed activities to address the risks and assumptions.",
] as const;

export const PP_FINANCIAL_ATTACH_NOTE = "(Please refer to the attached financial reports)";

export function projectProposalFooter(page: number, total: number): string {
  return `${PROJECT_PROPOSAL_FOOTER_PREFIX} Page ${page} of ${total}`;
}

/** Case-insensitive match for free-text form fields against official checkbox labels. */
export function isOptionChecked(stored: string, option: string): boolean {
  const s = stored.trim().toLowerCase();
  const o = option.trim().toLowerCase();
  if (!s || !o) return false;
  if (s === o) return true;
  if (s.includes(o) || o.includes(s)) return true;
  const short = o.split("(")[0].trim();
  if (short.length > 3 && (s.includes(short) || short.includes(s))) return true;
  return false;
}

export function formatCurrencyDisplay(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (/^php\s/i.test(raw) || /^₱/.test(raw)) return raw;
  const num = parseFloat(raw.replace(/[^\d.]/g, ""));
  if (Number.isNaN(num)) return raw;
  return `Php ${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
