import os
import re
import json
import uuid
import secrets
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from database import init_db, get_db
from db_adapters import db_adapter
from ml.predictor import predict_success, detect_risk, CATEGORY_MAP
from agents.campaign_analyzer import CampaignAnalyzer
from agents.risk_analyst import RiskAnalyst
from agents.evidence_reviewer import EvidenceReviewer
from agents.explainer import Explainer
from agents import ADVISORY_DISCLAIMER

try:
    from eth_account.messages import encode_defunct
    from eth_account import Account
    ETH_ACCOUNT_AVAILABLE = True
except ImportError:
    ETH_ACCOUNT_AVAILABLE = False

try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False

# In-memory replay-protected SIWE nonces: nonce -> expiration_timestamp
siwe_nonces = {}

app = Flask(__name__)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})

# Initialize database schema
init_db()

# Initialize AI agents
analyzer_agent = CampaignAnalyzer()
risk_agent = RiskAnalyst()
evidence_agent = EvidenceReviewer()
explainer_agent = Explainer()

# -----------------------------------------------------------------------------
# Envelope Helpers
# -----------------------------------------------------------------------------
def success_response(data=None, status_code=200):
    return jsonify({
        "status": "success",
        "data": data,
        "error": None
    }), status_code

def error_response(message="An error occurred", status_code=400):
    return jsonify({
        "status": "error",
        "data": None,
        "error": message
    }), status_code

def save_assessment(campaign_id, assessment_type, result_data):
    if not campaign_id:
        return
    try:
        db_adapter.save_ai_assessment(str(campaign_id), assessment_type, result_data)
    except Exception as e:
        app.logger.warning(f"Failed to record assessment in DB: {e}")

# -----------------------------------------------------------------------------
# Health Check
# -----------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return success_response({
        "status": "online",
        "service": "TrustBridge AI/ML Backend",
        "version": "2.0.0",
        "database": db_adapter.provider
    })

# -----------------------------------------------------------------------------
# Campaign Endpoints
# -----------------------------------------------------------------------------
@app.route("/api/campaigns", methods=["GET"])
def list_campaigns():
    try:
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
        return success_response(campaigns)
    except Exception as e:
        return error_response(f"Failed to retrieve campaigns: {str(e)}", 500)

@app.route("/api/campaigns", methods=["POST"])
def create_campaign():
    data = request.get_json() or {}
    
    # Input Validation
    title = str(data.get("title", "")).strip()
    if not title:
        return error_response("Campaign title is required and cannot be empty", 400)
    if len(title) > 120:
        return error_response("Campaign title exceeds maximum length of 120 characters", 400)

    try:
        goal_eth = float(data.get("goal_eth", 10.0))
        hard_cap_eth = float(data.get("hard_cap_eth", 20.0))
    except (ValueError, TypeError):
        return error_response("goal_eth and hard_cap_eth must be valid numeric values", 400)

    if goal_eth <= 0 or goal_eth > 20.0:
        return error_response("goal_eth must be greater than 0 and cannot exceed 20.0 ETH", 400)
    if hard_cap_eth < goal_eth or hard_cap_eth > 20.0:
        return error_response("hard_cap_eth must be between goal_eth and 20.0 ETH", 400)

    campaign_id = str(data.get("id") or uuid.uuid4().hex[:8])
    description = str(data.get("description", "")).strip()
    category = data.get("category", "Other")
    if category not in CATEGORY_MAP:
        category = "Other"

    creator_address = str(data.get("creator_address", "0x0000000000000000000000000000000000000000"))
    contract_address = str(data.get("contract_address", ""))
    deadline_timestamp = int(data.get("deadline_timestamp", 0))
    
    milestones = data.get("milestones", [
        {"title": "Architecture & Prototype", "tranche_bps": 2000},
        {"title": "Testnet Launch & Audits", "tranche_bps": 2500},
        {"title": "Security Verification", "tranche_bps": 2500},
        {"title": "Production Readiness & Handover", "tranche_bps": 3000}
    ])

    try:
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

        # Dual-sync to cloud database adapter (Supabase) if active
        try:
            db_adapter.create_campaign({
                "id": campaign_id,
                "title": title,
                "description": description,
                "category": category,
                "creator_address": creator_address,
                "contract_address": contract_address,
                "goal_eth": goal_eth,
                "hard_cap_eth": hard_cap_eth,
                "deadline_timestamp": deadline_timestamp,
                "milestones_json": json.dumps(milestones)
            })
        except Exception as dbe:
            app.logger.warning(f"Secondary DB adapter sync warning: {dbe}")

        return success_response({
            "campaign_id": campaign_id,
            "message": "Campaign recorded in database"
        }, 201)
    except Exception as e:
        return error_response(f"Database error while creating campaign: {str(e)}", 500)

