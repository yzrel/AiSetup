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
