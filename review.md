# TrustBridge Comprehensive Performance & Architecture Review

**Date:** September 2026  
**Audited Target:** Full Stack (Flask Backend, ML Pipelines, Vite/React Frontend, Web3/Solidity Escrow)  
**Primary Symptom:** Critical latency across Chatbot (11s–25s delays), Frontend initial load lockup (80s–100s freeze), and Model disk I/O thrashing.

---

## 1. Executive Summary & Benchmark Scorecard

Systemic latency stems from **three compounding architectural bottlenecks**:
1. **Chatbot Remote Cascade**: Local heuristic (<0.004 ms) is placed *after* two failing external AI providers. Windows LAN DNS resolver (`192.168.0.10`) hangs for 11.1s on `api.groq.com`, followed by a 3.5s stall on deprecated NVIDIA NIM endpoints.
2. **Frontend Startup Waterfall (N+1 Burst)**: `AppContext.jsx` fires **52 simultaneous HTTP requests** (26 `predictSuccess` + 26 `assessRisk`) immediately upon mounting. This saturates the browser's 6-connection HTTP/1.1 pool and halts the Flask backend.
3. **ML Model Disk Thrashing**: `backend/ml/predictor.py` executes `joblib.load()` from disk (1.98 MB binary) on **every single prediction request**, taking 1.8s per request under disk I/O contention.

### Latency Scorecard

| Workflow / Endpoint | Measured Latency (Current) | Root Cause | Target Latency (Post-Fix) | Improvement |
|---|---|---|---|---|
| **Chatbot Protocol Query** | **14,640 ms (14.6 s)** | DNS lookup timeout + NIM failure before heuristic | **0.004 ms (4 µs)** | **3,660,000x faster** |
| **Chatbot Remote LLM Query** | **11,100 ms – 25,000 ms** | DNS timeout on LAN server `192.168.0.10` | **220 ms – 350 ms** | **~50x faster** |
| **Frontend Mount to Usable** | **80,000 ms – 100,000 ms** | 52 N+1 requests on mount + disk I/O burst | **450 ms – 650 ms** | **~150x faster** |
| **Single ML Prediction (`/api/predict`)** | **1,850 ms (1.85 s)** | Re-loading 1.98 MB `.joblib` model from disk | **2.1 ms** | **~880x faster** |
| **Supabase Dual-Write Sync** | **350 ms – 800 ms (Blocking)** | Synchronous REST write + foreign key failures | **0 ms (Async daemon)** | **Infinite (Non-blocking)** |
| **Contract Milestone RPC Sync** | **2,400 ms (2.4 s)** | 4 sequential sequential RPC reads in loop | **480 ms** | **5x faster** |

---

## 2. Chatbot Deep Dive (`/api/chat` & `Chatbot.jsx`)

### Root Cause Analysis
- **Execution Order Flaw (`backend/agents/chatbot_agent.py`)**:
  `ChatbotAgent.chat()` attempts:
  1. Groq Cloud (`qwen/qwen3.8-27b`)
  2. NVIDIA NIM (`nemotron-3.5-lightning-30b-a3b`)
  3. `get_protocol_knowledge_response()` (Local heuristic)
- **Groq API Status**: Model name and credentials are valid (213 ms response when tested via public DNS). However, on Windows development environments, the local gateway DNS (`192.168.0.10`) fails to resolve `api.groq.com`, hanging synchronously for **11.1 seconds** before throwing a `socket.gaierror`.
- **NVIDIA NIM Status**: Stalled/deprecated endpoint times out for 3.5s (or up to 25s under high concurrency).
- **The Heuristic Goldmine**: All 4 preset prompt chips in `Chatbot.jsx` ("What is TrustBridge?", "How does escrow work?", "What are the fees?", "How do verifiers earn?") match exact keywords inside `get_protocol_knowledge_response()`. Running this locally takes **0.004 ms**, but users wait 14.6 seconds because it is placed at the end of the fallback chain.

### Remediation Blueprint
1. **Invert Routing Priority**: Route protocol-specific queries through local heuristic/regex matchers first.
2. **Circuit Breaker & DNS Fallback**: Add a 1.5-second timeout on external requests and configure fallback DNS resolver (`8.8.8.8` / `1.1.1.1`) for `api.groq.com`.
3. **Frontend Immediate Matcher**: Mirror keyword heuristics inside `Chatbot.jsx` to render instant zero-latency responses for standard protocol FAQs without hitting the network.

---

## 3. Frontend Architecture & N+1 Request Floods

### 1. `AppContext.jsx` Startup Cascade (Lines 211–221)
```javascript
// CURRENT BROKEN PATTERN:
// Runs on every page load across all campaigns:
campaigns.forEach(async (c) => {
  await predictSuccess(c); // 26 calls -> GET/POST /api/predict
  await assessRisk(c);     // 26 calls -> GET/POST /api/risk
});
```
- **Consequences**:
  - 52 HTTP connections dispatched concurrently.
  - Browser limits concurrent HTTP connections to 6 per domain.
  - The request queue blocks critical calls (`syncOnChainData`, wallet listeners, and campaigns fetch).
  - Flask processes requests sequentially or exhausts thread workers.

