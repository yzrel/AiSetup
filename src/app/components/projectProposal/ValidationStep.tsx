/**
 * Author: Yzrel Jade B. Eborde
 *
 * Project Proposal (Form 001) — Validation Results step for cooperators
 * (placed after Risk, before Preview). Mirrors TNA Form 01 / LOI checklist UX.
 */

import { ValidationRow } from "../ValidationRow";
import { isDemoModeActive } from "../../utils/demoMode";
import {
  PROJECT_PROPOSAL_VALIDATION_SECTION_LABELS,
  type ProjectProposalValidationCheck,
  type ProjectProposalValidationSection,
} from "../../utils/projectProposal";

const SECTION_ORDER: ProjectProposalValidationSection[] = [
  "cover",
  "company",
  "site-ops",
  "marketing",
  "technology",
  "waste",
  "financial",
  "risk",
];

export function ValidationStep({
  validationChecks,
  allValid,
  onGoToSection,
  submitted = false,
  staffApproved = false,
}: {
  validationChecks: ProjectProposalValidationCheck[];
  allValid: boolean;
  onGoToSection: (section: ProjectProposalValidationSection) => void;
  /** Cooperator already submitted Form 001. */
  submitted?: boolean;
  /** DOST staff completed Staff Review approval. */
  staffApproved?: boolean;
}) {
  const passedCount = validationChecks.filter((c) => c.passed).length;
  const missing = validationChecks.filter((c) => !c.passed);
  const missingCount = missing.length;

  const bySection = SECTION_ORDER.map((section) => {
    const checks = validationChecks.filter((c) => c.section === section);
    const sectionPassed = checks.length > 0 && checks.every((c) => c.passed);
    return {
      section,
      label: PROJECT_PROPOSAL_VALIDATION_SECTION_LABELS[section],
      checks,
      sectionPassed,
      missingInSection: checks.filter((c) => !c.passed).length,
    };
  }).filter((g) => g.checks.length > 0);

  const missingBySection = SECTION_ORDER.map((section) => ({
    section,
    label: PROJECT_PROPOSAL_VALIDATION_SECTION_LABELS[section],
    items: missing.filter((c) => c.section === section),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <span className="text-xl shrink-0" aria-hidden>
          ✅
        </span>
        <div>
          <p className="font-semibold text-blue-900 mb-0.5">Data Validation Check</p>
          <p className="text-sm text-blue-800">
            Required fields are checked below. Anything incomplete is flagged{" "}
            <span className="font-bold text-red-700">NOT OK / MISSING</span> so
            you can fix it before submit.
          </p>
        </div>
      </div>

      {allValid ? (
        <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl text-green-600" aria-hidden>
              ✅
            </span>
            <div>
              <p className="text-sm font-bold text-green-800">
                Nothing missing — all required items OK
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                {passedCount}/{validationChecks.length} checks passed. Continue to
                Preview and submit when ready.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl text-red-500" aria-hidden>
              ❌
            </span>
            <div>
              <p className="text-sm font-bold text-red-800">
                What’s missing — NOT OK ({missingCount})
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                The system flagged these required items. Tap a row to open that
                section and complete it.
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            {missingBySection.map(({ section, label, items }) => (
              <li key={section}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                    {label}
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    Not OK
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => onGoToSection(item.section)}
                        className="w-full text-left rounded-lg border border-red-200 bg-white px-3 py-2.5 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-red-800">
                              {item.label}
                            </span>
                            <span className="block text-xs text-red-600 mt-0.5">
                              {item.error}
                            </span>
                          </span>
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            Missing
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
          Validation Results &nbsp;
          <span className="text-xs font-normal text-gray-400">
            ({passedCount}/{validationChecks.length} complete)
          </span>
          <span
            className={`ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              allValid
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {allValid ? "OK" : "Not OK"}
          </span>
        </h2>
        <div className="space-y-4">
          {bySection.map(
            ({ section, label, checks, sectionPassed, missingInSection }) => (
              <div
                key={section}
                className={`bg-white border rounded-xl p-4 ${
                  sectionPassed
                    ? "border-gray-100"
                    : "border-red-200 ring-1 ring-red-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    {label}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-gray-400">
                      {checks.filter((c) => c.passed).length}/{checks.length}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        sectionPassed
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {sectionPassed
                        ? "OK"
                        : `Not OK · ${missingInSection} missing`}
                    </span>
                  </div>
                </div>
                {checks.map((check) =>
                  check.passed ? (
                    <ValidationRow key={check.label} {...check} />
                  ) : (
                    <button
                      key={check.label}
                      type="button"
                      onClick={() => onGoToSection(check.section)}
                      className="w-full text-left rounded-lg hover:bg-red-50/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                      title={`Go to ${label}`}
                    >
                      <ValidationRow {...check} />
                    </button>
                  ),
                )}
              </div>
            ),
          )}
        </div>
      </div>

      {isDemoModeActive() && !allValid && (
        <div className="rounded-xl p-4 border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          Demo mode: you can continue and submit with incomplete fields. Missing
          items above still show what production mode would require. Demo mode
          also unlocks later modules in the sidebar for testing.
        </div>
      )}

      <div
        className={`rounded-xl p-4 border-2 ${
          allValid
            ? "bg-green-50 border-green-300"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-2xl ${allValid ? "text-green-600" : "text-red-500"}`}
          >
            {allValid ? "✅" : "❌"}
          </span>
          <div className="min-w-0">
            <p
              className={`font-bold ${
                allValid ? "text-green-800" : "text-red-700"
              }`}
            >
              {allValid
                ? submitted
                  ? staffApproved
                    ? "Proposal approved — proceed to Submit Requirements when it unlocks."
                    : "Submitted — waiting for DOST staff approval."
                  : "All required fields validated — ready for Preview and submit!"
                : `Status: NOT OK — ${missingCount} required field(s) still missing`}
            </p>
            <p
              className={`text-xs mt-0.5 ${
                allValid ? "text-green-600" : "text-red-500"
              }`}
            >
              {allValid
                ? submitted
                  ? staffApproved
                    ? "Staff Review is complete. Open Submit Requirements from Preview or the sidebar."
                    : "Submitted — awaiting DOST staff approval before Submit Requirements unlocks."
                  : "Continue to Preview to generate with AI, print, and submit your Project Proposal."
                : missing
                    .map(
                      (c) =>
                        `${c.label} (${PROJECT_PROPOSAL_VALIDATION_SECTION_LABELS[c.section]})`,
                    )
                    .join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