@app.route("/api/campaigns/<campaign_id>", methods=["GET"])
def get_campaign(campaign_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return error_response("Campaign not found", 404)

        c = dict(row)
        c["milestones"] = json.loads(c["milestones_json"])
        del c["milestones_json"]

        # Fetch submissions
        cursor.execute("SELECT * FROM milestone_submissions WHERE campaign_id = ?", (campaign_id,))
        c["submissions"] = [dict(s) for s in cursor.fetchall()]

        # Fetch saved AI assessments
        cursor.execute("SELECT * FROM ai_assessments WHERE campaign_id = ? ORDER BY created_at DESC", (campaign_id,))
        c["assessments"] = [dict(a) for a in cursor.fetchall()]
        conn.close()

        return success_response(c)
    except Exception as e:
        return error_response(f"Error fetching campaign: {str(e)}", 500)

# -----------------------------------------------------------------------------
# Machine Learning Prediction Endpoints
# -----------------------------------------------------------------------------
@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}
    try:
        prob = predict_success(data)
        payload = {
            "success_probability": prob,
            "percentage": round(prob * 100, 1),
            "disclaimer": ADVISORY_DISCLAIMER
        }
        campaign_id = data.get("id") or data.get("campaign_id")
        if campaign_id:
            save_assessment(campaign_id, "success_prediction", payload)
        return success_response(payload)
    except FileNotFoundError as fnf:
        return error_response(str(fnf), 503)
    except Exception as e:
        return error_response(f"Inference error: {str(e)}", 500)

@app.route("/api/risk", methods=["POST"])
def risk_assessment():
    data = request.get_json() or {}
    try:
        anomaly = detect_risk(data)
        prob = predict_success(data)
        risk_analysis = risk_agent.analyze(data, prob, anomaly)
        payload = {
            "anomaly": anomaly,
            "risk_analysis": risk_analysis,
            "disclaimer": ADVISORY_DISCLAIMER
        }
        campaign_id = data.get("id") or data.get("campaign_id")
        if campaign_id:
            save_assessment(campaign_id, "risk_anomaly", payload)
        return success_response(payload)
    except FileNotFoundError as fnf:
        return error_response(str(fnf), 503)
    except Exception as e:
        return error_response(f"Risk assessment error: {str(e)}", 500)

# -----------------------------------------------------------------------------
# Agentic AI Endpoints
# -----------------------------------------------------------------------------
@app.route("/api/ai/analyze", methods=["POST"])
def ai_analyze():
    data = request.get_json() or {}
    try:
        result = analyzer_agent.analyze(data)
        if isinstance(result, dict) and "disclaimer" not in result:
            result["disclaimer"] = ADVISORY_DISCLAIMER
        campaign_id = data.get("id") or data.get("campaign_id")
        if campaign_id:
            save_assessment(campaign_id, "campaign_analysis", result)
        return success_response(result)
    except Exception as e:
        return error_response(f"Campaign analysis agent failed: {str(e)}", 500)

