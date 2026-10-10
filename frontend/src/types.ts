export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'borrower' | 'verifier' | 'lender' | 'admin';
  business_profile?: BusinessProfile;
}

export interface BusinessProfile {
  business_name: string;
  business_type: string;
  registration_number?: string;
  tax_id?: string;
  phone?: string;
  address?: string;
  years_in_business: number;
  monthly_turnover_estimate: number;
  description?: string;
}

export interface Transaction {
  id: string;
  batch_id: string;
  txn_id: string;
  txn_date: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string;
  channel: string;
  classification: string;
  system_classification: string;
  user_override?: string;
  confidence_score: number;
  is_duplicate: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  reference_id?: string;
}

export interface MonthlyTrend {
  month: string;
  receipts: number;
  expenses: number;
  net_cash_flow: number;
  debt_payments: number;
  transaction_count: number;
}

export interface DowSummary {
  day: string;
  receipts: number;
  count: number;
}

export interface FinancialMetrics {
  analysis_period_start: string;
  analysis_period_end: string;
  days_analyzed: number;
  months_analyzed: number;
  active_trading_days: number;
  total_transactions: number;
  valid_business_transactions: number;
  total_verified_receipts: number;
  estimated_operating_expenses: number;
  estimated_net_cash_flow: number;
  avg_daily_receipts: number;
  avg_monthly_receipts: number;
  avg_monthly_net_cash_flow: number;
  net_margin_percentage: number;
  verified_existing_debt: number;
  monthly_existing_debt: number;
  estimated_drawings: number;
  income_consistency_score: number;
  monthly_trend: MonthlyTrend[];
  dow_summary: DowSummary[];
}

export interface AssessmentReport {
  id: string;
  report_id: string;
  created_at: string;
  total_verified_receipts: number;
  estimated_operating_expenses: number;
  estimated_net_cash_flow: number;
  avg_daily_receipts: number;
  income_consistency_score: number;
  transaction_count: number;
  active_days: number;
  history_months: number;
  prototype_score: number;
  confidence_level: 'High' | 'Medium' | 'Low';
  risk_tier: string;
  dscr: number;
  max_recommended_loan: number;
  sha256_hash: string;
  digital_signature: string;
  positive_drivers: string[];
  risk_factors: string[];
  limitations: string[];
  monthly_breakdown: MonthlyTrend[];
  summary_data?: any;
}

export interface ConsentGrant {
  id: string;
  report_id: string;
  report_db_id?: string;
  borrower_name: string;
  business_name: string;
  lender_org_name: string;
  purpose: string;
  status: 'active' | 'revoked' | 'expired';
  granted_at: string;
  expires_at?: string;
  revoked_at?: string;
}

export interface LenderPipelineItem {
  report_id: string;
  report_db_id: string;
  borrower_name: string;
  business_name: string;
  business_type: string;
  years_in_business: number;
  created_at: string;
  total_verified_receipts: number;
  estimated_operating_expenses: number;
  estimated_net_cash_flow: number;
  prototype_score: number;
  risk_tier: string;
  confidence_level: string;
  dscr: number;
  max_recommended_loan: number;
  sha256_hash: string;
  digital_signature: string;
  decision?: {
    status: string;
    approved_amount: number;
    interest_rate: number;
    notes: string;
  };
}

export interface VerifierQueueItem {
  id: string;
  filename: string;
  borrower_name: string;
  business_name: string;
  upload_timestamp: string;
  total_records: number;
  valid_records: number;
  duplicate_records: number;
  flagged_records: number;
  verification_status: string;
  verification_notes?: string;
  verified_at?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  timestamp: string;
}

export interface RepaymentCalculation {
  inputs: {
    monthly_receipts: number;
    monthly_operating_expenses: number;
    existing_monthly_debt: number;
    household_expenses: number;
    loan_amount: number;
    interest_rate_annual: number;
    tenure_months: number;
  };
  net_operating_cash: number;
  free_cash_flow_available: number;
  monthly_emi: number;
  total_repayment: number;
  total_interest: number;
  dscr: number;
  affordability_status: string;
  affordability_notes: string;
  prudent_max_loan_recommendation: number;
  disclaimer: string;
}
