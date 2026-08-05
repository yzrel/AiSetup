/**
 * Author: Yzrel Jade B. Eborde
 *
 * Notifications tab: warning/unread/completed summary and the alert feed.
 */

import { AlertCircle } from "lucide-react";
import { AdminView, AuthUser } from "../../store/authStore";
import { notificationStore } from "../../store/notificationStore";
import { staffContextStore } from "../../store/staffContextStore";
import { timeAgo } from "../../utils/timeAgo";

export function AlertsTab({
  user,
  onNavigate,
}: {
  user: AuthUser;
  onNavigate?: (view: AdminView) => void;
}) {
  const userNotifications = notificationStore.getForUser(user);
  const unreadNotifications = userNotifications.filter((n) => !n.read);

  const handleClick = (alertId: string, view?: AdminView, applicantId?: string) => {
    notificationStore.markRead(alertId);
    if (view && onNavigate) {
      if (applicantId) {
        staffContextStore.setSelectedApplicant(applicantId);
      }
      onNavigate(view);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
        {[
          {
            label: "Warnings",
            count: userNotifications.filter(
              (n) => n.kind === "warning" || n.kind === "action",
            ).length,
            color:
              "bg-amber-50 border-amber-200 text-amber-700",
          },
          {
            label: "Unread",
            count: unreadNotifications.length,
            color:
              "bg-blue-50 border-blue-200 text-blue-700",
          },
          {
            label: "Completed",
            count: userNotifications.filter((n) => n.kind === "success").length,
            color:
              "bg-emerald-50 border-emerald-200 text-emerald-700",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`border rounded-xl p-4 text-center ${s.color}`}
          >
            <p className="text-2xl font-black">{s.count}</p>
            <p className="text-xs font-semibold">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      {userNotifications.map((alert) => (
        <button
          key={alert.id}
          type="button"
          onClick={() => handleClick(alert.id, alert.view, alert.applicantId)}
          className={`w-full text-left flex gap-3 p-4 rounded-xl border text-sm transition-colors hover:opacity-95 ${
            alert.kind === "warning" || alert.kind === "action"
              ? "bg-amber-50 border-amber-200"
              : alert.kind === "success"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-blue-50 border-blue-200"
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              alert.kind === "warning" || alert.kind === "action"
                ? "text-amber-500"
                : alert.kind === "success"
                  ? "text-emerald-500"
                  : "text-blue-500"
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 font-medium">{alert.title}</p>
            <p className="text-gray-600 text-sm mt-0.5">{alert.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {timeAgo(alert.timestamp)}
            </p>
          </div>
          {!alert.read && (
            <span className="text-xs font-semibold text-gray-500 shrink-0 self-start">
              Unread
            </span>
          )}
        </button>
      ))}
      {userNotifications.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No notifications.</p>
      )}
    </div>
  );
}
