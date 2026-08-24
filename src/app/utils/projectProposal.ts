/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import { EMPTY_TNA_TABLES } from "../store/tnaFormDefaults";
import type {
  ProjectProposalAttachment,
  ProjectProposalAttachmentKind,
  ProjectProposalBudgetRow,
  ProjectProposalDocumentResponse,
  ProjectProposalForm,
  ProjectProposalGenerationRequest,
  ProjectProposalRiskRow,
  ProjectProposalStored,
  Tna2StoredDocument,
  FinancialProjectionSnapshot,
} from "../api/types";
import { getPublishedTna2, normalizeFindingsByArea } from "./tnaForm02";
import { yearFromDateEstablished } from "./applicantPrefill";
import { isDemoModeActive } from "./demoMode";
import { requiredTrimmed } from "./fieldValidators";
import { normalizeProjectProposalStored } from "./normalizeCriticalModuleData";
import {
  YEAR_COUNT,
  formatPhp,
  parseMoney,
  round2,
} from "./financialProjection";
import {
  PP_IDA_ASSET_LIFE_LABEL,
  PP_IDA_PROJECT_COST_LABEL,
  PP_IDA_ROI_CAPTION,
  PP_VOLUME_OF_ORDERS_SAMPLE_ROWS,
  companyProfileEmployeeTotals,
  formatCompanyProfileMsmeSize,
} from "../constants/projectProposalLayout";

export const PROPOSAL_ATTACHMENT_LABELS: Record<
  ProjectProposalAttachmentKind,
  string
> = {
  vicinityMap: "Vicinity map / site location screenshot",
  plantLayout: "Proposed plant layout",
  orgChart: "Organizational chart",
  financialReports: "Financial statements / reports",
};

export const REQUIRED_ATTACHMENTS: ProjectProposalAttachmentKind[] = [
  "vicinityMap",
  "plantLayout",
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rowId() {
  return uid();
}

function emptyRiskRow(): ProjectProposalRiskRow {
  return { id: rowId(), objective: "", risk: "", assumption: "", plan: "" };
}

function emptyBudgetRow(): ProjectProposalBudgetRow {
  return {
    id: rowId(),
    item: "",
    qty: "1",
    unitCost: "",
    setupShare: "",
    lgiaShare: "",
    total: "",
  };
}

function emptyWorkingCapitalRow(): ProjectProposalBudgetRow {
  return {
    id: rowId(),
    item: "Working capital",
    qty: "1",
    unitCost: "",
    setupShare: "",
    lgiaShare: "",
    total: "",
  };
}

function isWorkingCapitalRow(row: ProjectProposalBudgetRow): boolean {
  return String(row.item ?? "")
    .trim()
    .toLowerCase() === "working capital";
}

function ensureWorkingCapitalBudgetItems(
  rows: ProjectProposalBudgetRow[],
): ProjectProposalBudgetRow[] {
  if (!Array.isArray(rows) || rows.length === 0) return [emptyWorkingCapitalRow()];

  const wcIdxs = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => isWorkingCapitalRow(r))
    .map(({ i }) => i);

  if (wcIdxs.length === 0) {
    return [emptyWorkingCapitalRow(), ...rows];
  }

  // Keep the first “working capital” row (user-entered values) and drop duplicates.
  const keepIdx = wcIdxs[0];
  const keepRow = rows[keepIdx];
  const rest = rows.filter((_, idx) => idx !== keepIdx && !wcIdxs.includes(idx));
  return [keepRow, ...rest];
}

export function normalizeBudgetItem(
  row: Partial<ProjectProposalBudgetRow> | null | undefined,
): ProjectProposalBudgetRow {
  return {
    id: row?.id || rowId(),
    item: String(row?.item ?? ""),
    qty: String(row?.qty ?? "1"),
    unitCost: String(row?.unitCost ?? ""),
    setupShare: String(row?.setupShare ?? ""),
    lgiaShare: String(row?.lgiaShare ?? ""),
    total: String(row?.total ?? ""),
  };
}

export function normalizeRiskRow(
  row: Partial<ProjectProposalRiskRow> | null | undefined,
): ProjectProposalRiskRow {
  return {
    id: row?.id || rowId(),
    objective: String(row?.objective ?? ""),
    risk: String(row?.risk ?? ""),
    assumption: String(row?.assumption ?? ""),
    plan: String(row?.plan ?? ""),
  };
}

export function formatRiskAndAssumptions(row: ProjectProposalRiskRow): string {
  const risk = (row.risk ?? "").trim();
  const assumption = (row.assumption ?? "").trim();
  if (risk && assumption) return `${risk}; ${assumption}`;
  return risk || assumption;
}

