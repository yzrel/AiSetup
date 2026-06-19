import { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Lock,
  Shield,
  ArrowLeft,
  X,
} from "lucide-react";
import { DataPrivacyModal } from "./DataPrivacyModal";
import { applicantStore } from "../store/applicantStore";
import {
  REGION_12_ADDRESS_PLACEHOLDER,
  REGION_12_LABEL,
  REGION_12_PROVINCES,
} from "../constants/region12";

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Account Setup", icon: Lock },
  { id: 3, label: "Enterprise", icon: Building2 },
  { id: 4, label: "Verification", icon: Shield },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : active
                      ? "bg-[#0C2461] border-[#0C2461] text-white"
                      : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {done ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold mt-1 whitespace-nowrap ${
                  active
                    ? "text-[#0C2461]"
                    : done
                      ? "text-emerald-600"
                      : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mb-5 mx-1 transition-all ${done ? "bg-emerald-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Field components ──────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[10px] text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-[10px] text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461]/20 focus:border-[#0C2461]/50 w-full bg-white";
const selectCls = inputCls + " cursor-pointer";

// ── Selfie capture ────────────────────────────────────────────────────────────

function SelfieCapture({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<
    "idle" | "camera" | "captured"
  >("idle");
  const [stream, setStream] = useState<MediaStream | null>(
    null,
  );

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(s);
      setMode("camera");
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = s;
      }, 100);
    } catch {
      alert(
        "Camera access denied. Please upload a photo instead.",
      );
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    onChange(canvas.toDataURL("image/jpeg", 0.8));
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setMode("captured");
  };

  const retake = () => {
    onChange("");
    setMode("idle");
  };

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target?.result as string);
      setMode("captured");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {mode === "camera" && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-48 h-48 rounded-2xl object-cover border-4 border-[#0C2461]"
          />
          <div
            className="absolute inset-0 rounded-2xl border-4 border-[#00AEEF] opacity-60 pointer-events-none"
            style={{ borderRadius: "50%" }}
          />
          <button
            onClick={capture}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#0C2461] text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-800"
          >
            Capture
          </button>
        </div>
      )}

      {mode === "captured" && value && (
        <div className="relative">
          <img
            src={value}
            alt="Selfie"
            className="w-32 h-32 rounded-full object-cover border-4 border-emerald-400 shadow-lg"
          />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <button
            onClick={retake}
            className="mt-2 block text-xs text-red-500 hover:underline mx-auto"
          >
            Retake
          </button>
        </div>
      )}

      {mode === "idle" && (
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
          <Camera className="w-10 h-10 text-gray-300" />
        </div>
      )}

      {mode !== "camera" && mode !== "captured" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center gap-1.5 text-xs bg-[#0C2461] text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" /> Open Camera
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-4 py-2 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}
    </div>
  );
}

// ── Image upload ──────────────────────────────────────────────────────────────

