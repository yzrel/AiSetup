/**
 * Author: Yzrel Jade B. Eborde
 *
 * On-screen A4 preview that approximates SETUP Form 001 (section order, indent,
 * table columns). Official PDF still prints via ProjectProposalDocument.
 */

import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import type {
  ProjectProposalAttachment,
  ProjectProposalForm,
  ProjectProposalDocumentResponse,
} from "../api/types";
import {
  buildInvestmentDecisionAnalysis,
  compensationTableFooterRow,
  existingEquipmentFooterRow,
  formatRiskAndAssumptions,
  PROPOSAL_ATTACHMENT_LABELS,
  rawMaterialAllocationFooterRow,
  rawMaterialCostFooterRow,
  toBudgetPrintRow,
} from "../utils/projectProposal";
import {
  PP_BUDGET_COLUMNS,
  PP_BUDGET_NOTE,
  PP_COMPENSATION_COLUMNS,
  PP_EMPLOYEE_ROWS,
  PP_EQUIPMENT_COLUMNS,
  PP_EXPECTED_OUTPUT_HEADINGS,
  PP_FABRICATOR_COLUMNS,
  PP_FINANCIAL_ATTACH_NOTE,
  PP_FINANCIAL_CAPACITY_DASH_ITEMS,
  PP_FINANCIAL_SUBHEADINGS,
  PP_FORM_INDENT_CLASS,
  PP_INTERVENTION_COLUMNS,
  PP_INTERVENTION_COST_COLUMNS,
  PP_LIQUIDITY_COLUMNS,
  PP_MARKETING_A_LABELS,
  PP_MARKETING_SUBHEADINGS,
  PP_NPM_COLUMNS,
  PP_PRODUCT_PRICE_COLUMNS,
  PP_PRODUCTION_DASH_ITEMS,
  PP_QUICK_RATIO_COLUMNS,
  PP_RAW_MATERIAL_ALLOCATION_COLUMNS,
  PP_RAW_MATERIAL_COLUMNS,
  PP_RAW_MATERIAL_COST_COLUMNS,
  PP_REFUND_NOTE,
  PP_RISK_COLUMNS,
  PP_RISK_FOOTNOTE,
  PP_ROI_COLUMNS,
  PP_SECTION_FINANCIAL,
  PP_SECTION_MARKETING,
  PP_SECTION_PROJECT_BACKGROUND,
  PP_SECTION_RISK,
  PP_SECTION_TECHNOLOGICAL,
  PP_SECTION_WASTE,
  PP_SUBHEADING_CAPACITY,
  PP_VOLUME_OF_ORDERS_COLUMNS,
  PP_WASTE_SUBHEADINGS,
  PROJECT_PROPOSAL_TITLE,
  companyProfileEmployeeTotals,
  displayValue,
  formatCurrencyDisplay,
} from "../constants/projectProposalLayout";
import { printProjectProposalPdf } from "../utils/projectProposalPrint";
import { companyProfileMsmeSizeLabelFromApplicant } from "../utils/projectProposal";
import { snapshotStatementTables } from "../utils/financialProjection";
import { getFinancialProjectionStored } from "../utils/financialProjectionStore";
import { applicantStore } from "../store/applicantStore";
import { StoredFileImage } from "./StoredFilePreview";
import { isImageFile } from "../utils/storedFilePreview";
import { PreviewToolbar } from "./PreviewLayout";
import { ScheduleGanttTable } from "./projectProposal/ScheduleGanttTable";
import { InvestmentDecisionAnalysisTable } from "./projectProposal/InvestmentDecisionAnalysisTable";

interface ProjectProposalPreviewProps {
  form: ProjectProposalForm;
  document?: ProjectProposalDocumentResponse | null;
  attachments?: ProjectProposalAttachment[];
  applicationId?: string;
  applicantId?: string;
  aiGenerated?: boolean;
  submitted?: boolean;
  onPrint?: () => void;
  compact?: boolean;
}

