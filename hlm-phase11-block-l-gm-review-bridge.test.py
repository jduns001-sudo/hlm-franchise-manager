"""Block L regression: explicit GM commands reuse Block K's SQLite guards."""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).parent
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

prior = load("block_l_prior", "hlm-phase11-block-k-concurrent-settlement.test.py")
bridge_module = load("block_l_bridge", "hlm-phase11-block-l-gm-review-bridge.py")

class BridgeAcceptance(prior.ConcurrentSettlementAcceptance):
    def test_explicit_review_decline_approve_replay_and_recovery(self):
        coordinator = self.reviewed()
        bridge = bridge_module.GMReviewSimulationBridge(coordinator)
        request = dict(self.day_request, revision=1, seed=17,
                       decision_id="SYNTHETIC-DAY-18")
        review = bridge.review(gm=request["gm"], franchise=request["franchise"],
                               revision=1, seed=17)
        token = review["review_id"]
        before = self.snapshot_all()
        self.assertEqual(bridge.decide(**request, review_id=token,
                                       action="decline")["status"], "declined")
        self.assertEqual(self.snapshot_all(), before)
        self.assertEqual(bridge.recover(gm=request["gm"], franchise=request["franchise"],
                                        review_id=token)["status"], "pending")
        with self.assertRaises(ValueError):
            bridge.decide(**request, review_id=token, action="unknown")
        self.assertEqual(self.snapshot_all(), before)
        self.assertTrue(bridge.decide(**request, review_id=token,
                                      action="approve")["committed"])
        after = self.snapshot_all()
        self.assertFalse(bridge.decide(**request, review_id=token,
                                       action="approve")["committed"])
        self.assertEqual(self.snapshot_all(), after)
        self.assertEqual(bridge.recover(gm=request["gm"], franchise=request["franchise"],
                                        review_id=token)["status"], "consumed")

if __name__ == "__main__":
    unittest.main()
