# Web3 Escrow, Milestone Governance & AI Risk Telemetry Survey Report

## 1. Observation

Direct examination of the codebase at `d:/trustbridge` across smart contracts, Python backend, and React frontend yields the following findings across the 6 mission areas:

---

### 1.1 Escrow & Contribution Mechanics
- **Contribution UI & Modal State**:
  - In `frontend/src/pages/CampaignDetails.jsx` (lines 407–498), the contribution interface is implemented strictly as an inline card in the right column rather than a dedicated, focusable modal or drawer.
  - In `frontend/src/App.jsx` (lines 56–58, 67–83), a secondary top-level banner transaction state (`txStep`, `txDetails`) exists, but there is no modular contribution dialog or workflow overlay.
- **Quick-Selection Chips**:
  - `CampaignDetails.jsx` (line 454) provides quick-select buttons `[0.5, 1.0, 2.0, 5.0]`. When clicked, `handleQuickSelect` (line 66) sets the input value directly. However, it does not validate against remaining headroom before setting the value, nor does it calculate cumulative amounts if clicked repeatedly.
- **Gas Estimation**:
  - Neither `CampaignDetails.jsx` nor `AppContext.jsx` performs gas estimation. There is no call to `provider.estimateGas()` or fallback calculation for Sepolia gas costs (e.g., standard transfer 21,000 gas, escrow contract interaction ~45,000–65,000 gas, Gwei rate, estimated USD fee).
- **Headroom Tracking (10 ETH Min Goal vs. 20 ETH Hard Cap)**:
  - `CampaignDetails.jsx` (lines 59–65) defines:
    ```javascript
    const minGoal = c.goal || 10.0;
    const hardCap = c.hardCap || 20.0;
    const totalRaised = c.totalRaised || 14.50;
    const remaining = Math.max(0, hardCap - totalRaised);
    const progressPercent = Math.min(100, Math.round((totalRaised / hardCap) * 100));
    const minGoalPercent = Math.min(100, Math.round((minGoal / hardCap) * 100)); // 50%
    ```
  - The progress bar (lines 215–235) has an amber tick marker at `minGoalPercent` (50%), but lacks explicit quantitative badges for:
    - Headroom remaining to Minimum Threshold (10.0 ETH).
    - Headroom remaining to Maximum Capacity (20.0 ETH).
    - Dynamic excess preview when user input exceeds `remaining`.
- **Transaction Feedback States (Pending / Confirmed / Excess-Refund)**:
  - In `CampaignDetails.jsx` (lines 75–84), contribution submission uses a primitive `setTimeout` and a string `txSuccessMsg`.
  - In `AppContext.jsx` (lines 122–171), `contributeToCampaign` computes:
    ```javascript
    const remaining = c.hardCap - c.totalRaised;
    accepted = Math.min(val, remaining);
    refunded = val - accepted;
    ```
    and returns a plain message string:
    ```javascript
    msg: refunded > 0 
      ? `Accepted ${accepted.toFixed(2)} ETH. Automatically refunded ${refunded.toFixed(2)} ETH excess!`
      : `Successfully contributed ${accepted.toFixed(2)} ETH!`
    ```
  - There is no structured UI state machine for `IDLE` -> `AWAITING_SIGNATURE` -> `PENDING` (with spinning blocks and block explorer link) -> `CONFIRMED` -> `EXCESS_REFUND` (showing exact split receipt cards: ETH Locked vs. ETH Refunded).

---

