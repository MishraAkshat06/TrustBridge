# TrustBridge Test Infrastructure & Architecture Specification

**Document Version**: 2.0.0  
**Classification**: Test Engineering Specification & Coverage Matrix  
**Project**: TrustBridge (Groww-Style Web3 FinTech Crowdfunding & Escrow Platform)  
**Author**: `teamwork_preview_test_writer_e2e` (E2E Testing Track Lead)  
**Workspace**: `d:/trustbridge`  

---

## 1. Executive Summary & Test Philosophy

The TrustBridge E2E test suite is an **opaque-box, requirement-driven testing system** constructed to validate all functional, boundary, interaction, and lifecycle guarantees specified in `ORIGINAL_REQUEST.md` and `contracts/TrustBridge.sol`.

### Core Testing Invariants:
1. **Opaque-Box Verification**: Tests validate black-box behavioral contracts, mathematical invariants, state machine transitions, and design tokens rather than implementation internals.
2. **Zero Facade Integrity**: No dummy or tautological assertions. All tests exercise real computational logic, mathematical division/basis point calculations, and non-reentrant state transitions.
3. **Explicit Expected Output Derivation**: Every test derives its expected output from an authoritative oracle:
   - Smart contract mechanics from `contracts/TrustBridge.sol` (10 ETH minGoal, 20 ETH hardCap, 4-tranche payout: 20%/25%/25%/30%, 1-retry milestone review grace period).
   - Theme styling from `ORIGINAL_REQUEST.md` (Groww Light: `#FAF9F6` canvas, `#00D09C` emerald; Binance Dark: `#0B0E11` canvas, `#F0B90B` gold).
   - Regulatory and AI invariants (`"This is an AI-generated advisory assessment and not a financial verdict."`).

---

## 2. Test Architecture & Directory Layout

```
d:/trustbridge/
├── package.json                         # Root test execution script ("npm test", "npm run test:e2e")
├── frontend/
│   └── package.json                     # Frontend script binding ("npm run test:e2e")
├── tests/
│   ├── runner.js                        # Master CLI test runner & reporter
│   ├── helpers/
│   │   ├── assert.js                    # Assertion library (assert, assertEqual, assertCloseTo, etc.)
│   │   ├── contract_oracle.js           # Authoritative state machine & arithmetic oracle for TrustBridge.sol
│   │   ├── theme_oracle.js              # Authoritative styling & token oracle for Groww/Binance themes
│   │   └── state_oracle.js              # Frontend state, gas estimation, wallet sync, and AI engine oracle
│   ├── tier1_features/
│   │   ├── theme_toggle.test.js         # Tier 1.1: Groww Light / Binance Dark theme toggle (6 tests)
│   │   ├── navigation_routes.test.js    # Tier 1.2: 6 Core navigation routes & zero blank screens (7 tests)
│   │   ├── escrow_contribution.test.js  # Tier 1.3: Escrow contribution & headroom tracking (5 tests)
│   │   ├── four_tranche_stepper.test.js # Tier 1.4: 4-Tranche sequential milestone stepper (5 tests)
│   │   ├── ai_risk_telemetry.test.js    # Tier 1.5: AI risk telemetry & mandatory disclaimer (5 tests)
│   │   └── metamask_sepolia_sync.test.js# Tier 1.6: MetaMask Sepolia live sync & balance (5 tests)
│   ├── tier2_boundaries/
│   │   ├── hard_cap_headroom.test.js    # Tier 2.1: 20 ETH hard cap headroom boundaries (6 tests)
│   │   ├── min_goal_threshold.test.js   # Tier 2.2: 10 ETH minimum goal threshold & refunds (5 tests)
│   │   ├── excess_refund_split.test.js  # Tier 2.3: In-block excess-refund split calculation (5 tests)
│   │   └── milestone_retry_limit.test.js# Tier 2.4: Milestone 1-retry grace period limit (5 tests)
│   ├── tier3_interactions/
│   │   └── cross_feature_interactions.test.js # Tier 3: Pairwise cross-feature interactions (5 tests)
│   └── tier4_scenarios/
│       └── real_world_workloads.test.js # Tier 4: Real-world crowdfunding lifecycle scenarios (4 tests)
├── TEST_INFRA.md                        # This infrastructure document
└── TEST_READY.md                        # Execution command & expected output reference
```

---

## 3. Comprehensive Test Coverage Matrix

