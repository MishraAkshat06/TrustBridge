# TrustBridge — Project Memory

Context for a fresh session. Read this first, then `tasks.md` for what is in
flight. Everything here was verified on 2026-09-20 unless marked otherwise.

---

## What this is

**TrustBridge** — an AI-assisted, blockchain-enforced crowdfunding platform.
A BTech final-year academic project and research-paper prototype combining
machine learning, agentic AI, and smart-contract escrow.

**Core principle, never violate it:**

> AI helps users decide. Humans verify real-world milestones. Smart contracts
> control predefined financial rules. Blockchain records the result.

### Team

| Name | Roll number |
|---|---|
| Akshar Vikram | 2300911530012 |
| Akshat Mishra | 2300911530013 |
| Aditya Kasoudhan | 2300911530007 |

**Supervisor:** Ms. Upasana
**Session:** 2026–27

---

## The one-paragraph status

The off-chain half is real and working: a Flask backend with 12 endpoints, four
AI agents, trained ML models, and a React frontend with 11 mounted views and two
fully themed modes. The on-chain half is not: `contracts/TrustBridge.sol` has
**never been compiled**, nothing is deployed to Sepolia, and the 63 passing tests
verify a JavaScript reimplementation of the contract rather than the contract
itself. Worse, the frontend has no contract call at all — it simulates one,
inventing transaction hashes and deriving the raise figure from the goal. A logic
error in the milestone indexing (see `tasks.md` B-01) would break the contract flow
after the first tranche even once deployed. The path from here is compile, test,
deploy, then replace the simulation with real calls.

---

## Where everything lives

### The application — `D:\trustbridge`

| Path | What |
|---|---|
| `contracts/TrustBridge.sol` | The real contract, 306 lines, Solidity 0.8.20, uncompiled |
| `contracts/TrustBridgePOC.sol` | POC contract variant |
| `contract/` | Duplicate directory — `TrustBridge.sol` is a 4-line import shim, and its `TrustBridgePOC.sol` **diverges** from the `contracts/` copy. Should be deleted |
| `backend/app.py` | Flask entry point, all routes, port 5000 |
| `backend/ml/` | `train.py`, `predictor.py`, trained `.joblib` artefacts, `metrics.json` |
| `backend/agents/` | Four agents + shared `ADVISORY_DISCLAIMER` |
| `backend/trustbridge.db` | SQLite, gitignored |
| `frontend/src/pages/` | 13 page files — 11 mounted, 3 files dead (see traps) |
| `frontend/src/App.jsx` | Layout, theme state, and the `currentView` switch — **no router** |
| `frontend/src/index.css` | Both theme token sets, unlayered in `:root` and `.dark` |
| `frontend/src/contractConfig.js` | Hardcoded address + 29-entry ABI — imported, never used |
| `tests/runner.js` | 63 tests, 4 tiers, all pass — but see B-03 |
| `docs/` | Reference material. **Read-only — inspect, never write** |

### The academic deliverables — outside the app repo