### 1.2 4-Tranche Sequential Milestone Stepper (20% -> 25% -> 25% -> 30%)
- **On-Chain Contract Implementation (`contracts/TrustBridge.sol`)**:
  - `TrustBridge.sol` (lines 44–46, 117–122) implements the exact 4-tranche schedule:
    ```solidity
    uint256 public constant minGoal = 10 ether;
    uint256 public constant hardCap = 20 ether;
    uint256 public constant TOTAL_BPS = 10000;

    // Tranche schedule: 20%, 25%, 25%, 30%
    milestones[0] = Milestone(m1Title, "", 2000, MilestoneState.PENDING, 0, false);
    milestones[1] = Milestone(m2Title, "", 2500, MilestoneState.PENDING, 0, false);
    milestones[2] = Milestone(m3Title, "", 2500, MilestoneState.PENDING, 0, false);
    milestones[3] = Milestone(m4Title, "", 3000, MilestoneState.PENDING, 0, false);
    ```
  - **Tranche 1 Trigger**: Line 170 in `_markFunded()` executes `milestones[0].state = MilestoneState.APPROVED;` immediately upon reaching `minGoal` (10 ETH) or `hardCap` (20 ETH). Tranche 1 (20%) is unlocked without needing manual verifier review.
  - **Tranches 2, 3, 4 Governance**:
    - Lines 178–196: `submitMilestoneEvidence(string ipfsHash)` by `creator`. Max 2 attempts (`submissionAttempts < 2`), transitions milestone to `UNDER_REVIEW`.
    - Lines 198–214: `approveMilestone(uint8 milestoneIndex)` by `verifier`. Verifies milestone is `UNDER_REVIEW`, emits `MilestoneApproved`, advances `currentMilestoneIndex`.
    - Lines 216–231: `rejectMilestone(uint8 milestoneIndex)` by `verifier`. If attempts >= 2, marks campaign `REFUNDABLE`.
    - Lines 237–251: `withdrawTranche(uint8 milestoneIndex)` allows `creator` pull-payment.
    - Lines 253–277: `claimRefund()` allows contributors to reclaim remaining balances.
- **Frontend Contract ABI Desynchronization**:
  - In `frontend/src/contractConfig.js` (lines 3–19), the ABI contains outdated single-milestone methods (`approveMilestone()`, `requestRefund()`, `creatorWithdraw()`, `MIN_GOAL()`, `HARD_CAP()`). It completely lacks the 4-tranche methods (`submitMilestoneEvidence`, `withdrawTranche`, `claimRefund`, `milestones`, `currentMilestoneIndex`).
- **Frontend Stepper & Verification Views**:
  - `CampaignDetails.jsx` (lines 265–344) has a hardcoded visual stepper. It displays 4 tranches (20%, 25%, 25%, 30%), but states are static and do not reflect creator submission or verifier approval actions.
  - `VerifierPortal.jsx` (lines 11–15, 85–92) only approves hardcoded milestone `2` of `campaigns[0]`. It lacks campaign selection, IPFS CID inspection, or proof verification.
  - `CreatorDashboard.jsx` (lines 4–136) contains the evidence submission form and withdrawal console, but is not linked in `App.jsx` navigation or sidebar!

---

### 1.3 AI Risk Telemetry & Mandatory Advisory Disclaimer
- **Multi-Agent Architecture (`backend/agents/`)**:
  - `campaign_analyzer.py`: Evaluates completeness (0–1), feasibility (0–1), roadmap quality (`STRONG`/`MODERATE`/`WEAK`), missing specifications, and technical strengths.
  - `risk_analyst.py`: Flags budget realism (0–1), timeline feasibility (`REALISTIC`/`AGGRESSIVE`), red flags, and mitigation points.
  - `evidence_reviewer.py`: Audits milestone proofs (repo URL, IPFS CID, demo URL) and outputs a verification checklist (`VERIFIED`/`PENDING_CHECK`).
  - `explainer.py`: Synthesizes ML probabilities and anomaly signals into plain-English backer summaries.
- **ML Models (`backend/ml/`)**:
  - `classifier.joblib`: Calibrated RandomForest on 6 zero-leakage launch features (`goal_eth`, `duration_days`, `category_code`, `title_len`, `desc_len`, `milestone_count`).
  - `anomaly_detector.joblib`: IsolationForest model calculating decision function score. Boundaries: `< -0.10` = `HIGH`, `< 0.05` = `MEDIUM`, `>= 0.05` = `LOW`.
  - `metrics.json`: Records model performance: Precision 0.7005, Recall 0.7562, F1 0.7273, ROC-AUC 0.7345, Brier Score 0.2095.
