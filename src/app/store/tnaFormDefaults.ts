/**
 * Author: Yzrel Jade B. Eborde
 */

import { Applicant } from "./applicantStore";
import { yearFromDateEstablished } from "../utils/applicantPrefill";

export const EMPTY_TNA_TABLES = {
  rawMaterials: [["", "", "", ""]],
  production: [["", "", "", ""]],
  equipment: [["", "", "", "", ""]],
};

export function mapBusinessTypeToOrganization(businessType: string): string {
  const t = businessType.toLowerCase();
  if (t.includes("single") || t.includes("proprietor") || t.includes("dti"))
    return "Sole Proprietorship (DTI)";
  if (t.includes("cooperative") || t.includes("cda"))
    return "Cooperative (CDA)";
  if (t.includes("corporation") || t.includes("corp"))
    return "Corporation (SEC)";
  if (t.includes("partnership")) return "Partnership (SEC)";
  return "";
}

export function mapMsmeToCapitalClass(msmeSize: string): string {
  const s = msmeSize.toLowerCase();
  if (s.includes("micro")) return "Micro";
  if (s.includes("small")) return "Small";
  if (s.includes("medium")) return "Medium";
  return "";
}

export function mapMsmeToEmploymentClass(msmeSize: string): string {
  const s = msmeSize.toLowerCase();
  if (s.includes("micro")) return "Micro (1–9 employees)";
  if (s.includes("small")) return "Small (10–99 employees)";
  if (s.includes("medium")) return "Medium (100–199 employees)";
  return "";
}

function yearFromYearsOfOperation(yearsOfOperation: string): string {
  if (!yearsOfOperation) return "";
  const years = parseInt(yearsOfOperation, 10);
  if (Number.isNaN(years)) return "";
  return String(new Date().getFullYear() - years);
}

export function buildInitialTnaForm(applicant: Applicant | null) {
  const md = applicant?.moduleData ?? {};
  const dateEstablished = String(md.dateEstablished ?? "");
  const yearEstablished =
    yearFromDateEstablished(dateEstablished) ||
    yearFromYearsOfOperation(applicant?.yearsOfOperation ?? "");

  const mainProduct = String(
    md.productServices ?? md.coreProducts ?? "",
  );
  const projectDescription = String(md.projectDescription ?? "");
  const loiDoc = md.loiDocument as { bodyParagraphs?: string[] } | undefined;
  const loiBackground =
    loiDoc?.bodyParagraphs?.length
      ? loiDoc.bodyParagraphs.join("\n\n")
      : "";
  const assetDigits = applicant?.assetSize?.replace(/[^\d]/g, "") ?? "";
  const budgetDigits = String(md.budget ?? "").replace(/[^\d]/g, "");

  return {
    enterpriseName: applicant?.enterpriseName ?? "",
    contactPerson: applicant?.applicantName ?? "",
    position: applicant?.designation ?? "Owner",
    officeAddress: applicant?.address ?? "",
    officeTel: applicant?.contactNumber ?? "",
    officeFax: "",
    officeEmail: applicant?.emailAddress ?? "",
    factoryAddress: applicant?.address ?? "",
    factoryTel: applicant?.contactNumber ?? "",
    factoryFax: "",
    factoryEmail: applicant?.emailAddress ?? "",
    website: "",
    agreeGA1: false,
    agreeGA2: false,
    agreeGA3: false,
    agreeGA4: false,
    agreeGA5: false,
    agreeGA6: false,
    undertakingName: applicant?.applicantName ?? "",
    undertakingPosition: applicant?.designation ?? "Owner",
    undertakingDate: "",
    productionSite: applicant?.address ?? "",
    businessPermitNo: "",
    yearRegistered: yearEstablished,
    organizationType:
      mapBusinessTypeToOrganization(applicant?.businessType ?? "") ||
      (md.registrationType === "DTI"
        ? "Sole Proprietorship (DTI)"
        : md.registrationType === "SEC"
          ? "Corporation (SEC)"
          : md.registrationType === "CDA"
            ? "Cooperative (CDA)"
            : ""),
    capitalClassification: mapMsmeToCapitalClass(applicant?.msmeSize ?? ""),
    employeesMale: "",
    employeesFemale: "",
    employeesIndirect: "",
    employeesContract: "",
    enterpriseBackground:
      loiBackground ||
      String(md.companyDescription ?? "") ||
      [applicant?.businessNature, mainProduct].filter(Boolean).join(" — ") ||
      applicant?.businessNature ||
      "",
    yearEstablished,
    initialCapital: "",
    registrationNo: String(
      md.registrationNumber ?? md.tinNumber ?? "",
    ),
    presentCapital: assetDigits || budgetDigits,
    employmentClass: mapMsmeToEmploymentClass(applicant?.msmeSize ?? ""),
    sector: applicant?.businessSector ?? "",
    commodity: applicant?.businessNature ?? "",
    mainProduct,
    reasonsForAssistance: projectDescription,
    consultedOther: "",
    consultedAgency: "",
    assistanceType: String(md.timeline ?? ""),
    whyNotConsulted: "",
    plan5Years: String(md.expectedOutcome ?? ""),
    plan10Years: "",
    agreements: "",
    cashFlow: "",
    capitalSource: "",
    accountingSystem: "",
    hiringCriteria: "",
    employeeIncentives: "",
    trainingDevelopment: "",
    safetyMeasures: "",
    employeeWelfare: "",
    productionProblemsConcerns: "",
    wasteManagement: "",
    productionPlan: projectDescription,
    plantLayoutFileName: "",
    plantLayoutFileData: "",
    processFlowMode: "text" as "text" | "attachment",
    processFlow: "",
    processFlowFileName: "",
    processFlowFileData: "",
    inventorySystem: "",
    maintenanceProgram: "",
    cgmpHaccp: "",
    purchasingSystem: "",
    marketingPlan: "",
    marketOutlets: "",
    promotionalStrategies: "",
    marketCompetitors: "",
    packNutrition: false,
    packNutritionRemarks: "",
    packBarcode: false,
    packBarcodeRemarks: "",
    packLabel: false,
    packLabelRemarks: "",
    packExpiry: false,
    packExpiryRemarks: "",
    otherConcerns: String(md.exportClassification ?? ""),
    preparedDate: "",
    validatedDate: "",
  };
}

export function mergeTnaSavedData(
  applicant: Applicant | null,
  saved?: { form?: Record<string, unknown>; tables?: typeof EMPTY_TNA_TABLES },
) {
  const base = buildInitialTnaForm(applicant);
  if (!saved?.form) return { form: base, tables: saved?.tables ?? EMPTY_TNA_TABLES };

  const merged = { ...base, ...saved.form } as typeof base;
  for (const key of Object.keys(base) as (keyof typeof base)[]) {
    const savedVal = saved.form[key];
    if (savedVal === "" && base[key] !== "") {
      (merged as Record<string, unknown>)[key] = base[key];
    }
  }

  return {
    form: merged,
    tables: saved.tables ?? EMPTY_TNA_TABLES,
  };
}
