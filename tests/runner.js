#!/usr/bin/env node

/**
 * TrustBridge E2E Opaque-Box Test Runner
 * Executes Tier 1, Tier 2, Tier 3, and Tier 4 requirement-driven test suites.
 */

import { runThemeToggleTests } from './tier1_features/theme_toggle.test.js';
import { runNavigationRoutesTests } from './tier1_features/navigation_routes.test.js';
import { runEscrowContributionTests } from './tier1_features/escrow_contribution.test.js';
import { runFourTrancheStepperTests } from './tier1_features/four_tranche_stepper.test.js';
import { runAiRiskTelemetryTests } from './tier1_features/ai_risk_telemetry.test.js';
import { runMetaMaskSepoliaSyncTests } from './tier1_features/metamask_sepolia_sync.test.js';

import { runHardCapHeadroomTests } from './tier2_boundaries/hard_cap_headroom.test.js';
import { runMinGoalThresholdTests } from './tier2_boundaries/min_goal_threshold.test.js';
import { runExcessRefundSplitTests } from './tier2_boundaries/excess_refund_split.test.js';
import { runMilestoneRetryLimitTests } from './tier2_boundaries/milestone_retry_limit.test.js';

import { runCrossFeatureInteractionTests } from './tier3_interactions/cross_feature_interactions.test.js';
import { runRealWorldWorkloadTests } from './tier4_scenarios/real_world_workloads.test.js';

const suites = [
  { tier: 'UI Tier 1: In-Process Feature Simulators', name: 'Theme Toggle (Groww Light / Binance Dark)', fn: runThemeToggleTests },
  { tier: 'UI Tier 1: In-Process Feature Simulators', name: '11 Mounted Navigation Views (ViewStateController)', fn: runNavigationRoutesTests },
  { tier: 'UI Tier 1: In-Process Feature Simulators', name: 'Escrow Contribution & Headroom Simulator', fn: runEscrowContributionTests },
  { tier: 'UI Tier 1: In-Process Feature Simulators', name: '4-Tranche Milestone Stepper Simulator', fn: runFourTrancheStepperTests },
  { tier: 'UI Tier 1: In-Process Feature Simulators', name: 'AI Risk Telemetry & Mandatory Advisory Disclaimer', fn: runAiRiskTelemetryTests },
  { tier: 'UI Tier 1: In-Process Feature Simulators', name: 'MetaMask Sepolia State Sync Simulator', fn: runMetaMaskSepoliaSyncTests },

  { tier: 'Oracle Tier 2: Specification Checks', name: '20 ETH Hard Cap Headroom Invariants', fn: runHardCapHeadroomTests },
  { tier: 'Oracle Tier 2: Specification Checks', name: '10 ETH Minimum Goal Threshold & Refund Guarantees', fn: runMinGoalThresholdTests },
  { tier: 'Oracle Tier 2: Specification Checks', name: 'In-Block Excess-Refund Split Calculation', fn: runExcessRefundSplitTests },
  { tier: 'Oracle Tier 2: Specification Checks', name: 'Milestone Submission 1-Retry Grace Period Limit', fn: runMilestoneRetryLimitTests },

  { tier: 'Oracle Tier 3: Cross-Feature Interactions', name: 'Pairwise Integration & State Preservation', fn: runCrossFeatureInteractionTests },
  { tier: 'Oracle Tier 4: Client Scenarios', name: 'Full Lifecycle Client Workflow Simulation', fn: runRealWorldWorkloadTests },
];

async function main() {
  const startTime = Date.now();
  console.log('================================================================');
  console.log('    TrustBridge Client & In-Process State Simulation Runner     ');
  console.log('  UI Specification & In-Process Sanity Checks (Tiers 1, 2, 3, 4)');
  console.log('  NOTE: For real Solidity EVM on-chain tests: npx hardhat test  ');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];

  let currentTier = '';

  for (const suite of suites) {
    if (suite.tier !== currentTier) {
      currentTier = suite.tier;
      console.log(`\n\x1b[1m\x1b[36m▶ [${currentTier}]\x1b[0m`);
    }

    console.log(`  \x1b[33m• ${suite.name}\x1b[0m`);
    const suiteStart = Date.now();
    try {
      const results = await suite.fn();
      const suiteDuration = Date.now() - suiteStart;
      for (const res of results) {
        totalTests += 1;
        if (res.passed) {
          passedTests += 1;
          console.log(`    \x1b[32m✔\x1b[0m ${res.name}`);
        } else {
          failedTests += 1;
          console.log(`    \x1b[31m✖\x1b[0m ${res.name} (FAILED)`);
          failures.push({ suite: suite.name, test: res.name, error: res.error });
        }
      }
      console.log(`    \x1b[90m(completed in ${suiteDuration}ms)\x1b[0m`);
    } catch (err) {
      failedTests += 1;
      totalTests += 1;
      console.log(`    \x1b[31m✖ [CRITICAL FAILURE]\x1b[0m ${err.message}`);
      failures.push({ suite: suite.name, test: 'Suite Execution', error: err.stack || err.message });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(3);
  console.log('\n================================================================');
  console.log('                         TEST SUMMARY                           ');
  console.log('================================================================');
  console.log(`  Total Tests Executed: ${totalTests}`);
  console.log(`  Passed:               \x1b[32m${passedTests}\x1b[0m`);
  console.log(`  Failed:               ${failedTests > 0 ? `\x1b[31m${failedTests}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);
  console.log(`  Execution Time:       ${duration}s`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.log('\x1b[31mFAILURES:\x1b[0m');
    for (const f of failures) {
      console.log(`\n- [${f.suite}] ${f.test}`);
      console.log(`  ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\x1b[32mAll E2E opaque-box test requirements satisfied cleanly with 100% pass rate.\x1b[0m\n');
    process.exit(0);
  }
}

main();
