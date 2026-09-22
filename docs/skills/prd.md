# TrustBridge — Product Requirements Document

**Version:** 3.0
**Status:** Active development — see `tasks.md` for current progress
**Type:** BTech final-year academic project and research-paper prototype

This document states what TrustBridge must do. It does not describe how it is
built — that is `architecture.md`. Status markers reflect verified reality as of
2026-09-20, not intent. Do not mark an item complete without running the check
that proves it.

---

## 1. Product summary

TrustBridge is an AI-assisted, blockchain-enforced crowdfunding platform. It uses
machine learning to estimate campaign success and risk, agentic AI to explain
campaign quality and review milestone evidence, off-chain creator verification to
establish identity, and Solidity smart contracts to enforce escrow, hard caps,
staged funding, and predefined refund rules.

**Core principle — never violate this:**

> AI helps users decide. Humans verify real-world milestones. Smart contracts
> control predefined financial rules. Blockchain records the result.

---

## 2. Problem

A contributor to a conventional crowdfunding campaign has two unsolved problems:

1. **Before funding**, there is little reliable signal about campaign quality or
   creator credibility. Backers judge from marketing copy.
2. **After funding**, there is no programmable control over how money is spent.
   Funds are handed over in full and the backer has no instrument to condition
   further releases on delivered work.

Meanwhile, requiring a creator to finish a working prototype before receiving any
money creates a chicken-and-egg problem: without funding there is no prototype,
and without a prototype there is no funding.

TrustBridge addresses all three: an ML/AI assessment layer reduces the
information asymmetry at funding time, and a milestone escrow contract replaces
the one-shot payout with staged, verifiable releases.

---

## 3. Users and roles

### Creator
Registers, completes off-chain verification, creates a campaign with a milestone
plan, receives an initial development tranche on funding, builds, submits
evidence, and receives later tranches as milestones are approved.

### Contributor (backer)
Browses campaigns, inspects creator verification, ML score, and AI risk
assessment, connects a wallet, contributes ETH, monitors milestone progress, and
can request a refund if the campaign fails or is marked refundable.

### Verifier
Reviews submitted milestone evidence together with the AI evidence audit, then
approves or rejects the milestone. Approval is what unlocks the next tranche.
The verifier is a human trust point and is deliberately not automated away.

### Administrator
Manages verifier authorisation and prototype configuration.

---

## 4. Goals

- Create, verify, and publish campaigns
- Predict campaign success from launch-time data
- Detect and explain structural risk
- Accept ETH through MetaMask
- Enforce a 20 ETH hard cap with automatic excess refund
- Hold funds in contract escrow
- Release an initial development tranche on funding
- Release subsequent tranches only after human milestone approval
- Execute predefined refund and failure rules
- Provide a blockchain audit trail
- Produce a research-ready, reproducible prototype

## 5. Non-goals

- Guaranteed fraud prevention
- Guaranteed campaign success
- Production-scale crowdfunding or mainnet deployment
- Storing KYC documents or personal identity data on-chain
- Letting an LLM hold keys, sign transactions, or move funds
- Automatic physical-world verification of milestones without a human
- Supporting payment rails or chains beyond Ethereum Sepolia

---

## 6. Functional requirements

Each requirement carries a status. `[x]` means verified working. `[~]` means
implemented but not verified against the real system. `[ ]` means not done.

### Identity and campaigns

- **FR-01 Registration** — users can create profiles. `[x]` Flask `/api/auth/google`
  persists a user row. Note: the endpoint currently trusts client-supplied email
  and role with no token verification. See `tasks.md` security items.
- **FR-02 Creator verification** — creators carry Pending / Verified / Rejected
  status. `[x]` `/api/verify/kyc` sandbox writes a `kyc_records` row. Mock
  verification only; this proves identity, never honesty.