function parseHeadcount(value: string | undefined): number {
  const n = parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function hasHeadcount(...values: Array<string | undefined>): boolean {
  return values.some((v) => String(v ?? "").trim() !== "");
}

function sumHeadcount(...values: Array<string | undefined>): string {
  if (!hasHeadcount(...values)) return "";
  return String(values.reduce((acc, v) => acc + parseHeadcount(v), 0));
}

/** Direct Workers / totals are derived from Production + Non-Production + Indirect boxes. */
export function deriveDirectEmploymentCounts(
  form: Pick<
    ProjectProposalForm,
    | "employeesMale"
    | "employeesFemale"
    | "employeesDirect"
    | "employeesIndirect"
    | "employeesProductionMale"
    | "employeesProductionFemale"
    | "employeesNonProductionMale"
    | "employeesNonProductionFemale"
    | "employeesIndirectMale"
    | "employeesIndirectFemale"
  >,
): Pick<
  ProjectProposalForm,
  "employeesMale" | "employeesFemale" | "employeesDirect" | "employeesIndirect"
> {
  const productionFilled = hasHeadcount(
    form.employeesProductionMale,
    form.employeesProductionFemale,
    form.employeesNonProductionMale,
    form.employeesNonProductionFemale,
  );
  const employeesMale = productionFilled
    ? sumHeadcount(form.employeesProductionMale, form.employeesNonProductionMale)
    : String(form.employeesMale ?? "").trim();
  const employeesFemale = productionFilled
    ? sumHeadcount(
        form.employeesProductionFemale,
        form.employeesNonProductionFemale,
      )
    : String(form.employeesFemale ?? "").trim();
  const employeesDirect = sumHeadcount(employeesMale, employeesFemale);

  const indirectSexFilled = hasHeadcount(
    form.employeesIndirectMale,
    form.employeesIndirectFemale,
  );
  const employeesIndirect = indirectSexFilled
    ? sumHeadcount(form.employeesIndirectMale, form.employeesIndirectFemale)
    : String(form.employeesIndirect ?? "").trim();

  return {
    employeesMale,
    employeesFemale,
    employeesDirect,
    employeesIndirect,
  };
}

export function withDerivedEmploymentCounts(
  form: ProjectProposalForm,
): ProjectProposalForm {
  return { ...form, ...deriveDirectEmploymentCounts(form) };
}

export function toBudgetPrintRow(b: ProjectProposalBudgetRow): string[] {
  const totalNum = parseFloat(String(b.total).replace(/[^\d.]/g, "")) || 0;
  const setupNum = parseFloat(String(b.setupShare).replace(/[^\d.]/g, "")) || 0;
  const lgiaNum = parseFloat(String(b.lgiaShare ?? "").replace(/[^\d.]/g, "")) || 0;
  const counterpart =
    totalNum > 0 && totalNum > setupNum + lgiaNum
      ? String(totalNum - setupNum - lgiaNum)
      : "";
  return [
    b.item,
    b.qty,
    b.unitCost,
    b.total || b.unitCost,
    b.setupShare,
    b.lgiaShare ?? "",
    counterpart,
    b.total,
  ];
}

export function emptyProjectProposalForm(): ProjectProposalForm {
  return {
    projectTitle: "",
    proponentName: "",
    proponentAddress: "",
    projectCost: "",
    amountRequested: "",
    generalObjective: "",
    specificObjectives: [""],
    firmName: "",
    firmAddress: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    yearEstablished: "",
    organizationType: "",
    profitType: "Profit",
    msmeSize: "",
    assetSize: "",
    classificationRange: "",
    employeesMale: "",
    employeesFemale: "",
    employeesDirect: "",
    employeesIndirect: "",
    employeesProductionMale: "",
    employeesProductionFemale: "",
    employeesNonProductionMale: "",
    employeesNonProductionFemale: "",
    employeesIndirectMale: "",
    employeesIndirectFemale: "",
    registrationOffice: "",
    registrationNumber: "",
    registrationDate: "",
    businessPermitNumber: "",
    businessPermitDate: "",
    businessActivity: "",
    prioritySectorSpecify: "",
    productsServices: "",
    enterpriseBackground: "",
    skillsExpertise: "",
    compensation: "",
    compensationTable: [emptyCompensationRow()],
    plantSiteNarrative: "",
    capacityVolumeNarrative: "",
    rawMaterialCostTable: [emptyRawMaterialCostRow()],
    rawMaterialAllocationTable: [emptyRawMaterialAllocationRow()],
    rawMaterialsNarrative: "",
    rawMaterialsTable: [["", "", ""]],
    marketSituation: "",
    productDemandSupply: "",
    volumeOfOrdersTable: [["", "", ""]],
    productPriceTable: [["", ""]],
    distributionChannel: "",
    competitors: "",
    existingMarketingProblems: "",
    marketStrategies: [""],
    productionProcess: "",
    materialBalance: "",
    equipmentTable: [emptyExistingEquipmentRow()],
    equipmentNarrative: "",
    interventionProblem: "",
    interventionProposed: "",
    interventionEquipment: "",
    interventionImpact: "",
    interventionCostTable: [["", "", "", ""]],
    fabricatorTable: [["", "", ""]],
    scheduleTable: [emptyScheduleRow()],
    expectedOutputBullets: [""],
    wasteManagement: "",
    wasteVolumeMonthly: "",
    wasteKinds: "",
    wasteDisposalMethods: "",
    liquidityRatioTable: [
      ["1", "", "", ""],
      ["2", "", "", ""],
    ],
    quickRatioTable: [
      ["1", "", "", "", ""],
      ["2", "", "", "", ""],
    ],
    roiTable: [
      ["1", "", "", ""],
      ["2", "", "", ""],
      ["3", "", "", ""],
    ],
    netProfitMarginTable: [
      ["1", "", "", ""],
      ["2", "", "", ""],
      ["3", "", "", ""],
    ],
    partialBudgetAnalysis: "",
    financialAnalysis: "",
    genderInvolvement: "",
    financialConstraintsNote: "Please refer to the attached financial reports.",
    // Hardcoded row required by the form layout — user fills in the numbers.
    budgetItems: [emptyWorkingCapitalRow()],
    refundSchedule: buildDefaultRefundSchedule("", ""),
    riskRows: [emptyRiskRow(), emptyRiskRow(), emptyRiskRow()],
  };
}

export function buildDefaultRefundSchedule(
  amountRequested: string,
  repaymentYears: string,
): string[][] {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const amt = parseFloat(String(amountRequested).replace(/[^\d.]/g, "")) || 0;
  const years = Math.min(5, Math.max(1, parseInt(repaymentYears, 10) || 4));
  const monthly = years > 0 && amt > 0 ? Math.round(amt / years / 12) : 0;
  const monthlyStr = monthly > 0 ? String(monthly) : "";

  const header = ["Months", "Y1", "Y2", "Y3", "Y4", "Y5", "Total"];
  const rows = months.map((m) => {
    const yearCols = Array.from({ length: 5 }, (_, i) =>
      i < years ? monthlyStr : "",
    );
    const total =
      monthly > 0
        ? String(monthly * Math.min(years, 5))
        : "";
    return [m, ...yearCols, total];
  });
  const totalRow = [
    "Total",
    ...Array.from({ length: 5 }, (_, i) =>
      i < years && monthly > 0 ? String(monthly * 12) : "",
    ),
    monthly > 0 ? String(monthly * 12 * years) : "",
  ];
  return [header, ...rows, totalRow];
}

/** Insert Y5 before Total when hydrating legacy Y1–Y4 schedules. */
export function normalizeRefundSchedule(
  rows: string[][] | undefined,
): string[][] {
  if (!rows?.length) return buildDefaultRefundSchedule("", "");
  const header = rows[0] ?? [];
  if (header.some((c) => String(c).toUpperCase() === "Y5")) return rows;
  return rows.map((row, i) => {
    if (i === 0) return ["Months", "Y1", "Y2", "Y3", "Y4", "Y5", "Total"];
    if (row.length >= 6) return [...row.slice(0, 5), "", row[row.length - 1]];
    return row;
  });
}

function getTna1Data(applicant: Applicant) {
  const md = applicant.moduleData ?? {};
  const tna1 = md.tna1 as
    | { form?: Record<string, unknown>; tables?: typeof EMPTY_TNA_TABLES }
    | undefined;
  return {
    form: tna1?.form ?? {},
    tables: tna1?.tables ?? EMPTY_TNA_TABLES,
  };
}

/** Read a published TNA2 findings subsection by official id (empty if missing). */
function tna2SubsectionContent(
  tna2: Tna2StoredDocument | null,
  id: string,
): string {
  if (!tna2) return "";
  for (const section of normalizeFindingsByArea(tna2.findingsByArea)) {
    for (const sub of section.subsections ?? []) {
      if (sub.id === id) return String(sub.content ?? "").trim();
    }
  }
  return "";
}

function formatMoney(value: string | number | undefined): string {
  if (value == null || value === "") return "";
  const n =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/[^\d.]/g, ""));
  if (Number.isNaN(n)) return String(value);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function tableFromTna(
  rows: string[][] | undefined,
  minCols: number,
): string[][] {
  if (!rows?.length) return [Array(minCols).fill("")];
  return rows.map((r) => {
    const cells = [...r];
    while (cells.length < minCols) cells.push("");
    return cells.slice(0, minCols);
  });
}

function isBlankStringTable(rows: unknown): boolean {
  if (!Array.isArray(rows) || rows.length === 0) return true;
  return rows.every(
    (row) =>
      Array.isArray(row) &&
      row.every((cell) => !String(cell ?? "").trim()),
  );
}

function looksLikePrintshop(
  applicant: Applicant | null,
  form?: Partial<ProjectProposalForm>,
): boolean {
  const tna = applicant ? getTna1Data(applicant).form : {};
  const hay = [
    applicant?.enterpriseName,
    applicant?.businessNature,
    applicant?.businessSector,
    form?.firmName,
    form?.productsServices,
    tna.enterpriseName,
    tna.sector,
    tna.commodity,
    tna.mainProduct,
  ]
    .map((v) => String(v ?? "").toLowerCase())
    .join(" ");
  return /\bprint(shop|ing|er)?s?\b/.test(hay);
}

function copyVolumeOfOrdersSample(): string[][] {
  return PP_VOLUME_OF_ORDERS_SAMPLE_ROWS.map((row) => [...row]);
}

