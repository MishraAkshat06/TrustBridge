# TrustBridge — Frontend UI/UX Architecture & Design Specification

This document details the complete institutional-grade frontend design system, routing architecture, component breakdown, and design rules for **TrustBridge**, an AI-assisted and blockchain-enforced crowdfunding platform.

---

## 1. Aesthetic Foundation: "Institutional Fintech"

To ensure TrustBridge avoids looking like an AI-generated template or a generic neon Web3 prototype, it adopts the clean, dense, data-first visual grammar of institutional platforms like **Binance, Groww, and Kickstarter**.

### 1.1 Color Palette & Design Tokens

| Token Name | Hex Code | Tailwind Equivalent | Purpose & Application |
| :--- | :--- | :--- | :--- |
| **Canvas Base** | `#0B0E14` | `slate-950` | Primary app background (near-black fintech navy) |
| **Surface Card** | `#121721` | `slate-900` | Content containers, card bodies, table wrappers |
| **Elevated Surface** | `#1A2130` | `slate-800` | Modals, transaction popovers, sticky panels |
| **Hairline Border** | `#262F40` | `border-slate-800/80` | Clean structural dividers (1px solid rgba(255,255,255,0.08)) |
| **Primary Accent** | `#10B981` | `emerald-500` | Funding progress, approvals, positive confirmations |
| **Protocol Accent** | `#3B82F6` | `blue-500` | Web3 states, contract links, Sepolia network badges |
| **Secondary Text** | `#94A3B8` | `slate-400` | Metadata, timestamps, helper descriptions |
| **Risk: Low** | `#10B981` | `emerald-400` | High model confidence, consistent campaign data |
| **Risk: Medium** | `#F59E0B` | `amber-400` | Needs review, partial deliverables, tight runway |
| **Risk: High / Flag** | `#EF4444` | `rose-500` | Critical anomalies, missing proofs, contract reverts |

### 1.2 Typography Hierarchy
- **Primary Interface Font:** `Inter` or `Geist Sans` (`font-sans`), tracked tightly (`tracking-tight`) for high readability.
- **Financial & On-Chain Monospace:** `JetBrains Mono` or `Roboto Mono` (`font-mono`). **Mandatory** for all ETH amounts, wallet addresses, transaction hashes, gas metrics, and milestone percentages.
- **Section Headers:** Uppercase tracked badges (`text-xs uppercase tracking-widest text-slate-400 font-semibold`) paired with concise, medium-weight headings. Avoid oversized generic hero typography.

---

## 2. Information Architecture & Routing

```
trustbridge-frontend/
├── /                              # Institutional Protocol Landing Page
├── /explore                       # Marketplace & Discovery Hub (Filters, Cards)
├── /campaigns/:id                 # Escrow Command Center (60/40 Split View)
├── /campaigns/create              # Multi-Step Pitch & Milestone Creation Wizard
├── /dashboard/creator             # Creator Workspace & Milestone Evidence Submission
├── /dashboard/contributor         # Backer Portfolio, Escrow Status & Refund Terminal
└── /verifier                      # Authorized Verifier Audit Chamber
```

---

## 3. Detailed Page Blueprints

### 3.1 Landing Page (`/`) — Institutional Protocol Showcase
1. **Global Header:**
   - Network status pill: `🟢 Sepolia Testnet (Chain ID: 11155111)`.
   - Aggregated protocol statistics: `Total Escrowed: 48.50 ETH`, `Active Campaigns: 12`, `Disbursed Tranches: 26`.
   - High-contrast wallet trigger: `Connect MetaMask`.
2. **Hero Section:**
   - Value Proposition: *"Risk-Aware Crowdfunding Backed by AI Evidence Audits and Programmable Milestone Escrow"*.
   - Live Event Ticker (Terminal style): Scrolling on-chain log displaying contributions, approvals, and milestone submissions in real-time.
3. **Interactive 4-Step Visualizer:**
   - **Step 1: AI Launch Assessment** (ML success score + textual anomaly analysis).
   - **Step 2: Smart Contract Escrow** (Backer contributions locked; 10 ETH goal, 20 ETH hard-cap).
   - **Step 3: Milestone Evidence** (Creator builds and submits code/demo proofs).
   - **Step 4: Verifier Release** (Human verifier reviews AI audit checklist and unlocks next tranche).
4. **Curated Showcase:** 3 featured campaigns with progress bars, hard-cap proximity meters, and ML risk badges.

### 3.2 Explore / Discovery Hub (`/explore`)
1. **Filter & Sort Console:**
   - Search bar for title, creator address, or tag.
   - Category filter pills: `All`, `Hardware/IoT`, `Cleantech`, `Web3 Protocols`, `Open Source`.
   - Risk status toggle: `Low Risk Only`, `Identity Verified`, `All`.
