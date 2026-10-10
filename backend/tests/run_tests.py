import unittest
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from test_transaction_analysis import (
    test_csv_parsing_and_normalization,
    test_duplicate_detection,
    test_self_transfer_exclusion,
    test_high_volume_street_vendor_metrics
)
from test_credit_engine import (
    test_creditworthiness_evaluation,
    test_repayment_capacity_calculator,
    test_report_cryptographic_integrity_and_signature
)

class TestTrustCredBackend(unittest.TestCase):
    def test_01_csv_parsing(self):
        test_csv_parsing_and_normalization()

    def test_02_duplicate_detection(self):
        test_duplicate_detection()

    def test_03_self_transfer_exclusion(self):
        test_self_transfer_exclusion()

    def test_04_street_vendor_metrics(self):
        test_high_volume_street_vendor_metrics()

    def test_05_credit_evaluation(self):
        test_creditworthiness_evaluation()

    def test_06_repayment_calculator(self):
        test_repayment_capacity_calculator()

    def test_07_crypto_integrity(self):
        test_report_cryptographic_integrity_and_signature()

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestTrustCredBackend)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
