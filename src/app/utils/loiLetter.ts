/**
 * Author: Yzrel Jade B. Eborde
 */

import { Applicant } from "../store/applicantStore";
import { DOST_REGION_12_CONTACTS, DostOfficeContact } from "../constants/setupBrochure";
import { getProgramsByIds } from "../constants/dostProgramRecommendations";
import type { LoIAdditionalFields } from "./applicantPrefill";
import type { LoiGenerationRequest } from "../api/types";
import type { LoiDocumentResponse } from "../api/types";
import { printHtmlDocument } from "./printHtml";
import { a4PageRule, A4_MARGIN_LETTER } from "./printPage";

export const LOI_REGIONAL_ADDRESSEE = {
  name: "ENGR. SAMMY P. MALAWAN",
  title: "Regional Director",
  lines: [
    "ENGR. SAMMY P. MALAWAN",
    "Regional Director",
    "Department of Science and Technology",
    "Regional Office No. XII",
    "Philippine National Halal Laboratory and Science",
    "Center, Brgy. Paraiso, Koronadal City",
  ],
} as const;

export const LOI_REGIONAL_DIRECTOR_SURNAME = "Malawan";

const PROVINCE_TO_OFFICE_ID: Record<string, string> = {
  "south cotabato": "south-cotabato",
  cotabato: "cotabato",
  "north cotabato": "cotabato",
  "sultan kudarat": "sultan-kudarat",
  sarangani: "gensan-sarangani",
  "general santos city": "gensan-sarangani",
  "general santos": "gensan-sarangani",
};

const PSTO_SHORT_NAMES: Record<string, string> = {
  cotabato: "PSTO - Cotabato",
  "south-cotabato": "PSTO - South Cotabato",
  "sultan-kudarat": "PSTO - Sultan Kudarat",
  "gensan-sarangani": "PSTO - General Santos / Sarangani",
};

const HONORIFIC_MAP: Record<string, string> = {
  "engr.": "ENGR.",
  "dr.": "DR.",
  "mr.": "MR.",
  "ms.": "MS.",
};

function normalizeProvince(province: string): string {
  return province.trim().toLowerCase();
}

export function formatDirectorThruLine(director: string): string {
  const parsed = parseDirector(director);
  return `THRU: ${parsed.nameUpper}`;
}

function parseDirector(director: string): { nameUpper: string; title: string } {
  if (!director.trim()) {
    return { nameUpper: "PROVINCIAL DIRECTOR", title: "Provincial Director" };
  }

  const [namePart, titlePart = "Provincial Director"] = director.split(",").map((s) => s.trim());
  const tokens = namePart.split(/\s+/);
  let honorific = "";
  let name = namePart;

  if (tokens.length >= 2 && /^(engr\.|dr\.|mr\.|ms\.)$/i.test(tokens[0])) {
    honorific = HONORIFIC_MAP[tokens[0].toLowerCase()] ?? tokens[0].toUpperCase();
    name = tokens.slice(1).join(" ");
  }

  const upperHonorific = HONORIFIC_MAP[honorific.toLowerCase()] ?? honorific;

  return {
    nameUpper: `${upperHonorific} ${name}`.trim().toUpperCase(),
    title: titlePart,
  };
}

function toPstoShortName(office: DostOfficeContact): string {
  return PSTO_SHORT_NAMES[office.id] ?? office.name;
}

function splitAddress(address: string): string[] {
  if (!address.trim()) return [];
  return address.split(/,\s*/);
}

export function resolveProvincialOffice(province: string): {
  contact: DostOfficeContact;
  thruLine: string;
  title: string;
  officeName: string;
  addressLines: string[];
  lines: string[];
  defaulted: boolean;
} {
  const key = normalizeProvince(province);
  const officeId = PROVINCE_TO_OFFICE_ID[key] ?? "regional";
  const defaulted = !(key in PROVINCE_TO_OFFICE_ID);

  const contact =
    DOST_REGION_12_CONTACTS.find((c) => c.id === officeId) ??
    DOST_REGION_12_CONTACTS.find((c) => c.id === "regional")!;

  const parsed = parseDirector(contact.director);
  const officeName = toPstoShortName(contact);
  const addressLines = splitAddress(contact.address);

  const lines = [
    formatDirectorThruLine(contact.director),
    parsed.title,
    officeName,
    ...addressLines,
  ];

  return {
    contact,
    thruLine: formatDirectorThruLine(contact.director),
    title: parsed.title,
    officeName,
    addressLines,
    lines,
    defaulted,
  };
}

export type LoiCommitmentFields = {
  approvedAmount: string;
  repaymentTerm: string;
};

export type LoiSignatureFields = {
  signature: string;
  signedDate: string;
};