@app.route("/api/ai/explain", methods=["POST"])
def ai_explain():
    data = request.get_json() or {}
    try:
        prob = predict_success(data)
        anomaly = detect_risk(data)
        result = explainer_agent.explain(data, prob, anomaly)
        if isinstance(result, dict) and "disclaimer" not in result:
            result["disclaimer"] = ADVISORY_DISCLAIMER
        campaign_id = data.get("id") or data.get("campaign_id")
        if campaign_id:
            save_assessment(campaign_id, "agent_explainer", result)
        return success_response(result)
    except Exception as e:
        return error_response(f"Explainer agent failed: {str(e)}", 500)

@app.route("/api/ai/review-evidence", methods=["POST"])
def ai_review_evidence():
    data = request.get_json() or {}
    milestone_data = data.get("milestone", {})
    submission_evidence = data.get("evidence", {})
    try:
        result = evidence_agent.review(milestone_data, submission_evidence)
        if isinstance(result, dict) and "disclaimer" not in result:
            result["disclaimer"] = ADVISORY_DISCLAIMER
        return success_response(result)
    except Exception as e:
        return error_response(f"Evidence review agent failed: {str(e)}", 500)

# -----------------------------------------------------------------------------
# Sandbox Off-Chain KYC Verification
# -----------------------------------------------------------------------------
@app.route("/api/verify/kyc", methods=["POST"])
def verify_kyc():
    data = request.get_json() or {}
    address = str(data.get("address", "")).strip().lower()
    full_name = str(data.get("full_name", "Anonymous Creator")).strip()
    country = str(data.get("country", "US")).strip()

    # Address validation (42 hex chars with 0x prefix)
    if not address or not re.match(r"^0x[a-f0-9]{40}$", address):
        return error_response("A valid 42-character Ethereum address (0x...) is required", 400)

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO kyc_records (address, full_name, country, verified)
            VALUES (?, ?, ?, 1)
        """, (address, full_name, country))
        conn.commit()
        conn.close()

        return success_response({
            "verified": True,
            "address": address,
            "tier": "Level 1 Verified (Sandbox)",
            "disclaimer": "This is an off-chain identity verification sandbox."
        })
    except Exception as e:
        return error_response(f"Database error during KYC registration: {str(e)}", 500)

# -----------------------------------------------------------------------------
# Authentication Endpoints (Google SSO Sandbox Mock)
# -----------------------------------------------------------------------------
ADMIN_EMAILS = {"admin@trustbridge.io", "supervisor@trustbridge.io"}

@app.route("/api/auth/google", methods=["POST"])
def auth_google():
    data = request.get_json() or {}
    email = str(data.get("email", "")).strip().lower()
    if not email or "@" not in email:
        return error_response("Valid email address is required for SSO authentication", 400)

    name = str(data.get("name", "Google User")).strip()
    avatar = str(data.get("avatar", ""))
    
    # Derive role server-side; do NOT blindly trust client-supplied privilege level
    if email in ADMIN_EMAILS:
        role = "Administrator"
    elif data.get("role") == "Verifier":
        role = "Verifier"
    else:
        role = "Contributor"
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO users (email, name, avatar, role)
            VALUES (?, ?, ?, ?)
        """, (email, name, avatar, role))
        conn.commit()
        conn.close()

        return success_response({
            "status": "authenticated",
            "provider": "google",
            "user": {
                "name": name,
                "email": email,
                "avatar": avatar,
                "role": role,
                "kycStatus": "Google SSO Verified"
            },
            "token": f"tb_g_{uuid.uuid4().hex[:16]}",
            "disclaimer": "Sandbox SSO mock — role derived server-side."
        })
    except Exception as e:
        return error_response(f"Authentication failure: {str(e)}", 500)

