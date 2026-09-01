/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 002 — RTEC Report (Annex A-2) layout constants.
 * Source: Form 002 - RTEC Report.docx — SETUP Guidelines (Revision 3.0).
 * Word is the only layout source — do not import Form 001 table/checkbox grids.
 */

/** A4, Word Section 2 / Form 001 / Inventory convention: 1 in = 25.4 mm all sides. */
export const RTEC_PAGE_MARGIN_IN = 1;
export const RTEC_PAGE_MARGIN_MM = 25.4;

export const RTEC_REPORT_TITLE = "SETUP Form 002 - RTEC Report";

export const RTEC_REPORT_FOOTER_PREFIX =
  "SETUP Guidelines (Revision 3.0) Annex A-2: SETUP Form 002 - RTEC Report";

export const RTEC_SECTION_I = "I. Brief description of the project";
export const RTEC_SECTION_II = "II. Compliance of Requirements";
export const RTEC_SECTION_III = "III. Highlights of Evaluation";
export const RTEC_SECTION_IV =
  "IV. Recommendation (addressing the findings of TNA)";

export const RTEC_SUBSECTION_COMPANY = "a. Company profile";
export const RTEC_SUBSECTION_OBJECTIVES = "b. Objectives";
export const RTEC_SUBSECTION_EXPECTED =
  "c. Expected Outputs / Impact/s of S&T intervention";
export const RTEC_SUBSECTION_MANAGEMENT = "a. Management/Administrative Aspect";
export const RTEC_SUBSECTION_TECHNICAL =
  "b. Technical Aspect (including the recommended DOST S&T Intervention)";
export const RTEC_SUBSECTION_MARKETING = "c. Marketing Aspect";
export const RTEC_SUBSECTION_FINANCIAL =
  "d. Financial Aspect (including financial ratio and analysis; net profit margin ratio; liquidity ratio; ROI; balance sheet, partial budget analysis, detailed line-item budget and refund schedule)";
export const RTEC_SUBSECTION_WASTE = "e. Waste Disposal";
export const RTEC_SUBSECTION_RISK = "f. Risk Management";

export const RTEC_TECH_PRODUCTION_PROCESS = "1. Production Process";
export const RTEC_TECH_PROCESS_FLOW = "a. Process Flow of Production";
export const RTEC_TECH_MATERIAL_BALANCE = "b. Material Balance";
export const RTEC_TECH_EXISTING_EQUIPMENT = "2. Existing Production Equipment";
export const RTEC_TECH_CONSTRAINTS =
  "3. Technical constraints on the production line and proposed S&T intervention";
export const RTEC_TECH_PLANT_LAYOUT = "Proposed Plant Lay-out";
export const RTEC_TECH_INTERVENTION_COST =
  "4. Cost and specification of S&T Intervention Related Equipment";
export const RTEC_TECH_FABRICATORS =
  "5. List of equipment fabricators (name and address)";

/** Word compliance table: Requirements | Complied | Not Complied (no N/A). */
export const RTEC_COMPLIANCE_COLUMNS = [
  "Requirements",
  "Complied",
  "Not Complied",
] as const;

/** Word tblGrid twips for compliance table. Sum = 9875. */
export const RTEC_COMPLIANCE_GRID_TWIPS = [7433, 1096, 1346] as const;

/** Word constraint table columns. */
export const RTEC_CONSTRAINT_COLUMNS = [
  "Process/ Existing Practice/Problem",
  "Proposed S&T Intervention",
  "Proposed S&T intervention-related equipment/ skills upgrading",
  "Impact",
] as const;

/** Word tblGrid twips for constraint table. Sum = 8801. */
export const RTEC_CONSTRAINT_GRID_TWIPS = [1716, 2062, 3168, 1855] as const;

/** Word intervention equipment cost columns. */
export const RTEC_COST_COLUMNS = [
  "S&T Intervention-related equipment/specification",
  "Qty",
  "Unit Cost",
  "Total Cost",
] as const;

/** Word tblGrid twips for cost table. Sum = 8782. */
export const RTEC_COST_GRID_TWIPS = [4144, 1182, 1259, 2197] as const;

const pct = (twips: readonly number[]) => {
  const sum = twips.reduce((a, b) => a + b, 0);
  return twips.map((w) => `${((w / sum) * 100).toFixed(2)}%`);
};

export const RTEC_COMPLIANCE_WIDTH_PCT = pct(RTEC_COMPLIANCE_GRID_TWIPS) as [
  string,
  string,
  string,
];
export const RTEC_CONSTRAINT_WIDTH_PCT = pct(RTEC_CONSTRAINT_GRID_TWIPS) as [
  string,
  string,
  string,
  string,
];
export const RTEC_COST_WIDTH_PCT = pct(RTEC_COST_GRID_TWIPS) as [
  string,
  string,
  string,
  string,
];