- **FR-03 Campaign creation** — verified creators define title, description,
  category, goal, hard cap, deadline, and milestones. `[x]` via
  `/api/campaigns` and the `Create` view. Note the create form does not collect a
  creator address or a deadline: the backend defaults `creator_address` to the
  zero address and `deadline_timestamp` to `0`.
- **FR-04 AI assessment** — campaigns are processed by ML prediction, anomaly
  detection, and agentic AI. `[~]` the routes exist and answer when called, but
  nothing runs them automatically and no route persists an assessment, so
  `ai_assessments` is never written. The frontend also fabricates plausible scores
  client-side when a call fails — see §10 and `lld.md` L-17.
- **FR-08 Campaign publishing** — only valid, verified campaigns are published.
  `[~]` the create flow persists campaigns; publication gating is not enforced.

### Assessment and explanation

- **FR-05 Success prediction** — return a success probability. `[x]` trained
  model behind `/api/predict`.
- **FR-06 Risk assessment** — return a risk/anomaly signal with an explicit
  disclaimer that it is not a fraud verdict. `[x]` `/api/risk`. Disclaimer is
  present in the response payload and must stay there.
- **FR-07 AI explanation** — display strengths, risks, inconsistencies, missing
  information, and recommendations. `[x]` `/api/ai/explain`.

### Wallet and funding

- **FR-09 Wallet** — contributors can connect MetaMask. `[x]` frontend only.
- **FR-10 Contribution** — contributors send ETH through the smart contract.
  `[ ]` blocked: the contract has never been compiled or deployed. See `tasks.md`.
- **FR-11 Goal** — 10 ETH minimum funding goal. Defined as `minGoal` in the
  contract as a constant. `[ ]` unverified — never compiled.
- **FR-12 Hard cap** — 20 ETH maximum. The contract must never accept a total
  above it, and must refund any excess in the same transaction. `[ ]` logic is
  written, never compiled or exercised on-chain.
- **FR-13 Escrow** — funds remain in the contract until a release or refund
  condition is met. `[ ]` unverified.

### Milestone lifecycle

- **FR-14 Initial development tranche** — after the funding condition is
  satisfied, a predefined 20% tranche becomes claimable so the creator can start
  work. `[ ]` unverified, and a known indexing defect blocks the flow after this
  point. See `tasks.md` B-01.
- **FR-15 Milestone submission** — the creator submits evidence for the active
  milestone. `[ ]` unverified.
- **FR-16 AI evidence review** — agentic AI reviews submitted evidence against
  the milestone scope. `[x]` `/api/ai/review-evidence` off-chain.
- **FR-17 Human approval** — an authorised verifier approves or rejects the
  milestone on-chain. `[ ]` unverified.
- **FR-18 Release** — an approved milestone unlocks the predefined next tranche
  for creator withdrawal. `[ ]` unverified.
- **FR-19 Failure** — rejected milestones after the retry allowance is exhausted
  move the campaign to a refundable state. `[ ]` unverified.
- **FR-20 Refund** — eligible escrow returns to contributors under the contract's
  predefined rules. `[ ]` unverified.
- **FR-21 History** — users can view contributions, releases, refunds, state
  changes, and transaction hashes. `[~]` the frontend ledger renders; it is not
  yet reading real on-chain events.

### Funding model

- Goal: **10 ETH** (`minGoal`, constant)
- Hard cap: **20 ETH** (`hardCap`, constant)
- Tranche schedule in basis points: **20% / 25% / 25% / 30%**
  (`milestones[i].trancheBps` = 2000 / 2500 / 2500 / 3000)
- Tranche 1 is released on funding. Tranches 2–4 require milestone approval.
- Percentages are stored per-milestone in the constructor, so they are
  configurable per deployment without changing contract code.

**Why an initial tranche exists:** the creator should not have to finish the
prototype before receiving any money. The initial tranche resolves the
chicken-and-egg problem in §2 while keeping the remaining 80% milestone-gated.

---

## 7. ML requirements

**Prediction question:** how likely is this campaign to succeed? Binary
classification, success versus failure.

