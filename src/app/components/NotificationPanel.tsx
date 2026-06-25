/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { AuthUser, AdminView } from "../store/authStore";
import { notificationStore, AppNotification } from "../store/notificationStore";
import { staffContextStore } from "../store/staffContextStore";
import { timeAgo } from "../utils/timeAgo";

function kindIcon(kind: AppNotification["kind"]) {
  if (kind === "success") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (kind === "warning" || kind === "action")
    return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <Info className="w-4 h-4 text-blue-500" />;
}

interface NotificationPanelProps {
  user: AuthUser;
  onClose: () => void;
  onNavigate?: (view: AdminView) => void;
}

export function NotificationPanel({
  user,
  onClose,
  onNavigate,
}: NotificationPanelProps) {
  const [, bump] = useState(0);

  useEffect(() => notificationStore.subscribe(() => bump((n) => n + 1)), []);

  const notifs = notificationStore.getForUser(user);

  const handleClick = (n: AppNotification) => {
    notificationStore.markRead(n.id);
    if (n.view && onNavigate) {
      if (n.applicantId) {
        staffContextStore.setSelectedApplicant(n.applicantId);
      }
      onNavigate(n.view);
      onClose();
    }
  };

  return (
    <div className="fixed z-50 left-3 right-3 top-[3.75rem] max-h-[calc(100vh-5rem)] flex flex-col sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(24rem,calc(100vw-2rem))] sm:max-h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#0C2461]" />
          Notifications
        </h3>
        <div className="flex gap-2 items-center">
          {notifs.some((n) => !n.read) && (
            <button
              type="button"
              onClick={() => notificationStore.markAllRead(user)}
              className="text-xs text-[#0C2461] hover:underline font-medium"
            >
              Mark all read
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
        {notifs.length === 0 && (
          <p className="p-6 text-sm text-gray-400 text-center">No notifications yet.</p>
        )}
        {notifs.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => handleClick(n)}
            className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
              !n.read ? "bg-blue-50/40" : ""
            }`}
          >
            <div className="mt-0.5 shrink-0">{kindIcon(n.kind)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-sm leading-tight ${
                    !n.read ? "font-bold text-gray-900" : "font-medium text-gray-700"
                  }`}
                >
                  {n.title}
                </p>
                {n.urgent && (
                  <span className="shrink-0 text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    URGENT
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
              <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
            </div>
            {!n.read && (
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface NotificationBellProps {
  user: AuthUser;
  onNavigate?: (view: AdminView) => void;
}

export function NotificationBell({ user, onNavigate }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [, bump] = useState(0);

  useEffect(() => notificationStore.subscribe(() => bump((n) => n + 1)), []);

  const unread = notificationStore.getUnreadCount(user);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors shrink-0"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-gray-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center border-2 border-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <NotificationPanel
            user={user}
            onClose={() => setOpen(false)}
            onNavigate={onNavigate}
          />
        </>
      )}
    </div>
  );
}
