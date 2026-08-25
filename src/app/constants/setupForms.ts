/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP / TNA form titles for module UI (title-first labeling).
 * PDF print templates keep full "SETUP Form NNN" headers separately.
 *
 * Regional forms pack (SETUP Forms, Jul 2026) — official titles for reference.
 * App module keys below are unchanged until numbering is decided:
 *   001 Project Proposal Format
 *   002 RTEC Report
 *   003 Status Report          ← pack; app still uses Notice of Approval (Annex A-3)
 *   004 Audited Financial Report
 *   005 Property Transfer Receipt
 *   006 Inventory of Equipment
 *   007 List of Pulled-Out Equipment
 *   008 Pre-Implementation Project Information Sheet
 *   009 Project Information Sheet for Ongoing Projects
 *   010 Completion Report      ← pack; app still labels Terminal Report as 010
 *   011 Termination/Withdrawal Report
 *   012 Refund Performance Report
 *   013 Terminal Report
 *   TNA 01 Application for Technology Needs Assessment
 *   TNA 02 Technology Needs Assessment Report
 * Also in pack (no form number): Application Requirements Checklist,
 * Proforma MOA Annex C, Sworn Affidavit, Payment Reminder Letter,
 * Computation of Final Obligation Annex B.
 * Notice of Approval is not in the pack (open numbering decision).
 */

export interface SetupFormMeta {
  key: string;
  title: string;
  number: string;
  annex?: string;
  program?: string;
  confirmed: boolean;
  /** Official title from regional forms pack when it differs from module UI title */
  packTitle?: string;
}

export const SETUP_FORMS = {
  "001": {
    key: "001",
    title: "Project Proposal",
    number: "001",
    packTitle: "Project Proposal Format",
    confirmed: true,
  },
  "002": {
    key: "002",
    title: "RTEC Report",
    number: "002",
    annex: "Annex A-2",
    confirmed: true,
  },
  "003": {
    key: "003",
    title: "Notice of Approval",
    number: "003",
    annex: "Annex A-3",
    /** Pack Form 003 is Status Report — numbering undecided */
    packTitle: "Status Report (pack) / Notice of Approval (app)",
    confirmed: true,
  },
  "008": {
    key: "008",
    title: "Pre-Implementation PIS",
    number: "008",
    annex: "Annex E",
    packTitle: "Pre-Implementation Project Information Sheet",
    confirmed: true,
  },
  "009": {
    key: "009",
    title: "Project Information Sheet",
    number: "009",
    packTitle: "Project Information Sheet for Ongoing Projects",
    confirmed: true,
  },
  "006": {
    key: "006",
    title: "Inventory of Equipment",
    number: "006",
    annex: "Annex A-6",
    confirmed: true,
  },
  "010": {
    key: "010",
    title: "Terminal Report",
    number: "010",
    /** Pack Form 010 is Completion Report; Terminal Report is Form 013 */
    packTitle: "Completion Report (pack) / Terminal Report (app)",
    confirmed: true,
  },
  tna01: {
    key: "tna01",
    title: "Application for Technology Needs Assessment",
    number: "01",
    program: "DOST TNA",
    confirmed: true,
  },
  tna02: {
    key: "tna02",
    title: "Technology Needs Assessment Report",
    number: "02",
    program: "DOST TNA",
    confirmed: true,
  },
} as const satisfies Record<string, SetupFormMeta>;

/**
 * Present in regional forms pack but not yet wired in module UI.
 * Official titles: 004 Audited Financial Report, 005 Property Transfer Receipt,
 * 007 List of Pulled-Out Equipment,
 * 011 Termination/Withdrawal Report, 012 Refund Performance Report,
 * 013 Terminal Report.
 * Form 006 Inventory of Equipment is wired in Project Close-Out.
 */
export const SETUP_FORMS_TBD = [
  "004",
  "005",
  "007",
  "011",
  "012",
  "013",
] as const;

export type SetupFormKey = keyof typeof SETUP_FORMS;

export function getSetupForm(key: SetupFormKey): SetupFormMeta {
  return SETUP_FORMS[key];
}

export function getSetupFormTitle(key: SetupFormKey): string {
  return SETUP_FORMS[key].title;
}

export function getSetupFormRef(key: SetupFormKey): string {
  const f: SetupFormMeta = SETUP_FORMS[key];
  if (f.program) {
    const annex = f.annex ? ` · ${f.annex}` : "";
    return `${f.program} Form ${f.number}${annex}`;
  }
  const parts = [`Form ${f.number}`];
  if (f.annex) parts.push(f.annex);
  return parts.join(" · ");
}

export type FormMentionStyle = "title" | "ref" | "both";

/** Inline module copy — title-first by default */
export function formatFormMention(
  key: SetupFormKey,
  style: FormMentionStyle = "title",
): string {
  const f = SETUP_FORMS[key];
  switch (style) {
    case "title":
      return f.title;
    case "ref":
      return getSetupFormRef(key);
    case "both":
      return `${f.title} (${getSetupFormRef(key)})`;
  }
}
