/**
 * Author: Yzrel Jade B. Eborde
 */

/** DTO shapes aligned with planned Spring Boot REST API */

export type ApiRole = "applicant" | "agent" | "admin";

export interface ApiAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    role: ApiRole;
    enterpriseName?: string;
    applicationId?: string;
  };
}

export interface ApiApplicant {
  id: string;
  applicationId: string;
  applicantName: string;
  enterpriseName: string;
  emailAddress: string;
  contactNumber: string;
  region: string;
  province?: string;
  address: string;
  currentModule: string;
  qualified: boolean;
}

export interface ApiTnaFormPayload {
  applicantId: string;
  form: Record<string, unknown>;
  tables: {
    rawMaterials: unknown[];
    production: unknown[];
    equipment: unknown[];
  };
  submitted: boolean;
}

export interface LoiGenerationRequest {
  applicantName?: string;
  designation?: string;
  enterpriseName: string;
  emailAddress?: string;
  contactNumber?: string;
  address?: string;
  province?: string;
  zipCode?: string;
  tinNumber?: string;
  registrationType?: string;
  registrationNumber?: string;
  companyDescription?: string;
  dateEstablished?: string;
  msmeSize?: string;
  businessType?: string;
  businessSector?: string;
  businessNature?: string;
  yearsOfOperation?: string;
  assetSize?: string;
  coreProducts?: string;
  turnover?: string;
  qualified?: boolean;
  exportClassification?: string;
  productServices?: string;
  projectDescription?: string;
  expectedOutcome?: string;
  budget?: string;
  timeline?: string;
  commitmentAmount?: string;
  repaymentTerm?: string;
  productionPlanFile?: string;
  signature?: string;
  dateSigned?: string;
}

export interface LoiLetterhead {
  enterpriseName: string;
  address: string;
  email: string;
  mobile: string;
  date: string;
}

export interface LoiAddressee {
  name: string;
  title: string;
  thruLine?: string;
  officeName?: string;
  lines: string[];
  addressLines?: string[];
  defaulted?: boolean;
}

export interface LoiSignature {
  typedName: string;
  printedName: string;
  designation: string;
  enterpriseName: string;
  dateSigned: string;
}

export interface LoiDocumentResponse {
  letterhead: LoiLetterhead;
  regionalAddressee: LoiAddressee;
  thruAddressee: LoiAddressee;
  salutation: string;
  bodyParagraphs: string[];
  closing: string;
  signature: LoiSignature;
  generatedAt: string;
  aiGenerated: boolean;
  provincialOfficeDefaulted: boolean;
}

export interface Tna1TablesDto {
  rawMaterials: string[][];
  production: string[][];
  equipment: string[][];
}

export interface Tna1GenerationRequest {
  applicationId?: string;
  enterpriseName: string;
  applicantName?: string;
  designation?: string;
  emailAddress?: string;
  contactNumber?: string;
  address?: string;
  province?: string;
  msmeSize?: string;
  businessType?: string;
  businessSector?: string;
  businessNature?: string;
  yearsOfOperation?: string;
  assetSize?: string;
  productServices?: string;
  projectDescription?: string;
  expectedOutcome?: string;
  companyDescription?: string;
  loiBackground?: string;
  form: Record<string, unknown>;
  tables: Tna1TablesDto;
}

export interface Tna1DocumentResponse {
  form: Record<string, unknown>;
  tables: Tna1TablesDto;
  generatedAt: string;
  aiGenerated: boolean;
}

export interface Tna2EnterpriseProfile {
  enterpriseName?: string;
  address?: string;
  businessType?: string;
  sector?: string;
  commodity?: string;
  mainProduct?: string;
  employees?: string;
  contactPerson?: string;
  contactNumber?: string;
  emailAddress?: string;
}

export interface Tna2EquipmentRow {
  name: string;
  specifications?: string;
  quantity?: string;
  estimatedCost?: string;
  priority?: string;
}

export interface Tna2Kpi {
  label: string;
  before?: string;
  after?: string;
  change?: string;
}

export interface Tna2Assessor {
  name?: string;
  title?: string;
  office?: string;
}

export interface Tna2DocumentResponse {
  documentRef: string;
  assessmentDate: string;
  applicationId?: string;
  enterpriseProfile: Tna2EnterpriseProfile;
  siteValidationFindings: string[];
  productionProcessAnalysis: { summary: string; findings: string[] };
  technologyGaps: string[];
  proposedInterventions: string[];
  recommendedEquipment: Tna2EquipmentRow[];
  productivityImprovement: { kpis: Tna2Kpi[]; outcomes: string[] };
  assessor: Tna2Assessor;
  generatedAt: string;
  aiGenerated: boolean;
}

export interface Tna2StoredDocument extends Tna2DocumentResponse {
  published: boolean;
  publishedAt?: string;
}

