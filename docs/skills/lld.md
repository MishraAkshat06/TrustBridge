# TrustBridge — Low Level Design

Implementation-level design: the actual data structures, function signatures,
schemas, algorithms, and error paths as they exist in the repository. Everything
here was read from source on 2026-09-20, not inferred from intent.

Where the source contradicts the intended design, the discrepancy is recorded
inline and listed again in §12. Do not "fix" a discrepancy by editing this
document — fix the source.

Companion: `hld.md` (system structure), `architecture.md` (as-built state and
hazards), `prd.md` (requirements), `rules.md` (conventions).

---

## 1. Module inventory

| Layer | Files | Entry point |
|---|---|---|
| Contract | `contracts/TrustBridge.sol` (306 lines) | deploy via Hardhat |
| Backend | `backend/app.py`, `database.py`, `seed_data.py` | `python app.py`, port 5000 |
| ML | `backend/ml/train.py`, `predictor.py`, `classifier.joblib`, `anomaly_detector.joblib`, `metrics.json` | imported by `app.py` |
| Agents | `backend/agents/{__init__,campaign_analyzer,risk_analyst,evidence_reviewer,explainer}.py` | instantiated once at `app.py` import |
| Frontend | `frontend/src/{App.jsx, pages/*.jsx, components/*.jsx, context/AppContext.jsx, services/api.js, contractConfig.js, mockData.js, index.css}` | `npm run dev` |
| Tests | `tests/runner.js`, `tests/helpers/*_oracle.js`, `tests/tier{1,2,3,4}_*` | `node tests/runner.js` |

Of the 13 files in `pages/`, 11 are mounted by the `currentView` switch in
`App.jsx`; `CreatorDashboard.jsx` and `Verifier.jsx` are not, and
`components/Navbar.jsx` is imported nowhere. There is no router — see §9.1.1.

Instances created at backend import time: `analyzer_agent`, `risk_agent`,
`evidence_agent`, `explainer_agent`, and `init_db()` runs on import.

---

## 2. Contract — types and storage

### 2.1 Enums

```solidity
enum CampaignState { ACTIVE, FUNDED, IN_PROGRESS, COMPLETED, FAILED, REFUNDABLE }
//                      0       1         2            3          4        5

enum MilestoneState { PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED }
//                       0         1           2           3         4
```

Numeric values matter: the ABI returns `uint8`, so the frontend must map these
integers and must not reorder them between contract and UI.

### 2.2 Struct

```solidity
struct Milestone {
    string title;                 // set in constructor; immutable in practice
    string evidenceIpfsHash;      // set on each submission
    uint256 trancheBps;           // 2000 / 2500 / 2500 / 3000
    MilestoneState state;
    uint8 submissionAttempts;     // 0..2
    bool trancheClaimed;          // pull-payment latch
}
```

### 2.3 Storage layout

| Slot group | Variable | Type | Notes |
|---|---|---|---|
| constants | `minGoal`, `hardCap`, `TOTAL_BPS` | `uint256 public constant` | inlined, no storage slot |
| immutables | `creator`, `verifier`, `campaignDeadline` | `public immutable` | in bytecode, no storage slot |
| state | `totalRaised` | `uint256 public` | exact wei total actually accepted |
| state | `totalWithdrawn` | `uint256 public` | sum of tranches paid out |
| state | `state` | `CampaignState public` | |
| state | `milestones` | `Milestone[4] public` | fixed size; not dynamic |
| state | `currentMilestoneIndex` | `uint8 public` | 0..3 |
| mapping | `contributions` | `mapping(address => uint256) public` | zeroed on refund |
| mapping | `_reentrancyLock` | `mapping(address => bool) private` | **per-sender**, non-standard |

`milestones` being a fixed `[4]` array means the tranche count is not
configurable at deploy time. Titles are, the count is not.

### 2.4 Constants

| Constant | Value | Meaning |
|---|---|---|
| `minGoal` | `10 ether` = 10 × 10^18 wei | below this the campaign FAILs |
| `hardCap` | `20 ether` = 20 × 10^18 wei | acceptance ceiling |
| `TOTAL_BPS` | `10000` | basis-point denominator |

All three are `constant`, so they are compiled in and cannot be changed per
deployment. `rules.md` §2 fixes these values as non-negotiable.

### 2.5 Constructor

```solidity
constructor(
    address _verifier,
    uint256 durationSeconds,
    string  m1Title,
    string  m2Title,
    string  m3Title,
    string  m4Title
)
```

| Guard | Revert |
|---|---|
| `_verifier != address(0)` | `"Invalid verifier"` |
| `durationSeconds > 0` | `"Invalid duration"` |

Effects: `creator = msg.sender`; `verifier = _verifier`;
`campaignDeadline = block.timestamp + durationSeconds`; `state = ACTIVE`;
`milestones[i] = (title_i, "", bps_i, PENDING, 0, false)` with
`bps = [2000, 2500, 2500, 3000]`.

`creator` is not a parameter — it is whoever deploys. The deploy script must
therefore be run from the creator's wallet, and a wrong `_verifier`,
`durationSeconds`, or title set is permanent. This is why `tasks.md` WS-1 requires
constructor-argument validation in the deploy script.

### 2.6 Modifiers

| Modifier | Guard | Revert string |
|---|---|---|
| `onlyCreator` | `msg.sender == creator` | `"Only creator permitted"` |
| `onlyVerifier` | `msg.sender == verifier` | `"Only verifier permitted"` |
| `nonReentrant` | `!_reentrancyLock[msg.sender]` | `"Reentrancy guard triggered"` |

`nonReentrant` sets and clears `_reentrancyLock[msg.sender]`. Because the key is
the sender, two different addresses can be inside the marked functions
concurrently within one transaction's call graph, and a griefing contract that
gets the guard stuck on its own address only blocks itself. The standard pattern
is a single contract-level flag; the practical exposure here is limited because
both guarded withdrawals pay only the creator or the caller. Listed as an open
item in §12.

### 2.7 Class model

UML-style view of the deployed contract. Every member below exists in
`contracts/TrustBridge.sol`; the visibility prefixes carry their usual UML
meaning, so `+` is public (including the auto-generated getter for a `public`
mapping) and `-` is private.

