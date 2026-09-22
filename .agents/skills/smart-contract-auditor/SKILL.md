---
name: smart-contract-auditor
description: >-
  Compile, test, fuzz, and perform static security audits on Solidity contracts
  (TrustBridge.sol) using Hardhat, Foundry, and Slither. Enforces 20 ETH hard cap,
  10 ETH min goal, and 4-tranche milestone invariants.
---

# Smart Contract Auditor Skill

## Primary Invariants
1. **Hard Cap Constraint**: `totalRaised <= 20 ether` strictly enforced. Overflowing contributions must auto-refund same-block excess.
2. **Min Goal Threshold**: `10 ether` required before campaign moves to `FUNDED` / `IN_PROGRESS`.
3. **Tranche Basis Points**: Must sum to exactly 10,000 (2000 initial, 2500 milestone 2, 2500 milestone 3, 3000 milestone 4).
4. **State Machine Integrity**:
   - `CampaignState`: `ACTIVE (0) -> FUNDED (1) -> IN_PROGRESS (2) -> COMPLETED (3) | FAILED (4) | REFUNDABLE (5)`
   - `MilestoneState`: `PENDING (0) -> SUBMITTED (1) -> UNDER_REVIEW (2) -> APPROVED (3) | REJECTED (4)`
5. **No Direct Transfer via AI**: AI / LLM addresses cannot invoke state-changing contract functions.

## Automated Verification Workflow
1. **Compile**:
   ```bash
   npx hardhat compile
   ```
2. **Run EVM Unit & Lifecycle Tests**:
   ```bash
   npx hardhat test
   ```
3. **Static Security Audit**:
   ```bash
   slither contracts/TrustBridge.sol --checklist
   ```
4. **Check for B-01 Deadlock**:
   - Ensure `_markFunded()` increments `currentMilestoneIndex` to 1 after auto-approving milestone 0.
