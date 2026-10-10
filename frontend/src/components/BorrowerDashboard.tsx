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
  Sparkles,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet
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

interface BorrowerDashboardProps {
  currentUser: User | null;
  metrics: FinancialMetrics | null;
  assessment: AssessmentReport | null;
  selectedDays: number | null;
  onFilterDays: (days: number | null) => void;
  onUploadFile: (file: File) => void;
  onLoadSample: (persona: string) => void;
  onNavigateTab: (tab: string) => void;
  isLoading: boolean;
}

export const BorrowerDashboard: React.FC<BorrowerDashboardProps> = ({
  currentUser,
  metrics,
  assessment,
  selectedDays,
  onFilterDays,
  onUploadFile,
  onLoadSample,
  onNavigateTab,
  isLoading
}) => {
  const [dragActive, setDragActive] = useState(false);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Business Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified Business Profile
              </span>
              <span className="text-xs text-slate-400">
                {currentUser?.business_profile?.business_type || 'Retail & Micro-Enterprise'}
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white">
              {currentUser?.business_profile?.business_name || `${currentUser?.full_name}'s Business`}
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              {currentUser?.business_profile?.description || 'Alternative creditworthiness derived from verifiable digital UPI and bank transaction records.'}
            </p>
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 self-start md:self-auto">
            <span className="text-xs text-slate-500 px-2 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" /> Window:
            </span>
            {[
              { label: '30D', val: 30 },
              { label: '90D', val: 90 },
              { label: '180D', val: 180 },
              { label: '365D', val: 365 },
              { label: 'All', val: null },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => onFilterDays(f.val)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedDays === f.val
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Verified Receipts */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Verified Receipts</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(metrics?.total_verified_receipts || 0)}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 flex items-center">
              <span className="text-emerald-400 font-semibold mr-1.5">Independently Verified</span>
              <span>across {metrics?.active_trading_days || 0} active days</span>
            </p>
          </div>
        </div>

        {/* Estimated Operating Expenses */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Estimated Operating Expenses</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(metrics?.estimated_operating_expenses || 0)}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 flex items-center">
              <span className="text-amber-400 mr-1.5">Wholesale & utilities</span>
              <span>(~{metrics?.net_margin_percentage ? (100 - metrics.net_margin_percentage).toFixed(0) : 0}% of turnover)</span>
            </p>
          </div>
        </div>

        {/* Estimated Net Cash Flow */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Estimated Net Cash Flow</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {formatCurrency(metrics?.estimated_net_cash_flow || 0)}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 flex items-center">
              <span className="text-emerald-400 font-semibold mr-1">Net Surplus Margin:</span>
              <span>{metrics?.net_margin_percentage?.toFixed(1) || '0.0'}%</span>
            </p>
          </div>
        </div>

        {/* Income Consistency & Prototype Score */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Demonstration Prototype Score</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-indigo-400 tracking-tight">
              {assessment?.prototype_score || 720}
              <span className="text-xs font-normal text-slate-500 ml-1">/ 850</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              assessment?.confidence_level === 'High' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {assessment?.confidence_level || 'High'} Conf.
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Experimental Rule Score (Non-Bureau)
          </p>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 text-xs">
        <div>
          <span className="text-slate-500 block">Average Daily Receipts:</span>
          <span className="font-semibold text-slate-200 text-sm mt-0.5 block">
            {formatCurrency(metrics?.avg_daily_receipts || 0)} / day
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Income Consistency Index:</span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${metrics?.income_consistency_score || 75}%` }} 
              />
            </div>
            <span className="font-semibold text-emerald-400 text-sm">
              {metrics?.income_consistency_score?.toFixed(0) || 75}/100
            </span>
          </div>
        </div>
        <div>
          <span className="text-slate-500 block">Verified Existing Debt:</span>
          <span className="font-semibold text-slate-300 text-sm mt-0.5 block">
            {metrics?.monthly_existing_debt ? `${formatCurrency(metrics.monthly_existing_debt)}/mo` : '₹0 (None detected)'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Verified Observation Period:</span>
          <span className="font-semibold text-slate-300 text-sm mt-0.5 block">
            {metrics?.months_analyzed ? `${metrics.months_analyzed.toFixed(1)} Months (${metrics.days_analyzed} Days)` : '90 Days'}
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Monthly Cash Flow Trend</h2>
              <p className="text-xs text-slate-400">Verified digital receipts vs estimated operational outflows</p>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              Net Surplus Tracked
            </span>
          </div>

          <div className="h-64 w-full">
            {metrics?.monthly_trend && metrics.monthly_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.monthly_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceipts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="receipts" name="Business Receipts" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReceipts)" />
                  <Area type="monotone" dataKey="expenses" name="Operating Expenses" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No monthly data available. Upload a statement to view trends.
              </div>
            )}
          </div>
        </div>

        {/* Day-of-Week Sales Volume */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Weekly Demand Pattern</h2>
              <p className="text-xs text-slate-400">Total collections by day of week</p>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              Weekend Spikes
            </span>
          </div>

          <div className="h-64 w-full">
            {metrics?.dow_summary && metrics.dow_summary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.dow_summary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Receipts']}
                  />
                  <Bar dataKey="receipts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No day-of-week data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statement Upload & Sample Data Loader */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Statement Card */}
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-sm font-semibold text-white flex items-center">
            <UploadCloud className="w-4 h-4 mr-2 text-emerald-400" />
            Upload Financial Statement (CSV)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload your raw digital bank or UPI gateway statement. TRUSTCRED AI normalizes, classifies, and verifies your cash flows without requiring bank credentials.
          </p>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-500/5' 
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-upload-input"
            />
            <label htmlFor="csv-upload-input" className="cursor-pointer block">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
              <span className="text-xs font-medium text-slate-300 block">
                Click to browse or drag & drop CSV file
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Supports Standard Bank, Paytm, PhonePe, BharatPe, or GPay merchant exports
              </span>
            </label>
          </div>
        </div>

        {/* Quick Sample Dataset Selector */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center">
              <FileCheck2 className="w-4 h-4 mr-2 text-indigo-400" />
              Quick Demo Statements
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Load realistic 90-day transaction statements to evaluate the platform immediately:
            </p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => onLoadSample('ramesh')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-800 hover:border-emerald-500/40 bg-slate-950/60 hover:bg-slate-800/40 transition-all text-xs cursor-pointer"
              >
                <div className="font-semibold text-slate-200">🏪 Ramesh Kirana Store</div>
                <div className="text-[11px] text-slate-400">Daily retail grocery UPI • Strong margin ~24%</div>
              </button>

              <button
                onClick={() => onLoadSample('priya')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-800 hover:border-emerald-500/40 bg-slate-950/60 hover:bg-slate-800/40 transition-all text-xs cursor-pointer"
              >
                <div className="font-semibold text-slate-200">🍲 Priya Street Gourmet</div>
                <div className="text-[11px] text-slate-400">High-volume evening food stall • Weekend peak</div>
              </button>

              <button
                onClick={() => onLoadSample('anil')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-800 hover:border-emerald-500/40 bg-slate-950/60 hover:bg-slate-800/40 transition-all text-xs cursor-pointer"
              >
                <div className="font-semibold text-slate-200">🚚 Anil Quick Logistics</div>
                <div className="text-[11px] text-slate-400">Commercial vehicle loan EMI • Moderate variance</div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              Privacy-Preserved
            </span>
            <button 
              onClick={() => onNavigateTab('transactions')}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              View Transactions →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
