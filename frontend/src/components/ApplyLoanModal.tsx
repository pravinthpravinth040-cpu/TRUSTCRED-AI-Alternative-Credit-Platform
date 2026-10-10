import React, { useState } from 'react';
import { 
  Coins, 
  X, 
  CheckCircle2, 
  Building2, 
  Percent, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  Info
} from 'lucide-react';
import { User, AssessmentReport } from '../types';

interface ApplyLoanModalProps {
  currentUser: User | null;
  assessment: AssessmentReport | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (application: any) => void;
}

export const ApplyLoanModal: React.FC<ApplyLoanModalProps> = ({
  currentUser,
  assessment,
  isOpen,
  onClose,
  onSubmitSuccess
}) => {
  const [loanAmount, setLoanAmount] = useState(50000);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(16.5);
  const [purpose, setPurpose] = useState('Wholesale Inventory & Stock Restocking');
  const [lenderPartner, setLenderPartner] = useState('Apex Micro-Enterprise Capital');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate monthly EMI using standard formula
  const monthlyRate = interestRate / 12 / 100;
  const emi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  );
  const totalRepayment = emi * tenureMonths;
  const totalInterest = totalRepayment - loanAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSubmitSuccess({
          loanAmount,
          tenureMonths,
          purpose,
          lenderPartner,
          emi,
          status: 'Under Review'
        });
        onClose();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bank-card p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E8F0]">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#172B4D]">
              Apply for Working Capital Micro-Loan
            </h3>
            <p className="text-xs text-text-secondary">
              Direct application backed by your verified digital cash flow evidence
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-text-main">Loan Application Submitted!</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Your application and verified 90-day cash flow dossier have been submitted to {lenderPartner} for underwriting review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Applicant Summary */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
              <div>
                <span className="text-text-secondary">Applicant: </span>
                <span className="font-bold text-text-main">{currentUser?.full_name}</span>
              </div>
              <div>
                <span className="text-text-secondary">Demonstration Score: </span>
                <span className="font-bold text-blue-700">{assessment?.prototype_score || 780} / 850</span>
              </div>
            </div>

            {/* Requested Amount Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-text-main">
                  Requested Loan Amount (₹)
                </label>
                <span className="text-sm font-bold text-[#123B6D]">
                  ₹{loanAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="250000"
                step="5000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                <span>₹10,000 (Micro)</span>
                <span>Max Recommended: ₹{assessment?.max_recommended_loan?.toLocaleString('en-IN') || '75,000'}</span>
                <span>₹2,50,000</span>
              </div>
            </div>

            {/* Tenure & Partner Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Repayment Tenure
                </label>
                <select
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months (Recommended)</option>
                  <option value={18}>18 Months</option>
                  <option value={24}>24 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Lending Partner
                </label>
                <select
                  value={lenderPartner}
                  onChange={(e) => setLenderPartner(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main"
                >
                  <option value="Apex Micro-Enterprise Capital">Apex Micro-Enterprise Capital (NBFC)</option>
                  <option value="Samriddhi MSME Cooperative">Samriddhi MSME Cooperative Bank</option>
                  <option value="Fintech Micro Lending Trust">Fintech Micro Lending Trust</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">
                Stated Business Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main"
              >
                <option value="Wholesale Inventory & Stock Restocking">Wholesale Inventory & Stock Restocking</option>
                <option value="Commercial Stall / Kiosk Expansion">Commercial Stall / Kiosk Expansion</option>
                <option value="Equipment & Commercial Kitchen Tooling">Equipment & Commercial Tooling</option>
                <option value="Seasonal Festival Working Capital">Seasonal Working Capital Buffer</option>
              </select>
            </div>

            {/* Calculated EMI Preview Box */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
              <div className="text-xs font-bold text-[#123B6D] flex items-center justify-between">
                <span>Estimated Monthly Repayment (EMI):</span>
                <span className="text-base text-blue-700">₹{emi.toLocaleString('en-IN')} / mo</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary pt-1 border-t border-blue-200/60">
                <div>Total Interest: ₹{totalInterest.toLocaleString('en-IN')}</div>
                <div>Total Repayment: ₹{totalRepayment.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#CBD5E1] text-xs font-medium text-text-secondary hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