### Feature rules

Launch-time features only:

- Funding goal
- Campaign duration in days
- Category and subcategory
- Creator country
- Title length
- Description length and readability metrics
- Text-derived features (TF-IDF over title + description)

**Never use** final amount raised, final backer count, or anything else that only
exists after the campaign ends. That is data leakage and it invalidates the
result. A leaky model scores well in testing and is worthless in production.

### What was actually built vs what is listed above

The list above is the requirement. The implemented vector in
`backend/ml/predictor.py` is six numeric features:

```
[goal_eth, duration_days, category_code, title_len, desc_words, milestone_count]
```

So there is **no TF-IDF**, no country feature, and no readability metric in the
shipped model, and the category is a five-value integer code (0–4), not a one-hot
block. Either narrow this section to what exists or train the fuller vector —
do not describe the shipped model using the list above. `lld.md` §6.1 has the
exact vector and §6.2 the category map.

### Models, in order

1. Logistic Regression — baseline
2. Random Forest
3. Gradient Boosting / XGBoost — optional comparison

### Metrics

Report every model on: precision, recall, F1, ROC-AUC, and Brier score
(calibration). Precision and recall alone are not enough — a success-probability
figure that is shown to users as a percentage must be calibrated, which is what
the Brier score tests.

### Risk and anomaly detection

Success prediction and risk detection answer different questions. Keep them
separate.

- Success: will this likely reach its objective?
- Risk: does this look structurally unusual or potentially risky?

Use Isolation Forest for anomaly detection. Use a supervised fraud classifier
only if reliable fraud labels exist. Output an anomaly score plus a risk level
(LOW / MEDIUM / HIGH).

Never present an ML anomaly score as a fraud verdict. Always attach the
disclaimer.

---

## 8. Agentic AI requirements

Four agents, each returning structured JSON. Agents must never trigger a
financial transaction.

### Campaign Analyzer
Input: title, description, goal, duration, category, milestones, rewards.
Output: summary, extracted risks, completeness score, missing information.

### Risk Analyst
Input: campaign facts, ML score, anomaly signal, verification status.
Output: strengths, risks, inconsistencies, concerns, overall risk level.

### Evidence Reviewer
Input: milestone report, demo link, repository link, uploaded evidence metadata.
Output: an evidence checklist of present and missing items, issues requiring
human review, and a recommendation of APPROVE / REJECT / NEEDS_MORE_INFO. The
recommendation is advice to the human verifier, never an on-chain action.

### Explainer / Recommendation
Input: ML score, anomaly score, verification status, analyzer output, risk output.
Output: plain-English summary, recommendation, confidence, and a disclaimer.

### Hard constraints on AI

The AI layer must never:

- hold a private key
- sign or send a transaction
- directly transfer ETH
- change contract rules
- approve a financial transfer outside the defined verifier process

Every AI output that reaches a user must carry the disclaimer that it is not a
financial verdict.

---

## 9. Blockchain requirements

- Network: **Ethereum Sepolia testnet only**, chain ID 11155111
- Language: Solidity ^0.8.20
- Wallet: MetaMask
- Client library: Ethers.js v6 (only — not Web3.js)
- Escrow held by contract
- Hard cap enforced at 20 ETH
- Access control via modifiers (`onlyCreator`, `onlyVerifier`)
- Campaign and milestone state machines
- Events emitted for every state-changing action
- Pull-payment withdrawals rather than push, so one failing recipient cannot
  block others

### Campaign state machine

```
ACTIVE ──totalRaised reaches hardCap, or finalizeFunding() after deadline──> FUNDED
FUNDED ──immediately, same transaction──> IN_PROGRESS ──milestone 3 approved──> COMPLETED
ACTIVE ──finalizeFunding() after deadline, totalRaised < minGoal──> FAILED ──> refunds open
IN_PROGRESS ──milestone rejected with attempts exhausted──> REFUNDABLE ──> refunds open
```

