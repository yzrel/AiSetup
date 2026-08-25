/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import { applicantStore } from "../../store/applicantStore";
import type { Applicant } from "../../store/applicantStore";
import {
  PP_BUSINESS_ACTIVITY_PAIRS,
  PP_COMPANY_PROFILE_COLUMN_COUNT,
  PP_EMPLOYEE_ROWS,
  PP_EXPECTED_OUTPUT_HEADINGS,
  PP_FINANCIAL_CAPACITY_DASH_ITEMS,
  PP_FINANCIAL_SUBHEADINGS,
  PP_FORM_INDENT_CLASS,
  PP_FORM_INDENT_IN,
  PP_MARKETING_A_LABELS,
  PP_MARKETING_SUBHEADINGS,
  PP_MSME_SIZES,
  PP_ORGANIZATION_INSTRUCTION,
  PP_ORGANIZATION_TYPES,
  PP_ORG_MEDIUM_COLSPAN,
  PP_ORG_NONPROFIT_COLSPAN,
  PP_PRODUCTION_DASH_ITEMS,
  PP_PROFIT_TYPES,
  PP_SCHEDULE_MONTHS,
  PP_SCHEDULE_WEEKS_PER_MONTH,
  PP_VOLUME_OF_ORDERS_COLUMNS,
  PP_VOLUME_OF_ORDERS_SAMPLE_ROWS,
  companyProfileEmployeeTotals,
  companyProfileMsmeSizeLabel,
  formatCompanyProfileMsmeSize,
  isOptionChecked,
  isRegistrationOfficeChecked,
} from "../../constants/projectProposalLayout";
import {
  applyGeneratedDocument,
  buildDefaultRefundSchedule,
  buildInvestmentDecisionAnalysis,
  buildLocalProjectProposalDocument,
  buildProjectProposalDraft,
  companyProfileMsmeSizeLabelFromApplicant,
  deriveDirectEmploymentCounts,
  emptyProjectProposalForm,
  formatRiskAndAssumptions,
  isScheduleMonthChecked,
  normalizeRefundSchedule,
  normalizeScheduleTable,
  toBudgetPrintRow,
} from "../projectProposal";

describe("Form 001 marketing lettering", () => {
  it("uses official A–F marketing subheadings", () => {
    expect(PP_MARKETING_SUBHEADINGS.A).toMatch(/^A\./);
    expect(PP_MARKETING_SUBHEADINGS.B).toMatch(/^B\./);
    expect(PP_MARKETING_SUBHEADINGS.C).toMatch(/^C\./);
    expect(PP_MARKETING_SUBHEADINGS.D).toMatch(/^D\./);
    expect(PP_MARKETING_SUBHEADINGS.E).toMatch(/Existing problems/i);
    expect(PP_MARKETING_SUBHEADINGS.F).toMatch(/^F\./);
  });

  it("labels Market Situation, Product demand, and Volume of orders under A", () => {
    expect(PP_MARKETING_A_LABELS.marketSituation).toBe("Market Situation");
    expect(PP_MARKETING_A_LABELS.productDemand).toBe("Product demand");
    expect(PP_MARKETING_A_LABELS.volumeOfOrders).toBe("Volume of orders");
    expect([...PP_VOLUME_OF_ORDERS_COLUMNS]).toEqual([
      "Name of company",
      "Address",
      "Volume of orders",
    ]);
    expect(PP_VOLUME_OF_ORDERS_SAMPLE_ROWS).toHaveLength(3);
    for (const row of PP_VOLUME_OF_ORDERS_SAMPLE_ROWS) {
      expect(row).toHaveLength(3);
      expect(row.every((cell) => String(cell).trim().length > 0)).toBe(true);
    }
    expect(PP_VOLUME_OF_ORDERS_SAMPLE_ROWS[0][0]).toMatch(/Koronadal City Local Government/);
  });

  it("nests Production and Non-Production under Direct Workers", () => {
    expect(PP_EMPLOYEE_ROWS.map((r) => r.label)).toEqual([
      "Direct Workers",
      "Production",
      "Non-Production",
      "Indirect/Contract Workers",
      "Total",
    ]);
    expect(PP_EMPLOYEE_ROWS[1].indent).toBe(true);
    expect(PP_EMPLOYEE_ROWS[2].indent).toBe(true);
    expect(PP_EMPLOYEE_ROWS[0].indent).toBe(false);
  });

  it("uses sibling indent wrappers 0.5in / 0.75in / 1in", () => {
    expect(PP_FORM_INDENT_CLASS).toEqual({
      1: "pp-form-indent-1",
      2: "pp-form-indent-2",
      3: "pp-form-indent-3",
    });
    expect(PP_FORM_INDENT_IN).toEqual({
      1: "0.5in",
      2: "0.75in",
      3: "1in",
    });
    expect(PP_PRODUCTION_DASH_ITEMS[0]).toMatch(/Process Flow/i);
    expect(PP_FINANCIAL_CAPACITY_DASH_ITEMS[0]).toMatch(/Financial ratio/i);
    expect(PP_EXPECTED_OUTPUT_HEADINGS.length).toBeGreaterThan(0);
  });

  it("keeps organization and activity options as Word table row shapes", () => {
    expect(PP_ORGANIZATION_TYPES).toHaveLength(4);
    expect(PP_PROFIT_TYPES).toHaveLength(2);
    expect(PP_MSME_SIZES).toHaveLength(3);
    expect(PP_ORGANIZATION_INSTRUCTION).toMatch(/Type of Organization/i);
    expect(PP_COMPANY_PROFILE_COLUMN_COUNT).toBe(9);
    expect(PP_ORG_NONPROFIT_COLSPAN).toBe(5);
    expect(PP_ORG_MEDIUM_COLSPAN).toBe(3);
    expect(PP_BUSINESS_ACTIVITY_PAIRS.length).toBeGreaterThan(0);
    for (const pair of PP_BUSINESS_ACTIVITY_PAIRS) {
      expect(pair).toHaveLength(2);
    }
  });
});