export function buildProjectProposalDraft(
  applicant: Applicant | null,
  current: Partial<ProjectProposalForm> = {},
): ProjectProposalForm {
  const base = emptyProjectProposalForm();
  if (!applicant) return { ...base, ...current };

  const md = applicant.moduleData ?? {};
  const { form, tables } = getTna1Data(applicant);
  const tna2 = getPublishedTna2(applicant) as Tna2StoredDocument | null;
  const recommendedEquipment = Array.isArray(tna2?.recommendedEquipment)
    ? tna2.recommendedEquipment
    : tna2?.recommendedEquipment
      ? [tna2.recommendedEquipment]
      : [];
  const technologyGaps = Array.isArray(tna2?.technologyGaps)
    ? tna2.technologyGaps
    : tna2?.technologyGaps
      ? [String(tna2.technologyGaps)]
      : [];
  const proposedInterventions = Array.isArray(tna2?.proposedInterventions)
    ? tna2.proposedInterventions
    : tna2?.proposedInterventions
      ? [String(tna2.proposedInterventions)]
      : [];
  const productivityOutcomes = Array.isArray(
    tna2?.productivityImprovement?.outcomes,
  )
    ? tna2.productivityImprovement.outcomes
    : tna2?.productivityImprovement?.outcomes
      ? [String(tna2.productivityImprovement.outcomes)]
      : [];

  const projectDesc = String(
    md.projectDescription ?? form.reasonsForAssistance ?? "",
  );
  const enterprise = applicant.enterpriseName;
  const title =
    projectDesc && enterprise
      ? `${projectDesc} for ${enterprise}`
      : projectDesc || enterprise;

  const budgetRaw = String(md.budget ?? md.commitmentAmount ?? "");
  const amountReq = String(
    md.commitmentAmount ?? md.approvedAmount ?? budgetRaw ?? "",
  );

  const specificObjs: string[] = [];
  if (md.expectedOutcome) specificObjs.push(String(md.expectedOutcome));
  if (form.reasonsForAssistance)
    specificObjs.push(String(form.reasonsForAssistance));
  if (productivityOutcomes.length) {
    specificObjs.push(...productivityOutcomes);
  }
  if (specificObjs.length === 0) specificObjs.push("");

  const budgetItems: ProjectProposalBudgetRow[] = [];
  if (recommendedEquipment.length) {
    for (const eq of recommendedEquipment) {
      budgetItems.push({
        id: rowId(),
        item: eq.name || "S&T intervention equipment",
        qty: eq.quantity || "1",
        unitCost: eq.estimatedCost || "",
        setupShare: eq.estimatedCost || "",
        lgiaShare: "",
        total: eq.estimatedCost || "",
      });
    }
  }
  if (budgetItems.length === 0 && budgetRaw) {
    budgetItems.push({
      id: rowId(),
      item: "Technology upgrading package",
      qty: "1",
      unitCost: budgetRaw,
      setupShare: amountReq || budgetRaw,
      lgiaShare: "",
      total: budgetRaw,
    });
  }
  // If no computed budget rows exist, working capital is still injected by
  // ensureWorkingCapitalBudgetItems() below.

  const interventionProblem = String(
    form.productionProblemsConcerns ??
      technologyGaps.join("; ") ??
      "",
  );
  const interventionProposed = String(
    md.projectDescription ??
      proposedInterventions.join("; ") ??
      "",
  );
  const interventionEquipment = recommendedEquipment
    .map((row) => row.name)
    .filter(Boolean)
    .join(", ");

  const wasteKindsFromTna2 = tna2SubsectionContent(tna2, "waste-management");
  const wasteDisposalFromTna2 = tna2SubsectionContent(
    tna2,
    "methods-of-disposal",
  );

  const draft: ProjectProposalForm = {
    ...base,
    projectTitle: title,
    proponentName: enterprise,
    proponentAddress: String(
      form.officeAddress ?? applicant.address ?? md.province ?? "",
    ),
    projectCost: formatMoney(budgetRaw) || budgetRaw,
    amountRequested: formatMoney(amountReq) || amountReq,
    generalObjective: String(
      md.expectedOutcome ??
        `To enhance operational efficiency and competitiveness of ${enterprise} through DOST-SETUP technology intervention.`,
    ),
    specificObjectives: specificObjs,
    firmName: String(form.enterpriseName ?? enterprise),
    firmAddress: String(form.officeAddress ?? applicant.address ?? ""),
    contactPerson: String(form.contactPerson ?? applicant.applicantName),
    contactNumber: String(form.officeTel ?? applicant.contactNumber),
    email: String(form.officeEmail ?? applicant.emailAddress),
    yearEstablished: yearFromDateEstablished(
      String(md.dateEstablished ?? form.yearEstablished ?? ""),
    ),
    organizationType: String(
      form.organizationType ?? md.registrationType ?? applicant.businessType ?? "",
    ),
    profitType: "Profit",
    msmeSize: applicant.msmeSize ?? "",
    assetSize: applicant.assetSize ?? "",
    classificationRange: String(applicant.moduleData?.classificationRange ?? ""),
    employeesMale: String(form.employeesMale ?? ""),
    employeesFemale: String(form.employeesFemale ?? ""),
    employeesDirect: String(form.employeesMale ?? ""),
    employeesIndirect: "",
    employeesProductionMale: String(form.employeesMale ?? ""),
    employeesProductionFemale: String(form.employeesFemale ?? ""),
    employeesNonProductionMale: "",
    employeesNonProductionFemale: "",
    employeesIndirectMale: String(form.employeesIndirect ?? ""),
    employeesIndirectFemale: String(form.employeesContract ?? ""),
    registrationOffice: String(md.registrationType ?? ""),
    registrationNumber: String(md.registrationNumber ?? ""),
    registrationDate: "",
    businessPermitNumber: "",
    businessPermitDate: "",
    businessActivity: applicant.businessSector ?? "",
    prioritySectorSpecify: applicant.businessSector ?? "",
    productsServices: String(
      md.productServices ?? md.coreProducts ?? form.mainProduct ?? "",
    ),
    enterpriseBackground: String(
      md.companyDescription ??
        form.enterpriseBackground ??
        applicant.businessNature ??
        "",
    ),
    plantSiteNarrative: String(
      form.officeAddress ?? applicant.address ?? "",
    ),
    rawMaterialsNarrative: "",
    rawMaterialsTable: tableFromTna(tables.rawMaterials, 3),
    productionProcess: String(
      tna2?.productionProcessAnalysis?.summary ??
        form.processFlow ??
        "",
    ),
    equipmentTable: recomputeExistingEquipmentTable(tables.equipment),
    equipmentNarrative: "",
    interventionProblem,
    interventionProposed,
    interventionEquipment,
    interventionImpact: String(
      productivityOutcomes[0] ?? md.expectedOutcome ?? "",
    ),
    interventionCostTable:
      recommendedEquipment.length
        ? recommendedEquipment.map((e) => [
            e.name,
            e.quantity ?? "1",
            e.estimatedCost ?? "",
            e.estimatedCost ?? "",
          ])
        : tableFromTna([], 4),
    expectedOutputBullets:
      productivityOutcomes.length
        ? [...productivityOutcomes]
        : md.expectedOutcome
          ? [String(md.expectedOutcome)]
          : defaultExpectedOutputBullets(enterprise),
    budgetItems,
    refundSchedule: buildDefaultRefundSchedule(
      amountReq,
      String(md.repaymentTerm ?? "4"),
    ),
    marketSituation: "",
    productDemandSupply: looksLikePrintshop(applicant)
      ? "Schools, LGUs, and MSMEs in SOCCSKSARGEN place recurring orders for forms, modules, receipts, labels, and outdoor tarpaulins; current press capacity limits peak-season fill rates."
      : "",
    volumeOfOrdersTable: looksLikePrintshop(applicant)
      ? copyVolumeOfOrdersSample()
      : [["", "", ""]],
    distributionChannel: String(form.marketOutlets ?? "").trim() || "Local",
    competitors: String(form.marketCompetitors ?? ""),
    existingMarketingProblems: "",
    marketStrategies: (() => {
      const fromTna = [form.marketingPlan, form.promotionalStrategies]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean);
      return fromTna.length ? fromTna : [""];
    })(),
    wasteManagement: "",
    wasteVolumeMonthly: "",
    wasteKinds: wasteKindsFromTna2 || String(form.wasteManagement ?? ""),
    wasteDisposalMethods: wasteDisposalFromTna2,
    partialBudgetAnalysis: "",
    financialAnalysis: "",
    genderInvolvement: String(form.genderInvolvement ?? ""),
    riskRows: [
      {
        id: rowId(),
        objective: "Maintain uninterrupted production during equipment commissioning",
        risk: "Equipment malfunction causing production delays",
        assumption: "Equipment will operate efficiently with regular maintenance",
        plan: "Schedule regular maintenance and maintain service contracts",
      },
      {
        id: rowId(),
        objective: "Secure reliable raw material supply for scaled output",
        risk: "Supplier delays for raw materials",
        assumption: "Suppliers will deliver on time",
        plan: "Maintain multiple suppliers and buffer stock",
      },
      {
        id: rowId(),
        objective: "Retain and expand the enterprise client base",
        risk: "Market competition",
        assumption: "Enterprise will retain and attract clients",
        plan: "Competitive pricing and quality improvement",
      },
    ],
  };

  const merged = mergeProposalForm(draft, current);
  if (applicant) {
    merged.assetSize = applicant.assetSize ?? "";
    merged.classificationRange = String(
      applicant.moduleData?.classificationRange ?? "",
    );
  }
  return merged;
}

