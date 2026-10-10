import re
import io
import math
from datetime import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np

class TransactionAnalyzer:
    """
    Parses, validates, normalizes, detects duplicates, classifies,
    and aggregates small business transaction records with explainable rules
    and confidence scores.
    """

    REVENUE_KEYWORDS = [
        "upi", "qr", "bharatpe", "paytm", "phonepe", "gpay", "pos", "customer", 
        "merchant", "payment received", "store sale", "swiggy", "zomato", "sales",
        "settlement", "counter", "received from", "inward"
    ]

    EXPENSE_KEYWORDS = [
        "wholesale", "mandi", "supplier", "distributor", "vendor", "inventory", 
        "raw material", "packaging", "commercial lpg", "transport", "freight",
        "rent", "electricity", "utility", "stock purchase", "dairy", "spices",
        "oil supplier", "grain purchase", "goods"
    ]

    SELF_TRANSFER_KEYWORDS = [
        "self", "own a/c", "own account", "transfer to self", "sweep", "auto-sweep",
        "contra", "internal transfer", "transfer from self", "linked account"
    ]

    LOAN_EMI_KEYWORDS = [
        "emi", "loan", "bajaj", "muthoot", "hdb", "chola", "shriram", "nach", 
        "ecs debit", "finance", "capital", "microfinance", "mfi", "repayment"
    ]

    PERSONAL_KEYWORDS = [
        "atm wdl", "cash withdrawal", "personal", "family", "school fees", 
        "medical", "hospital", "movie", "entertainment", "recharge-personal"
    ]

    REFUND_KEYWORDS = [
        "refund", "reversal", "reversed", "chargeback", "failed txn", "cashback"
    ]

    @staticmethod
    def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
        col_map = {}
        for col in df.columns:
            c = str(col).strip().lower().replace("_", "").replace(" ", "")
            if any(k in c for k in ["txndate", "date", "timestamp", "valuedate"]):
                col_map[col] = "txn_date"
            elif any(k in c for k in ["amount", "amt", "txnamount"]):
                col_map[col] = "amount"
            elif any(k in c for k in ["direction", "type", "drcr", "crdr", "creditdebit"]):
                col_map[col] = "direction"
            elif any(k in c for k in ["description", "narration", "particulars", "remarks", "details"]):
                col_map[col] = "description"
            elif any(k in c for k in ["txnid", "transactionid", "ref", "reference", "utr", "chqno"]):
                col_map[col] = "txn_id"
            elif any(k in c for k in ["channel", "mode", "paymentmode"]):
                col_map[col] = "channel"
        
        df = df.rename(columns=col_map)
        return df

    @classmethod
    def parse_csv(cls, csv_content: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Parses CSV string into standardized records with validation and anomaly reporting.
        """
        try:
            df = pd.read_csv(io.StringIO(csv_content))
        except Exception as e:
            raise ValueError(f"Failed to read CSV: {str(e)}")

        if df.empty:
            raise ValueError("Uploaded CSV statement is empty.")

        df = cls.normalize_column_names(df)

        required_cols = ["txn_date", "amount"]
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns in CSV: {missing}. Expected Date and Amount.")

        if "description" not in df.columns:
            df["description"] = "Transaction record"
        if "txn_id" not in df.columns:
            df["txn_id"] = [f"TXN-{idx+1000}" for idx in range(len(df))]
        if "channel" not in df.columns:
            df["channel"] = "UPI"

        # Check if separate Deposit/Withdrawal columns exist
        if "direction" not in df.columns:
            # Check for credit/debit in column values or amount sign
            # If negative amount, it's debit; positive credit
            def infer_direction(val):
                try:
                    num = float(str(val).replace(",", "").strip())
                    return "debit" if num < 0 else "credit"
                except Exception:
                    return "credit"
            df["direction"] = df["amount"].apply(infer_direction)
        
        # Clean amount
        def clean_amount(val):
            try:
                s = str(val).replace(",", "").replace("₹", "").replace("$", "").strip()
                return abs(float(s))
            except Exception:
                return 0.0

        df["amount"] = df["amount"].apply(clean_amount)

        # Clean direction
        def clean_dir(val):
            s = str(val).strip().lower()
            if any(k in s for k in ["cr", "credit", "deposit", "in", "+"]):
                return "credit"
            elif any(k in s for k in ["dr", "debit", "withdrawal", "out", "-"]):
                return "debit"
            return "credit"

        df["direction"] = df["direction"].apply(clean_dir)

        # Clean dates
        def parse_date(val):
            if pd.isna(val):
                return datetime.utcnow()
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y"):
                try:
                    return datetime.strptime(str(val).strip(), fmt)
                except ValueError:
                    pass
            try:
                return pd.to_datetime(val).to_pydatetime()
            except Exception:
                return datetime.utcnow()

        df["txn_date_dt"] = df["txn_date"].apply(parse_date)
        df["txn_date_str"] = df["txn_date_dt"].dt.strftime("%Y-%m-%d %H:%M:%S")

        # Duplicate detection: exact duplicate or duplicate fingerprint
        # A fingerprint is (date_day, amount, direction, description_snippet)
        df["date_day"] = df["txn_date_dt"].dt.strftime("%Y-%m-%d")
        df["desc_norm"] = df["description"].astype(str).str.lower().str.strip()
        
        # Duplicate detection:
        # 1. Exact duplicate txn_id collision
        duplicate_id_mask = df.duplicated(subset=["txn_id"], keep="first")
        
        # 2. Exact collision on identical reference_id (when reference_id exists and not empty)
        if "reference_id" in df.columns:
            duplicate_ref_mask = df.duplicated(subset=["reference_id"], keep="first") & df["reference_id"].ne("")
        else:
            duplicate_ref_mask = pd.Series([False] * len(df))

        # 3. Exact timestamp (to the second) + amount + direction + description collision
        duplicate_exact_second = df.duplicated(subset=["txn_date_str", "amount", "direction", "desc_norm"], keep="first")

        df["is_duplicate"] = duplicate_id_mask | duplicate_ref_mask | duplicate_exact_second

        # Classify each transaction with transparent rules & confidence scoring
        records = []
        excluded_count = 0
        duplicate_count = int(df["is_duplicate"].sum())
        flagged_count = 0

        for idx, row in df.iterrows():
            desc = str(row["desc_norm"])
            direction = row["direction"]
            amt = float(row["amount"])
            is_dup = bool(row["is_duplicate"])
            
            flag_reason = None
            is_flagged = False
            confidence = 0.85
            classification = "uncertain"

            if is_dup:
                is_flagged = True
                flag_reason = "Duplicate record detected (identical reference or amount/timestamp collision)"
                classification = "excluded"
                confidence = 0.99
                excluded_count += 1
            elif amt <= 0.0:
                is_flagged = True
                flag_reason = "Zero or invalid transaction amount"
                classification = "excluded"
                confidence = 0.99
                excluded_count += 1
            # 1. Check self-transfers first (crucial rule: never count own account transfers as business revenue)
            elif any(k in desc for k in cls.SELF_TRANSFER_KEYWORDS):
                classification = "personal_transfer"
                confidence = 0.92
                is_flagged = True
                flag_reason = "Internal self-transfer detected: excluded from business revenue and operating expense"
            # 2. Check loan repayments / EMIs
            elif any(k in desc for k in cls.LOAN_EMI_KEYWORDS):
                classification = "loan_repayment"
                confidence = 0.90
            # 3. Check refunds & reversals
            elif any(k in desc for k in cls.REFUND_KEYWORDS):
                classification = "refund_reversal"
                confidence = 0.88
                is_flagged = True
                flag_reason = "Payment reversal / refund detected: excluded from revenue calculation"
            # 4. Check personal drawings/cash withdrawals
            elif any(k in desc for k in cls.PERSONAL_KEYWORDS) and direction == "debit":
                classification = "drawings"
                confidence = 0.82
            # 5. Credits
            elif direction == "credit":
                if any(k in desc for k in cls.REVENUE_KEYWORDS):
                    classification = "business_revenue"
                    confidence = 0.92
                elif amt < 15000:
                    # Regular small digital receipts typical of retail micro-business
                    classification = "business_revenue"
                    confidence = 0.78
                else:
                    # Unusually large credit for micro-business; flag for verification
                    classification = "business_revenue"
                    confidence = 0.60
                    is_flagged = True
                    flag_reason = "High-value credit (>₹15,000) exceeds typical micro-receipt pattern; verifier check advised"
            # 6. Debits
            elif direction == "debit":
                if any(k in desc for k in cls.EXPENSE_KEYWORDS):
                    classification = "operating_expense"
                    confidence = 0.94
                else:
                    classification = "operating_expense"
                    confidence = 0.70

            if is_flagged:
                flagged_count += 1

            records.append({
                "txn_id": str(row["txn_id"]),
                "txn_date": row["txn_date_str"],
                "amount": round(amt, 2),
                "direction": direction,
                "description": str(row["description"]),
                "channel": str(row["channel"]),
                "classification": classification,
                "confidence_score": round(confidence, 2),
                "is_duplicate": is_dup,
                "is_flagged": is_flagged,
                "flag_reason": flag_reason,
                "reference_id": str(row.get("reference_id", row["txn_id"]))
            })

        summary = {
            "total_records": len(df),
            "valid_records": len(df) - excluded_count,
            "duplicate_records": duplicate_count,
            "flagged_records": flagged_count,
            "excluded_records": excluded_count
        }

        return records, summary

    @classmethod
    def analyze_metrics(cls, transactions: List[Dict[str, Any]], days_filter: int = None) -> Dict[str, Any]:
        """
        Calculates verified receipts, operating expenses, net cash flows,
        consistency index, active days, and monthly aggregations.
        """
        if not transactions:
            return cls._empty_metrics()

        df = pd.DataFrame(transactions)
        df["txn_date_dt"] = pd.to_datetime(df["txn_date"])
        df["amount"] = pd.to_numeric(df["amount"])

        # Filter out excluded/duplicate records
        valid_df = df[~df["classification"].isin(["excluded", "refund_reversal", "personal_transfer"])].copy()

        # Date filtering if requested (30, 90, 180, 365 days)
        if days_filter and not valid_df.empty:
            max_date = valid_df["txn_date_dt"].max()
            min_cutoff = max_date - pd.Timedelta(days=days_filter)
            valid_df = valid_df[valid_df["txn_date_dt"] >= min_cutoff]

        if valid_df.empty:
            return cls._empty_metrics()

        # Effective classification (user override takes precedence)
        def get_eff_class(row):
            override = row.get("user_classification_override")
            if override and override != "none" and str(override).strip() != "":
                return override
            return row["classification"]

        valid_df["eff_class"] = valid_df.apply(get_eff_class, axis=1)

        # Business Receipts (only business_revenue)
        receipts_df = valid_df[(valid_df["direction"] == "credit") & (valid_df["eff_class"] == "business_revenue")]
        total_verified_receipts = float(receipts_df["amount"].sum())

        # Operating Expenses (operating_expense)
        expenses_df = valid_df[(valid_df["direction"] == "debit") & (valid_df["eff_class"] == "operating_expense")]
        estimated_operating_expenses = float(expenses_df["amount"].sum())

        # Existing Debt / EMI obligations
        debt_df = valid_df[(valid_df["direction"] == "debit") & (valid_df["eff_class"] == "loan_repayment")]
        verified_existing_debt = float(debt_df["amount"].sum())

        # Personal Drawings
        drawings_df = valid_df[(valid_df["direction"] == "debit") & (valid_df["eff_class"] == "drawings")]
        estimated_drawings = float(drawings_df["amount"].sum())

        # Net Business Cash Flow = Receipts - Operating Expenses
        estimated_net_cash_flow = total_verified_receipts - estimated_operating_expenses

        # Date range & active trading days
        start_date = valid_df["txn_date_dt"].min()
        end_date = valid_df["txn_date_dt"].max()
        days_span = max(1, (end_date - start_date).days + 1)
        months_span = max(0.5, round(days_span / 30.4, 1))

        # Active trading days (days with at least 1 verified business receipt)
        if not receipts_df.empty:
            receipt_days = receipts_df["txn_date_dt"].dt.date.nunique()
            avg_daily_receipts = round(total_verified_receipts / max(1, receipt_days), 2)
        else:
            receipt_days = 0
            avg_daily_receipts = 0.0

        # Daily receipts consistency calculation (Coefficient of Variation)
        # CV = StdDev / Mean. Lower CV = more stable and consistent income.
        # Income consistency indicator score: scaled 0 to 100
        if receipt_days >= 7:
            daily_series = receipts_df.groupby(receipts_df["txn_date_dt"].dt.date)["amount"].sum()
            mean_daily = daily_series.mean()
            std_daily = daily_series.std()
            cv = (std_daily / mean_daily) if mean_daily > 0 else 1.0
            # A CV of 0.35 is excellent (consistent daily street/grocery trade)
            # A CV of > 1.2 is volatile
            consistency_score = max(10.0, min(95.0, round(100.0 - (cv * 45.0), 1)))
        else:
            consistency_score = 45.0  # Limited data baseline

        # Monthly Trends Aggregation
        valid_df["month_year"] = valid_df["txn_date_dt"].dt.strftime("%Y-%m")
        unique_months = sorted(valid_df["month_year"].unique())
        monthly_trend = []

        for m in unique_months:
            m_sub = valid_df[valid_df["month_year"] == m]
            m_rec = float(m_sub[(m_sub["direction"] == "credit") & (m_sub["eff_class"] == "business_revenue")]["amount"].sum())
            m_exp = float(m_sub[(m_sub["direction"] == "debit") & (m_sub["eff_class"] == "operating_expense")]["amount"].sum())
            m_debt = float(m_sub[(m_sub["direction"] == "debit") & (m_sub["eff_class"] == "loan_repayment")]["amount"].sum())
            m_txns = len(m_sub)
            monthly_trend.append({
                "month": m,
                "receipts": round(m_rec, 2),
                "expenses": round(m_exp, 2),
                "net_cash_flow": round(m_rec - m_exp, 2),
                "debt_payments": round(m_debt, 2),
                "transaction_count": m_txns
            })

        # Day of week breakdown (shows street vendor weekend spikes)
        valid_df["day_name"] = valid_df["txn_date_dt"].dt.day_name()
        dow_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        dow_summary = []
        for dow in dow_order:
            dow_sub = valid_df[(valid_df["day_name"] == dow) & (valid_df["eff_class"] == "business_revenue")]
            dow_summary.append({
                "day": dow[:3],
                "receipts": round(float(dow_sub["amount"].sum()), 2),
                "count": len(dow_sub)
            })

        return {
            "analysis_period_start": start_date.strftime("%Y-%m-%d"),
            "analysis_period_end": end_date.strftime("%Y-%m-%d"),
            "days_analyzed": days_span,
            "months_analyzed": months_span,
            "active_trading_days": receipt_days,
            "total_transactions": len(df),
            "valid_business_transactions": len(valid_df),
            "total_verified_receipts": round(total_verified_receipts, 2),
            "estimated_operating_expenses": round(estimated_operating_expenses, 2),
            "estimated_net_cash_flow": round(estimated_net_cash_flow, 2),
            "avg_daily_receipts": avg_daily_receipts,
            "avg_monthly_receipts": round(total_verified_receipts / months_span, 2),
            "avg_monthly_net_cash_flow": round(estimated_net_cash_flow / months_span, 2),
            "net_margin_percentage": round((estimated_net_cash_flow / total_verified_receipts * 100), 1) if total_verified_receipts > 0 else 0.0,
            "verified_existing_debt": round(verified_existing_debt, 2),
            "monthly_existing_debt": round(verified_existing_debt / months_span, 2),
            "estimated_drawings": round(estimated_drawings, 2),
            "income_consistency_score": consistency_score,
            "monthly_trend": monthly_trend,
            "dow_summary": dow_summary
        }

    @staticmethod
    def _empty_metrics() -> Dict[str, Any]:
        return {
            "analysis_period_start": datetime.utcnow().strftime("%Y-%m-%d"),
            "analysis_period_end": datetime.utcnow().strftime("%Y-%m-%d"),
            "days_analyzed": 0,
            "months_analyzed": 0.0,
            "active_trading_days": 0,
            "total_transactions": 0,
            "valid_business_transactions": 0,
            "total_verified_receipts": 0.0,
            "estimated_operating_expenses": 0.0,
            "estimated_net_cash_flow": 0.0,
            "avg_daily_receipts": 0.0,
            "avg_monthly_receipts": 0.0,
            "avg_monthly_net_cash_flow": 0.0,
            "net_margin_percentage": 0.0,
            "verified_existing_debt": 0.0,
            "monthly_existing_debt": 0.0,
            "estimated_drawings": 0.0,
            "income_consistency_score": 0.0,
            "monthly_trend": [],
            "dow_summary": []
        }
