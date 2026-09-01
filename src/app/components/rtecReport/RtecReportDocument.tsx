/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP Form 002 — RTEC Report (Annex A-2) printable document.
 * Source: Form 002 - RTEC Report.docx — SETUP Guidelines (Revision 3.0).
 * Preview and print mount this component (Word fidelity).
 */

import type { ReactNode } from "react";
import type {
  ProjectProposalAttachment,
  RtecConstraintRow,
  RtecFabricatorRow,
  RtecReportForm,
} from "../../api/types";
import { DOST_REGION_12_DIRECTOR_NAME } from "../../constants/region12";
import {
  RTEC_COMPLIANCE_COLUMNS,
  RTEC_COMPLIANCE_WIDTH_PCT,
  RTEC_CONSTRAINT_COLUMNS,
  RTEC_CONSTRAINT_EMPTY_ROWS,
  RTEC_CONSTRAINT_WIDTH_PCT,
  RTEC_COST_COLUMNS,
  RTEC_COST_EMPTY_ROWS,
  RTEC_COST_WIDTH_PCT,
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
  RTEC_TECH_CONSTRAINTS,
  RTEC_TECH_EXISTING_EQUIPMENT,
  RTEC_TECH_FABRICATORS,
  RTEC_TECH_INTERVENTION_COST,
  RTEC_TECH_MATERIAL_BALANCE,
  RTEC_TECH_PLANT_LAYOUT,
  RTEC_TECH_PROCESS_FLOW,
  RTEC_TECH_PRODUCTION_PROCESS,
  displayValue,
  formatCurrencyDisplay,
  padRowsForDocument,
  toOfficialComplianceItems,
  type RtecOfficialComplianceItem,
} from "../../constants/rtecReportLayout";
import {
  formatRiskAndAssumptions,
  getProjectProposalAttachments,
  getProjectProposalForm,
  getProjectProposalStored,
} from "../../utils/projectProposal";
import { applicantStore } from "../../store/applicantStore";
import { StoredFileImage } from "../StoredFilePreview";
import { isImageFile } from "../../utils/storedFilePreview";

export interface RtecReportDocumentProps {
  form: RtecReportForm;
  applicantId?: string;
}

function val(value: unknown): string {
  return displayValue(value);
}

function FormBlock({ children }: { children: ReactNode }) {
  return <div className="rtec-form-block">{children}</div>;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="rtec-form-section-heading">{children}</h2>;
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="rtec-form-subheading">{children}</h3>;
}

function NestedHeading({ children }: { children: ReactNode }) {
  return <h4 className="rtec-form-nested-heading">{children}</h4>;
}

function Indent({
  level = 1,
  children,
}: {
  level?: 1 | 2;
  children: ReactNode;
}) {
  return <div className={`rtec-form-indent-${level}`}>{children}</div>;
}

function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rtec-form-field-line">
      <span className="rtec-form-field-label">{label}</span>
      <span className="rtec-form-field-value">{val(value) || "\u00a0"}</span>
    </div>
  );
}

