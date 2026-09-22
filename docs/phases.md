# TrustBridge — Engineering Roadmap & Phased Execution Plan

## Executive Architecture Summary
TrustBridge is an AI-assisted, blockchain-enforced crowdfunding platform combining:
1. **On-Chain Settlement**: Solidity `^0.8.20` escrow deployed on Ethereum Sepolia.
2. **Deterministic Rules**: Strict 20 ETH hard cap, 10 ETH minimum goal, in-block excess refunds, and 4-tranche pull-payment releases (20% / 25% / 25% / 30%).
3. **Advisory AI/ML**: Scikit-learn success classification, Isolation Forest anomaly scoring, and LLM-powered multi-agent evidence review.
4. **Institutional FinTech Interface**: React 19 + Vite 8 SPA with dual-theme design (Groww Light & Binance Pro Dark) and WCAG 2.2 AA compliance.

---

## Phase 1: Core Smart Contract Escrow (Completed)
- **`contracts/TrustBridge.sol`**:
  - Enforce 20 ETH hard cap with same-transaction automatic excess refunds.
  - Implement 10 ETH minimum funding threshold.
  - 4-Tranche sequential milestone state machine with basis points: 2000 (20%), 2500 (25%), 2500 (25%), 3000 (30%).
  - Pull-payment pattern (`withdrawTranche`, `claimRefund`) guarded by `nonReentrant`.
  - Fix B-01 milestone index deadlock in `_markFunded()` to advance `currentMilestoneIndex = 1`.
- **EVM Hardhat Test Suite**:
  - 18/18 passing tests covering full lifecycles, excess refund splits, reentrancy defense, and unauthorized access.

---

## Phase 2: Backend, Machine Learning & Agentic AI (Completed)
- **Flask REST API (`backend/app.py`)**:
  - Endpoints for campaign creation, metadata, KYC simulation, ML prediction, risk scoring, and agentic explanations.
  - Dual-adapter persistence (Supabase PostgreSQL + local SQLite fallback).
  - Server-side role derivation on `/api/auth/google` to prevent unauthorized admin escalation.
- **Machine Learning Subsystem (`backend/ml/`)**:
  - Binary classification pipeline (`classifier.joblib`) with zero launch-time data leakage.
  - Isolation Forest anomaly detection (`anomaly_detector.joblib`) categorizing LOW / MEDIUM / HIGH risk tiers.
- **Multi-Agent Orchestration (`backend/agents/`)**:
  - `CampaignAnalyzer`, `RiskAnalyst`, `EvidenceReviewer`, and `Explainer` agents.
  - Mandatory regulatory disclaimer on 100% of AI outputs.

---

## Phase 3: Institutional FinTech Frontend & Theming (Completed)
- **Component Architecture (`frontend/src/components/`)**:
  - `CountBox`: Tabular metric widgets for escrow balance, cap headroom, and days left.
  - `FundCard`: 16:9 campaign cards with KYC badges, AI risk score chips, and dual progress meters.
  - `CustomButton`: Multi-variant action buttons with loading states.
  - `FormField`: Accessible form controls with validation.
  - `Loader`: Glassmorphism transaction status overlay.
- **Dual-Theme Design System (`frontend/src/index.css`)**:
  - Groww FinTech Light (Default): `#FAF9F6` canvas, `#00D09C` emerald accent, dark labels on brand buttons (8.88:1 AAA ratio).
  - Binance Pro Dark: `#0B0E11` canvas, `#181A20` surface, `#F0B90B` gold accent.
  - Blocking script in `<head>` preventing Flash of Wrong Theme (FOWT).
- **Client Simulator Suite (`tests/runner.js`)**:
  - 59/59 passing tests validating state machine transitions, headroom tracking, and token styling.

---

## Phase 4: Production Deployment & Live Verification (Active)
- **Sepolia Testnet Contract**: `0x7c49bCc4A869480Bf3BAd72acf826667066c58d2`
- **Supabase Cloud Backend**: Connected and synchronized with RLS policies.
- **Continuous Quality Gate**:
  - Automated client simulation (`npm test`)
  - Automated smart contract test run (`npx.cmd hardhat test`)
  - Automated backend API route integrity test (`python test_routes.py`)