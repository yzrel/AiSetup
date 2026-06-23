/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  REGION_12_LABEL,
  REGION_12_PROVINCES,
} from "../constants/region12";
import {
  abcFoodTna2Document,
  greenValleyLateStageModuleData,
  techInnovationsProjectProposal,
} from "../data/demoSeedModuleData";
import { syncApplicantToBackend } from "../utils/applicantPersistence";
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
  | 'project-information-sheet'
  | 'landbank-withdrawal'
  | 'procurement-liquidation'
  | 'refund-delinquent'
  | 'project-closeout'
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
    businessSector: 'Food Processing',
    yearsOfOperation: '5',
    enterpriseType: 'Manufacturing',
    msmeSize: 'Small',
    assetSize: '₱8,000,000',
    region: REGION_12_LABEL,
    address: '123 Mabini St., Koronadal City, South Cotabato',
    currentModule: 'tna2',
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
      tna1: {
        submitted: true,
        submittedAt: '2024-04-20T10:00:00.000Z',
        form: {
          enterpriseName: 'ABC Food Processing',
          contactPerson: 'Juan Dela Cruz',
          position: 'Owner',
          officeAddress: '123 Mabini St., Koronadal City, South Cotabato',
          officeTel: '09171234567',
          officeEmail: 'juan@abcfood.com',
          organizationType: 'Sole Proprietorship (DTI)',
          sector: 'Food Processing',
          commodity: 'Food Processing',
          mainProduct: 'Dried mangoes, banana chips, fruit preserves',
          employeesMale: '12',
          employeesFemale: '11',
          productionProblemsConcerns:
            'Manual packing bottlenecks and inconsistent dehydration capacity during peak season.',
          processFlow:
            'Receiving → sorting → washing → slicing → dehydration → packaging → storage → distribution',
          enterpriseBackground:
            'ABC Food Processing manufactures processed fruit products for local and regional markets.',
          reasonsForAssistance:
            'Acquisition of vacuum packaging equipment and dehydration line to improve shelf life and capacity.',
        },
        tables: {
          rawMaterials: [['Fresh fruit', 'Local farmers', '80', '5000 kg/year']],
          production: [['Dried mangoes', '3000 kg/year', '120', '360000']],
          equipment: [
            ['Tray dehydrator', '50kg/batch', '50kg/day', '2', '2018'],
            ['Manual sealer', 'Impulse type', '200 packs/hr', '3', '2020'],
          ],
        },
      },
      tna2Document: abcFoodTna2Document(),
    },
  },
  {
    id: '2',
    applicationId: 'LOI-2024-000301',
    applicantName: 'Maria Santos',
    designation: 'General Manager',
    enterpriseName: 'Tech Innovations Inc.',
    contactNumber: '09189876543',
    emailAddress: 'maria@techinno.com',
    businessType: 'Corporation',
    businessNature: 'ICT Services',
    businessSector: 'Electronics and ICT Services',
    yearsOfOperation: '8',
    enterpriseType: 'Services',
    msmeSize: 'Medium',
    assetSize: '₱32,000,000',
    region: 'General Santos City',
    address: '456 J. Catolico Ave., General Santos City',
    currentModule: 'conduct-rtec',
    qualified: true,
    submittedAt: 'Apr 15, 2024',
    lastUpdated: 'May 1, 2024',
    moduleData: {
      password: 'Demo@1234',
      accountStatus: 'active',
      province: 'General Santos City',
      projectDescription: 'Cloud-based inventory and order management system for retail operations.',
      expectedOutcome: 'Reduce order processing time by 50% and improve stock accuracy.',
      productServices: 'Software development and IT consulting',
      tna1: {
        submitted: true,
        submittedAt: '2024-04-18T09:00:00.000Z',
        form: {
          enterpriseName: 'Tech Innovations Inc.',
          contactPerson: 'Maria Santos',
          position: 'General Manager',
          officeAddress: '456 J. Catolico Ave., General Santos City',
          officeTel: '09189876543',
          officeEmail: 'maria@techinno.com',
          organizationType: 'Corporation (SEC)',
          sector: 'Electronics and ICT Services',
          commodity: 'ICT Services',
          mainProduct: 'Custom software and IT solutions',
          employeesMale: '18',
          employeesFemale: '14',
          productionProblemsConcerns:
            'Manual inventory tracking and fragmented order processing across branches.',
          processFlow:
            'Order intake → manual encoding → inventory check → fulfillment → billing → reporting',
          enterpriseBackground:
            'Tech Innovations provides software and IT services to SMEs in Region XII.',
          reasonsForAssistance:
            'Acquire integrated inventory and order management system to scale operations.',
        },
        tables: {
          rawMaterials: [['Software licenses', 'Various vendors', '100', 'Annual renewal']],
          production: [['IT services', '120 projects/year', '850000', '10200000']],
          equipment: [
            ['Workstations', 'Core i7, 16GB RAM', '40 units/day', '12', '2021'],
            ['Network server', 'On-premise', 'N/A', '2', '2020'],
          ],
        },
      },
      tna2Document: {
        documentRef: 'TNA2-2024-000301',
        assessmentDate: 'April 22, 2024',
        applicationId: 'LOI-2024-000301',
        enterpriseProfile: {
          enterpriseName: 'Tech Innovations Inc.',
          address: '456 J. Catolico Ave., General Santos City',
          businessType: 'Corporation (SEC)',
          sector: 'Electronics and ICT Services',
          commodity: 'ICT Services',
          mainProduct: 'Custom software and IT solutions',
          employees: '18 male / 14 female',
          contactPerson: 'Maria Santos',
          contactNumber: '09189876543',
          emailAddress: 'maria@techinno.com',
        },
        siteValidationFindings: [
          'Site validation confirmed registered office and development team capacity.',
          'Manual inventory and order workflows verified during peak business hours.',
          'Existing IT infrastructure supports partial automation with upgrading gaps identified.',
        ],
        productionProcessAnalysis: {
          summary:
            'Order intake → manual encoding → inventory check → fulfillment → billing → reporting',
          findings: [
            'Manual encoding creates delays during peak order volume.',
            'Inventory data is not synchronized across branch locations in real time.',
            'Reporting relies on spreadsheet consolidation with limited analytics.',
          ],
        },
        technologyGaps: [
          'No integrated inventory management system',
          'Manual order processing and encoding',
          'Limited real-time reporting and analytics',
        ],
        proposedInterventions: [
          'Deploy cloud-based inventory and order management platform',
          'Integrate barcode scanning for stock movement tracking',
          'Provide staff training on digital workflow adoption',
        ],
        recommendedEquipment: [
          {
            name: 'Barcode scanners',
            specifications: 'Wireless, USB/Bluetooth',
            quantity: '6',
            estimatedCost: '₱84,000',
            priority: 'High',
          },
          {
            name: 'Network server upgrade',
            specifications: 'RAID storage, 32GB RAM',
            quantity: '1',
            estimatedCost: '₱185,000',
            priority: 'Medium',
          },
        ],
        productivityImprovement: {
          kpis: [
            {
              label: 'Order Processing Time',
              before: '4 hours avg.',
              after: '2 hours avg.',
              change: '50% reduction',
            },
            {
              label: 'Inventory Accuracy',
              before: '82%',
              after: '96%',
              change: '+14 pp',
            },
          ],
          outcomes: [
            'Reduce order processing time by 50% and improve stock accuracy.',
            'Enable real-time inventory visibility across branch operations.',
          ],
        },
        assessor: {
          name: 'PROVINCIAL DIRECTOR',
          title: 'Provincial Director',
          office: 'DOST Provincial Office — South Cotabato',
        },
        generatedAt: '2024-04-22T10:30:00.000Z',
        aiGenerated: false,
        published: true,
        publishedAt: '2024-04-22T11:00:00.000Z',
      },
      projectProposal: techInnovationsProjectProposal(),
    },
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
    businessSector: 'Agriculture, Forestry, Livestock',
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
    moduleData: {
      password: 'Demo@1234',
      accountStatus: 'active',
      province: 'Sultan Kudarat',
    },
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
    businessSector: 'Furniture, Jewelry, GHD and Creatives',
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
    moduleData: {
      password: 'Demo@1234',
      accountStatus: 'active',
      province: 'Sarangani',
      documentsSubmitted: true,
    },
  },
  {
    id: '5',
    applicationId: 'LOI-2024-000302',
    applicantName: 'Carlos Mendoza',
    designation: 'Plant Manager',
    enterpriseName: 'Green Valley Foods',
    contactNumber: '09175551234',
    emailAddress: 'carlos@greenvalley.com',
    businessType: 'Corporation',
    businessNature: 'Food Processing',
    businessSector: 'Food Processing',
    yearsOfOperation: '7',
    enterpriseType: 'Manufacturing',
    msmeSize: 'Small',
    assetSize: '₱15,000,000',
    region: REGION_12_LABEL,
    address: '88 Agro-Industrial Park, Koronadal City, South Cotabato',
    currentModule: 'approval-letter',
    qualified: true,
    submittedAt: 'Apr 8, 2024',
    lastUpdated: 'May 10, 2024',
    moduleData: greenValleyLateStageModuleData(),
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
    const updated = applicants.find(a => a.id === id);
    if (updated) syncApplicantToBackend(updated);
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
  'prescreening', 'registration', 'letter-of-intent', 'tna1', 'tna2', 'project-proposal', 'requirements',
  'conduct-rtec', 'approval-letter',
  'project-information-sheet', 'landbank-withdrawal', 'procurement-liquidation', 'refund-delinquent', 'project-closeout', 'completed',
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
  'project-information-sheet': 'Project Information Sheet',
  'landbank-withdrawal': 'LandBank & Withdrawal',
  'procurement-liquidation': 'Procurement & Liquidation',
  'refund-delinquent': 'Refund & Delinquent',
  'project-closeout': 'Project Close-Out',
  'completed': 'Completed',
};
