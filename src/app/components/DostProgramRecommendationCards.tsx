/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import { ExternalLink, Eye } from "lucide-react";
import { DostProgram } from "../constants/dostProgramRecommendations";
import { DOST_REGION_12_CONTACTS } from "../constants/setupBrochure";
import { DostProgramPreviewDialog } from "./DostProgramPreviewDialog";

const DOST_BLUE = "#0C2461";

function scopeLabel(scope: DostProgram["scope"]) {
  return scope === "region12" ? "Region XII" : "National";
}

function scopeBadgeClass(scope: DostProgram["scope"]) {
  return scope === "region12"
    ? "bg-blue-100 text-blue-800"
    : "bg-purple-100 text-purple-800";
}

interface DostProgramRecommendationCardsProps {
  programs: DostProgram[];
  contactEmail?: string;
  compact?: boolean;
}

export function DostProgramRecommendationCards({
  programs,
  contactEmail,
  compact = false,
}: DostProgramRecommendationCardsProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewProgram =
    programs.find((p) => p.id === previewId) ?? null;

  if (programs.length === 0) return null;

  return (
    <>
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {programs.map((program) => (
          <div
            key={program.id}
            className="border border-gray-200 rounded-xl p-4 bg-white hover:border-blue-200 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-bold text-gray-900">{program.name}</h4>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${scopeBadgeClass(program.scope)}`}
                  >
                    {scopeLabel(program.scope)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {program.tagline}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{program.summary}</p>
            {!compact && (
              <ul className="text-xs text-gray-600 space-y-1 mb-4">
                {program.benefits.slice(0, 2).map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-[#0C2461] shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreviewId(program.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: DOST_BLUE }}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
              <a
                href={program.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Official page
              </a>
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm">
          <p className="font-semibold text-[#0C2461] mb-1">
            Contact your nearest Provincial S&T Center
          </p>
          <p className="text-gray-600 text-xs mb-2">
            DOST Region XII provincial offices can guide you on which program
            fits your enterprise best.
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            {DOST_REGION_12_CONTACTS.slice(0, 3).map((office) => (
              <li key={office.id}>
                <span className="font-medium">{office.name}</span>
                {" · "}
                <a
                  href={`mailto:${office.email}`}
                  className="text-blue-700 hover:underline"
                >
                  {office.email}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DostProgramPreviewDialog
        program={previewProgram}
        open={previewId !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
        contactEmail={contactEmail}
      />
    </>
  );
}
