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
  RtecReviewComment,
  RtecSignatures,
} from "../api/types";
import type { AdminView, AuthUser } from "../store/authStore";
import {
  getProjectProposalAttachments,
  getProjectProposalForm,
  getProjectProposalStored,
} from "./projectProposal";
import { getPublishedTna2 } from "./tnaForm02";
import { buildRequirementUploadList } from "./submissionRequirements";
import { DOST_REGION_12_DIRECTOR_NAME } from "../constants/region12";
import { isDemoModeActive } from "./demoMode";
import { printRtecReportPdf } from "./rtecReportPrint";
import { normalizeRtecReportStored } from "./normalizeCriticalModuleData";

const DOST_BLUE = "#0C2461";

/** Portal editor checklist (17 rows + N/A). Official PDF uses RTEC_OFFICIAL_COMPLIANCE_ITEMS only. */
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
      "Complete technical specifications, design/drawing/picture of equipment to be acquired, as determined in the TNA Report (DOST TNA Form 02)",
  },
  {
    id: "supplier-unavailability-affidavit",
    label:
      "Affidavit stating unavailability of suppliers for needed equipment (emergency or calamity situation)",
  },
  {
    id: "ecc",
    label:
      "ECC or Certificate of Non-Coverage (CNC) — if in environmentally critical area",
  },
  {
    id: "fda-certificate",
    label: "FDA License to Operate / Certificate (food sector enterprises)",
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

/** Per-equipment rows use ids like quotations-{slug} — comply when all required rows upload. */
function uploadsCompliedByPrefix(applicant: Applicant, complianceId: string): boolean {
  const list = buildRequirementUploadList(applicant).filter(
    (row) => row.complianceId === complianceId && row.required,
  );
  if (list.length === 0) return docUploaded(applicant, complianceId);
  return list.every((row) => row.uploaded);
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
      return uploadsCompliedByPrefix(applicant, "quotations") ? "complied" : "";
    case "drawings":
      return uploadsCompliedByPrefix(applicant, "drawings") ? "complied" : "";
    case "supplier-unavailability-affidavit":
      return docUploaded(applicant, "supplier-unavailability-affidavit")
        ? "complied"
        : "na";
    case "ecc":
      return docUploaded(applicant, "ecc") ? "complied" : "na";
    case "fda-certificate":
      return docUploaded(applicant, "fda-certificate") ? "complied" : "na";
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

function sumBudgetLgia(pp: ProjectProposalForm): number {
  return (pp.budgetItems ?? []).reduce(
    (sum, row) => sum + parseMoney(String(row.lgiaShare ?? "")),
    0,
  );
}

function buildCostHeader(pp: ProjectProposalForm): {
  proponent: string;
  setup: string;
  lgia: string;
  total: string;
} {
  const setup = parseMoney(pp.amountRequested);
  const lgia = sumBudgetLgia(pp);
  const total = parseMoney(pp.projectCost);
  const counterpart = total > setup + lgia ? total - setup - lgia : 0;
  return {
    setup: pp.amountRequested || formatMoney(setup),
    lgia: lgia > 0 ? formatMoney(lgia) : "",
    proponent:
      counterpart > 0
        ? formatMoney(counterpart)
        : total > setup
          ? formatMoney(total - setup)
          : pp.projectCost || "",
    total: pp.projectCost || formatMoney(setup + lgia + counterpart),
  };
}

/**
 * Map stored/editor compliance (17 rows) to the official Word 14-row table.
 * Uses Word labels; `na` status leaves both tick cells empty on print.
 */
export { toOfficialComplianceItems } from "../constants/rtecReportLayout";

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
    projectCostLgia: costs.lgia,
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

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

function joinNonBlank(parts: unknown[], sep = "\n\n"): string {
  return parts.map(trimText).filter(Boolean).join(sep);
}

/**
 * Fill blank Form 002 snapshot narratives from related Form 001 / TNA1 fields.
 * Never overwrites non-blank RTEC values. Does not write back to Form 001.
 */
export function enrichRtecSnapshotFromPriorModules(
  pp: ProjectProposalForm,
  applicant: Applicant | null,
): ProjectProposalForm {
  const tna1Form = (applicant?.moduleData?.tna1?.form ?? {}) as Record<
    string,
    unknown
  >;

  let wasteManagement = trimText(pp.wasteManagement);
  if (!wasteManagement) {
    wasteManagement = joinNonBlank([
      pp.wasteKinds,
      pp.wasteDisposalMethods,
      tna1Form.wasteManagement,
    ]);
  }

  let equipmentNarrative = trimText(pp.equipmentNarrative);
  if (!equipmentNarrative) {
    equipmentNarrative = (pp.equipmentTable ?? [])
      .filter((r) => r.some((c) => trimText(c)))
      .map((r) =>
        [r[0], r[1] ? `Qty: ${r[1]}` : "", r[2] ? `Spec: ${r[2]}` : ""]
          .filter(Boolean)
          .join(" — "),
      )
      .filter(Boolean)
      .join("\n");
  }

  let marketSituation = trimText(pp.marketSituation);
  if (!marketSituation) {
    const firm =
      trimText(pp.firmName) ||
      trimText(applicant?.enterpriseName) ||
      "The enterprise";
    const channel = trimText(pp.distributionChannel);
    if (channel) {
      marketSituation = `${firm} distributes primarily through ${channel}.`;
    }
  }

  let existingMarketingProblems = trimText(pp.existingMarketingProblems);
  if (!existingMarketingProblems) {
    const competitors = trimText(pp.competitors);
    if (competitors) {
      existingMarketingProblems = `Competitors: ${competitors}`;
    }
  }

  let skillsExpertise = trimText(pp.skillsExpertise);
  if (!skillsExpertise) {
    const lead =
      trimText(pp.contactPerson) ||
      trimText(pp.proponentName) ||
      trimText(applicant?.applicantName) ||
      "The proponent";
    const ent =
      trimText(pp.firmName) ||
      trimText(applicant?.enterpriseName) ||
      "the enterprise";
    skillsExpertise = `${lead} leads operations at ${ent}.`;
  }

  let compensation = trimText(pp.compensation);
  if (!compensation) {
    compensation = (pp.compensationTable ?? [])
      .map((r) => {
        const position = trimText(r[0]);
        const workers = trimText(r[1]);
        const rate = trimText(r[2]);
        if (!position && !workers && !rate) return "";
        return [
          position,
          workers ? `${workers} worker(s)` : "",
          rate ? `rate ${rate}` : "",
        ]
          .filter(Boolean)
          .join(" — ");
      })
      .filter(Boolean)
      .join("\n");
  }

  return {
    ...pp,
    wasteManagement: wasteManagement || pp.wasteManagement,
    equipmentNarrative: equipmentNarrative || pp.equipmentNarrative,
    marketSituation: marketSituation || pp.marketSituation,
    existingMarketingProblems:
      existingMarketingProblems || pp.existingMarketingProblems,
    skillsExpertise: skillsExpertise || pp.skillsExpertise,
    compensation: compensation || pp.compensation,
  };
}

export function buildRtecReportDraft(applicant: Applicant | null): RtecReportForm {
  if (!applicant) {
    return emptyRtecReportForm(
      enrichRtecSnapshotFromPriorModules(getProjectProposalForm(null), null),
      [],
    );
  }

  const proposalSnapshot = enrichRtecSnapshotFromPriorModules(
    getProjectProposalForm(applicant),
    applicant,
  );
  const attachmentRefs = getProjectProposalAttachments(applicant);
  const costs = buildCostHeader(proposalSnapshot);

  const complianceItems = emptyComplianceItems().map((item) => ({
    ...item,
    status: suggestComplianceStatus(applicant, item.id),
  }));

  return {
    projectCostProponent: costs.proponent,
    projectCostSetup: costs.setup,
    projectCostLgia: costs.lgia,
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
  const normalized = normalizeRtecReportStored(applicant.moduleData.rtecReport);
  return (normalized as RtecReportStored | undefined) ?? null;
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
  if (stored?.form) {
    const savedCompliance = Array.isArray(stored.form.complianceItems)
      ? stored.form.complianceItems
      : stored.form.complianceItems
        ? [stored.form.complianceItems]
        : [];
    const savedById = new Map(
      savedCompliance.map((item) => [item.id, item]),
    );
    // Keep staff-saved statuses; only fill newly added checklist rows.
    const complianceItems = emptyComplianceItems().map((item) => {
      const saved = savedById.get(item.id);
      if (saved?.status) return { ...item, status: saved.status };
      if (saved) return { ...item, status: saved.status ?? "" };
      return item;
    });
    return withDefaultSignatures({
      ...stored.form,
      complianceItems,
      constraintRows: Array.isArray(stored.form.constraintRows)
        ? stored.form.constraintRows
        : stored.form.constraintRows
          ? [stored.form.constraintRows]
          : [],
      fabricatorRows: Array.isArray(stored.form.fabricatorRows)
        ? stored.form.fabricatorRows
        : stored.form.fabricatorRows
          ? [stored.form.fabricatorRows]
          : [],
      attachmentRefs: Array.isArray(stored.form.attachmentRefs)
        ? stored.form.attachmentRefs
        : stored.form.attachmentRefs
          ? [stored.form.attachmentRefs]
          : [],
    });
  }
  return withDefaultSignatures(buildRtecReportDraft(applicant));
}

export function syncRtecFromProjectProposal(
  existing: RtecReportForm,
  applicant: Applicant,
): RtecReportForm {
  const upstream = getProjectProposalForm(applicant);
  const attachmentRefs = getProjectProposalAttachments(applicant);
  const costs = buildCostHeader(upstream);
  const pick = (local: string, upstreamValue: string) =>
    local.trim() ? local : upstreamValue;
  const pickList = (local: string[], upstreamList: string[]) =>
    local.some((s) => String(s).trim()) ? local : upstreamList;

  const localPp = existing.proposalSnapshot;
  const proposalSnapshot = enrichRtecSnapshotFromPriorModules(
    {
      ...upstream,
      projectTitle: pick(localPp.projectTitle, upstream.projectTitle),
      proponentName: pick(localPp.proponentName, upstream.proponentName),
      contactPerson: pick(localPp.contactPerson, upstream.contactPerson),
      firmName: pick(localPp.firmName, upstream.firmName),
      firmAddress: pick(localPp.firmAddress, upstream.firmAddress),
      contactNumber: pick(localPp.contactNumber, upstream.contactNumber),
      generalObjective: pick(localPp.generalObjective, upstream.generalObjective),
      specificObjectives: pickList(
        localPp.specificObjectives ?? [],
        upstream.specificObjectives ?? [],
      ),
      expectedOutputBullets: pickList(
        localPp.expectedOutputBullets ?? [],
        upstream.expectedOutputBullets ?? [],
      ),
      skillsExpertise: pick(localPp.skillsExpertise, upstream.skillsExpertise),
      compensation: pick(localPp.compensation, upstream.compensation),
      productionProcess: pick(
        localPp.productionProcess,
        upstream.productionProcess,
      ),
      materialBalance: pick(localPp.materialBalance, upstream.materialBalance),
      equipmentNarrative: pick(
        localPp.equipmentNarrative,
        upstream.equipmentNarrative,
      ),
      interventionCostTable: (localPp.interventionCostTable ?? []).some((r) =>
        r.some((c) => String(c).trim()),
      )
        ? localPp.interventionCostTable
        : upstream.interventionCostTable,
      marketSituation: pick(localPp.marketSituation, upstream.marketSituation),
      productDemandSupply: pick(
        localPp.productDemandSupply,
        upstream.productDemandSupply,
      ),
      existingMarketingProblems: pick(
        localPp.existingMarketingProblems,
        upstream.existingMarketingProblems,
      ),
      marketStrategies: pickList(
        localPp.marketStrategies ?? [],
        upstream.marketStrategies ?? [],
      ),
      wasteManagement: pick(localPp.wasteManagement, upstream.wasteManagement),
      riskRows: (localPp.riskRows ?? []).some((r) =>
        [r.objective, r.risk, r.assumption, r.plan].some((v) =>
          String(v).trim(),
        ),
      )
        ? localPp.riskRows
        : upstream.riskRows,
    },
    applicant,
  );

  const constraintRows = Array.isArray(existing.constraintRows)
    ? existing.constraintRows
    : existing.constraintRows
      ? [existing.constraintRows]
      : [];
  const fabricatorRows = Array.isArray(existing.fabricatorRows)
    ? existing.fabricatorRows
    : existing.fabricatorRows
      ? [existing.fabricatorRows]
      : [];
  return {
    ...existing,
    projectCostProponent: pick(existing.projectCostProponent, costs.proponent),
    projectCostSetup: pick(existing.projectCostSetup, costs.setup),
    projectCostLgia: pick(existing.projectCostLgia, costs.lgia),
    projectCostTotal: pick(existing.projectCostTotal, costs.total),
    proposalSnapshot,
    attachmentRefs,
    constraintRows: constraintRows.some((r) =>
      Object.values(r).some((v) => String(v).trim()),
    )
      ? constraintRows
      : buildConstraintRows(proposalSnapshot, applicant),
    fabricatorRows: fabricatorRows.some((r) =>
      [r.name, r.address, r.contactNo].some((v) => v.trim()),
    )
      ? fabricatorRows
      : buildFabricatorRows(proposalSnapshot),
    ratioNarrative: pick(
      existing.ratioNarrative,
      proposalSnapshot.financialAnalysis,
    ),
  };
}

export function saveRtecReportDraft(
  applicantId: string,
  form: RtecReportForm,
  reviewComments?: RtecReviewComment[],
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
        reviewComments:
          reviewComments ?? existing?.reviewComments ?? [],
      } satisfies RtecReportStored,
    },
  });
}