- **Mandatory Verbatim Disclaimer**:
  - In `backend/agents/__init__.py` (line 2):
    ```python
    ADVISORY_DISCLAIMER = "This is an AI-generated advisory assessment and not a financial verdict."
    ```
  - In `backend/app.py` (lines 131, 143): Returned with `/api/predict` and `/api/risk`.
  - In `frontend/src/pages/CampaignDetails.jsx` (line 396): Rendered verbatim inside amber advisory box.
  - In `frontend/src/pages/AiRiskReport.jsx` (line 39): Current text appends extra commentary: `"Mandatory Advisory Notice: This is an AI-generated advisory assessment and not a financial verdict. All smart contract financial transactions remain under exclusive non-custodial user control."` Must feature the verbatim sentence cleanly and prominently.
  - In `frontend/src/pages/AiRiskReport.jsx` (line 6): Bug found: `const { currentCampaign } = useApp();` is used, but `AppContext.jsx` exports `activeCampaign`. As a result, `currentCampaign` is always undefined and falls back to a dummy object!

---

### 1.4 Interactive Transaction History, Exportable Records & Audit Logs
- **Current State of `frontend/src/pages/TransactionLedger.jsx`**:
  - Lines 7–53: Contains a static hardcoded array `events`. It does not consume `activities` or user contributions from `AppContext.jsx`.
  - Line 2: Imports `Search` from `lucide-react`, but no search input is rendered in the UI.
  - Filter pills (lines 70–84) are limited to `['ALL', 'ContributionReceived', 'MilestoneApproved', 'TrancheWithdrawn']`. Missing `ExcessRefundIssued`, `MilestoneSubmitted`, `MilestoneRejected`, `ContributorRefundIssued`.
  - **Exporting**: There are no buttons or logic for exporting transaction history to CSV or JSON.
  - **Audit Logs**: No downloadable cryptographic audit log summary or block verification details.

---

### 1.5 AI API Endpoints & Mock/Live Integration
- **Backend Endpoints (`backend/app.py`)**:
  - `GET  /api/health`
  - `GET  /api/campaigns`
  - `POST /api/campaigns`
  - `GET  /api/campaigns/<campaign_id>`
  - `POST /api/predict`
  - `POST /api/risk`
  - `POST /api/ai/analyze`
  - `POST /api/ai/explain`
  - `POST /api/ai/review-evidence`
  - `POST /api/verify/kyc`
- **Frontend Service (`frontend/src/services/api.js`)**:
  - `api.js` wraps all endpoints with fallback data when fetch fails.
  - Gaps:
    - The frontend provides no visual telemetry or indicator showing whether it is connected to the live Python backend (`localhost:5000`) or operating in simulated fallback mode.
    - `CreateCampaign.jsx` (lines 14–24) does not call `api.js`; it simulates feasibility via `setTimeout` instead of calling `/api/predict` or `/api/ai/analyze`.

---

### 1.6 MetaMask Sepolia Wallet Connection & Live Synchronization
- **Wallet State (`frontend/src/context/AppContext.jsx`)**:
  - `connectWallet` (lines 77–106):
    ```javascript
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    setAccount(accounts[0]);
    ```
  - **Live Balance Synchronization Missing**: `provider.getBalance(accounts[0])` is **never called**. The state `balance` remains frozen at `'4.82'` from initial state initialization (line 18).
  - **Network Check Missing**: Does not verify whether `chainId === 11155111` (`0xaa36a7` Sepolia) or prompt network switching via `wallet_switchEthereumChain`.
  - **Lifecycle Listeners Missing**: No subscription to `window.ethereum.on('accountsChanged')` or `window.ethereum.on('chainChanged')`. If the user switches accounts in MetaMask, TrustBridge does not react.
  - `disconnectWallet` (line 22) sets account to empty and balance to `'0.00'`, but does not clear active session listeners.

---

## 2. Logic Chain

1. **Escrow Protection & Invariant Guarantee**:
   - The contract enforces two non-negotiable thresholds: `minGoal = 10 ETH` (threshold for project viability and Tranche 1 unlock) and `hardCap = 20 ETH` (absolute maximum escrow capacity).
   - In decentralized crowdfunding, over-subscription often occurs within a single block. If a campaign has 19 ETH and a backer sends 3 ETH, the contract must accept 1 ETH and immediately refund 2 ETH in the same transaction (`ExcessRefundIssued`).
   - The frontend must track headroom interactively so backers know their maximum allowable allocation before transacting, preview any excess refund split, and see real-time gas calculations.

