/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect } from "react";
import {
  Search,
  Users,
  Shield,
  ShieldOff,
  KeyRound,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  Ban,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Save,
  UserCog,
} from "lucide-react";
import {
  applicantStore,
  Applicant,
  MODULE_LABELS,
} from "../store/applicantStore";
import { AuthUser } from "../store/authStore";
import { TnaForm01Preview, printTnaForm01 } from "./TnaForm01Preview";
import { TnaForm02Preview, printTnaForm02 } from "./TnaForm02Preview";
import type { Tna2StoredDocument } from "../api/types";

interface AccountManagementProps {
  user: AuthUser;
}

export function AccountManagement({ user }: AccountManagementProps) {
  const [accounts, setAccounts] = useState<Applicant[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "blocked">("all");
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showTnaPreview, setShowTnaPreview] = useState(false);
  const [showTna2Preview, setShowTna2Preview] = useState(false);

  const refresh = () =>
    setAccounts(applicantStore.getRegisteredAccounts());

  useEffect(() => {
    refresh();
    return applicantStore.subscribe(refresh);
  }, []);

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.applicantName.toLowerCase().includes(q) ||
      a.emailAddress.toLowerCase().includes(q) ||
      a.enterpriseName.toLowerCase().includes(q) ||
      a.applicationId.toLowerCase().includes(q);
    const blocked = applicantStore.isAccountBlocked(a);
    const matchFilter =
      filter === "all" ||
      (filter === "blocked" && blocked) ||
      (filter === "active" && !blocked);
    return matchSearch && matchFilter;
  });

  const activeCount = accounts.filter(
    (a) => !applicantStore.isAccountBlocked(a),
  ).length;
  const blockedCount = accounts.length - activeCount;

  const openAccount = (a: Applicant) => {
    setSelected(a);
    setShowTnaPreview(false);
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
  };

  const handlePasswordReset = () => {
    if (!selected) return;
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    applicantStore.setPassword(selected.id, newPassword);
    setMessage({ type: "success", text: "Password updated successfully." });
    setNewPassword("");
    setConfirmPassword("");
    refresh();
    setSelected(applicantStore.getById(selected.id) ?? null);
  };

  const handleToggleBlock = () => {
    if (!selected) return;
    const blocked = applicantStore.isAccountBlocked(selected);
    if (blocked) {
      applicantStore.unblockAccount(selected.id);
      setMessage({ type: "success", text: "Account unblocked. Applicant can sign in again." });
    } else {
      applicantStore.blockAccount(selected.id);
      setMessage({ type: "success", text: "Account blocked. Applicant cannot sign in." });
    }
    refresh();
    setSelected(applicantStore.getById(selected.id) ?? null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-[#0C2461]" />
            Account Management
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Monitor registered MSME accounts · Signed in as {user.firstName}{" "}
            {user.lastName} ({user.role === "admin" ? "Administrator" : "DOST Agent"})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0C2461]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#0C2461]" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{accounts.length}</p>
              <p className="text-xs text-gray-400">Registered accounts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{activeCount}</p>
              <p className="text-xs text-gray-400">Active accounts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{blockedCount}</p>
              <p className="text-xs text-gray-400">Blocked accounts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, enterprise, application ID..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "active", "blocked"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    filter === f
                      ? "bg-[#0C2461] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">
                No registered accounts found.
              </p>
            ) : (
              filtered.map((a) => {
                const blocked = applicantStore.isAccountBlocked(a);
                const isSelected = selected?.id === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => openAccount(a)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50/80" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {a.applicantName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{a.emailAddress}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.enterpriseName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            blocked
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {blocked ? "Blocked" : "Active"}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {a.applicationId}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center text-gray-400">
              <Shield className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Select an account to manage</p>
              <p className="text-xs mt-1 max-w-xs">
                View applicant details, reset passwords, or block and unblock access.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {selected.applicantName}
                  </h2>
                  <p className="text-xs font-mono text-gray-400">{selected.applicationId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-gray-300 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  {selected.emailAddress}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  {selected.contactNumber}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  {selected.enterpriseName}
                </div>
              </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    Application stage
                  </p>
                  <p className="font-semibold text-gray-700">
                    {MODULE_LABELS[selected.currentModule]}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    TNA Form 01
                  </p>
                  <p className="font-semibold text-gray-700">
                    {selected.moduleData?.tna1?.submitted
                      ? "Submitted"
                      : selected.moduleData?.tna1
                        ? "Draft saved"
                        : "Not started"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                  <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    Registered
                  </p>
                  <p className="font-semibold text-gray-700">{selected.submittedAt}</p>
                </div>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-2 text-xs rounded-xl px-3 py-2.5 ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  {message.text}
                </div>
              )}

              {selected.moduleData?.tna1 && (
                <div className="border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTnaPreview((p) => !p)}
                    className="w-full flex items-center justify-center gap-2 border border-[#0C2461]/20 text-[#0C2461] text-sm font-bold py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {showTnaPreview ? "Hide TNA Form 01" : "View TNA Form 01"}
                  </button>
                  {showTnaPreview && (
                    <div className="mt-4 max-h-[480px] overflow-y-auto rounded-xl border border-gray-200">
                      <TnaForm01Preview
                        applicant={selected}
                        form={selected.moduleData.tna1.form ?? {}}
                        tables={
                          selected.moduleData.tna1.tables ?? {
                            rawMaterials: [],
                            production: [],
                            equipment: [],
                          }
                        }
                        onPrint={printTnaForm01}
                        compact
                      />
                    </div>
                  )}
                </div>
              )}

              {selected.moduleData?.tna2Document && (
                <div className="border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTna2Preview((p) => !p)}
                    className="w-full flex items-center justify-center gap-2 border border-[#0C2461]/20 text-[#0C2461] text-sm font-bold py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {showTna2Preview ? "Hide TNA Form 02" : "View TNA Form 02"}
                  </button>
                  {showTna2Preview && (
                    <div className="mt-4 max-h-[480px] overflow-y-auto rounded-xl border border-gray-200">
                      <TnaForm02Preview
                        document={selected.moduleData.tna2Document as Tna2StoredDocument}
                        applicationId={selected.applicationId}
                        aiGenerated={(selected.moduleData.tna2Document as Tna2StoredDocument).aiGenerated}
                        published={(selected.moduleData.tna2Document as Tna2StoredDocument).published}
                        onPrint={printTnaForm02}
                        compact
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Reset password
                </p>
                <input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (8+ characters)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:bg-blue-900 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Update password
                </button>
              </div>

              <div className="border-t border-gray-100 pt-4">
                {applicantStore.isAccountBlocked(selected) ? (
                  <button
                    type="button"
                    onClick={handleToggleBlock}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <ShieldOff className="w-4 h-4" />
                    Unblock account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleBlock}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Block account
                  </button>
                )}
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Blocked applicants cannot sign in to aiSETUP.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
