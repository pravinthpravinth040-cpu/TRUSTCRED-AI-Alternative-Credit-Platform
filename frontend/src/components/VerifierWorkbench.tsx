import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileSearch, 
  HelpCircle, 
  User, 
  Building, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  MessageSquare,
  RefreshCw,
  FileText,
  X
} from 'lucide-react';
import { VerifierQueueItem } from '../types';

interface VerifierWorkbenchProps {
  queue: VerifierQueueItem[];
  onVerifyBatch: (batchId: string, status: string, notes?: string) => Promise<void>;
  isLoading: boolean;
  onRefresh: () => void;
}

export const VerifierWorkbench: React.FC<VerifierWorkbenchProps> = ({
  queue,
  onVerifyBatch,
  isLoading,
  onRefresh
}) => {
  const [selectedBatch, setSelectedBatch] = useState<VerifierQueueItem | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (status: string) => {
    if (!selectedBatch) return;
    setIsSubmitting(true);
    try {
      await onVerifyBatch(selectedBatch.id, status, decisionNotes);
      setSelectedBatch(null);
      setDecisionNotes('');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Verification submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bank-badge bg-emerald-100 text-emerald-800 border border-emerald-200">
              Independent Verifier Portal
            </span>
            <span className="text-xs text-text-secondary">Statement & Anomaly Certification</span>
          </div>
          <h2 className="text-xl font-bold text-[#172B4D] mt-1.5">
            Statement Verification & Anomaly Audit Queue
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 max-w-2xl">
            Certified third-party verification agency workbench. Audit raw merchant digital statements, detect duplicate SHA collisions, confirm UPI/QR settlement authenticity, and certify reports.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-text-secondary transition shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-blue-600 inline ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="bank-card border border-[#E2E8F0] overflow-hidden bg-white">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#172B4D]">
            Uploaded Transaction Batches
          </h3>
          <span className="text-xs text-text-secondary font-medium">
            {queue.length} Batches Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-text-secondary uppercase text-[10px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3">File / Batch ID</th>
                <th className="px-4 py-3">Borrower / Enterprise</th>
                <th className="px-4 py-3 text-right">Valid Records</th>
                <th className="px-4 py-3 text-center">Duplicates</th>
                <th className="px-4 py-3 text-center">Flagged</th>
                <th className="px-4 py-3">Verification Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {queue.length > 0 ? (
                queue.map((item) => {
                  const isVerified = item.verification_status === 'verified';
                  return (
                    <tr key={item.id} className="bank-table-row">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-text-main flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.filename}</span>
                        </div>
                        <div className="text-[10px] text-text-secondary font-mono mt-0.5">
                          ID: {item.id.slice(0, 12)}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-text-main">
                          {item.borrower_name}
                        </div>
                        <div className="text-[10px] text-text-secondary">
                          {item.business_name}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-emerald-700">
                        {item.valid_records} / {item.total_records}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`bank-badge text-[10px] ${item.duplicate_records > 0 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700'}`}>
                          {item.duplicate_records}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`bank-badge text-[10px] ${item.flagged_records > 0 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-slate-100 text-slate-700'}`}>
                          {item.flagged_records}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`bank-badge text-[10px] border ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.verification_status === 'rejected'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {item.verification_status ? item.verification_status.toUpperCase() : 'PENDING'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedBatch(item);
                            setDecisionNotes(item.verification_notes || '');
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-[11px] font-semibold transition shadow-2xs"
                        >
                          <FileSearch className="w-3 h-3" />
                          <span>Audit Batch</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-text-secondary">
                    No statement batches currently pending audit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bank-card p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#172B4D] flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audit Batch: {selectedBatch.filename}</span>
              </h3>
              <button onClick={() => setSelectedBatch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div><span className="text-text-secondary">Enterprise: </span><span className="font-bold">{selectedBatch.business_name} ({selectedBatch.borrower_name})</span></div>
                <div><span className="text-text-secondary">Valid Records: </span><span className="font-bold text-emerald-700">{selectedBatch.valid_records} of {selectedBatch.total_records}</span></div>
                <div><span className="text-text-secondary">Duplicate Collision Count: </span><span className="font-bold text-amber-700">{selectedBatch.duplicate_records}</span></div>
                <div><span className="text-text-secondary">Uncertain Flagged Outliers: </span><span className="font-bold text-red-700">{selectedBatch.flagged_records}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Audit Notes / Verifier Endorsement:
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="e.g. Cross-checked with gateway settlement logs. Statement validated with 100% genuine QR customer receipts."
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] text-xs text-text-secondary hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('rejected')}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  Reject Batch
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('evidence_requested')}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  Request Evidence
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('verified')}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Certify & Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
