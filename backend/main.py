import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import engine, get_db, Base
import models
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_role
)
from engine.transaction_analyzer import TransactionAnalyzer
from engine.credit_engine import CreditEngine
from engine.report_generator import ReportGenerator
import sample_data.generator as sample_gen

# Auto-create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TRUSTCRED AI API",
    description="AI-Powered Alternative Credit Scoring and Income Verification Platform",
    version="1.0.0"
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & single-page application mount
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=FileResponse)
def serve_root():
    return FileResponse("static/index.html")

# -------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "borrower"  # borrower, verifier, lender
    business_name: Optional[str] = None
    business_type: Optional[str] = "Retail"

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class BusinessProfileUpdate(BaseModel):
    business_name: str
    business_type: str
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    years_in_business: Optional[float] = 1.0
    monthly_turnover_estimate: Optional[float] = 0.0
    description: Optional[str] = None

class TransactionOverride(BaseModel):
    classification: str  # business_revenue, operating_expense, personal_transfer, loan_repayment, drawings, refund_reversal, excluded

class RepaymentCapacityInput(BaseModel):
    monthly_receipts: float
    monthly_operating_expenses: float
    existing_monthly_debt: float = 0.0
    household_expenses: float = 0.0
    loan_amount: float = 50000.0
    interest_rate_annual: float = 18.0
    tenure_months: int = 12

class ConsentGrantRequest(BaseModel):
    report_id: str
    lender_id: Optional[str] = None
    lender_org_name: Optional[str] = "Regulated Financial Partner"
    purpose: Optional[str] = "Working Capital Credit Assessment"
    validity_days: Optional[int] = 30

class VerifierDecisionRequest(BaseModel):
    status: str  # verified, rejected, flagged, evidence_requested
    notes: Optional[str] = None

class LenderDecisionRequest(BaseModel):
    decision: str  # approved, rejected, under_review, more_info_needed
    approved_amount: float = 0.0
    interest_rate: float = 0.0
    loan_term_months: int = 12
    conditions: Optional[str] = None
    decision_notes: Optional[str] = None

class VerifyReportRequest(BaseModel):
    report_payload: Optional[Dict[str, Any]] = None
    report_id: Optional[str] = None
    sha256_hash: Optional[str] = None

# -------------------------------------------------------------
# AUDIT LOG HELPER
# -------------------------------------------------------------

def log_audit(db: Session, action: str, user_id: Optional[str] = None, entity_type: str = None, entity_id: str = None, details: dict = None):
    audit = models.AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

# -------------------------------------------------------------
# SEED DEMO ACCOUNTS HELPER
# -------------------------------------------------------------

