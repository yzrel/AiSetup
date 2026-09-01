/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST SETUP Form 001 (Annex A-1) printable layout constants.
 */

export { displayValue, formatDisplayDate } from "./tnaForm01Layout";

export const PROJECT_PROPOSAL_TITLE = "SETUP Form 001 - Project Proposal Format";

/** Left-indent wrappers so heading and body share the same inset (do not nest these). */
export const PP_FORM_INDENT_CLASS = {
  1: "pp-form-indent-1",
  2: "pp-form-indent-2",
  3: "pp-form-indent-3",
} as const;

export const PP_FORM_INDENT_IN = {
  1: "0.5in",
  2: "0.75in",
  3: "1in",
} as const;

export const PROJECT_PROPOSAL_EFFECTIVITY = "Effectivity: 2025";

export const PROJECT_PROPOSAL_FOOTER_PREFIX =
  "SETUP Guidelines (Revision 3.0) Annex A-1: SETUP Form 001 - SETUP Project Proposal";

export const PP_SECTION_PROJECT_BACKGROUND = "PROJECT BACKGROUND:";
export const PP_SECTION_MARKETING = "MARKETING ASPECTS";
export const PP_SECTION_TECHNOLOGICAL = "TECHNOLOGICAL ASPECTS";
export const PP_SECTION_FINANCIAL = "FINANCIAL ASPECT";
export const PP_SECTION_RISK = "RISK MANAGEMENT";
export const PP_SECTION_WASTE = "WASTE MANAGEMENT/DISPOSAL";

export const PP_SUBHEADING_CAPACITY =
  "Capacity, volume and cost of production";

export const PP_MARKETING_SUBHEADINGS = {
  A: "A. Market Situation, product demand and supply",
  B: "B. Product specifications and product price",
  C: "C. Distribution channel (local/export)",
  D: "D. Competitors",
  E: "E. Existing problems (if any)",
  F: "F. Market plans/strategies",
} as const;

export const PP_MARKETING_A_LABELS = {
  marketSituation: "Market Situation",
  productDemand: "Product demand",
  volumeOfOrders: "Volume of orders",
} as const;

export const PP_VOLUME_OF_ORDERS_COLUMNS = [
  "Name of company",
  "Address",
  "Volume of orders",
] as const;

export const PP_COMPETITORS_COLUMNS = ["List", "Address"] as const;

export const PP_VOLUME_OF_ORDERS_SAMPLE_ROWS: string[][] = [
  [
    "Koronadal City Local Government",
    "City Hall Complex, Koronadal City, South Cotabato",
    "24,000 impressions/year",
  ],
  [
    "Notre Dame of Marbel University",
    "Alunan Avenue, Koronadal City, South Cotabato",
    "18,000 copies/year",
  ],
  [
    "SOCSKSARGEN MSME accounts (receipts, labels, tarpaulins)",
    "South Cotabato / General Santos City",
    "15,600 jobs/year",
  ],
];

/** Food-processing demo seeds (not the printshop Form 001 sample). */
export const PP_VOLUME_OF_ORDERS_FOOD_SAMPLE_ROWS: string[][] = [
  ["Gensan Fresh Mart", "Pioneer Ave., General Santos City", "2,400 kg/year"],
  [
    "Koronadal Public Market stallholders",
    "Koronadal City, South Cotabato",
    "1,800 kg/year",
  ],
  [
    "SOCSKSARGEN institutional buyer",
    "Kidapawan City, Cotabato",
    "960 kg/year",
  ],
];

/** Company-profile employment table. Production / Non-Production are Direct Workers sub-rows. */
export const PP_EMPLOYEE_TABLE_CAPTION =
  "Number of Employee (Please indicate number of employee)";

export const PP_EMPLOYEE_ROWS = [
  { label: "Direct Workers", indent: false },
  { label: "Production", indent: true },
  { label: "Non-Production", indent: true },
  { label: "Indirect/Contract Workers", indent: false },
  { label: "Total", indent: false },
] as const;

export const PP_WASTE_SUBHEADINGS = {
  A: "A. Volume of waste generated monthly",
  B: "B. Kinds of wastes (plastics, paper, metals, chemicals, pollutants, etc.)",
  C: "C. Methods of disposal",
} as const;

