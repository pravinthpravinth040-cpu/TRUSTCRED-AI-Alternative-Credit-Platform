import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  Wallet, 
  Calendar, 
  Activity, 
  AlertCircle, 
  UploadCloud, 
  FileCheck2, 
  Percent, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  Coins, 
  Building2, 
  Download, 
  FileText, 
  Lock, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { FinancialMetrics, AssessmentReport, User } from '../types';
import { LoadingState } from './common/LoadingState';

interface VendorDashboardProps {
  currentUser: User | null;
  metrics: FinancialMetrics | null;
  assessment: AssessmentReport | null;
  selectedDays: number | null;
  onFilterDays: (days: number | null) => void;
  onUploadFile: (file: File) => void;
  onLoadSample: (persona: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenLoanModal?: () => void;
  isLoading: boolean;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  currentUser,
  metrics,
  assessment,
  selectedDays,
  onFilterDays,
  onUploadFile,
  onLoadSample,
  onNavigateTab,
  onOpenLoanModal,
  isLoading
}) => {
  const [dragActive, setDragActive] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  // Generate Sample CSV Template for download
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

  if (isLoading && !metrics) {
    return <LoadingState message="Loading Financial Overview..." subtext="Analyzing verified receipts and cash flow indicators" />;
  }

  const monthlyTrendData = metrics?.monthly_trend || [];
  const monthlyReceipts = metrics?.avg_monthly_receipts || metrics?.total_verified_receipts || 0;
  const monthlyExpenses = metrics?.estimated_operating_expenses ? metrics.estimated_operating_expenses / (metrics.months_analyzed || 1) : 0;
  const netCashFlow = monthlyReceipts - monthlyExpenses;
  const maxLoan = assessment?.max_recommended_loan || 50000;

  return (
    <div className="space-y-6">
      {/* 1. Top Welcome Banner & Business Identification */}
      <div className="bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bank-badge bg-blue-100 text-[#123B6D] border border-blue-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Verified Small Enterprise
            </span>
            <span className="text-xs text-text-secondary">
              ID: {currentUser?.id?.slice(0, 8) || 'TR-7821'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172B4D] mt-1.5">
            {currentUser?.business_profile?.business_name || `${currentUser?.full_name}'s Enterprise`}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Proprietor: <span className="font-semibold text-text-main">{currentUser?.full_name}</span> • Sector: {currentUser?.business_profile?.business_type || 'Retail & Trade'}
          </p>
        </div>

        {/* Date Filter & Fast Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F8FAFC]">
            {[
              { label: '30 Days', val: 30 },
              { label: '60 Days', val: 60 },
              { label: '90 Days', val: 90 },
              { label: 'All Time', val: null },
            ].map((f) => (
              <button
                key={String(f.val)}
                onClick={() => onFilterDays(f.val)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  selectedDays === f.val
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('loan-apply')}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Apply for Loan</span>
          </button>
        </div>
      </div>

      {/* 2. Four Key Banking Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated Monthly Receipts */}
        <div className="bank-card bank-card-hover p-5 border border-[#E2E8F0]">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-medium">Estimated Monthly Receipts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#172B4D]">
            {formatCurrency(monthlyReceipts)}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Verified digital customer QR/UPI receipts</span>
          </div>
          <div className="mt-1 text-[10px] text-text-secondary">
            Strictly excludes self-transfers & refunds
          </div>
        </div>

        {/* Card 2: Estimated Monthly Expenses */}
        <div className="bank-card bank-card-hover p-5 border border-[#E2E8F0]">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-medium">Estimated Monthly Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#172B4D]">
            {formatCurrency(monthlyExpenses)}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-text-secondary font-medium">
            <span>Operating cost ratio: </span>
            <span className="font-bold text-text-main ml-1">
              {monthlyReceipts > 0 ? Math.round((monthlyExpenses / monthlyReceipts) * 100) : 0}%
            </span>
          </div>
          <div className="mt-1 text-[10px] text-text-secondary">
            Restock supplies, utilities & commercial rent
          </div>
        </div>

        {/* Card 3: Estimated Net Cash Flow */}
        <div className="bank-card bank-card-hover p-5 border border-[#E2E8F0]">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-medium">Estimated Net Cash Flow</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {formatCurrency(netCashFlow)}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-medium">
            <span>Operational Surplus: </span>
            <span className="font-bold ml-1">
              {metrics?.net_margin_percentage ? `${metrics.net_margin_percentage.toFixed(1)}%` : '+32.4%'}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-text-secondary">
            Surplus available for loan debt service
          </div>
        </div>

        {/* Card 4: Loan Application Status */}
        <div className="bank-card bank-card-hover p-5 border border-blue-200 bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs font-medium text-[#123B6D]">Loan Status & Eligibility</span>
            <div className="w-8 h-8 rounded-lg bg-[#123B6D] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-[#123B6D]">
            Pre-Qualified
          </div>
          <div className="mt-1 text-xs font-semibold text-blue-700">
            Up to {formatCurrency(maxLoan)}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">DSCR: {assessment?.dscr?.toFixed(2) || '2.15'}x</span>
            <button
              onClick={() => onNavigateTab('loan-apply')}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center"
            >
              Apply Now <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cash Flow Trend (8 cols) */}
        <div className="lg:col-span-8 bank-card p-6 border border-[#E2E8F0]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">
                Verified Cash Inflow vs. Operating Expenses
              </h3>
              <p className="text-xs text-text-secondary">
                Monthly verified digital receipts and supplier restock outlays
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-text-secondary">
                <span className="w-3 h-3 rounded-xs bg-[#2563EB] mr-1.5"></span>
                Inflows
              </span>
              <span className="flex items-center text-text-secondary">
                <span className="w-3 h-3 rounded-xs bg-[#F59E0B] mr-1.5"></span>
                Expenses
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 mt-4">
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceipts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#64748B', fontSize: 11 }} 
                    axisLine={{ stroke: '#CBD5E1' }} 
                  />
                  <YAxis 
                    tick={{ fill: '#64748B', fontSize: 11 }} 
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickFormatter={(val) => `₹${val / 1000}k`} 
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="receipts" name="Receipts" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceipts)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary">
                No monthly trend data recorded yet. Upload a CSV statement.
              </div>
            )}
          </div>
        </div>

        {/* Right: Credit Score & Cryptographic Proof (4 cols) */}
        <div className="lg:col-span-4 bank-card p-6 border border-[#E2E8F0] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#172B4D]">Demonstration Score</h3>
              <span className="bank-badge bg-emerald-100 text-emerald-800 border border-emerald-200">
                {assessment?.confidence_level || 'High'} Confidence
              </span>
            </div>

            {/* Score Ring Display */}
            <div className="my-6 text-center">
              <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-blue-100 border-t-[#123B6D] bg-[#F8FAFC]">
                <span className="text-3xl font-extrabold text-[#123B6D]">
                  {assessment?.prototype_score || 780}
                </span>
                <span className="text-[11px] font-semibold text-text-secondary uppercase">
                  out of 850
                </span>
                <span className="text-[10px] font-bold text-emerald-600 mt-1">
                  {assessment?.risk_tier || 'Low Risk'}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-3">
                Calibrated against 90-day UPI volume & consistency
              </p>
            </div>

            {/* Non-Bureau Prototype Disclaimer */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-text-secondary leading-snug">
              <span className="font-semibold text-text-main">Notice: </span>
              Demonstration prototype assessment based on alternative digital cash flows. Does not replace statutory credit bureau scores.
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={() => onNavigateTab('assessment')}
              className="w-full py-2.5 px-3 rounded-lg border border-[#123B6D] text-[#123B6D] hover:bg-blue-50 text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>View Full Credit Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Quick Statement Upload & Sample Data Workbench */}
      <div className="bank-card p-6 border border-[#E2E8F0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Upload New Transaction Statement</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Upload UPI, POS, QR or bank statement CSV for automated classification
            </p>
          </div>

          <button
            onClick={handleDownloadSampleTemplate}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-text-secondary hover:text-text-main hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 mr-1" />
            <span>Download Sample CSV Template</span>
          </button>
        </div>

        {/* Drag and drop dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mt-4 border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition ${
            dragActive
              ? 'border-blue-600 bg-blue-50/50'
              : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-text-main">
            Drag and drop your transaction CSV statement here
          </h4>
          <p className="text-[11px] text-text-secondary mt-1">
            Supports standard exported CSVs from PhonePe, Google Pay, Paytm, or bank netbanking
          </p>
          <div className="mt-3">
            <label
              htmlFor="csv-file-input"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#123B6D] hover:bg-[#0F2F57] text-white text-xs font-semibold cursor-pointer shadow-2xs transition"
            >
              Browse CSV File
            </label>
          </div>
        </div>

        {/* Demo persona datasets for instant evaluation */}
        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-text-secondary font-medium text-[11px]">
            Or load a realistic 90-day verified merchant statement:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ramesh', label: '🏪 Ramesh (Grocery Store)' },
              { id: 'priya', label: '🍲 Priya (Street Food Stall)' },
              { id: 'anil', label: '🚚 Anil (Commercial Freight)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => onLoadSample(p.id)}
                className="px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[11px] font-medium text-text-main transition shadow-2xs cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigateTab('transactions')}
          className="bank-card p-4 border border-[#E2E8F0] hover:border-blue-300 cursor-pointer transition flex items-center space-x-3.5"
        >
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-text-main">Transaction Workbench</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Filter, search & reclassify transaction records</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div 
          onClick={() => onNavigateTab('calculator')}
          className="bank-card p-4 border border-[#E2E8F0] hover:border-blue-300 cursor-pointer transition flex items-center space-x-3.5"
        >
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Coins className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-text-main">Repayment Calculator</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Calculate EMI and Debt Coverage Capacity</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div 
          onClick={() => onNavigateTab('consent')}
          className="bank-card p-4 border border-[#E2E8F0] hover:border-blue-300 cursor-pointer transition flex items-center space-x-3.5"
        >
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-text-main">Privacy & Consent</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Manage and revoke lender report access</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
};
