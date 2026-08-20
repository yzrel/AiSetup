/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST TNA Form 02 (Annex 1-2) — on-screen preview and print.
 * Source: TNA FORM 02.docx — SETUP Guidelines (Revision 3.0).
 * Layout mirrors TNA Form 01 / Project Proposal: title + field table, flowing blocks, pt typography.
 */

import type { ReactNode } from "react";
import type { Tna2DocumentResponse } from "../../api/types";
import {
  TNA_FORM_02_INTERVENTION_COLUMNS,
  TNA_FORM_02_SCOPE_GROUPS,
  TNA_FORM_02_SCOPE_HEADING,
  TNA_FORM_02_SCOPE_NOTE,
  TNA_FORM_02_SECTION_BACKGROUND,
  TNA_FORM_02_SECTION_CONCLUSIONS,
  TNA_FORM_02_SECTION_FINDINGS,
  TNA_FORM_02_SECTION_METHODOLOGY,
  TNA_FORM_02_SECTION_OTHER,
  TNA_FORM_02_SECTION_RECOMMENDATIONS,
  TNA_FORM_02_SECTION_SUMMARY,
  TNA_FORM_02_SUBTITLE,
  TNA_FORM_02_TITLE,
  displayValue,
} from "../../constants/tnaForm02Layout";
import { enrichTna2Summary } from "../../utils/tnaForm02";

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

