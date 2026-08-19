/**
 * Author: Yzrel Jade B. Eborde
 *
 * Download projected statements as .xlsx using the 2024 Business Plan sheet names
 * (Year 0, Year 1, Cash Flow, Income Statement, Balance Sheet). Values come from
 * the engine snapshot so Excel opens without depending on the Entrepinoy file.
 */

import ExcelJS from "exceljs";
import type {
  FinancialProjectionInputs,
  FinancialProjectionSnapshot,
} from "../api/types";
import {
  formatIrr,
  formatPercent,
  snapshotStatementTables,
} from "./financialProjection";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF0C2461" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
const TITLE_FONT: Partial<ExcelJS.Font> = { bold: true, size: 14, color: { argb: "FF0C2461" } };

export async function downloadFinancialProjectionXlsx(opts: {
  inputs: FinancialProjectionInputs;
  snapshot: FinancialProjectionSnapshot;
  applicationId?: string;
  enterpriseName?: string;
  frozenAt?: string;
}): Promise<void> {
  const wb = await buildFinancialProjectionWorkbook(opts);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = opts.applicationId
    ? `Projected-FS-${opts.applicationId}.xlsx`
    : "Projected-Financial-Statements.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export async function buildFinancialProjectionWorkbook(opts: {
  inputs: FinancialProjectionInputs;
  snapshot: FinancialProjectionSnapshot;
  applicationId?: string;
  enterpriseName?: string;
  frozenAt?: string;
}): Promise<ExcelJS.Workbook> {
  const { inputs, snapshot, applicationId, enterpriseName, frozenAt } = opts;
  const wb = new ExcelJS.Workbook();
  wb.creator = "aiSETUP DOST Region XII";
  wb.created = new Date();

  const year0 = wb.addWorksheet("Year 0");
  title(year0, "YEAR 0");
  year0.getCell("A2").value = "Application";
  year0.getCell("B2").value = applicationId ?? "";
  year0.getCell("A3").value = "Enterprise";
  year0.getCell("B3").value = enterpriseName ?? "";
  year0.getCell("A4").value = "(1) MAIN PRODUCT/SERVICE";
  year0.getCell("B4").value = inputs.productName ?? "";
  year0.getCell("A6").value = "(2) Machinery/Equipment";
  year0.getCell("A6").font = { bold: true };
  namedAmountTable(year0, 7, inputs.equipment);
  year0.getCell("A20").value = "(3) Product / service development (pre-operating)";
  year0.getCell("A20").font = { bold: true };
  namedAmountTable(year0, 21, inputs.preoperating);
  year0.getCell("A34").value = "Total equipment";
  year0.getCell("B34").value = snapshot.equipmentTotal;
  year0.getCell("A35").value = "Annual depreciation";
  year0.getCell("B35").value = snapshot.depreciationAnnual;
  year0.getCell("A36").value = "Total pre-operating";
  year0.getCell("B36").value = snapshot.preoperatingTotal;
  year0.getCell("A37").value = "Annual amortization";
  year0.getCell("B37").value = snapshot.amortizationAnnual;
  moneyCols(year0, ["B"]);

  const year1 = wb.addWorksheet("Year 1");
  title(year1, "YEAR 1");
  year1.getCell("A2").value = "(4) PRICING / (5) SALES PROJECTION";
  year1.getCell("A2").font = { bold: true };
  const y1Headers = [
    "Product",
    "SRP Q1",
    "SRP Q2",
    "SRP Q3",
    "SRP Q4",
    "Cost/unit Q1",
    "Qty Q1",
    "Qty Q2",
    "Qty Q3",
    "Qty Q4",
  ];
  y1Headers.forEach((h, i) => {
    const cell = year1.getCell(4, i + 1);
    cell.value = h;
    styleHeaderCell(cell);
  });
  (inputs.products ?? []).forEach((p, ri) => {
    const r = 5 + ri;
    year1.getCell(r, 1).value = p.name;
    year1.getCell(r, 2).value = p.srpQ1;
    year1.getCell(r, 3).value = p.srpQ2;
    year1.getCell(r, 4).value = p.srpQ3;
    year1.getCell(r, 5).value = p.srpQ4;
    year1.getCell(r, 6).value = p.costQ1;
    year1.getCell(r, 7).value = p.qtyQ1;
    year1.getCell(r, 8).value = p.qtyQ2;
    year1.getCell(r, 9).value = p.qtyQ3;
    year1.getCell(r, 10).value = p.qtyQ4;
  });
  year1.getCell("A16").value = "Loan amount";
  year1.getCell("B16").value = inputs.loanAmount;
  year1.getCell("A17").value = "Loan term (years)";
  year1.getCell("B17").value = inputs.loanTermYears;
  year1.getCell("A18").value = "Interest rate";
  year1.getCell("B18").value = inputs.loanInterestRate;
  year1.getCell("A19").value = "Owner equity / investment";
  year1.getCell("B19").value = inputs.equity;
  year1.getCell("A20").value = "Inventory (Year 1)";
  year1.getCell("B20").value = inputs.inventoryYear1;
  moneyCols(year1, ["B", "C", "D", "E", "F"]);

  const tables = snapshotStatementTables(snapshot);
  addStatementSheet(wb, "Income Statement", tables.income);
  addStatementSheet(wb, "Cash Flow", tables.cashFlow);
  addStatementSheet(wb, "Balance Sheet", tables.balance);

  const ratios = wb.addWorksheet("Ratios");
  title(ratios, "FINANCIAL RATIOS");
  ratios.getCell("A2").value = "NPV";
  ratios.getCell("B2").value = snapshot.npv;
  ratios.getCell("A3").value = "IRR";
  ratios.getCell("B3").value = formatIrr(snapshot.irr);
  ratios.getCell("A4").value = "Balance check";
  ratios.getCell("B4").value = snapshot.balanced
    ? "Assets = Liabilities + Equity"
    : "Balance check failed";
  ratios.getCell("A5").value = "Frozen";
  ratios.getCell("B5").value = frozenAt
    ? new Date(frozenAt).toLocaleString("en-PH")
    : "";
  const rh = ["Year", "Current assets", "Inventory", "Current liabilities", "Liquidity", "Quick", "ROI"];
  rh.forEach((h, i) => styleHeaderCell(ratios.getCell(7, i + 1)).value = h);
  snapshot.ratios.forEach((r, i) => {
    const row = 8 + i;
    ratios.getCell(row, 1).value = r.year;
    ratios.getCell(row, 2).value = r.currentAssets;
    ratios.getCell(row, 3).value = r.inventory;
    ratios.getCell(row, 4).value = r.currentLiabilities;
    ratios.getCell(row, 5).value = r.liquidity;
    ratios.getCell(row, 6).value = r.quick;
    ratios.getCell(row, 7).value = formatPercent(r.roi);
  });
  moneyCols(ratios, ["B", "C", "D"]);

  const params = wb.addWorksheet("Parameters");
  title(params, "(8) PARAMETERS / (9) OPERATING EXPENSES / (10) TAX");
  const paramRows: [string, number | string][] = [
    ["Sales growth", inputs.salesGrowth],
    ["Cost of sales increase", inputs.cosIncrease],
    ["Salary increase", inputs.salaryIncrease],
    ["Inflation", inputs.inflation],
    ["Marketing", inputs.marketing],
    ["Salaries", inputs.salaries],
    ["Logistics", inputs.logistics],
    ["IT / software", inputs.itSoftware],
    ["Transportation", inputs.transportation],
    ["Rental", inputs.rental],
    ["Utilities", inputs.utilities],
    ["Communication", inputs.communication],
    ["Taxes & licenses", inputs.taxesLicenses],
    ["Other expenses", inputs.otherExpenses],
    ["Tax method", inputs.taxMethod],
  ];
  paramRows.forEach((row, i) => {
    params.getCell(i + 3, 1).value = row[0];
    params.getCell(i + 3, 2).value = row[1];
  });
  params.getCell("A19").value = "SETUP refund by year (Y1–Y5)";
  (inputs.setupRefundByYear ?? []).forEach((n, i) => {
    params.getCell(20, i + 2).value = n;
  });

  [year0, year1, ratios, params].forEach((ws) => {
    ws.getColumn(1).width = 42;
    ws.getColumn(2).width = 18;
  });

  return wb;
}

