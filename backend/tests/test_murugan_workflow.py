import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_murugan_full_workflow():
    session = requests.Session()
    print("--- 1. Demo Seeding ---")
    r = session.post(f"{BASE_URL}/api/auth/seed-demo-accounts")
    assert r.status_code == 200, f"Seed failed: {r.text}"
    print("Seed OK")

    print("--- 2. Template Download ---")
    r = session.get(f"{BASE_URL}/api/transactions/template")
    assert r.status_code == 200
    assert "txn_id,txn_date,amount" in r.text
    print("Template CSV verification OK")

    print("--- 3. Murugan Auth ---")
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": "murugan@trustcred.ai", "password": "trustcred123"})
    assert r.status_code == 200, f"Murugan login failed: {r.text}"
    murugan_token = r.json()["access_token"]
    murugan_headers = {"Authorization": f"Bearer {murugan_token}"}
    print("Murugan login OK")

    print("--- 4. Murugan Load Sample Dataset ---")
    r = session.post(f"{BASE_URL}/api/transactions/load-sample/murugan", headers=murugan_headers)
    assert r.status_code == 200, f"Load sample failed: {r.text}"
    print("Sample loaded OK")

    print("--- 5. Get Murugan Transactions & Reclassify One ---")
    r = session.get(f"{BASE_URL}/api/transactions?limit=10", headers=murugan_headers)
    assert r.status_code == 200
    txns = r.json()["items"]
    assert len(txns) > 0
    first_txn_id = txns[0]["id"]
    
    r = session.patch(f"{BASE_URL}/api/transactions/{first_txn_id}/override", json={"classification": "business_revenue"}, headers=murugan_headers)
    assert r.status_code == 200
    print("Reclassification OK")

    print("--- 6. Generate Assessment Report ---")
    r = session.post(f"{BASE_URL}/api/assessment/generate", headers=murugan_headers)
    assert r.status_code == 200, f"Assessment failed: {r.text}"
    rep_data = r.json()
    report_id = rep_data["report_id"]
    sha256_hash = rep_data["report"]["cryptographic_proof"]["sha256_hash"]
    print(f"Murugan Report generated: {report_id}, Hash: {sha256_hash[:16]}...")

    print("--- 7. Grant Consent to Lender ---")
    r = session.post(f"{BASE_URL}/api/consent/grant", json={
        "report_id": report_id,
        "lender_org_name": "Apex Micro-Enterprise Capital",
        "purpose": "Tiffin Cart Micro-Working Capital Loan ₹50,000",
        "validity_days": 30
    }, headers=murugan_headers)
    assert r.status_code == 200
    consent_id = r.json()["consent_id"]
    print(f"Consent granted OK: {consent_id}")

    print("--- 8. Lender View & Verify Murugan Application ---")
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": "lender@trustcred.ai", "password": "trustcred123"})
    assert r.status_code == 200
    lender_token = r.json()["access_token"]
    lender_headers = {"Authorization": f"Bearer {lender_token}"}

    # Fetch report as lender
    r = session.get(f"{BASE_URL}/api/lender/report/{report_id}", headers=lender_headers)
    assert r.status_code == 200, f"Lender failed to view report: {r.text}"
    lender_rep = r.json()
    assert lender_rep["cryptographic_verification"]["is_valid"] is True
    print("Lender cryptographic verification PASSED")

    # Record decision
    r = session.post(f"{BASE_URL}/api/lender/report/{report_id}/decision", json={
        "decision": "approved",
        "approved_amount": 50000.0,
        "interest_rate": 15.5,
        "loan_term_months": 12,
        "conditions": "Daily UPI receipts average > Rs. 3,500; Auto-debit weekly escrow",
        "decision_notes": "Consistent daily street food UPI collections demonstrate strong repayment buffer."
    }, headers=lender_headers)
    assert r.status_code == 200
    print("Lender approved loan decision recorded OK")

    print("--- 9. Murugan Revokes Consent & Verifies Lender Block ---")
    r = session.post(f"{BASE_URL}/api/consent/{consent_id}/revoke", headers=murugan_headers)
    assert r.status_code == 200
    print("Consent revoked OK")

    # Verify Lender access is now blocked (403 Forbidden)
    r = session.get(f"{BASE_URL}/api/lender/report/{report_id}", headers=lender_headers)
    assert r.status_code == 403, f"Expected 403 Forbidden after revocation, got {r.status_code}"
    print("Revocation enforcement confirmed: Lender received 403 Forbidden!")

    print("--- 10. Public SHA-256 Verification ---")
    r = session.post(f"{BASE_URL}/api/verify-report", json={"sha256_hash": sha256_hash})
    assert r.status_code == 200
    assert r.json()["verified"] is True
    print("Public integrity verification PASSED")

    print("=== MURUGAN END-TO-END WORKFLOW 100% SUCCESSFUL ===")

if __name__ == "__main__":
    test_murugan_full_workflow()
