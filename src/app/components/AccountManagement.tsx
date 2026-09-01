/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect, useCallback } from "react";
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
  UserPlus,
  Briefcase,
} from "lucide-react";
import { api, ApiError } from "../api/client";
import type {
  ApiCreateStaffRequest,
  ApiStaffRole,
  ApiStaffUser,
  ApiUpdateStaffRequest,
} from "../api/types";
import {
  applicantStore,
  Applicant,
  MODULE_LABELS,
} from "../store/applicantStore";
import { AuthUser, ROLE_LABELS } from "../store/authStore";
import { getApplicantsForStaff, getOfficeName } from "../utils/provincialOffice";
import { DOST_REGION_12_CONTACTS } from "../constants/setupBrochure";
import { REGION_12_PROVINCES } from "../constants/region12";
import { TnaForm01Preview, printTnaForm01 } from "./TnaForm01Preview";
import { TnaForm02Preview, printTnaForm02 } from "./TnaForm02Preview";
import type { Tna2StoredDocument } from "../api/types";

interface AccountManagementProps {
  user: AuthUser;
}

type MgmtTab = "applicants" | "staff";
type StatusFilter = "all" | "active" | "blocked";

const STAFF_ROLES: ApiStaffRole[] = [
  "admin",
  "agent",
  "provincial-director",
  "regional-director",
  "rtec-staff",
];

const emptyCreateForm = (): ApiCreateStaffRequest => ({
  email: "",
  password: "",
  firstName: "",
  middleName: "",
  lastName: "",
  role: "agent",
  officeId: "south-cotabato",
  assignedProvinces: ["South Cotabato"],
  enterpriseName: "",
});

export function AccountManagement({ user }: AccountManagementProps) {
  const isAdmin =
    user.role === "admin" || user.role === "regional-director";
  const [tab, setTab] = useState<MgmtTab>("applicants");

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-[#0C2461]" />
            Account Management
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isAdmin
              ? "Manage MSME applicant accounts and staff portal users"
              : "Monitor registered MSME accounts"}{" "}
            · Signed in as {user.firstName} {user.lastName} (
            {ROLE_LABELS[user.role]})
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("applicants")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === "applicants"
                ? "bg-[#0C2461] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Applicants
          </button>
          <button
            type="button"
            onClick={() => setTab("staff")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === "staff"
                ? "bg-[#0C2461] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Staff Users
          </button>
        </div>
      )}

      {tab === "staff" && isAdmin ? (
        <StaffUsersPanel currentUserId={user.id} />
      ) : (
        <ApplicantAccountsPanel user={user} />
      )}
    </div>
  );
}

