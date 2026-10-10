from engine.credit_engine import CreditEngine
from engine.report_generator import ReportGenerator

def test_creditworthiness_evaluation():
    mock_metrics = {
        "total_verified_receipts": 350000.0,
        "estimated_operating_expenses": 220000.0,
        "estimated_net_cash_flow": 130000.0,
        "months_analyzed": 3.0,
        "active_trading_days": 75,
        "avg_daily_receipts": 4666.0,
        "income_consistency_score": 82.0,
        "monthly_existing_debt": 2500.0,
        "total_transactions": 250
    }

    result = CreditEngine.evaluate_creditworthiness(mock_metrics, {"business_name": "Test Enterprise", "business_type": "Retail"})

    assert "prototype_score" in result
    assert 300 <= result["prototype_score"] <= 850
    assert result["confidence_level"] in ["High", "Medium", "Low"]
    assert len(result["supporting_indicators"]) > 0
    assert result["max_recommended_loan"] > 0
    assert result["dscr"] > 1.0

def test_repayment_capacity_calculator():
    calc = CreditEngine.calculate_repayment_capacity(
        monthly_receipts=120000.0,
        monthly_operating_expenses=70000.0,
        existing_monthly_debt=4000.0,
        household_expenses=15000.0,
        loan_amount=100000.0,
        interest_rate_annual=16.0,
        tenure_months=12
    )

    assert calc["net_operating_cash"] == 50000.0
    assert calc["free_cash_flow_available"] == 31000.0
    assert calc["monthly_emi"] > 0
    assert calc["dscr"] > 1.5
    assert calc["affordability_status"] == "COMFORTABLE_AFFORDABILITY"

def test_report_cryptographic_integrity_and_signature():
    mock_metrics = {
        "analysis_period_start": "2026-01-01",
        "analysis_period_end": "2026-03-31",
        "months_analyzed": 3.0,
        "active_trading_days": 80,
        "total_verified_receipts": 400000.0,
        "estimated_operating_expenses": 260000.0,
        "estimated_net_cash_flow": 140000.0,
        "avg_daily_receipts": 5000.0,
        "avg_monthly_net_cash_flow": 46666.0,
        "income_consistency_score": 85.0,
        "verified_existing_debt": 0.0
    }
    assessment = {
        "prototype_score": 740,
        "confidence_level": "High",
        "risk_tier": "Low Risk",
        "assessment_status": "CREDITWORTHY_CAPACITY_CONFIRMED",
        "max_recommended_loan": 150000.0,
        "dscr": 2.2
    }

    report_payload = ReportGenerator.generate_report_payload(
        borrower_user_id="user-12345678",
        business_profile={"business_name": "Ramesh Kirana", "business_type": "Grocery"},
        metrics=mock_metrics,
        assessment=assessment,
        data_source_batch_id="batch-999"
    )

    assert "cryptographic_proof" in report_payload
    sha256 = report_payload["cryptographic_proof"]["sha256_hash"]
    sig = report_payload["cryptographic_proof"]["digital_signature"]
    assert len(sha256) == 64
    assert len(sig) == 64

    # Verification should succeed for untouched report
    is_valid, msg, audit = ReportGenerator.verify_report_integrity(report_payload)
    assert is_valid is True

    # Tampering with any field should fail integrity verification
    tampered = dict(report_payload)
    tampered["financial_summary"] = dict(tampered["financial_summary"])
    tampered["financial_summary"]["total_verified_receipts"] = 99999999.0  # Tampered amount

    is_valid_tampered, tampered_msg, tampered_audit = ReportGenerator.verify_report_integrity(tampered)
    assert is_valid_tampered is False
    assert "Integrity check failed" in tampered_msg