function ImageUpload({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
        {!required && (
          <span className="text-gray-400 font-normal normal-case ml-1">
            (Optional)
          </span>
        )}
      </label>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt={label}
            className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm"
          />
          <button
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#0C2461]/40 hover:bg-blue-50/30 transition-colors"
        >
          <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-400">
            Click to upload
          </p>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ── OTP Verification ──────────────────────────────────────────────────────────

function OTPVerify({
  label,
  value,
  onChange,
  verified,
  onSend,
  onVerify,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  verified: boolean;
  onSend: () => void;
  onVerify: (otp: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const send = () => {
    if (!value) return;
    onSend();
    setSent(true);
    setCountdown(60);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <div className="space-y-2">
      {/* Single input + Send OTP button */}
      <div className="flex gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={verified}
          placeholder={placeholder || label}
          className={
            inputCls +
            " flex-1" +
            (verified ? " bg-gray-50 text-gray-500" : "")
          }
        />
        <button
          type="button"
          onClick={send}
          disabled={!value || countdown > 0 || verified}
          className="shrink-0 text-xs font-bold px-3 py-2.5 rounded-xl bg-[#0C2461] text-white hover:bg-blue-800 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {countdown > 0
            ? `Resend (${countdown}s)`
            : "Send OTP"}
        </button>
      </div>

      {/* OTP entry row */}
      {sent && !verified && (
        <div className="flex gap-2">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            className={
              inputCls +
              " flex-1 text-center tracking-[0.3em] font-mono"
            }
          />
          <button
            type="button"
            onClick={() => onVerify(otp)}
            className="shrink-0 text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Verify
          </button>
        </div>
      )}

      {sent && !verified && (
        <p className="text-[10px] text-gray-400">
          Demo: use OTP <strong>123456</strong> to verify
        </p>
      )}

      {verified && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
          <CheckCircle className="w-4 h-4" /> Verified
          successfully
        </div>
      )}
    </div>
  );
}

// ── Main Registration Component ───────────────────────────────────────────────

interface RegisterPageProps {
  onLogin: () => void;
  onSuccess: () => void;
  onHome?: () => void;
  applicationType?: "single-proprietor" | "non-single-proprietor";
}

export function RegisterPage({
  onLogin,
  onSuccess,
  onHome,
  applicationType,
}: RegisterPageProps) {
  const [step, setStep] = useState(1);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>(
    {},
  );
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Step 1 — Personal
    firstName: "",
    middleName: "",
    lastName: "",
    birthday: "",
    gender: "",
    civilStatus: "",
    isPWD: false,
    pwdType: "",
    selfie: "",

    // Step 2 — Account
    email: "",
    emailVerified: false,
    phone: "",
    phoneVerified: false,
    password: "",
    confirmPassword: "",

    // Step 3 — Enterprise
    companyName: "",
    province: "",
    companyAddress: "",
    tinNumber: "",
    registrationType:
      applicationType === "single-proprietor"
        ? "DTI"
        : applicationType === "non-single-proprietor"
          ? "SEC"
          : "",
    registrationNumber: "",
    companyStartDate: "",
    companyDescription: "",
    companyLogo: "",
    companyPhoto: "",

    // Step 4 — done
  });

  const set = (key: string, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));
  const clearErr = (key: string) =>
    setErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.firstName.trim())
        errs.firstName = "First name is required";
      if (!form.lastName.trim())
        errs.lastName = "Last name is required";
      if (!form.birthday)
        errs.birthday = "Birthday is required";
      if (!form.gender) errs.gender = "Please select gender";
      if (!form.civilStatus)
        errs.civilStatus = "Please select civil status";
      if (!form.selfie)
        errs.selfie =
          "Selfie is required for identity verification";
    }
    if (step === 2) {
      if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
        errs.email = "Enter a valid email address";
      if (!form.emailVerified)
        errs.emailVerified = "Please verify your email address";
      if (!form.phone.match(/^(09|\+639)\d{9}$/))
        errs.phone = "Enter a valid Philippine mobile number";
      if (!form.phoneVerified)
        errs.phoneVerified = "Please verify your mobile number";
      if (form.password.length < 8)
        errs.password =
          "Password must be at least 8 characters";
      if (!/[A-Z]/.test(form.password))
        errs.password =
          "Password must contain an uppercase letter";
      if (!/[0-9]/.test(form.password))
        errs.password = "Password must contain a number";
      if (form.password !== form.confirmPassword)
        errs.confirmPassword = "Passwords do not match";
    }
    if (step === 3) {
      if (!form.companyName.trim())
        errs.companyName = "Company name is required";
      if (!form.province)
        errs.province = "Select your province in Region XII";
      if (!form.companyAddress.trim())
        errs.companyAddress = "Company address is required";
      if (
        !form.tinNumber.match(/^\d{3}-\d{3}-\d{3}-\d{3}$/) &&
        !form.tinNumber.match(/^\d{9,12}$/)
      )
        errs.tinNumber =
          "Enter a valid TIN (e.g. 123-456-789-000)";
      if (!form.registrationType)
        errs.registrationType = "Select registration type";
      if (!form.registrationNumber.trim())
        errs.registrationNumber =
          "Registration number is required";
      if (!form.companyStartDate)
        errs.companyStartDate =
          "Company start date is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (validate()) setStep((s) => s + 1);
  };
  const back = () => {
    setStep((s) => s - 1);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setShowPrivacy(true);
  };

  const handleAgree = () => {
    setShowPrivacy(false);
    // Save to applicant store and log in
    const app = applicantStore.add({
      applicantName: `${form.firstName} ${form.lastName}`,
      designation: "Owner/Applicant",
      enterpriseName: form.companyName,
      contactNumber: form.phone,
      emailAddress: form.email,
      businessType: form.registrationType,
      businessNature: "",
      businessSector: "",
      yearsOfOperation: "",
      enterpriseType: "",
      msmeSize: "",
      assetSize: "",
      region: form.province || REGION_12_LABEL,
      address: form.companyAddress,
      currentModule: "prescreening",
      qualified: false,
      moduleData: {
        selfie: form.selfie,
        tinNumber: form.tinNumber,
        password: form.password,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        province: form.province,
        regionLabel: REGION_12_LABEL,
        accountStatus: "active",
        registeredAt: new Date().toISOString(),
      },
    });

    // Registration complete — applicant signs in on the login page next
    // authStore.login({
    //   id: app.id,
    //   email: form.email,
    //   firstName: form.firstName,
    //   middleName: form.middleName,
    //   lastName: form.lastName,
    //   role: "applicant",
    //   enterpriseName: form.companyName,
    //   applicationId: app.applicationId,
    //   avatarUrl: form.selfie,
    //   verified: true,
    //   portal: "admin",
    // });

    onSuccess();
  };

  // ── Render steps ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C2461] via-[#1a3a7a] to-[#0e4d8a] flex items-center justify-center p-4">
      {showPrivacy && (
        <DataPrivacyModal
          onAgree={handleAgree}
          onDecline={() => setShowPrivacy(false)}
        />
      )}

      <div className="w-full max-w-2xl relative z-10">
        {/* Back to login */}
        <div className="flex items-center gap-3 mb-4">
          {onHome && (
            <button
              onClick={onHome}
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </button>
          )}
          <button
            onClick={onLogin}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0C2461] to-[#1a3a7a] px-8 py-5 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base">
                Create Your SETUP Account
              </p>
              <p className="text-white/50 text-xs">
                Step {step} of {STEPS.length} —{" "}
                {STEPS[step - 1].label}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[#00AEEF] font-black text-lg">
                ai
              </span>
              <span className="text-white font-black text-lg">
                SETUP
              </span>
            </div>
          </div>

          <div className="px-6 sm:px-10 py-8">
            <StepIndicator current={step} />

            {/* ── STEP 1: Personal Info ─────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0C2461]" />{" "}
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field
                    label="First Name"
                    required
                    error={errors.firstName}
                  >
                    <input
                      value={form.firstName}
                      onChange={(e) => {
                        set("firstName", e.target.value);
                        clearErr("firstName");
                      }}
                      className={inputCls}
                      placeholder="Juan"
                    />
                  </Field>
                  <Field label="Middle Name">
                    <input
                      value={form.middleName}
                      onChange={(e) =>
                        set("middleName", e.target.value)
                      }
                      className={inputCls}
                      placeholder="Santos"
                    />
                  </Field>
                  <Field
                    label="Last Name"
                    required
                    error={errors.lastName}
                  >
                    <input
                      value={form.lastName}
                      onChange={(e) => {
                        set("lastName", e.target.value);
                        clearErr("lastName");
                      }}
                      className={inputCls}
                      placeholder="Dela Cruz"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field
                    label="Birthday"
                    required
                    error={errors.birthday}
                  >
                    <input
                      type="date"
                      value={form.birthday}
                      onChange={(e) => {
                        set("birthday", e.target.value);
                        clearErr("birthday");
                      }}
                      className={inputCls}
                      max={
                        new Date().toISOString().split("T")[0]
                      }
                    />
                  </Field>
                  <Field
                    label="Gender"
                    required
                    error={errors.gender}
                  >
                    <select
                      value={form.gender}
                      onChange={(e) => {
                        set("gender", e.target.value);
                        clearErr("gender");
                      }}
                      className={selectCls}
                    >
                      <option value="">Select...</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Prefer not to say</option>
                    </select>
                  </Field>
                  <Field
                    label="Civil Status"
                    required
                    error={errors.civilStatus}
                  >
                    <select
                      value={form.civilStatus}
                      onChange={(e) => {
                        set("civilStatus", e.target.value);
                        clearErr("civilStatus");
                      }}
                      className={selectCls}
                    >
                      <option value="">Select...</option>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Widowed</option>
                      <option>Separated</option>
                      <option>Annulled</option>
                    </select>
                  </Field>
                </div>

                {/* PWD */}
                <Field label="Person with Disability (PWD)">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isPWD}
                        onChange={(e) =>
                          set("isPWD", e.target.checked)
                        }
                        className="w-4 h-4 rounded accent-[#0C2461]"
                      />
                      <span className="text-sm text-gray-700">
                        I am a Person with Disability
                      </span>
                    </label>
                  </div>
                  {form.isPWD && (
                    <select
                      value={form.pwdType}
                      onChange={(e) =>
                        set("pwdType", e.target.value)
                      }
                      className={selectCls + " mt-2"}
                    >
                      <option value="">
                        Select disability type...
                      </option>
                      <option>Visual Impairment</option>
                      <option>Hearing Impairment</option>
                      <option>
                        Mobility/Physical Impairment
                      </option>
                      <option>Intellectual Disability</option>
                      <option>Psychosocial Disability</option>
                      <option>Other</option>
                    </select>
                  )}
                </Field>

                {/* Selfie */}
                <Field
                  label="Selfie / Facial Verification"
                  required
                  error={errors.selfie}
                  hint="Take a clear photo of your face for identity verification. This will be used for biometric matching."
                >
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-3">
                    <SelfieCapture
                      value={form.selfie}
                      onChange={(v) => {
                        set("selfie", v);
                        clearErr("selfie");
                      }}
                    />
                    {errors.selfie && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errors.selfie}
                      </p>
                    )}
                  </div>
                </Field>
              </div>
            )}

            {/* ── STEP 2: Account Setup ─────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#0C2461]" />{" "}
                  Account & Verification
                </h3>

                {/* Email */}
                <Field
                  label="Email Address"
                  required
                  error={errors.emailVerified || errors.email}
                  hint="Enter your email then click Send OTP to verify."
                >
                  <OTPVerify
                    label="Email address"
                    value={form.email}
                    onChange={(v) => {
                      set("email", v);
                      clearErr("email");
                      clearErr("emailVerified");
                    }}
                    verified={form.emailVerified}
                    onSend={() => {}}
                    onVerify={(otp) => {
                      if (otp === "123456")
                        set("emailVerified", true);
                    }}
                    placeholder="juan@example.com"
                    type="email"
                  />
                </Field>

                {/* Phone */}
                <Field
                  label="Mobile Number"
                  required
                  error={errors.phoneVerified || errors.phone}
                  hint="Enter your Philippine mobile number then click Send OTP."
                >
                  <OTPVerify
                    label="Mobile number"
                    value={form.phone}
                    onChange={(v) => {
                      set("phone", v);
                      clearErr("phone");
                      clearErr("phoneVerified");
                    }}
                    verified={form.phoneVerified}
                    onSend={() => {}}
                    onVerify={(otp) => {
                      if (otp === "123456")
                        set("phoneVerified", true);
                    }}
                    placeholder="09171234567"
                    type="tel"
                  />
                </Field>

                {/* Password */}
                <Field
                  label="Password"
                  required
                  error={errors.password}
                  hint="Minimum 8 characters, must include uppercase letter and number."
                >
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => {
                        set("password", e.target.value);
                        clearErr("password");
                      }}
                      className={inputCls + " pr-10"}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password && (
                    <div className="flex gap-1 mt-1.5">
                      {[1, 2, 3, 4].map((i) => {
                        const score = [
                          form.password.length >= 8,
                          /[A-Z]/.test(form.password),
                          /[0-9]/.test(form.password),
                          /[^A-Za-z0-9]/.test(form.password),
                        ].filter(Boolean).length;
                        return (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${i <= score ? (score <= 1 ? "bg-red-400" : score <= 2 ? "bg-amber-400" : score <= 3 ? "bg-blue-400" : "bg-emerald-500") : "bg-gray-200"}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </Field>

                <Field
                  label="Confirm Password"
                  required
                  error={errors.confirmPassword}
                >
                  <div className="relative">
                    <input
                      type={showPw2 ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => {
                        set("confirmPassword", e.target.value);
                        clearErr("confirmPassword");
                      }}
                      className={inputCls + " pr-10"}
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw2((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw2 ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </Field>
              </div>
            )}

            {/* ── STEP 3: Enterprise Info ───────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0C2461]" />{" "}
                  Enterprise Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Company / Enterprise Name"
                    required
                    error={errors.companyName}
                  >
                    <input
                      value={form.companyName}
                      onChange={(e) => {
                        set("companyName", e.target.value);
                        clearErr("companyName");
                      }}
                      className={inputCls}
                      placeholder="ABC Food Processing"
                    />
                  </Field>
                  <Field
                    label="TIN Number"
                    required
                    error={errors.tinNumber}
                    hint="Format: 123-456-789-000"
                  >
                    <input
                      value={form.tinNumber}
                      onChange={(e) => {
                        set("tinNumber", e.target.value);
                        clearErr("tinNumber");
                      }}
                      className={inputCls}
                      placeholder="123-456-789-000"
                    />
                  </Field>
                </div>

                <Field
                  label="Province (Region XII)"
                  required
                  error={errors.province}
                >
                  <select
                    value={form.province}
                    onChange={(e) => {
                      set("province", e.target.value);
                      clearErr("province");
                    }}
                    className={inputCls}
                  >
                    <option value="">Select province</option>
                    {REGION_12_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Company Address"
                  required
                  error={errors.companyAddress}
                >
                  <textarea
                    value={form.companyAddress}
                    onChange={(e) => {
                      set("companyAddress", e.target.value);
                      clearErr("companyAddress");
                    }}
                    rows={2}
                    className={inputCls + " resize-none"}
                    placeholder={REGION_12_ADDRESS_PLACEHOLDER}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Registration Type"
                    required
                    error={errors.registrationType}
                  >
                    <select
                      value={form.registrationType}
                      onChange={(e) => {
                        set("registrationType", e.target.value);
                        clearErr("registrationType");
                      }}
                      className={selectCls}
                    >
                      <option value="">Select...</option>
                      <option value="DTI">
                        DTI (Single Proprietorship)
                      </option>
                      <option value="SEC">
                        SEC (Corporation/Partnership)
                      </option>
                      <option value="CDA">
                        CDA (Cooperative)
                      </option>
                    </select>
                  </Field>
                  <Field
                    label="Registration Number"
                    required
                    error={errors.registrationNumber}
                    hint={`Your ${form.registrationType || "DTI/SEC/CDA"} certificate number`}
                  >
                    <input
                      value={form.registrationNumber}
                      onChange={(e) => {
                        set(
                          "registrationNumber",
                          e.target.value,
                        );
                        clearErr("registrationNumber");
                      }}
                      className={inputCls}
                      placeholder="e.g. DTI-12345678"
                    />
                  </Field>
                </div>

                <Field
                  label="Company Start Date"
                  required
                  error={errors.companyStartDate}
                  hint="When did your enterprise start operations?"
                >
                  <input
                    type="date"
                    value={form.companyStartDate}
                    onChange={(e) => {
                      set("companyStartDate", e.target.value);
                      clearErr("companyStartDate");
                    }}
                    className={inputCls}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </Field>

                <Field
                  label="Brief Description of Company"
                  hint="Describe your enterprise's products, services, and operations (max 500 characters)"
                >
                  <textarea
                    value={form.companyDescription}
                    onChange={(e) =>
                      set(
                        "companyDescription",
                        e.target.value.slice(0, 500),
                      )
                    }
                    rows={3}
                    className={inputCls + " resize-none"}
                    placeholder="We are a food processing enterprise specializing in..."
                  />
                  <p className="text-[10px] text-gray-400 text-right">
                    {form.companyDescription.length}/500
                  </p>
                </Field>

                {/* Image uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ImageUpload
                    label="Company Logo"
                    value={form.companyLogo}
                    onChange={(v) => set("companyLogo", v)}
                  />
                  <ImageUpload
                    label="Photo of Company"
                    value={form.companyPhoto}
                    onChange={(v) => set("companyPhoto", v)}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 4: Review ────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />{" "}
                  Review Your Information
                </h3>

                {/* Selfie + name */}
                <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  {form.selfie ? (
                    <img
                      src={form.selfie}
                      alt="Selfie"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#0C2461] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800">
                      {form.firstName} {form.middleName}{" "}
                      {form.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {form.gender} · {form.civilStatus} · Born{" "}
                      {form.birthday}
                    </p>
                    {form.isPWD && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        PWD — {form.pwdType}
                      </span>
                    )}
                  </div>
                </div>

                {[
                  {
                    label: "Email",
                    value: form.email,
                    icon: Mail,
                    verified: form.emailVerified,
                  },
                  {
                    label: "Mobile",
                    value: form.phone,
                    icon: Phone,
                    verified: form.phoneVerified,
                  },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3"
                    >
                      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                          {row.label}
                        </p>
                        <p className="text-sm font-medium text-gray-800">
                          {row.value}
                        </p>
                      </div>
                      {row.verified && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                  );
                })}

                <div className="border border-gray-100 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-[#0C2461] shrink-0" />
                    <p className="font-semibold text-gray-800 text-sm">
                      {form.companyName}
                    </p>
                    {form.companyLogo && (
                      <img
                        src={form.companyLogo}
                        alt="logo"
                        className="w-7 h-7 rounded object-contain border border-gray-200 ml-auto"
                      />
                    )}
                  </div>
                  {[
                    {
                      label: "Address",
                      value: form.companyAddress,
                    },
                    { label: "TIN", value: form.tinNumber },
                    {
                      label: "Registration",
                      value: `${form.registrationType} — ${form.registrationNumber}`,
                    },
                    {
                      label: "Operating Since",
                      value: form.companyStartDate,
                    },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex gap-2 text-xs"
                    >
                      <span className="text-gray-400 w-24 shrink-0">
                        {r.label}:
                      </span>
                      <span className="text-gray-700 font-medium">
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <Shield className="w-4 h-4 inline mr-1.5 shrink-0" />
                  By clicking <strong>Create Account</strong>,
                  you will be shown the{" "}
                  <strong>Data Privacy Agreement</strong>. You
                  must agree to complete your registration.
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <div className="flex-1" />
              {step < 4 ? (
                <button
                  type="button"
                  onClick={next}
                  className="flex items-center gap-2 bg-[#0C2461] hover:bg-blue-800 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
                >
                  <Shield className="w-4 h-4" /> Create Account
                </button>
              )}
            </div>

            {/* Login link */}
            <p className="text-center text-xs text-gray-400 mt-4">
              Already have an account?{" "}
              <button
                onClick={onLogin}
                className="text-[#0C2461] font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}