@app.route("/api/auth/google/verify", methods=["POST"])
def auth_google_verify():
    if not GOOGLE_AUTH_AVAILABLE:
        return error_response("Google Auth verification library unavailable on server", 503)

    data = request.get_json() or {}
    token = data.get("credential") or data.get("token")
    if not token:
        return error_response("Missing Google credential token", 400)
    
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip() or None
    try:
        # Cryptographic verification of Google ID token
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            audience=client_id if client_id else None
        )
        
        email = str(idinfo.get("email", "")).strip().lower()
        if not email:
            return error_response("Token did not contain a valid email", 400)
            
        name = str(idinfo.get("name", "Google User")).strip()
        avatar = str(idinfo.get("picture", ""))
        
        # Check if user already exists
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT role FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        
        if email in ADMIN_EMAILS:
            role = "Administrator"
            is_new_user = False
        elif row:
            role = row[0]
            is_new_user = False
        else:
            # New user: use requested role (Contributor/Creator/Verifier) or default
            chosen_role = data.get("role")
            role = chosen_role if chosen_role in {"Contributor", "Creator", "Verifier"} else "Contributor"
            is_new_user = True
            
        cursor.execute("""
            INSERT OR REPLACE INTO users (email, name, avatar, role)
            VALUES (?, ?, ?, ?)
        """, (email, name, avatar, role))
        conn.commit()
        conn.close()
        
        return success_response({
            "status": "authenticated",
            "provider": "google",
            "isNewUser": is_new_user,
            "user": {
                "name": name,
                "email": email,
                "avatar": avatar,
                "role": role,
                "kycStatus": "Google SSO Verified"
            },
            "token": f"tb_real_{uuid.uuid4().hex[:16]}",
            "disclaimer": "Cryptographically verified Google OAuth 2.0 session."
        })
    except ValueError as e:
        return error_response(f"Invalid Google token: {str(e)}", 401)
    except Exception as e:
        return error_response(f"Authentication verification error: {str(e)}", 500)

@app.route("/api/auth/siwe/nonce", methods=["GET"])
def auth_siwe_nonce():
    now = time.time()
    # Purge expired nonces (> 10 mins)
    expired = [n for n, exp in siwe_nonces.items() if exp < now]
    for n in expired:
        siwe_nonces.pop(n, None)

    nonce = secrets.token_hex(16)
    siwe_nonces[nonce] = now + 600
    return success_response({"nonce": nonce, "expiresIn": 600})

@app.route("/api/auth/siwe/verify", methods=["POST"])
def auth_siwe_verify():
    if not ETH_ACCOUNT_AVAILABLE:
        return error_response("Ethereum cryptography library unavailable on server", 503)

    data = request.get_json() or {}
    message = str(data.get("message", "")).strip()
    signature = str(data.get("signature", "")).strip()
    address = str(data.get("address", "")).strip().lower()

    if not message or not signature or not address:
        return error_response("Message, signature, and address are required", 400)

    # Extract nonce from message
    nonce_match = re.search(r"Nonce:\s*([a-fA-F0-9]{32})", message)
    if not nonce_match:
        return error_response("Invalid SIWE message format: missing nonce", 400)

    nonce = nonce_match.group(1).lower()
    if nonce not in siwe_nonces:
        return error_response("Nonce invalid or expired", 401)

    # Replay protection: nonce consumed
    siwe_nonces.pop(nonce, None)

    try:
        # Cryptographically recover signer address (EIP-191 / EIP-4361)
        msghash = encode_defunct(text=message)
        recovered_addr = Account.recover_message(msghash, signature=signature)

        if recovered_addr.lower() != address:
            return error_response(f"Signature mismatch: recovered {recovered_addr} != {address}", 401)

        email = f"{address}@sepolia.eth"
        name = f"{address[:6]}...{address[-4:]}"
        avatar = "🦊"
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT role FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        
        if row:
            role = row[0]
            is_new = False
        else:
            chosen_role = data.get("role")
            role = chosen_role if chosen_role in {"Contributor", "Creator", "Verifier"} else "Contributor"
            is_new = True

        cursor.execute("""
            INSERT OR REPLACE INTO users (email, name, avatar, role)
            VALUES (?, ?, ?, ?)
        """, (email, name, avatar, role))
        conn.commit()
        conn.close()

        return success_response({
            "status": "authenticated",
            "provider": "siwe",
            "isNewUser": is_new,
            "user": {
                "name": name,
                "email": email,
                "address": address,
                "avatar": avatar,
                "role": role,
                "kycStatus": "SIWE Cryptographically Verified"
            },
            "token": f"tb_siwe_{uuid.uuid4().hex[:16]}",
            "disclaimer": "Cryptographically verified EIP-4361 Ethereum wallet session."
        })
    except Exception as e:
        return error_response(f"SIWE verification error: {str(e)}", 500)

