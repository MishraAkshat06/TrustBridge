/**
 * Tier 2: Boundary & Corner Cases - 10 ETH Minimum Goal Threshold
 * Requirements:
 * - Minimum 5 comprehensive boundary tests for the 10 ETH minimum goal threshold.
 * - Test 9.99 ETH sub-threshold, exact 10.00 ETH threshold, deadline expiry failure, and refund guarantees.
 */

import { assert, assertEqual, assertThrows } from '../helpers/assert.js';
import { TrustBridgeContractOracle, CampaignState, MilestoneState } from '../helpers/contract_oracle.js';

export async function runMinGoalThresholdTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Test 2.1: Sub-Threshold Epsilon Boundary (9.99 ETH Raised)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 9.99);

    assertEqual(oracle.totalRaised, 9.99);
    assertEqual(oracle.state, CampaignState.ACTIVE, 'Campaign must remain ACTIVE below min goal');
    assertEqual(oracle.milestones[0].state, MilestoneState.PENDING, 'Tranche 1 must remain locked/PENDING');
    assertEqual(oracle.getMinGoalHeadroom(), 0.01, '0.01 ETH remaining to min goal');
    results.push({ name: 'MinGoal 2.1: At 9.99 ETH (0.01 ETH below min goal), campaign remains ACTIVE & Tranche 1 locked', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.2: Exact Threshold Trigger (10.00 ETH Raised)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 10.00);

    // Call finalizeFunding or check threshold transition
    oracle.finalizeFunding(oracle.deadline + 1000);
    assertEqual(oracle.state, CampaignState.IN_PROGRESS, 'Campaign enters IN_PROGRESS once min goal is reached');
    assertEqual(oracle.milestones[0].state, MilestoneState.APPROVED, 'Tranche 1 automatically approved upon reaching min goal');
    results.push({ name: 'MinGoal 2.2: Exact 10.00 ETH reaches threshold and automatically unlocks Tranche 1', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.3: Mid-Band Viable Funding (15.00 ETH Raised at Deadline)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 7.50);
    oracle.contribute('0xUser2', 7.50);
    assertEqual(oracle.totalRaised, 15.00);

    // Finalize after deadline passes
    oracle.finalizeFunding(oracle.deadline + 5000);
    assertEqual(oracle.state, CampaignState.IN_PROGRESS, 'Campaign is successfully funded and in progress');
    assertEqual(oracle.milestones[0].state, MilestoneState.APPROVED, 'Tranche 1 is approved');
    results.push({ name: 'MinGoal 2.3: Mid-band 15.00 ETH raised successfully finalizes funding after deadline', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.4: Underfunded Campaign Expiry Failure (8.50 ETH Raised)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 5.00);
    oracle.contribute('0xUser2', 3.50);
    assertEqual(oracle.totalRaised, 8.50);

    // Finalize after deadline passes with < 10.00 ETH
    oracle.finalizeFunding(oracle.deadline + 1000);
    assertEqual(oracle.state, CampaignState.FAILED, 'Campaign must transition to FAILED state');
    assertEqual(oracle.milestones[0].state, MilestoneState.PENDING, 'Tranche 1 remains PENDING and never unlocks');

    const lastEvent = oracle.eventLog[oracle.eventLog.length - 1];
    assertEqual(lastEvent.type, 'CampaignFailed', 'Emits CampaignFailed event');
    results.push({ name: 'MinGoal 2.4: Campaign with 8.50 ETH (<10 ETH) at deadline transitions to FAILED state', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.5: 100% Principal Refund Guarantee in FAILED State
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xAlice', 5.00);
    oracle.contribute('0xBob', 3.50);
    oracle.finalizeFunding(oracle.deadline + 1000); // FAILED

    // Alice claims refund
    const refundAlice = oracle.claimRefund('0xAlice');
    assertEqual(refundAlice.refundAmount, 5.00, 'Alice receives 100% of her 5.00 ETH deposit');
    assertEqual(oracle.contributions.get('0xalice'), 0, 'Alice contribution balance reset to 0');

    // Bob claims refund
    const refundBob = oracle.claimRefund('0xBob');
    assertEqual(refundBob.refundAmount, 3.50, 'Bob receives 100% of his 3.50 ETH deposit');
    assertEqual(oracle.contributions.get('0xbob'), 0, 'Bob contribution balance reset to 0');

    assertEqual(oracle.escrowBalance, 0.0, 'Escrow balance fully cleared');

    // Attempting double refund reverts
    assertThrows(() => {
      oracle.claimRefund('0xAlice');
    }, 'No contribution to refund');
    results.push({ name: 'MinGoal 2.5: All contributors claim 100% pull-payment refunds when min goal is unmet', passed: true });
  })();

  return results;
}