export function submitRtecReport(applicantId: string, form: RtecReportForm): void {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return;
  const existing = getRtecReportStored(applicant);
  applicantStore.update(applicantId, {
    moduleData: {
      ...applicant.moduleData,
      rtecReport: {
        form,
        submitted: true,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviewComments: existing?.reviewComments ?? [],
      } satisfies RtecReportStored,
    },
  });
}

export const RTEC_REVIEW_SOURCE_LABELS: Partial<Record<AdminView, string>> = {
  tna1: "TNA Form 01",
  tna2: "TNA Form 02",
  "project-proposal": "Project Proposal (Form 001)",
  requirements: "Documentary Requirements",
  "client-files": "Cooperator Files",
};

export function formatRtecReviewCommentBlock(
  comment: RtecReviewComment,
): string {
  const when = new Date(comment.at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `[${comment.sourceLabel} — ${comment.authorName}, ${when}] ${comment.text.trim()}`;
}

export function getRtecReviewComments(
  applicant: Applicant | null,
): RtecReviewComment[] {
  const stored = getRtecReportStored(applicant);
  return Array.isArray(stored?.reviewComments) ? stored!.reviewComments! : [];
}

/**
 * Persist a structured review note and append a labeled block to Section IV
 * without wiping the existing recommendation narrative.
 */
export function appendRtecReviewComment(
  applicantId: string,
  user: AuthUser,
  sourceView: AdminView,
  text: string,
): RtecReviewComment | null {
  const applicant = applicantStore.getById(applicantId);
  if (!applicant) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const sourceLabel =
    RTEC_REVIEW_SOURCE_LABELS[sourceView] ?? String(sourceView);
  const authorName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const comment: RtecReviewComment = {
    id: `rtec-cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceView,
    sourceLabel,
    text: trimmed,
    authorEmail: user.email,
    authorName,
    at: new Date().toISOString(),
  };

  const form = getRtecReportForm(applicant);
  const existingComments = getRtecReviewComments(applicant);
  const block = formatRtecReviewCommentBlock(comment);
  const recommendation = form.recommendation?.trim()
    ? `${form.recommendation.trim()}\n\n${block}`
    : block;

  saveRtecReportDraft(
    applicantId,
    { ...form, recommendation },
    [...existingComments, comment],
  );
  return comment;
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

export function printRtecReport(
  form: RtecReportForm,
  applicationId?: string,
  applicantId?: string,
) {
  void printRtecReportPdf(form, applicationId, applicantId);
}

export function downloadRtecReportPdf(
  form: RtecReportForm,
  applicationId?: string,
  applicantId?: string,
) {
  void printRtecReportPdf(form, applicationId, applicantId);
}

export { DOST_BLUE as RTEC_DOST_BLUE };
