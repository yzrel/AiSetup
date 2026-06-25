/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import { isDemoModeActive } from "./demoMode";
import type { LbpIntroductionLetterForm, LbpIntroductionLetterStored } from "../api/types";
import {
  DOST_REGION_12_ADDRESS,
  DOST_REGION_12_DIRECTOR_NAME,
  DOST_REGION_12_OFFICE,
} from "../constants/region12";
import { getApprovalLetterForm } from "./approvalLetter";
import { formatApprovalDisplayDate } from "./approvalLetter";
import { getProjectProposalForm } from "./projectProposal";
import { a4PageRule, A4_MARGIN_LETTER } from "./printPage";
import { resolveApplicantOfficeId } from "./provincialOffice";
import { getLandBankStored } from "./landBankWithdrawal";

const MODULE_KEY = "landBank";

/** Fictional LBP branch managers — demo placeholders only */
const LBP_BRANCH_BY_OFFICE: Record<
  string,
  {
    landbankBranch: string;
    branchCityProvince: string;
    branchManagerName: string;
  }
> = {
  cotabato: {
    landbankBranch: "Kidapawan Branch",
    branchCityProvince: "Kidapawan City, North Cotabato",
    branchManagerName: "Ms. Elena R. Vasquez",
  },
  "south-cotabato": {
    landbankBranch: "Koronadal Branch",
    branchCityProvince: "Koronadal City, South Cotabato",
    branchManagerName: "Mr. Rafael M. Delos Santos",
  },
  "sultan-kudarat": {
    landbankBranch: "Tacurong Branch",
    branchCityProvince: "Tacurong City, Sultan Kudarat",
    branchManagerName: "Ms. Patricia L. Mendoza",
  },
  "gensan-sarangani": {
    landbankBranch: "General Santos Branch",
    branchCityProvince: "General Santos City",
    branchManagerName: "Mr. Jonas K. Villanueva",
  },
  default: {
    landbankBranch: "Kidapawan Branch",
    branchCityProvince: "Kidapawan City, North Cotabato",
    branchManagerName: "Ms. Elena R. Vasquez",
  },
};

const BRANCH_LOOKUP_BY_NAME: Record<string, keyof typeof LBP_BRANCH_BY_OFFICE> = {
  kidapawan: "cotabato",
  koronadal: "south-cotabato",
  tacurong: "sultan-kudarat",
  "general santos": "gensan-sarangani",
};

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function underThousand(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o ? `${TENS[t]}-${ONES[o].toLowerCase()}` : TENS[t];
  }
  const h = Math.floor(n / 100);
  const r = n % 100;
  const head = `${ONES[h]} Hundred`;
  return r ? `${head} ${underThousand(r)}` : head;
}

export function amountToWordsPeso(amount: string | number): string {
  const num =
    typeof amount === "number"
      ? Math.round(amount)
      : Math.round(parseFloat(String(amount).replace(/[^\d.]/g, "")) || 0);
  if (num === 0) return "Zero Pesos & 00/100";

  const millions = Math.floor(num / 1_000_000);
  const thousands = Math.floor((num % 1_000_000) / 1000);
  const remainder = num % 1000;
  const parts: string[] = [];

  if (millions) {
    parts.push(`${underThousand(millions)} Million`);
  }
  if (thousands) {
    parts.push(`${underThousand(thousands)} Thousand`);
  }
  if (remainder) {
    parts.push(underThousand(remainder));
  }

  return `${parts.join(" ").trim()} Pesos & 00/100`;
}

