/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 001 printable document (print-only; preview unchanged).
 */

import type { ReactNode } from "react";
import type {
  ProjectProposalAttachment,
  ProjectProposalAttachmentKind,
  ProjectProposalDocumentResponse,
  ProjectProposalForm,
  ProjectProposalRiskRow,
} from "../../api/types";
import {
  PP_BUDGET_COLUMNS,
  PP_BUDGET_NOTE,
  PP_BUSINESS_ACTIVITY_PAIRS,
  PP_EQUIPMENT_COLUMNS,
  PP_EXPECTED_OUTPUT_HEADINGS,
  PP_FABRICATOR_COLUMNS,
  PP_FINANCIAL_ATTACH_NOTE,
  PP_INTERVENTION_COLUMNS,
  PP_INTERVENTION_COST_COLUMNS,
  PP_LIQUIDITY_COLUMNS,
  PP_MSME_SIZES,
  PP_ORGANIZATION_TYPES,
  PP_PRODUCT_PRICE_COLUMNS,
  PP_PROFIT_TYPES,
  PP_RAW_MATERIAL_COLUMNS,
  PP_REFUND_NOTE,
  PP_REGISTRATION_OFFICES,
  PP_RISK_COLUMNS,
  PP_RISK_FOOTNOTE,
  PP_ROI_COLUMNS,
  PP_QUICK_RATIO_COLUMNS,
  PP_SECTION_FINANCIAL,
  PP_SECTION_MARKETING,
  PP_SECTION_PROJECT_BACKGROUND,
  PP_SECTION_RISK,
  PP_SECTION_TECHNOLOGICAL,
  PP_SECTION_WASTE,
  PROJECT_PROPOSAL_TITLE,
  displayValue,
  formatCurrencyDisplay,
  isOptionChecked,
} from "../../constants/projectProposalLayout";
import { PROPOSAL_ATTACHMENT_LABELS } from "../../utils/projectProposal";

export interface ProjectProposalDocumentProps {
  form: ProjectProposalForm;
  document?: ProjectProposalDocumentResponse | null;
  attachments?: ProjectProposalAttachment[];
}

function val(value: unknown): string {
  return displayValue(value);
}

function FormBlock({ children }: { children: ReactNode }) {
  return <div className="pp-form-block pp-print-section">{children}</div>;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="pp-form-section-heading">{children}</h2>;
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="pp-form-subheading">{children}</h3>;
}

function FormTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <table className={`pp-form-table ${className}`}>{children}</table>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="pp-form-field-label">{children}</p>;
}

function FieldValue({ children }: { children: ReactNode }) {
  return <p className="pp-form-field-value">{children}</p>;
}

function NarrativeBlock({ text }: { text: string }) {
  const content = val(text);
  if (!content) return <p className="pp-form-empty">{"\u00a0"}</p>;
  return <p className="pp-form-narrative">{content}</p>;
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span className="pp-form-checkbox" aria-hidden>
      {checked ? "\u2713" : "\u2610"}
    </span>
  );
}

function CheckboxOption({
  label,
  checked,
}: {
  label: string;
  checked: boolean;
}) {
  return (
    <span className="pp-form-checkbox-option">
      <CheckboxMark checked={checked} />
      <span>{label}</span>
    </span>
  );
}

