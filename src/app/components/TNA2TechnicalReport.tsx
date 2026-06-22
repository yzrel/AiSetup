/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle, Clock, Users } from "lucide-react";
import { AuthUser } from "../store/authStore";
import { applicantStore, Applicant } from "../store/applicantStore";
import { useStaffApplicant } from "../hooks/useStaffApplicant";
import { StaffApplicantBanner } from "./StaffApplicantPicker";
import { appendStaffAssessment } from "../utils/clientAssessment";
import { notifyTna2Published } from "../utils/notificationHelpers";
import { api, ApiError } from "../api/client";
import type { Tna2DocumentResponse } from "../api/types";
import {
  buildLocalTna2Document,
  buildTna2GenerationPayload,
  getPublishedTna2,
  getTna2Draft,
  publishTna2Document,
  saveTna2Draft,
} from "../utils/tnaForm02";
import { TnaForm02Preview, printTnaForm02 } from "./TnaForm02Preview";
import { TnaForm02Editor } from "./TnaForm02Editor";
import { aiGenerateErrorMessage } from "../utils/apiErrors";
import { applicantAiContext } from "../utils/aiAssist";

const DOST_BLUE = "#0C2461";

interface TNA2TechnicalReportProps {
  user?: AuthUser | null;
  onSubmitSuccess?: () => void;
}