function parseHeadcountValue(value: unknown): number {
  const parsed = parseInt(String(value ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** MSME Size for Form 001 — prescreening asset/range + employee headcount (form or TNA1). */
export function companyProfileMsmeSizeLabelFromApplicant(
  applicant: Applicant | null | undefined,
  form: ProjectProposalForm,
): string {
  const assetSize = String(form.assetSize || applicant?.assetSize || "").trim();
  const classificationRange = String(
    form.classificationRange ||
      applicant?.moduleData?.classificationRange ||
      "",
  ).trim();

  let employeeTotal = companyProfileEmployeeTotals(form).total;
  if (employeeTotal <= 0 && applicant) {
    const tna1Form = (
      applicant.moduleData?.tna1 as { form?: Record<string, unknown> } | undefined
    )?.form;
    if (tna1Form) {
      employeeTotal =
        parseHeadcountValue(tna1Form.employeesMale) +
        parseHeadcountValue(tna1Form.employeesFemale);
    }
  }

  return formatCompanyProfileMsmeSize({
    assetSize,
    classificationRange,
    employeeTotal,
    msmeSize: form.msmeSize || applicant?.msmeSize,
  });
}

function mergeProposalForm(
  base: ProjectProposalForm,
  current: Partial<ProjectProposalForm>,
): ProjectProposalForm {
  const merged = { ...base };
  for (const key of Object.keys(current) as (keyof ProjectProposalForm)[]) {
    const cur = current[key];
    if (cur === undefined || cur === null) continue;
    if (typeof cur === "string" && cur.trim() === "") continue;
    if (key === "volumeOfOrdersTable" && isBlankStringTable(cur)) continue;
    if (
      Array.isArray(cur) &&
      cur.length === 1 &&
      cur[0] === "" &&
      Array.isArray(base[key])
    ) {
      const b = base[key] as unknown[];
      if (b.length > 1 || (b.length === 1 && b[0] !== "")) continue;
    }
    (merged as Record<string, unknown>)[key] = cur;
  }
  merged.compensationTable = recomputeCompensationTable(merged.compensationTable);
  merged.equipmentTable = recomputeExistingEquipmentTable(merged.equipmentTable);
  merged.rawMaterialCostTable = recomputeRawMaterialCostTable(
    merged.rawMaterialCostTable,
  );
  merged.rawMaterialAllocationTable = normalizeRawMaterialAllocationTable(
    merged.rawMaterialAllocationTable,
  );
  merged.budgetItems = (merged.budgetItems ?? []).map((row) =>
    normalizeBudgetItem(row),
  );
  merged.budgetItems = ensureWorkingCapitalBudgetItems(merged.budgetItems);
  merged.riskRows = (merged.riskRows ?? []).map((row) => normalizeRiskRow(row));
  merged.refundSchedule = normalizeRefundSchedule(merged.refundSchedule);
  merged.scheduleTable = normalizeScheduleTable(merged.scheduleTable);
  merged.netProfitMarginTable = merged.netProfitMarginTable?.length
    ? merged.netProfitMarginTable
    : [
        ["1", "", "", ""],
        ["2", "", "", ""],
        ["3", "", "", ""],
      ];
  return withDerivedEmploymentCounts(merged);
}

export function submitProjectProposal(
  applicantId: string,
  form: ProjectProposalForm,
  attachments: ProjectProposalAttachment[],
  document?: ProjectProposalDocumentResponse,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const nextForm = withDerivedEmploymentCounts(form);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      projectProposal: {
        form: nextForm,
        attachments,
        document,
        submitted: true,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies ProjectProposalStored,
    },
  });
}

export function getProjectProposalStored(
  applicant: Applicant | null,
): ProjectProposalStored | null {
  if (!applicant?.moduleData?.projectProposal) return null;
  const normalized = normalizeProjectProposalStored(
    applicant.moduleData.projectProposal,
  );
  return (normalized as ProjectProposalStored | undefined) ?? null;
}

export function getProjectProposalForm(
  applicant: Applicant | null,
): ProjectProposalForm {
  const stored = getProjectProposalStored(applicant);
  if (stored?.form) {
    return buildProjectProposalDraft(applicant, stored.form);
  }
  return buildProjectProposalDraft(applicant);
}

export function getProjectProposalAttachments(
  applicant: Applicant | null,
): ProjectProposalAttachment[] {
  const attachments = getProjectProposalStored(applicant)?.attachments;
  if (Array.isArray(attachments)) return attachments;
  if (attachments) return [attachments];
  return [];
}

export function saveProjectProposalDraft(
  applicantId: string,
  form: ProjectProposalForm,
  attachments: ProjectProposalAttachment[],
  document?: ProjectProposalDocumentResponse,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getProjectProposalStored(applicant);
  const nextForm = withDerivedEmploymentCounts(form);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      projectProposal: {
        form: nextForm,
        attachments,
        document: document ?? existing?.document,
        submitted: existing?.submitted ?? false,
        submittedAt: existing?.submittedAt,
        updatedAt: new Date().toISOString(),
      } satisfies ProjectProposalStored,
    },
  });
}