```
+-------------------------------------------------------------------------------+
|                                  TrustBridge                                  |
+-------------------------------------------------------------------------------+
| + minGoal: uint256 = 10 ether     «constant»                                  |
| + hardCap: uint256 = 20 ether     «constant»                                  |
| + TOTAL_BPS: uint256 = 10000      «constant»                                  |
+-------------------------------------------------------------------------------+
| + creator: address                «immutable — msg.sender at deploy»          |
| + verifier: address               «immutable — constructor arg»               |
| + campaignDeadline: uint256       «immutable — deploy time + durationSeconds» |
+-------------------------------------------------------------------------------+
| + totalRaised: uint256                                                        |
| + totalWithdrawn: uint256                                                     |
| + state: CampaignState                                                        |
| + milestones: Milestone[4]                                                    |
| + currentMilestoneIndex: uint8                                                |
| + contributions: mapping(address => uint256)                                  |
| - _reentrancyLock: mapping(address => bool)                                   |
+-------------------------------------------------------------------------------+
| + contribute() payable                        nonReentrant                     |
| + finalizeFunding()                                                           |
| - _markFunded()                               «internal»                      |
| + submitMilestoneEvidence(ipfsHash: string)   onlyCreator                     |
| + approveMilestone(index: uint8)              onlyVerifier                    |
| + rejectMilestone(index: uint8)               onlyVerifier                    |
| + withdrawTranche(index: uint8)               onlyCreator, nonReentrant       |
| + claimRefund()                               nonReentrant                    |
| + getMilestone(index: uint8) «view»                                           |
| + receive()                                   «reverts»                       |
+-------------------------------------------------------------------------------+
| «enum»   CampaignState  ACTIVE, FUNDED, IN_PROGRESS, COMPLETED, FAILED,       |
|                         REFUNDABLE                                           |
| «enum»   MilestoneState PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED  |
| «struct» Milestone      title, evidenceIpfsHash, trancheBps, state,           |
|                         submissionAttempts, trancheClaimed                    |
| «events»                9 — see §3.13                                         |
+-------------------------------------------------------------------------------+
```

Three things the box makes visible at a glance, each a real property of this
contract rather than a stylistic note:

- **Nothing is inherited.** There is no base contract, no `Ownable`, no
  OpenZeppelin `ReentrancyGuard`, no `AccessControl`. Every guard in §2.6 is
  hand-written here. Do not describe this contract as using OpenZeppelin — it
  does not import it.
- **Three immutables, one mutable authority.** `creator`, `verifier`, and
  `campaignDeadline` are fixed at deployment. There is no setter, no role
  registry, and no admin to reassign the verifier. A wrong constructor argument
  is permanent.
- **`milestones` is a fixed array of 4**, so the tranche count is not
  deploy-time configurable even though the titles are.

---

## 3. Contract — function specifications

### 3.1 `contribute()` — payable, `nonReentrant`

| Item | Detail |
|---|---|
| Access | anyone |
| Guards | `state == ACTIVE` → `"Campaign not active"`; `block.timestamp <= campaignDeadline` → `"Campaign deadline passed"`; `msg.value > 0` → `"Amount must be > 0"`; `totalRaised < hardCap` → `"Hard cap reached"` |
| Effects | `totalRaised += accepted`; `contributions[msg.sender] += accepted` |
| Events | `ContributionReceived(sender, accepted, totalRaised)`; `ExcessRefundIssued(sender, excess)` when excess > 0 |
| External call | refund of `excess` to `msg.sender`, `require(ok, "Excess refund transfer failed")` |
| Side effect | if `totalRaised == hardCap`, calls `_markFunded()` |

```solidity
uint256 remainingCap  = hardCap - totalRaised;
uint256 acceptedAmount = msg.value > remainingCap ? remainingCap : msg.value;
uint256 excessAmount   = msg.value - acceptedAmount;
```

Consequences worth stating explicitly:

- An over-cap contribution is **clamped, not rejected**. The accepted part is
  credited and the rest is returned in the same transaction.
- A contribution when the cap is already full **reverts** (`totalRaised < hardCap`
  fails before the clamp runs), so the clamp handles only partial headroom. This
  contradicts the T6 expectation recorded in `tasks.md` WS-4, which says an
  over-cap contribution is accepted as zero with the whole amount refunded and
  no revert. **The contract reverts.** The oracle may not — see §12.
- `msg.value > 0` means a zero-value call reverts rather than being a no-op.
- Contributors can contribute repeatedly; `contributions[msg.sender]` accumulates.

### 3.2 `finalizeFunding()` — public, no modifier

| Item | Detail |
|---|---|
| Access | anyone — permissionless by design |
| Guards | `state == ACTIVE` → `"Campaign not in active state"`; `block.timestamp > campaignDeadline \|\| totalRaised == hardCap` → `"Funding still ongoing"` |
| Branch | `totalRaised >= minGoal` → `_markFunded()`; else `state = FAILED`, `CampaignFailed(totalRaised)` |

The deadline comparison is strict `>`, while `contribute` uses `<=`. At exactly
`block.timestamp == campaignDeadline`, contributions are still accepted but
finalisation is not yet allowed. One block of asymmetry; harmless but worth
knowing.

### 3.3 `_markFunded()` — internal

```solidity
state = CampaignState.FUNDED;
emit CampaignFunded(totalRaised);
milestones[0].state = MilestoneState.APPROVED;
state = CampaignState.IN_PROGRESS;
```

Three observations, all consequential:

1. **The index is not advanced.** `currentMilestoneIndex` stays `0` while
   `milestones[0]` becomes `APPROVED`. This is defect B-01; full trace in §3.9.
2. **`FUNDED` never survives the transaction.** It is assigned and overwritten two
   statements later, so no external consumer can observe it even though the ABI
   exposes `state()`.
3. **Tranche 1 requires no evidence and no verifier action.** The 20% is
   immediately claimable via `withdrawTranche(0)` once the campaign is funded.

### 3.4 `submitMilestoneEvidence(string calldata ipfsHash)` — `onlyCreator`

| Item | Detail |
|---|---|
| Guards | `state == IN_PROGRESS` → `"Campaign not in progress"`; `currentMilestoneIndex < 4` → `"All milestones completed"`; milestone state `PENDING` or `REJECTED` → `"Invalid milestone state for submission"`; `submissionAttempts < 2` → `"Grace period exceeded"`; `bytes(ipfsHash).length > 0` → `"Empty evidence hash"` |
| Effects | `submissionAttempts += 1`; `evidenceIpfsHash = ipfsHash`; `state = UNDER_REVIEW` |
| Event | `MilestoneSubmitted(idx, ipfsHash, attempt)` |

The milestone is set **directly to `UNDER_REVIEW`**, skipping
`MilestoneState.SUBMITTED`. That enum value is declared and never assigned, so it
is unreachable — the same class of dead state as campaign `FUNDED`.

The index is read from `currentMilestoneIndex`, not passed in. The creator cannot
submit evidence for a future milestone, which is correct.

Attempt accounting: the guard tests `< 2` *before* incrementing, so attempts run
1 then 2, and a third submission is refused. Two submissions per milestone total.

### 3.5 `approveMilestone(uint8 milestoneIndex)` — `onlyVerifier`

| Item | Detail |
|---|---|
| Guards | `state == IN_PROGRESS` → `"Campaign not in progress"`; `milestoneIndex == currentMilestoneIndex` → `"Not active milestone"`; state `UNDER_REVIEW` → `"Milestone not under review"` |
| Effects | milestone `state = APPROVED`; if `currentMilestoneIndex == 3` then campaign `state = COMPLETED`, else `currentMilestoneIndex += 1` |
| Event | `MilestoneApproved(index, trancheAmount)` where `trancheAmount = totalRaised * trancheBps / TOTAL_BPS` |

