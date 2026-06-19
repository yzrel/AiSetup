/**
 * Author: Yzrel Jade B. Eborde
 */

import { Applicant } from "../store/applicantStore";
import { EMPTY_TNA_TABLES } from "../store/tnaFormDefaults";
import type { Tna1DocumentResponse, Tna1GenerationRequest } from "../api/types";

export type TnaTables = {
  rawMaterials: string[][];
  production: string[][];
  equipment: string[][];
};

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "boolean") return false;
  return String(value).trim() === "";
}

function isTableEmpty(rows: string[][]): boolean {
  if (!rows?.length) return true;
  return rows.every((row) => row.every((cell) => isBlank(cell)));
}

function firstNonBlank(...values: (string | undefined)[]): string {
  for (const v of values) {
    if (v?.trim()) return v.trim();
  }
  return "";
}

export function buildTna1GenerationPayload(
  applicant: Applicant,
  form: Record<string, unknown>,
  tables: TnaTables,
): Tna1GenerationRequest {
  const md = applicant.moduleData ?? {};
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
    yearsOfOperation: applicant.yearsOfOperation,
    assetSize: applicant.assetSize,
    productServices: String(md.productServices ?? md.coreProducts ?? ""),
    projectDescription: String(md.projectDescription ?? ""),
    expectedOutcome: String(md.expectedOutcome ?? ""),
    companyDescription: String(md.companyDescription ?? ""),
    loiBackground,
    form,
    tables,
  };
}

export function mergeAiTnaSuggestions(
  currentForm: Record<string, unknown>,
  currentTables: TnaTables,
  response: Tna1DocumentResponse,
): { form: Record<string, unknown>; tables: TnaTables } {
  const form = { ...currentForm };
  for (const [key, value] of Object.entries(response.form ?? {})) {
    if (isBlank(form[key]) && !isBlank(value)) {
      form[key] = value;
    }
  }

  const tables: TnaTables = {
    rawMaterials: [...currentTables.rawMaterials],
    production: [...currentTables.production],
    equipment: [...currentTables.equipment],
  };

  if (isTableEmpty(tables.rawMaterials) && response.tables?.rawMaterials?.length) {
    tables.rawMaterials = response.tables.rawMaterials.map((row) => [...row]);
  }
  if (isTableEmpty(tables.production) && response.tables?.production?.length) {
    tables.production = response.tables.production.map((row) => [...row]);
  }
  if (isTableEmpty(tables.equipment) && response.tables?.equipment?.length) {
    tables.equipment = response.tables.equipment.map((row) => [...row]);
  }

  return { form, tables };
}

