/**
 * Author: Yzrel Jade B. Eborde
 */

import { Applicant } from "../store/applicantStore";
import { DOST_REGION_12_CONTACTS, DostOfficeContact } from "../constants/setupBrochure";
import type { LoIAdditionalFields } from "./applicantPrefill";
import type { LoiGenerationRequest } from "../api/types";
import type { LoiDocumentResponse } from "../api/types";

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
    budget: additional.budget,
    timeline: additional.timeline,
    commitmentAmount: commitment.approvedAmount,
    repaymentTerm: commitment.repaymentTerm,
    productionPlanFile: productionPlanFile ?? String(md.productionPlanFile ?? ""),

    signature: signature.signature,
    dateSigned: signature.signedDate,
  };
}

export function buildTemplateLoiBody(
  payload: LoiGenerationRequest,
): string[] {
  const val = (v?: string) => (v?.trim() ? v.trim() : "as indicated in our application");
  const budget = (v?: string) => {
    if (!v?.trim()) return "the amount stated in our application";
    return v.trim().startsWith("₱") ? v.trim() : `₱${v.trim()}`;
  };

  const paragraphs: string[] = [
    `We, ${val(payload.applicantName)}, ${val(payload.designation)} of ${val(payload.enterpriseName)}, hereby express our sincere intent to participate in the Small Enterprise Technology Upgrading Program (SETUP) 4.0 of the Department of Science and Technology.`,
    `${val(payload.enterpriseName)} is a ${val(payload.msmeSize)} ${val(payload.businessType)} operating in the ${val(payload.businessSector)} sector with ${val(payload.yearsOfOperation)} years of operation. Our enterprise offers ${val(payload.productServices)} and seeks to upgrade our operations through appropriate science and technology interventions.`,
  ];

  if (payload.projectDescription?.trim() || payload.expectedOutcome?.trim()) {
    paragraphs.push(
      `Our proposed project involves ${val(payload.projectDescription)}. We expect this initiative to ${val(payload.expectedOutcome)}, with an estimated budget of ${budget(payload.budget)} and a timeline of ${val(payload.timeline)}.`,
    );
  }

  paragraphs.push(
    `We commit to fully comply with all DOST SETUP 4.0 guidelines and requirements, including the refund of the approved seed fund amounting to ${budget(payload.commitmentAmount)} over ${val(payload.repaymentTerm)} at zero percent interest, and to cover the insurance cost for acquired equipment as our enterprise counterpart. We understand our obligations under the program and pledge our full cooperation throughout the evaluation and implementation process.`,
  );

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
