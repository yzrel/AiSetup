/**
 * Author: Yzrel Jade B. Eborde
 */

/** SETUP 4.0 brochure content — DOST Region XII */

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

export const SETUP_PRIORITY_SECTORS = [
  "Agriculture, Forestry, Livestock",
  "Food Processing",
  "Tool and Die",
  "Furniture, Jewelry, GHD and Creatives",
  "Marine and Aquaculture",
  "Marine Transport",
  "Health and Wellness (Biotech, Medical Services, Pharmaceuticals, Food Supplements)",
  "Electronics and ICT Services",
  "Agrimachinery / Farm Implements / Food Processing Equipment",
] as const;

export type SetupPrioritySector = (typeof SETUP_PRIORITY_SECTORS)[number];

export function isSetupPrioritySector(sector: string): boolean {
  return SETUP_PRIORITY_SECTORS.includes(sector as SetupPrioritySector);
}

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

export const SETUP_WHO_CAN_APPLY = [
  "Any company or individual firm based in the Philippines and wholly owned by Filipino citizens.",
  "Any small and medium scale business firm that can be classified under the identified priority sectors.",
  "An individual firm willing to apply technological improvements to existing operations.",
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
  "Financial Statements of at least the past three (3) years.",
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

export const DOST_REGION_12_CONTACTS: DostOfficeContact[] = [
  {
    id: "regional",
    name: "DOST Regional Office No. XII",
    director: "Engr. Sammy P. Malawan, Regional Director",
    address: "PNHLSG Bldg., Brgy. Paraiso, Koronadal City",
    email: "records@region12.dost.gov.ph",
    phone: "(083) 826-0114",
    website: "https://www.region12.dost.gov.ph",
    facebook: "https://facebook.com/dostregion12",
  },
  {
    id: "south-cotabato",
    name: "South Cotabato Provincial Office",
    director: "Ms. Gisele Eve O. Siladan, Provincial Director",
    address:
      "Ground Floor, Philippine National Halal Laboratory and Science Center Building, Brgy. Paraiso, City of Koronadal",
    email: "pstc_southcot@region12.dost.gov.ph",
    phone: "(083) 826-0115",
    facebook: "https://facebook.com/dost12southcotabato",
  },
  {
    id: "cotabato",
    name: "North Cotabato Provincial Office",
    director: "Mr. Michael T. Mayo, Provincial Director",
    address: "2nd Floor Esperanza Bldg., Quezon Blvd., 9400 Kidapawan City",
    email: "CotabatoProvince@region12.dost.gov.ph",
    phone: "0951 849 0880",
    facebook: "https://facebook.com/pstccotabato",
  },
  {
    id: "sultan-kudarat",
    name: "Sultan Kudarat Provincial Office",
    director: "Ms. Zenaida D. Guiano, Provincial Director",
    address:
      "Unit 1-B Ground Floor Mervic Commercial Bldg. (LAMDAM ANNEX), Ladesma St. Ext., Poblacion, Tacurong City",
    email: "pstc_sk@region12.dost.gov.ph",
    phone: "(064) 471-2844",
    facebook: "https://facebook.com/dost12sultankudarat",
  },
  {
    id: "gensan-sarangani",
    name: "General Santos and Sarangani Provincial Office",
    director: "Ms. Babai K. Tagitican, Provincial Director",
    address: "Barangay Hall Compound, Calumpang, General Santos City 9500",
    email: "pstc_sargen@region12.dost.gov.ph",
    phone: "(083) 826-0145",
    facebook: "https://facebook.com/profile.php?id=100067677332511",
  },
];
