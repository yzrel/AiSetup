/**
 * Author: Yzrel Jade B. Eborde
 */

import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import type {
  ProjectProposalAttachment,
  ProjectProposalForm,
  ProjectProposalDocumentResponse,
} from "../api/types";
import { PROPOSAL_ATTACHMENT_LABELS } from "../utils/projectProposal";
import { printProjectProposalPdf } from "../utils/projectProposalPrint";
import {
  PreviewFieldRow,
  PreviewSection,
  PreviewTable,
  PreviewToolbar,
} from "./PreviewLayout";

const DOST_BLUE = "#0C2461";

interface ProjectProposalPreviewProps {
  form: ProjectProposalForm;
  document?: ProjectProposalDocumentResponse | null;
  attachments?: ProjectProposalAttachment[];
  applicationId?: string;
  aiGenerated?: boolean;
  submitted?: boolean;
  onPrint?: () => void;
  compact?: boolean;
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
    <div className={`mb-6 pp-print-section ${pageBreak ? "pp-page-break" : ""}`}>
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

function Row({ label, value }: { label: string; value?: string | null }) {
  return <PreviewFieldRow label={label} value={value} />;
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
    <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
      {list.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <PreviewTable
      columns={headers.map((h, i) => ({ key: String(i), header: h, mobileLabel: h }))}
      rows={rows}
    />
  );
}

function AttachmentFigure({
  attachment,
  label,
}: {
  attachment?: ProjectProposalAttachment;
  label: string;
}) {
  if (!attachment) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-400">
        {label} — not attached
      </div>
    );
  }
  const isImage = attachment.mimeType.startsWith("image/");
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      {isImage ? (
        <img
          src={attachment.dataUrl}
          alt={attachment.fileName}
          className="max-h-64 mx-auto border border-gray-200 rounded"
        />
      ) : (
        <p className="text-xs text-gray-500">{attachment.fileName} (PDF attached)</p>
      )}
    </div>
  );
}