| Path | What |
|---|---|
| `D:\premiere\clips\Final_Year_Synopsis_Format__AIML\` | Synopsis LaTeX source: `main.tex`, `chapter1..8`, `appa.tex`, `aktu.cls` |
| `D:\premiere\clips\main.pdf` | Synopsis PDF, 49 pages |
| `D:\premiere\clips\TrustBridge_Synopsis_Final.docx` | Word synopsis, 28 pages, generated 2026-09-19 |
| `D:\claude code cli\build_synopsis.py` | Builds the Word synopsis by editing the source docx's OOXML |
| `D:\claude code cli\finalize_synopsis.ps1` | Drives Word over COM to fill the TOC and repaginate |
| `D:\major project\TrustBridge_Research_Analysis.*` | Research report, HTML + PDF |
| `D:\major project\research\main.pdf` | Research report LaTeX, 108 pages |
| `D:\major project\TrustBridge_Vulnerability_Analysis.md` | Security analysis |
| `D:\major project\TrustBridgePOC_v2.sol` | Remediated contract, 447 lines — **never compiled either** |
| `D:\major project\skills\` | This documentation set |
| `D:\trustbridge\docs\` | Read-only reference material |

### This documentation set — `D:\major project\skills\`

| File | Purpose |
|---|---|
| `prd.md` | What the product must do, with honest status markers |
| `architecture.md` | How it is built, as opposed to how it was meant to be built |
| `rules.md` | Binding coding conventions |
| `tasks.md` | Blockers, workstreams, timeline, definition of done |
| `memory.md` | This file — context for a fresh session |
| `design.md` | UI/UX direction and design system |
| `hld.md` | High level design — components, interfaces, data placement, trust boundaries |
| `lld.md` | Low level design — contract, schema, routes, algorithms, error paths |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19.2, Vite 8, Tailwind CSS v4, Ethers.js v6.17 |
| Routing | react-router-dom v7 |
| State | React context only — no Redux |
| Backend | Python 3.13, Flask, flask-cors |
| ML | pandas, NumPy, scikit-learn, XGBoost, joblib |
| Agents | NVIDIA Nemotron via API, with deterministic heuristic fallbacks |
| Blockchain | Solidity ^0.8.20, Ethereum Sepolia (chain ID 11155111) |
| Contract toolchain | **Hardhat** |
| Off-chain store | SQLite |
| Lint | oxlint |

### Banned

Next.js, Redux, MongoDB, PostgreSQL, Web3.js.

### Superseded instruction

An older project-context document said "Do not use Hardhat or Truffle — Remix IDE
is used for contract deployment." **That is superseded.** The toolchain is
Hardhat, chosen so contract logic is reproducible and testable. If you find the
old instruction elsewhere, it is stale — fix it. The reason the switch matters is
that the contract has never been compiled at all, and a click-to-deploy IDE
leaves no automated test and no reproducible record.

---

## Environment notes

- **`pdflatex` is not on PATH.** It is at
  `C:\Users\dell\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe`
- **Word is installed and automatable** over COM — that is how
  `finalize_synopsis.ps1` fills the TOC
- **No PDF page renderer.** `pdftotext` works in Git Bash, but there is no
  `pdftoppm` and no `fitz`/`pypdf`, so PDFs can be read as text but not rendered
  as images
- **No Solidity toolchain.** No `solc`, no Hardhat, no Foundry. Node and npm are
  at `D:\node\`
- **No `.env` file exists.** `NVIDIA_API_KEY` is unset, so every agent has been
  running its heuristic fallback path and the live API path is untested
- **Backend venv:** `backend/venv/`, invoked as
  `./venv/bin/python.exe app.py` from Git Bash

---

## Hard rules

1. **Never store private keys anywhere.** Not in source, not in `.env`, not in a
   comment, not in a log.
2. **KYC and identity documents never go on-chain.**
3. **AI never holds a key, signs, or moves funds.** The AI layer is advisory only.
4. **Every AI/ML output carries the disclaimer:**
   `"This is an AI-generated advisory assessment and not a financial verdict."`
5. **Hard cap is exactly 20 ETH. Minimum goal is 10 ETH.** Non-negotiable.
6. **Sepolia only.** Never mainnet.
7. **Never train on post-campaign data.** Leakage invalidates the research result.
8. **`D:\trustbridge\docs\` is read-only.** Inspect and search freely, never edit,
   create, rename, or delete anything there.
9. **Never mark work complete on the basis of code existing.** Compile it, run it,
   or exercise it.
10. **Ask before installing a global dependency.**

---

## Product decisions worth remembering

**Why an initial development tranche exists.** Requiring a working prototype
before any money flows creates a chicken-and-egg problem: no funding means no
prototype, and no prototype means no funding. The initial 20% tranche resolves it
while keeping the remaining 80% milestone-gated.

**Tranche schedule:** 20% / 25% / 25% / 30% (2000 / 2500 / 2500 / 3000 basis
points), stored per-milestone so they are configurable per deployment.

**Why the verifier is human.** A blockchain cannot verify whether a physical
prototype exists. AI reviews the evidence, but a human approves the release. This
is a deliberate trust point, not an oversight to be engineered away — state it as
a limitation in the report.

**What the research claims.** Not novelty from using ML or blockchain — both are
well researched. The claim being tested is whether the *integration* of ML
prediction, risk detection, agentic explanation, creator verification, and
programmable escrow improves transparency, decision support, and control over
funds. Validate against a literature review before asserting novelty.

---

## Known traps

Things that have already cost time or would cost time again.

1. **The 63/63 green test suite does not verify the contract.**
   `tests/helpers/contract_oracle.js` reimplements the contract in JavaScript.
   The suites named "Escrow Settling" and "Real-World Workloads" are testing that
   reimplementation. Useful as a specification check; not evidence about
   Solidity. This is the easiest thing in the project to be misled by.
2. **Two divergent copies of the POC contract.** `contract/TrustBridgePOC.sol`
   and `contracts/TrustBridgePOC.sol` differ at line 138 — one calls
   `contribute()`, the other `this.contribute{value: msg.value}()`. Point the
   toolchain at `contracts/` only, then delete `contract/`.
3. **The tier-1 navigation test suite cannot fail.**
   `tests/tier1_features/navigation_routes.test.js` asserts against a
   `viewRegistry` literal declared in the test file itself and pushes every
   result as `passed: true`. It names route paths the app does not have. The
   other five tier-1 suites use real simulators — this one uses its own fixture.
4. **`predict_success` returns a hardcoded `0.82` when the model file is
   missing.** A missing model presents to the user as a confident 82%
   prediction.
5. **`/api/auth/google` trusts a client-supplied role.** One POST can claim
   Administrator.
6. **The `FUNDED` campaign state is transient** — set and overwritten in the same
   transaction, so no consumer can ever observe it, even though the ABI exposes
   `state()`.
7. **`build_synopsis.py` alone leaves the synopsis TOC unpopulated.** Always
   follow it with `finalize_synopsis.ps1`.
8. **The configured contract address is unverified** and no deployment artefacts
   exist. Check Sepolia Etherscan before treating it as live. `seed_data.py`
   hardcodes three addresses; only the first matches `contractConfig.js`.
9. **There is no router.** `App.jsx` holds `currentView` in state and mounts one
   of 11 views; every navigation control is a `setCurrentView` button. No URL
   changes, nothing is deep-linkable, and back/refresh lose your place.
   `react-router-dom` is installed but imported only by the dead `Navbar.jsx`.
10. **The frontend simulates the chain.** `AppContext.contributeToCampaign` invents
    a 64-hex `txHash` and a block number and writes a ledger row — no wallet prompt
    is raised. Campaign load sets `totalRaised: goal_eth × 0.725` with a hardcoded
    `mlScore: 92`, `riskLevel: 'LOW'`, and four fake seeded `activities`. Never
    present any of this as on-chain evidence; the numbers cannot be traced to a
    transaction.
11. **`api.js` fabricates payloads when the backend is down.** Six of its ten
    wrappers return synthetic ML/AI output carrying the real disclaimer, so a dead
    backend and a working one look identical. If a demo "works", confirm the Flask
    process is actually up.
12. **Three frontend files are dead:** `pages/CreatorDashboard.jsx` (no view id —
    the creator workspace has no surface), `pages/Verifier.jsx` (superseded by
    `VerifierPortal.jsx`), and `components/Navbar.jsx`.

---

## How to resume

1. Read this file, then `tasks.md`.
2. Check `tasks.md` critical blockers — B-01 through B-05 gate almost everything.
3. Confirm the environment: is Hardhat installed? Does `npx hardhat compile`
   pass? Has anything been deployed?
4. When making a claim about the contract, compile or test it first. When
   making a claim about the app, run it.
5. Update `tasks.md` as work lands. Keep the status markers honest.
