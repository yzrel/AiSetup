/**
 * Author: Yzrel Jade B. Eborde
 */

import { applicantStore, Applicant } from "../store/applicantStore";
import type {
  ProjectProposalAttachment,
  ProjectProposalForm,
  RtecComplianceItem,
  RtecComplianceStatus,
  RtecConstraintRow,
  RtecFabricatorRow,
  RtecReportForm,
  RtecReportStored,
  RtecSignatures,
} from "../api/types";
import {
  getProjectProposalAttachments,
  getProjectProposalForm,
  getProjectProposalStored,
} from "./projectProposal";
import { getPublishedTna2 } from "./tnaForm02";
import { DOST_REGION_12_DIRECTOR_NAME } from "../constants/region12";
import { isDemoModeActive } from "./demoMode";
import { printRtecReportPdf } from "./rtecReportPrint";

const DOST_BLUE = "#0C2461";

export const RTEC_COMPLIANCE_ITEMS: { id: string; label: string }[] = [
  {
    id: "loi",
    label:
      "Letter of intent to avail of the SETUP assistance, stating commitment to refund the iFund support and cover the insurance cost for the acquired equipment.",
  },
  {
    id: "tna1",
    label:
      "Accomplished DOST TNA Form 01 (Application for Technology Needs Assessment)",
  },
  {
    id: "tna2",
    label:
      "Accomplished DOST TNA Form 02 (Technology Needs Assessment Report)",
  },
  {
    id: "form001",
    label: "Proposal following SETUP Form 001 (Project Proposal Format)",
  },
  {
    id: "permits",
    label:
      "Copy of business permits and licenses issued by LGUs and other appropriate government agencies",
  },
  {
    id: "financial",
    label:
      "Financial statements for the past three (3) years for small and medium enterprises and at least one (1) year for micro enterprises together with notarized Sworn Statement that all information provided are true and correct.",
  },
  {
    id: "projected",
    label: "Projected financial statements",
  },
  {
    id: "official-receipt",
    label: "Photocopy of Official Receipt",
  },
  {
    id: "registration",
    label:
      "Certificate of registration of business name with the Department of Trade and Industry (DTI), Securities and Exchange Commission (SEC) or Cooperative Development Authority (CDA), whichever is applicable.",
  },
  {
    id: "articles",
    label:
      "Copy of Articles of Incorporation for cooperatives and associations",
  },
  {
    id: "affidavit",
    label:
      "Sworn affidavit of no relation up to the third degree of consanguinity and affinity to the approving authority and no bad debt",
  },
  {
    id: "resolution",
    label:
      "In the case of cooperatives and non-single proprietorship, LGUs, organization, Board/Legislative Council resolution authorizing the availment of the assistance and designating authorized signatory for the financial assistance.",
  },
  {
    id: "quotations",
    label:
      "Three (3) quotations for each equipment from suppliers/fabricators of the equipment to be purchased/fabricated",
  },
  {
    id: "drawings",
    label:
      "Complete technical design/drawing of all equipment to be purchased/fabricated",
  },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseMoney(value: string): number {
  const n = parseFloat(String(value).replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function formatMoney(n: number): string {
  if (n <= 0) return "";
  return `Php ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function emptySignatures(): RtecSignatures {
  return {
    chairperson: "",
    member1: "",
    member2: "",
    member3: "",
    rpmo: "",
    regionalDirector: DOST_REGION_12_DIRECTOR_NAME,
    evaluationDate: new Date().toISOString().split("T")[0],
  };
}

function emptyComplianceItems(): RtecComplianceItem[] {
  return RTEC_COMPLIANCE_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    status: "" as RtecComplianceStatus,
  }));
}

function docUploaded(
  applicant: Applicant,
  id: string,
): boolean {
  const md = applicant.moduleData ?? {};
  const uploads = md.requirementUploads as { id: string; uploaded?: boolean }[] | undefined;
  if (uploads?.some((d) => d.id === id && d.uploaded)) return true;
  const legacy = md.documents as { id: string; uploaded?: boolean }[] | undefined;
  return legacy?.some((d) => d.id === id && d.uploaded) ?? false;
}

function suggestComplianceStatus(
  applicant: Applicant,
  itemId: string,
): RtecComplianceStatus {
  const md = applicant.moduleData ?? {};
  const pp = getProjectProposalStored(applicant);

  switch (itemId) {
    case "loi":
      return md.loiDocument ? "complied" : "";
    case "tna1":
      return (md.tna1 as { submitted?: boolean })?.submitted ? "complied" : "";
    case "tna2":
      return getPublishedTna2(applicant) ? "complied" : "";
    case "form001":
      return pp?.submitted || pp?.form?.projectTitle ? "complied" : "";
    case "permits":
      return docUploaded(applicant, "permits") ? "complied" : "";
    case "financial":
      return docUploaded(applicant, "financial") ||
        pp?.attachments?.some((a) => a.kind === "financialReports")
        ? "complied"
        : "";
    case "projected":
      return docUploaded(applicant, "projected") ? "complied" : "";
    case "official-receipt":
      return docUploaded(applicant, "official-receipt") ? "complied" : "";
    case "registration":
      return docUploaded(applicant, "registration") ? "complied" : "";
    case "articles":
      return docUploaded(applicant, "articles") ? "complied" : "na";
    case "affidavit":
      return docUploaded(applicant, "affidavit") ? "complied" : "";
    case "resolution":
      return docUploaded(applicant, "resolution") ? "complied" : "na";
    case "quotations":
      return docUploaded(applicant, "quotations") ? "complied" : "";
    case "drawings":
      return docUploaded(applicant, "drawings") ? "complied" : "";
    default:
      return "";
  }
}

function buildConstraintRows(
  pp: ProjectProposalForm,
  applicant?: Applicant | null,
): RtecConstraintRow[] {
  const tna2 = applicant ? getPublishedTna2(applicant) : null;
  const gaps = tna2?.technologyGaps ?? [];
  const interventions = tna2?.proposedInterventions ?? [];

  if (pp.interventionProblem || pp.interventionProposed) {
    return [
      {
        id: uid(),
        processProblem: pp.interventionProblem,
        proposedIntervention: pp.interventionProposed,
        equipmentSkills: pp.interventionEquipment,
        impact: pp.interventionImpact,
      },
    ];
  }

  if (gaps.length) {
    return gaps.map((gap, i) => ({
      id: uid(),
      processProblem: gap,
      proposedIntervention: interventions[i] ?? "",
      equipmentSkills: "",
      impact: "",
    }));
  }

  return [
    {
      id: uid(),
      processProblem: "",
      proposedIntervention: "",
      equipmentSkills: "",
      impact: "",
    },
  ];
}

function buildFabricatorRows(pp: ProjectProposalForm): RtecFabricatorRow[] {
  const rows = pp.fabricatorTable.filter((r) => r.some((c) => c.trim()));
  if (!rows.length) {
    return [{ id: uid(), name: "", address: "", contactNo: "" }];
  }
  return rows.map((r) => ({
    id: uid(),
    name: r[0] ?? "",
    address: r[1] ?? "",
    contactNo: r[2] ?? "",
  }));
}

function buildCostHeader(pp: ProjectProposalForm): {
  proponent: string;
  setup: string;
  total: string;
} {
  const setup = parseMoney(pp.amountRequested);
  const total = parseMoney(pp.projectCost);
  const proponent = total > setup ? total - setup : parseMoney(pp.projectCost);
  return {
    setup: pp.amountRequested || formatMoney(setup),
    proponent:
      total > setup
        ? formatMoney(proponent)
        : pp.projectCost || "",
    total: pp.projectCost || formatMoney(setup + proponent),
  };
}

function seedRecommendation(applicant: Applicant): string {
  const tna2 = getPublishedTna2(applicant);
  if (!tna2) {
    return "Upon evaluation of the submitted documents and site validation findings, the RTEC recommends proceeding subject to compliance with SETUP program requirements and PSTO monitoring.";
  }
  const findings = tna2.siteValidationFindings?.filter(Boolean).join(" ") ?? "";
  const interventions =
    tna2.proposedInterventions?.filter(Boolean).join(" ") ?? "";
  return `The Regional Technical Evaluation Committee reviewed the Technology Needs Assessment and project proposal for ${applicant.enterpriseName}. ${findings} ${interventions} The committee recommends approval of the proposed SETUP assistance subject to standard program conditions, counterpart funding, and refund schedule.`.trim();
}

export function emptyRtecReportForm(
  proposalSnapshot: ProjectProposalForm,
  attachments: ProjectProposalAttachment[] = [],
): RtecReportForm {
  const costs = buildCostHeader(proposalSnapshot);
  return {
    projectCostProponent: costs.proponent,
    projectCostSetup: costs.setup,
    projectCostLgia: "",
    projectCostTotal: costs.total,
    complianceItems: emptyComplianceItems(),
    recommendation: "",
    signatures: emptySignatures(),
    ratioNarrative: proposalSnapshot.financialAnalysis,
    proposalSnapshot,
    attachmentRefs: attachments,
    constraintRows: buildConstraintRows(proposalSnapshot),
    fabricatorRows: buildFabricatorRows(proposalSnapshot),
  };
}

export function hasProjectProposalPrerequisite(
  applicant: Applicant | null,
): boolean {
  if (!applicant) return false;
  const pp = getProjectProposalStored(applicant);
  if (pp?.submitted) return true;
  if (pp?.form?.projectTitle?.trim()) return true;
  const form = getProjectProposalForm(applicant);
  return !!form.projectTitle?.trim();
}

export function hasRequirementsApprovedPrerequisite(
  applicant: Applicant | null,
): boolean {
  if (!applicant) return false;
  return applicant.moduleData?.staffDecision === "approved";
}

export function hasRtecPrerequisites(applicant: Applicant | null): boolean {
  return (
    hasProjectProposalPrerequisite(applicant) &&
    hasRequirementsApprovedPrerequisite(applicant)
  );
}

export function buildRtecReportDraft(applicant: Applicant | null): RtecReportForm {
  if (!applicant) {
    return emptyRtecReportForm(
      getProjectProposalForm(null),
      [],
    );
  }

  const proposalSnapshot = getProjectProposalForm(applicant);
  const attachmentRefs = getProjectProposalAttachments(applicant);
  const costs = buildCostHeader(proposalSnapshot);

  const complianceItems = emptyComplianceItems().map((item) => ({
    ...item,
    status: suggestComplianceStatus(applicant, item.id),
  }));

  return {
    projectCostProponent: costs.proponent,
    projectCostSetup: costs.setup,
    projectCostLgia: "",
    projectCostTotal: costs.total,
    complianceItems,
    recommendation: seedRecommendation(applicant),
    signatures: emptySignatures(),
    ratioNarrative: proposalSnapshot.financialAnalysis,
    proposalSnapshot,
    attachmentRefs,
    constraintRows: buildConstraintRows(proposalSnapshot, applicant),
    fabricatorRows: buildFabricatorRows(proposalSnapshot),
  };
}

export function getRtecReportStored(
  applicant: Applicant | null,
): RtecReportStored | null {
  if (!applicant?.moduleData?.rtecReport) return null;
  return applicant.moduleData.rtecReport as RtecReportStored;
}

function withDefaultSignatures(form: RtecReportForm): RtecReportForm {
  if (form.signatures.regionalDirector?.trim()) return form;
  return {
    ...form,
    signatures: {
      ...form.signatures,
      regionalDirector: DOST_REGION_12_DIRECTOR_NAME,
    },
  };
}

export function getRtecReportForm(applicant: Applicant | null): RtecReportForm {
  const stored = getRtecReportStored(applicant);
  if (stored?.form) return withDefaultSignatures(stored.form);
  return withDefaultSignatures(buildRtecReportDraft(applicant));
}

export function syncRtecFromProjectProposal(
  existing: RtecReportForm,
  applicant: Applicant,
): RtecReportForm {
  const proposalSnapshot = getProjectProposalForm(applicant);
  const attachmentRefs = getProjectProposalAttachments(applicant);
  const costs = buildCostHeader(proposalSnapshot);

  return {
    ...existing,
    projectCostProponent: costs.proponent,
    projectCostSetup: costs.setup,
    projectCostTotal: costs.total,
    proposalSnapshot,
    attachmentRefs,
    constraintRows: existing.constraintRows.some((r) =>
      Object.values(r).some((v) => String(v).trim()),
    )
      ? existing.constraintRows
      : buildConstraintRows(proposalSnapshot, applicant),
    fabricatorRows: existing.fabricatorRows.some((r) =>
      [r.name, r.address, r.contactNo].some((v) => v.trim()),
    )
      ? existing.fabricatorRows
      : buildFabricatorRows(proposalSnapshot),
    ratioNarrative:
      existing.ratioNarrative || proposalSnapshot.financialAnalysis,
  };
}

export function saveRtecReportDraft(
  applicantId: string,
  form: RtecReportForm,
): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getRtecReportStored(applicant);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      rtecReport: {
        form,
        submitted: existing?.submitted ?? false,
        submittedAt: existing?.submittedAt,
        updatedAt: new Date().toISOString(),
      } satisfies RtecReportStored,
    },
  });
}

export function submitRtecReport(applicantId: string, form: RtecReportForm): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      rtecReport: {
        form,
        submitted: true,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies RtecReportStored,
    },
  });
}

export function validateRtecReportSubmit(form: RtecReportForm): string[] {
  if (isDemoModeActive()) return [];
  const errors: string[] = [];
  if (!form.proposalSnapshot.projectTitle?.trim()) {
    errors.push("Project Proposal data is required before completing RTEC.");
  }
  const pending = form.complianceItems.filter((c) => !c.status);
  if (pending.length) {
    errors.push(
      `Mark all ${pending.length} compliance requirement(s) as Complied, Not Complied, or N/A.`,
    );
  }
  if (!form.recommendation?.trim()) {
    errors.push("Section IV Recommendation is required.");
  }
  if (!form.signatures.chairperson?.trim()) {
    errors.push("RTEC Chairperson name is required.");
  }
  return errors;
}

export function printRtecReport(form: RtecReportForm, applicationId?: string) {
  printRtecReportPdf(form, applicationId);
}

export function downloadRtecReportPdf(form: RtecReportForm, applicationId?: string) {
  printRtecReportPdf(form, applicationId);
}

export { DOST_BLUE as RTEC_DOST_BLUE };
