/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 001 printable document. On-screen preview uses the same
 * indent classes and section order without mounting this component.
 */

import type { ReactNode } from "react";
import type {
  FinancialProjectionSnapshot,
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
  PP_COMPENSATION_COLUMNS,
  PP_EMPLOYEE_ROWS,
  PP_EMPLOYEE_TABLE_CAPTION,
  PP_EQUIPMENT_COLUMNS,
  PP_EXPECTED_OUTPUT_HEADINGS,
  PP_FINANCIAL_CAPACITY_DASH_ITEMS,
  PP_FORM_INDENT_CLASS,
  PP_FABRICATOR_COLUMNS,
  PP_FINANCIAL_ATTACH_NOTE,
  PP_FINANCIAL_SUBHEADINGS,
  PP_INTERVENTION_COLUMNS,
  PP_INTERVENTION_COST_COLUMNS,
  PP_LIQUIDITY_COLUMNS,
  PP_MARKETING_A_LABELS,
  PP_MARKETING_SUBHEADINGS,
  PP_MSME_SIZES,
  PP_NPM_COLUMNS,
  PP_ORGANIZATION_INSTRUCTION,
  PP_ORGANIZATION_TYPES,
  PP_ORG_MEDIUM_COLSPAN,
  PP_ORG_NONPROFIT_COLSPAN,
  PP_PRODUCT_PRICE_COLUMNS,
  PP_PRODUCTION_DASH_ITEMS,
  PP_PROFIT_TYPES,
  PP_RAW_MATERIAL_ALLOCATION_COLUMNS,
  PP_RAW_MATERIAL_COLUMNS,
  PP_RAW_MATERIAL_COST_COLUMNS,
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
  PP_SUBHEADING_CAPACITY,
  PP_VOLUME_OF_ORDERS_COLUMNS,
  PP_WASTE_SUBHEADINGS,
  PROJECT_PROPOSAL_TITLE,
  companyProfileEmployeeTotals,
  displayValue,
  formatCurrencyDisplay,
  isOptionChecked,
  isRegistrationOfficeChecked,
} from "../../constants/projectProposalLayout";
import {
  buildInvestmentDecisionAnalysis,
  compensationTableFooterRow,
  existingEquipmentFooterRow,
  formatRiskAndAssumptions,
  PROPOSAL_ATTACHMENT_LABELS,
  rawMaterialAllocationFooterRow,
  rawMaterialCostFooterRow,
  toBudgetPrintRow,
} from "../../utils/projectProposal";
import { snapshotStatementTables } from "../../utils/financialProjection";
import { StoredFileImage } from "../StoredFilePreview";
import { isImageFile } from "../../utils/storedFilePreview";
import { ScheduleGanttTable } from "./ScheduleGanttTable";
import { InvestmentDecisionAnalysisTable } from "./InvestmentDecisionAnalysisTable";

export interface ProjectProposalDocumentProps {
  form: ProjectProposalForm;
  document?: ProjectProposalDocumentResponse | null;
  attachments?: ProjectProposalAttachment[];
  applicantId?: string;
  projectionSnapshot?: FinancialProjectionSnapshot | null;
}

function val(value: unknown): string {
  return displayValue(value);
}

function FormBlock({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`pp-form-block pp-print-section ${className}`.trim()}>
      {children}
    </div>
  );
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

function DashLabel({ children }: { children: ReactNode }) {
  return <p className="pp-form-dash-label">- {children}</p>;
}

function NumberedLabel({ children }: { children: ReactNode }) {
  return <p className="pp-form-numbered-label">{children}</p>;
}

function FieldValue({ children }: { children: ReactNode }) {
  return <p className="pp-form-field-value">{children}</p>;
}

function NarrativeBlock({ text }: { text: string }) {
  const content = val(text).trim();
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

function ProfileFieldRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <tr>
      <td className="pp-form-label">{label}</td>
      <td className={`pp-form-value ${valueClassName}`.trim()} colSpan={8}>
        {value || "\u00a0"}
      </td>
    </tr>
  );
}

