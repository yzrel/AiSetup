/**
 * Author: Yzrel Jade B. Eborde
 *
 * Sent Emails view — shows the simulated email outbox (printables sent to
 * DOST and signed-document receipts). Staff see office-scoped traffic;
 * clients see their own emails.
 */

import { useEffect, useState } from "react";
import { FileText, Inbox, Mail, Paperclip } from "lucide-react";
import { AuthUser, authStore } from "../store/authStore";
import { emailOutboxStore, OutboxEmail } from "../store/emailOutboxStore";
import { MODULE_HEADER } from "./moduleTheme";

const DOST_BLUE = "#0C2461";
const DOST_MID = "#1a3a7a";

function kindBadge(kind: OutboxEmail["kind"]) {
  return kind === "printable"
    ? { label: "Printable", cls: "bg-blue-100 text-blue-800" }
    : { label: "Signed receipt", cls: "bg-emerald-100 text-emerald-800" };
}

export function EmailOutbox({ user }: { user: AuthUser }) {
  const [emails, setEmails] = useState<OutboxEmail[]>(
    emailOutboxStore.getForUser(user),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const reload = () => setEmails(emailOutboxStore.getForUser(user));
    reload();
    return emailOutboxStore.subscribe(reload);
  }, [user.id]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className={`${MODULE_HEADER} text-white`}
          style={{
            background: `linear-gradient(135deg,${DOST_BLUE} 0%,${DOST_MID} 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-800" />
            </div>
            <div>
              <h1 className="text-xl font-black">Sent Emails</h1>
              <p className="text-white/60 text-sm">
                {authStore.isStaff(user.role)
                  ? "Documents and receipts emailed through aiSETUP for your office"
                  : "Documents you sent to DOST and receipts you received"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            Email delivery is currently simulated — messages are recorded here
            instead of being sent through a live mail server.
          </div>

          {emails.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Inbox className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm font-semibold">No emails yet</p>
              <p className="text-xs mt-1">
                Emails appear here when documents are sent to DOST or signed
                copies are uploaded.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => {
                const badge = kindBadge(email.kind);
                const expanded = expandedId === email.id;
                return (
                  <div
                    key={email.id}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : email.id)
                      }
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(email.sentAt).toLocaleString("en-PH")}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1 truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        To: {email.to.join(", ") || "—"}
                        {email.cc.length > 0 && ` · Cc: ${email.cc.join(", ")}`}
                      </p>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 border border-gray-100 rounded-lg p-3">
                          {email.body}
                        </pre>
                        {email.attachments.length > 0 && (
                          <div className="space-y-1.5">
                            {email.attachments.map((att, i) => (
                              <div
                                key={`${att.fileName}-${i}`}
                                className="flex items-center gap-2 text-xs text-gray-600"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                                {att.dataUrl ? (
                                  <a
                                    href={att.dataUrl}
                                    download={att.fileName}
                                    className="text-blue-700 font-semibold hover:underline"
                                  >
                                    {att.fileName}
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                                    {att.fileName}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[11px] text-gray-400">
                          Sent by {email.sentBy}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