| Test ID | Tier | Target Feature / Area | Verification Objective | Authoritative Source |
| :--- | :--- | :--- | :--- | :--- |
| **Theme 1.1** | Tier 1 | Theme Toggle | Default initialization in Groww FinTech Light mode (`#FAF9F6`, emerald `#00D09C`) | `ORIGINAL_REQUEST.md` (R1 & update) |
| **Theme 1.2** | Tier 1 | Theme Toggle | Toggle to Binance Pro Dark (`#0B0E11`, signature gold `#F0B90B`, card `#181A20`) | `ORIGINAL_REQUEST.md` (R1 & update) |
| **Theme 1.3** | Tier 1 | Theme Toggle | Round-trip toggling cleanly adds/removes `.dark` class from root document | `ORIGINAL_REQUEST.md` (R1 & update) |
| **Theme 1.4** | Tier 1 | Theme Toggle | `localStorage` persistence and session rehydration | UI/UX Survey 2 § 3.4 |
| **Theme 1.5** | Tier 1 | Theme Toggle | Design token contrast and styling invariants between Groww and Binance modes | UI/UX Survey 2 § 3.1–3.3 |
| **Theme 1.6** | Tier 1 | Theme Toggle | Adversarial resilience against corrupted storage values with safe fallback | Robustness Invariant |
| **Nav 2.1** | Tier 1 | Core Navigation | Protocol Landing (`/`) resolves with TVL and escrow statistics | `ORIGINAL_REQUEST.md` (R1) |
| **Nav 2.2** | Tier 1 | Core Navigation | Explore Marketplace (`/explore`) loads filters, search, and dual progress bars | `ORIGINAL_REQUEST.md` (R1) |
| **Nav 2.3** | Tier 1 | Core Navigation | Escrow Vault Hub (`/campaign/:id`) resolves with stepper and contribution panel | `ORIGINAL_REQUEST.md` (R1) |
| **Nav 2.4** | Tier 1 | Core Navigation | My Contributions / Portfolio (`/contributions`) displays escrowed backer positions | `ORIGINAL_REQUEST.md` (R1) |
| **Nav 2.5** | Tier 1 | Core Navigation | Verifier Chamber (`/verifier`) loads pending milestones and proof review controls | `ORIGINAL_REQUEST.md` (R1) |
| **Nav 2.6** | Tier 1 | Core Navigation | Wallet Management (`/wallet`) loads Sepolia sync and non-custodial disclosures | `ORIGINAL_REQUEST.md` (R1) |
| **Nav 2.7** | Tier 1 | Core Navigation | Zero blank screen guarantee across all 10 registered routes | `ORIGINAL_REQUEST.md` (R1) |
| **Escrow 3.1** | Tier 1 | Escrow Contribution | Dynamic headroom tracking against 20 ETH cap and 10 ETH min goal | `contracts/TrustBridge.sol` |
| **Escrow 3.2** | Tier 1 | Escrow Contribution | Quick-selection chips (`+0.25`, `+0.5`, `+1.0`, `+2.0`, `MAX`) update input | `ORIGINAL_REQUEST.md` (R2) |
| **Escrow 3.3** | Tier 1 | Escrow Contribution | Real-time dynamic gas calculation (48k gas base, Gwei rate, USD fee) | `ORIGINAL_REQUEST.md` (R2) |
| **Escrow 3.4** | Tier 1 | Escrow Contribution | Standard contribution workflow executes to `confirmed` state | `ORIGINAL_REQUEST.md` (R2) |
| **Escrow 3.5** | Tier 1 | Escrow Contribution | Over-cap contribution transitions to `excess-refund` state with split receipt | `contracts/TrustBridge.sol:134-147` |
| **Stepper 4.1**| Tier 1 | 4-Tranche Stepper | Exact mathematical tranche schedule (20%, 25%, 25%, 30% = 10,000 BPS) | `contracts/TrustBridge.sol:117-122` |
| **Stepper 4.2**| Tier 1 | 4-Tranche Stepper | Automatic unlock of Tranche 1 (20%) upon reaching 10 ETH without review | `contracts/TrustBridge.sol:166-172` |
| **Stepper 4.3**| Tier 1 | 4-Tranche Stepper | Proof submission moves state to `UNDER_REVIEW` then verifier approves | `contracts/TrustBridge.sol:178-214` |
| **Stepper 4.4**| Tier 1 | 4-Tranche Stepper | Pull-payment withdrawal enforces single-claim invariant (prevents double spend) | `contracts/TrustBridge.sol:237-251` |
| **Stepper 4.5**| Tier 1 | 4-Tranche Stepper | Full sequential progression across all 4 tranches reaches `COMPLETED` state | `contracts/TrustBridge.sol:209-211` |
| **AI 5.1** | Tier 1 | AI Risk Telemetry | Mandatory disclaimer string exact verbatim match | `ORIGINAL_REQUEST.md` (R3) |
| **AI 5.2** | Tier 1 | AI Risk Telemetry | Multi-agent ML success probability normalized in [0, 100]% range | Survey 3 § 1.3 |
| **AI 5.3** | Tier 1 | AI Risk Telemetry | Isolation Forest anomaly tiers trigger across LOW, MEDIUM, and HIGH thresholds | Survey 3 § 1.3 |
| **AI 5.4** | Tier 1 | AI Risk Telemetry | Evidence reviewer checklist audits IPFS, repository, and demo links | Survey 3 § 1.3 |
| **AI 5.5** | Tier 1 | AI Risk Telemetry | Resilient telemetry fallback when backend offline without exceptions | Survey 3 § 1.5 |
| **Wallet 6.1**| Tier 1 | MetaMask Sepolia | Connection updates account state with truncated address format | `ORIGINAL_REQUEST.md` (AC) |
| **Wallet 6.2**| Tier 1 | MetaMask Sepolia | Live balance formatted accurately to 4 decimals with BigInt precision | `ORIGINAL_REQUEST.md` (AC) |
| **Wallet 6.3**| Tier 1 | MetaMask Sepolia | Sepolia network check enforces Chain ID 11155111 / 0xaa36a7 | Survey 3 § 1.6 |
| **Wallet 6.4**| Tier 1 | MetaMask Sepolia | Event listeners react dynamically to `accountsChanged` and `chainChanged` | Survey 3 § 1.6 |
| **Wallet 6.5**| Tier 1 | MetaMask Sepolia | Disconnection clears state cleanly and resets balance to 0.0000 | Survey 3 § 1.6 |
| **HardCap 2.1**| Tier 2 | Hard Cap Boundary | Zero contribution initial state yields exact 20.00 ETH headroom | `contracts/TrustBridge.sol:45` |
| **HardCap 2.2**| Tier 2 | Hard Cap Boundary | Midpoint 14.50 ETH raised computes exact 5.50 ETH remaining headroom | `contracts/TrustBridge.sol:134` |
| **HardCap 2.3**| Tier 2 | Hard Cap Boundary | Infinitesimal boundary at 19.99 ETH allows exact 0.01 ETH completion | `contracts/TrustBridge.sol:134` |
| **HardCap 2.4**| Tier 2 | Hard Cap Boundary | Exact 20.00 ETH saturation reaches zero headroom and triggers FUNDED | `contracts/TrustBridge.sol:149` |
| **HardCap 2.5**| Tier 2 | Hard Cap Boundary | Subsequent contributions on saturated vault revert with "Hard cap reached" | `contracts/TrustBridge.sol:132` |
| **HardCap 2.6**| Tier 2 | Hard Cap Boundary | Massive 100 ETH deposit accepts only remaining headroom and refunds excess | `contracts/TrustBridge.sol:135` |
| **MinGoal 2.1**| Tier 2 | Min Goal Boundary | At 9.99 ETH (0.01 below min goal), campaign remains ACTIVE & Tranche 1 locked | `contracts/TrustBridge.sol:44` |
| **MinGoal 2.2**| Tier 2 | Min Goal Boundary | Exact 10.00 ETH reaches threshold and automatically unlocks Tranche 1 | `contracts/TrustBridge.sol:158` |
| **MinGoal 2.3**| Tier 2 | Min Goal Boundary | Mid-band 15.00 ETH raised successfully finalizes funding after deadline | `contracts/TrustBridge.sol:158` |
| **MinGoal 2.4**| Tier 2 | Min Goal Boundary | Campaign with 8.50 ETH (<10 ETH) at deadline transitions to FAILED state | `contracts/TrustBridge.sol:160` |
| **MinGoal 2.5**| Tier 2 | Min Goal Boundary | All contributors claim 100% pull-payment refunds when min goal is unmet | `contracts/TrustBridge.sol:265` |
| **Excess 2.1** | Tier 2 | Excess Split Boundary | Standard overflow split (2.0 accepted, 3.0 refunded) on 5.0 ETH input | `contracts/TrustBridge.sol:135` |
| **Excess 2.2** | Tier 2 | Excess Split Boundary | Micro-excess split on 0.05 ETH headroom accurately calculates 50/50 split | `contracts/TrustBridge.sol:135` |
| **Excess 2.3** | Tier 2 | Excess Split Boundary | Exact fill with zero excess generates no refund and saturates cap | `contracts/TrustBridge.sol:136` |
| **Excess 2.4** | Tier 2 | Excess Split Boundary | Underfill contribution accepts 100% of deposit with zero refund | `contracts/TrustBridge.sol:136` |
| **Excess 2.5** | Tier 2 | Excess Split Boundary | Fractional wei precision prevents rounding drift in excess refund split | Mathematical Invariant |
| **Retry 2.1** | Tier 2 | Milestone Retry | Initial submission sets attempt counter to 1 and state to UNDER_REVIEW | `contracts/TrustBridge.sol:191` |
| **Retry 2.2** | Tier 2 | Milestone Retry | First rejection marks milestone REJECTED but preserves grace period | `contracts/TrustBridge.sol:229` |
| **Retry 2.3** | Tier 2 | Milestone Retry | Second evidence submission increments attempt to 2 (grace period active) | `contracts/TrustBridge.sol:191` |
| **Retry 2.4** | Tier 2 | Milestone Retry | Second rejection triggers final rejection and transitions campaign to REFUNDABLE | `contracts/TrustBridge.sol:226` |
| **Retry 2.5** | Tier 2 | Milestone Retry | Third submission attempt strictly forbidden once grace period is exceeded | `contracts/TrustBridge.sol:188` |
| **Cross 3.1** | Tier 3 | Cross-Feature | Theme toggle during active contribution preserves input, gas, and pending tx state | Cross-Feature Invariant |
| **Cross 3.2** | Tier 3 | Cross-Feature | Verifier approval in chamber dynamically reflects in Campaign Details stepper | Cross-Feature Invariant |
| **Cross 3.3** | Tier 3 | Cross-Feature | In-block excess refund generates dual ledger events and exportable CSV audit log | Cross-Feature Invariant |
| **Cross 3.4** | Tier 3 | Cross-Feature | MetaMask account switch dynamically rebinds address, balance, and backer table | Cross-Feature Invariant |
| **Cross 3.5** | Tier 3 | Cross-Feature | AI Risk telemetry badge synchronized symmetrically between Explore and Vault Hub | Cross-Feature Invariant |
| **Scenario 4.1**| Tier 4 | Real-World Workload| Golden-path end-to-end lifecycle executes to completion with 0 escrow drift | Full Lifecycle Spec |
| **Scenario 4.2**| Tier 4 | Real-World Workload| Underfunded campaign at deadline fails gracefully and honors 100% principal refunds | Full Lifecycle Spec |
| **Scenario 4.3**| Tier 4 | Real-World Workload| Milestone rejection triggers pro-rata pull-payment settlement with exact parity | `contracts/TrustBridge.sol:268` |
| **Scenario 4.4**| Tier 4 | Real-World Workload| Concurrent backer race locks 20 ETH hard cap, refunds 5 ETH excess, and exports audit | Full Lifecycle Spec |