The event's `trancheAmount` is informational — it is not stored. The actual payout
recomputes the same expression in `withdrawTranche`.

Out-of-order approval is impossible: the index must equal the active one.

### 3.6 `rejectMilestone(uint8 milestoneIndex)` — `onlyVerifier`

| Item | Detail |
|---|---|
| Guards | identical to `approveMilestone` |
| Effects | milestone `state = REJECTED`; if `submissionAttempts >= 2` then campaign `state = REFUNDABLE` |
| Event | `MilestoneRejected(index, attempt, finalRejection)` — `finalRejection` is `true` only on the refundable branch |

A rejection on attempt 1 leaves the campaign `IN_PROGRESS` so the creator can
resubmit. A rejection on attempt 2 ends the campaign's forward path and makes it
refundable. Note that the milestone itself stays `REJECTED`, not a distinct
terminal state.

### 3.7 `withdrawTranche(uint8 milestoneIndex)` — `onlyCreator`, `nonReentrant`

| Item | Detail |
|---|---|
| Guards | `milestoneIndex < 4` → `"Invalid milestone index"`; milestone `APPROVED` → `"Tranche not approved"`; `!trancheClaimed` → `"Tranche already withdrawn"` |
| Effects | `trancheClaimed = true`; `amount = totalRaised * trancheBps / TOTAL_BPS`; `totalWithdrawn += amount` |
| Event | `TrancheWithdrawn(creator, index, amount)` |
| External call | `creator.call{value: amount}("")`, `require(ok, "Creator withdrawal transfer failed")` |

Pull payment, and the `trancheClaimed` latch is set **before** the transfer, so a
reentrant creator call cannot double-withdraw.

**No campaign-state guard.** The function does not require `IN_PROGRESS`, so an
APPROVED-but-unclaimed tranche can still be withdrawn while the campaign is
`REFUNDABLE` or `COMPLETED`. In the `REFUNDABLE` case this reduces the escrow that
`claimRefund` distributes. Decide whether that is intended and document it either
way — see §12.

Sum of all four `trancheBps` is `10000`, so a fully completed campaign pays out
exactly `totalRaised`, subject to integer truncation (§3.8).

### 3.8 `claimRefund()` — public, `nonReentrant`

| Item | Detail |
|---|---|
| Guards | `state == FAILED \|\| state == REFUNDABLE` → `"Refunds not eligible"`; `contributions[msg.sender] > 0` → `"No contribution to refund"`; computed `refundAmount > 0` → `"Calculated refund is 0"` |
| Effects | `contributions[msg.sender] = 0` **before** computing and transferring |
| Event | `ContributorRefundIssued(sender, refundAmount)` |
| External call | `msg.sender.call{value: refundAmount}("")`, `require(ok, "Refund transfer failed")` |

```solidity
// FAILED branch
refundAmount = contribution;

// REFUNDABLE branch
uint256 remainingEscrow = address(this).balance;
uint256 totalRemainingContributions = totalRaised - totalWithdrawn;
refundAmount = contribution * remainingEscrow / totalRemainingContributions;
```

Properties and problems of the REFUNDABLE branch:

- The numerator is the contract's **live balance**, not a tracked figure, so
  refunds are pro-rata over what is actually left.
- The denominator is `totalRaised - totalWithdrawn`, which does not decrease as
  contributors claim (their `contributions` entries are zeroed, but `totalRaised`
  is not reduced). Because the balance falls while the denominator does not, each
  successive claimer receives a smaller share. Early claimers gain; the last
  claimer takes the remainder. This is **not** equal-per-wei-in.
- If `totalRaised == totalWithdrawn`, the denominator is `0` and Solidity's
  checked arithmetic reverts with a panic (division by zero), not a
  require string. Reachable only if the creator withdrew tranches summing to the
  full raise.
- Zeroing the contribution before the transfer prevents reentrant double-claims.

Decision D-2 in `tasks.md` covers which distribution is intended.

### 3.9 `getMilestone(uint8 index)` — view

Returns `(title, evidenceIpfsHash, trancheBps, milestoneState, submissionAttempts,
trancheClaimed)`. Guard: `index < 4` → `"Invalid index"`.

Note the ABI declares `milestones(uint256)` as an auto-generated getter returning
the same tuple, so `getMilestone` duplicates public state. The `milestones` getter
takes `uint256` and reverts on out-of-range with a panic, whereas `getMilestone`
takes `uint8` and reverts with a string.

### 3.10 `receive()` — reverts

```solidity
receive() external payable { revert("Use contribute() function"); }
```

Plain ETH transfers are rejected, so the cap logic in `contribute()` cannot be
bypassed. There is no `fallback()`, so calls with unknown calldata and no value
fail by default as well.

### 3.11 Defect B-01 — empirical trace

Starting from a funded campaign with `currentMilestoneIndex == 0` and
`milestones[0].state == APPROVED`:

| Attempt | Result |
|---|---|
| `withdrawTranche(0)` | **succeeds** — milestone 0 is APPROVED and unclaimed |
| `submitMilestoneEvidence("hash")` | reverts `"Invalid milestone state for submission"` — index 0 is APPROVED, not PENDING or REJECTED |
| `approveMilestone(0)` | reverts `"Milestone not under review"` — it is APPROVED |
| `rejectMilestone(0)` | reverts `"Milestone not under review"` |
| `approveMilestone(1)` | reverts `"Not active milestone"` — index is 0 |

The campaign therefore cannot advance past tranche 1. Milestones 2–4 and the
`COMPLETED` state are unreachable, and the only route out is a rejection that can
never be issued, so `REFUNDABLE` is likewise unreachable from this state.

**Fix:** increment `currentMilestoneIndex` to `1` in `_markFunded()`, after
auto-approving milestone 0. Per `tasks.md` B-01, write the lifecycle test first,
watch it fail, then fix — the sequence is what catches the next defect of this
shape.

### 3.12 Arithmetic and rounding

| Expression | Where | Note |
|---|---|---|
| `hardCap - totalRaised` | `contribute` | safe: guarded by `totalRaised < hardCap` |
| `msg.value - acceptedAmount` | `contribute` | safe: `accepted <= msg.value` |
| `totalRaised * trancheBps / TOTAL_BPS` | `approveMilestone`, `withdrawTranche` | truncates toward zero; `uint256` cannot overflow for realistic raises (needs `totalRaised > 2^256/10000`) |
| `contribution * remainingEscrow / totalRemainingContributions` | `claimRefund` | truncates; can under-pay by up to 1 wei per claimer |
| `totalRaised - totalWithdrawn` | `claimRefund` | **can be zero** — panic revert, see §3.8 |

