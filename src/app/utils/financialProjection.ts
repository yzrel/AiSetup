/**
 * Author: Yzrel Jade B. Eborde
 *
 * 5-year projected financial statements engine (2024 Business Plan Template parity).
 */

import type {
  FinancialNamedAmountRow,
  FinancialProjectionInputs,
  FinancialProjectionSnapshot,
  FinancialRatioRow,
  FinancialTaxMethod,
  FinancialYear1ProductLine,
} from "../api/types";

export const FINANCIAL_PROJECTION_KEY = "financialProjection";

export const YEAR_COUNT = 5;

const COST_STEP = 1.01;
const STATUTORY_RATE = 0.13;
const SOLE_8_GROSS_CAP = 3_000_000;
const SOLE_8_EXEMPTION = 250_000;
const CIT_REDUCED_NI_CAP = 5_000_000;
const CIT_REDUCED_RATE = 0.2;
const CIT_STANDARD_RATE = 0.25;
const IDENTITY_TOLERANCE = 1;

export function newRowId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyNamedRow(): FinancialNamedAmountRow {
  return { id: newRowId(), name: "", amount: 0, lifeYears: 5 };
}

export function emptyProductLine(): FinancialYear1ProductLine {
  return {
    id: newRowId(),
    name: "",
    srpQ1: 0,
    srpQ2: 0,
    srpQ3: 0,
    srpQ4: 0,
    costQ1: 0,
    qtyQ1: 0,
    qtyQ2: 0,
    qtyQ3: 0,
    qtyQ4: 0,
  };
}

export function emptyFinancialProjectionInputs(): FinancialProjectionInputs {
  return {
    productName: "",
    equipment: [emptyNamedRow()],
    preoperating: [emptyNamedRow()],
    products: [emptyProductLine()],
    loanAmount: 0,
    loanTermYears: 5,
    loanInterestRate: 0,
    equity: 0,
    inventoryYear1: 0,
    salesGrowth: 0,
    cosIncrease: 0,
    salaryIncrease: 0,
    inflation: 0,
    marketing: 0,
    salaries: 0,
    logistics: 0,
    itSoftware: 0,
    transportation: 0,
    rental: 0,
    utilities: 0,
    communication: 0,
    taxesLicenses: 0,
    otherExpenses: 0,
    taxMethod: "sole8",
    setupRefundByYear: [0, 0, 0, 0, 0],
  };
}