function val(value: unknown): string {
  return displayValue(value);
}

function Indent({
  level,
  children,
}: {
  level: 1 | 2 | 3;
  children: ReactNode;
}) {
  return <div className={PP_FORM_INDENT_CLASS[level]}>{children}</div>;
}

function Narrative({ text }: { text?: string }) {
  const content = String(text ?? "").trim();
  if (!content) return <p className="pp-form-empty">{"\u00a0"}</p>;
  return <p className="pp-form-narrative">{content}</p>;
}

function Bullets({ items, check }: { items?: string[]; check?: boolean }) {
  const list = items?.map((s) => val(s)).filter(Boolean) ?? [];
  if (!list.length) return <p className="pp-form-empty">{"\u00a0"}</p>;
  return (
    <ul className={check ? "pp-form-check-bullet-list" : "pp-form-bullet-list"}>
      {list.map((item, i) => (
        <li key={i}>
          {check ? <span className="pp-form-check-bullet">{"\u2713"}</span> : null}
          {item}
        </li>
      ))}
    </ul>
  );
}

function cellClass(colIndex: number, numericCols: readonly number[]): string | undefined {
  const classes: string[] = [];
  if (colIndex === 0) classes.push("pp-form-particulars");
  if (numericCols.includes(colIndex)) classes.push("pp-form-num");
  return classes.length ? classes.join(" ") : undefined;
}