Truncation means the sum of the four tranches can be a few wei below
`totalRaised`. Those wei stay in the contract. Not a security issue; worth a
sentence in the report rather than a code change.

### 3.13 Events and their payloads

| Event | Indexed | Non-indexed | Emitted by |
|---|---|---|---|
| `ContributionReceived(contributor, amount, totalRaised)` | `contributor` | `amount`, `totalRaised` | `contribute` |
| `ExcessRefundIssued(contributor, amount)` | `contributor` | `amount` | `contribute` |
| `CampaignFunded(totalRaised)` | — | `totalRaised` | `_markFunded` |
| `CampaignFailed(totalRaised)` | — | `totalRaised` | `finalizeFunding` |
| `MilestoneSubmitted(index, evidenceIpfsHash, attempt)` | `index` | hash, attempt | `submitMilestoneEvidence` |
| `MilestoneApproved(index, trancheAmount)` | `index` | amount | `approveMilestone` |
| `MilestoneRejected(index, attempt, finalRejection)` | `index` | attempt, final | `rejectMilestone` |
| `TrancheWithdrawn(creator, index, amount)` | `creator`, `index` | `amount` | `withdrawTranche` |
| `ContributorRefundIssued(contributor, amount)` | `contributor` | `amount` | `claimRefund` |

`CampaignFunded` and the state change to `IN_PROGRESS` both happen inside
`_markFunded`, so a consumer filtering on the event sees the funding without ever
seeing the `FUNDED` state.

### 3.14 Revert string catalogue

Exact strings, for tests and for UI error mapping. Do not paraphrase these in
assertions.

```
"Only creator permitted"                      "Only verifier permitted"
"Reentrancy guard triggered"                  "Invalid verifier"
"Invalid duration"                            "Campaign not active"
"Campaign deadline passed"                    "Amount must be > 0"
"Hard cap reached"                            "Excess refund transfer failed"
"Campaign not in active state"                "Funding still ongoing"
"Campaign not in progress"                    "All milestones completed"
"Invalid milestone state for submission"      "Grace period exceeded"
"Empty evidence hash"                         "Not active milestone"
"Milestone not under review"                  "Invalid milestone index"
"Tranche not approved"                        "Tranche already withdrawn"
"Creator withdrawal transfer failed"          "Refunds not eligible"
"No contribution to refund"                   "Calculated refund is 0"
"Refund transfer failed"                      "Invalid index"
"Use contribute() function"
```

Hardhat's `revertedWith` matches on these strings. Ethers v6 surfaces them on
`error.reason` for require failures; panic reverts (division by zero,
out-of-bounds array access) have no reason string and must be handled as a
separate case in the UI.

---

## 4. Database — schema

File: `backend/trustbridge.db`, path resolved relative to `database.py`.
`get_db()` sets `row_factory = sqlite3.Row`, so rows are dict-like.
`init_db()` is idempotent and runs at import.

### 4.1 `campaigns`

