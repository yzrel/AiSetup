/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import type {
  ProjectProposalAttachment,
  RtecComplianceItem,
  RtecReportForm,
} from "../api/types";
import { PROPOSAL_ATTACHMENT_LABELS } from "../utils/projectProposal";
import { DOST_REGION_12_DIRECTOR_NAME } from "../constants/region12";
import { RTEC_DOST_BLUE } from "../utils/rtecReport";

interface RtecReportPreviewProps {
  form: RtecReportForm;
  applicationId?: string;
  onPrint?: () => void;
  compact?: boolean;
}

function Footer({ page }: { page: string }) {
  return (
    <div className="rtec-footer mt-8 pt-3 border-t border-gray-200 text-center text-[9px] text-gray-500">
      SETUP Guidelines (Revision 3.0) Annex A-2: SETUP Form 002 - RTEC Report — Page {page}
    </div>
  );
}

function CoverRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rtec-cover-row grid grid-cols-[140px_1fr] gap-2 py-1 text-sm">
      <span className="font-semibold text-gray-600">{label}</span>
      <span className="text-gray-800 whitespace-pre-wrap">{value?.trim() || "—"}</span>
    </div>
  );
}

function Narrative({ text }: { text?: string }) {
  return (
    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
      {text?.trim() ? text : "—"}
    </p>
  );
}

