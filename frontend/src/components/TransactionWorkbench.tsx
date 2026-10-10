import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Edit3, 
  Info, 
  ShieldAlert, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  X,
  CreditCard,
  Building,
  HelpCircle
} from 'lucide-react';
import { Transaction } from '../types';

interface TransactionWorkbenchProps {
  transactions: Transaction[];
  totalTransactions: number;
  onOverrideClassification: (txnId: string, classification: string) => Promise<void>;
  isLoading: boolean;
  onRefresh: () => void;
}

export const TransactionWorkbench: React.FC<TransactionWorkbenchProps> = ({
  transactions,
  totalTransactions,
  onOverrideClassification,
  isLoading,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [newClassification, setNewClassification] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'business_revenue', label: 'Business Revenue (Inflow)' },
    { id: 'operating_expense', label: 'Operating Expense (Outflow)' },
    { id: 'loan_repayment', label: 'Debt / Loan EMI' },
    { id: 'personal_transfer', label: 'Self-Transfer [Excluded]' },
    { id: 'drawings', label: 'Personal Drawings / ATM' },
    { id: 'refund_reversal', label: 'Refund / Reversal [Excluded]' },
    { id: 'excluded', label: 'Excluded / Duplicate' },
  ];

  const filteredTransactions = transactions.filter((t) => {
    if (selectedCategory !== 'all' && t.classification !== selectedCategory) return false;
    if (directionFilter !== 'all' && t.direction !== directionFilter) return false;
    if (onlyFlagged && !t.is_flagged && !t.is_duplicate) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.txn_id.toLowerCase().includes(q) ||
        (t.reference_id && t.reference_id.toLowerCase().includes(q)) ||
        t.channel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveOverride = async () => {
    if (!editingTxn || !newClassification) return;
    setIsUpdating(true);
    try {
      await onOverrideClassification(editingTxn.id, newClassification);
      setEditingTxn(null);
      setNewClassification('');
      onRefresh();
    } catch (e) {
      alert('Failed to update classification');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleDownloadSampleTemplate = () => {
    const csvContent = 
`txn_id,txn_date,amount,direction,description,channel
TXN-1001,2026-03-01 10:30:00,450.00,credit,QR Payment Customer Sales,UPI
TXN-1002,2026-03-01 11:15:00,820.00,credit,UPI Counter Payment,UPI
TXN-1003,2026-03-01 14:00:00,1200.00,debit,Wholesale Restock Supplies,NETBANKING
TXN-1004,2026-03-02 09:30:00,350.00,credit,Daily Retail QR Customer,UPI
TXN-1005,2026-03-02 18:00:00,500.00,debit,Commercial Stall Electricity,BILLPAY
TXN-1006,2026-03-03 12:45:00,2000.00,debit,Self Transfer Savings Acct,IMPS`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_business_statement_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getClassificationBadge = (t: Transaction) => {
    const isOverride = !!t.user_override;
    const cls = t.classification;

    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let label = cls.replace('_', ' ');

    if (cls === 'business_revenue') {
      badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = 'Business Revenue';
    } else if (cls === 'operating_expense') {
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'Operating Expense';
    } else if (cls === 'loan_repayment') {
      badgeClass = 'bg-purple-50 text-purple-800 border-purple-200';
      label = 'Debt / Loan EMI';
    } else if (cls === 'personal_transfer') {
      badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
      label = 'Self Transfer (Excluded)';
    } else if (cls === 'drawings') {
      badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
      label = 'Drawings / ATM';
    } else if (cls === 'refund_reversal' || cls === 'excluded') {
      badgeClass = 'bg-red-50 text-red-800 border-red-200';
      label = 'Excluded / Duplicate';
    }

    return (
      <div className="flex items-center space-x-1.5">
        <span className={`bank-badge text-[10px] border ${badgeClass}`}>
          {label}
        </span>
        {isOverride && (
          <span className="bank-badge text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200" title="Manually reclassified">
            Reviewed
          </span>
        )}
      </div>
    );
  };

  const excludedCount = transactions.filter(t => t.classification === 'personal_transfer' || t.classification === 'excluded' || t.is_duplicate).length;
  const flaggedCount = transactions.filter(t => t.is_flagged).length;

  return (
    <div className="space-y-6">
      {/* Header and Summary Bar */}
      <div className="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172B4D]">
            Transaction Workbench & Statement Ledger
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Review parsed digital transactions, confidence scores, and rule-based classifications. Personal self-transfers are excluded from business receipts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadSampleTemplate}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            <span>Sample CSV</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Exclusions and Guardrail Explanation Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bank-card p-4 border border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Total Records Analyzed
          </div>
          <div className="text-xl font-bold text-[#172B4D] mt-1">
            {transactions.length.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Normalized digital transaction entries
          </div>
        </div>

        <div className="bank-card p-4 border border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Excluded Self-Transfers
          </div>
          <div className="text-xl font-bold text-blue-700 mt-1">
            {excludedCount} Records
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Strictly excluded from gross business receipts
          </div>
        </div>

        <div className="bank-card p-4 border border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Flagged & Uncertain
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {flaggedCount} Records
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Require manual verification or supplier invoices
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bank-card p-4 border border-[#E2E8F0] bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search description, reference ID, or transaction code..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => {
              setDirectionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Directions</option>
            <option value="credit">Credits (Inflows)</option>
            <option value="debit">Debits (Outflows)</option>
          </select>

          {/* Only Flagged Toggle */}
          <button
            type="button"
            onClick={() => {
              setOnlyFlagged(!onlyFlagged);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
              onlyFlagged
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'border-[#CBD5E1] text-text-secondary hover:bg-slate-50'
            }`}
          >
            Flagged Only
          </button>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="bank-card border border-[#E2E8F0] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-text-secondary uppercase text-[10px] font-bold border-b border-[#E2E8F0] tracking-wider">
              <tr>
                <th className="px-4 py-3">Txn ID / Date</th>
                <th className="px-4 py-3">Description & Reference</th>
                <th className="px-4 py-3">Payment Channel</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3 text-center">Confidence</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t) => {
                  const isCredit = t.direction === 'credit';
                  return (
                    <tr key={t.id || t.txn_id} className="bank-table-row">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono text-[11px] font-bold text-text-main flex items-center space-x-1">
                          <span>{t.txn_id}</span>
                          <button
                            onClick={() => handleCopy(t.txn_id)}
                            className="text-slate-400 hover:text-text-main"
                            title="Copy ID"
                          >
                            {copiedId === t.txn_id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-[10px] text-text-secondary mt-0.5">
                          {t.txn_date}
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-text-main truncate" title={t.description}>
                          {t.description}
                        </div>
                        {t.is_flagged && (
                          <div className="inline-flex items-center text-[10px] text-amber-700 font-semibold mt-0.5">
                            <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>{t.flag_reason || 'Uncertain Classification'}</span>
                          </div>
                        )}
                        {t.is_duplicate && (
                          <div className="inline-flex items-center text-[10px] text-red-700 font-semibold mt-0.5">
                            <ShieldAlert className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>Duplicate Hash Collision</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bank-badge text-[10px] bg-slate-100 text-slate-700 border border-slate-200 uppercase font-mono">
                          {t.channel || 'UPI'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                        <span className={isCredit ? 'text-emerald-700' : 'text-slate-700'}>
                          {isCredit ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                        <div className="text-[9px] text-text-secondary uppercase">
                          {t.direction}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {getClassificationBadge(t)}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-[11px] font-bold text-text-main">
                          {Math.round((t.confidence_score || 0.95) * 100)}%
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingTxn(t);
                            setNewClassification(t.classification);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md border border-[#E2E8F0] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-text-secondary text-[11px] font-semibold transition"
                          title="Reclassify transaction category"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Reclassify</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs text-text-secondary">
                    No transactions matched your current search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-text-secondary">
          <div>
            Showing {filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-[#CBD5E1] bg-white disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-semibold text-text-main">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-[#CBD5E1] bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Reclassification Modal */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bank-card p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#172B4D] flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Reclassify Transaction</span>
              </h3>
              <button onClick={() => setEditingTxn(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                <div><span className="text-text-secondary">Txn ID: </span><span className="font-mono font-bold">{editingTxn.txn_id}</span></div>
                <div><span className="text-text-secondary">Description: </span><span className="font-semibold">{editingTxn.description}</span></div>
                <div><span className="text-text-secondary">Amount: </span><span className="font-bold text-blue-700">{formatCurrency(editingTxn.amount)}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Select Correct Classification:
                </label>
                <select
                  value={newClassification}
                  onChange={(e) => setNewClassification(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-text-main"
                >
                  <option value="business_revenue">Business Revenue (Customer Inflow)</option>
                  <option value="operating_expense">Operating Expense (Suppliers, Utilities)</option>
                  <option value="loan_repayment">Loan / Debt EMI Repayment</option>
                  <option value="personal_transfer">Personal Self-Transfer [Excluded from Receipts]</option>
                  <option value="drawings">Personal Drawings / Cash Withdrawal</option>
                  <option value="refund_reversal">Refund / Reversal [Excluded]</option>
                  <option value="excluded">Excluded / Duplicate</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end space-x-2">
              <button
                onClick={() => setEditingTxn(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] text-xs text-text-secondary hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverride}
                disabled={isUpdating}
                className="px-4 py-1.5 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-semibold shadow-xs"
              >
                {isUpdating ? 'Saving...' : 'Apply Correction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
