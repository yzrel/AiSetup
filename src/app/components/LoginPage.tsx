/**
 * Author: Yzrel Jade B. Eborde
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, Building2 } from 'lucide-react';
import { authStore, type AuthUser, type UserRole } from '../store/authStore';
import { applicantStore } from '../store/applicantStore';
import { notificationStore } from '../store/notificationStore';
import { getApplicantsForStaff } from '../utils/provincialOffice';
import { staffContextStore } from '../store/staffContextStore';
import { DemoModeBanner } from './DemoModeBanner';
import { DemoModeLogoTrigger } from './DemoModeLogoTrigger';
import { DOSTMark } from './DOSTLogos';
import { api, ApiError } from '../api/client';
import { setAuthToken } from '../api/authToken';
import { demoModeStore } from '../store/demoModeStore';

function autoSelectStaffApplicant() {
  const user = authStore.getUser();
  if (!user || !authStore.isStaff(user.role)) return;
  const scoped = getApplicantsForStaff(user);
  if (scoped.length > 0) {
    staffContextStore.setSelectedApplicant(scoped[0].id);
  }
}

function mapApiUserToAuthUser(
  apiUser: import('../api/types').ApiAuthResponse['user'],
): AuthUser {
  return {
    id: apiUser.applicantId || apiUser.id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    middleName: apiUser.middleName ?? '',
    lastName: apiUser.lastName,
    role: apiUser.role as UserRole,
    enterpriseName: apiUser.enterpriseName ?? '',
    applicationId: apiUser.applicationId,
    applicantId: apiUser.applicantId,
    verified: apiUser.verified ?? true,
    portal: apiUser.portal ?? 'admin',
    officeId: apiUser.officeId,
    assignedProvinces: apiUser.assignedProvinces,
  };
}

interface LoginPageProps {
  onRegister: () => void;
  onHome?: () => void;
  /** Show post-registration success banner when arriving from RegisterPage */
  fromRegistration?: boolean;
}

export function LoginPage({ onRegister, onHome, fromRegistration }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(demoModeStore.isEnabled());

  useEffect(
    () => demoModeStore.subscribe(() => setDemoMode(demoModeStore.isEnabled())),
    [],
  );

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const response = await api.login({ email: email.trim(), password });
      setAuthToken(response.token);
      const user = mapApiUserToAuthUser(response.user);

      // Blocked accounts are rejected server-side (401 with a specific message).
      authStore.login(user);
      await applicantStore.hydrateFromBackend(true);
      await notificationStore.hydrateFromBackend();
      if (authStore.isStaff(user.role)) {
        autoSelectStaffApplicant();
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to reach the server. Start the backend (npm run backend) and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C2461] via-[#1a3a7a] to-[#0e4d8a] flex items-center justify-center px-4 sm:px-6 py-4">
      <div className="w-full max-w-md relative z-10">
        {onHome && (
          <button onClick={onHome} className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        )}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#0C2461] via-[#1a3a7a] to-[#0e4d8a] px-4 sm:px-8 py-6 sm:py-7 text-center transition-all duration-300">
            <DemoModeLogoTrigger className="inline-block mx-auto">
              <div className="flex flex-col items-center gap-2 mb-2">
                <DOSTMark size={40} />
                <div className="flex items-center justify-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-bold text-sm">
                    aiSETUP Sign In
                  </span>
                </div>
              </div>
            </DemoModeLogoTrigger>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.2em] mb-0.5">Republic of the Philippines</p>
            <p className="text-white font-bold text-sm tracking-wide">Department of Science &amp; Technology</p>
          </div>

          <div className="px-4 sm:px-8 py-6 sm:py-7">
            <div className="mb-4">
              <DemoModeBanner compact />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {fromRegistration ? 'Registration complete' : 'Welcome back'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {fromRegistration
                ? 'Sign in with the email and password you just registered.'
                : 'Sign in to continue — MSME applicants and DOST staff use the same form.'}
            </p>

            {fromRegistration && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl px-3 py-2.5 mb-4">
                <Building2 className="w-4 h-4 shrink-0" />
                Your account was created. Sign in below to open aiSETUP.
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="you@example.com or name@dost.gov.ph"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <button onClick={onRegister} className="text-[#0C2461] font-bold hover:underline">
                  Register as MSME Applicant
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                DOST staff accounts are issued by your office administrator.
              </p>
            </div>

            {demoMode && (
            <div className="mt-4 rounded-xl p-3 border bg-gray-50 border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Dev credentials (seeded users)</p>
              <p className="text-[11px] text-gray-600"><span className="font-semibold text-[#0C2461]">Applicant:</span> <span className="font-mono">juan@abcfood.com</span> / <span className="font-mono">Demo@1234</span></p>
              <p className="text-[11px] text-gray-600 mt-1.5"><span className="font-semibold text-[#0C2461]">Admin:</span> <span className="font-mono">admin@dost.gov.ph</span> / <span className="font-mono">admin123</span></p>
              <p className="text-[11px] text-gray-600 mt-0.5"><span className="font-semibold text-[#0C2461]">Regional Director:</span> <span className="font-mono">rd@dost.gov.ph</span> / <span className="font-mono">admin123</span></p>
              <p className="text-[11px] text-gray-600 mt-0.5"><span className="font-semibold text-[#0C2461]">Agent:</span> <span className="font-mono">agent@dost.gov.ph</span> / <span className="font-mono">admin123</span></p>
              <p className="text-[11px] text-gray-600 mt-0.5"><span className="font-semibold text-[#0C2461]">Provincial Director:</span> <span className="font-mono">director.cotabato@dost.gov.ph</span> / <span className="font-mono">admin123</span></p>
              <p className="text-[10px] text-gray-400 mt-0.5">Also: <span className="font-mono">director.southcot</span>, <span className="font-mono">director.sk</span>, <span className="font-mono">director.sargen</span> @dost.gov.ph</p>
            </div>
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-[10px] mt-4">
          © {new Date().getFullYear()} Department of Science and Technology — Republic of the Philippines
        </p>
      </div>
    </div>
  );
}