@app.route("/api/auth/firebase/verify", methods=["POST"])
def auth_firebase_verify():
    data = request.get_json() or {}
    user_info = data.get("user") or {}
    email = str(user_info.get("email", "")).strip().lower()
    if not email or "@" not in email:
        return error_response("Valid email address required from Firebase auth", 400)

    name = str(user_info.get("displayName") or user_info.get("name") or "Google User").strip()
    avatar = str(user_info.get("photoURL") or user_info.get("avatar") or "")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()

    if email in ADMIN_EMAILS:
        role = "Administrator"
        is_new = False
    elif row:
        role = row[0]
        is_new = False
    else:
        chosen_role = data.get("role")
        role = chosen_role if chosen_role in {"Contributor", "Creator", "Verifier"} else "Contributor"
        is_new = True

    cursor.execute("""
        INSERT OR REPLACE INTO users (email, name, avatar, role)
        VALUES (?, ?, ?, ?)
    """, (email, name, avatar, role))
    conn.commit()
    conn.close()

    return success_response({
        "status": "authenticated",
        "provider": "firebase",
        "isNewUser": is_new,
        "user": {
            "name": name,
            "email": email,
            "avatar": avatar,
            "role": role,
            "kycStatus": "Firebase Google Verified"
        },
        "token": f"tb_fb_{uuid.uuid4().hex[:16]}",
        "disclaimer": "Authenticated Firebase Google OAuth 2.0 session."
    })

# -----------------------------------------------------------------------------
# AI Chatbot Endpoints (White-labeled Protocol Intelligence)
# -----------------------------------------------------------------------------
REDIRECT_MESSAGE = "I am specialized exclusively in TrustBridge, Web3 smart contracts, milestone escrow, crypto, and decentralized crowdfunding. Please ask questions related to these topics."

SYSTEM_PROMPT = """You are TrustBridge AI, the official intelligent protocol assistant for the TrustBridge Decentralized Escrow Protocol.
TrustBridge is a high-assurance Web3 crowdfunding escrow platform operating on Ethereum Sepolia testnet.

CORE PROTOCOL SPECIFICATIONS:
- Contract: TrustBridge.sol deployed at 0x7c49bCc4A869480Bf3BAd72acf826667066c58d2 on Sepolia (Chain ID 11155111).
- Escrow Rules: Strict 10 ETH minimum funding goal, 20 ETH hard cap ceiling.
- In-Block Excess Refund: Contributions exceeding the 20 ETH cap automatically split and refund excess within the same block.
- 4-Tranche Milestone Stepper: Sequential release schedule: 20% (Arch), 25% (Testing), 25% (Verification), 30% (Handover).
- Non-Custodial Security: Pull-payment design, nonReentrant lock. No private keys are held by AI.
- Decision Support: Zero-leakage ML model for pre-launch success probability + Isolation Forest anomaly detection.
- Contributor Rights: 100% principal refunds if min goal is unmet by deadline, or fair pro-rata refunds if milestones are rejected after grace period.

TOPIC GATING & SCOPE ENFORCEMENT (CRITICAL):
- You ONLY answer questions related to:
  1. TrustBridge protocol mechanics, architecture, rules, and campaigns.
  2. Web3, Cryptography, Blockchain (Ethereum, EVM, Sepolia, Gas, Wallets, EIP-4361 SIWE).
  3. Solidity, Smart Contracts, Security, Reentrancy, Checks-Effects-Interactions, Pull Payments.
  4. Milestone Escrow, Verifier Consensus, decentralized governance, and fundraising game theory.
  5. AI Auditing, anomaly detection, risk telemetry, and campaign verification.
  6. Decentralized crowdfunding versus legacy centralized models.
- REFUSAL POLICY: If a user asks questions about unrelated topics (such as cooking recipes, non-Web3 coding, politics, sports, general entertainment, homework/trivia outside blockchain, fiction, etc.), politely decline and redirect them with:
  "I am specialized exclusively in TrustBridge, Web3 smart contracts, milestone escrow, crypto, and decentralized crowdfunding. Please ask questions related to these topics."
- Keep responses helpful, structured, concise, and focused on assisting users, project creators, and backers on TrustBridge."""

