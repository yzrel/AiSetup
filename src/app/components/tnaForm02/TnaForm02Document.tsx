/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST TNA Form 02 printable document (print-only; preview unchanged).
 */

import type { ReactNode } from "react";
import type { Tna2DocumentResponse } from "../../api/types";
import {
  TNA_FORM_02_EQUIPMENT_COLUMNS,
  TNA_FORM_02_KPI_COLUMNS,
  TNA_FORM_02_SECTION_ENTERPRISE,
  TNA_FORM_02_SECTION_EQUIPMENT,
  TNA_FORM_02_SECTION_INTERVENTIONS,
  TNA_FORM_02_SECTION_PRODUCTION,
  TNA_FORM_02_SECTION_PRODUCTIVITY,
  TNA_FORM_02_SECTION_SITE_VALIDATION,
  TNA_FORM_02_SECTION_TECHNOLOGY_GAPS,
  TNA_FORM_02_TITLE,
  displayValue,
} from "../../constants/tnaForm02Layout";

export interface TnaForm02DocumentProps {
  document: Tna2DocumentResponse;
}

function val(value: unknown): string {
  return displayValue(value);
}

function FormPage({ children }: { children: ReactNode }) {
  return (
    <section className="tna2-form-page">
      <div className="tna2-form-page-body">
        <div className="tna2-form-inner-frame">{children}</div>
      </div>
    </section>
  );
}

function FormBlock({ children }: { children: ReactNode }) {
  return <div className="tna2-form-block tna-print-section">{children}</div>;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="tna2-form-section-heading tna2-form-section-bar">{children}</h2>;
}

function FormTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <table className={`tna2-form-table ${className}`}>{children}</table>;
}

function FormLabelCell({
  children,
  width,
  colSpan,
  rowSpan,
}: {
  children: ReactNode;
  width?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <td
      className="tna2-form-label"
      style={width ? { width } : undefined}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {children}
    </td>
  );
}

function FormValueCell({
  children,
  colSpan,
  rowSpan,
}: {
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <td className="tna2-form-value" colSpan={colSpan} rowSpan={rowSpan}>
      {children}
    </td>
  );
}

