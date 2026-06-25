/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST TNA Form 01 (Annex B-11) printable document layout.
 */

import type { ReactNode } from "react";
import {
  TNA_FORM_01_BUSINESS_ACTIVITIES,
  TNA_FORM_01_CAPITAL_CLASSES,
  TNA_FORM_01_EMPLOYEE_ROWS,
  TNA_FORM_01_EMPLOYMENT_CLASSES,
  TNA_FORM_01_EQUIPMENT_COLUMNS,
  TNA_FORM_01_GENERAL_AGREEMENTS,
  TNA_FORM_01_ORGANIZATION_TYPES,
  TNA_FORM_01_PACKAGING_ROWS,
  TNA_FORM_01_PRODUCTION_COLUMNS,
  TNA_FORM_01_PROFIT_TYPES,
  TNA_FORM_01_RAW_MATERIAL_COLUMNS,
  TNA_FORM_01_TITLE,
  TNA_FORM_01_UNDERTAKING,
  deriveBusinessActivity,
  displayValue,
  formatDisplayDate,
  mapCapitalClassToOfficial,
  mapEmploymentClassToOfficial,
  mapOrganizationType,
} from "../../constants/tnaForm01Layout";

export interface TnaForm01Tables {
  rawMaterials: string[][];
  production: string[][];
  equipment: string[][];
}

export interface TnaForm01DocumentProps {
  form: Record<string, unknown>;
  tables: TnaForm01Tables;
}

function val(form: Record<string, unknown>, key: string): string {
  return displayValue(form[key]);
}

function checked(form: Record<string, unknown>, key: string): boolean {
  return form[key] === true;
}

export function FormPage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`tna-form-page ${className}`}>
      <div className="tna-form-page-body">
        <div className="tna-form-inner-frame">{children}</div>
      </div>
    </section>
  );
}

export function FormBlock({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`tna-form-block tna-print-section ${className}`}>{children}</div>;
}

export function FormBorderedPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`tna-form-bordered-panel tna-form-block tna-print-section ${className}`}>
      {children}
    </div>
  );
}

export function FormCheckbox({ checked: on }: { checked: boolean }) {
  return (
    <span className="tna-form-checkbox" aria-hidden>
      {on ? "☑" : "☐"}
    </span>
  );
}

export function FormTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <table className={`tna-form-table ${className}`}>{children}</table>;
}

export function FormLabelCell({
  children,
  width,
  colSpan,
  rowSpan,
  className = "",
}: {
  children: ReactNode;
  width?: string;
  colSpan?: number;
  rowSpan?: number;
  className?: string;
}) {
  return (
    <td
      className={`tna-form-label ${className}`}
      style={width ? { width } : undefined}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {children}
    </td>
  );
}

export function FormValueCell({
  children,
  colSpan,
  rowSpan,
  className = "",
}: {
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  className?: string;
}) {
  return (
    <td className={`tna-form-value ${className}`} colSpan={colSpan} rowSpan={rowSpan}>
      {children}
    </td>
  );
}

