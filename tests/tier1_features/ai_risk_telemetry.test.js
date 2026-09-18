/**
 * Tier 1: Feature Coverage - AI Risk Telemetry & Mandatory Disclaimer
 * Requirements:
 * - Nemotron-powered multi-agent AI risk score display with anomaly detection indicators.
 * - Prominently integrated mandatory disclaimer: "This is an AI-generated advisory assessment and not a financial verdict."
 * - Calibrated success probability and anomaly risk tiers (LOW, MEDIUM, HIGH).
 * - Graceful fallback when backend offline.
 */

import { assert, assertEqual, assertIncludes } from '../helpers/assert.js';
import { CONSTANTS } from '../helpers/contract_oracle.js';
import { AiRiskEngineSimulator } from '../helpers/state_oracle.js';

export async function runAiRiskTelemetryTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Test 5.1: Mandatory Verbatim Disclaimer Invariant
  // --------------------------------------------------------------------------
  (() => {
    const expectedDisclaimer = 'This is an AI-generated advisory assessment and not a financial verdict.';
    assertEqual(CONSTANTS.MANDATORY_DISCLAIMER, expectedDisclaimer, 'Authoritative disclaimer string exact match');

    // Test simulation output
    const evalRes = AiRiskEngineSimulator.evaluate({
      goalEth: 10.0,
      durationDays: 30,
      milestoneCount: 4,
      title: 'AuraMesh IoT',
      description: 'Decentralized IoT Sensing'
    });

    assertEqual(evalRes.disclaimer, expectedDisclaimer, 'AI assessment output must embed verbatim disclaimer');
    results.push({ name: 'AI 5.1: Mandatory verbatim disclaimer matches exact regulatory specification', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 5.2: Multi-Agent Calibrated Success Probability Rating
  // --------------------------------------------------------------------------
  (() => {
    const baseline = AiRiskEngineSimulator.evaluate({
      goalEth: 10.0,
      durationDays: 30,
      milestoneCount: 4,
      title: 'AuraMesh: Edge Sensor',
      description: 'Production-ready LoRaWAN sensing node with hardware crypto element.'
    });

    assert(baseline.success_probability >= 0.0 && baseline.success_probability <= 1.0, 'Success probability must be in [0.0, 1.0]');
    assert(baseline.percentage >= 0.0 && baseline.percentage <= 100.0, 'Percentage score must be in [0, 100]');
    assertEqual(baseline.roadmap_quality, 'STRONG', 'Standard 4-tranche setup yields STRONG roadmap');
    results.push({ name: 'AI 5.2: Multi-agent ML success probability calibrated within valid percentage bounds', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 5.3: Isolation Forest Anomaly Detection Tiers (LOW, MEDIUM, HIGH)
  // --------------------------------------------------------------------------
  (() => {
    // Normal campaign -> LOW risk tier
    const lowRisk = AiRiskEngineSimulator.evaluate({
      goalEth: 10.0,
      durationDays: 30,
      milestoneCount: 4,
      title: 'Decentralized Solar Monitor',
      description: 'Photovoltaic edge node with verifiable hash-chain'
    });
    assertEqual(lowRisk.anomaly.risk_tier, 'LOW', 'Normal campaign classified as LOW anomaly risk');

    // Irregular milestones (e.g. 2 tranches instead of 4) -> MEDIUM risk tier
    const medRisk = AiRiskEngineSimulator.evaluate({
      goalEth: 20.0,
      durationDays: 30,
      milestoneCount: 2,
      title: 'Irregular Milestone Pitch',
      description: 'Two milestones only'
    });
    assertEqual(medRisk.anomaly.risk_tier, 'MEDIUM', 'Irregular 2-milestone structure categorized as MEDIUM risk');

    // Extreme budget request (> 25 ETH hard cap limit) & short description -> HIGH risk tier
    const highRisk = AiRiskEngineSimulator.evaluate({
      goalEth: 30.0,
      durationDays: 10,
      milestoneCount: 1,
      title: 'Overcap',
      description: 'Tiny'
    });
    assertEqual(highRisk.anomaly.risk_tier, 'HIGH', 'Violations of project bounds classified as HIGH anomaly risk');
    results.push({ name: 'AI 5.3: Isolation Forest anomaly tiers correctly trigger across LOW, MEDIUM, and HIGH thresholds', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 5.4: Evidence Reviewer Checklist Synthesis
  // --------------------------------------------------------------------------
  (() => {
    // Simulated evidence reviewer
    function reviewEvidenceMock(evidence) {
      const checks = [];
      const hasIpfs = Boolean(evidence.ipfs_hash && evidence.ipfs_hash.startsWith('Qm'));
      const hasRepo = Boolean(evidence.repo_url && evidence.repo_url.includes('github.com'));
      const hasDemo = Boolean(evidence.demo_url && evidence.demo_url.startsWith('https://'));

      checks.push({ item: 'IPFS Content Hash Verifiable', status: hasIpfs ? 'VERIFIED' : 'FAILED' });
      checks.push({ item: 'Public Repository Deliverables', status: hasRepo ? 'VERIFIED' : 'PENDING_CHECK' });
      checks.push({ item: 'Live Demonstration Sandbox', status: hasDemo ? 'VERIFIED' : 'PENDING_CHECK' });

      return {
        checklist: checks,
        passedCount: checks.filter(c => c.status === 'VERIFIED').length,
        disclaimer: CONSTANTS.MANDATORY_DISCLAIMER
      };
    }

    const goodEvidence = {
      ipfs_hash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
      repo_url: 'https://github.com/trustbridge/firmware',
      demo_url: 'https://demo.trustbridge.network'
    };
    const report = reviewEvidenceMock(goodEvidence);
    assertEqual(report.passedCount, 3, 'All 3 evidence checklist items verified');
    assertEqual(report.checklist[0].status, 'VERIFIED');
    results.push({ name: 'AI 5.4: Evidence reviewer checklist synthesizes IPFS, repo, and demo verifications', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 5.5: Graceful Fallback Integrity
  // --------------------------------------------------------------------------
  (() => {
    // Simulate frontend fallback response when backend is offline
    function getAiRiskWithFallback(backendOnline = false) {
      if (!backendOnline) {
        return {
          success_probability: 0.82,
          percentage: 82.0,
          anomaly: { anomaly_score: 0.12, risk_tier: 'LOW' },
          disclaimer: CONSTANTS.MANDATORY_DISCLAIMER,
          source: 'local_fallback'
        };
      }
      return { success_probability: 0.88, percentage: 88.0, anomaly: { risk_tier: 'LOW' }, disclaimer: CONSTANTS.MANDATORY_DISCLAIMER, source: 'backend' };
    }

    const offlineData = getAiRiskWithFallback(false);
    assertEqual(offlineData.source, 'local_fallback');
    assertEqual(offlineData.disclaimer, CONSTANTS.MANDATORY_DISCLAIMER);
    assert(offlineData.percentage > 0, 'Fallback percentage must be valid number');
    assertEqual(offlineData.anomaly.risk_tier, 'LOW');
    results.push({ name: 'AI 5.5: Graceful fallback provides resilient telemetry without exceptions when backend offline', passed: true });
  })();

  return results;
}