2. **Milestone Governance & Capital Release Architecture**:
   - The 4-tranche schedule (20% -> 25% -> 25% -> 30%) distributes funding across concrete deliverables.
   - Tranche 1 (20%) is unlocked automatically upon meeting the 10 ETH threshold, giving creators initial working capital.
   - Tranches 2, 3, and 4 require explicit evidence submission (GitHub commits, IPFS proof hashes) and authorized verifier approval.
   - The contract grants a 1-retry grace period (max 2 attempts per milestone). If evidence is rejected twice, the campaign enters `REFUNDABLE` state, giving backers mathematical pull-payment refund guarantees.
   - The frontend must synchronize this entire lifecycle across Creator Workbench, Verifier Chamber, and Campaign Stepper.

3. **AI Risk Telemetry & Ethical Invariants**:
   - The Nemotron multi-agent pipeline provides quantitative (RandomForest success probability, IsolationForest anomaly detection) and qualitative (pitch completeness, budget realism, roadmap quality) analytics.
   - Because AI risk evaluations are probabilistic and off-chain, regulatory compliance and ethical FinTech design mandate that AI outputs must never hold private keys, execute transactions, or act as definitive financial verdicts.
   - Thus, the mandatory disclaimer — `"This is an AI-generated advisory assessment and not a financial verdict."` — must be prominently displayed across all AI telemetry interfaces.

4. **Auditability, Transparency & Ledger Records**:
   - Backers, auditors, and creators require verifiable accounting.
   - The Transaction Ledger must reflect all on-chain events (`ContributionReceived`, `ExcessRefundIssued`, `MilestoneApproved`, `TrancheWithdrawn`, `ContributorRefundIssued`) in real time, with search, event filters, direct Sepolia Etherscan deep-linking, and exportable CSV/JSON downloads.

5. **MetaMask Sepolia Synchronization**:
   - A Web3 FinTech application must reflect the user's actual on-chain identity and Sepolia ETH balance in real time.
   - Calling `provider.getBalance()`, formatting with `ethers.formatEther()`, enforcing Chain ID `11155111`, and listening to `accountsChanged` / `chainChanged` events ensures true Web3 fidelity.

---

## 3. Specifications for Implementation

### 3.1 Escrow & Contribution Modal Specification
- **Component**: `frontend/src/components/ContributionModal.jsx` (accessible from `CampaignDetails.jsx` and `Explore.jsx`).
- **Input & Quick-Selection Chips**:
  - Quick chips: `+0.25 ETH`, `+0.5 ETH`, `+1.0 ETH`, `+2.0 ETH`, and `MAX` (auto-fills exact remaining headroom to 20 ETH hard cap).
  - Validation: Real-time calculation of remaining headroom to hard cap (`hardCap - totalRaised`) and min goal (`minGoal - totalRaised`).
- **Dynamic Gas Estimation**:
  - Compute gas estimate dynamically:
    - Base gas limit: `48,000` units for `TrustBridge.contribute()`.
    - If `window.ethereum` and connected, call `provider.getFeeData()` to get current `gasPrice` / `maxFeePerGas`.
    - Display estimated gas fee: e.g., `~0.0012 ETH ($3.85 USD)` with a low/medium/fast network priority indicator.
- **Three-State Transaction Workflow (`pending` / `confirmed` / `excess-refund`)**:
  - `STATE_IDLE`: Input amount, inspect gas, preview headroom.
  - `STATE_PENDING`:
    - Shows spinning transaction loader.
    - Displays: "Waiting for Sepolia block confirmation...".
    - Displays mock or live transaction hash with direct link to Sepolia Etherscan: `https://sepolia.etherscan.io/tx/${txHash}`.
  - `STATE_CONFIRMED`:
    - Displayed when `amount <= headroom`.
    - Green verification badge, confirmed block number, contribution amount, new vault total, and link to view in "My Contributions".
  - `STATE_EXCESS_REFUND`:
    - Displayed when `amount > headroom`.
    - Dual-receipt breakdown:
      - **Locked in Escrow**: `acceptedAmount.toFixed(4)} ETH` (Campaign reached 20.00 ETH Hard Cap).
      - **In-Block Refund**: `refundedAmount.toFixed(4)} ETH` (Returned immediately to your wallet address).
      - Note: "Automatic in-block refund executed by TrustBridge smart contract."

