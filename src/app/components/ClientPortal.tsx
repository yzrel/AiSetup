/**
 * Author: Yzrel Jade B. Eborde
 */

// Client community portal — currently disabled.
// Applicants use Register → Login → aiSETUP application workflow instead.
// See App.tsx (ClientPortal import/routing commented out).
// NOTE: WithdrawalViewer tranche model is deprecated in favor of Modules 11–17
// in LandBankAndWithdrawal, ProcurementAndLiquidation, and RefundAndDelinquent.

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  FileText,
  Image,
  Heart,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  ThumbsUp,
  Eye,
  Flag,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Info,
  Smartphone,
  Mail,
  Globe,
  Package,
  Camera,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Home,
  Activity,
  Layers,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  clientPortalStore,
  FeedPost,
  Equipment,
  Notification,
  TrackingStep,
  WithdrawalTranche,
  Comment,
} from "../store/clientPortalStore";
import { AuthUser } from "../store/authStore";
import { DOSTChatbot } from "./DOSTChatbot";

// ── Helpers ───────────────────────────────────────────────────────────────────

const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const MY_CLIENT_ID = "c1"; // current user

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  initials,
  color,
  size = "md",
  src,
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
  src?: string;
}) {
  const sz =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
        ? "w-12 h-12 text-base"
        : "w-10 h-10 text-sm";
  return src ? (
    <img
      src={src}
      alt={initials}
      className={`${sz} rounded-full object-cover shrink-0 border-2 border-white shadow`}
    />
  ) : (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-black text-white shrink-0 border-2 border-white shadow`}
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

// ── Notification Panel ────────────────────────────────────────────────────────

function NotificationPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [, forceUpdate] = useState(0);
  useEffect(
    () =>
      clientPortalStore.subscribe(() =>
        forceUpdate((n) => n + 1),
      ),
    [],
  );
  const notifs = clientPortalStore.getNotifications();

  const typeIcon = (type: string) => {
    if (type === "sms")
      return <Smartphone className="w-4 h-4 text-green-500" />;
    if (type === "email")
      return <Mail className="w-4 h-4 text-blue-500" />;
    return <Globe className="w-4 h-4 text-purple-500" />;
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-gray-800 text-sm">
          Notifications
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => clientPortalStore.markAllRead()}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Mark all read
          </button>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {notifs.map((n) => (
          <div
            key={n.id}
            onClick={() => clientPortalStore.markRead(n.id)}
            className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}
          >
            <div className="mt-0.5">{typeIcon(n.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-sm leading-tight ${!n.read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}
                >
                  {n.title}
                </p>
                {n.urgent && (
                  <span className="shrink-0 text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    URGENT
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                {n.message}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {timeAgo(n.timestamp)}
              </p>
            </div>
            {!n.read && (
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Application Tracker (Anti-Red Tape Act) ───────────────────────────────────

function ApplicationTracker() {
  const steps = clientPortalStore.getTrackingSteps();
  const [expandedStep, setExpandedStep] = useState<
    string | null
  >("ts7");

  const statusConfig = {
    completed: {
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      label: "Completed",
    },
    current: {
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-200",
      label: "In Progress",
    },
    "action-required": {
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "Action Required",
    },
    pending: {
      icon: Clock,
      color: "text-gray-400",
      bg: "bg-gray-50",
      border: "border-gray-200",
      label: "Pending",
    },
  };

  return (
    <div className="space-y-4">
      {/* Anti-Red Tape notice */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">
            Protected by the Anti-Red Tape Act (RA 11032)
          </p>
          <p className="text-blue-200 text-xs mt-0.5">
            Your application is tracked against legal processing
            timelines. If a step exceeds the allowed period, you
            have the right to file a complaint with the Civil
            Service Commission.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const cfg = statusConfig[step.status];
          const Icon = cfg.icon;
          const isExpanded = expandedStep === step.id;

          return (
            <div
              key={step.id}
              className={`border rounded-2xl overflow-hidden transition-all ${cfg.border} ${step.status === "action-required" ? "ring-2 ring-red-200" : ""}`}
            >
              <button
                onClick={() =>
                  setExpandedStep(isExpanded ? null : step.id)
                }
                className={`w-full flex items-center gap-3 p-4 text-left ${cfg.bg} hover:brightness-95 transition-all`}
              >
                {/* Step connector line */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step.status === "completed"
                        ? "bg-emerald-500 border-emerald-500"
                        : step.status === "action-required"
                          ? "bg-red-500 border-red-500"
                          : step.status === "current"
                            ? "bg-blue-500 border-blue-500"
                            : "bg-white border-gray-300"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span
                        className={`text-xs font-black ${step.status === "pending" ? "text-gray-400" : "text-white"}`}
                      >
                        {step.step}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`font-bold text-sm ${step.status === "pending" ? "text-gray-400" : "text-gray-800"}`}
                    >
                      {step.label}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                    {step.status === "action-required" && (
                      <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                        ⚠️ ACTION NEEDED
                      </span>
                    )}
                  </div>
                  {step.completedAt && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Completed: {step.completedAt}
                    </p>
                  )}
                  {step.dueDate &&
                    step.status !== "completed" && (
                      <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                        Due: {step.dueDate}
                      </p>
                    )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-3">
                  <p className="text-sm text-gray-600">
                    {step.description}
                  </p>

                  {step.actionRequired && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-700 mb-0.5">
                          What you need to do:
                        </p>
                        <p className="text-xs text-red-600">
                          {step.actionRequired}
                        </p>
                      </div>
                    </div>
                  )}

                  {step.legalBasis && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-600">
                        <span className="font-bold">
                          Legal Basis:
                        </span>{" "}
                        {step.legalBasis}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Withdrawal Tranche Viewer ─────────────────────────────────────────────────

function WithdrawalViewer() {
  const [, forceUpdate] = useState(0);
  useEffect(
    () =>
      clientPortalStore.subscribe(() =>
        forceUpdate((n) => n + 1),
      ),
    [],
  );
  const tranches = clientPortalStore.getTranches();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    trancheId: 1 | 2;
    docId: string;
  } | null>(null);

  const statusConfig = {
    "on-hold": {
      label: "On Hold",
      color: "text-red-600",
      bg: "bg-red-100",
      border: "border-red-200",
      icon: XCircle,
    },
    processing: {
      label: "Processing",
      color: "text-amber-600",
      bg: "bg-amber-100",
      border: "border-amber-200",
      icon: Clock,
    },
    released: {
      label: "Released",
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      border: "border-emerald-200",
      icon: CheckCircle,
    },
  };

  const docStatusConfig = {
    missing: {
      color: "text-red-500",
      bg: "bg-red-50",
      label: "Missing",
      icon: XCircle,
    },
    uploaded: {
      color: "text-amber-600",
      bg: "bg-amber-50",
      label: "Under Review",
      icon: Clock,
    },
    approved: {
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      label: "Approved",
      icon: CheckCircle,
    },
    rejected: {
      color: "text-red-600",
      bg: "bg-red-50",
      label: "Rejected",
      icon: AlertTriangle,
    },
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      clientPortalStore.uploadDocument(
        uploadTarget.trancheId,
        uploadTarget.docId,
        file.name,
      );
      setUploadTarget(null);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Important notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800 text-sm">
            Your withdrawals are currently on hold
          </p>
          <p className="text-amber-700 text-xs mt-0.5">
            Complete the required document checklists below to
            release your funds. Under RA 11032, agencies may
            only require documents listed at the time of
            application — no additional requirements can be
            added.
          </p>
        </div>
      </div>

      {tranches.map((tranche) => {
        const sc = statusConfig[tranche.status];
        const StatusIcon = sc.icon;
        const requiredDocs = tranche.requirements.filter(
          (r) => r.required,
        );
        const uploadedRequired = requiredDocs.filter(
          (r) => r.uploaded,
        ).length;
        const progressPct = Math.round(
          (uploadedRequired / requiredDocs.length) * 100,
        );

        return (
          <div
            key={tranche.id}
            className={`border-2 ${tranche.status === "on-hold" ? "border-red-200" : tranche.status === "processing" ? "border-amber-200" : "border-emerald-200"} rounded-2xl overflow-hidden`}
          >
            {/* Tranche header */}
            <div
              className={`px-5 py-4 ${tranche.status === "on-hold" ? "bg-red-50" : tranche.status === "processing" ? "bg-amber-50" : "bg-emerald-50"}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-gray-800 text-base">
                      {tranche.label}
                    </h3>
                    <span
                      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.color} ${sc.border}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />{" "}
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">
                    {tranche.amount}
                  </p>
                </div>

                {/* Progress */}
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">
                    Documents: {uploadedRequired}/
                    {requiredDocs.length} required
                  </p>
                  <div className="w-36 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progressPct === 100 ? "bg-emerald-500" : progressPct > 50 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {progressPct}% complete
                  </p>
                </div>
              </div>

              {tranche.holdReason && (
                <p className="text-xs text-gray-600 mt-2 bg-white/60 rounded-lg px-3 py-2 border border-gray-200">
                  {tranche.holdReason}
                </p>
              )}
              {tranche.status === "released" &&
                tranche.releaseDate && (
                  <p className="text-xs text-emerald-700 font-semibold mt-2">
                    ✅ Released on {tranche.releaseDate}
                  </p>
                )}
            </div>

            {/* Document checklist */}
            <div className="p-5 bg-white space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Document Checklist
              </p>
              {tranche.requirements.map((doc) => {
                const dc = docStatusConfig[doc.status];
                const DocIcon = dc.icon;
                return (
                  <div
                    key={doc.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${dc.bg} ${doc.status === "missing" ? "border-red-100" : "border-gray-100"}`}
                  >
                    <DocIcon
                      className={`w-5 h-5 shrink-0 mt-0.5 ${dc.color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">
                          {doc.name}
                        </p>
                        {doc.required && (
                          <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            REQUIRED
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${dc.color} ${dc.bg}`}
                        >
                          {dc.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {doc.description}
                      </p>
                      {doc.uploadedFile && (
                        <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                          📎 {doc.uploadedFile}
                        </p>
                      )}
                      {doc.rejectionReason && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">
                          Reason: {doc.rejectionReason}
                        </p>
                      )}
                    </div>
                    {(doc.status === "missing" ||
                      doc.status === "rejected") &&
                      tranche.status !== "released" && (
                        <button
                          onClick={() => {
                            setUploadTarget({
                              trancheId: tranche.id,
                              docId: doc.id,
                            });
                            fileRef.current?.click();
                          }}
                          className="shrink-0 flex items-center gap-1.5 bg-[#0C2461] hover:bg-blue-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />{" "}
                          Upload
                        </button>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Equipment Card ────────────────────────────────────────────────────────────

function EquipmentCard({
  item,
  myId,
}: {
  item: Equipment;
  myId: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [, forceUpdate] = useState(0);
  useEffect(
    () =>
      clientPortalStore.subscribe(() =>
        forceUpdate((n) => n + 1),
      ),
    [],
  );

  const liked = item.likes.includes(myId);

  const statusConfig = {
    "pending-review": {
      label: "Peer Review Pending",
      color: "text-amber-700",
      bg: "bg-amber-100",
      icon: Clock,
    },
    approved: {
      label: "✅ Approved by Peers",
      color: "text-emerald-700",
      bg: "bg-emerald-100",
      icon: CheckCircle,
    },
    flagged: {
      label: "⚠️ Flagged — Action Needed",
      color: "text-red-700",
      bg: "bg-red-100",
      icon: Flag,
    },
    rejected: {
      label: "❌ Rejected",
      color: "text-red-700",
      bg: "bg-red-100",
      icon: XCircle,
    },
  };
  const sc = statusConfig[item.status];

  const sendComment = () => {
    if (!comment.trim()) return;
    clientPortalStore.commentEquipment(item.id, {
      clientId: myId,
      clientName: "Juan Dela Cruz",
      avatarInitials: "JD",
      text: comment.trim(),
      timestamp: new Date().toISOString(),
      likes: [],
    });
    setComment("");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <Avatar
          initials={item.clientName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
          color={
            clientPortalStore.AVATAR_COLORS[
              parseInt(item.clientId.replace("c", "")) % 7
            ]
          }
          size="md"
        />
        <div className="flex-1">
          <p className="font-bold text-gray-800 text-sm">
            {item.clientName}
          </p>
          <p className="text-xs text-gray-500">
            {item.enterpriseName}
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full ${sc.bg} ${sc.color}`}
        >
          {sc.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="font-bold text-gray-800 text-sm mb-1">
          📦 {item.name}
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          {item.description}
        </p>

        {/* Equipment photo placeholder */}
        <div className="mt-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-36 flex items-center justify-center border border-gray-200">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="text-center text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-1" />
              <p className="text-xs">
                Equipment photo not yet uploaded
              </p>
            </div>
          )}
        </div>

        {/* Review note */}
        {item.reviewNote && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs ${
              item.status === "approved"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : item.status === "flagged"
                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                  : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            <span className="font-bold">
              Peer Review Note:{" "}
            </span>
            {item.reviewNote}
          </div>
        )}

        <p className="text-[10px] text-gray-400 mt-2">
          {item.submittedAt}
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-4">
        <button
          onClick={() =>
            clientPortalStore.likeEquipment(item.id, myId)
          }
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${liked ? "text-blue-600" : "text-gray-500 hover:text-blue-600"}`}
        >
          <ThumbsUp
            className={`w-4 h-4 ${liked ? "fill-blue-600" : ""}`}
          />
          {item.likes.length}{" "}
          {item.likes.length === 1 ? "Like" : "Likes"}
        </button>
        <button
          onClick={() => setShowComments((p) => !p)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {item.comments.length} Comments
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-3">
          {item.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar
                initials={c.avatarInitials}
                color={
                  clientPortalStore.AVATAR_COLORS[
                    parseInt(c.clientId.replace("c", "")) % 7
                  ]
                }
                size="sm"
              />
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-gray-700">
                  {c.clientName}
                </p>
                <p className="text-xs text-gray-600">
                  {c.text}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {timeAgo(c.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Avatar initials="JD" color="#0C2461" size="sm" />
            <div className="flex-1 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && sendComment()
                }
                placeholder="Write a comment..."
                className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={sendComment}
                disabled={!comment.trim()}
                className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feed Post Card ────────────────────────────────────────────────────────────

function PostCard({
  post,
  myId,
}: {
  post: FeedPost;
  myId: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [, forceUpdate] = useState(0);
  useEffect(
    () =>
      clientPortalStore.subscribe(() =>
        forceUpdate((n) => n + 1),
      ),
    [],
  );

  const liked = post.likes.includes(myId);

  const typeLabel = {
    "equipment-update": {
      label: "📦 Equipment Update",
      color: "bg-blue-100 text-blue-700",
    },
    "status-update": {
      label: "📊 Status Update",
      color: "bg-green-100 text-green-700",
    },
    milestone: {
      label: "🏆 Milestone",
      color: "bg-amber-100 text-amber-700",
    },
    general: {
      label: "💬 Discussion",
      color: "bg-gray-100 text-gray-600",
    },
  }[post.type];

  const sendComment = () => {
    if (!comment.trim()) return;
    clientPortalStore.commentPost(post.id, {
      clientId: myId,
      clientName: "Juan Dela Cruz",
      avatarInitials: "JD",
      text: comment.trim(),
      timestamp: new Date().toISOString(),
      likes: [],
    });
    setComment("");
    setShowComments(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar
          initials={post.avatarInitials}
          color={post.avatarColor}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-800 text-sm">
              {post.clientName}
            </p>
            <span className="text-gray-400 text-xs">·</span>
            <p className="text-xs text-gray-500">
              {post.enterpriseName}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-gray-400">
              {timeAgo(post.timestamp)}
            </p>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeLabel.color}`}
            >
              {typeLabel.label}
            </span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Tranche status badge */}
      {post.trancheStatus && (
        <div className="mx-4 mb-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />{" "}
          {post.trancheStatus}
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Image */}
        {post.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden">
            <img
              src={post.imageUrl}
              alt="post"
              className="w-full object-cover max-h-64"
            />
          </div>
        )}
      </div>

      {/* Reaction summary */}
      {(post.likes.length > 0 || post.comments.length > 0) && (
        <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-400 border-t border-gray-50">
          <span>
            {post.likes.length > 0 && `👍 ${post.likes.length}`}
          </span>
          <span>
            {post.comments.length > 0 &&
              `${post.comments.length} comment${post.comments.length > 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 py-2 flex items-center gap-1 border-t border-gray-100">
        <button
          onClick={() =>
            clientPortalStore.likePost(post.id, myId)
          }
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-xl transition-colors ${liked ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <ThumbsUp
            className={`w-4 h-4 ${liked ? "fill-blue-600" : ""}`}
          />
          Like
        </button>
        <button
          onClick={() => setShowComments((p) => !p)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 py-1.5 rounded-xl transition-colors"
        >
          <MessageCircle className="w-4 h-4" /> Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 py-1.5 rounded-xl transition-colors">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar
                initials={c.avatarInitials}
                color={
                  clientPortalStore.AVATAR_COLORS[
                    parseInt(c.clientId.replace("c", "")) % 7
                  ]
                }
                size="sm"
              />
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-gray-700">
                  {c.clientName}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {c.text}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() =>
                      clientPortalStore.likePost(c.id, myId)
                    }
                    className="text-[10px] text-gray-400 hover:text-blue-500 font-semibold"
                  >
                    👍 Like{" "}
                    {c.likes.length > 0 && c.likes.length}
                  </button>
                  <span className="text-[10px] text-gray-300">
                    {timeAgo(c.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {/* New comment input */}
          <div className="flex gap-2 mt-2">
            <Avatar initials="JD" color="#0C2461" size="sm" />
            <div className="flex-1 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && sendComment()
                }
                placeholder="Write a comment..."
                className="flex-1 bg-gray-100 rounded-2xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={sendComment}
                disabled={!comment.trim()}
                className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Post Composer ─────────────────────────────────────────────────────────

function PostComposer() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<FeedPost["type"]>("general");

  const submit = () => {
    if (!content.trim()) return;
    clientPortalStore.addPost({
      clientId: MY_CLIENT_ID,
      clientName: "Juan Dela Cruz",
      enterpriseName: "ABC Food Processing",
      avatarInitials: "JD",
      avatarColor: "#0C2461",
      content: content.trim(),
      type,
    });
    setContent("");
    setOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex gap-3">
        <Avatar initials="JD" color="#0C2461" size="md" />
        <button
          onClick={() => setOpen(true)}
          className="flex-1 text-left bg-gray-100 hover:bg-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-400 transition-colors"
        >
          Share an update about your SETUP journey...
        </button>
      </div>

      {open && (
        <div className="mt-3 border-t border-gray-100 pt-3 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(
              [
                "general",
                "equipment-update",
                "status-update",
                "milestone",
              ] as FeedPost["type"][]
            ).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${type === t ? "bg-[#0C2461] text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
              >
                {t === "general"
                  ? "💬 Discussion"
                  : t === "equipment-update"
                    ? "📦 Equipment"
                    : t === "status-update"
                      ? "📊 Status"
                      : "🏆 Milestone"}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="What's your SETUP update? Tips, milestones, questions — share with the community!"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setContent("");
              }}
              className="text-xs text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!content.trim()}
              className="text-xs font-bold bg-[#0C2461] text-white px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-blue-800 transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shield Icon helper ────────────────────────────────────────────────────────

function Shield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

// ── Main Client Portal ────────────────────────────────────────────────────────

interface ClientPortalProps {
  user: AuthUser;
  onLogout: () => void;
}

type PortalTab =
  | "feed"
  | "tracker"
  | "withdrawal"
  | "equipment"
  | "notifications";

export function ClientPortal({
  user,
  onLogout,
}: ClientPortalProps) {
  const [activeTab, setActiveTab] = useState<PortalTab>("feed");
  const [showNotifs, setShowNotifs] = useState(false);
  const [, forceUpdate] = useState(0);
  useEffect(
    () =>
      clientPortalStore.subscribe(() =>
        forceUpdate((n) => n + 1),
      ),
    [],
  );

  const unread = clientPortalStore.getUnreadCount();
  const equipment = clientPortalStore.getEquipment();
  const posts = clientPortalStore.getFeedPosts();

  const tabs: {
    id: PortalTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: "feed", label: "Community", icon: Home },
    { id: "tracker", label: "My Application", icon: Activity },
    { id: "withdrawal", label: "Withdrawals", icon: Layers },
    { id: "equipment", label: "Equipment", icon: Package },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: unread,
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#F0F2F5]"
      style={{
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Top Header ── */}
      <header className="bg-[#0C2461] text-white h-14 flex items-center px-4 sm:px-6 fixed top-0 left-0 right-0 z-40 shadow-lg">
        <div className="flex items-center gap-2.5">
          {/* <img
            src="/assets/dost-logo-mark.png"
            alt="DOST"
            className="w-7 h-7 object-contain opacity-80"
          /> */}
          <div>
            <span className="font-black text-sm text-white">
              ai
            </span>
            <span className="font-black text-sm text-[#00AEEF]">
              SETUP
            </span>
            <span className="text-white/40 text-xs ml-2 hidden sm:inline">
              Client Portal
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Disclaimer badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mr-3">
          <Users className="w-3 h-3 text-[#00AEEF]" />
          <span className="text-[10px] font-semibold text-white/70">
            Client-to-Client Community — Independent of DOST
          </span>
        </div>

        {/* Notifications */}
        <div className="relative mr-3">
          <button
            onClick={() => setShowNotifs((p) => !p)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-[#0C2461]">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <NotificationPanel
              onClose={() => setShowNotifs(false)}
            />
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#00AEEF] flex items-center justify-center font-black text-xs text-white">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <button
            onClick={onLogout}
            className="text-white/50 hover:text-white text-xs hidden sm:block transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="pt-14 max-w-6xl mx-auto px-3 sm:px-4 py-4 flex gap-4">
        {/* ── Left sidebar — desktop tabs ── */}
        <aside className="hidden md:flex flex-col gap-1 w-52 shrink-0 sticky top-20 h-fit">
          {/* User card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-2 text-center">
            <div className="w-14 h-14 rounded-full bg-[#0C2461] flex items-center justify-center font-black text-lg text-white mx-auto mb-2">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <p className="font-bold text-gray-800 text-sm">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.enterpriseName}
            </p>
            {user.applicationId && (
              <p className="text-[10px] font-mono text-gray-400 mt-1">
                {user.applicationId}
              </p>
            )}
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-2 py-1">
              <p className="text-[10px] text-amber-700 font-semibold">
                ⚠️ Withdrawal on hold
              </p>
            </div>
          </div>

          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors relative ${
                  activeTab === tab.id
                    ? "bg-[#0C2461] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Disclaimer */}
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
              ⚠️ <strong>Disclaimer:</strong> The Community &
              Equipment sections are purely client-to-client
              features. DOST has no involvement in, endorsement
              of, or responsibility for content posted here.
            </p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Mobile tab bar */}
          <div className="md:hidden flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[10px] font-bold relative min-w-[56px] transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#0C2461] text-white"
                      : "text-gray-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label.split(" ")[0]}
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Feed Tab ── */}
          {activeTab === "feed" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                <h2 className="font-black text-gray-800 text-base flex items-center gap-2">
                  <Home className="w-5 h-5 text-[#0C2461]" />{" "}
                  SETUP Client Community
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Connect with fellow SETUP awardees. Share
                  updates, tips, and milestones.
                  <span className="ml-1 font-semibold text-amber-600">
                    Not affiliated with DOST.
                  </span>
                </p>
              </div>
              <PostComposer />
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  myId={MY_CLIENT_ID}
                />
              ))}
            </div>
          )}

          {/* ── Application Tracker Tab ── */}
          {activeTab === "tracker" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                <h2 className="font-black text-gray-800 text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0C2461]" />{" "}
                  My Application Tracker
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track every step of your SETUP application
                  with Anti-Red Tape Act compliance timelines.
                </p>
              </div>
              <ApplicationTracker />
            </div>
          )}

          {/* ── Withdrawal Tab ── */}
          {activeTab === "withdrawal" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                <h2 className="font-black text-gray-800 text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0C2461]" />{" "}
                  Withdrawal Status
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  View the status of your 1st and 2nd tranche
                  withdrawals and complete missing documents.
                </p>
              </div>
              <WithdrawalViewer />
            </div>
          )}

          {/* ── Equipment Tab ── */}
          {activeTab === "equipment" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-gray-800 text-base flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#0C2461]" />{" "}
                      Equipment Sharing
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Submit your equipment for peer review.
                      Clients help each other verify equipment
                      choices.
                    </p>
                  </div>
                  <button className="flex items-center gap-1.5 bg-[#0C2461] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-800 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Submit
                  </button>
                </div>
                <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-amber-700 font-medium">
                    ⚠️ <strong>Community Review Only:</strong>{" "}
                    Equipment reviews here are from fellow
                    clients, not DOST officials. Always consult
                    your DOST provincial office for official
                    guidance.
                  </p>
                </div>
              </div>
              {equipment.map((eq) => (
                <EquipmentCard
                  key={eq.id}
                  item={eq}
                  myId={MY_CLIENT_ID}
                />
              ))}
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="font-black text-gray-800 text-base flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#0C2461]" />{" "}
                    Notifications
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                        {unread} new
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    SMS, email, and web notifications for your
                    application.
                  </p>
                </div>
                <button
                  onClick={() =>
                    clientPortalStore.markAllRead()
                  }
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Mark all read
                </button>
              </div>

              {clientPortalStore.getNotifications().map((n) => {
                const typeIcon =
                  n.type === "sms"
                    ? Smartphone
                    : n.type === "email"
                      ? Mail
                      : Globe;
                const TypeIcon = typeIcon;
                return (
                  <div
                    key={n.id}
                    onClick={() =>
                      clientPortalStore.markRead(n.id)
                    }
                    className={`bg-white rounded-2xl border shadow-sm p-4 flex gap-3 cursor-pointer hover:shadow-md transition-all ${
                      !n.read
                        ? "border-blue-200 ring-1 ring-blue-100"
                        : "border-gray-100"
                    } ${n.urgent ? "ring-2 ring-red-200 border-red-200" : ""}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        n.type === "sms"
                          ? "bg-green-100"
                          : n.type === "email"
                            ? "bg-blue-100"
                            : "bg-purple-100"
                      }`}
                    >
                      <TypeIcon
                        className={`w-5 h-5 ${n.type === "sms" ? "text-green-600" : n.type === "email" ? "text-blue-600" : "text-purple-600"}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm ${!n.read ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}
                        >
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {n.urgent && (
                            <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                              URGENT
                            </span>
                          )}
                          {!n.read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-0.5" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            n.type === "sms"
                              ? "bg-green-50 text-green-600"
                              : n.type === "email"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-purple-50 text-purple-600"
                          }`}
                        >
                          {n.type === "sms"
                            ? "📱 SMS"
                            : n.type === "email"
                              ? "📧 Email"
                              : "🌐 Web"}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {timeAgo(n.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── Right sidebar — desktop ── */}
        <aside className="hidden lg:flex flex-col gap-3 w-64 shrink-0 sticky top-20 h-fit">
          {/* Quick status */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Application Status
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  1st Tranche
                </span>
                <span className="font-bold text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> On Hold
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  2nd Tranche
                </span>
                <span className="font-bold text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> On Hold
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  Current Step
                </span>
                <span className="font-bold text-amber-600">
                  7 / 10
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2">
                <div
                  className="h-full bg-gradient-to-r from-[#0C2461] to-[#00AEEF] rounded-full"
                  style={{ width: "60%" }}
                />
              </div>
            </div>
            <button
              onClick={() => setActiveTab("withdrawal")}
              className="mt-3 w-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 py-2 rounded-xl hover:bg-red-100 transition-colors"
            >
              ⚠️ Complete Documents
            </button>
          </div>

          {/* Community activity */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Community Activity
            </p>
            <div className="space-y-2">
              {clientPortalStore
                .getFeedPosts()
                .slice(0, 3)
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setActiveTab("feed")}
                    className="flex gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
                  >
                    <Avatar
                      initials={p.avatarInitials}
                      color={p.avatarColor}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-gray-700 truncate">
                        {p.clientName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {p.content.slice(0, 40)}...
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <strong>⚠️ Important Notice:</strong>
              <br />
              The community features (posts, equipment reviews,
              comments) are independent client-to-client
              interactions.
              <strong>
                {" "}
                DOST has no affiliation, endorsement, or
                responsibility
              </strong>{" "}
              for content shared in the community section.
            </p>
          </div>
        </aside>
      </div>

            {/* AI Chatbot — available in Client Portal */}
      <DOSTChatbot />
    </div>
  );
}