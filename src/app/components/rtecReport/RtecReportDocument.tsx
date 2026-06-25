/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 002 RTEC Report printable document (print-only; preview unchanged).
 */

import type { ReactNode } from "react";
import type {
  ProjectProposalAttachment,
  ProjectProposalAttachmentKind,
  RtecComplianceItem,
  RtecReportForm,
} from "../../api/types";
import { DOST_REGION_12_DIRECTOR_NAME } from "../../constants/region12";
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
  PP_QUICK_RATIO_COLUMNS,
  PP_REFUND_NOTE,
  PP_RISK_COLUMNS,
  PP_RISK_FOOTNOTE,
  PP_ROI_COLUMNS,
  RTEC_COMPLIANCE_COLUMNS,
  RTEC_REGISTRATION_OFFICES,
  RTEC_REPORT_TITLE,
  RTEC_SECTION_I,
  RTEC_SECTION_II,
  RTEC_SECTION_III,
  RTEC_SECTION_IV,
  RTEC_SUBSECTION_COMPANY,
  RTEC_SUBSECTION_EXPECTED,
  RTEC_SUBSECTION_FINANCIAL,
  RTEC_SUBSECTION_MANAGEMENT,
  RTEC_SUBSECTION_MARKETING,
  RTEC_SUBSECTION_OBJECTIVES,
  RTEC_SUBSECTION_RISK,
  RTEC_SUBSECTION_TECHNICAL,
  RTEC_SUBSECTION_WASTE,
  displayValue,
  formatCurrencyDisplay,
  isOptionChecked,
} from "../../constants/rtecReportLayout";
import { PROPOSAL_ATTACHMENT_LABELS } from "../../utils/projectProposal";

export interface RtecReportDocumentProps {
  form: RtecReportForm;
}

function val(value: unknown): string {
  return displayValue(value);
}

function FormBlock({ children }: { children: ReactNode }) {
  return <div className="rtec-form-block rtec-print-section">{children}</div>;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="rtec-form-section-heading">{children}</h2>;
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="rtec-form-subheading">{children}</h3>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="rtec-form-field-label">{children}</p>;
}

function FormTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <table className={`rtec-form-table ${className}`}>{children}</table>;
}

function CoverField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rtec-form-cover-field">
      <span className="rtec-form-cover-label">{label}</span>
      <span className="rtec-form-cover-value">{val(value) || "\u00a0"}</span>
    </div>
  );
}

function NarrativeBlock({ text }: { text: string }) {
  const content = val(text);
  if (!content) return <p className="rtec-form-empty">{"\u00a0"}</p>;
  return <p className="rtec-form-narrative">{content}</p>;
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span className="rtec-form-checkbox" aria-hidden>
      {checked ? "\u2713" : "\u2610"}
    </span>
  );
}

