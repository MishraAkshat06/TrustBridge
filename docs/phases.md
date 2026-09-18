# TrustBridge — AI Agent Implementation Directives & Phased Execution Guide

## System Directives & Core Rules

1. **System Identity**: TrustBridge is an academic, risk-aware crowdfunding platform combining an off-chain Python Flask backend (ML & Agentic AI), a React/Tailwind frontend, and an on-chain Solidity smart contract escrow deployed on Ethereum Sepolia[cite: 4, 5].
2. **Core Operational Principle**: Verify → Assess → Decide → Escrow → Build → Prove → Release/Refund → Audit[cite: 5].
3. **Strict Security Boundaries**:
   - The AI layer acts strictly as an **advisory decision-support tool**[cite: 5, 6].
   - **AI MUST NEVER** hold private keys, sign transactions, or programmatically release/refund escrow funds[cite: 4, 5].
   - Milestones are verified and unlocked exclusively via authorized human signers or smart contract state machines[cite: 4, 5, 6].
   - Sensitive KYC documents or user credentials must remain off-chain; never store identity documents in smart contract storage[cite: 4, 5].
4. **Execution Protocol for the AI Agent**:
   - **Do NOT** generate monolithic code. Implement features modularly according to the designated phase[cite: 1, 3].
   - Maintain strict separation of concerns across `/contracts`, `/backend`, and `/frontend`[cite: 4, 5].
   - Present concise diffs and provide exact terminal execution commands when prompting the human user.

---

## Phase 1: Proof of Concept (Weeks 1–4)

**Objective**: Deploy a minimal, hardcoded smart contract to Sepolia testnet, hook it to a plain React UI, and execute 9 critical validation transactions (hard-cap enforcement, partial contribution refunds, milestone release, and refund gating)[cite: 1, 2].

### Phase 1.1: Smart Contract Skeleton (`/contracts`)
Create `contracts/TrustBridgePOC.sol` using Solidity `^0.8.20` with the following mechanics[cite: 1, 3]:
* **State Variables**:
  - `minGoal = 10 ether;`[cite: 3]
  - `hardCap = 20 ether;`[cite: 3]
  - `totalRaised = 0;`[cite: 3]
  - `campaignDeadline = block.timestamp + 60 days;`[cite: 3]
  - `milestoneReached = false;`[cite: 3]
  - `address public creator;`
  - `mapping(address => uint256) public contributions;`[cite: 3]
  - `address[] public contributors;`[cite: 3]
* **Events**:
  - `event Contribution(address indexed backer, uint256 amount, uint256 totalRaised);`[cite: 3]
  - `event Refund(address indexed backer, uint256 amount);`[cite: 3]
  - `event MilestoneReleased(uint256 totalAmount);`[cite: 3]
  - `event RefundProcessed(address indexed backer, uint256 amount);`[cite: 3]
* **Functions**:
  - `constructor()`: Set `creator = msg.sender`.
  - `contribute() public payable`:
    - Ensure `block.timestamp < campaignDeadline` and `totalRaised < hardCap`[cite: 3].
    - Compute `remaining = hardCap - totalRaised`[cite: 3].
    - `accepted = msg.value > remaining ? remaining : msg.value;`[cite: 3]
    - `refundAmount = msg.value - accepted;`[cite: 3]
    - Update sender contribution and `totalRaised` by `accepted`[cite: 3].
    - If `refundAmount > 0`, safely transfer `refundAmount` back to `msg.sender`[cite: 3].
    - Emit relevant events[cite: 3].
  - `approveMilestone() public`:
    - Require `msg.sender == creator` and `totalRaised >= minGoal`[cite: 3].
    - Set `milestoneReached = true`[cite: 3].
  - `requestRefund() public`:
    - Require `!milestoneReached` and sender contribution `> 0`[cite: 3].
    - Reset sender contribution to 0 and transfer ETH balance back[cite: 3].
    - Emit `RefundProcessed`[cite: 3].
  - `creatorWithdraw() public`:
    - Require `msg.sender == creator` and `milestoneReached == true`[cite: 3].
    - Transfer `address(this).balance` to creator and emit `MilestoneReleased`[cite: 3].
  - `getRemainingCapacity() public view returns (uint256)`: Returns `hardCap - totalRaised`[cite: 3].

