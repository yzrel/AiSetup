/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import { publishModuleToBackendBestEffort } from "./applicantPersistence";
import { EMPTY_TNA_TABLES } from "../store/tnaFormDefaults";
import {
  TNA_FORM_02_FINDINGS_TEMPLATE,
  TNA_FORM_02_SCOPE_GROUPS,
} from "../constants/tnaForm02Layout";
import type {
  Tna2DocumentResponse,
  Tna2FindingSection,
  Tna2FindingSubsection,
  Tna2GenerationRequest,
  Tna2ScopeItem,
  Tna2StoredDocument,
} from "../api/types";
import { normalizeTna2DocumentStored } from "./normalizeCriticalModuleData";

function str(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function joinNonBlank(...parts: unknown[]): string {
  return parts.map(str).filter(Boolean).join(" ");
}

/** Empty findings template with labeled subsections. */
export function defaultFindingsByArea(): Tna2FindingSection[] {
  return TNA_FORM_02_FINDINGS_TEMPLATE.map((section) => ({
    title: section.title,
    content: "",
    subsections: section.subsections.map((sub) => ({
      id: sub.id,
      label: sub.label,
      content: "",
    })),
  }));
}

function subsectionMap(
  sections: Tna2FindingSection[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const section of sections ?? []) {
    for (const sub of section.subsections ?? []) {
      if (sub.id && str(sub.content)) map.set(sub.id, str(sub.content));
    }
    // Legacy: single content blob maps to first subsection of that section
    if (str(section.content) && !(section.subsections ?? []).some((s) => str(s.content))) {
      const firstId = section.subsections?.[0]?.id;
      if (firstId && !map.has(firstId)) map.set(firstId, str(section.content));
    }
  }
  return map;
}

/** Merge saved findings onto the official template (by subsection id). */
export function normalizeFindingsByArea(
  saved?: Tna2FindingSection[] | null,
): Tna2FindingSection[] {
  const byId = subsectionMap(saved ?? undefined);
  const byTitle = new Map(
    (saved ?? []).map((s) => [s.title.trim().toLowerCase(), s]),
  );

  return defaultFindingsByArea().map((template) => {
    const prior = byTitle.get(template.title.trim().toLowerCase());
    const subsections: Tna2FindingSubsection[] = (template.subsections ?? []).map(
      (sub) => ({
        ...sub,
        content: byId.get(sub.id) ?? "",
      }),
    );
    const hasSubContent = subsections.some((s) => str(s.content));
    return {
      title: template.title,
      content: hasSubContent ? "" : str(prior?.content),
      subsections,
    };
  });
}

function setSubsectionContent(
  sections: Tna2FindingSection[],
  id: string,
  content: string,
): Tna2FindingSection[] {
  if (!str(content)) return sections;
  return sections.map((section) => ({
    ...section,
    subsections: (section.subsections ?? []).map((sub) =>
      sub.id === id && !str(sub.content) ? { ...sub, content: str(content) } : sub,
    ),
  }));
}

/** Prefill empty findings subsections from TNA Form 01 fields. */
export function prefillFindingsFromTna1(
  findings: Tna2FindingSection[],
  form: Record<string, unknown>,
  profileEmployees?: string,
): Tna2FindingSection[] {
  const employees =
    profileEmployees ||
    joinNonBlank(
      form.employeesMale && `${form.employeesMale} male`,
      form.employeesFemale && `${form.employeesFemale} female`,
    );
  const hr = joinNonBlank(
    employees && `Total personnel: ${employees}.`,
    form.hiringCriteria && `Hiring criteria: ${form.hiringCriteria}.`,
    form.employeeIncentives && `Incentives: ${form.employeeIncentives}.`,
    form.trainingDevelopment && `Training: ${form.trainingDevelopment}.`,
  );
  const waste = str(form.wasteManagement);
  const processFlow = str(form.processFlow);
  const problems = str(form.productionProblemsConcerns);
  const productionPlan = str(form.productionPlan);

  let next = findings;
  const put = (id: string, value: string) => {
    next = setSubsectionContent(next, id, value);
  };

  put("mission", str(form.plan5Years));
  put("vision", str(form.plan10Years));
  put(
    "plans",
    joinNonBlank(form.reasonsForAssistance, form.expectedOutcome),
  );
  put("human-resources", hr);
  put("purchasing", str(form.purchasingSystem));
  put("work-environment", str(form.safetyMeasures));
  put("compensation", str(form.employeeIncentives));
  put("ohs", str(form.safetyMeasures));
  put("business-ethics", str(form.agreements));
  put("technical-training", str(form.trainingDevelopment));
  put(
    "product-promotion",
    joinNonBlank(form.promotionalStrategies, form.marketingPlan),
  );
  put(
    "product-process-performance",
    joinNonBlank(productionPlan, problems, form.cgmpHaccp),
  );
  put("operational", processFlow);
  put("production-system", processFlow);
  put("production-planning", problems);
  put("production-layout", str(form.plantLayoutFileName) ? `Plant layout on file: ${form.plantLayoutFileName}` : "");
  put("work-study", problems);
  put("equipment-mgmt", problems);
  put("qa-system", str(form.cgmpHaccp));
  put("reengineering", str(form.reasonsForAssistance));
  put("pm-process", productionPlan);
  put("pm-product", str(form.mainProduct));
  put("continuous-improvement", str(form.expectedOutcome));
  put("product-quality", str(form.cgmpHaccp));
  put("waste-management", waste);
  put("methods-of-disposal", waste);

  return next;
}

/** Map narrative/AI fields onto the official Form 02 scope checklist. */
export function deriveScopeItems(doc: Tna2DocumentResponse): Tna2ScopeItem[] {
  if (doc.scopeItems?.length) return doc.scopeItems;

  const findings = normalizeFindingsByArea(doc.findingsByArea);
  const byId = subsectionMap(findings);

  /** Scope item id → findings subsection id(s) that indicate coverage */
  const scopeToSubsections: Record<string, string[]> = {
    "vision-mission": ["mission", "vision"],
    plans: ["plans"],
    alliances: ["alliances"],
    "human-resources": ["human-resources"],
    purchasing: ["purchasing"],
    "work-environment": ["work-environment"],
    ohs: ["ohs"],
    "business-ethics": ["business-ethics"],
    operational: ["operational"],
    "production-system": ["production-system"],
    "production-planning": ["production-planning"],
    "production-layout": ["production-layout"],
    "work-study": ["work-study"],
    "equipment-mgmt": ["equipment-mgmt"],
    "qa-system": ["qa-system"],
    reengineering: ["reengineering"],
    "pm-process": ["pm-process", "product-process-performance"],
    "pm-product": ["pm-product", "product-process-performance"],
    "continuous-improvement": ["continuous-improvement"],
    "product-quality": ["product-quality"],
    "waste-management": ["waste-management", "methods-of-disposal"],
  };

  return TNA_FORM_02_SCOPE_GROUPS.flatMap((group) =>
    group.items.map((item) => {
      const ids = scopeToSubsections[item.id] ?? [item.id];
      const notes = ids.map((id) => byId.get(id) ?? "").find((n) => n) ?? "";
      return {
        id: item.id,
        covered: !!notes,
        notes,
      };
    }),
  );
}

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

/** Fill SUMMARY OF ASSESSMENT fields from legacy narrative when missing. */
export function enrichTna2Summary(doc: Tna2DocumentResponse): Tna2DocumentResponse {
  const profile = doc.enterpriseProfile ?? {};
  const process = doc.productionProcessAnalysis ?? { summary: "", findings: [] };
  const site = doc.siteValidationFindings ?? [];
  const gaps = doc.technologyGaps ?? [];
  const interventions = doc.proposedInterventions ?? [];
  const productivity = doc.productivityImprovement ?? { kpis: [], outcomes: [] };
  const equipment = doc.recommendedEquipment ?? [];

  const background =
    doc.background?.trim() ||
    [
      profile.enterpriseName &&
        `${profile.enterpriseName} operates in the ${profile.sector || "priority"} sector`,
      profile.mainProduct && `producing ${profile.mainProduct}`,
      profile.employees && `with ${profile.employees} employees`,
      profile.address && `at ${profile.address}`,
    ]
      .filter(Boolean)
      .join(", ") + ".";

  const methodology =
    doc.methodology?.trim() ||
    [
      "The assessment was conducted through on-site plant visits, direct observation of workflow and facilities,",
      "interviews with the owner and key production staff, and review of operational documents submitted with TNA Form 01.",
      ...site,
    ].join(" ");

  let findingsByArea = normalizeFindingsByArea(doc.findingsByArea);

  // Backfill empty subsections from legacy narrative fields
  const processText = [process.summary, ...(process.findings ?? [])]
    .filter(Boolean)
    .join(" ");
  const gapText = gaps.join(" ");
  findingsByArea = setSubsectionContent(
    findingsByArea,
    "plans",
    interventions[0] || "",
  );
  findingsByArea = setSubsectionContent(
    findingsByArea,
    "human-resources",
    profile.employees || "",
  );
  findingsByArea = setSubsectionContent(findingsByArea, "operational", processText);
  findingsByArea = setSubsectionContent(
    findingsByArea,
    "production-system",
    process.summary || "",
  );
  findingsByArea = setSubsectionContent(
    findingsByArea,
    "production-planning",
    process.findings?.[0] || "",
  );
  findingsByArea = setSubsectionContent(findingsByArea, "work-study", gapText);
  findingsByArea = setSubsectionContent(
    findingsByArea,
    "equipment-mgmt",
    equipment[0]?.name || gaps.find((g) => /equipment/i.test(g)) || "",
  );
  findingsByArea = setSubsectionContent(
    findingsByArea,
    "product-process-performance",
    productivity.outcomes?.[0] || "",
  );
  findingsByArea = setSubsectionContent(
    findingsByArea,
    "pm-process",
    productivity.kpis[0]
      ? `${productivity.kpis[0].label}: ${productivity.kpis[0].before ?? ""} → ${productivity.kpis[0].after ?? ""}`
      : "",
  );
  findingsByArea = setSubsectionContent(
    findingsByArea,
    "waste-management",
    gaps.find((g) => /waste|environment|disposal/i.test(g)) || "",
  );

  const recommendations =
    doc.recommendations?.length
      ? doc.recommendations
      : interventions.length
        ? interventions
        : productivity.outcomes;

  const interventionRows =
    doc.interventionRows?.length
      ? doc.interventionRows
      : gaps.map((gap, i) => ({
          problem: gap,
          intervention: interventions[i] || interventions[0] || "",
          equipment:
            equipment[i]
              ? `${equipment[i].name}${equipment[i].specifications ? ` — ${equipment[i].specifications}` : ""}`
              : equipment[0]?.name || "",
          impact: productivity.outcomes?.[i] || productivity.outcomes?.[0] || "",
        }));

  const assessor = doc.assessor ?? {};
  const tnaTeam = doc.tnaTeam ?? {
    leader: {
      name: assessor.name || "",
      title: assessor.title || "TNA Team Leader",
    },
    members: [],
  };

  return {
    ...doc,
    background,
    methodology,
    findingsByArea,
    otherObservations:
      doc.otherObservations?.trim() ||
      site.slice(1).join(" ") ||
      "",
    conclusions:
      doc.conclusions?.trim() ||
      [
        "The enterprise demonstrates basic operational capacity with documented technology needs.",
        gaps.length
          ? `Key gaps: ${gaps.slice(0, 3).join("; ")}.`
          : "Further technology intervention is recommended under SETUP.",
      ].join(" "),
    recommendations,
    interventionRows,
    tnaTeam,
    attestedBy: doc.attestedBy ?? {
      name: "",
      title: "Assistant Regional Director",
      office: "DOST SOCCSKSARGEN",
    },
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

  const enterpriseName = String(form.enterpriseName ?? payload.enterpriseName);
  const background = [
    enterpriseName &&
      `${enterpriseName} was assessed under DOST SETUP TNA.`,
    form.enterpriseBackground && String(form.enterpriseBackground),
    form.yearEstablished &&
      `The enterprise was established in ${form.yearEstablished}.`,
    form.mainProduct &&
      `Primary products/services include ${form.mainProduct}.`,
    form.reasonsForAssistance &&
      `Assistance is sought because: ${form.reasonsForAssistance}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const employees = `${form.employeesMale ?? ""} male / ${form.employeesFemale ?? ""} female`;
  const findingsByArea = prefillFindingsFromTna1(
    defaultFindingsByArea(),
    form,
    employees,
  );

  const base: Tna2DocumentResponse = {
    documentRef: docRef,
    assessmentDate: new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    applicationId: payload.applicationId,
    enterpriseProfile: {
      enterpriseName,
      address: String(form.officeAddress ?? payload.address),
      businessType: String(form.organizationType ?? payload.businessType),
      sector: String(form.sector ?? payload.businessSector),
      commodity: String(form.commodity ?? payload.businessNature),
      mainProduct: String(form.mainProduct ?? payload.productServices),
      employees,
      contactPerson: String(form.contactPerson ?? payload.applicantName),
      contactNumber: String(form.officeTel ?? payload.contactNumber),
      emailAddress: String(form.officeEmail ?? payload.emailAddress),
    },
    background,
    methodology:
      "The assessment was conducted through on-site plant visits, direct observation of the workflow and facilities, interviews with the owner and key production staff, and a thorough review of the enterprise's financial, marketing, and operational documents submitted with TNA Form 01.",
    findingsByArea,
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
      title: "TNA Team Leader",
      office: "DOST SOCCSKSARGEN",
    },
    attestedBy: {
      name: "",
      title: "Assistant Regional Director",
      office: "DOST SOCCSKSARGEN",
    },
    generatedAt: new Date().toISOString(),
    aiGenerated: false,
  };

  return enrichTna2Summary(base);
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
    // Record the publish server-side (module.publish audit event).
    publishModuleToBackendBestEffort(applicantId, "tna2Document", {
      ...stored,
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
  const doc = normalizeTna2DocumentStored(applicant.moduleData.tna2Document) as
    | Tna2StoredDocument
    | undefined;
  return doc?.published ? doc : null;
}

export function getTna2Draft(applicant: Applicant | null): Tna2StoredDocument | null {
  if (!applicant?.moduleData?.tna2Document) return null;
  return (
    (normalizeTna2DocumentStored(applicant.moduleData.tna2Document) as
      | Tna2StoredDocument
      | undefined) ?? null
  );
}
