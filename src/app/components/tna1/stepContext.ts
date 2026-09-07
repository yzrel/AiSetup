/**
 * Author: Yzrel Jade B. Eborde
 *
 * Shared state/handler bundle passed from TechnologyNeedsAssessment1 to the
 * per-step components in this folder.
 */

import type { Dispatch, SetStateAction } from "react";
import type { Applicant } from "../../store/applicantStore";
import type { AuthUser } from "../../store/authStore";
import type {
  buildInitialTnaForm,
  EMPTY_TNA_TABLES,
} from "../../store/tnaFormDefaults";

/** TNA form fields plus string indexing for dynamic field-name driven UI. */
export type TnaFormState = ReturnType<typeof buildInitialTnaForm> &
  Record<string, any>;

export type TnaTables = typeof EMPTY_TNA_TABLES;

export interface Tna1Section {
  id: string;
  name: string;
  required: boolean;
  verified: boolean;
  flagged: boolean;
  remark: string;
}

export interface Tna1StepContext {
  // Identity / roles
  applicant: Applicant | null;
  user?: AuthUser | null;
  isStaff: boolean;
  staffMode: boolean;
  setStaffMode: (value: boolean) => void;

  // Form state
  form: TnaFormState;
  set: (key: string, value: unknown) => void;
  tables: TnaTables;
  setT: (key: string, rows: string[][]) => void;

  // Navigation
  setStep: (id: string) => void;
  goToStep: (id: string) => void;

  // Draft / submit
  saveTnaDraft: (submitted?: boolean) => void;
  applicantSubmitted: boolean;
  setApplicantSubmitted: (value: boolean) => void;
  onSubmitSuccess?: () => void;

  // AI generation
  tnaGenerating: boolean;
  tnaGenerateError: string | null;
  tnaAiGenerated: boolean | null;
  handleGenerateTna1: () => Promise<unknown>;
  /** Field-level AI suggest binding for AiAssistTextarea. */
  tnaAi: (field: string, apply: (value: string) => void) => any;

  // Staff review
  staffNotes: string;
  setStaffNotes: (value: string) => void;
  siteVisitDate: string;
  setSiteVisitDate: (value: string) => void;
  siteVisitNotes: string;
  setSiteVisitNotes: (value: string) => void;
  persistStaffReview: (decision: "approved" | "needs-revision") => void;
  staffApproved: boolean;

  // Director validation
  directorValidated: boolean;
  directorValidatedBy: string;
  directorValidatedAt: string;
  canDirectorValidate: boolean;
  isDirectorForApplicant: boolean;
  applicantOfficeId: string;
  handleDirectorValidate: () => void;

  // Section verification checklist (content tabs)
  sections: Tna1Section[];
  setSections: Dispatch<SetStateAction<Tna1Section[]>>;
  allSectionsReviewed: boolean;
  persistSectionReview: (nextSections: Tna1Section[]) => void;
  resubmissionError?: string;

  // Validation
  allGA: boolean;
  validationChecks: { label: string; value?: string; passed: boolean }[];
  allValid: boolean;

  // Preview (published document snapshot wins over live form)
  previewForm: Record<string, unknown>;
  previewTables: TnaTables;
}