---

### 3.2 4-Tranche Milestone Governance Specification
- **Tranche Breakdown**:
  | Tranche | Percentage | Basis Points (BPS) | Allocation (at 20 ETH Cap) | Allocation (at 10 ETH Min Goal) | Unlock Condition |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | **Tranche 1** | **20%** | 2000 | 4.00 ETH | 2.00 ETH | **Automatic upon campaign meeting 10 ETH Min Goal (`_markFunded`)** |
  | **Tranche 2** | **25%** | 2500 | 5.00 ETH | 2.50 ETH | Creator submits proof -> Verifier consensus approval |
  | **Tranche 3** | **25%** | 2500 | 5.00 ETH | 2.50 ETH | Creator submits proof -> Verifier consensus approval |
  | **Tranche 4** | **30%** | 3000 | 6.00 ETH | 3.00 ETH | Creator submits proof -> Verifier consensus approval -> Campaign Completed |
- **Milestone Stepper States**:
  - `LOCKED`: Future tranche, not yet reached.
  - `PENDING_SUBMISSION`: Active milestone awaiting creator deliverables.
  - `UNDER_REVIEW`: Evidence submitted (IPFS CID, GitHub repo, demo URL, notes); AI evidence reviewer analysis completed; awaiting human verifier signature.
  - `APPROVED`: Verifier signed on-chain; funds unlocked and claimable by creator via pull payment.
  - `REJECTED_RETRY`: Rejected on attempt 1; creator granted 1 retry grace period to submit updated evidence.
  - `REFUNDABLE`: Rejected on attempt 2 (grace period expired); smart contract locks into refund mode; all backers can withdraw proportional remaining balances.
- **Creator & Verifier Workflows**:
  - **Creator Workflow** (`CreatorDashboard.jsx` integrated into navigation):
    - Submit evidence form: IPFS CID hash, GitHub commit link, demo URL, deliverables description.
    - Tranche withdrawal button: Executes `withdrawTranche(milestoneIndex)` pull payment.
  - **Verifier Workflow** (`VerifierPortal.jsx`):
    - Select active campaign and pending milestone.
    - View AI Evidence Reviewer automated checklist (`/api/ai/review-evidence`).
    - Actions: "Sign On-Chain Approval" (`approveMilestone`) or "Reject / Request Revision" (`rejectMilestone`).

---

### 3.3 AI Risk Telemetry & Verbatim Disclaimer Specification
- **Telemetry Display Points**:
  - `CampaignDetails.jsx` (AI Risk Telemetry Panel)
  - `AiRiskReport.jsx` (Comprehensive Audit Report)
  - `Explore.jsx` (Campaign card badges: AI Score % + Anomaly Risk Tier)
  - `CreateCampaign.jsx` (Pre-launch AI feasibility check)
- **Telemetry Indicators**:
  - **ML Success Probability**: 0% to 100% (Calibrated RandomForest classifier on 0-leakage launch features).
  - **Anomaly Risk Tier**: `LOW` (Green), `MEDIUM` (Amber), `HIGH` (Rose) from IsolationForest decision function.
  - **Budget Realism Score**: Percentage rating alignment between goal ETH and milestone count.
  - **Pitch Completeness Score**: Percentage rating based on technical documentation and architecture specs.
  - **Roadmap Quality**: `STRONG` (Balanced 4 tranches: 20%, 25%, 25%, 30%), `MODERATE`, or `WEAK`.
  - **Identified Red Flags & Mitigation Points**: Synthesized by Nemotron Risk Analyst.
- **Mandatory Disclaimer Integration**:
  - The exact verbatim string:
    > **"This is an AI-generated advisory assessment and not a financial verdict."**
  - Must appear prominently in:
    1. An amber notice box at the top of `AiRiskReport.jsx`.
    2. The AI Risk Telemetry section of `CampaignDetails.jsx`.
    3. The AI pre-check result box in `CreateCampaign.jsx`.
    4. The verification evidence report in `VerifierPortal.jsx`.
    5. Tooltip / info modal on Explore campaign card badges.

