import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, Building2, Shield, ChevronRight } from 'lucide-react';
import { authStore } from '../store/authStore';
import { applicantStore } from '../store/applicantStore';

type PortalType = 'select' | 'applicant' | 'staff';

interface LoginPageProps {
  onRegister: () => void;
  onHome?: () => void;
  /** Skip portal picker — e.g. after registration */
  defaultPortal?: 'applicant' | 'staff';
}

export function LoginPage({ onRegister, onHome, defaultPortal }: LoginPageProps) {
  const [portalType, setPortalType] = useState<PortalType>(
    defaultPortal ?? 'select',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredNotice] = useState(defaultPortal === 'applicant');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPw(false);
  };

  const selectPortal = (type: 'applicant' | 'staff') => {
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
          role: 'agent', enterpriseName: 'DOST Regional Office', verified: true,
          portal: 'admin',
        });
      } else if (email === 'admin@dost.gov.ph' && password === 'admin123') {
        authStore.login({
          id: 'admin-001', email, firstName: 'DOST', middleName: '', lastName: 'Admin',
          role: 'admin', enterpriseName: 'DOST Central Office', verified: true,
          portal: 'admin',
        });
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
        setError('This account has been blocked by DOST. Please contact your regional office for assistance.');
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

  /* ── Portal Selection Screen ── */
  if (portalType === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0C2461] via-[#1a3a7a] to-[#0e4d8a] flex items-center justify-center p-4">
        <div className="w-full max-w-lg relative z-10">
          {onHome && (
            <button onClick={onHome} className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          )}

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#0C2461] to-[#1a3a7a] px-8 py-8 text-center">
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.2em] mb-1">Republic of the Philippines</p>
              <p className="text-white font-bold text-base tracking-wide mb-0.5">Department of Science &amp; Technology</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="text-[#00AEEF] font-black text-xl tracking-tight">ai</span>
                <span className="text-white font-black text-xl tracking-tight">SETUP</span>
              </div>
              <p className="text-white/40 text-xs mt-1">Small Enterprise Technology Upgrading Program</p>
            </div>

            <div className="px-8 py-8">
              <h2 className="text-lg font-bold text-gray-800 mb-1 text-center">Sign In</h2>
              <p className="text-gray-400 text-sm mb-7 text-center">New applicants must register before signing in</p>

              <div className="space-y-4">
                <button
                  onClick={() => selectPortal('applicant')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-blue-100 hover:border-[#0C2461] hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-[#0C2461] flex items-center justify-center transition-colors shrink-0">
                    <Building2 className="w-6 h-6 text-[#0C2461] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base">MSME Applicant</p>
                    <p className="text-sm text-gray-500 mt-0.5">Sign in to start or continue your SETUP application</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#0C2461] shrink-0 transition-colors" />
                </button>

                {/* Client Portal — disabled
                <button
                  onClick={() => selectPortal('client')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-blue-100 hover:border-[#0C2461] hover:bg-blue-50 transition-all group text-left"
                >
                  ...
                </button>
                */}

                <button
                  onClick={() => selectPortal('staff')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-purple-100 hover:border-purple-600 hover:bg-purple-50 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 group-hover:bg-purple-600 flex items-center justify-center transition-colors shrink-0">
                    <Shield className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base">DOST Personnel</p>
                    <p className="text-sm text-gray-500 mt-0.5">For authorized DOST agents and administrators</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 shrink-0 transition-colors" />
                </button>
              </div>

              <div className="mt-7 text-center">
                <p className="text-sm text-gray-500">
                  No account yet?{' '}
                  <button onClick={onRegister} className="text-[#0C2461] font-bold hover:underline">
                    Register as MSME Applicant
                  </button>
                </p>
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

  /* ── Login Form Screen ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C2461] via-[#1a3a7a] to-[#0e4d8a] flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => setPortalType('select')}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign-in options
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className={`bg-gradient-to-br ${headerGrad} px-8 py-8 text-center`}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                {isStaff
                  ? <Shield className="w-5 h-5 text-white" />
                  : <Building2 className="w-5 h-5 text-white" />}
              </div>
              <span className="text-white font-bold text-sm">
                {isStaff ? 'DOST Personnel Portal' : 'aiSETUP Application'}
              </span>
            </div>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.2em] mb-1">Republic of the Philippines</p>
            <p className="text-white font-bold text-base tracking-wide mb-0.5">Department of Science &amp; Technology</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-[#00AEEF] font-black text-xl tracking-tight">ai</span>
              <span className="text-white font-black text-xl tracking-tight">SETUP</span>
            </div>
            <p className="text-white/40 text-xs mt-1">Small Enterprise Technology Upgrading Program</p>
          </div>

          <div className="px-8 py-7">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${isStaff ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-800'}`}>
              {isStaff ? <Shield className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
              {isStaff ? 'DOST Personnel Access' : 'MSME Applicant Access'}
            </div>

            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {registeredNotice ? 'Registration complete' : 'Welcome back'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {registeredNotice
                ? 'Sign in with the email and password you just registered to begin your application.'
                : isStaff
                  ? 'Sign in with your DOST credentials'
                  : 'Sign in to continue your SETUP application'}
            </p>

            {registeredNotice && (
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
                  {isStaff ? 'DOST Email Address' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder={isStaff ? 'you@dost.gov.ph' : 'you@example.com'}
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

              <div className="flex justify-end">
                <button type="button" className={`text-xs font-medium hover:underline ${accentText}`}>
                  Forgot password?
                </button>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                style={{ backgroundColor: accentColor }}
                className="w-full flex items-center justify-center gap-2 hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isStaff ? (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Sign In &amp; Start Application <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {!isStaff && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Don&apos;t have an account?{' '}
                  <button onClick={onRegister} className="text-[#0C2461] font-bold hover:underline">
                    Register first
                  </button>
                </p>
              </div>
            )}

            {isStaff && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => selectPortal('applicant')}
                  className="text-xs text-gray-400 hover:text-[#0C2461] hover:underline"
                >
                  MSME applicant? Sign in here
                </button>
              </div>
            )}

            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Demo Credentials</p>
              {isStaff ? (
                <>
                  <p className="text-[11px] text-gray-500">Agent: <span className="font-mono font-semibold">agent@dost.gov.ph</span> / <span className="font-mono font-semibold">admin123</span></p>
                  <p className="text-[11px] text-gray-500">Admin: <span className="font-mono font-semibold">admin@dost.gov.ph</span> / <span className="font-mono font-semibold">admin123</span></p>
                </>
              ) : (
                <p className="text-[11px] text-gray-500">Use your registered email and password</p>
              )}
              {!isStaff && (
                <p className="text-[11px] text-gray-500 mt-1">Demo blocked: <span className="font-mono">maria@techinno.com</span> / <span className="font-mono">Demo@1234</span></p>
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