function Table({
  headers,
  rows,
  className = "",
  numericCols = [],
  footerRow,
}: {
  headers: readonly string[];
  rows: string[][];
  className?: string;
  numericCols?: readonly number[];
  footerRow?: readonly string[];
}) {
  const body = rows.filter((r) => r.some((c) => String(c ?? "").trim()));
  const shown = body.length ? body : [headers.map(() => "")];
  return (
    <table className={`pp-form-table ${className}`.trim()}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shown.map((row, i) => (
          <tr key={i}>
            {headers.map((_, j) => (
              <td key={j} className={cellClass(j, numericCols)}>
                {val(row[j]) || "\u00a0"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footerRow ? (
        <tfoot>
          <tr>
            {headers.map((_, j) => (
              <td key={j} className={cellClass(j, numericCols)}>
                {val(footerRow[j]) || "\u00a0"}
              </td>
            ))}
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}

function AttachmentFigure({
  attachment,
  label,
  applicantId,
}: {
  attachment?: ProjectProposalAttachment;
  label: string;
  applicantId?: string;
}) {
  if (!attachment) {
    return (
      <div className="pp-form-attachment-placeholder">
        <p className="pp-form-attachment-label">{label}</p>
      </div>
    );
  }
  const isImage = isImageFile(
    attachment.mimeType,
    attachment.fileName,
    attachment.dataUrl,
  );
  return (
    <div className="pp-form-attachment">
      <p className="pp-form-attachment-label">{label}</p>
      {isImage ? (
        <StoredFileImage
          applicantId={applicantId}
          file={attachment}
          alt={attachment.fileName}
        />
      ) : (
        <p className="pp-form-attachment-file">{attachment.fileName}</p>
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr>
      <td className="pp-form-label">{label}</td>
      <td className="pp-form-value">{val(value) || "\u00a0"}</td>
    </tr>
  );
}

export function ProjectProposalPreview({
  form,
  document: doc,
  attachments = [],
  applicationId,
  applicantId,
  aiGenerated,
  submitted,
  onPrint,
  compact = false,
}: ProjectProposalPreviewProps) {
  const findAttachment = (kind: string) =>
    attachments.find((a) => a.kind === kind);
  const projectionSnapshot = applicantId
    ? getFinancialProjectionStored(applicantStore.getById(applicantId))?.snapshot
    : undefined;
  const projTables = projectionSnapshot
    ? snapshotStatementTables(projectionSnapshot)
    : null;
  const emp = companyProfileEmployeeTotals(form);
  const applicantRecord = applicantId
    ? applicantStore.getById(applicantId)
    : null;
  const msmeSizeLabel = companyProfileMsmeSizeLabelFromApplicant(
    applicantRecord,
    form,
  );

  const narrative = (field: keyof ProjectProposalForm, docField?: keyof ProjectProposalDocumentResponse) => {
    if (doc && docField && doc[docField]) return String(doc[docField]);
    return String(form[field] ?? "");
  };

  const bulletField = (
    formField: keyof ProjectProposalForm,
    docField?: keyof ProjectProposalDocumentResponse,
  ) => {
    if (doc && docField) {
      const docValue = doc[docField];
      if (Array.isArray(docValue) && docValue.length) {
        return docValue as string[];
      }
    }
    const v = form[formField];
    return Array.isArray(v) ? (v as string[]) : [];
  };

  const expectedBullets = bulletField("expectedOutputBullets", "expectedOutputBullets");
  const wasteVolume = narrative("wasteVolumeMonthly", "wasteVolumeMonthly");
  const wasteKindsText = narrative("wasteKinds", "wasteKinds");
  const wasteMethods = narrative("wasteDisposalMethods", "wasteDisposalMethods");
  const wasteCombined = narrative("wasteManagement", "wasteManagement");
  const hasSplitWaste = Boolean(wasteVolume || wasteKindsText || wasteMethods);
  const riskRows = doc?.riskRows?.length ? doc.riskRows : form.riskRows;
  const budgetRows = form.budgetItems
    .filter((b) => b.item.trim() || b.total.trim())
    .map((b) => toBudgetPrintRow(b));
  const refundRows =
    form.refundSchedule.length > 1 ? form.refundSchedule.slice(1) : [];
  const refundHeaders =
    form.refundSchedule.length > 0
      ? form.refundSchedule[0]
      : ["Months", "Y1", "Y2", "Y3", "Y4", "Y5", "Total"];

  const empCell = (n: number | string) =>
    n === 0 || n === "" ? "\u00a0" : String(n);

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && onPrint && (
        <PreviewToolbar className="justify-end print:hidden">
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[#0C2461] text-white hover:opacity-90"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </PreviewToolbar>
      )}

      <div id="project-proposal-preview" className="pp-form-document">
        <div className="pp-form-block pp-print-section">
          <h1 className="pp-form-title">{PROJECT_PROPOSAL_TITLE}</h1>
          {(applicationId || doc?.generatedAt || aiGenerated !== undefined) && (
            <div className="pp-form-preview-meta">
              {applicationId ? (
                <p>
                  Application ID: <span className="font-mono font-semibold">{applicationId}</span>
                </p>
              ) : null}
              {doc?.generatedAt ? (
                <p>Generated: {new Date(doc.generatedAt).toLocaleString()}</p>
              ) : null}
              {aiGenerated !== undefined ? (
                <p>
                  {aiGenerated ? "AI-assisted draft" : "Template-assisted draft"}
                  {submitted ? " · Submitted" : " · Draft"}
                </p>
              ) : null}
            </div>
          )}
          <div className="pp-form-cover-field">
            <span className="pp-form-cover-label">PROJECT TITLE:</span>
            <span className="pp-form-cover-value">{val(form.projectTitle) || "\u00a0"}</span>
          </div>
          <div className="pp-form-cover-field">
            <span className="pp-form-cover-label">PROPONENT:</span>
            <span className="pp-form-cover-value">{val(form.proponentName) || "\u00a0"}</span>
          </div>
          {val(form.proponentAddress) ? (
            <p className="pp-form-cover-address">{val(form.proponentAddress)}</p>
          ) : null}
          <div className="pp-form-cover-field">
            <span className="pp-form-cover-label">PROJECT COST:</span>
            <span className="pp-form-cover-value">
              {formatCurrencyDisplay(form.projectCost) || form.projectCost || "\u00a0"}
            </span>
          </div>
          <div className="pp-form-cover-field">
            <span className="pp-form-cover-label">AMOUNT REQUESTED:</span>
            <span className="pp-form-cover-value">
              {formatCurrencyDisplay(form.amountRequested) || form.amountRequested || "\u00a0"}
            </span>
          </div>
          <Indent level={1}>
            <h3 className="pp-form-subheading">OBJECTIVES:</h3>
          </Indent>
          <Indent level={2}>
            <p className="pp-form-field-label">General Objectives:</p>
            <Narrative text={narrative("generalObjective", "generalObjective")} />
            <p className="pp-form-field-label">Specific Objectives:</p>
            <Bullets items={bulletField("specificObjectives", "specificObjectives")} />
          </Indent>
        </div>

        <div className="pp-form-block pp-print-section">
          <h2 className="pp-form-section-heading">{PP_SECTION_PROJECT_BACKGROUND}</h2>
          <Indent level={1}>
            <h3 className="pp-form-subheading">A. Company Profile:</h3>
          </Indent>
          <table className="pp-form-table">
            <tbody>
              <ProfileRow label="Name of Firm" value={form.firmName} />
              <ProfileRow label="Address" value={form.firmAddress} />
              <ProfileRow label="Contact Person" value={form.contactPerson} />
              <ProfileRow label="Contact No." value={form.contactNumber} />
              <ProfileRow label="e-mail Address" value={form.email} />
              <ProfileRow label="Year established" value={form.yearEstablished} />
              <ProfileRow
                label="Business Permit"
                value={[form.businessPermitNumber, form.businessPermitDate].filter(Boolean).join(" · ")}
              />
              <ProfileRow label="Type of Organization" value={form.organizationType} />
              <ProfileRow label="Profit / Non-Profit" value={form.profitType} />
              <ProfileRow label="MSME Size" value={msmeSizeLabel} />
              <ProfileRow label="Registration Office" value={form.registrationOffice} />
              <ProfileRow label="Registration Number" value={form.registrationNumber} />
              <ProfileRow label="Date of Registration" value={form.registrationDate} />
              <ProfileRow label="Business Activity" value={form.businessActivity} />
              <ProfileRow label="Business Sector (Specify)" value={form.prioritySectorSpecify} />
              <ProfileRow label="Products/Services" value={form.productsServices} />
              <tr>
                <td className="pp-form-label">Brief Enterprise Background</td>
                <td className="pp-form-value pp-form-narrative-cell">
                  {val(narrative("enterpriseBackground", "enterpriseBackground")) || "\u00a0"}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="pp-form-table">
            <thead>
              <tr>
                <th>Type of Employment</th>
                <th>Male</th>
                <th>Female</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{PP_EMPLOYEE_ROWS[0].label}</td>
                <td className="pp-form-center">{"\u00a0"}</td>
                <td className="pp-form-center">{"\u00a0"}</td>
                <td className="pp-form-center">{"\u00a0"}</td>
              </tr>
              <tr>
                <td className="pp-form-subrow">{PP_EMPLOYEE_ROWS[1].label}</td>
                <td className="pp-form-center">{empCell(emp.productionMale)}</td>
                <td className="pp-form-center">{empCell(emp.productionFemale)}</td>
                <td className="pp-form-center">{empCell(emp.productionTotal)}</td>
              </tr>
              <tr>
                <td className="pp-form-subrow">{PP_EMPLOYEE_ROWS[2].label}</td>
                <td className="pp-form-center">{empCell(emp.nonProductionMale)}</td>
                <td className="pp-form-center">{empCell(emp.nonProductionFemale)}</td>
                <td className="pp-form-center">{empCell(emp.nonProductionTotal)}</td>
              </tr>
              <tr>
                <td>{PP_EMPLOYEE_ROWS[3].label}</td>
                <td className="pp-form-center">{val(form.employeesIndirectMale) || "\u00a0"}</td>
                <td className="pp-form-center">{val(form.employeesIndirectFemale) || "\u00a0"}</td>
                <td className="pp-form-center">{empCell(emp.indirectTotal)}</td>
              </tr>
              <tr>
                <td>{PP_EMPLOYEE_ROWS[4].label}</td>
                <td className="pp-form-center">{empCell(emp.totalMale)}</td>
                <td className="pp-form-center">{empCell(emp.totalFemale)}</td>
                <td className="pp-form-center">{empCell(emp.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pp-form-block pp-print-section">
          <Indent level={1}>
            <h3 className="pp-form-subheading">B. Management/Administrative Aspect</h3>
          </Indent>
          <Indent level={2}>
            <p className="pp-form-numbered-label">1. Organizational chart</p>
            <AttachmentFigure
              attachment={findAttachment("orgChart")}
              label={PROPOSAL_ATTACHMENT_LABELS.orgChart}
              applicantId={applicantId}
            />
            <p className="pp-form-numbered-label">
              2. Skills and expertise of employee/owner (proponent)
            </p>
            <Narrative text={narrative("skillsExpertise", "skillsExpertise")} />
            <p className="pp-form-numbered-label">3. Compensation</p>
            <Table
              className="pp-form-compensation-table"
              headers={PP_COMPENSATION_COLUMNS}
              rows={form.compensationTable ?? []}
              footerRow={compensationTableFooterRow(form.compensationTable)}
              numericCols={[1, 2, 3, 4, 5, 6]}
            />
            {form.compensation?.trim() ? <Narrative text={form.compensation} /> : null}
            <p className="pp-form-numbered-label">
              4. Gender and Development (GAD) — Participation and Involvement
            </p>
            <Narrative text={narrative("genderInvolvement", "genderInvolvement")} />
          </Indent>
        </div>

        <div className="pp-form-block pp-print-section">
          <Indent level={1}>
            <h3 className="pp-form-subheading">C. Plant site or location (including vicinity map)</h3>
            <Narrative text={narrative("plantSiteNarrative", "plantSiteNarrative")} />
            <AttachmentFigure
              attachment={findAttachment("vicinityMap")}
              label={PROPOSAL_ATTACHMENT_LABELS.vicinityMap}
              applicantId={applicantId}
            />
          </Indent>
        </div>

        <div className="pp-form-block pp-print-section">
          <Indent level={1}>
            <h3 className="pp-form-subheading">D. {PP_SUBHEADING_CAPACITY}</h3>
            <Narrative text={narrative("capacityVolumeNarrative", "capacityVolumeNarrative")} />
          </Indent>
          <Indent level={2}>
            <p className="pp-form-field-label">Raw Material Cost</p>
            <Table
              className="pp-form-rm-cost-table"
              headers={PP_RAW_MATERIAL_COST_COLUMNS}
              rows={form.rawMaterialCostTable ?? []}
              footerRow={rawMaterialCostFooterRow(form.rawMaterialCostTable)}
              numericCols={[1, 3, 4, 5, 6, 7, 8]}
            />
            <p className="pp-form-field-label">Raw Materials Allocation</p>
            <Table
              className="pp-form-rm-alloc-table"
              headers={PP_RAW_MATERIAL_ALLOCATION_COLUMNS}
              rows={form.rawMaterialAllocationTable ?? []}
              footerRow={rawMaterialAllocationFooterRow(form.rawMaterialAllocationTable)}
              numericCols={[1, 2]}
            />
          </Indent>
          <Indent level={1}>
            <h3 className="pp-form-subheading">E. Raw material/s used and sources of raw material</h3>
            <Narrative text={narrative("rawMaterialsNarrative", "rawMaterialsNarrative")} />
            <Table headers={PP_RAW_MATERIAL_COLUMNS} rows={form.rawMaterialsTable} />
          </Indent>
        </div>

        <div className="pp-form-block pp-print-section">
          <h2 className="pp-form-section-heading">{PP_SECTION_MARKETING}</h2>
          <Indent level={1}>
            <h3 className="pp-form-subheading">{PP_MARKETING_SUBHEADINGS.A}</h3>
          </Indent>
          <Indent level={2}>
            <p className="pp-form-field-label">{PP_MARKETING_A_LABELS.marketSituation}</p>
            <Narrative text={narrative("marketSituation", "marketSituation")} />
            <p className="pp-form-field-label">{PP_MARKETING_A_LABELS.productDemand}</p>
            <Narrative text={narrative("productDemandSupply", "productDemandSupply")} />
            <p className="pp-form-field-label">{PP_MARKETING_A_LABELS.volumeOfOrders}</p>
            <Table headers={PP_VOLUME_OF_ORDERS_COLUMNS} rows={form.volumeOfOrdersTable ?? []} />
          </Indent>
          <Indent level={1}>
            <h3 className="pp-form-subheading">{PP_MARKETING_SUBHEADINGS.B}</h3>
            <Table
              headers={PP_PRODUCT_PRICE_COLUMNS}
              rows={form.productPriceTable}
              numericCols={[1]}
            />
            <h3 className="pp-form-subheading">{PP_MARKETING_SUBHEADINGS.C}</h3>
            <Narrative text={narrative("distributionChannel", "distributionChannel")} />
            <h3 className="pp-form-subheading">{PP_MARKETING_SUBHEADINGS.D}</h3>
            <Narrative text={narrative("competitors", "competitors")} />
            <h3 className="pp-form-subheading">{PP_MARKETING_SUBHEADINGS.E}</h3>
            <Narrative text={narrative("existingMarketingProblems", "existingMarketingProblems")} />
            <h3 className="pp-form-subheading">{PP_MARKETING_SUBHEADINGS.F}</h3>
            <Bullets check items={bulletField("marketStrategies", "marketStrategies")} />
          </Indent>
        </div>

        <div className="pp-form-block pp-print-section">
          <h2 className="pp-form-section-heading">{PP_SECTION_TECHNOLOGICAL}</h2>
          <Indent level={1}>
            <h3 className="pp-form-subheading">A. Production Process</h3>
          </Indent>
          <Indent level={3}>
            <p className="pp-form-dash-label">- {PP_PRODUCTION_DASH_ITEMS[0]}</p>
            <Narrative text={narrative("productionProcess", "productionProcess")} />
            <p className="pp-form-dash-label">- {PP_PRODUCTION_DASH_ITEMS[1]}</p>
            <Table
              headers={["Material Balance"]}
              rows={[[narrative("materialBalance", "materialBalance")]]}
            />
          </Indent>
          <Indent level={1}>
            <h3 className="pp-form-subheading">B. Existing production equipment</h3>
            <Narrative text={narrative("equipmentNarrative", "equipmentNarrative")} />
            <Table
              className="pp-form-equipment-table"
              headers={PP_EQUIPMENT_COLUMNS}
              rows={form.equipmentTable}
              footerRow={existingEquipmentFooterRow(form.equipmentTable)}
              numericCols={[1, 2, 3, 4, 5, 6, 7, 8]}
            />
            <h3 className="pp-form-subheading">
              C. Technical constraints on the production line and proposed S&T intervention
            </h3>
            <table className="pp-form-table pp-form-intervention-table">
              <thead>
                <tr>
                  {PP_INTERVENTION_COLUMNS.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{val(narrative("interventionProblem", "interventionProblem")) || "\u00a0"}</td>
                  <td>{val(narrative("interventionProposed", "interventionProposed")) || "\u00a0"}</td>
                  <td>{val(narrative("interventionEquipment", "interventionEquipment")) || "\u00a0"}</td>
                  <td>{val(narrative("interventionImpact", "interventionImpact")) || "\u00a0"}</td>
                </tr>
              </tbody>
            </table>
          </Indent>
          <Indent level={2}>
            <p className="pp-form-field-label">Proposed Plant Lay-out</p>
            <AttachmentFigure
              attachment={findAttachment("plantLayout")}
              label={PROPOSAL_ATTACHMENT_LABELS.plantLayout}
              applicantId={applicantId}
            />
          </Indent>
          <Indent level={1}>
            <h3 className="pp-form-subheading">
              D. Cost and specification of S&T Intervention-Related Equipment
            </h3>
            <Table
              headers={PP_INTERVENTION_COST_COLUMNS}
              rows={form.interventionCostTable}
              numericCols={[1, 2, 3]}
            />
            <h3 className="pp-form-subheading">E. List of equipment fabricators (name and address)</h3>
            <Table headers={PP_FABRICATOR_COLUMNS} rows={form.fabricatorTable} />
            <h3 className="pp-form-subheading">F. Schedule of activities for the proposed project</h3>
            <ScheduleGanttTable rows={form.scheduleTable} weeksPerMonth={1} />
            <h3 className="pp-form-subheading">G. Expected Output/Impact (measured results)</h3>
          </Indent>
          {PP_EXPECTED_OUTPUT_HEADINGS.map((heading, i) => (
            <Indent level={3} key={heading}>
              <div className="pp-form-expected-output">
                <p className="pp-form-expected-heading">
                  {i + 1}. {heading}
                </p>
                <Narrative text={expectedBullets[i] ?? ""} />
              </div>
            </Indent>
          ))}
        </div>

        <div className="pp-form-block pp-print-section">
          <h2 className="pp-form-section-heading">{PP_SECTION_WASTE}</h2>
          <Indent level={1}>
            <h3 className="pp-form-subheading">{PP_WASTE_SUBHEADINGS.A}</h3>
            <Narrative text={wasteVolume || (!hasSplitWaste ? wasteCombined : "")} />
            <h3 className="pp-form-subheading">{PP_WASTE_SUBHEADINGS.B}</h3>
            <Narrative text={wasteKindsText} />
            <h3 className="pp-form-subheading">{PP_WASTE_SUBHEADINGS.C}</h3>
            <Narrative text={wasteMethods} />
          </Indent>
        </div>

        <div className="pp-form-block pp-print-section">
          <h2 className="pp-form-section-heading">{PP_SECTION_FINANCIAL}</h2>
          <Indent level={1}>
            <h3 className="pp-form-subheading">A. Financial capacity</h3>
          </Indent>
          <Indent level={3}>
            <p className="pp-form-dash-label">- {PP_FINANCIAL_CAPACITY_DASH_ITEMS[0]}</p>
            <p className="pp-form-ratio-intro">
              Liquidity ratios measure the short-term ability of the company to pay its maturing
              obligation and to meet unexpected needs for cash.
            </p>
            <p className="pp-form-dash-label">- {PP_FINANCIAL_CAPACITY_DASH_ITEMS[1]}</p>
            <Narrative text={narrative("partialBudgetAnalysis", "partialBudgetAnalysis")} />
            <p className="pp-form-dash-label">- {PP_FINANCIAL_CAPACITY_DASH_ITEMS[2]}</p>
            <Table
              headers={PP_NPM_COLUMNS}
              rows={form.netProfitMarginTable ?? []}
              numericCols={[1, 2, 3]}
            />
            <p className="pp-form-dash-label">- {PP_FINANCIAL_CAPACITY_DASH_ITEMS[3]}</p>
            <Table
              headers={PP_LIQUIDITY_COLUMNS}
              rows={form.liquidityRatioTable}
              numericCols={[1, 2, 3]}
            />
            <p className="pp-form-field-label">Quick Ratio (Acid Test Ratio)</p>
            <Table
              headers={PP_QUICK_RATIO_COLUMNS}
              rows={form.quickRatioTable}
              numericCols={[1, 2, 3, 4]}
            />
            <p className="pp-form-dash-label">- {PP_FINANCIAL_CAPACITY_DASH_ITEMS[4]}</p>
            <Table headers={PP_ROI_COLUMNS} rows={form.roiTable} numericCols={[1, 2, 3]} />
            <Narrative text={narrative("financialAnalysis", "financialAnalysis")} />
          </Indent>
          <Indent level={1}>
            <h3 className="pp-form-subheading">B. Financial constraints</h3>
            <p className="pp-form-field-value">
              {form.financialConstraintsNote || PP_FINANCIAL_ATTACH_NOTE}
            </p>
            <h3 className="pp-form-subheading">C. Cash flow/ financial statement/ balance sheet</h3>
            {!projTables ? (
              <p className="pp-form-field-value">{PP_FINANCIAL_ATTACH_NOTE}</p>
            ) : null}
          </Indent>
          {projTables ? (
            <Indent level={2}>
              <p className="pp-form-field-label">Income Statement (Years 1–5)</p>
              <Table
                className="pp-form-projection-table"
                headers={projTables.income[0] ?? []}
                rows={projTables.income.slice(1)}
              />
              <p className="pp-form-field-label">Cash Flow (Years 1–5)</p>
              <Table
                className="pp-form-projection-table"
                headers={projTables.cashFlow[0] ?? []}
                rows={projTables.cashFlow.slice(1)}
              />
              <p className="pp-form-field-label">Balance Sheet (end of year)</p>
              <Table
                className="pp-form-projection-table"
                headers={projTables.balance[0] ?? []}
                rows={projTables.balance.slice(1)}
              />
            </Indent>
          ) : null}
          <Indent level={1}>
            <h3 className="pp-form-subheading">D. Budgetary Requirement for the proposed project</h3>
            <Table
              className="pp-form-budget-table"
              headers={PP_BUDGET_COLUMNS}
              rows={budgetRows}
              numericCols={[1, 2, 3, 4, 5, 6, 7]}
            />
            <p className="pp-form-note">{PP_BUDGET_NOTE}</p>
            <h3 className="pp-form-subheading">E. Proposed Refund Schedule</h3>
            <Table
              className="pp-form-refund-table"
              headers={refundHeaders}
              rows={refundRows.length ? refundRows : [refundHeaders.map(() => "")]}
              numericCols={refundHeaders.map((_, i) => i).filter((i) => i > 0)}
            />
            <p className="pp-form-note">{PP_REFUND_NOTE}</p>
            <h3 className="pp-form-subheading">{PP_FINANCIAL_SUBHEADINGS.F}</h3>
            <InvestmentDecisionAnalysisTable
              analysis={buildInvestmentDecisionAnalysis(form, projectionSnapshot)}
            />
          </Indent>
        </div>

        <div className="pp-form-block pp-print-section">
          <h2 className="pp-form-section-heading">{PP_SECTION_RISK}</h2>
          <Table
            className="pp-form-risk-table"
            headers={PP_RISK_COLUMNS}
            rows={(riskRows.length
              ? riskRows
              : [{ id: "empty", objective: "", risk: "", assumption: "", plan: "" }]
            ).map((r) => [
              r.objective,
              formatRiskAndAssumptions(r),
              r.plan,
            ])}
          />
          <div className="pp-form-risk-footnote">
            {PP_RISK_FOOTNOTE.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="pp-form-preview-sign pp-print-section">
          <div className="pp-form-preview-sign-grid">
            <div>
              <p className="pp-form-field-label" style={{ marginTop: 0 }}>
                Prepared by:
              </p>
              <div className="pp-form-preview-sign-line" />
              <p>{form.contactPerson || form.proponentName}</p>
              <p className="pp-form-note">Proponent / Authorized Representative</p>
            </div>
            <div>
              <p className="pp-form-field-label" style={{ marginTop: 0 }}>
                Date:
              </p>
              <div className="pp-form-preview-sign-line" />
              <p className="pp-form-note">For official use — DOST Regional Office</p>
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
  applicantId?: string,
) {
  void printProjectProposalPdf(form, document, attachments, applicationId, applicantId);
}
