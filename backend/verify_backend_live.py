import requests
import json

BASE = "http://127.0.0.1:5000"

def test_endpoints():
    print("--- 1. Testing /api/health ---")
    r = requests.get(f"{BASE}/api/health", timeout=10)
    print("Health:", r.status_code, r.json())

    print("\n--- 2. Testing /api/campaigns ---")
    r = requests.get(f"{BASE}/api/campaigns", timeout=10)
    data = r.json()
    count = len(data.get("data", []))
    print("Campaigns:", r.status_code, f"{count} campaigns loaded from Supabase")

    print("\n--- 3. Testing /api/predict (Scikit-Learn ML Model) ---")
    payload = {"goal_eth": 10.0, "category": "AI/ML", "duration_days": 30, "num_milestones": 4}
    r = requests.post(f"{BASE}/api/predict", json=payload, timeout=10)
    print("ML Predict:", r.status_code, r.json())

    print("\n--- 4. Testing /api/risk (Isolation Forest Anomaly Model) ---")
    r = requests.post(f"{BASE}/api/risk", json=payload, timeout=25)
    print("Anomaly Detection:", r.status_code, r.json())

    print("\n--- 5. Testing /api/chat (Groq / NVIDIA LLM) ---")
    r = requests.post(f"{BASE}/api/chat", json={"message": "What is TrustBridge?"}, timeout=25)
    chat_res = r.json()
    print("Chat:", r.status_code, "Model:", chat_res.get("data", {}).get("model"))
    reply = chat_res.get("data", {}).get("reply", "")
    print("Reply preview:", reply[:80] + "...")

if __name__ == "__main__":
    test_endpoints()
