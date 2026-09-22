# Orchestrator Task Context

## User Request Reference
Read full verbatim requirements in `d:/trustbridge/.agents/ORIGINAL_REQUEST.md`.

## Workspace
Project root: `d:/trustbridge`
Integrity mode: development

## Core Objectives
1. Groww-Inspired Clean FinTech UX (Protocol, Explore Campaigns, Escrow Vault Hub, My Contributions/Portfolio, Verifier Portal, Wallet Management).
2. End-to-End Functional Milestone Escrow & Contribution Flows (chips, gas calc, 20 ETH hard cap / 10 ETH min goal headroom, pending/confirmed/excess-refund, 4-tranche 20%->25%->25%->30% sequential milestone stepper with verifier reviews & releases).
3. AI Risk Telemetry & Transaction Intelligence (Nemotron-powered multi-agent AI risk score display, mandatory disclaimer: "This is an AI-generated advisory assessment and not a financial verdict.", interactive transaction history).
4. Full validation: `npm run build` cleanly in `frontend/`, no runtime exceptions/crashes across desktop & mobile, live MetaMask Sepolia wallet connection, live state updates for escrow vault & milestone approvals, AI risk endpoints (`/api/predict`, `/api/risk`, `/api/ai/*`) reliably populating.
