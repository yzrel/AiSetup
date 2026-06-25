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
  signedMoa?: SignedMoaDocument;
  updatedAt?: string;
}

export interface SignedMoaDocument {
  fileName: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  moaSignedDate: string;
  signingVenue?: string;
  notes?: string;
}

// ── SETUP Form 009 — Project Information Sheet ────────────────────────────────

export interface PrePisGadRow {
  id: string;
  genderIssues: string;
  gadObjectives: string;
  gadActivities: string;
}

export interface PrePisExpectedOutputs {
  finalProduct: string;
  publication: string;
  policy: string;
  peopleServices: string;
  partnership: string;
  economic: string;
  others: string;
}

export interface PrePisDraftForm {
  labName: string;
  projectTitle: string;
  dostPersonnelInCharge: string;
  dostInput: string;
  cooperatorInput: string;
  datePrepared: string;
  status: string;
  organizationName: string;
  organizationAddress: string;
  orgType: string;
  natureOfBusiness: string;
  sectors: string;
  yearEstablished: string;
  classification: string;
  mainProducts: string;
  technologyEmployed: string;
  productionCapacity: string;
  standardsCertifications: string;
  personInCharge: string;
  staffComplement: string;
  contactNumbers: string;
  briefDescription: string;
  implementingAgency: string;
  costLgu: string;
  costDost: string;
  costCooperators: string;
  costTotal: string;
  generalObjective: string;
  specificObjectives: string[];
  methodology: string;
  beneficiaries: string;
  expectedOutputs: PrePisExpectedOutputs;
  partnerFunding: string;
  partnerGrant: string;
  partnerOthers: string;
  schedulePreImplementation: string;
  scheduleImplementation: string;
  scheduleOperation: string;
  projectLocation: string;
  rdDirective: string;
  rdExpectedOutput: string;
  rdStartDate: string;
  rdCompletionDate: string;
  gadRows: PrePisGadRow[];
}

export interface SignedPrePisDocument {
  fileName: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  prePisSignedDate: string;
  notes?: string;
}

export type PisSemester = "1" | "2";

export interface PisOngoingFiling {
  id: string;
  periodLabel: string;
  reportingYear: string;
  semester: PisSemester;
  projectCode: string;
  projectTitle: string;
  firmName: string;
  ownerName: string;
  assetsLand: string;
  assetsBuilding: string;
  assetsEquipment: string;
  assetsWorkingCapital: string;
  employmentDirectMale: string;
  employmentDirectFemale: string;
  employmentIndirectMale: string;
  employmentIndirectFemale: string;
  productionVolumeLocal: string;
  productionVolumeExport: string;
  productionDetails: string;
  grossSalesLocal: string;
  grossSalesExport: string;
  exportDestinations: string;
  dostAssistance: string[];
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
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}

export interface LandBankForm {
  accountSnapshot: ModuleDocument | null;
  withdrawalLetter: ModuleDocument | null;
  withdrawalRemarks: string;
  authorityLetterGenerated: boolean;
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
  liquidationDocuments: ProcurementDocument[];
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

export interface EquipmentInventoryRow {
  id: string;
  description: string;
  serialNumber: string;
  acquisitionCost: string;
  location: string;
}

export interface ProjectCloseOutForm {
  terminalReportFileName?: string;
  auditedFinancialFileName?: string;
  equipmentAcknowledgementFileName?: string;
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
  updatedAt?: string;
}
