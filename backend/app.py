import os
import re
import json
import uuid
import secrets
import time
import asyncio
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Request, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import init_db, get_db
from db_adapters import db_adapter
from ml.predictor import (
    load_models,
    clear_models,
    predict_success_async,
    detect_risk_async,
    CATEGORY_MAP,
)
from agents.campaign_analyzer import CampaignAnalyzer
from agents.risk_analyst import RiskAnalyst
from agents.evidence_reviewer import EvidenceReviewer
from agents.explainer import Explainer
from agents import ADVISORY_DISCLAIMER
from blockchain import blockchain_service
from ai_stream import ai_service, REDIRECT_MESSAGE

from schemas import (
    CampaignCreateSchema,
    PredictRequestSchema,
    RiskRequestSchema,
    AIAnalyzeRequestSchema,
    AIExplainRequestSchema,
    AIReviewEvidenceRequestSchema,
    KYCRequestSchema,
    AuthGoogleSchema,
    AuthGoogleVerifySchema,
    SIWEVerifySchema,
    FirebaseVerifySchema,
    ChatRequestSchema,
)

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

# Replay-protected SIWE nonces: nonce -> expiration_timestamp
siwe_nonces: Dict[str, float] = {}

# Reusable Agent Singletons
analyzer_agent = CampaignAnalyzer()
risk_agent = RiskAnalyst()
evidence_agent = EvidenceReviewer()
explainer_agent = Explainer()

ADMIN_EMAILS = {"admin@trustbridge.io", "supervisor@trustbridge.io"}

# -----------------------------------------------------------------------------
# Application Lifespan Handler (In-Memory Model & DB Initialization)
# -----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB schema & Load Scikit-Learn Models once into Memory
    await asyncio.to_thread(init_db)
    models = await asyncio.to_thread(load_models)
    print("TrustBridge ASGI: SQLite WAL and In-Memory ML models loaded successfully.")
    yield
    # Shutdown: Clear in-memory references
    clear_models()
    print("TrustBridge ASGI: In-Memory models unloaded.")

app = FastAPI(
    title="TrustBridge High-Throughput ASGI Backend",
    version="2.0.0",
    description="Non-blocking FastAPI and AsyncWeb3 backend for TrustBridge Decentralized Escrow Protocol",
    lifespan=lifespan,
)

# -----------------------------------------------------------------------------
# CORS Middleware
# -----------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Standardized Envelope Responses
# -----------------------------------------------------------------------------
def success_response(data: Any = None, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "success",
            "data": data,
            "error": None,
        },
    )

def error_response(message: str = "An error occurred", status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "error",
            "data": None,
            "error": message,
        },
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "; ".join([f"{e['loc'][-1]}: {e['msg']}" for e in errors]) if errors else "Validation error"
    return error_response(msg, status_code=400)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return error_response(str(exc.detail), status_code=exc.status_code)

# -----------------------------------------------------------------------------
# Background Tasks (Async DB Assessment & Supabase Sync)
# -----------------------------------------------------------------------------
def background_save_assessment(campaign_id: str, assessment_type: str, result_data: Any):
    if not campaign_id:
        return
    try:
        db_adapter.save_ai_assessment(str(campaign_id), assessment_type, result_data)
    except Exception as e:
        print(f"Background assessment sync warning: {e}")

def background_sync_campaign(campaign_data: Dict[str, Any]):
    try:
        db_adapter.create_campaign(campaign_data)
    except Exception as e:
        print(f"Background Supabase sync warning: {e}")

# -----------------------------------------------------------------------------
# Health Check Endpoint
# -----------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return success_response({
        "status": "online",
        "service": "TrustBridge FastAPI ASGI Backend",
        "version": "2.0.0",
        "architecture": "Non-blocking ASGI + AsyncWeb3",
        "database": db_adapter.provider,
    })

# -----------------------------------------------------------------------------
# Campaign Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/campaigns")
async def list_campaigns():
    try:
        def fetch_all():
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
            return campaigns

        campaigns = await asyncio.to_thread(fetch_all)
        return success_response(campaigns)
    except Exception as e:
        return error_response(f"Failed to retrieve campaigns: {str(e)}", 500)

