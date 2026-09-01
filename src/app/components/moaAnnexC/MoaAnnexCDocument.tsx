/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official Proforma MOA — Annex C printable document.
 * Source: Proforma MOA - Annex C.docx — SETUP Guidelines (Revision 3.0).
 * Preview and print mount this component (Word fidelity for MOA body + Acknowledgment).
 */

import type { ReactNode } from "react";
import type { MoaAnnexCForm } from "../../api/types";
import {
  MOA_ACKNOWLEDGMENT_TITLE,
  MOA_AMENDMENTS_BODY,
  MOA_AMENDMENTS_TITLE,
  MOA_ANNEX_A_NOTE,
  MOA_ANNEX_LABELS,
  MOA_DEMAND_LETTER,
  MOA_EFFECTIVITY_BODY,
  MOA_EFFECTIVITY_TITLE,
  MOA_FIRST_PARTY_OBLIGATIONS,
  MOA_FIRST_PARTY_SHALL,
  MOA_INTERVENTION_HRD,
  MOA_INTERVENTION_PROCESS,
  MOA_INTERVENTION_SYSTEM,
  MOA_INTERVENTIONS_HEAD,
  MOA_INTRO,
  MOA_KNOW_ALL,
  MOA_NOW_THEREFORE,
  MOA_PIS_ONGOING,
  MOA_PIS_PRE,
  MOA_PUBLICATION_BODY,
  MOA_PUBLICATION_TITLE,
  MOA_REFUND_CLAUSE,
  MOA_REFUND_TITLE,
  MOA_SECOND_PARTY_OBLIGATIONS,
  MOA_SECOND_PARTY_SHALL,
  MOA_TITLE,
  MOA_VENUE_TITLE,
  MOA_WHEREAS_COOPERATION,
  MOA_WHEREAS_QUALIFICATIONS,
  MOA_WHEREAS_SETUP,
  MOA_WITNESSETH,
  displayValue,
  fillTemplate,
  moaSectionLabel,
  moaSubLabel,
  moaSubSubLabel,
  underlineOr,
} from "../../constants/moaAnnexCLayout";
import { formatAmountFigures } from "../../utils/moaAnnexC";
import type { MoaAnnexPacketContext } from "../../utils/moaAnnexPacket";
import { MoaAnnexBLibTable } from "./MoaAnnexBLibTable";
import { MoaAnnexCScheduleTable } from "./MoaAnnexCScheduleTable";
import { MoaAnnexDRefundTable } from "./MoaAnnexDRefundTable";

export interface MoaAnnexCDocumentProps {
  form: MoaAnnexCForm;
  /** Form 001–sourced annex tables; omit for body-only render. */
  packet?: MoaAnnexPacketContext | null;
}

function val(value: unknown): string {
  return displayValue(value);
}

function FormBlock({ children }: { children: ReactNode }) {
  return <div className="moa-form-block">{children}</div>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="moa-form-section-title">{children}</h2>;
}

function Para({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`moa-form-para ${className}`.trim()}>{children}</p>;
}

function Blank({ value, width = 12 }: { value?: string; width?: number }) {
  const v = val(value);
  return (
    <span className={v ? "moa-form-filled" : "moa-form-blank"}>
      {v || "_".repeat(width)}
    </span>
  );
}

function SectionHeading({
  section,
  children,
}: {
  section: number;
  children: ReactNode;
}) {
  return (
    <p className="moa-form-para moa-form-shall moa-form-num-section">
      <span className="moa-form-num-label">{moaSectionLabel(section)}</span>{" "}
      {children}
    </p>
  );
}

function NumberedItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="moa-form-num-item">
      <span className="moa-form-num-label">{label}</span>
      <div className="moa-form-num-body">{children}</div>
    </div>
  );
}

function ObligationList({
  section,
  items,
  vars,
  renderAfter,
}: {
  section: number;
  items: readonly string[];
  vars: Record<string, string>;
  renderAfter?: (index: number) => ReactNode;
}) {
  return (
    <div className="moa-form-obligation-list">
      {items.map((item, i) => (
        <NumberedItem key={i} label={moaSubLabel(section, i)}>
          {fillTemplate(item, vars)}
          {renderAfter?.(i)}
        </NumberedItem>
      ))}
    </div>
  );
}

