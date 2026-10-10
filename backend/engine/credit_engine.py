import math
from typing import Dict, Any, List

class CreditEngine:
    """
    Explainable Alternative Credit Assessment & Repayment Capacity Engine.
    Operates strictly on independently verifiable transaction indicators without
    requiring traditional credit bureau records, collateral, or salary slips.
    """

    @classmethod
    def evaluate_creditworthiness(cls, metrics: Dict[str, Any], business_profile: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Computes an explainable alternative credit assessment,
        calibrated experimental prototype score (300-850), confidence rating,
        risk drivers, and prescriptive recommendations.
        """
        receipts = metrics.get("total_verified_receipts", 0.0)
        expenses = metrics.get("estimated_operating_expenses", 0.0)
        net_cash_flow = metrics.get("estimated_net_cash_flow", 0.0)
        months_span = metrics.get("months_analyzed", 0.0)
        active_days = metrics.get("active_trading_days", 0)
        avg_daily = metrics.get("avg_daily_receipts", 0.0)
        consistency_score = metrics.get("income_consistency_score", 0.0)
        existing_debt_monthly = metrics.get("monthly_existing_debt", 0.0)
        total_txns = metrics.get("total_transactions", 0)

        supporting_indicators = []
        identified_risks = []
        missing_information = []
        recommended_steps = []

        # 1. Base Score (Neutral starting benchmark: 500)
        # Score Range: 300 - 850 (Demonstration Prototype Score)
        score = 500.0

        # 2. History Duration Factor (Weight: up to +80 pts)
        if months_span >= 6.0:
            score += 80.0
            supporting_indicators.append(
                f"Sufficient digital operating history of {months_span:.1f} months provides statistically sound verification."
            )
        elif months_span >= 3.0:
            score += 45.0
            supporting_indicators.append(
                f"Demonstrated {months_span:.1f} months of continuous digital transaction flow."
            )
        elif months_span >= 1.0:
            score += 15.0
            identified_risks.append(
                f"Relatively brief observation window ({months_span:.1f} months); seasonality cannot be fully captured."
            )
            missing_information.append("6+ months of historical banking statements recommended to confirm seasonal stability.")
        else:
            score -= 20.0
            identified_risks.append("Observation window less than 1 month; insufficient baseline.")
            missing_information.append("At least 90 days of digital receipts needed for confident automated scoring.")

        # 3. Active Trading Days & Transaction Velocity (Weight: up to +80 pts)
        avg_active_days_per_month = (active_days / max(1.0, months_span))
        if avg_active_days_per_month >= 20:
            score += 80.0
            supporting_indicators.append(
                f"High commercial engagement with {active_days} active trading days (~{avg_active_days_per_month:.0f} days/month)."
            )
        elif avg_active_days_per_month >= 12:
            score += 40.0
            supporting_indicators.append(
                f"Moderate commercial activity with ~{avg_active_days_per_month:.0f} active selling days/month."
            )
        else:
            score -= 30.0
            identified_risks.append(
                f"Low trading frequency (~{avg_active_days_per_month:.0f} days/month) indicates intermittent or part-time business activity."
            )

        # 4. Net Operating Margin & Cash Generation (Weight: up to +90 pts)
        margin = (net_cash_flow / receipts * 100) if receipts > 0 else 0.0
        avg_monthly_net = (net_cash_flow / max(1.0, months_span))

        if margin >= 25.0 and avg_monthly_net >= 20000:
            score += 90.0
            supporting_indicators.append(
                f"Robust cash margin of {margin:.1f}% generating an estimated net operating surplus of ₹{avg_monthly_net:,.0f}/month."
            )
        elif margin >= 15.0 and avg_monthly_net >= 10000:
            score += 55.0
            supporting_indicators.append(
                f"Positive operating margin of {margin:.1f}% with ₹{avg_monthly_net:,.0f}/month net surplus."
            )
        elif net_cash_flow > 0:
            score += 20.0
            supporting_indicators.append(
                f"Positive cash flow with {margin:.1f}% margin, though surplus is slim (₹{avg_monthly_net:,.0f}/month)."
            )
            identified_risks.append("Narrow operating cash margin leaves little cushion for unexpected cost spikes.")
        else:
            score -= 70.0
            identified_risks.append(
                f"Negative net operating cash flow (-₹{abs(avg_monthly_net):,.0f}/month). Outflows exceed verified revenues."
            )

        # 5. Income Consistency & Cash Flow Predictability (Weight: up to +60 pts)
        if consistency_score >= 70.0:
            score += 60.0
            supporting_indicators.append(
                f"High income consistency score ({consistency_score:.1f}/100) reflects steady daily cash collection with minimal volatility."
            )
        elif consistency_score >= 50.0:
            score += 30.0
            supporting_indicators.append(
                f"Acceptable income predictability ({consistency_score:.1f}/100)."
            )
        else:
            score -= 35.0
            identified_risks.append(
                f"Elevated cash flow variance ({consistency_score:.1f}/100 consistency) signals sporadic sales or seasonal reliance."
            )

        # 6. Debt-to-Inflow Burden Ratio (Weight: up to +40 pts / down to -60 pts)
        monthly_receipts = (receipts / max(1.0, months_span))
        debt_to_inflow = (existing_debt_monthly / monthly_receipts * 100) if monthly_receipts > 0 else 0.0

        if existing_debt_monthly == 0:
            score += 40.0
            supporting_indicators.append("No active recurring formal debt/EMI obligations detected in verified statements.")
        elif debt_to_inflow <= 15.0:
            score += 25.0
            supporting_indicators.append(
                f"Low verified debt obligations (₹{existing_debt_monthly:,.0f}/mo), representing only {debt_to_inflow:.1f}% of gross receipts."
            )
        elif debt_to_inflow <= 30.0:
            score -= 10.0
            identified_risks.append(
                f"Moderate existing debt service (₹{existing_debt_monthly:,.0f}/mo) absorbs {debt_to_inflow:.1f}% of gross inflows."
            )
        else:
            score -= 60.0
            identified_risks.append(
                f"High leverage: Existing debt obligations consume {debt_to_inflow:.1f}% of gross monthly receipts."
            )

        # Clamping prototype score to [300, 850]
        final_score = int(max(300, min(850, round(score))))

        # Confidence Level Calculation
        if months_span >= 3.0 and total_txns >= 60 and active_days >= 30:
            confidence_level = "High"
        elif months_span >= 1.5 and total_txns >= 25:
            confidence_level = "Medium"
        else:
            confidence_level = "Low"

        # Risk Tier & Assessment Status
        if final_score >= 720 and net_cash_flow > 0 and confidence_level in ["High", "Medium"]:
            assessment_status = "CREDITWORTHY_CAPACITY_CONFIRMED"
            risk_tier = "Low Risk"
        elif final_score >= 600 and net_cash_flow > 0:
            assessment_status = "MODERATE_CAPACITY_CONDITIONAL"
            risk_tier = "Moderate Risk"
        elif months_span < 1.0 or confidence_level == "Low":
            assessment_status = "MANUAL_REVIEW_RECOMMENDED"
            risk_tier = "Caution / Insufficient Data"
        else:
            assessment_status = "ELEVATED_RISK_MANUAL_REVIEW"
            risk_tier = "Elevated Risk"

        # Recommended Next Steps based on profile
        if assessment_status == "CREDITWORTHY_CAPACITY_CONFIRMED":
            recommended_steps.append("Pre-qualified for unsecured working capital credit line.")
            recommended_steps.append("Recommended repayment structure: Daily or weekly UPI micro-sweep repayments.")
            recommended_steps.append("Eligible for expedited automated sanction from participating financial partners.")
        elif assessment_status == "MODERATE_CAPACITY_CONDITIONAL":
            recommended_steps.append("Suitable for micro-ticket working capital loan with progressive limit increase.")
            recommended_steps.append("Lender may consider a 3-6 month tenure with bi-weekly flexi-repayment.")
            recommended_steps.append("Provide utility bill or trade supplier verification to unlock higher borrowing limits.")
        else:
            recommended_steps.append("Manual underwriter review recommended before credit decision.")
            recommended_steps.append("Upload supplementary 60-day digital statements to substantiate consistency.")
            recommended_steps.append("Consider onboarding merchant QR payment processing to establish deeper audit trail.")

        # Recommended loan capacity (Prudent limit = 35% of monthly net surplus * 12 months)
        free_monthly_cash = max(0.0, avg_monthly_net - existing_debt_monthly)
        max_recommended_loan = round(free_monthly_cash * 0.40 * 12, -2) if final_score >= 580 else 0.0

        # DSCR assuming illustrative micro-loan repayment of 25% free cash
        dscr = round(free_monthly_cash / max(1.0, (free_monthly_cash * 0.35)), 2) if free_monthly_cash > 0 else 0.8

        return {
            "prototype_score": final_score,
            "score_label": "Experimental Demonstration Score (Rule-Based, Non-Bureau)",
            "assessment_status": assessment_status,
            "confidence_level": confidence_level,
            "risk_tier": risk_tier,
            "dscr": dscr,
            "max_recommended_loan": max_recommended_loan,
            "supporting_indicators": supporting_indicators,
            "identified_risks": identified_risks,
            "missing_information": missing_information,
            "recommended_steps": recommended_steps,
            "methodology_disclaimer": (
                "Notice: This score is a prototype demonstration indicator derived strictly from verified "
                "digital transaction records. It does not replace official credit bureau ratings and must be "
                "evaluated alongside regulatory underwriter checks."
            )
        }

    @classmethod
    def calculate_repayment_capacity(
        cls,
        monthly_receipts: float,
        monthly_operating_expenses: float,
        existing_monthly_debt: float = 0.0,
        household_expenses: float = 0.0,
        loan_amount: float = 50000.0,
        interest_rate_annual: float = 18.0,
        tenure_months: int = 12
    ) -> Dict[str, Any]:
        """
        Interactive Repayment Capacity Calculator:
        Calculates monthly cash flow surplus, illustrative EMI, total interest,
        Debt Service Coverage Ratio (DSCR), and affordability safety margin.
        """
        monthly_receipts = max(0.0, float(monthly_receipts))
        monthly_operating_expenses = max(0.0, float(monthly_operating_expenses))
        existing_monthly_debt = max(0.0, float(existing_monthly_debt))
        household_expenses = max(0.0, float(household_expenses))
        loan_amount = max(1000.0, float(loan_amount))
        interest_rate_annual = max(0.1, float(interest_rate_annual))
        tenure_months = max(1, int(tenure_months))

        # 1. Net Operating Cash Flow
        net_operating_cash = monthly_receipts - monthly_operating_expenses

        # 2. Free Cash Flow Available for Debt Service (FCFADS)
        free_cash_flow = net_operating_cash - existing_monthly_debt - household_expenses

        # 3. Monthly EMI calculation: P * r * (1+r)^n / ((1+r)^n - 1)
        monthly_rate = (interest_rate_annual / 100.0) / 12.0
        n = tenure_months
        if monthly_rate > 0:
            emi = loan_amount * monthly_rate * ((1 + monthly_rate) ** n) / (((1 + monthly_rate) ** n) - 1)
        else:
            emi = loan_amount / n

        total_repayment = emi * n
        total_interest = total_repayment - loan_amount

        # 4. Debt Service Coverage Ratio (DSCR) = Free Cash Flow / Proposed EMI
        dscr = (free_cash_flow / emi) if emi > 0 else 0.0
        dscr = round(max(0.0, dscr), 2)

        # 5. Affordability Assessment
        # Healthy: DSCR >= 1.5 (surplus is 150% of payment)
        # Moderate: 1.15 <= DSCR < 1.5
        # Risky: 0.9 <= DSCR < 1.15
        # Unaffordable: DSCR < 0.9 or free_cash_flow <= 0
        if free_cash_flow <= 0:
            affordability_status = "UNAFFORDABLE"
            affordability_notes = "Operating cash flow and personal expenses exceed monthly income. Zero debt capacity."
            prudent_max_loan = 0.0
        elif dscr >= 1.5:
            affordability_status = "COMFORTABLE_AFFORDABILITY"
            affordability_notes = f"Strong repayment buffer: Proposed EMI absorbs only {round((emi / max(1, free_cash_flow))*100, 1)}% of available free cash flow."
            prudent_max_loan = cls._calculate_max_loan_from_capacity(free_cash_flow * 0.50, monthly_rate, n)
        elif dscr >= 1.15:
            affordability_status = "MODERATE_AFFORDABILITY"
            affordability_notes = f"Acceptable repayment capacity: Proposed EMI is manageable, but allows modest buffer for unexpected expenses."
            prudent_max_loan = cls._calculate_max_loan_from_capacity(free_cash_flow * 0.45, monthly_rate, n)
        elif dscr >= 1.0:
            affordability_status = "TIGHT_MARGIN_CAUTION"
            affordability_notes = "Very tight cash flow margin. A slight drop in sales or unforeseen cost could cause payment distress."
            prudent_max_loan = cls._calculate_max_loan_from_capacity(free_cash_flow * 0.35, monthly_rate, n)
        else:
            affordability_status = "POTENTIAL_STRESS"
            affordability_notes = "Proposed monthly repayment exceeds estimated free monthly surplus. Restructuring to lower amount or longer term advised."
            prudent_max_loan = cls._calculate_max_loan_from_capacity(free_cash_flow * 0.40, monthly_rate, n)

        return {
            "inputs": {
                "monthly_receipts": round(monthly_receipts, 2),
                "monthly_operating_expenses": round(monthly_operating_expenses, 2),
                "existing_monthly_debt": round(existing_monthly_debt, 2),
                "household_expenses": round(household_expenses, 2),
                "loan_amount": round(loan_amount, 2),
                "interest_rate_annual": round(interest_rate_annual, 2),
                "tenure_months": tenure_months
            },
            "net_operating_cash": round(net_operating_cash, 2),
            "free_cash_flow_available": round(free_cash_flow, 2),
            "monthly_emi": round(emi, 2),
            "total_repayment": round(total_repayment, 2),
            "total_interest": round(total_interest, 2),
            "dscr": dscr,
            "affordability_status": affordability_status,
            "affordability_notes": affordability_notes,
            "prudent_max_loan_recommendation": round(prudent_max_loan, -2),
            "disclaimer": "This repayment capacity calculator is an illustrative affordability simulation and does not constitute a guaranteed credit offer or final interest rate."
        }

    @staticmethod
    def _calculate_max_loan_from_capacity(max_monthly_emi: float, monthly_rate: float, n: int) -> float:
        if max_monthly_emi <= 0:
            return 0.0
        if monthly_rate > 0:
            pv = max_monthly_emi * (((1 + monthly_rate) ** n) - 1) / (monthly_rate * ((1 + monthly_rate) ** n))
            return max(0.0, pv)
        return max_monthly_emi * n
