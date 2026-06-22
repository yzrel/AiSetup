/**
 * Author: Yzrel Jade B. Eborde
 */

import { ExternalLink, Mail } from "lucide-react";
import { DostProgram } from "../constants/dostProgramRecommendations";
import { DOST_REGION_12_CONTACTS } from "../constants/setupBrochure";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const DOST_BLUE = "#0C2461";

function scopeLabel(scope: DostProgram["scope"]) {
  return scope === "region12" ? "Region XII" : "National";
}

function scopeBadgeClass(scope: DostProgram["scope"]) {
  return scope === "region12"
    ? "bg-blue-100 text-blue-800"
    : "bg-purple-100 text-purple-800";
}

interface DostProgramPreviewDialogProps {
  program: DostProgram | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactEmail?: string;
}

export function DostProgramPreviewDialog({
  program,
  open,
  onOpenChange,
  contactEmail,
}: DostProgramPreviewDialogProps) {
  if (!program) return null;

  const mailTo =
    contactEmail ?? DOST_REGION_12_CONTACTS[0]?.email ?? "records@region12.dost.gov.ph";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col gap-0 p-0 sm:max-w-lg overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-2 pr-8">
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${scopeBadgeClass(program.scope)}`}
            >
              {scopeLabel(program.scope)}
            </span>
          </div>
          <DialogTitle className="text-[#0C2461] text-xl">
            {program.name}
          </DialogTitle>
          <DialogDescription className="text-gray-600 font-medium">
            {program.tagline}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5 text-sm">
          <p className="text-gray-700 leading-relaxed">{program.description}</p>

          {program.fundingNote && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-blue-900 text-xs font-medium">
              {program.fundingNote}
            </div>
          )}

          <section>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              What you get
            </h4>
            <ul className="space-y-1.5">
              {program.benefits.map((item) => (
                <li key={item} className="flex gap-2 text-gray-700">
                  <span className="text-[#0C2461] shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Who can apply
            </h4>
            <ul className="space-y-1.5">
              {program.eligibility.map((item) => (
                <li key={item} className="flex gap-2 text-gray-700">
                  <span className="text-[#0C2461] shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              How to apply
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-gray-700">
              {program.howToApply.map((step) => (
                <li key={step} className="pl-1">
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {program.documents.length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                Typical documents
              </h4>
              <ul className="space-y-1.5">
                {program.documents.map((item) => (
                  <li key={item} className="flex gap-2 text-gray-600 text-xs">
                    <span className="shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-gray-500">{program.applyVia}</p>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0 flex-col sm:flex-row gap-2">
          <a
            href={program.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4" />
            Open official page
          </a>
          <a
            href={`mailto:${mailTo}?subject=${encodeURIComponent(`Inquiry: ${program.name}`)}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: DOST_BLUE }}
          >
            <Mail className="w-4 h-4" />
            Contact DOST XII
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
