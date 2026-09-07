/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 — Step 7: Staff Review (section verification + remarks).
 * Flag opens a comment box (draft only). Request Resubmission sends in-app + email.
 */

import { MODULE_BODY, ACTION_ROW } from "../moduleTheme";
import { TnaForm01Preview, printTnaForm01 } from "../TnaForm01Preview";
import { allowWhenDemo } from "../../utils/demoMode";
import type { Tna1StepContext } from "./stepContext";
import {
  DOST_BLUE,
  InfoBanner,
  inputCls,
  labelCls,
  ReadonlyField,
  sectionTitle,
} from "./tna1Ui";

export function StaffReviewStep({ ctx }: { ctx: Tna1StepContext }) {
  const {
    applicant,
    staffMode,
    setStaffMode,
    form,
    sections,
    allSectionsReviewed,
    staffNotes,
    setStaffNotes,
    siteVisitDate,
    setSiteVisitDate,
    siteVisitNotes,
    setSiteVisitNotes,
    persistStaffReview,
    persistSectionReview,
    resubmissionError,
    tnaAiGenerated,
    previewForm,
    previewTables,
    setStep,
  } = ctx;

  return (
    <div className={MODULE_BODY}>
      {!staffMode ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">🔒</div>
          <h3 className="text-lg font-bold text-gray-700">Staff Mode Required</h3>
          <p className="text-sm text-gray-400">This section is restricted to authorized DOST Provincial Staff only.</p>
          <button onClick={() => setStaffMode(true)}
            className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
            style={{ background: DOST_BLUE }}>
            🔓 Enable Staff Mode
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 p-4 rounded-xl text-white" style={{ background: DOST_BLUE }}>
            <div className="w-9 h-9 rounded-full bg-sky-400 flex items-center justify-center font-bold text-blue-900 text-sm">PS</div>
            <div>
              <p className="font-bold text-sm">Provincial Staff Review Mode</p>
              <p className="text-xs text-white/60">Staff ID: PSTD-R12-001 · DOST SOCCSKSARGEN · {new Date().toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sky-300">🔒 Secure Mode</span>
            </div>
          </div>

          <div className="border border-blue-100 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-blue-50 border-b border-blue-100">
              <div>
                <p className="text-sm font-bold text-blue-900">Submitted Form 01</p>
                <p className="text-xs text-blue-700">
                  Full printable TNA Form 01 as submitted by the applicant.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep("complete")}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-800 bg-white hover:bg-blue-50"
                >
                  Open Form Preview
                </button>
                <button
                  type="button"
                  onClick={() =>
                    printTnaForm01({
                      form: previewForm,
                      tables: previewTables,
                      applicantId: applicant?.id,
                      applicationId: applicant?.applicationId,
                    })
                  }
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: DOST_BLUE }}
                >
                  Print / Save as PDF
                </button>
              </div>
            </div>
            <div className="max-h-[28rem] overflow-y-auto overflow-x-auto p-3 bg-white min-w-0">
              <TnaForm01Preview
                applicant={applicant}
                form={previewForm}
                tables={previewTables}
                aiGenerated={tnaAiGenerated ?? undefined}
                compact
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Verified",  value: sections.filter(s => s.verified).length, icon: "✅", color: "text-green-600" },
              { label: "Flagged",   value: sections.filter(s => s.flagged).length,  icon: "⚠️", color: "text-red-500" },
              { label: "Pending",   value: sections.filter(s => !s.verified && !s.flagged).length, icon: "⏳", color: "text-amber-500" },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="text-xl">{s.icon}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>

          <div>
            <h2 className={sectionTitle}>📋 Section Verification Checklist</h2>
            <p className="text-xs text-gray-500 mb-2">
              Verify or flag each form section. Flag opens a comment box (saved as draft). The applicant is notified and emailed only when you click Request Resubmission.
            </p>
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className={`p-3.5 rounded-xl border transition-all ${
                  section.flagged  ? "bg-red-50 border-red-200"
                  : section.verified ? "bg-green-50 border-green-200"
                                 : "bg-blue-50 border-blue-100"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg">{section.flagged ? "⚠️" : section.verified ? "✅" : "⭕"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{section.name}{section.required && " *"}</p>
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
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          section.verified
                            ? "bg-green-600 text-white"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
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
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          section.flagged
                            ? "bg-red-500 text-white"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
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
            <h2 className={sectionTitle}>🏭 Encoded Enterprise Data</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["Enterprise Name",    form.enterpriseName],
                ["Contact Person",     form.contactPerson],
                ["Office Address",     form.officeAddress],
                ["Sector",             form.sector],
                ["Commodity",          form.commodity],
                ["Employment Class",   form.employmentClass],
                ["Present Capital",    `PHP ${form.presentCapital}`],
                ["Year Established",   form.yearEstablished],
              ].map(([k, v], i) => <ReadonlyField key={i} label={k} value={v} />)}
            </div>
          </div>

          <div>
            <label className={labelCls}>📅 TNA Site Visit Date</label>
            <input
              type="date"
              value={siteVisitDate}
              onChange={(e) => setSiteVisitDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>📝 Staff Remarks / Site Visit Notes</label>
            <textarea rows={3} value={staffNotes} onChange={e => setStaffNotes(e.target.value)}
              className={inputCls} placeholder="Enter site visit observations, verification notes, or concerns…" />
            <textarea rows={2} value={siteVisitNotes} onChange={e => setSiteVisitNotes(e.target.value)}
              className={`${inputCls} mt-2`} placeholder="Optional: field validation summary for TNA Form 02…" />
          </div>

          {!allSectionsReviewed && (
            <InfoBanner icon="⚠️" color="amber"
              text="All sections must be verified or flagged before approval." />
          )}
          {resubmissionError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {resubmissionError}
            </p>
          )}

          <div className={`${ACTION_ROW} flex-col sm:flex-row`}>
            <button onClick={() => persistStaffReview("approved")}
              disabled={!allowWhenDemo(allSectionsReviewed)}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: "#059669" }}>
              ✅ Approve & Complete TNA Form 01 →
            </button>
            <button onClick={() => persistStaffReview("needs-revision")}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-amber-300 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-all">
              🔄 Request Resubmission
            </button>
          </div>
        </>
      )}
    </div>
  );
}