export function TNA2TechnicalReport({
  user,
  onSubmitSuccess,
}: TNA2TechnicalReportProps = {}) {
  const { applicant, isStaff, scopedApplicants, setSelectedApplicantId } =
    useStaffApplicant(user);
  const [draft, setDraft] = useState<Tna2DocumentResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [publishNotice, setPublishNotice] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editSavedNotice, setEditSavedNotice] = useState("");

  const loadApplicant = useCallback((app: Applicant | null) => {
    const stored = getTna2Draft(app);
    setDraft(stored ?? null);
    setEditMode(false);
  }, []);

  useEffect(() => {
    loadApplicant(applicant);
  }, [applicant?.id, loadApplicant]);

  useEffect(() => {
    return applicantStore.subscribe(() => {
      if (applicant) {
        const updated = applicantStore.getById(applicant.id);
        if (updated) loadApplicant(updated);
      }
    });
  }, [applicant?.id, loadApplicant]);

  const published = getPublishedTna2(applicant);
  const displayDoc = isStaff ? draft : published;

  const handleGenerate = async () => {
    if (!applicant || generating) return;
    const payload = buildTna2GenerationPayload(applicant);
    setGenerating(true);
    setGenerateError(null);

    let document: Tna2DocumentResponse;
    try {
      document = await api.generateTna2(payload);
      if (!document.aiGenerated) {
        setGenerateError(
          "Report generated using template. Set ANTHROPIC_API_KEY on the backend for AI-drafted content.",
        );
      }
    } catch (err) {
      if (err instanceof ApiError && err.status < 500) {
        setGenerateError(aiGenerateErrorMessage(err, "Could not generate report."));
        setGenerating(false);
        return;
      }
      document = buildLocalTna2Document(payload);
      setGenerateError(
        "Backend unavailable — generated from template. Run npm run backend for server-side generation.",
      );
    }

    saveTna2Draft(applicant.id, document);
    setDraft(document);
    setEditMode(true);
    setGenerating(false);
  };

  const handleSaveEdits = () => {
    if (!applicant || !draft) return;
    saveTna2Draft(applicant.id, draft);
    setEditSavedNotice("Draft saved.");
    setTimeout(() => setEditSavedNotice(""), 3000);
  };

  const handleDraftChange = (updated: Tna2DocumentResponse) => {
    setDraft(updated);
  };

  const handlePublish = () => {
    if (!applicant || !draft) return;
    saveTna2Draft(applicant.id, draft);
    publishTna2Document(applicant.id, draft);
    if (user) {
      applicantStore.update(applicant.id, {
        ...appendStaffAssessment(applicant, {
          stage: "tna2",
          decision: "published",
          assessedBy: user.email,
          assessedAt: new Date().toISOString(),
          remarks: "TNA Form 02 published to applicant",
        }),
      });
    }
    notifyTna2Published(applicant);
    setPublishNotice("TNA Form 02 published to applicant.");
    setTimeout(() => setPublishNotice(""), 4000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TNA Form 02 — Technical Report</h1>
          <p className="text-gray-500 text-sm mt-1 max-w-3xl">
            Official DOST Technology Needs Assessment report based on TNA Form 01 and site
            validation findings. Staff prepare and publish; applicants receive read-only access.
          </p>
        </div>

        {isStaff && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Users className="w-4 h-4" />
              Select enterprise
            </div>
            <select
              value={applicant?.id ?? ""}
              onChange={(e) => setSelectedApplicantId(e.target.value || null)}
              className="w-full text-sm rounded-lg px-3 py-2 border border-gray-200"
            >
              <option value="">Select enterprise…</option>
              {scopedApplicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.enterpriseName} — {a.applicationId}
                </option>
              ))}
            </select>

            {!applicant?.moduleData?.tna1 && !applicant?.moduleData?.tna1Document && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                This applicant has no TNA Form 01 data. Complete TNA 1 first for best results.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!applicant || generating}
                className="px-4 py-2.5 rounded-lg text-white text-sm font-bold disabled:opacity-40"
                style={{ background: "#7c3aed" }}
              >
                {generating ? "Generating…" : "Generate with AI"}
              </button>
              {draft && (
                <button
                  type="button"
                  onClick={() => setEditMode((m) => !m)}
                  className="px-4 py-2.5 rounded-lg border border-[#0C2461]/30 text-[#0C2461] text-sm font-bold hover:bg-blue-50"
                >
                  {editMode ? "Preview report" : "Edit report"}
                </button>
              )}
              {draft && (
                <button
                  type="button"
                  onClick={handlePublish}
                  className="px-4 py-2.5 rounded-lg text-white text-sm font-bold"
                  style={{ background: "#059669" }}
                >
                  Publish to applicant
                </button>
              )}
            </div>

            {generateError && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {generateError}
              </p>
            )}
            {publishNotice && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {publishNotice}
              </p>
            )}
            {editSavedNotice && (
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                {editSavedNotice}
              </p>
            )}
            {draft && (
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Draft: {draft.documentRef}
                {getTna2Draft(applicant)?.published && (
                  <span className="text-emerald-600 font-semibold">· Published</span>
                )}
              </p>
            )}
          </div>
        )}

        {!isStaff && !published && (
          <div className="flex items-start gap-3 p-5 rounded-xl border border-amber-200 bg-amber-50">
            <Clock className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Awaiting DOST preparation</p>
              <p className="text-sm text-amber-700 mt-1">
                DOST Region XII is preparing your TNA Form 02 technical report based on your TNA
                Form 01 and site validation. You will be able to view and download it here once
                published.
              </p>
              {applicant && (
                <p className="text-xs text-amber-600 mt-2 font-mono">
                  Application: {applicant.applicationId}
                </p>
              )}
            </div>
          </div>
        )}

        {isStaff && draft && editMode && (
          <TnaForm02Editor
            document={draft}
            onChange={handleDraftChange}
            onSave={handleSaveEdits}
            aiContext={{
              ...applicantAiContext(applicant),
              enterpriseProfile: draft.enterpriseProfile,
              siteValidationFindings: draft.siteValidationFindings,
            }}
          />
        )}

        {displayDoc && !editMode && (
          <TnaForm02Preview
            document={displayDoc}
            applicationId={applicant?.applicationId}
            aiGenerated={displayDoc.aiGenerated}
            published={isStaff ? getTna2Draft(applicant)?.published : true}
            onPrint={printTnaForm02}
          />
        )}

        {!isStaff && published && onSubmitSuccess && (
          <button
            type="button"
            onClick={onSubmitSuccess}
            className="w-full py-3 rounded-xl text-white font-bold text-sm print:hidden"
            style={{ background: DOST_BLUE }}
          >
            Continue to Project Proposal →
          </button>
        )}
      </div>
    </div>
  );
}
