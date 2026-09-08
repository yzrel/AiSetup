/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useState } from "react";
import { User, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { api, ApiError } from "../api/client";
import { AuthUser, ROLE_LABELS, authStore } from "../store/authStore";
import { getOfficeName } from "../utils/provincialOffice";
import {
  FORM_GRID_2,
  MODULE_BODY,
  MODULE_HEADER,
  MODULE_PAGE,
  MODULE_SHELL,
} from "./moduleTheme";

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

type Tab = "profile" | "password";

export function StaffAccount({ user }: { user: AuthUser }) {
  const [tab, setTab] = useState<Tab>("profile");
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user.firstName,
    middleName: user.middleName ?? "",
    lastName: user.lastName,
    email: user.email,
    currentPassword: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setProfile({
      firstName: user.firstName,
      middleName: user.middleName ?? "",
      lastName: user.lastName,
      email: user.email,
      currentPassword: "",
    });
  }, [user.id, user.email, user.firstName, user.middleName, user.lastName]);

  const showNotice = (type: "ok" | "err", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const emailChanged =
    profile.email.trim().toLowerCase() !== user.email.trim().toLowerCase();

  const saveProfile = async () => {
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      showNotice("err", "First name and last name are required.");
      return;
    }
    if (!profile.email.trim()) {
      showNotice("err", "Email is required.");
      return;
    }
    if (emailChanged && !profile.currentPassword) {
      showNotice("err", "Current password is required to change email.");
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateMe({
        firstName: profile.firstName.trim(),
        middleName: profile.middleName.trim(),
        lastName: profile.lastName.trim(),
        email: profile.email.trim(),
        ...(emailChanged
          ? { currentPassword: profile.currentPassword }
          : {}),
      });
      authStore.updateUser({
        firstName: updated.firstName,
        middleName: updated.middleName ?? "",
        lastName: updated.lastName,
        email: updated.email,
        enterpriseName: updated.enterpriseName ?? user.enterpriseName,
      });
      setProfile((p) => ({ ...p, currentPassword: "" }));
      showNotice("ok", "Profile updated.");
    } catch (err) {
      showNotice(
        "err",
        err instanceof ApiError
          ? err.message
          : "Could not update profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (passwordForm.newPassword.length < 8) {
      showNotice("err", "New password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(passwordForm.newPassword)) {
      showNotice("err", "New password must include an uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(passwordForm.newPassword)) {
      showNotice("err", "New password must include a number.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotice("err", "New passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showNotice("ok", "Password changed successfully.");
    } catch (err) {
      showNotice(
        "err",
        err instanceof ApiError
          ? err.message
          : "Could not change the password. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "password", label: "Password", icon: <Lock className="w-4 h-4" /> },
  ];

  const officeLabel = user.officeId ? getOfficeName(user.officeId) : "";

  return (
    <div className={`${MODULE_PAGE} max-w-3xl mx-auto`}>
      <div className={MODULE_SHELL}>
        <div
          className={`${MODULE_HEADER} text-white bg-gradient-to-r from-[#0C2461] to-[#1a3a7a]`}
        >
          <h1 className="text-xl font-black">My Account</h1>
          <p className="text-white/70 text-sm mt-1">
            Update your name, login email, and password.
          </p>
          <p className="text-[11px] text-white/50 mt-2">
            {ROLE_LABELS[user.role]}
            {officeLabel ? ` · ${officeLabel}` : ""}
          </p>
        </div>

        {notice && (
          <div
            className={`mx-4 sm:mx-6 mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              notice.type === "ok"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {notice.type === "ok" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {notice.text}
          </div>
        )}

        <div className="flex border-b border-gray-100 px-4 pt-2 gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "border-[#0C2461] text-[#0C2461]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className={MODULE_BODY}>
          {tab === "profile" && (
            <div className="space-y-5">
              <div className={FORM_GRID_2}>
                <div>
                  <label className={labelCls}>First name</label>
                  <input
                    className={inputCls}
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, firstName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Middle name</label>
                  <input
                    className={inputCls}
                    value={profile.middleName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, middleName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Last name</label>
                  <input
                    className={inputCls}
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Login email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
              </div>

              {emailChanged && (
                <div>
                  <label className={labelCls}>
                    Current password (required to change email)
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    className={inputCls}
                    value={profile.currentPassword}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className={FORM_GRID_2}>
                <div>
                  <label className={labelCls}>Role</label>
                  <input
                    className={`${inputCls} bg-gray-50 text-gray-500`}
                    value={ROLE_LABELS[user.role]}
                    readOnly
                  />
                </div>
                <div>
                  <label className={labelCls}>Office</label>
                  <input
                    className={`${inputCls} bg-gray-50 text-gray-500`}
                    value={officeLabel || user.enterpriseName || "—"}
                    readOnly
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Role and office are managed by regional admin. Contact the Regional
                Office if those need to change.
              </p>

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveProfile()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0C2461] hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-bold transition-colors"
              >
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          )}

          {tab === "password" && (
            <div className="space-y-4 max-w-md">
              <div>
                <label className={labelCls}>Current password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  className={inputCls}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  At least 8 characters, one uppercase letter, and one number.
                </p>
              </div>
              <div>
                <label className={labelCls}>Confirm new password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void savePassword()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0C2461] hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-bold transition-colors"
              >
                {saving ? "Updating…" : "Change password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