function ApplicantAccountsPanel({ user }: { user: AuthUser }) {
  const [accounts, setAccounts] = useState<Applicant[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
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
    setAccounts(
      getApplicantsForStaff(user).filter(
        (a) => !!(a.moduleData?.accountStatus || a.moduleData?.registeredAt),
      ),
    );

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

  const handlePasswordReset = async () => {
    if (!selected) return;
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    try {
      await api.adminResetPassword({
        applicantId: selected.id,
        newPassword,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not reach the server to reset the password.",
      });
      return;
    }
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
    <>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                <StatusMessage message={message} />
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
                        onPrint={() =>
                          printTnaForm01({
                            form: selected.moduleData.tna1.form ?? {},
                            tables: selected.moduleData.tna1.tables ?? {
                              rawMaterials: [],
                              production: [],
                              equipment: [],
                            },
                            applicantId: selected.id,
                            applicationId: selected.applicationId,
                          })
                        }
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
                        onPrint={() =>
                          printTnaForm02(
                            selected.moduleData.tna2Document as Tna2StoredDocument,
                            selected.applicationId,
                          )
                        }
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
                <PasswordFields
                  newPassword={newPassword}
                  confirmPassword={confirmPassword}
                  showPw={showPw}
                  onNewPassword={setNewPassword}
                  onConfirmPassword={setConfirmPassword}
                  onToggleShow={() => setShowPw((p) => !p)}
                />
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
                  Blocked applicants cannot sign in to AiSETUP.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StaffUsersPanel({ currentUserId }: { currentUserId: string }) {
  const [staff, setStaff] = useState<ApiStaffUser[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<ApiStaffUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    role: "agent" as ApiStaffRole,
    officeId: "",
    assignedProvinces: [] as string[],
    enterpriseName: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      const list = await api.listStaffUsers();
      setStaff(list);
      setSelected((prev) =>
        prev ? list.find((s) => s.id === prev.id) ?? null : null,
      );
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not load staff users.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const openStaff = (s: ApiStaffUser) => {
    setCreating(false);
    setSelected(s);
    setEditForm({
      firstName: s.firstName,
      middleName: s.middleName ?? "",
      lastName: s.lastName,
      role: s.role,
      officeId: s.officeId ?? "",
      assignedProvinces: s.assignedProvinces ?? [],
      enterpriseName: s.enterpriseName ?? "",
    });
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
  };

  const startCreate = () => {
    setSelected(null);
    setCreating(true);
    setCreateForm(emptyCreateForm());
    setMessage(null);
  };

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    const name = `${s.firstName} ${s.middleName ?? ""} ${s.lastName}`.toLowerCase();
    const matchSearch =
      !q ||
      name.includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.officeId ?? "").toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "blocked" && !s.enabled) ||
      (filter === "active" && s.enabled);
    return matchSearch && matchFilter;
  });

  const activeCount = staff.filter((s) => s.enabled).length;
  const blockedCount = staff.length - activeCount;

  const handleCreate = async () => {
    if (!createForm.email.trim() || !createForm.firstName.trim() || !createForm.lastName.trim()) {
      setMessage({ type: "error", text: "Email, first name, and last name are required." });
      return;
    }
    if (createForm.password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const office = DOST_REGION_12_CONTACTS.find((o) => o.id === createForm.officeId);
      const created = await api.createStaffUser({
        ...createForm,
        email: createForm.email.trim(),
        firstName: createForm.firstName.trim(),
        middleName: createForm.middleName?.trim() || "",
        lastName: createForm.lastName.trim(),
        enterpriseName:
          createForm.enterpriseName?.trim() || office?.name || undefined,
        officeId: createForm.officeId || undefined,
        assignedProvinces: createForm.assignedProvinces ?? [],
      });
      setMessage({ type: "success", text: "Staff account created. They can sign in on the Staff portal." });
      setCreating(false);
      await loadStaff();
      openStaff(created);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not create staff account.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!selected) return;
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      setMessage({ type: "error", text: "First name and last name are required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload: ApiUpdateStaffRequest = {
        firstName: editForm.firstName.trim(),
        middleName: editForm.middleName.trim(),
        lastName: editForm.lastName.trim(),
        role: editForm.role,
        officeId: editForm.officeId || undefined,
        assignedProvinces: editForm.assignedProvinces,
        enterpriseName: editForm.enterpriseName.trim() || undefined,
      };
      const updated = await api.updateStaffUser(selected.id, payload);
      setMessage({ type: "success", text: "Staff profile updated." });
      await loadStaff();
      openStaff(updated);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not update staff profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!selected) return;
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.resetStaffPassword(selected.id, { newPassword });
      setMessage({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not reset staff password.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!selected) return;
    if (selected.id === currentUserId && selected.enabled) {
      setMessage({ type: "error", text: "You cannot disable your own account." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.updateStaffUser(selected.id, {
        enabled: !selected.enabled,
      });
      setMessage({
        type: "success",
        text: updated.enabled
          ? "Account enabled. Staff can sign in again."
          : "Account disabled. Staff cannot sign in.",
      });
      await loadStaff();
      openStaff(updated);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not update account status.",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleProvince = (
    provinces: string[],
    province: string,
    setter: (next: string[]) => void,
  ) => {
    if (provinces.includes(province)) {
      setter(provinces.filter((p) => p !== province));
    } else {
      setter([...provinces, province]);
    }
  };

  return (
    <>
      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        Only regional admins can create or edit staff accounts.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0C2461]/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#0C2461]" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{staff.length}</p>
              <p className="text-xs text-gray-400">Staff users</p>
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
              <p className="text-xs text-gray-400">Active</p>
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
              <p className="text-xs text-gray-400">Disabled</p>
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
                placeholder="Search name, email, role, office..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "active", "blocked"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    filter === f
                      ? "bg-[#0C2461] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f === "blocked" ? "disabled" : f}
                </button>
              ))}
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create staff
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
            {loading ? (
              <p className="p-8 text-center text-sm text-gray-400">Loading staff…</p>
            ) : filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">
                No staff users found.
              </p>
            ) : (
              filtered.map((s) => {
                const isSelected = selected?.id === s.id && !creating;
                const fullName = [s.firstName, s.middleName, s.lastName]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openStaff(s)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50/80" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{s.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.officeId ? getOfficeName(s.officeId) : "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.enabled
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {s.enabled ? "Active" : "Disabled"}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500">
                          {ROLE_LABELS[s.role]}
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
          {!creating && !selected ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center text-gray-400">
              <Shield className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Select a staff user</p>
              <p className="text-xs mt-1 max-w-xs">
                Edit name, role, office, password, or disable access — or create a new staff account.
              </p>
            </div>
          ) : creating ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold text-gray-800">Create staff account</h2>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="text-gray-300 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {message && <StatusMessage message={message} />}
              <StaffFormFields
                values={{
                  firstName: createForm.firstName,
                  middleName: createForm.middleName ?? "",
                  lastName: createForm.lastName,
                  role: createForm.role,
                  officeId: createForm.officeId ?? "",
                  assignedProvinces: createForm.assignedProvinces ?? [],
                  enterpriseName: createForm.enterpriseName ?? "",
                }}
                email={createForm.email}
                password={createForm.password}
                showEmailPassword
                onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
                onToggleProvince={(province) =>
                  toggleProvince(
                    createForm.assignedProvinces ?? [],
                    province,
                    (next) => setCreateForm((f) => ({ ...f, assignedProvinces: next })),
                  )
                }
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleCreate()}
                className="w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {saving ? "Creating…" : "Create staff account"}
              </button>
            </div>
          ) : selected ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {[selected.firstName, selected.middleName, selected.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </h2>
                  <p className="text-xs text-gray-400">{selected.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-gray-300 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {message && <StatusMessage message={message} />}

              <StaffFormFields
                values={editForm}
                onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                onToggleProvince={(province) =>
                  toggleProvince(editForm.assignedProvinces, province, (next) =>
                    setEditForm((f) => ({ ...f, assignedProvinces: next })),
                  )
                }
              />

              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveProfile()}
                className="w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving…" : "Save profile"}
              </button>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Reset password
                </p>
                <PasswordFields
                  newPassword={newPassword}
                  confirmPassword={confirmPassword}
                  showPw={showPw}
                  onNewPassword={setNewPassword}
                  onConfirmPassword={setConfirmPassword}
                  onToggleShow={() => setShowPw((p) => !p)}
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handlePasswordReset()}
                  className="w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Update password
                </button>
              </div>

              <div className="border-t border-gray-100 pt-4">
                {selected.enabled ? (
                  <button
                    type="button"
                    disabled={saving || selected.id === currentUserId}
                    onClick={() => void handleToggleEnabled()}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Disable account
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleToggleEnabled()}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <ShieldOff className="w-4 h-4" />
                    Enable account
                  </button>
                )}
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Disabled staff cannot sign in to the Staff portal.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function StatusMessage({
  message,
}: {
  message: { type: "success" | "error"; text: string };
}) {
  return (
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
  );
}

function PasswordFields({
  newPassword,
  confirmPassword,
  showPw,
  onNewPassword,
  onConfirmPassword,
  onToggleShow,
}: {
  newPassword: string;
  confirmPassword: string;
  showPw: boolean;
  onNewPassword: (v: string) => void;
  onConfirmPassword: (v: string) => void;
  onToggleShow: () => void;
}) {
  return (
    <>
      <input
        type={showPw ? "text" : "password"}
        value={newPassword}
        onChange={(e) => onNewPassword(e.target.value)}
        placeholder="New password (8+ characters)"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <div className="relative">
        <input
          type={showPw ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => onConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
}

function StaffFormFields({
  values,
  email,
  password,
  showEmailPassword,
  onChange,
  onToggleProvince,
}: {
  values: {
    firstName: string;
    middleName: string;
    lastName: string;
    role: ApiStaffRole;
    officeId: string;
    assignedProvinces: string[];
    enterpriseName: string;
  };
  email?: string;
  password?: string;
  showEmailPassword?: boolean;
  onChange: (
    patch: Partial<{
      email: string;
      password: string;
      firstName: string;
      middleName: string;
      lastName: string;
      role: ApiStaffRole;
      officeId: string;
      assignedProvinces: string[];
      enterpriseName: string;
    }>,
  ) => void;
  onToggleProvince: (province: string) => void;
}) {
  const inputClass =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="space-y-3">
      {showEmailPassword && (
        <>
          <input
            type="email"
            value={email ?? ""}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="Email"
            className={inputClass}
          />
          <input
            type="password"
            value={password ?? ""}
            onChange={(e) => onChange({ password: e.target.value })}
            placeholder="Temporary password (8+ characters)"
            className={inputClass}
          />
        </>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          value={values.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
          placeholder="First name"
          className={inputClass}
        />
        <input
          value={values.middleName}
          onChange={(e) => onChange({ middleName: e.target.value })}
          placeholder="Middle name"
          className={inputClass}
        />
        <input
          value={values.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
          placeholder="Last name"
          className={inputClass}
        />
      </div>
      <select
        value={values.role}
        onChange={(e) => onChange({ role: e.target.value as ApiStaffRole })}
        className={inputClass}
      >
        {STAFF_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      <select
        value={values.officeId}
        onChange={(e) => onChange({ officeId: e.target.value })}
        className={inputClass}
      >
        <option value="">Select office</option>
        {DOST_REGION_12_CONTACTS.map((office) => (
          <option key={office.id} value={office.id}>
            {office.name}
          </option>
        ))}
      </select>
      <input
        value={values.enterpriseName}
        onChange={(e) => onChange({ enterpriseName: e.target.value })}
        placeholder="Display office / unit name (optional)"
        className={inputClass}
      />
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Assigned provinces</p>
        <div className="flex flex-wrap gap-2">
          {REGION_12_PROVINCES.map((province) => {
            const on = values.assignedProvinces.includes(province);
            return (
              <button
                key={province}
                type="button"
                onClick={() => onToggleProvince(province)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                  on
                    ? "bg-[#0C2461] text-white border-[#0C2461]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {province}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
