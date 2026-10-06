import unittest
import json
from fastapi.testclient import TestClient
from app import app
from database import init_db

class APIClient:
    def __init__(self, fastapi_app):
        self._tc = TestClient(fastapi_app)

    def _wrap(self, res):
        res.get_json = res.json
        res.get_data = lambda as_text=True: res.text
        return res

    def get(self, *args, **kwargs):
        return self._wrap(self._tc.get(*args, **kwargs))

    def post(self, *args, **kwargs):
        return self._wrap(self._tc.post(*args, **kwargs))

class TestTrustBridgeAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.client = APIClient(app)

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertIn("online", res.get_data(as_text=True))

    def test_predict_and_risk(self):
        payload = {
            "title": "Quantum AI Security Layer",
            "description": "Building decentralized cryptographic security for autonomous agent verification.",
            "category": "AI/ML",
            "goal_eth": 12.5,
            "duration_days": 45,
            "milestone_count": 4
        }
        res_pred = self.client.post("/api/predict", json=payload)
        self.assertEqual(res_pred.status_code, 200)
        data = res_pred.get_json()["data"]
        self.assertIn("success_probability", data)
        self.assertIn("disclaimer", data)

        res_risk = self.client.post("/api/risk", json=payload)
        self.assertEqual(res_risk.status_code, 200)
        risk_data = res_risk.get_json()["data"]
        self.assertIn("anomaly", risk_data)
        self.assertIn("risk_analysis", risk_data)

    def test_ai_agents(self):
        payload = {
            "title": "Autonomous Proof Engine",
            "description": "Zero-knowledge proofs on Sepolia testnet with multi-sig verifier committees.",
            "category": "Infrastructure",
            "goal_eth": 15.0,
            "duration_days": 30,
            "milestones": [
                {"title": "M1 Architecture", "tranche_bps": 2000},
                {"title": "M2 Smart Contracts", "tranche_bps": 2500},
                {"title": "M3 Testnet Sandbox", "tranche_bps": 2500},
                {"title": "M4 Mainnet Release", "tranche_bps": 3000}
            ]
        }
        # Analyzer
        res = self.client.post("/api/ai/analyze", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertIn("completeness_score", res.get_json()["data"])
        self.assertIn("disclaimer", res.get_json()["data"])

        # Explainer
        res_exp = self.client.post("/api/ai/explain", json=payload)
        self.assertEqual(res_exp.status_code, 200)
        self.assertIn("backer_summary", res_exp.get_json()["data"])
        self.assertIn("disclaimer", res_exp.get_json()["data"])

        # Evidence Reviewer
        evidence_payload = {
            "milestone": {"title": "M1 Architecture", "tranche_bps": 2000},
            "evidence": {
                "ipfs_hash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
                "repo_url": "https://github.com/trustbridge/zk-core",
                "demo_url": "https://staging.trustbridge.network"
            }
        }
        res_ev = self.client.post("/api/ai/review-evidence", json=evidence_payload)
        self.assertEqual(res_ev.status_code, 200)
        self.assertIn("verification_checklist", res_ev.get_json()["data"])
        self.assertIn("disclaimer", res_ev.get_json()["data"])

    def test_campaign_crud(self):
        payload = {
            "id": "zk-engine-01",
            "title": "ZK Engine",
            "description": "Verifiable proofs",
            "category": "Infrastructure",
            "goal_eth": 10.0,
            "hard_cap_eth": 20.0
        }
        res_post = self.client.post("/api/campaigns", json=payload)
        self.assertEqual(res_post.status_code, 201)

        res_get = self.client.get("/api/campaigns/zk-engine-01")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.get_json()["data"]["title"], "ZK Engine")

if __name__ == "__main__":
    unittest.main()
