import {
  REGION_12_LABEL,
  REGION_12_PROVINCES,
} from "../constants/region12";
// Simple in-memory store using a singleton + event-based reactivity

export type ModuleStatus =
  | 'prescreening'
  | 'registration'
  | 'letter-of-intent'
  | 'requirements'
  | 'tna1'
  | 'tna2'
  | 'project-proposal'
  | 'conduct-rtec'
  | 'approval-letter'
  | 'landbank-withdrawal'
  | 'procurement-liquidation'
  | 'refund-delinquent'
  | 'completed';

export interface Applicant {
  id: string;
  applicationId: string;
  // Basic info
  applicantName: string;
  designation: string;
  enterpriseName: string;
  contactNumber: string;
  emailAddress: string;
  businessType: string;
  businessNature: string;
  businessSector: string;
  yearsOfOperation: string;
  enterpriseType: string;
  msmeSize: string;
  assetSize: string;
  region: string;
  address: string;
  // Status
  currentModule: ModuleStatus;
  qualified: boolean;
  submittedAt: string;
  lastUpdated: string;
  // Module-specific data (flexible)
  moduleData: Record<string, any>;
}

// Generate a readable application ID
function generateAppId(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 900000) + 100000);
  return `LOI-${year}-${num}`;
}

// ── Seed data ──────────────────────────────────────────────────────────────────

const seedApplicants: Applicant[] = [
  {
    id: '1',
    applicationId: 'LOI-2024-000145',
    applicantName: 'Juan Dela Cruz',
    designation: 'Owner',
    enterpriseName: 'ABC Food Processing',
    contactNumber: '09171234567',
    emailAddress: 'juan@abcfood.com',
    businessType: 'Single Proprietorship',
    businessNature: 'Food Processing',
    businessSector: 'Agri-processing',
    yearsOfOperation: '5',
    enterpriseType: 'Manufacturing',
    msmeSize: 'Small',
    assetSize: '₱8,000,000',
    region: REGION_12_LABEL,
    address: '123 Mabini St., Koronadal City, South Cotabato',
    currentModule: 'approval-letter',
    qualified: true,
    submittedAt: 'Apr 10, 2024',
    lastUpdated: 'Apr 27, 2024',
    moduleData: {
      approvedAmount: '₱2,000,000',
      password: 'Demo@1234',
      accountStatus: 'active',
      province: 'South Cotabato',
      zipCode: '9506',
      tinNumber: '123-456-789-000',
      registrationType: 'DTI',
      registrationNumber: 'DTI-12-0012345',
      dateEstablished: '2019-03-15',
      companyDescription:
        'ABC Food Processing manufactures and distributes processed food products for local and regional markets.',
      coreProducts: 'Dried mangoes, banana chips, fruit preserves',
      productServices: 'Dried mangoes, banana chips, fruit preserves',
      exportClassification: 'Domestic with export potential',
      turnover: '₱4,500,000',
      projectDescription:
        'Acquisition of vacuum packaging equipment and small-scale dehydration line to improve product shelf life and capacity.',
      expectedOutcome:
        'Increase production capacity by 40% and meet food safety certification requirements.',
      budget: '2500000',
      timeline: '18 months',
    },
  },
  {
    id: '2',
    applicationId: 'LOI-2024-000201',
    applicantName: 'Maria Santos',
    designation: 'General Manager',
    enterpriseName: 'Tech Innovations Inc.',
    contactNumber: '09189876543',
    emailAddress: 'maria@techinno.com',
    businessType: 'Corporation',
    businessNature: 'ICT Services',
    businessSector: 'Services',
    yearsOfOperation: '8',
    enterpriseType: 'Services',
    msmeSize: 'Medium',
    assetSize: '₱32,000,000',
    region: REGION_12_PROVINCES[4],
    address: '456 J. Catolico Ave., General Santos City',
    currentModule: 'tna1',
    qualified: true,
    submittedAt: 'Apr 15, 2024',
    lastUpdated: 'Apr 25, 2024',
    moduleData: { password: 'Demo@1234', accountStatus: 'blocked' },
  },
  {
    id: '3',
    applicationId: 'LOI-2024-000312',
    applicantName: 'Pedro Reyes',
    designation: 'Owner',
    enterpriseName: 'Sunrise Agri-Products',
    contactNumber: '09201122334',
    emailAddress: 'pedro@sunrise.com',
    businessType: 'Partnership',
    businessNature: 'Agriculture',
    businessSector: 'Agri-processing',
    yearsOfOperation: '3',
    enterpriseType: 'Manufacturing',
    msmeSize: 'Small',
    assetSize: '₱5,500,000',
    region: REGION_12_PROVINCES[2],
    address: '789 Quezon Blvd., Tacurong City, Sultan Kudarat',
    currentModule: 'registration',
    qualified: true,
    submittedAt: 'Apr 20, 2024',
    lastUpdated: 'Apr 22, 2024',
    moduleData: {},
  },
  {
    id: '4',
    applicationId: 'LOI-2024-000445',
    applicantName: 'Ana Cruz',
    designation: 'CEO',
    enterpriseName: 'Northern Star Textiles',
    contactNumber: '09154433221',
    emailAddress: 'ana@northernstar.com',
    businessType: 'Corporation',
    businessNature: 'Textiles',
    businessSector: 'Manufacturing',
    yearsOfOperation: '12',
    enterpriseType: 'Manufacturing',
    msmeSize: 'Small',
    assetSize: '₱12,000,000',
    region: REGION_12_PROVINCES[3],
    address: '321 National Highway, Alabel, Sarangani',
    currentModule: 'requirements',
    qualified: true,
    submittedAt: 'Apr 18, 2024',
    lastUpdated: 'Apr 24, 2024',
    moduleData: {},
  },
];

