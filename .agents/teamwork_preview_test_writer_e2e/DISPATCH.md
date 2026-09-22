## 2026-09-19T02:14:00Z

<USER_REQUEST>
You are teamwork_preview_test_writer_e2e.
Your working directory is: d:/trustbridge/.agents/teamwork_preview_test_writer_e2e
Your project workspace is: d:/trustbridge

MANDATORY INPUT:
Read the authoritative user request at: d:/trustbridge/.agents/ORIGINAL_REQUEST.md
Also read survey reports at:
- d:/trustbridge/.agents/teamwork_preview_explorer_survey_1/handoff.md
- d:/trustbridge/.agents/teamwork_preview_explorer_survey_2/handoff.md
- d:/trustbridge/.agents/teamwork_preview_explorer_survey_3/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

SCOPE & MISSION:
You are the E2E Testing Track Lead.
Design and create an opaque-box, requirement-driven E2E test suite covering:
1. Tier 1: Feature Coverage (>=5 tests per feature: Theme toggle Groww/Binance, 6 Core Navigation routes, Escrow contribution & headroom, 4-tranche stepper, AI risk telemetry & disclaimer, MetaMask Sepolia sync).
2. Tier 2: Boundary & Corner Cases (>=5 tests per feature: 20 ETH hard cap headroom, 10 ETH min goal threshold, excess-refund split calculation, milestone submission retry limit).
3. Tier 3: Cross-Feature Interactions (pairwise combinations: theme toggle during active contribution, milestone approval reflected in campaign details, ledger logging of excess refund).
4. Tier 4: Real-World Workload Scenarios (full end-to-end crowdfunding lifecycle from backing to verifier consensus and AI risk verification).

DELIVERABLES:
1. Create executable test runner and test files under `tests/` or `frontend/tests/` (Node.js / Vitest / Playwright / script-based) that can be executed via a simple CLI command.
2. Publish `d:/trustbridge/TEST_INFRA.md` with test architecture and coverage matrix.
3. Publish `d:/trustbridge/TEST_READY.md` once the test suite is ready with exact test execution command and expected outputs.
4. Write handoff report to `d:/trustbridge/.agents/teamwork_preview_test_writer_e2e/handoff.md`.
Send message to parent when finished.
</USER_REQUEST>
