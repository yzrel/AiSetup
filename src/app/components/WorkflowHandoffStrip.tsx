/**
 * Author: Yzrel Jade B. Eborde
 *
 * Compact "Waiting on <role> — <next action>" strip for staff module headers.
 * Reads the shared handoff model so every module agrees on who acts next.
 */

import { ArrowRight } from "lucide-react";
import { Applicant } from "../store/applicantStore";
import { AuthUser, authStore } from "../store/authStore";
import { getWorkflowHandoff, handoffNotifyRoles } from "../utils/workflowHandoff";

interface WorkflowHandoffStripProps {
  applicant: Applicant | null | undefined;
  user?: AuthUser | null;
}

export function WorkflowHandoffStrip({
  applicant,
  user,
}: WorkflowHandoffStripProps) {
  if (!applicant || !user || !authStore.isStaff(user.role)) return null;

  const handoff = getWorkflowHandoff(applicant);
  if (handoff.waitingOnRole === "none") return null;

  const isMyTurn =
    user.role === "admin" ||
    handoffNotifyRoles(handoff.waitingOnRole).includes(user.role);
  const waitingOnCooperator = handoff.waitingOnRole === "cooperator";

  const tone = waitingOnCooperator
    ? "bg-gray-50 border-gray-200 text-gray-600"
    : isMyTurn
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-blue-50 border-blue-100 text-blue-700";

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border p-3 sm:p-4 ${tone}`}
    >
      <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="text-xs sm:text-sm min-w-0">
        <p className="font-semibold">
          Waiting on {handoff.waitingOnLabel}
          {isMyTurn && !waitingOnCooperator ? " — your action" : ""}
        </p>
        <p className="mt-0.5 break-words">{handoff.staffMessage}</p>
      </div>
    </div>
  );
}