function CheckCell({ checked }: { checked: boolean }) {
  return (
    <td className="pp-form-check-cell">
      <CheckboxMark checked={checked} />
    </td>
  );
}

function EmployeeCountRow({
  label,
  male,
  female,
  total,
  indent = false,
}: {
  label: string;
  male: string;
  female: string;
  total: string;
  indent?: boolean;
}) {
  return (
    <tr>
      <td className={indent ? "pp-form-subrow" : undefined} colSpan={2}>
        {label}
      </td>
      <td className="pp-form-center" colSpan={2}>
        {male}
      </td>
      <td className="pp-form-center" colSpan={2}>
        {female}
      </td>
      <td className="pp-form-center" colSpan={2}>
        {total}
      </td>
    </tr>
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

function headerLabel(text: string) {
  const parts = text.split("/");
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <span key={`${part}-${i}`}>
      {i > 0 ? (
        <>
          /<wbr />
        </>
      ) : null}
      {part}
    </span>
  ));
}

function cellClass(colIndex: number, numericCols: readonly number[]): string | undefined {
  const classes: string[] = [];
  if (colIndex === 0) classes.push("pp-form-particulars");
  if (numericCols.includes(colIndex)) classes.push("pp-form-num");
  return classes.length ? classes.join(" ") : undefined;
}

