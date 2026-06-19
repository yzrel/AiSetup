/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import { Applicant } from "../store/applicantStore";
import { MODULE_LABELS } from "../store/applicantStore";

const DOST_BLUE = "#0C2461";

const GENERAL_AGREEMENTS = [
  "The applicant shall make available to DOST all information (manuals, procedures, etc.) required to establish the technological status of the selected core business functions and management systems.",
  "If DOST is not satisfied that all requirements for business registration are complied with, it shall inform the applicant of the observed deficiencies before starting the assessment.",
  "When required inputs are supplied, DOST will assess the firm through core business functions to identify technological needs and verify compliance to standards.",
  "When assessment is complete, DOST will prepare a report with recommendations. The applicant shall not claim the report applies to locations or activities not covered.",
  "The applicant agrees that the report will not be used until permission has been granted by DOST.",
  "The applicant agrees that receipt of the report ends the assessment stage; any technical assistance ensuing will be viewed as a separate project.",
];

interface TnaForm01PreviewProps {
  applicant: Applicant | null;
  form: Record<string, unknown>;
  tables: {
    rawMaterials: string[][];
    production: string[][];
    equipment: string[][];
  };
  aiGenerated?: boolean;
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

function Section({
  title,
  children,
  pageBreak,
}: {
  title: string;
  children: ReactNode;
  pageBreak?: boolean;
}) {
  return (
    <div className={`mb-6 tna-print-section ${pageBreak ? "tna-page-break" : ""}`}>
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
  aiGenerated,
  onPrint,
  compact = false,
}: TnaForm01PreviewProps) {
  const f = form as Record<string, string | boolean>;
  const appId = applicant?.applicationId ?? "—";
  const generatedAt =
    (applicant?.moduleData?.tna1Document as { generatedAt?: string } | undefined)
      ?.generatedAt;
  const date = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-PH", {
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

      <div
        id="tna-form-01-preview"
        className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-gray-800 tna-form-document"
      >
        {/* Cover */}
        <div className="text-center border-b border-gray-200 pb-4 mb-6 tna-print-section">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            Republic of the Philippines
          </p>
          <p className="font-bold text-base">Department of Science and Technology</p>
          <p className="text-xs text-gray-500">
            Small Enterprise Technology Upgrading Program (SETUP)
          </p>
          <p className="font-black text-lg mt-3" style={{ color: DOST_BLUE }}>
            TNA FORM 01 — Technology Needs Assessment
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Application ID: <span className="font-mono font-semibold">{appId}</span>
            &nbsp;·&nbsp; Generated: {date}
            {aiGenerated !== undefined && (
              <span className="block mt-1">
                {aiGenerated ? "AI-assisted content" : "Template-assisted content"}
              </span>
            )}
          </p>
        </div>

        <Section title="I. Enterprise Identification" pageBreak>
          <Row label="Enterprise Name" value={f.enterpriseName as string} />
          <Row label="Contact Person" value={f.contactPerson as string} />
          <Row label="Position" value={f.position as string} />
          <Row label="Office Address" value={f.officeAddress as string} />
          <Row label="Office Tel." value={f.officeTel as string} />
          <Row label="Office Fax" value={f.officeFax as string} />
          <Row label="Office Email" value={f.officeEmail as string} />
          <Row label="Factory Address" value={f.factoryAddress as string} />
          <Row label="Factory Tel." value={f.factoryTel as string} />
          <Row label="Factory Fax" value={f.factoryFax as string} />
          <Row label="Factory Email" value={f.factoryEmail as string} />
          <Row label="Website" value={f.website as string} />
        </Section>

        <Section title="II. General Agreements" pageBreak>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 leading-relaxed">
            {GENERAL_AGREEMENTS.map((text, i) => (
              <li key={i} className={f[`agreeGA${i + 1}`] ? "text-gray-800" : "text-gray-400"}>
                {text}
                <span className="ml-2 text-xs font-semibold">
                  {f[`agreeGA${i + 1}`] ? "✓ Agreed" : "○ Not agreed"}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="III. Undertaking">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            I agree to undertake and observe the above General Agreements as stipulated by the
            Department of Science and Technology.
          </p>
          <Row label="Signature over Printed Name" value={f.undertakingName as string} />
          <Row label="Position in Enterprise" value={f.undertakingPosition as string} />
          <Row label="Date" value={f.undertakingDate as string} />
        </Section>

        <Section title="IV. Attachment A — Enterprise Profile" pageBreak>
          <Row label="Production Site / Location" value={f.productionSite as string} />
          <Row label="Business Permit No." value={f.businessPermitNo as string} />
          <Row label="Year Registered" value={f.yearRegistered as string} />
          <Row label="Type of Organization" value={f.organizationType as string} />
          <Row label="Classification by Capital" value={f.capitalClassification as string} />
          <Row label="Classification by Employment" value={f.employmentClass as string} />
          <Row
            label="Employees (Male / Female)"
            value={`${f.employeesMale} male · ${f.employeesFemale} female`}
          />
          <Row
            label="Indirect / Contract Workers"
            value={`${f.employeesIndirect} indirect · ${f.employeesContract} contract`}
          />
          <Row label="Year Established" value={f.yearEstablished as string} />
          <Row label="Initial Capitalization (PHP)" value={f.initialCapital as string} />
          <Row label="Registration No." value={f.registrationNo as string} />
          <Row label="Present Capitalization (PHP)" value={f.presentCapital as string} />
          <Row label="Sector" value={f.sector as string} />
          <Row label="Commodity" value={f.commodity as string} />
          <Row label="Main Product / Service" value={f.mainProduct as string} />
          <Row label="Enterprise Background" value={f.enterpriseBackground as string} />
          <Row label="Reasons for Assistance" value={f.reasonsForAssistance as string} />
          <Row
            label="Consulted Other Agency"
            value={
              f.consultedOther === "Yes"
                ? `${f.consultedAgency} (${f.assistanceType})`
                : (f.consultedOther as string)
            }
          />
          {f.consultedOther === "No" && (
            <Row label="Why Not Consulted" value={f.whyNotConsulted as string} />
          )}
          <Row label="5-Year Development Plan" value={f.plan5Years as string} />
          <Row label="10-Year Development Plan" value={f.plan10Years as string} />
          <Row label="Agreements / Commitments" value={f.agreements as string} />
        </Section>

        <Section title="V. Benchmark Information" pageBreak>
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
            <Row label="Waste Management" value={f.wasteManagement as string} />
            <Row label="Production Plan" value={f.productionPlan as string} />
            <Row label="Inventory System" value={f.inventorySystem as string} />
            <Row label="Maintenance Program" value={f.maintenanceProgram as string} />
            <Row label="cGMP / HACCP" value={f.cgmpHaccp as string} />
            <Row label="Purchasing System" value={f.purchasingSystem as string} />
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

        <Section title="VI. Marketing & Packaging" pageBreak>
          <Row label="Marketing Plan" value={f.marketingPlan as string} />
          <Row label="Market Outlets" value={f.marketOutlets as string} />
          <Row label="Promotional Strategies" value={f.promotionalStrategies as string} />
          <Row label="Market Competitors" value={f.marketCompetitors as string} />
          <p className="text-xs font-bold text-gray-500 uppercase mt-4 mb-2">Packaging Compliance</p>
          {packaging.map((p) => (
            <Row
              key={p.label}
              label={`${p.label}${p.on ? " ✓" : ""}`}
              value={p.remarks as string}
            />
          ))}
        </Section>

        <Section title="VII. Finance & Human Resources" pageBreak>
          <Row label="Cash Flow" value={f.cashFlow as string} />
          <Row label="Source of Capital" value={f.capitalSource as string} />
          <Row label="Accounting System" value={f.accountingSystem as string} />
          <Row label="Hiring Criteria" value={f.hiringCriteria as string} />
          <Row label="Employee Incentives" value={f.employeeIncentives as string} />
          <Row label="Training & Development" value={f.trainingDevelopment as string} />
          <Row label="Safety Measures" value={f.safetyMeasures as string} />
          <Row label="Employee Welfare" value={f.employeeWelfare as string} />
          <Row label="Other Concerns" value={f.otherConcerns as string} />
        </Section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-200 text-sm tna-print-section tna-page-break">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Prepared by</p>
            <div className="border-b border-gray-300 min-h-10 mb-2" />
            <p className="font-semibold">{f.undertakingName as string}</p>
            <p className="text-gray-500 text-xs">{f.undertakingPosition as string}</p>
            <p className="text-xs text-gray-400 mt-1">Date: {f.preparedDate as string}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Validated by (DOST)</p>
            <div className="border-b border-gray-300 min-h-10 mb-2" />
            <p className="text-gray-400 text-xs italic">For official use — PSTD / CASTD / CSTD</p>
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
      .tna-page-break { page-break-before: always; break-before: page; }
      .tna-print-section { page-break-inside: avoid; break-inside: avoid; }
      @media print {
        .tna-page-break { page-break-before: always; }
      }
    </style></head><body>${el.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
