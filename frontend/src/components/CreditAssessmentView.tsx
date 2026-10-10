import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  Download, 
  Share2, 
  Hash, 
  KeyRound, 
  Check, 
  Copy, 
  Info, 
  Calendar, 
  Layers, 
  FileCheck,
  TrendingUp,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { AssessmentReport, User } from '../types';

interface CreditAssessmentViewProps {
  assessment: AssessmentReport | null;
  currentUser: User | null;
  onGenerateReport: () => void;
  onGrantConsent: () => void;
  isLoading: boolean;
}

export const CreditAssessmentView: React.FC<CreditAssessmentViewProps> = ({
  assessment,
  currentUser,
  onGenerateReport,
  onGrantConsent,
  isLoading
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedSig, setCopiedSig] = useState(false);

  const handleCopy = (text: string, type: 'hash' | 'sig') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedSig(true);
      setTimeout(() => setCopiedSig(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    if (!assessment) return;
    const blob = new Blob([JSON.stringify(assessment.summary_data || assessment, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TRUSTCRED_REPORT_${assessment.report_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const score = assessment?.prototype_score || 740;
  // Percentage in 300 - 850 range
  const percentage = Math.min(100, Math.max(0, ((score - 300) / (850 - 300)) * 100));
  const strokeDashoffset = 440 - (440 * percentage) / 100;

  return (
    <div className="space-y-6">
      {/* Assessment Header */}
      <div className="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bank-badge bg-blue-100 text-[#123B6D] border border-blue-200">
              Explainable Rule Assessment v1.4
            </span>
            <span className="text-xs text-text-secondary">
              Report ID: {assessment?.report_id || 'TC-RPT-DEMO'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#172B4D] mt-1.5">
            Alternative Credit & Financial Dossier
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 max-w-2xl">
            Derived entirely from verified digital transaction records without penalizing lack of traditional bureau history, salary slips, or collateral.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onGenerateReport}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-text-main transition shadow-2xs cursor-pointer"
          >
            {isLoading ? 'Recomputing...' : 'Recompute Assessment'}
          </button>
          <button
            onClick={handleDownloadJson}
            className="px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-text-secondary transition shadow-2xs"
            title="Download Canonical JSON Payload"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onGrantConsent}
            className="px-4 py-2 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share with Lender</span>
          </button>
        </div>
      </div>

      {/* Main Score & Core Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Score Gauge (4 cols) */}
        <div className="lg:col-span-4 bank-card p-6 border border-[#E2E8F0] bg-white text-center flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Alternative Demonstration Score
            </div>

            {/* Radial Gauge */}
            <div className="relative w-44 h-44 mx-auto my-5 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className="stroke-slate-100"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className="stroke-[#123B6D]"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="440"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-[#123B6D]">
                  {score}
                </span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">
                  out of 850
                </span>
                <span className="bank-badge mt-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px]">
                  {assessment?.risk_tier || 'Low Risk'}
                </span>
              </div>
            </div>

            <div className="text-xs text-text-secondary">
              Calibrated from 90 days of digital receipts & transaction continuity.
            </div>
          </div>

          {/* Prototype Non-bureau Disclaimer */}
          <div className="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-[#123B6D] text-left leading-relaxed">
            <div className="font-semibold flex items-center mb-0.5">
              <Info className="w-3.5 h-3.5 mr-1 text-blue-700 flex-shrink-0" />
              Non-Bureau Prototype Notice
            </div>
            This demonstration score illustrates alternative cash-flow solvency. It does not replace statutory credit bureau scores or guarantee loan sanctions.
          </div>
        </div>

        {/* Right: Key Verified Solvency Metrics (8 cols) */}
        <div className="lg:col-span-8 bank-card p-6 border border-[#E2E8F0] bg-white">
          <h3 className="text-sm font-bold text-[#172B4D] pb-3 border-b border-[#E2E8F0]">
            Verified Financial Underwriting Indicators
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-medium text-text-secondary">Total Verified Receipts</div>
              <div className="text-base font-bold text-emerald-700 mt-1">
                {formatCurrency(assessment?.total_verified_receipts || 0)}
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">Customer sales inflows</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-medium text-text-secondary">Operating Expenses</div>
              <div className="text-base font-bold text-amber-700 mt-1">
                {formatCurrency(assessment?.estimated_operating_expenses || 0)}
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">Commercial restock & outlays</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-medium text-text-secondary">Net Operating Cash Flow</div>
              <div className="text-base font-bold text-[#123B6D] mt-1">
                {formatCurrency(assessment?.estimated_net_cash_flow || 0)}
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">Operational surplus</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-medium text-text-secondary">Debt Service Coverage (DSCR)</div>
              <div className="text-base font-bold text-emerald-700 mt-1">
                {assessment?.dscr ? `${assessment.dscr.toFixed(2)}x` : '2.15x'}
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">Target &gt; 1.25x for safety</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-medium text-text-secondary">Income Consistency</div>
              <div className="text-base font-bold text-blue-700 mt-1">
                {assessment?.income_consistency_score ? `${assessment.income_consistency_score.toFixed(0)} / 100` : '85 / 100'}
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">Based on low CV coefficient</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-medium text-text-secondary">Prudent Maximum Loan</div>
              <div className="text-base font-bold text-[#123B6D] mt-1">
                {formatCurrency(assessment?.max_recommended_loan || 50000)}
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">Affordable borrowing cap</div>
            </div>
          </div>

          <div className="mt-5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-text-secondary">Analysis Window: </span>
              <span className="font-semibold text-text-main">
                {assessment?.history_months || 3} Months ({assessment?.active_days || 82} active trading days)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-text-secondary">Total Transactions: </span>
              <span className="font-semibold text-text-main">
                {assessment?.transaction_count || 142} Records
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Explanation: Positive Drivers & Identified Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supporting Positive Indicators */}
        <div className="bank-card p-6 border border-[#E2E8F0] bg-white">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0] text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-sm font-bold text-[#172B4D]">Supporting Positive Financial Indicators</h3>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
            {(assessment?.positive_drivers && assessment.positive_drivers.length > 0
              ? assessment.positive_drivers
              : [
                  'Consistent daily digital QR receipts with high weekend and evening trading activity',
                  'Positive net operational cash flow margin exceeding 30%',
                  'Healthy Debt Service Coverage Ratio (DSCR > 1.8x)',
                  'Active daily supplier restocking payments confirming live trading status'
                ]
            ).map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Identified Financial Risks & Limitations */}
        <div className="bank-card p-6 border border-[#E2E8F0] bg-white">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0] text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-sm font-bold text-[#172B4D]">Identified Risks & Model Limitations</h3>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
            {(assessment?.risk_factors && assessment.risk_factors.length > 0
              ? assessment.risk_factors
              : [
                  'Micro-merchant income subject to seasonal weather and festival footfall variances',
                  'Absence of multi-year formal tax filing records (GST / ITR)',
                  'Cash sales component is unverified and excluded from gross receipts',
                  'Informal supplier credit agreements cannot be independently cross-verified'
                ]
            ).map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Cryptographic Tamper-Evidence & Integrity Proof */}
      <div className="bank-card p-6 border border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0]">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-[#172B4D]">
            Cryptographic Tamper-Evidence & Verification Digest
          </h3>
        </div>
        <p className="text-xs text-text-secondary mt-2 leading-relaxed">
          Every report generates a deterministic canonical SHA-256 integrity hash signed with an HMAC platform key. Any alteration to the numbers invalidates the cryptographic proof.
        </p>

        <div className="mt-4 space-y-3 font-mono text-xs">
          {/* SHA-256 Digest */}
          <div className="p-3 rounded-lg bg-white border border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-text-secondary uppercase font-sans font-bold block">
                SHA-256 Canonical Report Hash:
              </span>
              <span className="text-[11px] text-[#123B6D] font-bold break-all">
                {assessment?.sha256_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </span>
            </div>
            <button
              onClick={() => handleCopy(assessment?.sha256_hash || '', 'hash')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-[#E2E8F0] text-text-secondary hover:text-text-main text-[11px] font-sans flex-shrink-0"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
            </button>
          </div>

          {/* HMAC Digital Signature */}
          <div className="p-3 rounded-lg bg-white border border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-text-secondary uppercase font-sans font-bold block">
                HMAC Platform Digital Signature:
              </span>
              <span className="text-[11px] text-text-secondary break-all">
                {assessment?.digital_signature || '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b'}
              </span>
            </div>
            <button
              onClick={() => handleCopy(assessment?.digital_signature || '', 'sig')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-[#E2E8F0] text-text-secondary hover:text-text-main text-[11px] font-sans flex-shrink-0"
            >
              {copiedSig ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSig ? 'Copied' : 'Copy Sig'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
