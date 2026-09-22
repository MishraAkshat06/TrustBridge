# TrustBridge — System Architecture

How TrustBridge is actually built, as opposed to how it is meant to be built.
Where those differ, this document records the real state and the difference.

Companion documents: `prd.md` (what it must do), `rules.md` (conventions),
`tasks.md` (current blockers), `design.md` (UI direction).

---

## 1. Overview

TrustBridge is three cooperating layers plus a data layer:

```
                    ┌─────────────────────────────────────┐
                    │         Browser (React 19)          │
                    │  Vite 8 · Tailwind v4 · Ethers v6   │
                    └───────────┬─────────────┬───────────┘
                                │             │
                    /api proxy  │             │  JSON-RPC (wallet-signed txs)
                    (dev only)  │             │
                                ▼             ▼
              ┌──────────────────────┐   ┌─────────────────────────┐
              │  Flask backend       │   │  Ethereum Sepolia       │
              │  Python 3.13         │   │  TrustBridge.sol        │
              │                      │   │  escrow + milestones    │
              │  · campaign metadata │   │  hard cap 20 ETH        │
              │  · ML prediction     │   └─────────────────────────┘
              │  · anomaly detection │              ▲
              │  · 4 AI agents       │              │ reads (RPC)
              │  · sandbox KYC       │──────────────┘
              └──────────┬───────────┘
                         │
              ┌──────────┴───────────┐        ┌──────────────────────┐
              │  SQLite              │        │  NVIDIA Nemotron API │
              │  trustbridge.db      │        │  (agents, optional)  │
              └──────────────────────┘        └──────────────────────┘
```

### The trust split that shapes everything

The backend and the AI layer are **advisory**. Only the browser wallet signs
transactions, and only the contract moves funds. Nothing an ML model or an LLM
produces can cause a transfer. This is why the AI layer never holds a key and
why the verifier is a human — see `prd.md` §8 and §13.

### The two halves of the app

- **Off-chain half** (Flask + SQLite + ML + agents) — assessment, explanation,
  metadata. Anything large or private.
- **On-chain half** (Solidity escrow) — money, state machines, audit trail.

The app is complete on the off-chain half and unverified on the on-chain half.
That asymmetry is the single most important fact in this document.

---

## 2. Repository layout

```
D:\trustbridge\
├── contract\
│   ├── TrustBridge.sol          # 4-line import shim -> ../contracts/
│   └── TrustBridgePOC.sol       # POC copy (DIVERGES from contracts/ copy)
├── contracts\
│   ├── TrustBridge.sol          # 306 lines — the real Phase 2 contract
│   └── TrustBridgePOC.sol       # POC copy
├── backend\
│   ├── app.py                   # Flask entry, all routes
│   ├── database.py              # SQLite schema + connection
│   ├── seed_data.py             # demo campaign seeding
│   ├── test_api.py
│   ├── trustbridge.db           # SQLite (gitignored)
│   ├── requirements.txt
│   ├── venv\
│   ├── ml\
│   │   ├── train.py             # model training
│   │   ├── predictor.py         # inference + feature extraction
│   │   ├── classifier.joblib    # trained artefact
│   │   ├── anomaly_detector.joblib
│   │   └── metrics.json         # evaluation results
│   └── agents\
│       ├── __init__.py          # ADVISORY_DISCLAIMER constant
│       ├── campaign_analyzer.py
│       ├── risk_analyst.py
│       ├── evidence_reviewer.py
│       └── explainer.py
├── frontend\
│   ├── src\
│   │   ├── pages\               # 13 page files — 11 mounted, 3 dead
│   │   ├── components\          # Chatbot (mounted), Navbar (dead)
│   │   ├── context\AppContext.jsx
│   │   ├── services\api.js      # backend calls
│   │   ├── contractConfig.js    # address + ABI — imported, never used
│   │   ├── mockData.js
│   │   ├── index.css            # theme tokens (both themes)
│   │   └── App.jsx              # layout + currentView switch (no router)
│   ├── dist\                    # built output
│   ├── vite.config.js           # /api -> 127.0.0.1:5000 proxy
│   └── package.json
├── tests\
│   ├── runner.js                # node tests/runner.js
│   ├── helpers\                 # assert, contract_oracle, state_oracle, theme_oracle
│   ├── tier1_features\          # 6 suites
│   ├── tier2_boundaries\        # 4 suites
│   ├── tier3_interactions\
│   └── tier4_scenarios\
├── docs\                        # READ-ONLY reference material
├── synopsis\                    # LaTeX sources
├── TEST_INFRA.md
├── TEST_READY.md
└── package.json                 # root: test scripts only
```

