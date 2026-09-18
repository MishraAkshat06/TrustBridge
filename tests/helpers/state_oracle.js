/**
 * Authoritative Frontend State Simulator & Oracle
 * Models the AppContext, wallet synchronization, gas calculations, AI telemetry,
 * navigation routes, and activity log.
 */

import { CONSTANTS } from './contract_oracle.js';

export const CORE_ROUTES = [
  { id: 'Landing', path: '/', label: 'Protocol', title: 'Protocol Overview' },
  { id: 'Explore', path: '/explore', label: 'Explore', title: 'Explore Campaigns' },
  { id: 'Campaign', path: '/campaign/1', label: 'Vault Hub', title: 'Escrow Vault Hub' },
  { id: 'Contributions', path: '/contributions', label: 'My Contributions', title: 'Portfolio / Backer Vault' },
  { id: 'Verifier', path: '/verifier', label: 'Verifier Chamber', title: 'Verifier Chamber' },
  { id: 'Wallet', path: '/wallet', label: 'Wallet & Network', title: 'Wallet Management' },
  { id: 'Create', path: '/create', label: 'Create', title: 'Pitch Studio' },
  { id: 'AiRisk', path: '/ai-risk', label: 'AI Risk Audit', title: 'AI Risk Audit Report' },
  { id: 'Ledger', path: '/ledger', label: 'Transaction Ledger', title: 'Transaction Ledger' },
  { id: 'Docs', path: '/docs', label: 'Documentation', title: 'Documentation' }
];

export class GasEstimatorSimulator {
  constructor(baseUnits = CONSTANTS.BASE_GAS_LIMIT, ethUsdPrice = 3200) {
    this.baseUnits = baseUnits;
    this.ethUsdPrice = ethUsdPrice;
  }

  estimate(priority = 'medium', baseGwei = 25) {
    const priorityMultipliers = {
      low: 1.0,
      medium: 1.25,
      fast: 1.5
    };
    const mult = priorityMultipliers[priority] || 1.0;
    const effectiveGwei = baseGwei * mult;
    const totalGwei = this.baseUnits * effectiveGwei;
    const feeEth = Number((totalGwei / 1e9).toFixed(6));
    const feeUsd = Number((feeEth * this.ethUsdPrice).toFixed(2));

    return {
      gasUnits: this.baseUnits,
      effectiveGwei,
      feeEth,
      feeUsd,
      priority
    };
  }
}

export class WalletSyncSimulator {
  constructor({
    initialAddress = '',
    initialBalance = 0.0,
    initialChainId = CONSTANTS.SEPOLIA_CHAIN_ID
  } = {}) {
    this.account = initialAddress ? initialAddress.toLowerCase() : '';
    this.balanceWei = BigInt(Math.floor(initialBalance * 1e18));
    this.chainId = initialChainId;
    this.isConnected = Boolean(initialAddress);
    this.eventListeners = new Map(); // eventName -> Array<callback>
  }

  connect(address = '0x7B2aB43a8B4512CdEf8798C3953508495a024Fa1', balanceEth = 4.82) {
    this.account = address.toLowerCase();
    this.balanceWei = BigInt(Math.floor(balanceEth * 1e18));
    this.isConnected = true;
    this._emit('accountsChanged', [this.account]);
    return {
      account: this.account,
      formattedAddress: this.getTruncatedAddress(),
      balanceEth: this.getFormattedBalance(),
      chainId: this.chainId,
      isSepolia: this.isSepolia()
    };
  }

  disconnect() {
    this.account = '';
    this.balanceWei = 0n;
    this.isConnected = false;
    this._emit('accountsChanged', []);
  }

  getTruncatedAddress() {
    if (!this.account) return 'Connect';
    return `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
  }

  getFormattedBalance() {
    const eth = Number(this.balanceWei) / 1e18;
    return (Math.floor(eth * 10000) / 10000).toFixed(4);
  }

  isSepolia() {
    return this.chainId === CONSTANTS.SEPOLIA_CHAIN_ID || this.chainId === CONSTANTS.SEPOLIA_CHAIN_HEX;
  }

  switchChain(newChainId) {
    this.chainId = typeof newChainId === 'string' ? parseInt(newChainId, 16) : newChainId;
    this._emit('chainChanged', this.chainId);
    return this.isSepolia();
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  _emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    for (const fn of listeners) {
      fn(data);
    }
  }
}

export class AiRiskEngineSimulator {
  static evaluate({
    goalEth = 10.0,
    durationDays = 30,
    milestoneCount = 4,
    title = '',
    description = ''
  }) {
    // 0-leakage calibrated heuristic matching scikit-learn & Nemotron outputs
    const normGoal = Math.min(1.0, goalEth / 20.0);
    const normDuration = Math.min(1.0, durationDays / 60.0);
    const balancedMilestones = milestoneCount === 4 ? 0.95 : 0.65;
    const completeness = Math.min(1.0, (title.length + description.length) / 100.0);

    const successProb = Number((0.4 * normGoal + 0.3 * normDuration + 0.2 * balancedMilestones + 0.1 * completeness).toFixed(2));
    const percentage = Number((successProb * 100).toFixed(1));

    // IsolationForest decision function simulation
    let anomalyScore = 0.12;
    if (goalEth > 25.0 || milestoneCount < 2 || description.length < 10) {
      anomalyScore = -0.15;
    } else if (goalEth > 20.0 || milestoneCount !== 4) {
      anomalyScore = -0.02;
    }

    let riskTier = 'LOW';
    if (anomalyScore < -0.10) {
      riskTier = 'HIGH';
    } else if (anomalyScore < 0.05) {
      riskTier = 'MEDIUM';
    }

    return {
      success_probability: successProb,
      percentage,
      anomaly: {
        anomaly_score: anomalyScore,
        risk_tier: riskTier
      },
      roadmap_quality: milestoneCount === 4 ? 'STRONG' : 'MODERATE',
      disclaimer: CONSTANTS.MANDATORY_DISCLAIMER
    };
  }
}
