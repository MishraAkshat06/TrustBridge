# TrustBridge — Agent Context Document
> **Give this file to your Antigravity agent at the start of every session.**
> The agent must read this fully before writing any code, suggesting any file, or making any decision.

---

## 1. What This Project Is

TrustBridge is a **BTech final-year academic project** (not a production app). It is also a proposed research paper prototype. The goal is to build a working proof-of-concept that combines:

- Machine Learning (success prediction + risk/anomaly detection)
- Agentic AI (campaign explanation + evidence review)
- Blockchain smart contracts (escrow + milestone-based fund release)
- A React frontend with MetaMask wallet integration

**Core principle (never violate this):**
> AI helps users decide. Humans verify real-world milestones. Smart contracts control predefined financial rules. Blockchain records the result.

**Team:**
- Akshar Vikram (2300911530012)
- Akshat Mishra (2300911530013)
- Aditya Kasoudhan (2300911530007)
- Supervisor: Ms. Upasana

---

## 2. Project Structure (folder layout to maintain)

```
trustbridge/
├── contract/
│   ├── TrustBridgePOC.sol          ← Week 1–2: POC contract
│   ├── TrustBridge.sol             ← Week 5–6: Full contract
│   └── ABI.json
├── frontend/
│   ├── src/
│   │   ├── pages/                  ← One file per page (9 total)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   │   └── contract.js         ← ethers.js contract helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.local                  ← NEVER commit this
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app.py                      ← Flask entry point
│   ├── routes/
│   │   ├── campaigns.py
│   │   ├── predict.py
│   │   ├── risk.py
│   │   └── ai_agents.py
│   ├── ml/
│   │   ├── train.py
│   │   ├── predict.py
│   │   └── models/                 ← saved .pkl files
│   ├── agents/
│   │   ├── campaign_analyzer.py
│   │   ├── risk_analyst.py
│   │   ├── evidence_reviewer.py
│   │   └── explainer.py
│   └── requirements.txt
├── docs/
│   ├── POC_Test_Report.md
│   ├── Technical_Analysis.md
│   └── Viva_Summary.md
├── testing/
│   └── test_results.xlsx
├── README.md
└── .gitignore
```

---

## 3. Technology Stack (do not deviate)

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite, Tailwind CSS, Ethers.js v6, MetaMask |
| Backend | Python 3.x, Flask |
| ML | pandas, NumPy, scikit-learn, XGBoost (optional) |
| Agentic AI | NVIDIA Nemotron or similar LLM via API, Python orchestration |
| Blockchain | Solidity ^0.8.0, Ethereum Sepolia testnet |
| Wallet | MetaMask, Ethers.js |
| Identity | Mock/sandbox KYC only — never on-chain |
| Version control | Git |

---

## 4. Blockchain — Rules the Agent Must Follow

### Hard rules (never break these)
- Network: **Ethereum Sepolia testnet only** (Chain ID: 11155111)
- Hard cap: **exactly 20 ETH** — the contract must reject any contribution that would push `totalRaised` above this
- Minimum goal: **10 ETH**
- The AI/LLM must **never** hold private keys, transfer ETH, or approve financial transactions
- KYC data must **never** be stored on-chain
- Private keys must **never** be stored in backend or frontend code

### Funding tranche model
```
Total raised → 20% initial tranche released immediately on funding
             → 25% on milestone 2 approval
             → 25% on milestone 3 approval
             → 30% on milestone 4 (final) approval
```
Tranche percentages should be configurable in the contract constructor.

### Campaign state machine
```
DRAFT → ACTIVE → FUNDED → IN_PROGRESS → COMPLETED
                                      ↘ FAILED → REFUNDABLE
```

### Milestone state machine
```
PENDING → SUBMITTED → UNDER_REVIEW → APPROVED
                                   ↘ REJECTED
```

### Required Solidity events
```solidity
event CampaignCreated(uint256 campaignId, address creator, uint256 goal, uint256 hardCap);
event ContributionReceived(uint256 campaignId, address backer, uint256 accepted, uint256 refunded);
event MilestoneSubmitted(uint256 campaignId, uint256 milestoneId);
event MilestoneApproved(uint256 campaignId, uint256 milestoneId);
event FundsReleased(uint256 campaignId, uint256 amount, address to);
event RefundIssued(uint256 campaignId, address backer, uint256 amount);
```

### Hard-cap contribution logic (implement exactly this)
```solidity
function contribute(uint256 campaignId) public payable {
    uint256 remaining = hardCap - totalRaised;
    uint256 accepted = msg.value > remaining ? remaining : msg.value;
    uint256 refundAmount = msg.value - accepted;

    if (accepted > 0) {
        contributions[msg.sender] += accepted;
        totalRaised += accepted;
        emit ContributionReceived(campaignId, msg.sender, accepted, refundAmount);
    }
    if (refundAmount > 0) {
        payable(msg.sender).transfer(refundAmount);
    }
}
```

---

## 5. Backend — Flask API Endpoints Required

