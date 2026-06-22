/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  SETUP_PRIORITY_SECTORS,
  SetupPrioritySector,
} from "./setupBrochure";

export type DostProgramScope = "region12" | "national";

export type DostProgramId =
  | "mpex"
  | "cape"
  | "food-safety"
  | "energy-audit"
  | "rstl"
  | "packaging-labeling"
  | "tech-training"
  | "sgf"
  | "bist"
  | "whwise"
  | "technicom"
  | "landbank-financing"
  | "tbi-reseed";

export interface DostProgram {
  id: DostProgramId;
  name: string;
  tagline: string;
  summary: string;
  scope: DostProgramScope;
  sectors: SetupPrioritySector[];
  description: string;
  benefits: string[];
  eligibility: string[];
  howToApply: string[];
  documents: string[];
  fundingNote?: string;
  applyVia: string;
  url: string;
}

const PSTC_STEP =
  "Submit a letter of interest to your Provincial Science and Technology Center (PSTC) under DOST Region XII.";

export const DOST_PROGRAMS: Record<DostProgramId, DostProgram> = {
  mpex: {
    id: "mpex",
    name: "MPEX",
    tagline: "Manufacturing Productivity Extension Program",
    summary:
      "Consulting teams help manufacturing MSMEs improve productivity and operations.",
    scope: "region12",
    sectors: [
      "Food Processing",
      "Tool and Die",
      "Furniture, Jewelry, GHD and Creatives",
      "Marine Transport",
      "Agrimachinery / Farm Implements / Food Processing Equipment",
      "Health and Wellness (Biotech, Medical Services, Pharmaceuticals, Food Supplements)",
    ],
    description:
      "The Manufacturing Productivity Extension (MPEX) Program deploys accredited consulting teams to assist micro, small, and medium enterprises in the manufacturing sector. Consultants work on-site to identify bottlenecks, recommend process improvements, and help implement productivity measures on both short- and long-term bases.",
    benefits: [
      "On-site productivity assessment and consulting",
      "Process improvement and lean manufacturing guidance",
      "Technology improvement studies for shop-floor operations",
      "Capacity building for production supervisors and workers",
    ],
    eligibility: [
      "Filipino-owned manufacturing MSME based in the Philippines",
      "Firm classified under a DOST SETUP priority sector",
      "Willing to implement recommended productivity measures",
    ],
    howToApply: [
      PSTC_STEP,
      "Request an MPEX productivity assessment for your enterprise.",
      "DOST coordinates accredited consultants to visit your facility.",
      "Follow through on the agreed improvement plan with PSTC monitoring.",
    ],
    documents: [
      "Letter of request for MPEX assistance",
      "Business registration (DTI / SEC / CDA)",
      "Brief company profile and product lines",
    ],
    fundingNote: "Consultancy services at no cost to qualified MSMEs.",
    applyVia: "Contact your Provincial S&T Center",
    url: "https://region12.dost.gov.ph/technical-consultancy-services/",
  },
  cape: {
    id: "cape",
    name: "CAPE",
    tagline: "Consultancy for Agricultural Productivity Enhancement",
    summary:
      "Technology and farm-management consultancy for agriculture and aquaculture MSMEs.",
    scope: "region12",
    sectors: [
      "Agriculture, Forestry, Livestock",
      "Marine and Aquaculture",
    ],
    description:
      "CAPE provides consultancy teams to undertake technology improvement and enterprise productivity studies for MSMEs in the agricultural and aquaculture sectors. The program aims to institutionalize effective farm management strategies and transfer better technologies to improve yields, reduce post-harvest losses, and strengthen rural enterprise competitiveness.",
    benefits: [
      "Farm and aquaculture productivity assessments",
      "Technology transfer and commercialization support",
      "Enterprise productivity studies for agri-based firms",
      "Guidance on post-harvest handling and value-adding",
    ],
    eligibility: [
      "Filipino-owned MSME in agriculture, forestry, livestock, or aquaculture",
      "Enterprise operating in Region XII or served by a local PSTC",
      "Identified need for technology or productivity improvement",
    ],
    howToApply: [
      PSTC_STEP,
      "Describe your commodity, production scale, and technical problem.",
      "PSTC endorses viable requests for CAPE team deployment.",
      "Implement recommended interventions with DOST follow-up.",
    ],
    documents: [
      "Letter of request for CAPE assistance",
      "Business or farm registration documents",
      "Production area and commodity profile",
    ],
    fundingNote: "Technical consultancy provided through DOST Region XII.",
    applyVia: "Contact your Provincial S&T Center",
    url: "https://region12.dost.gov.ph/technical-consultancy-services/",
  },
  "food-safety": {
    id: "food-safety",
    name: "Food Safety Program",
    tagline: "DOST Region XII Food Safety Services",
    summary:
      "Promotes safe food handling and compliance for processed food MSMEs.",
    scope: "region12",
    sectors: [
      "Food Processing",
      "Health and Wellness (Biotech, Medical Services, Pharmaceuticals, Food Supplements)",
    ],
    description:
      "The DOST Food Safety Program helps food processors and related stakeholders adopt safe food handling practices, meet regulatory requirements, and improve product quality. Assistance may include training, consultancy, and linkage to testing services for microbiological and chemical compliance.",
    benefits: [
      "Food safety training and good manufacturing practices (GMP)",
      "Consultancy on HACCP and sanitation programs",
      "Linkage to accredited product testing laboratories",
      "Support for labeling and regulatory compliance",
    ],
    eligibility: [
      "Food processing MSME or stakeholder in the processed food industry",
      "Filipino-owned enterprise based in the Philippines",
      "Commitment to adopt recommended food safety systems",
    ],
    howToApply: [
      PSTC_STEP,
      "Indicate your food product lines and compliance goals.",
      "Attend scheduled food safety training or request on-site consultancy.",
      "Coordinate product testing through RSTL or OneLab when required.",
    ],
    documents: [
      "Letter of request",
      "Business permits and product list",
      "Current production process description",
    ],
    applyVia: "Contact your Provincial S&T Center",
    url: "https://region12.dost.gov.ph/technical-consultancy-services/",
  },
  "energy-audit": {
    id: "energy-audit",
    name: "Energy Audit",
    tagline: "DOST Region XII Energy Audit Services",
    summary:
      "Identifies energy-saving opportunities for manufacturing and industrial MSMEs.",
    scope: "region12",
    sectors: [
      "Tool and Die",
      "Marine Transport",
      "Agrimachinery / Farm Implements / Food Processing Equipment",
    ],
    description:
      "The Energy Audit program assists enterprises in assessing energy consumption patterns and identifying cost-saving and sustainability improvements. Recommendations may cover equipment efficiency, process optimization, and adoption of cleaner production practices aligned with SETUP 4.0 resiliency themes.",
    benefits: [
      "On-site energy consumption assessment",
      "Recommendations for efficiency improvements",
      "Guidance on cleaner production practices",
      "Support for reducing operating costs and environmental impact",
    ],
    eligibility: [
      "Manufacturing or industrial MSME with significant energy use",
      "Filipino-owned enterprise in a DOST priority sector",
      "Willingness to implement feasible energy-saving measures",
    ],
    howToApply: [
      PSTC_STEP,
      "Request an energy audit for your plant or facility.",
      "DOST schedules assessment and issues findings.",
      "Implement priority recommendations with PSTC guidance.",
    ],
    documents: [
      "Letter of request",
      "Facility layout and equipment list",
      "Recent utility bills (if available)",
    ],
    applyVia: "Contact your Provincial S&T Center",
    url: "https://region12.dost.gov.ph/technical-consultancy-services/",
  },
  rstl: {
    id: "rstl",
    name: "RSTL / OneLab",
    tagline: "Testing and Calibration Services",
    summary:
      "Accredited chemical, microbiological, and metrology testing for MSMEs.",
    scope: "region12",
    sectors: [...SETUP_PRIORITY_SECTORS],
    description:
      "The Regional Standards and Testing Laboratories (RSTL) and the OneLab network provide standardized testing and calibration services for food processors, manufacturers, water refilling stations, hospitals, and other industries. Services support product quality, export readiness, and regulatory compliance.",
    benefits: [
      "Chemical and microbiological product testing",
      "Water and wastewater analysis",
      "Equipment calibration and metrology services",
      "Standardized, accredited results for market and export compliance",
    ],
    eligibility: [
      "MSMEs, researchers, or institutions requiring accredited testing",
      "Products or equipment within RSTL/OneLab service scope",
      "Valid business registration for commercial testing requests",
    ],
    howToApply: [
      "Contact DOST Region XII RSTL or your PSTC for testing requirements.",
      "Submit sample submission forms and product specifications.",
      "Pay applicable testing fees and receive accredited test reports.",
    ],
    documents: [
      "Sample submission form",
      "Product specification or test request details",
      "Business registration (for commercial clients)",
    ],
    fundingNote: "Fee-based testing; fees vary by test type.",
    applyVia: "DOST Region XII RSTL or Provincial S&T Center",
    url: "https://region12.dost.gov.ph/testing-and-calibration-services/",
  },
  "packaging-labeling": {
    id: "packaging-labeling",
    name: "Packaging & Labeling",
    tagline: "Packaging and Label Design Assistance",
    summary:
      "Package development, labeling, and design support to improve market appeal.",
    scope: "region12",
    sectors: [
      "Food Processing",
      "Furniture, Jewelry, GHD and Creatives",
      "Health and Wellness (Biotech, Medical Services, Pharmaceuticals, Food Supplements)",
    ],
    description:
      "DOST assists MSMEs in developing functional and market-ready packaging and labels through its network of packaging centers, ITDI, and partner institutions. Support includes package design, labeling compliance, and training on packaging technology to boost product competitiveness.",
    benefits: [
      "Package design and development assistance",
      "Label review for regulatory and market requirements",
      "Packaging technology training",
      "Linkage to specialized packaging centers and SUC partners",
    ],
    eligibility: [
      "MSME producing consumer or food products requiring packaging improvement",
      "Filipino-owned enterprise in a supported sector",
      "Clear product ready or near-ready for market",
    ],
    howToApply: [
      PSTC_STEP,
      "Submit product samples or images and target market information.",
      "PSTC coordinates packaging specialists for assessment.",
      "Implement revised packaging with DOST technical guidance.",
    ],
    documents: [
      "Letter of request",
      "Product samples or photos",
      "Current label and packaging materials",
    ],
    applyVia: "Contact your Provincial S&T Center",
    url: "https://region12.dost.gov.ph/setup/",
  },
  "tech-training": {
    id: "tech-training",
    name: "Technology Training & Fora",
    tagline: "DOST Region XII Capacity Building",
    summary:
      "Scheduled trainings and technology fora for MSMEs across Region XII.",
    scope: "region12",
    sectors: [...SETUP_PRIORITY_SECTORS],
    description:
      "DOST Region XII conducts technology trainings and fora based on regional MSME needs. Trainings disseminate matured technologies from publicly funded R&D, while fora connect entrepreneurs with experts, new tools, and S&T solutions relevant to their industries.",
    benefits: [
      "Skills training on relevant production technologies",
      "Technology fora and knowledge-sharing sessions",
      "Networking with DOST experts and other MSMEs",
      "Awareness of available S&T programs and interventions",
    ],
    eligibility: [
      "MSME owners, workers, or cooperatives in Region XII",
      "Open participation based on announced training schedules",
      "Some programs may prioritize specific sectors or commodities",
    ],
    howToApply: [
      "Watch for training announcements from your PSTC or DOST Region XII.",
      "Register for scheduled technology training or fora.",
      "Apply learnings and follow up with PSTC for firm-level assistance.",
    ],
    documents: [
      "Training registration form (when required)",
      "Business registration (for firm-representative slots)",
    ],
    applyVia: "Provincial S&T Center or DOST Region XII",
    url: "https://region12.dost.gov.ph/technology-training-and-fora/",
  },
  sgf: {
    id: "sgf",
    name: "Startup Grant Fund",
    tagline: "DOST Startup Grant Fund (SGF)",
    summary:
      "Equity-free grants for startup R&D, IP protection, and market validation.",
    scope: "national",
    sectors: ["Electronics and ICT Services"],
    description:
      "The Startup Grant Fund (SGF) supports early-stage startups in conducting research and development, strengthening intellectual property, and achieving initial market traction. Grants are awarded through periodic calls for proposals managed by DOST councils such as PCIEERD.",
    benefits: [
      "Funding for R&D and prototype improvement",
      "Intellectual property protection support",
      "Market validation and business model development",
      "Mentoring and ecosystem linkage through DOST TBIs",
    ],
    eligibility: [
      "Legally registered with DTI or SEC (typically 1–5 years for startup calls)",
      "Early-stage prototype or proof of concept (not idea-only)",
      "Filipino-owned with capacity to conduct R&D",
      "Priority themes vary per call for proposals",
    ],
    howToApply: [
      "Monitor active SGF calls on the DOST DPMIS portal or PCIEERD website.",
      "Prepare a full proposal per the current call guidelines.",
      "Submit through DPMIS before the deadline.",
      "Undergo evaluation and panel review if shortlisted.",
    ],
    documents: [
      "DTI / SEC / CDA registration",
      "Business permits and BIR registration",
      "Technical proposal and work plan",
      "Prototype documentation or proof of concept",
    ],
    fundingNote: "Up to ₱5M per project depending on call guidelines; grant, no equity.",
    applyVia: "DOST DPMIS / PCIEERD calls for proposals",
    url: "https://pcieerd.dost.gov.ph/",
  },
  bist: {
    id: "bist",
    name: "BIST",
    tagline: "Business Innovation through S&T for Industry",
    summary:
      "Zero-interest funding to acquire strategic technologies for industry R&D.",
    scope: "national",
    sectors: [
      "Tool and Die",
      "Marine Transport",
      "Health and Wellness (Biotech, Medical Services, Pharmaceuticals, Food Supplements)",
      "Electronics and ICT Services",
      "Agrimachinery / Farm Implements / Food Processing Equipment",
    ],
    description:
      "The BIST Program helps Filipino-owned companies acquire novel and strategic technologies—such as state-of-the-art equipment, technology licenses, and patent rights—to level up innovation capacity. Financial assistance covers up to 70% of eligible technology costs and is repaid to DOST at zero percent interest.",
    benefits: [
      "Funding for strategic technology acquisition",
      "Support for equipment, licenses, and patent rights",
      "Strengthened R&D and innovation capability",
      "Zero-percent interest repayment to DOST",
    ],
    eligibility: [
      "Filipino-owned company operating at least three (3) years",
      "Clear plan to integrate acquired technology into operations",
      "Project aligned with industry innovation priorities",
    ],
    howToApply: [
      "Prepare a BIST project proposal with technology specifications.",
      "Submit to DOST-TAPI or the relevant DOST council per program guidelines.",
      "Undergo technical and financial evaluation.",
      "Execute agreement and implement technology acquisition plan.",
    ],
    documents: [
      "SEC / DTI registration and business permits",
      "Financial statements (typically 3 years)",
      "Technology quotations and technical specifications",
      "Project proposal and repayment plan",
    ],
    fundingNote: "Up to 70% of eligible technology cost; zero-interest repayment.",
    applyVia: "DOST-TAPI / DOST councils",
    url: "https://www.dost.gov.ph/9-programs-and-projects.html",
  },
  whwise: {
    id: "whwise",
    name: "WHWISE",
    tagline: "Women-Helping-Women: Innovating Social Enterprises",
    summary:
      "Grants for women-led social enterprises needing technology and R&D support.",
    scope: "national",
    sectors: [...SETUP_PRIORITY_SECTORS],
    description:
      "WHWISE supports women-led social enterprises that serve communities and need access to technology, early-stage funding, and gender-focused mentoring. The program funds R&D, prototype development, and technical assistance for enterprises promoting equity and inclusive growth.",
    benefits: [
      "R&D and technology access grants",
      "Gender-focused mentoring and ecosystem support",
      "Prototype and market validation assistance",
      "Community impact documentation and scaling guidance",
    ],
    eligibility: [
      "Women-led social enterprise legally registered 1–7 years",
      "Demonstrated community impact and social mission",
      "Early-stage prototype or proof of concept",
      "Identified technology or R&D need elaborated in proposal",
    ],
    howToApply: [
      "Watch for WHWISE calls on the PCIEERD website or DPMIS.",
      "Prepare proposal describing community impact and technology needs.",
      "Submit through DPMIS per call requirements.",
    ],
    documents: [
      "DTI / SEC registration",
      "Community impact narrative",
      "Prototype documentation",
      "Proposal and work plan",
    ],
    fundingNote: "Grant funding per call cycle; amounts vary by project.",
    applyVia: "DOST PCIEERD via DPMIS",
    url: "https://pcieerd.dost.gov.ph/",
  },
  technicom: {
    id: "technicom",
    name: "TECHNiCOM",
    tagline: "Technology Innovation for Commercialization",
    summary:
      "Funding to commercialize research outputs and startup technologies (TRL 5–7).",
    scope: "national",
    sectors: ["Electronics and ICT Services"],
    description:
      "TECHNiCOM supports the commercialization of research and development outputs from RDIs, SUCs, HEIs, startups, and spin-offs. Startup firms with existing prototypes and technology ownership may apply to bridge the gap between development and market-ready products.",
    benefits: [
      "Funding for commercialization activities",
      "Support for market testing and scaling",
      "Linkage to DOST R&D networks and mentors",
      "IP and licensing guidance for spin-offs",
    ],
    eligibility: [
      "Startup registered DTI/SEC/CDA, operating 1–7 years",
      "Technology Readiness Level (TRL) 5–7",
      "Ownership or license of the technology to be commercialized",
      "Not in proof-of-concept-only or fully commercialized stage",
    ],
    howToApply: [
      "Review TECHNiCOM call guidelines on DOST-TAPI website.",
      "Register and submit proposal through DPMIS.",
      "Provide technology ownership or licensing documentation.",
    ],
    documents: [
      "Business registration and permits",
      "Technology ownership or license agreement",
      "Commercialization plan and milestones",
      "Financial and technical proposal",
    ],
    fundingNote: "Project-based grant; follow active call for funding limits.",
    applyVia: "DOST-TAPI via DPMIS",
    url: "http://www.tapi.dost.gov.ph/call-for-proposals/technicom",
  },
  "landbank-financing": {
    id: "landbank-financing",
    name: "DOST–LandBank Financing",
    tagline: "MSME and Startup Loan Facilitation",
    summary:
      "Loan access from ₱500K to ₱50M for DOST-assisted MSMEs and startups.",
    scope: "national",
    sectors: [...SETUP_PRIORITY_SECTORS],
    description:
      "DOST partners with Land Bank of the Philippines to help MSMEs and startups access financing for technology upgrading, expansion, and commercialization. Enterprises referred through DOST programs may avail of loans starting at ₱500,000 for startups and up to ₱50 million for larger projects.",
    benefits: [
      "Access to loans for equipment and expansion",
      "Referral pathway for DOST program beneficiaries",
      "Financing for technology upgrading and working capital",
      "Tiered loan amounts based on enterprise scale",
    ],
    eligibility: [
      "MSME or startup with DOST program engagement or referral",
      "Filipino-owned enterprise with valid registration",
      "Viable business plan and repayment capacity",
      "Compliance with LandBank credit requirements",
    ],
    howToApply: [
      "Engage with your PSTC or DOST regional office for program referral.",
      "Prepare business plan and financial documents.",
      "Submit loan application through LandBank with DOST endorsement where required.",
    ],
    documents: [
      "Business registration and permits",
      "Financial statements and projections",
      "DOST referral or program documentation (if applicable)",
      "Loan application forms per LandBank requirements",
    ],
    fundingNote: "₱500K (startups) to ₱50M depending on project scale.",
    applyVia: "DOST referral + Land Bank of the Philippines",
    url: "https://www.region12.dost.gov.ph",
  },
  "tbi-reseed": {
    id: "tbi-reseed",
    name: "TBI / ReSEED",
    tagline: "Technology Business Incubation & Startup Ecosystem",
    summary:
      "Incubation, mentoring, and regional startup ecosystem development programs.",
    scope: "national",
    sectors: ["Electronics and ICT Services"],
    description:
      "DOST's Technology Business Incubation (TBI) network and the Regional Startup Enabler for Ecosystem Development (ReSEED) Program support early-stage ventures through incubation facilities, mentoring, and regional ecosystem building. Startups may access TBIs hosted at universities and DOST partner institutions nationwide.",
    benefits: [
      "Incubation space and startup mentoring",
      "Access to DOST expert networks and training",
      "Linkage to grant programs such as SGF and TECHNiCOM",
      "Regional ecosystem events and investor connections",
    ],
    eligibility: [
      "Early-stage startup or innovator with a viable concept or prototype",
      "Willingness to join a DOST-supported TBI or ReSEED activity",
      "Registration requirements vary by incubator or call",
    ],
    howToApply: [
      "Identify a DOST-supported TBI near you or via Startup PH.",
      "Apply for incubation or join ReSEED ecosystem activities.",
      "Leverage TBI support to prepare for grant programs.",
    ],
    documents: [
      "Startup profile and pitch deck",
      "DTI / SEC registration (when available)",
      "Prototype or concept documentation",
    ],
    applyVia: "DOST-supported TBIs / ReSEED regional activities",
    url: "https://www.dost.gov.ph/9-programs-and-projects.html",
  },
};

