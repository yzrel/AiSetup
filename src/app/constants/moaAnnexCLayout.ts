/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official Proforma MOA (Annex C) layout constants.
 * Source: Proforma MOA - Annex C.docx — SETUP Guidelines (Revision 3.0).
 * Word is the only layout source for the MOA body through Acknowledgment.
 */

/**
 * A4 portrait. Printable inset is 1 in (25.4 mm) all sides — same as Form 001 /
 * Form 005 / Form 006. Word pgMar on Proforma MOA - Annex C.docx is only ~3–5 mm
 * on the sides; paragraph `w:ind` is not added on top (that doubled the border).
 */
export const MOA_PAGE_MARGIN_IN = 1;
export const MOA_PAGE_MARGIN_MM = 25.4;

/** Word pgMar (twips) — Proforma MOA - Annex C.docx main body section. */
export const MOA_WORD_PG_MAR = {
  top: 1060,
  right: 280,
  bottom: 740,
  left: 200,
  footer: 545,
} as const;

/** CSS inset (mm) for on-screen A4 preview. Print uses the same via @page. */
export const MOA_PAGE_PADDING = {
  top: MOA_PAGE_MARGIN_MM,
  right: MOA_PAGE_MARGIN_MM,
  bottom: MOA_PAGE_MARGIN_MM,
  left: MOA_PAGE_MARGIN_MM,
} as const;

export const MOA_TITLE = "MEMORANDUM OF AGREEMENT";

export const MOA_FOOTER_PREFIX =
  "SETUP Guidelines (Revision 3.0) Annex C: Proforma MOA";

export const MOA_KNOW_ALL = "KNOW ALL MEN BY THESE PRESENTS:";

export const MOA_INTRO =
  "This MEMORANDUM OF AGREEMENT (MOA) entered into and executed by and between:";

export const MOA_WITNESSETH = "WITNESSETH: THAT";

export const MOA_WHEREAS_SETUP =
  "WHEREAS, the Department of Science and Technology (DOST) has identified the Small Enterprise Technology Upgrading Program (SETUP) as one of the strategic programs under the National Science and Technology (S&T) Plan and has provided funds therefore;";

export const MOA_INTERVENTIONS_HEAD =
  "WHEREAS, FIRST PARTY has identified the following S&T interventions needed by SECOND PARTY, which shall be undertaken through this project:";

export const MOA_INTERVENTION_SYSTEM =
  "System Improvement — Improvement of operational processes using the equipment acquired through SETUP and crafting of the vision and mission statements, among others;";

export const MOA_INTERVENTION_PROCESS =
  "Process Improvement — Improvement of overall production operations through standardization of operating procedures and application of relevant productivity tools;";

export const MOA_INTERVENTION_HRD =
  "Human Resource Development — Productivity improvement of workers through provision of trainings on the operation and maintenance of the new equipment;";

export const MOA_WHEREAS_QUALIFICATIONS =
  "WHEREAS, FIRST PARTY possesses the technical qualifications, commitment and sense of responsibility deemed necessary to assist and monitor the implementation of the aforesaid project;";

export const MOA_WHEREAS_COOPERATION =
  "WHEREAS, FIRST PARTY and SECOND PARTY pledge to extend their full cooperation for the effective and efficient implementation of the aforesaid project;";

export const MOA_NOW_THEREFORE =
  "NOW, THEREFORE, for and in consideration of the above premises, and of the mutual covenants and stipulations hereinafter set forth, the parties hereto agree to enter into this Memorandum of Agreement under the following terms and conditions:";

export const MOA_FIRST_PARTY_SHALL = "FIRST PARTY shall:";

