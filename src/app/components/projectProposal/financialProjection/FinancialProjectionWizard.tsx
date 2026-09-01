/**
 * Author: Yzrel Jade B. Eborde
 *
 * Nested 5-year projection wizard inside Project Proposal → Financial.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Plus, Printer, Snowflake } from "lucide-react";
import type { Applicant } from "../../../store/applicantStore";
import type {
  FinancialNamedAmountRow,
  FinancialProjectionInputs,
  ProjectProposalForm,
} from "../../../api/types";
import { ModuleStepHeader } from "../../ModuleWorkflowLayout";
import { ACTION_ROW, FORM_GRID_2 } from "../../moduleTheme";
import { EditableTableResponsive } from "../../ui/editable-table-responsive";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import {
  computeFinancialProjection,
  emptyNamedRow,
  emptyProductLine,
  formatIrr,
  formatPercent,
  formatPhp,
  formatRatio,
  newRowId,
  parseMoney,
  snapshotStatementTables,
  snapshotToRatioTables,
} from "../../../utils/financialProjection";
import { downloadFinancialProjectionXlsx } from "../../../utils/financialProjectionExcel";
import {
  generateAndFreezeFinancialProjection,
  getFinancialProjectionStored,
  prefillFinancialProjectionInputs,
  saveFinancialProjectionDraft,
} from "../../../utils/financialProjectionStore";
import { printFinancialProjection } from "../../../utils/financialProjectionPrint";
import { resolveProjectedFsYears } from "../../../utils/projectedFsDuration";
import { aiGenerateErrorMessage } from "../../../utils/apiErrors";
import { ApiError } from "../../../api/client";

const DOST_BLUE = "#0C2461";

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

type InnerStep = "year0" | "year1" | "financing" | "opex" | "tax" | "results";
type PreviewSheet = "income" | "cashFlow" | "balance";

const PREVIEW_SHEETS: { id: PreviewSheet; label: string }[] = [
  { id: "income", label: "Income statement" },
  { id: "cashFlow", label: "Cash flow" },
  { id: "balance", label: "Balance sheet" },
];

function isEmphasisRow(label: string): boolean {
  return /total|net income after|gross profit$|^gross sales|total assets|total liabilities/i.test(
    label,
  );
}

function StatementPreviewTable({ rows }: { rows: string[][] }) {
  const header = rows[0] ?? [];
  const body = rows.slice(1);
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-xs border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-[#0C2461]">
            {header.map((h, hi) => (
              <th
                key={h}
                className={`px-2.5 py-2 font-semibold text-white whitespace-nowrap ${
                  hi === 0 ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => {
            const strong = isEmphasisRow(row[0] ?? "");
            return (
              <tr
                key={i}
                className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"} ${
                  strong ? "font-semibold text-gray-900" : "text-gray-700"
                }`}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-2.5 py-1.5 border-t border-gray-100 ${
                      j === 0 ? "text-left whitespace-nowrap" : "text-right tabular-nums whitespace-nowrap"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const INNER_STEPS: { id: InnerStep; label: string }[] = [
  { id: "year0", label: "Year 0" },
  { id: "year1", label: "Year 1 sales" },
  { id: "financing", label: "Financing" },
  { id: "opex", label: "Operating" },
  { id: "tax", label: "Tax" },
  { id: "results", label: "Results" },
];

const NAMED_ROW_COLUMNS = ["Name", "Amount (PHP)", "Life (years)"];

function namedRowsToCells(rows: FinancialNamedAmountRow[]): string[][] {
  return (Array.isArray(rows) ? rows : []).map((row) => [
    row.name,
    Number.isFinite(row.amount) ? String(row.amount) : "0",
    Number.isFinite(row.lifeYears) ? String(row.lifeYears) : "5",
  ]);
}

function cellsToNamedRows(
  cells: string[][],
  existing: FinancialNamedAmountRow[],
): FinancialNamedAmountRow[] {
  return cells.map((cell, i) => {
    const prev = existing[i];
    return {
      id: prev?.id ?? newRowId(),
      name: cell[0] ?? "",
      amount: parseMoney(cell[1]),
      lifeYears: parseMoney(cell[2]) || 5,
    };
  });
}

function numField(
  label: string,
  value: number,
  onChange: (n: number) => void,
  extra?: string,
) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type="number"
        step="any"
        className={`${inputCls} ${extra ?? ""}`}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

export function FinancialProjectionWizard({
  applicant,
  onProposalPatch,
}: {
  applicant: Applicant;
  onProposalPatch: (patch: Partial<ProjectProposalForm>) => void;
}) {
  const [inner, setInner] = useState<InnerStep>("year0");
  const [maxReached, setMaxReached] = useState(0);
  const [previewSheet, setPreviewSheet] = useState<PreviewSheet>("income");
  const [inputs, setInputs] = useState<FinancialProjectionInputs>(() =>
    prefillFinancialProjectionInputs(applicant),
  );
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;
  const [freezing, setFreezing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const stored = getFinancialProjectionStored(applicant);
  const projectedYears = useMemo(
    () => resolveProjectedFsYears(applicant),
    [applicant.id, applicant.moduleData?.timeline, applicant.msmeSize],
  );

  const persistDraft = useDebouncedCallback(() => {
    saveFinancialProjectionDraft(applicant.id, inputsRef.current);
  }, 400);

  const patch = (partial: Partial<FinancialProjectionInputs>) => {
    setInputs((prev) => {
      const next = { ...prev, ...partial };
      inputsRef.current = next;
      persistDraft();
      return next;
    });
  };

  useEffect(() => {
    setInputs(prefillFinancialProjectionInputs(applicant));
    // Prefill only on case change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicant.id]);

  const live = useMemo(() => computeFinancialProjection(inputs), [inputs]);
  const tables = snapshotStatementTables(live);
  const innerIdx = INNER_STEPS.findIndex((s) => s.id === inner);

  const go = (id: InnerStep) => {
    const idx = INNER_STEPS.findIndex((s) => s.id === id);
    setInner(id);
    setMaxReached((m) => Math.max(m, idx));
  };

  const handleFreeze = async () => {
    setFreezing(true);
    setNotice(null);
    try {
      const frozen = await generateAndFreezeFinancialProjection(applicant.id, inputs);
      if (frozen.snapshot) {
        onProposalPatch(snapshotToRatioTables(frozen.snapshot));
      }
      setNotice(
        frozen.snapshot?.balanced !== false
          ? "Projected statements frozen and saved. Requirements “projected FS” is marked complete."
          : "Frozen, but assets do not equal liabilities + equity — review cash and equity.",
      );
    } catch (err) {
      setNotice(
        err instanceof ApiError
          ? aiGenerateErrorMessage(err, "Could not freeze projection.")
          : "Could not freeze projection.",
      );
    } finally {
      setFreezing(false);
    }
  };

  const namedRows = (
    title: string,
    key: "equipment" | "preoperating",
  ) => (
    <div>
      <p className="text-sm font-semibold text-gray-800 mb-2">{title}</p>
      <EditableTableResponsive
        columns={NAMED_ROW_COLUMNS}
        rows={namedRowsToCells(inputs[key])}
        onChange={(cells) =>
          patch({ [key]: cellsToNamedRows(cells, inputsRef.current[key]) })
        }
        onAddRow={() =>
          patch({ [key]: [...inputsRef.current[key], emptyNamedRow()] })
        }
        addLabel="Add line"
        deletable
        headerVariant="gray"
      />
    </div>
  );

  return (
    <div className="space-y-4 rounded-xl border border-[#0C2461]/15 bg-blue-50/30 p-4">
      <div>
        <h2 className="text-base font-bold text-gray-800">
          Projected financial statements ({projectedYears} {projectedYears === 1 ? "year" : "years"})
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          Build Year 0 assets through Year {projectedYears} statements (per project duration). Freeze saves to the server
          and marks Requirements projected financial statements.
        </p>
        {stored?.frozenAt && (
          <p className="text-xs text-green-700 mt-1">
            Last frozen {new Date(stored.frozenAt).toLocaleString("en-PH")}
            {stored.snapshot?.balanced === false ? " — balance check failed" : ""}.
          </p>
        )}
      </div>

      <ModuleStepHeader
        steps={INNER_STEPS}
        current={inner}
        maxReached={maxReached}
        onStepClick={(id) => go(id as InnerStep)}
        variant="onLight"
      />

      {inner === "year0" && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Main product / service</label>
            <input
              className={inputCls}
              value={inputs.productName}
              onChange={(e) => patch({ productName: e.target.value })}
            />
          </div>
          {namedRows("Machinery / equipment", "equipment")}
          {namedRows("Product / service development (pre-operating)", "preoperating")}
        </div>
      )}

      {inner === "year1" && (
        <div className="space-y-4">
          {(Array.isArray(inputs.products) ? inputs.products : []).map((p) => (
            <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
              <label className={labelCls}>Product line</label>
              <input
                className={inputCls}
                value={p.name}
                onChange={(e) =>
                  patch({
                    products: inputs.products.map((r) =>
                      r.id === p.id ? { ...r, name: e.target.value } : r,
                    ),
                  })
                }
              />
              <div className={FORM_GRID_2}>
                {numField("SRP Q1", p.srpQ1, (srpQ1) =>
                  patch({ products: inputs.products.map((r) => (r.id === p.id ? { ...r, srpQ1 } : r)) }),
                )}
                {numField("SRP Q2", p.srpQ2, (srpQ2) =>
                  patch({ products: inputs.products.map((r) => (r.id === p.id ? { ...r, srpQ2 } : r)) }),
                )}
                {numField("SRP Q3", p.srpQ3, (srpQ3) =>
                  patch({ products: inputs.products.map((r) => (r.id === p.id ? { ...r, srpQ3 } : r)) }),
                )}
                {numField("SRP Q4", p.srpQ4, (srpQ4) =>
                  patch({ products: inputs.products.map((r) => (r.id === p.id ? { ...r, srpQ4 } : r)) }),
                )}
                {numField("Cost / unit Q1 (later quarters × 1.01)", p.costQ1, (costQ1) =>
                  patch({ products: inputs.products.map((r) => (r.id === p.id ? { ...r, costQ1 } : r)) }),
                )}
                {numField("Qty Q1", p.qtyQ1, (qtyQ1) =>
                  patch({ products: inputs.products.map((r) => (r.id === p.id ? { ...r, qtyQ1 } : r)) }),
                )}
                {numField("Qty Q2", p.qtyQ2, (qtyQ2) =>
                  patch({ products: inputs.products.map((r) => (r.id === p.id ? { ...r, qtyQ2 } : r)) }),
                )}
                {numField("Qty Q3", p.qtyQ3, (qtyQ3) =>
                  patch({ products: inputs.products.map((r) => (r.id === p.id ? { ...r, qtyQ3 } : r)) }),
                )}
                {numField("Qty Q4", p.qtyQ4, (qtyQ4) =>
                  patch({ products: inputs.products.map((r) => (r.id === p.id ? { ...r, qtyQ4 } : r)) }),
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-xs font-semibold text-[#0C2461] flex items-center gap-1"
            onClick={() => patch({ products: [...inputs.products, emptyProductLine()] })}
          >
            <Plus className="w-3 h-3" /> Add product line
          </button>
        </div>
      )}

      {inner === "financing" && (
        <div className={FORM_GRID_2}>
          {numField("Owner equity / investment", inputs.equity, (equity) => patch({ equity }))}
          {numField("Inventory (Year 1)", inputs.inventoryYear1, (inventoryYear1) =>
            patch({ inventoryYear1 }),
          )}
          {numField("Other loan amount", inputs.loanAmount, (loanAmount) => patch({ loanAmount }))}
          {numField("Loan term (years)", inputs.loanTermYears, (loanTermYears) =>
            patch({ loanTermYears }),
          )}
          {numField("Loan interest rate (e.g. 0.10 = 10%)", inputs.loanInterestRate, (loanInterestRate) =>
            patch({ loanInterestRate }),
          )}
          <p className="sm:col-span-2 text-xs text-gray-500">
            SETUP iFund refund is taken from the proposal refund schedule (separate from bank loans).
          </p>
        </div>
      )}

      {inner === "opex" && (
        <div className="space-y-4">
          <div className={FORM_GRID_2}>
            {numField("Sales growth (Years 2–5)", inputs.salesGrowth, (salesGrowth) =>
              patch({ salesGrowth }),
            )}
            {numField("Cost of sales increase", inputs.cosIncrease, (cosIncrease) =>
              patch({ cosIncrease }),
            )}
            {numField("Salary increase", inputs.salaryIncrease, (salaryIncrease) =>
              patch({ salaryIncrease }),
            )}
            {numField("Inflation", inputs.inflation, (inflation) => patch({ inflation }))}
          </div>
          <div className={FORM_GRID_2}>
            {numField("Marketing (Year 1)", inputs.marketing, (marketing) => patch({ marketing }))}
            {numField("Salaries and wages (Year 1)", inputs.salaries, (salaries) => patch({ salaries }))}
            {numField("Logistics", inputs.logistics, (logistics) => patch({ logistics }))}
            {numField("IT / website / software", inputs.itSoftware, (itSoftware) => patch({ itSoftware }))}
            {numField("Transportation", inputs.transportation, (transportation) =>
              patch({ transportation }),
            )}
            {numField("Rental (fixed)", inputs.rental, (rental) => patch({ rental }))}
            {numField("Utilities", inputs.utilities, (utilities) => patch({ utilities }))}
            {numField("Communication", inputs.communication, (communication) =>
              patch({ communication }),
            )}
            {numField("Taxes & licenses (fixed)", inputs.taxesLicenses, (taxesLicenses) =>
              patch({ taxesLicenses }),
            )}
            {numField("Other expenses", inputs.otherExpenses, (otherExpenses) =>
              patch({ otherExpenses }),
            )}
          </div>
        </div>
      )}

      {inner === "tax" && (
        <div className="space-y-3">
          <label className={labelCls}>Income tax method</label>
          <select
            className={inputCls}
            value={inputs.taxMethod}
            onChange={(e) =>
              patch({ taxMethod: e.target.value as FinancialProjectionInputs["taxMethod"] })
            }
          >
            <option value="sole8">Sole prop — 8% of gross in excess of ₱250,000 (sales not over ₱3M)</option>
            <option value="soleGraduated">Sole prop — TRAIN graduated rates</option>
            <option value="cit">Corporation — CREATE income tax</option>
          </select>
        </div>
      )}

      {inner === "results" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-[10px] uppercase text-gray-400 font-bold">NPV</p>
              <p className="font-semibold">{formatPhp(live.npv)}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-[10px] uppercase text-gray-400 font-bold">IRR</p>
              <p className="font-semibold">{formatIrr(live.irr)}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-[10px] uppercase text-gray-400 font-bold">Y1 NI</p>
              <p className="font-semibold">{formatPhp(live.incomeStatement.niAfterTax[0])}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-[10px] uppercase text-gray-400 font-bold">Balance</p>
              <p className="font-semibold">{live.balanced ? "In balance" : "Check identity"}</p>
            </div>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border border-gray-200 bg-white">
              <thead className="bg-gray-50">
                <tr>
                  {["Year", "Liquidity", "Quick", "ROI"].map((h) => (
                    <th key={h} className="px-2 py-1 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {live.ratios.map((r) => (
                  <tr key={r.year} className="border-t">
                    <td className="px-2 py-1">{r.year}</td>
                    <td className="px-2 py-1">{formatRatio(r.liquidity)}</td>
                    <td className="px-2 py-1">{formatRatio(r.quick)}</td>
                    <td className="px-2 py-1">{formatPercent(r.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {PREVIEW_SHEETS.map((sheet) => (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => setPreviewSheet(sheet.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    previewSheet === sheet.id
                      ? "bg-[#0C2461] text-white border-[#0C2461]"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {sheet.label}
                </button>
              ))}
            </div>
            <StatementPreviewTable rows={tables[previewSheet]} />
          </div>
        </div>
      )}

      <div className={ACTION_ROW}>
        {innerIdx > 0 && (
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold"
            onClick={() => go(INNER_STEPS[innerIdx - 1].id)}
          >
            Back
          </button>
        )}
        {innerIdx < INNER_STEPS.length - 1 && (
          <button
            type="button"
            className="flex-1 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: DOST_BLUE }}
            onClick={() => go(INNER_STEPS[innerIdx + 1].id)}
          >
            Continue
          </button>
        )}
        {inner === "results" && (
          <>
            <button
              type="button"
              disabled={freezing}
              onClick={() => void handleFreeze()}
              className="flex-1 py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-50"
              style={{ background: DOST_BLUE }}
            >
              <Snowflake className="w-4 h-4" />
              {freezing ? "Saving…" : "Freeze projected statements"}
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-[#0C2461]/30 text-[#0C2461] text-sm font-bold flex items-center gap-1"
              onClick={() =>
                void printFinancialProjection(
                  stored?.snapshot ?? live,
                  applicant.applicationId,
                  stored?.frozenAt,
                )
              }
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-[#0C2461]/30 text-[#0C2461] text-sm font-bold flex items-center gap-1"
              onClick={() =>
                void downloadFinancialProjectionXlsx({
                  inputs,
                  snapshot: stored?.snapshot ?? live,
                  applicationId: applicant.applicationId,
                  enterpriseName: applicant.enterpriseName,
                  frozenAt: stored?.frozenAt,
                })
              }
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
          </>
        )}
      </div>
      {notice && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}
    </div>
  );
}