---

### 3.4 Interactive Transaction History & Exportable Records Specification
- **Component**: `frontend/src/pages/TransactionLedger.jsx`.
- **Data Source**: Synchronized with `AppContext.jsx` global `activities` array and smart contract events:
  - `ContributionReceived` (inbound ETH)
  - `ExcessRefundIssued` (outbound in-block refund)
  - `MilestoneSubmitted` (evidence uploaded)
  - `MilestoneApproved` (verifier approval)
  - `MilestoneRejected` (verifier rejection)
  - `TrancheWithdrawn` (creator withdrawal)
  - `ContributorRefundIssued` (backer refund claimed)
- **Interactive Controls**:
  - **Search Bar**: Filter by Tx Hash, Actor Address, Event Type, or Campaign ID.
  - **Event Filter Tabs**: `All Events`, `Contributions`, `Refunds`, `Milestones`, `Withdrawals`.
  - **Sepolia Deep-Links**: Clicking Tx Hash opens `https://sepolia.etherscan.io/tx/${txHash}` in a new tab.
- **Export Capabilities**:
  - **Export CSV Button**: Generates and triggers instant browser download of `trustbridge_ledger_export.csv` containing columns: `Timestamp, Event, TxHash, BlockNumber, Actor, AmountETH, CampaignId, Status`.
  - **Export JSON Button**: Downloads full formatted audit log `trustbridge_audit_log.json`.
  - **Summary Metrics Bar**: Total Volume Settled (ETH), Total Contributions, Total In-Block Refunds Issued, Active Milestones Verified.

---

### 3.5 AI Endpoints & Dual Mock/Live Handling Specification
- **Client Service Layer (`frontend/src/services/api.js`)**:
  - API base: `http://127.0.0.1:5000/api` with health-check ping on mount.
  - Maintain a global state `isBackendLive` in `AppContext.jsx`.
  - Provide a subtle status pill in the navbar/footer:
    - Green dot: `AI Engine: Live (Flask + Nemotron)`
    - Amber dot: `AI Engine: Local Simulation (Offline)`
  - Seamless fallback: When `fetch` fails (backend offline), fall back to deterministic local model heuristics so no component throws runtime exceptions or blank screens.
  - Wire `CreateCampaign.jsx` `handleAiPreCheck` to call `predictSuccess` and `analyzeCampaignWithAi` directly through `api.js`.

---

### 3.6 MetaMask Sepolia Connection & Live Balance Synchronization
- **Wallet Connection Pipeline (`frontend/src/context/AppContext.jsx`)**:
  1. Detect `window.ethereum`. If not installed, gracefully fall back to Sandbox Testnet Wallet (`0x7B2a...4Fa1`) with alert/toast, never crashing.
  2. If installed, initialize `BrowserProvider(window.ethereum)`.
  3. Request accounts via `provider.send('eth_requestAccounts', [])`.
  4. Fetch actual on-chain balance via `provider.getBalance(account)` and format with `ethers.formatEther(rawBalance)`. Store as `balance` string rounded to 4 decimal places.
  5. Check chain ID:
     - Target: Sepolia (`11155111` or hex `0xaa36a7`).
     - If not Sepolia, invoke `window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] })`. If network not added, request add chain. Set `isSepolia` boolean state.
  6. Register live event listeners:
     - `window.ethereum.on('accountsChanged', (accounts) => { ... update account & fetch new balance ... })`
     - `window.ethereum.on('chainChanged', (chainId) => { ... check if Sepolia & refresh balance ... })`
  7. Provide manual "Refresh Balance" button in `WalletManagement.jsx` and navbar.
  8. Synchronize `WalletManagement.jsx` table with real account transactions from `AppContext.jsx`.

---

## 4. Caveats