Two corrections to the intent: `FUNDED` is assigned and overwritten inside
`_markFunded()`, so it is never observable by any consumer even though the ABI
exposes `state()`; and `FAILED` is reached only through `finalizeFunding()`, which
is permissionless but never automatic — a campaign whose deadline passes stays
`ACTIVE` until somebody calls it.

### Milestone state machine

The enum has five states, but only four are reachable — `submitMilestoneEvidence`
assigns `UNDER_REVIEW` directly, so `SUBMITTED` is declared and never set:

```
PENDING ──submit──> UNDER_REVIEW ──approve──> APPROVED ──withdraw──> claimed
   ▲                     │
   │                     └──reject──> REJECTED ──resubmit──> UNDER_REVIEW
   │                                     │
   └─────────────────────────────────────┘  (attempt 1)
                                         └──attempt 2 exhausted──> campaign REFUNDABLE
```

Each milestone permits two submission attempts: one initial, one retry.

### Required events

`ContributionReceived`, `ExcessRefundIssued`, `CampaignFunded`, `CampaignFailed`,
`MilestoneSubmitted`, `MilestoneApproved`, `MilestoneRejected`,
`TrancheWithdrawn`, `ContributorRefundIssued`.

---

## 10. Frontend surfaces

**There is no router.** `react-router-dom` is installed as a devDependency but no
`<Router>` provider exists; `App.jsx` holds a `currentView` string in state and
renders one view at a time. The table below lists the surfaces as views, keyed by
that string — the URL never changes. Six page files render 11 views, and three
page files render nothing at all.

| View id | Component | Purpose |
|---|---|---|
| `Landing` | `Landing.jsx` | Protocol landing page, aggregate stats, live event ticker |
| `Explore` | `Explore.jsx` | Campaign marketplace with search and filters |
| `Campaign` | `CampaignDetails.jsx` | Campaign detail — escrow telemetry, AI assessment, milestone timeline, contribute |
| `Create` | `CreateCampaign.jsx` | Multi-step campaign creation |
| `Contributions` | `MyContributions.jsx` | Backer portfolio and refund actions |
| `Verifier` | `VerifierPortal.jsx` | Verifier review queue and on-chain approval |
| `Wallet` | `WalletManagement.jsx` | MetaMask connection and network state |
| `AiRisk` | `AiRiskReport.jsx` | Full AI risk report |
| `Ledger` | `TransactionLedger.jsx` | Transaction history |
| `Docs` | `Documentation.jsx` | In-app documentation |
| `Auth` | `Auth.jsx` | Sign-in, posts to `/api/auth/google` |

**Unreachable, no view id renders them:** `CreatorDashboard.jsx` (the creator
workspace in FR-03 and FR-14 has no surface in the running app), `Verifier.jsx`
(a second verifier page, superseded by `VerifierPortal.jsx`), and
`components/Navbar.jsx` (imported nowhere, and it imports `react-router-dom`,
so it would crash if it were rendered).

The Campaign Detail page must display every one of: creator address, verification
badge, goal, amount raised, hard cap, deadline countdown, ML success probability,
risk level with disclaimer, AI explanation text, milestone list with states,
tranche schedule, and the contribute action.

---

## 11. Backend services

Flask REST API covering: campaign metadata, ML prediction, risk analysis, agentic
AI, verification state, evidence metadata, and transaction history.

The backend must never store a private key, and must never sign a transaction.
All on-chain state is read through RPC or the browser wallet. Any endpoint that
accepts a role, verification status, or address from the client must derive that
value from a verified session, not from the request body.

---

## 12. Data placement

**On-chain:** campaign and financial state, contributions, escrow balance,
milestone states, releases and refunds, and the event log.

**Off-chain:** profiles, KYC records, campaign metadata and extended
descriptions, ML datasets and model artefacts, AI analysis output, evidence
files and their metadata.