describe("empty Form 001 fields", () => {
  it("includes new Form 001 keys on the empty form", () => {
    const form = emptyProjectProposalForm();
    expect(form.existingMarketingProblems).toBe("");
    expect(form.materialBalance).toBe("");
    expect(form.wasteVolumeMonthly).toBe("");
    expect(form.wasteKinds).toBe("");
    expect(form.wasteDisposalMethods).toBe("");
    expect(form.partialBudgetAnalysis).toBe("");
    expect(form.netProfitMarginTable).toHaveLength(3);
    expect(form.employeesProductionMale).toBe("");
    expect(form.assetSize).toBe("");
    expect(form.classificationRange).toBe("");
    expect(form.budgetItems[0].lgiaShare).toBe("");
    expect(form.riskRows[0].objective).toBe("");
    expect(form.volumeOfOrdersTable).toEqual([["", "", ""]]);
  });
});

describe("company profile MSME size label", () => {
  it("concatenates classification range, asset size, and employee total", () => {
    const label = companyProfileMsmeSizeLabel({
      msmeSize: "Small",
      assetSize: "15000000",
      classificationRange: "₱3M - ₱15M",
      employeesProductionMale: "3",
      employeesProductionFemale: "4",
    });
    expect(label).toBe(
      "Small · ₱3M - ₱15M (Php 15,000,000.00) · 7 employees",
    );
  });

  it("falls back to MSME category when asset and headcount are missing", () => {
    expect(
      formatCompanyProfileMsmeSize({ msmeSize: "Micro" }),
    ).toBe("Micro");
  });

  it("reads prescreening asset/range from the applicant record", () => {
    const app: Applicant = {
      id: "ps-1",
      applicationId: "LOI-TEST-001",
      applicantName: "Owner",
      designation: "Owner",
      enterpriseName: "Three K Printshop",
      contactNumber: "09170000000",
      emailAddress: "test@example.com",
      businessType: "DTI",
      businessNature: "",
      businessSector: "ICT",
      yearsOfOperation: "10",
      enterpriseType: "",
      msmeSize: "Micro",
      assetSize: "15000000",
      region: "Cotabato",
      address: "Antipas, Cotabato",
      currentModule: "project-proposal",
      qualified: true,
      submittedAt: "",
      lastUpdated: "",
      moduleData: {
        classificationRange: "₱3M - ₱15M",
        tna1: { form: { employeesMale: "3", employeesFemale: "4" } },
      },
    };
    const label = companyProfileMsmeSizeLabelFromApplicant(
      app,
      emptyProjectProposalForm(),
    );
    expect(label).toBe(
      "Micro · ₱3M - ₱15M (Php 15,000,000.00) · 7 employees",
    );
  });
});

