/**
 * Shared moduleData fragments for demo seed applicants.
 */

export const DEMO_PASSWORD = "Demo@1234";

export function abcFoodTna2Document() {
  return {
    documentRef: "TNA2-2024-000145",
    assessmentDate: "April 24, 2024",
    applicationId: "LOI-2024-000145",
    enterpriseProfile: {
      enterpriseName: "ABC Food Processing",
      address: "123 Mabini St., Koronadal City, South Cotabato",
      businessType: "Sole Proprietorship (DTI)",
      sector: "Food Processing",
      commodity: "Food Processing",
      mainProduct: "Dried mangoes, banana chips, fruit preserves",
      employees: "12 male / 11 female",
      contactPerson: "Juan Dela Cruz",
      contactNumber: "09171234567",
      emailAddress: "juan@abcfood.com",
    },
    siteValidationFindings: [
      "Site validation confirmed production floor and packaging area capacity.",
      "Manual dehydration and sealing bottlenecks observed during peak season.",
      "Food safety documentation is in place with equipment upgrade gaps identified.",
    ],
    productionProcessAnalysis: {
      summary:
        "Receiving → sorting → washing → slicing → dehydration → packaging → storage → distribution",
      findings: [
        "Tray dehydrator capacity limits throughput during harvest peaks.",
        "Vacuum packaging is partially manual, affecting shelf-life consistency.",
        "Limited cold storage for finished goods.",
      ],
    },
    technologyGaps: [
      "Insufficient dehydration capacity",
      "Manual vacuum packaging",
      "Limited cold storage",
    ],
    proposedInterventions: [
      "Acquire vacuum packaging line and tray dehydrator upgrade",
      "Install cold storage unit for finished products",
      "Train staff on GMP-aligned packaging procedures",
    ],
    recommendedEquipment: [
      {
        name: "Vacuum packaging machine",
        specifications: "Chamber type, food-grade",
        quantity: "2",
        estimatedCost: "₱420,000",
        priority: "High",
      },
      {
        name: "Tray dehydrator upgrade",
        specifications: "50kg/batch capacity",
        quantity: "1",
        estimatedCost: "₱380,000",
        priority: "High",
      },
    ],
    productivityImprovement: {
      kpis: [
        {
          label: "Production Capacity",
          before: "3,000 kg/year",
          after: "4,200 kg/year",
          change: "+40%",
        },
        {
          label: "Shelf Life",
          before: "6 months",
          after: "12 months",
          change: "+6 months",
        },
      ],
      outcomes: [
        "Increase production capacity by 40% and meet food safety certification requirements.",
        "Improve product shelf life through vacuum packaging.",
      ],
    },
    assessor: {
      name: "PROVINCIAL DIRECTOR",
      title: "Provincial Director",
      office: "DOST Provincial Office — South Cotabato",
    },
    generatedAt: "2024-04-24T10:00:00.000Z",
    aiGenerated: false,
    published: true,
    publishedAt: "2024-04-24T11:00:00.000Z",
  };
}

export function techInnovationsProjectProposal() {
  return {
    form: {
      projectTitle: "Cloud-based Inventory and Order Management System",
      firmName: "Tech Innovations Inc.",
      contactPerson: "Maria Santos",
      amountRequested: "Php 1,500,000.00",
      projectDuration: "12 months",
      projectLocation: "General Santos City",
    },
    attachments: [],
    submitted: true,
    submittedAt: "2024-05-01T10:00:00.000Z",
  };
}

