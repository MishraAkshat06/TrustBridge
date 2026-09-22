# TrustBridge — High Level Design

System-level design: what the system is made of, what each part is responsible
for, how the parts talk to each other, and why the structure is shaped this way.
Implementation detail — signatures, schemas, algorithms — lives in `lld.md`.

Read order for a new session: `memory.md` → `tasks.md` → `hld.md` → `lld.md`.

Companion documents: `prd.md` (requirements), `architecture.md` (as-built state
and hazards), `rules.md` (conventions), `design.md` (UI direction).

Status: verified 2026-09-20. Where the system does not yet match this design, the
gap is named in §10 and tracked in `tasks.md`.

---

## 1. Purpose and scope

TrustBridge is a crowdfunding platform in which funds are held in a smart-contract
escrow and released in four tranches, each gated by a human-approved milestone.
Machine learning scores campaign viability; agentic AI explains the assessment and
audits submitted evidence; neither can move money.

This document covers the whole system: browser client, Flask backend, SQLite
store, ML and AI services, and the on-chain escrow contract.

**In scope.** Component decomposition, interfaces between components, data
placement, trust boundaries, deployment topology, non-functional targets.

**Out of scope.** Class and function design (`lld.md`), UI visual design
(`design.md`), academic report structure, and any feature not in `prd.md`.

---

## 2. System context

Actors and external systems:

```
   Contributor ─┐
   Creator ─────┼──► TrustBridge  ◄──►  Ethereum Sepolia (escrow contract)
   Verifier ────┤                       MetaMask (browser extension)
   Administrator┘                       NVIDIA Nemotron API (optional)
                                        Content-addressed evidence strings
```

| Actor | Does |
|---|---|
| Creator | Registers, completes sandbox KYC, submits campaign + milestone plan, submits evidence, withdraws approved tranches |
| Contributor | Reviews AI assessment, connects MetaMask, sends ETH, claims refunds if the campaign fails |
| Verifier | Human. Reviews evidence and approves or rejects each milestone. The only actor who can release a tranche |
| Administrator | Platform operator: oversight, campaign moderation |
| AI/ML subsystem | Advisory only. Scores, detects anomalies, explains, reviews evidence. Cannot sign or transfer |

External dependencies: Ethereum Sepolia RPC, MetaMask, the NVIDIA API (optional,
with a local heuristic fallback), and a content-addressed evidence string. An IPFS
hash is stored on-chain; the content itself is not fetched by this system.

---

## 3. Architecture overview

