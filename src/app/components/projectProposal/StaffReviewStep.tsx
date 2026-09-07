/**
 * Author: Yzrel Jade B. Eborde
 *
 * Project Proposal — Staff Review (section verification + remarks).
 * Flag opens a comment box (draft only). Request Resubmission sends in-app + email.
 */

import type { Applicant } from "../../store/applicantStore";
import type {
  ProjectProposalAttachment,
  ProjectProposalDocumentResponse,
  ProjectProposalForm,
} from "../../api/types";
import { allowWhenDemo } from "../../utils/demoMode";
import { ACTION_ROW } from "../moduleTheme";
import { ProjectProposalPreview, printProjectProposal } from "../ProjectProposalPreview";

const DOST_BLUE = "#0C2461";

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";
const sectionTitle =
  "text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2";

export interface PpSection {
  id: string;
  name: string;
  required: boolean;
  verified: boolean;
  flagged: boolean;
  remark: string;
}

export interface PpStaffReviewStepProps {
  applicant: Applicant | null;
  staffMode: boolean;
  setStaffMode: (value: boolean) => void;
  form: ProjectProposalForm;
  document: ProjectProposalDocumentResponse | null;
  attachments: ProjectProposalAttachment[];
  sections: PpSection[];
  allSectionsReviewed: boolean;
  staffNotes: string;
  setStaffNotes: (value: string) => void;
  persistStaffReview: (decision: "approved" | "needs-revision") => void;
  persistSectionReview: (nextSections: PpSection[]) => void;
  resubmissionError?: string;
  onOpenPreview: () => void;
  submitted?: boolean;
}

export function StaffReviewStep({
  applicant,
  staffMode,
  setStaffMode,
  form,
  document,
  attachments,
  sections,
  allSectionsReviewed,
  staffNotes,
  setStaffNotes,
  persistStaffReview,
  persistSectionReview,
  resubmissionError,
  onOpenPreview,
  submitted,
}: PpStaffReviewStepProps) {
  return (
    <div className="space-y-5">
      {!staffMode ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">🔒</div>
          <h3 className="text-lg font-bold text-gray-700">Staff Mode Required</h3>
          <p className="text-sm text-gray-400">
            This section is restricted to authorized DOST Provincial Staff only.
          </p>
          <button
            type="button"
            onClick={() => setStaffMode(true)}
            className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
            style={{ background: DOST_BLUE }}
          >
            🔓 Enable Staff Mode
          </button>
        </div>
      ) : (
        <>
          <div
            className="flex items-center gap-3 p-4 rounded-xl text-white"
            style={{ background: DOST_BLUE }}
          >
            <div className="w-9 h-9 rounded-full bg-sky-400 flex items-center justify-center font-bold text-blue-900 text-sm">
              PS
            </div>
            <div>
              <p className="font-bold text-sm">Provincial Staff Review Mode</p>
              <p className="text-xs text-white/60">
                DOST SOCCSKSARGEN ·{" "}
                {new Date().toLocaleDateString("en-PH", { dateStyle: "medium" })}
              </p>
            </div>
            <div className="ml-auto">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sky-300">
                🔒 Secure Mode
              </span>
            </div>
          </div>

          <div className="border border-blue-100 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-blue-50 border-b border-blue-100">
              <div>
                <p className="text-sm font-bold text-blue-900">Submitted Form 001</p>
                <p className="text-xs text-blue-700">
                  Full printable Project Proposal as submitted by the applicant.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenPreview}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-800 bg-white hover:bg-blue-50"
                >
                  Open Form Preview
                </button>
                <button
                  type="button"
                  onClick={() =>
                    printProjectProposal(
                      form,
                      document,
                      attachments,
                      applicant?.applicationId,
                      applicant?.id,
                    )
                  }
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: DOST_BLUE }}
                >
                  Print / Save as PDF
                </button>
              </div>
            </div>
            <div className="max-h-[28rem] overflow-y-auto overflow-x-auto p-3 bg-white min-w-0">
              <ProjectProposalPreview
                form={form}
                document={document}
                attachments={attachments}
                applicationId={applicant?.applicationId}
                applicantId={applicant?.id}
                aiGenerated={document?.aiGenerated}
                submitted={submitted}
                onPrint={() =>
                  printProjectProposal(
                    form,
                    document,
                    attachments,
                    applicant?.applicationId,
                    applicant?.id,
                  )
                }
                compact
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Verified",
                value: sections.filter((s) => s.verified).length,
                icon: "✅",
                color: "text-green-600",
              },
              {
                label: "Flagged",
                value: sections.filter((s) => s.flagged).length,
                icon: "⚠️",
                color: "text-red-500",
              },
              {
                label: "Pending",
                value: sections.filter((s) => !s.verified && !s.flagged).length,
                icon: "⏳",
                color: "text-amber-500",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="text-center p-4 bg-gray-50 border border-gray-100 rounded-xl"
              >
                <div className="text-xl">{s.icon}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>

          <div>
            <h2 className={sectionTitle}>📋 Section Verification Checklist</h2>
            <p className="text-xs text-gray-500 mb-2">
              Verify or flag each form section. Flag opens a comment box (saved as
              draft). The applicant is notified and emailed only when you click
              Request Resubmission.
            </p>
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    section.flagged
                      ? "bg-red-50 border-red-200"
                      : section.verified
                        ? "bg-green-50 border-green-200"
                        : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg">
                        {section.flagged ? "⚠️" : section.verified ? "✅" : "⭕"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {section.name}
                          {section.required && " *"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          persistSectionReview(
                            sections.map((x) =>
                              x.id === section.id
                                ? { ...x, verified: true, flagged: false, remark: "" }
                                : x,
                            ),
                          )
                        }
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        ✓ Verify
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          persistSectionReview(
                            sections.map((x) =>
                              x.id === section.id
                                ? { ...x, flagged: true, verified: false }
                                : x,
                            ),
                          )
                        }
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        ⚑ Flag
                      </button>
                    </div>
                  </div>
                  {section.flagged && (
                    <div className="mt-3">
                      <label className="text-[11px] font-semibold text-red-700 block mb-1">
                        Comment for applicant (required before Request Resubmission)
                      </label>
                      <textarea
                        rows={3}
                        className={`${inputCls} text-xs`}
                        placeholder="Explain what must be corrected in this section…"
                        value={section.remark}
                        onChange={(e) => {
                          const remark = e.target.value;
                          persistSectionReview(
                            sections.map((x) =>
                              x.id === section.id
                                ? { ...x, remark, flagged: true, verified: false }
                                : x,
                            ),
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>📝 Staff Remarks</label>
            <textarea
              rows={3}
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              className={inputCls}
              placeholder="Enter verification notes or concerns…"
            />
          </div>

          {!allSectionsReviewed && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <span>⚠️</span>
              <p>All sections must be verified or flagged before approval.</p>
            </div>
          )}
          {resubmissionError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {resubmissionError}
            </p>
          )}

          <div className={`${ACTION_ROW} flex-col sm:flex-row`}>
            <button
              type="button"
              onClick={() => persistStaffReview("approved")}
              disabled={!allowWhenDemo(allSectionsReviewed)}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: "#059669" }}
            >
              ✅ Approve & Complete Project Proposal →
            </button>
            <button
              type="button"
              onClick={() => persistStaffReview("needs-revision")}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-amber-300 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-all"
            >
              🔄 Request Resubmission
            </button>
          </div>
        </>
      )}
    </div>
  );
}
