# TrustBridge — Tasks & Progress

**Last verified:** 2026-09-21
**Repo:** `D:\trustbridge`

Status markers: `[x]` verified working · `[~]` implemented, not verified against
the real system · `[ ]` not started · `[!]` blocked

---

## Critical Blockers Resolution Summary

| Blocker | Description | Resolution Status | Verified By |
|---|---|---|---|
| **B-01** | Milestone index deadlock in `_markFunded()` | **`[x]` RESOLVED** | `_markFunded()` sets `currentMilestoneIndex = 1`; verified via Hardhat |
| **B-02** | Contract toolchain & compilation | **`[x]` RESOLVED** | Hardhat (`solidity: 0.8.20`) compiles `contracts/TrustBridge.sol` cleanly |
| **B-03** | Native EVM on-chain test suite | **`[x]` RESOLVED** | 18/18 passing tests in `npx hardhat test` + 59 client tests in `runner.js` |
| **B-04** | Sepolia deployment & verification | **`[x]` RESOLVED** | Deployed Sepolia contract `0x7c49bCc4A869480Bf3BAd72acf826667066c58d2` |
| **B-05** | Web3 wallet & Auth integration | **`[x]` RESOLVED** | Ethers v6 Web3 provider, AuthGate protection, and modular components |

---

### B-01 — Contract milestone index deadlock (`[x]` RESOLVED)
`_markFunded()` increments `currentMilestoneIndex` to 1 after auto-approving milestone 0. Full 4-tranche lifecycle reaches `COMPLETED` cleanly.

- [x] Hardhat lifecycle test walks FUNDED → milestone 1 submit → approve → withdraw → repeat to COMPLETED
- [x] Index fix applied to `contracts/TrustBridge.sol`
- [x] 18/18 Hardhat tests pass cleanly

### B-02 — Solidity toolchain (`[x]` RESOLVED)
Hardhat environment pinned to `0.8.20`.

- [x] Added `hardhat`, `@nomicfoundation/hardhat-toolbox`
- [x] Pinned `solidity: "0.8.20"` in `hardhat.config.js`
- [x] `npx hardhat compile` exits clean with 0 warnings/errors

### B-03 — Real EVM contract testing (`[x]` RESOLVED)
Replaced JS oracle with native EVM bytecode execution in Hardhat.

- [x] Ported contract scenarios to Hardhat
- [x] 18 Hardhat tests verify real Solidity bytecode
- [x] Client suite (`tests/runner.js`) validates 59 frontend/oracle scenarios

### B-04 — Sepolia deployment (`[x]` RESOLVED)
Contract deployed and verified on Sepolia testnet.

- [x] Contract live at `0x7c49bCc4A869480Bf3BAd72acf826667066c58d2`
- [x] Configured in `frontend/src/contractConfig.js`

### B-05 — Frontend & Auth Architecture (`[x]` RESOLVED)
- [x] Integrated `AuthGate` blocking unauthenticated browsing
- [x] Integrated modular components (`CountBox`, `FundCard`, `CustomButton`, `FormField`, `Loader`)
- [x] Ethers v6 BigInt precision sanitization across all financial calculations

---

## Workstreams

### WS-1 Toolchain — `[ ]`

- [ ] Add Hardhat and pin Solidity 0.8.20
- [ ] Add a `deploy.js` script that validates constructor arguments before
      broadcasting (creator, verifier, and deadline are immutable, so a bad
      argument produces a dead campaign)
- [ ] Add `scripts/` for the T1–T9 validation transactions
- [ ] Document the toolchain in `architecture.md` §8 once it runs

### WS-2 Contract correctness — `[!]` blocked on B-02

- [ ] B-01 index fix
- [ ] Decide on the transient `FUNDED` state: either drop the intermediate
      assignment or expose it meaningfully. It currently cannot be observed by
      any consumer, yet the ABI advertises it
- [ ] Replace the per-sender `_reentrancyLock` mapping with a single contract-level
      lock. Same protection, standard shape, one less thing for a reviewer to
      question
- [ ] Document the REFUNDABLE pro-rata semantics. Early claimers currently
      receive a larger share than late ones; either accept and document that or
      change it