describe("derived Direct Workers counts", () => {
  it("sums Production and Non-Production into Direct Workers", () => {
    const form = emptyProjectProposalForm();
    const derived = deriveDirectEmploymentCounts({
      ...form,
      employeesProductionMale: "3",
      employeesProductionFemale: "1",
      employeesNonProductionMale: "2",
      employeesNonProductionFemale: "4",
      employeesIndirectMale: "5",
      employeesIndirectFemale: "1",
    });
    expect(derived.employeesMale).toBe("5");
    expect(derived.employeesFemale).toBe("5");
    expect(derived.employeesDirect).toBe("10");
    expect(derived.employeesIndirect).toBe("6");
  });

  it("keeps TNA-forwarded Direct Workers when Production and Non-Production are empty", () => {
    const form = emptyProjectProposalForm();
    const derived = deriveDirectEmploymentCounts({
      ...form,
      employeesMale: "8",
      employeesFemale: "5",
      employeesIndirect: "3",
    });
    expect(derived.employeesMale).toBe("8");
    expect(derived.employeesFemale).toBe("5");
    expect(derived.employeesDirect).toBe("13");
    expect(derived.employeesIndirect).toBe("3");
  });
});

describe("isOptionChecked Form 001 labels", () => {
  it("does not check Profit when the stored value is Non-Profit", () => {
    expect(isOptionChecked("Non-Profit", "Profit")).toBe(false);
    expect(isOptionChecked("Non-Profit", "Non-Profit")).toBe(true);
    expect(isOptionChecked("Profit", "Profit")).toBe(true);
    expect(isOptionChecked("Profit", "Non-Profit")).toBe(false);
    expect(isOptionChecked("non profit", "Non-Profit")).toBe(true);
  });

  it("matches sole proprietorship to Single Proprietorship", () => {
    expect(isOptionChecked("Sole Proprietorship (DTI)", "Single Proprietorship")).toBe(
      true,
    );
    expect(isOptionChecked("Partnership", "Single Proprietorship")).toBe(false);
  });

  it("does not copy DTI onto Others", () => {
    expect(isRegistrationOfficeChecked("DTI", "DTI")).toBe(true);
    expect(isRegistrationOfficeChecked("DTI", "Others, please specify:")).toBe(
      false,
    );
    expect(isRegistrationOfficeChecked("BIR", "Others, please specify:")).toBe(
      true,
    );
  });
});

describe("companyProfileEmployeeTotals", () => {
  it("leaves Direct Workers blank and places TNA counts on Production", () => {
    const totals = companyProfileEmployeeTotals({
      employeesMale: "3",
      employeesFemale: "4",
      employeesIndirectMale: "4",
      employeesIndirectFemale: "4",
    });
    expect(totals.directMale).toBe(0);
    expect(totals.directFemale).toBe(0);
    expect(totals.directTotal).toBe(0);
    expect(totals.productionMale).toBe(3);
    expect(totals.productionFemale).toBe(4);
    expect(totals.productionTotal).toBe(7);
    expect(totals.nonProductionTotal).toBe(0);
    expect(totals.indirectTotal).toBe(8);
    expect(totals.totalMale).toBe(7);
    expect(totals.totalFemale).toBe(8);
    expect(totals.total).toBe(15);
  });

  it("uses Production and Non-Production fields when they are filled", () => {
    const totals = companyProfileEmployeeTotals({
      employeesMale: "99",
      employeesFemale: "99",
      employeesProductionMale: "3",
      employeesProductionFemale: "1",
      employeesNonProductionMale: "2",
      employeesNonProductionFemale: "4",
      employeesIndirectMale: "5",
      employeesIndirectFemale: "1",
    });
    expect(totals.directTotal).toBe(0);
    expect(totals.productionTotal).toBe(4);
    expect(totals.nonProductionTotal).toBe(6);
    expect(totals.totalMale).toBe(10);
    expect(totals.totalFemale).toBe(6);
    expect(totals.total).toBe(16);
  });
});

