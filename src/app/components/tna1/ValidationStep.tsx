/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 — Step 6: Validation and AI-assisted completion / submission.
 */

import { MODULE_BODY } from "../moduleTheme";
import { allowWhenDemo, isDemoModeActive } from "../../utils/demoMode";
import { notifyTna1Submitted } from "../../utils/notificationHelpers";
import type { Tna1StepContext } from "./stepContext";
import { AILoader, DOST_BLUE, InfoBanner, sectionTitle, ValidationRow } from "./tna1Ui";

export function ValidationStep({ ctx }: { ctx: Tna1StepContext }) {
  const {
    applicant,
    isStaff,
    staffMode,
    validationChecks,
    allValid,
    tnaAiGenerated,
    tnaGenerateError,
    tnaGenerating,
    handleGenerateTna1,
    applicantSubmitted,
    setApplicantSubmitted,
    saveTnaDraft,
    setStep,
    goToStep,
  } = ctx;

  return (
    <div className={MODULE_BODY}>
      <InfoBanner icon="✅" color="blue" title="Data Validation Check"
        text="All required fields must be complete before submitting for staff review. Fields marked MISSING must be corrected." />

      <div>
        <h2 className={sectionTitle}>
          ✅ Validation Results &nbsp;
          <span className="text-xs font-normal text-gray-400">
            ({validationChecks.filter(c => c.passed).length}/{validationChecks.length} complete)
          </span>
        </h2>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          {validationChecks.map(check => <ValidationRow key={check.label} {...check} />)}
        </div>
      </div>

      {isDemoModeActive() && !allValid && (
        <div className="rounded-xl p-4 border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          Demo mode: you can submit with incomplete fields. Missing items above
          still show what production mode would require.
        </div>
      )}

      <div className={`rounded-xl p-4 border-2 ${allValid ? "bg-green-50 border-green-300" : "bg-red-50 border-red-200"}`}>
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${allValid ? "text-green-600" : "text-red-500"}`}>{allValid ? "✅" : "❌"}</span>
          <div>
            <p className={`font-bold ${allValid ? "text-green-800" : "text-red-700"}`}>
              {allValid ? "All fields validated — ready to generate and submit!"
                        : `${validationChecks.filter(c => !c.passed).length} field(s) missing — go back and complete`}
            </p>
            <p className={`text-xs mt-0.5 ${allValid ? "text-green-600" : "text-red-500"}`}>
              {allValid
                ? "Use Generate with AI to complete empty narrative sections, then submit your TNA Form 01."
                : "Return to the previous steps to fill in the missing information."}
            </p>
          </div>
        </div>
      </div>

      {applicant && (!isStaff || staffMode) && (
        <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-purple-900">AI-assisted form completion</p>
            {tnaAiGenerated === true && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                AI Generated
              </span>
            )}
            {tnaAiGenerated === false && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Template fallback
              </span>
            )}
          </div>
          <p className="text-xs text-purple-700">
            {isStaff
              ? "Generate narrative sections and tables for the selected applicant. Existing entries are preserved."
              : "Fills only empty narrative fields and tables. Your existing entries are preserved."}
          </p>
          {tnaGenerateError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {tnaGenerateError}
            </p>
          )}
          {tnaGenerating ? (
            <AILoader label="Generating TNA Form 01 content" />
          ) : (
            <button
              type="button"
              onClick={() => void handleGenerateTna1()}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "#7c3aed" }}
            >
              🤖 Generate with AI
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => setStep("finance-hr")} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">← Back</button>
        {applicantSubmitted && !isStaff ? (
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold text-center flex items-center justify-center">
              TNA Form 01 submitted. DOST will review your application.
            </div>
            <button
              type="button"
              onClick={() => goToStep("complete")}
              className="px-5 py-3 rounded-xl border border-emerald-300 text-emerald-800 font-semibold text-sm hover:bg-emerald-50"
            >
              View form preview →
            </button>
          </div>
        ) : (
        <button
          onClick={() => {
            if (isStaff) goToStep("complete");
            else {
              saveTnaDraft(true);
              setApplicantSubmitted(true);
              if (applicant) notifyTna1Submitted(applicant);
              goToStep("complete");
            }
          }}
          disabled={!allowWhenDemo(allValid)}
          className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
          style={{ background: DOST_BLUE }}>
          {isStaff ? "Review Form Preview →" : "Submit TNA Form 01 ✓"}
        </button>
        )}
      </div>
    </div>
  );
}
