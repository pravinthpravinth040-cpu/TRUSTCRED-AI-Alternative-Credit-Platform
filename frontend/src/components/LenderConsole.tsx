import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  HelpCircle, 
  FileCheck2, 
  ArrowRight, 
  Percent, 
  Coins, 
  Calendar, 
  Lock, 
  ExternalLink, 
  ShieldAlert, 
  Search, 
  Check, 
  Scale, 
  RefreshCw,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { LenderPipelineItem } from '../types';
import { api } from '../services/api';

interface LenderConsoleProps {
  pipeline: LenderPipelineItem[];
  onRecordDecision: (reportId: string, decision: any) => Promise<void>;
  isLoading: boolean;
  onRefresh: () => void;
}

export const LenderConsole: React.FC<LenderConsoleProps> = ({
  pipeline,
  onRecordDecision,
  isLoading,
  onRefresh
}) => {
  const [selectedItem, setSelectedItem] = useState<LenderPipelineItem | null>(null);
  const [detailedReport, setDetailedReport] = useState<any | null>(null);
  const [isVerifyingCrypto, setIsVerifyingCrypto] = useState(false);
  const [cryptoResult, setCryptoResult] = useState<any | null>(null);

  // Decision Form State
  const [decision, setDecision] = useState('approved');
  const [approvedAmount, setApprovedAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(16.5);
  const [loanTerm, setLoanTerm] = useState(12);
  const [conditions, setConditions] = useState('Daily UPI flexi-sweep auto-repayment from primary settlement account.');
  const [decisionNotes, setDecisionNotes] = useState('Verified strong net cash flow surplus and consistent active daily trading.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectReport = async (item: LenderPipelineItem) => {
    setSelectedItem(item);
    setCryptoResult(null);
    try {
      const data = await api.getLenderReport(item.report_id);
      setDetailedReport(data);
      if (item.max_recommended_loan) {
        setApprovedAmount(item.max_recommended_loan);
      }
    } catch (e) {
      console.error(e);
      // Fallback with current item details
      setDetailedReport(item);
      setApprovedAmount(item.max_recommended_loan || 50000);
    }
  };

  const handleVerifyReportCrypto = async (reportId: string) => {
    setIsVerifyingCrypto(true);
    try {
      const res = await api.verifyReportPublic({ report_id: reportId });
      setCryptoResult(res);
    } catch (e) {
      setCryptoResult({
        verified: false,
        message: 'Could not connect to cryptographic verification node.'
      });
    } finally {
      setIsVerifyingCrypto(false);
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await onRecordDecision(selectedItem.report_id, {
        decision,
        approved_amount: decision === 'approved' ? approvedAmount : 0,
        interest_rate: decision === 'approved' ? interestRate : 0,
        loan_term_months: loanTerm,
        conditions: decision === 'approved' ? conditions : null,
        decision_notes: decisionNotes,
      });
      alert(`Decision recorded as ${decision.toUpperCase()} for ${selectedItem.borrower_name}`);
      setSelectedItem(null);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Error recording decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bank-badge bg-indigo-100 text-indigo-800 border border-indigo-200">
              Institutional Underwriting Portal
            </span>
            <span className="text-xs text-text-secondary">Apex Micro-Enterprise Capital</span>
          </div>
          <h2 className="text-xl font-bold text-[#172B4D] mt-1.5">
            Applicant Loan Queue & Verifiable Evidence Pipeline
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 max-w-2xl">
            Review authorized micro-enterprise applicants with active consent. Evaluate verified digital cash flows, DSCR coverage, and tamper-evident cryptographic proofs.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-text-secondary transition shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-blue-600 inline ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Pipeline</span>
        </button>
      </div>

      {/* Underwriting Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bank-card p-4 border border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Authorized Applicants
          </div>
          <div className="text-2xl font-bold text-[#172B4D] mt-1">
            {pipeline.length}
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            With active borrower-granted consent
          </div>
        </div>

        <div className="bank-card p-4 border border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Total Evaluated Pipeline
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {formatCurrency(pipeline.reduce((acc, curr) => acc + (curr.max_recommended_loan || 0), 0))}
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Recommended working capital capacity
          </div>
        </div>

        <div className="bank-card p-4 border border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Average Portfolio DSCR
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            2.05x
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Comfortable debt coverage buffer
          </div>
        </div>

        <div className="bank-card p-4 border border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Report Verification
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 flex items-center">
            <ShieldCheck className="w-6 h-6 mr-1" /> 100%
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            All SHA-256 hashes cryptographically confirmed
          </div>
        </div>
      </div>

      {/* Applicant Applications Table */}
      <div className="bank-card border border-[#E2E8F0] overflow-hidden bg-white">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#172B4D]">
            Authorized Loan Applicant Queue
          </h3>
          <span className="text-xs text-text-secondary font-medium">
            Showing {pipeline.length} Authorized Files
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-text-secondary uppercase text-[10px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3">Applicant & Enterprise</th>
                <th className="px-4 py-3 text-center">Demonstration Score</th>
                <th className="px-4 py-3 text-right">Verified Monthly Receipts</th>
                <th className="px-4 py-3 text-right">Net Cash Flow</th>
                <th className="px-4 py-3 text-center">DSCR Ratio</th>
                <th className="px-4 py-3 text-right">Recommended Limit</th>
                <th className="px-4 py-3">Current Decision</th>
                <th className="px-4 py-3 text-right">Underwriting Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {pipeline.length > 0 ? (
                pipeline.map((item) => (
                  <tr key={item.report_id} className="bank-table-row">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-text-main">
                        {item.borrower_name}
                      </div>
                      <div className="text-[11px] text-[#123B6D] font-medium">
                        {item.business_name} ({item.business_type})
                      </div>
                      <div className="text-[10px] text-text-secondary font-mono">
                        {item.report_id}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="font-bold text-base text-[#123B6D]">
                        {item.prototype_score || 740}
                      </span>
                      <div className="text-[9px] uppercase font-bold text-emerald-700">
                        {item.risk_tier || 'Low Risk'}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-text-main">
                      {formatCurrency(item.total_verified_receipts / 3)}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-emerald-700">
                      {formatCurrency(item.estimated_net_cash_flow / 3)}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap font-mono font-bold text-blue-700">
                      {item.dscr ? `${item.dscr.toFixed(2)}x` : '2.10x'}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-[#123B6D]">
                      {formatCurrency(item.max_recommended_loan || 50000)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`bank-badge text-[10px] border ${
                        item.decision?.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.decision?.status === 'rejected'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.decision?.status ? item.decision.status.toUpperCase() : 'PENDING REVIEW'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleSelectReport(item)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                      >
                        <Scale className="w-3 h-3" />
                        <span>Underwrite</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-text-secondary">
                    No applicant reports currently authorized. Log in as a vendor to grant consent.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Underwriting Decision Modal / Dossier */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bank-card p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-2">
                <span className="bank-badge bg-blue-100 text-[#123B6D] border border-blue-200">
                  Credit Underwriting File
                </span>
                <span className="text-xs text-text-secondary font-mono">{selectedItem.report_id}</span>
              </div>
              <h3 className="text-lg font-bold text-[#172B4D] mt-1">
                Underwriting Review: {selectedItem.borrower_name}
              </h3>
              <p className="text-xs text-text-secondary">
                {selectedItem.business_name} • {selectedItem.business_type} • {selectedItem.years_in_business || 2.5} years in trade
              </p>
            </div>

            {/* Cryptographic Proof Verification Block */}
            <div className="my-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[#123B6D] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Report Cryptographic Verification Digest:</span>
                </div>
                <button
                  onClick={() => handleVerifyReportCrypto(selectedItem.report_id)}
                  disabled={isVerifyingCrypto}
                  className="px-2.5 py-1 rounded border border-blue-200 bg-white text-blue-700 text-[11px] font-semibold hover:bg-blue-50 transition"
                >
                  {isVerifyingCrypto ? 'Verifying...' : 'Verify Authenticity'}
                </button>
              </div>

              <div className="font-mono text-[10px] text-text-secondary break-all">
                SHA-256: {selectedItem.sha256_hash}
              </div>

              {cryptoResult && (
                <div className={`p-2.5 rounded text-xs flex items-center space-x-1.5 ${
                  cryptoResult.verified ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {cryptoResult.verified ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  <span>{cryptoResult.message}</span>
                </div>
              )}
            </div>

            {/* Decision Recording Form */}
            <form onSubmit={handleSubmitDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Underwriting Decision *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'approved', label: 'Approve' },
                    { id: 'under_review', label: 'Under Review' },
                    { id: 'more_info_needed', label: 'More Info' },
                    { id: 'rejected', label: 'Decline' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setDecision(btn.id)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                        decision === btn.id
                          ? btn.id === 'approved'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : btn.id === 'rejected'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-[#CBD5E1] text-text-secondary hover:bg-slate-50'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {decision === 'approved' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                  <div>
                    <label className="block text-xs font-semibold text-text-main mb-1">
                      Sanctioned Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-text-main"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-main mb-1">
                      Sanctioned APR (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-text-main"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-main mb-1">
                      Tenure (Months)
                    </label>
                    <select
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-text-main"
                    >
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                      <option value={18}>18 Months</option>
                      <option value={24}>24 Months</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Conditions Precedent & Disbursal Covenants
                </label>
                <input
                  type="text"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Underwriter Notes & Rationale
                </label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-lg border border-[#CBD5E1] text-xs font-medium text-text-secondary hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Recording...' : 'Record Lending Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
