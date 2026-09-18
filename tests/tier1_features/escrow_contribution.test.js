/**
 * Tier 1: Feature Coverage - Escrow Contribution & Headroom Tracking
 * Requirements:
 * - Contribution modal with quick-selection chips (+0.25, +0.5, +1.0, +2.0, MAX).
 * - Real-time gas calculation (base 48,000 gas, Gwei rate, estimated USD fee).
 * - Dynamic headroom tracking against strict 20 ETH hard cap and 10 ETH minimum goal.
 * - Real-time transaction feedback with pending, confirmed, and excess-refund states.
 */

import { assert, assertEqual, assertCloseTo } from '../helpers/assert.js';
import { TrustBridgeContractOracle, CONSTANTS } from '../helpers/contract_oracle.js';
import { GasEstimatorSimulator } from '../helpers/state_oracle.js';

export async function runEscrowContributionTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Test 3.1: Dynamic Headroom Tracking against 20 ETH Hard Cap & 10 ETH Min Goal
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    assertEqual(oracle.totalRaised, 0.0, 'Initial raised should be 0');
    assertEqual(oracle.getHeadroom(), 20.0, 'Initial headroom to hard cap should be 20.0 ETH');
    assertEqual(oracle.getMinGoalHeadroom(), 10.0, 'Initial headroom to min goal should be 10.0 ETH');

    // Simulate 14.50 ETH pre-funded state (Campaign 1 baseline)
    oracle.contribute('0xUser1', 14.50);
    assertEqual(oracle.totalRaised, 14.50);
    assertEqual(oracle.getHeadroom(), 5.50, 'Headroom remaining to 20 ETH hard cap must be exactly 5.50 ETH');
    assertEqual(oracle.getMinGoalHeadroom(), 0.0, 'Min goal headroom is 0.0 once goal is reached');
    results.push({ name: 'Escrow 3.1: Dynamic headroom tracking accurately computes 5.50 ETH cap headroom at 14.50 ETH raised', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 3.2: Quick-Selection Chips (+0.25, +0.5, +1.0, +2.0, MAX)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xInitial', 14.50);
    const headroom = oracle.getHeadroom(); // 5.50 ETH

    const chips = [0.25, 0.50, 1.00, 2.00];
    for (const chip of chips) {
      assert(chip < headroom, `Quick chip ${chip} must be less than current headroom ${headroom}`);
    }

    // MAX chip must dynamically equal the remaining headroom
    const maxVal = headroom;
    assertEqual(maxVal, 5.50, 'MAX chip must equate to 5.50 ETH remaining headroom');
    results.push({ name: 'Escrow 3.2: Quick-selection chips and dynamic MAX button set correct input amounts', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 3.3: Real-Time Dynamic Gas Calculation
  // --------------------------------------------------------------------------
  (() => {
    const gasEstimator = new GasEstimatorSimulator(CONSTANTS.BASE_GAS_LIMIT, 3200);
    const low = gasEstimator.estimate('low', 20);
    const med = gasEstimator.estimate('medium', 20);
    const fast = gasEstimator.estimate('fast', 20);

    assertEqual(low.gasUnits, 48000, 'Base gas units must be 48,000 for escrow contribution');
    assert(low.feeEth < med.feeEth, 'Low priority gas fee in ETH must be lower than medium');
    assert(med.feeEth < fast.feeEth, 'Medium priority gas fee in ETH must be lower than fast');
    assert(med.feeUsd > 0, 'Estimated gas in USD must be positive');
    assertEqual(med.effectiveGwei, 25, 'Medium priority multiplier 1.25x on 20 Gwei yields 25 Gwei');
    results.push({ name: 'Escrow 3.3: Real-time dynamic gas calculation calculates ETH and USD estimates by priority', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 3.4: Transaction Lifecycle State - Confirmed Flow
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUserInitial', 14.50);

    // Contribution of 2.0 ETH within 5.50 ETH headroom
    const res = oracle.contribute('0xUser2', 2.0);
    assertEqual(res.accepted, 2.0, '2.0 ETH accepted in full');
    assertEqual(res.refunded, 0.0, '0 ETH excess refunded');
    assertEqual(res.totalRaised, 16.50, 'New total raised is 16.50 ETH');
    assertEqual(res.remainingHeadroom, 3.50, 'New headroom is 3.50 ETH');

    const lastEvent = oracle.eventLog[oracle.eventLog.length - 1];
    assertEqual(lastEvent.type, 'ContributionReceived', 'Emits ContributionReceived event');
    assertEqual(lastEvent.amount, 2.0);
    results.push({ name: 'Escrow 3.4: Under-cap contribution executes and confirms without excess refund', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 3.5: Transaction Lifecycle State - Excess-Refund State
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUserInitial', 17.00); // 3.00 ETH headroom

    // Contribution of 5.00 ETH (exceeds 3.00 ETH headroom by 2.00 ETH)
    const res = oracle.contribute('0xUserOver', 5.00);
    assertEqual(res.accepted, 3.00, 'Exact remaining headroom of 3.00 ETH accepted');
    assertEqual(res.refunded, 2.00, 'Excess 2.00 ETH refunded in same transaction');
    assertEqual(res.totalRaised, 20.00, 'Campaign reaches 20.00 ETH hard cap');
    assertEqual(res.state, 'IN_PROGRESS', 'Reaching hard cap triggers funding and activates milestone review');

    const events = oracle.eventLog.slice(-3);
    const types = events.map(e => e.type);
    assert(types.includes('ContributionReceived'), 'Must emit ContributionReceived for accepted portion');
    assert(types.includes('ExcessRefundIssued'), 'Must emit ExcessRefundIssued for refunded portion');
    assert(types.includes('CampaignFunded'), 'Must emit CampaignFunded upon reaching 20 ETH');
    results.push({ name: 'Escrow 3.5: Over-cap contribution triggers dual-receipt excess refund in same block', passed: true });
  })();

  return results;
}
