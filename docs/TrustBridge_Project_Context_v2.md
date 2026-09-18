# TrustBridge — Project Context & AI Handoff

## Project
TrustBridge is a BTech final-year project and proposed research-paper prototype combining **Machine Learning + Agentic AI + Blockchain** for risk-aware crowdfunding.

## Team
- Akshar Vikram — 2300911530012
- Akshat Mishra — 2300911530013
- Aditya Kasoudhan — 2300911530007
- Supervisor — Ms. UPASANA

## Core idea
TrustBridge combines:
1. Creator identity verification (off-chain KYC)
2. ML campaign-success prediction
3. ML anomaly/risk detection
4. Agentic AI campaign/risk explanation
5. Smart-contract escrow
6. 10 ETH funding goal
7. 20 ETH hard cap
8. Initial development tranche
9. Milestone-based subsequent funding
10. Conditional refund/failure rules
11. Blockchain auditability

**Core principle:** Verify → Assess → Decide → Escrow → Build → Prove → Release/Refund → Audit

## Technology stack
### Frontend
- React.js
- Tailwind CSS
- Ethers.js
- MetaMask

### Backend
- Python
- Flask

### ML
- Pandas
- NumPy
- scikit-learn
- Optional XGBoost / Random Forest / Gradient Boosting
- Historical crowdfunding dataset

### Agentic AI
- NVIDIA Nemotron or another suitable LLM
- Python orchestration
- Campaign analysis, risk explanation, milestone-evidence analysis

### Blockchain
- Solidity
- Ethereum Sepolia
- Smart-contract escrow

### Identity
- Off-chain KYC/provider or sandbox/mock KYC for the academic prototype
- Never store raw Aadhaar/PAN/KYC documents on-chain

## Funding model
Current proposed configuration:
- Goal: **10 ETH**
- Hard cap: **20 ETH**

Possible demonstration tranche:
- 20% initial development
- 25% second
- 25% third
- 30% final

Percentages should ideally be configurable.

### Why initial funding exists
The creator should not have to complete the prototype before receiving any money.

Flow:
**Campaign funded → Initial development tranche → Creator builds → Evidence submitted → AI review → Human/authorized verification → Next tranche**

## Milestone approval
Blockchain cannot directly verify whether a real-world prototype exists.

Therefore:
- Creator submits evidence.
- Agentic AI analyzes it.
- Authorized human/verifier approves or rejects.
- Smart contract executes the predefined release/refund rule.

AI must **not** directly control money.

## Smart contract responsibilities
- Campaign creation
- Creator address
- Goal
- Hard cap
- Deadline
- Milestones
- Contributions
- Escrow
- Campaign state
- Milestone state
- Authorized verifier
- Fund release
- Refund eligibility
- Access control
- Events

### Suggested campaign state
DRAFT → ACTIVE → FUNDED → IN_PROGRESS → COMPLETED

Alternative:
ACTIVE/FUNDED/IN_PROGRESS → FAILED / REFUNDABLE

### Suggested milestone state
PENDING → SUBMITTED → UNDER_REVIEW → APPROVED

Alternative:
UNDER_REVIEW → REJECTED

## ML model
Question: **How likely is this campaign to succeed?**

Possible launch-time features:
- Funding goal
- Duration
- Category/subcategory
- Country
- Title
- Description
- Text-derived features
- Other information available at launch

Do **not** use future information such as final amount raised or final backers for a launch-time model. This causes data leakage.

Recommended models:
1. Logistic Regression baseline
2. Random Forest
3. Gradient Boosting / XGBoost

Metrics:
- Precision
- Recall
- F1
- ROC-AUC
- Calibration/Brier score

## Risk/anomaly model
Success prediction and fraud/risk detection are different.

- Success: “Will it likely reach its objective?”
- Risk: “Does it look unusual/potentially risky?”

Possible approach:
- Isolation Forest for anomaly detection
- Supervised fraud classifier only if reliable fraud labels exist

Do not call an ML score a definitive fraud verdict.

## Agentic AI
Suggested agents:

### Campaign Analyzer
Inputs: title, description, goal, duration, category, milestones, rewards.
Outputs: structured summary and extracted risk factors.

### Risk Analyst
Inputs: campaign facts + ML score + anomaly signal + verification.
Outputs: strengths, risks, inconsistencies and concerns.

### Evidence Reviewer
Inputs: milestone report/demo/repository/uploaded evidence.
Outputs: evidence checklist and issues requiring human review.

### Explanation/Recommendation
Combines ML + risk + verification into a human-readable assessment.

## Creator verification
KYC answers **who the owner is**, not whether the owner is honest.
Keep identity data off-chain.

## Frontend pages
1. Home / Explore
2. Campaign Details
3. Create Campaign
4. Creator Dashboard
5. Contributor Dashboard
6. Milestone/Evidence page
7. Wallet modal
8. Risk/AI assessment
9. Transaction/history page

## Data storage
### Off-chain
- User/profile data
- KYC
- Campaign metadata
- ML dataset
- AI analysis
- Evidence files/metadata

### On-chain
- Campaign state
- Contribution state
- Escrow state
- Milestone state
- Release/refund transactions
- Important events

## End-to-end flow
Creator registration
→ KYC
→ Campaign creation
→ ML + Agentic AI assessment
→ Publish
→ Contributor reviews
→ MetaMask contribution
→ Smart contract
→ Escrow
→ Initial tranche
→ Creator builds
→ Evidence submission
→ AI evidence analysis
→ Human verification
→ Next tranche OR failure/refund
→ Blockchain audit trail

## Security/trust boundaries
1. KYC provider
2. ML model
3. Agentic AI
4. Human verifier
5. Smart contract
6. Wallet/RPC/blockchain

Mitigations:
- ML: no leakage, proper train/test split, calibration
- AI: evidence-grounded + human review
- KYC: privacy/minimum data
- Contract: tests, access control, edge cases, testnet
- Wallet: never store private keys
- Verifier: authorized role; future multi-signature possible

## Research direction
Do **not** claim novelty merely because TrustBridge uses ML or blockchain. Both areas are already researched.

The stronger research question is whether an integrated architecture combining:
**ML prediction + risk detection + Agentic AI explanation + creator verification + programmable escrow + milestone funding + refunds**
can improve transparency, decision support and programmable fund control.

## Candidate research questions
- Can ML predict crowdfunding success from launch-time data?
- Can Agentic AI improve interpretability/usefulness?
- Can anomaly detection identify unusual campaigns without excessive false positives?
- Can smart contracts reliably enforce hard caps and milestone releases?
- Does the integrated architecture improve transparency compared with centralized funding?

## Important limitations
- AI can be wrong/hallucinate.
- ML can be biased.
- KYC proves identity, not honesty.
- Blockchain cannot verify physical reality.
- Human milestone verification remains a trust point.
- Smart-contract bugs can cause financial problems.
- Web3 UX is harder than ordinary payments.
- Production KYC requires privacy/compliance work.

## 12-week plan
- W1–W2: requirements + React/Flask + wallet/Sepolia setup
- W3–W4: Solidity campaign/contribution/escrow
- W5: contract testing/refunds
- W6: Sepolia deployment
- W7–W8: ML dataset/models/evaluation
- W8–W9: Agentic AI + KYC prototype
- W9–W10: Web3 frontend
- W10–W11: integration
- W11: testing/security/UI
- W12: validation/documentation/presentation
