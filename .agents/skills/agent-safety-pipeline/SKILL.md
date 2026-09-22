---
name: agent-safety-pipeline
description: >-
  Verify multi-agent orchestrations, zero-leakage ML training pipelines,
  structured JSON response envelopes, and mandatory AI advisory disclaimers.
---

# Agent Safety & Advisory Pipeline Skill

## Core Rules
1. **Mandatory Advisory Disclaimer**:
   Every ML and LLM endpoint response (`/api/predict`, `/api/risk`, `/api/ai/*`) MUST include:
   `"This is an AI-generated advisory assessment and not a financial verdict."`
2. **Zero ML Data Leakage**:
   Feature vectors strictly limited to launch-time data:
   `[goal_eth, duration_days, category_code, title_len, desc_len, milestone_count]`.
   Never train or infer with post-campaign variables (`final_raised`, `backers_count`).
3. **No Private Keys in Code or AI**:
   AI agents operate as read-only advisors. Never store private keys or issue signing commands from backend.
4. **Standard Envelope**:
   All Flask routes must return standardized payload:
   `{ "status": "success" | "error", "data": {...}, "error": str | null }`

## Verification Commands
1. **Run Backend Test Suite**:
   ```bash
   python test_routes.py
   ```
2. **Verify ML Calibration & Metrics**:
   ```bash
   python backend/ml/predictor.py
   ```
