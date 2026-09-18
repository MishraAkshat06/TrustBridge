import os
import json
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS

from database import init_db, get_db
from ml.predictor import predict_success, detect_risk
from agents.campaign_analyzer import CampaignAnalyzer
from agents.risk_analyst import RiskAnalyst
from agents.evidence_reviewer import EvidenceReviewer
from agents.explainer import Explainer

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize database schema
init_db()

# Initialize AI agents
analyzer_agent = CampaignAnalyzer()
risk_agent = RiskAnalyst()
evidence_agent = EvidenceReviewer()
explainer_agent = Explainer()

# -----------------------------------------------------------------------------
# Health Check
# -----------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "TrustBridge AI/ML Backend",
        "version": "2.0.0"
    })

# -----------------------------------------------------------------------------
# Campaign Endpoints
# -----------------------------------------------------------------------------
@app.route("/api/campaigns", methods=["GET"])
def list_campaigns():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campaigns ORDER BY created_at DESC")
    rows = cursor.fetchall()
    campaigns = []
    for r in rows:
        c = dict(r)
        c["milestones"] = json.loads(c["milestones_json"])
        del c["milestones_json"]
        campaigns.append(c)
    conn.close()
    return jsonify(campaigns)

@app.route("/api/campaigns", methods=["POST"])
def create_campaign():
    data = request.get_json() or {}
    campaign_id = data.get("id") or str(uuid.uuid4())[:8]
    title = data.get("title", "Untitled Campaign")
    description = data.get("description", "")
    category = data.get("category", "AI/ML")
    creator_address = data.get("creator_address", "0x0000000000000000000000000000000000000000")
    contract_address = data.get("contract_address", "")
    goal_eth = float(data.get("goal_eth", 10.0))
    hard_cap_eth = float(data.get("hard_cap_eth", 20.0))
    deadline_timestamp = int(data.get("deadline_timestamp", 0))
    milestones = data.get("milestones", [
        {"title": "Architecture & Prototype", "tranche_bps": 2000},
        {"title": "Testnet Launch & Audits", "tranche_bps": 2500},
        {"title": "Security Verification", "tranche_bps": 2500},
        {"title": "Mainnet Deployment", "tranche_bps": 3000}
    ])

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO campaigns 
        (id, title, description, category, creator_address, contract_address, goal_eth, hard_cap_eth, deadline_timestamp, milestones_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        campaign_id,
        title,
        description,
        category,
        creator_address,
        contract_address,
        goal_eth,
        hard_cap_eth,
        deadline_timestamp,
        json.dumps(milestones)
    ))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "campaign_id": campaign_id,
        "message": "Campaign recorded in off-chain database"
    }), 201

@app.route("/api/campaigns/<campaign_id>", methods=["GET"])
def get_campaign(campaign_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Campaign not found"}), 404

    c = dict(row)
    c["milestones"] = json.loads(c["milestones_json"])
    del c["milestones_json"]

    # Fetch submissions
    cursor.execute("SELECT * FROM milestone_submissions WHERE campaign_id = ?", (campaign_id,))
    c["submissions"] = [dict(s) for s in cursor.fetchall()]
    conn.close()
    return jsonify(c)

# -----------------------------------------------------------------------------
# Machine Learning Prediction Endpoints
# -----------------------------------------------------------------------------
@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}
    prob = predict_success(data)
    return jsonify({
        "success_probability": prob,
        "percentage": round(prob * 100, 1),
        "disclaimer": "This is an AI-generated advisory assessment and not a financial verdict."
    })

@app.route("/api/risk", methods=["POST"])
def risk_assessment():
    data = request.get_json() or {}
    anomaly = detect_risk(data)
    prob = predict_success(data)
    risk_analysis = risk_agent.analyze(data, prob, anomaly)
    return jsonify({
        "anomaly": anomaly,
        "risk_analysis": risk_analysis,
        "disclaimer": "This is an AI-generated advisory assessment and not a financial verdict."
    })

# -----------------------------------------------------------------------------
# Agentic AI Endpoints
# -----------------------------------------------------------------------------
@app.route("/api/ai/analyze", methods=["POST"])
def ai_analyze():
    data = request.get_json() or {}
    result = analyzer_agent.analyze(data)
    return jsonify(result)

@app.route("/api/ai/explain", methods=["POST"])
def ai_explain():
    data = request.get_json() or {}
    prob = predict_success(data)
    anomaly = detect_risk(data)
    result = explainer_agent.explain(data, prob, anomaly)
    return jsonify(result)

@app.route("/api/ai/review-evidence", methods=["POST"])
def ai_review_evidence():
    data = request.get_json() or {}
    milestone_data = data.get("milestone", {})
    submission_evidence = data.get("evidence", {})
    result = evidence_agent.review(milestone_data, submission_evidence)
    return jsonify(result)

# -----------------------------------------------------------------------------
# Sandbox Off-Chain KYC Verification
# -----------------------------------------------------------------------------
@app.route("/api/verify/kyc", methods=["POST"])
def verify_kyc():
    data = request.get_json() or {}
    address = data.get("address", "")
    full_name = data.get("full_name", "Anonymous Creator")
    country = data.get("country", "US")

    if not address:
        return jsonify({"error": "Address is required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO kyc_records (address, full_name, country, verified)
        VALUES (?, ?, ?, 1)
    """, (address, full_name, country))
    conn.commit()
    conn.close()

    return jsonify({
        "verified": True,
        "address": address,
        "tier": "Level 1 Verified (Sandbox)",
        "disclaimer": "This is an off-chain identity verification sandbox."
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"TrustBridge Flask Backend starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