1. **MetaMask Extension Availability**: When testing in headless browsers or environments without MetaMask, the platform must seamlessly fall back to the built-in Sandbox Testnet Wallet (`0x7B2a...4Fa1`) so all flows remain 100% interactive and testable without error.
2. **Sepolia Testnet RPC Rate Limits**: Public Sepolia RPC endpoints (e.g., `https://rpc.sepolia.org`) can occasionally experience rate-limiting or latency. The gas estimator and balance fetcher should use resilient try/catch timeouts with cached fallbacks.
3. **NVIDIA API Key Availability**: If `NVIDIA_API_KEY` is not present in the backend environment, all four Nemotron agents utilize deterministic, domain-specific rule-based fallback analytics with the exact same JSON schema and mandatory disclaimer.

---

## 5. Conclusion

- The core contract `TrustBridge.sol` already provides a mathematically sound foundation enforcing the strict 10 ETH minimum goal, 20 ETH hard cap, 4-tranche sequential milestone payout (20%, 25%, 25%, 30%), 1-retry grace period, and in-block excess refund mechanics.
- However, key frontend interfaces are disconnected, desynchronized, or incomplete:
  1. `CampaignDetails.jsx` lacks a dedicated contribution modal, dynamic gas estimation, explicit dual-headroom badges, and the 3-state transaction receipt workflow (`pending`, `confirmed`, `excess-refund`).
  2. `contractConfig.js` contains a legacy POC ABI rather than the 4-tranche `TrustBridge.sol` interface.
  3. `CreatorDashboard.jsx` is isolated from the navigation menu and context.
  4. `VerifierPortal.jsx` only supports a single hardcoded milestone approval.
  5. `AiRiskReport.jsx` has a broken context variable (`currentCampaign` instead of `activeCampaign`).
  6. `TransactionLedger.jsx` lacks live activity binding, search input, CSV/JSON export, and audit log summaries.
  7. `AppContext.jsx` does not query live Sepolia balances via `provider.getBalance()`, lacks network switching, and does not listen to `accountsChanged` / `chainChanged`.
  8. The mandatory disclaimer verbatim — `"This is an AI-generated advisory assessment and not a financial verdict."` — needs uniform, prominent placement across all AI-related views.
- Addressing these 8 specific gaps will bring the platform into complete compliance with R1, R2, R3, and all acceptance criteria.

---

## 6. Verification Method

To independently verify all findings and validate future implementations:

1. **Frontend Build Validation**:
   ```bash
   cd frontend
   npm run build
   ```
   Must compile cleanly without JSX syntax errors, missing module imports, or type errors.

2. **Linting & Code Integrity**:
   ```bash
   cd frontend
   npx oxlint
   ```
   Ensures zero undefined variable errors or broken context hooks.

3. **Backend API & ML Test Suite**:
   ```bash
   cd backend
   python test_api.py
   ```
   Executes unit tests verifying `/api/health`, `/api/predict`, `/api/risk`, `/api/ai/analyze`, `/api/ai/explain`, `/api/ai/review-evidence`, and validates presence of the mandatory disclaimer.

4. **MetaMask & Escrow Workflow Inspection**:
   - Open dApp in browser (`http://localhost:5173`).
   - Connect MetaMask: verify that the account address is truncated in navbar and that the live Sepolia ETH balance updates dynamically.
   - Switch accounts in MetaMask: verify that the UI updates immediately.
   - Open Contribution Modal on Campaign 1 (Total Raised: 14.50 ETH, Hard Cap: 20.00 ETH, Headroom: 5.50 ETH):
     - Test input `2.00 ETH`: Verify state transitions to `PENDING` then `CONFIRMED`. Vault updates to 16.50 ETH.
     - Test input `6.00 ETH` (exceeding 5.50 ETH headroom): Verify state transitions to `EXCESS_REFUND` showing 5.50 ETH locked and 0.50 ETH refunded in same block.
   - Verify 4-Tranche Stepper: Verify Tranche 1 (20%) is unlocked, Tranche 2 is under review.
   - Verify Verifier Portal: Sign approval on Tranche 2, verify status updates to `APPROVED` and next tranche activates.
   - Verify Transaction Ledger: Verify search filter works, filter pills filter events, and clicking "Export CSV" downloads a valid CSV file.
   - Verify AI Risk Telemetry: Confirm verbatim disclaimer appears prominently on `CampaignDetails`, `AiRiskReport`, and `CreateCampaign`.
