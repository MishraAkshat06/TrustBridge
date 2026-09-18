/**
 * Tier 2: Boundary & Corner Cases - 20 ETH Hard Cap Headroom
 * Requirements:
 * - Minimum 5 comprehensive boundary tests for the 20 ETH hard cap headroom.
 * - Test 0 ETH, midpoint, 19.99 ETH epsilon, 20.00 ETH saturation, and over-cap rejection.
 * - Invariant: Headroom must strictly satisfy 0 <= headroom <= 20.0 ETH under all conditions.
 */

import { assert, assertEqual, assertThrows } from '../helpers/assert.js';
import { TrustBridgeContractOracle } from '../helpers/contract_oracle.js';

export async function runHardCapHeadroomTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Test 2.1: Zero Total Raised Boundary (20.00 ETH Full Headroom)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    assertEqual(oracle.totalRaised, 0.0);
    assertEqual(oracle.hardCap, 20.0);
    assertEqual(oracle.getHeadroom(), 20.0, 'Headroom at genesis must be exactly 20.00 ETH');
    results.push({ name: 'HardCap 2.1: Zero contribution initial state yields exact 20.00 ETH headroom', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.2: Midpoint Headroom (14.50 ETH Raised -> 5.50 ETH Headroom)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 14.50);
    assertEqual(oracle.totalRaised, 14.50);
    assertEqual(oracle.getHeadroom(), 5.50, 'Headroom must be 5.50 ETH when 14.50 ETH is raised');
    results.push({ name: 'HardCap 2.2: Midpoint 14.50 ETH raised computes exact 5.50 ETH remaining headroom', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.3: Infinitesimal Epsilon Headroom (19.99 ETH Raised -> 0.01 ETH Headroom)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 19.99);
    assertEqual(oracle.totalRaised, 19.99);
    assertEqual(oracle.getHeadroom(), 0.01, 'Headroom must be exactly 0.01 ETH at 19.99 ETH raised');

    // Contribute the remaining 0.01 ETH
    const res = oracle.contribute('0xUser2', 0.01);
    assertEqual(res.accepted, 0.01);
    assertEqual(oracle.totalRaised, 20.00);
    assertEqual(oracle.getHeadroom(), 0.00);
    results.push({ name: 'HardCap 2.3: Infinitesimal boundary at 19.99 ETH allows exact 0.01 ETH completion', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.4: Exact Saturation Boundary (20.00 ETH Raised -> 0.00 ETH Headroom)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 20.00);
    assertEqual(oracle.totalRaised, 20.00);
    assertEqual(oracle.getHeadroom(), 0.00, 'Headroom at saturation must be strictly 0.00 ETH');
    assertEqual(oracle.state, 'IN_PROGRESS', 'Reaching 20 ETH automatically triggers funded/in-progress');
    results.push({ name: 'HardCap 2.4: Exact 20.00 ETH saturation reaches zero headroom and triggers FUNDED state', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.5: Overflow Rejection on Saturated Campaign
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 20.00);

    // Attempting to contribute any amount when hard cap is reached must revert
    assertThrows(() => {
      oracle.contribute('0xUser2', 1.0);
    }, 'Hard cap reached', 'Must reject contribution when hard cap is saturated');

    assertEqual(oracle.getHeadroom(), 0.00, 'Headroom invariant: never negative');
    assertEqual(oracle.totalRaised, 20.00, 'Total raised remains locked at 20.00 ETH');
    results.push({ name: 'HardCap 2.5: Subsequent contributions on saturated vault revert with "Hard cap reached"', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.6: Adversarial Massive Deposit Overflow
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 15.00); // 5.00 ETH remaining

    // Attempting a 100.00 ETH deposit
    const res = oracle.contribute('0xWhale', 100.00);
    assertEqual(res.accepted, 5.00, 'Only remaining 5.00 ETH accepted');
    assertEqual(res.refunded, 95.00, 'Excess 95.00 ETH refunded back to whale in same block');
    assertEqual(oracle.totalRaised, 20.00, 'Total raised capped at exactly 20.00 ETH');
    assertEqual(oracle.getHeadroom(), 0.00, 'Headroom correctly drops to 0.00 ETH');
    results.push({ name: 'HardCap 2.6: Massive 100 ETH deposit accepts only 5 ETH headroom and refunds 95 ETH', passed: true });
  })();

  return results;
}
