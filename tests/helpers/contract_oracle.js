/**
 * Authoritative Smart Contract Oracle for TrustBridge
 * Exactly mirrors logic, constants, state transitions, and arithmetic of contracts/TrustBridge.sol
 */

export const CampaignState = {
  ACTIVE: 'ACTIVE',
  FUNDED: 'FUNDED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDABLE: 'REFUNDABLE'
};

export const MilestoneState = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export const CONSTANTS = {
  MIN_GOAL_ETH: 10.0,
  HARD_CAP_ETH: 20.0,
  TOTAL_BPS: 10000,
  TRANCHE_SCHEDULE_BPS: [2000, 2500, 2500, 3000], // 20%, 25%, 25%, 30%
  MAX_SUBMISSION_ATTEMPTS: 2,
  BASE_GAS_LIMIT: 48000,
  SEPOLIA_CHAIN_ID: 11155111,
  SEPOLIA_CHAIN_HEX: '0xaa36a7',
  MANDATORY_DISCLAIMER: 'This is an AI-generated advisory assessment and not a financial verdict.'
};

export class TrustBridgeContractOracle {
  constructor({
    creator = '0x3Fa8B43a8B4512CdEf8798C3953508495a02241F',
    verifier = '0x7890Ac56DeF1234567890abcdef1234567890123',
    durationDays = 30,
    minGoal = CONSTANTS.MIN_GOAL_ETH,
    hardCap = CONSTANTS.HARD_CAP_ETH
  } = {}) {
    this.creator = creator.toLowerCase();
    this.verifier = verifier.toLowerCase();
    this.minGoal = minGoal;
    this.hardCap = hardCap;
    this.totalRaised = 0.0;
    this.totalWithdrawn = 0.0;
    this.escrowBalance = 0.0;
    this.state = CampaignState.ACTIVE;
    this.currentMilestoneIndex = 0;
    this.deadline = Date.now() + durationDays * 86400 * 1000;

    this.milestones = [
      { id: 1, title: 'Tranche 1 (20%)', bps: 2000, percentage: 20, state: MilestoneState.PENDING, attempts: 0, claimed: false, ipfsHash: '' },
      { id: 2, title: 'Tranche 2 (25%)', bps: 2500, percentage: 25, state: MilestoneState.PENDING, attempts: 0, claimed: false, ipfsHash: '' },
      { id: 3, title: 'Tranche 3 (25%)', bps: 2500, percentage: 25, state: MilestoneState.PENDING, attempts: 0, claimed: false, ipfsHash: '' },
      { id: 4, title: 'Tranche 4 (30%)', bps: 3000, percentage: 30, state: MilestoneState.PENDING, attempts: 0, claimed: false, ipfsHash: '' }
    ];

    this.contributions = new Map(); // address -> amount
    this.eventLog = [];
  }

  getHeadroom() {
    return Math.max(0, Number((this.hardCap - this.totalRaised).toFixed(8)));
  }

  getMinGoalHeadroom() {
    return Math.max(0, Number((this.minGoal - this.totalRaised).toFixed(8)));
  }

  contribute(sender, amountEth, now = Date.now()) {
    sender = sender.toLowerCase();
    if (this.totalRaised >= this.hardCap) {
      throw new Error('Hard cap reached');
    }
    if (this.state !== CampaignState.ACTIVE) {
      throw new Error('Campaign not active');
    }
    if (now > this.deadline) {
      throw new Error('Campaign deadline passed');
    }
    if (amountEth <= 0) {
      throw new Error('Amount must be > 0');
    }

    const remainingCap = this.getHeadroom();
    const acceptedAmount = Number(Math.min(amountEth, remainingCap).toFixed(8));
    const excessAmount = Number(Math.max(0, amountEth - acceptedAmount).toFixed(8));

    this.totalRaised = Number((this.totalRaised + acceptedAmount).toFixed(8));
    this.escrowBalance = Number((this.escrowBalance + acceptedAmount).toFixed(8));
    
    const prev = this.contributions.get(sender) || 0;
    this.contributions.set(sender, Number((prev + acceptedAmount).toFixed(8)));

    this.eventLog.push({
      type: 'ContributionReceived',
      contributor: sender,
      amount: acceptedAmount,
      totalRaised: this.totalRaised,
      timestamp: now
    });

    if (excessAmount > 0) {
      this.eventLog.push({
        type: 'ExcessRefundIssued',
        contributor: sender,
        amount: excessAmount,
        timestamp: now
      });
    }

    if (this.totalRaised >= this.hardCap) {
      this._markFunded(now);
    }

    return {
      accepted: acceptedAmount,
      refunded: excessAmount,
      totalRaised: this.totalRaised,
      remainingHeadroom: this.getHeadroom(),
      state: this.state
    };
  }