describe("schedule of activities Gantt", () => {
  it("uses eight month columns M1–M8 and four visual weeks per month", () => {
    expect([...PP_SCHEDULE_MONTHS]).toEqual([
      "M1",
      "M2",
      "M3",
      "M4",
      "M5",
      "M6",
      "M7",
      "M8",
    ]);
    expect(PP_SCHEDULE_WEEKS_PER_MONTH).toBe(4);
    expect(emptyProjectProposalForm().scheduleTable[0]).toHaveLength(9);
  });

  it("keeps activity from legacy 2-col Activity/Timeline rows and clears months", () => {
    const next = normalizeScheduleTable([
      ["TNA / proposal / RTEC", "2024"],
      ["Notice of approval", "March 2025"],
    ]);
    expect(next).toHaveLength(2);
    expect(next[0][0]).toBe("TNA / proposal / RTEC");
    expect(next[0].slice(1)).toEqual(["", "", "", "", "", "", "", ""]);
    expect(next[1][0]).toBe("Notice of approval");
    expect(next[1]).toHaveLength(9);
  });

  it("pads 9-col Gantt rows and treats 1/true/x as checked", () => {
    const next = normalizeScheduleTable([["Trial run", "1", "", "x"]]);
    expect(next[0]).toHaveLength(9);
    expect(isScheduleMonthChecked(next[0][1])).toBe(true);
    expect(isScheduleMonthChecked(next[0][2])).toBe(false);
    expect(isScheduleMonthChecked(next[0][3])).toBe(true);
    expect(isScheduleMonthChecked("true")).toBe(true);
    expect(isScheduleMonthChecked("")).toBe(false);
  });
});

describe("investment decision analysis", () => {
  it("prints under Financial capacity ROI rather than a separate F section", () => {
    expect(PP_FINANCIAL_SUBHEADINGS.E).toBe("E. Proposed Refund Schedule");
    expect(
      "F" in PP_FINANCIAL_SUBHEADINGS,
    ).toBe(false);
    expect(PP_FINANCIAL_CAPACITY_DASH_ITEMS[4]).toBe("ROI");
  });

  it("sums five years, averages by asset life 5, and prefers budget total over cover cost", () => {
    const form = emptyProjectProposalForm();
    form.projectCost = "999999";
    form.budgetItems = [
      {
        id: "1",
        item: "Equipment",
        qty: "1",
        unitCost: "1198958.92",
        setupShare: "",
        lgiaShare: "",
        total: "1198958.92",
      },
    ];
    const snapshot = {
      ratios: [
        { year: 1, netIncome: 539056.88 },
        { year: 2, netIncome: 626621.68 },
        { year: 3, netIncome: 859437.01 },
        { year: 4, netIncome: 1162092.27 },
        { year: 5, netIncome: 1554867.22 },
      ],
    } as Parameters<typeof buildInvestmentDecisionAnalysis>[1];
    const ida = buildInvestmentDecisionAnalysis(form, snapshot);
    expect(ida.assetLife).toBe(5);
    expect(ida.total).toBeCloseTo(4742075.06, 1);
    expect(ida.averageIncome).toBeCloseTo(948415.01, 1);
    expect(ida.projectCost).toBeCloseTo(1198958.92, 2);
    expect(ida.roi).toBeCloseTo(948415.01 / 1198958.92, 5);
    expect(ida.rows[ida.rows.length - 1].value).toBe("79%");
  });

  it("falls back to roiTable when there is no snapshot and leaves percent blank without cost", () => {
    const form = emptyProjectProposalForm();
    form.projectCost = "";
    form.budgetItems = [];
    form.roiTable = [
      ["1", "100", "", ""],
      ["2", "100", "", ""],
      ["3", "100", "", ""],
      ["4", "100", "", ""],
      ["5", "100", "", ""],
    ];
    const ida = buildInvestmentDecisionAnalysis(form, null);
    expect(ida.total).toBe(500);
    expect(ida.averageIncome).toBe(100);
    expect(ida.roi).toBeNull();
    expect(ida.rows[ida.rows.length - 1].value).toBe("");
  });

  it("prints blank income cells when snapshot and roiTable are empty", () => {
    const form = emptyProjectProposalForm();
    const ida = buildInvestmentDecisionAnalysis(form, null);
    expect(ida.rows[0].value).toBe("");
    expect(ida.rows[5].value).toBe("");
    expect(ida.roi).toBeNull();
  });
});

