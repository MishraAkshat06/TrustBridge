# TrustBridge — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Academic MVP / BTech Final-Year Project

## 1. Product summary
TrustBridge is an AI-assisted, blockchain-enforced crowdfunding platform. It uses ML to estimate campaign success/risk, Agentic AI to explain campaign and milestone evidence, off-chain creator verification to establish identity, and Solidity smart contracts to enforce escrow, hard caps, staged funding and predefined refund rules.

## 2. Problem
Contributors may struggle to evaluate campaign quality and creator credibility. After funding, conventional crowdfunding does not provide a programmable milestone escrow model. At the same time, requiring a creator to finish a prototype before receiving money creates a chicken-and-egg problem.

## 3. Goals
- Create campaigns
- Verify creators
- Predict campaign success
- Detect/analyze risk
- Explain AI results
- Accept ETH through MetaMask
- Enforce 20 ETH hard cap
- Hold funds in escrow
- Release an initial development tranche
- Release later tranches after milestone approval
- Support predefined refund/failure rules
- Provide blockchain auditability
- Produce a research-ready prototype

## 4. Non-goals
- Guaranteed fraud prevention
- Guaranteed campaign success
- Production-scale crowdfunding
- Storing KYC documents on-chain
- Letting an LLM directly move funds
- Automatic physical-world milestone verification without human involvement
- Supporting every payment/blockchain network

## 5. Users
### Creator
Register → verify → create campaign → receive initial tranche → build → submit evidence → receive later tranches.

### Contributor
Browse → inspect creator/risk/AI assessment → connect wallet → contribute → monitor milestones → observe releases/refunds.

### Verifier
Review evidence → inspect AI analysis → approve/reject milestone.

### Administrator
Manage verifier roles and prototype configuration.

## 6. Functional requirements
### FR-01 Registration
Users can create profiles.

### FR-02 Creator verification
Creators have Pending/Verified/Rejected status.

### FR-03 Campaign creation
Verified creators can define title, description, category, goal, hard cap, deadline and milestones.

### FR-04 AI assessment
Campaigns are processed by ML + anomaly/risk detection + Agentic AI.

### FR-05 Success prediction
Return a success probability/score.

### FR-06 Risk assessment
Return a risk/anomaly signal with an explicit disclaimer that it is not a fraud verdict.

### FR-07 AI explanation
Display strengths, risks, inconsistencies, missing information and recommendations.

### FR-08 Campaign publishing
Only valid/verified campaigns are published.

### FR-09 Wallet
Contributors can connect MetaMask.

### FR-10 Contribution
Contributors can send ETH through the smart contract.

### FR-11 Goal
Current proposed goal: **10 ETH**.

### FR-12 Hard cap
Current proposed maximum: **20 ETH**. The contract must prevent the accepted total from exceeding it.

### FR-13 Escrow
Funds stay in the smart contract until release/refund conditions are met.

### FR-14 Initial development tranche
After the funding condition is satisfied, a predefined initial tranche can be released so the creator can begin development.

### FR-15 Milestone submission
Creator can submit evidence.

### FR-16 AI evidence review
Agentic AI reviews submitted evidence.

### FR-17 Human approval
Authorized verifier approves/rejects the milestone.

### FR-18 Release
Approved milestone triggers the predefined next-tranche rule.

### FR-19 Failure
Rejected/failed milestones follow predefined failure rules.

### FR-20 Refund
Eligible remaining escrow can be returned according to contract rules.

### FR-21 History
Users can view contributions, releases, refunds, state changes and transaction hashes.

## 7. ML requirements
- Use historical crowdfunding data.
- Use only launch-time information for launch-time prediction.
- Baseline: Logistic Regression.
- Compare Random Forest and optionally XGBoost/Gradient Boosting.
- Report precision, recall, F1, ROC-AUC and calibration/Brier score.
- Risk/anomaly detection may use Isolation Forest or a supervised fraud model when reliable labels exist.

## 8. Agentic AI requirements
Agents:
- Campaign Analyzer
- Risk Analyst
- Evidence Reviewer
- Explanation/Recommendation

AI must not:
- hold private keys
- directly transfer ETH
- arbitrarily change contract rules
- approve financial transfers without the defined verifier process

## 9. Blockchain requirements
- Ethereum Sepolia
- Solidity
- MetaMask
- Ethers.js
- Escrow
- 20 ETH hard cap
- Access control
- Campaign/milestone states
- Events for key actions

Suggested events:
- CampaignCreated
- ContributionReceived
- MilestoneSubmitted
- MilestoneApproved
- FundsReleased
- RefundIssued

## 10. Frontend
Pages:
1. Home/Explore
2. Campaign Details
3. Create Campaign
4. Creator Dashboard
5. Contributor Dashboard
6. Milestone/Evidence
7. Wallet
8. AI Risk Assessment
9. Transaction History

Campaign Details should show:
- Creator
- Verification
- Goal
- Raised
- Hard cap
- Deadline
- ML estimate
- Risk level
- AI explanation
- Milestones
- Funding/release structure

## 11. Backend
Flask APIs for:
- campaign metadata
- ML prediction
- risk analysis
- Agentic AI
- verification state
- evidence metadata
- analytics

The backend must not store user private keys.

## 12. Data
### On-chain
Campaign/financial state, contributions, escrow, milestone states, releases/refunds and relevant events.

### Off-chain
Profiles, KYC, campaign metadata, ML datasets, AI outputs and evidence.

## 13. Security
- No private-key storage
- KYC data off-chain
- No ML data leakage
- Evidence-grounded AI
- Human milestone verification
- Smart-contract access control
- Contract tests
- Edge-case tests
- Testnet first
- Correct transaction-state UI

## 14. Acceptance criteria
- [ ] Creator registration works
- [ ] Verification state works
- [ ] Campaign creation works
- [ ] ML prediction works
- [ ] AI explanation works
- [ ] Campaign publishing works
- [ ] MetaMask connects
- [ ] Test ETH contribution works
- [ ] 20 ETH cap is enforced
- [ ] Funds are escrowed
- [ ] Initial tranche works
- [ ] Evidence can be submitted
- [ ] AI can analyze evidence
- [ ] Verifier can approve/reject
- [ ] Next tranche works
- [ ] Refund/failure flow works
- [ ] Sepolia transactions are auditable
- [ ] End-to-end demo works

## 15. Research evaluation
### Experiment A
ML-only vs different ML models.

### Experiment B
ML output vs ML + explanation vs Agentic AI explanation.

### Experiment C
Smart-contract tests for contributions, cap, release, refund and unauthorized access.

### Experiment D
Full end-to-end TrustBridge workflow.

## 16. Research contribution candidate
> TrustBridge proposes and evaluates an integrated crowdfunding architecture combining ML-based campaign assessment, Agentic AI explanation/evidence review, creator verification and blockchain-enforced milestone escrow.

This is a candidate contribution, not a final novelty claim. Validate it through a systematic literature review.

## 17. Core product principle
**AI helps users decide. Humans verify real-world milestones. Smart contracts control predefined financial rules. Blockchain records the result.**
