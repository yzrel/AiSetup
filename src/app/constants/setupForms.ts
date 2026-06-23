/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official SETUP / TNA form titles for module UI (title-first labeling).
 * PDF print templates keep full "SETUP Form NNN" headers separately.
 */

export interface SetupFormMeta {
  key: string;
  title: string;
  number: string;
  annex?: string;
  program?: string;
  confirmed: boolean;
}

export const SETUP_FORMS = {
  "001": {
    key: "001",
    title: "Project Proposal",
    number: "001",
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
    confirmed: true,
  },
  "008": {
    key: "008",
    title: "Pre-Implementation PIS",
    number: "008",
    annex: "Annex E",
    confirmed: true,
  },
  "009": {
    key: "009",
    title: "Project Information Sheet",
    number: "009",
    confirmed: true,
  },
  "010": {
    key: "010",
    title: "Terminal Report",
    number: "010",
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
    title: "Technical Report",
    number: "02",
    program: "DOST TNA",
    confirmed: true,
  },
} as const satisfies Record<string, SetupFormMeta>;

/** Reserved until regional PDF confirms titles — do not use in module UI yet */
export const SETUP_FORMS_TBD = ["004", "005", "006", "007"] as const;

export type SetupFormKey = keyof typeof SETUP_FORMS;

export function getSetupForm(key: SetupFormKey): SetupFormMeta {
  return SETUP_FORMS[key];
}

export function getSetupFormTitle(key: SetupFormKey): string {
  return SETUP_FORMS[key].title;
}

export function getSetupFormRef(key: SetupFormKey): string {
  const f = SETUP_FORMS[key];
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