### Layout hazards

**Duplicate contract files.** `contract/TrustBridgePOC.sol` and
`contracts/TrustBridgePOC.sol` are near-identical but **differ at line 138**:
one calls `contribute()`, the other `this.contribute{value: msg.value}()`. Two
copies of a contract that disagree is how you compile the wrong one and spend an
afternoon on a phantom bug. Delete one copy once Hardhat is in place; the
toolchain should be pointed at `contracts\` only, with `contract\` removed
entirely (its `TrustBridge.sol` is only an import shim).

**Test location.** The contract test suite is not in a Hardhat-style
`test/` directory. The 12 suites under `tests\` are requirement-driven UI/state
tests written in plain JavaScript. See §6.

---

## 3. Contract layer

**File:** `contracts/TrustBridge.sol` — Solidity ^0.8.20, 306 lines.
**Status:** never compiled. No toolchain on the machine. See `tasks.md` B-02.

### Immutables and constants

| Name | Value | Kind |
|---|---|---|
| `minGoal` | 10 ether | constant |
| `hardCap` | 20 ether | constant |
| `TOTAL_BPS` | 10000 | constant |
| `creator` | `msg.sender` at deploy | immutable |
| `verifier` | constructor arg | immutable |
| `campaignDeadline` | `block.timestamp + durationSeconds` | immutable |

Making creator, verifier, and deadline immutable is correct — they cannot be
changed after deployment, which is the point. It also means a wrong constructor
argument produces a useless campaign, so the deploy script must validate inputs
before broadcasting.

### Mutable state

- `totalRaised`, `totalWithdrawn` — running totals
- `state` — campaign state enum
- `milestones[4]` — fixed-size array of the four tranches
- `currentMilestoneIndex` — which milestone is active
- `contributions[address]` — per-backer amounts
- `_reentrancyLock[address]` — per-sender reentrancy guard

### State machines

Campaign:

```
ACTIVE ──totalRaised==hardCap, or finalize after deadline with goal met──> FUNDED
ACTIVE ──deadline passed, totalRaised < minGoal──> FAILED
FUNDED ──(immediately, same tx)──> IN_PROGRESS
IN_PROGRESS ──milestone 3 approved──> COMPLETED
IN_PROGRESS ──milestone rejected with attempts exhausted──> REFUNDABLE
```

Milestone: `PENDING → UNDER_REVIEW → APPROVED | REJECTED`, with `REJECTED`
resubmittable up to two attempts total.

### Functions

| Function | Access | Effect |
|---|---|---|
| `contribute()` | anyone, payable | accepts up to remaining cap, refunds excess, auto-finalises at cap |
| `finalizeFunding()` | anyone | after deadline or at cap: FUNDED if goal met, else FAILED |
| `submitMilestoneEvidence(string)` | creator | `UNDER_REVIEW` state, increments attempt count |
| `approveMilestone(uint8)` | verifier | APPROVED, advances index, completes at index 3 |
| `rejectMilestone(uint8)` | verifier | REJECTED, or REFUNDABLE if attempts exhausted |
| `withdrawTranche(uint8)` | creator | pull-payment of an approved, unclaimed tranche |
| `claimRefund()` | anyone | full refund when FAILED, pro-rata when REFUNDABLE |
| `getMilestone(uint8)` | view | milestone struct |
| `receive()` | — | reverts, forcing use of `contribute()` |

### Known defect — flow deadlock

`_markFunded()` marks `milestones[0]` APPROVED (unlocking the 20% initial
tranche) but **does not increment `currentMilestoneIndex`**, which stays at 0.

The consequence: after funding, `submitMilestoneEvidence` requires milestone 0 to
be PENDING or REJECTED — it is APPROVED — so it reverts. And `approveMilestone(0)`
requires UNDER_REVIEW — so it reverts too. Tranche 1 can be withdrawn, and then
the campaign can never advance. Milestones 2, 3, and 4 are unreachable, the
`COMPLETED` state is unreachable, and only the rejection path to `REFUNDABLE`
remains.

This is a genuine logic error, not a design choice. Fix by incrementing
`currentMilestoneIndex` to 1 in `_markFunded()` after auto-approving milestone 0.
The fix needs a test that walks the full lifecycle, which is why it belongs with
the Hardhat work rather than as a standalone patch — see `tasks.md` B-01.

### Secondary observations

- **`FUNDED` is transient.** `_markFunded()` sets `state = FUNDED` and then
  `state = IN_PROGRESS` in the same transaction, so `FUNDED` is never observable
  by any consumer. The ABI exposes `state()`, and the frontend can therefore
  never render a FUNDED campaign. Either drop the intermediate assignment or stop
  advertising the state.
- **The reentrancy guard is per-sender.** `_reentrancyLock[msg.sender]` blocks a
  given address from reentering but is not a global lock. Since withdrawals go
  only to the creator or the caller, the practical exposure is small, but it is
  not the standard pattern and a reviewer will ask about it. A single
  contract-level `bool` is both simpler and stronger.
- **Pro-rata refunds shrink as others claim.** In the REFUNDABLE branch,
  `claimRefund` divides by `totalRaised - totalWithdrawn` and pays against the
  contract's *current* balance. Early claimers get the larger share; the last
  claimer receives whatever remains. Contributions are zeroed before computing,
  so nobody double-claims, but the distribution is not equal-per-wei-in. Decide
  whether this is the intended semantics and document it either way.

---

## 4. Backend layer

**Entry:** `backend/app.py` — Flask, port 5000, `CORS` open to `*` on `/api/*`.

### Routes

| Method | Path | Purpose | Backing |
|---|---|---|---|
| GET | `/api/health` | liveness | — |
| GET | `/api/campaigns` | list campaigns | SQLite |
| POST | `/api/campaigns` | create campaign metadata | SQLite |
| GET | `/api/campaigns/<id>` | campaign + submissions | SQLite |
| POST | `/api/predict` | ML success probability | `ml.predictor` |
| POST | `/api/risk` | anomaly score + risk analysis | `ml.predictor` + RiskAnalyst |
| POST | `/api/ai/analyze` | Campaign Analyzer agent | Nemotron or heuristic |
| POST | `/api/ai/explain` | Explainer agent | Nemotron or heuristic |
| POST | `/api/ai/review-evidence` | Evidence Reviewer agent | Nemotron or heuristic |
| POST | `/api/verify/kyc` | sandbox identity verification | SQLite |
| POST | `/api/auth/google` | SSO session | SQLite |
| POST | `/api/chat` | assistant chat | Nemotron API |

### ML pipeline

`ml/train.py` trains two artefacts, `classifier.joblib` and
`anomaly_detector.joblib`. `ml/predictor.py` loads them and extracts six
zero-leakage launch features per `rules.md` §4:

```
[goal_eth, duration_days, category_code, title_len, desc_len, milestone_count]
```

`category_code` comes from a fixed map (`AI/ML`, `DeFi`, `Infrastructure`,
`Social`, `GreenTech`). An unrecognised category silently falls back to `0`
(`AI/ML`), which will quietly misclassify anything outside those five — worth
replacing with an explicit unknown bucket.

**Measured performance** (`ml/metrics.json`, 375 samples):

| Metric | Value |
|---|---|
| Precision | 0.7005 |
| Recall | 0.7562 |
| F1 | 0.7273 |
| ROC-AUC | 0.7345 |
| Brier score | 0.2095 |

ROC-AUC 0.73 is a modest but honest result for launch-time-only crowdfunding
prediction. Two gaps matter for the report: only **one** model's metrics are
recorded, so the Experiment A comparison table does not exist yet; and the
train/test split sizes are not recorded, which makes the numbers hard to
reproduce.

**Fallback risk:** `predict_success` returns a hardcoded `0.82` when the model
file is missing. That is a plausible-looking number served with no indication
that no model ran. Fine as a development placeholder, dangerous in a demo — a
missing model file would present as an 82% success prediction. Make the fallback
loud, or refuse to serve.

### Agents

All four are classes with a single `analyze`/`review`/`explain` entry point that
builds a prompt, calls the NVIDIA API when a key is present, and otherwise falls
back to a deterministic heuristic. That fallback design is good — the demo works
without a key and without network.

`agents/__init__.py` exports the shared `ADVISORY_DISCLAIMER`, which every
response payload includes.

**Unverified dependency:** all four agents and `/api/chat` target
`nvidia/nemotron-4-340b-instruct`. That model ID may no longer be served by the
NVIDIA API. Since no `.env` exists, no key is set, and the heuristic path has
been the one actually exercised — meaning the live API path is untested. Verify
the model ID against the current NVIDIA model catalogue before relying on it in a
demo or claiming it in the report.

### Security gap

`/api/auth/google` accepts `email`, `name`, and `role` directly from the request
body and writes them straight into the `users` table. Any caller can therefore
claim any role, including Administrator, with a single POST. There is no session,
no token verification, and no signature check. Fix before the demo — derive the
role server-side and verify the token, or drop the endpoint to a clearly labelled
mock.

---

## 5. Frontend layer

**Stack:** React 19.2, Vite 8, Tailwind CSS v4 (CSS-first, no config file),
Ethers v6.17, lucide-react, oxlint. `react-router-dom` v7 is installed as a
devDependency but **no `<Router>` provider exists anywhere** — see below.

### There is no router

`App.jsx` renders `MainLayout`, which holds `const [currentView, setCurrentView] =
useState('Landing')` and mounts exactly one view at a time behind that string.
The URL never changes, there is no history entry per view, and no deep link works.
Every navigation control in the app is a `<button onClick={() => setCurrentView(id)}>`.

| View id | Component | Mounted by |
|---|---|---|
| `Landing` | `pages/Landing.jsx` | `App.jsx` (also passed `isDarkMode`) |
| `Auth` | `pages/Auth.jsx` | `App.jsx` (also passed `isDarkMode`) |
| `Explore` | `pages/Explore.jsx` | `App.jsx` |
| `Campaign` | `pages/CampaignDetails.jsx` | `App.jsx` |
| `Create` | `pages/CreateCampaign.jsx` | `App.jsx` |
| `Contributions` | `pages/MyContributions.jsx` | `App.jsx` |
| `Verifier` | `pages/VerifierPortal.jsx` | `App.jsx` |
| `Wallet` | `pages/WalletManagement.jsx` | `App.jsx` |
| `AiRisk` | `pages/AiRiskReport.jsx` | `App.jsx` |
| `Ledger` | `pages/TransactionLedger.jsx` | `App.jsx` |
| `Docs` | `pages/Documentation.jsx` | `App.jsx` |

**Three files are dead.** `pages/Verifier.jsx` and `pages/CreatorDashboard.jsx` are
imported by nothing, and `components/Navbar.jsx` is imported nowhere —
`App.jsx` imports only `Chatbot`. `Navbar.jsx` is the sole importer of
`react-router-dom` (`Link`, `useLocation`), so if it were ever mounted it would
throw immediately, because no `<Router>` wraps it. `CreatorDashboard.jsx` has no
view id, which means the creator workspace has no surface in the running app.

### State

`src/context/AppContext.jsx` holds `currentView`, `account`, `balance`, `user`,
`campaigns`, `activities`, and `myContributions`, and is the only consumer of
`src/mockData.js`. **Theme is not here** — it is `useState` + `useEffect` inside
`App.jsx` (`MainLayout`), persisted to `localStorage` under `trustbridge_theme`.

`src/services/api.js` wraps the backend calls. Its failure handling is worse than
a swallow: six of its ten wrappers catch the error and return a **fabricated
payload** tagged `source: 'local_fallback'`, complete with the real
`"This is an AI-generated advisory assessment and not a financial verdict."`
disclaimer and, for `predictSuccess`, a synthetic probability computed as
`0.4×normGoal + 0.3×normDuration + 0.2×balancedMilestones + 0.1×completeness`.
Two wrappers (`fetchCampaigns`, `fetchCampaignById`) return `null`; `checkHealth`
returns `{status: 'offline'}`. So with the backend down, the UI does not show an
error — it shows invented ML scores and risk tiers that look exactly like real
ones. Convenient in development; a fabrication risk in a demo.

### Chain access — imported, not used

`src/contractConfig.js` exports a hardcoded `CONTRACT_ADDRESS` and a 29-entry
string ABI (20 functions + 9 events, matching `contracts/TrustBridge.sol`
including its duplicated milestone getters). `AppContext.jsx` imports both and
**never uses either**: there is no `new Contract(...)` in the repository. So no
chain read and no contract write exists anywhere in the frontend.

Ethers itself is imported in **two** files: `context/AppContext.jsx`
(`BrowserProvider`, `formatEther`, `parseEther` — wallet connect, balance,
`wallet_switchEthereumChain` to Sepolia) and the dead `components/Navbar.jsx`.
`CampaignDetails`, `TransactionLedger`, and `WalletManagement` do not import
ethers at all; they link out to `sepolia.etherscan.io` for hashes.

**What the UI does instead of chain calls.** `AppContext.contributeToCampaign()`
performs the cap arithmetic in JavaScript, mutates local state, and then
synthesises `txHash` (`'0x' + 64 random hex chars`) and a block number
(`5932000 + random`) for the ledger row. Campaign load sets
`totalRaised: goal_eth * 0.725`, `mlScore: 92`, `riskLevel: 'LOW'`, and
`state: 'ACTIVE'` from off-chain metadata. `activities` ships seeded with four
invented transactions carrying plausible hashes and "2m ago" timestamps. Every
number here looks on-chain and none of it is.

**The address is unverified.** No deployment artefacts exist anywhere in the
repository and no record of a deployment was found. The address cannot be assumed
to be a live TrustBridge contract. Per `rules.md` §7 this value also belongs in
`.env.local`, not in source — and `backend/seed_data.py` hardcodes **three**
addresses, of which only the first matches this one.

### Theming

Both themes are defined as CSS custom properties in `src/index.css`, with dark
mode declared via `@custom-variant dark (&:where(.dark, .dark *))` and toggled by
a `.dark` class on `<html>`.

| Token | Light (Groww) | Dark (Binance) |
|---|---|---|
| `--bg-canvas` | `#FAF9F6` | `#0B0E11` |
| `--bg-surface` | `#FFFFFF` | `#181A20` |
| `--bg-surface-elevated` | `#FFFFFF` | `#1E2329` |
| `--border-subtle` | `#E2E8F0` | `#2B313A` |
| `--text-primary` | `#111827` | `#EAECEF` |
| `--text-secondary` | `#475569` | `#848E9C` |
| `--accent-brand` | `#00D09C` | `#F0B90B` |
| `--color-success` | `#10B981` | `#0ECB81` |
| `--color-danger` | `#EF4444` | `#F6465D` |
| `--color-warning` | `#F59E0B` | `#F0B90B` |

Every component reads these variables. Hardcoding a hex value breaks the other
theme — see `rules.md` §6.

### Backend connectivity

`vite.config.js` proxies `/api` to `http://127.0.0.1:5000`, so the frontend uses
relative URLs and no CORS preflight in development. In a production build the
proxy does not exist and an absolute API base is required; plan for that if the
app is ever served statically.

---

## 6. Test architecture

**Command:** `node tests/runner.js` from the repository root, or `npm test`.
**Result as of 2026-09-20:** 63 tests, 63 pass, 0 fail, 0.013s.

Twelve suites across four tiers:

- **Tier 1** (6 suites) — feature coverage: theme toggle, navigation "routes",
  escrow contribution, four-tranche stepper, AI risk telemetry, MetaMask sync
- **Tier 2** (4 suites) — boundaries: hard-cap headroom, minimum-goal threshold,
  excess-refund split, milestone retry limit
- **Tier 3** (1 suite) — cross-feature interactions
- **Tier 4** (1 suite) — end-to-end lifecycle scenarios

**The tier-1 navigation suite tests nothing.** `navigation_routes.test.js`
declares a `viewRegistry` literal *inside the test file* and then asserts against
it — `assertEqual(view.id, 'Landing')` where `view` is `viewRegistry.Landing` a
few lines above. The assertions are true by construction, and every result is
pushed with a hardcoded `passed: true`. It also names route paths (`/explore`,
`/campaign/1`, `/verifier`) that exist nowhere in the frontend, which has no
router at all — see §5. The other five tier-1 suites do exercise simulators from
`state_oracle.js` and `theme_oracle.js`; this one exercises its own fixture. Do
not cite it as navigation coverage.

### What these tests actually verify — read this before citing the pass rate

`tests/helpers/contract_oracle.js` is a **JavaScript reimplementation** of
`contracts/TrustBridge.sol`. The header comment describes it as mirroring the
contract's "logic, constants, state transitions, and arithmetic".

So the suites exercise the JS model. **They do not execute Solidity, they do not
compile it, and they do not touch a chain.** The 63/63 pass rate is evidence
that two independent implementations agree on a set of scenarios, which is
genuinely useful — it is a specification check. It is *not* evidence that the
contract works, and it cannot be, because the oracle is a second hand-written
implementation and can share the same misunderstanding as the first.

`tests/helpers/state_oracle.js` and `theme_oracle.js` cover UI and theme state
similarly, in-process.

**This is the single most misleading artefact in the repository.** A green suite
named "Real-World Workloads" and "Escrow Settling" reads like on-chain
verification. It is not. Reconcile it by porting the oracle's scenarios to
Hardhat tests that call the compiled contract, and keep the JS suite for the UI
half where in-process testing is legitimate.

---

## 7. End-to-end flow

```
1.  Creator registers                          [off-chain, works]
2.  Creator completes sandbox KYC              [off-chain, works]
3.  Creator submits campaign + milestone plan  [off-chain, works]
4.  Backend runs ML prediction + anomaly       [off-chain, works]
5.  Campaign + Risk agents produce assessment  [off-chain, works]
6.  Campaign published                         [off-chain; gating not enforced]
7.  Contributor reviews score + explanation    [off-chain, works]
8.  Contributor connects MetaMask              [frontend, works]
9.  Contributor sends ETH                      [NOT IMPLEMENTED — local state + fake tx hash]
10. Contract enforces cap, refunds excess       [BLOCKED — never compiled]
11. On funding, tranche 1 (20%) unlocks         [BLOCKED — and B-01 defect]
12. Creator submits milestone evidence          [BLOCKED — B-01 deadlock]
13. Evidence Reviewer agent audits evidence     [off-chain, works]
14. Human verifier approves/rejects on-chain    [BLOCKED — no deployment]
15. Approved milestone unlocks next tranche     [BLOCKED — no deployment]
16. Rejected milestones lead to refund path     [BLOCKED — no deployment]
17. All events auditable on Etherscan           [BLOCKED — nothing on-chain]
```

Steps 1–8 and 13 are real. Step 9 is simulated in the browser — no wallet
transaction is requested. Steps 10–12 and 14–17 have never executed against a
live contract.

---

## 8. Build, run, and verify

### Backend

```bash
cd "D:/trustbridge/backend"
./venv/bin/python.exe app.py          # or venv/Scripts/python.exe on cmd
# -> http://127.0.0.1:5000
```

Requires `NVIDIA_API_KEY` in `backend/.env` for live agent calls; without it the
agents use their heuristics and `/api/chat` reports a missing key.

### Frontend

```bash
cd "D:/trustbridge/frontend"
npm run dev        # -> http://localhost:5173, /api proxied to :5000
npm run build      # -> dist/
npm run lint       # oxlint
```

### Tests

```bash
cd "D:/trustbridge"
node tests/runner.js
```

### Contract — not yet runnable

No toolchain is installed. Once Hardhat is added:

```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat verify --network sepolia <address> <constructor args>
```

Until `npx hardhat compile` succeeds, every claim about the contract's behaviour
is unverified, and the gas table required by `prd.md` §15 cannot be produced.

---

## 9. Structural risks ranked

| # | Risk | Impact |
|---|---|---|
| 1 | Contract never compiled or deployed | The central on-chain claim of the project is unverified |
| 2 | B-01 milestone index deadlock | Contract flow breaks after tranche 1 even once deployed |
| 3 | Test suite tests a JS reimplementation | Green suite overstates readiness; can mask the defect above |
| 4 | `/api/auth/google` trusts client role | Any caller can claim Administrator |
| 5 | Duplicate divergent contract copies | Compiling the wrong file wastes time and hides defects |
| 6 | Nemotron model ID unverified | Live AI path untested; may 404 in a demo |
| 7 | `predict_success` silent `0.82` fallback | A missing model presents as a confident prediction |
| 8 | Hardcoded contract address in source | Also unverified; belongs in `.env.local` |
| 9 | Frontend fabricates chain data | `contributeToCampaign` invents tx hashes and block numbers; the UI shows 92% ML scores and a `goal_eth × 0.725` raise figure that come from nowhere |
| 10 | `api.js` invents payloads on failure | A dead backend renders as working ML and AI output, disclaimer included |
| 11 | Per-sender reentrancy guard | Non-standard; a reviewer will question it |
| 12 | Three dead frontend files, no router | `Verifier.jsx`, `CreatorDashboard.jsx`, `Navbar.jsx` are unreachable; no URL routing exists, so nothing is deep-linkable |
