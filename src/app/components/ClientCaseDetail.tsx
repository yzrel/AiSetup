/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import {
  applicantStore,
  Applicant,
  MODULE_LABELS,
  MODULE_ORDER,
  ModuleStatus,
} from "../store/applicantStore";
import { AuthUser, AdminView } from "../store/authStore";
import { staffContextStore } from "../store/staffContextStore";
import {
  getAssessmentTasks,
  getOverallAssessmentLabel,
  AssessmentTask,
  StaffAssessmentRecord,
} from "../utils/clientAssessment";
import { getApplicantDashboardSteps } from "../utils/applicantProgress";
import {
  getOfficeName,
  resolveApplicantOfficeId,
  resolveApplicantProvince,
  getOfficeContact,
} from "../utils/provincialOffice";
import { getProgramsByIds } from "../constants/dostProgramRecommendations";
import { DostProgramRecommendationCards } from "./DostProgramRecommendationCards";

const moduleBadgeColors: Partial<Record<ModuleStatus, string>> = {
  prescreening: "bg-gray-100 text-gray-600",
  registration: "bg-blue-100 text-blue-700",
  "letter-of-intent": "bg-indigo-100 text-indigo-700",
  requirements: "bg-purple-100 text-purple-700",
  tna1: "bg-cyan-100 text-cyan-700",
  tna2: "bg-sky-100 text-sky-700",
  "project-proposal": "bg-teal-100 text-teal-700",
  "conduct-rtec": "bg-amber-100 text-amber-700",
  "approval-letter": "bg-green-100 text-green-700",
  "project-information-sheet": "bg-teal-100 text-teal-700",
  "landbank-withdrawal": "bg-lime-100 text-lime-700",
  "procurement-liquidation": "bg-orange-100 text-orange-700",
  completed: "bg-emerald-100 text-emerald-700",
};

function statusChip(status: AssessmentTask["status"]) {
  if (status === "pending")
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "in_progress")
    return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

interface ClientCaseDetailProps {
  applicant: Applicant;
  user: AuthUser;
  onBack: () => void;
  onNavigate: (view: AdminView) => void;
  onOpenAccountManagement?: () => void;
}

export function ClientCaseDetail({
  applicant,
  user,
  onBack,
  onNavigate,
  onOpenAccountManagement,
}: ClientCaseDetailProps) {
  const [noteText, setNoteText] = useState("");
  const [, forceUpdate] = useState(0);
  const province = resolveApplicantProvince(applicant);
  const officeName = getOfficeName(resolveApplicantOfficeId(applicant));
  const tasks = getAssessmentTasks(applicant);
  const steps = getApplicantDashboardSteps(applicant);
  const staffNotes = (applicant.moduleData?.staffNotes ??
    []) as Array<{ at: string; author: string; text: string }>;
  const recommendedProgramIds = (applicant.moduleData?.prescreening
    ?.recommendedProgramIds ?? []) as string[];
  const recommendedPrograms = getProgramsByIds(recommendedProgramIds);
  const pstcEmail = getOfficeContact(resolveApplicantOfficeId(applicant)).email;

  const handleAssess = (task: AssessmentTask) => {
    staffContextStore.setSelectedApplicant(applicant.id);
    onNavigate(task.view);
  };

  const handleAdvance = () => {
    const idx = MODULE_ORDER.indexOf(applicant.currentModule);
    const next = idx < MODULE_ORDER.length - 1 ? MODULE_ORDER[idx + 1] : null;
    if (next && window.confirm(`Advance ${applicant.enterpriseName} to ${MODULE_LABELS[next]}?`)) {
      applicantStore.advanceModule(applicant.id, next);
    }
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    applicantStore.update(applicant.id, {
      moduleData: {
        ...applicant.moduleData,
        staffNotes: [
          ...staffNotes,
          {
            at: new Date().toISOString(),
            author: `${user.firstName} ${user.lastName}`.trim() || user.email,
            text: noteText.trim(),
          },
        ],
      },
    });
    setNoteText("");
    forceUpdate((n) => n + 1);
  };

  const overall = getOverallAssessmentLabel(applicant);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#0C2461] px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="text-white/70 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">
              {applicant.enterpriseName}
            </p>
            <p className="text-white/50 text-[11px]">
              {applicant.applicationId} · {province || "—"}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${moduleBadgeColors[applicant.currentModule] ?? "bg-gray-100 text-gray-600"}`}
        >
          {MODULE_LABELS[applicant.currentModule]}
        </span>
      </div>

      <div className="p-5 space-y-6">
        <div className="flex flex-wrap gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              overall === "Needs review"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : overall === "In progress"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            {overall}
          </span>
          {applicant.qualified ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
              Qualified
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
              Not qualified
            </span>
          )}
          {applicantStore.isAccountBlocked(applicant) && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
              Blocked
            </span>
          )}
        </div>

        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Client profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Applicant</p>
                <p className="font-medium">{applicant.applicantName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Sector</p>
                <p className="font-medium">{applicant.businessSector || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Contact</p>
                <p className="font-medium">{applicant.contactNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-medium break-all">{applicant.emailAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Provincial office</p>
                <p className="font-medium">{officeName}</p>
                <p className="text-gray-500 text-xs mt-0.5">{applicant.address}</p>
              </div>
            </div>
          </div>
        </section>

        {!applicant.qualified && recommendedPrograms.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Recommended DOST programs
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Alternative programs suggested based on the client&apos;s priority
              sector. Staff may share these with the applicant.
            </p>
            <DostProgramRecommendationCards
              programs={recommendedPrograms}
              contactEmail={pstcEmail}
              compact
            />
          </section>
        )}

        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Application timeline
          </h3>
          <div className="space-y-2">
            {steps.map((step) => (
              <div
                key={step.module}
                className="flex items-center gap-3 text-sm border border-gray-100 rounded-xl px-3 py-2"
              >
                {step.status === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : step.status === "current" ? (
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />
                )}
                <span
                  className={
                    step.status === "current"
                      ? "font-semibold text-[#0C2461]"
                      : "text-gray-700"
                  }
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Assessment checklist
          </h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.stage}
                className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-800">
                      {task.label}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusChip(task.status)}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                </div>
                {(task.status === "pending" || task.status === "in_progress") && (
                  <button
                    type="button"
                    onClick={() => handleAssess(task)}
                    className="shrink-0 flex items-center gap-1 text-xs font-bold text-white bg-[#0C2461] hover:bg-blue-900 px-3 py-2 rounded-lg"
                  >
                    Assess
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Staff notes
          </h3>
          <div className="space-y-2 mb-3">
            {staffNotes.length === 0 && (
              <p className="text-sm text-gray-400">No notes yet.</p>
            )}
            {staffNotes.map((note, i) => (
              <div
                key={i}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm"
              >
                <p className="text-gray-800">{note.text}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {note.author} · {new Date(note.at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note for this client..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461]/20"
            />
            <button
              type="button"
              onClick={handleAddNote}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-semibold rounded-lg"
            >
              Save
            </button>
          </div>
        </section>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleAdvance}
            className="text-xs font-bold px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Advance module
          </button>
          {onOpenAccountManagement && (
            <button
              type="button"
              onClick={onOpenAccountManagement}
              className="text-xs font-bold px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Account settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export type { StaffAssessmentRecord };