export function applyGeneratedDocument(
  applicantId: string,
  document: ProjectProposalDocumentResponse,
  form: ProjectProposalForm,
): ProjectProposalForm {
  const merged: ProjectProposalForm = {
    ...form,
    generalObjective: document.generalObjective ?? form.generalObjective,
    specificObjectives:
      document.specificObjectives?.length
        ? document.specificObjectives
        : form.specificObjectives,
    enterpriseBackground:
      document.enterpriseBackground ?? form.enterpriseBackground,
    skillsExpertise: document.skillsExpertise ?? form.skillsExpertise,
    plantSiteNarrative: document.plantSiteNarrative ?? form.plantSiteNarrative,
    capacityVolumeNarrative:
      document.capacityVolumeNarrative ?? form.capacityVolumeNarrative,
    rawMaterialsNarrative:
      document.rawMaterialsNarrative ?? form.rawMaterialsNarrative,
    marketSituation: document.marketSituation ?? form.marketSituation,
    productDemandSupply:
      document.productDemandSupply ?? form.productDemandSupply,
    distributionChannel:
      document.distributionChannel ?? form.distributionChannel,
    competitors: document.competitors ?? form.competitors,
    existingMarketingProblems:
      document.existingMarketingProblems ?? form.existingMarketingProblems,
    marketStrategies:
      document.marketStrategies?.length
        ? document.marketStrategies
        : form.marketStrategies,
    productionProcess: document.productionProcess ?? form.productionProcess,
    materialBalance: document.materialBalance ?? form.materialBalance,
    equipmentNarrative: document.equipmentNarrative ?? form.equipmentNarrative,
    equipmentTable: recomputeExistingEquipmentTable(
      document.equipmentTable?.length
        ? document.equipmentTable
        : form.equipmentTable,
    ),
    interventionProblem:
      document.interventionProblem ?? form.interventionProblem,
    interventionProposed:
      document.interventionProposed ?? form.interventionProposed,
    interventionEquipment:
      document.interventionEquipment ?? form.interventionEquipment,
    interventionImpact: document.interventionImpact ?? form.interventionImpact,
    expectedOutputBullets:
      document.expectedOutputBullets?.length
        ? document.expectedOutputBullets
        : form.expectedOutputBullets,
    wasteManagement: document.wasteManagement ?? form.wasteManagement,
    wasteVolumeMonthly:
      document.wasteVolumeMonthly ?? form.wasteVolumeMonthly,
    wasteKinds: document.wasteKinds ?? form.wasteKinds,
    wasteDisposalMethods:
      document.wasteDisposalMethods ?? form.wasteDisposalMethods,
    partialBudgetAnalysis:
      document.partialBudgetAnalysis ?? form.partialBudgetAnalysis,
    financialAnalysis: document.financialAnalysis ?? form.financialAnalysis,
    genderInvolvement: document.genderInvolvement ?? form.genderInvolvement,
    riskRows:
      document.riskRows?.length ? document.riskRows : form.riskRows,
  };
  const attachments = getProjectProposalAttachments(
    applicantStore.getById(applicantId) ?? null,
  );
  saveProjectProposalDraft(applicantId, merged, attachments, document);
  return withDerivedEmploymentCounts(merged);
}

export function buildProjectProposalGenerationPayload(
  applicant: Applicant,
  form: ProjectProposalForm,
  attachments: ProjectProposalAttachment[],
): ProjectProposalGenerationRequest {
  const md = applicant.moduleData ?? {};
  return {
    applicationId: applicant.applicationId,
    enterpriseName: applicant.enterpriseName,
    applicantName: applicant.applicantName,
    province: String(md.province ?? ""),
    businessSector: applicant.businessSector,
    productServices: form.productsServices,
    projectDescription: String(md.projectDescription ?? form.projectTitle),
    expectedOutcome: form.generalObjective,
    budget: form.projectCost,
    form,
    attachmentKinds: attachments.map((a) => a.kind),
  };
}

export function buildLocalProjectProposalDocument(
  req: ProjectProposalGenerationRequest,
): ProjectProposalDocumentResponse {
  const f = req.form;
  const ent = req.enterpriseName;
  return {
    applicationId: req.applicationId,
    formTitle: f.projectTitle,
    generatedAt: new Date().toISOString(),
    aiGenerated: false,
    generalObjective:
      f.generalObjective ||
      `To upgrade the technology and productivity of ${ent} through DOST-SETUP assistance.`,
    specificObjectives:
      f.specificObjectives.filter(Boolean).length
        ? f.specificObjectives.filter(Boolean)
        : [
            `Acquire appropriate technology to improve production capacity of ${ent}.`,
            "Expand ability to serve more clients without compromising quality.",
          ],
    enterpriseBackground:
      f.enterpriseBackground ||
      `${ent} operates in ${req.businessSector ?? "its sector"} and seeks SETUP support for technology upgrading.`,
    skillsExpertise:
      f.skillsExpertise ||
      `${req.applicantName ?? "The proponent"} leads enterprise operations with experience in production and client service.`,
    plantSiteNarrative:
      f.plantSiteNarrative ||
      `The enterprise is located at ${f.firmAddress || f.proponentAddress}.`,
    capacityVolumeNarrative:
      f.capacityVolumeNarrative ||
      "Current production volume is limited by existing equipment capacity.",
    rawMaterialsNarrative:
      f.rawMaterialsNarrative ||
      "Raw materials are sourced from established suppliers supporting regular production.",
    marketSituation:
      f.marketSituation ||
      `Market demand in ${req.province || "the locality"} supports expansion of ${ent}'s products and services.`,
    productDemandSupply:
      f.productDemandSupply ||
      "Demand for quality products and services continues to grow in the service area.",
    distributionChannel:
      f.distributionChannel || "Distribution is primarily local.",
    competitors:
      f.competitors ||
      "Local competitors exist; differentiation is through service quality and turnaround time.",
    existingMarketingProblems:
      f.existingMarketingProblems ||
      "No major market constraints are recorded beyond limited production capacity to meet growing demand.",
    marketStrategies: f.marketStrategies.filter(Boolean).length
      ? f.marketStrategies.filter(Boolean)
      : [
          "Improve production capacity with new equipment",
          "Maintain quality control and customer service",
        ],
    productionProcess:
      f.productionProcess ||
      "Order reception → design/preparation → production → quality check → packaging → delivery.",
    materialBalance:
      f.materialBalance ||
      "Raw material inputs are converted to finished goods with process losses and rejects accounted for at each production stage.",
    equipmentNarrative:
      f.equipmentNarrative ||
      "Existing equipment supports current output levels with room for upgrading.",
    equipmentTable: recomputeExistingEquipmentTable(f.equipmentTable),
    interventionProblem: f.interventionProblem,
    interventionProposed: f.interventionProposed,
    interventionEquipment: f.interventionEquipment,
    interventionImpact:
      f.interventionImpact ||
      "Improved productivity, faster turnaround, and expanded client base.",
    expectedOutputBullets: f.expectedOutputBullets.filter(Boolean).length
      ? f.expectedOutputBullets.filter(Boolean)
      : [
          "Increase in productivity",
          "Improved product quality",
          "Additional clients served",
        ],
    wasteManagement:
      f.wasteManagement ||
      "Waste segregation, recycling of paper and packaging, and proper disposal of process waste per local guidelines.",
    wasteVolumeMonthly:
      f.wasteVolumeMonthly ||
      "Monthly process and packaging waste volume is modest at current capacity and will be remeasured after equipment commissioning.",
    wasteKinds:
      f.wasteKinds ||
      "Typical wastes include packaging (paper, plastics), organic or process residues, and incidental metal or chemical discards depending on the production line.",
    wasteDisposalMethods:
      f.wasteDisposalMethods ||
      f.wasteManagement ||
      "Segregation at source, recycling of recoverable materials, and disposal of residuals through accredited haulers in accordance with LGU environmental guidelines.",
    partialBudgetAnalysis:
      f.partialBudgetAnalysis ||
      "Partial budget analysis compares incremental costs of the SETUP intervention against incremental returns from higher throughput, lower rejects, and improved product quality.",
    financialAnalysis:
      f.financialAnalysis ||
      "Financial capacity will be supported by attached statements and projected cash flows from improved operations.",
    genderInvolvement:
      f.genderInvolvement ||
      `${req.enterpriseName || f.proponentName || "The enterprise"} employs ${f.employeesMale || "0"} male and ${f.employeesFemale || "0"} female workers in its operations. Women and men participate in production and related functions, and the SETUP intervention is intended to benefit the workforce equitably through skills upgrading and improved working conditions, consistent with DOST Gender and Development (GAD) principles. The enterprise affirms equal opportunity regardless of sex or gender in hiring, training, and advancement.`,
    riskRows: f.riskRows,
  };
}