export function formatPesoDisplay(amount: string | number): string {
  const num =
    typeof amount === "number"
      ? amount
      : parseFloat(String(amount).replace(/[^\d.]/g, "")) || 0;
  return num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function managerSalutation(managerName: string): string {
  const parts = managerName.trim().split(/\s+/);
  const surname = parts[parts.length - 1]?.replace(/[,.]/g, "") ?? "Manager";
  return `Dear Manager ${surname}:`;
}

export function resolveLbpBranchForApplicant(applicant: Applicant | null) {
  if (!applicant) return LBP_BRANCH_BY_OFFICE.default;
  const officeId = resolveApplicantOfficeId(applicant);
  return LBP_BRANCH_BY_OFFICE[officeId] ?? LBP_BRANCH_BY_OFFICE.default;
}

export function resolveLbpBranchByBranchName(branchName: string) {
  const key = branchName.trim().toLowerCase();
  for (const [needle, officeKey] of Object.entries(BRANCH_LOOKUP_BY_NAME)) {
    if (key.includes(needle)) {
      return LBP_BRANCH_BY_OFFICE[officeKey];
    }
  }
  return null;
}

export function emptyLbpIntroductionForm(): LbpIntroductionLetterForm {
  const now = new Date();
  return {
    letterDate: now.toISOString().split("T")[0],
    branchManagerName: "",
    branchManagerTitle: "Branch Manager",
    landbankBranch: "",
    branchCityProvince: "",
    proponentName: "",
    enterpriseName: "",
    projectTitle: "",
    approvedAmount: "",
    approvedAmountWords: "",
    signatoryName: DOST_REGION_12_DIRECTOR_NAME,
    signatoryTitle: "Regional Director",
    regionalOfficeName: DOST_REGION_12_OFFICE,
  };
}

export function getLbpIntroductionStored(
  applicant: Applicant | null,
): LbpIntroductionLetterStored | null {
  return getLandBankStored(applicant)?.introductionLetter ?? null;
}

export function getLbpIntroductionForm(applicant: Applicant | null): LbpIntroductionLetterForm {
  const stored = getLbpIntroductionStored(applicant);
  if (stored?.form) return stored.form;
  return syncLbpIntroductionFromUpstream(applicant);
}

export function hasLbpIntroductionPublished(applicant: Applicant | null): boolean {
  return !!getLbpIntroductionStored(applicant)?.published;
}

export function syncLbpIntroductionFromUpstream(
  applicant: Applicant | null,
): LbpIntroductionLetterForm {
  const base = emptyLbpIntroductionForm();
  if (!applicant) return base;

  const approval = getApprovalLetterForm(applicant);
  const pp = getProjectProposalForm(applicant);
  const branch = resolveLbpBranchForApplicant(applicant);
  const amount = approval.approvedAmount || pp.amountRequested || "₱0";
  const amountNum = parseFloat(String(amount).replace(/[^\d.]/g, "")) || 0;

  return {
    ...base,
    branchManagerName: branch.branchManagerName,
    branchManagerTitle: "Branch Manager",
    landbankBranch: branch.landbankBranch,
    branchCityProvince: branch.branchCityProvince,
    proponentName: approval.recipientName || pp.ownerName || applicant.applicantName,
    enterpriseName: pp.firmName || approval.enterpriseName || applicant.enterpriseName,
    projectTitle: pp.projectTitle || approval.projectTitle,
    approvedAmount: amountNum > 0 ? `₱${formatPesoDisplay(amountNum)}` : amount,
    approvedAmountWords: amountToWordsPeso(amountNum),
  };
}

export function buildLbpIntroductionBody(form: LbpIntroductionLetterForm): string[] {
  const amountFigures = form.approvedAmount.replace(/^₱/, "") || "0.00";
  return [
    `We are pleased to inform you that ${form.enterpriseName}, managed by ${form.proponentName}, has been approved for technical assistance in the amount of ${form.approvedAmountWords} (${amountFigures}) for the project "${form.projectTitle}" under the DOST Small Enterprise Technology Upgrading Program (SETUP).`,
    "In this regard, may we request your good office to allow the proponent to open a savings passbook account with your branch wherein we could deposit the said amount for the utilization of the proponent in the purchase/acquisition of equipment. In addition, kindly hold and tag the account unless a letter of authority from our office will be provided in the course of withdrawals of funds.",
    "Thank you.",
  ];
}

export function saveLbpIntroductionDraft(
  applicantId: string,
  form: LbpIntroductionLetterForm,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const landBank = getLandBankStored(applicant);
  const existing = landBank?.introductionLetter;
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form: landBank?.form ?? {
          accountSnapshot: null,
          withdrawalLetter: null,
          withdrawalRemarks: "",
          authorityLetterGenerated: false,
        },
        introductionLetter: {
          form,
          published: existing?.published ?? false,
          publishedAt: existing?.publishedAt,
          publishedBy: existing?.publishedBy,
          updatedAt: new Date().toISOString(),
        },
        submitted: landBank?.submitted,
        submittedAt: landBank?.submittedAt,
        submittedBy: landBank?.submittedBy,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}

export function validateLbpIntroductionPublish(form: LbpIntroductionLetterForm): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!form.branchManagerName?.trim()) errors.push("LandBank branch manager name is required.");
  if (!form.landbankBranch?.trim()) errors.push("LandBank branch is required.");
  if (!form.branchCityProvince?.trim()) errors.push("Branch city/province is required.");
  if (!form.proponentName?.trim()) errors.push("Proponent name is required.");
  if (!form.enterpriseName?.trim()) errors.push("Enterprise name is required.");
  if (!form.projectTitle?.trim()) errors.push("Project title is required.");
  if (!form.approvedAmount?.trim()) errors.push("Approved amount is required.");
  if (!form.signatoryName?.trim()) errors.push("Signatory name is required.");
  return errors;
}