const SECTOR_PROGRAM_MAP: Record<SetupPrioritySector, DostProgramId[]> = {
  "Agriculture, Forestry, Livestock": [
    "cape",
    "tech-training",
    "rstl",
    "landbank-financing",
  ],
  "Food Processing": [
    "food-safety",
    "packaging-labeling",
    "mpex",
    "rstl",
    "landbank-financing",
  ],
  "Tool and Die": ["mpex", "energy-audit", "bist", "rstl"],
  "Furniture, Jewelry, GHD and Creatives": [
    "mpex",
    "packaging-labeling",
    "tech-training",
  ],
  "Marine and Aquaculture": ["cape", "rstl", "tech-training"],
  "Marine Transport": ["mpex", "energy-audit", "bist"],
  "Health and Wellness (Biotech, Medical Services, Pharmaceuticals, Food Supplements)":
    ["rstl", "bist", "food-safety"],
  "Electronics and ICT Services": [
    "sgf",
    "bist",
    "technicom",
    "landbank-financing",
    "tbi-reseed",
  ],
  "Agrimachinery / Farm Implements / Food Processing Equipment": [
    "mpex",
    "energy-audit",
    "bist",
    "rstl",
  ],
};

const STARTUP_PROGRAM_IDS: DostProgramId[] = [
  "sgf",
  "technicom",
  "tbi-reseed",
];

