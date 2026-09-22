# TrustBridge Workspace Directives & Engineering Standards

## 1. Architectural Boundaries & Non-Negotiables
- **Settlement & Smart Contracts**: Solidity `^0.8.20`, Ethereum Sepolia testnet (Chain ID `11155111`).
- **Escrow Invariants**: Hard cap strictly **20 ETH**; Minimum funding goal strictly **10 ETH**.
- **Tranche Release Schedule**: 4-tranche sequential milestone payouts (20% initial, 25% milestone 2, 25% milestone 3, 30% milestone 4) summing to exactly 10,000 basis points.
- **Pull-Payment Security**: All contract withdrawals (`withdrawTranche`, `claimRefund`) use the pull-payment pattern with `nonReentrant` guards.
- **AI & Security Policy**: AI models and LLM agents run off-chain in Python Flask. AI acts purely as an advisory decision-support layer and **never holds private keys, signs transactions, or executes financial disbursements**.
- **Mandatory Disclaimer**: Every ML prediction and AI agent response MUST include:
  > *"This is an AI-generated advisory assessment and not a financial verdict."*

---

## 2. Decoupled Component Architecture
- `/contracts`: Hardhat environment, Solidity contracts, and EVM lifecycle test suites (`npx hardhat test`).
- `/frontend`: React 19 + Vite 8 SPA, Tailwind CSS v4 CSS-first design system (Groww Light & Binance Dark), Ethers.js v6.
- `/backend`: Python 3.13 Flask REST API, Scikit-learn + Isolation Forest ML pipeline, Supabase / SQLite dual-adapter, Multi-Agent orchestration.

---

## 3. Engineering Quality & Testing Gates
- **Contract Tests**: 100% pass rate on EVM state machine and invariant test suites (`npx hardhat test`).
- **Client E2E Suite**: Zero-facade opaque-box simulators (`node tests/runner.js`).
- **Backend Route Integrity**: Server-side role derivation and standardized `{ status, data, error }` API envelopes (`python test_routes.py`).
- **A11y & Contrast**: Strict WCAG 2.2 AA compliance across all UI components and high-contrast tabular numerals for all on-chain values.
