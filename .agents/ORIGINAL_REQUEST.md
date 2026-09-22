# Original User Request

## 2026-09-18T20:36:16Z

Build a Groww-style Web3 FinTech crowdfunding & escrow platform in React with full end-to-end functionality, interactive portfolio and milestone tracking, and seamless live contract interactions.

Working directory: d:/trustbridge
Integrity mode: development

## Requirements

### R1. Groww-Inspired Clean FinTech User Experience
- Clean, accessible card-based visual design featuring soft surfaces, crisp typography, and uncluttered layout inspired by modern FinTech apps like Groww.
- Comprehensive navigation across Protocol, Explore Campaigns, Escrow Vault Hub, My Contributions/Portfolio, Verifier Portal, and Wallet Management.
- Zero blank screens, missing variables, or runtime exceptions across all routes.

### R2. End-to-End Functional Milestone Escrow & Contribution Flows
- Contribution modal with quick-selection chips, real-time gas calculation, dynamic headroom tracking against the strict 20 ETH hard cap and 10 ETH minimum goal.
- Real-time transaction feedback with pending, confirmed, and excess-refund states.
- 4-Tranche sequential milestone stepper (20% -> 25% -> 25% -> 30%) with verifier review status and release triggers.

### R3. AI Risk Telemetry & Transaction Intelligence
- Nemotron-powered multi-agent AI risk score display with anomaly detection indicators.
- Prominently integrated mandatory disclaimer: "This is an AI-generated advisory assessment and not a financial verdict."
- Interactive transaction history with exportable records and audit logs.

## Acceptance Criteria

### Visual & Functional Quality
- [ ] Application builds cleanly via `npm run build` in `frontend/`.
- [ ] All pages render properly without ReferenceError or crashes on desktop and mobile viewports.
- [ ] Wallet connection via MetaMask Sepolia properly updates live account address and balance.

### Core Workflow Validation
- [ ] User can contribute ETH to campaigns with immediate escrow vault total updates and milestone progress calculation.
- [ ] Campaign creator and verifier actions (milestone proof submission, validator consensus approval) execute with live visual state updates.
- [ ] AI risk assessment endpoints (`/api/predict`, `/api/risk`, `/api/ai/*`) reliably populate risk telemetry across campaigns.

## 2026-09-18T20:36:40Z

User update: Ensure dual-theme parity:
1. Light mode = Groww FinTech style (clean minimalist cards, crisp typography, emerald/teal accents).
2. Dark mode = Binance Pro style (deep dark #0B0E11 canvas, signature Binance Gold #F0B90B accents, high-density order/escrow telemetry, trading terminal cards).
Provide a seamless theme toggle in navbar so users can switch between Groww Light and Binance Dark.

## 2026-09-18T21:08:31Z

User directive:
1. Make all frontend features 100% interactive and working (contribution, 4-tranche verifier approval, refund claim, campaign creation, AI risk reports).
2. Integrate backend: Ensure frontend services/api.js actively calls Flask backend on http://localhost:5000 (/api/campaigns, /api/predict, /api/risk, /api/ai/*).
3. Enable Sign in with Google: Implement functional Google SSO flow (with realistic account picker modal, storing Google profile, avatar, and authenticated session).

