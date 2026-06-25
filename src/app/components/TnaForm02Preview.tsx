/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import type { Tna2DocumentResponse } from "../api/types";
import {
  PreviewFieldRow,
  PreviewSection,
  PreviewTable,
  PreviewToolbar,
} from "./PreviewLayout";

const DOST_BLUE = "#0C2461";

interface TnaForm02PreviewProps {
  document: Tna2DocumentResponse;
  applicationId?: string;
  aiGenerated?: boolean;
  published?: boolean;
  onPrint?: () => void;
  compact?: boolean;
}

export function TnaForm02Preview({
  document: doc,
  applicationId,
  aiGenerated,
  published,
  onPrint,
  compact = false,
}: TnaForm02PreviewProps) {
  const profile = doc.enterpriseProfile ?? {};
  const appId = applicationId ?? doc.applicationId ?? "—";

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && onPrint && (
        <PreviewToolbar className="justify-end">
          <button
            type="button"
            onClick={onPrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#0C2461] text-white hover:opacity-90"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </PreviewToolbar>
      )}

      <div
        id="tna-form-02-preview"
        className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-8 text-gray-800 tna-form-document"
      >
        <div className="text-center border-b border-gray-200 pb-4 mb-6 tna-print-section">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            Republic of the Philippines
          </p>
          <p className="font-bold text-base">Department of Science and Technology</p>
          <p className="text-xs text-gray-500">
            Small Enterprise Technology Upgrading Program (SETUP)
          </p>
          <p className="font-black text-lg mt-3" style={{ color: DOST_BLUE }}>
            TNA FORM 02 — Technology Needs Assessment Report
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Document Ref: <span className="font-mono font-semibold">{doc.documentRef}</span>
            &nbsp;·&nbsp; Application ID: <span className="font-mono font-semibold">{appId}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Assessment Date: {doc.assessmentDate}
            {aiGenerated !== undefined && (
              <span className="block mt-1">
                {aiGenerated ? "AI-assisted report" : "Template-assisted report"}
                {published ? " · Published to applicant" : " · Draft"}
              </span>
            )}
          </p>
        </div>

        <PreviewSection title="I. Enterprise Profile" pageBreak>
          <PreviewFieldRow label="Enterprise Name" value={profile.enterpriseName} />
          <PreviewFieldRow label="Business Address" value={profile.address} />
          <PreviewFieldRow label="Business Type" value={profile.businessType} />
          <PreviewFieldRow label="Sector" value={profile.sector} />
          <PreviewFieldRow label="Commodity" value={profile.commodity} />
          <PreviewFieldRow label="Main Product / Service" value={profile.mainProduct} />
          <PreviewFieldRow label="Employees" value={profile.employees} />
          <PreviewFieldRow label="Contact Person" value={profile.contactPerson} />
          <PreviewFieldRow label="Contact Number" value={profile.contactNumber} />
          <PreviewFieldRow label="Email" value={profile.emailAddress} />
        </PreviewSection>

        <PreviewSection title="II. Site Validation Findings" pageBreak>
          {doc.siteValidationFindings?.length ? (
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {doc.siteValidationFindings.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </PreviewSection>

        <PreviewSection title="III. Production Process Analysis">
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            {doc.productionProcessAnalysis?.summary || "—"}
          </p>
          {doc.productionProcessAnalysis?.findings?.length ? (
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
              {doc.productionProcessAnalysis.findings.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ) : null}
        </PreviewSection>

        <PreviewSection title="IV. Technology Gap Analysis" pageBreak>
          {doc.technologyGaps?.length ? (
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {doc.technologyGaps.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </PreviewSection>

        <PreviewSection title="V. Proposed Technology Intervention">
          {doc.proposedInterventions?.length ? (
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {doc.proposedInterventions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </PreviewSection>

        <PreviewSection title="VI. Recommended Equipment List" pageBreak>
          {doc.recommendedEquipment?.length ? (
            <PreviewTable
              columns={[
                { key: "n", header: "#", mobileLabel: "#" },
                { key: "name", header: "Equipment", mobileLabel: "Equipment" },
                { key: "specs", header: "Specifications", mobileLabel: "Specs" },
                { key: "qty", header: "Qty", mobileLabel: "Qty" },
                { key: "cost", header: "Est. Cost (₱)", mobileLabel: "Cost" },
                { key: "priority", header: "Priority", mobileLabel: "Priority" },
              ]}
              rows={doc.recommendedEquipment.map((row, i) => [
                String(i + 1),
                row.name,
                row.specifications || "—",
                row.quantity || "—",
                row.estimatedCost || "—",
                row.priority || "—",
              ])}
            />
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </PreviewSection>

        <PreviewSection title="VII. Expected Productivity Improvement" pageBreak>
          {doc.productivityImprovement?.kpis?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {doc.productivityImprovement.kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center text-xs"
                >
                  <p className="font-semibold text-blue-700 mb-1">{kpi.label}</p>
                  <p className="text-gray-500">Before: {kpi.before || "—"}</p>
                  <p className="text-gray-500">After: {kpi.after || "—"}</p>
                  <p className="font-bold text-blue-800 mt-1">{kpi.change || "—"}</p>
                </div>
              ))}
            </div>
          ) : null}
          {doc.productivityImprovement?.outcomes?.length ? (
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
              {doc.productivityImprovement.outcomes.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ) : null}
        </PreviewSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-200 text-sm tna-print-section">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Prepared by (Assessor)</p>
            <div className="border-b border-gray-300 min-h-10 mb-2" />
            <p className="font-semibold">{doc.assessor?.name}</p>
            <p className="text-gray-500 text-xs">{doc.assessor?.title}</p>
            <p className="text-xs text-gray-400 mt-1">{doc.assessor?.office}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Validated by (DOST)</p>
            <div className="border-b border-gray-300 min-h-10 mb-2" />
            <p className="text-gray-400 text-xs italic">For official use — Regional Office XII</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function printTnaForm02() {
  const el = document.getElementById("tna-form-02-preview");
  if (!el) {
    window.print();
    return;
  }
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>TNA Form 02</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #1f2937; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 11px; }
      th { background: #0C2461; color: white; }
      .tna-page-break { page-break-before: always; break-before: page; }
      .tna-print-section { page-break-inside: avoid; break-inside: avoid; }
    </style></head><body>${el.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
