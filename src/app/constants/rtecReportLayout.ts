/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST SETUP Form 002 (Annex A-2) RTEC Report printable layout constants.
 */

export {
  displayValue,
  formatCurrencyDisplay,
  isOptionChecked,
  PP_BUDGET_COLUMNS,
  PP_BUDGET_NOTE,
  PP_BUSINESS_ACTIVITY_PAIRS,
  PP_EQUIPMENT_COLUMNS,
  PP_EXPECTED_OUTPUT_HEADINGS,
  PP_FABRICATOR_COLUMNS,
  PP_FINANCIAL_ATTACH_NOTE,
  PP_INTERVENTION_COLUMNS,
  PP_INTERVENTION_COST_COLUMNS,
  PP_LIQUIDITY_COLUMNS,
  PP_MSME_SIZES,
  PP_ORGANIZATION_TYPES,
  PP_PRODUCT_PRICE_COLUMNS,
  PP_PROFIT_TYPES,
  PP_QUICK_RATIO_COLUMNS,
  PP_REFUND_NOTE,
  PP_RISK_COLUMNS,
  PP_RISK_FOOTNOTE,
  PP_ROI_COLUMNS,
} from "./projectProposalLayout";

export const RTEC_REPORT_TITLE = "SETUP Form 002 · RTEC Report";

export const RTEC_REPORT_FOOTER_PREFIX =
  "SETUP Guidelines (Revision 3.0) Annex A-2: SETUP Form 002 - RTEC Report";

export const RTEC_SECTION_I = "I. Brief description of the project";
export const RTEC_SECTION_II = "II. Compliance of Requirements";
export const RTEC_SECTION_III = "III. Highlights of Evaluation";
export const RTEC_SECTION_IV = "IV. Recommendation (addressing the findings of TNA)";

export const RTEC_SUBSECTION_COMPANY = "a. Company profile";
export const RTEC_SUBSECTION_OBJECTIVES = "b. Objectives";
export const RTEC_SUBSECTION_EXPECTED = "c. Expected Outputs / Impact/s of S&T intervention";
export const RTEC_SUBSECTION_MANAGEMENT = "a. Management/Administrative Aspect";
export const RTEC_SUBSECTION_TECHNICAL =
  "b. Technical Aspect (including the recommended DOST S&T Intervention)";
export const RTEC_SUBSECTION_MARKETING = "c. Marketing Aspect";
export const RTEC_SUBSECTION_FINANCIAL =
  "d. Financial Aspect (including financial ratio and analysis; net profit margin ratio; liquidity ratio; ROI; balance sheet, partial budget analysis, detailed line-item budget and refund schedule)";
export const RTEC_SUBSECTION_WASTE = "e. Waste Disposal";
export const RTEC_SUBSECTION_RISK = "f. Risk Management";

export const RTEC_REGISTRATION_OFFICES = [
  "DTI",
  "SEC",
  "CDA",
  "LGU",
  "Others, please specify:",
] as const;

export const RTEC_COMPLIANCE_COLUMNS = [
  "Requirements",
  "Complied",
  "Not Complied",
  "N/A",
] as const;

export function rtecReportFooter(page: number, total: number): string {
  return `${RTEC_REPORT_FOOTER_PREFIX} Page ${page} of ${total}`;
}