**Total Comprehensive Test Cases**: 62  
**Total Test Suites**: 12  
**Test Categories Covered**: Tier 1 (33), Tier 2 (20), Tier 3 (5), Tier 4 (4)  

---

## 4. Authoritative Oracle Implementation

The test suite incorporates three self-contained mathematical and behavioral oracles located in `tests/helpers/`:

1. **`TrustBridgeContractOracle`** (`tests/helpers/contract_oracle.js`):
   - Exactly mirrors `contracts/TrustBridge.sol` byte-for-byte in state logic, modifier behavior (`onlyCreator`, `onlyVerifier`, `nonReentrant`), and event logs.
   - Computes pro-rata pull-payment refund balances:
     $$\text{refundAmount} = \frac{\text{contribution} \times \text{remainingEscrow}}{\text{totalRaised} - \text{totalWithdrawn}}$$
   - Tracks 4 tranches with basis points: $[2000, 2500, 2500, 3000]$.

2. **`ThemeManagerSimulator`** (`tests/helpers/theme_oracle.js`):
   - Enforces design system token specifications:
     - **Groww Light**: `--bg-canvas: #FAF9F6`, `--bg-surface: #FFFFFF`, `--accent-brand: #00D09C`, `--accent-secondary: #009379`.
     - **Binance Dark**: `--bg-canvas: #0B0E11`, `--bg-surface: #181A20`, `--accent-brand: #F0B90B`, `--border-subtle: #2B313A`.
   - Validates class toggling on `document.documentElement` and persistence in `localStorage`.

3. **`StateOracle`** (`tests/helpers/state_oracle.js`):
   - Models Web3 wallet synchronization, Gas estimation algorithms across priority tiers (Low, Medium, Fast), and Nemotron multi-agent risk calculations with mandatory disclaimer propagation.

---

## 5. Execution Environment & Dependencies

- **Runtime**: Node.js v24.18.1 (or any Node.js >= 18 with native ESM support).
- **Dependencies**: 0 external npm packages required. The test runner uses native ES modules (`"type": "module"`) and built-in error diagnostics.
- **Portability**: Verified for execution on Windows (PowerShell/CMD), macOS (zsh), and Linux (bash/sh).
- **Execution CLI Command**:
  ```bash
  node tests/runner.js
  ```
  or from project root:
  ```bash
  npm test
  ```
  or from `frontend/`:
  ```bash
  npm run test:e2e
  ```