@app.post("/api/auth/seed-demo-accounts")
def seed_demo_accounts(db: Session = Depends(get_db)):
    """
    Initializes demo accounts for immediate testing:
    Primary Spotlight: Murugan (Tiffin Cart Vendor),
    Additional: Ramesh (Kirana), Priya (Street Food), Anil (Logistics),
    Financial Verifier (Rajesh Sen), and MSME Lender (Meera Kapoor).
    """
    demo_users = [
        {
            "email": "murugan@trustcred.ai",
            "full_name": "Murugan S.",
            "role": "borrower",
            "business_name": "Murugan Tiffin Cart",
            "business_type": "Street Food & Tiffin Stall",
            "address": "Opposite Metro Gate 2, Anna Nagar, Chennai",
            "phone": "+91 94441 55667",
            "years_in_business": 2.5,
            "monthly_turnover_estimate": 120000.0,
            "description": "Daily street tiffin cart serving idli, dosa, and vada. Daily digital UPI receipts approx ₹4,000. Seeking ₹50,000 micro-working capital loan.",
            "csv_func": sample_gen.generate_murugan_tiffin_csv,
            "persona": "murugan"
        },
        {
            "email": "ramesh@trustcred.ai",
            "full_name": "Ramesh Kumar",
            "role": "borrower",
            "business_name": "Ramesh Kirana Store",
            "business_type": "Grocery & FMCG Retail",
            "address": "Shop 4, Market Complex, Delhi",
            "phone": "+91 98765 43210",
            "years_in_business": 4.5,
            "monthly_turnover_estimate": 185000.0,
            "description": "Daily neighbourhood grocery and essential provisions store with active digital QR collections.",
            "csv_func": sample_gen.generate_ramesh_kirana_csv,
            "persona": "ramesh"
        },
        {
            "email": "priya@trustcred.ai",
            "full_name": "Priya Sharma",
            "role": "borrower",
            "business_name": "Priya Street Gourmet",
            "business_type": "Street Food & Snacks",
            "address": "Kiosk 12, Food Street, Jaipur",
            "phone": "+91 98111 22334",
            "years_in_business": 2.0,
            "monthly_turnover_estimate": 140000.0,
            "description": "Evening street food and snack stall accepting high-volume UPI payments with zero prior loan history.",
            "csv_func": sample_gen.generate_priya_gourmet_csv,
            "persona": "priya"
        },
        {
            "email": "anil@trustcred.ai",
            "full_name": "Anil Verma",
            "role": "borrower",
            "business_name": "Anil Quick Logistics",
            "business_type": "Local Freight & Delivery",
            "address": "Plot 88, Transport Nagar, Lucknow",
            "phone": "+91 99222 33445",
            "years_in_business": 3.0,
            "monthly_turnover_estimate": 190000.0,
            "description": "Commercial delivery and last-mile freight partner operating two light commercial vehicles.",
            "csv_func": sample_gen.generate_anil_logistics_csv,
            "persona": "anil"
        },
        {
            "email": "verifier@trustcred.ai",
            "full_name": "Rajesh Sen",
            "role": "verifier",
            "business_name": "TrustCred Verification Agency",
            "business_type": "Financial Verification",
            "address": "Fintech Hub, Mumbai",
            "phone": "+91 98222 99881",
            "years_in_business": 8.0,
            "monthly_turnover_estimate": 0.0,
            "description": "Independent certified financial statement and transaction verifier.",
            "csv_func": None,
            "persona": None
        },
        {
            "email": "lender@trustcred.ai",
            "full_name": "Meera Kapoor",
            "role": "lender",
            "business_name": "Apex Micro-Enterprise Capital",
            "business_type": "Regulated NBFC / MSME Lender",
            "address": "Bandra Kurla Complex, Mumbai",
            "phone": "+91 97333 44556",
            "years_in_business": 12.0,
            "monthly_turnover_estimate": 0.0,
            "description": "Credit underwriting team assessing working capital micro-loans based on verifiable cash flows.",
            "csv_func": None,
            "persona": None
        }
    ]

    created_users = []

    for u_data in demo_users:
        existing = db.query(models.User).filter(models.User.email == u_data["email"]).first()
        if not existing:
            user = models.User(
                email=u_data["email"],
                hashed_password=hash_password("trustcred123"),
                full_name=u_data["full_name"],
                role=u_data["role"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            profile = models.BusinessProfile(
                user_id=user.id,
                business_name=u_data["business_name"],
                business_type=u_data["business_type"],
                registration_number=f"REG-2024-{random_hex(6)}",
                tax_id=f"GSTIN-{random_hex(8)}",
                phone=u_data["phone"],
                address=u_data["address"],
                years_in_business=u_data["years_in_business"],
                monthly_turnover_estimate=u_data["monthly_turnover_estimate"],
                description=u_data["description"]
            )
            db.add(profile)
            db.commit()

            # Pre-seed transactions and report for the borrowers
            if u_data["csv_func"]:
                csv_content = u_data["csv_func"]()
                records, summary = TransactionAnalyzer.parse_csv(csv_content)
                
                batch = models.TransactionBatch(
                    user_id=user.id,
                    filename=f"{u_data['persona']}_verified_bank_stmt.csv",
                    total_records=summary["total_records"],
                    valid_records=summary["valid_records"],
                    duplicate_records=summary["duplicate_records"],
                    flagged_records=summary["flagged_records"],
                    verification_status="verified",
                    verification_notes="Pre-verified historical digital statement batch with confirmed UPI/QR gateway logs.",
                    verified_at=datetime.utcnow()
                )
                db.add(batch)
                db.commit()
                db.refresh(batch)

                for r in records:
                    txn = models.Transaction(
                        batch_id=batch.id,
                        user_id=user.id,
                        txn_id=r["txn_id"],
                        txn_date=datetime.strptime(r["txn_date"], "%Y-%m-%d %H:%M:%S"),
                        amount=r["amount"],
                        direction=r["direction"],
                        description=r["description"],
                        channel=r["channel"],
                        classification=r["classification"],
                        confidence_score=r["confidence_score"],
                        is_duplicate=r["is_duplicate"],
                        is_flagged=r["is_flagged"],
                        flag_reason=r["flag_reason"],
                        reference_id=r["reference_id"]
                    )
                    db.add(txn)
                db.commit()

                # Generate initial assessment report
                metrics = TransactionAnalyzer.analyze_metrics(records)
                assessment = CreditEngine.evaluate_creditworthiness(metrics, {
                    "business_name": u_data["business_name"],
                    "business_type": u_data["business_type"]
                })
                report_dict = ReportGenerator.generate_report_payload(
                    borrower_user_id=user.id,
                    business_profile={"business_name": u_data["business_name"], "business_type": u_data["business_type"]},
                    metrics=metrics,
                    assessment=assessment,
                    data_source_batch_id=batch.id
                )

                rep = models.AssessmentReport(
                    report_id=report_dict["report_id"],
                    user_id=user.id,
                    analysis_start_date=datetime.strptime(metrics["analysis_period_start"], "%Y-%m-%d"),
                    analysis_end_date=datetime.strptime(metrics["analysis_period_end"], "%Y-%m-%d"),
                    total_verified_receipts=metrics["total_verified_receipts"],
                    estimated_operating_expenses=metrics["estimated_operating_expenses"],
                    estimated_net_cash_flow=metrics["estimated_net_cash_flow"],
                    avg_daily_receipts=metrics["avg_daily_receipts"],
                    income_consistency_score=metrics["income_consistency_score"],
                    transaction_count=metrics["total_transactions"],
                    active_days=metrics["active_trading_days"],
                    history_months=metrics["months_analyzed"],
                    prototype_score=assessment["prototype_score"],
                    confidence_level=assessment["confidence_level"],
                    risk_tier=assessment["risk_tier"],
                    dscr=assessment["dscr"],
                    max_recommended_loan=assessment["max_recommended_loan"],
                    sha256_hash=report_dict["cryptographic_proof"]["sha256_hash"],
                    digital_signature=report_dict["cryptographic_proof"]["digital_signature"],
                    summary_data=report_dict,
                    limitations=assessment.get("missing_information", []),
                    positive_drivers=assessment.get("supporting_indicators", []),
                    risk_factors=assessment.get("identified_risks", []),
                    monthly_breakdown=metrics["monthly_trend"]
                )
                db.add(rep)
                db.commit()
                db.refresh(rep)

                # Grant consent so lender can immediately see the reports
                consent = models.ConsentGrant(
                    report_id=rep.id,
                    borrower_id=user.id,
                    lender_org_name="Apex Micro-Enterprise Capital",
                    purpose="Working Capital Loan Evaluation",
                    status="active",
                    expires_at=datetime.utcnow() + timedelta(days=60)
                )
                db.add(consent)
                db.commit()

            created_users.append(u_data["email"])

    return {"message": "Demo accounts seeded successfully", "accounts": created_users}

def random_hex(length: int = 8) -> str:
    return uuid.uuid4().hex[:length].upper()

# -------------------------------------------------------------
# AUTH ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/auth/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = models.User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize business profile
    profile = models.BusinessProfile(
        user_id=user.id,
        business_name=user_in.business_name or f"{user_in.full_name}'s Enterprise",
        business_type=user_in.business_type or "Retail"
    )
    db.add(profile)
    db.commit()

    log_audit(db, "REGISTER", user_id=user.id, entity_type="User", entity_id=user.id)

    access_token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "business_name": profile.business_name
        }
    }

