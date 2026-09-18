/**
 * Tier 2: Boundary & Corner Cases - Milestone Submission Retry Limit & Grace Period
 * Requirements:
 * - Minimum 5 comprehensive boundary tests for the 1-retry milestone review grace period.
 * - Test initial submission (attempt 1), first rejection (non-final), retry submission (attempt 2),
 *   second rejection (final -> REFUNDABLE), and attempt 3 rejection (Grace period exceeded).
 */

import { assert, assertEqual, assertThrows } from '../helpers/assert.js';
import { TrustBridgeContractOracle, CampaignState, MilestoneState } from '../helpers/contract_oracle.js';

export async function runMilestoneRetryLimitTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Test 2.1: First Evidence Submission (Attempt 1)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xBacker', 20.0); // Reach 20 ETH -> IN_PROGRESS, M1 approved
    oracle.withdrawTranche(oracle.creator, 0);
    oracle.currentMilestoneIndex = 1; // Milestone 2

    const res = oracle.submitMilestoneEvidence(oracle.creator, 'QmInitialProofV1');
    assertEqual(res.attempt, 1, 'First submission attempt counter is 1');
    assertEqual(res.state, MilestoneState.UNDER_REVIEW, 'Milestone transitions to UNDER_REVIEW');
    assertEqual(oracle.milestones[1].attempts, 1);
    results.push({ name: 'MilestoneRetry 2.1: Initial submission sets attempt counter to 1 and state to UNDER_REVIEW', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.2: First Rejection (Non-Final Grace Period)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xBacker', 20.0);
    oracle.withdrawTranche(oracle.creator, 0);
    oracle.currentMilestoneIndex = 1;
    oracle.submitMilestoneEvidence(oracle.creator, 'QmInitialProofV1');

    const res = oracle.rejectMilestone(oracle.verifier, 1);
    assertEqual(res.attempt, 1, 'Attempt counter remains 1 after rejection');
    assertEqual(res.finalRejection, false, 'First rejection is NOT final (creator has 1 retry)');
    assertEqual(oracle.milestones[1].state, MilestoneState.REJECTED, 'Milestone state is REJECTED');
    assertEqual(oracle.state, CampaignState.IN_PROGRESS, 'Campaign remains IN_PROGRESS');
    results.push({ name: 'MilestoneRetry 2.2: First rejection marks milestone REJECTED but preserves grace period', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.3: Second Submission (Attempt 2 - Retry Within Grace Period)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xBacker', 20.0);
    oracle.withdrawTranche(oracle.creator, 0);
    oracle.currentMilestoneIndex = 1;
    oracle.submitMilestoneEvidence(oracle.creator, 'QmInitialProofV1');
    oracle.rejectMilestone(oracle.verifier, 1);

    // Creator submits revised proof within grace period
    const res = oracle.submitMilestoneEvidence(oracle.creator, 'QmRevisedProofV2');
    assertEqual(res.attempt, 2, 'Second submission attempt counter increments to 2');
    assertEqual(res.state, MilestoneState.UNDER_REVIEW, 'Milestone transitions back to UNDER_REVIEW');
    assertEqual(oracle.milestones[1].ipfsHash, 'QmRevisedProofV2', 'Updated IPFS hash recorded');
    results.push({ name: 'MilestoneRetry 2.3: Second evidence submission increments attempt to 2 (grace period active)', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.4: Second Rejection (Final Rejection -> REFUNDABLE State)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xBacker', 20.0);
    oracle.withdrawTranche(oracle.creator, 0);
    oracle.currentMilestoneIndex = 1;
    oracle.submitMilestoneEvidence(oracle.creator, 'QmInitialProofV1');
    oracle.rejectMilestone(oracle.verifier, 1);
    oracle.submitMilestoneEvidence(oracle.creator, 'QmRevisedProofV2');

    // Verifier rejects second submission
    const res = oracle.rejectMilestone(oracle.verifier, 1);
    assertEqual(res.attempt, 2, 'Attempt counter is 2');
    assertEqual(res.finalRejection, true, 'Second rejection is FINAL');
    assertEqual(oracle.state, CampaignState.REFUNDABLE, 'Campaign transitions to REFUNDABLE state');
    assertEqual(oracle.milestones[1].state, MilestoneState.REJECTED);
    results.push({ name: 'MilestoneRetry 2.4: Second rejection triggers final rejection and transitions campaign to REFUNDABLE', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 2.5: Third Submission Attempt Rejection (Grace Period Exceeded)
  // --------------------------------------------------------------------------
  (() => {
    const oracle = new TrustBridgeContractOracle();
    oracle.contribute('0xBacker', 20.0);
    oracle.withdrawTranche(oracle.creator, 0);
    oracle.currentMilestoneIndex = 1;
    oracle.submitMilestoneEvidence(oracle.creator, 'QmProof1');
    oracle.rejectMilestone(oracle.verifier, 1);
    oracle.submitMilestoneEvidence(oracle.creator, 'QmProof2');
    oracle.rejectMilestone(oracle.verifier, 1); // final rejection

    // Creator attempts a 3rd submission
    assertThrows(() => {
      oracle.submitMilestoneEvidence(oracle.creator, 'QmProof3');
    }, 'Campaign not in progress', 'Cannot submit when campaign is REFUNDABLE / not in progress');
    results.push({ name: 'MilestoneRetry 2.5: Third submission attempt strictly forbidden once grace period is exceeded', passed: true });
  })();

  return results;
}