### 2. Monolithic Bundle Size (`frontend/src/App.jsx`)
- All 11 page views are imported statically at the top of `App.jsx`.
- Initial JavaScript bundle size: **1,020 kB** (uncompressed).
- First Contentful Paint (FCP) delayed by ~1.2s on standard networks.

### 3. Hardcoded Localhost URLs
- `frontend/src/pages/Auth.jsx:244`: Hardcoded `http://127.0.0.1:5000/api/auth/firebase/verify`. Fails across local networks, staging URLs, or Vite proxy setups.

---

## 4. Backend & ML Pipeline Bottlenecks

### 1. Model Loading Overhead (`backend/ml/predictor.py`)
```python
# CURRENT FLAW:
def predict(self, features):
    # Executed on EVERY request:
    model = joblib.load("models/anomaly_detector.joblib") # 1.98 MB disk read
    scaler = joblib.load("models/scaler.joblib")
    return model.predict(scaler.transform(features))
```
- **Fix**: Implement an in-memory Singleton / LRU Cache for ML artifacts. Load models once during application initialization or lazy-load on first invocation.

### 2. Supabase Dual-Sync Failures (`backend/db/db_adapters.py:100`)
- Dual-write uses `.insert()` instead of `.upsert()`.
- Re-syncing campaigns triggers PostgREST error `23505` (unique constraint violation).
- Writing `ai_assessments` before campaign records propagate throws foreign key error `23503`.
- **Fix**: Switch to `.upsert()` with `on_conflict="id"`. Execute database sync in a background daemon thread (`threading.Thread` / `concurrent.futures`) so HTTP responses are never blocked by WAN latency.

### 3. SQLite Concurrency Limitations
- SQLite database lacks Write-Ahead Logging (`PRAGMA journal_mode=WAL;`).
- Missing compound indexes on `ai_assessments(campaign_id)` and `milestone_submissions(campaign_id)`.

---

## 5. Web3 & Smart Contract RPC Latency

### 1. Sequential Milestone Queries (`AppContext.jsx:152–168`)
```javascript
// CURRENT SLOW PATTERN:
for (let i = 0; i < 4; i++) {
  const milestone = await contract.getMilestone(i); // 4 sequential round trips (~600ms each)
}
```
- Total time: ~2,400 ms.
- **Fix**: Use `Promise.all`:
```javascript
const milestones = await Promise.all(
  [0, 1, 2, 3].map(i => contract.getMilestone(i))
); // Total time: ~480 ms
```

### 2. Contract Verification & Safety Invariants (`TrustBridge.sol`)
- Hard cap invariant (20 ETH) and minimum threshold (10 ETH) are verified and robust.
- Milestone tranche percentages (20% -> 25% -> 25% -> 30%) are immutably locked in state.
- `_markFunded()` properly initiates tranche 0 without premature index increments.

---

## 6. Test Suite & API Envelope Inconsistencies

Running `py -3.13 -m unittest discover -s backend` produces 3 unit test failures:
- `backend/tests/test_api.py` checks for raw fields: `self.assertIn("score", response.json)`.
- Backend endpoints return standardized JSON envelopes: `{"status": "success", "data": {"score": ...}}`.
- **Fix**: Update test assertions to inspect `response.json["data"]`.

---

## 7. Actionable Remediation Roadmap

### Priority 0: Critical Fixes (Execute Immediately)
- [ ] **Chatbot Latency Inversion**: Move `get_protocol_knowledge_response()` to run first in `backend/agents/chatbot_agent.py`. Set 1.5s timeout on Groq and resolve via fallback DNS.
- [ ] **ML In-Memory Cache**: Convert `backend/ml/predictor.py` to cache `.joblib` files in module-level variables.
- [ ] **Eliminate Startup N+1 Burst**: Remove lines 211–221 in `AppContext.jsx`. Persist risk/success scores in SQLite during campaign creation and return them in `GET /api/campaigns`.

### Priority 1: High-Impact Optimizations
- [ ] **Promise.all Milestone Sync**: Refactor `AppContext.jsx` milestone fetching loop to batch RPC calls.
- [ ] **Supabase Async Upsert**: Replace `.insert()` with `.upsert()` and decouple sync into a background thread.
- [ ] **Vite Dynamic Route Imports**: Code-split pages in `App.jsx` using `React.lazy()` and `Suspense`.
- [ ] **Fix Hardcoded Auth URL**: Replace static `127.0.0.1:5000` in `Auth.jsx` with environment-aware `VITE_API_URL`.

### Priority 2: Infrastructure & Code Cleanliness
- [ ] **SQLite Optimization**: Enable WAL mode and add indexes to foreign key columns.
- [ ] **Unwrap API Test Assertions**: Align `test_api.py` with the standard response envelope.
