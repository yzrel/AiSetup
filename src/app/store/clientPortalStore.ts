// ── Client Portal Store ────────────────────────────────────────────────────────
// Purely client-to-client. DOST has NO relation to this module.

export interface Notification {
  id: string;
  type: 'sms' | 'email' | 'web';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  urgent?: boolean;
}

export interface TrackingStep {
  id: string;
  step: number;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'action-required';
  completedAt?: string;
  dueDate?: string;
  actionRequired?: string;
  legalBasis?: string; // Anti-Red Tape Act reference
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  uploadedFile?: string;
  status: 'missing' | 'uploaded' | 'approved' | 'rejected';
  rejectionReason?: string;
  forTranche: 1 | 2 | 'both';
}

export interface WithdrawalTranche {
  id: 1 | 2;
  label: string;
  amount: string;
  status: 'on-hold' | 'processing' | 'released';
  holdReason?: string;
  requirements: DocumentRequirement[];
  releaseDate?: string;
}

export interface Equipment {
  id: string;
  clientId: string;
  clientName: string;
  enterpriseName: string;
  name: string;
  description: string;
  imageUrl?: string;
  quotationUrl?: string;
  status: 'pending-review' | 'approved' | 'flagged' | 'rejected';
  reviewNote?: string;
  submittedAt: string;
  likes: string[]; // clientIds
  comments: Comment[];
}

export interface Comment {
  id: string;
  clientId: string;
  clientName: string;
  avatarInitials: string;
  text: string;
  timestamp: string;
  likes: string[];
}

export interface FeedPost {
  id: string;
  clientId: string;
  clientName: string;
  enterpriseName: string;
  avatarInitials: string;
  avatarColor: string;
  content: string;
  imageUrl?: string;
  equipmentId?: string;
  type: 'equipment-update' | 'status-update' | 'milestone' | 'general';
  trancheStatus?: string;
  likes: string[];
  comments: Comment[];
  timestamp: string;
  tags?: string[];
}

// ── Seed data ──────────────────────────────────────────────────────────────────

const seedNotifications: Notification[] = [
  {
    id: 'n1', type: 'web', read: false, urgent: true,
    title: '⚠️ Action Required: Missing Documents',
    message: 'Your 1st tranche withdrawal is on hold. Please upload: Equipment Quotation and Equipment Photos. Deadline: 7 days.',
    timestamp: '2026-05-11T09:00:00',
  },
  {
    id: 'n2', type: 'email', read: false,
    title: '📧 Email Sent: Application Update',
    message: 'An email has been sent to your registered address regarding your SETUP application status.',
    timestamp: '2026-05-10T14:30:00',
  },
  {
    id: 'n3', type: 'sms', read: true,
    title: '📱 SMS Sent: OTP Verification',
    message: 'An SMS with a verification code was sent to your registered mobile number.',
    timestamp: '2026-05-09T11:00:00',
  },
  {
    id: 'n4', type: 'web', read: true,
    title: '✅ Equipment Approved',
    message: 'Your Automatic Cooking Retort equipment submission has been reviewed and approved by peer reviewers.',
    timestamp: '2026-05-08T16:45:00',
  },
  {
    id: 'n5', type: 'web', read: false, urgent: true,
    title: '⚠️ 2nd Tranche: Documents Incomplete',
    message: 'Your 2nd tranche is on hold pending: Before/After Photos of Equipment Installation.',
    timestamp: '2026-05-07T10:00:00',
  },
];