function CheckboxOption({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="rtec-form-checkbox-option">
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
    <div className="rtec-form-checkbox-row">
      {options.map((opt) => (
        <CheckboxOption key={opt} label={opt} checked={isOptionChecked(stored, opt)} />
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  const filled = items.map((i) => val(i)).filter(Boolean);
  if (!filled.length) return <p className="rtec-form-empty">{"\u00a0"}</p>;
  return (
    <ul className="rtec-form-bullet-list">
      {filled.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function CheckBulletList({ items }: { items: string[] }) {
  const filled = items.map((i) => val(i)).filter(Boolean);
  if (!filled.length) return <p className="rtec-form-empty">{"\u00a0"}</p>;
  return (
    <ul className="rtec-form-check-bullet-list">
      {filled.map((item, i) => (
        <li key={i}>
          <span className="rtec-form-check-bullet">{"\u2713"}</span>
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
  const body = filtered.length > 0 ? filtered : [columns.map(() => "")];

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

function ComplianceTable({ items }: { items: RtecComplianceItem[] }) {
  const mark = (status: RtecComplianceItem["status"], target: string) => {
    if (status === "complied" && target === "complied") return "\u2713";
    if (status === "not_complied" && target === "not_complied") return "\u2713";
    if (status === "na" && target === "na") return "N/A";
    return "";
  };

  return (
    <FormTable className="rtec-form-compliance-table">
      <thead>
        <tr>
          {RTEC_COMPLIANCE_COLUMNS.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.label}</td>
            <td className="rtec-form-check-cell">{mark(item.status, "complied")}</td>
            <td className="rtec-form-check-cell">{mark(item.status, "not_complied")}</td>
            <td className="rtec-form-check-cell">{mark(item.status, "na")}</td>
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
      <div className="rtec-form-attachment-placeholder">
        <p className="rtec-form-attachment-label">{label}</p>
      </div>
    );
  }
  const isImage = attachment.mimeType.startsWith("image/");
  return (
    <div className="rtec-form-attachment">
      <p className="rtec-form-attachment-label">{label}</p>
      {isImage ? (
        <img src={attachment.dataUrl} alt={attachment.fileName} />
      ) : (
        <p className="rtec-form-attachment-file">{attachment.fileName}</p>
      )}
    </div>
  );
}

function registrationRowValues(
  office: string,
  pp: RtecReportForm["proposalSnapshot"],
): { number: string; date: string; checked: boolean } {
  const regOffice = val(pp.registrationOffice);
  const isLgu = office === "LGU";
  const isOthers = office.startsWith("Others");

  if (isLgu) {
    const lguMatch =
      isOptionChecked(regOffice, "LGU") ||
      Boolean(val(pp.businessPermitNumber) || val(pp.businessPermitDate));
    return {
      checked: lguMatch,
      number: val(pp.businessPermitNumber) || (lguMatch ? val(pp.registrationNumber) : ""),
      date: val(pp.businessPermitDate) || (lguMatch ? val(pp.registrationDate) : ""),
    };
  }

  if (isOthers) {
    const dtiSecCdaMatch = RTEC_REGISTRATION_OFFICES.slice(0, 3).some((o) =>
      isOptionChecked(regOffice, o),
    );
    const othersMatch =
      !dtiSecCdaMatch &&
      !isOptionChecked(regOffice, "LGU") &&
      Boolean(regOffice);
    return {
      checked: othersMatch,
      number: othersMatch ? val(pp.registrationNumber) || val(pp.businessPermitNumber) : "",
      date: othersMatch ? val(pp.registrationDate) || val(pp.businessPermitDate) : "",
    };
  }

  const isMatch = isOptionChecked(regOffice, office);
  return {
    checked: isMatch,
    number: isMatch ? val(pp.registrationNumber) : "",
    date: isMatch ? val(pp.registrationDate) : "",
  };
}

export function RtecReportDocument({ form }: RtecReportDocumentProps) {
  const pp = form.proposalSnapshot;

  const findAttachment = (kind: ProjectProposalAttachmentKind) =>
    form.attachmentRefs.find((a) => a.kind === kind);

  const male = parseInt(pp.employeesMale, 10) || 0;
  const female = parseInt(pp.employeesFemale, 10) || 0;
  const totalEmployees = male + female || "";

  const equipmentRows = pp.equipmentTable
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => [r[0] ?? "", r[1] ?? r[3] ?? "", r[2] ?? r[4] ?? ""]);

  const budgetRows = pp.budgetItems
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

  const refundRows = pp.refundSchedule.length > 1 ? pp.refundSchedule.slice(1) : [];
  const refundHeaders =
    pp.refundSchedule.length > 0
      ? pp.refundSchedule[0]
      : ["Months", "Y1", "Y2", "Y3", "Y4", "Total"];

  const constraintRows =
    form.constraintRows.length > 0
      ? form.constraintRows
      : [
          {
            id: "default",
            processProblem: pp.interventionProblem,
            proposedIntervention: pp.interventionProposed,
            equipmentSkills: pp.interventionEquipment,
            impact: pp.interventionImpact,
          },
        ];

  const fabricatorRows =
    form.fabricatorRows.length > 0
      ? form.fabricatorRows.map((r) => [r.name, r.address, r.contactNo])
      : pp.fabricatorTable;

  const sig = form.signatures;

  return (
    <div className="rtec-form-document-root">
      <FormBlock>
        <h1 className="rtec-form-title">{RTEC_REPORT_TITLE}</h1>
        <CoverField label="Project Title:" value={pp.projectTitle} />
        <CoverField label="Proponent:" value={pp.proponentName || pp.firmName} />
        <CoverField label="Contact Person:" value={pp.contactPerson} />
        <div className="rtec-form-cost-grid">
          <div>
            <span className="rtec-form-cover-label">Project Cost: Proponent</span>
            <p className="rtec-form-cost-value">
              {formatCurrencyDisplay(form.projectCostProponent) ||
                val(form.projectCostProponent) ||
                "\u00a0"}
            </p>
          </div>
          <div>
            <span className="rtec-form-cover-label">DOST-SETUP</span>
            <p className="rtec-form-cost-value">
              {formatCurrencyDisplay(form.projectCostSetup) ||
                val(form.projectCostSetup) ||
                "\u00a0"}
            </p>
          </div>
          <div>
            <span className="rtec-form-cover-label">Total</span>
            <p className="rtec-form-cost-value">
              {formatCurrencyDisplay(form.projectCostTotal) ||
                val(form.projectCostTotal) ||
                "\u00a0"}
            </p>
          </div>
        </div>

        <SectionHeading>{RTEC_SECTION_I}</SectionHeading>
        <SubHeading>{RTEC_SUBSECTION_COMPANY}</SubHeading>
        <FormTable className="rtec-form-profile-table">
          <tbody>
            <tr>
              <td className="rtec-form-label">Name of Firm</td>
              <td className="rtec-form-value">{val(pp.firmName) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="rtec-form-label">Address</td>
              <td className="rtec-form-value">{val(pp.firmAddress) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="rtec-form-label">Contact Person</td>
              <td className="rtec-form-value">{val(pp.contactPerson) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="rtec-form-label">Contact No.</td>
              <td className="rtec-form-value">{val(pp.contactNumber) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="rtec-form-label">e-mail Address</td>
              <td className="rtec-form-value">{val(pp.email) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="rtec-form-label">Year established</td>
              <td className="rtec-form-value">{val(pp.yearEstablished) || "\u00a0"}</td>
            </tr>
          </tbody>
        </FormTable>

        <p className="rtec-form-instruction">
          Type of Organization (please check appropriate box in each row)
        </p>
        <CheckboxRow options={PP_ORGANIZATION_TYPES} stored={pp.organizationType} />
        <CheckboxRow options={PP_PROFIT_TYPES} stored={pp.profitType} />
        <CheckboxRow options={PP_MSME_SIZES} stored={pp.msmeSize} />

        <p className="rtec-form-instruction">
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
              <td>Direct Workers — Production</td>
              <td className="rtec-form-center">{val(pp.employeesMale) || "\u00a0"}</td>
              <td className="rtec-form-center">{val(pp.employeesFemale) || "\u00a0"}</td>
              <td className="rtec-form-center">{val(pp.employeesDirect) || "\u00a0"}</td>
            </tr>
            <tr>
              <td>Non-production</td>
              <td className="rtec-form-center">{"\u00a0"}</td>
              <td className="rtec-form-center">{"\u00a0"}</td>
              <td className="rtec-form-center">{"\u00a0"}</td>
            </tr>
            <tr>
              <td>Indirect/Contract Workers</td>
              <td className="rtec-form-center">{"\u00a0"}</td>
              <td className="rtec-form-center">{"\u00a0"}</td>
              <td className="rtec-form-center">{val(pp.employeesIndirect) || "\u00a0"}</td>
            </tr>
            <tr>
              <td>Total</td>
              <td className="rtec-form-center">{male || "\u00a0"}</td>
              <td className="rtec-form-center">{female || "\u00a0"}</td>
              <td className="rtec-form-center">{totalEmployees || "\u00a0"}</td>
            </tr>
          </tbody>
        </FormTable>

        <FormTable className="rtec-form-registration-table">
          <thead>
            <tr>
              <th>Registration Office</th>
              <th>Registration Number</th>
              <th>Date of Registration</th>
            </tr>
          </thead>
          <tbody>
            {RTEC_REGISTRATION_OFFICES.map((office) => {
              const row = registrationRowValues(office, pp);
              const isOthers = office.startsWith("Others");
              return (
                <tr key={office}>
                  <td>
                    <CheckboxOption label={office} checked={row.checked} />
                    {isOthers && val(pp.registrationOffice) && !row.checked
                      ? ` ${val(pp.registrationOffice)}`
                      : null}
                  </td>
                  <td>{row.number || "\u00a0"}</td>
                  <td>{row.date || "\u00a0"}</td>
                </tr>
              );
            })}
          </tbody>
        </FormTable>

        <p className="rtec-form-instruction">
          Business Activity/ies: (please check appropriate box)
        </p>
        <div className="rtec-form-activity-grid">
          {PP_BUSINESS_ACTIVITY_PAIRS.map(([left, right], i) => (
            <div key={i} className="rtec-form-activity-row">
              <CheckboxOption
                label={left}
                checked={isOptionChecked(pp.businessActivity, left)}
              />
              <CheckboxOption
                label={right}
                checked={isOptionChecked(pp.businessActivity, right)}
              />
            </div>
          ))}
        </div>
        {val(pp.prioritySectorSpecify) ? (
          <p className="rtec-form-priority-specify">{val(pp.prioritySectorSpecify)}</p>
        ) : null}

        <FormTable className="rtec-form-profile-table">
          <tbody>
            <tr>
              <td className="rtec-form-label">Products/Services</td>
              <td className="rtec-form-value">{val(pp.productsServices) || "\u00a0"}</td>
            </tr>
            <tr>
              <td className="rtec-form-label">Brief Enterprise Background</td>
              <td className="rtec-form-value rtec-form-narrative-cell">
                {val(pp.enterpriseBackground) || "\u00a0"}
              </td>
            </tr>
          </tbody>
        </FormTable>
      </FormBlock>

      <FormBlock>
        <SubHeading>{RTEC_SUBSECTION_OBJECTIVES}</SubHeading>
        <FieldLabel>General Objective</FieldLabel>
        <NarrativeBlock text={pp.generalObjective} />
        <FieldLabel>Specific Objectives</FieldLabel>
        <BulletList items={pp.specificObjectives} />

        <SubHeading>{RTEC_SUBSECTION_EXPECTED}</SubHeading>
        {PP_EXPECTED_OUTPUT_HEADINGS.map((heading, i) => (
          <div key={heading} className="rtec-form-expected-output">
            <p className="rtec-form-expected-heading">
              {i + 1}. {heading}
            </p>
            <NarrativeBlock text={pp.expectedOutputBullets[i] ?? ""} />
          </div>
        ))}

        <SectionHeading>{RTEC_SECTION_II}</SectionHeading>
        <ComplianceTable items={form.complianceItems} />
      </FormBlock>

      <FormBlock>
        <SectionHeading>{RTEC_SECTION_III}</SectionHeading>
        <SubHeading>{RTEC_SUBSECTION_MANAGEMENT}</SubHeading>
        <FieldLabel>Organization chart</FieldLabel>
        <AttachmentFigure
          attachment={findAttachment("orgChart")}
          label={PROPOSAL_ATTACHMENT_LABELS.orgChart}
        />
        <FieldLabel>Skills and expertise of employee/owner (proponent)</FieldLabel>
        <NarrativeBlock text={pp.skillsExpertise} />
        <FieldLabel>Compensation</FieldLabel>
        <NarrativeBlock text={pp.compensation} />
      </FormBlock>

      <FormBlock>
        <SubHeading>{RTEC_SUBSECTION_TECHNICAL}</SubHeading>
        <FieldLabel>1. Production Process</FieldLabel>
        <FieldLabel>a. Process Flow of Production</FieldLabel>
        <NarrativeBlock text={pp.productionProcess} />
        <FieldLabel>b. Material Balance</FieldLabel>
        <NarrativeBlock text={pp.rawMaterialsNarrative} />
        <FieldLabel>2. Existing Production Equipment</FieldLabel>
        <DataTable columns={PP_EQUIPMENT_COLUMNS} rows={equipmentRows} />
        <FieldLabel>
          3. Technical constraints on the production line and proposed S&T intervention
        </FieldLabel>
        <FormTable className="rtec-form-intervention-table">
          <thead>
            <tr>
              {PP_INTERVENTION_COLUMNS.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {constraintRows.map((row) => (
              <tr key={row.id}>
                <td>{val(row.processProblem) || "\u00a0"}</td>
                <td>{val(row.proposedIntervention) || "\u00a0"}</td>
                <td>{val(row.equipmentSkills) || "\u00a0"}</td>
                <td>{val(row.impact) || "\u00a0"}</td>
              </tr>
            ))}
          </tbody>
        </FormTable>
        <FieldLabel>Proposed Plant Lay-out</FieldLabel>
        <AttachmentFigure
          attachment={findAttachment("plantLayout")}
          label={PROPOSAL_ATTACHMENT_LABELS.plantLayout}
        />
        <FieldLabel>4. Cost and specification of S&T Intervention Related Equipment</FieldLabel>
        <DataTable columns={PP_INTERVENTION_COST_COLUMNS} rows={pp.interventionCostTable} />
        <FieldLabel>5. List of equipment fabricators (name and address)</FieldLabel>
        <DataTable columns={PP_FABRICATOR_COLUMNS} rows={fabricatorRows} />
      </FormBlock>

      <FormBlock>
        <SubHeading>{RTEC_SUBSECTION_MARKETING}</SubHeading>
        <FieldLabel>Market Situation</FieldLabel>
        <NarrativeBlock text={pp.marketSituation} />
        <FieldLabel>Product Demand and Supply</FieldLabel>
        <NarrativeBlock text={pp.productDemandSupply} />
        <FieldLabel>Product specifications and product price</FieldLabel>
        <DataTable columns={PP_PRODUCT_PRICE_COLUMNS} rows={pp.productPriceTable} />
        <FieldLabel>Market plans/strategies</FieldLabel>
        <CheckBulletList items={pp.marketStrategies} />
      </FormBlock>

      <FormBlock>
        <SubHeading>{RTEC_SUBSECTION_FINANCIAL}</SubHeading>
        <FieldLabel>Financial capacity — Financial ratio and analysis</FieldLabel>
        <NarrativeBlock text={form.ratioNarrative || pp.financialAnalysis} />
        <FieldLabel>Liquidity Ratio</FieldLabel>
        <p className="rtec-form-ratio-intro">
          Liquidity ratios measure the short-term ability of the company to pay its maturing
          obligation and to meet unexpected needs for cash.
        </p>
        <DataTable columns={PP_LIQUIDITY_COLUMNS} rows={pp.liquidityRatioTable} />
        <FieldLabel>Quick Ratio (Acid Test Ratio)</FieldLabel>
        <DataTable columns={PP_QUICK_RATIO_COLUMNS} rows={pp.quickRatioTable} />
        <FieldLabel>Return on Investment</FieldLabel>
        <DataTable columns={PP_ROI_COLUMNS} rows={pp.roiTable} />
        <FieldLabel>Financial constraints</FieldLabel>
        <NarrativeBlock text={pp.financialConstraintsNote || PP_FINANCIAL_ATTACH_NOTE} />
        <FieldLabel>Cash flow/ financial statement/ balance sheet</FieldLabel>
        <NarrativeBlock text={PP_FINANCIAL_ATTACH_NOTE} />
        <FieldLabel>Budgetary Requirement for the proposed project</FieldLabel>
        <DataTable columns={PP_BUDGET_COLUMNS} rows={budgetRows} />
        <p className="rtec-form-note">{PP_BUDGET_NOTE}</p>
        <FieldLabel>Proposed Refund Schedule</FieldLabel>
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
        <p className="rtec-form-note">{PP_REFUND_NOTE}</p>
      </FormBlock>

      <FormBlock>
        <SubHeading>{RTEC_SUBSECTION_WASTE}</SubHeading>
        <NarrativeBlock text={pp.wasteManagement} />
        <SubHeading>{RTEC_SUBSECTION_RISK}</SubHeading>
        <FormTable>
          <thead>
            <tr>
              {PP_RISK_COLUMNS.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(pp.riskRows.length ? pp.riskRows : [{ id: "0", risk: "", assumption: "", plan: "" }]).map(
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
        <div className="rtec-form-risk-footnote">
          {PP_RISK_FOOTNOTE.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </FormBlock>

      <FormBlock>
        <SectionHeading>{RTEC_SECTION_IV}</SectionHeading>
        <NarrativeBlock text={form.recommendation} />
        <div className="rtec-form-signatures">
          <p className="rtec-form-sig-title">Evaluated by:</p>
          <div className="rtec-form-sig-grid">
            <div className="rtec-form-sig-cell">
              <p className="rtec-form-sig-label">RTEC Chairperson</p>
              <div className="rtec-form-sig-line" />
              <p className="rtec-form-sig-name">{val(sig.chairperson) || "\u00a0"}</p>
            </div>
            <div className="rtec-form-sig-members">
              {(["member1", "member2", "member3"] as const).map((k, i) => (
                <div key={k} className="rtec-form-sig-cell">
                  <p className="rtec-form-sig-label">Member</p>
                  <div className="rtec-form-sig-line" />
                  <p className="rtec-form-sig-name">{val(sig[k]) || `Member ${i + 1}`}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rtec-form-sig-grid rtec-form-sig-grid-secondary">
            <div className="rtec-form-sig-cell">
              <p className="rtec-form-sig-label">Reviewed and endorsed by: RPMO</p>
              <div className="rtec-form-sig-line" />
              <p className="rtec-form-sig-name">{val(sig.rpmo) || "\u00a0"}</p>
            </div>
            <div className="rtec-form-sig-cell">
              <p className="rtec-form-sig-label">Noted by: Regional Director</p>
              <div className="rtec-form-sig-line" />
              <p className="rtec-form-sig-name">
                {val(sig.regionalDirector) || DOST_REGION_12_DIRECTOR_NAME}
              </p>
            </div>
          </div>
          {val(sig.evaluationDate) ? (
            <p className="rtec-form-sig-date">Date: {val(sig.evaluationDate)}</p>
          ) : (
            <p className="rtec-form-sig-date">Date: __________________</p>
          )}
        </div>
      </FormBlock>
    </div>
  );
}
