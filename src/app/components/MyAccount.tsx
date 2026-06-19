import { useEffect, useState } from "react";
import { User, Lock, Building2, CheckCircle, AlertCircle } from "lucide-react";
import { applicantStore } from "../store/applicantStore";
import { AuthUser, authStore } from "../store/authStore";
import { REGION_12_LABEL, REGION_12_PROVINCES } from "../constants/region12";
import { resolveApplicantForUser } from "../utils/resolveApplicant";
import { normalizeRegistrationType } from "../utils/applicantPrefill";

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

type Tab = "profile" | "password" | "registration";

export function MyAccount({ user }: { user: AuthUser }) {
  const [tab, setTab] = useState<Tab>("profile");
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const [profile, setProfile] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    civilStatus: "",
    selfie: "",
  });

  const [registration, setRegistration] = useState({
    enterpriseName: "",
    registrationType: "DTI",
    registrationNumber: "",
    tinNumber: "",
    province: "",
    address: "",
    companyStartDate: "",
    companyDescription: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const applicantId = resolveApplicantForUser(user)?.id;

  const loadFromStore = () => {
    const app = resolveApplicantForUser(user);
    if (!app) return;
    const md = app.moduleData ?? {};
    setProfile({
      firstName: String(md.firstName ?? user.firstName ?? ""),
      middleName: String(md.middleName ?? user.middleName ?? ""),
      lastName: String(md.lastName ?? user.lastName ?? ""),
      email: app.emailAddress,
      phone: app.contactNumber,
      birthday: String(md.birthday ?? ""),
      gender: String(md.gender ?? ""),
      civilStatus: String(md.civilStatus ?? ""),
      selfie: String(md.selfie ?? user.avatarUrl ?? ""),
    });
    setRegistration({
      enterpriseName: app.enterpriseName,
      registrationType: normalizeRegistrationType(
        String(md.registrationType ?? app.businessType ?? "DTI"),
      ),
      registrationNumber: String(md.registrationNumber ?? ""),
      tinNumber: String(md.tinNumber ?? ""),
      province: String(md.province ?? ""),
      address: app.address,
      companyStartDate: String(md.companyStartDate ?? md.dateEstablished ?? ""),
      companyDescription: String(md.companyDescription ?? ""),
    });
  };

  useEffect(() => {
    loadFromStore();
    return applicantStore.subscribe(loadFromStore);
  }, [user.id, user.email, applicantId]);

  const showNotice = (type: "ok" | "err", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const saveProfile = () => {
    const app = resolveApplicantForUser(user);
    if (!app) {
      showNotice("err", "No account record found.");
      return;
    }

    const applicantName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    applicantStore.update(app.id, {
      applicantName: applicantName || app.applicantName,
      contactNumber: profile.phone,
      emailAddress: profile.email,
      moduleData: {
        ...app.moduleData,
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        birthday: profile.birthday,
        gender: profile.gender,
        civilStatus: profile.civilStatus,
        selfie: profile.selfie,
      },
    });

    authStore.updateUser({
      firstName: profile.firstName,
      middleName: profile.middleName,
      lastName: profile.lastName,
      email: profile.email,
      avatarUrl: profile.selfie || user.avatarUrl,
    });

    showNotice("ok", "Profile updated.");
  };

  const saveRegistration = () => {
    const app = resolveApplicantForUser(user);
    if (!app) {
      showNotice("err", "No account record found.");
      return;
    }

    applicantStore.update(app.id, {
      enterpriseName: registration.enterpriseName,
      address: registration.address,
      businessType: registration.registrationType,
      region: registration.province || app.region,
      moduleData: {
        ...app.moduleData,
        registrationType: registration.registrationType,
        registrationNumber: registration.registrationNumber,
        tinNumber: registration.tinNumber,
        province: registration.province,
        companyStartDate: registration.companyStartDate,
        dateEstablished: registration.companyStartDate,
        companyDescription: registration.companyDescription,
      },
    });

    authStore.updateUser({
      enterpriseName: registration.enterpriseName,
    });

    showNotice("ok", "Registration details updated.");
  };

  const savePassword = () => {
    const app = resolveApplicantForUser(user);
    if (!app) {
      showNotice("err", "No account record found.");
      return;
    }

    const stored = String(app.moduleData?.password ?? "");
    if (passwordForm.currentPassword !== stored) {
      showNotice("err", "Current password is incorrect.");
      return;
    }
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

    applicantStore.setPassword(app.id, passwordForm.newPassword);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    showNotice("ok", "Password changed successfully.");
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "password", label: "Password", icon: <Lock className="w-4 h-4" /> },
    {
      id: "registration",
      label: "Registration Details",
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 text-white bg-gradient-to-r from-[#0C2461] to-[#1a3a7a]">
          <h1 className="text-xl font-black">My Account</h1>
          <p className="text-white/70 text-sm mt-1">
            Manage your profile, password, and registration information.
          </p>
          {user.applicationId && (
            <p className="text-[11px] text-white/50 font-mono mt-2">
              {user.applicationId}
            </p>
          )}
        </div>

        {notice && (
          <div
            className={`mx-6 mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
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

        <div className="p-6">
          {tab === "profile" && (
            <div className="space-y-5">
              {profile.selfie && (
                <div className="flex items-center gap-4">
                  <img
                    src={profile.selfie}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#0C2461]/20"
                  />
                  <p className="text-sm text-gray-500">
                    Profile photo from registration
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>First Name</label>
                  <input
                    className={inputCls}
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, firstName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Middle Name</label>
                  <input
                    className={inputCls}
                    value={profile.middleName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, middleName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input
                    className={inputCls}
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Birthday</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={profile.birthday}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, birthday: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select
                    className={inputCls}
                    value={profile.gender}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, gender: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Civil Status</label>
                  <select
                    className={inputCls}
                    value={profile.civilStatus}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, civilStatus: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Widowed</option>
                    <option>Separated</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Mobile Number</label>
                  <input
                    type="tel"
                    className={inputCls}
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={saveProfile}
                className="px-6 py-2.5 rounded-xl bg-[#0C2461] text-white text-sm font-bold hover:opacity-90"
              >
                Save Profile
              </button>
            </div>
          )}

          {tab === "password" && (
            <div className="space-y-4 max-w-md">
              <div>
                <label className={labelCls}>Current Password</label>
                <input
                  type="password"
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
                <label className={labelCls}>New Password</label>
                <input
                  type="password"
                  className={inputCls}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-gray-400 mt-1">
                  At least 8 characters with uppercase and a number.
                </p>
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input
                  type="password"
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
                onClick={savePassword}
                className="px-6 py-2.5 rounded-xl bg-[#0C2461] text-white text-sm font-bold hover:opacity-90"
              >
                Change Password
              </button>
            </div>
          )}

          {tab === "registration" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Details you provided when registering for aiSETUP.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Enterprise Name</label>
                  <input
                    className={inputCls}
                    value={registration.enterpriseName}
                    onChange={(e) =>
                      setRegistration((p) => ({
                        ...p,
                        enterpriseName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Registration Type</label>
                  <select
                    className={inputCls}
                    value={registration.registrationType}
                    onChange={(e) =>
                      setRegistration((p) => ({
                        ...p,
                        registrationType: e.target.value,
                      }))
                    }
                  >
                    <option value="DTI">DTI</option>
                    <option value="SEC">SEC</option>
                    <option value="CDA">CDA</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Registration Number</label>
                  <input
                    className={inputCls}
                    value={registration.registrationNumber}
                    onChange={(e) =>
                      setRegistration((p) => ({
                        ...p,
                        registrationNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>TIN Number</label>
                  <input
                    className={inputCls}
                    value={registration.tinNumber}
                    onChange={(e) =>
                      setRegistration((p) => ({
                        ...p,
                        tinNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Province</label>
                  <select
                    className={inputCls}
                    value={registration.province}
                    onChange={(e) =>
                      setRegistration((p) => ({
                        ...p,
                        province: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select province</option>
                    {REGION_12_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Region</label>
                  <input
                    readOnly
                    className={`${inputCls} bg-gray-50 text-gray-500`}
                    value={REGION_12_LABEL}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Business Address</label>
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={registration.address}
                    onChange={(e) =>
                      setRegistration((p) => ({
                        ...p,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Company Start Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={registration.companyStartDate}
                    onChange={(e) =>
                      setRegistration((p) => ({
                        ...p,
                        companyStartDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Company Description</label>
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={registration.companyDescription}
                    onChange={(e) =>
                      setRegistration((p) => ({
                        ...p,
                        companyDescription: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={saveRegistration}
                className="px-6 py-2.5 rounded-xl bg-[#0C2461] text-white text-sm font-bold hover:opacity-90"
              >
                Save Registration Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