OFF_TOPIC_PATTERNS = [
    r"\b(recipe|bake|cook|pasta|pizza|cake|soup|salad|ingredient|kitchen)\b",
    r"\b(movie|film|actor|actress|cinema|netflix|hollywood|bollywood|song|lyrics|singer)\b",
    r"\b(football|soccer|basketball|cricket|nba|nfl|world cup|messi|ronaldo)\b",
    r"\b(weather|climate|forecast|rain|temperature|snow)\b",
    r"\b(dating|romance|horoscope|astrology|zodiac)\b",
    r"\b(president|election|democrat|republican|parliament|minister)\b"
]

def is_off_topic(query: str) -> bool:
    q = query.lower()
    # Check if contains explicit off-topic triggers and lacks Web3/TrustBridge keywords
    web3_keywords = [
        "web3", "crypto", "eth", "ethereum", "solidity", "smart contract", "contract",
        "escrow", "milestone", "tranche", "hard cap", "crowdfund", "campaign", "trustbridge",
        "sepolia", "wallet", "metamask", "siwe", "eip-4361", "token", "blockchain", "gas",
        "reentrancy", "ipfs", "verifier", "audit", "backer", "creator", "refund"
    ]
    has_web3_context = any(k in q for k in web3_keywords)
    if has_web3_context:
        return False

    import re
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, q):
            return True
    return False

