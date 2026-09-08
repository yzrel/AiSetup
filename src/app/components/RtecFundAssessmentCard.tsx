/**
 * Author: Yzrel Jade B. Eborde
 *
 * Staff advisory card: AI-proposed SETUP iFund amount + refund risk (RTEC Cover).
 */

import { useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { api, ApiError } from "../api/client";
import type { Applicant } from "../store/applicantStore";
import type { RtecFundAssessment, RtecReportForm } from "../api/types";
import {
  buildIfundAssessmentContext,
  IFUND_ASSESSMENT_NOTICE,
} from "../utils/ifundAssessment";
import { aiAssistNotice } from "../utils/demoMode";

interface RtecFundAssessmentCardProps {
  applicant: Applicant | null;
  form: RtecReportForm;
  onApply: (assessment: RtecFundAssessment, applyToSetupShare: boolean) => void;
}

function riskBadgeClass(risk: string): string {
  const u = risk.toUpperCase();
  if (u === "LOW") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (u === "HIGH") return "bg-red-100 text-red-800 border-red-200";
  return "bg-amber-100 text-amber-900 border-amber-200";
}

export function RtecFundAssessmentCard({
  applicant,
  form,
  onApply,
}: RtecFundAssessmentCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assessment = form.fundAssessment;

  const runAssessment = async () => {
    if (!applicant || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.assessIfund({
        context: buildIfundAssessmentContext(applicant),
      });
      const next: RtecFundAssessment = {
        proposedAmount: res.proposedAmount ?? "",
        refundRisk: res.refundRisk ?? "MEDIUM",
        authorityBand: res.authorityBand ?? "",
        rationale: res.rationale ?? "",
        sourcesPresent: res.sourcesPresent ?? [],
        sourcesMissing: res.sourcesMissing ?? [],
        aiGenerated: res.aiGenerated,
        assessedAt: new Date().toISOString(),
      };
      onApply(next, false);
      const notice = aiAssistNotice(res.aiGenerated);
      if (notice) setError(notice);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message || "Could not assess iFund amount."
          : "Could not assess iFund amount.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-violet-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 shrink-0" />
            AI proposed SETUP fund amount
          </p>
          <p className="text-xs text-violet-800 mt-1.5 leading-relaxed">
            {IFUND_ASSESSMENT_NOTICE}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runAssessment()}
          disabled={loading || !applicant}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide text-violet-800 bg-white border border-violet-300 hover:bg-violet-100 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {loading ? "Assessing…" : assessment ? "Re-assess" : "Assess iFund"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {assessment && (
        <div className="bg-white border border-violet-100 rounded-lg p-3 space-y-3 text-sm">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Proposed amount
              </p>
              <p className="font-bold text-gray-900 text-base mt-0.5">
                {assessment.proposedAmount || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Refund risk
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold border ${riskBadgeClass(assessment.refundRisk)}`}
              >
                {(assessment.refundRisk || "MEDIUM").toUpperCase()}
              </span>
            </div>
          </div>
          {assessment.authorityBand && (
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-700">Authority band:</span>{" "}
              {assessment.authorityBand}
            </p>
          )}
          {assessment.rationale && (
            <p className="text-xs text-gray-700 leading-relaxed">{assessment.rationale}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="font-semibold text-emerald-800 mb-0.5">Sources present</p>
              <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                {(assessment.sourcesPresent ?? []).length === 0 ? (
                  <li>None detected</li>
                ) : (
                  (assessment.sourcesPresent ?? []).map((s) => <li key={s}>{s}</li>)
                )}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-amber-800 mb-0.5">Sources missing</p>
              <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                {(assessment.sourcesMissing ?? []).length === 0 ? (
                  <li>None</li>
                ) : (
                  (assessment.sourcesMissing ?? []).map((s) => <li key={s}>{s}</li>)
                )}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onApply(assessment, true)}
            disabled={!assessment.proposedAmount?.trim()}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
            style={{ background: "#0C2461" }}
          >
            Apply to DOST-SETUP
          </button>
        </div>
      )}
    </div>
  );
}