The dividing line: anything that must be trustlessly enforceable and auditable
goes on-chain. Anything that is large, private, or personally identifying stays
off-chain. Identity documents never go on-chain.

---

## 13. Security and trust boundaries

Six boundaries, each with its own failure mode and mitigation:

1. **KYC provider** — proves who someone is, never that they are honest. Keep
   personal data off-chain and collect the minimum.
2. **ML model** — can be biased and can be leaky. No post-campaign features,
   proper train/test split, report calibration.
3. **Agentic AI** — can hallucinate. Ground every claim in submitted evidence
   and require human review before any consequence.
4. **Human verifier** — a deliberate trust point. Restrict the role on-chain.
5. **Smart contract** — bugs here cost money directly. Access control, edge-case
   tests, testnet first.
6. **Wallet and RPC** — never store private keys, never log them, never commit
   them.

---

## 14. Acceptance criteria

Do not tick these on the basis of code existing. Each requires the named check.

**Assessment layer**

- [x] Creator registration works — verified via `/api/auth/google`
- [x] Verification state works — verified via `/api/verify/kyc`
- [x] Campaign creation works — verified via `/api/campaigns`
- [x] ML prediction returns a score — verified via `/api/predict`
- [x] AI explanation returns structured output — verified via `/api/ai/explain`
- [x] AI evidence review returns a checklist — verified via `/api/ai/review-evidence`
- [ ] Campaign publishing is gated on verification — not enforced

**Chain layer** — all blocked on compile and deploy

- [ ] Contract compiles with a pinned Solidity version
- [ ] Contract deploys to Sepolia and is verified on Etherscan
- [ ] MetaMask connects and binds to Sepolia
- [ ] Test ETH contribution is accepted
- [ ] 20 ETH cap is enforced, excess refunded in the same transaction
- [ ] Funds are held in escrow
- [ ] Initial tranche is claimable on funding
- [ ] Evidence can be submitted for the active milestone
- [ ] Verifier can approve and reject on-chain
- [ ] Next tranche is claimable after approval
- [ ] Refund and failure flow executes correctly
- [ ] Sepolia transactions are auditable via Etherscan
- [ ] End-to-end demo runs on a clean wallet

---

## 15. Research evaluation plan

**Experiment A** — ML model comparison: Logistic Regression vs Random Forest vs
Gradient Boosting, reported on precision, recall, F1, ROC-AUC, Brier.

**Experiment B** — explanation quality: ML score alone vs ML plus template
explanation vs ML plus agentic AI explanation, evaluated for usefulness and
interpretability.

**Experiment C** — contract correctness: contributions, cap enforcement, tranche
release, refund, and unauthorised-access attempts, with gas measured per
operation.

**Experiment D** — end-to-end workflow: the full lifecycle from campaign creation
through final tranche on Sepolia.

Gas consumption per operation (deploy, contribute, refund, approve, withdraw) is
a required result table and cannot be produced until the contract compiles.

---

## 16. Research contribution

> TrustBridge proposes and evaluates an integrated crowdfunding architecture
> combining ML-based campaign assessment, agentic AI explanation and evidence
> review, creator verification, and blockchain-enforced milestone escrow.

This is a candidate contribution, not a novelty claim. Using ML and using
blockchain are both already well researched; the claim being tested is whether
the *integration* improves transparency, decision support, and programmable
control over funds. Validate against a systematic literature review before
asserting novelty.

---

## 17. Known limitations

State these honestly in the report. They are not weaknesses to hide; they are the
scope boundary of the prototype.

- AI can be wrong or hallucinate
- ML can be biased and can miscalibrate
- KYC proves identity, not honesty
- A blockchain cannot verify physical reality
- Human milestone verification remains an unavoidable trust point
- Smart-contract bugs can cause financial loss
- Web3 UX is harder than ordinary payment flows
- Production KYC requires real privacy and compliance work
- The prototype runs on a testnet with valueless ETH