function FormBlock({
  children,
  keepTogether = false,
}: {
  children: ReactNode;
  keepTogether?: boolean;
}) {
  return (
    <div
      className={`tna2-form-block tna-print-section${keepTogether ? " tna2-form-block-keep" : " tna2-form-block-flow"}`}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  children,
  centered = false,
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <p
      className={`tna2-form-section-heading${centered ? " tna2-form-section-heading-center" : ""}`}
    >
      {children}
    </p>
  );
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
  className = "",
}: {
  children: ReactNode;
  width?: string;
  colSpan?: number;
  className?: string;
}) {
  return (
    <td
      className={`tna2-form-label ${className}`}
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
  className = "",
}: {
  children: ReactNode;
  colSpan?: number;
  className?: string;
}) {
  return (
    <td className={`tna2-form-value ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function isTapScopedItem(
  item: (typeof TNA_FORM_02_SCOPE_GROUPS)[number]["items"][number],
): boolean {
  return "tapScoped" in item && item.tapScoped === true;
}

function scopeTapLabel(
  item: (typeof TNA_FORM_02_SCOPE_GROUPS)[number]["items"][number],
): string {
  return `*${item.label}`;
}

/** Render one scope group as Word bullets + optional nested TAP asterisk sub-list. */
function ScopeGroupItems({
  group,
}: {
  group: (typeof TNA_FORM_02_SCOPE_GROUPS)[number];
}) {
  const items = group.items;
  const allTapScoped = items.length > 0 && items.every(isTapScopedItem);

  if (allTapScoped) {
    return (
      <li className="tna2-form-scope-bullet">
        {group.label}
        <ul className="tna2-form-scope-nested">
          {items.map((item) => (
            <li key={item.id} className="tna2-form-scope-nested-item">
              {scopeTapLabel(item)}
            </li>
          ))}
        </ul>
      </li>
    );
  }

  const nodes: ReactNode[] = [
    <li key={`${group.id}-label`} className="tna2-form-scope-bullet">
      {group.label}
    </li>,
  ];

  let index = 0;
  while (index < items.length) {
    const item = items[index];
    if (isTapScopedItem(item)) {
      index += 1;
      continue;
    }

    const tapChildren: (typeof items)[number][] = [];
    index += 1;
    while (index < items.length && isTapScopedItem(items[index])) {
      tapChildren.push(items[index]);
      index += 1;
    }

    nodes.push(
      <li key={item.id} className="tna2-form-scope-bullet">
        {item.label}
        {tapChildren.length > 0 ? (
          <ul className="tna2-form-scope-nested">
            {tapChildren.map((tapItem) => (
              <li key={tapItem.id} className="tna2-form-scope-nested-item">
                {scopeTapLabel(tapItem)}
              </li>
            ))}
          </ul>
        ) : null}
      </li>,
    );
  }

  return <>{nodes}</>;
}

/** Word table row 5 — bulleted scope list with nested TAP asterisk items. */
function ScopeTableContent() {
  return (
    <div className="tna2-form-scope-table-content">
      <p className="tna2-form-scope-intro">The TNA covered the following areas:</p>
      <ul className="tna2-form-scope-list">
        {TNA_FORM_02_SCOPE_GROUPS.map((group) => (
          <ScopeGroupItems key={group.id} group={group} />
        ))}
      </ul>
    </div>
  );
}

function WordHeaderTable({
  enterpriseName,
  address,
}: {
  enterpriseName: string;
  address: string;
}) {
  return (
    <FormBlock keepTogether>
      <h1 className="tna2-form-title">{TNA_FORM_02_TITLE}</h1>
      <FormTable className="tna2-form-field-table">
        <tbody>
          <tr>
            <FormValueCell colSpan={2} className="tna2-form-center">
              <span className="tna2-form-subtitle">{TNA_FORM_02_SUBTITLE}</span>
            </FormValueCell>
          </tr>
          <tr>
            <FormLabelCell width="28%">COMPANY:</FormLabelCell>
            <FormValueCell>{enterpriseName || "\u00a0"}</FormValueCell>
          </tr>
          <tr>
            <FormLabelCell>ADDRESS:</FormLabelCell>
            <FormValueCell>{address || "\u00a0"}</FormValueCell>
          </tr>
          <tr>
            <FormLabelCell colSpan={2} className="tna2-form-scope-header">
              {TNA_FORM_02_SCOPE_HEADING}
            </FormLabelCell>
          </tr>
          <tr>
            <FormValueCell colSpan={2} className="tna2-form-scope-cell">
              <ScopeTableContent />
            </FormValueCell>
          </tr>
        </tbody>
      </FormTable>
      <p className="tna2-form-scope-footnote">{TNA_FORM_02_SCOPE_NOTE}</p>
    </FormBlock>
  );
}

/** Blank template signatures (after scope, before summary). */
function SignatureTemplateBlock() {
  return (
    <FormBlock keepTogether>
      <div className="tna2-form-signature-columns">
        <div className="tna2-form-signature-col">
          <p className="tna2-form-signature-line-text">Reported by:</p>
          <p className="tna2-form-signature-caption">Name of TNA Team Leader</p>
          <p className="tna2-form-signature-line-text">Date:____</p>
        </div>
        <div className="tna2-form-signature-col">
          <p className="tna2-form-signature-line-text">Attested by:</p>
          <p className="tna2-form-signature-caption">Name of ARD</p>
          <p className="tna2-form-signature-line-text">Date:____</p>
        </div>
      </div>
    </FormBlock>
  );
}

/** Filled closing signatures — Word tabbed row (Reported by / Date / Attested by). */
function SignatureClosingBlock({ doc }: { doc: Tna2DocumentResponse }) {
  const assessor = doc.assessor ?? {};
  const attestedBy = doc.attestedBy ?? {};
  const leaderName = val(assessor.name);
  const leaderDate = val(doc.assessmentDate);
  const ardName = val(attestedBy.name);

  return (
    <FormBlock keepTogether>
      <div className="tna2-form-signature-closing">
        <div className="tna2-form-signature-closing-row">
          <p className="tna2-form-signature-line-text">
            Reported by:{leaderName}
            {leaderName ? " Date:" : ""}
          </p>
          <p className="tna2-form-signature-line-text tna2-form-signature-attest">
            Attested by:{ardName}
            {ardName ? "Date:" : ""}
          </p>
        </div>
        {leaderDate ? (
          <p className="tna2-form-signature-date-line">{leaderDate}</p>
        ) : null}
        <div className="tna2-form-signature-closing-row">
          <p className="tna2-form-signature-caption">Name of TNA Team Leader</p>
          <p className="tna2-form-signature-caption tna2-form-signature-attest">Name of ARD</p>
        </div>
      </div>
    </FormBlock>
  );
}

function TnaTeamBlock({ doc, inline = false }: { doc: Tna2DocumentResponse; inline?: boolean }) {
  const team = doc.tnaTeam ?? { leader: { name: "" }, members: [] };
  const members = team.members?.length ? team.members : [];
  const leaderName = val(team.leader?.name);
  const leaderTitle = val(team.leader?.title);

  const content = (
    <>
      <p className="tna2-form-team-heading">TNA Team:</p>
      <p className="tna2-form-team-line">
        Team Leader:{leaderName || "\u00a0"}
      </p>
      {leaderTitle ? <p className="tna2-form-team-detail">{leaderTitle}</p> : null}
      {members.map((member, i) => {
        const memberName = val(member.name);
        const memberTitle = val(member.title);
        return (
          <div key={i} className="tna2-form-team-member">
            {i === 0 ? (
              <p className="tna2-form-team-line">
                Members:{memberName || "\u00a0"}
              </p>
            ) : (
              <p className="tna2-form-team-detail">{memberName || "\u00a0"}</p>
            )}
            {memberTitle ? (
              <p className="tna2-form-team-detail">{memberTitle}</p>
            ) : null}
          </div>
        );
      })}
    </>
  );

  if (inline) {
    return <div className="tna2-form-team-block">{content}</div>;
  }

  return <FormBlock>{content}</FormBlock>;
}

function RecommendationsBlock({ items }: { items: string[] }) {
  const filled = items.filter((item) => val(item));
  if (filled.length === 0) {
    return <p className="tna2-form-empty">—</p>;
  }
  return (
    <>
      {filled.map((item, i) => (
        <p key={i} className="tna2-form-prose">
          {item}
        </p>
      ))}
    </>
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

  return (
    <div className="tna2-form-document-root">
      <FormPage>
        <WordHeaderTable
          enterpriseName={val(profile.enterpriseName)}
          address={val(profile.address)}
        />

        <SignatureTemplateBlock />

        <FormBlock>
          <SectionHeading centered>{TNA_FORM_02_SECTION_SUMMARY}</SectionHeading>
          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_BACKGROUND}:</p>
          <p className="tna2-form-prose">{val(doc.background) || "—"}</p>

          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_METHODOLOGY}</p>
          <p className="tna2-form-prose">{val(doc.methodology) || "—"}</p>

          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_FINDINGS}</p>
          {findings.length === 0 ? (
            <p className="tna2-form-empty">—</p>
          ) : (
            findings.map((section) => {
              const subsectionList = Array.isArray(section.subsections)
                ? section.subsections
                : section.subsections
                  ? [section.subsections]
                  : [];
              const subs = subsectionList.filter((s) => val(s.content));
              const hasSectionContent = val(section.content) || subs.length > 0;
              if (!hasSectionContent) return null;

              return (
                <div key={section.title} className="tna2-form-finding-block">
                  <p className="tna2-form-finding-title">{section.title}</p>
                  {subs.length > 0 ? (
                    subs.map((sub) => (
                      <div key={sub.id} className="tna2-form-finding-sub">
                        <p className="tna2-form-finding-sub-label">{sub.label}:</p>
                        <p className="tna2-form-prose">{val(sub.content)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="tna2-form-prose">{val(section.content)}</p>
                  )}
                </div>
              );
            })
          )}

          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_OTHER}:</p>
          <p className="tna2-form-prose">{val(doc.otherObservations) || "—"}</p>

          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_CONCLUSIONS}:</p>
          <p className="tna2-form-prose">{val(doc.conclusions) || "—"}</p>

          <p className="tna2-form-subheading">{TNA_FORM_02_SECTION_RECOMMENDATIONS}:</p>
          <RecommendationsBlock items={recommendations} />

          <FormTable className="tna2-form-intervention-table">
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

          <TnaTeamBlock doc={doc} inline />
          <SignatureClosingBlock doc={doc} />
        </FormBlock>
      </FormPage>
    </div>
  );
}