export function parseMoney(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function formatPhp(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatRatio(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/** IRR is a rate; unconverged Newton guesses must not print as trillions. */
export function formatIrr(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || Math.abs(n) > 5) return "—";
  return formatPercent(n);
}

function zeros(): number[] {
  return Array.from({ length: YEAR_COUNT }, () => 0);
}

function sumAmounts(rows: FinancialNamedAmountRow[]): number {
  return rows.reduce((s, r) => s + Math.max(0, parseMoney(r.amount)), 0);
}

function weightedLife(rows: FinancialNamedAmountRow[], total: number): number {
  if (total <= 0) return 5;
  const weighted = rows.reduce((s, r) => {
    const amt = Math.max(0, parseMoney(r.amount));
    const life = Math.max(1, parseMoney(r.lifeYears) || 5);
    return s + amt * life;
  }, 0);
  return weighted / total;
}

function grow(prev: number, rate: number): number {
  return round2(prev * (1 + rate));
}

/** TRAIN 2023+ graduated personal income tax on taxable income. */
export function graduatedPit(taxable: number): number {
  const t = Math.max(0, taxable);
  if (t <= 250_000) return 0;
  if (t <= 400_000) return 0.15 * (t - 250_000);
  if (t <= 800_000) return 22_500 + 0.2 * (t - 400_000);
  if (t <= 2_000_000) return 102_500 + 0.25 * (t - 800_000);
  if (t <= 8_000_000) return 402_500 + 0.3 * (t - 2_000_000);
  return 2_202_500 + 0.35 * (t - 8_000_000);
}

export function computeIncomeTax(
  method: FinancialTaxMethod,
  grossSales: number,
  niBeforeTax: number,
): number {
  if (method === "sole8") {
    if (grossSales <= 0) return 0;
    if (grossSales <= SOLE_8_GROSS_CAP) {
      return round2(Math.max(0, grossSales - SOLE_8_EXEMPTION) * 0.08);
    }
    return round2(graduatedPit(niBeforeTax));
  }
  if (method === "soleGraduated") {
    return round2(graduatedPit(niBeforeTax));
  }
  const rate = niBeforeTax <= CIT_REDUCED_NI_CAP ? CIT_REDUCED_RATE : CIT_STANDARD_RATE;
  return round2(Math.max(0, niBeforeTax) * rate);
}

/** Excel NPV(rate, v1..vn) — end-of-period, first value is t=1. */
export function excelNpv(rate: number, values: number[]): number | null {
  if (!Number.isFinite(rate) || values.length === 0) return null;
  let total = 0;
  for (let i = 0; i < values.length; i += 1) {
    total += values[i] / Math.pow(1 + rate, i + 1);
  }
  return Number.isFinite(total) ? round2(total) : null;
}

function hasSignChange(cashFlows: number[]): boolean {
  let pos = false;
  let neg = false;
  for (const cf of cashFlows) {
    if (cf > 0) pos = true;
    if (cf < 0) neg = true;
    if (pos && neg) return true;
  }
  return false;
}

function irrNewtonOnce(cashFlows: number[], guess: number): number | null {
  let r = guess;
  const scale = Math.max(
    1,
    cashFlows.reduce((s, v) => s + Math.abs(v), 0),
  );
  for (let i = 0; i < 80; i += 1) {
    let npv = 0;
    let deriv = 0;
    for (let t = 0; t < cashFlows.length; t += 1) {
      const den = Math.pow(1 + r, t);
      if (!Number.isFinite(den) || den === 0) return null;
      npv += cashFlows[t] / den;
      deriv -= (t * cashFlows[t]) / Math.pow(1 + r, t + 1);
    }
    if (!Number.isFinite(npv) || !Number.isFinite(deriv) || Math.abs(deriv) < 1e-12) {
      return null;
    }
    const next = r - npv / deriv;
    if (!Number.isFinite(next) || next <= -0.999 || next > 10) return null;
    if (Math.abs(next - r) < 1e-8) {
      return Math.abs(npv) < 1e-4 * scale ? next : null;
    }
    r = next;
  }
  return null;
}

/**
 * Excel-style IRR (first cash flow is t=0). Returns null when there is no
 * sign change or Newton does not converge — never an unconverged huge rate.
 */
export function irrNewton(cashFlows: number[], guess = 0.1): number | null {
  if (cashFlows.length < 2 || !hasSignChange(cashFlows)) return null;
  const guesses = [guess, 0.1, 0, -0.1, 0.5, -0.5, 1];
  for (const g of guesses) {
    const found = irrNewtonOnce(cashFlows, g);
    if (found != null && Math.abs(found) <= 5) return found;
  }
  return null;
}

function year1SalesAndCos(products: FinancialYear1ProductLine[]): {
  sales: number;
  cos: number;
} {
  let sales = 0;
  let cos = 0;
  for (const p of products) {
    const costs = [
      parseMoney(p.costQ1),
      parseMoney(p.costQ1) * COST_STEP,
      parseMoney(p.costQ1) * COST_STEP * COST_STEP,
      parseMoney(p.costQ1) * COST_STEP * COST_STEP * COST_STEP,
    ];
    const srps = [
      parseMoney(p.srpQ1),
      parseMoney(p.srpQ2) || parseMoney(p.srpQ1),
      parseMoney(p.srpQ3) || parseMoney(p.srpQ1),
      parseMoney(p.srpQ4) || parseMoney(p.srpQ1),
    ];
    const qtys = [
      parseMoney(p.qtyQ1),
      parseMoney(p.qtyQ2),
      parseMoney(p.qtyQ3),
      parseMoney(p.qtyQ4),
    ];
    for (let q = 0; q < 4; q += 1) {
      sales += qtys[q] * srps[q];
      cos += qtys[q] * costs[q];
    }
  }
  return { sales: round2(sales), cos: round2(cos) };
}

export function computeFinancialProjection(
  raw: FinancialProjectionInputs,
): FinancialProjectionSnapshot {
  const equipmentTotal = round2(sumAmounts(raw.equipment ?? []));
  const preoperatingTotal = round2(sumAmounts(raw.preoperating ?? []));
  const eqLife = weightedLife(raw.equipment ?? [], equipmentTotal);
  const preLife = weightedLife(raw.preoperating ?? [], preoperatingTotal);
  const depreciationAnnual = equipmentTotal > 0 ? round2(equipmentTotal / eqLife) : 0;
  const amortizationAnnual =
    preoperatingTotal > 0 ? round2(preoperatingTotal / preLife) : 0;

  const { sales: y1Sales, cos: y1Cos } = year1SalesAndCos(raw.products ?? []);
  const salesGrowth = parseMoney(raw.salesGrowth);
  const cosIncrease = parseMoney(raw.cosIncrease);
  const salaryIncrease = parseMoney(raw.salaryIncrease);
  const inflation = parseMoney(raw.inflation);

  const grossSales = zeros();
  const costOfSales = zeros();
  grossSales[0] = y1Sales;
  costOfSales[0] = y1Cos;
  for (let y = 1; y < YEAR_COUNT; y += 1) {
    grossSales[y] = grow(grossSales[y - 1], salesGrowth);
    costOfSales[y] = grow(costOfSales[y - 1], cosIncrease);
  }
  const grossProfit = grossSales.map((s, i) => round2(s - costOfSales[i]));
  const gpPercent = grossSales.map((s, i) => (s > 0 ? grossProfit[i] / s : null));

  const marketing = zeros();
  const salaries = zeros();
  const statutory = zeros();
  const thirteenth = zeros();
  const logistics = zeros();
  const itSoftware = zeros();
  const transportation = zeros();
  const rental = zeros();
  const utilities = zeros();
  const communication = zeros();
  const taxesLicenses = zeros();
  const otherExpenses = zeros();
  const depreciation = zeros();
  const amortization = zeros();
  const assetsNet = zeros();
  const preopNet = zeros();

  marketing[0] = round2(parseMoney(raw.marketing));
  salaries[0] = round2(parseMoney(raw.salaries));
  logistics[0] = round2(parseMoney(raw.logistics));
  itSoftware[0] = round2(parseMoney(raw.itSoftware));
  transportation[0] = round2(parseMoney(raw.transportation));
  rental[0] = round2(parseMoney(raw.rental));
  utilities[0] = round2(parseMoney(raw.utilities));
  communication[0] = round2(parseMoney(raw.communication));
  taxesLicenses[0] = round2(parseMoney(raw.taxesLicenses));
  otherExpenses[0] = round2(parseMoney(raw.otherExpenses));

  for (let y = 1; y < YEAR_COUNT; y += 1) {
    marketing[y] = grow(marketing[y - 1], inflation);
    salaries[y] = grow(salaries[y - 1], salaryIncrease);
    logistics[y] = grow(logistics[y - 1], inflation);
    itSoftware[y] = grow(itSoftware[y - 1], inflation);
    transportation[y] = grow(transportation[y - 1], inflation);
    rental[y] = rental[0];
    utilities[y] = grow(utilities[y - 1], inflation);
    communication[y] = grow(communication[y - 1], inflation);
    taxesLicenses[y] = taxesLicenses[0];
    otherExpenses[y] = grow(otherExpenses[y - 1], inflation);
  }
  let eqNbv = equipmentTotal;
  let preNbv = preoperatingTotal;
  for (let y = 0; y < YEAR_COUNT; y += 1) {
    statutory[y] = round2(salaries[y] * STATUTORY_RATE);
    thirteenth[y] = round2(salaries[y] / 12);
    depreciation[y] = round2(Math.min(depreciationAnnual, Math.max(0, eqNbv)));
    amortization[y] = round2(Math.min(amortizationAnnual, Math.max(0, preNbv)));
    eqNbv = round2(Math.max(0, eqNbv - depreciation[y]));
    preNbv = round2(Math.max(0, preNbv - amortization[y]));
    assetsNet[y] = eqNbv;
    preopNet[y] = preNbv;
  }

  const totalOpex = zeros();
  for (let y = 0; y < YEAR_COUNT; y += 1) {
    totalOpex[y] = round2(
      marketing[y] +
        salaries[y] +
        statutory[y] +
        thirteenth[y] +
        logistics[y] +
        itSoftware[y] +
        transportation[y] +
        rental[y] +
        utilities[y] +
        communication[y] +
        taxesLicenses[y] +
        otherExpenses[y] +
        depreciation[y] +
        amortization[y],
    );
  }

  const loanAmount = Math.max(0, parseMoney(raw.loanAmount));
  const term = Math.max(1, Math.round(parseMoney(raw.loanTermYears) || 5));
  const rate = Math.max(0, parseMoney(raw.loanInterestRate));
  const annualPrincipal = loanAmount > 0 ? round2(loanAmount / term) : 0;
  const interest = zeros();
  const principal = zeros();
  let remaining = loanAmount;
  for (let y = 0; y < YEAR_COUNT; y += 1) {
    interest[y] = round2(remaining * rate);
    principal[y] = remaining > 0 ? Math.min(annualPrincipal, remaining) : 0;
    remaining = round2(Math.max(0, remaining - principal[y]));
  }

  const noi = grossProfit.map((gp, i) => round2(gp - totalOpex[i]));
  const niBeforeTax = noi.map((n, i) => round2(n - interest[i]));
  const taxMethod = raw.taxMethod ?? "sole8";
  const incomeTax = niBeforeTax.map((ni, i) =>
    computeIncomeTax(taxMethod, grossSales[i], ni),
  );
  const niAfterTax = niBeforeTax.map((ni, i) => round2(ni - incomeTax[i]));
  const npm = grossSales.map((s, i) => (s > 0 ? niAfterTax[i] / s : null));
  const retainedEarnings = zeros();
  retainedEarnings[0] = niAfterTax[0];
  for (let y = 1; y < YEAR_COUNT; y += 1) {
    retainedEarnings[y] = round2(retainedEarnings[y - 1] + niAfterTax[y]);
  }

  const refund = Array.from({ length: YEAR_COUNT }, (_, i) =>
    round2(parseMoney(raw.setupRefundByYear?.[i] ?? 0)),
  );
  const setupTotal = round2(refund.reduce((s, n) => s + n, 0));
  const setupProceeds = zeros();
  setupProceeds[0] = setupTotal;
  const setupPayable = zeros();
  for (let y = 0; y < YEAR_COUNT; y += 1) {
    setupPayable[y] = round2(
      refund.slice(y + 1).reduce((s, n) => s + n, 0),
    );
  }
  const equity = round2(parseMoney(raw.equity));
  const inventoryY1 = round2(parseMoney(raw.inventoryYear1));
  const inventoryOut = zeros();
  inventoryOut[0] = inventoryY1;

  const cashOpex = totalOpex.map((t, i) => round2(t - depreciation[i] - amortization[i]));
  const loanProceeds = zeros();
  loanProceeds[0] = loanAmount;
  const equityIn = zeros();
  equityIn[0] = equity;
  const capex = zeros();
  capex[0] = equipmentTotal;
  const preopOut = zeros();
  preopOut[0] = preoperatingTotal;

  const net = zeros();
  for (let y = 0; y < YEAR_COUNT; y += 1) {
    const inflow = grossSales[y] + loanProceeds[y] + equityIn[y] + setupProceeds[y];
    const outflow =
      costOfSales[y] +
      inventoryOut[y] +
      cashOpex[y] +
      capex[y] +
      preopOut[y] +
      principal[y] +
      interest[y] +
      incomeTax[y] +
      refund[y];
    net[y] = round2(inflow - outflow);
  }

  const cash = zeros();
  cash[0] = net[0];
  for (let y = 1; y < YEAR_COUNT; y += 1) {
    cash[y] = round2(cash[y - 1] + net[y]);
  }
  const inventory = zeros();
  for (let y = 0; y < YEAR_COUNT; y += 1) {
    inventory[y] = inventoryY1;
  }

  const loansPayable = zeros();
  let loanBal = loanAmount;
  for (let y = 0; y < YEAR_COUNT; y += 1) {
    loanBal = round2(Math.max(0, loanBal - principal[y]));
    loansPayable[y] = loanBal;
  }
  const capital = zeros();
  for (let y = 0; y < YEAR_COUNT; y += 1) capital[y] = equity;

  const totalAssets = zeros();
  const totalEquity = zeros();
  const totalLAndE = zeros();
  const identityDiff = zeros();
  for (let y = 0; y < YEAR_COUNT; y += 1) {
    totalAssets[y] = round2(cash[y] + inventory[y] + assetsNet[y] + preopNet[y]);
    totalEquity[y] = round2(capital[y] + retainedEarnings[y]);
    totalLAndE[y] = round2(loansPayable[y] + setupPayable[y] + totalEquity[y]);
    identityDiff[y] = round2(totalAssets[y] - totalLAndE[y]);
  }
  const balanced = identityDiff.every((d) => Math.abs(d) <= IDENTITY_TOLERANCE);

  const investment = round2(equipmentTotal + preoperatingTotal);
  const ratios: FinancialRatioRow[] = [];
  for (let y = 0; y < YEAR_COUNT; y += 1) {
    const currentAssets = round2(cash[y] + inventory[y]);
    const currentLiabilities = round2(loansPayable[y] + setupPayable[y]);
    const liquidity =
      currentLiabilities > 0 ? currentAssets / currentLiabilities : null;
    const quick =
      currentLiabilities > 0
        ? (currentAssets - inventory[y]) / currentLiabilities
        : null;
    const roi = investment > 0 ? niAfterTax[y] / investment : null;
    ratios.push({
      year: y + 1,
      currentAssets,
      inventory: inventory[y],
      currentLiabilities,
      liquidity,
      quick,
      netIncome: niAfterTax[y],
      investment,
      roi,
    });
  }

  const npv = excelNpv(rate, net);
  const irr = irrNewton(net, rate > 0 ? rate : 0.1);

  const ratioOrZero = (arr: (number | null)[]) =>
    arr.map((v) => (v == null || !Number.isFinite(v) ? 0 : v));

  return {
    years: [1, 2, 3, 4, 5],
    depreciationAnnual,
    amortizationAnnual,
    equipmentTotal,
    preoperatingTotal,
    incomeStatement: {
      grossSales,
      costOfSales,
      grossProfit,
      gpPercent: ratioOrZero(gpPercent),
      marketing,
      salaries,
      statutory,
      thirteenth,
      logistics,
      itSoftware,
      transportation,
      rental,
      utilities,
      communication,
      taxesLicenses,
      otherExpenses,
      depreciation,
      amortization,
      totalOpex,
      noi,
      interest,
      niBeforeTax,
      incomeTax,
      niAfterTax,
      npm: ratioOrZero(npm),
      retainedEarnings,
    },
    cashFlow: {
      grossSales,
      loanProceeds,
      equity: equityIn,
      setupProceeds,
      costOfSales,
      inventory: inventoryOut,
      cashOpex,
      capex,
      preoperating: preopOut,
      principal,
      interest,
      incomeTax,
      setupRefund: refund,
      net,
    },
    balanceSheet: {
      cash,
      inventory,
      assetsNet,
      preopNet,
      totalAssets,
      loansPayable,
      setupPayable,
      capital,
      retainedEarnings,
      totalEquity,
      totalLAndE,
      identityDiff,
    },
    ratios,
    npv,
    irr,
    balanced,
  };
}

export function snapshotToRatioTables(snapshot: FinancialProjectionSnapshot): {
  liquidityRatioTable: string[][];
  quickRatioTable: string[][];
  roiTable: string[][];
} {
  return {
    liquidityRatioTable: snapshot.ratios.map((r) => [
      String(r.year),
      formatPhp(r.currentAssets),
      formatPhp(r.currentLiabilities),
      formatRatio(r.liquidity),
    ]),
    quickRatioTable: snapshot.ratios.map((r) => [
      String(r.year),
      formatPhp(r.currentAssets),
      formatPhp(r.inventory),
      formatPhp(r.currentLiabilities),
      formatRatio(r.quick),
    ]),
    roiTable: snapshot.ratios.map((r) => [
      String(r.year),
      formatPhp(r.netIncome),
      formatPhp(r.investment),
      r.roi == null ? "—" : formatPercent(r.roi),
    ]),
  };
}

const IS_ROWS: { key: string; label: string; pct?: boolean }[] = [
  { key: "grossSales", label: "Gross Sales" },
  { key: "costOfSales", label: "Cost of Sales" },
  { key: "grossProfit", label: "Gross Profit" },
  { key: "gpPercent", label: "Gross Profit %", pct: true },
  { key: "marketing", label: "Sales and Marketing" },
  { key: "salaries", label: "Salaries and Wages" },
  { key: "statutory", label: "SSS / PhilHealth / HDMF (13%)" },
  { key: "thirteenth", label: "13th Month Pay" },
  { key: "logistics", label: "Delivery and Logistics" },
  { key: "itSoftware", label: "IT / Website / Software" },
  { key: "transportation", label: "Transportation" },
  { key: "rental", label: "Rental Expense" },
  { key: "utilities", label: "Utilities" },
  { key: "communication", label: "Communication" },
  { key: "taxesLicenses", label: "Taxes & Licenses" },
  { key: "otherExpenses", label: "Other Expenses" },
  { key: "depreciation", label: "Depreciation — Assets" },
  { key: "amortization", label: "Amortization — Pre-operating" },
  { key: "totalOpex", label: "Total Operating Expenses" },
  { key: "noi", label: "Net Income from Operations" },
  { key: "interest", label: "Interest Expense" },
  { key: "niBeforeTax", label: "Net Income before Tax" },
  { key: "incomeTax", label: "Income Tax" },
  { key: "niAfterTax", label: "Net Income after Tax" },
  { key: "npm", label: "Net Profit %", pct: true },
];

const CF_ROWS: { key: string; label: string }[] = [
  { key: "grossSales", label: "Cash from operations (sales)" },
  { key: "loanProceeds", label: "Loans" },
  { key: "equity", label: "Owner equity / investment" },
  { key: "setupProceeds", label: "SETUP iFund (recognized)" },
  { key: "costOfSales", label: "Cost of sales" },
  { key: "inventory", label: "Inventory" },
  { key: "cashOpex", label: "Operating expenses (cash)" },
  { key: "capex", label: "Capital expenses" },
  { key: "preoperating", label: "Pre-operating expenses" },
  { key: "principal", label: "Loan principal" },
  { key: "interest", label: "Interest expense" },
  { key: "incomeTax", label: "Income tax" },
  { key: "setupRefund", label: "SETUP refund" },
  { key: "net", label: "Net cash inflow / (outflow)" },
];

const BS_ROWS: { key: string; label: string }[] = [
  { key: "cash", label: "Cash and cash equivalents" },
  { key: "inventory", label: "Inventory" },
  { key: "assetsNet", label: "Assets (net)" },
  { key: "preopNet", label: "Pre-operating expenses (net)" },
  { key: "totalAssets", label: "TOTAL ASSETS" },
  { key: "loansPayable", label: "Loans payable" },
  { key: "setupPayable", label: "SETUP refund payable" },
  { key: "capital", label: "Capital" },
  { key: "retainedEarnings", label: "Retained earnings" },
  { key: "totalEquity", label: "Total equity" },
  { key: "totalLAndE", label: "TOTAL LIABILITIES & EQUITY" },
];

function seriesTable(
  rows: { key: string; label: string; pct?: boolean }[],
  series: Record<string, number[]>,
): string[][] {
  const header = ["Item", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
  const body = rows.map((row) => {
    const vals = series[row.key] ?? zeros();
    return [
      row.label,
      ...vals.map((v) => (row.pct ? formatPercent(v) : formatPhp(v))),
    ];
  });
  return [header, ...body];
}

export function snapshotStatementTables(snapshot: FinancialProjectionSnapshot): {
  income: string[][];
  cashFlow: string[][];
  balance: string[][];
} {
  return {
    income: seriesTable(IS_ROWS, snapshot.incomeStatement),
    cashFlow: seriesTable(CF_ROWS, snapshot.cashFlow),
    balance: seriesTable(BS_ROWS, snapshot.balanceSheet),
  };
}
