/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 — printable form preview step ("complete").
 */

import { MODULE_BODY } from "../moduleTheme";
import { TnaForm01Preview, printTnaForm01 } from "../TnaForm01Preview";
import { DocumentDeliveryPanel } from "../DocumentDeliveryPanel";
import { formatFormMention } from "../../constants/setupForms";
import type { Tna1StepContext } from "./stepContext";
import { AILoader, DOST_BLUE, InfoBanner } from "./tna1Ui";

export function CompleteStep({ ctx }: { ctx: Tna1StepContext }) {
  const {
    applicant,
    user,
    isStaff,
    tnaAiGenerated,
    tnaGenerating,
    handleGenerateTna1,
    previewForm,
    previewTables,
    setStep,
    onSubmitSuccess,
  } = ctx;

  return (
    <div className={MODULE_BODY}>
      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5 text-center">
        <span className="text-3xl">✅</span>
        <h3 className="font-black text-green-800 text-lg mt-2">TNA Form 01 Recorded</h3>
        <p className="text-sm text-green-700 mt-1">
          Reference: <strong className="font-mono">{applicant?.applicationId ?? "—"}</strong>
          {applicant?.moduleData?.tna1?.submittedAt && (
            <span className="block text-xs text-green-600 mt-1">
              Submitted {new Date(applicant.moduleData.tna1.submittedAt).toLocaleString("en-PH")}
            </span>
          )}
          {tnaAiGenerated !== null && (
            <span className="block text-xs mt-1">
              {tnaAiGenerated ? "Content: AI generated" : "Content: template fallback"}
            </span>
          )}
        </p>
      </div>

      {!isStaff && applicant && (
        <div className="print:hidden flex flex-wrap gap-2 items-center justify-end">
          {tnaGenerating ? (
            <AILoader label="Regenerating TNA Form 01 content" />
          ) : (
            <button
              type="button"
              onClick={() => void handleGenerateTna1()}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white hover:opacity-90"
              style={{ background: "#7c3aed" }}
            >
              🤖 Regenerate with AI
            </button>
          )}
        </div>
      )}

      {isStaff && (
        <InfoBanner
          icon="📄"
          color="blue"
          title="Submitted Form 01"
          text="Review the applicant's completed TNA Form 01 below. Print if needed, then continue to Staff Review."
        />
      )}

      <TnaForm01Preview
        applicant={applicant}
        form={previewForm}
        tables={previewTables}
        aiGenerated={tnaAiGenerated ?? undefined}
        onPrint={() => printTnaForm01(applicant?.applicationId)}
      />

      <DocumentDeliveryPanel
        applicant={applicant}
        user={user}
        moduleKey="tna1"
        documentTitle={formatFormMention("tna01")}
      />

      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        {!isStaff && (
          <button
            onClick={() => setStep("validation")}
            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 text-sm"
          >
            ← Back to validation
          </button>
        )}
        <button
          onClick={() => printTnaForm01(applicant?.applicationId)}
          className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
          style={{ background: DOST_BLUE }}
        >
          Print / Save as PDF
        </button>
        {isStaff && (
          <button
            type="button"
            onClick={() => setStep("staff-review")}
            className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
            style={{ background: "#059669" }}
          >
            Continue to Staff Review →
          </button>
        )}
        {onSubmitSuccess && !isStaff && (
          <button
            type="button"
            onClick={onSubmitSuccess}
            className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
            style={{ background: "#059669" }}
          >
            Continue to TNA 2 →
          </button>
        )}
      </div>
    </div>
  );
}