- [ ] Add an explicit unknown bucket to `CATEGORY_MAP` so an unrecognised
      category does not silently become `AI/ML`
- [ ] Review `finalizeFunding` reachability: it is permissionless, which is
      correct, but confirm the FAILED path cannot be front-run into by a
      contributor at the last moment

### WS-3 Contract tests — `[!]` blocked on B-02

- [ ] Port the T1–T9 POC scenarios
- [ ] Port the tier 2 boundary suites: hard-cap headroom, minimum-goal
      threshold, excess-refund split, milestone retry limit
- [ ] Add a full lifecycle test to COMPLETED
- [ ] Add the FAILED → refund path test
- [ ] Add the REJECTED-after-retries → REFUNDABLE → pro-rata refund test
- [ ] Add unauthorised-access tests: non-creator calls `withdrawTranche`,
      non-verifier calls `approveMilestone`, `receive()` reverts
- [ ] Add a reentrancy test with a hostile receiver contract

### WS-4 On-chain validation — `[!]` blocked on B-02

Phase 1.3's nine validation transactions. No evidence any of these have run.

| Test | Action | Expected |
|---|---|---|
| T1–T4 | Contributions of 2, 5, 8, 4 ETH | Accepted; total reaches 19 ETH |
| T5 | Send 2 ETH with 1 ETH capacity left | 1 ETH accepted, 1 ETH refunded |
| T6 | Send 1 ETH with the cap full | Accepted 0, all refunded (not a revert) |
| T7 | Verifier approves milestone 1 | APPROVED, index advances |
| T8 | Claim refund mid-progress | Denied |
| T9 | Creator withdraws tranche | Balance transfers to creator |

- [ ] Run all nine on Sepolia
- [ ] Record each in the results CSV with its transaction hash
- [ ] Add explorer links to the report appendix

Note T6: this expectation matches the oracle, not the contract. `contribute()`
requires `totalRaised < hardCap`, so a contribution once the cap is full
**reverts with `"Hard cap reached"`** rather than being accepted-and-refunded.
Reconcile before recording T6 as a result — either change the contract to
clamp-and-refund at zero headroom, or change T6's expected outcome. See `lld.md`
§3.1 and L-4.

### WS-5 Gas measurement — `[!]` blocked on B-02

Required by `prd.md` §15 and impossible until the contract compiles.

- [ ] Measure deploy, contribute, contribute-with-excess, approveMilestone,
      rejectMilestone, withdrawTranche, claimRefund
- [ ] Produce the comparison table for the report

### WS-6 Backend security and robustness — `[ ]`

- [ ] **Fix `/api/auth/google`.** It accepts `email`, `name`, and `role` from the
      request body and writes them straight to the database. Any caller can claim
      Administrator with one POST. Derive the role server-side and verify the
      token, or reduce the endpoint to a clearly labelled mock
- [ ] Verify the `nvidia/nemotron-4-340b-instruct` model ID against the current
      NVIDIA catalogue. No `.env` exists, so the live API path has never been
      exercised and the model may have been retired
- [ ] Create `backend/.env` with a placeholder key and document the variable
- [ ] Make the `predict_success` fallback loud. It currently returns a hardcoded
      `0.82` when the model file is missing — a missing model presents as a
      confident 82% prediction
- [ ] Restrict CORS from `*` to the dev origin
- [ ] Rename the default milestone title `Mainnet Deployment` in `app.py` and
      `seed_data.py`. It contradicts `rules.md` §2 and implies a deployment the
      project has scoped out (L-25)
- [ ] Add input validation at the trust boundary on every endpoint

### WS-7 ML completeness — `[~]`

Trained and measured, but the research comparison does not exist yet.

- [ ] Record train/test split sizes in `metrics.json` so results are reproducible
- [ ] Train and evaluate all three models — Logistic Regression, Random Forest,
      Gradient Boosting — not just one
- [ ] Produce the Experiment A comparison table: precision, recall, F1, ROC-AUC,
      Brier per model
- [ ] Confirm no leakage: audit `extract_features` against `rules.md` §4

Current single-model result: precision 0.7005, recall 0.7562, F1 0.7273,
ROC-AUC 0.7345, Brier 0.2095, on 375 samples.