function DataTable({
  columns,
  rows,
  footerRow,
  className = "",
  numericCols = [],
}: {
  columns: readonly string[];
  rows: string[][];
  footerRow?: readonly string[];
  className?: string;
  numericCols?: readonly number[];
}) {
  const filtered = rows.filter((r) => r.some((c) => val(c)));
  const body =
    filtered.length > 0
      ? filtered
      : [columns.map(() => "")];

  return (
    <FormTable className={className}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{headerLabel(col)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, i) => (
          <tr key={i}>
            {columns.map((_, j) => (
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
            {columns.map((_, j) => (
              <td key={j} className={cellClass(j, numericCols)}>
                {val(footerRow[j]) || "\u00a0"}
              </td>
            ))}
          </tr>
        </tfoot>
      ) : null}
    </FormTable>
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
    if (doc && docField) {
      const docValue = doc[docField];
      if (Array.isArray(docValue) && docValue.length) {
        return docValue as string[];
      }
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
  applicantId,
  projectionSnapshot,
}: ProjectProposalDocumentProps) {
  const { narrative, bullets, riskRows } = useMergedData(form, doc);
  const projTables = projectionSnapshot
    ? snapshotStatementTables(projectionSnapshot)
    : null;

  const findAttachment = (kind: ProjectProposalAttachmentKind) =>
    attachments.find((a) => a.kind === kind);

  const emp = companyProfileEmployeeTotals(form);
  const cell = (n: number | string) =>
    n === 0 || n === "" ? "\u00a0" : String(n);

  const registrationOffice = val(form.registrationOffice);
  const registrationNumber = val(form.registrationNumber);
  const registrationDate = val(form.registrationDate);

  const budgetRows = form.budgetItems
    .filter((b) => b.item.trim() || b.total.trim())
    .map((b) => toBudgetPrintRow(b));

  const refundRows =
    form.refundSchedule.length > 1
      ? form.refundSchedule.slice(1)
      : [];

  const refundHeaders =
    form.refundSchedule.length > 0
      ? form.refundSchedule[0]
      : ["Months", "Y1", "Y2", "Y3", "Y4", "Y5", "Total"];

  const expectedBullets = bullets("expectedOutputBullets", "expectedOutputBullets");
  const wasteVolume = narrative("wasteVolumeMonthly", "wasteVolumeMonthly");
  const wasteKindsText = narrative("wasteKinds", "wasteKinds");
  const wasteMethods = narrative("wasteDisposalMethods", "wasteDisposalMethods");
  const wasteCombined = narrative("wasteManagement", "wasteManagement");
  const hasSplitWaste = Boolean(wasteVolume || wasteKindsText || wasteMethods);

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

        <Indent level={1}>
          <SubHeading>OBJECTIVES:</SubHeading>
        </Indent>
        <Indent level={2}>
          <FieldLabel>General Objectives:</FieldLabel>
          <NarrativeBlock text={narrative("generalObjective", "generalObjective")} />
          <FieldLabel>Specific Objectives:</FieldLabel>
          <BulletList items={bullets("specificObjectives", "specificObjectives")} />
        </Indent>
      </FormBlock>

      <FormBlock className="pp-form-company-block">
        <SectionHeading>{PP_SECTION_PROJECT_BACKGROUND}</SectionHeading>
        <Indent level={1}>
          <SubHeading>A. Company Profile:</SubHeading>
        </Indent>
        <FormTable className="pp-form-company-profile">
          <colgroup>
            <col className="pp-form-profile-col-label" />
            {Array.from({ length: 8 }, (_, i) => (
              <col key={i} className="pp-form-profile-col-grid" />
            ))}
          </colgroup>
          <tbody>
            <ProfileFieldRow label="Name of Firm" value={val(form.firmName)} />
            <ProfileFieldRow label="Address" value={val(form.firmAddress)} />
            <ProfileFieldRow label="Contact Person" value={val(form.contactPerson)} />
            <ProfileFieldRow label="Contact No." value={val(form.contactNumber)} />
            <ProfileFieldRow label="e-mail Address" value={val(form.email)} />
            <ProfileFieldRow
              label="Year established"
              value={val(form.yearEstablished)}
            />
            <ProfileFieldRow
              label="Business Permit"
              value={val(form.businessPermitNumber)}
            />
            <ProfileFieldRow label={"\u00a0"} value={val(form.businessPermitDate)} />

            <tr>
              <td className="pp-form-merged-label" rowSpan={3}>
                {PP_ORGANIZATION_INSTRUCTION}
              </td>
              {PP_ORGANIZATION_TYPES.map((opt) => [
                <CheckCell
                  key={`${opt}-check`}
                  checked={isOptionChecked(form.organizationType, opt)}
                />,
                <td key={opt}>{opt}</td>,
              ])}
            </tr>
            <tr>
              <CheckCell
                checked={isOptionChecked(form.profitType, PP_PROFIT_TYPES[0])}
              />
              <td>{PP_PROFIT_TYPES[0]}</td>
              <CheckCell
                checked={isOptionChecked(form.profitType, PP_PROFIT_TYPES[1])}
              />
              <td colSpan={PP_ORG_NONPROFIT_COLSPAN}>{PP_PROFIT_TYPES[1]}</td>
            </tr>
            <tr>
              <CheckCell checked={isOptionChecked(form.msmeSize, PP_MSME_SIZES[0])} />
              <td>{PP_MSME_SIZES[0]}</td>
              <CheckCell checked={isOptionChecked(form.msmeSize, PP_MSME_SIZES[1])} />
              <td>{PP_MSME_SIZES[1]}</td>
              <CheckCell checked={isOptionChecked(form.msmeSize, PP_MSME_SIZES[2])} />
              <td colSpan={PP_ORG_MEDIUM_COLSPAN}>{PP_MSME_SIZES[2]}</td>
            </tr>

            <tr>
              <td className="pp-form-merged-label" rowSpan={6}>
                {PP_EMPLOYEE_TABLE_CAPTION}
              </td>
              <td className="pp-form-inner-head" colSpan={2}>
                Type of Employment
              </td>
              <td className="pp-form-inner-head" colSpan={2}>
                Male
              </td>
              <td className="pp-form-inner-head" colSpan={2}>
                Female
              </td>
              <td className="pp-form-inner-head" colSpan={2}>
                Total
              </td>
            </tr>
            <EmployeeCountRow
              label={PP_EMPLOYEE_ROWS[0].label}
              male={"\u00a0"}
              female={"\u00a0"}
              total={"\u00a0"}
            />
            <EmployeeCountRow
              label={PP_EMPLOYEE_ROWS[1].label}
              male={cell(emp.productionMale)}
              female={cell(emp.productionFemale)}
              total={cell(emp.productionTotal)}
              indent
            />
            <EmployeeCountRow
              label={PP_EMPLOYEE_ROWS[2].label}
              male={cell(emp.nonProductionMale)}
              female={cell(emp.nonProductionFemale)}
              total={cell(emp.nonProductionTotal)}
              indent
            />
            <EmployeeCountRow
              label={PP_EMPLOYEE_ROWS[3].label}
              male={val(form.employeesIndirectMale) || "\u00a0"}
              female={val(form.employeesIndirectFemale) || "\u00a0"}
              total={cell(emp.indirectTotal)}
            />
            <EmployeeCountRow
              label={PP_EMPLOYEE_ROWS[4].label}
              male={cell(emp.totalMale)}
              female={cell(emp.totalFemale)}
              total={cell(emp.total)}
            />

            <tr>
              <td className="pp-form-merged-label" rowSpan={6}>
                Registration
              </td>
              <td className="pp-form-inner-head" colSpan={2}>
                Office
              </td>
              <td className="pp-form-inner-head" colSpan={4}>
                Registration Number
              </td>
              <td className="pp-form-inner-head" colSpan={2}>
                Date of Registration
              </td>
            </tr>
            {PP_REGISTRATION_OFFICES.map((office) => {
              const isMatch = isRegistrationOfficeChecked(
                registrationOffice,
                office,
              );
              const isOthers = office.startsWith("Others");
              return (
                <tr key={office}>
                  <td colSpan={2}>
                    <CheckboxOption label={office} checked={isMatch} />
                    {isOthers && isMatch ? ` ${registrationOffice}` : null}
                  </td>
                  <td colSpan={4}>
                    {isMatch ? registrationNumber || "\u00a0" : "\u00a0"}
                  </td>
                  <td colSpan={2}>
                    {isMatch ? registrationDate || "\u00a0" : "\u00a0"}
                  </td>
                </tr>
              );
            })}

            {PP_BUSINESS_ACTIVITY_PAIRS.map(([left, right]) => {
              const isRdc = right.startsWith("Other regional priority");
              return (
                <tr key={left}>
                  <td>{"\u00a0"}</td>
                  <CheckCell
                    checked={isOptionChecked(form.businessActivity, left)}
                  />
                  <td colSpan={3}>{left}</td>
                  <CheckCell
                    checked={isOptionChecked(form.businessActivity, right)}
                  />
                  <td colSpan={3}>
                    {right}
                    {isRdc && val(form.prioritySectorSpecify)
                      ? ` ${val(form.prioritySectorSpecify)}`
                      : null}
                  </td>
                </tr>
              );
            })}

            <ProfileFieldRow
              label="Products/Services"
              value={val(form.productsServices)}
            />
            <ProfileFieldRow
              label="Brief Enterprise Background"
              value={val(narrative("enterpriseBackground", "enterpriseBackground"))}
              valueClassName="pp-form-narrative-cell"
            />
          </tbody>
        </FormTable>
      </FormBlock>

      <FormBlock>
        <Indent level={1}>
          <SubHeading>B. Management/Administrative Aspect</SubHeading>
        </Indent>
        <Indent level={2}>
          <NumberedLabel>1. Organizational chart</NumberedLabel>
          <AttachmentFigure
            attachment={findAttachment("orgChart")}
            label={PROPOSAL_ATTACHMENT_LABELS.orgChart}
            applicantId={applicantId}
          />
          <NumberedLabel>
            2. Skills and expertise of employee/owner (proponent)
          </NumberedLabel>
          <NarrativeBlock text={narrative("skillsExpertise", "skillsExpertise")} />
          <NumberedLabel>3. Compensation</NumberedLabel>
          <DataTable
            className="pp-form-compensation-table"
            columns={PP_COMPENSATION_COLUMNS}
            rows={form.compensationTable ?? []}
            footerRow={compensationTableFooterRow(form.compensationTable)}
            numericCols={[1, 2, 3, 4, 5, 6]}
          />
          {form.compensation?.trim() ? (
            <NarrativeBlock text={form.compensation} />
          ) : null}
          <NumberedLabel>
            4. Gender and Development (GAD) — Participation and Involvement
          </NumberedLabel>
          <NarrativeBlock text={narrative("genderInvolvement", "genderInvolvement")} />
        </Indent>
      </FormBlock>

      <FormBlock>
        <Indent level={1}>
          <SubHeading>C. Plant site or location (including vicinity map)</SubHeading>
          <NarrativeBlock text={narrative("plantSiteNarrative", "plantSiteNarrative")} />
          <AttachmentFigure
            attachment={findAttachment("vicinityMap")}
            label={PROPOSAL_ATTACHMENT_LABELS.vicinityMap}
            applicantId={applicantId}
          />
        </Indent>
      </FormBlock>

      <FormBlock>
        <Indent level={1}>
          <SubHeading>D. {PP_SUBHEADING_CAPACITY}</SubHeading>
          <NarrativeBlock
            text={narrative("capacityVolumeNarrative", "capacityVolumeNarrative")}
          />
        </Indent>
        <Indent level={2}>
          <FieldLabel>Raw Material Cost</FieldLabel>
          <DataTable
            className="pp-form-rm-cost-table"
            columns={PP_RAW_MATERIAL_COST_COLUMNS}
            rows={form.rawMaterialCostTable ?? []}
            footerRow={rawMaterialCostFooterRow(form.rawMaterialCostTable)}
            numericCols={[1, 3, 4, 5, 6, 7, 8]}
          />
          <FieldLabel>Raw Materials Allocation</FieldLabel>
          <DataTable
            className="pp-form-rm-alloc-table"
            columns={PP_RAW_MATERIAL_ALLOCATION_COLUMNS}
            rows={form.rawMaterialAllocationTable ?? []}
            footerRow={rawMaterialAllocationFooterRow(form.rawMaterialAllocationTable)}
            numericCols={[1, 2]}
          />
        </Indent>
        <Indent level={1}>
          <SubHeading>E. Raw material/s used and sources of raw material</SubHeading>
          <NarrativeBlock text={narrative("rawMaterialsNarrative", "rawMaterialsNarrative")} />
          <DataTable
            columns={PP_RAW_MATERIAL_COLUMNS}
            rows={form.rawMaterialsTable}
          />
        </Indent>
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_MARKETING}</SectionHeading>
        <Indent level={1}>
          <SubHeading>{PP_MARKETING_SUBHEADINGS.A}</SubHeading>
        </Indent>
        <Indent level={2}>
          <FieldLabel>{PP_MARKETING_A_LABELS.marketSituation}</FieldLabel>
          <NarrativeBlock text={narrative("marketSituation", "marketSituation")} />
          <FieldLabel>{PP_MARKETING_A_LABELS.productDemand}</FieldLabel>
          <NarrativeBlock text={narrative("productDemandSupply", "productDemandSupply")} />
          <FieldLabel>{PP_MARKETING_A_LABELS.volumeOfOrders}</FieldLabel>
          <DataTable
            columns={PP_VOLUME_OF_ORDERS_COLUMNS}
            rows={form.volumeOfOrdersTable}
          />
        </Indent>
        <Indent level={1}>
          <SubHeading>{PP_MARKETING_SUBHEADINGS.B}</SubHeading>
          <DataTable
            columns={PP_PRODUCT_PRICE_COLUMNS}
            rows={form.productPriceTable}
            numericCols={[1]}
          />
          <SubHeading>{PP_MARKETING_SUBHEADINGS.C}</SubHeading>
          <NarrativeBlock text={narrative("distributionChannel", "distributionChannel")} />
          <SubHeading>{PP_MARKETING_SUBHEADINGS.D}</SubHeading>
          <NarrativeBlock text={narrative("competitors", "competitors")} />
          <SubHeading>{PP_MARKETING_SUBHEADINGS.E}</SubHeading>
          <NarrativeBlock
            text={narrative("existingMarketingProblems", "existingMarketingProblems")}
          />
          <SubHeading>{PP_MARKETING_SUBHEADINGS.F}</SubHeading>
          <CheckBulletList items={bullets("marketStrategies", "marketStrategies")} />
        </Indent>
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_TECHNOLOGICAL}</SectionHeading>
        <Indent level={1}>
          <SubHeading>A. Production Process</SubHeading>
        </Indent>
        <Indent level={3}>
          <DashLabel>{PP_PRODUCTION_DASH_ITEMS[0]}</DashLabel>
          <NarrativeBlock text={narrative("productionProcess", "productionProcess")} />
          <DashLabel>{PP_PRODUCTION_DASH_ITEMS[1]}</DashLabel>
          <NarrativeBlock text={narrative("materialBalance", "materialBalance")} />
        </Indent>
        <Indent level={1}>
          <SubHeading>B. Existing production equipment</SubHeading>
          <NarrativeBlock text={narrative("equipmentNarrative", "equipmentNarrative")} />
          <DataTable
            className="pp-form-equipment-table"
            columns={PP_EQUIPMENT_COLUMNS}
            rows={form.equipmentTable}
            footerRow={existingEquipmentFooterRow(form.equipmentTable)}
            numericCols={[1, 2, 3, 4, 5, 6, 7, 8]}
          />
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
        </Indent>
        <Indent level={2}>
          <FieldLabel>Proposed Plant Lay-out</FieldLabel>
          <AttachmentFigure
            attachment={findAttachment("plantLayout")}
            label={PROPOSAL_ATTACHMENT_LABELS.plantLayout}
            applicantId={applicantId}
          />
        </Indent>
        <Indent level={1}>
          <SubHeading>D. Cost and specification of S&T Intervention-Related Equipment</SubHeading>
          <DataTable
            columns={PP_INTERVENTION_COST_COLUMNS}
            rows={form.interventionCostTable}
            numericCols={[1, 2, 3]}
          />
          <SubHeading>E. List of equipment fabricators (name and address)</SubHeading>
          <DataTable columns={PP_FABRICATOR_COLUMNS} rows={form.fabricatorTable} />
          <SubHeading>F. Schedule of activities for the proposed project</SubHeading>
          <ScheduleGanttTable rows={form.scheduleTable} />
          <SubHeading>G. Expected Output/Impact (measured results)</SubHeading>
        </Indent>
        {PP_EXPECTED_OUTPUT_HEADINGS.map((heading, i) => (
          <Indent level={3} key={heading}>
            <div className="pp-form-expected-output">
              <p className="pp-form-expected-heading">
                {i + 1}. {heading}
              </p>
              <NarrativeBlock text={expectedBullets[i] ?? ""} />
            </div>
          </Indent>
        ))}
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_WASTE}</SectionHeading>
        <Indent level={1}>
          <SubHeading>{PP_WASTE_SUBHEADINGS.A}</SubHeading>
          <NarrativeBlock text={wasteVolume || (!hasSplitWaste ? wasteCombined : "")} />
          <SubHeading>{PP_WASTE_SUBHEADINGS.B}</SubHeading>
          <NarrativeBlock text={wasteKindsText} />
          <SubHeading>{PP_WASTE_SUBHEADINGS.C}</SubHeading>
          <NarrativeBlock text={wasteMethods} />
        </Indent>
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_FINANCIAL}</SectionHeading>
        <Indent level={1}>
          <SubHeading>A. Financial capacity</SubHeading>
        </Indent>
        <Indent level={3}>
          <DashLabel>{PP_FINANCIAL_CAPACITY_DASH_ITEMS[0]}</DashLabel>
          <p className="pp-form-ratio-intro">
            Liquidity ratios measure the short-term ability of the company to pay its maturing
            obligation and to meet unexpected needs for cash.
          </p>
          <DashLabel>{PP_FINANCIAL_CAPACITY_DASH_ITEMS[1]}</DashLabel>
          <NarrativeBlock text={narrative("partialBudgetAnalysis", "partialBudgetAnalysis")} />
          <DashLabel>{PP_FINANCIAL_CAPACITY_DASH_ITEMS[2]}</DashLabel>
          <DataTable columns={PP_NPM_COLUMNS} rows={form.netProfitMarginTable ?? []} numericCols={[1, 2, 3]} />
          <DashLabel>{PP_FINANCIAL_CAPACITY_DASH_ITEMS[3]}</DashLabel>
          <DataTable columns={PP_LIQUIDITY_COLUMNS} rows={form.liquidityRatioTable} numericCols={[1, 2, 3]} />
          <FieldLabel>Quick Ratio (Acid Test Ratio)</FieldLabel>
          <DataTable columns={PP_QUICK_RATIO_COLUMNS} rows={form.quickRatioTable} numericCols={[1, 2, 3, 4]} />
          <DashLabel>{PP_FINANCIAL_CAPACITY_DASH_ITEMS[4]}</DashLabel>
          <DataTable columns={PP_ROI_COLUMNS} rows={form.roiTable} numericCols={[1, 2, 3]} />
          <NarrativeBlock text={narrative("financialAnalysis", "financialAnalysis")} />
        </Indent>
        <Indent level={1}>
          <SubHeading>B. Financial constraints</SubHeading>
          <FieldValue>{form.financialConstraintsNote || PP_FINANCIAL_ATTACH_NOTE}</FieldValue>
          <SubHeading>C. Cash flow/ financial statement/ balance sheet</SubHeading>
          {!projTables ? (
            <FieldValue>{PP_FINANCIAL_ATTACH_NOTE}</FieldValue>
          ) : null}
        </Indent>
        {projTables ? (
          <Indent level={2}>
            <FieldLabel>Income Statement (Years 1–5)</FieldLabel>
            <DataTable
              className="pp-form-projection-table"
              columns={projTables.income[0] ?? []}
              rows={projTables.income.slice(1)}
            />
            <FieldLabel>Cash Flow (Years 1–5)</FieldLabel>
            <DataTable
              className="pp-form-projection-table"
              columns={projTables.cashFlow[0] ?? []}
              rows={projTables.cashFlow.slice(1)}
            />
            <FieldLabel>Balance Sheet (end of year)</FieldLabel>
            <DataTable
              className="pp-form-projection-table"
              columns={projTables.balance[0] ?? []}
              rows={projTables.balance.slice(1)}
            />
          </Indent>
        ) : null}
        <Indent level={1}>
          <SubHeading>D. Budgetary Requirement for the proposed project</SubHeading>
          <DataTable
            className="pp-form-budget-table"
            columns={PP_BUDGET_COLUMNS}
            rows={budgetRows}
            numericCols={[1, 2, 3, 4, 5, 6, 7]}
          />
          <p className="pp-form-note">{PP_BUDGET_NOTE}</p>
          <SubHeading>E. Proposed Refund Schedule</SubHeading>
          <FormTable className="pp-form-refund-table">
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
                      <td key={j} className={j === 0 ? undefined : "pp-form-num"}>
                        {val(row[j]) || "\u00a0"}
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </FormTable>
          <p className="pp-form-note">{PP_REFUND_NOTE}</p>
          <SubHeading>{PP_FINANCIAL_SUBHEADINGS.F}</SubHeading>
          <InvestmentDecisionAnalysisTable
            analysis={buildInvestmentDecisionAnalysis(form, projectionSnapshot)}
          />
        </Indent>
      </FormBlock>

      <FormBlock>
        <SectionHeading>{PP_SECTION_RISK}</SectionHeading>
        <FormTable className="pp-form-risk-table">
          <thead>
            <tr>
              {PP_RISK_COLUMNS.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(riskRows.length
              ? riskRows
              : [{ id: "empty-risk-row", objective: "", risk: "", assumption: "", plan: "" }]
            ).map(
              (row) => (
                <tr key={row.id}>
                  <td>{val(row.objective) || "\u00a0"}</td>
                  <td>{val(formatRiskAndAssumptions(row)) || "\u00a0"}</td>
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