export function publishLbpIntroduction(
  applicantId: string,
  form: LbpIntroductionLetterForm,
  publishedBy: string,
): string[] {
  const errors = validateLbpIntroductionPublish(form);
  if (errors.length) return errors;

  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return ["Applicant not found."];

  const landBank = getLandBankStored(applicant);
  const now = new Date().toISOString();
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      [MODULE_KEY]: {
        form: landBank?.form ?? {
          accountSnapshot: null,
          withdrawalLetter: null,
          withdrawalRemarks: "",
          authorityLetterGenerated: false,
        },
        introductionLetter: {
          form: { ...form },
          published: true,
          publishedAt: now,
          publishedBy,
          updatedAt: now,
        },
        submitted: landBank?.submitted,
        submittedAt: landBank?.submittedAt,
        submittedBy: landBank?.submittedBy,
        updatedAt: now,
      },
    },
  });
  return [];
}

export function getLbpIntroductionPrintStyles(): string {
  return `
    ${a4PageRule(A4_MARGIN_LETTER)}
    body { font-family: Georgia, 'Segoe UI', serif; padding: 0; color: #1f2937; font-size: 12px; line-height: 1.5; }
    .lbp-letterhead { text-align: center; margin-bottom: 16px; }
    .lbp-letterhead img { height: 56px; margin: 0 auto 8px; display: block; }
    .lbp-letterhead p { margin: 2px 0; font-size: 11px; }
    .lbp-date { margin-bottom: 20px; font-size: 12px; }
    .lbp-addressee { margin-bottom: 16px; font-size: 12px; }
    .lbp-addressee .lbp-name { font-weight: 700; text-transform: uppercase; }
    .lbp-salutation { margin-bottom: 16px; font-size: 12px; font-weight: 600; }
    .lbp-body p { text-align: justify; margin: 0 0 12px; }
    .lbp-closing { margin-top: 24px; }
    .lbp-sig-name { font-weight: 700; text-transform: uppercase; margin-top: 32px; }
    .lbp-footer { margin-top: 32px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #6b7280; text-align: center; line-height: 1.4; }
  `;
}

export function printLbpIntroductionLetter(applicationId?: string) {
  const el = document.getElementById("lbp-introduction-preview");
  const title = applicationId
    ? `Letter-Introduction-LBP-${applicationId}`
    : "Letter-Introduction-LBP";
  if (!el) {
    window.print();
    return;
  }
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>${title}</title>
    <style>${getLbpIntroductionPrintStyles()}</style></head>
    <body>${el.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export function downloadLbpIntroductionPdf(applicationId?: string) {
  printLbpIntroductionLetter(applicationId);
}

export { formatApprovalDisplayDate, DOST_REGION_12_ADDRESS };
