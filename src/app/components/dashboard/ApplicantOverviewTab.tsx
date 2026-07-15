/**
 * Author: Yzrel Jade B. Eborde
 *
 * Client-facing dashboard overview: application progress and notifications.
 */

import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
} from "lucide-react";
import { AdminView, AuthUser } from "../../store/authStore";
import { notificationStore } from "../../store/notificationStore";
import { resolveApplicantForUser } from "../../utils/resolveApplicant";
import {
  getApplicantDashboardSteps,
  getAwaitingStaffReviewMessage,
  isAwaitingStaffReview,
  isRoutedToMpex,
} from "../../utils/applicantProgress";
import {
  getOfficeContact,
  resolveApplicantOfficeId,
} from "../../utils/provincialOffice";
import { SectionTitle } from "./widgets";

export function ApplicantOverviewTab({
  user,
  onNavigate,
}: {
  user: AuthUser;
  onNavigate?: (view: AdminView) => void;
}) {
  const application = resolveApplicantForUser(user);
  const progressSteps = getApplicantDashboardSteps(application);
  const awaitingReview = isAwaitingStaffReview(application);
  const awaitingReviewMessage = getAwaitingStaffReviewMessage(application);
  const routedToMpex = isRoutedToMpex(application);
  const awaitingRequirementsReview =
    !!application?.moduleData?.documentsSubmitted &&
    !application?.moduleData?.staffDecision;
  const provincialOffice = application
    ? getOfficeContact(resolveApplicantOfficeId(application))
    : null;
  const userNotifications = notificationStore.getForUser(user);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <SectionTitle sub="Track your SETUP application progress">
        Application Progress
      </SectionTitle>
      {routedToMpex && (
        <div className="mt-4 mb-2 flex items-start gap-3 p-4 rounded-xl border border-purple-200 bg-purple-50">
          <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-sm text-purple-900">
            <p className="font-semibold">Routed to MPEX pre-requisite program</p>
            <p className="mt-0.5">
              {provincialOffice?.name ?? "Your provincial office"} will guide you through the MPEX capacity-building track before SETUP enrollment continues.
            </p>
          </div>
        </div>
      )}
      {awaitingReview && (
        <div className="mt-4 mb-2 flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">{awaitingReviewMessage.title}</p>
            <p className="mt-0.5">{awaitingReviewMessage.body}</p>
          </div>
        </div>
      )}
      {awaitingRequirementsReview && !awaitingReview && (
        <div className="mt-4 mb-2 flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50">
          <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Requirements submitted</p>
            <p className="mt-0.5">
              {provincialOffice?.name ?? "Your provincial office"} is reviewing your documentary requirements.
            </p>
          </div>
        </div>
      )}
      <div className="mt-4 space-y-3">
        {progressSteps.map((item) => {
          const stepNavigable =
            !!item.view &&
            !!onNavigate &&
            item.status !== "upcoming";
          return (
          <button
            key={item.module}
            type="button"
            disabled={!stepNavigable}
            onClick={() => item.view && onNavigate?.(item.view)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
              item.status === "current"
                ? "border-[#0C2461]/20 bg-blue-50"
                : item.status === "completed"
                  ? "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50"
                  : "border-gray-100 bg-gray-50"
            } ${stepNavigable ? "cursor-pointer" : "cursor-default"}`}
          >
            {item.status === "current" ? (
              <Clock className="w-5 h-5 text-[#0C2461] shrink-0" />
            ) : item.status === "completed" ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-gray-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 capitalize">
                {item.module === "conduct-rtec" && item.status === "current"
                  ? "Awaiting DOST evaluation"
                  : item.status}
              </p>
            </div>
            {stepNavigable && item.status !== "upcoming" && (
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            )}
          </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        {application?.applicationId
          ? `Application ${application.applicationId} · `
          : ""}
        Use the sidebar or tap a step above to continue your application.
        DOST will review assessments and approvals on your behalf.
      </p>
      {userNotifications.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Recent notifications
          </p>
          <div className="space-y-2">
            {userNotifications.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className={`text-sm p-3 rounded-xl border ${
                  !n.read
                    ? "bg-blue-50 border-blue-100"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <p className="font-semibold text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
