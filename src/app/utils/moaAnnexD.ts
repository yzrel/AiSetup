/**
 * Author: Yzrel Jade B. Eborde
 */

import { Applicant } from "../store/applicantStore";
import type { ApprovalLetterForm, MoaAnnexDForm, MoaAnnexDStored } from "../api/types";
import { getApprovalLetterForm, getApprovalLetterStored } from "./approvalLetter";
import { getProjectProposalForm } from "./projectProposal";
import { DOST_REGION_12_DIRECTOR_NAME } from "../constants/region12";
import { resolveProvincialOffice } from "./loiLetter";

export function emptyMoaAnnexDForm(): MoaAnnexDForm {
  return {
    projectTitle: "",
    enterpriseName: "",
    enterpriseAddress: "",
    approvedAmount: "",
    refundTermYears: "five (5)",
    projectDurationMonths: "12",
    insuranceRatePercent: "0.50",
    pstoOfficeName: "",
    regionalDirector: DOST_REGION_12_DIRECTOR_NAME,
    effectivityDate: new Date().toISOString().split("T")[0],
    specialProvisions: "",
  };
}

export function buildMoaAnnexDForm(applicant: Applicant | null): MoaAnnexDForm {
  if (!applicant) return emptyMoaAnnexDForm();
  const pp = getProjectProposalForm(applicant);
  const approval = getApprovalLetterForm(applicant);
  const province = String(applicant.moduleData?.province ?? "");
  const psto = resolveProvincialOffice(province);

  return {
    projectTitle: pp.projectTitle || approval.projectTitle,
    enterpriseName: pp.firmName || applicant.enterpriseName,
    enterpriseAddress: pp.firmAddress || applicant.address,
    approvedAmount: approval.approvedAmount || pp.amountRequested,
    refundTermYears: approval.refundTermYears,
    projectDurationMonths: "12",
    insuranceRatePercent: approval.insuranceRatePercent,
    pstoOfficeName: psto.officeName,
    regionalDirector: approval.signatoryName || DOST_REGION_12_DIRECTOR_NAME,
    effectivityDate: approval.approvalDate || new Date().toISOString().split("T")[0],
    specialProvisions: "",
  };
}

export function getMoaAnnexDStored(applicant: Applicant | null): MoaAnnexDStored | null {
  if (!applicant?.moduleData?.moaAnnexD) return null;
  return applicant.moduleData.moaAnnexD as MoaAnnexDStored;
}

export function getMoaAnnexDForm(applicant: Applicant | null): MoaAnnexDForm {
  const stored = getMoaAnnexDStored(applicant);
  if (stored?.form?.projectTitle?.trim()) return stored.form;
  return buildMoaAnnexDForm(applicant);
}

export function saveMoaAnnexDDraft(
  applicantId: string,
  form: MoaAnnexDForm,
  applicantStore: {
    getById: (id: string) => Applicant | undefined;
    update: (id: string, patch: Partial<Applicant>) => void;
  },
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getMoaAnnexDStored(applicant);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      moaAnnexD: {
        form,
        finalized: existing?.finalized,
        finalizedAt: existing?.finalizedAt,
        updatedAt: new Date().toISOString(),
      } satisfies MoaAnnexDStored,
    },
  });
}

export function buildMoaAnnexDBody(form: MoaAnnexDForm): string[] {
  return [
    `This Memorandum of Agreement (MOA) is entered into between the Department of Science and Technology Regional Office No. XII, represented by ${form.regionalDirector}, Regional Director, and ${form.enterpriseName}, with principal address at ${form.enterpriseAddress}, for the implementation of the SETUP project entitled "${form.projectTitle}".`,
    `DOST shall provide Innovation System Support amounting to ${form.approvedAmount} for the acquisition of equipment and technology interventions identified in SETUP Form 001 and the RTEC Report, subject to existing government accounting and auditing rules.`,
    `The Beneficiary agrees to: (1) refund the iFund assistance over ${form.refundTermYears} commencing twelve (12) months after project start; (2) cover insurance for acquired equipment not exceeding ${form.insuranceRatePercent}% of total project cost; (3) submit post-dated checks covering the refund schedule plus technology transfer fee (0.5%) prior to fund release; and (4) implement the project within ${form.projectDurationMonths} months from receipt of funds.`,
    `Implementation shall be monitored by ${form.pstoOfficeName} through semestral Form 009 PIS submissions. The Beneficiary shall not use DOST assistance for operating expenses.`,
    form.specialProvisions?.trim()
      ? `Special provisions: ${form.specialProvisions.trim()}`
      : "Other terms follow the Regional Guidelines on SETUP (Revision 3.0) Annex D — Pro-forma MOA.",
  ];
}

export function needsGiaExcomRouting(approvedAmountRaw: string): boolean {
  const n = parseFloat(String(approvedAmountRaw).replace(/[^\d.]/g, ""));
  return n > 2_000_000;
}

export function getApprovalRoutingNote(form: ApprovalLetterForm): string | null {
  if (!needsGiaExcomRouting(form.approvedAmount)) return null;
  return "Approved amount exceeds ₱2,000,000 — route to DOST-GIA EXECOM for consideration per SETUP Guidelines.";
}