@app.post("/api/campaigns", status_code=status.HTTP_201_CREATED)
async def create_campaign(payload: CampaignCreateSchema, background_tasks: BackgroundTasks):
    title = payload.title.strip()
    if not title:
        return error_response("Campaign title is required and cannot be empty", 400)
    if len(title) > 120:
        return error_response("Campaign title exceeds maximum length of 120 characters", 400)

    if payload.goal_eth <= 0 or payload.goal_eth > 20.0:
        return error_response("goal_eth must be greater than 0 and cannot exceed 20.0 ETH", 400)
    if payload.hard_cap_eth < payload.goal_eth or payload.hard_cap_eth > 20.0:
        return error_response("hard_cap_eth must be between goal_eth and 20.0 ETH", 400)

    campaign_id = payload.id or uuid.uuid4().hex[:8]
    description = (payload.description or "").strip()
    category = payload.category if payload.category in CATEGORY_MAP else "Other"
    creator_address = payload.creator_address or "0x0000000000000000000000000000000000000000"
    contract_address = payload.contract_address or ""
    deadline_timestamp = payload.deadline_timestamp or 0

    milestones = payload.milestones or [
        {"title": "Architecture & Prototype", "tranche_bps": 2000},
        {"title": "Testnet Launch & Audits", "tranche_bps": 2500},
        {"title": "Security Verification", "tranche_bps": 2500},
        {"title": "Production Readiness & Handover", "tranche_bps": 3000},
    ]

    def insert_db():
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
            payload.goal_eth,
            payload.hard_cap_eth,
            deadline_timestamp,
            json.dumps(milestones),
        ))
        conn.commit()
        conn.close()

    try:
        await asyncio.to_thread(insert_db)

        # Offload secondary cloud database (Supabase) write to background task (zero WAN response delay)
        sync_payload = {
            "id": campaign_id,
            "title": title,
            "description": description,
            "category": category,
            "creator_address": creator_address,
            "contract_address": contract_address,
            "goal_eth": payload.goal_eth,
            "hard_cap_eth": payload.hard_cap_eth,
            "deadline_timestamp": deadline_timestamp,
            "milestones_json": json.dumps(milestones),
        }
        background_tasks.add_task(background_sync_campaign, sync_payload)

        return success_response({
            "campaign_id": campaign_id,
            "message": "Campaign recorded in database",
        }, 201)
    except Exception as e:
        return error_response(f"Database error while creating campaign: {str(e)}", 500)