export const MOA_FIRST_PARTY_OBLIGATIONS: readonly string[] = [
  "Release funds amounting to {amountWords} ({amountFigures}) to SECOND PARTY to facilitate the acquisition/fabrication of all the equipment/materials indicated in the Line-Item budget (made part hereof as Annex B). The mode of fund release shall be through electronic bank transfer from FIRST PARTY to SECOND PARTY's current/checking account with Landbank of the Philippines (LBP), opened exclusively for the project's fund-related transactions;",
  "Monitor and ensure that the implementation of the above project is in accordance with the Schedule of Activities (made part hereof as Annex C);",
  "Monitor, evaluate, and document project activities and identify alternative courses of action to address problems met, if any, during the implementation of the project;",
  'Facilitate the collection of the monthly refunds of SECOND PARTY in accordance with the Approved Schedule of Refunds (made part hereof as Annex D) and remit the same to the Bureau of Treasury;',
  'Facilitate the pullout of all tools and equipment in good working condition procured out of project funds and collect the final obligation to be computed in accordance with the computation presented in Annex B: "Computation of Final Obligation of Terminated SETUP Projects" of the SETUP Guidelines, in the event that SECOND PARTY fails to remit refunds for six (6) consecutive months or for any violation of the Memorandum of Agreement entered into by the FIRST PARTY and SECOND PARTY;',
  "Place inventory tag stickers on the individual equipment acquired out of project funds;",
  "Recover in behalf of DOST the full assistance if due to premature unjustified project termination or when funds are not used according to the approved purposes, or for any violation of this MOA;",
  'In case of failure or termination of the project due to force majeure or fortuitous event, FIRST PARTY shall submit to the Regional Commission on Audit (COA) a written request for "Relief from Accountability" or a request for write-off and/or condonation, whichever is appropriate, consistent with the provisions of the Government Auditing Code of the Philippines (PD 1445) and Section 41, Chapter 10, Volume 1 of the Government Accounting Manual (GAM); and',
  "Ensure confidentiality of SECOND PARTY's information related to its product formulation, operational processes and parameters, and financial performance.",
];

export const MOA_SECOND_PARTY_SHALL = "SECOND PARTY shall:";

export const MOA_SECOND_PARTY_OBLIGATIONS: readonly string[] = [
  "Open and maintain a separate current/checking account with the nearest Landbank of the Philippines (LBP) in their area to be used solely for the project;",
  "Request LBP to tag the account restricting withdrawal without the written authorization from FIRST PARTY authorizing such withdrawal;",
  "Allow FIRST PARTY to restrict withdrawal of funds from the current/checking account used solely for the project;",
  "Receive funds from FIRST PARTY and issue an acknowledgement receipt/official receipt of funds received;",
  "Seek written authorization from FIRST PARTY prior to withdrawal from said account or electronically transferring the payment to the suppliers/fabricator's bank account;",
  "Ensure that funds received from FIRST PARTY in the amount of {amountWords} ({amountFigures}) are expended in accordance with the intended purpose and as indicated in the approved Line-Item Budget;",
  "Liquidate the funds received and submit an Audited Financial Report (following the format in Annex E) to FIRST PARTY not later than one (1) month after the equipment commissioning/installation;",
  "Issue a total of {pdcCount} post-dated checks (PDCs) in the name of FIRST PARTY representing the whole amount of refunds in accordance to the refund schedule, prior to receipt of funding assistance;",
  "Not use the funds for money market placement, time deposits and other form of investments, and purposes/items other than those stipulated in the approved project proposal;",
  "Coordinate and collaborate with FIRST PARTY in the acquisition/fabrication of all the equipment/materials indicated in Annex B;",
  "Implement the project in accordance with the approved Schedule of Activities and the identified and approved technological intervention(s);",
  "Provide the appropriate site and building to house the S&T intervention-related equipment/other facilities;",
  "Provide operating funds and equipment needed in its operations and in the implementation of the project other than those indicated in the approved Line-Item Budget, as SECOND PARTY's counterpart;",
  "Coordinate and collaborate with FIRST PARTY all activities to be undertaken in relation to project implementation;",
  "Allow FIRST PARTY and DOST agency representatives access to its premises and facilities to monitor and collect necessary data/information during the implementation of the project;",
  "Notify FIRST PARTY of any deviation in the activities and plans during the implementation of the project;",
  "Be responsible for the day-to-day operation of the project;",
  "Submit to FIRST PARTY the following properly filled-up Project Information Sheet (PIS) to monitor progress of the project:",
  "Acknowledge DOST-SETUP's and FIRST PARTY's assistance in all reports, products, papers, and materials produced out of project activities;",
  'In case of failure to remit refunds for six (6) consecutive months, violation of any of the provisions of this Memorandum of Agreement, or termination of project, authorize/allow FIRST PARTY to pull out all tools and equipment in good working condition procured out of the project funds and settle the final obligation, if any, to be computed in accordance with Annex B of the SETUP Guidelines: "Computation of Final Obligation of Terminated SETUP Projects";',
  "Should pullout of tools and/or equipment be impossible/impractical, allow the use of the facility acquired out of the project funds by other cooperators identified by FIRST PARTY;",
  'In case of failure or termination of the project due to force majeure or fortuitous event, provide FIRST PARTY with all the necessary document/information needed to support the request for "Relief from Accountability", write-off and/or condonation, whichever is appropriate, and settle final obligation, if any, based on the COA\'s recommendation;',
  "Assist FIRST PARTY and the {pstoOffice} in placing inventory tag stickers on each equipment acquired out of the project funds;",
  "Be responsible and accountable for the maintenance and safekeeping of all the equipment acquired out of project funds. Ownership of the equipment shall remain with FIRST PARTY until after full ownership has been transferred to SECOND PARTY upon refund completion; and",
  "Put-up a sign board designed by FIRST PARTY and paid for by SECOND PARTY, measuring 4ft X 4ft, at the project site not later than two (2) weeks after receipt of the project funds, containing the following details:",
];

