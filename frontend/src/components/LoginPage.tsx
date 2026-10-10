import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  FileCheck, 
  Building2, 
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToRegister
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Demo personas for instant 1-click evaluation
  const demoPersonas = [
    { label: '🏪 Ramesh (Kirana)', email: 'ramesh@trustcred.ai', role: 'Vendor' },
    { label: '🍲 Priya (Street Food)', email: 'priya@trustcred.ai', role: 'Vendor' },
    { label: '🚚 Anil (Logistics)', email: 'anil@trustcred.ai', role: 'Vendor' },
    { label: '🛡️ Rajesh (Verifier)', email: 'verifier@trustcred.ai', role: 'Verifier' },
    { label: '🏦 Meera (Lender)', email: 'lender@trustcred.ai', role: 'Lender' },
  ];

  const handleSelectDemoPersona = (pEmail: string) => {
    setEmail(pEmail);
    setPassword('trustcred123');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address or registered username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      let res;
      try {
        res = await api.login(email.trim(), password);
      } catch (loginErr: any) {
        // If login failed because demo accounts aren't initialized yet, seed them!
        if (loginErr.message?.includes('Invalid credentials') || loginErr.message?.includes('failed') || loginErr.message?.includes('400')) {
          try {
            await api.seedDemoAccounts();
            res = await api.login(email.trim(), password);
          } catch (seedErr) {
            throw loginErr;
          }
        } else {
          throw loginErr;
        }
      }

      const token = res.access_token;
      localStorage.setItem('trustcred_token', token);
      if (rememberMe) {
        localStorage.setItem('trustcred_remember_email', email.trim());
      } else {
        localStorage.removeItem('trustcred_remember_email');
      }

      // Fetch user profile
      const userProfile: User = await api.getMe();
      onLoginSuccess(userProfile, token);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Section: Banking Brand & Value Proposition */}
        <div className="lg:col-span-7 space-y-6 pr-0 lg:pr-6">
          {/* Logo & Product Title */}
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#123B6D] text-white shadow-md">
              <ShieldCheck className="h-7 w-7 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold tracking-tight text-[#123B6D]">
                  TRUST<span className="text-blue-600">CRED</span>
                </span>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                  AI
                </span>
              </div>
              <p className="text-xs text-text-secondary font-medium">
                Alternative Credit & Financial Evidence Platform
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight leading-tight">
              Your Business Deserves Better Financial Opportunities
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-xl">
              TRUSTCRED AI transforms daily digital QR and UPI sales records into privacy-preserving, tamper-evident credit assessments—empowering micro-merchants and street entrepreneurs to obtain fair working-capital credit without traditional collateral.
            </p>
          </div>

          {/* Three Feature Highlights */}
          <div className="space-y-4 pt-1">
            <div className="flex items-start space-x-3.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-main">
                  1. Understand your business cash flow
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Automated statement analysis categorizes legitimate customer sales receipts while strictly filtering out personal transfers and refunds.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-main">
                  2. Share financial evidence securely
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Every generated report carries a SHA-256 cryptographic digest and digital signature. Control lender access with granular consent and one-click revocation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-main">
                  3. Give lenders a clearer view of your business
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Regulated financial institutions review objective Debt Service Coverage Ratios (DSCR) and trading consistency instead of rejecting due to lack of bureau history.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Message Banner */}
          <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-[#123B6D]">
            <Lock className="w-4 h-4 text-blue-700 flex-shrink-0" />
            <span className="font-medium">
              Privacy Guarantee: Your bank password, net banking credentials, and UPI PIN are <span className="font-bold underline">never</span> requested or stored.
            </span>
          </div>
        </div>

        {/* Right Section: Banking Sign-in Card */}
        <div className="lg:col-span-5">
          <div className="bank-card p-6 sm:p-8 shadow-md border border-[#E2E8F0]">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#172B4D]">Welcome Back</h2>
              <p className="text-xs text-text-secondary mt-1">
                Sign in to access your TRUSTCRED account.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Quick Demo Persona Autofill for Evaluators */}
            <div className="mb-5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Quick Demo Access:
                </span>
                <span className="text-[10px] text-blue-600 font-medium">1-Click Test Fill</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {demoPersonas.map((persona) => (
                  <button
                    key={persona.email}
                    type="button"
                    onClick={() => handleSelectDemoPersona(persona.email)}
                    className={`text-left px-2 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                      email === persona.email
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                        : 'bg-white text-text-main border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">{persona.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Email Address or Username
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@trustcred.ai"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-text-main">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs text-text-secondary select-none">Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Registration link */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center">
              <p className="text-xs text-text-secondary">
                New small-business vendor?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  Create an Account
                </button>
              </p>
            </div>

            {/* Privacy footer */}
            <div className="mt-5 text-center">
              <span className="inline-flex items-center text-[11px] text-text-secondary font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                Protected access • Privacy-first financial assessment
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bank-card p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-2 text-[#123B6D]">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-text-main">Password Assistance</h3>
              </div>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 text-xs text-text-secondary space-y-2.5 leading-relaxed">
              <p>
                In the TRUSTCRED AI demonstration environment, all seeded demo accounts share the standard evaluation password:
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono text-xs font-bold text-text-main">
                trustcred123
              </div>
              <p>
                For custom registered accounts, password resets are processed via institutional verification through your lending partner or system administrator.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 rounded-lg bg-primary-800 text-white text-xs font-semibold hover:bg-primary-900 transition"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
