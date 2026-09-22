import os
import json
import requests
from . import ADVISORY_DISCLAIMER

NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL_NAME = os.environ.get("NVIDIA_MODEL", "nvidia/nemotron-3.5-lightning-30b-a3b")

class RiskAnalyst:
    """
    Agent 2: Cross-references ML scores with pitch claims, flags scope/budget mismatches, and unrealistic promises.
    """

    def analyze(self, campaign_data, ml_prediction, anomaly_result):
        title = campaign_data.get("title", "")
        description = campaign_data.get("description", "")
        goal_eth = campaign_data.get("goal_eth", 10.0)
        duration_days = campaign_data.get("duration_days", 30)

        prompt = f"""You are the TrustBridge Risk Analyst AI Agent.
Evaluate the following campaign against its ML success probability and anomaly risk signals:

Title: {title}
Goal: {goal_eth} ETH
Duration: {duration_days} days
ML Success Probability: {ml_prediction}
Anomaly Risk Tier: {anomaly_result.get('risk_tier')} (Score: {anomaly_result.get('anomaly_score')})
Description: {description}

Identify red flags, scope-to-budget feasibility, and timeline realism.
Return ONLY a valid JSON object matching this schema:
{{
  "overall_risk_level": "LOW" | "MEDIUM" | "HIGH",
  "budget_realism_score": 0.0 to 1.0,
  "timeline_feasibility": "REALISTIC" | "AGGRESSIVE" | "UNREALISTIC",
  "identified_red_flags": ["flag1", "flag2"],
  "mitigation_suggestions": ["mitigation1", "mitigation2"]
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
                print(f"[RiskAnalyst] API call failed: {e}")

        # Deterministic fallback
        tier = anomaly_result.get("risk_tier", "LOW")
        return {
            "overall_risk_level": tier,
            "budget_realism_score": 0.85,
            "timeline_feasibility": "REALISTIC" if duration_days >= 30 else "AGGRESSIVE",
            "identified_red_flags": [
                "Ensure smart contract gas optimization does not exceed testnet allocation",
                "High dependency on third-party RPC node uptime during live launch"
            ],
            "mitigation_suggestions": [
                "Implement fallback Infura/Alchemy RPC providers",
                "Lock initial tranche to 20% upfront strictly in accordance with PRD"
            ],
            "disclaimer": ADVISORY_DISCLAIMER
        }