const seedTrackingSteps: TrackingStep[] = [
  {
    id: 'ts1', step: 1, label: 'Application Submitted',
    description: 'Your SETUP application has been officially submitted and received.',
    status: 'completed', completedAt: 'Mar 5, 2026',
    legalBasis: 'RA 11032 §6 — Agencies must acknowledge receipt within 3 working days',
  },
  {
    id: 'ts2', step: 2, label: 'Pre-Screening & Eligibility',
    description: 'DOST evaluates your enterprise eligibility based on MSME classification and operational requirements.',
    status: 'completed', completedAt: 'Mar 10, 2026',
    legalBasis: 'RA 11032 §9 — Simple transactions: max 3 working days',
  },
  {
    id: 'ts3', step: 3, label: 'Document Verification',
    description: 'Submitted documents are reviewed for completeness and authenticity.',
    status: 'completed', completedAt: 'Mar 20, 2026',
    legalBasis: 'RA 11032 §9 — Complex transactions: max 7 working days',
  },
  {
    id: 'ts4', step: 4, label: 'Technology Needs Assessment',
    description: 'DOST conducts on-site TNA to identify appropriate technology interventions.',
    status: 'completed', completedAt: 'Apr 2, 2026',
    legalBasis: 'RA 11032 §9 — Highly technical: max 20 working days',
  },
  {
    id: 'ts5', step: 5, label: 'Project Proposal & RTEC Evaluation',
    description: 'Regional Technical Evaluation Committee reviews and approves the project proposal.',
    status: 'completed', completedAt: 'Apr 20, 2026',
    legalBasis: 'RA 11032 §9 — Highly technical: max 20 working days',
  },
  {
    id: 'ts6', step: 6, label: 'MOA Signing',
    description: 'Memorandum of Agreement signed between enterprise and DOST Regional Office.',
    status: 'completed', completedAt: 'Apr 27, 2026',
    legalBasis: 'RA 11032 §10 — MOA execution within prescribed period',
  },
  {
    id: 'ts7', step: 7, label: '1st Tranche Withdrawal',
    description: 'First tranche (60%) of approved funds to be released upon submission of required documents.',
    status: 'action-required', dueDate: 'May 18, 2026',
    actionRequired: 'Upload Equipment Quotation and Equipment Photos to release your 1st tranche.',
    legalBasis: 'RA 11032 §6 — No additional requirements beyond what was listed',
  },
  {
    id: 'ts8', step: 8, label: 'Equipment Procurement',
    description: 'Procure approved equipment and submit official receipts and delivery documents.',
    status: 'pending',
    legalBasis: 'RA 11032 §6 — Procurement must follow prescribed timelines',
  },
  {
    id: 'ts9', step: 9, label: '2nd Tranche Withdrawal',
    description: 'Second tranche (40%) released upon completion of procurement and installation.',
    status: 'pending', dueDate: 'Jul 1, 2026',
    actionRequired: 'Procurement must be completed first.',
    legalBasis: 'RA 11032 §9 — Processing within 7 working days of complete submission',
  },
  {
    id: 'ts10', step: 10, label: 'Liquidation & Monitoring',
    description: 'Submit liquidation documents and participate in post-implementation monitoring.',
    status: 'pending',
    legalBasis: 'RA 11032 §6 — No unnecessary requirements for liquidation',
  },
];

const seedTranches: WithdrawalTranche[] = [
  {
    id: 1,
    label: '1st Tranche (60%)',
    amount: '₱1,200,000',
    status: 'on-hold',
    holdReason: 'Required documents not yet uploaded. Please complete the checklist below to release your 1st tranche.',
    requirements: [
      { id: 'r1', name: 'Equipment Quotation', description: 'Official quotation from accredited supplier for each equipment to be purchased.', required: true, uploaded: false, status: 'missing', forTranche: 1 },
      { id: 'r2', name: 'Photos of Equipment (Before)', description: 'At least 3 clear photos of your current production area before equipment installation.', required: true, uploaded: false, status: 'missing', forTranche: 1 },
      { id: 'r3', name: 'Supplier Accreditation Documents', description: 'DTI or relevant accreditation of your chosen equipment supplier.', required: true, uploaded: false, status: 'missing', forTranche: 1 },
      { id: 'r4', name: 'Bank Account Details (LandBank)', description: 'Certified LandBank savings account number where funds will be deposited.', required: true, uploaded: true, status: 'approved', forTranche: 1 },
      { id: 'r5', name: 'Updated Enterprise Profile', description: 'Current production capacity, number of employees, and revenue data.', required: false, uploaded: true, status: 'approved', forTranche: 1 },
    ],
    releaseDate: undefined,
  },
  {
    id: 2,
    label: '2nd Tranche (40%)',
    amount: '₱800,000',
    status: 'on-hold',
    holdReason: '2nd tranche is on hold until 1st tranche requirements are completed and procurement is done.',
    requirements: [
      { id: 'r6', name: 'Official Receipts (OR)', description: 'Official receipts for all procured equipment matching the approved list.', required: true, uploaded: false, status: 'missing', forTranche: 2 },
      { id: 'r7', name: 'Photos of Equipment (After Installation)', description: 'Clear photos showing installed equipment in your production area.', required: true, uploaded: false, status: 'missing', forTranche: 2 },
      { id: 'r8', name: 'Delivery Receipts', description: 'Signed delivery receipts from equipment supplier.', required: true, uploaded: false, status: 'missing', forTranche: 2 },
      { id: 'r9', name: 'Liquidation Report', description: 'Completed liquidation report accounting for all fund usage.', required: true, uploaded: false, status: 'missing', forTranche: 2 },
    ],
    releaseDate: undefined,
  },
];