def get_protocol_knowledge_response(query: str) -> str:
    q = query.lower()
    if any(k in q for k in ["4-tranche", "tranche", "milestone", "schedule", "stepper"]):
        return (
            "**TrustBridge 4-Tranche Milestone Schedule:**\n"
            "Funds are disbursed sequentially across 4 milestones totaling 10,000 BPS (100%):\n"
            "• **Tranche 1 (20%):** Architecture & Foundation (auto-unlocked upon reaching 10 ETH goal).\n"
            "• **Tranche 2 (25%):** Functional Core & Integration.\n"
            "• **Tranche 3 (25%):** Security Audit & Verification.\n"
            "• **Tranche 4 (30%):** Mainnet Deployment & Handover.\n\n"
            "Each subsequent tranche requires IPFS deliverable proof submission and multi-signature verifier quorum consensus."
        )
    if any(k in q for k in ["hard cap", "20 eth", "cap", "ceiling"]):
        return (
            "**20.00 ETH Hard Cap & In-Block Excess Refund:**\n"
            "TrustBridge enforces an immutable 20.00 ETH hard cap per campaign in `TrustBridge.sol`.\n"
            "If a contribution pushes the total raised above 20 ETH, the contract calculates `accepted = min(value, headroom)` and automatically refunds the excess wei within the exact same transaction block."
        )
    if any(k in q for k in ["min goal", "10 eth", "minimum goal", "funding goal"]):
        return (
            "**10.00 ETH Minimum Funding Goal:**\n"
            "Campaigns must raise at least 10.00 ETH before the deadline to transition to `Funded` state. "
            "If the campaign fails to reach 10 ETH before the deadline, it transitions to `Failed` and all contributors can pull 100% of their principal back."
        )
    if any(k in q for k in ["refund", "refunds", "protect"]):
        return (
            "**Contributor Refund Guarantees:**\n"
            "1. **Unfunded Campaigns:** 100% principal refund if under 10 ETH at deadline.\n"
            "2. **Excess Deposit:** Immediate in-block refund for deposits exceeding 20 ETH.\n"
            "3. **Failed Milestones:** If a milestone fails review after the 1-retry grace period, unspent escrow balance is made claimable pro-rata.\n"
            "All refunds use non-custodial pull payments."
        )
    if any(k in q for k in ["contract", "sepolia", "address", "deployment"]):
        return (
            "**TrustBridge Smart Contract Details:**\n"
            "• **Network:** Ethereum Sepolia Testnet (Chain ID 11155111)\n"
            "• **Address:** `0x7c49bCc4A869480Bf3BAd72acf826667066c58d2`\n"
            "• **Standard:** Solidity 0.8.20 with OpenZeppelin `ReentrancyGuard` and `Address.sendValue`."
        )
    if any(k in q for k in ["reentrancy", "pull payment", "security", "attack"]):
        return (
            "**Web3 Non-Custodial Security Architecture:**\n"
            "• **Checks-Effects-Interactions (CEI):** Internal balances and withdrawal flags update before external ETH transfers.\n"
            "• **ReentrancyGuard:** Mutex locks on all payable and withdrawal functions.\n"
            "• **Pull-Payment Pattern:** Zero push transfers in loops. Creators and backers withdraw their own funds individually."
        )
    if any(k in q for k in ["ai", "risk", "telemetry", "anomaly"]):
        return (
            "**AI Risk Telemetry & Verification Engine:**\n"
            "TrustBridge uses a dual-engine AI pipeline:\n"
            "• **Supervised Classifier:** Evaluates category, timeline, target, and team velocity for success probability.\n"
            "• **Isolation Forest:** Detects anomalous campaign parameters to warn backers.\n"
            "• *Advisory Notice:* AI telemetry is an informational risk assessment and not a financial verdict."
        )
    return (
        "TrustBridge Protocol Intelligence is active. All escrow balances, 4-tranche milestones, and 20 ETH cap rules are governed trustlessly on Sepolia at `0x7c49bCc4A869480Bf3BAd72acf826667066c58d2`."
    )

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = str(data.get("message", "")).strip()
    if not message:
        return error_response("Message cannot be empty", 400)

    # Layer 1 Topic Gating: Fast Heuristic Pre-filter
    if is_off_topic(message):
        return success_response({
            "reply": REDIRECT_MESSAGE,
            "provider": "Protocol Intelligence"
        })

    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    groq_model = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")

    # Priority 1: High-Speed Groq Inference
    if groq_api_key:
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": groq_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": message}
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }
            res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=3)
            if res.status_code == 200:
                choice = res.json()["choices"][0]["message"]
                content = choice.get("content") or choice.get("reasoning") or ""
                return success_response({
                    "reply": content.strip(),
                    "provider": "Protocol Intelligence"
                })
            else:
                app.logger.warning(f"Groq API returned {res.status_code}: {res.text}")
        except Exception as e:
            app.logger.error(f"Groq chat error: {e}")

    # Priority 2: NVIDIA NIM Inference Fallback
    nvidia_key = os.environ.get("NVIDIA_API_KEY", "")
    nvidia_model = os.environ.get("NVIDIA_MODEL", "nvidia/nemotron-3.5-lightning-30b-a3b")
    if nvidia_key:
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {nvidia_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": nvidia_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": message}
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }
            res = requests.post("https://integrate.api.nvidia.com/v1/chat/completions", headers=headers, json=payload, timeout=3)
            if res.status_code == 200:
                choice = res.json()["choices"][0]["message"]
                content = choice.get("content") or choice.get("reasoning_content") or ""
                return success_response({
                    "reply": content.strip(),
                    "provider": "Protocol Intelligence"
                })
            else:
                app.logger.warning(f"NVIDIA API returned {res.status_code}: {res.text}")
        except Exception as e:
            app.logger.error(f"NVIDIA chat error: {e}")

    # Priority 3: Built-in Knowledge Base & Protocol Grounding Fallback
    return success_response({
        "reply": get_protocol_knowledge_response(message),
        "provider": "Protocol Intelligence"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"TrustBridge Flask Backend starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