### Phase 1.2: Minimal Frontend (`/frontend`)
Scaffold a Vite React application with `ethers` v6[cite: 2, 3]:
* **Configuration**:
  - Create `src/constants/contract.js` exporting `CONTRACT_ADDRESS` and `CONTRACT_ABI`[cite: 2, 3].
* **UI Features (`src/App.jsx`)**:
  - Button to connect MetaMask via `window.ethereum.request({ method: 'eth_requestAccounts' })`[cite: 3].
  - Display connected account, network ID, total raised ETH, goal (10 ETH), and remaining capacity[cite: 2, 3].
  - Input field for ETH amount and a "Contribute" button executing `contract.contribute({ value: ethers.parseEther(val) })`[cite: 3].
  - Provide status states: Idle, Pending, Confirmed, Error[cite: 2].

### Phase 1.3: Verification & Execution Checklist
Execute and record transactions T1 through T9 on Sepolia testnet in a CSV/table[cite: 1, 2, 3]:
- [ ] **T1–T4**: Baseline contributions (2, 5, 8, 4 ETH) bringing `totalRaised` to 19 ETH[cite: 2, 3].
- [ ] **T5 (Critical)**: Send 2 ETH when remaining capacity is 1 ETH. Verify 1 ETH accepted, 1 ETH refunded[cite: 1, 2, 3].
- [ ] **T6 (Critical)**: Send 1 ETH at 20 ETH full cap. Verify transaction revert[cite: 1, 2, 3].
- [ ] **T7**: Trigger `approveMilestone()`[cite: 2, 3].
- [ ] **T8**: Attempt `requestRefund()`; verify denial due to milestone approval[cite: 2, 3].
- [ ] **T9**: Execute `creatorWithdraw()`; confirm balance transfer to creator[cite: 2, 3].

---

## Phase 2: Full Architecture & Multi-Tranche Contracts (Weeks 5–6)

**Objective**: Expand contracts to support dynamic campaigns, configurable multi-tranche funding schedules, and an authorized verifier pattern[cite: 1, 4, 5].

### Tasks
1. **Dynamic Factory Pattern**:
   - Create `CampaignFactory.sol` to deploy independent `TrustBridgeCampaign.sol` instances[cite: 4, 5].
   - Maintain a registry of created campaigns and creator addresses[cite: 4, 5].
2. **Configurable Tranche Releases**:
   - Implement tranche distribution (e.g., Tranche 1: 20% upfront development; Tranche 2: 25%; Tranche 3: 25%; Tranche 4: 30%)[cite: 5].
   - Store milestone structs containing `descriptionHash`, `targetTranchePercentage`, and `status` (`PENDING`, `SUBMITTED`, `APPROVED`, `REJECTED`)[cite: 5].
3. **Authorized Verifier Role**:
   - Introduce an `authorizedVerifier` address or multi-sig verifier role[cite: 4, 5].
   - Restrict `approveMilestone(uint8 milestoneId)` to the designated verifier address[cite: 4, 5].

---

## Phase 3: Machine Learning & Python Flask Backend (Weeks 7–8)

**Objective**: Build a Flask REST API housing launch-time campaign success prediction and structural risk modeling[cite: 1, 4, 5].

### Tasks
1. **Dataset & Feature Engineering**:
   - Use historical crowdfunding dataset (e.g., Kickstarter)[cite: 4, 5].
   - **Zero Data Leakage Rule**: Restrict training features strictly to launch-time inputs: `goal_amount`, `duration_days`, `category`, `subcategory`, `country`, and textual description length/readability metrics[cite: 4, 5].