const AVATAR_COLORS = ['#0C2461', '#00AEEF', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const seedPosts: FeedPost[] = [
  {
    id: 'p1', clientId: 'c2', clientName: 'Maria Santos', enterpriseName: 'Sunrise Agri-Products',
    avatarInitials: 'MS', avatarColor: '#00AEEF',
    content: 'Just received our new Automated Cooking Retort! 🎉 This is a game changer for our food processing operations. Processing time reduced from 4 hours to 45 minutes. So grateful for the SETUP Program!',
    imageUrl: '', type: 'equipment-update',
    likes: ['c1', 'c3', 'c4', 'c5'],
    comments: [
      { id: 'cm1', clientId: 'c3', clientName: 'Pedro Reyes', avatarInitials: 'PR', text: 'Congratulations! Which brand did you get? We are also looking for one.', timestamp: '2026-05-10T11:00:00', likes: ['c1'] },
      { id: 'cm2', clientId: 'c1', clientName: 'Juan Dela Cruz', avatarInitials: 'JD', text: 'Amazing! How long did it take from MOA signing to delivery?', timestamp: '2026-05-10T12:30:00', likes: [] },
    ],
    timestamp: '2026-05-10T09:00:00',
    tags: ['equipment', 'food-processing', 'milestone'],
  },
  {
    id: 'p2', clientId: 'c3', clientName: 'Pedro Reyes', enterpriseName: 'Pacific Seafood Processors',
    avatarInitials: 'PR', avatarColor: '#10b981',
    content: 'Our 1st tranche has been RELEASED! 💰 After completing all the required documents and quotations, the funds came through in just 3 working days. Tips: Make sure your equipment quotations are from accredited suppliers and photos are clear. #SETUPjourney',
    type: 'status-update', trancheStatus: '1st Tranche Released',
    likes: ['c1', 'c2', 'c5', 'c6'],
    comments: [
      { id: 'cm3', clientId: 'c4', clientName: 'Ana Cruz', avatarInitials: 'AC', text: 'This is so helpful Pedro! I am still stuck on the quotation part. Who did you use as supplier?', timestamp: '2026-05-09T15:00:00', likes: ['c3'] },
    ],
    timestamp: '2026-05-09T08:30:00',
    tags: ['tranche', 'tips', 'milestone'],
  },
  {
    id: 'p3', clientId: 'c4', clientName: 'Ana Cruz', enterpriseName: 'Northern Star Textiles',
    avatarInitials: 'AC', avatarColor: '#8b5cf6',
    content: 'Quick question to the group — has anyone worked with XYZ Innovations as their equipment supplier? They gave us a really good quotation for the automatic sealing machine. Would love to hear your experiences before we finalize. 🤔',
    type: 'general',
    likes: ['c2', 'c3'],
    comments: [
      { id: 'cm4', clientId: 'c2', clientName: 'Maria Santos', avatarInitials: 'MS', text: 'Yes! We used them. Very reliable. Delivery was on time and they helped with the installation too. Highly recommend! ✅', timestamp: '2026-05-08T16:00:00', likes: ['c4', 'c1'] },
      { id: 'cm5', clientId: 'c5', clientName: 'Eduardo Villanueva', avatarInitials: 'EV', text: 'Had a different experience — make sure to get everything in writing. The after-sales support could be better.', timestamp: '2026-05-08T17:30:00', likes: ['c4'] },
    ],
    timestamp: '2026-05-08T10:00:00',
    tags: ['question', 'suppliers'],
  },
  {
    id: 'p4', clientId: 'c5', clientName: 'Eduardo Villanueva', enterpriseName: 'SOCCSKSARGEN Food Solutions',
    avatarInitials: 'EV', avatarColor: '#f59e0b',
    content: '📸 Before & After our production area! Left: old manual setup. Right: new automated line with SETUP-funded equipment. Total productivity increase: 180%! Worth every paper we had to submit 😄 #Transformation',
    type: 'milestone',
    likes: ['c1', 'c2', 'c3', 'c4', 'c6'],
    comments: [
      { id: 'cm6', clientId: 'c1', clientName: 'Juan Dela Cruz', avatarInitials: 'JD', text: 'WOW this is incredible! Sana all 🙏 We are still on 1st tranche. Inspiring!', timestamp: '2026-05-07T14:00:00', likes: ['c5'] },
    ],
    timestamp: '2026-05-07T09:00:00',
    tags: ['before-after', 'transformation', 'milestone'],
  },
  {
    id: 'p5', clientId: 'c6', clientName: 'Lorna Magtanggol', enterpriseName: 'Mindanao Craft Industries',
    avatarInitials: 'LM', avatarColor: '#ef4444',
    content: 'Hello everyone! Just joined the SETUP community. Our application was just approved and MOA has been signed. Excited for this journey! Any tips for new awardees on preparing the 1st tranche documents? 😊',
    type: 'general',
    likes: ['c1', 'c2', 'c3', 'c4', 'c5'],
    comments: [
      { id: 'cm7', clientId: 'c3', clientName: 'Pedro Reyes', avatarInitials: 'PR', text: 'Welcome Ate Lorna! My biggest tip: start getting supplier quotations EARLY, even before MOA signing if possible!', timestamp: '2026-05-06T11:00:00', likes: ['c6'] },
      { id: 'cm8', clientId: 'c2', clientName: 'Maria Santos', avatarInitials: 'MS', text: 'Congrats! Make sure photos are high resolution and labeled clearly. Rejection for blurry photos is heartbreaking 😅', timestamp: '2026-05-06T12:00:00', likes: ['c6', 'c1'] },
    ],
    timestamp: '2026-05-06T08:00:00',
    tags: ['welcome', 'newbie', 'tips'],
  },
];

const seedEquipment: Equipment[] = [
  {
    id: 'eq1', clientId: 'c1', clientName: 'Juan Dela Cruz', enterpriseName: 'ABC Food Processing',
    name: 'Automatic Cooking Retort (2-ton capacity)',
    description: 'Commercial-grade retort for sterilizing canned and bottled food products. Temperature range: 100–135°C. Capacity: 2 tons per batch. Brand: Shenkai Industrial.',
    imageUrl: '',
    quotationUrl: '',
    status: 'pending-review',
    submittedAt: 'May 11, 2026',
    likes: ['c2', 'c3'],
    comments: [
      { id: 'ce1', clientId: 'c2', clientName: 'Maria Santos', avatarInitials: 'MS', text: 'We have the same model! Very reliable. Good choice Juan!', timestamp: '2026-05-11T10:00:00', likes: [] },
    ],
  },
  {
    id: 'eq2', clientId: 'c2', clientName: 'Maria Santos', enterpriseName: 'Sunrise Agri-Products',
    name: 'Semi-Automatic Filling & Sealing Machine',
    description: 'Fills and seals sachets and pouches from 50ml to 1L. Speed: 2,000 packs/hour. Stainless steel construction, food-grade compliant.',
    imageUrl: '',
    status: 'approved',
    reviewNote: 'Equipment is appropriate for the enterprise scale and production needs. Quotation price is within market range. ✅ Approved by peer reviewers.',
    submittedAt: 'May 5, 2026',
    likes: ['c1', 'c3', 'c4', 'c5'],
    comments: [],
  },
  {
    id: 'eq3', clientId: 'c4', clientName: 'Ana Cruz', enterpriseName: 'Northern Star Textiles',
    name: 'Industrial Sewing Machine (Heavy Duty)',
    description: 'Juki LU-2810 Walking Foot Machine. For heavy materials: denim, canvas, leather. Speed: 3,500 RPM. Already tested on similar production setup.',
    imageUrl: '',
    status: 'flagged',
    reviewNote: '⚠️ Flag: Quotation price appears significantly above market rate (₱85,000 vs typical ₱45,000–₱60,000). Please re-source quotation from another accredited supplier for comparison.',
    submittedAt: 'May 3, 2026',
    likes: ['c1'],
    comments: [
      { id: 'ce2', clientId: 'c1', clientName: 'Juan Dela Cruz', avatarInitials: 'JD', text: 'Ana try checking Bernina or Singer dealers, sometimes they have better prices.', timestamp: '2026-05-04T09:00:00', likes: ['c4'] },
    ],
  },
];

// ── Store ──────────────────────────────────────────────────────────────────────

let notifications: Notification[] = [...seedNotifications];
let trackingSteps: TrackingStep[] = [...seedTrackingSteps];
let tranches: WithdrawalTranche[] = [...seedTranches];
let feedPosts: FeedPost[] = [...seedPosts];
let equipment: Equipment[] = [...seedEquipment];
let listeners: (() => void)[] = [];

const notify = () => listeners.forEach(l => l());

export const clientPortalStore = {
  // Notifications
  getNotifications: () => notifications,
  getUnreadCount: () => notifications.filter(n => !n.read).length,
  markRead: (id: string) => {
    notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    notify();
  },
  markAllRead: () => {
    notifications = notifications.map(n => ({ ...n, read: true }));
    notify();
  },

  // Tracking
  getTrackingSteps: () => trackingSteps,

  // Tranches
  getTranches: () => tranches,
  uploadDocument: (trancheId: 1 | 2, docId: string, fileName: string) => {
    tranches = tranches.map(t =>
      t.id === trancheId
        ? {
            ...t,
            requirements: t.requirements.map(r =>
              r.id === docId ? { ...r, uploaded: true, uploadedFile: fileName, status: 'uploaded' as const } : r
            ),
          }
        : t
    );
    // Check if all required docs uploaded — if so, change to processing
    const tranche = tranches.find(t => t.id === trancheId)!;
    const allRequired = tranche.requirements.filter(r => r.required).every(r => r.uploaded);
    if (allRequired) {
      tranches = tranches.map(t =>
        t.id === trancheId ? { ...t, status: 'processing' as const, holdReason: undefined } : t
      );
      // Add notification
      notifications = [
        {
          id: `n${Date.now()}`, type: 'web', read: false,
          title: `✅ ${trancheId === 1 ? '1st' : '2nd'} Tranche: All Documents Submitted`,
          message: `All required documents for your ${trancheId === 1 ? '1st' : '2nd'} tranche have been submitted. Processing has started.`,
          timestamp: new Date().toISOString(),
        },
        ...notifications,
      ];
    }
    notify();
  },

  // Equipment
  getEquipment: () => equipment,
  addEquipment: (item: Omit<Equipment, 'id' | 'submittedAt' | 'likes' | 'comments'>) => {
    const newItem: Equipment = {
      ...item, id: `eq${Date.now()}`,
      submittedAt: new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      likes: [], comments: [],
    };
    equipment = [newItem, ...equipment];
    notify();
  },
  likeEquipment: (eqId: string, clientId: string) => {
    equipment = equipment.map(e =>
      e.id === eqId
        ? { ...e, likes: e.likes.includes(clientId) ? e.likes.filter(id => id !== clientId) : [...e.likes, clientId] }
        : e
    );
    notify();
  },
  commentEquipment: (eqId: string, comment: Omit<Comment, 'id'>) => {
    equipment = equipment.map(e =>
      e.id === eqId
        ? { ...e, comments: [...e.comments, { ...comment, id: `c${Date.now()}` }] }
        : e
    );
    notify();
  },

  // Feed
  getFeedPosts: () => feedPosts,
  addPost: (post: Omit<FeedPost, 'id' | 'likes' | 'comments' | 'timestamp'>) => {
    feedPosts = [{
      ...post, id: `p${Date.now()}`, likes: [], comments: [],
      timestamp: new Date().toISOString(),
    }, ...feedPosts];
    notify();
  },
  likePost: (postId: string, clientId: string) => {
    feedPosts = feedPosts.map(p =>
      p.id === postId
        ? { ...p, likes: p.likes.includes(clientId) ? p.likes.filter(id => id !== clientId) : [...p.likes, clientId] }
        : p
    );
    notify();
  },
  commentPost: (postId: string, comment: Omit<Comment, 'id'>) => {
    feedPosts = feedPosts.map(p =>
      p.id === postId
        ? { ...p, comments: [...p.comments, { ...comment, id: `cm${Date.now()}` }] }
        : p
    );
    notify();
  },

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  },

  AVATAR_COLORS,
};
