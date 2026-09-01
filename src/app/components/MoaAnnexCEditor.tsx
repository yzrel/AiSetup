/**
 * Author: Yzrel Jade B. Eborde
 *
 * Staff editor for Proforma MOA — Annex C.
 * Fields follow placeholders in Proforma MOA - Annex C.docx.
 * Edits stay on approvalLetter.moaForm; Sync only fills blanks.
 */

import type { ReactNode } from "react";
import type { MoaAnnexCForm } from "../api/types";
import { amountToPesosWords } from "../utils/moaAnnexC";
import { FORM_GRID_2, FORM_GRID_3 } from "./moduleTheme";

interface MoaAnnexCEditorProps {
  form: MoaAnnexCForm;
  onChange: (form: MoaAnnexCForm) => void;
  onSave?: () => void;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold text-[#0C2461]">{children}</h3>;
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
  );
}

export function MoaAnnexCEditor({ form, onChange }: MoaAnnexCEditorProps) {
  const patch = (partial: Partial<MoaAnnexCForm>) =>
    onChange({ ...form, ...partial });

  const patchAmount = (approvedAmount: string) => {
    const next: Partial<MoaAnnexCForm> = { approvedAmount };
    if (!form.approvedAmountWords.trim() || form.approvedAmountWords === amountToPesosWords(form.approvedAmount)) {
      next.approvedAmountWords = amountToPesosWords(approvedAmount);
    }
    patch(next);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Edit Proforma MOA (Annex C) variable fields. Legal clauses are fixed from
        the official Word template; Sync fills blank fields from the Notice of
        Approval and prior modules without overwriting your edits.
      </p>

      <section className="space-y-3">
        <SectionTitle>Parties</SectionTitle>
        <div className={FORM_GRID_3}>
          <div>
            <FieldLabel>Region</FieldLabel>
            <TextInput
              value={form.regionLabel}
              onChange={(regionLabel) => patch({ regionLabel })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>DOST principal office address</FieldLabel>
            <TextInput
              value={form.dostOfficeAddress}
              onChange={(dostOfficeAddress) => patch({ dostOfficeAddress })}
            />
          </div>
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Regional Director</FieldLabel>
            <TextInput
              value={form.regionalDirector}
              onChange={(regionalDirector) =>
                patch({
                  regionalDirector,
                  dostSignatoryName: form.dostSignatoryName || regionalDirector,
                  party1Name: form.party1Name || regionalDirector,
                })
              }
            />
          </div>
          <div>
            <FieldLabel>PSTO / CASTO / CSTO office</FieldLabel>
            <TextInput
              value={form.pstoOfficeName}
              onChange={(pstoOfficeName) => patch({ pstoOfficeName })}
            />
          </div>
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Second Party (enterprise / cooperator)</FieldLabel>
            <TextInput
              value={form.enterpriseName}
              onChange={(enterpriseName) =>
                patch({
                  enterpriseName,
                  signboardCooperator: form.signboardCooperator || enterpriseName,
                })
              }
            />
          </div>
          <div>
            <FieldLabel>Principal office address</FieldLabel>
            <TextInput
              value={form.enterpriseAddress}
              onChange={(enterpriseAddress) => patch({ enterpriseAddress })}
            />
          </div>
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Authorized representative</FieldLabel>
            <TextInput
              value={form.representativeName}
              onChange={(representativeName) =>
                patch({
                  representativeName,
                  cooperatorSignatoryName:
                    form.cooperatorSignatoryName || representativeName,
                  party2Name: form.party2Name || representativeName,
                })
              }
            />
          </div>
          <div>
            <FieldLabel>Designation / capacity</FieldLabel>
            <TextInput
              value={form.representativeDesignation}
              onChange={(representativeDesignation) =>
                patch({ representativeDesignation })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Project &amp; funding</SectionTitle>
        <div>
          <FieldLabel>Project title</FieldLabel>
          <TextInput
            value={form.projectTitle}
            onChange={(projectTitle) =>
              patch({
                projectTitle,
                signboardProjectTitle: form.signboardProjectTitle || projectTitle,
              })
            }
          />
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Approved amount (figures)</FieldLabel>
            <TextInput
              value={form.approvedAmount}
              onChange={patchAmount}
              placeholder="e.g. 500000"
            />
          </div>
          <div>
            <FieldLabel>Approved amount (words)</FieldLabel>
            <TextInput
              value={form.approvedAmountWords}
              onChange={(approvedAmountWords) => patch({ approvedAmountWords })}
              placeholder="FIVE HUNDRED THOUSAND PESOS"
            />
          </div>
        </div>
        <div className={FORM_GRID_3}>
          <div>
            <FieldLabel>Refund term</FieldLabel>
            <TextInput
              value={form.refundTermYears}
              onChange={(refundTermYears) => patch({ refundTermYears })}
              placeholder="five (5)"
            />
          </div>
          <div>
            <FieldLabel>Refund years (digit)</FieldLabel>
            <TextInput
              value={form.refundTermYearsDigit}
              onChange={(refundTermYearsDigit) => patch({ refundTermYearsDigit })}
            />
          </div>
          <div>
            <FieldLabel>Number of PDCs</FieldLabel>
            <TextInput
              value={form.pdcCount}
              onChange={(pdcCount) => patch({ pdcCount })}
            />
          </div>
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Project duration (months)</FieldLabel>
            <TextInput
              value={form.projectDurationMonths}
              onChange={(projectDurationMonths) =>
                patch({ projectDurationMonths })
              }
            />
          </div>
          <div>
            <FieldLabel>Venue of action (city)</FieldLabel>
            <TextInput
              value={form.venueCity}
              onChange={(venueCity) => patch({ venueCity })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Sign board phases</SectionTitle>
        <div>
          <FieldLabel>Proposed equipment (sign board)</FieldLabel>
          <TextInput
            value={form.signboardProposedEquipment}
            onChange={(signboardProposedEquipment) =>
              patch({ signboardProposedEquipment })
            }
            placeholder="From TNA Form 02 / Form 001 equipment list"
          />
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Phase I start</FieldLabel>
            <TextInput
              value={form.phase1Start}
              onChange={(phase1Start) => patch({ phase1Start })}
            />
          </div>
          <div>
            <FieldLabel>Phase I end</FieldLabel>
            <TextInput
              value={form.phase1End}
              onChange={(phase1End) => patch({ phase1End })}
            />
          </div>
          <div>
            <FieldLabel>Phase II start</FieldLabel>
            <TextInput
              value={form.phase2Start}
              onChange={(phase2Start) => patch({ phase2Start })}
            />
          </div>
          <div>
            <FieldLabel>Phase II end</FieldLabel>
            <TextInput
              value={form.phase2End}
              onChange={(phase2End) => patch({ phase2End })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Signing</SectionTitle>
        <div className={FORM_GRID_3}>
          <div>
            <FieldLabel>Day</FieldLabel>
            <TextInput
              value={form.signingDay}
              onChange={(signingDay) => patch({ signingDay })}
            />
          </div>
          <div>
            <FieldLabel>Month</FieldLabel>
            <TextInput
              value={form.signingMonth}
              onChange={(signingMonth) => patch({ signingMonth })}
            />
          </div>
          <div>
            <FieldLabel>Year (20__)</FieldLabel>
            <TextInput
              value={form.signingYear}
              onChange={(signingYear) => patch({ signingYear })}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Signing venue</FieldLabel>
          <TextInput
            value={form.signingVenue}
            onChange={(signingVenue) => patch({ signingVenue })}
          />
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>DOST signatory name</FieldLabel>
            <TextInput
              value={form.dostSignatoryName}
              onChange={(dostSignatoryName) => patch({ dostSignatoryName })}
            />
          </div>
          <div>
            <FieldLabel>Cooperator signatory name</FieldLabel>
            <TextInput
              value={form.cooperatorSignatoryName}
              onChange={(cooperatorSignatoryName) =>
                patch({ cooperatorSignatoryName })
              }
            />
          </div>
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Witness 1 name</FieldLabel>
            <TextInput
              value={form.witness1Name}
              onChange={(witness1Name) => patch({ witness1Name })}
            />
          </div>
          <div>
            <FieldLabel>Witness 1 title</FieldLabel>
            <TextInput
              value={form.witness1Title}
              onChange={(witness1Title) => patch({ witness1Title })}
            />
          </div>
          <div>
            <FieldLabel>Witness 2 name</FieldLabel>
            <TextInput
              value={form.witness2Name}
              onChange={(witness2Name) => patch({ witness2Name })}
            />
          </div>
          <div>
            <FieldLabel>Witness 2 title</FieldLabel>
            <TextInput
              value={form.witness2Title}
              onChange={(witness2Title) => patch({ witness2Title })}
            />
          </div>
          <div>
            <FieldLabel>Certified funds available</FieldLabel>
            <TextInput
              value={form.fundsAvailableCertifier}
              onChange={(fundsAvailableCertifier) =>
                patch({ fundsAvailableCertifier })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Acknowledgment (notary)</SectionTitle>
        <div className={FORM_GRID_3}>
          <div>
            <FieldLabel>Place</FieldLabel>
            <TextInput
              value={form.acknowledgmentPlace}
              onChange={(acknowledgmentPlace) => patch({ acknowledgmentPlace })}
            />
          </div>
          <div>
            <FieldLabel>Day</FieldLabel>
            <TextInput
              value={form.acknowledgmentDay}
              onChange={(acknowledgmentDay) => patch({ acknowledgmentDay })}
            />
          </div>
          <div>
            <FieldLabel>Month</FieldLabel>
            <TextInput
              value={form.acknowledgmentMonth}
              onChange={(acknowledgmentMonth) => patch({ acknowledgmentMonth })}
            />
          </div>
        </div>
        <div className={FORM_GRID_2}>
          <div>
            <FieldLabel>Year (20__)</FieldLabel>
            <TextInput
              value={form.acknowledgmentYear}
              onChange={(acknowledgmentYear) => patch({ acknowledgmentYear })}
            />
          </div>
          <div>
            <FieldLabel>Page count</FieldLabel>
            <TextInput
              value={form.pageCount}
              onChange={(pageCount) => patch({ pageCount })}
            />
          </div>
        </div>
        <div className={FORM_GRID_3}>
          <div>
            <FieldLabel>Party 1 name (RD)</FieldLabel>
            <TextInput
              value={form.party1Name}
              onChange={(party1Name) => patch({ party1Name })}
            />
          </div>
          <div>
            <FieldLabel>Party 1 I.D. No.</FieldLabel>
            <TextInput
              value={form.party1IdNo}
              onChange={(party1IdNo) => patch({ party1IdNo })}
            />
          </div>
          <div>
            <FieldLabel>Party 1 Place/Date Issued</FieldLabel>
            <TextInput
              value={form.party1IdIssued}
              onChange={(party1IdIssued) => patch({ party1IdIssued })}
            />
          </div>
          <div>
            <FieldLabel>Party 2 name (cooperator)</FieldLabel>
            <TextInput
              value={form.party2Name}
              onChange={(party2Name) => patch({ party2Name })}
            />
          </div>
          <div>
            <FieldLabel>Party 2 I.D. No.</FieldLabel>
            <TextInput
              value={form.party2IdNo}
              onChange={(party2IdNo) => patch({ party2IdNo })}
            />
          </div>
          <div>
            <FieldLabel>Party 2 Place/Date Issued</FieldLabel>
            <TextInput
              value={form.party2IdIssued}
              onChange={(party2IdIssued) => patch({ party2IdIssued })}
            />
          </div>
        </div>
        <div className={FORM_GRID_3}>
          <div>
            <FieldLabel>DOC No.</FieldLabel>
            <TextInput
              value={form.notaryDocNo}
              onChange={(notaryDocNo) => patch({ notaryDocNo })}
            />
          </div>
          <div>
            <FieldLabel>Page No.</FieldLabel>
            <TextInput
              value={form.notaryPageNo}
              onChange={(notaryPageNo) => patch({ notaryPageNo })}
            />
          </div>
          <div>
            <FieldLabel>Book No.</FieldLabel>
            <TextInput
              value={form.notaryBookNo}
              onChange={(notaryBookNo) => patch({ notaryBookNo })}
            />
          </div>
          <div>
            <FieldLabel>Series of 20__</FieldLabel>
            <TextInput
              value={form.notarySeriesYear}
              onChange={(notarySeriesYear) => patch({ notarySeriesYear })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