```sql
CREATE TABLE IF NOT EXISTS campaigns (
    id                 TEXT PRIMARY KEY,
    title              TEXT NOT NULL,
    description        TEXT NOT NULL,
    category           TEXT NOT NULL,
    creator_address    TEXT NOT NULL,
    contract_address   TEXT,
    goal_eth           REAL NOT NULL,
    hard_cap_eth       REAL NOT NULL DEFAULT 20.0,
    deadline_timestamp INTEGER NOT NULL,
    milestones_json    TEXT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Notes |
|---|---|
| `id` | client-supplied or `uuid4().hex[:8]` — 8 hex chars is 32 bits, collision-prone at scale but adequate here |
| `contract_address` | nullable, and never verified against a deployment |
| `goal_eth`, `hard_cap_eth` | `REAL`, i.e. IEEE-754 doubles. **ETH amounts stored as floats** — fine for display metadata, never for money arithmetic |
| `milestones_json` | JSON array of `{title, tranche_bps}`; the off-chain shadow of the on-chain fixed array |
| — | No `state` column. Campaign state lives only on-chain, which is correct |

### 4.2 `ai_assessments`

```sql
CREATE TABLE IF NOT EXISTS ai_assessments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id     TEXT NOT NULL,
    assessment_type TEXT NOT NULL,
    result_json     TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
);
```

Append-only log of agent outputs. Written by nothing in `app.py` as read — the
write path exists in the schema but no route inserts here, so the table is
effectively unused. Either wire it up or drop it.

Foreign keys are declared but **SQLite does not enforce them unless
`PRAGMA foreign_keys = ON`**, which is never set. The declarations are
documentation, not constraints.

### 4.3 `milestone_submissions`

```sql
CREATE TABLE IF NOT EXISTS milestone_submissions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id   TEXT NOT NULL,
    milestone_index INTEGER NOT NULL,
    attempt       INTEGER NOT NULL,
    ipfs_hash     TEXT NOT NULL,
    repo_url      TEXT,
    demo_url      TEXT,
    notes         TEXT,
    submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
);
```

Off-chain evidence metadata. The on-chain side stores only the hash; the human
verifier reads `repo_url`, `demo_url`, and `notes` from here. `campaign_id` and
`milestone_index` are not unique together — attempt history is preserved, which
is intended.

### 4.4 `kyc_records`

```sql
CREATE TABLE IF NOT EXISTS kyc_records (
    address     TEXT PRIMARY KEY,
    full_name   TEXT,
    country     TEXT,
    verified    INTEGER DEFAULT 0,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Sandbox only. `INSERT OR REPLACE` always writes `verified = 1`, so the column is
constant in practice. No document, image, or identifier is stored — consistent
with `rules.md` §7 rule 2. This table must never be mirrored on-chain.

### 4.5 `users`

```sql
CREATE TABLE IF NOT EXISTS users (
    email      TEXT PRIMARY KEY,
    name       TEXT,
    avatar     TEXT,
    role       TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

`role` is written directly from the request body by `/api/auth/google` — the
security gap in §5.10. A user row is identified by email; there is no password,
token store, or session table, and the token returned to the client is generated
fresh and never persisted, so it validates nothing.

### 4.6 Missing

No indexes beyond the implicit primary keys. No `sessions` table. No write path
to `ai_assessments`. All join columns (`campaign_id`) are unindexed — irrelevant
at prototype scale, noted for completeness.

---

## 5. Backend — route specifications

Host `0.0.0.0`, port from `PORT` env or `5000`, `debug=False`. CORS:
`resources={r"/api/*": {"origins": "*"}}` — open to every origin.

Every handler reads `request.get_json() or {}`, so a malformed or absent body
becomes an empty dict and defaults apply rather than a 400.

### 5.1 `GET /api/health`

Response `200`: `{"status": "online", "service": "TrustBridge AI/ML Backend", "version": "2.0.0"}`.
Used by `checkHealth()` in `api.js`.

### 5.2 `GET /api/campaigns`

Reads all rows, `ORDER BY created_at DESC`. Each row's `milestones_json` is
parsed into a `milestones` key and the original key deleted. Response is a JSON
array. No pagination.

### 5.3 `POST /api/campaigns`

Request fields, all optional with defaults:

| Field | Default |
|---|---|
| `id` | `uuid4().hex[:8]` |
| `title` | `"Untitled Campaign"` |
| `description` | `""` |
| `category` | `"AI/ML"` |
| `creator_address` | the zero address |
| `contract_address` | `""` |
| `goal_eth` | `10.0` |
| `hard_cap_eth` | `20.0` |
| `deadline_timestamp` | `0` |
| `milestones` | the four standard `{title, tranche_bps}` objects |

The default milestone titles are `Architecture & Prototype` (2000),
`Testnet Launch & Audits` (2500), `Security Verification` (2500), and
**`Mainnet Deployment`** (3000). That last title contradicts `rules.md` §2 —
"Ethereum Sepolia only, no mainnet, ever". It is only a string in a SQLite row,
but it is the string a reviewer reads, and it implies a deployment the project has
explicitly scoped out. Rename it (for example `Production Readiness & Handover`)
in `app.py` and in `seed_data.py`.

Uses `INSERT OR REPLACE`, so posting an existing `id` silently overwrites the
campaign — no update endpoint exists, and no conflict check is performed.
Response `201`: `{"success": true, "campaign_id": ..., "message": ...}`.

### 5.4 `GET /api/campaigns/<campaign_id>`

Returns the campaign with parsed `milestones` plus a `submissions` array from
`milestone_submissions`. `404 {"error": "Campaign not found"}` when absent.

### 5.5 `POST /api/predict`

Body is the campaign dict. Calls `predict_success`. Response:

```json
{"success_probability": 0.7345, "percentage": 73.5,
 "disclaimer": "This is an AI-generated advisory assessment and not a financial verdict."}
```

### 5.6 `POST /api/risk`

Calls `detect_risk` and `predict_success`, then `risk_agent.analyze(data, prob, anomaly)`.
Response keys: `anomaly` (`{anomaly_score, risk_tier}`), `risk_analysis`,
`disclaimer`.

### 5.7 `POST /api/ai/analyze`

Calls `analyzer_agent.analyze(data)` and returns its dict as-is. Whether the
disclaimer is present depends on the agent's own output — unlike §5.5 and §5.6,
this route does not add one itself.

### 5.8 `POST /api/ai/explain`

Calls `predict_success` and `detect_risk` first, then
`explainer_agent.explain(data, prob, anomaly)`.

### 5.9 `POST /api/ai/review-evidence`

Request shape is nested: `{"milestone": {...}, "evidence": {...}}`. Calls
`evidence_agent.review(milestone_data, submission_evidence)`.

### 5.10 `POST /api/auth/google`

```python
email  = data.get("email", "user@gmail.com")
name   = data.get("name", "Google User")
avatar = data.get("avatar", "")
role   = data.get("role", "Contributor")     # <-- client-supplied authority
```

Writes the row and returns a fresh `tb_g_<16 hex>` token that is never stored.
No token is verified, no signature checked, no session created.

**This is the open security defect.** Any caller can POST
`{"email": "x@y.z", "role": "Administrator"}` and the row is written with that
role. Fix by deriving the role server-side from a verified identity, or by
relabelling the route as an explicit mock that grants nothing. Tracked as WS-6
and decision D-6.

### 5.11 `POST /api/verify/kyc`

Requires non-empty `address` → `400 {"error": "Address is required"}`. Upserts
`kyc_records` with `verified = 1`. Response includes
`"tier": "Level 1 Verified (Sandbox)"` and a sandbox disclaimer. Trivially
spoofable by design — it is a sandbox, and it is labelled as one.

### 5.12 `POST /api/chat`

Reads `NVIDIA_API_KEY` from the environment. If absent, returns
`{"reply": "API Key missing. Ask user to provide NVIDIA_API_KEY."}` with status
200. Otherwise POSTs to `https://integrate.api.nvidia.com/v1/chat/completions`
with `model: "nvidia/nemotron-4-340b-instruct"`, `temperature: 0.2`,
`max_tokens: 800`, `timeout: 20`. Upstream non-200 responses are returned to the
client as `"API Error: <status> - <body>"` text, and exceptions as
`"Internal Error: <message>"` — both leak upstream detail into the UI.

No `.env` exists in the repository, so this path has never been exercised and the
model ID is unverified.

---

## 6. ML subsystem

### 6.1 Feature vector

`extract_features(campaign)` returns a `(1, 6)` NumPy array:

| # | Feature | Source | Type |
|---|---|---|---|
| 0 | `goal_eth` | `campaign["goal_eth"]`, default `10.0` | float |
| 1 | `duration_days` | `campaign["duration_days"]`, default `30` | int |
| 2 | `category_code` | `CATEGORY_MAP[category]`, default `0` | int |
| 3 | `title_len` | `len(title)` — characters | int |
| 4 | `desc_len` | `len(description.split())` — **words** | int |
| 5 | `milestone_count` | `campaign["milestone_count"]`, default `4` | int |

Feature 3 counts characters and feature 4 counts words. That inconsistency is
load-bearing: changing either changes the model's input distribution, and any
retrain must reproduce both exactly. Worth renaming to `title_chars` and
`desc_words` in a future revision.

All six are launch-time quantities, so the zero-leakage rule in `rules.md` §4
holds. Nothing here is post-campaign.

### 6.2 Category map

```python
CATEGORY_MAP = {"AI/ML": 0, "DeFi": 1, "Infrastructure": 2, "Social": 3, "GreenTech": 4}
```

`CATEGORY_MAP.get(category, 0)` — an unrecognised category silently becomes `0`,
i.e. `AI/ML`. A campaign in a new category is therefore scored as if it were AI/ML
with no warning. Add an explicit unknown bucket (`5`) and retrain, or reject
unknown categories at the API boundary. Tracked in `tasks.md` WS-2.

### 6.3 `predict_success(campaign)`

```python
if not os.path.exists(CLASSIFIER_PATH):
    return 0.82                      # <-- silent fallback
clf = joblib.load(CLASSIFIER_PATH)
prob = float(clf.predict_proba(extract_features(campaign))[0][1])
return round(prob, 4)
```

Returns class-1 probability rounded to 4 decimals. The fallback constant `0.82` is
served with no indication that no model ran — a missing artefact presents to the
user as a confident 82% prediction. Make it raise, or return a null with an
explicit `model_available: false` flag.

The model is reloaded from disk on every call. No caching, no warm load. At demo
scale this is invisible; it is also the reason a per-request reload cannot be
assumed away.

### 6.4 `detect_risk(campaign)`

```python
if not os.path.exists(ANOMALY_PATH):
    return {"anomaly_score": 0.12, "risk_tier": "LOW"}
iso = joblib.load(ANOMALY_PATH)
score = float(iso.decision_function(extract_features(campaign))[0])
```

Tier thresholds on the raw `decision_function` output, where lower is more
anomalous:

| Score | Tier |
|---|---|
| `< -0.10` | `HIGH` |
| `-0.10 <= score < 0.05` | `MEDIUM` |
| `>= 0.05` | `LOW` |

The thresholds are absolute, not quantiles of the training distribution, so they
are only meaningful for the specific fitted `IsolationForest`. Retraining shifts
the scale and silently invalidates them. Calibrate the thresholds against the new
score distribution on every retrain.

The fallback `0.12 / LOW` is the optimistic direction, meaning a missing anomaly
model reports the safest possible tier.

### 6.5 Recorded metrics

`ml/metrics.json`: precision 0.7005, recall 0.7562, F1 0.7273, ROC-AUC 0.7345,
Brier 0.2095, `samples_evaluated` 375.

Only one model's metrics are recorded, so the Experiment A comparison across
Logistic Regression, Random Forest, and Gradient Boosting does not exist yet. The
train/test split sizes are not recorded either, which makes the numbers
irreproducible. Both are WS-7 items.

Brier 0.2095 is consistent with a modest classifier; per `rules.md` §4 a
probability shown to users must be calibrated, so state Brier in the report and
in any UI that displays the score.

---

## 7. Algorithms

### 7.1 Contribution acceptance

```
require state == ACTIVE, now <= deadline, msg.value > 0, totalRaised < hardCap
remaining := hardCap - totalRaised
accepted  := min(msg.value, remaining)
excess    := msg.value - accepted
totalRaised += accepted; contributions[sender] += accepted
emit ContributionReceived
if excess > 0: emit ExcessRefundIssued; transfer excess to sender
if totalRaised == hardCap: markFunded()
```

### 7.2 Tranche amount

```
amount := totalRaised * trancheBps / TOTAL_BPS      // integer division, truncates
```

Computed identically in `approveMilestone` (for the event) and `withdrawTranche`
(for the payment). The event value and the paid value agree because both derive
from the same `totalRaised`.

### 7.3 Funding finalisation

```
require state == ACTIVE
require now > deadline or totalRaised == hardCap
if totalRaised >= minGoal: markFunded()   // FUNDED then IN_PROGRESS, milestone[0] APPROVED
else: state := FAILED; emit CampaignFailed
```

### 7.4 Milestone lifecycle

```
submit:  require IN_PROGRESS, index < 4, state in {PENDING, REJECTED},
         attempts < 2, non-empty hash
         attempts += 1; hash := ipfsHash; state := UNDER_REVIEW

approve: require IN_PROGRESS, index == current, state == UNDER_REVIEW
         state := APPROVED
         if current == 3: campaign := COMPLETED else current += 1

reject:  require IN_PROGRESS, index == current, state == UNDER_REVIEW
         state := REJECTED
         if attempts >= 2: campaign := REFUNDABLE (finalRejection = true)
```

### 7.5 Refund

```
require state in {FAILED, REFUNDABLE}; require contributions[sender] > 0
contribution := contributions[sender]; contributions[sender] := 0
if state == FAILED:
    refund := contribution
else:
    refund := contribution * address(this).balance / (totalRaised - totalWithdrawn)
require refund > 0
transfer refund to sender
```

### 7.6 Risk tier mapping

See §6.4. Thresholds are constants in `predictor.py`, not configuration.

### 7.7 Campaign assessment (off-chain, per §5.1 of `hld.md`)

```
1. load or create campaign metadata (SQLite)
2. prob    := predict_success(campaign)
3. anomaly := detect_risk(campaign)
4. analysis := RiskAnalyst.analyze(campaign, prob, anomaly)
5. summary  := CampaignAnalyzer.analyze(campaign)
6. text     := Explainer.explain(campaign, prob, anomaly)
7. attach ADVISORY_DISCLAIMER to every payload returned to the client
```

Steps 4–6 each attempt the NVIDIA API when a key is present and fall back to a
deterministic heuristic otherwise. Both paths must return the same JSON shape, or
the UI breaks when the key appears or disappears.

---

## 8. Event to UI mapping

The ledger surface reads on-chain events. Mapping from event to the row it
renders:

| Event | Ledger row | Amount shown |
|---|---|---|
| `ContributionReceived` | contribution | `amount`, running `totalRaised` |
| `ExcessRefundIssued` | refund of excess | `amount` |
| `CampaignFunded` | campaign funded | `totalRaised` |
| `CampaignFailed` | campaign failed | `totalRaised` |
| `MilestoneSubmitted` | evidence submitted, attempt `n` | — |
| `MilestoneApproved` | milestone approved | `trancheAmount` |
| `MilestoneRejected` | milestone rejected, `finalRejection` flag | — |
| `TrancheWithdrawn` | tranche paid to creator | `amount` |
| `ContributorRefundIssued` | refund to contributor | `amount` |

Because `CampaignFunded` and the transition to `IN_PROGRESS` are emitted in the
same transaction, the ledger will show funding while the campaign state already
reads `IN_PROGRESS`. That is expected, not a bug.

Amounts arrive as `uint256` wei. Format with `formatEther` and truncate at
display — see `design.md` §7 for the rules, and note that JavaScript `Number`
cannot hold wei exactly.

---

## 9. Frontend

Stack: React 19.2, Vite 8, Tailwind CSS v4 (CSS-first, no config file), Ethers
v6.17, react-router-dom v7, lucide-react, oxlint.

### 9.1 Page components

`Landing`, `Explore`, `CampaignDetails`, `CreateCampaign`, `CreatorDashboard`,
`MyContributions`, `Verifier`, `VerifierPortal`, `WalletManagement`, `AiRiskReport`,
`TransactionLedger`, `Documentation`, `Auth` — 13 files under `src/pages/`.

Only 11 are mounted. `CreatorDashboard.jsx` has no view id in `App.jsx`, so the
creator workspace does not exist in the running app; `Verifier.jsx` is a
duplicated verifier page superseded by `VerifierPortal.jsx`; and
`components/Navbar.jsx` is imported by nothing.

Components under `src/components/`: `Navbar.jsx` (dead), `Chatbot.jsx` (mounted
once, outside `MainLayout`, inside `AppProvider`).

### 9.1.1 Component tree

There is **no router**. `react-router-dom` v7 is a devDependency whose only
importer is the dead `Navbar.jsx`; with no `<Router>` provider, mounting `Navbar`
would throw. `App.jsx` holds `currentView` in state and mounts one view at a time,
so nothing is deep-linkable and the URL never changes.

```
main.jsx
└── App.jsx                              «AppProvider + MainLayout + Chatbot»
    ├── context/AppContext.jsx           provides currentView, account, balance,
    │                                    user, campaigns, activities,
    │                                    myContributions, contributeToCampaign
    ├── components/Chatbot.jsx           global; posts to /api/chat directly (L-18)
    └── MainLayout                       holds isDarkMode state + toggle (NOT AppContext)
        ├── header + sidebar + mobile nav (all setCurrentView)
        └── currentView === 'Landing'      → pages/Landing.jsx
            currentView === 'Auth'         → pages/Auth.jsx
            currentView === 'Explore'      → pages/Explore.jsx
            currentView === 'Campaign'     → pages/CampaignDetails.jsx
            currentView === 'Create'       → pages/CreateCampaign.jsx
            currentView === 'Contributions'→ pages/MyContributions.jsx
            currentView === 'Verifier'     → pages/VerifierPortal.jsx
            currentView === 'Wallet'       → pages/WalletManagement.jsx
            currentView === 'AiRisk'       → pages/AiRiskReport.jsx
            currentView === 'Ledger'       → pages/TransactionLedger.jsx
            currentView === 'Docs'         → pages/Documentation.jsx

  never mounted:  pages/CreatorDashboard.jsx · pages/Verifier.jsx · components/Navbar.jsx
```

Supporting modules, none of which are components:

| Module | Role |
|---|---|
| `context/AppContext.jsx` | Views, wallet, campaigns, ledger activity. Only consumer of `mockData.js`; only consumer of `contractConfig.js`; one of two consumers of `api.js`. Fabricates contribution receipts — see L-20 |
| `services/api.js` | Backend calls, plus a synthetic fallback payload per call on failure (L-17) |
| `contractConfig.js` | Hardcoded address + 29-entry string ABI. Imported by `AppContext.jsx` and **never used** — no `Contract` is constructed (L-24) |
| `mockData.js` | Placeholder campaigns. Must be gone before the demo, or the demo shows invented data |
| `index.css` | The entire theme — Tailwind v4 tokens, unlayered, in `:root` and `.dark` |

Three things the tree exposes that a flat file list does not:

- **Three files are dead.** `CreatorDashboard.jsx`, `Verifier.jsx`, and
  `Navbar.jsx` are reachable from nothing. An unreachable duplicate reads as a
  second implementation during a viva (L-16, L-22).
- **Every "route" is a button.** No `<a href>` exists for navigation, so
  Cmd/Ctrl-click, back, refresh, and sharing a link all fail. If routing is
  claimed in the report, it has to be built first (L-23).
- **The mounted view set is the whole app surface.** Anything not in the list
  above cannot be demonstrated, whatever `pages/` contains.


### 9.2 Shared state — `context/AppContext.jsx`

Holds `currentView`, `account`, `balance`, `user`, `campaigns`, `activities`, and
`myContributions`; the only consumer of `src/mockData.js`, and the only consumer
of `contractConfig.js`.

**Theme is not here.** `isDarkMode` is `useState` in `App.jsx`'s `MainLayout`,
synced to `document.documentElement.classList` and `localStorage` by a
`useEffect` on mount — which is why the page flashes the wrong theme on load;
`index.html` has no blocking inline script.

Ethers is imported in **two** files: here (`BrowserProvider`, `formatEther`,
`parseEther`) and the dead `components/Navbar.jsx` (`BrowserProvider`).
`CampaignDetails`, `TransactionLedger`, and `WalletManagement` do not import
ethers; they link out to `sepolia.etherscan.io`.

This file is also where the on-chain half is simulated. `contributeToCampaign()`
runs the cap arithmetic locally, mutates `campaigns`, and fabricates a `txHash`
from 64 random hex characters plus a random block number for the ledger row.
Wallet connection is real — `eth_requestAccounts`, `wallet_switchEthereumChain`
to Sepolia (chain `0xaa36a7`), `accountsChanged`/`chainChanged` listeners — but no
transaction is ever constructed or signed.

Because the backend has no session, the "signed-in" state is front-end only: it
cannot be trusted to mean anything, and no authorisation decision may depend on it.

### 9.3 API client — `services/api.js`

| Function | Route | On failure returns |
|---|---|---|
| `checkHealth()` | `GET /api/health` | `{status: 'offline'}` |
| `fetchCampaigns()` | `GET /api/campaigns` | `null` |
| `fetchCampaignById(id)` | `GET /api/campaigns/<id>` | `null` |
| `createCampaignApi(data)` | `POST /api/campaigns` | rethrows |
| `predictSuccess(features)` | `POST /api/predict` | fabricated score + disclaimer |
| `assessRisk(features)` | `POST /api/risk` | fabricated anomaly tier + disclaimer |
| `analyzeCampaignWithAi(data)` | `POST /api/ai/analyze` | fabricated assessment + disclaimer |
| `explainCampaignWithAi(data)` | `POST /api/ai/explain` | fabricated explanation + disclaimer |
| `reviewEvidenceWithAi(milestone, evidence)` | `POST /api/ai/review-evidence` | fabricated checklist + disclaimer |
| `verifyKycApi(address, fullName, country)` | `POST /api/verify/kyc` | `{verified: false, error}` |

**The failure mode is fabrication, not null.** Six wrappers catch the error, log a
warning, and return a synthetic payload tagged `source: 'local_fallback'`. The
`predictSuccess` fallback computes
`0.4·normGoal + 0.3·normDuration + 0.2·balancedMilestones + 0.1·completeness` and
returns it as `success_probability` with the real advisory disclaimer attached.
`assessRisk` invents an `anomaly_score` from goal and description length and maps
it through the same thresholds as the real model. So with the backend down, the
UI shows numbers indistinguishable from model output, and the disclaimer makes
them look more official rather than less. Two wrappers return `null` and are the
only ones that degrade visibly. Replace the fabrications with a surfaced error
state before the demo — `tasks.md` B-05.

No client wrapper exists for `/api/auth/google` or `/api/chat`. Verified:
`Chatbot.jsx` calls `/api/chat` directly with `fetch`, and `Auth.jsx` is not
routed through this module.

Relative URLs rely on the Vite dev proxy (`/api` to `http://127.0.0.1:5000`),
which does not exist in a static build.

### 9.4 Chain access — `contractConfig.js`

Exports `CONTRACT_ADDRESS` (hardcoded, unverified) and `CONTRACT_ABI` as a
**29-entry** string-ABI array — 20 functions and 9 events. The ABI matches
`contracts/TrustBridge.sol` including the duplicated milestone getters
(`milestones(uint256)` and `getMilestone(uint8)`), so it was written from the same
source.

**Neither export is used.** `AppContext.jsx` imports both on line 3 and never
references them again; there is no `new Contract(...)` in the repository. So the
frontend performs no chain read and no chain write — the address being dead is
currently unobservable, because nothing calls it.

Two consequences of the hardcoded address when it is eventually wired: it violates
`rules.md` §7 rule 7, and if it is not a live TrustBridge contract every read will
revert. `backend/seed_data.py` hardcodes three addresses, of which only the first
matches this one — so "change them together" is not a two-file edit.

Enum mapping: the ABI returns `uint8` for `state` and milestone `state`, matching
§2.1. The UI needs a constant map from integer to label, kept in one place. There
is no such map in the codebase yet; the campaign objects in `AppContext` carry
string states (`'ACTIVE'`, milestone `'APPROVED'`) that come from `mockData.js` and
from hardcoded defaults, not from the ABI.

### 9.5 Theming

CSS custom properties in `index.css`, overridden in `.dark`, activated by a
`.dark` class on `<html>` via
`@custom-variant dark (&:where(.dark, .dark *))`. The token table is in
`architecture.md` §5; the contrast audit, which finds four light-theme values
failing even the 3:1 non-text threshold, is in `design.md` §3 — and unlike the
other items here, that one is a real defect in the shipped tokens.

---

## 10. Test design

`node tests/runner.js` — 63 tests, 4 tiers, 63 pass in 0.013 s (2026-09-20).

| Tier | Count | Covers |
|---|---|---|
| 1 | 6 suites | theme toggle, "routes", escrow contribution, tranche stepper, AI risk telemetry, MetaMask sync |
| 2 | 4 suites | hard-cap headroom, minimum-goal threshold, excess-refund split, milestone retry limit |
| 3 | 1 suite | cross-feature interactions |
| 4 | 1 suite | end-to-end lifecycle scenarios |

The tier-1 navigation suite checks nothing. `navigation_routes.test.js` declares
its own `viewRegistry` object literal inside the test file and asserts against
that object (`assertEqual(view.id, 'Landing')`, with `view = viewRegistry.Landing`
three lines above); each result is pushed with a literal `passed: true`. No
application code is loaded, so no failure mode exists. It also names paths
(`/explore`, `/campaign/1`) that the frontend cannot render — it has no router.
The other five tier-1 suites use `state_oracle.js` / `theme_oracle.js`; this one
uses its own fixture.

**What is actually under test.** `tests/helpers/contract_oracle.js` is a
JavaScript reimplementation of the contract; the suites exercise that, not
Solidity. No compiler runs, no chain is touched. `state_oracle.js` and
`theme_oracle.js` cover UI and theme state in-process.

So the suite verifies that two hand-written implementations agree on a set of
scenarios. That is a specification check with real value, and it is not evidence
about the compiled contract — the oracle can share the same misunderstanding as
the contract.

The porting target is a Hardhat suite that calls the real contract. The tests that
matter most and do not exist yet:

| Test | Asserts |
|---|---|
| Full lifecycle to `COMPLETED` | Would **fail** today on B-01 |
| `FAILED` then `claimRefund` | full refund path |
| `REJECTED` twice then `REFUNDABLE` | pro-rata refund path |
| Non-creator calls `withdrawTranche` | `"Only creator permitted"` |
| Non-verifier calls `approveMilestone` | `"Only verifier permitted"` |
| `receive()` reverts | `"Use contribute() function"` |
| Contribution at a full cap | reverts `"Hard cap reached"` — see §12 |
| Reentrancy with a hostile receiver | guard holds |

---

## 11. Conventions

- Status markers `[x]` verified, `[~]` implemented but unverified, `[ ]` not
  started, `[!]` blocked — used in `prd.md` and `tasks.md`.
- Solidity: `@notice` on every function, `@dev` where the arithmetic is
  non-obvious (`rules.md` §2).
- Python: a docstring on every function.
- JS: JSDoc on components.
- Names: `snake_case` in Python and SQLite, `camelCase` in JavaScript, `mixedCase`
  in Solidity, `SCREAMING_SNAKE` for constants.
- ETH amounts: `_eth` suffix off-chain, wei-denominated `uint256` on-chain. Never
  mix the two in one expression.

---

## 12. Open low-level items

| # | Item | Detail |
|---|---|---|
| L-1 | `MilestoneState.SUBMITTED` unreachable | Declared, never assigned; §3.4. Remove it or use it |
| L-2 | `CampaignState.FUNDED` transient | §3.3 |
| L-3 | `currentMilestoneIndex` not advanced | B-01, §3.11 |
| L-4 | Over-cap contribution reverts | Contradicts the T6 expectation in `tasks.md` WS-4 and possibly the oracle; §3.1. Reconcile before writing the T6 record |
| L-5 | `withdrawTranche` has no campaign-state guard | Can pay out during `REFUNDABLE`, shrinking the refund pool; §3.7 |
| L-6 | REFUNDABLE refund is not equal-per-wei-in | §3.8, decision D-2 |
| L-7 | Division by zero in `claimRefund` | Reachable when `totalWithdrawn == totalRaised`; §3.8 |
| L-8 | Per-sender reentrancy guard | §2.6 |
| L-9 | `ai_assessments` has no write path | §4.2 |
| L-10 | SQLite foreign keys unenforced | `PRAGMA foreign_keys` never set; §4.2 |
| L-11 | `CATEGORY_MAP` unknown fallback to `AI/ML` | §6.2 |
| L-12 | `predict_success` returns `0.82` with no model | §6.3 |
| L-13 | Risk tier thresholds are absolute | Invalidated by retraining; §6.4 |
| L-14 | Feature 3 counts characters, feature 4 counts words | Undocumented asymmetry; §6.1 |
| L-15 | `/api/auth/google` trusts the request body | §5.10 |
| L-16 | Two verifier page components | `Verifier.jsx` is dead; `VerifierPortal.jsx` is mounted as `currentView === 'Verifier'`; §9.1 |
| L-17 | `api.js` invents payloads on failure | Six wrappers return synthetic ML/AI output carrying the real disclaimer, so a dead backend is indistinguishable from a working one; §9.3 |
| L-18 | No `api.js` wrapper for auth or chat | `Chatbot.jsx` posts to `/api/chat` directly; §9.3 |
| L-19 | `campaigns.goal_eth` stored as `REAL` | Metadata only; never use for money arithmetic; §4.1 |
| L-20 | `contributeToCampaign` fabricates a transaction | 64 random hex chars as `txHash`, `5932000 + random` as `blockNumber`, then a ledger row. No wallet prompt, no transaction, no chain; §9.2 |
| L-21 | Campaign figures are derived, not read | `totalRaised: goal_eth × 0.725`, `mlScore: 92`, `riskLevel: 'LOW'`, and invented milestone states on load. Four fake `activities` ship seeded; §9.2 |
| L-22 | `CreatorDashboard.jsx` is unreachable | No view id mounts it, so the creator workspace in `prd.md` FR-14 has no surface; §9.1 |
| L-23 | `react-router-dom` installed, no provider | Imported only by the dead `Navbar.jsx`; mounting it would throw. Navigation is `setCurrentView` buttons, so nothing is deep-linkable; §9.1.1 |
| L-24 | `CONTRACT_ADDRESS` and `CONTRACT_ABI` are imported and unused | No `Contract` object exists anywhere; there is no chain read and no chain write to block; §9.4 |
| L-25 | Default milestone title says "Mainnet Deployment" | Contradicts `rules.md` §2; a string in `app.py` and `seed_data.py`; §5.3 |
