/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect } from 'react';
import {
  DOST_REGION_12_OFFICE,
  REGION_12_LABEL,
} from "../constants/region12";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, Building2, Shield } from 'lucide-react';
import { authStore } from '../store/authStore';
import { applicantStore } from '../store/applicantStore';
import { getApplicantsForStaff } from '../utils/provincialOffice';
import { staffContextStore } from '../store/staffContextStore';
import { DemoModeBanner } from './DemoModeBanner';
import { DemoModeLogoTrigger } from './DemoModeLogoTrigger';
import { DOSTMark } from './DOSTLogos';

function autoSelectStaffApplicant() {
  const user = authStore.getUser();
  if (!user || (user.role !== 'admin' && user.role !== 'agent')) return;
  const scoped = getApplicantsForStaff(user);
  if (scoped.length > 0) {
    staffContextStore.setSelectedApplicant(scoped[0].id);
  }
}

type PortalType = 'applicant' | 'staff';

interface LoginPageProps {
  onRegister: () => void;
  onHome?: () => void;
  /** Pre-select portal — e.g. from landing page Staff Portal or after registration */
  defaultPortal?: 'applicant' | 'staff';
}

export function LoginPage({ onRegister, onHome, defaultPortal }: LoginPageProps) {
  const [portalType, setPortalType] = useState<PortalType>(
    defaultPortal ?? 'applicant',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredNotice] = useState(defaultPortal === 'applicant');

  useEffect(() => {
    if (defaultPortal) {
      setPortalType(defaultPortal);
    }
  }, [defaultPortal]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPw(false);
  };

  const selectPortal = (type: PortalType) => {
    if (type === portalType) return;
    resetForm();
    setPortalType(type);
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));

    if (portalType === 'staff') {
      if (email === 'agent@dost.gov.ph' && password === 'admin123') {
        authStore.login({
          id: 'agent-001', email, firstName: 'DOST', middleName: '', lastName: 'Agent',
          role: 'agent', enterpriseName: `${DOST_REGION_12_OFFICE} — Provincial S&T Center`, verified: true,
          portal: 'admin',
          officeId: 'south-cotabato',
          assignedProvinces: ['South Cotabato'],
        });
        autoSelectStaffApplicant();
      } else if (email === 'admin@dost.gov.ph' && password === 'admin123') {
        authStore.login({
          id: 'admin-001', email, firstName: 'DOST', middleName: '', lastName: 'Admin',
          role: 'admin', enterpriseName: `${DOST_REGION_12_OFFICE} — Regional Office`, verified: true,
          portal: 'admin',
          officeId: 'regional',
        });
        autoSelectStaffApplicant();
      } else {
        setError('Invalid credentials. Only authorized DOST personnel can access this portal.');
      }
    } else if (portalType === 'applicant') {
      const blockReason = applicantStore.getLoginBlockReason(email, password);
      const applicant = applicantStore.verifyLogin(email, password);
      if (applicant) {
        authStore.login({
          id: applicant.id,
          email: applicant.emailAddress,
          firstName: String(applicant.moduleData.firstName ?? applicant.applicantName.split(' ')[0]),
          middleName: String(applicant.moduleData.middleName ?? ''),
          lastName: String(applicant.moduleData.lastName ?? applicant.applicantName.split(' ').slice(1).join(' ')),
          role: 'applicant',
          enterpriseName: applicant.enterpriseName,
          applicationId: applicant.applicationId,
          avatarUrl: applicant.moduleData.selfie,
          verified: true,
          portal: 'admin',
        });
      } else if (blockReason === 'blocked') {
        setError('This account has been blocked by DOST Region XII. Please contact the DOST XII office in Koronadal City for assistance.');
      } else {
        setError('Invalid email or password. Please register first or check your credentials.');
      }
    }

  /* Client community portal — disabled
    } else {
      if (email && password.length >= 6) {
        authStore.login({
          id: 'client-001', email,
          firstName: 'Applicant', middleName: '', lastName: 'User',
          role: 'client', enterpriseName: 'My Enterprise', verified: true,
          portal: 'client',
        });
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    }
  */

    setLoading(false);
  };

  const isStaff = portalType === 'staff';
  const accentColor = isStaff ? '#7C3AED' : '#0C2461';
  const accentText = isStaff ? 'text-purple-700' : 'text-blue-900';
  const accentRing = isStaff ? 'focus:ring-purple-200 focus:border-purple-400' : 'focus:ring-blue-200 focus:border-blue-400';
  const headerGrad = isStaff
    ? 'from-[#4C1D95] via-[#6D28D9] to-[#7C3AED]'
    : 'from-[#0C2461] via-[#1a3a7a] to-[#0e4d8a]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C2461] via-[#1a3a7a] to-[#0e4d8a] flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        {onHome && (
          <button onClick={onHome} className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        )}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className={`bg-gradient-to-br ${headerGrad} px-8 py-7 text-center transition-all duration-300`}>
            <DemoModeLogoTrigger className="inline-block mx-auto">
              <div className="flex flex-col items-center gap-2 mb-2">
                <DOSTMark size={40} />
                <div className="flex items-center justify-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    {isStaff
                      ? <Shield className="w-5 h-5 text-white" />
                      : <Building2 className="w-5 h-5 text-white" />}
                  </div>
                  <span className="text-white font-bold text-sm">
                    {isStaff ? 'DOST Staff Portal' : 'aiSETUP Application'}
                  </span>
                </div>
              </div>
            </DemoModeLogoTrigger>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.2em] mb-0.5">Republic of the Philippines</p>
            <p className="text-white font-bold text-sm tracking-wide">Department of Science &amp; Technology</p>
          </div>

          {/* Portal tabs */}
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => selectPortal('applicant')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-bold transition-colors ${
                !isStaff
                  ? 'text-[#0C2461] border-b-2 border-[#0C2461] bg-blue-50/50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              MSME Applicant
            </button>
            <button
              type="button"
              onClick={() => selectPortal('staff')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-bold transition-colors ${
                isStaff
                  ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50/50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              DOST Staff
            </button>
          </div>

          <div className="px-8 py-7">
            <div className="mb-4">
              <DemoModeBanner compact />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {registeredNotice && !isStaff
                ? 'Registration complete'
                : isStaff
                  ? 'Staff sign in'
                  : 'Welcome back'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {registeredNotice && !isStaff
                ? 'Sign in with the email and password you just registered.'
                : isStaff
                  ? 'Access the admin dashboard, account management, and application reviews.'
                  : 'Sign in to continue your SETUP application.'}
            </p>

            {registeredNotice && !isStaff && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl px-3 py-2.5 mb-4">
                <Building2 className="w-4 h-4 shrink-0" />
                Your account was created. Sign in below to open aiSETUP.
              </div>
            )}

            {isStaff && (
              <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 text-purple-800 text-xs rounded-xl px-3 py-2.5 mb-4">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                For authorized DOST agents and administrators only. MSME applicants should use the Applicant tab.
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
                  {isStaff ? 'DOST Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder={isStaff ? 'name@dost.gov.ph' : 'you@example.com'}
                    className={`w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 ${accentRing}`}
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
                    className={`w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 ${accentRing}`}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isStaff && (
                <div className="flex justify-end">
                  <button type="button" className={`text-xs font-medium hover:underline ${accentText}`}>
                    Contact IT support
                  </button>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                style={{ backgroundColor: accentColor }}
                className="w-full flex items-center justify-center gap-2 hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isStaff ? (
                  <>Sign In to Admin Portal <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Sign In &amp; Continue Application <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {!isStaff && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Don&apos;t have an account?{' '}
                  <button onClick={onRegister} className="text-[#0C2461] font-bold hover:underline">
                    Register as MSME Applicant
                  </button>
                </p>
              </div>
            )}

            <div className={`mt-4 rounded-xl p-3 border ${isStaff ? 'bg-purple-50/50 border-purple-100' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Demo Credentials</p>
              {isStaff ? (
                <>
                  <p className="text-[11px] text-gray-600"><span className="font-semibold text-purple-700">Admin:</span> <span className="font-mono">admin@dost.gov.ph</span> / <span className="font-mono">admin123</span></p>
                  <p className="text-[11px] text-gray-600 mt-0.5"><span className="font-semibold text-purple-700">Agent:</span> <span className="font-mono">agent@dost.gov.ph</span> / <span className="font-mono">admin123</span></p>
                  <p className="text-[11px] text-gray-500 mt-2">Presenters: 5× click the DOST logo to unlock all modules (works on login and registration too).</p>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-gray-500">Use your registered email and password</p>
                  <p className="text-[11px] text-gray-500 mt-1">Demo: <span className="font-mono">juan@abcfood.com</span> / <span className="font-mono">Demo@1234</span></p>
                  <p className="text-[11px] text-gray-500 mt-2">Presenters: 5× click the DOST logo to unlock all modules (works on login and registration too).</p>
                 </>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-white/30 text-[10px] mt-4">
          © {new Date().getFullYear()} Department of Science and Technology — Republic of the Philippines
        </p>
      </div>
    </div>
  );
}
