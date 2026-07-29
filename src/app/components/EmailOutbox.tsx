/**
 * Author: Yzrel Jade B. Eborde
 *
 * Sent Emails view — shows the simulated email outbox (printables sent to
 * DOST and signed-document receipts). Staff see office-scoped traffic with
 * client filtering; under Administration.
 */

import { useEffect, useMemo, useState } from "react";
import { FileText, Inbox, Mail, Paperclip, Search, Building2 } from "lucide-react";
import { AuthUser, authStore } from "../store/authStore";
import { applicantStore } from "../store/applicantStore";
import {
  emailOutboxStore,
  OutboxAttachment,
  OutboxEmail,
} from "../store/emailOutboxStore";
import { getApplicantsForStaff } from "../utils/provincialOffice";
import { MODULE_HEADER } from "./moduleTheme";
import { SubmittedFileActions } from "./SubmittedFileActions";

const DOST_BLUE = "#0C2461";
const DOST_MID = "#1a3a7a";

function OutboxAttachmentRow({
  attachment,
  applicantId,
}: {
  attachment: OutboxAttachment;
  applicantId?: string;
}) {
  const canResolve = Boolean(
    attachment.dataUrl || (attachment.fileId && applicantId) || attachment.fileName,
  );

  if (!canResolve) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-gray-400" />
          {attachment.fileName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 text-xs text-gray-600 py-1">
      <div className="flex items-center gap-2 min-w-0">
        <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="truncate font-medium text-gray-700">{attachment.fileName}</span>
      </div>
      <SubmittedFileActions
        fileName={attachment.fileName}
        mimeType={attachment.mimeType}
        dataUrl={attachment.dataUrl}
        fileId={attachment.fileId}
        applicantId={applicantId}
        compact
      />
    </div>
  );
}

function kindBadge(kind: OutboxEmail["kind"]) {
  return kind === "printable"
    ? { label: "Printable", cls: "bg-blue-100 text-blue-800" }
    : { label: "Signed receipt", cls: "bg-emerald-100 text-emerald-800" };
}

function clientLabel(applicantId?: string): string {
  if (!applicantId) return "Unlinked / system";
  const a = applicantStore.getById(applicantId);
  if (!a) return `Case ${applicantId}`;
  const name = a.enterpriseName || a.applicantName || "Unknown enterprise";
  return a.applicationId ? `${name} — ${a.applicationId}` : name;
}

export function EmailOutbox({ user }: { user: AuthUser }) {
  const isStaff = authStore.isStaff(user.role);
  const [emails, setEmails] = useState<OutboxEmail[]>(
    emailOutboxStore.getForUser(user),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const reload = () => setEmails(emailOutboxStore.getForUser(user));
    reload();
    return emailOutboxStore.subscribe(reload);
  }, [user.id]);

  const clientOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const e of emails) {
      if (e.applicantId) ids.add(e.applicantId);
    }
    const staffClients = isStaff ? getApplicantsForStaff(user) : [];
    const options = [...ids].map((id) => {
      const fromStore = staffClients.find((a) => a.id === id);
      const a = fromStore ?? applicantStore.getById(id);
      return {
        id,
        label: a
          ? `${a.enterpriseName || a.applicantName} — ${a.applicationId}`
          : `Case ${id}`,
      };
    });
    options.sort((a, b) => a.label.localeCompare(b.label));
    return options;
  }, [emails, isStaff, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return emails.filter((e) => {
      if (clientFilter !== "all") {
        if (clientFilter === "unlinked") {
          if (e.applicantId) return false;
        } else if (e.applicantId !== clientFilter) {
          return false;
        }
      }
      if (!q) return true;
      const hay = [
        e.subject,
        e.body,
        e.to.join(" "),
        e.cc.join(" "),
        e.sentBy,
        e.module ?? "",
        clientLabel(e.applicantId),
        ...(e.attachments.map((a) => a.fileName)),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [emails, clientFilter, search]);

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
                Documents and receipts emailed through aiSETUP — filter by client
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            Email delivery is currently simulated — messages are recorded here
            instead of being sent through a live mail server.
          </div>

          {isStaff && (
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search subject, recipient, module…"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="relative sm:min-w-[260px]">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none bg-white"
                >
                  <option value="all">All clients</option>
                  <option value="unlinked">Unlinked / system</option>
                  {clientOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Inbox className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm font-semibold">
                {emails.length === 0 ? "No emails yet" : "No matching emails"}
              </p>
              <p className="text-xs mt-1">
                {emails.length === 0
                  ? "Emails appear here when documents are sent to DOST or signed copies are uploaded."
                  : "Try another client or clear the search."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {isStaff && (
                <p className="text-xs text-gray-400">
                  Showing {filtered.length} of {emails.length} email
                  {emails.length === 1 ? "" : "s"}
                </p>
              )}
              {filtered.map((email) => {
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
                        {isStaff && (
                          <span className="text-[10px] font-semibold text-[#0C2461] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                            {clientLabel(email.applicantId)}
                          </span>
                        )}
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
                              <OutboxAttachmentRow
                                key={`${att.fileName}-${att.fileId ?? i}`}
                                attachment={att}
                                applicantId={email.applicantId}
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-[11px] text-gray-400">
                          Sent by {email.sentBy}
                          {email.module ? ` · Module: ${email.module}` : ""}
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