/** Fields that support per-section AI Assist in the form UI */
export type ProposalAiField =
  | "generalObjective"
  | "specificObjectives"
  | "enterpriseBackground"
  | "skillsExpertise"
  | "compensation"
  | "plantSiteNarrative"
  | "capacityVolumeNarrative"
  | "rawMaterialsNarrative"
  | "marketSituation"
  | "productDemandSupply"
  | "distributionChannel"
  | "competitors"
  | "existingMarketingProblems"
  | "marketStrategies"
  | "productionProcess"
  | "materialBalance"
  | "equipmentNarrative"
  | "interventionProblem"
  | "interventionProposed"
  | "interventionImpact"
  | "expectedOutputBullets"
  | "wasteManagement"
  | "wasteVolumeMonthly"
  | "wasteKinds"
  | "wasteDisposalMethods"
  | "partialBudgetAnalysis"
  | "financialAnalysis"
  | "genderInvolvement";

export function extractProposalFieldSuggestion(
  doc: ProjectProposalDocumentResponse,
  field: ProposalAiField,
  form: ProjectProposalForm,
  req?: ProjectProposalGenerationRequest,
): string | string[] {
  const ent = req?.enterpriseName ?? form.proponentName;
  switch (field) {
    case "generalObjective":
      return doc.generalObjective ?? form.generalObjective;
    case "specificObjectives":
      return doc.specificObjectives?.length
        ? doc.specificObjectives
        : form.specificObjectives;
    case "enterpriseBackground":
      return doc.enterpriseBackground ?? form.enterpriseBackground;
    case "skillsExpertise":
      return doc.skillsExpertise ?? form.skillsExpertise;
    case "compensation":
      return (
        form.compensation ||
        `Compensation for ${ent} follows prevailing industry rates in the locality, with wages and benefits aligned to MSME standards and productivity incentives for key production staff.`
      );
    case "plantSiteNarrative":
      return doc.plantSiteNarrative ?? form.plantSiteNarrative;
    case "capacityVolumeNarrative":
      return doc.capacityVolumeNarrative ?? form.capacityVolumeNarrative;
    case "rawMaterialsNarrative":
      return doc.rawMaterialsNarrative ?? form.rawMaterialsNarrative;
    case "marketSituation":
      return doc.marketSituation ?? form.marketSituation;
    case "productDemandSupply":
      return doc.productDemandSupply ?? form.productDemandSupply;
    case "distributionChannel":
      return doc.distributionChannel ?? form.distributionChannel;
    case "competitors":
      return doc.competitors ?? form.competitors;
    case "existingMarketingProblems":
      return doc.existingMarketingProblems ?? form.existingMarketingProblems;
    case "marketStrategies":
      return doc.marketStrategies?.length
        ? doc.marketStrategies
        : form.marketStrategies;
    case "productionProcess":
      return doc.productionProcess ?? form.productionProcess;
    case "materialBalance":
      return doc.materialBalance ?? form.materialBalance;
    case "equipmentNarrative":
      return doc.equipmentNarrative ?? form.equipmentNarrative;
    case "interventionProblem":
      return doc.interventionProblem ?? form.interventionProblem;
    case "interventionProposed":
      return doc.interventionProposed ?? form.interventionProposed;
    case "interventionImpact":
      return doc.interventionImpact ?? form.interventionImpact;
    case "expectedOutputBullets":
      return doc.expectedOutputBullets?.length
        ? doc.expectedOutputBullets
        : form.expectedOutputBullets;
    case "wasteManagement":
      return doc.wasteManagement ?? form.wasteManagement;
    case "wasteVolumeMonthly":
      return doc.wasteVolumeMonthly ?? form.wasteVolumeMonthly;
    case "wasteKinds":
      return doc.wasteKinds ?? form.wasteKinds;
    case "wasteDisposalMethods":
      return doc.wasteDisposalMethods ?? form.wasteDisposalMethods;
    case "partialBudgetAnalysis":
      return doc.partialBudgetAnalysis ?? form.partialBudgetAnalysis;
    case "financialAnalysis":
      return doc.financialAnalysis ?? form.financialAnalysis;
    case "genderInvolvement":
      return doc.genderInvolvement ?? form.genderInvolvement;
    default:
      return "";
  }
}

export function defaultExpectedOutputBullets(
  enterpriseName: string,
): string[] {
  return [
    `Increase production volume / productivity of ${enterpriseName}`,
    "Improve product quality and reduce reject or spoilage rate",
    "Serve additional clients without compromising turnaround time",
    "Strengthen compliance with industry and food safety standards",
  ];
}

export function validateProjectProposalSubmit(
  form: ProjectProposalForm,
  attachments: ProjectProposalAttachment[],
): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  const title = requiredTrimmed(form.projectTitle, "Project title");
  if (title) errors.push(title.endsWith(".") ? title : `${title}.`);
  const proponent = requiredTrimmed(form.proponentName, "Proponent name");
  if (proponent) errors.push(proponent.endsWith(".") ? proponent : `${proponent}.`);
  const amount = requiredTrimmed(
    form.amountRequested,
    "Amount requested from SETUP",
  );
  if (amount) errors.push(amount.endsWith(".") ? amount : `${amount}.`);
  for (const kind of REQUIRED_ATTACHMENTS) {
    if (!attachments.some((a) => a.kind === kind))
      errors.push(`${PROPOSAL_ATTACHMENT_LABELS[kind]} is required.`);
  }
  return errors;
}

export function sumBudgetItems(items: ProjectProposalBudgetRow[]): string {
  let total = 0;
  for (const item of items) {
    const t = parseFloat(String(item.total).replace(/[^\d.]/g, ""));
    if (!Number.isNaN(t)) total += t;
  }
  return total > 0 ? formatMoney(total) : "";
}

export interface InvestmentDecisionAnalysisRow {
  label: string;
  value: string;
  bold?: boolean;
}

export interface InvestmentDecisionAnalysis {
  assetLife: number;
  projectCost: number;
  total: number;
  averageIncome: number;
  roi: number | null;
  rows: InvestmentDecisionAnalysisRow[];
}

function annualIncomesFromRoiTable(form: ProjectProposalForm): {
  amounts: number[];
  hasData: boolean;
} {
  const amounts = Array.from({ length: YEAR_COUNT }, () => 0);
  let hasData = false;
  for (const row of form.roiTable ?? []) {
    const year = parseInt(String(row[0] ?? "").replace(/\D/g, ""), 10);
    if (year < 1 || year > YEAR_COUNT) continue;
    const raw = String(row[1] ?? "").trim();
    if (!raw) continue;
    amounts[year - 1] = parseMoney(raw);
    hasData = true;
  }
  return { amounts, hasData };
}

function idaMoney(n: number, show: boolean): string {
  return show ? formatPhp(n) : "";
}