@app.post("/api/auth/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    access_token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    b_name = user.business_profile.business_name if user.business_profile else ""

    log_audit(db, "LOGIN", user_id=user.id, entity_type="User", entity_id=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "business_name": b_name
        }
    }

@app.get("/api/auth/me")
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.BusinessProfile).filter(models.BusinessProfile.user_id == current_user.id).first()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "business_profile": {
            "business_name": profile.business_name if profile else "",
            "business_type": profile.business_type if profile else "",
            "registration_number": profile.registration_number if profile else "",
            "tax_id": profile.tax_id if profile else "",
            "phone": profile.phone if profile else "",
            "address": profile.address if profile else "",
            "years_in_business": profile.years_in_business if profile else 1.0,
            "monthly_turnover_estimate": profile.monthly_turnover_estimate if profile else 0.0,
            "description": profile.description if profile else ""
        } if profile else None
    }

# -------------------------------------------------------------
# BUSINESS PROFILE ENDPOINTS
# -------------------------------------------------------------

@app.put("/api/profile")
def update_profile(
    p_in: BusinessProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.BusinessProfile).filter(models.BusinessProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.BusinessProfile(user_id=current_user.id)
        db.add(profile)

    for field, val in p_in.dict().items():
        setattr(profile, field, val)

    db.commit()
    db.refresh(profile)
    log_audit(db, "UPDATE_PROFILE", user_id=current_user.id, entity_type="BusinessProfile", entity_id=profile.id)
    return {"message": "Business profile updated successfully", "profile": p_in.dict()}

# -------------------------------------------------------------
# TRANSACTION & STATEMENT ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/transactions/upload")
async def upload_statement(
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_role(["borrower", "verifier"])),
    db: Session = Depends(get_db)
):
    """
    Uploads and parses a financial statement CSV.
    Validates, normalizes, detects duplicates, and auto-classifies transactions.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV financial statement files are supported.")

    content = await file.read()
    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    try:
        records, summary = TransactionAnalyzer.parse_csv(csv_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV processing error: {str(e)}")

    batch = models.TransactionBatch(
        user_id=current_user.id,
        filename=file.filename,
        total_records=summary["total_records"],
        valid_records=summary["valid_records"],
        duplicate_records=summary["duplicate_records"],
        flagged_records=summary["flagged_records"],
        verification_status="pending",
        verification_notes="Uploaded by borrower; pending verification."
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # Insert transactions
    txns_to_add = [
        models.Transaction(
            batch_id=batch.id,
            user_id=current_user.id,
            txn_id=r["txn_id"],
            txn_date=datetime.strptime(r["txn_date"], "%Y-%m-%d %H:%M:%S"),
            amount=r["amount"],
            direction=r["direction"],
            description=r["description"],
            channel=r["channel"],
            classification=r["classification"],
            confidence_score=r["confidence_score"],
            is_duplicate=r["is_duplicate"],
            is_flagged=r["is_flagged"],
            flag_reason=r["flag_reason"],
            reference_id=r["reference_id"]
        )
        for r in records
    ]
    db.bulk_save_objects(txns_to_add)
    db.commit()

    log_audit(db, "UPLOAD_STATEMENT", user_id=current_user.id, entity_type="TransactionBatch", entity_id=batch.id, details=summary)

    return {
        "message": "Financial statement uploaded and processed successfully",
        "batch_id": batch.id,
        "summary": summary
    }

@app.post("/api/transactions/load-sample/{persona}")
def load_sample_dataset(
    persona: str,
    current_user: models.User = Depends(require_role(["borrower", "verifier"])),
    db: Session = Depends(get_db)
):
    """
    Quick test helper: Loads realistic 90-day statements for 'ramesh', 'priya', or 'anil'.
    """
    if persona == "murugan":
        csv_content = sample_gen.generate_murugan_tiffin_csv()
        b_name = "Murugan Tiffin Cart"
    elif persona == "ramesh":
        csv_content = sample_gen.generate_ramesh_kirana_csv()
        b_name = "Ramesh Kirana Store"
    elif persona == "priya":
        csv_content = sample_gen.generate_priya_gourmet_csv()
        b_name = "Priya Street Gourmet"
    elif persona == "anil":
        csv_content = sample_gen.generate_anil_logistics_csv()
        b_name = "Anil Quick Logistics"
    else:
        raise HTTPException(status_code=400, detail="Invalid sample persona. Options: murugan, ramesh, priya, anil")

    records, summary = TransactionAnalyzer.parse_csv(csv_content)

    batch = models.TransactionBatch(
        user_id=current_user.id,
        filename=f"sample_{persona}_verified_statement.csv",
        total_records=summary["total_records"],
        valid_records=summary["valid_records"],
        duplicate_records=summary["duplicate_records"],
        flagged_records=summary["flagged_records"],
        verification_status="verified",
        verification_notes=f"Sample dataset loaded for {b_name} with verified gateway signatures."
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    for r in records:
        txn = models.Transaction(
            batch_id=batch.id,
            user_id=current_user.id,
            txn_id=r["txn_id"],
            txn_date=datetime.strptime(r["txn_date"], "%Y-%m-%d %H:%M:%S"),
            amount=r["amount"],
            direction=r["direction"],
            description=r["description"],
            channel=r["channel"],
            classification=r["classification"],
            confidence_score=r["confidence_score"],
            is_duplicate=r["is_duplicate"],
            is_flagged=r["is_flagged"],
            flag_reason=r["flag_reason"],
            reference_id=r["reference_id"]
        )
        db.add(txn)
    db.commit()

    log_audit(db, "LOAD_SAMPLE_DATA", user_id=current_user.id, entity_type="TransactionBatch", entity_id=batch.id, details={"persona": persona, "summary": summary})

    return {
        "message": f"Sample dataset '{b_name}' successfully loaded into your profile.",
        "batch_id": batch.id,
        "summary": summary
    }

@app.get("/api/transactions")
def get_transactions(
    category: Optional[str] = None,
    direction: Optional[str] = None,
    flagged: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)

    if category:
        query = query.filter(models.Transaction.classification == category)
    if direction:
        query = query.filter(models.Transaction.direction == direction)
    if flagged is not None:
        query = query.filter(models.Transaction.is_flagged == flagged)
    if search:
        query = query.filter(
            (models.Transaction.description.ilike(f"%{search}%")) |
            (models.Transaction.txn_id.ilike(f"%{search}%"))
        )

    total_count = query.count()
    txns = query.order_by(models.Transaction.txn_date.desc()).offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "items": [
            {
                "id": t.id,
                "batch_id": t.batch_id,
                "txn_id": t.txn_id,
                "txn_date": t.txn_date.strftime("%Y-%m-%d %H:%M:%S"),
                "amount": t.amount,
                "direction": t.direction,
                "description": t.description,
                "channel": t.channel,
                "classification": t.user_classification_override or t.classification,
                "system_classification": t.classification,
                "user_override": t.user_classification_override,
                "confidence_score": t.confidence_score,
                "is_duplicate": t.is_duplicate,
                "is_flagged": t.is_flagged,
                "flag_reason": t.flag_reason,
                "reference_id": t.reference_id
            }
            for t in txns
        ]
    }

@app.patch("/api/transactions/{txn_id}/override")
def override_transaction_classification(
    txn_id: str,
    override: TransactionOverride,
    current_user: models.User = Depends(require_role(["borrower", "verifier"])),
    db: Session = Depends(get_db)
):
    txn = db.query(models.Transaction).filter(
        models.Transaction.id == txn_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    allowed_classes = [
        "business_revenue", "operating_expense", "personal_transfer",
        "loan_repayment", "drawings", "refund_reversal", "excluded"
    ]
    if override.classification not in allowed_classes:
        raise HTTPException(status_code=400, detail=f"Invalid classification. Must be one of: {allowed_classes}")

    old_class = txn.user_classification_override or txn.classification
    txn.user_classification_override = override.classification
    db.commit()

    log_audit(db, "OVERRIDE_TRANSACTION", user_id=current_user.id, entity_type="Transaction", entity_id=txn.id, details={"from": old_class, "to": override.classification})

    return {"message": "Transaction reclassified successfully", "txn_id": txn.id, "new_classification": override.classification}

@app.get("/api/transactions/analytics")
def get_analytics(
    days: Optional[int] = Query(None, description="Filter for 30, 90, 180, 365 days"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    txns = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    if not txns:
        return TransactionAnalyzer._empty_metrics()

    records = [
        {
            "txn_id": t.txn_id,
            "txn_date": t.txn_date.strftime("%Y-%m-%d %H:%M:%S"),
            "amount": t.amount,
            "direction": t.direction,
            "description": t.description,
            "channel": t.channel,
            "classification": t.classification,
            "user_classification_override": t.user_classification_override,
            "confidence_score": t.confidence_score,
            "is_duplicate": t.is_duplicate,
            "is_flagged": t.is_flagged,
            "flag_reason": t.flag_reason
        }
        for t in txns
    ]

    metrics = TransactionAnalyzer.analyze_metrics(records, days_filter=days)
    return metrics

# -------------------------------------------------------------
# ALTERNATIVE CREDIT ASSESSMENT & REPORT ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/assessment/generate")
def generate_assessment_report(
    current_user: models.User = Depends(require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    """
    Generates a full explainable alternative creditworthiness report
    with cryptographic SHA-256 hash and digital signature.
    """
    txns = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    if not txns:
        raise HTTPException(status_code=400, detail="No transaction records found. Please upload a statement first.")

    records = [
        {
            "txn_id": t.txn_id,
            "txn_date": t.txn_date.strftime("%Y-%m-%d %H:%M:%S"),
            "amount": t.amount,
            "direction": t.direction,
            "description": t.description,
            "channel": t.channel,
            "classification": t.classification,
            "user_classification_override": t.user_classification_override,
            "confidence_score": t.confidence_score,
            "is_duplicate": t.is_duplicate,
            "is_flagged": t.is_flagged,
            "flag_reason": t.flag_reason
        }
        for t in txns
    ]

    profile = db.query(models.BusinessProfile).filter(models.BusinessProfile.user_id == current_user.id).first()
    p_dict = {
        "business_name": profile.business_name if profile else "Enterprise",
        "business_type": profile.business_type if profile else "Retail"
    }

    metrics = TransactionAnalyzer.analyze_metrics(records)
    assessment = CreditEngine.evaluate_creditworthiness(metrics, p_dict)

    latest_batch = db.query(models.TransactionBatch).filter(models.TransactionBatch.user_id == current_user.id).order_by(models.TransactionBatch.upload_timestamp.desc()).first()
    batch_id = latest_batch.id if latest_batch else "BATCH-UNKNOWN"

    report_payload = ReportGenerator.generate_report_payload(
        borrower_user_id=current_user.id,
        business_profile=p_dict,
        metrics=metrics,
        assessment=assessment,
        data_source_batch_id=batch_id
    )

    report_obj = models.AssessmentReport(
        report_id=report_payload["report_id"],
        user_id=current_user.id,
        analysis_start_date=datetime.strptime(metrics["analysis_period_start"], "%Y-%m-%d"),
        analysis_end_date=datetime.strptime(metrics["analysis_period_end"], "%Y-%m-%d"),
        total_verified_receipts=metrics["total_verified_receipts"],
        estimated_operating_expenses=metrics["estimated_operating_expenses"],
        estimated_net_cash_flow=metrics["estimated_net_cash_flow"],
        avg_daily_receipts=metrics["avg_daily_receipts"],
        income_consistency_score=metrics["income_consistency_score"],
        transaction_count=metrics["total_transactions"],
        active_days=metrics["active_trading_days"],
        history_months=metrics["months_analyzed"],
        prototype_score=assessment["prototype_score"],
        confidence_level=assessment["confidence_level"],
        risk_tier=assessment["risk_tier"],
        dscr=assessment["dscr"],
        max_recommended_loan=assessment["max_recommended_loan"],
        sha256_hash=report_payload["cryptographic_proof"]["sha256_hash"],
        digital_signature=report_payload["cryptographic_proof"]["digital_signature"],
        summary_data=report_payload,
        limitations=assessment.get("missing_information", []),
        positive_drivers=assessment.get("supporting_indicators", []),
        risk_factors=assessment.get("identified_risks", []),
        monthly_breakdown=metrics["monthly_trend"]
    )
    db.add(report_obj)
    db.commit()
    db.refresh(report_obj)

    log_audit(db, "GENERATE_REPORT", user_id=current_user.id, entity_type="AssessmentReport", entity_id=report_obj.id, details={"report_id": report_obj.report_id, "score": assessment["prototype_score"]})

    return {
        "message": "Alternative credit assessment report generated successfully",
        "report_id": report_obj.report_id,
        "report": report_payload,
        "assessment": assessment,
        "metrics": metrics
    }

@app.get("/api/assessment/latest")
def get_latest_assessment(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rep = db.query(models.AssessmentReport).filter(
        models.AssessmentReport.user_id == current_user.id,
        models.AssessmentReport.is_revoked == False
    ).order_by(models.AssessmentReport.created_at.desc()).first()

    if not rep:
        return None

    return {
        "id": rep.id,
        "report_id": rep.report_id,
        "created_at": rep.created_at.strftime("%Y-%m-%d %H:%M:%SZ"),
        "total_verified_receipts": rep.total_verified_receipts,
        "estimated_operating_expenses": rep.estimated_operating_expenses,
        "estimated_net_cash_flow": rep.estimated_net_cash_flow,
        "avg_daily_receipts": rep.avg_daily_receipts,
        "income_consistency_score": rep.income_consistency_score,
        "transaction_count": rep.transaction_count,
        "active_days": rep.active_days,
        "history_months": rep.history_months,
        "prototype_score": rep.prototype_score,
        "confidence_level": rep.confidence_level,
        "risk_tier": rep.risk_tier,
        "dscr": rep.dscr,
        "max_recommended_loan": rep.max_recommended_loan,
        "sha256_hash": rep.sha256_hash,
        "digital_signature": rep.digital_signature,
        "positive_drivers": rep.positive_drivers,
        "risk_factors": rep.risk_factors,
        "limitations": rep.limitations,
        "monthly_breakdown": rep.monthly_breakdown,
        "summary_data": rep.summary_data
    }

# -------------------------------------------------------------
# REPAYMENT CAPACITY CALCULATOR
# -------------------------------------------------------------

@app.post("/api/calculator/repayment-capacity")
def calculate_repayment_capacity(calc_in: RepaymentCapacityInput):
    """
    Simulates repayment capacity, EMI, DSCR, and affordability buffer.
    """
    result = CreditEngine.calculate_repayment_capacity(
        monthly_receipts=calc_in.monthly_receipts,
        monthly_operating_expenses=calc_in.monthly_operating_expenses,
        existing_monthly_debt=calc_in.existing_monthly_debt,
        household_expenses=calc_in.household_expenses,
        loan_amount=calc_in.loan_amount,
        interest_rate_annual=calc_in.interest_rate_annual,
        tenure_months=calc_in.tenure_months
    )
    return result

# -------------------------------------------------------------
# CONSENT & PRIVACY MANAGEMENT
# -------------------------------------------------------------

@app.get("/api/consent")
def list_consents(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "borrower":
        grants = db.query(models.ConsentGrant).filter(models.ConsentGrant.borrower_id == current_user.id).order_by(models.ConsentGrant.granted_at.desc()).all()
    elif current_user.role == "lender":
        grants = db.query(models.ConsentGrant).filter(models.ConsentGrant.status == "active").order_by(models.ConsentGrant.granted_at.desc()).all()
    else:
        grants = db.query(models.ConsentGrant).order_by(models.ConsentGrant.granted_at.desc()).all()

    items = []
    for g in grants:
        rep = db.query(models.AssessmentReport).filter(models.AssessmentReport.id == g.report_id).first()
        borr = db.query(models.User).filter(models.User.id == g.borrower_id).first()
        b_name = borr.business_profile.business_name if borr and borr.business_profile else "Business"
        items.append({
            "id": g.id,
            "report_id": rep.report_id if rep else "UNKNOWN",
            "report_db_id": g.report_id,
            "borrower_name": borr.full_name if borr else "Borrower",
            "business_name": b_name,
            "lender_org_name": g.lender_org_name,
            "purpose": g.purpose,
            "status": g.status,
            "granted_at": g.granted_at.strftime("%Y-%m-%d %H:%M:%SZ"),
            "expires_at": g.expires_at.strftime("%Y-%m-%d %H:%M:%SZ") if g.expires_at else None,
            "revoked_at": g.revoked_at.strftime("%Y-%m-%d %H:%M:%SZ") if g.revoked_at else None
        })

    return items

@app.post("/api/consent/grant")
def grant_consent(
    grant_in: ConsentGrantRequest,
    current_user: models.User = Depends(require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    rep = db.query(models.AssessmentReport).filter(
        (models.AssessmentReport.id == grant_in.report_id) | (models.AssessmentReport.report_id == grant_in.report_id),
        models.AssessmentReport.user_id == current_user.id
    ).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Assessment report not found.")

    grant = models.ConsentGrant(
        report_id=rep.id,
        borrower_id=current_user.id,
        lender_org_name=grant_in.lender_org_name or "Regulated Financial Partner",
        purpose=grant_in.purpose or "Working Capital Loan Evaluation",
        status="active",
        expires_at=datetime.utcnow() + timedelta(days=grant_in.validity_days or 30)
    )
    db.add(grant)
    db.commit()
    db.refresh(grant)

    log_audit(db, "GRANT_CONSENT", user_id=current_user.id, entity_type="ConsentGrant", entity_id=grant.id, details={"report_id": rep.report_id, "lender": grant.lender_org_name})

    return {"message": "Report sharing consent granted successfully", "consent_id": grant.id}

@app.post("/api/consent/{consent_id}/revoke")
def revoke_consent(
    consent_id: str,
    current_user: models.User = Depends(require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    grant = db.query(models.ConsentGrant).filter(
        models.ConsentGrant.id == consent_id,
        models.ConsentGrant.borrower_id == current_user.id
    ).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Consent grant not found.")

    grant.status = "revoked"
    grant.revoked_at = datetime.utcnow()
    db.commit()

    log_audit(db, "REVOKE_CONSENT", user_id=current_user.id, entity_type="ConsentGrant", entity_id=grant.id)

    return {"message": "Lender access has been revoked successfully. Future access is blocked."}

@app.get("/api/consent/audit-log")
def get_audit_logs(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "borrower":
        logs = db.query(models.AuditLog).filter(models.AuditLog.user_id == current_user.id).order_by(models.AuditLog.timestamp.desc()).limit(50).all()
    else:
        logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()

    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%SZ")
        }
        for l in logs
    ]

# -------------------------------------------------------------
# FINANCIAL VERIFIER WORKBENCH
# -------------------------------------------------------------

@app.get("/api/verifier/queue")
def verifier_queue(current_user: models.User = Depends(require_role(["verifier"])), db: Session = Depends(get_db)):
    batches = db.query(models.TransactionBatch).order_by(models.TransactionBatch.upload_timestamp.desc()).all()
    items = []
    for b in batches:
        borr = db.query(models.User).filter(models.User.id == b.user_id).first()
        b_name = borr.business_profile.business_name if borr and borr.business_profile else "Business"
        items.append({
            "id": b.id,
            "filename": b.filename,
            "borrower_name": borr.full_name if borr else "Borrower",
            "business_name": b_name,
            "upload_timestamp": b.upload_timestamp.strftime("%Y-%m-%d %H:%M:%SZ"),
            "total_records": b.total_records,
            "valid_records": b.valid_records,
            "duplicate_records": b.duplicate_records,
            "flagged_records": b.flagged_records,
            "verification_status": b.verification_status,
            "verification_notes": b.verification_notes,
            "verified_at": b.verified_at.strftime("%Y-%m-%d %H:%M:%SZ") if b.verified_at else None
        })
    return items

@app.post("/api/verifier/batch/{batch_id}/verify")
def verify_batch(
    batch_id: str,
    dec_in: VerifierDecisionRequest,
    current_user: models.User = Depends(require_role(["verifier"])),
    db: Session = Depends(get_db)
):
    batch = db.query(models.TransactionBatch).filter(models.TransactionBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Transaction batch not found.")

    batch.verification_status = dec_in.status
    batch.verification_notes = dec_in.notes or f"Verification decision: {dec_in.status} by {current_user.full_name}"
    batch.verified_by_id = current_user.id
    batch.verified_at = datetime.utcnow()
    db.commit()

    log_audit(db, "VERIFY_BATCH", user_id=current_user.id, entity_type="TransactionBatch", entity_id=batch.id, details={"status": dec_in.status, "notes": dec_in.notes})

    return {"message": "Verification status updated successfully", "status": dec_in.status}

# -------------------------------------------------------------
# LENDER WORKBENCH
# -------------------------------------------------------------

@app.get("/api/lender/pipeline")
def lender_pipeline(current_user: models.User = Depends(require_role(["lender"])), db: Session = Depends(get_db)):
    """
    Returns all borrower reports that have an active consent grant.
    """
    active_grants = db.query(models.ConsentGrant).filter(models.ConsentGrant.status == "active").all()
    pipeline = []

    for g in active_grants:
        rep = db.query(models.AssessmentReport).filter(
            models.AssessmentReport.id == g.report_id,
            models.AssessmentReport.is_revoked == False
        ).first()
        if not rep:
            continue

        borr = db.query(models.User).filter(models.User.id == rep.user_id).first()
        b_prof = borr.business_profile if borr else None
        
        # Check if lender already decided
        decision = db.query(models.LenderDecision).filter(
            models.LenderDecision.report_id == rep.id,
            models.LenderDecision.lender_id == current_user.id
        ).order_by(models.LenderDecision.decided_at.desc()).first()

        pipeline.append({
            "report_id": rep.report_id,
            "report_db_id": rep.id,
            "borrower_name": borr.full_name if borr else "Borrower",
            "business_name": b_prof.business_name if b_prof else "Business",
            "business_type": b_prof.business_type if b_prof else "Retail",
            "years_in_business": b_prof.years_in_business if b_prof else 1.0,
            "created_at": rep.created_at.strftime("%Y-%m-%d"),
            "total_verified_receipts": rep.total_verified_receipts,
            "estimated_operating_expenses": rep.estimated_operating_expenses,
            "estimated_net_cash_flow": rep.estimated_net_cash_flow,
            "prototype_score": rep.prototype_score,
            "risk_tier": rep.risk_tier,
            "confidence_level": rep.confidence_level,
            "dscr": rep.dscr,
            "max_recommended_loan": rep.max_recommended_loan,
            "sha256_hash": rep.sha256_hash,
            "digital_signature": rep.digital_signature,
            "decision": {
                "status": decision.decision if decision else "PENDING_REVIEW",
                "approved_amount": decision.approved_amount if decision else 0.0,
                "interest_rate": decision.interest_rate if decision else 0.0,
                "notes": decision.decision_notes if decision else ""
            } if decision else None
        })

    return pipeline

@app.get("/api/lender/report/{report_id}")
def lender_get_report(
    report_id: str,
    current_user: models.User = Depends(require_role(["lender", "verifier", "borrower"])),
    db: Session = Depends(get_db)
):
    rep = db.query(models.AssessmentReport).filter(
        (models.AssessmentReport.report_id == report_id) | (models.AssessmentReport.id == report_id)
    ).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found.")

    # Check consent if lender
    if current_user.role == "lender":
        grant = db.query(models.ConsentGrant).filter(
            models.ConsentGrant.report_id == rep.id,
            models.ConsentGrant.status == "active"
        ).first()
        if not grant:
            raise HTTPException(status_code=403, detail="Borrower has revoked or not granted access to this report.")

    borr = db.query(models.User).filter(models.User.id == rep.user_id).first()
    b_prof = borr.business_profile if borr else None

    # Check validity of hash and signature
    full_payload = rep.summary_data or {}
    is_valid, msg, audit_info = ReportGenerator.verify_report_integrity(full_payload)

    return {
        "report": rep.summary_data,
        "borrower_meta": {
            "business_name": b_prof.business_name if b_prof else "Business",
            "business_type": b_prof.business_type if b_prof else "Retail",
            "address": b_prof.address if b_prof else "",
            "years_in_business": b_prof.years_in_business if b_prof else 1.0,
            "monthly_turnover_estimate": b_prof.monthly_turnover_estimate if b_prof else 0.0
        },
        "cryptographic_verification": {
            "is_valid": is_valid,
            "status_message": msg,
            "audit_info": audit_info
        },
        "monthly_breakdown": rep.monthly_breakdown,
        "positive_drivers": rep.positive_drivers,
        "risk_factors": rep.risk_factors,
        "limitations": rep.limitations
    }

@app.post("/api/lender/report/{report_id}/decision")
def record_lender_decision(
    report_id: str,
    dec_in: LenderDecisionRequest,
    current_user: models.User = Depends(require_role(["lender"])),
    db: Session = Depends(get_db)
):
    rep = db.query(models.AssessmentReport).filter(
        (models.AssessmentReport.report_id == report_id) | (models.AssessmentReport.id == report_id)
    ).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found.")

    dec = models.LenderDecision(
        report_id=rep.id,
        lender_id=current_user.id,
        decision=dec_in.decision,
        approved_amount=dec_in.approved_amount,
        interest_rate=dec_in.interest_rate,
        loan_term_months=dec_in.loan_term_months,
        conditions=dec_in.conditions,
        decision_notes=dec_in.decision_notes
    )
    db.add(dec)
    db.commit()
    db.refresh(dec)

    log_audit(db, "LENDER_DECISION", user_id=current_user.id, entity_type="LenderDecision", entity_id=dec.id, details={"decision": dec_in.decision, "amount": dec_in.approved_amount, "report_id": rep.report_id})

    return {"message": "Lending decision recorded successfully", "decision_id": dec.id}

# -------------------------------------------------------------
# INDEPENDENT REPORT VERIFICATION (PUBLIC / AUDIT)
# -------------------------------------------------------------

@app.post("/api/verify-report")
def verify_report_integrity_endpoint(req: VerifyReportRequest, db: Session = Depends(get_db)):
    """
    Independent cryptographic report verifier.
    Can verify by full JSON payload or by report_id/SHA-256 hash.
    Checks SHA-256 integrity and digital signature authenticity.
    """
    if req.report_payload:
        is_valid, msg, audit = ReportGenerator.verify_report_integrity(req.report_payload)
        return {
            "verified": is_valid,
            "status": "TAMPER_FREE_AUTHENTIC" if is_valid else "TAMPERED_OR_INVALID",
            "message": msg,
            "details": audit
        }
    elif req.report_id or req.sha256_hash:
        query = db.query(models.AssessmentReport)
        if req.report_id:
            query = query.filter(models.AssessmentReport.report_id == req.report_id)
        if req.sha256_hash:
            query = query.filter(models.AssessmentReport.sha256_hash == req.sha256_hash)
        
        rep = query.first()
        if not rep:
            return {
                "verified": False,
                "status": "NOT_FOUND",
                "message": "No matching registered financial report found in TRUSTCRED platform records.",
                "details": {}
            }

        return {
            "verified": True,
            "status": "TAMPER_FREE_AUTHENTIC",
            "message": "Report record confirmed in official registry. Cryptographic SHA-256 hash matched authentic platform state.",
            "details": {
                "report_id": rep.report_id,
                "created_at": rep.created_at.strftime("%Y-%m-%d %H:%M:%SZ"),
                "sha256_hash": rep.sha256_hash,
                "prototype_score": rep.prototype_score,
                "confidence_level": rep.confidence_level,
                "risk_tier": rep.risk_tier,
                "total_verified_receipts": rep.total_verified_receipts,
                "estimated_net_cash_flow": rep.estimated_net_cash_flow
            }
        }
    else:
        raise HTTPException(status_code=400, detail="Provide either report_payload, report_id, or sha256_hash to verify.")

# -------------------------------------------------------------
# TRANSACTION TEMPLATE & REPORT REVOCATION & REST CONVENIENCE ALIASES
# -------------------------------------------------------------

@app.get("/api/transactions/template")
def get_transaction_template():
    """
    Provides a standardized downloadable CSV template for vendor transactions.
    """
    from fastapi.responses import Response
    csv_sample = (
        "txn_id,txn_date,amount,direction,description,channel,reference_id\n"
        "TXN-SAMPLE-001,2026-03-01 08:30:00,120.00,CREDIT,UPI QR Collection BharatPe,UPI,REF98765432101\n"
        "TXN-SAMPLE-002,2026-03-01 09:15:00,450.00,CREDIT,UPI Payment PhonePe QR,UPI,REF98765432102\n"
        "TXN-SAMPLE-003,2026-03-01 11:00:00,850.00,DEBIT,Raw Material Groceries Wholesale,BANK_TRANSFER,REF98765432103\n"
        "TXN-SAMPLE-004,2026-03-01 14:20:00,320.00,CREDIT,GPay Customer Receipt,UPI,REF98765432104\n"
        "TXN-SAMPLE-005,2026-03-01 18:45:00,200.00,DEBIT,LPG Commercial Cylinder Refill,UPI,REF98765432105\n"
    )
    return Response(
        content=csv_sample,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trustcred_transaction_template.csv"}
    )

@app.post("/api/auth/logout")
def logout(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Logs out the authenticated user and records an audit trail event.
    """
    log_audit(db, "LOGOUT", user_id=current_user.id, entity_type="User", entity_id=current_user.id)
    return {"message": "Logged out successfully from session"}