export function buildLoiGenerationPayload(
  applicant: Applicant,
  additional: LoIAdditionalFields,
  commitment: LoiCommitmentFields,
  signature: LoiSignatureFields,
  productionPlanFile?: string | null,
): LoiGenerationRequest {
  const md = applicant.moduleData ?? {};

  const selectedProgram = getProgramsByIds([
    String(md.selectedProgramId ?? ""),
  ])[0];

  return {
    applicantName: applicant.applicantName,
    designation: applicant.designation,
    enterpriseName: applicant.enterpriseName,
    emailAddress: applicant.emailAddress,
    contactNumber: applicant.contactNumber,
    address: applicant.address,
    province: additional.province || String(md.province ?? ""),
    zipCode: additional.zipCode || String(md.zipCode ?? md.postalCode ?? ""),
    tinNumber: additional.tinNumber || String(md.tinNumber ?? ""),
    registrationType: additional.registrationType || String(md.registrationType ?? ""),
    registrationNumber: additional.registrationNumber || String(md.registrationNumber ?? ""),
    companyDescription: String(md.companyDescription ?? ""),
    dateEstablished: additional.dateEstablished || String(md.dateEstablished ?? md.companyStartDate ?? ""),

    msmeSize: applicant.msmeSize,
    businessType: applicant.businessType,
    businessSector: applicant.businessSector,
    businessNature: applicant.businessNature,
    yearsOfOperation: applicant.yearsOfOperation,
    assetSize: applicant.assetSize,
    coreProducts: String(md.coreProducts ?? ""),
    turnover: String(md.turnover ?? ""),
    qualified: applicant.qualified,
    exportClassification: String(md.exportClassification ?? ""),

    productServices: additional.productServices,
    projectDescription: additional.projectDescription,
    expectedOutcome: additional.expectedOutcome,
    budget: selectedProgram ? "" : additional.budget,
    timeline: selectedProgram ? "" : additional.timeline,
    commitmentAmount: selectedProgram ? "" : commitment.approvedAmount,
    repaymentTerm: selectedProgram ? "" : commitment.repaymentTerm,
    productionPlanFile: productionPlanFile ?? String(md.productionPlanFile ?? ""),

    signature: signature.signature,
    dateSigned: signature.signedDate,

    programId: String(md.selectedProgramId ?? ""),
    programName: String(md.selectedProgramName ?? ""),
    programSummary: selectedProgram?.summary ?? "",
  };
}

/** Display name of the program the LOI targets (defaults to SETUP 4.0). */
export function loiProgramLabel(payload: {
  programName?: string;
}): string {
  return payload.programName?.trim()
    ? payload.programName.trim()
    : "the Small Enterprise Technology Upgrading Program (SETUP) 4.0";
}

export function buildTemplateLoiBody(
  payload: LoiGenerationRequest,
): string[] {
  const val = (v?: string) => (v?.trim() ? v.trim() : "as indicated in our application");
  const budget = (v?: string) => {
    if (!v?.trim()) return "the amount stated in our application";
    return v.trim().startsWith("₱") ? v.trim() : `₱${v.trim()}`;
  };

  const hasProgram = !!payload.programName?.trim();
  const programLabel = loiProgramLabel(payload);
  const guidelinesLabel = hasProgram ? programLabel : "DOST SETUP 4.0";

  const paragraphs: string[] = [
    `We, ${val(payload.applicantName)}, ${val(payload.designation)} of ${val(payload.enterpriseName)}, hereby express our sincere intent to participate in ${programLabel} of the Department of Science and Technology.`,
    `${val(payload.enterpriseName)} is a ${val(payload.msmeSize)} ${val(payload.businessType)} operating in the ${val(payload.businessSector)} sector with ${val(payload.yearsOfOperation)} years of operation. Our enterprise offers ${val(payload.productServices)} and seeks to upgrade our operations through appropriate science and technology interventions.`,
  ];

  if (hasProgram && payload.programSummary?.trim()) {
    const summary = payload.programSummary.trim().replace(/\.+$/, "");
    paragraphs.push(
      `We are particularly interested in this program because ${summary.charAt(0).toLowerCase()}${summary.slice(1)}. We believe this assistance directly addresses our enterprise's current needs.`,
    );
  }

  // Project / budget paragraph: qualified SETUP clients only.
  // Unqualified (recommended-program) LOIs must omit this section.
  const isSetupQualified = payload.qualified === true && !hasProgram;
  if (
    isSetupQualified &&
    (payload.projectDescription?.trim() ||
      payload.expectedOutcome?.trim() ||
      payload.budget?.trim() ||
      payload.timeline?.trim())
  ) {
    paragraphs.push(
      `Our proposed project involves ${val(payload.projectDescription)}. We expect this initiative to ${val(payload.expectedOutcome)},
       with an estimated budget of ${budget(payload.budget)} and a timeline of ${val(payload.timeline)}.`,
    );
  }

  if (isSetupQualified) {
    paragraphs.push(
      `We commit to fully comply with all DOST SETUP 4.0 guidelines and requirements, including the refund of the approved seed fund amounting to ${budget(payload.commitmentAmount)} over ${val(payload.repaymentTerm)} at zero percent interest, and to cover the insurance cost for acquired equipment as our enterprise counterpart. We understand our obligations under the program and pledge our full cooperation throughout the evaluation and implementation process.`,
    );
  } else {
    paragraphs.push(
      `We commit to fully comply with all ${guidelinesLabel} guidelines and requirements of the Department of Science and Technology. We understand our obligations under the program and pledge our full cooperation throughout the evaluation and implementation process.`,
    );
  }

  if (payload.productionPlanFile?.trim()) {
    paragraphs.push(
      `For your reference, we have attached our Production Plan (${payload.productionPlanFile}) detailing our operational requirements and projected improvements.`,
    );
  }

  return paragraphs;
}

