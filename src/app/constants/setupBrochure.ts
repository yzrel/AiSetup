/**
 * Author: Yzrel Jade B. Eborde
 */

import region12Offices from "@shared/region12-offices.json";
import { FINANCIAL_STATEMENT_BROCHURE_LABEL } from "./financialStatementLabels";

/** SETUP 4.0 brochure content — DOST SOCCSKSARGEN */

export const SETUP_4_TAGLINE =
  "Harnessing Technology and Innovation to Ensure the Productivity and Resilience of Philippines SMEs";

export const SETUP_4_INTRO =
  "DOST's technology transfer and commercialization program that assists micro, small and medium enterprises (MSMEs) in using Science and Technology (S&T) to address problems and opportunities.";

export const SETUP_4_DEFINITION =
  "It is a nationwide strategy to encourage and assist MSMEs to adopt technological innovations to improve their operations and thus boost their productivity and competitiveness.";

export const SETUP_4_PURPOSE =
  "The program enables firms to address their technical problems through technology transfer and technological interventions to improve productivity through better product quality, human resources development, cost minimization and waste management, and other operation-related activities.";

export const SETUP_4_BENEFITS =
  "Through the provision of Enterprise- and Industry-Level Science Technology Innovation (STI) Assistance, SETUP 4.0 can help MSMEs in upgrading their business operations increase their productivity, generate more employment, enhance human capital and improve their resiliency, and competitiveness.";

export {
  SETUP_PRIORITY_SECTOR_CATALOG,
  SETUP_PRIORITY_SECTORS,
  SETUP_PRIORITY_SECTOR_DESCRIPTIONS,
  LEGACY_PRIORITY_SECTOR_ALIASES,
  type SetupPrioritySector,
  normalizePrioritySector,
  isSetupPrioritySector,
} from "./prioritySectors";

/** Regional SETUP assist totals — hero landing page (Micro / Small / Medium). */
export const SETUP_MSME_ASSISTED_TOTAL = 12400;

export interface SetupMsmeAssistedSize {
  id: "micro" | "small" | "medium";
  label: string;
  count: number;
}

/** MSMEs assisted by enterprise size (sums to SETUP_MSME_ASSISTED_TOTAL). */
export const SETUP_MSME_ASSISTED_BY_SIZE: readonly SetupMsmeAssistedSize[] = [
  { id: "micro", label: "Micro", count: 5580 },
  { id: "small", label: "Small", count: 4960 },
  { id: "medium", label: "Medium", count: 1860 },
] as const;

export const SETUP_SERVICES = [
  "Infusion of Appropriate Technologies",
  "Training & Human Resources Development",
  "Advisory & Consultancy Services",
  "Packaging and Labeling",
  "Engineering, Layout & Plant Design services",
  "Standards & Testing Services",
  "Equipment Design, Specification and Acquisition",
  "ICT services (Database, E-commerce, Productivity Tools)",
  "Linkages & Network Services",
] as const;

/** SETUP Guidelines (Revision 3.0) — iFund eligibility (public brochure bullets). */
export const SETUP_WHO_CAN_APPLY = [
  "Enterprises based and duly registered in the Philippines, wholly owned by Filipino citizens or with at least sixty percent (60%) Filipino ownership of capital or outstanding stocks.",
  "MSMEs and firms under DOST SETUP priority sectors that have been operating for at least three (3) years.",
  "Firms that intend to apply innovations to improve existing products, services, and/or operations, with no unsettled accountabilities with DOST.",
] as const;

export interface SetupFaqItem {
  q: string;
  a: string;
}

/**
 * Landing FAQ — wording locked to SETUP Guidelines (Revision 3.0).
 * Do not invent calendar SLAs, commercial interest rates, or PWD priority processing.
 */
