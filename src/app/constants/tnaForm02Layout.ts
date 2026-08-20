/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST SETUP TNA Form 02 (Annex 1-2) printable layout constants.
 * Source: TNA FORM 02.docx — SETUP Guidelines (Revision 3.0).
 */

export { displayValue, formatDisplayDate } from "./tnaForm01Layout";

export const TNA_FORM_02_TITLE =
  "DOST TNA FORM 02 - Technology Needs Assessment Report";

export const TNA_FORM_02_SUBTITLE = "TECHNOLOGY NEEDS ASSESSMENT (TNA) REPORT";

export const TNA_FORM_02_FOOTER_PREFIX =
  "SETUP Guidelines (Revision 3.0) Annex 1-2: DOST TNA FORM 02 - Technology Needs Assessment Report";

/** Word pgMar (twips) → mm: top 1360, right 600, bottom 1080, left 1140. */
export const TNA_FORM_02_PAGE_MARGIN_MM = {
  top: 24.0,
  right: 10.6,
  bottom: 19.1,
  left: 20.1,
} as const;

/** Word pack typography: Times New Roman 12pt body, 14pt title; Arial for COMPANY/ADDRESS values and intervention table headers. */
export const TNA_FORM_02_FONT_BODY = '"Times New Roman", Times, serif';
export const TNA_FORM_02_FONT_ARIAL = "Arial, sans-serif";
export const TNA_FORM_02_FONT_SIZE_BODY_PT = 12;
export const TNA_FORM_02_FONT_SIZE_TITLE_PT = 14;

export const TNA_FORM_02_SCOPE_HEADING = "SCOPE OF ASSESSMENT*";

export const TNA_FORM_02_SCOPE_NOTE =
  "*Scope of TNA is based on Technology Assessment Plan (TAP)";

/** Official scope-of-assessment groups and items from TNA FORM 02.docx */
export const TNA_FORM_02_SCOPE_GROUPS = [
  {
    id: "strategic",
    label: "Strategic Direction",
    items: [
      { id: "vision-mission", label: "Vision and Mission" },
      { id: "plans", label: "Plans" },
      { id: "alliances", label: "Strategic alliances and current agreement" },
    ],
  },
  {
    id: "management",
    label: "Management Aspect",
    items: [
      { id: "human-resources", label: "Human Resources" },
      { id: "purchasing", label: "Purchasing" },
      { id: "work-environment", label: "Work Environment" },
      { id: "ohs", label: "Occupational Health and Safety" },
      {
        id: "business-ethics",
        label: "Business ethics and social responsibilities",
      },
    ],
  },
  {
    id: "technical",
    label: "Technical Aspect",
    items: [
      { id: "operational", label: "Operational and Outsourcing Practices" },
      {
        id: "production-system",
        label: "Production System",
        tapScoped: true,
      },
      {
        id: "production-planning",
        label: "Production and Planning Control",
        tapScoped: true,
      },
      {
        id: "production-layout",
        label: "Production Layout",
        tapScoped: true,
      },
      {
        id: "work-study",
        label: "Work Study/improvement",
        tapScoped: true,
      },
      {
        id: "equipment-mgmt",
        label: "Equipment Management and Maintenance",
        tapScoped: true,
      },
      {
        id: "qa-system",
        label: "Quality Assurance System",
        tapScoped: true,
      },
    ],
  },
  {
    id: "performance",
    label: "Product and Process Performance and Improvement",
    items: [
      {
        id: "reengineering",
        label: "Re-engineering and Research and Development",
        tapScoped: true,
      },
      {
        id: "pm-process",
        label: "Performance Measures and Results - Process",
        tapScoped: true,
      },
      {
        id: "pm-product",
        label: "Performance Measures and Results - Product",
        tapScoped: true,
      },
      {
        id: "continuous-improvement",
        label: "Procedures for Continuous Improvement",
        tapScoped: true,
      },
      {
        id: "product-quality",
        label: "Product Quality Standards",
        tapScoped: true,
      },
    ],
  },
  {
    id: "environmental",
    label: "Environmental Management System",
    items: [
      {
        id: "waste-management",
        label: "Waste Management",
        tapScoped: true,
      },
    ],
  },
] as const;

export type Tna2ScopeGroupId =
  (typeof TNA_FORM_02_SCOPE_GROUPS)[number]["id"];
export type Tna2ScopeItemId =
  (typeof TNA_FORM_02_SCOPE_GROUPS)[number]["items"][number]["id"];