describe("refund schedule Y5", () => {
  it("emits Months Y1–Y5 Total for a 4-year term", () => {
    const schedule = buildDefaultRefundSchedule("240000", "4");
    expect(schedule[0]).toEqual(["Months", "Y1", "Y2", "Y3", "Y4", "Y5", "Total"]);
    const january = schedule[1];
    expect(january[5]).toBe("");
    expect(january[4]).not.toBe("");
  });

  it("fills Y5 when repayment is 5 years", () => {
    const schedule = buildDefaultRefundSchedule("300000", "5");
    const total = schedule[schedule.length - 1];
    expect(total[5]).not.toBe("");
  });

  it("inserts an empty Y5 column on legacy Y1–Y4 schedules", () => {
    const legacy = [
      ["Months", "Y1", "Y2", "Y3", "Y4", "Total"],
      ["January", "1", "1", "1", "1", "4"],
    ];
    const next = normalizeRefundSchedule(legacy);
    expect(next[0]).toEqual(["Months", "Y1", "Y2", "Y3", "Y4", "Y5", "Total"]);
    expect(next[1]).toEqual(["January", "1", "1", "1", "1", "", "4"]);
  });
});

describe("budget LGIA and risk print helpers", () => {
  it("places LGIA between SETUP and Cooperator", () => {
    const row = toBudgetPrintRow({
      id: "1",
      item: "Dryer",
      qty: "1",
      unitCost: "100000",
      setupShare: "70000",
      lgiaShare: "10000",
      total: "100000",
    });
    expect(row).toEqual([
      "Dryer",
      "1",
      "100000",
      "100000",
      "70000",
      "10000",
      "20000",
      "100000",
    ]);
  });

  it("joins risk and assumption for the official middle column", () => {
    expect(
      formatRiskAndAssumptions({
        id: "1",
        objective: "Keep production running",
        risk: "Breakdown",
        assumption: "Spare parts on hand",
        plan: "Maintain stock",
      }),
    ).toBe("Breakdown; Spare parts on hand");
  });
});

describe("applyGeneratedDocument marketing mapping", () => {
  it("maps existingMarketingProblems from the generated document", () => {
    const app = applicantStore.add({
      applicantName: "Form 001 Test",
      designation: "Owner",
      enterpriseName: "Test Co",
      contactNumber: "09170000000",
      emailAddress: `form001-${Date.now()}@example.com`,
      businessType: "DTI",
      businessNature: "",
      businessSector: "Food Processing",
      yearsOfOperation: "5",
      enterpriseType: "",
      msmeSize: "Small",
      assetSize: "",
      region: "South Cotabato",
      address: "Koronadal City, South Cotabato",
      currentModule: "project-proposal",
      qualified: true,
      moduleData: {},
    });
    const form = emptyProjectProposalForm();
    const local = buildLocalProjectProposalDocument({
      applicationId: app.applicationId,
      enterpriseName: app.enterpriseName,
      form: {
        ...form,
        existingMarketingProblems: "",
      },
    });
    local.existingMarketingProblems = "Limited brand reach in institutional markets.";
    const merged = applyGeneratedDocument(app.id, local, form);
    expect(merged.existingMarketingProblems).toBe(
      "Limited brand reach in institutional markets.",
    );
    expect(local.wasteVolumeMonthly).toBeTruthy();
    expect(local.materialBalance).toBeTruthy();
  });
});