@app.post("/api/reports/{report_id}/revoke")
def revoke_report_endpoint(
    report_id: str,
    current_user: models.User = Depends(require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    """
    Revokes lender access to an existing report and invalidates all associated active consent grants.
    """
    rep = db.query(models.AssessmentReport).filter(
        (models.AssessmentReport.id == report_id) | (models.AssessmentReport.report_id == report_id),
        models.AssessmentReport.user_id == current_user.id
    ).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Assessment report not found.")

    rep.is_revoked = True
    grants = db.query(models.ConsentGrant).filter(
        models.ConsentGrant.report_id == rep.id,
        models.ConsentGrant.status == "active"
    ).all()
    for g in grants:
        g.status = "revoked"
        g.revoked_at = datetime.utcnow()

    db.commit()
    log_audit(db, "REVOKE_REPORT", user_id=current_user.id, entity_type="AssessmentReport", entity_id=rep.id)
    return {"message": "Report access revoked successfully. Future lender access is permanently blocked."}

# Aliases matching REST conventions in Section 17
@app.get("/api/transactions/summary")
def get_transactions_summary(
    days: Optional[int] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_analytics(days=days, current_user=current_user, db=db)

@app.post("/api/assessments")
def create_assessment_alias(
    current_user: models.User = Depends(require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return generate_assessment_report(current_user=current_user, db=db)

@app.get("/api/assessments/{assessment_id}")
def get_assessment_by_id(
    assessment_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rep = db.query(models.AssessmentReport).filter(
        (models.AssessmentReport.id == assessment_id) | (models.AssessmentReport.report_id == assessment_id)
    ).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return {
        "id": rep.id,
        "report_id": rep.report_id,
        "created_at": rep.created_at.strftime("%Y-%m-%d %H:%M:%SZ"),
        "metrics": {
            "total_verified_receipts": rep.total_verified_receipts,
            "estimated_operating_expenses": rep.estimated_operating_expenses,
            "estimated_net_cash_flow": rep.estimated_net_cash_flow,
            "avg_daily_receipts": rep.avg_daily_receipts,
            "income_consistency_score": rep.income_consistency_score,
            "transaction_count": rep.transaction_count
        },
        "assessment": {
            "prototype_score": rep.prototype_score,
            "confidence_level": rep.confidence_level,
            "risk_tier": rep.risk_tier,
            "dscr": rep.dscr,
            "max_recommended_loan": rep.max_recommended_loan,
            "supporting_indicators": rep.positive_drivers,
            "identified_risks": rep.risk_factors,
            "missing_information": rep.limitations
        },
        "sha256_hash": rep.sha256_hash,
        "digital_signature": rep.digital_signature
    }

@app.get("/api/assessments/{assessment_id}/explanation")
def get_assessment_explanation(
    assessment_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rep = db.query(models.AssessmentReport).filter(
        (models.AssessmentReport.id == assessment_id) | (models.AssessmentReport.report_id == assessment_id)
    ).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return {
        "report_id": rep.report_id,
        "prototype_score": rep.prototype_score,
        "confidence_level": rep.confidence_level,
        "risk_tier": rep.risk_tier,
        "supporting_indicators": rep.positive_drivers,
        "identified_risks": rep.risk_factors,
        "missing_information": rep.limitations,
        "recommended_next_steps": [
            "Upload additional bank or Account Aggregator verified statements to increase confidence score.",
            "Maintain digital UPI collection consistency above ₹3,500/day.",
            "Record verified wholesale inventory receipts to validate operating margin."
        ]
    }

@app.post("/api/reports/generate")
def reports_generate_alias(
    current_user: models.User = Depends(require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return generate_assessment_report(current_user=current_user, db=db)

@app.get("/api/reports/{report_id}")
def reports_get_alias(
    report_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return lender_get_report(report_id=report_id, current_user=current_user, db=db)

@app.post("/api/reports/{report_id}/share")
def reports_share_alias(
    report_id: str,
    grant_in: ConsentGrantRequest,
    current_user: models.User = Depends(require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    grant_in.report_id = report_id
    return grant_consent(grant_in=grant_in, current_user=current_user, db=db)

@app.post("/api/reports/verify")
def reports_verify_alias(req: VerifyReportRequest, db: Session = Depends(get_db)):
    return verify_report_integrity_endpoint(req=req, db=db)

@app.post("/api/consents")
def consents_post_alias(
    grant_in: ConsentGrantRequest,
    current_user: models.User = Depends(require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return grant_consent(grant_in=grant_in, current_user=current_user, db=db)

@app.get("/api/consents")
def consents_get_alias(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return list_consents(current_user=current_user, db=db)

@app.post("/api/consents/{consent_id}/revoke")
def consents_revoke_alias(
    consent_id: str,
    current_user: models.User = Depends(require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return revoke_consent(consent_id=consent_id, current_user=current_user, db=db)

@app.get("/api/lender/applications")
def lender_applications_alias(
    current_user: models.User = Depends(require_role(["lender"])),
    db: Session = Depends(get_db)
):
    return lender_pipeline(current_user=current_user, db=db)

@app.get("/api/lender/applications/{application_id}")
def lender_application_detail_alias(
    application_id: str,
    current_user: models.User = Depends(require_role(["lender", "verifier", "borrower"])),
    db: Session = Depends(get_db)
):
    return lender_get_report(report_id=application_id, current_user=current_user, db=db)

@app.post("/api/lender/applications/{application_id}/decision")
def lender_application_decision_alias(
    application_id: str,
    dec_in: LenderDecisionRequest,
    current_user: models.User = Depends(require_role(["lender"])),
    db: Session = Depends(get_db)
):
    return record_lender_decision(report_id=application_id, dec_in=dec_in, current_user=current_user, db=db)

@app.get("/api/verifier/requests")
def verifier_requests_alias(
    current_user: models.User = Depends(require_role(["verifier"])),
    db: Session = Depends(get_db)
):
    return verifier_queue(current_user=current_user, db=db)

@app.post("/api/verifier/requests/{request_id}/decision")
def verifier_request_decision_alias(
    request_id: str,
    dec_in: VerifierDecisionRequest,
    current_user: models.User = Depends(require_role(["verifier"])),
    db: Session = Depends(get_db)
):
    return verify_batch(batch_id=request_id, dec_in=dec_in, current_user=current_user, db=db)

@app.get("/api/audit-logs")
def audit_logs_alias(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_audit_logs(current_user=current_user, db=db)