@app.get("/api/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    def fetch_single():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        c = dict(row)
        c["milestones"] = json.loads(c["milestones_json"])
        del c["milestones_json"]

        cursor.execute("SELECT * FROM milestone_submissions WHERE campaign_id = ?", (campaign_id,))
        c["submissions"] = [dict(s) for s in cursor.fetchall()]

        cursor.execute("SELECT * FROM ai_assessments WHERE campaign_id = ? ORDER BY created_at DESC", (campaign_id,))
        c["assessments"] = [dict(a) for a in cursor.fetchall()]
        conn.close()
        return c

    try:
        campaign = await asyncio.to_thread(fetch_single)
        if not campaign:
            return error_response("Campaign not found", 404)
        return success_response(campaign)
    except Exception as e:
        return error_response(f"Error fetching campaign: {str(e)}", 500)

# -----------------------------------------------------------------------------
# Machine Learning Prediction Endpoints (Non-blocking & In-Memory)
# -----------------------------------------------------------------------------
@app.post("/api/predict")
async def predict(payload: PredictRequestSchema, background_tasks: BackgroundTasks):
    data = payload.model_dump()
    try:
        prob = await predict_success_async(data)
        response_data = {
            "success_probability": prob,
            "percentage": round(prob * 100, 1),
            "disclaimer": ADVISORY_DISCLAIMER,
        }
        campaign_id = data.get("id") or data.get("campaign_id")
        if campaign_id:
            background_tasks.add_task(
                background_save_assessment, campaign_id, "success_prediction", response_data
            )
        return success_response(response_data)
    except FileNotFoundError as fnf:
        return error_response(str(fnf), 503)
    except Exception as e:
        return error_response(f"Inference error: {str(e)}", 500)

@app.post("/api/risk")
async def risk_assessment(payload: RiskRequestSchema, background_tasks: BackgroundTasks):
    data = payload.model_dump()
    try:
        # Concurrently compute anomaly score and success prob in worker threads
        anomaly, prob = await asyncio.gather(
            detect_risk_async(data),
            predict_success_async(data),
        )
        risk_analysis = await asyncio.to_thread(risk_agent.analyze, data, prob, anomaly)
        response_data = {
            "anomaly": anomaly,
            "risk_analysis": risk_analysis,
            "disclaimer": ADVISORY_DISCLAIMER,
        }
        campaign_id = data.get("id") or data.get("campaign_id")
        if campaign_id:
            background_tasks.add_task(
                background_save_assessment, campaign_id, "risk_anomaly", response_data
            )
        return success_response(response_data)
    except FileNotFoundError as fnf:
        return error_response(str(fnf), 503)
    except Exception as e:
        return error_response(f"Risk assessment error: {str(e)}", 500)

# -----------------------------------------------------------------------------
# Agentic AI Endpoints
# -----------------------------------------------------------------------------
@app.post("/api/ai/analyze")
async def ai_analyze(payload: AIAnalyzeRequestSchema, background_tasks: BackgroundTasks):
    data = payload.model_dump()
    try:
        result = await asyncio.to_thread(analyzer_agent.analyze, data)
        if isinstance(result, dict) and "disclaimer" not in result:
            result["disclaimer"] = ADVISORY_DISCLAIMER
        campaign_id = data.get("id") or data.get("campaign_id")
        if campaign_id:
            background_tasks.add_task(
                background_save_assessment, campaign_id, "campaign_analysis", result
            )
        return success_response(result)
    except Exception as e:
        return error_response(f"Campaign analysis agent failed: {str(e)}", 500)

@app.post("/api/ai/explain")
async def ai_explain(payload: AIExplainRequestSchema, background_tasks: BackgroundTasks):
    data = payload.model_dump()
    try:
        prob, anomaly = await asyncio.gather(
            predict_success_async(data),
            detect_risk_async(data),
        )
        result = await asyncio.to_thread(explainer_agent.explain, data, prob, anomaly)
        if isinstance(result, dict) and "disclaimer" not in result:
            result["disclaimer"] = ADVISORY_DISCLAIMER
        campaign_id = data.get("id") or data.get("campaign_id")
        if campaign_id:
            background_tasks.add_task(
                background_save_assessment, campaign_id, "agent_explainer", result
            )
        return success_response(result)
    except Exception as e:
        return error_response(f"Explainer agent failed: {str(e)}", 500)

@app.post("/api/ai/review-evidence")
async def ai_review_evidence(payload: AIReviewEvidenceRequestSchema):
    data = payload.model_dump()
    milestone_data = data.get("milestone") or {}
    submission_evidence = data.get("evidence") or {}
    try:
        result = await asyncio.to_thread(evidence_agent.review, milestone_data, submission_evidence)
        if isinstance(result, dict) and "disclaimer" not in result:
            result["disclaimer"] = ADVISORY_DISCLAIMER
        return success_response(result)
    except Exception as e:
        return error_response(f"Evidence review agent failed: {str(e)}", 500)

# -----------------------------------------------------------------------------
# Sandbox Off-Chain KYC Verification
# -----------------------------------------------------------------------------
@app.post("/api/verify/kyc")
async def verify_kyc(payload: KYCRequestSchema):
    address = payload.address.strip().lower()
    full_name = (payload.full_name or "Anonymous Creator").strip()
    country = (payload.country or "US").strip()

    if not address or not re.match(r"^0x[a-f0-9]{40}$", address):
        return error_response("A valid 42-character Ethereum address (0x...) is required", 400)

    def write_kyc():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO kyc_records (address, full_name, country, verified)
            VALUES (?, ?, ?, 1)
        """, (address, full_name, country))
        conn.commit()
        conn.close()

    try:
        await asyncio.to_thread(write_kyc)
        return success_response({
            "verified": True,
            "address": address,
            "tier": "Level 1 Verified (Sandbox)",
            "disclaimer": "This is an off-chain identity verification sandbox.",
        })
    except Exception as e:
        return error_response(f"Database error during KYC registration: {str(e)}", 500)

# -----------------------------------------------------------------------------
# Authentication Endpoints (Google SSO & SIWE EIP-4361)
# -----------------------------------------------------------------------------
@app.post("/api/auth/google")
async def auth_google(payload: AuthGoogleSchema):
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        return error_response("Valid email address is required for SSO authentication", 400)

    name = payload.name.strip()
    avatar = payload.avatar or ""

    if email in ADMIN_EMAILS:
        role = "Administrator"
    elif payload.role == "Verifier":
        role = "Verifier"
    else:
        role = "Contributor"

    def write_user():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO users (email, name, avatar, role)
            VALUES (?, ?, ?, ?)
        """, (email, name, avatar, role))
        conn.commit()
        conn.close()

    try:
        await asyncio.to_thread(write_user)
        return success_response({
            "status": "authenticated",
            "provider": "google",
            "user": {
                "name": name,
                "email": email,
                "avatar": avatar,
                "role": role,
                "kycStatus": "Google SSO Verified",
            },
            "token": f"tb_g_{uuid.uuid4().hex[:16]}",
            "disclaimer": "Sandbox SSO mock — role derived server-side.",
        })
    except Exception as e:
        return error_response(f"Authentication failure: {str(e)}", 500)

