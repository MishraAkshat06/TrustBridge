# TrustBridge — Coding Rules

Binding conventions for this repository. These are not suggestions; deviations
need a reason written down in `tasks.md`. Where a rule exists because of a past
mistake, the reason is stated so you can judge edge cases instead of following
the letter of the rule off a cliff.

---

## 1. Stack — do not deviate

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8, Tailwind CSS v4, Ethers.js v6 |
| Routing | react-router-dom v7 — **installed, not in use**; see §6 Architecture |
| Wallet | MetaMask |
| Backend | Python 3.13, Flask, flask-cors |
| ML | pandas, NumPy, scikit-learn, XGBoost, joblib |
| Agentic AI | NVIDIA Nemotron via API, Python orchestration |
| Blockchain | Solidity ^0.8.20, Ethereum Sepolia |
| Contract toolchain | **Hardhat** |
| Off-chain store | SQLite |
| Lint | oxlint |

### Contract toolchain decision

An earlier version of the project context said "Do not use Hardhat or Truffle —
Remix IDE is used for contract deployment." **That instruction is superseded.**
Hardhat is now the toolchain, chosen so that contract logic is testable in CI
rather than verified by hand in a browser IDE.

The reason this matters: the contract in this repository has never once been
compiled. Remix deployment means a human clicking deploy, which leaves no
reproducible record and no automated test. Hardhat gives a compile step, a test
step, and a deploy script that anyone on the team can rerun. If you find the old
instruction anywhere else, it is stale — fix it.

### Also banned

- **Next.js** — React + Vite only
- **Redux** — React state and context only
- **MongoDB / PostgreSQL** — SQLite or flat JSON for the prototype
- **Web3.js** — Ethers.js v6 only
- **Hardhat or Foundry on the frontend build path** — the frontend stays Vite

### Approved packages

npm: `react`, `react-dom`, `vite`, `ethers` (v6), `tailwindcss`,
`react-router-dom`, `recharts`, `lucide-react`, `oxlint`.
Hardhat adds: `hardhat`, `@nomicfoundation/hardhat-toolbox`, `chai`, `mocha`.

pip: `flask`, `flask-cors`, `pandas`, `numpy`, `scikit-learn`, `xgboost`,
`joblib`, `python-dotenv`, `requests`.

Adding anything outside these lists requires asking first. Flag it, don't just
install it.

---

## 2. Solidity rules

### Never break these

- **Network:** Ethereum Sepolia only, chain ID 11155111. No mainnet, ever.
- **Hard cap: exactly 20 ETH.** Reject anything that would push `totalRaised`
  above it. The current design accepts the remainder and refunds the excess in
  the same transaction rather than reverting, so a contributor who overshoots
  still gets their accepted portion in. Preserve that behaviour — reverting
  instead would be a worse user experience and would break the documented T5
  test case.
- **Minimum goal: 10 ETH.**
- **AI never holds a private key, signs, or transfers ETH.**
- **KYC data never goes on-chain.**
- **Private keys never appear in any file** — not frontend, not backend, not
  `.env`, not a comment.

### Hard-cap contribution logic

```solidity
uint256 remaining = hardCap - totalRaised;
uint256 accepted = msg.value > remaining ? remaining : msg.value;
uint256 refundAmount = msg.value - accepted;

if (accepted > 0) {
    contributions[msg.sender] += accepted;
    totalRaised += accepted;
    emit ContributionReceived(msg.sender, accepted, totalRaised);
}
if (refundAmount > 0) {
    emit ExcessRefundIssued(msg.sender, refundAmount);
    (bool ok, ) = payable(msg.sender).call{value: refundAmount}("");
    require(ok, "Excess refund transfer failed");
}
```

### Withdrawals

Use **pull payments**, not push. The contract credits a claimable balance and
the recipient withdraws it. One recipient whose wallet reverts must not be able
to block everyone else. This is why `withdrawTranche` and `claimRefund` are
separate caller-initiated functions.