export function buildInvestmentDecisionAnalysis(
  form: ProjectProposalForm,
  snapshot?: FinancialProjectionSnapshot | null,
): InvestmentDecisionAnalysis {
  const assetLife = YEAR_COUNT;
  const fromSnapshot = Array.isArray(snapshot?.ratios) && snapshot.ratios.length > 0;
  const fallback = annualIncomesFromRoiTable(form);
  const hasIncome = fromSnapshot || fallback.hasData;
  const amounts = fromSnapshot
    ? Array.from({ length: YEAR_COUNT }, (_, i) => snapshot!.ratios[i]?.netIncome ?? 0)
    : fallback.amounts;
  const total = round2(amounts.reduce((s, n) => s + n, 0));
  const averageIncome = hasIncome ? round2(total / assetLife) : 0;
  const budgetTotal = parseMoney(sumBudgetItems(form.budgetItems ?? []));
  const coverCost = parseMoney(form.projectCost);
  const projectCost = budgetTotal > 0 ? budgetTotal : coverCost;
  const roi =
    hasIncome && projectCost > 0 ? averageIncome / projectCost : null;

  const rows: InvestmentDecisionAnalysisRow[] = amounts.map((n, i) => ({
    label: `Year ${i + 1}`,
    value: idaMoney(n, hasIncome),
  }));
  rows.push({ label: "Total", value: idaMoney(total, hasIncome), bold: true });
  rows.push({
    label: PP_IDA_ASSET_LIFE_LABEL,
    value: String(assetLife),
  });
  rows.push({
    label: "Average Income",
    value: idaMoney(averageIncome, hasIncome),
    bold: true,
  });
  rows.push({
    label: PP_IDA_PROJECT_COST_LABEL,
    value: projectCost > 0 ? formatPhp(projectCost) : "",
  });
  rows.push({
    label: PP_IDA_ROI_CAPTION,
    value: roi == null ? "" : `${Math.round(roi * 100)}%`,
    bold: true,
  });

  return {
    assetLife,
    projectCost,
    total,
    averageIncome,
    roi,
    rows,
  };
}

export const COMPENSATION_COL_COUNT = 7;
export const COMPENSATION_COMPUTED_COLUMNS = [4, 5, 6] as const;

export function emptyCompensationRow(): string[] {
  return Array(COMPENSATION_COL_COUNT).fill("");
}

export interface CompensationColumnTotals {
  rate: string;
  weekly: string;
  monthlySalary: string;
  annually: string;
}