2. **Campaign Grid Cards:**
   - **Header:** Category tag + Off-chain Verification checkmark (`✓ KYC Verified`).
   - **Body:** Campaign title, 2-line summary, truncated creator address (`0x1a2b...3c4d`).
   - **Dual Progress Bar:** Visual indicator showing current total vs. 10 ETH soft goal marker vs. 20 ETH hard-cap ceiling.
   - **AI Risk Badge:** Discrete chip displaying `🟢 84% Success Score | Low Risk Profile`.
   - **Action:** Primary button navigating to `/campaigns/:id`.

### 3.3 Campaign Details (`/campaigns/:id`) — The Escrow Command Center
Structured as a dense **60/40 Two-Column Layout**:

#### Left Column (60% — Campaign Media & Evidence Chamber)
- **Campaign Pitch & Specifications:** Comprehensive overview, hardware specs, team disclosures.
- **AI Decision Support Card:**
  - *ML Success Prediction:* Model probability based on launch parameters.
  - *Structural Consistency Audit:* Breakdown of budget realism, deliverable clarity, and potential timeline bottlenecks.
  - *Academic Disclaimer:* Monospace callout: `"Advisory AI analysis only. Does not constitute an endorsement or legal fraud verdict."`
- **Milestone Escrow Timeline:**
  - Interactive multi-stage accordion:
    - **Tranche 1 (20%):** Upfront release upon campaign funding.
    - **Tranche 2 (25%):** Core prototype / architectural release.
    - **Tranche 3 (25%):** Integration testing and test bench report.
    - **Tranche 4 (30%):** Production readiness & final delivery.
  - For each milestone: Deliverable scope, submitted proof links (GitHub/IPFS), AI evidence audit summary, and verifier approval signature.

#### Right Column (40% — Sticky Financial Terminal)
- **Escrow Telemetry Box:**
  - `Raised: 14.50 ETH` / `Hard Cap: 20.00 ETH` (with remaining capacity: `5.50 ETH`).
  - Progress bar dynamically colored (Emerald under cap, Amber near cap, Red at cap).
  - Verified smart contract link pointing to Sepolia Etherscan.
- **Order / Contribution Box:**
  - Numeric input field for ETH amount with quick-select increments (`+0.5 ETH`, `+1.0 ETH`, `+2.0 ETH`, `Max Cap`).
  - Automated refund disclaimer: `"Any contribution exceeding the 20 ETH cap will have excess automatically refunded by the contract."`
  - Primary CTA: `Contribute ETH` (triggers MetaMask transaction).
  - Emergency / Refund Action: Secondary outlined button `Request Refund` (enabled automatically if the deadline expires or a milestone is rejected).

### 3.4 Creator Workspace (`/dashboard/creator`)
- **Escrow Vault Overview:** Live cards for `Total Raised`, `Funds Escrowed`, `Funds Claimed`, and `Next Claimable Tranche`.
- **Milestone Submission Drawer:** Select active milestone, attach GitHub repository/commit SHA, link demonstration documentation, and dispatch for review.
- **Tranche Claim Interface:** Displays unlocked tranches with active `Claim Tranche Funds` button invoking `creatorWithdraw()`.

### 3.5 Authorized Verifier Portal (`/verifier`)
- **Auditor Table:** Clean table listing pending milestone submissions across campaigns.
- **AI Evidence Inspector:** Structured modal comparing creator deliverables against initial commitments.
- **On-Chain Action Triggers:**
  - `Approve Milestone & Unlock Tranche` (executes verifier transaction on-chain).
  - `Reject Milestone / Flag Concerns` (triggers predefined freeze/refund path).

---

## 4. Anti-"AI Template" Engineering Rules

1. **Fixed Monospace Precision:** Never display raw floating numbers (e.g., `14.54234567 ETH`). Enforce `14.54 ETH` using `font-mono`.
2. **Deterministic Transaction States:** Avoid generic alerts. Implement a 4-state status drawer for all Web3 actions:
   - `1. Signature Request`: Prompting MetaMask signature.
   - `2. Broadcast Pending`: Transaction hash emitted; waiting for Sepolia block inclusion.
   - `3. Block Confirmation`: Mined on-chain; state updating.
   - `4. Reverted / Failure`: Exact contract revert reason rendered in a red error pill.
3. **Skeleton Loading Screens:** Replace generic spinning wheels with pulsing slate bars (`animate-pulse bg-slate-800/60`).
4. **Restrained Depth:** Rely on 1px subtle borders (`border-slate-800`) and slight backdrop blurs (`backdrop-blur-md`) rather than heavy multi-layer box shadows.