function NarrativeBlock({ text }: { text: string }) {
  const content = val(text);
  if (!content) return <p className="rtec-form-empty">{"\u00a0"}</p>;
  return <p className="rtec-form-narrative">{content}</p>;
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

function ComplianceTable({ items }: { items: RtecOfficialComplianceItem[] }) {
  const mark = (
    status: RtecOfficialComplianceItem["status"],
    target: "complied" | "not_complied",
  ) => {
    if (status === target) return "\u2713";
    return "";
  };

  return (
    <table className="rtec-form-table rtec-form-compliance-table">
      <colgroup>
        {RTEC_COMPLIANCE_WIDTH_PCT.map((w) => (
          <col key={w} style={{ width: w }} />
        ))}
      </colgroup>
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
            <td className="rtec-form-check-cell">
              {mark(item.status, "complied")}
            </td>
            <td className="rtec-form-check-cell">
              {mark(item.status, "not_complied")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConstraintTable({ rows }: { rows: RtecConstraintRow[] }) {
  const empty = (): RtecConstraintRow => ({
    id: `blank-${Math.random().toString(36).slice(2, 8)}`,
    processProblem: "",
    proposedIntervention: "",
    equipmentSkills: "",
    impact: "",
  });
  const body = padRowsForDocument(rows, empty, RTEC_CONSTRAINT_EMPTY_ROWS);

  return (
    <table className="rtec-form-table rtec-form-constraint-table">
      <colgroup>
        {RTEC_CONSTRAINT_WIDTH_PCT.map((w) => (
          <col key={w} style={{ width: w }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {RTEC_CONSTRAINT_COLUMNS.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, i) => (
          <tr key={row.id || `constraint-${i}`}>
            <td>{val(row.processProblem) || "\u00a0"}</td>
            <td>{val(row.proposedIntervention) || "\u00a0"}</td>
            <td>{val(row.equipmentSkills) || "\u00a0"}</td>
            <td>{val(row.impact) || "\u00a0"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InterventionCostTable({ rows }: { rows: string[][] }) {
  const filled = rows.filter((r) => r.some((c) => val(c)));
  const empty = (): string[] => ["", "", "", ""];
  const body = padRowsForDocument(filled, empty, RTEC_COST_EMPTY_ROWS);
  const total = filled.reduce((sum, row) => {
    const n = Number(String(row[3] ?? "").replace(/[^\d.]/g, ""));
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  const totalDisplay =
    total > 0
      ? formatCurrencyDisplay(String(total))
      : "";

  return (
    <table className="rtec-form-table rtec-form-cost-table">
      <colgroup>
        {RTEC_COST_WIDTH_PCT.map((w) => (
          <col key={w} style={{ width: w }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {RTEC_COST_COLUMNS.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, i) => (
          <tr key={`cost-${i}`}>
            <td>{val(row[0]) || "\u00a0"}</td>
            <td className="rtec-form-center">{val(row[1]) || "\u00a0"}</td>
            <td className="rtec-form-right">{val(row[2]) || "\u00a0"}</td>
            <td className="rtec-form-right">{val(row[3]) || "\u00a0"}</td>
          </tr>
        ))}
        <tr className="rtec-form-total-row">
          <td colSpan={3} className="rtec-form-total-label">
            Total
          </td>
          <td className="rtec-form-right rtec-form-total-amount">
            {totalDisplay || "\u00a0"}
          </td>
        </tr>
      </tbody>
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
      <div className="rtec-form-attachment-placeholder">
        <p className="rtec-form-attachment-label">{label}</p>
      </div>
    );
  }
  const isImage = isImageFile(
    attachment.mimeType,
    attachment.fileName,
    attachment.dataUrl,
  );
  return (
    <div className="rtec-form-attachment">
      <p className="rtec-form-attachment-label">{label}</p>
      {isImage ? (
        <StoredFileImage
          applicantId={applicantId}
          file={attachment}
          alt={attachment.fileName}
        />
      ) : (
        <p className="rtec-form-attachment-file">{attachment.fileName}</p>
      )}
    </div>
  );
}

/** Form 001 “- Material Balance” narrative — snapshot, then live proposal / generated document. */
function resolveMaterialBalance(
  form: RtecReportForm,
  applicantId?: string,
): string {
  const fromSnap = val(form.proposalSnapshot?.materialBalance);
  if (fromSnap) return fromSnap;

  if (applicantId) {
    const applicant = applicantStore.getById(applicantId);
    if (applicant) {
      const live = getProjectProposalForm(applicant);
      if (val(live.materialBalance)) return val(live.materialBalance);
      const docBalance = val(
        getProjectProposalStored(applicant)?.document?.materialBalance,
      );
      if (docBalance) return docBalance;
    }
  }

  return "";
}

function existingEquipmentText(pp: RtecReportForm["proposalSnapshot"]): string {
  if (val(pp.equipmentNarrative)) return val(pp.equipmentNarrative);
  const lines = (pp.equipmentTable ?? [])
    .filter((r) => r.some((c) => val(c)))
    .map((r) =>
      [r[0], r[1] ? `Qty: ${r[1]}` : "", r[2] ? `Spec: ${r[2]}` : ""]
        .filter(Boolean)
        .join(" — "),
    )
    .filter(Boolean);
  return lines.join("\n");
}

function managementNarrative(pp: RtecReportForm["proposalSnapshot"]): string {
  const parts = [val(pp.skillsExpertise), val(pp.compensation)].filter(Boolean);
  return parts.join("\n\n");
}

function marketingNarrative(pp: RtecReportForm["proposalSnapshot"]): string {
  const parts = [
    val(pp.marketSituation),
    val(pp.productDemandSupply),
    val(pp.existingMarketingProblems),
    ...(pp.marketStrategies ?? []).map((s) => val(s)).filter(Boolean),
  ].filter(Boolean);
  return parts.join("\n\n");
}

function riskNarrative(pp: RtecReportForm["proposalSnapshot"]): string {
  const rows = pp.riskRows ?? [];
  if (!rows.length) return "";
  return rows
    .map((row) => {
      const bits = [
        val(row.objective) ? `Objective: ${val(row.objective)}` : "",
        val(formatRiskAndAssumptions(row))
          ? `Risks/Assumptions: ${val(formatRiskAndAssumptions(row))}`
          : "",
        val(row.plan) ? `Plan: ${val(row.plan)}` : "",
      ].filter(Boolean);
      return bits.join(" ");
    })
    .filter(Boolean)
    .join("\n\n");
}

function fabricatorLines(rows: RtecFabricatorRow[]): string {
  return rows
    .map((r) => {
      const name = val(r.name);
      const address = val(r.address);
      if (!name && !address) return "";
      return [name, address].filter(Boolean).join(" — ");
    })
    .filter(Boolean)
    .join("\n");
}

function money(value: string): string {
  return formatCurrencyDisplay(value) || val(value) || "\u00a0";
}

function hasAttachmentFile(attachment?: ProjectProposalAttachment): boolean {
  if (!attachment) return false;
  return Boolean(
    val(attachment.fileName) ||
      val(attachment.dataUrl) ||
      val(attachment.fileId),
  );
}

/** Prefer RTEC snapshot; fall back to live Form 001 / TNA plant-layout upload. */
function resolvePlantLayout(
  form: RtecReportForm,
  applicantId?: string,
): ProjectProposalAttachment | undefined {
  const fromForm = (form.attachmentRefs ?? []).find(
    (a) => a.kind === "plantLayout",
  );
  if (hasAttachmentFile(fromForm)) return fromForm;
  if (!applicantId) return fromForm;
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return fromForm;
  return (
    getProjectProposalAttachments(applicant).find(
      (a) => a.kind === "plantLayout",
    ) ?? fromForm
  );
}

export function RtecReportDocument({
  form,
  applicantId,
}: RtecReportDocumentProps) {
  const pp = form.proposalSnapshot;
  const sig = form.signatures;
  const officialCompliance = toOfficialComplianceItems(form.complianceItems);
  const plantLayout = resolvePlantLayout(form, applicantId);

  return (
    <div className="rtec-form-document-root">
      <section className="rtec-form-page">
        <div className="rtec-form-page-body">
          <h1 className="rtec-form-title">{RTEC_REPORT_TITLE}</h1>

          <FormBlock>
            <div className="rtec-form-header-fields">
              <FieldLine label="Project Title:" value={pp.projectTitle} />
              <FieldLine
                label="Proponent:"
                value={pp.proponentName || pp.firmName}
              />
              <FieldLine label="Contact Person:" value={pp.contactPerson} />
            </div>

            <div className="rtec-form-cost-block">
              <p className="rtec-form-cost-heading">Project Cost:</p>
              <div className="rtec-form-cost-grid">
                <div className="rtec-form-cost-cell">
                  <span className="rtec-form-cost-label">Proponent</span>
                  <p className="rtec-form-cost-value">
                    {money(form.projectCostProponent)}
                  </p>
                </div>
                <div className="rtec-form-cost-cell">
                  <span className="rtec-form-cost-label">DOST-SETUP</span>
                  <p className="rtec-form-cost-value">
                    {money(form.projectCostSetup)}
                  </p>
                </div>
                <div className="rtec-form-cost-cell">
                  <span className="rtec-form-cost-label">DOST-LGIA</span>
                  <p className="rtec-form-cost-value">
                    {money(form.projectCostLgia)}
                  </p>
                </div>
                <div className="rtec-form-cost-cell">
                  <span className="rtec-form-cost-label">Total</span>
                  <p className="rtec-form-cost-value">
                    {money(form.projectCostTotal)}
                  </p>
                </div>
              </div>
            </div>
          </FormBlock>

          <FormBlock>
            <SectionHeading>{RTEC_SECTION_I}</SectionHeading>
            <Indent level={1}>
              <SubHeading>{RTEC_SUBSECTION_COMPANY}</SubHeading>
              <div className="rtec-form-profile-lines">
                <FieldLine label="Name of Firm:" value={pp.firmName} />
                <FieldLine label="Address:" value={pp.firmAddress} />
                <FieldLine label="Contact Person:" value={pp.contactPerson} />
                <FieldLine label="Contact No.:" value={pp.contactNumber} />
              </div>

              <SubHeading>{RTEC_SUBSECTION_OBJECTIVES}</SubHeading>
              <Indent level={2}>
                <p className="rtec-form-field-caption">General Objective</p>
                <NarrativeBlock text={pp.generalObjective} />
                <p className="rtec-form-field-caption">Specific Objectives</p>
                <BulletList items={pp.specificObjectives ?? []} />
              </Indent>

              <SubHeading>{RTEC_SUBSECTION_EXPECTED}</SubHeading>
              <Indent level={2}>
                <BulletList items={pp.expectedOutputBullets ?? []} />
              </Indent>
            </Indent>
          </FormBlock>

          <FormBlock>
            <SectionHeading>{RTEC_SECTION_II}</SectionHeading>
            <ComplianceTable items={officialCompliance} />
          </FormBlock>

          <FormBlock>
            <SectionHeading>{RTEC_SECTION_III}</SectionHeading>
            <Indent level={1}>
              <SubHeading>{RTEC_SUBSECTION_MANAGEMENT}</SubHeading>
              <NarrativeBlock text={managementNarrative(pp)} />
            </Indent>
          </FormBlock>

          <FormBlock>
            <Indent level={1}>
              <SubHeading>{RTEC_SUBSECTION_TECHNICAL}</SubHeading>
              <Indent level={2}>
                <NestedHeading>{RTEC_TECH_PRODUCTION_PROCESS}</NestedHeading>
                <p className="rtec-form-field-caption">{RTEC_TECH_PROCESS_FLOW}</p>
                <NarrativeBlock text={pp.productionProcess} />
                <p className="rtec-form-field-caption">{RTEC_TECH_MATERIAL_BALANCE}</p>
                <NarrativeBlock
                  text={resolveMaterialBalance(form, applicantId)}
                />

                <NestedHeading>{RTEC_TECH_EXISTING_EQUIPMENT}</NestedHeading>
                <NarrativeBlock text={existingEquipmentText(pp)} />

                <NestedHeading>{RTEC_TECH_CONSTRAINTS}</NestedHeading>
                <ConstraintTable rows={form.constraintRows ?? []} />

                <NestedHeading>{RTEC_TECH_PLANT_LAYOUT}</NestedHeading>
                <AttachmentFigure
                  attachment={plantLayout}
                  label={RTEC_TECH_PLANT_LAYOUT}
                  applicantId={applicantId}
                />

                <NestedHeading>{RTEC_TECH_INTERVENTION_COST}</NestedHeading>
                <InterventionCostTable rows={pp.interventionCostTable ?? []} />

                <NestedHeading>{RTEC_TECH_FABRICATORS}</NestedHeading>
                <NarrativeBlock
                  text={fabricatorLines(form.fabricatorRows ?? [])}
                />
              </Indent>
            </Indent>
          </FormBlock>

          <FormBlock>
            <Indent level={1}>
              <SubHeading>{RTEC_SUBSECTION_MARKETING}</SubHeading>
              <NarrativeBlock text={marketingNarrative(pp)} />
            </Indent>
          </FormBlock>

          <FormBlock>
            <Indent level={1}>
              <SubHeading>{RTEC_SUBSECTION_FINANCIAL}</SubHeading>
              <NarrativeBlock
                text={form.ratioNarrative || pp.financialAnalysis}
              />
            </Indent>
          </FormBlock>

          <FormBlock>
            <Indent level={1}>
              <SubHeading>{RTEC_SUBSECTION_WASTE}</SubHeading>
              <NarrativeBlock text={pp.wasteManagement} />
            </Indent>
          </FormBlock>

          <FormBlock>
            <Indent level={1}>
              <SubHeading>{RTEC_SUBSECTION_RISK}</SubHeading>
              <NarrativeBlock text={riskNarrative(pp)} />
            </Indent>
          </FormBlock>

          <FormBlock>
            <SectionHeading>{RTEC_SECTION_IV}</SectionHeading>
            <NarrativeBlock text={form.recommendation} />

            <div className="rtec-form-signatures">
              <p className="rtec-form-sig-title">Evaluated by:</p>

              <div className="rtec-form-sig-chair">
                <div className="rtec-form-sig-line" />
                <p className="rtec-form-sig-name">
                  {val(sig.chairperson) || "\u00a0"}
                </p>
                <p className="rtec-form-sig-role">RTEC Chairperson</p>
              </div>

              <div className="rtec-form-sig-members">
                {(["member1", "member2", "member3"] as const).map((k) => (
                  <div key={k} className="rtec-form-sig-member">
                    <div className="rtec-form-sig-line" />
                    <p className="rtec-form-sig-name">{val(sig[k]) || "\u00a0"}</p>
                    <p className="rtec-form-sig-role">Member</p>
                  </div>
                ))}
              </div>

              <div className="rtec-form-sig-endorse">
                <div className="rtec-form-sig-endorse-cell">
                  <p className="rtec-form-sig-endorse-label">
                    Reviewed and endorsed by:
                  </p>
                  <div className="rtec-form-sig-line" />
                  <p className="rtec-form-sig-name">{val(sig.rpmo) || "\u00a0"}</p>
                  <p className="rtec-form-sig-role">RPMO</p>
                </div>
                <div className="rtec-form-sig-endorse-cell">
                  <p className="rtec-form-sig-endorse-label">Noted by:</p>
                  <div className="rtec-form-sig-line" />
                  <p className="rtec-form-sig-name">
                    {val(sig.regionalDirector) || DOST_REGION_12_DIRECTOR_NAME}
                  </p>
                  <p className="rtec-form-sig-role">Regional Director</p>
                </div>
              </div>
            </div>
          </FormBlock>
        </div>
      </section>
    </div>
  );
}