// ── Store ──────────────────────────────────────────────────────────────────────

let applicants: Applicant[] = [...seedApplicants];
let listeners: (() => void)[] = [];

export const applicantStore = {
  getAll: () => applicants,

  getById: (id: string) => applicants.find(a => a.id === id),

  getByEmail: (email: string) =>
    applicants.find(
      (a) => a.emailAddress.toLowerCase() === email.toLowerCase(),
    ),

  verifyLogin: (email: string, password: string) => {
    const applicant = applicantStore.getByEmail(email);
    if (!applicant) return null;
    if (!applicant.moduleData?.password) return null;
    if (applicant.moduleData.password !== password) return null;
    if (applicant.moduleData.accountStatus === 'blocked') return null;
    return applicant;
  },

  getLoginBlockReason: (email: string, password: string) => {
    const applicant = applicantStore.getByEmail(email);
    if (!applicant || !applicant.moduleData?.password) return 'not_found';
    if (applicant.moduleData.accountStatus === 'blocked') return 'blocked';
    if (applicant.moduleData.password !== password) return 'invalid_password';
    return null;
  },

  /** Applicants who completed registration (have login credentials) */
  getRegisteredAccounts: () =>
    applicants.filter((a) => !!a.moduleData?.password),

  isAccountBlocked: (applicant: Applicant) =>
    applicant.moduleData?.accountStatus === 'blocked',

  setPassword: (id: string, password: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return false;
    applicantStore.update(id, {
      moduleData: { ...applicant.moduleData, password },
    });
    return true;
  },

  setAccountStatus: (id: string, status: 'active' | 'blocked') => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return false;
    applicantStore.update(id, {
      moduleData: { ...applicant.moduleData, accountStatus: status },
    });
    return true;
  },

  blockAccount: (id: string) => applicantStore.setAccountStatus(id, 'blocked'),

  unblockAccount: (id: string) => applicantStore.setAccountStatus(id, 'active'),

  getByModule: (module: ModuleStatus) =>
    applicants.filter(a => a.currentModule === module),

  add: (data: Omit<Applicant, 'id' | 'applicationId' | 'submittedAt' | 'lastUpdated'>) => {
    const now = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    const newApp: Applicant = {
      ...data,
      id: String(Date.now()),
      applicationId: generateAppId(),
      submittedAt: now,
      lastUpdated: now,
    };
    applicants = [...applicants, newApp];
    listeners.forEach(l => l());
    return newApp;
  },

  update: (id: string, updates: Partial<Applicant>) => {
    const now = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    applicants = applicants.map(a =>
      a.id === id ? { ...a, ...updates, lastUpdated: now } : a
    );
    listeners.forEach(l => l());
  },

  advanceModule: (id: string, nextModule: ModuleStatus) => {
    applicantStore.update(id, { currentModule: nextModule });
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  },
};

export const MODULE_ORDER: ModuleStatus[] = [
  'prescreening', 'registration', 'letter-of-intent', 'requirements',
  'tna1', 'tna2', 'project-proposal', 'conduct-rtec', 'approval-letter',
  'landbank-withdrawal', 'procurement-liquidation', 'refund-delinquent', 'completed',
];

export const MODULE_LABELS: Record<ModuleStatus, string> = {
  'prescreening': 'Pre-Screening',
  'registration': 'Registration',
  'letter-of-intent': 'Letter of Intent',
  'requirements': 'Submit Requirements',
  'tna1': 'TNA 1 Assessment',
  'tna2': 'TNA 2 Technical Report',
  'project-proposal': 'Project Proposal',
  'conduct-rtec': 'Conduct of RTEC',
  'approval-letter': 'Approval Letter',
  'landbank-withdrawal': 'LandBank & Withdrawal',
  'procurement-liquidation': 'Procurement & Liquidation',
  'refund-delinquent': 'Refund & Delinquent',
  'completed': 'Completed',
};
