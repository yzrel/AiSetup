import { applicantStore, Applicant } from "../store/applicantStore";
import { EMPTY_TNA_TABLES } from "../store/tnaFormDefaults";
import type {
  Tna2DocumentResponse,
  Tna2GenerationRequest,
  Tna2StoredDocument,
} from "../api/types";

function getTna1Data(applicant: Applicant) {
  const md = applicant.moduleData ?? {};
  const doc = md.tna1Document as { form?: Record<string, unknown>; tables?: typeof EMPTY_TNA_TABLES } | undefined;
  const tna1 = md.tna1 as { form?: Record<string, unknown>; tables?: typeof EMPTY_TNA_TABLES } | undefined;
  return {
    form: doc?.form ?? tna1?.form ?? {},
    tables: doc?.tables ?? tna1?.tables ?? EMPTY_TNA_TABLES,
  };
}

export function buildTna2GenerationPayload(applicant: Applicant): Tna2GenerationRequest {
  const md = applicant.moduleData ?? {};
  const { form, tables } = getTna1Data(applicant);
  const loiDoc = md.loiDocument as { bodyParagraphs?: string[] } | undefined;
  const loiBackground = loiDoc?.bodyParagraphs?.length
    ? loiDoc.bodyParagraphs.join("\n\n")
    : "";

  return {
    applicationId: applicant.applicationId,
    enterpriseName: applicant.enterpriseName,
    applicantName: applicant.applicantName,
    designation: applicant.designation,
    emailAddress: applicant.emailAddress,
    contactNumber: applicant.contactNumber,
    address: applicant.address,
    province: String(md.province ?? ""),
    msmeSize: applicant.msmeSize,
    businessType: applicant.businessType,
    businessSector: applicant.businessSector,
    businessNature: applicant.businessNature,
    productServices: String(md.productServices ?? md.coreProducts ?? ""),
    projectDescription: String(md.projectDescription ?? ""),
    expectedOutcome: String(md.expectedOutcome ?? ""),
    budget: String(md.budget ?? ""),
    loiBackground,
    tna1Form: form,
    tna1Tables: tables,
  };
}

export function buildLocalTna2Document(
  payload: Tna2GenerationRequest,
): Tna2DocumentResponse {
  const form = payload.tna1Form ?? {};
  const problems = String(form.productionProblemsConcerns ?? "");
  const year = new Date().getFullYear();
  const appId = payload.applicationId ?? "";
  const docRef = appId.includes("-")
    ? `TNA2-${appId.split("-").slice(-2).join("-")}`
    : `TNA2-${year}-000001`;

  return {
    documentRef: docRef,
    assessmentDate: new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    applicationId: payload.applicationId,
    enterpriseProfile: {
      enterpriseName: String(form.enterpriseName ?? payload.enterpriseName),
      address: String(form.officeAddress ?? payload.address),
      businessType: String(form.organizationType ?? payload.businessType),
      sector: String(form.sector ?? payload.businessSector),
      commodity: String(form.commodity ?? payload.businessNature),
      mainProduct: String(form.mainProduct ?? payload.productServices),
      employees: `${form.employeesMale ?? ""} male / ${form.employeesFemale ?? ""} female`,
      contactPerson: String(form.contactPerson ?? payload.applicantName),
      contactNumber: String(form.officeTel ?? payload.contactNumber),
      emailAddress: String(form.officeEmail ?? payload.emailAddress),
    },
    siteValidationFindings: [
      "Site validation confirmed operations at the registered production location.",
      problems || "Production workflow and equipment were assessed on-site.",
    ],
    productionProcessAnalysis: {
      summary: String(
        form.processFlow ??
          "Semi-manual production workflow with opportunities for technology upgrading.",
      ),
      findings: [
        problems || "Manual processes create bottlenecks during peak production.",
        "Equipment capacity limits throughput relative to demand.",
      ],
    },
    technologyGaps: [
      "Limited automation in core production steps",
      "Manual packaging operations",
      "Process control gaps affecting consistency",
    ],
    proposedInterventions: [
      payload.projectDescription ||
        "Technology upgrading aligned with SETUP program objectives.",
      "Semi-automated processing and packaging systems.",
    ],
    recommendedEquipment: (payload.tna1Tables?.equipment ?? [])
      .filter((row) => row.some((c) => c?.trim()))
      .map((row, i) => ({
        name: row[0] || "Recommended equipment",
        specifications: row[1] || "Per TNA assessment",
        quantity: row[3] || "1",
        estimatedCost: "To be verified",
        priority: i === 0 ? "High" : "Medium",
      })),
    productivityImprovement: {
      kpis: [
        {
          label: "Production Volume",
          before: "Baseline per TNA Form 01",
          after: "Projected increase",
          change: "To be measured",
        },
      ],
      outcomes: [
        payload.expectedOutcome ||
          "Improved productivity through technology intervention.",
      ],
    },
    assessor: {
      name: "PROVINCIAL DIRECTOR",
      title: "Provincial Director",
      office: "DOST Region XII",
    },
    generatedAt: new Date().toISOString(),
    aiGenerated: false,
  };
}

export function publishTna2Document(
  applicantId: string,
  document: Tna2DocumentResponse,
): Tna2StoredDocument {
  const stored: Tna2StoredDocument = {
    ...document,
    published: true,
    publishedAt: new Date().toISOString(),
  };
  const applicant = applicantStore.getById(applicantId);
  if (applicant) {
    applicantStore.update(applicantId, {
      moduleData: {
        ...applicant.moduleData,
        tna2Document: stored,
      },
    });
  }
  return stored;
}

export function saveTna2Draft(
  applicantId: string,
  document: Tna2DocumentResponse,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = applicant.moduleData?.tna2Document as Tna2StoredDocument | undefined;
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      tna2Document: {
        ...document,
        published: existing?.published ?? false,
        publishedAt: existing?.publishedAt,
      },
    },
  });
}

export function getPublishedTna2(applicant: Applicant | null): Tna2StoredDocument | null {
  if (!applicant?.moduleData?.tna2Document) return null;
  const doc = applicant.moduleData.tna2Document as Tna2StoredDocument;
  return doc.published ? doc : null;
}

export function getTna2Draft(applicant: Applicant | null): Tna2StoredDocument | null {
  if (!applicant?.moduleData?.tna2Document) return null;
  return applicant.moduleData.tna2Document as Tna2StoredDocument;
}
