import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def make_req(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_e2e_verification():
    print("--- 1. Testing Demo Seed & Health ---")
    seed_res = make_req("/auth/seed-demo-accounts", method="POST")
    print("Seed result:", seed_res.get("message"))
    assert "seeded successfully" in seed_res.get("message", "")

    print("\n--- 2. Testing Borrower Auth (Ramesh Kumar) ---")
    login_res = make_req("/auth/login", method="POST", data={
        "email": "ramesh@trustcred.ai",
        "password": "trustcred123"
    })
    token = login_res["access_token"]
    user = login_res["user"]
    print(f"Logged in as: {user['full_name']} ({user['role']}) - Business: {user['business_name']}")
    assert user["role"] == "borrower"

    print("\n--- 3. Testing Borrower Analytics & Metrics ---")
    analytics = make_req("/transactions/analytics?days=90", token=token)
    print(f"Verified Receipts: Rs. {analytics['total_verified_receipts']:,.2f}")
    print(f"Operating Expenses: Rs. {analytics['estimated_operating_expenses']:,.2f}")
    print(f"Net Cash Flow: Rs. {analytics['estimated_net_cash_flow']:,.2f}")
    print(f"Active Trading Days: {analytics['active_trading_days']}")
    print(f"Income Consistency: {analytics['income_consistency_score']}/100")
    assert analytics["total_verified_receipts"] > 0
    assert analytics["estimated_net_cash_flow"] > 0

    print("\n--- 4. Testing Alternative Credit Assessment ---")
    assess = make_req("/assessment/latest", token=token)
    print(f"Report ID: {assess['report_id']}")
    print(f"Prototype Demonstration Score: {assess['prototype_score']} / 850")
    print(f"Risk Tier: {assess['risk_tier']}")
    print(f"Confidence Level: {assess['confidence_level']}")
    print(f"DSCR Coverage: {assess['dscr']}x")
    print(f"SHA-256 Hash: {assess['sha256_hash']}")
    print(f"Digital Signature: {assess['digital_signature'][:24]}...")
    assert assess["prototype_score"] >= 650

    print("\n--- 5. Testing Cryptographic Public Verification ---")
    verify_res = make_req("/verify-report", method="POST", data={
        "report_id": assess["report_id"]
    })
    print("Public Verification Status:", verify_res["status"])
    print("Integrity Result:", verify_res["message"])
    assert verify_res["verified"] is True
    assert verify_res["status"] == "TAMPER_FREE_AUTHENTIC"

    print("\n--- 6. Testing Repayment Capacity Calculator ---")
    calc_res = make_req("/calculator/repayment-capacity", method="POST", data={
        "monthly_receipts": analytics["avg_monthly_receipts"],
        "monthly_operating_expenses": analytics["estimated_operating_expenses"] / max(1, analytics["months_analyzed"]),
        "existing_monthly_debt": analytics["monthly_existing_debt"],
        "household_expenses": 15000.0,
        "loan_amount": 100000.0,
        "interest_rate_annual": 16.0,
        "tenure_months": 12
    })
    print(f"Monthly EMI: Rs. {calc_res['monthly_emi']:,.2f}")
    print(f"Calculated DSCR: {calc_res['dscr']}x")
    print(f"Affordability Status: {calc_res['affordability_status']}")
    print(f"Max Prudent Loan Capacity: Rs. {calc_res['prudent_max_loan_recommendation']:,.2f}")
    assert calc_res["monthly_emi"] > 0
    assert calc_res["dscr"] > 1.0

    print("\n--- 7. Testing Lender Workflow (Meera Kapoor) ---")
    lender_login = make_req("/auth/login", method="POST", data={
        "email": "lender@trustcred.ai",
        "password": "trustcred123"
    })
    lender_token = lender_login["access_token"]
    pipeline = make_req("/lender/pipeline", token=lender_token)
    print(f"Lender Pipeline Count: {len(pipeline)} shared reports")
    assert len(pipeline) > 0

    # Record decision
    dec_res = make_req(f"/lender/report/{assess['report_id']}/decision", method="POST", token=lender_token, data={
        "decision": "approved",
        "approved_amount": 120000.0,
        "interest_rate": 15.5,
        "loan_term_months": 12,
        "conditions": "Weekly flexi-sweep auto repayment from merchant settlement account.",
        "decision_notes": "Cash flow analysis verified consistent daily turnover with 24% net surplus."
    })
    print("Recorded Decision:", dec_res["message"])

    print("\n--- 8. Testing Financial Verifier Queue (Rajesh Sen) ---")
    verifier_login = make_req("/auth/login", method="POST", data={
        "email": "verifier@trustcred.ai",
        "password": "trustcred123"
    })
    verifier_token = verifier_login["access_token"]
    v_queue = make_req("/verifier/queue", token=verifier_token)
    print(f"Verifier Queue Count: {len(v_queue)} statement batches")
    assert len(v_queue) > 0

    print("\n=== ALL END-TO-END WORKFLOWS PASSED 100% ===")

if __name__ == "__main__":
    run_e2e_verification()
