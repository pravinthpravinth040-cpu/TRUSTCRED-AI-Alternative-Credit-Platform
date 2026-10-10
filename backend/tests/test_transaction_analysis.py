from datetime import datetime
from engine.transaction_analyzer import TransactionAnalyzer
from sample_data.generator import generate_ramesh_kirana_csv, generate_priya_gourmet_csv

def test_csv_parsing_and_normalization():
    csv_data = generate_ramesh_kirana_csv()
    records, summary = TransactionAnalyzer.parse_csv(csv_data)

    assert len(records) > 0
    assert summary["total_records"] > 0
    assert summary["valid_records"] > 0

    # Test column normalization
    first = records[0]
    assert "txn_id" in first
    assert "amount" in first
    assert "direction" in first
    assert "classification" in first
    assert "confidence_score" in first

def test_duplicate_detection():
    # Construct CSV with exact duplicate
    raw_csv = """txn_id,txn_date,amount,direction,description,channel
TXN-1,2026-03-01 10:00:00,500.0,credit,UPI Customer payment,UPI
TXN-1,2026-03-01 10:00:00,500.0,credit,UPI Customer payment,UPI
TXN-2,2026-03-01 11:00:00,300.0,credit,UPI Payment,UPI
"""
    records, summary = TransactionAnalyzer.parse_csv(raw_csv)
    assert summary["duplicate_records"] >= 1
    dup_records = [r for r in records if r["is_duplicate"]]
    assert len(dup_records) >= 1
    assert dup_records[0]["classification"] == "excluded"

def test_self_transfer_exclusion():
    raw_csv = """txn_id,txn_date,amount,direction,description,channel
TXN-101,2026-03-01 12:00:00,20000.0,credit,Transfer to self own a/c,IMPS
TXN-102,2026-03-01 13:00:00,150.0,credit,UPI Payment received from Cust-22,UPI
"""
    records, summary = TransactionAnalyzer.parse_csv(raw_csv)
    self_tx = next(r for r in records if r["txn_id"] == "TXN-101")
    assert self_tx["classification"] == "personal_transfer"
    assert self_tx["is_flagged"] is True

    metrics = TransactionAnalyzer.analyze_metrics(records)
    # 20000 self-transfer should NOT be counted in business receipts!
    assert metrics["total_verified_receipts"] == 150.0

def test_high_volume_street_vendor_metrics():
    csv_data = generate_priya_gourmet_csv()
    records, summary = TransactionAnalyzer.parse_csv(csv_data)
    metrics = TransactionAnalyzer.analyze_metrics(records)

    assert metrics["total_verified_receipts"] > 50000.0
    assert metrics["active_trading_days"] >= 40
    assert metrics["estimated_net_cash_flow"] > 0
    assert metrics["income_consistency_score"] > 40
