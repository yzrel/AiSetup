/**
 * Author: Yzrel Jade B. Eborde
 *
 * Proforma MOA (Annex C) draft build / sync / persist.
 * Prefills from Notice of Approval, Form 001, RTEC, TNA1, and registration.
 * Edits stay on approvalLetter.moaForm — pick-if-blank sync never overwrites staff text.
 */

import { applicantStore, type Applicant } from "../store/applicantStore";
import type { ApprovalLetterStored, MoaAnnexCForm } from "../api/types";
import {
  DOST_REGION_12_ADDRESS,
  DOST_REGION_12_DIRECTOR_NAME,
} from "../constants/region12";
import { mapBusinessTypeToOrganization } from "../store/tnaFormDefaults";
import { getApprovalLetterForm, getApprovalLetterStored } from "./approvalLetter";
import { resolveProvincialOffice } from "./loiLetter";
import { getProjectProposalForm } from "./projectProposal";
import { getRequirementEquipmentList } from "./requirementEquipment";
import { getRtecReportForm } from "./rtecReport";
import { isDemoModeActive } from "./demoMode";

const ONES = [
  "",
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE",
  "TEN",
  "ELEVEN",
  "TWELVE",
  "THIRTEEN",
  "FOURTEEN",
  "FIFTEEN",
  "SIXTEEN",
  "SEVENTEEN",
  "EIGHTEEN",
  "NINETEEN",
];
const TENS = [
  "",
  "",
  "TWENTY",
  "THIRTY",
  "FORTY",
  "FIFTY",
  "SIXTY",
  "SEVENTY",
  "EIGHTY",
  "NINETY",
];

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

function pick(local: string, upstream: string): string {
  return local.trim() ? local : upstream;
}

function parseMoney(value: string): number {
  const n = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function under1000(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o ? `${TENS[t]}-${ONES[o]}` : TENS[t];
  }
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return rest ? `${ONES[h]} HUNDRED ${under1000(rest)}` : `${ONES[h]} HUNDRED`;
}

/** Convert a peso amount to uppercase words, e.g. "ONE HUNDRED THOUSAND PESOS". */
export function amountToPesosWords(raw: string): string {
  const amount = Math.floor(parseMoney(raw));
  if (!amount) return "";
  if (amount >= 1_000_000_000) return "";

  const millions = Math.floor(amount / 1_000_000);
  const thousands = Math.floor((amount % 1_000_000) / 1000);
  const remainder = amount % 1000;
  const parts: string[] = [];
  if (millions) {
    parts.push(
      millions === 1
        ? "ONE MILLION"
        : `${under1000(millions)} MILLION`,
    );
  }
  if (thousands) {
    parts.push(
      thousands === 1
        ? "ONE THOUSAND"
        : `${under1000(thousands)} THOUSAND`,
    );
  }
  if (remainder) parts.push(under1000(remainder));
  return `${parts.join(" ")} PESOS & 00/100`.replace(/\s+/g, " ").trim();
}

/** MOA clause 2.8 — monthly PDCs only (term × 12); TTF check stays in Refund/LandBank. */
export function computeMoaPdcCount(refundTermYearsDigit: string): string {
  const years = parseInt(refundTermYearsDigit, 10);
  if (!years || years < 1) return "";
  return String(years * 12);
}

