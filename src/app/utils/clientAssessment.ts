/**
 * Author: Yzrel Jade B. Eborde
 */

import { Applicant, ModuleStatus } from "../store/applicantStore";
import { AdminView } from "../store/authStore";

export type AssessmentStage =
  | "prescreening"
  | "requirements"
  | "tna1"
  | "tna2"
  | "post-proposal";

export type AssessmentStatus = "pending" | "in_progress" | "completed";

export interface AssessmentTask {
  stage: AssessmentStage;
  label: string;
  status: AssessmentStatus;
  view: AdminView;
  description: string;
}

export interface StaffAssessmentRecord {
  stage: AssessmentStage;
  decision: string;
  assessedBy: string;
  assessedAt: string;
  remarks?: string;
}

function hasAssessment(
  applicant: Applicant,
  stage: AssessmentStage,
): boolean {
  const records = (applicant.moduleData?.assessments ??
    []) as StaffAssessmentRecord[];
  return records.some((r) => r.stage === stage);
}

function prescreeningStatus(applicant: Applicant): AssessmentStatus {
  if (hasAssessment(applicant, "prescreening")) return "completed";
  if (applicant.qualified) return "completed";
  if (
    applicant.currentModule !== "prescreening" ||
    applicant.applicantName ||
    applicant.businessSector
  ) {
    return "pending";
  }
  return "in_progress";
}

function requirementsStatus(applicant: Applicant): AssessmentStatus {
  if (hasAssessment(applicant, "requirements")) return "completed";
  if (applicant.moduleData?.staffDecision) return "completed";
  if (applicant.moduleData?.documentsSubmitted) return "pending";
  const idx = moduleIndex(applicant.currentModule);
  if (idx > moduleIndex("requirements")) return "in_progress";
  return "completed";
}

function tna1Status(applicant: Applicant): AssessmentStatus {
  if (hasAssessment(applicant, "tna1")) return "completed";
  if (applicant.moduleData?.tna1?.staffReviewed) return "completed";
  if (applicant.moduleData?.tna1?.submitted) return "pending";
  const idx = moduleIndex(applicant.currentModule);
  if (idx >= moduleIndex("tna1")) return "in_progress";
  return "completed";
}

function tna2Status(applicant: Applicant): AssessmentStatus {
  if (hasAssessment(applicant, "tna2")) return "completed";
  const doc = applicant.moduleData?.tna2Document;
  if (doc?.published) return "completed";
  const idx = moduleIndex(applicant.currentModule);
  if (idx >= moduleIndex("tna2")) return "pending";
  return "completed";
}

function postProposalStatus(applicant: Applicant): AssessmentStatus {
  if (hasAssessment(applicant, "post-proposal")) return "completed";
  if (
    applicant.currentModule === "conduct-rtec" ||
    applicant.currentModule === "approval-letter" ||
    applicant.currentModule === "project-information-sheet"
  ) {
    return "pending";
  }
  return "completed";
}

const MODULE_ORDER: ModuleStatus[] = [
  "prescreening",
  "registration",
  "letter-of-intent",
  "requirements",
  "tna1",
  "tna2",
  "project-proposal",
  "conduct-rtec",
  "approval-letter",
  "project-information-sheet",
  "landbank-withdrawal",
  "procurement-liquidation",
  "refund-delinquent",
  "completed",
];

function moduleIndex(module: ModuleStatus): number {
  const idx = MODULE_ORDER.indexOf(module);
  return idx === -1 ? 0 : idx;
}

export function getAssessmentTasks(applicant: Applicant): AssessmentTask[] {
  const tasks: AssessmentTask[] = [
    {
      stage: "prescreening",
      label: "Pre-Screening",
      status: prescreeningStatus(applicant),
      view: "prescreening",
      description: "Verify eligibility and priority sector classification.",
    },
    {
      stage: "requirements",
      label: "Document Requirements",
      status: requirementsStatus(applicant),
      view: "requirements",
      description: "Review submitted documents and RTEC readiness.",
    },
    {
      stage: "tna1",
      label: "TNA Form 01",
      status: tna1Status(applicant),
      view: "tna1",
      description: "Review technology needs assessment and staff remarks.",
    },
    {
      stage: "tna2",
      label: "TNA Form 02",
      status: tna2Status(applicant),
      view: "tna2",
      description: "Generate, edit, and publish the technical report.",
    },
    {
      stage: "post-proposal",
      label: "RTEC & Approval",
      status: postProposalStatus(applicant),
      view:
        applicant.currentModule === "approval-letter"
          ? "approval-letter"
          : "conduct-rtec",
      description: "Conduct evaluation and issue approval.",
    },
  ];

  return tasks;
}

export function needsStaffAssessment(applicant: Applicant): boolean {
  return getAssessmentTasks(applicant).some((t) => t.status === "pending");
}

export function countNeedsAssessment(applicants: Applicant[]): number {
  return applicants.filter(needsStaffAssessment).length;
}

export function getOverallAssessmentLabel(
  applicant: Applicant,
): "Needs review" | "In progress" | "Up to date" {
  const tasks = getAssessmentTasks(applicant);
  if (tasks.some((t) => t.status === "pending")) return "Needs review";
  if (tasks.some((t) => t.status === "in_progress")) return "In progress";
  return "Up to date";
}

export function appendStaffAssessment(
  applicant: Applicant,
  record: StaffAssessmentRecord,
): Partial<Applicant> {
  const existing = (applicant.moduleData?.assessments ??
    []) as StaffAssessmentRecord[];
  return {
    moduleData: {
      ...applicant.moduleData,
      assessments: [
        ...existing.filter((r) => r.stage !== record.stage),
        record,
      ],
    },
  };
}