```
POST   /api/campaigns              → create campaign (off-chain metadata)
GET    /api/campaigns              → list all published campaigns
GET    /api/campaigns/:id          → get single campaign
POST   /api/predict                → run ML success prediction
POST   /api/risk                   → run anomaly/risk detection
POST   /api/ai/analyze             → run Campaign Analyzer agent
POST   /api/ai/explain             → run Explanation agent
POST   /api/ai/review-evidence     → run Evidence Reviewer agent
POST   /api/verify/kyc             → mock KYC check
GET    /api/campaigns/:id/history  → transaction history
```

The backend must not store private keys. All on-chain state is read via Ethers.js from the frontend or via RPC in the backend — never by signing transactions server-side.

---

## 6. ML Model — Rules the Agent Must Follow

### What to predict
**"How likely is this campaign to succeed?"** — binary classification (success/failure).

### Features to use (launch-time only — no future data)
- Funding goal (numeric)
- Campaign duration (days)
- Category / subcategory
- Country of creator
- Title length (characters)
- Description length (words)
- Number of milestones defined
- Number of reward tiers (if applicable)
- Text-derived features (TF-IDF on title + description)

### Features to NEVER use (causes data leakage)
- Final amount raised
- Final number of backers
- Any data that only exists after the campaign ends

### Models to train (in this order)
1. **Logistic Regression** — baseline
2. **Random Forest**
3. **XGBoost or Gradient Boosting** — optional comparison

### Metrics to report for every model
- Precision
- Recall
- F1 score
- ROC-AUC
- Brier score (calibration)

### Risk / anomaly detection (separate from success prediction)
- Use **Isolation Forest** for anomaly detection
- Never label an ML anomaly score as a "fraud verdict" — always add a disclaimer
- Output: anomaly score (float) + risk level (LOW / MEDIUM / HIGH)

---

## 7. Agentic AI — Four Agents

Each agent is a Python class that calls an LLM API and returns structured JSON. Agents must never trigger financial transactions.

### Agent 1: Campaign Analyzer
```
Input:  title, description, goal, duration, category, milestones, rewards
Output: {
  "summary": str,
  "extracted_risks": [str],
  "completeness_score": float,
  "missing_info": [str]
}
```

### Agent 2: Risk Analyst
```
Input:  campaign_facts + ml_score + anomaly_signal + kyc_status
Output: {
  "strengths": [str],
  "risks": [str],
  "inconsistencies": [str],
  "concerns": [str],
  "overall_risk": "LOW" | "MEDIUM" | "HIGH"
}
```

### Agent 3: Evidence Reviewer
```
Input:  milestone_report, demo_link, repo_link, uploaded_files_metadata
Output: {
  "evidence_checklist": [{item: str, present: bool}],
  "issues_for_human_review": [str],
  "recommendation": "APPROVE" | "REJECT" | "NEEDS_MORE_INFO"
}
```

### Agent 4: Explainer / Recommendation
```
Input:  ml_score + anomaly_score + kyc_status + analyzer_output + risk_output
Output: {
  "plain_english_summary": str,
  "recommendation": str,
  "confidence": float,
  "disclaimer": str   ← always include: "This is AI-generated and not a financial verdict."
}
```

---

## 8. Frontend — 9 Pages Required

| # | Page | Route | Key content |
|---|---|---|---|
| 1 | Home / Explore | `/` | Campaign cards, search, filter by category |
| 2 | Campaign Details | `/campaign/:id` | Creator info, goal/raised/cap, ML score, risk level, AI explanation, milestone tracker, contribute button |
| 3 | Create Campaign | `/create` | Form: title, description, category, goal, deadline, milestones, rewards |
| 4 | Creator Dashboard | `/dashboard/creator` | My campaigns, milestone status, evidence submission, tranche history |
| 5 | Contributor Dashboard | `/dashboard/contributor` | My contributions, refund status, campaigns backed |
| 6 | Milestone / Evidence | `/milestone/:id` | Evidence upload, AI review output, verifier approval status |
| 7 | Wallet | modal or `/wallet` | MetaMask connect, balance, transaction history |
| 8 | AI Risk Assessment | `/campaign/:id/ai` | Full AI analysis display: scores, explanations, disclaimers |
| 9 | Transaction History | `/history` | On-chain events: contributions, refunds, releases |

### Campaign Details page must display (all of these)
- Creator name + verification badge (Verified / Pending / Rejected)
- Funding goal (10 ETH target)
- Amount raised + progress bar
- Hard cap (20 ETH)
- Campaign deadline (countdown)
- ML success probability (e.g., "72% likely to succeed")
- Risk level badge (LOW / MEDIUM / HIGH) with disclaimer
- AI explanation text
- Milestone list with state indicators
- Tranche release schedule (20% / 25% / 25% / 30%)
- Contribute button → MetaMask

---

## 9. Two-Phase Build Plan

### Phase 1: POC (Weeks 1–4) — build this first
The POC has hardcoded values, no styling, and proves core mechanics work.

