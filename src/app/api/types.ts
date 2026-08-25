/**
 * Author: Yzrel Jade B. Eborde
 */

/** DTO shapes aligned with Spring Boot REST API */

export type ApiRole =
  | "applicant"
  | "client"
  | "agent"
  | "provincial-director"
  | "regional-director"
  | "admin";

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
    applicantId?: string;
    officeId?: string;
    assignedProvinces?: string[];
    verified?: boolean;
    portal?: "client" | "admin";
  };
}

export type ApiStaffRole =
  | "admin"
  | "agent"
  | "provincial-director"
  | "regional-director";

export interface ApiStaffUser {
  id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: ApiStaffRole;
  enterpriseName?: string;
  officeId?: string;
  assignedProvinces?: string[];
  enabled: boolean;
}

export interface ApiCreateStaffRequest {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: ApiStaffRole;
  officeId?: string;
  assignedProvinces?: string[];
  enterpriseName?: string;
}

export interface ApiUpdateStaffRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  role?: ApiStaffRole;
  officeId?: string;
  assignedProvinces?: string[];
  enterpriseName?: string;
  enabled?: boolean;
}

export interface ApiRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  enterpriseName?: string;
  applicantId: string;
  applicationId: string;
  phone?: string;
  role?: "applicant" | "client";
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