export const PP_PRODUCTION_DASH_ITEMS = [
  "Process Flow of Production",
  "Material Balance",
] as const;

export const PP_FINANCIAL_CAPACITY_DASH_ITEMS = [
  "Financial ratio and analysis",
  "Partial budget analysis",
  "Net profit margin ratio",
  "Liquidity ratio",
  "ROI",
] as const;

export const PP_FINANCIAL_SUBHEADINGS = {
  A: "A. Financial capacity",
  B: "B. Financial constraints",
  C: "C. Cash flow/ financial statement/ balance sheet",
  D: "D. Budgetary Requirement for the proposed project",
  E: "E. Proposed Refund Schedule",
} as const;

export const PP_IDA_ROI_CAPTION = "Return on Investment";
export const PP_IDA_COLUMNS = ["Year", "Annual Income"] as const;
export const PP_IDA_ASSET_LIFE_LABEL = "Divided by: Average Asset's Life";
export const PP_IDA_PROJECT_COST_LABEL = "Divided by total project cost";

export const PP_ORGANIZATION_INSTRUCTION =
  "Type of Organization (please check appropriate box in each row)";

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
  "Medium (P15,000,001 – P150M Total Asset Value)",
] as const;

export const PP_REGISTRATION_OFFICES = [
  "DTI",
  "SEC",
  "CDA",
  "LGU",
  "Others, please specify:",
] as const;

export const PP_KNOWN_REGISTRATION_OFFICES = PP_REGISTRATION_OFFICES.filter(
  (office) => !office.startsWith("Others"),
);

/** Official Form 001 Company Profile table grid (Word tblGrid). */
export const PP_COMPANY_PROFILE_COLUMN_COUNT = 9;
export const PP_ORG_NONPROFIT_COLSPAN = 5;
export const PP_ORG_MEDIUM_COLSPAN = 3;

export { PP_BUSINESS_ACTIVITY_PAIRS } from "./prioritySectors";

export const PP_EXPECTED_OUTPUT_HEADINGS = [
  "Percentage increase in productivity",
  "Improved quality of product/s",
  "Contribution to the production line/process",
  "Percentage decrease in rejects",
  "Additional clients",
  "Others (please specify)",
] as const;

export const PP_COMPENSATION_COLUMNS = [
  "Particulars",
  "# of workers",
  "Daily Rate",
  "Days",
  "Weekly",
  "Monthly Salary",
  "Annually",
] as const;

export const PP_RAW_MATERIAL_COST_COLUMNS = [
  "Particulars",
  "Qty",
  "UOM",
  "Unit Cost",
  "Total Cost per batch",
  "# of batches",
  "Weekly",
  "Monthly",
  "Annually",
  "Source/Supplier",
] as const;

export const PP_RAW_MATERIAL_ALLOCATION_COLUMNS = [
  "Particulars",
  "Ratio",
  "Weekly",
] as const;

export const PP_RAW_MATERIAL_COLUMNS = [
  "Raw Materials",
  "Volume Used in a Year",
  "Sources of Raw Materials",
] as const;

export const PP_PRODUCT_PRICE_COLUMNS = ["PRODUCTS OFFERED", "PRICE PER UNIT"] as const;

export const PP_EQUIPMENT_COLUMNS = [
  "Particulars",
  "Year acquired",
  "Acquisition cost",
  "Qty",
  "Total cost",
  "EUL",
  "Annual depreciation",
  "RUL",
  "Book Value",
] as const;

/** Enterable cells only; Total cost / Annual depreciation / Book Value are computed on merge. */
export const PP_EQUIPMENT_SAMPLE_ROWS: string[][] = [
  ["Tray dehydrator", "2018", "85000", "2", "", "10", "", "4", ""],
  ["Impulse sealer", "2020", "12000", "3", "", "8", "", "4", ""],
  ["Stainless work table", "2019", "18000", "2", "", "15", "", "10", ""],
];

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

export const PP_SCHEDULE_ACTIVITY_COLUMN = "Activity";
export const PP_SCHEDULE_MONTHS = [
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M6",
  "M7",
  "M8",
] as const;
/** Visual week cells per month on the print/preview Gantt (not separately editable). */
export const PP_SCHEDULE_WEEKS_PER_MONTH = 4;

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