### Access control

Every state-changing function carries a modifier: `onlyCreator`, `onlyVerifier`,
or an explicit state guard. A function with no modifier and no state requirement
is a bug until proven otherwise.

### Events

Emit an event for every state change. The events are the audit trail and the
frontend ledger reads from them. An action that changes state without emitting
an event is invisible off-chain.

### Comments

Comment every Solidity function with a `@notice` and, where the arithmetic is
non-obvious, a `@dev` explaining the reasoning. This is a graded academic
project — the code must be explainable in a viva, which means the intent has to
be readable, not just the syntax.

---

## 3. Backend rules

- **Never store a private key.** Not in SQLite, not in a config file, not in a
  log line.
- **Never sign a transaction server-side.** All signing happens in the user's
  wallet. The backend reads chain state over RPC at most.
- **Derive identity and role from a verified session, never from the request
  body.** The current `/api/auth/google` endpoint trusts a client-supplied email
  and role, which means any caller can claim any role including Administrator.
  Any new endpoint must not repeat that pattern, and the existing one is on the
  fix list in `tasks.md`.
- **Every AI response carries the disclaimer.** The disclaimer is
  `"This is an AI-generated advisory assessment and not a financial verdict."`
  Do not drop it from a response payload, however repetitive it feels.
- **One response envelope per endpoint.** Standardise on:

  ```json
  { "status": "success", "data": { }, "error": null }
  ```

  and `{"status": "error", "data": null, "error": "message"}` on failure.

  This is **not yet met**. Today `app.py` mixes three shapes: bare objects
  (`/api/predict`), nested objects (`/api/risk`), and raw agent dicts
  (`/api/ai/analyze`). Adopt the envelope as each route is next touched, and
  never change a response shape without updating `frontend/src/services/api.js`
  in the same commit — the frontend reads these fields directly.
- **Error responses carry an HTTP status, not just a body.** Most handlers
  currently return 200 with an error string embedded.
- **CORS is an allowlist, not `*`.** The dev origin is
  `http://localhost:5173`. `origins: "*"` on `/api/*` is a development default
  that must not survive into a demo or a submission.
- **Comment every Python function** — same viva reason as Solidity.

---

## 4. ML rules

- **Launch-time features only.** Never use final amount raised, final backer
  count, or any post-campaign field. This is data leakage: the model scores well
  in testing and is useless in production, and it invalidates the research
  result.
- **Proper train/test split.** No fitting on the test set, no leakage across the
  split.
- **Report calibration, not just accuracy.** Precision, recall, F1, ROC-AUC, and
  Brier score. A probability shown to users must be calibrated.
- **Print metrics to console** when training so results are visible in the
  transcript and reproducible from the log.
- **Never call an anomaly score a fraud verdict.** Output a score and a risk
  level, with the disclaimer attached.

---

## 5. Agentic AI rules

- Each agent is a Python class returning structured JSON.
- Every output that reaches a user includes the disclaimer field.
- Agents never call a contract write function, never sign, never hold keys.
- The Evidence Reviewer's recommendation is advice to a human verifier. It never
  triggers an on-chain action by itself.
- Ground claims in the submitted evidence. If the evidence does not support a
  claim, the correct output is `NEEDS_MORE_INFO`, not a confident guess.

---

## 6. Frontend rules

### Architecture

- Pages live one-per-file in `src/pages/`. Components in `src/components/`.
- State via React context and hooks. **No Redux.**
- **Views are switched by state, not by URL.** `App.jsx` holds `currentView` and
  renders one view from a `switch`; navigation controls call `setCurrentView`.
  There is no router and no `<Routes>`, and `react-router-dom` is imported only
  by the unmounted `components/Navbar.jsx`. This is deliberate for the prototype
  — a single-page demo with no deep links — but it means **no view is
  addressable by URL and refresh always returns to the landing view**. If a
  router is ever added, it replaces the `currentView` state rather than sitting
  alongside it.
