/**
 * Author: Yzrel Jade B. Eborde
 *
 * RTEC committee members leave read-only review notes on prior modules;
 * notes append into Form 002 Section IV Recommendation.
 */

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import type { AuthUser, AdminView } from "../store/authStore";
import { applicantStore } from "../store/applicantStore";
import {
  appendRtecReviewComment,
  getRtecReviewComments,
  RTEC_REVIEW_SOURCE_LABELS,
} from "../utils/rtecReport";
import { DOST_BLUE } from "./moduleTheme";

export function RtecReviewCommentPanel({
  user,
  applicantId,
  sourceView,
}: {
  user: AuthUser;
  applicantId: string | null | undefined;
  sourceView: AdminView;
}) {
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [, bump] = useState(0);

  const applicant = applicantId ? applicantStore.getById(applicantId) : null;
  const comments = getRtecReviewComments(applicant).filter(
    (c) => c.sourceView === sourceView,
  );
  const sourceLabel =
    RTEC_REVIEW_SOURCE_LABELS[sourceView] ?? String(sourceView);

  const handleAdd = () => {
    if (!applicantId || !text.trim()) return;
    const added = appendRtecReviewComment(
      applicantId,
      user,
      sourceView,
      text,
    );
    if (!added) return;
    setText("");
    setNotice("Comment added to RTEC Form 002 Section IV Recommendation.");
    bump((n) => n + 1);
    setTimeout(() => setNotice(""), 4000);
  };

  return (
    <div className="rounded-xl border border-[#0C2461]/25 bg-blue-50/60 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <MessageSquarePlus
          className="w-4 h-4 mt-0.5 shrink-0"
          style={{ color: DOST_BLUE }}
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0C2461]">
            RTEC review comments — {sourceLabel}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Read-only review. Comments are forwarded into Form 002 Section IV
            Recommendation without replacing existing narrative.
          </p>
        </div>
      </div>

      {!applicantId ? (
        <p className="text-xs text-amber-800">
          Select an applicant to leave RTEC review comments.
        </p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Clarifications, findings, or recommendation notes…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!text.trim()}
            className="px-3 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-40"
            style={{ background: DOST_BLUE }}
          >
            Add to RTEC recommendation
          </button>
          {notice && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {notice}
            </p>
          )}
          {comments.length > 0 && (
            <ul className="space-y-2 pt-1">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="text-xs text-gray-700 bg-white border border-gray-100 rounded-lg px-3 py-2"
                >
                  <p className="font-semibold text-gray-800">
                    {c.authorName}{" "}
                    <span className="font-normal text-gray-400">
                      · {new Date(c.at).toLocaleString()}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