export const PP_NPM_COLUMNS = [
  "YEAR",
  "NET PROFIT",
  "SALES",
  "NPM (%)",
] as const;

export const PP_BUDGET_COLUMNS = [
  "Item of Expenditure",
  "Qty",
  "Unit Cost",
  "Cost",
  "SETUP",
  "LGIA",
  "Cooperator",
  "Total",
] as const;

export const PP_RISK_COLUMNS = [
  "OBJECTIVES",
  "RISKS AND ASSUMPTIONS",
  "RISK MANAGEMENT PLAN",
] as const;

export const PP_REFUND_NOTE =
  "(Note: Refund schedule shall be within a period of three (3) to five (5) years depending on the nature/cost of the project.)";

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

const OPTION_ALIASES: Record<string, readonly string[]> = {
  "single proprietorship": ["sole proprietorship", "sole prop"],
  "non-profit": ["nonprofit", "non profit", "not-for-profit", "not for profit"],
  profit: ["for-profit", "for profit"],
};

const NONPROFIT_HINTS = [
  "non-profit",
  "nonprofit",
  "non profit",
  "not-for-profit",
  "not for profit",
] as const;

function normalizeOptionText(value: string): string {
  return value.trim().toLowerCase().replace(/[–—]/g, "-");
}

function optionTokens(value: string): string[] {
  const raw = normalizeOptionText(value)
    .split(/[\s,;/]+/)
    .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, ""))
    .filter((token) => token.length > 0);
  const merged: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "non" && raw[i + 1] === "profit") {
      merged.push("non-profit");
      i += 1;
      continue;
    }
    merged.push(raw[i]);
  }
  return merged;
}

function containsTokenSequence(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0) return false;
  if (needle.length === 1) return haystack.includes(needle[0]);
  return haystack.join(" ").includes(needle.join(" "));
}

/** Case-insensitive match for free-text form fields against official checkbox labels. */
export function isOptionChecked(stored: string, option: string): boolean {
  const s = normalizeOptionText(stored);
  const o = normalizeOptionText(option);
  if (!s || !o) return false;
  if (s === o) return true;

  const short = o.split("(")[0].trim();
  if (short === "profit" && NONPROFIT_HINTS.some((hint) => s.includes(hint))) {
    return false;
  }

  const needles = [
    o,
    short,
    ...(OPTION_ALIASES[short] ?? []),
    ...(OPTION_ALIASES[o] ?? []),
  ]
    .map((needle) => needle.trim())
    .filter((needle) => needle.length > 1);

  const storedTokens = optionTokens(s);
  for (const needle of new Set(needles)) {
    if (s === needle) return true;
    if (containsTokenSequence(storedTokens, optionTokens(needle))) return true;
  }
  return false;
}

export function isKnownRegistrationOffice(stored: string): boolean {
  return PP_KNOWN_REGISTRATION_OFFICES.some((office) =>
    isOptionChecked(stored, office),
  );
}

export function isRegistrationOfficeChecked(
  stored: string,
  office: string,
): boolean {
  if (office.startsWith("Others")) {
    return Boolean(stored.trim()) && !isKnownRegistrationOffice(stored);
  }
  return isOptionChecked(stored, office);
}

export type CompanyProfileEmployeeTotals = {
  directMale: number;
  directFemale: number;
  directTotal: number;
  productionMale: number;
  productionFemale: number;
  productionTotal: number;
  nonProductionMale: number;
  nonProductionFemale: number;
  nonProductionTotal: number;
  indirectMale: number;
  indirectFemale: number;
  indirectTotal: number;
  totalMale: number;
  totalFemale: number;
  total: number;
};

function hasHeadcount(...values: Array<string | undefined>): boolean {
  return values.some((v) => String(v ?? "").trim() !== "");
}