/** Minimum blank data rows for Word constraint table (before any filled extras). */
export const RTEC_CONSTRAINT_EMPTY_ROWS = 2;

/** Minimum blank data rows for Word cost table (before Total row). */
export const RTEC_COST_EMPTY_ROWS = 2;

/**
 * Official Form 002 compliance rows (Word Annex A-2 — 14 items).
 * Portal editor may keep extra rows (ECC, FDA, supplier affidavit); those stay off the PDF.
 */
export const RTEC_OFFICIAL_COMPLIANCE_ITEMS: { id: string; label: string }[] = [
  {
    id: "loi",
    label:
      "Letter of intent to avail of the SETUP assistance, stating commitment to refund the iFund support and cover the insurance cost for the acquired equipment.",
  },
  {
    id: "tna1",
    label:
      "Accomplished DOST TNA Form 01 (Application for Technology Needs Assessment)",
  },
  {
    id: "tna2",
    label:
      "Accomplished DOST TNA Form 02 (Technology Needs Assessment Report)",
  },
  {
    id: "form001",
    label: "Proposal following SETUP Form 001 (Project Proposal Format)",
  },
  {
    id: "permits",
    label:
      "Copy of business permits and licenses issued by LGUs and other appropriate government agencies",
  },
  {
    id: "financial",
    label:
      "Financial statements for the past three (3) years for small and medium enterprises and at least one (1) year for micro enterprises together with notarized Sworn Statement that all information provided are true and correct.",
  },
  {
    id: "projected",
    label: "Projected financial statements",
  },
  {
    id: "official-receipt",
    label: "Photocopy of Official Receipt",
  },
  {
    id: "registration",
    label:
      "Certificate of registration of business name with the Department of Trade and Industry (DTI), Securities and Exchange Commission (SEC) or Cooperative Development Authority (CDA), whichever is applicable.",
  },
  {
    id: "articles",
    label:
      "Copy of Articles of Incorporation for cooperatives and associations",
  },
  {
    id: "affidavit",
    label:
      "Sworn affidavit of no relation up to the third degree of consanguinity and affinity to the approving authority and no bad debt",
  },
  {
    id: "resolution",
    label:
      "In the case of cooperatives and non-single proprietorship, LGUs, organization, Board/Legislative Council resolution authorizing the availment of the assistance and designating authorized signatory for the financial assistance.",
  },
  {
    id: "quotations",
    label:
      "Three (3) quotations for each equipment from suppliers/fabricators of the equipment to be purchased/fabricated",
  },
  {
    id: "drawings",
    label:
      "Complete technical design/drawing of all equipment to be purchased/fabricated",
  },
];

export const RTEC_OFFICIAL_COMPLIANCE_IDS = RTEC_OFFICIAL_COMPLIANCE_ITEMS.map(
  (item) => item.id,
) as readonly string[];

export type RtecOfficialComplianceStatus =
  | ""
  | "complied"
  | "not_complied"
  | "na";

export interface RtecOfficialComplianceItem {
  id: string;
  label: string;
  status: RtecOfficialComplianceStatus;
}

/**
 * Map stored/editor compliance (17 rows) to the official Word 14-row table.
 * Uses Word labels; `na` status leaves both tick cells empty on print.
 */
export function toOfficialComplianceItems(
  items: { id: string; status?: string }[] | undefined,
): RtecOfficialComplianceItem[] {
  const byId = new Map((items ?? []).map((item) => [item.id, item] as const));
  return RTEC_OFFICIAL_COMPLIANCE_ITEMS.map((official) => {
    const saved = byId.get(official.id);
    const status = (saved?.status ?? "") as RtecOfficialComplianceStatus;
    return {
      id: official.id,
      label: official.label,
      status,
    };
  });
}

export function rtecReportFooter(page: number, total: number): string {
  return `${RTEC_REPORT_FOOTER_PREFIX} Page ${page} of ${total}`;
}

export function displayValue(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function formatCurrencyDisplay(value: unknown): string {
  const raw = displayValue(value);
  if (!raw) return "";
  if (/^php\s/i.test(raw) || /^₱/.test(raw)) return raw;
  const n = Number(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return raw;
  return `Php ${n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function padRowsForDocument<T>(
  rows: T[],
  emptyRow: () => T,
  minRows: number,
): T[] {
  const list = rows.length > 0 ? [...rows] : [];
  while (list.length < minRows) {
    list.push(emptyRow());
  }
  return list;
}