Four cooperating parts plus external services. Strict layering: the browser never
trusts the backend with money, and the backend never holds a key.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Presentation — React 19 SPA in the browser                           │
│  11 mounted views · AppContext · api.js · contractConfig.js (unused) │
│  Wallet + signing happen here and nowhere else                       │
└───────────┬──────────────────────────────────────┬───────────────────┘
            │ REST /api/*                          │ JSON-RPC, wallet-signed
            │ (Vite dev proxy)                     │ (MetaMask injected)
            ▼                                      ▼
┌───────────────────────────────┐      ┌────────────────────────────────┐
│ Application — Flask           │      │ Settlement — Ethereum Sepolia  │
│  campaign metadata            │      │  TrustBridge.sol               │
│  ML inference                 │      │  escrow, cap, 4 tranches       │
│  agent orchestration          │◄─────│  milestone state machines      │
│  sandbox KYC                  │ read │  events = audit trail          │
│  session / role               │ only │                                │
└───────────┬───────────────────┘      └────────────────────────────────┘
            │
            ▼
┌───────────────────────────────┐      ┌────────────────────────────────┐
│ Data — SQLite trustbridge.db  │      │ External — NVIDIA Nemotron API │
│  5 tables, all off-chain      │      │  optional; heuristic fallback  │
└───────────────────────────────┘      └────────────────────────────────┘
```

### Why this shape

**The chain is the settlement layer, not the application layer.** Only four things
live on-chain: money, campaign state, milestone state, and events. Every
transaction on-chain is expensive and irreversible, so nothing speculative goes
there.

**The backend is advisory and holds no money.** It has no key, signs nothing, and
cannot move funds. Its failure mode is degraded advice, not lost money. This is
stated in `rules.md` §3 and §7 and enforced by design.

**The browser holds the trust.** Signing requires MetaMask, which requires the
user to see and approve the transaction. That is the only place a private key
exists, and it exists inside the extension, not in application code.

---

## 4. Component responsibilities

| # | Component | Responsibility | Talks to | Not responsible for |
|---|---|---|---|---|
| C1 | React SPA | Render, switch views (`currentView` state — there is no router), wallet connect, sign and send transactions, local theme and wallet state | C2 (REST), C4 (RPC) | Enforcing funding rules |
| C2 | Flask API | Campaign metadata CRUD, ML inference, agent orchestration, sandbox KYC, session and role | C1, C3, C4 (reads), C5 | Holding keys, signing, escrow |
| C3 | SQLite store | Off-chain metadata: campaigns, AI assessments, milestone submissions, KYC sandbox records, users | C2 | Money, balances, campaign state |
| C4 | TrustBridge.sol | Escrow, hard cap, min goal, four tranches, milestone state machine, refunds, events | C1 (signed writes), C2 (reads) | Identity, documents, ML, evidence content |
| C5 | ML subsystem | Success probability, anomaly score and risk tier from launch-time features | C2 | Financial advice, verdicts |
| C6 | AI agents (four) | Analyze campaign, analyze risk, review evidence, explain assessment; deterministic fallback | C2, C5, NVIDIA API | Any on-chain action |
| C7 | Hardhat toolchain | Compile, test, deploy, verify the contract | C4 | Runtime execution |

### Agent decomposition

| Agent | Entry point | Produces |
|---|---|---|
| CampaignAnalyzer | `analyze(campaign)` | Strengths, weaknesses, structured assessment |
| RiskAnalyst | `analyze(campaign, prob, anomaly)` | Risk narrative over ML signals |
| EvidenceReviewer | `review(milestone, evidence)` | Recommendation to the human verifier |
| Explainer | `explain(campaign, prob, anomaly)` | Plain-language explanation of the score |

All four return structured JSON containing the shared `ADVISORY_DISCLAIMER`. The
EvidenceReviewer's output is advice to a human — it never triggers an on-chain
action.

---

## 5. Data flow

### 5.1 Campaign creation and assessment (off-chain)

```
Creator → SPA Create view → C2 POST /api/campaigns ────────► C3 campaigns
                          → C2 POST /api/predict  ──► C5 ──► probability
                          → C2 POST /api/risk     ──► C5 + C6 RiskAnalyst
                          → C2 POST /api/ai/analyze ─► C6 CampaignAnalyzer
                          → C2 POST /api/ai/explain ─► C6 Explainer
                          ◄── assessment + disclaimer
SPA renders score, risk tier, explanation, disclaimer
```

Every AI/ML response carries the disclaimer text. The SPA must render it adjacent
to the claim it qualifies — see `design.md` §7.

Note what does not happen: no route persists an assessment, so `ai_assessments` is
never written, and no agent runs automatically. The SPA calls these endpoints and
displays the result for the moment of the call.

### 5.2 Contribution (on-chain, wallet-signed)

The SPA never asks the backend to send a transaction. It reads campaign metadata
from C2, builds a transaction against C4, and hands it to MetaMask.

```
Contributor → SPA → MetaMask (sign) → C4 contribute() payable
C4: clamp to remaining cap, credit contributions[msg.sender],
    emit ContributionReceived, refund excess if any,
    auto-finalise if totalRaised == hardCap
SPA reads receipt → renders tx state → optional C2 metadata update
```

### 5.3 Milestone release (the trust-critical flow)

```
Creator  → SPA → C4 submitMilestoneEvidence(ipfsHash)   [creator only]
Verifier ← SPA reads milestone from C4, evidence metadata from C2
Verifier → C2 POST /api/ai/review-evidence → C6 EvidenceReviewer (advisory)
Verifier → SPA → C4 approveMilestone(idx) | rejectMilestone(idx)  [verifier only]
C4: on approve, emit MilestoneApproved, advance currentMilestoneIndex
Creator  → SPA → C4 withdrawTranche(idx)  [pull payment]
```

The EvidenceReviewer is advisory input to the Verifier's decision. The Verifier's
transaction is what moves the state. This is the single most important property of
the design: **a human approves every release; AI only advises.**

### 5.4 Refund

```
Campaign FAILED (below minGoal at deadline) → contributor calls claimRefund() → full refund
Campaign REFUNDABLE (a milestone failed its retries) → pro-rata refund off remaining escrow
```

### 5.5 Sequence — milestone evidence review and disbursal

The trust-critical flow of §5.3, as a sequence. Lane labels are actors and
components; `C4` function names are the real contract functions.

```
Creator              Frontend            Flask API           C4 contract         Verifier
   │                    │                    │                   │                   │
   │ (1) evidence URLs  │                    │                   │                   │
   ├───────────────────>│                    │                   │                   │
   │                    │ (2) POST /api/campaigns                │                   │
   │                    ├───────────────────>│                   │                   │
   │                    │                    │ writes campaigns + milestone_submissions
   │                    │                    │                   │                   │
   │ (3) submitMilestoneEvidence(ipfsHash)  [creator signs]     │                   │
   ├───────────────────────────────────────────────────────────>│                   │
   │                    │                    │  milestone → UNDER_REVIEW             │
   │                    │<── MilestoneSubmitted(idx, hash, attempt) ─────────────────┤
   │                    │  (the contract emits; the Verifier learns via this UI,      │
   │                    │   not from the chain directly)                             │
   │                    │                    │                   │                   │
   │                    │ (4) POST /api/ai/review-evidence       │                   │
   │                    ├───────────────────>│                   │                   │
   │                    │<── audit JSON + ADVISORY_DISCLAIMER ───┤                   │
   │                    │                    │                   │                   │
   │                    │ (5) render audit checklist ───────────────────────────────>│
   │                    │                    │                   │     (6) inspect   │
   │                    │<── (7) approveMilestone(idx) [verifier signs] ──────────────┤
   │                    ├───────────────────────────────────────────────────────────>│
   │                    │                    │  milestone → APPROVED; index += 1      │
   │                    │<── MilestoneApproved(idx, trancheAmount) ──────────────────┤
   │                    │                    │                   │                   │
   │ (8) withdrawTranche(idx)  [creator signs]                  │                   │
   ├───────────────────────────────────────────────────────────>│                   │
   │<── TrancheWithdrawn(creator, idx, amount) + ETH transfer ──┤                   │
```

| Step | Actor | Call | Effect |
|---|---|---|---|
| 1–2 | Creator | `POST /api/campaigns` | Off-chain metadata: title, category, goal, deadline, milestone plan |
| 3 | Creator | `submitMilestoneEvidence(ipfsHash)` | `submissionAttempts += 1`; hash stored; milestone → `UNDER_REVIEW`; `MilestoneSubmitted` |
| 4 | Frontend | `POST /api/ai/review-evidence` | EvidenceReviewer returns an audit checklist. **Advisory only** |
| 5–6 | Verifier | reads C4 milestone + C2 evidence metadata | Human judgment on the AI checklist |
| 7 | Verifier | `approveMilestone(idx)` **or** `rejectMilestone(idx)` | The only call that advances the campaign. Milestone → `APPROVED`, `currentMilestoneIndex += 1`, or → `REJECTED` with `REFUNDABLE` on the second rejection |
| 8 | Creator | `withdrawTranche(idx)` | Pull payment of `totalRaised × trancheBps / 10000`; `TrancheWithdrawn` |

The two signing lanes are the point of the diagram: **step 3 is signed by the
creator, step 7 by the verifier, step 8 by the creator — and nothing in Flask or
the AI layer appears as a signer anywhere.** If a future design adds a signing
lane under C2, that design has broken the central invariant of this system.

Current status: steps 3, 7, and 8 are blocked — no contract is deployed, so no
milestone can be recorded on-chain. Steps 1, 2, and 4 execute today; step 6 has
no on-chain milestone to read. See §10.

---

## 6. Interfaces

| # | Interface | From → To | Style | Notes |
|---|---|---|---|---|
| I1 | Campaign API | C1 → C2 | REST/JSON over `/api/*` | 12 routes; `lld.md` §5 |
| I2 | Chain read | C1 → C4 | `eth_call` via Ethers v6 | **Not implemented.** No `Contract` object is constructed anywhere; `contractConfig.js` is imported by `AppContext.jsx` and never used |
| I3 | Chain write | C1 → C4 | Signed transaction via MetaMask | **Not implemented.** `contributeToCampaign` does the arithmetic in JavaScript and invents a transaction hash — no wallet prompt is raised. This is the only path that may ever move money |
| I4 | Chain read | C2 → C4 | Optional RPC read | Advisory; not required for the core flow |
| I5 | Metadata store | C2 → C3 | SQLite via `sqlite3` | Single file, no server |
| I6 | LLM inference | C2 → C6 → NVIDIA | HTTPS POST, bearer key from env | Optional; falls back to heuristics |
| I7 | Evidence reference | C4 stores a hash string; C2 stores URLs and notes | Content-addressed commitment on-chain | Evidence content itself is off-chain |

I3 is the only interface that can move funds. Everything else is a read, metadata,
or advice. Any new interface must be classified against that rule before it is
built. Today I2 and I3 exist as intent only — the frontend imports a contract
address and an ABI and uses neither.

---

## 7. Data placement

| Data | Where | Why |
|---|---|---|
| ETH contributions, tranche claims | On-chain | Money; needs trustless enforcement |
| Campaign state, milestone state | On-chain | Must be un-forgeable and auditable |
| Events (full history) | On-chain | The audit trail; the ledger UI reads it |
| Campaign title, description, category | SQLite | Large, mutable, cheap off-chain |
| Milestone evidence hash | On-chain | Commit to evidence without paying for its content |
| Evidence URLs, notes | SQLite | Content is off-chain; the hash is the commitment |
| AI assessments, ML scores | SQLite | Advisory, regenerable, large |
| KYC records | SQLite, sandbox only | **Never on-chain** — `rules.md` §7 |
| Users, roles, sessions | SQLite | Off-chain identity |
| Theme, wallet connection, live balances | Browser memory | Ephemeral |

Rule applied throughout: **on-chain holds what must be trustworthy; off-chain
holds what must merely be available.** Anything private, large, or regenerable
stays off-chain.

---

## 8. Trust boundaries and security model

Six boundaries, each with a stated assumption:

| # | Boundary | Assumption at the boundary | Failure if violated |
|---|---|---|---|
| TB1 | Browser ↔ MetaMask | The user sees and approves every transaction | Unauthorised spend |
| TB2 | Browser ↔ Flask API | The request body is hostile | Privilege escalation — see §10 |
| TB3 | Flask ↔ SQLite | Local file, trusted, not exposed | Metadata tampering |
| TB4 | Flask ↔ NVIDIA API | Third party; may be down or retired | Degraded advice, covered by the fallback |
| TB5 | Contract ↔ external callers | Anyone may call; modifiers and state guards decide | Unauthorised fund movement |
| TB6 | Contract ↔ ETH transfers | `call` may reenter | Reentrancy drain |

Control design at each boundary:

- **TB1** — no key in application code, ever. `rules.md` §7 rule 1.
- **TB2** — every endpoint validates input. Currently **not met** on
  `/api/auth/google`; see §10.
- **TB3** — file permissions, gitignored database.
- **TB4** — deterministic heuristic fallback so the demo runs offline.
- **TB5** — `onlyCreator`, `onlyVerifier`, `nonReentrant`, and explicit state
  guards on every state-changing function. `receive()` reverts, so ETH can only
  enter through `contribute()` where the cap logic runs.
- **TB6** — pull payments for withdrawals and refunds; `nonReentrant` on
  `contribute`, `withdrawTranche`, and `claimRefund`.

### Authorisation matrix

| Action | Creator | Verifier | Contributor | Anyone |
|---|---|---|---|---|
| Contribute | yes | yes | yes | yes |
| Finalise funding | yes | yes | yes | yes — permissionless by design |
| Submit evidence | yes | — | — | — |
| Approve or reject milestone | — | yes | — | — |
| Withdraw tranche | yes | — | — | — |
| Claim refund | — | — | yes, own | yes, own |
| Read state | yes | yes | yes | yes |

The AI subsystem appears nowhere in this matrix. That is the design.

---

## 9. Non-functional targets

| Area | Target | Status |
|---|---|---|
| Correctness | Full lifecycle runs on Sepolia without manual intervention | Not met — see §10 |
| Gas | Deploy and each function measured; table in the report | Not met |
| Availability | Demo runs with no network and no API key (heuristic fallback) | Met for AI; the backend still requires localhost |
| Privacy | No KYC or identity document on-chain | Met by design |
| Security | Every state-changing contract function access-controlled | Met in the contract; backend TB2 gap open |
| Accessibility | WCAG 2.2 AA on both themes | Partial — four light-theme token values fail the 3:1 non-text threshold, `design.md` §3 |
| Performance | ML inference under 100 ms; `/api/chat` bounded by a 20 s request timeout | Inference met; only `/api/chat` sets a timeout — the agent routes do not |
| Portability | Frontend builds to static assets; backend is a single Python process | Met |
| Reproducibility | Contract compiles and tests from a clean checkout | Not met — no toolchain |

---

## 10. Known gaps between design and build

Carried from `architecture.md` and `tasks.md`; repeated here because they are
architectural, not incidental.

| Gap | Effect on this design |
|---|---|
| Contract never compiled or deployed | C4 exists as source only. I3 and I4 have no live counterpart, and the on-chain half of every flow in §5 is unexercised |
| I2 and I3 were never implemented | No `Contract` object exists. The SPA imports an ABI and an address and uses neither, so there is no chain read to fail and no chain write to sign |
| The SPA fabricates the on-chain half | `contributeToCampaign` invents a 64-hex transaction hash and a block number; campaign load sets `totalRaised` to `goal_eth × 0.725` with a hardcoded `mlScore: 92` and `riskLevel: 'LOW'`. What looks like chain state in the UI is derived, not read |
| `api.js` invents payloads when the backend is down | Six wrappers return synthetic ML/AI output carrying the real disclaimer, so a dead backend is indistinguishable from a working one |
| Milestone index deadlock (B-01) | The §5.3 flow breaks after tranche 1 even once deployed. Milestones 2–4 and the COMPLETED state are unreachable |
| `MilestoneState.SUBMITTED` is never assigned | An enum value in the ABI that no code path reaches |
| `CampaignState.FUNDED` is transient | Set and overwritten in one transaction; unobservable by C1, so no UI can render it |
| Test suite exercises a JavaScript reimplementation | The green suite is a specification check, not evidence about C4 |
| `/api/auth/google` trusts a client-supplied role | TB2 unprotected; any caller can claim Administrator |
| Hardcoded, unverified contract address | I2 and I3 point at an address with no deployment record |

---

## 11. Deployment topology

| Environment | Shape |
|---|---|
| Development | `npm run dev` on :5173 with `/api` proxied to Flask on :5000; Hardhat node or Sepolia for the contract |
| Demo | The same two processes on one machine, contract on Sepolia, MetaMask pointed at Sepolia |
| Static build | `npm run build` produces `dist/`. The Vite dev proxy does not exist in a static build, so an absolute API base is required |

Deployment steps and commands: `architecture.md` §8. The contract is immutable
after deployment — `creator`, `verifier`, and `campaignDeadline` are constructor
arguments — so one deployment serves one campaign, and the deploy script must
validate constructor arguments before broadcasting.

---

## 12. Design decisions and trade-offs

| Decision | Chosen | Rejected | Reason |
|---|---|---|---|
| Settlement layer | Smart-contract escrow | Custodial backend wallet | Removes the operator as a trusted party; the backend cannot lose money it does not hold |
| Milestone approval | Human verifier | Fully automated release | A chain cannot verify that a physical prototype exists. Stated as a limitation, not engineered away |
| AI role | Advisory only | AI-triggered release | An LLM must never be able to move funds |
| Money movement | Pull payments | Push on approval | One reverting recipient must not block the others |
| Tranche 1 | 20% upfront | All four milestone-gated | Chicken-and-egg: no funding without a prototype, no prototype without funding |
| Toolchain | Hardhat | Remix | A click-to-deploy IDE leaves no reproducible compile or test record; this contract has never been compiled at all |
| Store | SQLite | PostgreSQL, MongoDB | Single file, zero-ops, adequate for a prototype — `rules.md` §1 |
| Chain | Sepolia | Mainnet, or local-only | Testnet is the honest scope for a POC; local-only would produce no explorer evidence |
| Evidence | Hash on-chain, content off-chain | Content on-chain | Cost. A commitment is enough for auditability |
| Contract count | One deployment per campaign | One factory contract | Simpler to reason about and to test; a factory is a reasonable extension |

### Extensions deliberately not built

Factory contract and registry, IPFS upload and retrieval, real OAuth with token
verification, multi-verifier consensus, upgradeable proxies, a production
database, and a fiat on-ramp. Each is defensible scope for a final-year prototype;
none is claimed as complete.

---

## 13. Traceability

| Requirement area (`prd.md`) | Component | Design section | Detail |
|---|---|---|---|
| Campaign lifecycle | C4 | §5.2, §5.4 | `lld.md` §3 |
| Milestone gating | C4, C6 | §5.3 | `lld.md` §3.5 |
| Funding limits | C4 | §8 | `lld.md` §3.4, §7.1 |
| Success prediction | C5 | §5.1 | `lld.md` §6 |
| Risk detection | C5, C6 | §5.1 | `lld.md` §6, §7.4 |
| Evidence review | C6 | §5.3 | `lld.md` §5.3 |
| Audit trail | C4 events, C1 ledger | §7 | `lld.md` §8 |
| Identity and KYC | C2, C3 | §7, §8 TB2 | `lld.md` §4, §5 |
| UI and theming | C1 | — | `design.md` |
