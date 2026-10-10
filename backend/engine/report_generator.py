import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any, Tuple

REPORT_SIGNING_KEY = os.getenv("REPORT_SIGNING_KEY", "trustcred_platform_signing_ed25519_hmac_master_key_2026")

class ReportGenerator:
    """
    Produces tamper-evident, cryptographically signed financial reports.
    Computes deterministic canonical SHA-256 digests and digital signatures.
    """

    @classmethod
    def generate_report_payload(
        cls,
        borrower_user_id: str,
        business_profile: Dict[str, Any],
        metrics: Dict[str, Any],
        assessment: Dict[str, Any],
        data_source_batch_id: str,
        verifier_notes: str = None
    ) -> Dict[str, Any]:
        """
        Creates canonical report dictionary, SHA-256 hash, and digital signature.
        """
        report_code = f"TC-{datetime.utcnow().year}-{uuid.uuid4().hex[:8].upper()}"
        created_timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")

        # Canonical data dictionary for deterministic hashing
        canonical_content = {
            "report_id": report_code,
            "borrower_pseudonym_id": f"BORR-{borrower_user_id[:8].upper()}",
            "business_name": business_profile.get("business_name", "Enterprise"),
            "business_type": business_profile.get("business_type", "Retail/Services"),
            "created_timestamp": created_timestamp,
            "analysis_period": {
                "start": metrics.get("analysis_period_start"),
                "end": metrics.get("analysis_period_end"),
                "months_span": metrics.get("months_analyzed"),
                "active_trading_days": metrics.get("active_trading_days")
            },
            "data_source": {
                "statement_batch_id": data_source_batch_id,
                "verified_format": "Digital Transaction Record (CSV)",
                "credential_status": "No Banking Credentials Stored (Privacy-Preserved)"
            },
            "financial_summary": {
                "total_verified_receipts": metrics.get("total_verified_receipts"),
                "estimated_operating_expenses": metrics.get("estimated_operating_expenses"),
                "estimated_net_cash_flow": metrics.get("estimated_net_cash_flow"),
                "avg_daily_receipts": metrics.get("avg_daily_receipts"),
                "avg_monthly_net_surplus": metrics.get("avg_monthly_net_cash_flow"),
                "income_consistency_index": metrics.get("income_consistency_score"),
                "verified_existing_debt": metrics.get("verified_existing_debt")
            },
            "alternative_assessment": {
                "prototype_score": assessment.get("prototype_score"),
                "confidence_level": assessment.get("confidence_level"),
                "risk_tier": assessment.get("risk_tier"),
                "assessment_status": assessment.get("assessment_status"),
                "max_recommended_loan": assessment.get("max_recommended_loan"),
                "dscr": assessment.get("dscr")
            },
            "methodology_version": "TC-AI-v1.4-rule-explainable",
            "limitations_and_disclaimers": [
                "Assessment strictly evaluates uploaded and verified digital payment streams.",
                "Cash transactions conducted outside the digital account are unobserved.",
                "Experimental demonstration score; does not constitute a statutory credit rating.",
                "Subject to independent verification against formal AML/KYC checks."
            ]
        }

        # Deterministic serialization for hashing
        canonical_json_bytes = json.dumps(canonical_content, sort_keys=True, separators=(',', ':')).encode('utf-8')
        
        # 1. SHA-256 Hash
        sha256_hash = hashlib.sha256(canonical_json_bytes).hexdigest()

        # 2. Digital Signature (HMAC-SHA256 with platform master signing key)
        signature = hmac.new(REPORT_SIGNING_KEY.encode('utf-8'), sha256_hash.encode('utf-8'), hashlib.sha256).hexdigest()

        canonical_content["cryptographic_proof"] = {
            "sha256_hash": sha256_hash,
            "digital_signature": signature,
            "algorithm": "HMAC-SHA256",
            "trust_network": "TRUSTCRED AI Trust Network v1.0"
        }

        return canonical_content

    @classmethod
    def verify_report_integrity(cls, report_dict: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates both SHA-256 content integrity and cryptographic signature.
        Returns (is_valid, status_message, audit_details).
        """
        try:
            if "cryptographic_proof" not in report_dict:
                return False, "Missing cryptographic_proof block in report payload.", {}

            proof = report_dict["cryptographic_proof"]
            expected_hash = proof.get("sha256_hash")
            expected_sig = proof.get("digital_signature")

            # Clone dict and remove cryptographic_proof to recompute hash
            content_copy = {k: v for k, v in report_dict.items() if k != "cryptographic_proof"}
            canonical_json_bytes = json.dumps(content_copy, sort_keys=True, separators=(',', ':')).encode('utf-8')

            calculated_hash = hashlib.sha256(canonical_json_bytes).hexdigest()

            if calculated_hash != expected_hash:
                return False, (
                    f"Integrity check failed: Computed SHA-256 hash ({calculated_hash[:12]}...) "
                    f"does not match declared hash ({expected_hash[:12]}...). Content was modified or tampered with."
                ), {
                    "calculated_hash": calculated_hash,
                    "declared_hash": expected_hash,
                    "tamper_detected": True
                }

            # Verify signature
            expected_hmac = hmac.new(REPORT_SIGNING_KEY.encode('utf-8'), calculated_hash.encode('utf-8'), hashlib.sha256).hexdigest()

            if not hmac.compare_digest(expected_hmac, expected_sig):
                return False, "Digital signature verification failed: Signature was not issued by TRUSTCRED AI platform key.", {
                    "hash_valid": True,
                    "signature_valid": False
                }

            return True, "Verification successful: SHA-256 hash and digital signature match authentic platform record.", {
                "hash_valid": True,
                "signature_valid": True,
                "report_id": report_dict.get("report_id"),
                "timestamp": report_dict.get("created_timestamp")
            }

        except Exception as e:
            return False, f"Verification failed due to error: {str(e)}", {"error": str(e)}