function FormTextBlock({
  label,
  value,
  lines = 3,
}: {
  label: string;
  value: string;
  lines?: number;
}) {
  return (
    <FormBlock>
      <FormTable className="tna2-form-field-table">
        <tbody>
          {label ? (
            <tr>
              <td className="tna2-form-label tna2-form-field-label" colSpan={2}>
                {label}
              </td>
            </tr>
          ) : null}
          <tr>
            <td className="tna2-form-value tna2-form-field-value" colSpan={2}>
              {value || (
                <span className="tna2-form-blank-lines">
                  {Array.from({ length: lines }, (_, i) => (
                    <span key={i} className="tna2-form-ruled-line" />
                  ))}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </FormTable>
    </FormBlock>
  );
}

function NumberedList({ items }: { items: string[] }) {
  const filled = items.filter((item) => val(item));
  if (filled.length === 0) {
    return <p className="tna2-form-empty">—</p>;
  }
  return (
    <ol className="tna2-form-numbered-list">
      {filled.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

function FormHeader() {
  return (
    <header className="tna2-form-header-block">
      <div className="tna2-form-header">
        <img
          src="/assets/dost-logo-mark.png"
          alt=""
          aria-hidden
          className="tna2-form-logo"
        />
        <div className="tna2-form-header-text">
          <p className="tna2-form-republic">Republic of the Philippines</p>
          <p className="tna2-form-department">Department of Science and Technology</p>
          <p className="tna2-form-setup">Small Enterprise Technology Upgrading Program (SETUP)</p>
        </div>
      </div>
      <h1 className="tna2-form-title">{TNA_FORM_02_TITLE}</h1>
    </header>
  );
}

export function TnaForm02Document({ document: doc }: TnaForm02DocumentProps) {
  const profile = doc.enterpriseProfile ?? {};
  const process = doc.productionProcessAnalysis ?? { summary: "", findings: [] };
  const productivity = doc.productivityImprovement ?? { kpis: [], outcomes: [] };
  const assessor = doc.assessor ?? {};

  const equipmentRows =
    doc.recommendedEquipment?.length > 0
      ? doc.recommendedEquipment
      : [{ name: "", specifications: "", quantity: "", estimatedCost: "", priority: "" }];

  const kpiRows =
    productivity.kpis?.length > 0
      ? productivity.kpis
      : [{ label: "", before: "", after: "", change: "" }];

  return (
    <div className="tna2-form-document-root">
      <FormPage>
        <FormBlock>
          <FormHeader />
          <FormTable>
            <tbody>
              <tr>
                <FormLabelCell width="32%">Assessment Date</FormLabelCell>
                <FormValueCell colSpan={3}>{val(doc.assessmentDate)}</FormValueCell>
              </tr>
            </tbody>
          </FormTable>
        </FormBlock>

        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_ENTERPRISE}</SectionHeading>
          <FormTable>
            <tbody>
              <tr>
                <FormLabelCell width="32%">Enterprise Name</FormLabelCell>
                <FormValueCell colSpan={3}>{val(profile.enterpriseName)}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Business Address</FormLabelCell>
                <FormValueCell colSpan={3}>{val(profile.address)}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Business Type</FormLabelCell>
                <FormValueCell>{val(profile.businessType)}</FormValueCell>
                <FormLabelCell width="22%">Sector</FormLabelCell>
                <FormValueCell>{val(profile.sector)}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Commodity</FormLabelCell>
                <FormValueCell colSpan={3}>{val(profile.commodity)}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Main Product / Service</FormLabelCell>
                <FormValueCell colSpan={3}>{val(profile.mainProduct)}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Number of Employees</FormLabelCell>
                <FormValueCell>{val(profile.employees)}</FormValueCell>
                <FormLabelCell>Contact Person</FormLabelCell>
                <FormValueCell>{val(profile.contactPerson)}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Contact Number</FormLabelCell>
                <FormValueCell>{val(profile.contactNumber)}</FormValueCell>
                <FormLabelCell>Email Address</FormLabelCell>
                <FormValueCell>{val(profile.emailAddress)}</FormValueCell>
              </tr>
            </tbody>
          </FormTable>
        </FormBlock>
      </FormPage>

      <FormPage>
        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_SITE_VALIDATION}</SectionHeading>
          <NumberedList items={doc.siteValidationFindings ?? []} />
        </FormBlock>

        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_PRODUCTION}</SectionHeading>
          <FormTextBlock label="Process Summary" value={val(process.summary)} lines={3} />
          <p className="tna2-form-subheading">Key Findings</p>
          <NumberedList items={process.findings ?? []} />
        </FormBlock>
      </FormPage>

      <FormPage>
        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_TECHNOLOGY_GAPS}</SectionHeading>
          <NumberedList items={doc.technologyGaps ?? []} />
        </FormBlock>

        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_INTERVENTIONS}</SectionHeading>
          <NumberedList items={doc.proposedInterventions ?? []} />
        </FormBlock>
      </FormPage>

      <FormPage>
        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_EQUIPMENT}</SectionHeading>
          <FormTable>
            <thead>
              <tr>
                {TNA_FORM_02_EQUIPMENT_COLUMNS.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipmentRows.map((row, i) => (
                <tr key={i}>
                  <td className="tna2-form-center">{String(i + 1)}</td>
                  <td>{val(row.name) || "\u00a0"}</td>
                  <td>{val(row.specifications) || "\u00a0"}</td>
                  <td className="tna2-form-center">{val(row.quantity) || "\u00a0"}</td>
                  <td>{val(row.estimatedCost) || "\u00a0"}</td>
                  <td>{val(row.priority) || "\u00a0"}</td>
                </tr>
              ))}
            </tbody>
          </FormTable>
        </FormBlock>
      </FormPage>

      <FormPage>
        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_PRODUCTIVITY}</SectionHeading>
          <FormTable>
            <thead>
              <tr>
                {TNA_FORM_02_KPI_COLUMNS.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kpiRows.map((kpi, i) => (
                <tr key={i}>
                  <td>{val(kpi.label) || "\u00a0"}</td>
                  <td>{val(kpi.before) || "\u00a0"}</td>
                  <td>{val(kpi.after) || "\u00a0"}</td>
                  <td>{val(kpi.change) || "\u00a0"}</td>
                </tr>
              ))}
            </tbody>
          </FormTable>
          <p className="tna2-form-subheading">Expected Outcomes</p>
          <NumberedList items={productivity.outcomes ?? []} />
        </FormBlock>
      </FormPage>

      <FormPage>
        <FormBlock>
          <FormTable className="tna2-form-signature-table">
            <tbody>
              <tr>
                <td className="tna2-form-signature-cell">
                  <p className="tna2-form-signature-title">Prepared by:</p>
                  <div className="tna2-form-signature-line" />
                  <p className="tna2-form-signature-label">
                    Printed Name and Signature of Assessor
                  </p>
                  <p className="tna2-form-signature-name">{val(assessor.name)}</p>
                  <p className="tna2-form-signature-meta">{val(assessor.title)}</p>
                  <p className="tna2-form-signature-meta">{val(assessor.office)}</p>
                  <p className="tna2-form-signature-date">Date: __________________</p>
                </td>
                <td className="tna2-form-signature-cell">
                  <p className="tna2-form-signature-title">Validated by:</p>
                  <div className="tna2-form-signature-line" />
                  <p className="tna2-form-signature-label">
                    Printed Name and Signature of PSTD
                  </p>
                  <p className="tna2-form-signature-name">&nbsp;</p>
                  <p className="tna2-form-signature-date">Date: __________________</p>
                </td>
              </tr>
            </tbody>
          </FormTable>
        </FormBlock>
      </FormPage>
    </div>
  );
}