export interface Tna2GenerationRequest {
  applicationId?: string;
  enterpriseName: string;
  applicantName?: string;
  designation?: string;
  emailAddress?: string;
  contactNumber?: string;
  address?: string;
  province?: string;
  msmeSize?: string;
  businessType?: string;
  businessSector?: string;
  businessNature?: string;
  productServices?: string;
  projectDescription?: string;
  expectedOutcome?: string;
  budget?: string;
  loiBackground?: string;
  tna1Form: Record<string, unknown>;
  tna1Tables: Tna1TablesDto;
}

// ── SETUP Form 001 — Project Proposal ─────────────────────────────────────────

export type ProjectProposalAttachmentKind =
  | "vicinityMap"
  | "plantLayout"
  | "orgChart"
  | "financialReports";

export interface ProjectProposalAttachment {
  id: string;
  kind: ProjectProposalAttachmentKind;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface ProjectProposalBudgetRow {
  id: string;
  item: string;
  qty: string;
  unitCost: string;
  setupShare: string;
  total: string;
}

export interface ProjectProposalRiskRow {
  id: string;
  risk: string;
  assumption: string;
  plan: string;
}

export interface ProjectProposalForm {
  projectTitle: string;
  proponentName: string;
  proponentAddress: string;
  projectCost: string;
  amountRequested: string;
  generalObjective: string;
  specificObjectives: string[];
  firmName: string;
  firmAddress: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  yearEstablished: string;
  organizationType: string;
  profitType: string;
  msmeSize: string;
  employeesMale: string;
  employeesFemale: string;
  employeesDirect: string;
  employeesIndirect: string;
  registrationOffice: string;
  registrationNumber: string;
  registrationDate: string;
  businessPermitNumber: string;
  businessPermitDate: string;
  businessActivity: string;
  prioritySectorSpecify: string;
  productsServices: string;
  enterpriseBackground: string;
  skillsExpertise: string;
  compensation: string;
  plantSiteNarrative: string;
  capacityVolumeNarrative: string;
  rawMaterialsNarrative: string;
  rawMaterialsTable: string[][];
  marketSituation: string;
  productDemandSupply: string;
  productPriceTable: string[][];
  distributionChannel: string;
  competitors: string;
  marketStrategies: string[];
  productionProcess: string;
  equipmentTable: string[][];
  equipmentNarrative: string;
  interventionProblem: string;
  interventionProposed: string;
  interventionEquipment: string;
  interventionImpact: string;
  interventionCostTable: string[][];
  fabricatorTable: string[][];
  scheduleTable: string[][];
  expectedOutputBullets: string[];
  wasteManagement: string;
  liquidityRatioTable: string[][];
  quickRatioTable: string[][];
  roiTable: string[][];
  financialAnalysis: string;
  financialConstraintsNote: string;
  budgetItems: ProjectProposalBudgetRow[];
  refundSchedule: string[][];
  riskRows: ProjectProposalRiskRow[];
}

export interface ProjectProposalStored {
  form: ProjectProposalForm;
  attachments: ProjectProposalAttachment[];
  document?: ProjectProposalDocumentResponse;
  submitted?: boolean;
  submittedAt?: string;
  updatedAt?: string;
}

export interface ProjectProposalDocumentResponse {
  applicationId?: string;
  formTitle?: string;
  generatedAt: string;
  aiGenerated: boolean;
  generalObjective?: string;
  specificObjectives?: string[];
  enterpriseBackground?: string;
  skillsExpertise?: string;
  plantSiteNarrative?: string;
  capacityVolumeNarrative?: string;
  rawMaterialsNarrative?: string;
  marketSituation?: string;
  productDemandSupply?: string;
  distributionChannel?: string;
  competitors?: string;
  marketStrategies?: string[];
  productionProcess?: string;
  equipmentNarrative?: string;
  interventionProblem?: string;
  interventionProposed?: string;
  interventionEquipment?: string;
  interventionImpact?: string;
  expectedOutputBullets?: string[];
  wasteManagement?: string;
  financialAnalysis?: string;
  riskRows?: ProjectProposalRiskRow[];
}

export interface ProjectProposalGenerationRequest {
  applicationId?: string;
  enterpriseName: string;
  applicantName?: string;
  province?: string;
  businessSector?: string;
  productServices?: string;
  projectDescription?: string;
  expectedOutcome?: string;
  budget?: string;
  form: ProjectProposalForm;
  attachmentKinds?: string[];
}

// ── Shared AI field suggestion ────────────────────────────────────────────────

export type AiSuggestModule = "project-proposal" | "loi" | "tna1" | "tna2";

export interface AiFieldSuggestionRequest {
  module: AiSuggestModule;
  field: string;
  context: Record<string, unknown>;
}

export interface AiFieldSuggestionResponse {
  module: string;
  field: string;
  text?: string;
  bullets?: string[];
  aiGenerated: boolean;
}