function parseHeadcount(value: string | undefined): number {
  const parsed = parseInt(String(value ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Print totals from Production / Non-Production / Indirect. Direct Workers row stays blank. */
export function companyProfileEmployeeTotals(form: {
  employeesMale?: string;
  employeesFemale?: string;
  employeesProductionMale?: string;
  employeesProductionFemale?: string;
  employeesNonProductionMale?: string;
  employeesNonProductionFemale?: string;
  employeesIndirect?: string;
  employeesIndirectMale?: string;
  employeesIndirectFemale?: string;
}): CompanyProfileEmployeeTotals {
  const productionFilled = hasHeadcount(
    form.employeesProductionMale,
    form.employeesProductionFemale,
  );
  const productionMale = productionFilled
    ? parseHeadcount(form.employeesProductionMale)
    : parseHeadcount(form.employeesMale);
  const productionFemale = productionFilled
    ? parseHeadcount(form.employeesProductionFemale)
    : parseHeadcount(form.employeesFemale);
  const nonProductionMale = parseHeadcount(form.employeesNonProductionMale);
  const nonProductionFemale = parseHeadcount(form.employeesNonProductionFemale);
  const indirectMale = parseHeadcount(form.employeesIndirectMale);
  const indirectFemale = parseHeadcount(form.employeesIndirectFemale);
  const indirectTotal =
    indirectMale + indirectFemale || parseHeadcount(form.employeesIndirect);
  const productionTotal = productionMale + productionFemale;
  const nonProductionTotal = nonProductionMale + nonProductionFemale;
  return {
    directMale: 0,
    directFemale: 0,
    directTotal: 0,
    productionMale,
    productionFemale,
    productionTotal,
    nonProductionMale,
    nonProductionFemale,
    nonProductionTotal,
    indirectMale,
    indirectFemale,
    indirectTotal,
    totalMale: productionMale + nonProductionMale + indirectMale,
    totalFemale: productionFemale + nonProductionFemale + indirectFemale,
    total: productionTotal + nonProductionTotal + indirectTotal,
  };
}

export function formatCurrencyDisplay(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (/^php\s/i.test(raw) || /^₱/.test(raw)) return raw;
  const num = parseFloat(raw.replace(/[^\d.]/g, ""));
  if (Number.isNaN(num)) return raw;
  return `Php ${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAssetClassificationPart(
  assetSize?: string,
  classificationRange?: string,
): string {
  const range = String(classificationRange ?? "").trim();
  const asset = String(assetSize ?? "").trim();
  const formattedAsset = asset ? formatCurrencyDisplay(asset) : "";
  if (range && formattedAsset) return `${range} (${formattedAsset})`;
  if (range) return range;
  if (formattedAsset) return formattedAsset;
  return "";
}

function formatEmployeeCountPart(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return "";
  return `${total} employee${total === 1 ? "" : "s"}`;
}

/** Company Profile MSME Size = size category + asset/classification range + employee count. */
export function formatCompanyProfileMsmeSize(input: {
  assetSize?: string;
  classificationRange?: string;
  employeeTotal?: number;
  /** Micro / Small / Medium from prescreening. */
  msmeSize?: string;
}): string {
  const sizePart = String(input.msmeSize ?? "").trim();
  const assetPart = formatAssetClassificationPart(
    input.assetSize,
    input.classificationRange,
  );
  const employeePart = formatEmployeeCountPart(input.employeeTotal ?? 0);
  return [sizePart, assetPart, employeePart].filter(Boolean).join(" · ");
}

export function companyProfileMsmeSizeLabel(form: {
  assetSize?: string;
  classificationRange?: string;
  msmeSize?: string;
  numberOfEmployees?: string;
  employeesMale?: string;
  employeesFemale?: string;
  employeesProductionMale?: string;
  employeesProductionFemale?: string;
  employeesNonProductionMale?: string;
  employeesNonProductionFemale?: string;
  employeesIndirect?: string;
  employeesIndirectMale?: string;
  employeesIndirectFemale?: string;
}): string {
  const { total } = companyProfileEmployeeTotals(form);
  const prescreeningTotal = parseInt(String(form.numberOfEmployees ?? "").trim(), 10);
  const employeeTotal =
    total > 0
      ? total
      : Number.isFinite(prescreeningTotal) && prescreeningTotal > 0
        ? prescreeningTotal
        : 0;
  return formatCompanyProfileMsmeSize({
    assetSize: form.assetSize,
    classificationRange: form.classificationRange,
    employeeTotal,
    msmeSize: form.msmeSize,
  });
}