export interface RecommendationContext {
  businessNature?: string;
  yearsOfOperation?: string;
  exportClassification?: string;
}

export function getProgramById(id: DostProgramId): DostProgram {
  return DOST_PROGRAMS[id];
}

export function getRecommendedPrograms(
  sector: string,
  context: RecommendationContext = {},
): DostProgram[] {
  const isStartup =
    context.businessNature ===
    "Startup (Includes enterprises with or without revenue)";

  const ids: DostProgramId[] = [];

  if (isStartup) {
    ids.push(...STARTUP_PROGRAM_IDS);
  }

  const sectorKey = sector as SetupPrioritySector;
  if (SECTOR_PROGRAM_MAP[sectorKey]) {
    for (const id of SECTOR_PROGRAM_MAP[sectorKey]) {
      if (!ids.includes(id)) ids.push(id);
    }
  }

  const exportOriented =
    context.exportClassification === "Yes" ||
    context.exportClassification === "Potential Export";
  if (exportOriented && !ids.includes("mpex")) {
    ids.unshift("mpex");
  }

  return ids.map((id) => DOST_PROGRAMS[id]).filter(Boolean);
}

export function getProgramsByIds(ids: string[]): DostProgram[] {
  return ids
    .map((id) => DOST_PROGRAMS[id as DostProgramId])
    .filter((p): p is DostProgram => Boolean(p));
}
