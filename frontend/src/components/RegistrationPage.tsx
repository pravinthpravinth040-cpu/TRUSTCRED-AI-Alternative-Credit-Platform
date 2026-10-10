import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Check, 
  Lock, 
  AlertCircle, 
  ArrowRight,
  Eye,
  EyeOff,
  Building,
  MapPin,
  Calendar,
  IndianRupee,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface RegistrationPageProps {
  onRegisterSuccess: (user: User, token: string) => void;
  onNavigateToLogin: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  onRegisterSuccess,
  onNavigateToLogin
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessCategory: 'Grocery and Retail',
    businessLocation: '',
    businessStartDate: '',
    estimatedMonthlyIncome: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const businessCategories = [
    'Food and Beverage',
    'Grocery and Retail',
    'Street Vendor',
    'Tailoring and Textiles',
    'Repair and Maintenance',
    'Transport and Logistics',
    'Home-Based Business',
    'Online Seller',
    'Other Small Business'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(null);
  };

  const isPasswordValid = formData.password.length >= 8;
  const doPasswordsMatch = formData.password && formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid business email address.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (!doPasswordsMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!formData.businessName.trim()) {
      setErrorMessage('Please enter your business or trading enterprise name.');
      return;
    }
    if (!hasConsented) {
      setErrorMessage('You must consent to the privacy-preserving transaction assessment.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.fullName.trim(),
        role: 'borrower',
        business_name: formData.businessName.trim(),
        business_type: formData.businessCategory,
        phone: formData.mobile.trim(),
        address: formData.businessLocation.trim(),
        monthly_turnover_estimate: parseFloat(formData.estimatedMonthlyIncome) || 0
      });

      const token = res.access_token;
      localStorage.setItem('trustcred_token', token);
      
      const userProfile: User = await api.getMe();
      onRegisterSuccess(userProfile, token);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B6D] text-white shadow-sm">
              <ShieldCheck className="h-6 w-6 text-white stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#123B6D]">
                TRUST<span className="text-blue-600">CRED</span> AI
              </span>
              <p className="text-[11px] text-text-secondary">Alternative Financial Evidence Platform</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Sign In
          </button>
        </div>

        {/* Main Registration Card */}
        <div className="bank-card p-6 sm:p-10 shadow-md border border-[#E2E8F0]">
          <div className="border-b border-[#E2E8F0] pb-6 mb-6">
            <h1 className="text-2xl font-bold text-[#172B4D]">Create Your TRUSTCRED Account</h1>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              Register your small enterprise to convert daily digital UPI & QR sales into independently verifiable credit evidence.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Account Details Section */}
            <div>
              <h3 className="text-xs font-bold text-[#123B6D] uppercase tracking-wider mb-3">
                1. Owner & Login Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. ramesh@kirana.in"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-type password to verify"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                  {formData.password && (
                    <div className="flex items-center space-x-4 mt-2 text-[11px]">
                      <span className={`flex items-center ${isPasswordValid ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                        <Check className="w-3 h-3 mr-1" /> At least 8 characters
                      </span>
                      <span className={`flex items-center ${doPasswordsMatch ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                        <Check className="w-3 h-3 mr-1" /> Passwords match
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Business Details Section */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-[#123B6D] uppercase tracking-wider mb-3">
                2. Enterprise Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Business / Enterprise Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Kirana Provisions"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Business Category *
                  </label>
                  <select
                    name="businessCategory"
                    value={formData.businessCategory}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    {businessCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Business Location / City *
                  </label>
                  <input
                    type="text"
                    name="businessLocation"
                    value={formData.businessLocation}
                    onChange={handleChange}
                    placeholder="e.g. Shop 4, Gandhi Market, Jaipur"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Business Start Date
                  </label>
                  <input
                    type="date"
                    name="businessStartDate"
                    value={formData.businessStartDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-main mb-1.5">
                    Estimated Monthly Business Inflow (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="estimatedMonthlyIncome"
                      value={formData.estimatedMonthlyIncome}
                      onChange={handleChange}
                      placeholder="e.g. 150000"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Used as initial baseline before digital bank/UPI statements are uploaded for verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy & Consent Agreement */}
            <div className="pt-2">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <label htmlFor="consentCheck" className="text-xs text-text-main leading-relaxed cursor-pointer select-none">
                    <span className="font-semibold text-[#123B6D]">Consent for Alternative Financial Data Assessment: </span>
                    I hereby authorize TRUSTCRED AI to analyze my uploaded digital transaction records (UPI, POS, QR statements) solely to generate explainable cash flow metrics. I understand that I retain granular authority to share or revoke reports with partner lending institutions at any time.
                  </label>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-text-secondary pl-7">
                  <Lock className="w-3.5 h-3.5 text-blue-700" />
                  <span>
                    No bank passwords, OTPs, or net-banking PINs are ever collected.{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-blue-600 underline font-medium hover:text-blue-800"
                    >
                      Read Terms & Privacy Policy
                    </button>
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !hasConsented}
                className="w-full py-3 px-4 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create TRUSTCRED Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Already have account */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center">
            <p className="text-xs text-text-secondary">
              Already registered?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                Sign in to your account
              </button>
            </p>
          </div>
        </div>

      </div>

      {/* Terms & Privacy Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bank-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-2 text-[#123B6D]">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-text-main">Privacy Policy & Platform Terms</h3>
              </div>
            </div>
            <div className="py-4 text-xs text-text-secondary space-y-3 leading-relaxed">
              <p>
                <strong>1. Zero-Credential Architecture:</strong> TRUSTCRED AI operates exclusively as an alternative analytical framework. Under no circumstances does the platform request, store, or transmit your banking passwords, MPIN, or UPI transaction pins.
              </p>
              <p>
                <strong>2. Data Usage & Scope:</strong> Transaction CSVs uploaded by the vendor are processed strictly to calculate verifiable receipts, operating expenses, and Debt Service Coverage Ratios (DSCR).
              </p>
              <p>
                <strong>3. Non-Bureau Prototype Disclaimer:</strong> The calculated Demonstration Score (300-850) is an algorithmic evaluation model designed for alternative financial proof. It does not replace statutory credit bureau scores or guarantee loan sanctions.
              </p>
              <p>
                <strong>4. Revocable Consent:</strong> You retain complete ownership over generated reports and can revoke access granted to any lending partner at any time.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 rounded-lg bg-primary-800 text-white text-xs font-semibold hover:bg-primary-900 transition"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
