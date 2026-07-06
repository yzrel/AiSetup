/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST TNA Form 02 document (on-screen preview and print).
 * Layout follows regional forms pack / filled sample: scope checklist,
 * SUMMARY OF ASSESSMENT, intervention table, TNA team, signatures.
 */

import type { ReactNode } from "react";
import type { Tna2DocumentResponse } from "../../api/types";
import {
  TNA_FORM_02_INTERVENTION_COLUMNS,
  TNA_FORM_02_SCOPE_GROUPS,
  TNA_FORM_02_SCOPE_NOTE,
  TNA_FORM_02_SECTION_BACKGROUND,
  TNA_FORM_02_SECTION_CONCLUSIONS,
  TNA_FORM_02_SECTION_FINDINGS,
  TNA_FORM_02_SECTION_METHODOLOGY,
  TNA_FORM_02_SECTION_OTHER,
  TNA_FORM_02_SECTION_RECOMMENDATIONS,
  TNA_FORM_02_SECTION_SUMMARY,
  TNA_FORM_02_SECTION_TEAM,
  TNA_FORM_02_SUBTITLE,
  TNA_FORM_02_TITLE,
  displayValue,
} from "../../constants/tnaForm02Layout";
import { deriveScopeItems, enrichTna2Summary } from "../../utils/tnaForm02";

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
}: {
  children: ReactNode;
  width?: string;
  colSpan?: number;
}) {
  return (
    <td
      className="tna2-form-label"
      style={width ? { width } : undefined}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

function FormValueCell({
  children,
  colSpan,
}: {
  children: ReactNode;
  colSpan?: number;
}) {
  return (
    <td className="tna2-form-value" colSpan={colSpan}>
      {children}
    </td>
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
      <p className="tna2-form-subtitle">{TNA_FORM_02_SUBTITLE}</p>
    </header>
  );
}

function ScopeChecklist({ document: doc }: { document: Tna2DocumentResponse }) {
  const scopeItems = deriveScopeItems(doc);
  const byId = new Map(scopeItems.map((item) => [item.id, item]));

  return (
    <FormBlock>
      <SectionHeading>SCOPE OF ASSESSMENT</SectionHeading>
      <p className="tna2-form-scope-intro">The TNA covered the following areas:</p>
      {TNA_FORM_02_SCOPE_GROUPS.map((group) => (
        <div key={group.id} className="tna2-form-scope-group">
          <p className="tna2-form-scope-group-label">{group.label}</p>
          <ul className="tna2-form-scope-list">
            {group.items.map((item) => {
              const entry = byId.get(item.id);
              const covered = entry?.covered ?? false;
              const notes = entry?.notes?.trim() ?? "";
              return (
                <li key={item.id} className="tna2-form-scope-item">
                  <span className="tna2-form-scope-check" aria-hidden>
                    {covered ? "☑" : "☐"}
                  </span>
                  <span className="tna2-form-scope-item-label">{item.label}</span>
                  {notes ? (
                    <span className="tna2-form-scope-notes"> — {notes}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="tna2-form-scope-footnote">{TNA_FORM_02_SCOPE_NOTE}</p>
    </FormBlock>
  );
}

function SignatureBlock({
  doc,
}: {
  doc: Tna2DocumentResponse;
}) {
  const assessor = doc.assessor ?? {};
  const attestedBy = doc.attestedBy ?? {};
  return (
    <FormBlock>
      <FormTable className="tna2-form-signature-table">
        <tbody>
          <tr>
            <td className="tna2-form-signature-cell">
              <p className="tna2-form-signature-title">Reported by:</p>
              <div className="tna2-form-signature-line" />
              <p className="tna2-form-signature-label">Name of TNA Team Leader</p>
              <p className="tna2-form-signature-name">{val(assessor.name)}</p>
              <p className="tna2-form-signature-meta">{val(assessor.title)}</p>
              <p className="tna2-form-signature-meta">{val(assessor.office)}</p>
              <p className="tna2-form-signature-date">
                Date: {val(doc.assessmentDate) || "__________________"}
              </p>
            </td>
            <td className="tna2-form-signature-cell">
              <p className="tna2-form-signature-title">Attested by:</p>
              <div className="tna2-form-signature-line" />
              <p className="tna2-form-signature-label">Name of ARD</p>
              <p className="tna2-form-signature-name">
                {val(attestedBy.name) || "\u00a0"}
              </p>
              <p className="tna2-form-signature-meta">
                {val(attestedBy.title) || "Assistant Regional Director"}
              </p>
              <p className="tna2-form-signature-meta">{val(attestedBy.office)}</p>
              <p className="tna2-form-signature-date">Date: __________________</p>
            </td>
          </tr>
        </tbody>
      </FormTable>
    </FormBlock>
  );
}

export function TnaForm02Document({ document: raw }: TnaForm02DocumentProps) {
  const doc = enrichTna2Summary(raw);
  const profile = doc.enterpriseProfile ?? {};
  const findings = doc.findingsByArea ?? [];
  const recommendations = doc.recommendations ?? [];
  const interventionRows =
    doc.interventionRows?.length
      ? doc.interventionRows
      : [{ problem: "", intervention: "", equipment: "", impact: "" }];
  const team = doc.tnaTeam ?? { leader: { name: "" }, members: [] };

  return (
    <div className="tna2-form-document-root">
      <FormPage>
        <FormBlock>
          <FormHeader />
          <FormTable>
            <tbody>
              <tr>
                <FormLabelCell width="28%">COMPANY</FormLabelCell>
                <FormValueCell colSpan={3}>{val(profile.enterpriseName)}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>ADDRESS</FormLabelCell>
                <FormValueCell colSpan={3}>{val(profile.address)}</FormValueCell>
              </tr>
              <tr>
                <FormLabelCell>Assessment Date</FormLabelCell>
                <FormValueCell colSpan={3}>{val(doc.assessmentDate)}</FormValueCell>
              </tr>
            </tbody>
          </FormTable>
        </FormBlock>

        <ScopeChecklist document={doc} />
        <SignatureBlock doc={doc} />
      </FormPage>

      <FormPage>
        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_SUMMARY}</SectionHeading>
          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_BACKGROUND}</p>
          <p className="tna2-form-prose">{val(doc.background) || "—"}</p>

          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_METHODOLOGY}</p>
          <p className="tna2-form-prose">{val(doc.methodology) || "—"}</p>

          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_FINDINGS}</p>
          {findings.length === 0 ? (
            <p className="tna2-form-empty">—</p>
          ) : (
            findings.map((section) => {
              const subs = (section.subsections ?? []).filter((s) =>
                val(s.content),
              );
              const hasSubs = (section.subsections ?? []).length > 0;
              return (
                <div key={section.title} className="tna2-form-finding-block">
                  <p className="tna2-form-finding-title">{section.title}</p>
                  {hasSubs ? (
                    subs.length > 0 ? (
                      subs.map((sub) => (
                        <div key={sub.id} className="tna2-form-finding-sub">
                          <p className="tna2-form-finding-sub-label">{sub.label}</p>
                          <p className="tna2-form-prose">{val(sub.content)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="tna2-form-prose">
                        {val(section.content) || "—"}
                      </p>
                    )
                  ) : (
                    <p className="tna2-form-prose">
                      {val(section.content) || "—"}
                    </p>
                  )}
                </div>
              );
            })
          )}

          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_OTHER}</p>
          <p className="tna2-form-prose">{val(doc.otherObservations) || "—"}</p>

          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_CONCLUSIONS}</p>
          <p className="tna2-form-prose">{val(doc.conclusions) || "—"}</p>
        </FormBlock>
      </FormPage>

      <FormPage>
        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_RECOMMENDATIONS}</SectionHeading>
          <NumberedList items={recommendations} />
        </FormBlock>

        <FormBlock>
          <FormTable>
            <thead>
              <tr>
                {TNA_FORM_02_INTERVENTION_COLUMNS.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interventionRows.map((row, i) => (
                <tr key={i}>
                  <td>{val(row.problem) || "\u00a0"}</td>
                  <td>{val(row.intervention) || "\u00a0"}</td>
                  <td>{val(row.equipment) || "\u00a0"}</td>
                  <td>{val(row.impact) || "\u00a0"}</td>
                </tr>
              ))}
            </tbody>
          </FormTable>
        </FormBlock>

        <FormBlock>
          <SectionHeading>{TNA_FORM_02_SECTION_TEAM}</SectionHeading>
          <FormTable>
            <tbody>
              <tr>
                <FormLabelCell width="32%">Team Leader</FormLabelCell>
                <FormValueCell>
                  {val(team.leader?.name)}
                  {team.leader?.title ? ` — ${team.leader.title}` : ""}
                </FormValueCell>
              </tr>
              {(team.members?.length ? team.members : [{ name: "", title: "" }]).map(
                (m, i) => (
                  <tr key={i}>
                    <FormLabelCell>{i === 0 ? "Members" : ""}</FormLabelCell>
                    <FormValueCell>
                      {val(m.name)}
                      {m.title ? ` — ${m.title}` : ""}
                    </FormValueCell>
                  </tr>
                ),
              )}
            </tbody>
          </FormTable>
        </FormBlock>

        <SignatureBlock doc={doc} />
      </FormPage>
    </div>
  );
}