export const MOA_PIS_PRE =
  "Pre-Implementation PIS — immediately upon receipt of the confirmation of project approval, prior to the release of funds/equipment for the project; and";

export const MOA_PIS_ONGOING =
  "PIS for On-going project — PIS and Status Report to be submitted every end of semester of each year from the start of project implementation up to the year following full refund of the total funding assistance;";

export const MOA_DEMAND_LETTER =
  "FIRST PARTY shall issue demand letter/s to SECOND PARTY in case of default in payment by SECOND PARTY;";

export const MOA_REFUND_TITLE = "REFUND";

export const MOA_REFUND_CLAUSE =
  "Refund for the cost of equipment/funding assistance shall be for {refundTerm} years or earlier, to commence twelve (12) months after start of the project duration as indicated in Annex D. Inability to start refund within six (6) months after start of the approved refund schedule authorizes FIRST PARTY to demand full refund of the funding assistance.";

export const MOA_PUBLICATION_TITLE = "PUBLICATION";
export const MOA_PUBLICATION_BODY =
  "Any publication and other related activities undertaken arising from this Agreement shall identify DOST-SETUP's assistance.";

export const MOA_AMENDMENTS_TITLE = "AMENDMENTS";
export const MOA_AMENDMENTS_BODY =
  "This Agreement may only be amended in writing and by mutual consent of both parties.";

export const MOA_EFFECTIVITY_TITLE = "EFFECTIVITY";
export const MOA_EFFECTIVITY_BODY =
  "This Memorandum of Agreement shall take effect immediately upon signing of the parties hereto and shall remain in force for the duration of the project unless sooner terminated by FIRST PARTY.";

export const MOA_VENUE_TITLE = "VENUE OF ACTION";

export const MOA_ACKNOWLEDGMENT_TITLE = "ACKNOWLEDGMENT";

export const MOA_ANNEX_A_NOTE =
  "(Please refer to Annex A-1 of the SETUP Guidelines (Revision 3.0) for the SETUP Form 001 — Project Proposal Format)";

export const MOA_ANNEX_LABELS = {
  A: "ANNEX A",
  B: "ANNEX B — LINE-ITEM BUDGET (made part hereof)",
  C: "ANNEX C — SCHEDULE OF ACTIVITIES (made part hereof)",
  D: "ANNEX D — SCHEDULE OF REFUND (made part hereof)",
  E: "ANNEX E — SETUP Form 004 — Audited Financial Report (made part hereof)",
} as const;

export function displayValue(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function underlineOr(value: unknown, minWidth = 12): string {
  const v = displayValue(value);
  if (v) return v;
  return "_".repeat(minWidth);
}

/** Word multilevel label: section.sub (e.g. 1.1, 2.18). */
export function moaSubLabel(section: number, index: number): string {
  return `${section}.${index + 1}`;
}

/** Word multilevel label: section.parent.sub (e.g. 2.18.1). */
export function moaSubSubLabel(
  section: number,
  parentIndex: number,
  index: number,
): string {
  return `${section}.${parentIndex + 1}.${index + 1}`;
}

/** Word section heading label (e.g. 3.). */
export function moaSectionLabel(section: number): string {
  return `${section}.`;
}

export function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "______");
}
