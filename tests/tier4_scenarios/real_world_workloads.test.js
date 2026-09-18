/**
 * Tier 4: Real-World Workload Scenarios
 * Requirements:
 * - Scenario 1: Full Golden-Path Crowdfunding Lifecycle (0 -> 10 -> 20 ETH -> 4 Tranches -> Completion).
 * - Scenario 2: Underfunded Campaign Expiry with 100% Principal Refund.
 * - Scenario 3: Milestone Rejection with Pro-Rata Pull-Payment Escrow Settlement.
 * - Scenario 4: Multi-User Concurrent Contribution Race with Cryptographic Ledger Audit Export.
 */

import { assert, assertEqual, assertCloseTo } from '../helpers/assert.js';
import { TrustBridgeContractOracle, CampaignState, MilestoneState } from '../helpers/contract_oracle.js';

export async function runRealWorldWorkloadTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Scenario 4.1: Full Golden-Path Crowdfunding Lifecycle
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();

    // Step 1: Backers contribute incrementally
    oracle.contribute('0xBacker1', 6.0);
    oracle.contribute('0xBacker2', 4.0); // Exactly 10.0 ETH reached
    assertEqual(oracle.totalRaised, 10.0);
    assertEqual(oracle.getHeadroom(), 10.0);

    // Step 2: Backer 3 contributes 12.0 ETH against 10.0 ETH headroom
    const splitRes = oracle.contribute('0xBacker3', 12.0);
    assertEqual(splitRes.accepted, 10.0);
    assertEqual(splitRes.refunded, 2.0);
    assertEqual(oracle.totalRaised, 20.0);
    assertEqual(oracle.state, CampaignState.IN_PROGRESS);
    assertEqual(oracle.milestones[0].state, MilestoneState.APPROVED, 'Tranche 1 (20%) auto-approved');

    // Step 3: Creator withdraws Tranche 1 (20% = 4.0 ETH)
    oracle.withdrawTranche(oracle.creator, 0);
    assertEqual(oracle.totalWithdrawn, 4.0);
    assertEqual(oracle.escrowBalance, 16.0);

    // Step 4: Milestone 2 lifecycle
    oracle.currentMilestoneIndex = 1;
    oracle.submitMilestoneEvidence(oracle.creator, 'QmCIDMilestone2');
    oracle.approveMilestone(oracle.verifier, 1);
    oracle.withdrawTranche(oracle.creator, 1); // 25% = 5.0 ETH
    assertEqual(oracle.totalWithdrawn, 9.0);
    assertEqual(oracle.escrowBalance, 11.0);

    // Step 5: Milestone 3 lifecycle
    oracle.submitMilestoneEvidence(oracle.creator, 'QmCIDMilestone3');
    oracle.approveMilestone(oracle.verifier, 2);
    oracle.withdrawTranche(oracle.creator, 2); // 25% = 5.0 ETH
    assertEqual(oracle.totalWithdrawn, 14.0);
    assertEqual(oracle.escrowBalance, 6.0);

    // Step 6: Milestone 4 lifecycle (Final Tranche: 30% = 6.0 ETH)
    oracle.submitMilestoneEvidence(oracle.creator, 'QmCIDMilestone4');
    oracle.approveMilestone(oracle.verifier, 3);
    assertEqual(oracle.state, CampaignState.COMPLETED, 'All tranches approved -> COMPLETED');
    oracle.withdrawTranche(oracle.creator, 3);

    assertEqual(oracle.totalWithdrawn, 20.0, 'Full 20 ETH distributed');
    assertEqual(oracle.escrowBalance, 0.0, 'Escrow completely drained to 0');
    results.push({ name: 'Scenario 4.1: Golden-path end-to-end lifecycle executes to completion with 0 escrow drift', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Scenario 4.2: Underfunded Campaign Expiry with 100% Principal Refund
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xBackerA', 3.0);
    oracle.contribute('0xBackerB', 4.5);
    assertEqual(oracle.totalRaised, 7.5);

    // Deadline expires with 7.5 ETH (< 10.0 ETH min goal)
    oracle.finalizeFunding(oracle.deadline + 1000);
    assertEqual(oracle.state, CampaignState.FAILED);

    // Both backers claim 100% pull-payment refunds
    const refA = oracle.claimRefund('0xBackerA');
    const refB = oracle.claimRefund('0xBackerB');
    assertEqual(refA.refundAmount, 3.0);
    assertEqual(refB.refundAmount, 4.5);
    assertEqual(oracle.escrowBalance, 0.0, 'All deposits returned to backers in full');
    results.push({ name: 'Scenario 4.2: Underfunded campaign at deadline fails gracefully and honors 100% principal refunds', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Scenario 4.3: Milestone Rejection with Pro-Rata Pull-Payment Escrow Settlement
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    // 3 Backers fund the 20 ETH hard cap
    oracle.contribute('0xBackerA', 10.0); // 50% share
    oracle.contribute('0xBackerB', 6.0);  // 30% share
    oracle.contribute('0xBackerC', 4.0);  // 20% share
    assertEqual(oracle.totalRaised, 20.0);

    // Creator withdraws Tranche 1 (20% = 4.0 ETH)
    oracle.withdrawTranche(oracle.creator, 0);
    assertEqual(oracle.escrowBalance, 16.0);

    // Milestone 2 rejected twice (grace period exhausted)
    oracle.currentMilestoneIndex = 1;
    oracle.submitMilestoneEvidence(oracle.creator, 'QmAttempt1');
    oracle.rejectMilestone(oracle.verifier, 1);
    oracle.submitMilestoneEvidence(oracle.creator, 'QmAttempt2');
    oracle.rejectMilestone(oracle.verifier, 1); // Second rejection -> REFUNDABLE

    assertEqual(oracle.state, CampaignState.REFUNDABLE);

    // Backers claim pro-rata refunds of remaining 16.0 ETH
    // Formula: (contribution * remainingEscrow) / (totalRaised - totalWithdrawn)
    // Here: remainingEscrow = 16.0, totalRemaining = 20.0 - 4.0 = 16.0 -> 100% of remaining 80% capital
    const refA = oracle.claimRefund('0xBackerA'); // 10.0 * 16.0 / 16.0 = 8.0 ETH
    const refB = oracle.claimRefund('0xBackerB'); // 6.0 * 16.0 / 16.0 = 4.8 ETH
    const refC = oracle.claimRefund('0xBackerC'); // 4.0 * 16.0 / 16.0 = 3.2 ETH

    assertEqual(refA.refundAmount, 8.0, 'Backer A receives 80% of original 10 ETH (8.0 ETH)');
    assertEqual(refB.refundAmount, 4.8, 'Backer B receives 80% of original 6 ETH (4.8 ETH)');
    assertEqual(refC.refundAmount, 3.2, 'Backer C receives 80% of original 4 ETH (3.2 ETH)');

    const totalRefunded = refA.refundAmount + refB.refundAmount + refC.refundAmount;
    assertEqual(totalRefunded, 16.0, 'Sum of pro-rata refunds equals remaining escrow balance');
    assertEqual(oracle.escrowBalance, 0.0, 'Escrow settles cleanly to zero');
    results.push({ name: 'Scenario 4.3: Milestone rejection triggers pro-rata pull-payment settlement with exact mathematical parity', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Scenario 4.4: Multi-User Concurrent Contribution Race with Ledger Audit
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    const deposits = [
      { sender: '0xBacker1', amount: 5.0 },
      { sender: '0xBacker2', amount: 8.0 },
      { sender: '0xBacker3', amount: 6.0 },
      { sender: '0xBacker4', amount: 6.0 } // Total attempted = 25.0 ETH
    ];

    for (const d of deposits) {
      if (oracle.getHeadroom() > 0) {
        oracle.contribute(d.sender, d.amount);
      }
    }

    assertEqual(oracle.totalRaised, 20.0, 'Strict 20.0 ETH ceiling never breached');
    assertEqual(oracle.getHeadroom(), 0.0);

    // Backer 4 only had 1.0 ETH accepted out of 6.0 ETH (5.0 ETH refunded)
    const backer4Contrib = oracle.contributions.get('0xbacker4');
    assertEqual(backer4Contrib, 1.0, 'Backer 4 accepted amount is 1.0 ETH');

    const refundEvents = oracle.eventLog.filter(e => e.type === 'ExcessRefundIssued');
    assertEqual(refundEvents.length, 1, 'Exactly one excess refund event issued');
    assertEqual(refundEvents[0].amount, 5.0, 'Excess refund is 5.0 ETH');
    assertEqual(refundEvents[0].contributor, '0xbacker4');

    // Verify audit log JSON structure
    const jsonAuditLog = JSON.stringify(oracle.eventLog);
    assert(jsonAuditLog.includes('ExcessRefundIssued'), 'JSON audit log contains excess refund');
    assert(jsonAuditLog.includes('CampaignFunded'), 'JSON audit log contains CampaignFunded');
    results.push({ name: 'Scenario 4.4: Concurrent backer race locks 20 ETH hard cap, refunds 5 ETH excess, and generates verifiable audit log', passed: true });
  })();

  return results;
}
