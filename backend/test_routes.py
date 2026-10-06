import os
import json
import unittest
from fastapi.testclient import TestClient
from app import app
from database import get_db, init_db

class APIClient:
    def __init__(self, fastapi_app):
        self._tc = TestClient(fastapi_app)

    def _wrap(self, res):
        res.get_json = res.json
        return res

    def get(self, *args, **kwargs):
        return self._wrap(self._tc.get(*args, **kwargs))

    def post(self, *args, **kwargs):
        return self._wrap(self._tc.post(*args, **kwargs))

    def put(self, *args, **kwargs):
        return self._wrap(self._tc.put(*args, **kwargs))

    def delete(self, *args, **kwargs):
        return self._wrap(self._tc.delete(*args, **kwargs))

class BackendSecurityTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.client = APIClient(app)

    def test_01_health_envelope(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIsNone(data["error"])
        self.assertEqual(data["data"]["status"], "online")

    def test_02_campaign_validation(self):
        # Empty title -> 400
        res = self.client.post("/api/campaigns", json={"title": ""})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()["status"], "error")

        # goal_eth > 20 -> 400
        res = self.client.post("/api/campaigns", json={"title": "Test", "goal_eth": 25.0})
        self.assertEqual(res.status_code, 400)

        # Valid campaign -> 201
        res = self.client.post("/api/campaigns", json={
            "title": "Secured AI Research Protocol",
            "goal_eth": 10.0,
            "hard_cap_eth": 20.0,
            "category": "AI/ML"
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.get_json()["status"], "success")

    def test_03_kyc_address_validation(self):
        # Invalid address -> 400
        res = self.client.post("/api/verify/kyc", json={"address": "not-an-address"})
        self.assertEqual(res.status_code, 400)

        # Valid 42-char hex -> 200
        res = self.client.post("/api/verify/kyc", json={"address": "0x1111111111111111111111111111111111111111"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["data"]["verified"], True)

    def test_04_auth_google_role_tampering_defense(self):
        # Attacker tries to claim Administrator role
        res = self.client.post("/api/auth/google", json={
            "email": "attacker@random.com",
            "name": "Attacker",
            "role": "Administrator"
        })
        self.assertEqual(res.status_code, 200)
        user_data = res.get_json()["data"]["user"]
        # Must be demoted to Contributor!
        self.assertEqual(user_data["role"], "Contributor")

        # Authorized admin email gets Administrator
        res_admin = self.client.post("/api/auth/google", json={
            "email": "admin@trustbridge.io",
            "name": "Admin User"
        })
        self.assertEqual(res_admin.get_json()["data"]["user"]["role"], "Administrator")

    def test_05_predict_and_ai_assessment_persistence(self):
        res = self.client.post("/api/predict", json={
            "id": "test-campaign-persist-1",
            "goal_eth": 10.0,
            "category": "AI/ML",
            "title": "Persistent Test",
            "description": "Comprehensive description for AI assessment testing"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertIn("success_probability", data)
        self.assertIn("disclaimer", data)

        # Verify DB wrote to ai_assessments table
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ai_assessments WHERE campaign_id = ?", ("test-campaign-persist-1",))
        rows = cursor.fetchall()
        self.assertGreaterEqual(len(rows), 1)
        conn.close()

    def test_06_chat_endpoint(self):
        # Empty message -> 400
        res_empty = self.client.post("/api/chat", json={"message": ""})
        self.assertEqual(res_empty.status_code, 400)

        # Valid message -> 200 with reply
        res = self.client.post("/api/chat", json={"message": "What is the escrow minimum goal?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("reply", data["data"])
        self.assertTrue(len(data["data"]["reply"]) > 0)

    def test_07_auth_google_verify_validation(self):
        # Missing token -> 400
        res_empty = self.client.post("/api/auth/google/verify", json={})
        self.assertEqual(res_empty.status_code, 400)

        # Invalid token -> 401
        res_invalid = self.client.post("/api/auth/google/verify", json={"credential": "invalid.jwt.token"})
        self.assertEqual(res_invalid.status_code, 401)

    def test_08_siwe_nonce_and_verification(self):
        from eth_account import Account
        from eth_account.messages import encode_defunct

        # 1. Fetch nonce
        nonce_res = self.client.get("/api/auth/siwe/nonce")
        self.assertEqual(nonce_res.status_code, 200)
        nonce = nonce_res.get_json()["data"]["nonce"]
        self.assertEqual(len(nonce), 32)

        # 2. Generate wallet and sign SIWE message
        acct = Account.create()
        msg_text = f"Sign in to TrustBridge Protocol.\n\nNonce: {nonce}\nIssued At: 2026-09-22T00:00:00Z"
        msghash = encode_defunct(text=msg_text)
        sig = acct.sign_message(msghash).signature.hex()

        # 3. Forged address must be rejected with 401
        forged_res = self.client.post("/api/auth/siwe/verify", json={
            "message": msg_text,
            "signature": sig,
            "address": "0x0000000000000000000000000000000000000000"
        })
        self.assertEqual(forged_res.status_code, 401)

        # 4. Legitimate signature with fresh nonce must succeed
        nonce_res2 = self.client.get("/api/auth/siwe/nonce")
        nonce2 = nonce_res2.get_json()["data"]["nonce"]
        msg_text2 = f"Sign in to TrustBridge Protocol.\n\nNonce: {nonce2}\nIssued At: 2026-09-22T00:00:00Z"
        msghash2 = encode_defunct(text=msg_text2)
        sig2 = acct.sign_message(msghash2).signature.hex()

        valid_res = self.client.post("/api/auth/siwe/verify", json={
            "message": msg_text2,
            "signature": sig2,
            "address": acct.address
        })
        self.assertEqual(valid_res.status_code, 200)
        user = valid_res.get_json()["data"]["user"]
        self.assertEqual(user["address"].lower(), acct.address.lower())

        # 5. Nonce reuse must be rejected (replay attack prevention)
        replay_res = self.client.post("/api/auth/siwe/verify", json={
            "message": msg_text2,
            "signature": sig2,
            "address": acct.address
        })
        self.assertEqual(replay_res.status_code, 401)


    def test_09_firebase_verify(self):
        # Missing email -> 400
        res_empty = self.client.post("/api/auth/firebase/verify", json={"user": {}})
        self.assertEqual(res_empty.status_code, 400)

        # Valid payload
        res_ok = self.client.post("/api/auth/firebase/verify", json={
            "user": {
                "email": "firebase.backer@gmail.com",
                "displayName": "Firebase Backer",
                "photoURL": "https://avatar.url"
            },
            "role": "Contributor"
        })
        self.assertEqual(res_ok.status_code, 200)
        user = res_ok.get_json()["data"]["user"]
        self.assertEqual(user["email"], "firebase.backer@gmail.com")
        self.assertEqual(user["kycStatus"], "Firebase Google Verified")

if __name__ == "__main__":
    unittest.main()