function title(ws: ExcelJS.Worksheet, text: string) {
  ws.getCell("A1").value = text;
  ws.getCell("A1").font = TITLE_FONT;
}

function styleHeaderCell(cell: ExcelJS.Cell): ExcelJS.Cell {
  cell.fill = HEADER_FILL;
  cell.font = HEADER_FONT;
  cell.alignment = { wrapText: true, vertical: "middle" };
  return cell;
}

function namedAmountTable(
  ws: ExcelJS.Worksheet,
  startRow: number,
  rows: { name: string; amount: number; lifeYears: number }[],
) {
  ["Name", "Amount (PHP)", "Life (years)"].forEach((h, i) => {
    styleHeaderCell(ws.getCell(startRow, i + 1)).value = h;
  });
  rows.forEach((row, i) => {
    const r = startRow + 1 + i;
    ws.getCell(r, 1).value = row.name;
    ws.getCell(r, 2).value = row.amount;
    ws.getCell(r, 3).value = row.lifeYears;
  });
}

function addStatementSheet(wb: ExcelJS.Workbook, name: string, table: string[][]) {
  const ws = wb.addWorksheet(name);
  title(ws, name.toUpperCase());
  table.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const excelCell = ws.getCell(ri + 3, ci + 1);
      if (ri === 0) {
        styleHeaderCell(excelCell).value = cell;
      } else if (ci === 0) {
        excelCell.value = cell;
      } else {
        const n = Number(String(cell).replace(/[^\d.-]/g, ""));
        excelCell.value = Number.isFinite(n) && cell !== "—" ? n : cell;
        if (typeof excelCell.value === "number") {
          excelCell.numFmt = "#,##0.00";
        }
      }
    });
  });
  ws.getColumn(1).width = 42;
  for (let c = 2; c <= 6; c += 1) ws.getColumn(c).width = 16;
}

function moneyCols(ws: ExcelJS.Worksheet, cols: string[]) {
  cols.forEach((col) => {
    ws.getColumn(col).numFmt = "#,##0.00";
  });
}