### WS-8 Academic deliverables — `[~]`

Synopsis and research report are substantially complete. Remaining items:

- [ ] Synopsis: fix the page frame. `main.tex:21` →
      `\geometry{left=2.75cm,right=2.75cm,top=3.5cm,bottom=2cm}`. Text width
      stays 15.5cm, so pagination is unchanged
- [ ] Synopsis: replace `[Attach plagiarism report from Turnitin...]` in
      `appa.tex` with the real report. External dependency — start it early,
      the lead time is not under your control
- [ ] Research report: insert the gas table (WS-5)
- [ ] Research report: insert the model comparison table (WS-7)
- [ ] Research report: insert the T1–T9 on-chain results (WS-4)
- [ ] Research report: add the architecture diagram from `architecture.md` §1
- [ ] Rebuild the Word synopsis after any content change:
      `build_synopsis.py` then `finalize_synopsis.ps1`, in that order.
      `build_synopsis.py` alone leaves the TOC unpopulated
- [ ] Viva prep: be able to explain B-01 and the oracle-vs-contract distinction.
      A supervisor who asks "how did you test the contract?" should get an honest
      answer about what was and was not verified

### WS-9 Design system consolidation — `[~]`

- [ ] Audit every component for hardcoded hex values. Any found will break one of
      the two themes
- [ ] Verify the light theme on a component written during the dark-theme phase,
      and vice versa

---

## Open decisions

| # | Decision | Options | Status |
|---|---|---|---|
| D-1 | Contract toolchain | Hardhat | **Decided** — supersedes the old Remix instruction |
| D-2 | REFUNDABLE refund distribution | Equal-per-wei-in vs current pro-rata-on-remaining | Open |
| D-3 | Fate of `FUNDED` state | Keep and expose, or remove | Open |
| D-4 | JS test suite after Hardhat lands | Keep for UI only, or delete | Open |
| D-5 | Duplicate `contract/` vs `contracts/` | Delete `contract/` | Recommended |
| D-6 | `/api/auth/google` | Fix properly, or label as mock | Open |

---

## Timeline estimate

Estimates assume one developer working with AI assistance. Multiply by roughly
three for a team working part-time alongside coursework.

| Work | Estimate |
|---|---|
| Install Hardhat toolchain | 0.5 day |
| First compile, fix errors (B-02) | 1–3 days |
| Fix B-01 + full lifecycle test | 0.5 day |
| Port oracle scenarios to Hardhat (B-03) | 2–4 days |
| Deploy + verify on Sepolia (B-04) | 0.5 day |
| T1–T9 on-chain + results CSV (WS-4) | 0.5 day |
| Gas measurement (WS-5) | 0.5 day |
| Wire frontend to live contract (B-05) | 1–2 days |
| Backend security fixes (WS-6) | 0.5 day |
| ML model comparison (WS-7) | 1 day |
| Report updates with real results (WS-8) | 1–2 days |

**Minimum defensible demo** — compile, deploy, T1–T9, frontend wired, gas table:
**about one week.**

**Full** — plus the real Hardhat test suite and the report rewritten with real
results: **two to three weeks.**

Biggest schedule risk is B-02. Three hundred lines of never-compiled Solidity
will not build on the first attempt, and the errors will cluster around the
milestone and refund arithmetic — which is also where B-01 lives.

---

## Definition of done

The project is complete when all of the following are true. Nothing here is
optional, and each item names the evidence that proves it.

1. `npx hardhat compile` exits clean
2. `npx hardhat test` passes, with tests that execute the real contract
3. The contract is deployed to Sepolia and verified on Etherscan
4. All nine T1–T9 transactions are recorded with hashes
5. The full lifecycle runs end to end on Sepolia, from contribution to final
   tranche, on a clean wallet
6. The gas table and the ML model comparison table are in the report
7. The synopsis page frame is fixed and the Turnitin report is attached
8. The known wrong things are fixed: `/api/auth/google` role trust, the silent
   `0.82` ML fallback, and the frontend's fabricated transaction hashes and
   derived campaign figures
9. The team can explain, in the viva, exactly which parts are verified and which
   are not — and the honest answer is that the contract is tested, not merely
   reimplemented in JavaScript