export interface ApiTnaFormSaveResponse {
  ok: boolean;
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
  /** Selected recommended DOST program (defaults to SETUP 4.0 when empty) */
  programId?: string;
  programName?: string;
  /** Short description of the assistance the selected program provides */
  programSummary?: string;
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

/** Official Form 02 scope checklist item (covered during TNA) */
export interface Tna2ScopeItem {
  id: string;
  covered: boolean;
  notes?: string;
}

/** SUMMARY OF ASSESSMENT — labeled subsection within a findings area */
export interface Tna2FindingSubsection {
  id: string;
  label: string;
  content: string;
}

/** SUMMARY OF ASSESSMENT — findings by scope area */
export interface Tna2FindingSection {
  title: string;
  /** Legacy free-text blob; used when subsections are empty */
  content?: string;
  subsections?: Tna2FindingSubsection[];
}

export interface Tna2InterventionRow {
  problem: string;
  intervention: string;
  equipment: string;
  impact: string;
}

export interface Tna2TeamMember {
  name: string;
  title?: string;
}

export interface Tna2DocumentResponse {
  documentRef: string;
  assessmentDate: string;
  applicationId?: string;
  enterpriseProfile: Tna2EnterpriseProfile;
  /** Official scope-of-assessment checklist; derived from narrative when omitted */
  scopeItems?: Tna2ScopeItem[];
  /** SUMMARY OF ASSESSMENT — BACKGROUND */
  background?: string;
  /** SUMMARY OF ASSESSMENT — METHODOLOGY */
  methodology?: string;
  /** SUMMARY OF FINDINGS by scope area */
  findingsByArea?: Tna2FindingSection[];
  otherObservations?: string;
  conclusions?: string;
  recommendations?: string[];
  interventionRows?: Tna2InterventionRow[];
  tnaTeam?: { leader: Tna2TeamMember; members: Tna2TeamMember[] };
  /** Legacy narrative fields (mapped into summary when new fields empty) */
  siteValidationFindings: string[];
  productionProcessAnalysis: { summary: string; findings: string[] };
  technologyGaps: string[];
  proposedInterventions: string[];
  recommendedEquipment: Tna2EquipmentRow[];
  productivityImprovement: { kpis: Tna2Kpi[]; outcomes: string[] };
  /** Reported by — TNA Team Leader */
  assessor: Tna2Assessor;
  /** Attested by — ARD */
  attestedBy?: Tna2Assessor;
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
  /** Session preview; omitted from backend blob sync (see stripHeavyPayloads). */
  dataUrl?: string;
  uploadedAt: string;
  /** Backend file_uploads id when mirrored via the file API. */
  fileId?: string;
}

export interface ProjectProposalBudgetRow {
  id: string;
  item: string;
  qty: string;
  unitCost: string;
  setupShare: string;
  lgiaShare: string;
  total: string;
}

export interface ProjectProposalRiskRow {
  id: string;
  objective: string;
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
  /** Prescreening asset size (PHP) — used for Company Profile MSME display. */
  assetSize: string;
  /** Prescreening MSME classification range — used for Company Profile MSME display. */
  classificationRange: string;
  employeesMale: string;
  employeesFemale: string;
  employeesDirect: string;
  employeesIndirect: string;
  employeesProductionMale: string;
  employeesProductionFemale: string;
  employeesNonProductionMale: string;
  employeesNonProductionFemale: string;
  employeesIndirectMale: string;
  employeesIndirectFemale: string;
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
  compensationTable: string[][];
  plantSiteNarrative: string;
  capacityVolumeNarrative: string;
  rawMaterialCostTable: string[][];
  rawMaterialAllocationTable: string[][];
  rawMaterialsNarrative: string;
  rawMaterialsTable: string[][];
  marketSituation: string;
  productDemandSupply: string;
  volumeOfOrdersTable: string[][];
  productPriceTable: string[][];
  distributionChannel: string;
  competitors: string;
  existingMarketingProblems: string;
  marketStrategies: string[];
  productionProcess: string;
  materialBalance: string;
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
  wasteVolumeMonthly: string;
  wasteKinds: string;
  wasteDisposalMethods: string;
  liquidityRatioTable: string[][];
  quickRatioTable: string[][];
  roiTable: string[][];
  netProfitMarginTable: string[][];
  partialBudgetAnalysis: string;
  financialAnalysis: string;
  genderInvolvement: string;
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
  existingMarketingProblems?: string;
  marketStrategies?: string[];
  productionProcess?: string;
  materialBalance?: string;
  equipmentNarrative?: string;
  equipmentTable?: string[][];
  interventionProblem?: string;
  interventionProposed?: string;
  interventionEquipment?: string;
  interventionImpact?: string;
  expectedOutputBullets?: string[];
  wasteManagement?: string;
  wasteVolumeMonthly?: string;
  wasteKinds?: string;
  wasteDisposalMethods?: string;
  partialBudgetAnalysis?: string;
  financialAnalysis?: string;
  genderInvolvement?: string;
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

// ── Projected financial statements (5-year) ───────────────────────────────────

export type FinancialTaxMethod = "sole8" | "soleGraduated" | "cit";

export interface FinancialNamedAmountRow {
  id: string;
  name: string;
  amount: number;
  lifeYears: number;
}

export interface FinancialYear1ProductLine {
  id: string;
  name: string;
  srpQ1: number;
  srpQ2: number;
  srpQ3: number;
  srpQ4: number;
  costQ1: number;
  qtyQ1: number;
  qtyQ2: number;
  qtyQ3: number;
  qtyQ4: number;
}

export interface FinancialProjectionInputs {
  productName: string;
  equipment: FinancialNamedAmountRow[];
  preoperating: FinancialNamedAmountRow[];
  products: FinancialYear1ProductLine[];
  loanAmount: number;
  loanTermYears: number;
  loanInterestRate: number;
  equity: number;
  inventoryYear1: number;
  salesGrowth: number;
  cosIncrease: number;
  salaryIncrease: number;
  inflation: number;
  marketing: number;
  salaries: number;
  logistics: number;
  itSoftware: number;
  transportation: number;
  rental: number;
  utilities: number;
  communication: number;
  taxesLicenses: number;
  otherExpenses: number;
  taxMethod: FinancialTaxMethod;
  /** Annual SETUP iFund refund outflow for Years 1–5. */
  setupRefundByYear: number[];
}

export interface FinancialYearSeries {
  label: string;
  values: number[];
}

export interface FinancialRatioRow {
  year: number;
  currentAssets: number;
  inventory: number;
  currentLiabilities: number;
  liquidity: number | null;
  quick: number | null;
  netIncome: number;
  investment: number;
  roi: number | null;
}

export interface FinancialProjectionSnapshot {
  years: number[];
  depreciationAnnual: number;
  amortizationAnnual: number;
  equipmentTotal: number;
  preoperatingTotal: number;
  incomeStatement: Record<string, number[]>;
  cashFlow: Record<string, number[]>;
  balanceSheet: Record<string, number[]>;
  ratios: FinancialRatioRow[];
  npv: number | null;
  irr: number | null;
  balanced: boolean;
}

export interface FinancialProjectionStored {
  inputs: FinancialProjectionInputs;
  snapshot?: FinancialProjectionSnapshot;
  frozenAt?: string;
  source: "wizard";
  submitted?: boolean;
}

export interface FinancialProjectionGenerationRequest {
  applicationId?: string;
  applicantId?: string;
  inputs: FinancialProjectionInputs;
}

export interface FinancialProjectionDocumentResponse {
  applicationId?: string;
  generatedAt: string;
  inputs: FinancialProjectionInputs;
  snapshot: FinancialProjectionSnapshot;
  frozenAt: string;
  source: "wizard";
  submitted: boolean;
}

// ── Shared AI field suggestion ────────────────────────────────────────────────

export type AiSuggestModule = "project-proposal" | "loi" | "tna1" | "tna2";

export interface AiFieldSuggestionRequest {
  module: AiSuggestModule;
  field: string;
  context: Record<string, unknown>;
  /** Optional free-text hint merged into the AI prompt (max 500 chars). */
  userInstruction?: string;
}

export interface AiFieldSuggestionResponse {
  module: string;
  field: string;
  text?: string;
  bullets?: string[];
  aiGenerated: boolean;
}

export interface AiCompletionRequest {
  prompt: string;
  maxTokens?: number;
}

export interface AiCompletionResponse {
  text: string;
  aiGenerated: boolean;
}

// ── SETUP Form 002 — RTEC Report (Annex A-2) ──────────────────────────────────

export type RtecComplianceStatus = "complied" | "not_complied" | "na" | "";

export interface RtecComplianceItem {
  id: string;
  label: string;
  status: RtecComplianceStatus;
}

export interface RtecConstraintRow {
  id: string;
  processProblem: string;
  proposedIntervention: string;
  equipmentSkills: string;
  impact: string;
}

export interface RtecFabricatorRow {
  id: string;
  name: string;
  address: string;
  contactNo: string;
}

export interface RtecSignatures {
  chairperson: string;
  member1: string;
  member2: string;
  member3: string;
  rpmo: string;
  regionalDirector: string;
  evaluationDate: string;
}

export interface RtecReportOverrides {
  complianceItems?: RtecComplianceItem[];
  recommendation?: string;
  signatures?: RtecSignatures;
  constraintRows?: RtecConstraintRow[];
  fabricatorRows?: RtecFabricatorRow[];
  ratioNarrative?: string;
}

export interface RtecReportForm {
  projectCostProponent: string;
  projectCostSetup: string;
  projectCostLgia: string;
  projectCostTotal: string;
  complianceItems: RtecComplianceItem[];
  recommendation: string;
  signatures: RtecSignatures;
  ratioNarrative: string;
  proposalSnapshot: ProjectProposalForm;
  attachmentRefs: ProjectProposalAttachment[];
  constraintRows: RtecConstraintRow[];
  fabricatorRows: RtecFabricatorRow[];
  overrides?: RtecReportOverrides;
}

export interface RtecReportStored {
  form: RtecReportForm;
  submitted?: boolean;
  submittedAt?: string;
  updatedAt?: string;
}

// ── SETUP Form 003 — Notice of Approval (Annex A-3) ───────────────────────────

export interface ApprovalLetterForm {
  seriesYear: string;
  approvalDate: string;
  referenceNumber: string;
  recipientName: string;
  recipientDesignation: string;
  enterpriseName: string;
  enterpriseAddress: string;
  projectTitle: string;
  approvedAmount: string;
  refundTermYears: string;
  insuranceRatePercent: string;
  pstoDirectorTitle: string;
  pstoOfficeName: string;
  bodyParagraphs?: string[];
  signatoryName: string;
  signatoryTitle: string;
  conformeDeadlineDays: string;
  published: boolean;
  acknowledgedAt?: string;
  conformeSignedName?: string;
}

export interface ApprovalLetterStored {
  form: ApprovalLetterForm;
  published: boolean;
  publishedAt?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  /** Regional Director decision before Notice of Approval may be published. */
  rdDecision?: "approved" | "disapproved" | null;
  rdDecidedBy?: string;
  rdDecidedAt?: string;
  rdRemarks?: string;
  signedMoa?: SignedMoaDocument;
  updatedAt?: string;
}

export interface SignedMoaDocument {
  fileName: string;
  mimeType: string;
  /** Session preview; omitted from backend blob sync. */
  dataUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  moaSignedDate: string;
  signingVenue?: string;
  notes?: string;
  fileId?: string;
  hasFileContent?: boolean;
}

// ── SETUP Form 008 / 009 — Project Information Sheet ──────────────────────────

export interface PisSexCounts {
  male: string;
  female: string;
}

export interface PisHireBlock {
  regular: PisSexCounts;
  partTime: PisSexCounts;
  pwd: PisSexCounts;
  seniorCitizen: PisSexCounts;
}

export interface PisEmploymentMatrix {
  companyHire: PisHireBlock;
  subcontractorHire: PisHireBlock;
  indirectBackward: PisSexCounts;
  indirectForward: PisSexCounts;
  indirectPwd: PisSexCounts;
  indirectSeniorCitizen: PisSexCounts;
}

/** SETUP Form 008 — Pre-Implementation Project Information Sheet */
export interface PrePisDraftForm {
  periodLabel: string;
  projectTitle: string;
  projectCode: string;
  firmName: string;
  ownerName: string;
  ownerSex: string;
  ownerBirthday: string;
  orgType: string;
  businessAddress: string;
  landline: string;
  fax: string;
  mobilePhone: string;
  email: string;
  yearEstablished: string;
  dateAssistanceApproved: string;
  assetsLand: string;
  assetsBuilding: string;
  assetsEquipment: string;
  assetsWorkingCapital: string;
  employment: PisEmploymentMatrix;
  productionVolumeLocal: string;
  productionVolumeExport: string;
  productionDetails: string;
  grossSalesLocal: string;
  grossSalesExport: string;
  exportDestinations: string;
  /** Assistance option ids from FORM_008_ASSISTANCE_OPTIONS */
  dostAssistance: string[];
  assistanceSpecify: string;
  preparedBy: string;
  datePrepared: string;
}

export interface SignedPrePisDocument {
  fileName: string;
  mimeType: string;
  /** Session preview; omitted from backend blob sync. */
  dataUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  prePisSignedDate: string;
  notes?: string;
  fileId?: string;
  hasFileContent?: boolean;
}

export type PisSemester = "1" | "2";

export interface PisOngoingFiling {
  id: string;
  periodLabel: string;
  reportingYear: string;
  semester: PisSemester;
  projectCode: string;
  projectTitle: string;
  /** Fill only if changed from Pre-PIS */
  firmName: string;
  ownerName: string;
  ownerSex: string;
  ownerBirthday: string;
  orgType: string;
  businessAddress: string;
  landline: string;
  fax: string;
  mobilePhone: string;
  email: string;
  assetsLand: string;
  assetsBuilding: string;
  assetsEquipment: string;
  assetsWorkingCapital: string;
  employment: PisEmploymentMatrix;
  /** Legacy simple counts — migrated into employment when present */
  employmentDirectMale?: string;
  employmentDirectFemale?: string;
  employmentIndirectMale?: string;
  employmentIndirectFemale?: string;
  productionVolumeLocal: string;
  productionVolumeExport: string;
  productionDetails: string;
  grossSalesLocal: string;
  grossSalesExport: string;
  exportDestinations: string;
  /** Assistance option ids from FORM_009_ASSISTANCE_OPTIONS */
  dostAssistance: string[];
  assistanceSpecify: string;
  preparedBy: string;
  filedAt: string;
}

export interface ProjectInformationSheetStored {
  prePisDraft: PrePisDraftForm;
  signedPrePis?: SignedPrePisDocument;
  signingDayComplete: boolean;
  completedAt?: string;
  completedBy?: string;
  ongoingFilings: PisOngoingFiling[];
  updatedAt?: string;
}

// ── Modules 11–13 — LandBank & Withdrawal ─────────────────────────────────────

export interface LbpIntroductionLetterForm {
  letterDate: string;
  branchManagerName: string;
  branchManagerTitle: string;
  landbankBranch: string;
  branchCityProvince: string;
  proponentName: string;
  enterpriseName: string;
  projectTitle: string;
  approvedAmount: string;
  approvedAmountWords: string;
  signatoryName: string;
  signatoryTitle: string;
  regionalOfficeName: string;
}

export interface LbpIntroductionLetterStored {
  form: LbpIntroductionLetterForm;
  published: boolean;
  publishedAt?: string;
  publishedBy?: string;
  updatedAt?: string;
}

export interface ModuleDocument {
  fileName: string;
  mimeType: string;
  /** Session preview; omitted from backend blob sync (see stripHeavyPayloads). */
  dataUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
  /** Backend file_uploads id when mirrored via POST /applicants/{id}/files. */
  fileId?: string;
  hasFileContent?: boolean;
}

export interface WithdrawalEquipmentRow {
  id: string;
  item: string;
  amount: string;
  /** Original Project Proposal budgetItems[].id when seeded from proposal */
  sourceBudgetItemId?: string;
}

export interface WithdrawalLetterDraft {
  letterDate: string;
  addresseeName: string;
  addresseeTitle: string;
  officeLines: string[];
  firmName: string;
  ownerName: string;
  ownerDesignation: string;
  supplierName: string;
  generatedAt?: string;
}

export type WithdrawalTrancheStatus = "draft" | "sent" | "signed" | "complete";

export interface WithdrawalTranchePackage {
  tranche: 1 | 2;
  supplierName: string;
  equipment: WithdrawalEquipmentRow[];
  letterDraft?: WithdrawalLetterDraft;
  /** Signed letter request uploaded after client signs */
  signedLetter?: ModuleDocument | null;
  /** Tranche 1: supplier quotations / canvass */
  quotations?: ModuleDocument[];
  /** Tranche 1: photos of acquired equipment */
  equipmentPhotos?: ModuleDocument[];
  status?: WithdrawalTrancheStatus;
}

export interface LandBankForm {
  accountSnapshot: ModuleDocument | null;
  /**
   * @deprecated Prefer `tranches.first.signedLetter`. Kept for migration of older records.
   */
  withdrawalLetter: ModuleDocument | null;
  withdrawalRemarks: string;
  authorityLetterGenerated: boolean;
  tranches: {
    first: WithdrawalTranchePackage;
    second: WithdrawalTranchePackage;
  };
}

export interface LandBankStored {
  form: LandBankForm;
  introductionLetter?: LbpIntroductionLetterStored;
  submitted?: boolean;
  submittedAt?: string;
  submittedBy?: string;
  updatedAt?: string;
}

// ── Modules 14–16 — Procurement & Liquidation ─────────────────────────────────

export interface ProcurementLineItem {
  id: string;
  description: string;
  supplier: string;
  purchaseDate: string;
  quantity: number;
  totalCost: string;
}

export interface ProcurementDocument {
  id: string;
  fileName: string;
  uploadedAt: string;
  amount?: string;
  mimeType?: string;
  dataUrl?: string;
  fileSizeBytes?: number;
  uploadedBy?: string;
  /** Backend file_uploads id when mirrored via the file API. */
  fileId?: string;
}

/** Staff-managed liquidation record (title/period + attachments). */
export interface LiquidationEntry {
  id: string;
  title: string;
  amount: string;
  date: string;
  remarks: string;
  attachments: ProcurementDocument[];
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface ProcurementStaffReview {
  reviewerName: string;
  reviewedAt: string;
  remarks: string;
  verified: boolean;
}

export interface ProcurementForm {
  documents: ProcurementDocument[];
  items: ProcurementLineItem[];
  /** Staff-managed multi-entry liquidations. */
  liquidations: LiquidationEntry[];
  /**
   * @deprecated Prefer `liquidations[].attachments`. Kept for normalize-on-read of older records.
   */
  liquidationDocuments?: ProcurementDocument[];
  staffReview?: ProcurementStaffReview;
  untagged: boolean;
  untaggedAt?: string;
}

export interface ProcurementStored {
  form: ProcurementForm;
  submitted?: boolean;
  submittedAt?: string;
  submittedBy?: string;
  updatedAt?: string;
}

// ── Module 17 — Refund & Delinquent Monitoring ────────────────────────────────

export type PDCStatus = "pending" | "cleared" | "bounced";

export type DelinquencyStatus =
  | "monitoring-required"
  | "current"
  | "delayed"
  | "delinquent"
  | "under-evaluation";

export interface PDCEntry {
  id: string;
  checkNumber: string;
  dueDate: string;
  accountNumber: string;
  amount: string;
  status: PDCStatus;
  note?: string;
  /** Bank receipt screenshot when status is cleared (paid). */
  paymentReceipt?: ModuleDocument;
}

export interface RefundScheduleRow {
  date: string;
  amount: string;
  balance: string;
  status: string;
}

export interface RefundDelinquentForm {
  pdcs: PDCEntry[];
  pdcsRecorded: boolean;
  refundSchedule: RefundScheduleRow[];
  delinquencyStatus: DelinquencyStatus;
  soaIssued: boolean;
  lastPaymentDate?: string;
  technologyTransferFee?: string;
  totalRefundWithTtf?: string;
  refundGraceMonths?: number;
}

export interface RefundDelinquentStored {
  form: RefundDelinquentForm;
  submitted?: boolean;
  submittedAt?: string;
  submittedBy?: string;
  updatedAt?: string;
}

// ── Annex D — Pro-forma MOA ───────────────────────────────────────────────────

export interface MoaAnnexDForm {
  projectTitle: string;
  enterpriseName: string;
  enterpriseAddress: string;
  approvedAmount: string;
  refundTermYears: string;
  projectDurationMonths: string;
  insuranceRatePercent: string;
  pstoOfficeName: string;
  regionalDirector: string;
  effectivityDate: string;
  specialProvisions: string;
}

export interface MoaAnnexDStored {
  form: MoaAnnexDForm;
  finalized?: boolean;
  finalizedAt?: string;
  updatedAt?: string;
}

// ── Form 008 — Pre-Implementation PIS (Annex E) ───────────────────────────────

export interface Form008Stored {
  draft: PrePisDraftForm;
  signedFileName?: string;
  signedDate?: string;
  submitted?: boolean;
}

// ── Module 18 — Project Close-Out ─────────────────────────────────────────────

/** SETUP Form 006 — Inventory of Equipment row (Annex A-6). */
export interface EquipmentInventoryRow {
  id: string;
  qty: string;
  description: string;
  amount: string;
  propertyNo: string;
  dateAcquired: string;
  remarks: string;
  /** @deprecated legacy close-out fields — mapped on hydrate */
  serialNumber?: string;
  acquisitionCost?: string;
  location?: string;
}

export interface ProjectCloseOutForm {
  terminalReportFileName?: string;
  auditedFinancialFileName?: string;
  equipmentAcknowledgementFileName?: string;
  /** Form 006 header / signatures */
  inventoryProjectTitle?: string;
  inventoryProjectCooperator?: string;
  inventoryConductedBy?: string;
  inventoryConductedDate?: string;
  inventoryWitnessedBy?: string;
  equipmentInventory: EquipmentInventoryRow[];
  certificateOfOwnershipIssued: boolean;
  certificateIssuedDate?: string;
  notes?: string;
}

export interface ProjectCloseOutStored {
  form: ProjectCloseOutForm;
  submitted?: boolean;
  submittedAt?: string;
  submittedBy?: string;
  updatedAt?: string;
}

// ── Backend persistence DTOs ──────────────────────────────────────────────────

export interface ApiApplicantRecord {
  id: string;
  applicationId: string;
  enterpriseName: string;
  currentModule: string;
  moduleData: Record<string, unknown>;
  /** Top-level applicant fields (name, contact, sector, ...) for full rehydration. */
  profile?: Record<string, unknown>;
  updatedAt?: string;
}

export type ApiNotificationKind = "info" | "success" | "warning" | "action";

export interface ApiNotification {
  id: string;
  audience: "applicant" | "staff";
  applicantId?: string;
  officeId?: string;
  kind: ApiNotificationKind;
  title: string;
  message: string;
  read: boolean;
  urgent?: boolean;
  timestamp: string;
  view?: string;
}

export interface ApiCreateNotificationRequest {
  id?: string;
  audience: "applicant" | "staff";
  applicantId?: string;
  officeId?: string;
  kind: ApiNotificationKind;
  title: string;
  message: string;
  read?: boolean;
  urgent?: boolean;
  timestamp?: string;
  view?: string;
}