export function FormTextBlock({
  label,
  value,
  lines = 3,
}: {
  label: string;
  value: string;
  lines?: number;
}) {
  return (
    <div className="tna-form-block tna-print-section">
      <FormTable className="tna-form-field-table">
        <tbody>
          {label ? (
            <tr>
              <td className="tna-form-label tna-form-field-label" colSpan={2}>
                {label}
              </td>
            </tr>
          ) : null}
          <tr>
            <td className="tna-form-value tna-form-field-value" colSpan={2}>
              {value || (
                <span className="tna-form-blank-lines">
                  {Array.from({ length: lines }, (_, i) => (
                    <span key={i} className="tna-form-ruled-line" />
                  ))}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </FormTable>
    </div>
  );
}

export function FormAttachmentBlock({
  label,
  fileName,
  fileData,
  minHeight = 120,
}: {
  label: string;
  fileName?: string;
  fileData?: string;
  minHeight?: number;
}) {
  const isImage =
    fileData &&
    (fileData.startsWith("data:image/") ||
      /\.(png|jpe?g|gif|webp)$/i.test(fileName ?? ""));

  return (
    <div className="tna-form-block tna-print-section">
      <FormTable className="tna-form-field-table">
        <tbody>
          <tr>
            <td className="tna-form-label tna-form-field-label" colSpan={2}>
              {label}
            </td>
          </tr>
          <tr>
            <td
              className="tna-form-value tna-form-field-value tna-form-attachment-cell"
              colSpan={2}
            >
              <div className="tna-form-attachment" style={{ minHeight }}>
                {isImage ? (
                  <img src={fileData} alt={label} className="tna-form-attachment-img" />
                ) : fileName ? (
                  <p className="tna-form-attachment-name">{fileName}</p>
                ) : (
                  <span className="tna-form-blank-box" />
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </FormTable>
    </div>
  );
}

function DataRowsTable({
  columns,
  rows,
  emptyRows = 2,
}: {
  columns: readonly string[];
  rows: string[][];
  emptyRows?: number;
}) {
  const filled = rows.filter((row) => row.some((c) => displayValue(c)));
  const displayRows =
    filled.length > 0
      ? filled
      : Array.from({ length: emptyRows }, () => columns.map(() => ""));

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
        {displayRows.map((row, i) => (
          <tr key={i}>
            {columns.map((_, j) => (
              <td key={j}>{displayValue(row[j]) || "\u00a0"}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </FormTable>
  );
}

function FormHeader() {
  return (
    <header className="tna-form-header-block">
      <div className="tna-form-header">
        <img
          src="/assets/dost-logo-mark.png"
          alt=""
          aria-hidden
          className="tna-form-logo"
        />
        <div className="tna-form-header-text">
          <p className="tna-form-republic">Republic of the Philippines</p>
          <p className="tna-form-department">Department of Science and Technology</p>
          <p className="tna-form-setup">Small Enterprise Technology Upgrading Program (SETUP)</p>
        </div>
      </div>
      <h1 className="tna-form-title">{TNA_FORM_01_TITLE}</h1>
    </header>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="tna-form-section-heading tna-form-section-bar">{children}</h2>;
}

function BenchmarkBullet({ children }: { children: ReactNode }) {
  return <p className="tna-form-benchmark-item">{children}</p>;
}

export function TnaForm01Document({ form, tables }: TnaForm01DocumentProps) {
  const f = form;
  const org = mapOrganizationType(val(f, "organizationType"));
  const capitalId = mapCapitalClassToOfficial(val(f, "capitalClassification"));
  const employmentId = mapEmploymentClassToOfficial(val(f, "employmentClass"));
  const activityId = deriveBusinessActivity(val(f, "sector"), val(f, "commodity"));

  const directMale = val(f, "employeesMale");
  const directFemale = val(f, "employeesFemale");
  const indirectMale = val(f, "employeesIndirect");
  const indirectFemale = val(f, "employeesContract");
  const totalMale =
    [directMale, indirectMale].filter(Boolean).length > 0
      ? String(
          (parseInt(directMale, 10) || 0) + (parseInt(indirectMale, 10) || 0) || "",
        )
      : "";
  const totalFemale =
    [directFemale, indirectFemale].filter(Boolean).length > 0
      ? String(
          (parseInt(directFemale, 10) || 0) + (parseInt(indirectFemale, 10) || 0) || "",
        )
      : "";

  const processFlowIsAttachment = f.processFlowMode === "attachment";

  return (
    <div className="tna-form-document-root">
      {/* Page 1 — Enterprise ID + General Agreements (1–3) */}
      <FormPage>
        <FormBlock>
          <FormHeader />
          <FormTable>
            <tbody>
              <tr>
                <FormLabelCell width="28%">Name of Enterprise:</FormLabelCell>
                <FormValueCell colSpan={3}>{val(f, "enterpriseName")}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Contact Person:</FormLabelCell>
                <FormValueCell>{val(f, "contactPerson")}</FormValueCell>
                <FormLabelCell width="22%">Position in the Enterprise:</FormLabelCell>
                <FormValueCell>{val(f, "position")}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell rowSpan={2}>Office Address:</FormLabelCell>
                <FormValueCell colSpan={3} rowSpan={2}>
                  {val(f, "officeAddress")}
                </FormValueCell>
              </tr>
              <tr />
              <tr>
                <FormLabelCell>Tel. No.</FormLabelCell>
                <FormValueCell>{val(f, "officeTel")}</FormValueCell>
                <FormLabelCell>Fax No.</FormLabelCell>
                <FormValueCell>{val(f, "officeFax")}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>E-mail Address:</FormLabelCell>
                <FormValueCell colSpan={3}>{val(f, "officeEmail")}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell rowSpan={2}>Factory Address:</FormLabelCell>
                <FormValueCell colSpan={3} rowSpan={2}>
                  {val(f, "factoryAddress")}
                </FormValueCell>
              </tr>
              <tr />
              <tr>
                <FormLabelCell>Tel. No.</FormLabelCell>
                <FormValueCell>{val(f, "factoryTel")}</FormValueCell>
                <FormLabelCell>Fax No.</FormLabelCell>
                <FormValueCell>{val(f, "factoryFax")}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>E-mail Address:</FormLabelCell>
                <FormValueCell colSpan={3}>{val(f, "factoryEmail")}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Website:</FormLabelCell>
                <FormValueCell colSpan={3}>{val(f, "website")}</FormValueCell>
              </tr>
            </tbody>
          </FormTable>
        </FormBlock>

        <FormBlock>
          <SectionHeading>GENERAL AGREEMENTS:</SectionHeading>
          <FormBorderedPanel>
            <ol className="tna-form-agreements">
              {TNA_FORM_01_GENERAL_AGREEMENTS.map((text, i) => (
                <li key={i}>
                  <FormCheckbox checked={checked(f, `agreeGA${i + 1}`)} /> {text}
                </li>
              ))}
            </ol>
          </FormBorderedPanel>
        </FormBlock>
      </FormPage>

      {/* Page 2 — Undertaking */}
      <FormPage>
        <FormBlock>
          <SectionHeading>UNDERTAKING</SectionHeading>
          <FormBorderedPanel>
            <p className="tna-form-undertaking-text">{TNA_FORM_01_UNDERTAKING}</p>
            <FormTable>
              <tbody>
                <tr>
                  <FormLabelCell width="35%">Signature over Printed Name</FormLabelCell>
                  <FormValueCell>{val(f, "undertakingName")}</FormValueCell>
                </tr>
                <tr>
                  <FormLabelCell>Position in the Enterprise</FormLabelCell>
                  <FormValueCell>{val(f, "undertakingPosition")}</FormValueCell>
                </tr>
                <tr>
                  <FormLabelCell>Date</FormLabelCell>
                  <FormValueCell>{formatDisplayDate(val(f, "undertakingDate"))}</FormValueCell>
                </tr>
              </tbody>
            </FormTable>
          </FormBorderedPanel>
        </FormBlock>
      </FormPage>

      {/* Page 3 — Attachment A (part 1) */}
      <FormPage>
        <FormBlock>
          <SectionHeading>Attachment A — Enterprise Profile</SectionHeading>
          <FormTable>
            <tbody>
              <tr>
                <FormLabelCell width="30%">Name of Enterprise</FormLabelCell>
                <FormValueCell colSpan={3}>{val(f, "enterpriseName")}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Production Site/Location</FormLabelCell>
                <FormValueCell colSpan={3}>{val(f, "productionSite")}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Business Permit No.</FormLabelCell>
                <FormValueCell>{val(f, "businessPermitNo")}</FormValueCell>
                <FormLabelCell width="22%">Year Registered</FormLabelCell>
                <FormValueCell>{val(f, "yearRegistered")}</FormValueCell>
              </tr>
            </tbody>
          </FormTable>
          <FormTextBlock
            label="Brief Enterprise Background"
            value={val(f, "enterpriseBackground")}
            lines={4}
          />
          <FormTable>
            <tbody>
              <tr>
                <FormLabelCell width="30%">Year enterprise was established:</FormLabelCell>
                <FormValueCell>{val(f, "yearEstablished")}</FormValueCell>
                <FormLabelCell width="22%">Initial capitalization:</FormLabelCell>
                <FormValueCell>{val(f, "initialCapital")}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Enterprise Registration No.</FormLabelCell>
                <FormValueCell colSpan={3}>{val(f, "registrationNo")}</FormValueCell>
              </tr>
            </tbody>
          </FormTable>
        </FormBlock>

        <FormBorderedPanel>
          <p className="tna-form-subheading tna-form-panel-title">Type of Organization:</p>
          <div className="tna-form-checkbox-row">
            {TNA_FORM_01_ORGANIZATION_TYPES.map((type) => (
              <label key={type} className="tna-form-checkbox-label">
                <FormCheckbox checked={org.org === type} /> {type}
              </label>
            ))}
          </div>
          <div className="tna-form-checkbox-row">
            {TNA_FORM_01_PROFIT_TYPES.map((type) => (
              <label key={type} className="tna-form-checkbox-label">
                <FormCheckbox checked={org.profit === type} /> {type}
              </label>
            ))}
          </div>
        </FormBorderedPanel>

        <FormBlock>
          <FormTable>
            <tbody>
              <tr>
                <FormLabelCell width="30%">Present capitalization</FormLabelCell>
                <FormValueCell colSpan={3}>{val(f, "presentCapital")}</FormValueCell>
              </tr>
            </tbody>
          </FormTable>
        </FormBlock>

        <FormBorderedPanel>
          <p className="tna-form-subheading tna-form-panel-title">Classification according to capital (PhP)</p>
          <div className="tna-form-checkbox-col">
            {TNA_FORM_01_CAPITAL_CLASSES.map((c) => (
              <label key={c.id} className="tna-form-checkbox-label">
                <FormCheckbox checked={capitalId === c.id} /> {c.label}
              </label>
            ))}
          </div>
        </FormBorderedPanel>

        <FormBorderedPanel>
          <p className="tna-form-subheading tna-form-panel-title">
            Classification according to employment (number of employees)
          </p>
          <div className="tna-form-checkbox-col">
            {TNA_FORM_01_EMPLOYMENT_CLASSES.map((c) => (
              <label key={c.id} className="tna-form-checkbox-label">
                <FormCheckbox checked={employmentId === c.id} /> {c.label}
              </label>
            ))}
          </div>
        </FormBorderedPanel>
      </FormPage>

      {/* Page 4 — Employees + Business Activity + consultation */}
      <FormPage>
        <FormBlock>
          <p className="tna-form-subheading">Number of Employees:</p>
          <FormTable className="tna-form-grid-table">
            <thead>
              <tr>
                <th />
                <th>M</th>
                <th>F</th>
              </tr>
            </thead>
            <tbody>
              {TNA_FORM_01_EMPLOYEE_ROWS.map((row) => {
                const male =
                  row.maleKey === "employeesMale"
                    ? directMale
                    : row.maleKey === "employeesIndirect"
                      ? indirectMale
                      : "";
                const female =
                  row.femaleKey === "employeesFemale"
                    ? directFemale
                    : row.femaleKey === "employeesContract"
                      ? indirectFemale
                      : "";
                return (
                  <tr key={row.label}>
                    <FormLabelCell>{row.label}</FormLabelCell>
                    <FormValueCell>{male}</FormValueCell>
                    <FormValueCell>{female}</FormValueCell>
                  </tr>
                );
              })}
              <tr>
                <FormLabelCell>
                  <strong>Total</strong>
                </FormLabelCell>
                <FormValueCell>{totalMale}</FormValueCell>
                <FormValueCell>{totalFemale}</FormValueCell>
              </tr>
            </tbody>
          </FormTable>
        </FormBlock>

        <FormBorderedPanel>
          <p className="tna-form-subheading tna-form-panel-title">Business Activity:</p>
          <div className="tna-form-activity-list">
            {TNA_FORM_01_BUSINESS_ACTIVITIES.map((act) => (
              <div key={act.id} className="tna-form-activity-item">
                <label className="tna-form-checkbox-label">
                  <FormCheckbox checked={activityId === act.id} /> {act.label}
                </label>
                {act.hint && <span className="tna-form-activity-hint">{act.hint}</span>}
                {(activityId === act.id || act.id === "others") && (
                  <span className="tna-form-activity-spec">
                    {activityId === act.id ? val(f, "commodity") || val(f, "sector") : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </FormBorderedPanel>

        <FormTextBlock
          label="1. Specific product or service the enterprise offers its customers:"
          value={val(f, "mainProduct")}
          lines={2}
        />
        <FormTextBlock
          label="2. Reasons why assistance is being sought:"
          value={val(f, "reasonsForAssistance")}
          lines={3}
        />

        <FormBorderedPanel>
          <p className="tna-form-subheading tna-form-panel-title">
            3. Have you consulted any other individual/organization for any assistance?
          </p>
          <div className="tna-form-checkbox-row">
            <label className="tna-form-checkbox-label">
              <FormCheckbox checked={val(f, "consultedOther") === "Yes"} /> Yes
            </label>
            <label className="tna-form-checkbox-label">
              <FormCheckbox checked={val(f, "consultedOther") === "No"} /> No
            </label>
          </div>
        </FormBorderedPanel>
        {val(f, "consultedOther") === "Yes" && (
          <>
            <FormTextBlock
              label="If Yes, which company/agency? Please specify the type of assistance sought"
              value={`${val(f, "consultedAgency")}${val(f, "assistanceType") ? ` — ${val(f, "assistanceType")}` : ""}`}
              lines={2}
            />
          </>
        )}
        {val(f, "consultedOther") === "No" && (
          <FormTextBlock label="If No, why not?" value={val(f, "whyNotConsulted")} lines={2} />
        )}
      </FormPage>

      {/* Page 5 — Org structure + plans */}
      <FormPage>
        <FormAttachmentBlock
          label="Organizational Structure"
          minHeight={140}
        />
        <FormTextBlock
          label="4. Enterprise's plan for the next 5 years?"
          value={val(f, "plan5Years")}
          lines={3}
        />
        <FormTextBlock
          label="Next 10 years?"
          value={val(f, "plan10Years")}
          lines={3}
        />
        <FormTextBlock
          label="5. Current agreements and alliances undertaken"
          value={val(f, "agreements")}
          lines={3}
        />
      </FormPage>

      {/* Page 6 — Benchmark: raw materials + production */}
      <FormPage>
        <FormBlock>
          <SectionHeading>BENCHMARK INFORMATION</SectionHeading>
          <BenchmarkBullet>Production and Supply Chain</BenchmarkBullet>
        </FormBlock>
        <FormBlock>
          <BenchmarkBullet>Raw Material</BenchmarkBullet>
          <DataRowsTable columns={TNA_FORM_01_RAW_MATERIAL_COLUMNS} rows={tables.rawMaterials} />
        </FormBlock>
        <FormBlock>
          <BenchmarkBullet>Production</BenchmarkBullet>
          <DataRowsTable columns={TNA_FORM_01_PRODUCTION_COLUMNS} rows={tables.production} />
        </FormBlock>
      </FormPage>

      {/* Page 7 — Equipment + production problems */}
      <FormPage>
        <FormBlock>
          <BenchmarkBullet>Existing Functional Production Equipment</BenchmarkBullet>
          <DataRowsTable columns={TNA_FORM_01_EQUIPMENT_COLUMNS} rows={tables.equipment} />
        </FormBlock>
        <FormTextBlock
          label="Production Problems and Concerns"
          value={val(f, "productionProblemsConcerns")}
          lines={4}
        />
        <FormTextBlock
          label="Production Waste Management System"
          value={val(f, "wasteManagement")}
          lines={3}
        />
      </FormPage>

      {/* Page 8 — Production plan + plant layout */}
      <FormPage>
        <FormTextBlock label="Production Plan" value={val(f, "productionPlan")} lines={3} />
        <FormAttachmentBlock
          label="Plant Lay-Out"
          fileName={val(f, "plantLayoutFileName")}
          fileData={val(f, "plantLayoutFileData")}
          minHeight={160}
        />
      </FormPage>

      {/* Page 9 — Process flow + inventory/maintenance/cGMP/purchasing */}
      <FormPage>
        {processFlowIsAttachment ? (
          <FormAttachmentBlock
            label="Process Flow"
            fileName={val(f, "processFlowFileName")}
            fileData={val(f, "processFlowFileData")}
            minHeight={140}
          />
        ) : (
          <FormTextBlock label="Process Flow" value={val(f, "processFlow")} lines={4} />
        )}
        <FormTextBlock label="Inventory System" value={val(f, "inventorySystem")} lines={2} />
        <FormTextBlock label="Maintenance Program" value={val(f, "maintenanceProgram")} lines={2} />
        <FormTextBlock label="cGMP/HACCP Activities" value={val(f, "cgmpHaccp")} lines={2} />
        <FormTextBlock
          label="Supplies/Purchasing System"
          value={val(f, "purchasingSystem")}
          lines={2}
        />
      </FormPage>

      {/* Page 10 — Marketing */}
      <FormPage>
        <FormBlock>
          <BenchmarkBullet>Marketing</BenchmarkBullet>
          <FormTextBlock label="Marketing Plan" value={val(f, "marketingPlan")} lines={3} />
          <FormTextBlock
            label="Market Outlets and Number"
            value={val(f, "marketOutlets")}
            lines={2}
          />
          <FormTextBlock
            label="Promotional Strategies"
            value={val(f, "promotionalStrategies")}
            lines={2}
          />
        </FormBlock>
      </FormPage>

      {/* Page 11 — Competitors + packaging */}
      <FormPage>
        <FormTextBlock
          label="Market Competitors"
          value={val(f, "marketCompetitors")}
          lines={3}
        />
        <FormBlock>
          <p className="tna-form-subheading">Packaging</p>
          <FormTable>
          <thead>
            <tr>
              <th>Requirement</th>
              <th style={{ width: "12%" }}>Yes</th>
              <th style={{ width: "12%" }}>No</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {TNA_FORM_01_PACKAGING_ROWS.map((row) => {
              const on = checked(f, row.key);
              return (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td className="tna-form-center">
                    <FormCheckbox checked={on} />
                  </td>
                  <td className="tna-form-center">
                    <FormCheckbox checked={!on} />
                  </td>
                  <td>{val(f, row.remarksKey)}</td>
                </tr>
              );
            })}
          </tbody>
        </FormTable>
        </FormBlock>
      </FormPage>

      {/* Page 12 — Finance + HR (part 1) */}
      <FormPage>
        <FormBlock>
          <BenchmarkBullet>Finance</BenchmarkBullet>
          <FormTextBlock
            label="Cash Flow or other related documents"
            value={val(f, "cashFlow")}
            lines={3}
          />
          <FormTextBlock
            label="Source(s) of capital/credit"
            value={val(f, "capitalSource")}
            lines={2}
          />
          <FormTextBlock label="Accounting System" value={val(f, "accountingSystem")} lines={2} />
        </FormBlock>

        <FormBlock>
          <BenchmarkBullet>Human Resources</BenchmarkBullet>
          <FormTextBlock label="Hiring and Criteria" value={val(f, "hiringCriteria")} lines={2} />
          <FormTextBlock
            label="Incentives to Employees"
            value={val(f, "employeeIncentives")}
            lines={2}
          />
          <FormTextBlock
            label="Training and Development"
            value={val(f, "trainingDevelopment")}
            lines={2}
          />
        </FormBlock>
      </FormPage>

      {/* Page 13 — HR (part 2) + Other concerns */}
      <FormPage>
        <FormTextBlock
          label="Safety Measures Practiced"
          value={val(f, "safetyMeasures")}
          lines={2}
        />
        <FormTextBlock label="Other Employee Welfare" value={val(f, "employeeWelfare")} lines={2} />
        <FormBlock>
          <BenchmarkBullet>Other Concerns</BenchmarkBullet>
          <FormTextBlock label="" value={val(f, "otherConcerns")} lines={5} />
        </FormBlock>
      </FormPage>

      {/* Page 14 — Signatures */}
      <FormPage>
        <FormBlock>
          <FormTable className="tna-form-signature-table">
          <tbody>
            <tr>
              <td className="tna-form-signature-cell">
                <p className="tna-form-signature-title">Prepared by:</p>
                <div className="tna-form-signature-line" />
                <p className="tna-form-signature-label">
                  Printed Name and Signature of Owner/Chair/Representative
                </p>
                <p className="tna-form-signature-name">{val(f, "undertakingName")}</p>
                <p className="tna-form-signature-date">
                  Date: {formatDisplayDate(val(f, "preparedDate"))}
                </p>
              </td>
              <td className="tna-form-signature-cell">
                <p className="tna-form-signature-title">Validated by:</p>
                <div className="tna-form-signature-line" />
                <p className="tna-form-signature-label">
                  Printed Name and Signature of PSTD
                </p>
                <p className="tna-form-signature-name">{val(f, "validatedByName")}</p>
                <p className="tna-form-signature-date">
                  Date: {formatDisplayDate(val(f, "validatedDate"))}
                </p>
              </td>
            </tr>
          </tbody>
        </FormTable>
        </FormBlock>
      </FormPage>
    </div>
  );
}