2. **Model Training & Evaluation**:
   - Baseline: `LogisticRegression`[cite: 4, 5].
   - Advanced: `RandomForestClassifier` or `HistGradientBoostingClassifier`[cite: 4, 5].
   - Metrics: Compute and export Precision, Recall, F1, ROC-AUC, and Brier calibration scores[cite: 4, 5].
3. **Flask REST API Endpoints**:
   - `POST /api/predict`: Returns success probability score based on launch parameters[cite: 4, 5].
   - `POST /api/campaigns`: Manages off-chain metadata (title, extended descriptions, roadmap)[cite: 4, 5].
   - `GET /api/health`: Healthcheck endpoint.

---

## Phase 4: Agentic AI & Decision Support Layer (Weeks 8–9)

**Objective**: Implement specialized LLM-orchestrated advisory agents for campaign evaluation and milestone evidence checking[cite: 1, 4, 5].

### Specialized Agents

#### 1. Campaign Completeness & Feasibility Analyzer
- **Input**: Goal, timeline, category, description, milestone breakdown[cite: 5].
- **Task**: Detect missing technical specifications, unrealistic timelines, or vague deliverables[cite: 4, 5].
- **Output**: JSON containing `clarity_score` (1–10), `feasibility_rating`, and `clarity_notes`[cite: 4, 5].

#### 2. Risk & Anomaly Analyst
- **Input**: Extracted text claims, category averages, and ML success score[cite: 5].
- **Task**: Identify inconsistencies (e.g., low budget combined with high manufacturing claims; disconnect between low ML score and overhyped promises)[cite: 4, 5].
- **Output**: JSON containing `structural_concerns` and `questions_for_backers`[cite: 4, 5].

#### 3. Milestone Evidence Reviewer
- **Input**: Milestone requirements, creator evidence text, demo links, and GitHub commit URLs[cite: 5].
- **Task**: Verify evidence completeness against the milestone scope (e.g., verify repo exists, check for recent activity, confirm reported components match deliverables)[cite: 5].
- **Output**: Structured verification checklist for the human verifier[cite: 4, 5]:
  ```json
  {
    "milestone_id": 1,
    "evidence_status": "PARTIAL",
    "verified_items": ["Firmware repository initialized", "Unit tests present"],
    "missing_items": ["Hardware test bench results", "Gerber files"],
    "recommendation_to_verifier": "Request bench test video before approving Tranche 2 release."
  }
  ```[cite: 4, 5]

---

## Phase 5: Production Frontend & Integration (Weeks 9–11)

**Objective**: Assemble the complete decentralized application using React, Tailwind CSS, and Ethers.js[cite: 1, 4, 5].

### Pages to Implement
1. **Explore / Campaign List**: Display active campaigns with ML success badges and risk indicators[cite: 4, 5].
2. **Campaign Details**:
   - Dynamic funding progress (goal vs. hard-cap vs. current total)[cite: 4].
   - Escrow status, tranche release schedule, and deadline timer[cite: 4, 5].
   - AI-generated risk report and clarity breakdown[cite: 4, 5].
3. **Creator Dashboard**: Interface to submit new campaigns and upload milestone evidence links[cite: 4, 5].
4. **Verifier Portal**: Interface for authorized verifiers to review AI-generated evidence audits and trigger `approveMilestone()` on-chain[cite: 4, 5].
5. **Contributor Portal**: Portfolio view displaying contributions, project milestone progress, and emergency refund request buttons if campaigns fail[cite: 4, 5].

---

## Phase 6: Academic Documentation & Evaluation (Week 12)

**Objective**: Finalize thesis/paper write-up and viva deliverables[cite: 1, 5, 6].

1. **Empirical Data Collection**:
   - Tabulate ML metrics (Precision, Recall, ROC-AUC comparison table)[cite: 4, 5].
   - Tabulate Smart Contract gas consumption across standard operations (`deploy`, `contribute`, `refund`, `approveMilestone`, `withdraw`)[cite: 1, 2, 3].
2. **Paper Formatting**:
   - Populate sections following the IEEE conference standard: Abstract, Introduction, Related Work, Architecture, Methodology, Results, Limitations, and Conclusion[cite: 6].