export const SETUP_FAQS: readonly SetupFaqItem[] = [
  {
    q: "Who can apply for SETUP?",
    a: "Enterprises and industry associations based and duly registered in the Philippines (DTI, SEC, or CDA, as applicable) that are wholly owned by Filipino citizens or have at least sixty percent (60%) Filipino ownership of capital or outstanding stocks, and that intend to apply innovations to improve existing products, services, and/or operations. Priority is given to MSMEs under DOST SETUP priority sectors. AiSETUP Region XII pre-screening also requires at least three (3) years of operation. Cooperatives, non–single proprietorships, LGUs, and similar organizations need a board or legislative council resolution authorizing the assistance and designating the signatory.",
  },
  {
    q: "How much financial assistance can I get?",
    a: "SETUP provides refundable Innovation-Enabling Fund (iFund) support for approved S&T interventions—not a commercial soft loan. The approved amount is based on the project proposal, projected cash flow, and the proponent’s capacity to refund the iFund. Under Guidelines 3.0, proposals of ₱5,000,000 and below may be approved by the Regional Director; above ₱5,000,000 up to ₱10,000,000 by the Undersecretary for Regional Operations; and above ₱10,000,000 by the DOST EXECOM. The cooperator covers the insurance cost for acquired equipment and provides counterpart operating funds outside the approved line-item budget.",
  },
  {
    q: "What is the interest rate and repayment period?",
    a: "SETUP iFund is refundable assistance, not an interest-bearing commercial loan. Refund is for three (3) or five (5) years, depending on the project and the cooperator’s financial capacity, as recommended by the RTEC and approved by the Regional Director. Phase I (equipment acquisition, fabrication, installation, and related S&T assistance) typically runs six (6) to twelve (12) months after fund receipt; Phase II is the refund period that begins after Phase I. Funds are released only after the cooperator submits post-dated checks covering the total iFund support.",
  },
  {
    q: "How long does the application process take?",
    a: "SETUP Guidelines 3.0 do not set a fixed calendar for approval. The official path is: letter of intent and requirements through the Provincial S&T Office → Technology Needs Assessment (TNA Forms 01 and 02) → Project Proposal (Form 001) and documentary requirements → Review and Technical Evaluation Committee (RTEC) → approval by the Regional Director or higher authority by amount → notarized MOA and Pre-Implementation PIS → release of funds upon submission of post-dated checks. Duration depends on completeness of documents and evaluation scheduling.",
  },
  {
    q: "Can I apply if I am a Person with Disability (PWD)?",
    a: "Yes. PWD entrepreneurs may apply if the enterprise meets the same SETUP Guidelines 3.0 eligibility and documentary requirements as any other proponent. The portal records PWD status for GAD and employment reporting. Guidelines 3.0 do not create a separate PWD funding window or guaranteed priority processing.",
  },
  {
    q: "What technologies are eligible under SETUP?",
    a: "iFund covers S&T interventions identified through the TNA, including technology acquisition to improve product quality, production processes, and efficiency; packaging and labeling; shop-floor R&D and product development; ICT-based tools for operations; and related training, consultancy, standards and testing, plant layout, and equipment design or specification. Assistance is for technology upgrading—not working capital or routine operating expenses, which remain the cooperator’s counterpart.",
  },
] as const;

export const SETUP_HOW_TO_APPLY = [
  "Send a letter of interest to avail of SETUP assistance with all requirements addressed to the DOST Regional Director through the Provincial Director of the assigned Provincial S&T Office where the company is based.",
  "Identify current problems, improvements, and potential technological interventions needed.",
  "If the project is found viable, the DOST Provincial Office will endorse it to the Regional Office for evaluation and assessment.",
] as const;

export const SETUP_DOCUMENTS_REQUIRED = [
  "Letter of intent to avail of the SETUP assistance stating commitment to refund the iFund support and cover the insurance cost for the acquired equipment.",
  "Proposal following SETUP Form 001 (Project Proposal Format).",
  "Copy of business permits and licenses issued by LGUs and other appropriate government agencies.",
  FINANCIAL_STATEMENT_BROCHURE_LABEL,
  "Projected Financial Statements for the next five (5) years.",
  "Photocopy of Official Receipt.",
  "Certificate of Registration of Business.",
  "Copy of Articles of Incorporation for cooperatives and associations.",
  "Sworn affidavit of no relation up to the third degree of consanguinity and affinity to the approving authority and no bad debt.",
  "For cooperatives and non-single proprietorship, LGUs, organization: Board/Legislative Council resolution authorizing the availment of the assistance and designating authorized signatory for the financial assistance.",
  "Three (3) quotations from suppliers/fabricators.",
  "Complete technical design/drawing of the equipment.",
] as const;

export interface DostOfficeContact {
  id: string;
  name: string;
  director: string;
  address: string;
  email: string;
  phone: string;
  facebook?: string;
  website?: string;
}

export const DOST_REGION_12_CONTACTS: DostOfficeContact[] =
  region12Offices.contacts as DostOfficeContact[];

export const REGION_12_PROVINCE_TO_OFFICE: Record<string, string> =
  region12Offices.provinceToOffice as Record<string, string>;