function formatDisplayDate(dateSigned?: string): string {
  if (!dateSigned?.trim()) {
    return new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const parsed = new Date(dateSigned);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return dateSigned;
}

/** Client-side fallback when the Spring Boot API is unavailable */
export function buildLocalLoiDocument(payload: LoiGenerationRequest): LoiDocumentResponse {
  const thru = resolveProvincialOffice(payload.province ?? "");

  return {
    letterhead: {
      enterpriseName: (payload.enterpriseName ?? "").toUpperCase(),
      address: payload.address ?? "",
      email: payload.emailAddress ?? "",
      mobile: payload.contactNumber ?? "",
      date: formatDisplayDate(payload.dateSigned),
    },
    regionalAddressee: {
      name: LOI_REGIONAL_ADDRESSEE.name,
      title: LOI_REGIONAL_ADDRESSEE.title,
      lines: [...LOI_REGIONAL_ADDRESSEE.lines],
    },
    thruAddressee: {
      name: thru.thruLine.replace(/^THRU:\s*/i, ""),
      title: thru.title,
      thruLine: thru.thruLine,
      officeName: thru.officeName,
      lines: thru.lines,
      addressLines: thru.addressLines,
      defaulted: thru.defaulted,
    },
    salutation: `Dear Regional Director ${LOI_REGIONAL_DIRECTOR_SURNAME}:`,
    bodyParagraphs: buildTemplateLoiBody(payload),
    closing: "Respectfully yours,",
    signature: {
      typedName: payload.signature ?? "",
      printedName: payload.applicantName ?? "",
      designation: payload.designation ?? "",
      enterpriseName: payload.enterpriseName ?? "",
      dateSigned: payload.dateSigned ?? "",
    },
    generatedAt: new Date().toISOString(),
    aiGenerated: false,
    provincialOfficeDefaulted: thru.defaulted,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asLines(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.map((line) => String(line ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return fallback;
}

/**
 * Coerce stored `moduleData.loiDocument` into a renderable letter.
 * Tolerates full-field / legacy blobs that nest form fields and omit letterhead.
 */
export function coerceLoiDocument(
  raw: unknown,
  fallbacks?: {
    enterpriseName?: string;
    applicantName?: string;
    designation?: string;
    address?: string;
    email?: string;
    contactNumber?: string;
    province?: string;
  },
): LoiDocumentResponse | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const bodyParagraphs = asLines(obj.bodyParagraphs);
  if (!bodyParagraphs.length) return null;

  const form = asRecord(obj.form) ?? {};
  const pick = (...keys: string[]): string => {
    for (const key of keys) {
      const fromObj = obj[key];
      if (typeof fromObj === "string" && fromObj.trim()) return fromObj.trim();
      const fromForm = form[key];
      if (typeof fromForm === "string" && fromForm.trim()) return fromForm.trim();
    }
    return "";
  };

  const enterpriseName =
    pick("enterpriseName") || fallbacks?.enterpriseName || "";
  const applicantName =
    pick("applicantName", "printedName") || fallbacks?.applicantName || "";
  const designation =
    pick("designation") || fallbacks?.designation || "";
  const address = pick("address", "enterpriseAddress") || fallbacks?.address || "";
  const email = pick("email", "emailAddress") || fallbacks?.email || "";
  const mobile =
    pick("mobile", "contactNumber") || fallbacks?.contactNumber || "";
  const dateSigned =
    pick("dateSigned", "signedDate", "commitDate") || "";
  const typedName =
    pick("signature", "typedName", "commitSignature") || applicantName;
  const province = pick("province") || fallbacks?.province || "";

  const letterheadRaw = asRecord(obj.letterhead);
  const signatureRaw = asRecord(obj.signature);
  const regionalRaw = asRecord(obj.regionalAddressee);
  const thruRaw = asRecord(obj.thruAddressee);

  const thruFallback = resolveProvincialOffice(province);
  const thruLinesFromRaw = asLines(thruRaw?.lines);
  const thruLines =
    thruLinesFromRaw.length > 0
      ? thruLinesFromRaw
      : thruRaw
        ? [
            String(thruRaw.thruLine ?? thruRaw.name ?? "").trim(),
            String(thruRaw.title ?? "").trim(),
            String(thruRaw.officeName ?? "").trim(),
          ].filter(Boolean)
        : thruFallback.lines;

  return {
    letterhead: {
      enterpriseName: (
        String(letterheadRaw?.enterpriseName ?? enterpriseName) || ""
      ).toUpperCase(),
      address: String(letterheadRaw?.address ?? address),
      email: String(letterheadRaw?.email ?? email),
      mobile: String(letterheadRaw?.mobile ?? mobile),
      date: String(
        letterheadRaw?.date ?? formatDisplayDate(dateSigned),
      ),
    },
    regionalAddressee: {
      name: String(regionalRaw?.name ?? LOI_REGIONAL_ADDRESSEE.name),
      title: String(regionalRaw?.title ?? LOI_REGIONAL_ADDRESSEE.title),
      lines: asLines(regionalRaw?.lines, [...LOI_REGIONAL_ADDRESSEE.lines]),
    },
    thruAddressee: {
      name: String(
        thruRaw?.name ??
          thruFallback.thruLine.replace(/^THRU:\s*/i, ""),
      ),
      title: String(thruRaw?.title ?? thruFallback.title),
      thruLine: String(thruRaw?.thruLine ?? thruFallback.thruLine),
      officeName: String(thruRaw?.officeName ?? thruFallback.officeName),
      lines: thruLines.length ? thruLines : thruFallback.lines,
      addressLines: asLines(
        thruRaw?.addressLines,
        thruFallback.addressLines ?? [],
      ),
      defaulted: Boolean(thruRaw?.defaulted ?? thruFallback.defaulted),
    },
    salutation: String(
      obj.salutation ??
        `Dear Regional Director ${LOI_REGIONAL_DIRECTOR_SURNAME}:`,
    ),
    bodyParagraphs,
    closing: String(obj.closing ?? "Respectfully yours,"),
    signature: {
      typedName: String(signatureRaw?.typedName ?? typedName),
      printedName: String(signatureRaw?.printedName ?? applicantName),
      designation: String(signatureRaw?.designation ?? designation),
      enterpriseName: String(
        signatureRaw?.enterpriseName ?? enterpriseName,
      ),
      dateSigned: String(signatureRaw?.dateSigned ?? dateSigned),
    },
    generatedAt: String(obj.generatedAt ?? new Date().toISOString()),
    aiGenerated: Boolean(obj.aiGenerated),
    provincialOfficeDefaulted: Boolean(
      obj.provincialOfficeDefaulted ?? thruFallback.defaulted,
    ),
  };
}

export function getLoiPrintStyles(): string {
  return `
    ${a4PageRule(A4_MARGIN_LETTER)}
    body {
      font-family: Georgia, "Times New Roman", serif;
      padding: 0;
      color: #1f2937;
      font-size: 12pt;
      line-height: 1.5;
    }
    .print-a4-sheet {
      width: 100%;
      min-height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    .loi-letterhead { margin-bottom: 16px; }
    .loi-letterhead .loi-enterprise {
      font-weight: 900;
      font-size: 14pt;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .loi-letterhead p { margin: 0 0 2px; }
    .loi-block { margin-bottom: 16px; }
    .loi-block p { margin: 0 0 2px; }
    .loi-block .loi-first-line { font-weight: 600; }
    .loi-body p { text-align: justify; margin: 0 0 12px; }
    .loi-closing { margin-top: 8px; }
    .loi-signature {
      margin-top: 32px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .loi-signature .loi-typed {
      font-weight: 900;
      font-style: italic;
      border-bottom: 1px solid #6b7280;
      display: inline-block;
      padding-bottom: 2px;
      padding-right: 5rem;
    }
    .loi-signature p { margin: 0 0 2px; }
    .loi-meta {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #9ca3af;
    }
    .loi-meta p { margin: 0 0 2px; }
  `;
}

export function printLoiDocument(applicationId?: string): void {
  const el = document.getElementById("loi-document-print");
  const title = applicationId
    ? `Letter-of-Intent-${applicationId}`
    : "Letter-of-Intent";
  if (!el) {
    window.print();
    return;
  }
  printHtmlDocument(title, el.innerHTML, getLoiPrintStyles());
}