export function buildLocalTna1Document(
  payload: Tna1GenerationRequest,
): Tna1DocumentResponse {
  const enterprise = payload.enterpriseName || "the enterprise";
  const product = firstNonBlank(
    String(payload.form.mainProduct ?? ""),
    payload.productServices,
    payload.businessNature,
  );
  const sector = firstNonBlank(
    String(payload.form.sector ?? ""),
    payload.businessSector,
  );
  const background = firstNonBlank(
    payload.loiBackground,
    payload.companyDescription,
    payload.projectDescription,
  );
  const project = payload.projectDescription ?? "";
  const outcome = payload.expectedOutcome ?? "";

  const form: Record<string, string> = {};

  const put = (key: string, value: string) => {
    if (isBlank(payload.form[key]) && value.trim()) {
      form[key] = value.trim();
    }
  };

  put(
    "enterpriseBackground",
    background ||
      `${enterprise} is a ${payload.msmeSize || "registered"} enterprise in the ${sector || "local"} sector engaged in ${product || "its core business"}.`,
  );
  put(
    "reasonsForAssistance",
    project ||
      "The enterprise seeks DOST SETUP assistance to upgrade production technology and improve productivity.",
  );
  put(
    "plan5Years",
    outcome ||
      "Within five years, the enterprise aims to increase production capacity, improve product quality, and expand market reach.",
  );
  put(
    "plan10Years",
    "Within ten years, the enterprise plans to scale operations sustainably and explore new markets while maintaining compliance with industry standards.",
  );
  put(
    "productionProblemsConcerns",
    "Key concerns include manual or semi-automated processes, capacity constraints, and the need for technology upgrading to meet quality and volume targets.",
  );
  put(
    "wasteManagement",
    "Waste is segregated at source; disposal follows local environmental regulations.",
  );
  put(
    "productionPlan",
    project || "Production will be optimized through upgraded equipment and improved process controls.",
  );
  put(
    "inventorySystem",
    "Raw materials and finished goods are tracked through manual ledgers with periodic physical counts.",
  );
  put(
    "maintenanceProgram",
    "Equipment is maintained on a preventive schedule; repairs are documented.",
  );
  put(
    "cgmpHaccp",
    "The enterprise follows basic good manufacturing practices appropriate to its product line.",
  );
  put(
    "purchasingSystem",
    "Suppliers are evaluated for quality and reliability; purchase orders are issued for major acquisitions.",
  );
  if (payload.form.processFlowMode !== "attachment") {
    put(
      "processFlow",
      "Receiving → preparation → processing → packaging → storage → distribution.",
    );
  }
  put(
    "marketingPlan",
    "Products are marketed through local retailers, institutional buyers, and direct sales channels.",
  );
  put("marketOutlets", "Local markets and institutional clients within Region XII.");
  put(
    "promotionalStrategies",
    "Product sampling, trade fairs, social media presence, and distributor partnerships.",
  );
  put(
    "marketCompetitors",
    "Competing enterprises in the same commodity segment; differentiation through quality and consistent supply.",
  );
  put(
    "cashFlow",
    "Revenue is generated from product sales; operating expenses cover raw materials, labor, utilities, and maintenance.",
  );
  put(
    "capitalSource",
    "Owner equity and reinvested earnings; SETUP assistance sought for technology acquisition.",
  );
  put(
    "accountingSystem",
    "Manual or spreadsheet-based bookkeeping with periodic financial review.",
  );
  put(
    "hiringCriteria",
    "Workers are hired based on skills, experience, and reliability.",
  );
  put("employeeIncentives", "Performance-based incentives and statutory benefits as applicable.");
  put(
    "trainingDevelopment",
    "On-the-job training and skills upgrading aligned with new technology adoption.",
  );
  put(
    "safetyMeasures",
    "Workplace safety orientation, PPE use, and compliance with occupational health standards.",
  );
  put(
    "employeeWelfare",
    "Statutory benefits and safe working conditions are provided to all employees.",
  );
  put("otherConcerns", "None reported at this time.");

  const tables: TnaTables = { ...EMPTY_TNA_TABLES };
  if (isTableEmpty(payload.tables.rawMaterials)) {
    tables.rawMaterials = [
      ["Primary raw material", "Local suppliers", "To be verified", "To be verified"],
    ];
  }
  if (isTableEmpty(payload.tables.production)) {
    tables.production = [
      [product || "Main product", "To be verified", "To be verified", "To be verified"],
    ];
  }
  if (isTableEmpty(payload.tables.equipment)) {
    tables.equipment = [
      [
        "Existing production equipment",
        "As installed",
        "Current capacity",
        "1",
        "To be verified",
      ],
    ];
  }

  return {
    form,
    tables,
    generatedAt: new Date().toISOString(),
    aiGenerated: false,
  };
}

export function buildTna1DocumentSnapshot(
  form: Record<string, unknown>,
  tables: TnaTables,
  aiGenerated: boolean,
  generatedAt: string,
) {
  return {
    form: { ...form },
    tables: {
      rawMaterials: tables.rawMaterials.map((r) => [...r]),
      production: tables.production.map((r) => [...r]),
      equipment: tables.equipment.map((r) => [...r]),
    },
    aiGenerated,
    generatedAt,
  };
}