function tnaApplicant(overrides: {
  tna1Form?: Record<string, unknown>;
  tna2?: Record<string, unknown>;
}): Applicant {
  return {
    id: "pp-fwd-1",
    enterpriseName: "Forward Foods",
    applicantName: "Maria",
    designation: "Owner",
    address: "Koronadal",
    emailAddress: "fwd@example.com",
    contactNumber: "09181234567",
    msmeSize: "Small",
    businessType: "DTI",
    businessSector: "Food",
    businessNature: "",
    yearsOfOperation: "5",
    assetSize: "",
    moduleData: {
      projectDescription: "Dryer line",
      expectedOutcome: "Higher capacity",
      tna1: {
        submitted: true,
        form: {
          employeesMale: "8",
          employeesFemale: "5",
          employeesIndirect: "3",
          employeesContract: "4",
          wasteManagement: "Peelings and wash water go to a settling pond.",
          marketingPlan: "Supply local groceries",
          promotionalStrategies: "Trade fairs",
          marketCompetitors: "Regional brands",
          productionProblemsConcerns: "Manual drying bottleneck",
          processFlow: "Wash → dry → pack",
          ...overrides.tna1Form,
        },
      },
      ...(overrides.tna2
        ? { tna2Document: { published: true, ...overrides.tna2 } }
        : {}),
    },
  } as unknown as Applicant;
}

describe("new Form 001 field forwarding from TNA", () => {
  it("forwards TNA1 indirect/contract headcount to new male/female keys only", () => {
    const draft = buildProjectProposalDraft(tnaApplicant({}));
    expect(draft.employeesIndirectMale).toBe("3");
    expect(draft.employeesIndirectFemale).toBe("4");
    expect(draft.employeesMale).toBe("8");
    expect(draft.employeesFemale).toBe("5");
    expect(draft.employeesDirect).toBe("13");
    expect(draft.employeesIndirect).toBe("7");
    expect(draft.employeesProductionMale).toBe("8");
    expect(draft.employeesProductionFemale).toBe("5");
    expect(draft.employeesNonProductionMale).toBe("");
    expect(draft.employeesNonProductionFemale).toBe("");
    expect(draft.existingMarketingProblems).toBe("");
    expect(draft.volumeOfOrdersTable).toEqual([["", "", ""]]);
  });

  it("prefills Product demand volume of orders for Three K Printshop", () => {
    const printshop = {
      ...tnaApplicant({
        tna1Form: {
          enterpriseName: "Three K Printshop",
          sector: "Printing",
          commodity: "Commercial printing",
          mainProduct: "Forms, receipts, tarpaulins",
        },
      }),
      enterpriseName: "Three K Printshop",
      businessNature: "Printing",
    };
    const draft = buildProjectProposalDraft(printshop, {
      volumeOfOrdersTable: [["", "", ""]],
    });
    expect(draft.volumeOfOrdersTable).toEqual(PP_VOLUME_OF_ORDERS_SAMPLE_ROWS);
    expect(draft.productDemandSupply).toMatch(/tarpaulins/i);
  });

  it("forwards TNA1 wasteManagement to wasteKinds and leaves existing wasteManagement empty", () => {
    const draft = buildProjectProposalDraft(tnaApplicant({}));
    expect(draft.wasteKinds).toBe(
      "Peelings and wash water go to a settling pond.",
    );
    expect(draft.wasteManagement).toBe("");
    expect(draft.wasteVolumeMonthly).toBe("");
    expect(draft.wasteDisposalMethods).toBe("");
    expect(draft.materialBalance).toBe("");
  });

  it("prefers published TNA2 waste-management over TNA1 for wasteKinds", () => {
    const draft = buildProjectProposalDraft(
      tnaApplicant({
        tna2: {
          findingsByArea: [
            {
              title: "5. Waste Management",
              subsections: [
                {
                  id: "waste-management",
                  label: "Waste Management",
                  content: "Staff note: organic peelings only.",
                },
              ],
            },
          ],
        },
      }),
    );
    expect(draft.wasteKinds).toBe("Staff note: organic peelings only.");
    expect(draft.wasteManagement).toBe("");
  });

  it("forwards published TNA2 methods-of-disposal to wasteDisposalMethods", () => {
    const draft = buildProjectProposalDraft(
      tnaApplicant({
        tna2: {
          findingsByArea: [
            {
              title: "5. Waste Management",
              subsections: [
                {
                  id: "methods-of-disposal",
                  label: "Methods of disposal",
                  content: "Haul residuals to LGU MRF weekly.",
                },
              ],
            },
          ],
        },
      }),
    );
    expect(draft.wasteDisposalMethods).toBe(
      "Haul residuals to LGU MRF weekly.",
    );
    expect(draft.wasteKinds).toBe(
      "Peelings and wash water go to a settling pond.",
    );
  });
});