  finalizeFunding(now = Date.now()) {
    if (this.state !== CampaignState.ACTIVE) {
      throw new Error('Campaign not in active state');
    }
    if (now <= this.deadline && this.totalRaised < this.hardCap && this.totalRaised < this.minGoal) {
      throw new Error('Funding still ongoing');
    }

    if (this.totalRaised >= this.minGoal) {
      this._markFunded(now);
    } else {
      this.state = CampaignState.FAILED;
      this.eventLog.push({
        type: 'CampaignFailed',
        totalRaised: this.totalRaised,
        timestamp: now
      });
    }
    return this.state;
  }

  _markFunded(now = Date.now()) {
    this.state = CampaignState.FUNDED;
    this.eventLog.push({
      type: 'CampaignFunded',
      totalRaised: this.totalRaised,
      timestamp: now
    });

    // Tranche 1 (20% upfront) unlocks upon reaching FUNDED
    this.milestones[0].state = MilestoneState.APPROVED;
    this.state = CampaignState.IN_PROGRESS;
  }

  submitMilestoneEvidence(sender, ipfsHash, now = Date.now()) {
    if (sender.toLowerCase() !== this.creator) {
      throw new Error('Only creator permitted');
    }
    if (this.state !== CampaignState.IN_PROGRESS) {
      throw new Error('Campaign not in progress');
    }
    const idx = this.currentMilestoneIndex;
    if (idx >= 4) {
      throw new Error('All milestones completed');
    }

    const m = this.milestones[idx];
    if (m.state !== MilestoneState.PENDING && m.state !== MilestoneState.REJECTED) {
      throw new Error('Invalid milestone state for submission');
    }
    if (m.attempts >= CONSTANTS.MAX_SUBMISSION_ATTEMPTS) {
      throw new Error('Grace period exceeded');
    }
    if (!ipfsHash || ipfsHash.trim().length === 0) {
      throw new Error('Empty evidence hash');
    }

    m.attempts += 1;
    m.ipfsHash = ipfsHash;
    m.state = MilestoneState.UNDER_REVIEW;

    this.eventLog.push({
      type: 'MilestoneSubmitted',
      index: idx,
      ipfsHash,
      attempt: m.attempts,
      timestamp: now
    });

    return { milestoneIndex: idx, attempt: m.attempts, state: m.state };
  }

  approveMilestone(sender, milestoneIndex, now = Date.now()) {
    if (sender.toLowerCase() !== this.verifier) {
      throw new Error('Only verifier permitted');
    }
    if (this.state !== CampaignState.IN_PROGRESS) {
      throw new Error('Campaign not in progress');
    }
    if (milestoneIndex !== this.currentMilestoneIndex) {
      throw new Error('Not active milestone');
    }

    const m = this.milestones[milestoneIndex];
    if (m.state !== MilestoneState.UNDER_REVIEW) {
      throw new Error('Milestone not under review');
    }

    m.state = MilestoneState.APPROVED;
    const trancheAmount = Number(((this.totalRaised * m.bps) / CONSTANTS.TOTAL_BPS).toFixed(8));

    this.eventLog.push({
      type: 'MilestoneApproved',
      index: milestoneIndex,
      trancheAmount,
      timestamp: now
    });

    if (this.currentMilestoneIndex === 3) {
      this.state = CampaignState.COMPLETED;
    } else {
      this.currentMilestoneIndex += 1;
    }

    return { milestoneIndex, trancheAmount, campaignState: this.state, nextMilestoneIndex: this.currentMilestoneIndex };
  }

