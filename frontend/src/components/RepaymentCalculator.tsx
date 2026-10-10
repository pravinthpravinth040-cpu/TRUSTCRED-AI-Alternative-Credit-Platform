import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Wallet, 
  Percent, 
  Calendar, 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle,
  Coins,
  ArrowRight
} from 'lucide-react';
import { RepaymentCalculation, FinancialMetrics } from '../types';
import { api } from '../services/api';

interface RepaymentCalculatorProps {
  metrics: FinancialMetrics | null;
}

export const RepaymentCalculator: React.FC<RepaymentCalculatorProps> = ({ metrics }) => {
  const [monthlyReceipts, setMonthlyReceipts] = useState<number>(metrics?.avg_monthly_receipts || 120000);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(
    metrics?.estimated_operating_expenses && metrics?.months_analyzed 
      ? Math.round(metrics.estimated_operating_expenses / Math.max(1, metrics.months_analyzed)) 
      : 75000
  );
  const [existingDebt, setExistingDebt] = useState<number>(metrics?.monthly_existing_debt || 0);
  const [householdExpenses, setHouseholdExpenses] = useState<number>(15000);
  const [loanAmount, setLoanAmount] = useState<number>(75000);
  const [interestRate, setInterestRate] = useState<number>(16.5);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [calculation, setCalculation] = useState<RepaymentCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync default values when metrics change
  useEffect(() => {
    if (metrics) {
      if (metrics.avg_monthly_receipts) setMonthlyReceipts(metrics.avg_monthly_receipts);
      if (metrics.estimated_operating_expenses && metrics.months_analyzed) {
        setMonthlyExpenses(Math.round(metrics.estimated_operating_expenses / Math.max(1, metrics.months_analyzed)));
      }
      if (metrics.monthly_existing_debt) setExistingDebt(metrics.monthly_existing_debt);
    }
  }, [metrics]);

  // Recalculate whenever inputs change
  useEffect(() => {
    const fetchCalc = async () => {
      setIsLoading(true);
      try {
        const res = await api.calculateRepayment({
          monthly_receipts: monthlyReceipts,
          monthly_operating_expenses: monthlyExpenses,
          existing_monthly_debt: existingDebt,
          household_expenses: householdExpenses,
          loan_amount: loanAmount,
          interest_rate_annual: interestRate,
          tenure_months: tenureMonths
        });
        setCalculation(res);
      } catch (e) {
        // Local calculation fallback if backend server is offline
        const netCash = monthlyReceipts - monthlyExpenses;
        const freeCash = netCash - existingDebt - householdExpenses;
        const r = interestRate / 12 / 100;
        const emi = Math.round((loanAmount * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1));
        const totalRepay = emi * tenureMonths;
        const totalInt = totalRepay - loanAmount;
        const dscr = emi > 0 ? Number((freeCash / emi).toFixed(2)) : 2.5;

        setCalculation({
          inputs: {
            monthly_receipts: monthlyReceipts,
            monthly_operating_expenses: monthlyExpenses,
            existing_monthly_debt: existingDebt,
            household_expenses: householdExpenses,
            loan_amount: loanAmount,
            interest_rate_annual: interestRate,
            tenure_months: tenureMonths
          },
          net_operating_cash: netCash,
          free_cash_flow_available: freeCash,
          monthly_emi: emi,
          total_repayment: totalRepay,
          total_interest: totalInt,
          dscr: dscr,
          affordability_status: dscr >= 1.5 ? 'COMFORTABLE' : dscr >= 1.15 ? 'MODERATE' : 'STRETCHED',
          affordability_notes: dscr >= 1.5 ? 'Safe debt coverage exceeding regulatory buffer threshold.' : 'Tight operating buffer.',
          prudent_max_loan_recommendation: Math.round(freeCash * 0.4 * tenureMonths),
          disclaimer: 'Illustrative simulation based on declared inputs.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchCalc, 150);
    return () => clearTimeout(timer);
  }, [monthlyReceipts, monthlyExpenses, existingDebt, householdExpenses, loanAmount, interestRate, tenureMonths]);

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
            <span className="bank-badge bg-blue-100 text-[#123B6D] border border-blue-200">
              Prudent Lending Workbench
            </span>
            <span className="text-xs text-text-secondary">Solvency & Debt Service Coverage Ratio (DSCR)</span>
          </div>
          <h2 className="text-xl font-bold text-[#172B4D] mt-1.5">
            Micro-Enterprise Loan Repayment Capacity Calculator
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 max-w-2xl">
            Simulate affordable monthly EMI commitments based on your verified operating cash surplus to prevent over-indebtedness.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cash Flow Inputs */}
          <div className="bank-card p-6 border border-[#E2E8F0] bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#172B4D] pb-3 border-b border-[#E2E8F0] flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span>1. Monthly Business Inflow & Operating Costs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Monthly Verified Receipts (₹)
                </label>
                <input
                  type="number"
                  value={monthlyReceipts}
                  onChange={(e) => setMonthlyReceipts(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-text-main focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Monthly Operating Expenses (₹)
                </label>
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-text-main focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Existing Monthly Debt Service / EMI (₹)
                </label>
                <input
                  type="number"
                  value={existingDebt}
                  onChange={(e) => setExistingDebt(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-text-main focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1.5">
                  Essential Household Living Drawings (₹)
                </label>
                <input
                  type="number"
                  value={householdExpenses}
                  onChange={(e) => setHouseholdExpenses(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-text-main focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Loan Simulation Sliders */}
          <div className="bank-card p-6 border border-[#E2E8F0] bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#172B4D] pb-3 border-b border-[#E2E8F0] flex items-center space-x-2">
              <Coins className="w-4 h-4 text-blue-600" />
              <span>2. Simulated Loan Borrowing Parameters</span>
            </h3>

            {/* Loan Amount Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-text-main">Requested Loan Principal:</span>
                <span className="font-bold text-[#123B6D] text-sm">{formatCurrency(loanAmount)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="300000"
                step="5000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                <span>₹10,000</span>
                <span>₹3,00,000</span>
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-text-main">Annual Interest Rate (APR):</span>
                <span className="font-bold text-[#123B6D] text-sm">{interestRate}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="28"
                step="0.5"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                <span>10% (Prime MSME)</span>
                <span>28% (Micro NBFC)</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-text-main">Tenure Duration:</span>
                <span className="font-bold text-[#123B6D] text-sm">{tenureMonths} Months</span>
              </div>
              <input
                type="range"
                min="3"
                max="36"
                step="1"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                <span>3 Months</span>
                <span>36 Months</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Card (5 Cols) */}
        <div className="lg:col-span-5 bank-card p-6 border border-[#E2E8F0] bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <span className="text-xs uppercase font-bold text-text-secondary tracking-wider">
                Affordability Results
              </span>
              <span className={`bank-badge text-[10px] border ${
                calculation?.dscr && calculation.dscr >= 1.5
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : calculation?.dscr && calculation.dscr >= 1.15
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {calculation?.affordability_status?.replace('_', ' ') || 'COMFORTABLE'}
              </span>
            </div>

            {/* Monthly EMI Large Box */}
            <div className="my-5 p-5 rounded-xl bg-blue-50/70 border border-blue-200 text-center">
              <span className="text-xs text-[#123B6D] font-medium block">
                Estimated Monthly Repayment (EMI)
              </span>
              <div className="text-3xl font-extrabold text-[#123B6D] mt-1 tracking-tight">
                {formatCurrency(calculation?.monthly_emi || 0)}
              </div>
              <span className="text-[11px] text-text-secondary block mt-1">
                for {tenureMonths} monthly cycles @ {interestRate}% APR
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-3 text-xs divide-y divide-[#E2E8F0]">
              <div className="flex justify-between pt-2">
                <span className="text-text-secondary">Net Operating Cash Surplus:</span>
                <span className="font-semibold text-text-main">
                  {formatCurrency(calculation?.net_operating_cash || 0)}/mo
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-text-secondary">Free Cash Flow for Debt Service:</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(calculation?.free_cash_flow_available || 0)}/mo
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-text-secondary">Debt Service Coverage (DSCR):</span>
                <span className="font-bold text-blue-700">
                  {calculation?.dscr ? `${calculation.dscr.toFixed(2)}x` : '2.10x'}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-text-secondary">Total Interest Cost:</span>
                <span className="font-semibold text-amber-700">
                  {formatCurrency(calculation?.total_interest || 0)}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-text-secondary">Total Repayment Amount:</span>
                <span className="font-semibold text-text-main">
                  {formatCurrency(calculation?.total_repayment || 0)}
                </span>
              </div>
            </div>

            {/* Recommended Prudent Borrowing Cap */}
            <div className="mt-5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
              <div className="flex items-center text-emerald-700 font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4 mr-1.5 flex-shrink-0" />
                <span>Prudent Maximum Borrowing Capacity:</span>
              </div>
              <div className="text-base font-bold text-[#123B6D] mt-0.5">
                {formatCurrency(calculation?.prudent_max_loan_recommendation || 150000)}
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                {calculation?.affordability_notes || 'Maintains a comfortable 40% operational cash surplus buffer against seasonal variance.'}
              </p>
            </div>
          </div>

          {/* Underwriting Notice */}
          <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-text-secondary leading-relaxed">
            <span className="font-bold text-text-main block mb-0.5">Underwriting Notice:</span>
            This simulation provides affordability guidance. It does not constitute a formal loan offer or guarantee approval from partner lenders.
          </div>
        </div>
      </div>
    </div>
  );
};
