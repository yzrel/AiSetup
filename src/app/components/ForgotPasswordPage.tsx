/**
 * Author: Yzrel Jade B. Eborde
 */

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { DemoModeBanner } from "./DemoModeBanner";
import { DemoModeLogoTrigger } from "./DemoModeLogoTrigger";
import { DOSTMark } from "./DOSTLogos";
import { DostLogoLoader } from "./DostLogoLoader";
import { api, ApiError } from "../api/client";
import { passwordPolicy, passwordsMatch } from "../utils/fieldValidators";

interface ForgotPasswordPageProps {
  onLogin: () => void;
  onHome?: () => void;
}

type Step = "email" | "code" | "password" | "done";

export function ForgotPasswordPage({ onLogin, onHome }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
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

  const handleSendCode = async () => {
    setError("");
    setInfo("");
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.forgotPassword({ email: trimmed });
      if (result.message) setInfo(result.message);
      else {
        setInfo(
          "If an account exists for this email, a password reset code has been sent.",
        );
      }
      setStep("code");
      startCountdown();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to reach the server. Start the backend and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const result = await api.forgotPassword({ email: email.trim() });
      if (result.message) setInfo(result.message);
      startCountdown();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not resend the reset code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeStep = () => {
    setError("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setStep("password");
  };

  const handleResetPassword = async () => {
    setError("");
    const pwErr = passwordPolicy(newPassword);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    const matchErr = passwordsMatch(newPassword, confirmPassword);
    if (matchErr) {
      setError(matchErr);
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setStep("done");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to reset password. Start the backend and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C2461] via-[#1a3a7a] to-[#0e4d8a] flex items-center justify-center px-4 sm:px-6 py-4">
      {loading && (
        <DostLogoLoader
          variant="overlay"
          label={
            step === "password"
              ? "Updating password…"
              : "Sending reset code…"
          }
        />
      )}
      <div className="w-full max-w-md relative z-10">
        {onHome && step === "email" && (
          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        )}
        {step !== "email" && step !== "done" && (
          <button
            type="button"
            onClick={() => {
              setError("");
              if (step === "password") setStep("code");
              else setStep("email");
            }}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#0C2461] via-[#1a3a7a] to-[#0e4d8a] px-4 sm:px-8 py-6 sm:py-7 text-center transition-all duration-300">
            <DemoModeLogoTrigger className="inline-block mx-auto">
              <div className="flex flex-col items-center gap-2 mb-2">
                <DOSTMark size={40} />
                <div className="flex items-center justify-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-bold text-sm">
                    Reset Password
                  </span>
                </div>
              </div>
            </DemoModeLogoTrigger>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.2em] mb-0.5">
              Republic of the Philippines
            </p>
            <p className="text-white font-bold text-sm tracking-wide">
              Department of Science &amp; Technology
            </p>
          </div>

          <div className="px-4 sm:px-8 py-6 sm:py-7">
            <div className="mb-4">
              <DemoModeBanner compact />
            </div>

            {step === "done" ? (
              <>
                <div className="flex flex-col items-center text-center gap-3 py-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  <h2 className="text-lg font-bold text-gray-800">
                    Password updated
                  </h2>
                  <p className="text-gray-500 text-sm">
                    You can now sign in with your new password.
                  </p>
                  <button
                    type="button"
                    onClick={onLogin}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all text-sm"
                  >
                    Back to Sign In <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  {step === "email" && "Forgot your password?"}
                  {step === "code" && "Enter verification code"}
                  {step === "password" && "Choose a new password"}
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  {step === "email" &&
                    "Enter your account email. We will send a reset code if it is registered."}
                  {step === "code" &&
                    `We sent a 6-digit code to ${email.trim()}. Enter it below.`}
                  {step === "password" &&
                    "Use at least 8 characters with an uppercase letter and a number."}
                </p>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
                {info && !error && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl px-3 py-2.5 mb-4">
                    <Mail className="w-4 h-4 shrink-0" />
                    {info}
                  </div>
                )}

                <div className="space-y-4">
                  {step === "email" && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSendCode()
                            }
                            placeholder="you@example.com"
                            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 text-sm"
                      >
                        Send reset code <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {step === "code" && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={code}
                          onChange={(e) =>
                            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleVerifyCodeStep()
                          }
                          placeholder="6-digit code"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm tracking-[0.3em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyCodeStep}
                        disabled={loading || code.trim().length !== 6}
                        className="w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 text-sm"
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading || countdown > 0}
                        className="w-full text-sm text-[#0C2461] font-semibold hover:underline disabled:text-gray-400 disabled:no-underline"
                      >
                        {countdown > 0
                          ? `Resend code in ${countdown}s`
                          : "Resend code"}
                      </button>
                    </>
                  )}

                  {step === "password" && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPw ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
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
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPw2 ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleResetPassword()
                            }
                            placeholder="••••••••"
                            className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
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
                      </div>
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 text-sm"
                      >
                        Update password <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    Remembered your password?{" "}
                    <button
                      type="button"
                      onClick={onLogin}
                      className="text-[#0C2461] font-bold hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-[10px] mt-4">
          © {new Date().getFullYear()} Department of Science and Technology —
          Republic of the Philippines
        </p>
      </div>
    </div>
  );
}