export function formatAmountFigures(raw: string): string {
  const n = parseMoney(raw);
  if (!n) return trimText(raw) ? `P${trimText(raw)}` : "";
  return `P${n.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function extractRefundDigit(refundTermYears: string): string {
  const paren = refundTermYears.match(/\((\d+)\)/);
  if (paren) return paren[1];
  const bare = refundTermYears.match(/(\d+)/);
  return bare?.[1] ?? "";
}

function monthName(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-PH", { month: "long" });
}

function dayOfMonth(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getDate());
}

function year2(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getFullYear()).slice(-2);
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return trimText(iso);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function applicantProvince(applicant: Applicant | null): string {
  if (!applicant) return "";
  const md = applicant.moduleData ?? {};
  return String(md.province ?? applicant.address?.split(",").pop()?.trim() ?? "");
}

function organizationTypeLabel(applicant: Applicant | null): string {
  if (!applicant) return "";
  const tna1 = (applicant.moduleData?.tna1 as { form?: Record<string, unknown> } | undefined)
    ?.form;
  const fromTna = trimText(tna1?.organizationType);
  if (fromTna) return fromTna;
  const pp = getProjectProposalForm(applicant);
  if (trimText(pp.organizationType)) return pp.organizationType;
  return mapBusinessTypeToOrganization(applicant.businessType ?? "");
}

function resolveDurationMonths(applicant: Applicant | null): string {
  if (!applicant) return "12";
  const md = applicant.moduleData ?? {};
  const legacy = (
    md.moaAnnexD as { form?: { projectDurationMonths?: string } } | undefined
  )?.form?.projectDurationMonths;
  const timeline = trimText(md.timeline);
  const candidates = [trimText(legacy), timeline];
  for (const c of candidates) {
    if (!c) continue;
    const monthMatch = c.match(/(\d+)\s*month/i);
    if (monthMatch) return monthMatch[1];
    const yearMatch = c.match(/(\d+)\s*year/i);
    if (yearMatch) return String(parseInt(yearMatch[1], 10) * 12);
    if (/^\d+$/.test(c)) {
      const n = parseInt(c, 10);
      return n <= 10 ? String(n * 12) : String(n);
    }
  }
  return "12";
}

function resolveProposedEquipment(applicant: Applicant | null): string {
  if (!applicant) return "";
  const items = getRequirementEquipmentList(applicant);
  if (items.length > 0) {
    return items
      .map((item) =>
        item.specifications
          ? `${item.name} (${item.specifications})`
          : item.name,
      )
      .join("; ");
  }
  return String(getProjectProposalForm(applicant)?.interventionEquipment ?? "").trim();
}

export function emptyMoaAnnexCForm(): MoaAnnexCForm {
  return {
    regionLabel: "XII",
    dostOfficeAddress: DOST_REGION_12_ADDRESS,
    regionalDirector: DOST_REGION_12_DIRECTOR_NAME,
    enterpriseName: "",
    enterpriseAddress: "",
    representativeName: "",
    representativeDesignation: "",
    projectTitle: "",
    approvedAmount: "",
    approvedAmountWords: "",
    pdcCount: "",
    pstoOfficeName: "",
    signboardProjectTitle: "",
    signboardCooperator: "",
    signboardProposedEquipment: "",
    phase1Start: "",
    phase1End: "",
    phase2Start: "",
    phase2End: "",
    refundTermYears: "five (5)",
    refundTermYearsDigit: "5",
    projectDurationMonths: "12",
    venueCity: "",
    signingDay: "",
    signingMonth: "",
    signingYear: "",
    signingVenue: "",
    dostSignatoryName: DOST_REGION_12_DIRECTOR_NAME,
    cooperatorSignatoryName: "",
    witness1Name: "",
    witness1Title: "Chief, Technical Services Division",
    witness2Name: "",
    witness2Title: "",
    fundsAvailableCertifier: "",
    acknowledgmentPlace: "",
    acknowledgmentDay: "",
    acknowledgmentMonth: "",
    acknowledgmentYear: "",
    party1Name: "",
    party1IdNo: "",
    party1IdIssued: "",
    party2Name: "",
    party2IdNo: "",
    party2IdIssued: "",
    pageCount: "",
    notaryDocNo: "",
    notaryPageNo: "",
    notaryBookNo: "",
    notarySeriesYear: "",
  };
}

export function buildMoaAnnexCForm(applicant: Applicant | null): MoaAnnexCForm {
  if (!applicant) return emptyMoaAnnexCForm();

  const approval = getApprovalLetterForm(applicant);
  const signed = getApprovalLetterStored(applicant)?.signedMoa;
  const pp = getProjectProposalForm(applicant);
  const rtec = getRtecReportForm(applicant);
  const psto = resolveProvincialOffice(applicantProvince(applicant));
  const md = applicant.moduleData ?? {};
  const durationMonths = resolveDurationMonths(applicant);
  const durationNum = parseInt(durationMonths, 10) || 12;
  const refundYears = approval.refundTermYears || "five (5)";
  const refundDigit = extractRefundDigit(refundYears) || "5";
  const refundMonths = (parseInt(refundDigit, 10) || 5) * 12;

  const amount =
    approval.approvedAmount ||
    rtec.projectCostSetup ||
    pp.amountRequested ||
    "";

  const signingIso =
    trimText(signed?.moaSignedDate) ||
    trimText(approval.approvalDate) ||
    new Date().toISOString().split("T")[0];

  const phase1Start = signingIso;
  const phase1End = addMonths(signingIso, durationNum);
  const phase2Start = phase1End;
  const phase2End = addMonths(phase1End, refundMonths);

  const enterprise =
    approval.enterpriseName || pp.firmName || applicant.enterpriseName;
  const representative =
    approval.recipientName || pp.contactPerson || applicant.applicantName;
  const orgType = organizationTypeLabel(applicant);
  const designation =
    approval.recipientDesignation ||
    applicant.designation ||
    orgType ||
    "Proprietor";

  const venue =
    trimText(signed?.signingVenue) ||
    psto.addressLines[0] ||
    "Koronadal City";

  return {
    ...emptyMoaAnnexCForm(),
    regionLabel: "XII",
    dostOfficeAddress: DOST_REGION_12_ADDRESS,
    regionalDirector:
      approval.signatoryName?.trim() || DOST_REGION_12_DIRECTOR_NAME,
    enterpriseName: enterprise,
    enterpriseAddress:
      approval.enterpriseAddress || pp.firmAddress || applicant.address,
    representativeName: representative,
    representativeDesignation: designation,
    projectTitle: approval.projectTitle || pp.projectTitle,
    approvedAmount: amount,
    approvedAmountWords: amountToPesosWords(amount),
    pdcCount: computeMoaPdcCount(refundDigit),
    pstoOfficeName: approval.pstoOfficeName || psto.officeName,
    signboardProjectTitle: approval.projectTitle || pp.projectTitle,
    signboardCooperator: enterprise,
    signboardProposedEquipment: resolveProposedEquipment(applicant),
    phase1Start: formatDisplayDate(phase1Start),
    phase1End: formatDisplayDate(phase1End),
    phase2Start: formatDisplayDate(phase2Start),
    phase2End: formatDisplayDate(phase2End),
    refundTermYears: refundYears,
    refundTermYearsDigit: refundDigit,
    projectDurationMonths: durationMonths,
    venueCity: venue,
    signingDay: dayOfMonth(signingIso),
    signingMonth: monthName(signingIso),
    signingYear: year2(signingIso),
    signingVenue: venue,
    dostSignatoryName:
      approval.signatoryName?.trim() || DOST_REGION_12_DIRECTOR_NAME,
    cooperatorSignatoryName: representative,
    witness1Name: "",
    witness1Title: "Chief, Technical Services Division",
    witness2Name: "",
    witness2Title: approval.pstoDirectorTitle || psto.title || "",
    fundsAvailableCertifier: "",
    acknowledgmentPlace: venue,
    acknowledgmentDay: dayOfMonth(signingIso),
    acknowledgmentMonth: monthName(signingIso),
    acknowledgmentYear: year2(signingIso),
    party1Name:
      approval.signatoryName?.trim() || DOST_REGION_12_DIRECTOR_NAME,
    party1IdNo: "",
    party1IdIssued: "",
    party2Name: representative,
    party2IdNo: trimText(md.tinNumber),
    party2IdIssued: "",
    pageCount: "",
    notaryDocNo: "",
    notaryPageNo: "",
    notaryBookNo: "",
    notarySeriesYear: year2(signingIso),
  };
}

export function getMoaAnnexCForm(applicant: Applicant | null): MoaAnnexCForm {
  const stored = getApprovalLetterStored(applicant)?.moaForm;
  if (stored && Object.values(stored).some((v) => String(v ?? "").trim())) {
    return { ...emptyMoaAnnexCForm(), ...stored };
  }
  return buildMoaAnnexCForm(applicant);
}

export function syncMoaAnnexCFromPrior(
  existing: MoaAnnexCForm,
  applicant: Applicant,
): MoaAnnexCForm {
  const draft = buildMoaAnnexCForm(applicant);
  const keys = Object.keys(draft) as (keyof MoaAnnexCForm)[];
  const next = { ...existing };
  for (const key of keys) {
    next[key] = pick(String(existing[key] ?? ""), String(draft[key] ?? ""));
  }
  // Refresh amount-in-words when amount filled but words blank.
  if (next.approvedAmount.trim() && !next.approvedAmountWords.trim()) {
    next.approvedAmountWords = amountToPesosWords(next.approvedAmount);
  }
  if (next.refundTermYears.trim() && !next.refundTermYearsDigit.trim()) {
    next.refundTermYearsDigit = extractRefundDigit(next.refundTermYears);
  }
  if (next.refundTermYearsDigit.trim() && !next.pdcCount.trim()) {
    next.pdcCount = computeMoaPdcCount(next.refundTermYearsDigit);
  }
  return next;
}

export function saveMoaAnnexCDraft(
  applicantId: string,
  moaForm: MoaAnnexCForm,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getApprovalLetterStored(applicant);
  const form = existing?.form ?? getApprovalLetterForm(applicant);
  const nextStored: ApprovalLetterStored = {
    ...(existing ?? {
      form,
      published: Boolean(form.published),
      acknowledged: false,
    }),
    form: existing?.form ?? form,
    published: existing?.published ?? Boolean(form.published),
    publishedAt: existing?.publishedAt,
    acknowledged: existing?.acknowledged ?? false,
    acknowledgedAt: existing?.acknowledgedAt,
    rdDecision: existing?.rdDecision,
    rdDecidedBy: existing?.rdDecidedBy,
    rdDecidedAt: existing?.rdDecidedAt,
    rdRemarks: existing?.rdRemarks,
    signedMoa: existing?.signedMoa,
    moaForm,
    updatedAt: new Date().toISOString(),
  };
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      approvalLetter: nextStored,
    },
  });
}

export function validateMoaAnnexCForm(form: MoaAnnexCForm): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!form.enterpriseName.trim()) errors.push("Enterprise / cooperator name is required.");
  if (!form.projectTitle.trim()) errors.push("Project title is required.");
  if (!form.approvedAmount.trim()) errors.push("Approved amount is required.");
  if (!form.regionalDirector.trim()) errors.push("Regional Director name is required.");
  if (!form.representativeName.trim()) {
    errors.push("Authorized representative name is required.");
  }
  return errors;
}