export function greenValleyLateStageModuleData() {
  return {
    password: DEMO_PASSWORD,
    accountStatus: "active",
    province: "South Cotabato",
    approvedAmount: "₱1,800,000",
    projectDescription:
      "Cold chain and vacuum packaging upgrade for processed vegetable products.",
    tna1: {
      submitted: true,
      submittedAt: "2024-04-10T09:00:00.000Z",
      form: {
        enterpriseName: "Green Valley Foods",
        contactPerson: "Carlos Mendoza",
        position: "Plant Manager",
        officeAddress: "88 Agro-Industrial Park, Koronadal City, South Cotabato",
        officeTel: "09175551234",
        officeEmail: "carlos@greenvalley.com",
        organizationType: "Corporation (SEC)",
        sector: "Food Processing",
        commodity: "Food Processing",
        mainProduct: "Frozen and vacuum-packed vegetables",
        employeesMale: "15",
        employeesFemale: "20",
        productionProblemsConcerns:
          "Cold chain gaps and manual packaging limit export readiness.",
        processFlow:
          "Receiving → washing → blanching → freezing → packaging → cold storage → distribution",
        enterpriseBackground:
          "Green Valley Foods processes vegetables for domestic and export markets.",
        reasonsForAssistance:
          "Upgrade cold storage and vacuum packaging for export compliance.",
      },
    },
    tna2Document: {
      documentRef: "TNA2-2024-000302",
      assessmentDate: "April 18, 2024",
      applicationId: "LOI-2024-000302",
      enterpriseProfile: {
        enterpriseName: "Green Valley Foods",
        address: "88 Agro-Industrial Park, Koronadal City, South Cotabato",
        businessType: "Corporation (SEC)",
        sector: "Food Processing",
        commodity: "Food Processing",
        mainProduct: "Frozen and vacuum-packed vegetables",
        employees: "15 male / 20 female",
        contactPerson: "Carlos Mendoza",
        contactNumber: "09175551234",
        emailAddress: "carlos@greenvalley.com",
      },
      siteValidationFindings: [
        "Cold storage capacity verified as below export requirements.",
        "Packaging line requires automation for consistent seal quality.",
      ],
      productionProcessAnalysis: {
        summary:
          "Receiving → washing → blanching → freezing → packaging → cold storage → distribution",
        findings: ["Manual packaging slows throughput", "Cold storage at capacity"],
      },
      technologyGaps: ["Insufficient cold storage", "Manual packaging line"],
      proposedInterventions: [
        "Install blast freezer and cold storage expansion",
        "Automated vacuum packaging line",
      ],
      recommendedEquipment: [
        {
          name: "Blast freezer",
          specifications: "Export-grade",
          quantity: "1",
          estimatedCost: "₱650,000",
          priority: "High",
        },
      ],
      productivityImprovement: {
        kpis: [
          {
            label: "Cold Storage Capacity",
            before: "5 tons",
            after: "12 tons",
            change: "+140%",
          },
        ],
        outcomes: ["Meet export cold chain requirements"],
      },
      assessor: {
        name: "PROVINCIAL DIRECTOR",
        title: "Provincial Director",
        office: "DOST Provincial Office — South Cotabato",
      },
      generatedAt: "2024-04-18T10:00:00.000Z",
      published: true,
      publishedAt: "2024-04-18T11:00:00.000Z",
    },
    projectProposal: {
      form: {
        projectTitle: "Cold Chain and Vacuum Packaging Upgrade",
        firmName: "Green Valley Foods",
        contactPerson: "Carlos Mendoza",
        amountRequested: "Php 1,800,000.00",
        projectDuration: "18 months",
        projectLocation: "Koronadal City, South Cotabato",
      },
      attachments: [],
      submitted: true,
      submittedAt: "2024-04-25T10:00:00.000Z",
    },
    rtecReport: {
      form: {
        projectTitle: "Cold Chain and Vacuum Packaging Upgrade",
        enterpriseName: "Green Valley Foods",
        recommendation: "APPROVED",
        projectCostSetup: "Php 1,800,000.00",
        complianceItems: [
          { label: "Documentary requirements complete", status: true },
          { label: "Technical evaluation favorable", status: true },
          { label: "Financial viability confirmed", status: true },
        ],
        signatures: {
          chairperson: "RTEC Chairperson",
          member1: "RTEC Member",
        },
      },
      submitted: true,
      submittedAt: "2024-05-10T14:00:00.000Z",
    },
    assessments: [{ decision: "rtec-completed", date: "2024-05-10" }],
  };
}