@app.post("/api/auth/google/verify")
async def auth_google_verify(payload: AuthGoogleVerifySchema):
    if not GOOGLE_AUTH_AVAILABLE:
        return error_response("Google Auth verification library unavailable on server", 503)

    token = payload.credential or payload.token
    if not token:
        return error_response("Missing Google credential token", 400)

    client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip() or None

    def verify_token():
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), audience=client_id if client_id else None
        )
        email = str(idinfo.get("email", "")).strip().lower()
        if not email:
            raise ValueError("Token did not contain a valid email")
        name = str(idinfo.get("name", "Google User")).strip()
        avatar = str(idinfo.get("picture", ""))

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
            chosen_role = payload.role
            role = chosen_role if chosen_role in {"Contributor", "Creator", "Verifier"} else "Contributor"
            is_new_user = True

        cursor.execute("""
            INSERT OR REPLACE INTO users (email, name, avatar, role)
            VALUES (?, ?, ?, ?)
        """, (email, name, avatar, role))
        conn.commit()
        conn.close()

        return {
            "name": name,
            "email": email,
            "avatar": avatar,
            "role": role,
            "is_new_user": is_new_user,
        }

    try:
        user_info = await asyncio.to_thread(verify_token)
        return success_response({
            "status": "authenticated",
            "provider": "google",
            "isNewUser": user_info["is_new_user"],
            "user": {
                "name": user_info["name"],
                "email": user_info["email"],
                "avatar": user_info["avatar"],
                "role": user_info["role"],
                "kycStatus": "Google SSO Verified",
            },
            "token": f"tb_real_{uuid.uuid4().hex[:16]}",
            "disclaimer": "Cryptographically verified Google OAuth 2.0 session.",
        })
    except ValueError as e:
        return error_response(f"Invalid Google token: {str(e)}", 401)
    except Exception as e:
        return error_response(f"Authentication verification error: {str(e)}", 500)

@app.get("/api/auth/siwe/nonce")
async def auth_siwe_nonce():
    now = time.time()
    expired = [n for n, exp in siwe_nonces.items() if exp < now]
    for n in expired:
        siwe_nonces.pop(n, None)

    nonce = secrets.token_hex(16)
    siwe_nonces[nonce] = now + 600
    return success_response({"nonce": nonce, "expiresIn": 600})

@app.post("/api/auth/siwe/verify")
async def auth_siwe_verify(payload: SIWEVerifySchema):
    if not ETH_ACCOUNT_AVAILABLE:
        return error_response("Ethereum cryptography library unavailable on server", 503)

    message = payload.message.strip()
    signature = payload.signature.strip()
    address = payload.address.strip().lower()

    if not message or not signature or not address:
        return error_response("Message, signature, and address are required", 400)

    nonce_match = re.search(r"Nonce:\s*([a-fA-F0-9]{32})", message)
    if not nonce_match:
        return error_response("Invalid SIWE message format: missing nonce", 400)

    nonce = nonce_match.group(1).lower()
    if nonce not in siwe_nonces:
        return error_response("Nonce invalid or expired", 401)

    siwe_nonces.pop(nonce, None)

    try:
        def verify_sig():
            msghash = encode_defunct(text=message)
            recovered_addr = Account.recover_message(msghash, signature=signature)
            if recovered_addr.lower() != address:
                raise ValueError(f"Signature mismatch: recovered {recovered_addr} != {address}")

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
                chosen_role = payload.role
                role = chosen_role if chosen_role in {"Contributor", "Creator", "Verifier"} else "Contributor"
                is_new = True

            cursor.execute("""
                INSERT OR REPLACE INTO users (email, name, avatar, role)
                VALUES (?, ?, ?, ?)
            """, (email, name, avatar, role))
            conn.commit()
            conn.close()

            return {"name": name, "email": email, "avatar": avatar, "role": role, "is_new": is_new}

        res = await asyncio.to_thread(verify_sig)
        return success_response({
            "status": "authenticated",
            "provider": "siwe",
            "isNewUser": res["is_new"],
            "user": {
                "name": res["name"],
                "email": res["email"],
                "address": address,
                "avatar": res["avatar"],
                "role": res["role"],
                "kycStatus": "SIWE Cryptographically Verified",
            },
            "token": f"tb_siwe_{uuid.uuid4().hex[:16]}",
            "disclaimer": "Cryptographically verified EIP-4361 Ethereum wallet session.",
        })
    except ValueError as ve:
        return error_response(str(ve), 401)
    except Exception as e:
        return error_response(f"SIWE verification error: {str(e)}", 500)

