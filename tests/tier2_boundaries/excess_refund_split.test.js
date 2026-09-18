/**
 * Tier 2: Boundary & Corner Cases - Excess-Refund Split Calculation
 * Requirements:
 * - Minimum 5 comprehensive boundary tests for the in-block excess-refund split calculation.
 * - Test partial overflow, micro-excess, exact fill, underfill, and fractional wei precision.
 * - Verify invariant: accepted + refunded == amount sent in msg.value.
 */

import { assert, assertEqual, assertCloseTo } from '../helpers/assert.js';
import { TrustBridgeContractOracle } from '../helpers/contract_oracle.js';

export async function runExcessRefundSplitTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Test 2.1: Standard Partial Overflow Split (18.0 ETH Raised, 5.0 ETH Sent)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 18.0);
    assertEqual(oracle.getHeadroom(), 2.0);

    const res = oracle.contribute('0xUser2', 5.0);
    assertEqual(res.accepted, 2.0, 'Accepted amount must equal exact 2.0 ETH headroom');
    assertEqual(res.refunded, 3.0, 'Refunded amount must equal 3.0 ETH excess');
    assertEqual(res.accepted + res.refunded, 5.0, 'Sum invariant: accepted + refunded == input');
    assertEqual(oracle.totalRaised, 20.0, 'Total raised capped at 20.0 ETH');
    results.push({ name: 'ExcessSplit 2.1: Standard overflow split (2.0 ETH accepted, 3.0 ETH refunded) on 5.0 ETH input', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.2: Micro-Excess Boundary (0.05 ETH Headroom, 0.10 ETH Sent)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 19.95);
    assertEqual(oracle.getHeadroom(), 0.05);

    const res = oracle.contribute('0xUser2', 0.10);
    assertEqual(res.accepted, 0.05, '0.05 ETH accepted');
    assertEqual(res.refunded, 0.05, '0.05 ETH refunded');
    assertEqual(res.accepted + res.refunded, 0.10);
    assertEqual(oracle.totalRaised, 20.00);
    results.push({ name: 'ExcessSplit 2.2: Micro-excess split on 0.05 ETH headroom accurately calculates 50/50 split', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.3: Zero Excess on Exact Fill (15.0 ETH Raised, 5.0 ETH Sent)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 15.0);
    assertEqual(oracle.getHeadroom(), 5.0);

    const res = oracle.contribute('0xUser2', 5.0);
    assertEqual(res.accepted, 5.0, 'Full 5.0 ETH accepted');
    assertEqual(res.refunded, 0.0, 'Zero excess refund');
    assertEqual(oracle.totalRaised, 20.0);
    results.push({ name: 'ExcessSplit 2.3: Exact fill with zero excess generates no refund and saturates cap', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.4: Clean Underfill (Amount < Headroom)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xUser1', 10.0);
    assertEqual(oracle.getHeadroom(), 10.0);

    const res = oracle.contribute('0xUser2', 3.25);
    assertEqual(res.accepted, 3.25);
    assertEqual(res.refunded, 0.0);
    assertEqual(oracle.totalRaised, 13.25);
    assertEqual(oracle.getHeadroom(), 6.75);
    results.push({ name: 'ExcessSplit 2.4: Underfill contribution accepts 100% of deposit with zero refund', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.5: High-Precision Fractional Wei Decimal Arithmetic
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    // 19.87654321 ETH raised -> 0.12345679 ETH headroom
    oracle.contribute('0xUser1', 19.87654321);
    const headroom = oracle.getHeadroom();
    assertCloseTo(headroom, 0.12345679, 0.00000001);

    // Send 0.50000000 ETH
    const res = oracle.contribute('0xUser2', 0.50000000);
    assertCloseTo(res.accepted, 0.12345679, 0.00000001, 'High precision accepted portion');
    assertCloseTo(res.refunded, 0.37654321, 0.00000001, 'High precision refunded portion');
    assertCloseTo(res.accepted + res.refunded, 0.50000000, 0.00000001, 'Total preserved without rounding loss');
    assertEqual(oracle.totalRaised, 20.00);
    results.push({ name: 'ExcessSplit 2.5: Fractional wei precision prevents rounding drift in excess refund split', passed: true });
  })();

  return results;
}