function parseCompensationAmount(value: string | undefined): number {
  const n = parseFloat(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function formatCompensationTotal(sum: number): string {
  return sum > 0 ? formatMoney(sum) : "";
}

/**
 * Weekly = Daily Rate × Days × # of workers.
 * Monthly = Weekly × 4. Annually = Monthly × 12.
 * Legacy 6-column rows insert a blank Days cell at index 3.
 */
export function computeCompensationRow(row: unknown): string[] {
  const raw = Array.isArray(row) ? row.map((c) => String(c ?? "")) : [];
  const cells =
    raw.length === 6
      ? [raw[0], raw[1], raw[2], "", raw[3], raw[4], raw[5]]
      : [...raw];
  while (cells.length < COMPENSATION_COL_COUNT) cells.push("");
  const particulars = cells[0] ?? "";
  const workersRaw = cells[1] ?? "";
  const rateRaw = cells[2] ?? "";
  const daysRaw = cells[3] ?? "";
  const workers = parseCompensationAmount(workersRaw);
  const rate = parseCompensationAmount(rateRaw);
  const days = parseCompensationAmount(daysRaw);
  const weeklyNum =
    rate > 0 && days > 0 && workers > 0 ? rate * days * workers : 0;
  const monthlyNum = weeklyNum * 4;
  const annuallyNum = monthlyNum * 12;
  return [
    particulars,
    workersRaw,
    rateRaw,
    daysRaw,
    formatCompensationTotal(weeklyNum),
    formatCompensationTotal(monthlyNum),
    formatCompensationTotal(annuallyNum),
  ];
}

export function recomputeCompensationTable(
  rows: string[][] | undefined,
): string[][] {
  const list = rows?.length ? rows : [emptyCompensationRow()];
  return list.map((row) => computeCompensationRow(row));
}

/** Daily Rate total is Σ(rate × workers). Weekly/Monthly/Annually sum computed cells. */
export function sumCompensationColumns(
  rows: string[][] | undefined,
): CompensationColumnTotals {
  const computed = recomputeCompensationTable(rows);
  let dailyPayroll = 0;
  let weekly = 0;
  let monthlySalary = 0;
  let annually = 0;
  for (const row of computed) {
    const workers = parseCompensationAmount(row[1]);
    const rate = parseCompensationAmount(row[2]);
    dailyPayroll += rate * workers;
    weekly += parseCompensationAmount(row[4]);
    monthlySalary += parseCompensationAmount(row[5]);
    annually += parseCompensationAmount(row[6]);
  }
  return {
    rate: formatCompensationTotal(dailyPayroll),
    weekly: formatCompensationTotal(weekly),
    monthlySalary: formatCompensationTotal(monthlySalary),
    annually: formatCompensationTotal(annually),
  };
}

export function compensationTableFooterRow(
  rows: string[][] | undefined,
): string[] {
  const totals = sumCompensationColumns(rows);
  return [
    "Total",
    "",
    totals.rate,
    "",
    totals.weekly,
    totals.monthlySalary,
    totals.annually,
  ];
}

export const RAW_MATERIAL_COST_COL_COUNT = 10;
export const RAW_MATERIAL_COST_COMPUTED_COLUMNS = [4, 6, 7, 8] as const;
export const RAW_MATERIAL_ALLOCATION_COL_COUNT = 3;

export function emptyRawMaterialCostRow(): string[] {
  return Array(RAW_MATERIAL_COST_COL_COUNT).fill("");
}

export function emptyRawMaterialAllocationRow(): string[] {
  return Array(RAW_MATERIAL_ALLOCATION_COL_COUNT).fill("");
}

export interface RawMaterialCostTotals {
  batch: string;
  weekly: string;
  monthly: string;
  annually: string;
}

export interface RawMaterialAllocationTotals {
  ratio: string;
  weekly: string;
}

function formatAllocationNumber(sum: number): string {
  if (sum <= 0) return "";
  return sum.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Total Cost per batch = Qty × Unit Cost.
 * Weekly = Total Cost per batch × # of batches (per week).
 * Monthly = Weekly × 4. Annually = Monthly × 12.
 */
export function computeRawMaterialCostRow(row: unknown): string[] {
  const raw = Array.isArray(row) ? row.map((c) => String(c ?? "")) : [];
  const cells = [...raw];
  while (cells.length < RAW_MATERIAL_COST_COL_COUNT) cells.push("");
  const particulars = cells[0] ?? "";
  const qtyRaw = cells[1] ?? "";
  const uom = cells[2] ?? "";
  const unitCostRaw = cells[3] ?? "";
  const batchesRaw = cells[5] ?? "";
  const source = cells[9] ?? "";
  const qty = parseCompensationAmount(qtyRaw);
  const unitCost = parseCompensationAmount(unitCostRaw);
  const batches = parseCompensationAmount(batchesRaw);
  const batchCost = qty > 0 && unitCost > 0 ? qty * unitCost : 0;
  const weeklyNum = batchCost > 0 && batches > 0 ? batchCost * batches : 0;
  const monthlyNum = weeklyNum * 4;
  const annuallyNum = monthlyNum * 12;
  return [
    particulars,
    qtyRaw,
    uom,
    unitCostRaw,
    formatCompensationTotal(batchCost),
    batchesRaw,
    formatCompensationTotal(weeklyNum),
    formatCompensationTotal(monthlyNum),
    formatCompensationTotal(annuallyNum),
    source,
  ];
}

export function recomputeRawMaterialCostTable(
  rows: string[][] | undefined,
): string[][] {
  const list = rows?.length ? rows : [emptyRawMaterialCostRow()];
  return list.map((row) => computeRawMaterialCostRow(row));
}

export function sumRawMaterialCostColumns(
  rows: string[][] | undefined,
): RawMaterialCostTotals {
  const computed = recomputeRawMaterialCostTable(rows);
  let batch = 0;
  let weekly = 0;
  let monthly = 0;
  let annually = 0;
  for (const row of computed) {
    batch += parseCompensationAmount(row[4]);
    weekly += parseCompensationAmount(row[6]);
    monthly += parseCompensationAmount(row[7]);
    annually += parseCompensationAmount(row[8]);
  }
  return {
    batch: formatCompensationTotal(batch),
    weekly: formatCompensationTotal(weekly),
    monthly: formatCompensationTotal(monthly),
    annually: formatCompensationTotal(annually),
  };
}

export function rawMaterialCostFooterRow(
  rows: string[][] | undefined,
): string[] {
  const totals = sumRawMaterialCostColumns(rows);
  return [
    "Total",
    "",
    "",
    "",
    totals.batch,
    "",
    totals.weekly,
    totals.monthly,
    totals.annually,
    "",
  ];
}

export function normalizeRawMaterialAllocationRow(row: unknown): string[] {
  const raw = Array.isArray(row) ? row.map((c) => String(c ?? "")) : [];
  const cells = [...raw];
  while (cells.length < RAW_MATERIAL_ALLOCATION_COL_COUNT) cells.push("");
  return cells.slice(0, RAW_MATERIAL_ALLOCATION_COL_COUNT);
}

export function normalizeRawMaterialAllocationTable(
  rows: string[][] | undefined,
): string[][] {
  const list = rows?.length ? rows : [emptyRawMaterialAllocationRow()];
  return list.map((row) => normalizeRawMaterialAllocationRow(row));
}

export function sumRawMaterialAllocationColumns(
  rows: string[][] | undefined,
): RawMaterialAllocationTotals {
  const computed = normalizeRawMaterialAllocationTable(rows);
  let ratio = 0;
  let weekly = 0;
  for (const row of computed) {
    ratio += parseCompensationAmount(row[1]);
    weekly += parseCompensationAmount(row[2]);
  }
  return {
    ratio: formatAllocationNumber(ratio),
    weekly: formatAllocationNumber(weekly),
  };
}

export function rawMaterialAllocationFooterRow(
  rows: string[][] | undefined,
): string[] {
  const totals = sumRawMaterialAllocationColumns(rows);
  return ["Total", totals.ratio, totals.weekly];
}

export const SCHEDULE_MONTH_COUNT = 8;
export const SCHEDULE_COL_COUNT = 1 + SCHEDULE_MONTH_COUNT;

export function emptyScheduleRow(): string[] {
  return Array(SCHEDULE_COL_COUNT).fill("");
}

export function isScheduleMonthChecked(cell: string | undefined): boolean {
  const v = String(cell ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "x" || v === "yes" || v === "✓";
}

function normalizeScheduleRow(raw: unknown): string[] {
  const cells = Array.isArray(raw)
    ? raw.map((c) => String(c ?? ""))
    : [];
  if (cells.length <= 2) {
    return [cells[0] ?? "", ...Array(SCHEDULE_MONTH_COUNT).fill("")];
  }
  const next = [...cells];
  while (next.length < SCHEDULE_COL_COUNT) next.push("");
  return next.slice(0, SCHEDULE_COL_COUNT);
}

export function normalizeScheduleTable(
  rows: string[][] | undefined,
): string[][] {
  const list = Array.isArray(rows) ? rows : [];
  const normalized = list.map((row) => normalizeScheduleRow(row));
  return normalized.length ? normalized : [emptyScheduleRow()];
}

export const EXISTING_EQUIPMENT_COL_COUNT = 9;
export const EXISTING_EQUIPMENT_COMPUTED_COLUMNS = [4, 6, 8] as const;

export function emptyExistingEquipmentRow(): string[] {
  return Array(EXISTING_EQUIPMENT_COL_COUNT).fill("");
}

export interface ExistingEquipmentColumnTotals {
  totalCost: string;
  bookValue: string;
}

/**
 * Legacy 3-col: Type, Quantity, Year Acquired.
 * TNA 5-col: Type, Specs, Capacity, Units, Year.
 */
function migrateExistingEquipmentRow(raw: string[]): string[] {
  if (raw.length <= 3) {
    return [
      raw[0] ?? "",
      raw[2] ?? "",
      "",
      raw[1] ?? "",
      "",
      "",
      "",
      "",
      "",
    ];
  }
  if (raw.length === 5) {
    return [
      raw[0] ?? "",
      raw[4] ?? "",
      "",
      raw[3] ?? "",
      "",
      "",
      "",
      "",
      "",
    ];
  }
  const cells = [...raw];
  while (cells.length < EXISTING_EQUIPMENT_COL_COUNT) cells.push("");
  return cells.slice(0, EXISTING_EQUIPMENT_COL_COUNT);
}

/**
 * Total cost = Qty × Acquisition cost.
 * Annual depreciation = Total cost / EUL (straight-line, salvage 0).
 * Book value = Total cost − Annual depreciation × (EUL − RUL).
 * If EUL is missing or ≤ 0, depreciation and book value stay blank.
 * If RUL > EUL, years-used is 0 (book value = total cost).
 */
export function computeExistingEquipmentRow(row: unknown): string[] {
  const raw = Array.isArray(row) ? row.map((c) => String(c ?? "")) : [];
  const cells = migrateExistingEquipmentRow(raw);
  const particulars = cells[0] ?? "";
  const yearAcquired = cells[1] ?? "";
  const acquisitionCostRaw = cells[2] ?? "";
  const qtyRaw = cells[3] ?? "";
  const eulRaw = cells[5] ?? "";
  const rulRaw = cells[7] ?? "";
  const qty = parseCompensationAmount(qtyRaw);
  const acquisitionCost = parseCompensationAmount(acquisitionCostRaw);
  const eul = parseCompensationAmount(eulRaw);
  const rul = parseCompensationAmount(rulRaw);
  const totalCost =
    qty > 0 && acquisitionCost > 0 ? qty * acquisitionCost : 0;
  const annualDep = eul > 0 && totalCost > 0 ? totalCost / eul : 0;
  const yearsUsed = eul > 0 ? Math.max(0, eul - rul) : 0;
  const bookValue = annualDep > 0 ? totalCost - annualDep * yearsUsed : 0;
  return [
    particulars,
    yearAcquired,
    acquisitionCostRaw,
    qtyRaw,
    formatCompensationTotal(totalCost),
    eulRaw,
    eul > 0 && totalCost > 0 ? formatCompensationTotal(annualDep) : "",
    rulRaw,
    eul > 0 && totalCost > 0 ? formatCompensationTotal(bookValue) : "",
  ];
}

export function recomputeExistingEquipmentTable(
  rows: string[][] | undefined,
): string[][] {
  const list = rows?.length ? rows : [emptyExistingEquipmentRow()];
  return list.map((row) => computeExistingEquipmentRow(row));
}

export function sumExistingEquipmentColumns(
  rows: string[][] | undefined,
): ExistingEquipmentColumnTotals {
  const computed = recomputeExistingEquipmentTable(rows);
  let totalCost = 0;
  let bookValue = 0;
  for (const row of computed) {
    totalCost += parseCompensationAmount(row[4]);
    bookValue += parseCompensationAmount(row[8]);
  }
  return {
    totalCost: formatCompensationTotal(totalCost),
    bookValue: formatCompensationTotal(bookValue),
  };
}

export function existingEquipmentFooterRow(
  rows: string[][] | undefined,
): string[] {
  const totals = sumExistingEquipmentColumns(rows);
  return [
    "Total",
    "",
    "",
    "",
    totals.totalCost,
    "",
    "",
    "",
    totals.bookValue,
  ];
}
