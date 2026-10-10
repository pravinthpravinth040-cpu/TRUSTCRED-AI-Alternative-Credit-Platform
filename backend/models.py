import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="borrower")  # borrower, verifier, lender
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    business_profile = relationship("BusinessProfile", back_populates="user", uselist=False)
    transaction_batches = relationship("TransactionBatch", foreign_keys="[TransactionBatch.user_id]", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    assessment_reports = relationship("AssessmentReport", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String(255), nullable=False)
    business_type = Column(String(100), nullable=False)  # e.g., Street Food Vendor, Kirana / Grocery, Local Retail, Delivery Services
    registration_number = Column(String(100), nullable=True)  # Optional GST/Udyam/Trade License
    tax_id = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    years_in_business = Column(Float, default=1.0)
    monthly_turnover_estimate = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="business_profile")

class TransactionBatch(Base):
    __tablename__ = "transaction_batches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    flagged_records = Column(Integer, default=0)
    
    # Verification status: pending, verified, rejected, flagged, evidence_requested
    verification_status = Column(String(50), default="pending")
    verification_notes = Column(Text, nullable=True)
    verified_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="transaction_batches")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    transactions = relationship("Transaction", back_populates="batch", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String(36), ForeignKey("transaction_batches.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    txn_id = Column(String(100), index=True, nullable=False)
    txn_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    direction = Column(String(10), nullable=False)  # credit or debit
    description = Column(String(500), nullable=False)
    channel = Column(String(50), default="UPI")  # UPI, IMPS, POS, QR, NEFT, CASH_DEP
    reference_id = Column(String(100), nullable=True)
    
    # Rule-based auto classification
    # business_revenue, operating_expense, personal_transfer, loan_repayment, drawings, refund_reversal, excluded
    classification = Column(String(50), default="uncertain")
    user_classification_override = Column(String(50), nullable=True)
    confidence_score = Column(Float, default=0.5)  # 0.0 to 1.0
    
    is_duplicate = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(255), nullable=True)

    batch = relationship("TransactionBatch", back_populates="transactions")
    user = relationship("User", back_populates="transactions")

class AssessmentReport(Base):
    __tablename__ = "assessment_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(50), unique=True, index=True, nullable=False)  # Human-readable TC-YYYY-XXXX
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    analysis_start_date = Column(DateTime, nullable=False)
    analysis_end_date = Column(DateTime, nullable=False)
    
    # Financial indicators
    total_verified_receipts = Column(Float, default=0.0)
    estimated_operating_expenses = Column(Float, default=0.0)
    estimated_net_cash_flow = Column(Float, default=0.0)
    avg_daily_receipts = Column(Float, default=0.0)
    income_consistency_score = Column(Float, default=0.0)  # 0 to 100
    transaction_count = Column(Integer, default=0)
    active_days = Column(Integer, default=0)
    history_months = Column(Float, default=0.0)
    
    # Alternative Credit Evaluation
    prototype_score = Column(Integer, default=650)  # Demonstration score (300-850)
    confidence_level = Column(String(50), default="Medium")  # High, Medium, Low
    risk_tier = Column(String(50), default="Moderate Risk")  # Low Risk, Moderate Risk, Caution
    dscr = Column(Float, default=1.5)  # Debt Service Coverage Ratio
    max_recommended_loan = Column(Float, default=0.0)
    
    # Cryptographic integrity
    sha256_hash = Column(String(64), nullable=False)
    digital_signature = Column(String(256), nullable=False)
    methodology_version = Column(String(20), default="v1.4-rule-explainable")
    
    is_revoked = Column(Boolean, default=False)
    
    # JSON breakdown
    summary_data = Column(JSON, nullable=True)
    limitations = Column(JSON, nullable=True)
    positive_drivers = Column(JSON, nullable=True)
    risk_factors = Column(JSON, nullable=True)
    monthly_breakdown = Column(JSON, nullable=True)

    user = relationship("User", back_populates="assessment_reports")
    consent_grants = relationship("ConsentGrant", back_populates="report")
    lender_decisions = relationship("LenderDecision", back_populates="report")

class ConsentGrant(Base):
    __tablename__ = "consent_grants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(36), ForeignKey("assessment_reports.id"), nullable=False)
    borrower_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    lender_id = Column(String(36), ForeignKey("users.id"), nullable=True)  # specific lender or public/general
    lender_org_name = Column(String(255), default="Regulated Financial Partner")
    purpose = Column(String(255), default="Credit Assessment & Working Capital Loan")
    status = Column(String(50), default="active")  # active, revoked, expired
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)

    report = relationship("AssessmentReport", back_populates="consent_grants")
    borrower = relationship("User", foreign_keys=[borrower_id])
    lender = relationship("User", foreign_keys=[lender_id])

class LenderDecision(Base):
    __tablename__ = "lender_decisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(36), ForeignKey("assessment_reports.id"), nullable=False)
    lender_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    decision = Column(String(50), nullable=False)  # approved, rejected, under_review, more_info_needed
    approved_amount = Column(Float, default=0.0)
    interest_rate = Column(Float, default=0.0)
    loan_term_months = Column(Integer, default=12)
    conditions = Column(Text, nullable=True)
    decision_notes = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("AssessmentReport", back_populates="lender_decisions")
    lender = relationship("User", foreign_keys=[lender_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, UPLOAD_STATEMENT, VERIFY_STATEMENT, GENERATE_REPORT, GRANT_CONSENT, REVOKE_CONSENT, LENDER_DECISION, VERIFY_REPORT_HASH
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
