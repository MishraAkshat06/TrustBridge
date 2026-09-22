# Milestone B Verification & Adversarial Stress-Test Report

## 1. Observation
Codebase inspection across smart contracts, state providers, UI components, and test oracles:
1. Tranche BPS Math (`contracts/TrustBridge.sol:118-122`, `frontend/src/mockData.js:17-64`, `frontend/src/context/AppContext.jsx:220-224`, `tests/helpers/contract_oracle.js:27`):
   - M1: 2000 BPS (20.00%)
   - M2: 2500 BPS (25.00%)
   - M3: 2500 BPS (25.00%)
   - M4: 3000 BPS (30.00%)
   - Total: 2000 + 2500 + 2500 + 3000 = 10000 BPS = 100.00% (TOTAL_BPS).
   - Cap disbursement (20 ETH): 4.0 ETH + 5.0 ETH + 5.0 ETH + 6.0 ETH = 20.0 ETH (zero drift).
2. State Machine Transitions (`contracts/TrustBridge.sol:154-232`, `frontend/src/context/AppContext.jsx:280-497`):
   - Min goal unlock: At `totalRaised >= 10 ether`, `_markFunded()` executes -> `milestones[0].state = MilestoneState.APPROVED`, `state = IN_PROGRESS`.
   - Sub-goal lock: At 9.99 ETH, `milestones[0].state` remains `PENDING`.
   - Grace period: Initial submit -> `attempts = 1`, `UNDER_REVIEW`. Rejection 1 -> `attempts = 1`, `REJECTED`, campaign remains `IN_PROGRESS` (1 retry remaining).
   - Final rejection: Retry submit -> `attempts = 2`, `UNDER_REVIEW`. Rejection 2 -> `attempts = 2`, `isFinal = true`, campaign transitions to `REFUNDABLE`.
   - Subsequent submit: Blocked by `state == REFUNDABLE` / `attempts >= 2`.
3. VerifierPortal Null Safety (`frontend/src/pages/VerifierPortal.jsx:18-57, 101-118`):
   - `targetCampaign`: `campaigns.find(c => c.id === selectedCampaignId) || campaigns[0] || fallbackObj`.
   - `milestones`: `targetCampaign?.milestones || []`.
   - `defaultMilestoneId`: `milestones.find(m => m.status === 'UNDER_REVIEW')?.id || milestones.find(m => m.status === 'PENDING')?.id || milestones[0]?.id || 1`.
   - `targetMilestone`: `milestones.find(m => m.id === selectedMilestoneId) || milestones[0] || fallbackObj`.
   - `ipfsCid`: `targetMilestone.evidence?.includes('ipfs/') ? ... : fallbackCid`.
   - Switch handler: `onChange` resolves `camp` and auto-selects `nextM` without throwing null pointer exceptions.

## 2. Logic Chain
1. Math Verification: Sum of tranche BPS is mathematically closed over `TOTAL_BPS = 10000`. Pull-payment withdrawals match integer divisions with no remainder leaks: `4.0 + 5.0 + 5.0 + 6.0 = 20.0 ETH`.
2. State Machine Integrity:
   - When contributions reach 10 ETH, Tranche 1 auto-unlocks to `APPROVED`.
   - Attempt counter tracks submissions up to limit of 2 (`MAX_SUBMISSION_ATTEMPTS`).
   - Attempt 1 rejection transitions milestone to `REJECTED` / `REJECTED_RETRY` while keeping campaign in `IN_PROGRESS`.
   - Attempt 2 rejection transitions campaign to `REFUNDABLE`, unlocking pro-rata backer claims `(contribution * remainingEscrow) / (totalRaised - totalWithdrawn)`.
3. UI Null Safety:
   - Campaign dropdown switching handles empty arrays, missing milestones, and campaign state toggles without unhandled exceptions or blank screens.
   - Fallback chains guarantee defined objects for render pass.

## 3. Caveats
1. In `frontend/src/pages/VerifierPortal.jsx`, Approve and Reject buttons check `disabled={targetMilestone.status === 'APPROVED' || targetMilestone.status === 'CLAIMED'}`. They do not disable when status is `FINAL_REJECTED` or `PENDING`. While the smart contract reverts on non-`UNDER_REVIEW` states, frontend button disabled state should ideally also check `targetMilestone.status !== 'UNDER_REVIEW'`.
2. In `VerifierPortal.jsx:113`, `c.title.slice(0, 32)` assumes `c.title` is a defined string. Defensive `(c.title || '').slice(0, 32)` is recommended for future dynamic user-submitted campaigns.

## 4. Conclusion
VERDICT: APPROVE.
All 4 verification criteria pass with high empirical fidelity:
- 4-Tranche math strictly equals 10,000 BPS (100%).
- State machine honors 10 ETH auto-unlock and 1-retry grace period before REFUNDABLE transition.
- VerifierPortal campaign dropdown switching is null-safe.

## 5. Verification Method
1. Direct contract and frontend AST inspection:
   - `contracts/TrustBridge.sol`
   - `frontend/src/contractConfig.js`
   - `frontend/src/context/AppContext.jsx`
   - `frontend/src/pages/VerifierPortal.jsx`
   - `frontend/src/pages/CampaignDetails.jsx`
2. Test runner execution validation:
   - `node tests/runner.js` executes 63/63 tests across Tiers 1-4 with 100% pass rate.
   - Stepper Suite 4.1 to 4.5 verifies BPS schedule, auto-unlock at 10 ETH, and pull-payment claims.
   - Milestone Retry Suite 2.1 to 2.5 verifies 1-retry grace period and final rejection REFUNDABLE state.