function CheckboxRow({
  options,
  stored,
}: {
  options: readonly string[];
  stored: string;
}) {
  return (
    <div className="pp-form-checkbox-row">
      {options.map((opt) => (
        <CheckboxOption key={opt} label={opt} checked={isOptionChecked(stored, opt)} />
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  const filled = items.map((i) => val(i)).filter(Boolean);
  if (!filled.length) return <p className="pp-form-empty">{"\u00a0"}</p>;
  return (
    <ul className="pp-form-bullet-list">
      {filled.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function CheckBulletList({ items }: { items: string[] }) {
  const filled = items.map((i) => val(i)).filter(Boolean);
  if (!filled.length) return <p className="pp-form-empty">{"\u00a0"}</p>;
  return (
    <ul className="pp-form-check-bullet-list">
      {filled.map((item, i) => (
        <li key={i}>
          <span className="pp-form-check-bullet">{"\u2713"}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function DataTable({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: string[][];
}) {
  const filtered = rows.filter((r) => r.some((c) => val(c)));
  const body =
    filtered.length > 0
      ? filtered
      : [columns.map(() => "")];

  return (
    <FormTable>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, i) => (
          <tr key={i}>
            {columns.map((_, j) => (
              <td key={j}>{val(row[j]) || "\u00a0"}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </FormTable>
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
      <div className="pp-form-attachment-placeholder">
        <p className="pp-form-attachment-label">{label}</p>
      </div>
    );
  }
  const isImage = attachment.mimeType.startsWith("image/");
  return (
    <div className="pp-form-attachment">
      <p className="pp-form-attachment-label">{label}</p>
      {isImage ? (
        <img src={attachment.dataUrl} alt={attachment.fileName} />
      ) : (
        <p className="pp-form-attachment-file">{attachment.fileName}</p>
      )}
    </div>
  );
}

function CoverField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="pp-form-cover-field">
      <span className="pp-form-cover-label">{label}</span>
      <span className="pp-form-cover-value">{val(value) || "\u00a0"}</span>
    </div>
  );
}

function useMergedData(
  form: ProjectProposalForm,
  doc?: ProjectProposalDocumentResponse | null,
) {
  const narrative = (
    field: keyof ProjectProposalForm,
    docField?: keyof ProjectProposalDocumentResponse,
  ) => {
    if (doc && docField && doc[docField]) return String(doc[docField]);
    return String(form[field] ?? "");
  };

  const bullets = (
    formField: keyof ProjectProposalForm,
    docField?: keyof ProjectProposalDocumentResponse,
  ) => {
    if (doc && docField && doc[docField]?.length) {
      return doc[docField] as string[];
    }
    const v = form[formField];
    return Array.isArray(v) ? (v as string[]) : [];
  };

  const riskRows: ProjectProposalRiskRow[] =
    doc?.riskRows?.length ? doc.riskRows : form.riskRows;

  return { narrative, bullets, riskRows };
}

export function ProjectProposalDocument({
  form,
  document: doc,
  attachments = [],
}: ProjectProposalDocumentProps) {
  const { narrative, bullets, riskRows } = useMergedData(form, doc);

  const findAttachment = (kind: ProjectProposalAttachmentKind) =>
    attachments.find((a) => a.kind === kind);

  const male = parseInt(form.employeesMale, 10) || 0;
  const female = parseInt(form.employeesFemale, 10) || 0;
  const totalEmployees = male + female || "";

  const registrationOffice = val(form.registrationOffice);
  const registrationNumber = val(form.registrationNumber);
  const registrationDate = val(form.registrationDate);

  const budgetRows = form.budgetItems
    .filter((b) => b.item.trim() || b.total.trim())
    .map((b) => {
      const totalNum = parseFloat(b.total.replace(/[^\d.]/g, "")) || 0;
      const setupNum = parseFloat(b.setupShare.replace(/[^\d.]/g, "")) || 0;
      const cooperator =
        totalNum > 0 && setupNum >= 0 && totalNum > setupNum
          ? String(totalNum - setupNum)
          : "";
      return [
        b.item,
        b.qty,
        b.unitCost,
        b.total || b.unitCost,
        b.setupShare,
        cooperator,
        b.total,
      ];
    });

  const refundRows =
    form.refundSchedule.length > 1
      ? form.refundSchedule.slice(1)
      : [];

  const refundHeaders =
    form.refundSchedule.length > 0
      ? form.refundSchedule[0]
      : ["Months", "Y1", "Y2", "Y3", "Y4", "Total"];

  const expectedBullets = bullets("expectedOutputBullets", "expectedOutputBullets");

  return (
    <div className="pp-form-document-root">
      <FormBlock>
        <h1 className="pp-form-title">{PROJECT_PROPOSAL_TITLE}</h1>
        <CoverField label="PROJECT TITLE:" value={form.projectTitle} />
        <CoverField label="PROPONENT:" value={form.proponentName} />
        {val(form.proponentAddress) ? (
          <p className="pp-form-cover-address">{val(form.proponentAddress)}</p>
        ) : null}
        <CoverField
          label="PROJECT COST:"
          value={formatCurrencyDisplay(form.projectCost) || form.projectCost}
        />
        <CoverField
          label="AMOUNT REQUESTED:"
          value={formatCurrencyDisplay(form.amountRequested) || form.amountRequested}
        />

        <SubHeading>OBJECTIVES:</SubHeading>
        <FieldLabel>General Objectives:</FieldLabel>
        <NarrativeBlock text={narrative("generalObjective", "generalObjective")} />
        <FieldLabel>Specific Objectives:</FieldLabel>
        <BulletList items={bullets("specificObjectives", "specificObjectives")} />
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_PROJECT_BACKGROUND}</SectionHeading>
        <SubHeading>A. Company Profile:</SubHeading>
        <FormTable className="pp-form-profile-table">
          <tbody>
            <tr>
              <td className="pp-form-label">Name of Firm</td>
              <td className="pp-form-value">{val(form.firmName) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="pp-form-label">Address</td>
              <td className="pp-form-value">{val(form.firmAddress) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="pp-form-label">Contact Person</td>
              <td className="pp-form-value">{val(form.contactPerson) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="pp-form-label">Contact No.</td>
              <td className="pp-form-value">{val(form.contactNumber) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="pp-form-label">e-mail Address</td>
              <td className="pp-form-value">{val(form.email) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="pp-form-label">Year established</td>
              <td className="pp-form-value">{val(form.yearEstablished) || "\u00a0"}</td>
            </tr>
          </tbody>
        </FormTable>

        <p className="pp-form-instruction">
          Type of Organization (please check appropriate box in each row)
        </p>
        <CheckboxRow options={PP_ORGANIZATION_TYPES} stored={form.organizationType} />
        <CheckboxRow options={PP_PROFIT_TYPES} stored={form.profitType} />
        <CheckboxRow options={PP_MSME_SIZES} stored={form.msmeSize} />

        <p className="pp-form-instruction">
          Number of Employee (Please indicate number of employee)
        </p>
        <FormTable>
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
              <td>Direct Workers</td>
              <td className="pp-form-center">{val(form.employeesMale) || "\u00a0"}</td>
              <td className="pp-form-center">{val(form.employeesFemale) || "\u00a0"}</td>
              <td className="pp-form-center">{val(form.employeesDirect) || "\u00a0"}</td>
            </tr>
            <tr>
              <td>Indirect/Contract Workers</td>
              <td className="pp-form-center">{"\u00a0"}</td>
              <td className="pp-form-center">{"\u00a0"}</td>
              <td className="pp-form-center">{val(form.employeesIndirect) || "\u00a0"}</td>
            </tr>
            <tr>
              <td>Total</td>
              <td className="pp-form-center">{male || "\u00a0"}</td>
              <td className="pp-form-center">{female || "\u00a0"}</td>
              <td className="pp-form-center">{totalEmployees || "\u00a0"}</td>
            </tr>
          </tbody>
        </FormTable>

        <FormTable className="pp-form-registration-table">
          <thead>
            <tr>
              <th>Registration Office</th>
              <th>Registration Number</th>
              <th>Date of Registration</th>
            </tr>
          </thead>
          <tbody>
            {PP_REGISTRATION_OFFICES.map((office) => {
              const isMatch = isOptionChecked(registrationOffice, office);
              const isOthers = office.startsWith("Others");
              return (
                <tr key={office}>
                  <td>
                    <CheckboxOption label={office} checked={isMatch} />
                    {isOthers && val(form.registrationOffice) && !isMatch
                      ? ` ${val(form.registrationOffice)}`
                      : null}
                  </td>
                  <td>{isMatch ? registrationNumber || "\u00a0" : "\u00a0"}</td>
                  <td>{isMatch ? registrationDate || "\u00a0" : "\u00a0"}</td>
                </tr>
              );
            })}
          </tbody>
        </FormTable>

        <FormTable className="pp-form-profile-table">
          <tbody>
            <tr>
              <td className="pp-form-label">Business Permit</td>
              <td className="pp-form-value">{val(form.businessPermitNumber) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="pp-form-label">{"\u00a0"}</td>
              <td className="pp-form-value">{val(form.businessPermitDate) || "\u00a0"}</td>
            </tr>
          </tbody>
        </FormTable>

        <p className="pp-form-instruction">
          Business Activity/ies: (please check appropriate box)
        </p>
        <div className="pp-form-activity-grid">
          {PP_BUSINESS_ACTIVITY_PAIRS.map(([left, right], i) => (
            <div key={i} className="pp-form-activity-row">
              <CheckboxOption
                label={left}
                checked={isOptionChecked(form.businessActivity, left)}
              />
              <CheckboxOption
                label={right}
                checked={isOptionChecked(form.businessActivity, right)}
              />
            </div>
          ))}
        </div>
        {val(form.prioritySectorSpecify) ? (
          <p className="pp-form-priority-specify">
            {val(form.prioritySectorSpecify)}
          </p>
        ) : null}

        <FormTable className="pp-form-profile-table">
          <tbody>
            <tr>
              <td className="pp-form-label">Products/Services</td>
              <td className="pp-form-value">{val(form.productsServices) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="pp-form-label">Brief Enterprise Background</td>
              <td className="pp-form-value pp-form-narrative-cell">
                {val(narrative("enterpriseBackground", "enterpriseBackground")) || "\u00a0"}
              </td>
            </tr>
          </tbody>
        </FormTable>
      </FormBlock>

      <FormBlock>
        <SubHeading>B. Management/Administrative Aspect</SubHeading>
        <p className="pp-form-numbered-label">1. Organizational chart</p>
        <AttachmentFigure
          attachment={findAttachment("orgChart")}
          label={PROPOSAL_ATTACHMENT_LABELS.orgChart}
        />
        <p className="pp-form-numbered-label">
          2. Skills and expertise of employee/owner (proponent)
        </p>
        <NarrativeBlock text={narrative("skillsExpertise", "skillsExpertise")} />
        <p className="pp-form-numbered-label">3. Compensation</p>
        <NarrativeBlock text={form.compensation} />
      </FormBlock>

      <FormBlock>
        <SubHeading>C. Plant site or location (including vicinity map)</SubHeading>
        <NarrativeBlock text={narrative("plantSiteNarrative", "plantSiteNarrative")} />
        <AttachmentFigure
          attachment={findAttachment("vicinityMap")}
          label={PROPOSAL_ATTACHMENT_LABELS.vicinityMap}
        />
      </FormBlock>

      <FormBlock>
        <SubHeading>D. Capacity, volume and cost of production</SubHeading>
        <NarrativeBlock
          text={narrative("capacityVolumeNarrative", "capacityVolumeNarrative")}
        />
        <SubHeading>E. Raw material/s used and sources of raw material</SubHeading>
        <NarrativeBlock text={narrative("rawMaterialsNarrative", "rawMaterialsNarrative")} />
        <DataTable
          columns={PP_RAW_MATERIAL_COLUMNS}
          rows={form.rawMaterialsTable}
        />
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_MARKETING}</SectionHeading>
        <SubHeading>A. Market situation, product demand and supply</SubHeading>
        <NarrativeBlock text={narrative("marketSituation", "marketSituation")} />
        <NarrativeBlock text={narrative("productDemandSupply", "productDemandSupply")} />
        <FieldLabel>Product specifications and product price</FieldLabel>
        <DataTable
          columns={PP_PRODUCT_PRICE_COLUMNS}
          rows={form.productPriceTable}
        />
        <SubHeading>B. Distribution channel (local/export)</SubHeading>
        <NarrativeBlock text={narrative("distributionChannel", "distributionChannel")} />
        <SubHeading>C. Competitors</SubHeading>
        <NarrativeBlock text={narrative("competitors", "competitors")} />
        <FieldLabel>Existing problems (if any)</FieldLabel>
        <NarrativeBlock text={narrative("interventionProblem", "interventionProblem")} />
        <SubHeading>D. Market plans/strategies</SubHeading>
        <CheckBulletList items={bullets("marketStrategies", "marketStrategies")} />
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_TECHNOLOGICAL}</SectionHeading>
        <SubHeading>A. Production Process</SubHeading>
        <FieldLabel>- Process Flow of Production</FieldLabel>
        <NarrativeBlock text={narrative("productionProcess", "productionProcess")} />
        <SubHeading>B. Existing Production Equipment</SubHeading>
        <NarrativeBlock text={narrative("equipmentNarrative", "equipmentNarrative")} />
        <DataTable columns={PP_EQUIPMENT_COLUMNS} rows={form.equipmentTable} />
        <SubHeading>
          C. Technical constraints on the production line and proposed S&T intervention
        </SubHeading>
        <FormTable className="pp-form-intervention-table">
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
        </FormTable>
        <FieldLabel>Proposed Plant Lay-out</FieldLabel>
        <AttachmentFigure
          attachment={findAttachment("plantLayout")}
          label={PROPOSAL_ATTACHMENT_LABELS.plantLayout}
        />
        <SubHeading>D. Cost and specification of S&T Intervention-Related Equipment</SubHeading>
        <DataTable
          columns={PP_INTERVENTION_COST_COLUMNS}
          rows={form.interventionCostTable}
        />
        <SubHeading>E. List of equipment fabricators (name and address)</SubHeading>
        <DataTable columns={PP_FABRICATOR_COLUMNS} rows={form.fabricatorTable} />
        <SubHeading>F. Schedule of activities for the proposed project</SubHeading>
        <DataTable
          columns={["Activity", "Timeline"]}
          rows={form.scheduleTable}
        />
        <SubHeading>G. Expected Output/Impact (measured results)</SubHeading>
        {PP_EXPECTED_OUTPUT_HEADINGS.map((heading, i) => (
          <div key={heading} className="pp-form-expected-output">
            <p className="pp-form-expected-heading">
              {i + 1}. {heading}
            </p>
            <NarrativeBlock text={expectedBullets[i] ?? ""} />
          </div>
        ))}
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_WASTE}</SectionHeading>
        <NarrativeBlock text={narrative("wasteManagement", "wasteManagement")} />
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_FINANCIAL}</SectionHeading>
        <SubHeading>A. Financial capacity</SubHeading>
        <FieldLabel>Financial ratio and analysis</FieldLabel>
        <p className="pp-form-ratio-intro">
          Liquidity ratios measure the short-term ability of the company to pay its maturing
          obligation and to meet unexpected needs for cash.
        </p>
        <FieldLabel>Liquidity Ratio</FieldLabel>
        <DataTable columns={PP_LIQUIDITY_COLUMNS} rows={form.liquidityRatioTable} />
        <FieldLabel>Quick Ratio (Acid Test Ratio)</FieldLabel>
        <DataTable columns={PP_QUICK_RATIO_COLUMNS} rows={form.quickRatioTable} />
        <FieldLabel>Return on Investment</FieldLabel>
        <DataTable columns={PP_ROI_COLUMNS} rows={form.roiTable} />
        <NarrativeBlock text={narrative("financialAnalysis", "financialAnalysis")} />
        <SubHeading>B. Financial constraints</SubHeading>
        <FieldValue>{form.financialConstraintsNote || PP_FINANCIAL_ATTACH_NOTE}</FieldValue>
        <SubHeading>C. Cash flow/ financial statement/ balance sheet</SubHeading>
        <FieldValue>{PP_FINANCIAL_ATTACH_NOTE}</FieldValue>
        <SubHeading>D. Budgetary Requirement for the proposed project</SubHeading>
        <DataTable columns={PP_BUDGET_COLUMNS} rows={budgetRows} />
        <p className="pp-form-note">{PP_BUDGET_NOTE}</p>
        <SubHeading>E. Proposed Refund Schedule</SubHeading>
        <FormTable>
          <thead>
            <tr>
              {refundHeaders.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(refundRows.length ? refundRows : [refundHeaders.map(() => "")]).map(
              (row, i) => (
                <tr key={i}>
                  {refundHeaders.map((_, j) => (
                    <td key={j}>{val(row[j]) || "\u00a0"}</td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </FormTable>
        <p className="pp-form-note">{PP_REFUND_NOTE}</p>
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_RISK}</SectionHeading>
        <FormTable>
          <thead>
            <tr>
              {PP_RISK_COLUMNS.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(riskRows.length ? riskRows : [{ risk: "", assumption: "", plan: "" }]).map(
              (row) => (
                <tr key={row.id}>
                  <td>{val(row.risk) || "\u00a0"}</td>
                  <td>{val(row.assumption) || "\u00a0"}</td>
                  <td>{val(row.plan) || "\u00a0"}</td>
                </tr>
              ),
            )}
          </tbody>
        </FormTable>
        <div className="pp-form-risk-footnote">
          {PP_RISK_FOOTNOTE.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </FormBlock>
    </div>
  );
}
