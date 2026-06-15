import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import { Applicant } from "../store/applicantStore";
import { MODULE_LABELS } from "../store/applicantStore";

const DOST_BLUE = "#0C2461";

interface TnaForm01PreviewProps {
  applicant: Applicant | null;
  form: Record<string, unknown>;
  tables: {
    rawMaterials: string[][];
    production: string[][];
    equipment: string[][];
  };
  onPrint?: () => void;
  compact?: boolean;
}

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display =
    value === true ? "Yes" : value === false ? "No" : value ? String(value) : "—";
  return (
    <div className="grid grid-cols-[200px_1fr] gap-2 py-1.5 border-b border-gray-100 text-sm">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-800">{display}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3
        className="text-sm font-bold text-white px-3 py-2 rounded-t-lg"
        style={{ background: DOST_BLUE }}
      >
        {title}
      </h3>
      <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 bg-white">
        {children}
      </div>
    </div>
  );
}

function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  if (!rows.length || !rows[0]?.some((c) => c)) return <p className="text-sm text-gray-400">—</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: DOST_BLUE }}>
            {columns.map((col) => (
              <th key={col} className="text-left text-white px-2 py-1.5 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, j) => (
                <td key={j} className="border border-gray-100 px-2 py-1.5">
                  {cell || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TnaForm01Preview({
  applicant,
  form,
  tables,
  onPrint,
  compact = false,
}: TnaForm01PreviewProps) {
  const f = form as Record<string, string | boolean>;
  const appId = applicant?.applicationId ?? "—";
  const date = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const packaging = [
    { label: "Nutrition Evaluation", on: f.packNutrition, remarks: f.packNutritionRemarks },
    { label: "Bar Code", on: f.packBarcode, remarks: f.packBarcodeRemarks },
    { label: "Product Label", on: f.packLabel, remarks: f.packLabelRemarks },
    { label: "Expiry Date", on: f.packExpiry, remarks: f.packExpiryRemarks },
  ];

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && onPrint && (
        <div className="flex justify-end print:hidden">
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[#0C2461] text-white hover:opacity-90"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      )}

      <div id="tna-form-01-preview" className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-gray-800">
        <div className="text-center border-b border-gray-200 pb-4 mb-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            Republic of the Philippines
          </p>
          <p className="font-bold text-base">Department of Science and Technology</p>
          <p className="text-xs text-gray-500">Small Enterprise Technology Upgrading Program (SETUP)</p>
          <p className="font-black text-lg mt-3" style={{ color: DOST_BLUE }}>
            TNA FORM 01 — Technology Needs Assessment
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Application ID: <span className="font-mono font-semibold">{appId}</span>
            &nbsp;·&nbsp; Generated: {date}
          </p>
        </div>

        <Section title="I. Enterprise Identification">
          <Row label="Enterprise Name" value={f.enterpriseName as string} />
          <Row label="Contact Person" value={f.contactPerson as string} />
          <Row label="Position" value={f.position as string} />
          <Row label="Office Address" value={f.officeAddress as string} />
          <Row label="Office Tel / Email" value={`${f.officeTel} · ${f.officeEmail}`} />
          <Row label="Factory Address" value={f.factoryAddress as string} />
          <Row label="Website" value={f.website as string} />
        </Section>

        <Section title="II. Attachment A — Enterprise Profile">
          <Row label="Type of Organization" value={f.organizationType as string} />
          <Row label="Classification by Capital" value={f.capitalClassification as string} />
          <Row label="Classification by Employment" value={f.employmentClass as string} />
          <Row
            label="Employees (M / F)"
            value={`${f.employeesMale} male · ${f.employeesFemale} female`}
          />
          <Row
            label="Indirect / Contract Workers"
            value={`${f.employeesIndirect} indirect · ${f.employeesContract} contract`}
          />
          <Row label="Sector" value={f.sector as string} />
          <Row label="Commodity" value={f.commodity as string} />
          <Row label="Main Product / Service" value={f.mainProduct as string} />
          <Row label="Present Capitalization (PHP)" value={f.presentCapital as string} />
          <Row label="Reasons for Assistance" value={f.reasonsForAssistance as string} />
          <Row label="Enterprise Background" value={f.enterpriseBackground as string} />
        </Section>

        <Section title="III. Benchmark Information">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Raw Materials</p>
          <DataTable
            columns={["Material", "Source", "Unit Cost", "Volume/Year"]}
            rows={tables.rawMaterials}
          />
          <p className="text-xs font-bold text-gray-500 uppercase mt-4 mb-2">Production</p>
          <DataTable
            columns={["Product", "Volume/Year", "Unit Cost", "Annual Cost"]}
            rows={tables.production}
          />
          <p className="text-xs font-bold text-gray-500 uppercase mt-4 mb-2">Equipment</p>
          <DataTable
            columns={["Equipment", "Specs", "Capacity", "Units", "Year"]}
            rows={tables.equipment}
          />
          <div className="mt-4 space-y-1">
            <Row label="Production Problems & Concerns" value={f.productionProblemsConcerns as string} />
            <Row label="Plant Lay-Out" value={f.plantLayoutFileName as string} />
            <Row
              label="Process Flow"
              value={
                f.processFlowMode === "attachment"
                  ? (f.processFlowFileName as string)
                  : (f.processFlow as string)
              }
            />
          </div>
        </Section>

        <Section title="IV. Marketing & Packaging">
          <Row label="Marketing Plan" value={f.marketingPlan as string} />
          <Row label="Market Outlets" value={f.marketOutlets as string} />
          {packaging.map((p) => (
            <Row
              key={p.label}
              label={`${p.label}${p.on ? " ✓" : ""}`}
              value={p.remarks as string}
            />
          ))}
        </Section>

        <Section title="V. Finance & Human Resources">
          <Row label="Cash Flow" value={f.cashFlow as string} />
          <Row label="Source of Capital" value={f.capitalSource as string} />
          <Row label="Accounting System" value={f.accountingSystem as string} />
          <Row label="Hiring Criteria" value={f.hiringCriteria as string} />
          <Row label="Employee Training" value={f.trainingDevelopment as string} />
        </Section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-200 text-sm">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Prepared by</p>
            <p className="font-semibold">{f.undertakingName as string}</p>
            <p className="text-gray-500 text-xs">{f.undertakingPosition as string}</p>
            <p className="text-xs text-gray-400 mt-1">Date: {f.preparedDate as string}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Validated by (DOST)</p>
            <p className="text-gray-400 text-xs italic">For official use</p>
            <p className="text-xs text-gray-400 mt-1">Date: {f.validatedDate as string}</p>
          </div>
        </div>

        {applicant && (
          <p className="text-[10px] text-gray-400 text-center mt-6 pt-4 border-t border-gray-100">
            Module: {MODULE_LABELS[applicant.currentModule]} · DOST aiSETUP Portal
          </p>
        )}
      </div>
    </div>
  );
}

export function printTnaForm01() {
  const el = document.getElementById("tna-form-01-preview");
  if (!el) {
    window.print();
    return;
  }
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>TNA Form 01</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #1f2937; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 11px; }
      th { background: #0C2461; color: white; }
    </style></head><body>${el.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