**POC contract (`TrustBridgePOC.sol`) requirements:**
- Hardcoded: minGoal = 10 ETH, hardCap = 20 ETH
- Single campaign (no campaign ID needed yet)
- `contribute()` with hard-cap + refund logic
- `approveMilestone()` restricted to a verifier address
- `requestRefund()` for contributors
- `creatorWithdraw()` after milestone approval
- No tranche logic yet — just single withdrawal

**POC frontend (`App.jsx`) requirements:**
- Connect MetaMask button
- Display: totalRaised, remainingCapacity, milestoneReached
- Input field for ETH amount + Contribute button
- Transaction status display (pending / confirmed / error)
- No Tailwind, no styling — inline styles only

**POC test scenarios to support:**
| Test | Action | Expected |
|---|---|---|
| T1–T4 | Normal contributions | Accepted, totalRaised increases |
| T5 | 2 ETH sent, 1 ETH capacity left | Accept 1 ETH, refund 1 ETH |
| T6 | 1 ETH sent, cap full | Reject, refund 1 ETH |
| T7 | approveMilestone() | milestoneReached = true |
| T8 | requestRefund() after approval | Denied |
| T9 | creatorWithdraw() | All funds sent to creator |

### Phase 2: Full Project (Weeks 5–12)
Expand the contract to support dynamic campaigns, multi-milestone, tranche releases, and authorized verifier pattern. Build full Flask backend, ML pipeline, Agentic AI agents, and complete React UI with Tailwind.

---

## 10. Security Rules (never violate)

- Never store private keys in any file (frontend, backend, .env, anywhere)
- Never put KYC documents on-chain
- Never let an AI agent directly call a contract write function
- Always add disclaimer to ML/AI outputs: "This is not a financial verdict"
- Always use proper train/test split for ML — no data leakage
- Smart contract must have access control modifiers (`onlyCreator`, `onlyVerifier`)
- All sensitive config (contract address, RPC URL, API keys) must go in `.env.local` (frontend) or `.env` (backend) — never hardcoded in source files

---

## 11. What the Agent Should Always Do

- **Comment every Solidity function** — the students need to explain code in their viva
- **Comment every Python function** — same reason
- **Add JSDoc to React components** — same reason
- When writing ML code, **print metrics to console** so results are visible
- When writing agents, **always include the disclaimer field** in output JSON
- When generating `.env` files, **always use placeholder values** (e.g., `YOUR_CONTRACT_ADDRESS_HERE`) — never real keys
- Always ask before installing a new npm or pip package not in this document
- Never add a library that is not in the approved stack without flagging it

---

## 12. What the Agent Must Never Do

- Do not use Hardhat or Truffle — Remix IDE is used for contract deployment
- Do not use Next.js — use React + Vite only
- Do not use Redux — use React state and context only
- Do not use MongoDB or PostgreSQL — use SQLite or flat JSON files for off-chain data in the MVP
- Do not use Web3.js — use Ethers.js v6 only
- Do not put any ML model that uses post-campaign data (leakage)
- Do not make the AI agent call `contract.write()` or sign any transaction
- Do not remove the hard cap — it must always be enforced at 20 ETH
- Do not generate real KYC validation logic — mock/sandbox only

---

## 13. Approved npm Packages

```
react, react-dom
vite
ethers (v6)
tailwindcss
axios
react-router-dom
recharts (for charts/progress bars)
```

## 14. Approved pip Packages

```
flask
flask-cors
pandas
numpy
scikit-learn
xgboost
joblib
python-dotenv
requests
```

---

## 15. Agent Session Instructions

At the start of every new Antigravity agent session, paste this:

> "Read TrustBridge_Agent_Context.md fully before doing anything. This is a BTech final-year project. Follow the folder structure, tech stack, security rules, and build phases exactly as described. Ask me before deviating from anything in that file."

When asking the agent to build a specific feature, always say which **week/phase** it belongs to, e.g.:
> "We are in Week 1 (POC phase). Build only TrustBridgePOC.sol as described in Section 9 of the context file."

---

## 16. End-to-End Flow (for the agent to understand)

```
1. Creator registers on platform
2. Creator submits KYC (mock — verified off-chain)
3. Creator fills campaign form (title, description, goal, milestones)
4. Backend runs ML success prediction + anomaly detection
5. Agentic AI Campaign Analyzer and Risk Analyst run
6. Campaign published (if verified + valid)
7. Contributor browses, sees ML score + AI explanation
8. Contributor connects MetaMask and sends ETH
9. Smart contract accepts ETH (enforces hard cap, refunds excess)
10. When 10 ETH goal reached → 20% initial tranche released to creator
11. Creator builds, submits evidence for milestone
12. Agentic AI Evidence Reviewer analyzes evidence
13. Human verifier reviews AI output + approves or rejects
14. If approved → next tranche released by smart contract
15. If rejected → predefined failure/refund rule executes
16. All events recorded on Sepolia → auditable via Etherscan
```

---

*Last updated for: TrustBridge BTech Final Year Project — Akshar, Akshat, Aditya — Supervisor: Ms. Upasana*