/** Official SUMMARY OF FINDINGS template (labels match regional filled sample) */
export const TNA_FORM_02_FINDINGS_TEMPLATE = [
  {
    title: "1. Strategic Direction",
    subsections: [
      { id: "mission", label: "Mission Statement" },
      { id: "vision", label: "Vision Statement" },
      { id: "plans", label: "Plans" },
      {
        id: "alliances",
        label: "Strategic alliances and current agreement",
      },
    ],
  },
  {
    title: "2. Management Aspect",
    subsections: [
      { id: "human-resources", label: "Human Resources" },
      { id: "purchasing", label: "Purchasing" },
      { id: "work-environment", label: "Work Environment" },
      { id: "compensation", label: "Compensation" },
      {
        id: "ohs",
        label: "Occupational Health and Safety",
      },
      {
        id: "business-ethics",
        label: "Business ethics and social responsibilities",
      },
      { id: "technical-training", label: "Technical Training" },
      { id: "product-promotion", label: "Product Promotion" },
      {
        id: "product-process-performance",
        label: "Product and Process Performance and Improvement",
      },
    ],
  },
  {
    title: "3. Technical Aspect",
    subsections: [
      {
        id: "operational",
        label: "Operational and Outsourcing Practices",
      },
      { id: "production-system", label: "Production System" },
      {
        id: "production-planning",
        label: "Production and Planning Control",
      },
      { id: "production-layout", label: "Production Layout" },
      { id: "work-study", label: "Work Study/improvement" },
      {
        id: "equipment-mgmt",
        label: "Equipment Management and Maintenance",
      },
      { id: "qa-system", label: "Quality Assurance System" },
    ],
  },
  {
    title: "4. Product and Process Performance and Improvement",
    subsections: [
      {
        id: "reengineering",
        label: "Re-engineering and Research and Development",
      },
      {
        id: "pm-process",
        label: "Performance Measures and Results - Process",
      },
      {
        id: "pm-product",
        label: "Performance Measures and Results - Product",
      },
      {
        id: "continuous-improvement",
        label: "Procedures for Continuous Improvement",
      },
      { id: "product-quality", label: "Product Quality Standards" },
    ],
  },
  {
    title: "5. Environmental Management System",
    subsections: [
      { id: "waste-management", label: "Waste Management" },
      { id: "methods-of-disposal", label: "Methods of disposal" },
    ],
  },
] as const;

/** Official SUMMARY OF ASSESSMENT sections (regional forms pack / filled sample) */
export const TNA_FORM_02_SECTION_SUMMARY = "SUMMARY OF ASSESSMENT";
export const TNA_FORM_02_SECTION_BACKGROUND = "BACKGROUND";
export const TNA_FORM_02_SECTION_METHODOLOGY = "METHODOLOGY";
export const TNA_FORM_02_SECTION_FINDINGS = "SUMMARY OF FINDINGS";
export const TNA_FORM_02_SECTION_OTHER = "OTHER OBSERVATIONS";
export const TNA_FORM_02_SECTION_CONCLUSIONS = "CONCLUSIONS";
export const TNA_FORM_02_SECTION_RECOMMENDATIONS = "RECOMMENDATIONS";
export const TNA_FORM_02_SECTION_TEAM = "TNA TEAM";

export const TNA_FORM_02_INTERVENTION_COLUMNS = [
  "Process/ Existing Practice/ Problem",
  "Proposed S&T Intervention",
  "Proposed S&T intervention-related equipment/skills upgrading",
  "Impact",
] as const;

/** Legacy labels retained for editor compatibility */
export const TNA_FORM_02_SECTION_ENTERPRISE = "Enterprise Profile";
export const TNA_FORM_02_SECTION_SITE_VALIDATION = "Site Validation Findings";
export const TNA_FORM_02_SECTION_PRODUCTION = "Production Process Analysis";
export const TNA_FORM_02_SECTION_TECHNOLOGY_GAPS = "Technology Gap Analysis";
export const TNA_FORM_02_SECTION_INTERVENTIONS = "Proposed Technology Intervention";
export const TNA_FORM_02_SECTION_EQUIPMENT = "Recommended Equipment List";
export const TNA_FORM_02_SECTION_PRODUCTIVITY = "Expected Productivity Improvement";

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
  return `${TNA_FORM_02_FOOTER_PREFIX} Page ${page} of ${total}`;
}

/** Count scope items marked TAP-scoped in the Word pack (leading asterisk). */
export function countTapScopedScopeItems(): number {
  return TNA_FORM_02_SCOPE_GROUPS.reduce(
    (sum, group) =>
      sum + group.items.filter((item) => "tapScoped" in item && item.tapScoped).length,
    0,
  );
}
