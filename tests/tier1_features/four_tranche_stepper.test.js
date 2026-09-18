/**
 * Tier 1: Feature Coverage - 4-Tranche Sequential Milestone Stepper
 * Requirements:
 * - 4-Tranche sequential milestone stepper (20% -> 25% -> 25% -> 30%).
 * - Tranche 1 auto-unlocks upon meeting min goal (10 ETH) or hard cap (20 ETH).
 * - Verifier review status and release triggers.
 * - Non-custodial pull-payment withdrawal for creator.
 */

import { assert, assertEqual, assertCloseTo } from '../helpers/assert.js';
import { TrustBridgeContractOracle, CONSTANTS, MilestoneState, CampaignState } from '../helpers/contract_oracle.js';

export async function runFourTrancheStepperTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Test 4.1: Mathematical Tranche Schedule (20% -> 25% -> 25% -> 30% = 100%)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    const tranches = oracle.milestones;

    assertEqual(tranches.length, 4, 'Must define exactly 4 milestones');
    assertEqual(tranches[0].bps, 2000, 'Tranche 1 must be 2000 BPS (20%)');
    assertEqual(tranches[1].bps, 2500, 'Tranche 2 must be 2500 BPS (25%)');
    assertEqual(tranches[2].bps, 2500, 'Tranche 3 must be 2500 BPS (25%)');
    assertEqual(tranches[3].bps, 3000, 'Tranche 4 must be 3000 BPS (30%)');

    const totalBps = tranches.reduce((sum, m) => sum + m.bps, 0);
    assertEqual(totalBps, CONSTANTS.TOTAL_BPS, 'Sum of tranche BPS must equal 10,000 (100.0%)');

    // Dollar allocations at 20.0 ETH hard cap
    const cap = 20.0;
    assertEqual((cap * tranches[0].bps) / 10000, 4.0, 'Tranche 1 unlocks 4.0 ETH at cap');
    assertEqual((cap * tranches[1].bps) / 10000, 5.0, 'Tranche 2 unlocks 5.0 ETH at cap');
    assertEqual((cap * tranches[2].bps) / 10000, 5.0, 'Tranche 3 unlocks 5.0 ETH at cap');
    assertEqual((cap * tranches[3].bps) / 10000, 6.0, 'Tranche 4 unlocks 6.0 ETH at cap');
    results.push({ name: 'Stepper 4.1: Exact mathematical 4-tranche schedule (20%, 25%, 25%, 30%) totaling 10,000 BPS', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 4.2: Automatic Unlock of Tranche 1 upon Meeting 10 ETH Min Goal
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    assertEqual(oracle.milestones[0].state, MilestoneState.PENDING, 'Initial state must be PENDING');

    // Deposit 10.0 ETH to trigger _markFunded
    oracle.contribute('0xBacker', 10.0);
    oracle.finalizeFunding();

    assertEqual(oracle.state, CampaignState.IN_PROGRESS, 'Campaign enters IN_PROGRESS state');
    assertEqual(oracle.milestones[0].state, MilestoneState.APPROVED, 'Tranche 1 (20%) auto-unlocks to APPROVED');
    assertEqual(oracle.currentMilestoneIndex, 0, 'Current active milestone index is 0 (ready for creator withdrawal)');
    results.push({ name: 'Stepper 4.2: Tranche 1 (20%) unlocks automatically to APPROVED on reaching 10 ETH', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 4.3: Sequential Evidence Submission & Verifier Consensus Approval
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xBacker', 20.0); // Reach hard cap -> Tranche 1 auto-approved

    // Creator withdraws Tranche 1 and advances to Milestone 1 (Index 1)
    oracle.withdrawTranche(oracle.creator, 0);
    oracle.currentMilestoneIndex = 1; // Advance to Tranche 2

    // Milestone 2 must be PENDING initially
    assertEqual(oracle.milestones[1].state, MilestoneState.PENDING);

    // Creator submits IPFS proof
    const ipfsHash = 'QmZtmD2qt8fQgdfmkRmUeeqCL2qc26ipW1hwY21gpH38yb';
    oracle.submitMilestoneEvidence(oracle.creator, ipfsHash);
    assertEqual(oracle.milestones[1].state, MilestoneState.UNDER_REVIEW, 'State transitions to UNDER_REVIEW');
    assertEqual(oracle.milestones[1].attempts, 1, 'Attempt counter incremented to 1');

    // Verifier signs consensus approval
    const res = oracle.approveMilestone(oracle.verifier, 1);
    assertEqual(oracle.milestones[1].state, MilestoneState.APPROVED, 'State transitions to APPROVED');
    assertEqual(res.trancheAmount, 5.0, 'Tranche 2 releases exactly 5.0 ETH (25% of 20 ETH)');
    assertEqual(oracle.currentMilestoneIndex, 2, 'Advances pointer to Milestone 3 (Index 2)');
    results.push({ name: 'Stepper 4.3: Evidence submission moves milestone to UNDER_REVIEW then verifier approves Tranche 2', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 4.4: Pull-Payment Security Invariant & Double-Withdrawal Prevention
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xBacker', 20.0); // 20 ETH total, Tranche 1 auto-approved

    // Creator withdraws Tranche 1 (20% = 4.0 ETH)
    const withdrawal = oracle.withdrawTranche(oracle.creator, 0);
    assertEqual(withdrawal.amount, 4.0, 'First withdrawal yields 4.0 ETH');
    assertEqual(oracle.totalWithdrawn, 4.0, 'totalWithdrawn increments to 4.0 ETH');
    assertEqual(oracle.escrowBalance, 16.0, 'Escrow balance drops to 16.0 ETH');
    assertEqual(oracle.milestones[0].claimed, true, 'Tranche marked claimed');

    // Attempting to withdraw Tranche 1 again must revert
    let threw = false;
    try {
      oracle.withdrawTranche(oracle.creator, 0);
    } catch (e) {
      threw = true;
      assert(e.message.includes('already withdrawn'), 'Must revert with already withdrawn');
    }
    assert(threw, 'Double withdrawal must be prevented by non-reentrant pull payment');
    results.push({ name: 'Stepper 4.4: Pull-payment withdrawal enforces single-claim invariant and prevents double spend', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 4.5: Full 4-Tranche Lifecycle to Campaign Completion
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xBacker', 20.0); // Tranche 1 approved

    // M1 withdrawal
    oracle.withdrawTranche(oracle.creator, 0);
    oracle.currentMilestoneIndex = 1;

    // M2
    oracle.submitMilestoneEvidence(oracle.creator, 'QmHashM2');
    oracle.approveMilestone(oracle.verifier, 1);
    oracle.withdrawTranche(oracle.creator, 1);

    // M3
    oracle.submitMilestoneEvidence(oracle.creator, 'QmHashM3');
    oracle.approveMilestone(oracle.verifier, 2);
    oracle.withdrawTranche(oracle.creator, 2);

    // M4
    oracle.submitMilestoneEvidence(oracle.creator, 'QmHashM4');
    oracle.approveMilestone(oracle.verifier, 3);
    oracle.withdrawTranche(oracle.creator, 3);

    assertEqual(oracle.state, CampaignState.COMPLETED, 'Final milestone approval transitions campaign to COMPLETED');
    assertEqual(oracle.totalWithdrawn, 20.0, 'All 20.0 ETH successfully disbursed to creator across 4 tranches');
    assertEqual(oracle.escrowBalance, 0.0, 'Escrow balance fully settled to 0');
    results.push({ name: 'Stepper 4.5: Full sequential lifecycle across all 4 tranches reaches COMPLETED state', passed: true });
  })();

  return results;
}