function Bullets({ items }: { items?: string[] }) {
  const list = items?.filter((s) => s.trim()) ?? [];
  if (!list.length) return <p className="text-sm text-gray-400">—</p>;
  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
      {list.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Table({
  headers,
  rows,
  colClasses,
}: {
  headers: string[];
  rows: string[][];
  colClasses?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-xs border-collapse ${colClasses ?? ""}`}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-white"
                style={{ background: RTEC_DOST_BLUE }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td key={ci} className="border border-gray-200 px-2 py-1.5 align-top">
                    {row[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="border border-gray-200 px-2 py-2 text-gray-400">
                —
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AttachmentImg({
  attachment,
  label,
}: {
  attachment?: ProjectProposalAttachment;
  label: string;
}) {
  if (!attachment?.dataUrl) {
    return (
      <p className="text-xs text-gray-400 italic border border-dashed border-gray-200 rounded p-4 text-center">
        {label} — not attached
      </p>
    );
  }
  return (
    <div className="text-center">
      <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
      {attachment.mimeType.startsWith("image/") ? (
        <img src={attachment.dataUrl} alt={label} className="max-h-56 mx-auto border rounded" />
      ) : (
        <p className="text-xs text-gray-600">📎 {attachment.fileName}</p>
      )}
    </div>
  );
}

function ComplianceTable({ items }: { items: RtecComplianceItem[] }) {
  const mark = (status: RtecComplianceItem["status"]) => {
    if (status === "complied") return "✓";
    if (status === "not_complied") return "✗";
    if (status === "na") return "N/A";
    return "";
  };
  return (
    <Table
      headers={["Requirements", "Complied", "Not Complied", "N/A"]}
      rows={items.map((item) => [
        item.label,
        mark(item.status) === "✓" ? "✓" : "",
        mark(item.status) === "✗" ? "✗" : "",
        mark(item.status) === "N/A" ? "N/A" : "",
      ])}
    />
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
    <div className={`mb-6 rtec-avoid-break ${pageBreak ? "rtec-page-break" : ""}`}>
      <h2 className="text-sm font-bold mb-3" style={{ color: RTEC_DOST_BLUE }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export function RtecReportPreview({
  form,
  applicationId,
  onPrint,
  compact,
}: RtecReportPreviewProps) {
  const pp = form.proposalSnapshot;
  const findAtt = (kind: ProjectProposalAttachment["kind"]) =>
    form.attachmentRefs.find((a) => a.kind === kind);

  const equipmentRows = pp.equipmentTable
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => [r[0] ?? "", r[3] ?? r[2] ?? "1", r[4] ?? ""]);

  const budgetRows = pp.budgetItems
    .filter((b) => b.item.trim())
    .map((b) => {
      const total = parseFloat(String(b.total).replace(/[^\d.]/g, "")) || 0;
      const setup = parseFloat(String(b.setupShare).replace(/[^\d.]/g, "")) || 0;
      const coop = total > setup ? String(total - setup) : "";
      return [b.item, b.qty, b.unitCost, b.setupShare, coop, b.total];
    });

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
            Download PDF
          </button>
        </div>
      )}

      <div
        id="rtec-report-preview"
        className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-gray-800"
      >
        {/* Page 1 — Cover + I.a */}
        <div className="text-center border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-lg font-black" style={{ color: RTEC_DOST_BLUE }}>
            SETUP Form 002 · RTEC Report
          </h1>
          {applicationId && (
            <p className="text-xs text-gray-500 mt-1 font-mono">{applicationId}</p>
          )}
        </div>

        <CoverRow label="Project Title:" value={pp.projectTitle} />
        <CoverRow label="Proponent:" value={pp.proponentName || pp.firmName} />
        <CoverRow label="Contact Person:" value={pp.contactPerson} />
        <div className="grid grid-cols-3 gap-4 mt-3 mb-6 text-sm">
          <div>
            <span className="font-semibold text-gray-600">Project Cost: Proponent</span>
            <p>{form.projectCostProponent || "—"}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-600">DOST-SETUP</span>
            <p>{form.projectCostSetup || "—"}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Total</span>
            <p>{form.projectCostTotal || "—"}</p>
          </div>
        </div>

        <Section title="I. Brief description of the project">
          <h3 className="text-xs font-bold uppercase text-gray-600 mb-2">a. Company profile</h3>
          <CoverRow label="Name of Firm" value={pp.firmName} />
          <CoverRow label="Address" value={pp.firmAddress} />
          <CoverRow label="Contact Person" value={pp.contactPerson} />
          <CoverRow label="Contact No." value={pp.contactNumber} />
          <CoverRow label="Email Address" value={pp.email} />
          <CoverRow label="Year established" value={pp.yearEstablished} />
          <CoverRow label="Type of Organization" value={pp.organizationType} />
          <CoverRow label="Profit / Non-Profit" value={pp.profitType} />
          <CoverRow label="MSME Size" value={pp.msmeSize} />
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-500 mb-1">Number of Employees</p>
            <Table
              headers={["Type of Employment", "Male", "Female", "Total"]}
              rows={[
                [
                  "Direct Workers (Production)",
                  pp.employeesMale,
                  pp.employeesFemale,
                  String(
                    (parseInt(pp.employeesMale, 10) || 0) +
                      (parseInt(pp.employeesFemale, 10) || 0),
                  ),
                ],
                ["Non-production", "", "", ""],
                [
                  "Indirect / Contract Workers",
                  "",
                  "",
                  pp.employeesIndirect,
                ],
              ]}
            />
          </div>
          <CoverRow label="Registration Office" value={pp.registrationOffice} />
          <CoverRow label="Registration Number" value={pp.registrationNumber} />
          <CoverRow label="Date of Registration" value={pp.registrationDate} />
          <CoverRow label="Business Activity" value={pp.businessActivity} />
          <CoverRow label="Products/Services" value={pp.productsServices} />
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-500 mb-1">Brief Enterprise Background</p>
            <Narrative text={pp.enterpriseBackground} />
          </div>
        </Section>
        <Footer page="1" />

        {/* Page 2 — I.b, I.c, start II */}
        <div className="rtec-page-break">
          <Section title="b. Objectives">
            <p className="text-xs font-bold text-gray-500 mb-1">General Objective</p>
            <Narrative text={pp.generalObjective} />
            <p className="text-xs font-bold text-gray-500 mt-3 mb-1">Specific Objectives</p>
            <Bullets items={pp.specificObjectives} />
          </Section>
          <Section title="c. Expected Outputs / Impact/s of S&T intervention">
            <Bullets items={pp.expectedOutputBullets} />
          </Section>
          <Section title="II. Compliance of Requirements">
            <ComplianceTable items={form.complianceItems} />
          </Section>
          <Footer page="2" />
        </div>

        {/* Page 3 — III.a */}
        <div className="rtec-page-break">
          <Section title="III. Highlights of Evaluation">
            <h3 className="text-xs font-bold uppercase text-gray-600 mb-2">
              a. Management/Administrative Aspect
            </h3>
            <AttachmentImg
              attachment={findAtt("orgChart")}
              label={PROPOSAL_ATTACHMENT_LABELS.orgChart}
            />
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-500 mb-1">
                Skills and expertise of employee/owner (proponent)
              </p>
              <Narrative text={pp.skillsExpertise} />
            </div>
            <div className="mt-3">
              <p className="text-xs font-bold text-gray-500 mb-1">Compensation</p>
              <Narrative text={pp.compensation} />
            </div>
          </Section>
          <Footer page="3" />
        </div>

        {/* Page 4 — III.b.1-2 */}
        <div className="rtec-page-break">
          <h3 className="text-xs font-bold uppercase text-gray-600 mb-2">
            b. Technical Aspect (including the recommended DOST S&T Intervention)
          </h3>
          <p className="text-xs font-bold text-gray-500 mb-1">1. Production Process</p>
          <p className="text-xs text-gray-500 mb-1">a. Process Flow of Production</p>
          <Narrative text={pp.productionProcess} />
          <p className="text-xs font-bold text-gray-500 mt-4 mb-1">b. Material Balance</p>
          <Narrative text={pp.rawMaterialsNarrative} />
          <p className="text-xs font-bold text-gray-500 mt-4 mb-1">2. Existing Production Equipment</p>
          <Table
            headers={["Type of Equipment", "No. of Units", "Year Acquired"]}
            rows={equipmentRows}
          />
          <Footer page="4" />
        </div>

        {/* Page 5 — III.b.3-4 */}
        <div className="rtec-page-break">
          <p className="text-xs font-bold text-gray-500 mb-2">
            3. Technical constraints on the production line and proposed S&T intervention
          </p>
          <Table
            headers={[
              "Process/Existing Practice/Problem",
              "Proposed S&T Intervention",
              "Proposed S&T intervention-related equipment/skills upgrading",
              "Impact",
            ]}
            rows={form.constraintRows.map((r) => [
              r.processProblem,
              r.proposedIntervention,
              r.equipmentSkills,
              r.impact,
            ])}
          />
          <p className="text-xs font-bold text-gray-500 mt-4 mb-2">Proposed Plant Lay-out</p>
          <AttachmentImg
            attachment={findAtt("plantLayout")}
            label={PROPOSAL_ATTACHMENT_LABELS.plantLayout}
          />
          <Footer page="5" />
        </div>

        {/* Page 6 — III.b.4-5 + III.c start */}
        <div className="rtec-page-break">
          <p className="text-xs font-bold text-gray-500 mb-2">
            4. Cost and specification of S&T Intervention Related Equipment
          </p>
          <Table
            headers={["S&T Intervention-related equipment/specification", "Qty", "Unit Cost", "Total Cost"]}
            rows={pp.interventionCostTable
              .filter((r) => r.some((c) => c.trim()))
              .map((r) => [r[0] ?? "", r[1] ?? "", r[2] ?? "", r[3] ?? ""])}
          />
          <p className="text-xs font-bold text-gray-500 mt-4 mb-2">
            5. List of equipment fabricators (name and address)
          </p>
          <Table
            headers={["Name", "Address", "Contact No."]}
            rows={form.fabricatorRows.map((r) => [r.name, r.address, r.contactNo])}
          />
          <h3 className="text-xs font-bold uppercase text-gray-600 mt-6 mb-2">c. Marketing Aspect</h3>
          <p className="text-xs font-bold text-gray-500 mb-1">Market Situation</p>
          <Narrative text={pp.marketSituation} />
          <p className="text-xs font-bold text-gray-500 mt-3 mb-1">Product Demand and Supply</p>
          <Narrative text={pp.productDemandSupply} />
          <Footer page="6" />
        </div>

        {/* Page 7 — III.c cont + III.d liquidity */}
        <div className="rtec-page-break">
          <p className="text-xs font-bold text-gray-500 mb-1">Product specifications and product price</p>
          <Table
            headers={["Product / Specification", "Price"]}
            rows={pp.productPriceTable.filter((r) => r.some((c) => c.trim()))}
          />
          <p className="text-xs font-bold text-gray-500 mt-3 mb-1">Market plans/strategies</p>
          <Bullets items={pp.marketStrategies} />
          <h3 className="text-xs font-bold uppercase text-gray-600 mt-6 mb-2">
            d. Financial Aspect
          </h3>
          <Narrative text={form.ratioNarrative || pp.financialAnalysis} />
          <p className="text-xs font-bold text-gray-500 mt-3 mb-1">Liquidity Ratio</p>
          <Table
            headers={["Year", "Current Asset", "Current Liabilities", "Current Ratio"]}
            rows={pp.liquidityRatioTable.map((r) => [r[0], r[1], r[2], r[3]])}
          />
          <Footer page="7" />
        </div>

        {/* Page 8 — quick + ROI */}
        <div className="rtec-page-break">
          <p className="text-xs font-bold text-gray-500 mb-1">Quick Ratio (Acid Test Ratio)</p>
          <Table
            headers={["Year", "Current Asset", "Inventory", "Current Liabilities", "Quick Ratio"]}
            rows={pp.quickRatioTable.map((r) => [r[0], r[1], r[2], r[3], r[4]])}
          />
          <p className="text-xs font-bold text-gray-500 mt-4 mb-1">Return on Investment</p>
          <Table
            headers={["Year", "Net Profit", "Cost of Investment", "ROI (%)"]}
            rows={pp.roiTable.map((r) => [r[0], r[1], r[2], r[3]])}
          />
          <p className="text-xs font-bold text-gray-500 mt-3 mb-1">Financial constraints</p>
          <Narrative text={pp.financialConstraintsNote} />
          <Footer page="8" />
        </div>

        {/* Page 9 — budget + refund */}
        <div className="rtec-page-break">
          <p className="text-xs font-bold text-gray-500 mb-1">Budgetary Requirement for the proposed project</p>
          <Table
            headers={["Item of Expenditure", "Qty", "Unit Cost", "SETUP", "Cooperator", "Total"]}
            rows={budgetRows}
          />
          <p className="text-xs text-gray-400 italic mt-1">
            Note: cost-sharing of an item is not allowed due to issue on ownership.
          </p>
          <p className="text-xs font-bold text-gray-500 mt-4 mb-1">Proposed Refund Schedule</p>
          {pp.refundSchedule.length > 0 ? (
            <Table headers={pp.refundSchedule[0]} rows={pp.refundSchedule.slice(1)} />
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
          <Footer page="9" />
        </div>

        {/* Page 10 — waste + risk */}
        <div className="rtec-page-break">
          <h3 className="text-xs font-bold uppercase text-gray-600 mb-2">e. Waste Disposal</h3>
          <Narrative text={pp.wasteManagement} />
          <h3 className="text-xs font-bold uppercase text-gray-600 mt-6 mb-2">f. Risk Management</h3>
          <Table
            headers={["Risks", "Assumptions", "Risk Management Plan"]}
            rows={pp.riskRows.map((r) => [r.risk, r.assumption, r.plan])}
          />
          <Footer page="10" />
        </div>

        {/* Page 11 — IV + signatures */}
        <div className="rtec-page-break">
          <Section title="IV. Recommendation (addressing the findings of TNA)">
            <Narrative text={form.recommendation} />
          </Section>
          <div className="mt-8">
            <p className="text-sm font-semibold text-gray-700 mb-4">Evaluated by:</p>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-500">RTEC Chairperson</p>
                <div className="rtec-sig-line border-b border-gray-400 min-h-10 mt-6" />
                <p className="mt-1">{form.signatures.chairperson || " "}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["member1", "member2", "member3"] as const).map((k, i) => (
                  <div key={k}>
                    <p className="text-xs text-gray-500">Member</p>
                    <div className="rtec-sig-line border-b border-gray-400 min-h-10 mt-6" />
                    <p className="mt-1 text-xs">{form.signatures[k] || `Member ${i + 1}`}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-8 text-sm">
              <div>
                <p className="text-xs text-gray-500">Reviewed and endorsed by: RPMO</p>
                <div className="rtec-sig-line border-b border-gray-400 min-h-10 mt-6" />
                <p className="mt-1">{form.signatures.rpmo || " "}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Noted by: Regional Director</p>
                <div className="rtec-sig-line border-b border-gray-400 min-h-10 mt-6" />
                <p className="mt-1">
                  {form.signatures.regionalDirector || DOST_REGION_12_DIRECTOR_NAME}
                </p>
              </div>
            </div>
            {form.signatures.evaluationDate && (
              <p className="text-xs text-gray-500 mt-4">
                Date: {form.signatures.evaluationDate}
              </p>
            )}
          </div>
          <Footer page="11" />
        </div>
      </div>
    </div>
  );
}
