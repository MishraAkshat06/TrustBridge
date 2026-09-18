import os
import json
import requests
from . import ADVISORY_DISCLAIMER

NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL_NAME = "nvidia/nemotron-4-340b-instruct"

class Explainer:
    """
    Agent 4: Synthesizes ML probabilities, anomaly indicators, and audit outputs into plain-English backer guidance.
    """

    def explain(self, campaign_data, ml_prediction, risk_data, audit_data=None):
        title = campaign_data.get("title", "")
        category = campaign_data.get("category", "")
        goal_eth = campaign_data.get("goal_eth", 10.0)

        prompt = f"""You are the TrustBridge Explainer AI Agent.
Synthesize the following quantitative and qualitative analytics into plain-English backer guidance:

Campaign: {title} ({category}, Goal: {goal_eth} ETH)
ML Success Probability: {round(ml_prediction * 100, 1)}%
Risk Tier: {risk_data.get('risk_tier', 'LOW')}
Anomaly Score: {risk_data.get('anomaly_score', 0.1)}

Provide a concise, transparent explanation for non-technical backers.
Return ONLY a valid JSON object matching this schema:
{{
  "backer_summary": "Plain English summary of why this project scored this way",
  "key_strengths": ["point1", "point2"],
  "caution_points": ["point1", "point2"],
  "decision_tip": "Advice for potential backer"
}}"""

        if NVIDIA_API_KEY:
            try:
                headers = {
                    "Authorization": f"Bearer {NVIDIA_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": MODEL_NAME,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                    "max_tokens": 800
                }
                res = requests.post(NVIDIA_API_URL, headers=headers, json=payload, timeout=20)
                if res.status_code == 200:
                    content = res.json()["choices"][0]["message"]["content"].strip()
                    if content.startswith("```json"):
                        content = content[7:]
                    if content.endswith("```"):
                        content = content[:-3]
                    data = json.loads(content)
                    data["disclaimer"] = ADVISORY_DISCLAIMER
                    return data
            except Exception as e:
                print(f"[Explainer] API call failed: {e}")

        # Deterministic fallback
        pct = round(ml_prediction * 100, 1)
        tier = risk_data.get("risk_tier", "LOW")
        return {
            "backer_summary": f"Campaign demonstrates strong foundational metrics with an estimated {pct}% success likelihood based on historical launch feature distributions.",
            "key_strengths": [
                f"Financial goal of {goal_eth} ETH aligns within healthy platform liquidity ranges",
                "Four-stage milestone escrow releases capital strictly upon verified progress"
            ],
            "caution_points": [
                "Funds in Tranche 1 (20%) are released upon successful funding completion",
                "Ensure team delivers on milestone proof before subsequent tranches unlock"
            ],
            "decision_tip": f"Risk profile is categorized as {tier}. Backers should review milestone deliverables prior to contributing.",
            "disclaimer": ADVISORY_DISCLAIMER
        }