- Wallet and chain access through Ethers.js v6 only.
- Tailwind CSS v4 is configured **CSS-first**. There is no `tailwind.config.js`.
  Theme tokens are CSS custom properties in `src/index.css` and dark mode is
  declared with `@custom-variant dark`. Add a token by adding a custom property
  to both the `:root` and `.dark` blocks — not by adding a config file.

### Theming

The app has two themes and both must work for every component:

- **Light** — "Groww" Indian fintech. Warm off-white canvas, green accent.
- **Dark** — "Binance Pro". Near-black canvas, gold accent.

Never hardcode a hex value in a component. Use the custom properties
(`--bg-canvas`, `--text-primary`, `--accent-brand`, `--border-subtle`, …), or a
component will break in the other theme. Any new component gets checked in both.

### Comments

JSDoc on components, for the same viva reason.

---

## 7. Security rules

Restated because these are the ones that cost money or grades when broken:

1. Never store private keys anywhere.
2. Never put KYC or identity documents on-chain.
3. Never let an AI agent call a contract write function.
4. Always attach the disclaimer to ML and AI output.
5. Never train on post-campaign data.
6. Every contract state-changing function has access control.
7. **Contract address, RPC URL, and API keys go in `.env.local` (frontend) or
   `.env` (backend), and both are gitignored.** Never hardcode them in source.
   Note: `frontend/src/contractConfig.js` currently hardcodes a contract address
   and `backend/app.py` reads `NVIDIA_API_KEY` from the environment — audit both
   before the final demo.
8. Never commit a real key, even in a test file, even briefly.
9. Validate every endpoint input at the trust boundary. Assume the request body
   is hostile.

---

## 8. Workflow rules

- **Separate concerns across `/contracts`, `/backend`, `/frontend`.** No
  monolithic files.
- **Commit messages follow Conventional Commits**, scoped by layer:

  ```
  feat(contract): enforce hard cap with same-transaction excess refund
  fix(contract): advance currentMilestoneIndex when auto-approving tranche 1
  test(hardhat): add full lifecycle to COMPLETED
  fix(backend): derive role server-side in /api/auth/google
  feat(frontend): wire TransactionLedger to on-chain events
  docs(skills): record the T6 revert discrepancy
  ```

  Scopes in use: `contract`, `backend`, `ml`, `agents`, `frontend`, `tests`,
  `docs`, `skills`. A commit that spans layers gets the scope of the layer whose
  behaviour changed.
- **One logical change per commit.** A contract change and the test that proves
  it go in the same commit — never a fix without its test in the following
  commit, because the test is the evidence the fix works.
- **Never commit `.env`, `.env.local`, a private key, or
  `backend/trustbridge.db`.** Check `git status` before every commit.
- **Ask before installing a global dependency.**
- **Show a diff before applying a multi-file change.**
- **Every contract function needs a corresponding test.** This is now
  enforceable, which is the point of moving to Hardhat.
- **Never mark work complete on the basis of code existing.** Compile it, run
  it, or exercise it. A green test suite that tests a reimplementation is not
  evidence that the real thing works.
- **Do not report a test as passing unless you ran it and saw it pass.**

---

## 9. Documentation rules

- `prd.md` — what the product must do. Update when requirements change.
- `architecture.md` — how it is built. Update when structure changes.
- `tasks.md` — current status and blockers. Update as work lands.
- `memory.md` — project context for a fresh session. Update when facts change.
- `design.md` — UI/UX direction. Update when the design system changes.
- `hld.md` — high level design. Update when components or interfaces change.
- `lld.md` — low level design. Update when a signature, schema, or algorithm
  changes. Where a document and the source disagree, fix the source.

Keep the status markers in `prd.md` and `tasks.md` honest. An optimistic tick
that turns out to be false is worse than an unticked box, because it removes the
item from anyone's attention.