  rejectMilestone(sender, milestoneIndex, now = Date.now()) {
    if (sender.toLowerCase() !== this.verifier) {
      throw new Error('Only verifier permitted');
    }
    if (this.state !== CampaignState.IN_PROGRESS) {
      throw new Error('Campaign not in progress');
    }
    if (milestoneIndex !== this.currentMilestoneIndex) {
      throw new Error('Not active milestone');
    }

    const m = this.milestones[milestoneIndex];
    if (m.state !== MilestoneState.UNDER_REVIEW) {
      throw new Error('Milestone not under review');
    }

    m.state = MilestoneState.REJECTED;
    const isFinal = m.attempts >= CONSTANTS.MAX_SUBMISSION_ATTEMPTS;

    if (isFinal) {
      this.state = CampaignState.REFUNDABLE;
      this.eventLog.push({
        type: 'MilestoneRejected',
        index: milestoneIndex,
        attempt: m.attempts,
        finalRejection: true,
        timestamp: now
      });
    } else {
      this.eventLog.push({
        type: 'MilestoneRejected',
        index: milestoneIndex,
        attempt: m.attempts,
        finalRejection: false,
        timestamp: now
      });
    }

    return { milestoneIndex, attempt: m.attempts, finalRejection: isFinal, campaignState: this.state };
  }

  withdrawTranche(sender, milestoneIndex, now = Date.now()) {
    if (sender.toLowerCase() !== this.creator) {
      throw new Error('Only creator permitted');
    }
    if (milestoneIndex >= 4) {
      throw new Error('Invalid milestone index');
    }
    const m = this.milestones[milestoneIndex];
    if (m.state !== MilestoneState.APPROVED) {
      throw new Error('Tranche not approved');
    }
    if (m.claimed) {
      throw new Error('Tranche already withdrawn');
    }

    m.claimed = true;
    const amount = Number(((this.totalRaised * m.bps) / CONSTANTS.TOTAL_BPS).toFixed(8));
    this.totalWithdrawn = Number((this.totalWithdrawn + amount).toFixed(8));
    this.escrowBalance = Number((this.escrowBalance - amount).toFixed(8));

    this.eventLog.push({
      type: 'TrancheWithdrawn',
      creator: sender.toLowerCase(),
      index: milestoneIndex,
      amount,
      timestamp: now
    });

    return { milestoneIndex, amount, escrowBalance: this.escrowBalance, totalWithdrawn: this.totalWithdrawn };
  }

  claimRefund(sender, now = Date.now()) {
    sender = sender.toLowerCase();
    if (this.state !== CampaignState.FAILED && this.state !== CampaignState.REFUNDABLE) {
      throw new Error('Refunds not eligible');
    }
    const contribution = this.contributions.get(sender) || 0;
    if (contribution <= 0) {
      throw new Error('No contribution to refund');
    }

    let refundAmount = 0;
    if (this.state === CampaignState.FAILED) {
      refundAmount = contribution;
    } else {
      // REFUNDABLE pro-rata: contribution * (totalRaised - totalWithdrawn) / totalRaised
      refundAmount = Number(((contribution * (this.totalRaised - this.totalWithdrawn)) / this.totalRaised).toFixed(8));
    }

    if (refundAmount <= 0) {
      throw new Error('Calculated refund is 0');
    }

    this.contributions.set(sender, 0);
    this.escrowBalance = Number((this.escrowBalance - refundAmount).toFixed(8));

    this.eventLog.push({
      type: 'ContributorRefundIssued',
      contributor: sender,
      amount: refundAmount,
      timestamp: now
    });

    return { contributor: sender, refundAmount, remainingEscrow: this.escrowBalance };
  }
}