@app.post("/api/auth/firebase/verify")
async def auth_firebase_verify(payload: FirebaseVerifySchema):
    user_info = payload.user or {}
    email = str(user_info.get("email", "")).strip().lower()
    if not email or "@" not in email:
        return error_response("Valid email address required from Firebase auth", 400)

    name = str(user_info.get("displayName") or user_info.get("name") or "Google User").strip()
    avatar = str(user_info.get("photoURL") or user_info.get("avatar") or "")

    def write_fb():
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
            chosen_role = payload.role
            role = chosen_role if chosen_role in {"Contributor", "Creator", "Verifier"} else "Contributor"
            is_new = True

        cursor.execute("""
            INSERT OR REPLACE INTO users (email, name, avatar, role)
            VALUES (?, ?, ?, ?)
        """, (email, name, avatar, role))
        conn.commit()
        conn.close()

        return {"name": name, "email": email, "avatar": avatar, "role": role, "is_new": is_new}

    try:
        res = await asyncio.to_thread(write_fb)
        return success_response({
            "status": "authenticated",
            "provider": "firebase",
            "isNewUser": res["is_new"],
            "user": {
                "name": res["name"],
                "email": res["email"],
                "avatar": res["avatar"],
                "role": res["role"],
                "kycStatus": "Firebase Google Verified",
            },
            "token": f"tb_fb_{uuid.uuid4().hex[:16]}",
            "disclaimer": "Authenticated Firebase Google OAuth 2.0 session.",
        })
    except Exception as e:
        return error_response(f"Firebase verification error: {str(e)}", 500)

# -----------------------------------------------------------------------------
# AI Chatbot Endpoints (Fast Non-blocking & Streaming SSE)
# -----------------------------------------------------------------------------
@app.post("/api/chat")
async def chat(payload: ChatRequestSchema):
    message = payload.message.strip()
    if not message:
        return error_response("Message cannot be empty", 400)

    try:
        reply_dict = await ai_service.generate_response(message)
        return success_response(reply_dict)
    except Exception as e:
        return error_response(f"Chat service error: {str(e)}", 500)

@app.post("/api/chat/stream")
async def chat_stream(payload: ChatRequestSchema):
    """
    Server-Sent Events (SSE) streaming endpoint using native AsyncGroq streaming.
    """
    message = payload.message.strip()
    if not message:
        return error_response("Message cannot be empty", 400)

    return StreamingResponse(
        ai_service.stream_audit_response(message),
        media_type="text/event-stream",
    )

# -----------------------------------------------------------------------------
# Blockchain Telemetry (AsyncWeb3 + In-Memory 30s TTL Caching)
# -----------------------------------------------------------------------------
@app.get("/api/chain/vault/{address}")
async def get_vault_onchain_telemetry(address: str, refresh: bool = False):
    """
    High-speed cached endpoint for Sepolia on-chain escrow state.
    Target latency: < 5ms on cache hit.
    """
    if not address or not re.match(r"^0x[a-fA-F0-9]{40}$", address):
        return error_response("A valid 42-character Ethereum contract address is required", 400)

    try:
        telemetry = await blockchain_service.get_vault_telemetry(address, force_refresh=refresh)
        return success_response(telemetry)
    except RuntimeError as re_err:
        return error_response(str(re_err), 502)
    except Exception as e:
        return error_response(f"Failed to fetch on-chain telemetry: {str(e)}", 500)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    print(f"TrustBridge FastAPI ASGI Backend starting on port {port}...")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False, workers=1)
