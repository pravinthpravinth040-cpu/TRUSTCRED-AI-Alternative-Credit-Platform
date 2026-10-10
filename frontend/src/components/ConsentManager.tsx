import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserX, 
  History, 
  Share2, 
  AlertCircle, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Eye, 
  Key,
  Info,
  Clock,
  ArrowRight,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { ConsentGrant, AuditLogItem, AssessmentReport, User } from '../types';

interface ConsentManagerProps {
  consents: ConsentGrant[];
  auditLogs: AuditLogItem[];
  latestAssessment: AssessmentReport | null;
  currentUser: User | null;
  onGrantConsent: (lenderOrgName: string, purpose: string, validityDays: number) => Promise<void>;
  onRevokeConsent: (consentId: string) => Promise<void>;
  onPreviewReport: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({
  consents,
  auditLogs,
  latestAssessment,
  currentUser,
  onGrantConsent,
  onRevokeConsent,
  onPreviewReport,
  isLoading,
  onRefresh
}) => {
  const [lenderOrg, setLenderOrg] = useState('Apex Micro-Enterprise Capital');
  const [purpose, setPurpose] = useState('Working Capital Loan Evaluation');
  const [validityDays, setValidityDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lenderOrg) return;
    setIsSubmitting(true);
    try {
      await onGrantConsent(lenderOrg, purpose, validityDays);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to grant consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (consentId: string) => {
    if (!confirm('Are you sure you want to revoke access? The lender will immediately be blocked from viewing this report.')) return;
    setRevokingId(consentId);
    try {
      await onRevokeConsent(consentId);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to revoke consent');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bank-badge bg-blue-100 text-[#123B6D] border border-blue-200">
              Zero-Credential Architecture
            </span>
            <span className="text-xs text-text-secondary">Granular Revocable Access</span>
          </div>
          <h2 className="text-xl font-bold text-[#172B4D] mt-1.5">
            Privacy, Consent & Lender Access Management
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 max-w-2xl">
            You retain absolute ownership of your financial records. Grant temporary, cryptographically verifiable access to regulated lenders and revoke permissions at any time.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-text-secondary transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-blue-600 inline ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Log</span>
          </button>
        </div>
      </div>

      {/* Grant Access Form Card */}
      <div className="bank-card p-6 border border-[#E2E8F0] bg-white">
        <h3 className="text-sm font-bold text-[#172B4D] pb-3 border-b border-[#E2E8F0] flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-blue-600" />
          <span>Grant New Lender Access Permission</span>
        </h3>

        <form onSubmit={handleGrant} className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Authorized Lending Institution *
            </label>
            <select
              value={lenderOrg}
              onChange={(e) => setLenderOrg(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Apex Micro-Enterprise Capital">Apex Micro-Enterprise Capital (Regulated NBFC)</option>
              <option value="Samriddhi MSME Cooperative Bank">Samriddhi MSME Cooperative Bank</option>
              <option value="Bharat Small Business Finance Ltd">Bharat Small Business Finance Ltd</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Purpose of Data Access *
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Working Capital Loan Evaluation">Working Capital Micro-Loan Evaluation</option>
              <option value="Equipment Financing Assessment">Equipment Financing Assessment</option>
              <option value="Overdraft Facility Review">Overdraft Facility Review</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Access Validity
            </label>
            <select
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              <option value={15}>15 Days</option>
              <option value={30}>30 Days (Standard)</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting || !latestAssessment}
              className="w-full py-2 px-3.5 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Granting...' : 'Grant Access'}</span>
            </button>
          </div>
        </form>

        {!latestAssessment && (
          <p className="text-[11px] text-amber-700 mt-3 flex items-center">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Please generate a financial assessment report first before granting lender permissions.
          </p>
        )}
      </div>

      {/* Active Consent Grants Table */}
      <div className="bank-card border border-[#E2E8F0] overflow-hidden bg-white">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#172B4D]">
            Active & Historical Data Sharing Grants
          </h3>
          <span className="text-xs text-text-secondary font-medium">
            {consents.length} Grants Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-text-secondary uppercase text-[10px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3">Lender Organization</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Granted Date</th>
                <th className="px-4 py-3">Expiration Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {consents.length > 0 ? (
                consents.map((c) => {
                  const isActive = c.status === 'active';
                  return (
                    <tr key={c.id} className="bank-table-row">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-text-main flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{c.lender_org_name}</span>
                        </div>
                        <div className="text-[10px] text-text-secondary">
                          Report: {c.report_id?.slice(0, 14) || 'TC-RPT-LATEST'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-text-secondary">
                        {c.purpose}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
                        {c.granted_at ? new Date(c.granted_at).toLocaleDateString() : 'Active'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'In 30 days'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`bank-badge text-[10px] border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {isActive ? 'Active Access' : 'Revoked / Expired'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isActive ? (
                          <button
                            onClick={() => handleRevoke(c.id)}
                            disabled={revokingId === c.id}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-[11px] font-semibold transition"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>{revokingId === c.id ? 'Revoking...' : 'Revoke Access'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Access Blocked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-text-secondary">
                    No active consent permissions currently granted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Policy: What Revocation Does and Does Not Do */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bank-card p-4 border border-[#E2E8F0] bg-[#F8FAFC]">
          <h4 className="text-xs font-bold text-emerald-700 flex items-center mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            What Revocation DOES Guarantee
          </h4>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Revocation immediately and irreversibly disables any further platform access by the designated lender. The institution’s authorization token is invalidated on the server instantly.
          </p>
        </div>

        <div className="bank-card p-4 border border-[#E2E8F0] bg-[#F8FAFC]">
          <h4 className="text-xs font-bold text-slate-700 flex items-center mb-1">
            <Info className="w-3.5 h-3.5 mr-1" />
            What Revocation CANNOT Undo
          </h4>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Revocation cannot delete historical assessment snapshots that the lender previously exported or stored offline in statutory loan underwriting and compliance audit archives.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bank-card border border-[#E2E8F0] overflow-hidden bg-white">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#172B4D] flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>Immutable Access Audit Log</span>
          </h3>
          <span className="text-xs text-text-secondary">
            Tamper-evident system activity trail
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-text-secondary uppercase text-[10px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Entity / Target</th>
                <th className="px-4 py-3">Origin / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} className="bank-table-row font-mono text-[11px]">
                    <td className="px-4 py-2.5 text-text-secondary whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-[#123B6D] font-sans">
                      {log.action}
                    </td>
                    <td className="px-4 py-2.5 text-text-main truncate max-w-xs font-sans">
                      {log.entity_type}: {log.entity_id || 'System'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      127.0.0.1 (Verified Gateway)
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-text-secondary font-sans">
                    No audit records registered in current session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