export function ProjectProposalPreview({
  form,
  document: doc,
  attachments = [],
  applicationId,
  aiGenerated,
  submitted,
  onPrint,
  compact = false,
}: ProjectProposalPreviewProps) {
  const findAttachment = (kind: string) =>
    attachments.find((a) => a.kind === kind);

  const narrative = (field: keyof ProjectProposalForm, docField?: keyof ProjectProposalDocumentResponse) => {
    if (doc && docField && doc[docField]) return String(doc[docField]);
    return String(form[field] ?? "");
  };

  const bulletField = (
    formField: keyof ProjectProposalForm,
    docField?: keyof ProjectProposalDocumentResponse,
  ) => {
    if (doc && docField && doc[docField]?.length) {
      return doc[docField] as string[];
    }
    const val = form[formField];
    return Array.isArray(val) ? (val as string[]) : [];
  };

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
        id="project-proposal-preview"
        className="print-a4-sheet bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-gray-800 pp-form-document"
      >
        <div className="text-center border-b border-gray-200 pb-4 mb-6 pp-print-section">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            Republic of the Philippines
          </p>
          <p className="font-bold text-base">Department of Science and Technology</p>
          <p className="text-xs text-gray-500">
            Small Enterprise Technology Upgrading Program (SETUP)
          </p>
          <p className="font-black text-lg mt-3" style={{ color: DOST_BLUE }}>
            SETUP Form 001 — Project Proposal
          </p>
          {applicationId && (
            <p className="text-xs text-gray-500 mt-1">
              Application ID: <span className="font-mono font-semibold">{applicationId}</span>
            </p>
          )}
          {doc?.generatedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Generated: {new Date(doc.generatedAt).toLocaleString()}
              {aiGenerated !== undefined && (
                <span className="block mt-1">
                  {aiGenerated ? "AI-assisted draft" : "Template-assisted draft"}
                  {submitted ? " · Submitted" : " · Draft"}
                </span>
              )}
            </p>
          )}
        </div>

        <Section title="Cover">
          <Row label="Project Title" value={form.projectTitle} />
          <Row label="Proponent" value={form.proponentName} />
          <Row label="Proponent Address" value={form.proponentAddress} />
          <Row label="Project Cost" value={form.projectCost} />
          <Row label="Amount Requested from SETUP" value={form.amountRequested} />
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">General Objective</p>
            <Narrative text={narrative("generalObjective", "generalObjective")} />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Specific Objectives</p>
            <Bullets items={bulletField("specificObjectives", "specificObjectives")} />
          </div>
        </Section>

        <Section title="Company Profile" pageBreak>
          <Row label="Name of Firm" value={form.firmName} />
          <Row label="Address" value={form.firmAddress} />
          <Row label="Contact Person" value={form.contactPerson} />
          <Row label="Contact Number" value={form.contactNumber} />
          <Row label="Email" value={form.email} />
          <Row label="Year Established" value={form.yearEstablished} />
          <Row label="Organization Type" value={form.organizationType} />
          <Row label="Profit / Non-profit" value={form.profitType} />
          <Row label="MSME Size" value={form.msmeSize} />
          <Row label="Employees (Male / Female)" value={`${form.employeesMale} / ${form.employeesFemale}`} />
          <Row label="Employees (Direct / Indirect)" value={`${form.employeesDirect} / ${form.employeesIndirect}`} />
          <Row label="Registration Office" value={form.registrationOffice} />
          <Row label="Registration Number" value={form.registrationNumber} />
          <Row label="Registration Date" value={form.registrationDate} />
          <Row label="Business Permit No." value={form.businessPermitNumber} />
          <Row label="Business Permit Date" value={form.businessPermitDate} />
          <Row label="Business Activity" value={form.businessActivity} />
          <Row label="Priority Sector (Specify)" value={form.prioritySectorSpecify} />
          <Row label="Products / Services" value={form.productsServices} />
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Brief Enterprise Background</p>
            <Narrative text={narrative("enterpriseBackground", "enterpriseBackground")} />
          </div>
        </Section>

        <Section title="Management & Organization">
          <AttachmentFigure
            attachment={findAttachment("orgChart")}
            label={PROPOSAL_ATTACHMENT_LABELS.orgChart}
          />
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">B.2 Skills and Expertise</p>
            <Narrative text={narrative("skillsExpertise", "skillsExpertise")} />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">B.3 Compensation</p>
            <Narrative text={form.compensation} />
          </div>
        </Section>

        <Section title="Plant Site & Location" pageBreak>
          <Narrative text={narrative("plantSiteNarrative", "plantSiteNarrative")} />
          <div className="mt-4">
            <AttachmentFigure
              attachment={findAttachment("vicinityMap")}
              label={PROPOSAL_ATTACHMENT_LABELS.vicinityMap}
            />
          </div>
        </Section>

        <Section title="Production Capacity">
          <Narrative text={narrative("capacityVolumeNarrative", "capacityVolumeNarrative")} />
        </Section>

        <Section title="Raw Materials">
          <Narrative text={narrative("rawMaterialsNarrative", "rawMaterialsNarrative")} />
          <div className="mt-3">
            <Table
              headers={["Item", "Volume / Year", "Source"]}
              rows={form.rawMaterialsTable.filter((r) => r.some((c) => c.trim()))}
            />
          </div>
        </Section>

        <Section title="Market Situation" pageBreak>
          <Narrative text={narrative("marketSituation", "marketSituation")} />
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Product Demand and Supply</p>
            <Narrative text={narrative("productDemandSupply", "productDemandSupply")} />
          </div>
          <div className="mt-3">
            <Table
              headers={["Product / Specification", "Price"]}
              rows={form.productPriceTable.filter((r) => r.some((c) => c.trim()))}
            />
          </div>
        </Section>

        <Section title="Distribution Channel">
          <Narrative text={narrative("distributionChannel", "distributionChannel")} />
        </Section>

        <Section title="Competitors">
          <Narrative text={narrative("competitors", "competitors")} />
        </Section>

        <Section title="Market Plans & Strategies">
          <Bullets items={bulletField("marketStrategies", "marketStrategies")} />
        </Section>

        <Section title="Production Process" pageBreak>
          <Narrative text={narrative("productionProcess", "productionProcess")} />
        </Section>

        <Section title="Existing Production Equipment">
          <Narrative text={narrative("equipmentNarrative", "equipmentNarrative")} />
          <div className="mt-3">
            <Table
              headers={["Type", "Quantity", "Year Acquired"]}
              rows={form.equipmentTable.filter((r) => r.some((c) => c.trim()))}
            />
          </div>
        </Section>

        <Section title="S&T Intervention">
          <Row label="Problem / Constraint" value={narrative("interventionProblem", "interventionProblem")} />
          <Row label="Proposed Intervention" value={narrative("interventionProposed", "interventionProposed")} />
          <Row label="Equipment" value={narrative("interventionEquipment", "interventionEquipment")} />
          <Row label="Expected Impact" value={narrative("interventionImpact", "interventionImpact")} />
          <div className="mt-4">
            <AttachmentFigure
              attachment={findAttachment("plantLayout")}
              label={PROPOSAL_ATTACHMENT_LABELS.plantLayout}
            />
          </div>
        </Section>

        <Section title="Intervention Equipment Cost">
          <Table
            headers={["Equipment", "Qty", "Unit Cost", "Total"]}
            rows={form.interventionCostTable.filter((r) => r.some((c) => c.trim()))}
          />
        </Section>

        <Section title="Equipment Fabricators" pageBreak>
          <Table
            headers={["Name", "Address", "Contact"]}
            rows={form.fabricatorTable.filter((r) => r.some((c) => c.trim()))}
          />
        </Section>

        <Section title="Schedule of Activities">
          <Table
            headers={["Activity", "Timeline"]}
            rows={form.scheduleTable.filter((r) => r.some((c) => c.trim()))}
          />
        </Section>

        <Section title="Expected Output & Impact">
          <Bullets items={bulletField("expectedOutputBullets", "expectedOutputBullets")} />
        </Section>

        <Section title="Waste Management / Disposal">
          <Narrative text={narrative("wasteManagement", "wasteManagement")} />
        </Section>

        <Section title="Financial Capacity" pageBreak>
          <p className="text-xs font-bold text-gray-600 mb-2">Liquidity Ratio (Current Ratio)</p>
          <Table
            headers={["Year", "Current Assets", "Current Liabilities", "Ratio"]}
            rows={form.liquidityRatioTable}
          />
          <p className="text-xs font-bold text-gray-600 mt-4 mb-2">Quick Ratio</p>
          <Table
            headers={["Year", "Current Assets", "Inventory", "Current Liabilities", "Ratio"]}
            rows={form.quickRatioTable}
          />
          <p className="text-xs font-bold text-gray-600 mt-4 mb-2">Return on Investment</p>
          <Table
            headers={["Year", "Net Income", "Investment", "ROI"]}
            rows={form.roiTable}
          />
          <div className="mt-3">
            <Narrative text={narrative("financialAnalysis", "financialAnalysis")} />
          </div>
        </Section>

        <Section title="Financial Statements & Constraints">
          <Narrative text={form.financialConstraintsNote} />
          <div className="mt-3">
            <AttachmentFigure
              attachment={findAttachment("financialReports")}
              label={PROPOSAL_ATTACHMENT_LABELS.financialReports}
            />
          </div>
        </Section>

        <Section title="Budgetary Requirement">
          <Table
            headers={["Item", "Qty", "Unit Cost", "SETUP Share", "Total"]}
            rows={form.budgetItems.map((b) => [
              b.item,
              b.qty,
              b.unitCost,
              b.setupShare,
              b.total,
            ])}
          />
        </Section>

        <Section title="Proposed Refund Schedule" pageBreak>
          {form.refundSchedule.length > 0 ? (
            <Table
              headers={form.refundSchedule[0]}
              rows={form.refundSchedule.slice(1)}
            />
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </Section>

        <Section title="Risk Management">
          <Table
            headers={["Risks", "Assumptions", "Risk Management Plan"]}
            rows={(doc?.riskRows?.length ? doc.riskRows : form.riskRows).map((r) => [
              r.risk,
              r.assumption,
              r.plan,
            ])}
          />
          <p className="text-[10px] text-gray-400 mt-3 italic">
            Risk — an uncertain event that may affect project objectives. Assumption — a condition believed true for planning purposes.
          </p>
        </Section>

        <div className="mt-8 pt-6 border-t border-gray-200 pp-print-section">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Prepared by:</p>
              <div className="border-b border-gray-300 min-h-10 mt-6 mb-1" />
              <p className="text-gray-600">{form.contactPerson || form.proponentName}</p>
              <p className="text-xs text-gray-400">Proponent / Authorized Representative</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Date:</p>
              <div className="border-b border-gray-300 min-h-10 mt-6 mb-1" />
              <p className="text-gray-400 text-xs italic">For official use — DOST Regional Office</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function printProjectProposal(
  form: ProjectProposalForm,
  document?: ProjectProposalDocumentResponse | null,
  attachments?: ProjectProposalAttachment[],
  applicationId?: string,
) {
  printProjectProposalPdf(form, document, attachments, applicationId);
}