export function MoaAnnexCDocument({ form, packet }: MoaAnnexCDocumentProps) {
  const amountWords = val(form.approvedAmountWords) || "______";
  const amountFigures = formatAmountFigures(form.approvedAmount) || "P______";
  const psto = val(form.pstoOfficeName) || "PSTO/CASTO/CSTO ______";
  const refundTerm = val(form.refundTermYears) || "______";
  const vars = {
    amountWords,
    amountFigures,
    pdcCount: val(form.pdcCount) || "______",
    pstoOffice: psto.startsWith("PSTO") ? psto : `PSTO/CASTO/CSTO ${psto}`,
    refundTerm,
  };

  const secondPartyRep = [
    val(form.representativeDesignation),
    val(form.representativeName),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="moa-form-document-root">
      <div className="moa-form-page">
        <div className="moa-form-page-body">
          <FormBlock>
            <h1 className="moa-form-title">{MOA_TITLE}</h1>
            <Para className="moa-form-center moa-form-know">{MOA_KNOW_ALL}</Para>
          </FormBlock>

          <FormBlock>
            <Para>{MOA_INTRO}</Para>
            <Para>
              The DEPARTMENT OF SCIENCE AND TECHNOLOGY — REGION{" "}
              <Blank value={form.regionLabel} width={4} />, hereinafter referred to
              as &quot;FIRST PARTY&quot;, with principal office at{" "}
              <Blank value={form.dostOfficeAddress} width={40} />, and represented
              in this Agreement by its Regional Director,{" "}
              <Blank value={form.regionalDirector} width={24} />;
            </Para>
            <Para className="moa-form-center">— and —</Para>
            <Para>
              The <Blank value={form.enterpriseName} width={28} />, hereinafter
              referred to as &quot;SECOND PARTY&quot;, with principal office at{" "}
              <Blank value={form.enterpriseAddress} width={36} />, and represented
              in this Agreement by its{" "}
              <Blank value={secondPartyRep} width={28} />;
            </Para>
          </FormBlock>

          <FormBlock>
            <Para className="moa-form-center moa-form-know">{MOA_WITNESSETH}</Para>
            <Para>{MOA_WHEREAS_SETUP}</Para>
            <Para>
              WHEREAS, SECOND PARTY is in need of technical support and assistance
              from DOST-SETUP to improve its productivity through the
              implementation of the project titled, &quot;
              <Blank value={form.projectTitle} width={32} />
              &quot; as a component project of the SETUP, the objectives and
              output of which are described in the approved project proposal (made
              part hereof as Annex A);
            </Para>
            <Para>{MOA_INTERVENTIONS_HEAD}</Para>
            <ul className="moa-form-interventions">
              <li>{MOA_INTERVENTION_SYSTEM}</li>
              <li>{MOA_INTERVENTION_PROCESS}</li>
              <li>{MOA_INTERVENTION_HRD}</li>
            </ul>
            <Para>{MOA_WHEREAS_QUALIFICATIONS}</Para>
            <Para>{MOA_WHEREAS_COOPERATION}</Para>
            <Para>{MOA_NOW_THEREFORE}</Para>
          </FormBlock>

          <FormBlock>
            <SectionHeading section={1}>{MOA_FIRST_PARTY_SHALL}</SectionHeading>
            <ObligationList
              section={1}
              items={MOA_FIRST_PARTY_OBLIGATIONS}
              vars={vars}
            />
          </FormBlock>

          <FormBlock>
            <SectionHeading section={2}>{MOA_SECOND_PARTY_SHALL}</SectionHeading>
            <ObligationList
              section={2}
              items={MOA_SECOND_PARTY_OBLIGATIONS}
              vars={vars}
              renderAfter={(i) => {
                if (i === 17) {
                  return (
                    <div className="moa-form-pis-sub">
                      <NumberedItem label={moaSubSubLabel(2, 17, 0)}>
                        {MOA_PIS_PRE}
                      </NumberedItem>
                      <NumberedItem label={moaSubSubLabel(2, 17, 1)}>
                        {MOA_PIS_ONGOING}
                      </NumberedItem>
                    </div>
                  );
                }
                if (i === 24) {
                  return (
                    <div className="moa-form-signboard">
                      <p>
                        PROJECT TITLE:{" "}
                        <Blank
                          value={form.signboardProjectTitle || form.projectTitle}
                          width={28}
                        />
                      </p>
                      <p>
                        Cooperator:{" "}
                        <Blank
                          value={form.signboardCooperator || form.enterpriseName}
                          width={28}
                        />
                      </p>
                      <p>
                        Proposed Equipment:{" "}
                        <Blank value={form.signboardProposedEquipment} width={36} />
                      </p>
                      <p className="moa-form-phase">
                        Phase I (Equipment Acquisition and Installation)
                        <br />
                        <Blank value={form.phase1Start} width={16} /> to{" "}
                        <Blank value={form.phase1End} width={16} />
                      </p>
                      <p className="moa-form-phase">
                        Phase II (Refund Period and SME Expansion/Operation)
                        <br />
                        <Blank value={form.phase2Start} width={16} /> to{" "}
                        <Blank value={form.phase2End} width={16} />
                      </p>
                      <p>Source(s) of Fund: DOST-SETUP</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </FormBlock>

          <FormBlock>
            <SectionHeading section={3}>{MOA_REFUND_TITLE}</SectionHeading>
            <NumberedItem label={moaSubLabel(3, 0)}>{MOA_DEMAND_LETTER}</NumberedItem>
            <NumberedItem label={moaSubLabel(3, 1)}>
              {fillTemplate(MOA_REFUND_CLAUSE, { refundTerm })}
            </NumberedItem>
          </FormBlock>

          <FormBlock>
            <SectionHeading section={4}>{MOA_PUBLICATION_TITLE}</SectionHeading>
            <Para className="moa-form-section-body">{MOA_PUBLICATION_BODY}</Para>
            <SectionHeading section={5}>{MOA_AMENDMENTS_TITLE}</SectionHeading>
            <Para className="moa-form-section-body">{MOA_AMENDMENTS_BODY}</Para>
            <SectionHeading section={6}>{MOA_EFFECTIVITY_TITLE}</SectionHeading>
            <Para className="moa-form-section-body">{MOA_EFFECTIVITY_BODY}</Para>
            <SectionHeading section={7}>{MOA_VENUE_TITLE}</SectionHeading>
            <Para className="moa-form-section-body">
              The parties agree that in case of legal actions requiring court
              litigations that may arise in the enforcement of this Agreement, the
              venue of all court litigations shall be in the Courts of Competent
              Jurisdiction in <Blank value={form.venueCity} width={20} /> only.
            </Para>
          </FormBlock>

          <FormBlock>
            <Para>
              IN WITNESS WHEREOF, the parties hereto have signed this Memorandum
              of Agreement this <Blank value={form.signingDay} width={4} /> day of{" "}
              <Blank value={form.signingMonth} width={12} />, 20
              <Blank value={form.signingYear} width={2} /> at{" "}
              <Blank value={form.signingVenue} width={24} />.
            </Para>
          </FormBlock>

          <FormBlock>
            <div className="moa-form-signatures">
              <div className="moa-form-sig-col">
                <p className="moa-form-sig-org">
                  DEPARTMENT OF SCIENCE AND TECHNOLOGY — REGION{" "}
                  {underlineOr(form.regionLabel, 4)}
                </p>
                <div className="moa-form-sig-space" />
                <p className="moa-form-sig-name">
                  {underlineOr(form.dostSignatoryName || form.regionalDirector, 24)}
                </p>
                <p className="moa-form-sig-role">Regional Director</p>
              </div>
              <div className="moa-form-sig-col">
                <p className="moa-form-sig-org">
                  {underlineOr(form.enterpriseName, 24)}
                </p>
                <div className="moa-form-sig-space" />
                <p className="moa-form-sig-name">
                  {underlineOr(
                    form.cooperatorSignatoryName || form.representativeName,
                    24,
                  )}
                </p>
                <p className="moa-form-sig-role">Cooperator</p>
              </div>
            </div>
          </FormBlock>

          <FormBlock>
            <Para className="moa-form-center moa-form-know">
              SIGNED IN THE PRESENCE OF:
            </Para>
            <div className="moa-form-signatures">
              <div className="moa-form-sig-col">
                <div className="moa-form-sig-space" />
                <p className="moa-form-sig-name">
                  {underlineOr(form.witness1Name, 24)}
                </p>
                <p className="moa-form-sig-role">
                  {underlineOr(form.witness1Title, 16)}
                </p>
              </div>
              <div className="moa-form-sig-col">
                <div className="moa-form-sig-space" />
                <p className="moa-form-sig-name">
                  {underlineOr(form.witness2Name, 24)}
                </p>
                <p className="moa-form-sig-role">
                  {val(form.witness2Title) || "Witness"}
                </p>
              </div>
            </div>
            <div className="moa-form-funds">
              <p>Certified Funds Available:</p>
              <div className="moa-form-sig-space" />
              <p className="moa-form-sig-name">
                {underlineOr(form.fundsAvailableCertifier, 28)}
              </p>
            </div>
          </FormBlock>

          <FormBlock>
            <SectionTitle>{MOA_ACKNOWLEDGMENT_TITLE}</SectionTitle>
            <Para className="moa-form-center">
              REPUBLIC OF THE PHILIPPINES )
              <br />
              ) S.S.
            </Para>
            <Para>
              Before me, a Notary Public for and in the{" "}
              <Blank value={form.acknowledgmentPlace} width={20} /> this{" "}
              <Blank value={form.acknowledgmentDay} width={4} /> day of{" "}
              <Blank value={form.acknowledgmentMonth} width={12} /> 20
              <Blank value={form.acknowledgmentYear} width={2} />, personally
              appeared.
            </Para>
            <table className="moa-form-id-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>VALID I.D. NO.</th>
                  <th>Place/Date Issued</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{underlineOr(form.party1Name, 20)}</td>
                  <td>{underlineOr(form.party1IdNo, 12)}</td>
                  <td>{underlineOr(form.party1IdIssued, 16)}</td>
                </tr>
                <tr>
                  <td>{underlineOr(form.party2Name, 20)}</td>
                  <td>{underlineOr(form.party2IdNo, 12)}</td>
                  <td>{underlineOr(form.party2IdIssued, 16)}</td>
                </tr>
              </tbody>
            </table>
            <Para>
              All known to me to be the same persons who executed the foregoing
              instrument and they acknowledged to me that the same is their free
              and voluntary act and deed as well as the voluntary act of the
              institutions/agencies they represent.
            </Para>
            <Para>
              This instrument consists of{" "}
              <Blank value={form.pageCount} width={4} /> ( ) pages including this
              page wherein the Acknowledgment is written, duly signed by the
              parties and their witnesses on each and every page hereof.
            </Para>
            <Para>
              WITNESS MY HAND AND SEAL, on the date and the place first above
              written.
            </Para>
            <div className="moa-form-notary">
              <p>NOTARY PUBLIC</p>
              <p>
                DOC No.: <Blank value={form.notaryDocNo} width={8} />
              </p>
              <p>
                Page No.: <Blank value={form.notaryPageNo} width={8} />
              </p>
              <p>
                Book No.: <Blank value={form.notaryBookNo} width={8} />
              </p>
              <p>
                Series of 20
                <Blank value={form.notarySeriesYear} width={2} />
              </p>
            </div>
          </FormBlock>

          <FormBlock>
            <SectionTitle>{MOA_ANNEX_LABELS.A}</SectionTitle>
            <Para>{MOA_ANNEX_A_NOTE}</Para>
          </FormBlock>

          {packet?.annexB ? (
            <FormBlock>
              <SectionTitle>{MOA_ANNEX_LABELS.B}</SectionTitle>
              <MoaAnnexBLibTable form={form} data={packet.annexB} />
            </FormBlock>
          ) : (
            <FormBlock>
              <Para className="moa-form-annex-note">{MOA_ANNEX_LABELS.B}</Para>
            </FormBlock>
          )}

          {packet?.scheduleTable ? (
            <FormBlock>
              <SectionTitle>{MOA_ANNEX_LABELS.C}</SectionTitle>
              <MoaAnnexCScheduleTable
                form={form}
                scheduleTable={packet.scheduleTable}
              />
            </FormBlock>
          ) : (
            <FormBlock>
              <Para className="moa-form-annex-note">{MOA_ANNEX_LABELS.C}</Para>
            </FormBlock>
          )}

          {packet?.annexD ? (
            <FormBlock>
              <SectionTitle>{MOA_ANNEX_LABELS.D}</SectionTitle>
              <MoaAnnexDRefundTable form={form} grid={packet.annexD} />
            </FormBlock>
          ) : (
            <FormBlock>
              <Para className="moa-form-annex-note">{MOA_ANNEX_LABELS.D}</Para>
            </FormBlock>
          )}

          <FormBlock>
            <Para className="moa-form-annex-note">{MOA_ANNEX_LABELS.E}</Para>
          </FormBlock>
        </div>
      </div>
    </div>
  );
}
