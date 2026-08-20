/**
 * Author: Yzrel Jade B. Eborde
 *
 * TNA Form 01 — Step 8: Completion / Director validation / handoff to TNA2.
 */

import { MODULE_BODY } from "../moduleTheme";
import { printTnaForm01 } from "../TnaForm01Preview";
import { allowWhenDemo } from "../../utils/demoMode";
import { formatFormMention } from "../../constants/setupForms";
import { getOfficeContact } from "../../utils/provincialOffice";
import type { Tna1StepContext } from "./stepContext";
import { DOST_BLUE, InfoBanner } from "./tna1Ui";

export function ReportsStep({ ctx }: { ctx: Tna1StepContext }) {
  const {
    applicant,
    user,
    isStaff,
    applicantSubmitted,
    staffApproved,
    directorValidated,
    directorValidatedBy,
    directorValidatedAt,
    canDirectorValidate,
    isDirectorForApplicant,
    applicantOfficeId,
    handleDirectorValidate,
    setStep,
    onSubmitSuccess,
    previewForm,
    previewTables,
  } = ctx;

  return (
    <div className={MODULE_BODY}>
      <InfoBanner
        icon="✅"
        color="blue"
        title="TNA Form 01 complete"
        text="Project Proposal (Form 001) and RTEC Report (Form 002) are prepared in their own modules after TNA Form 02 and documentary requirements."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Form 01 on file",
            done: applicantSubmitted || !!applicant?.moduleData?.tna1Document,
            icon: "📄",
          },
          { label: "Staff verification", done: staffApproved, icon: "🔍" },
          { label: "Director validation", done: directorValidated, icon: "🏛️" },
        ].map((s, i) => (
          <div
            key={i}
            className={`text-center p-4 rounded-xl border ${
              s.done
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <div className="text-2xl">{s.icon}</div>
            <p className="text-xs font-bold text-gray-700 mt-1">{s.label}</p>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                s.done
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {s.done ? "Complete ✓" : "Pending"}
            </span>
          </div>
        ))}
      </div>

      {/* Provincial Director validation (per PSTO) */}
      {directorValidated ? (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-300 rounded-xl p-4">
          <span className="text-lg flex-shrink-0 mt-0.5">🏛️</span>
          <div className="text-sm text-emerald-800">
            <p className="font-semibold mb-0.5">Validated by the Provincial Director</p>
            <p className="leading-relaxed">
              {directorValidatedBy || "Provincial Director"}
              {applicantOfficeId && getOfficeContact(applicantOfficeId)
                ? ` · ${getOfficeContact(applicantOfficeId)?.name}`
                : ""}
              {directorValidatedAt &&
                ` · ${new Date(directorValidatedAt).toLocaleString("en-PH")}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">🏛️</span>
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-0.5">Awaiting Provincial Director validation</p>
              <p className="leading-relaxed">
                {formatFormMention("tna01")} must be validated by the Provincial
                Director of{" "}
                {getOfficeContact(applicantOfficeId)?.name || "the assigned PSTO"}{" "}
                before TNA 2 is unlocked.
              </p>
            </div>
          </div>
          {canDirectorValidate && (
            <button
              type="button"
              onClick={handleDirectorValidate}
              disabled={!allowWhenDemo(staffApproved)}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: DOST_BLUE }}
            >
              🏛️ Validate {formatFormMention("tna01")}
              {user?.role === "admin" ? " (admin override)" : ""}
            </button>
          )}
          {user?.role === "provincial-director" && !isDirectorForApplicant && (
            <p className="text-xs text-amber-700">
              This applicant belongs to a different PSTO — only the Provincial
              Director covering {getOfficeContact(applicantOfficeId)?.name || "their province"} can validate.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {isStaff && (
          <button
            type="button"
            onClick={() => setStep("staff-review")}
            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 text-sm"
          >
            ← Back to staff review
          </button>
        )}
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
          className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 text-sm"
        >
          Print Form 01
        </button>
      </div>

      <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0">🎉</span>
          <div className="min-w-0">
            <p className="font-black text-green-800 text-base">
              TNA1 Module Complete
            </p>
            <p className="text-sm text-green-600">
              {directorValidated
                ? `Next: generate and publish ${formatFormMention("tna02")}.`
                : "TNA 2 unlocks after Provincial Director validation."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSubmitSuccess?.()}
          disabled={!allowWhenDemo(staffApproved && directorValidated)}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 min-h-11 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 whitespace-nowrap disabled:opacity-40"
          style={{ background: "#059669" }}
        >
          Proceed to TNA2 →
        </button>
      </div>
    </div>
  );
}
