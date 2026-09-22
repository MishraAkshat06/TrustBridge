import React, { useState } from 'react';
import { BookOpen, Shield, Code, Cpu, ExternalLink, Copy, Check } from 'lucide-react';
import { CONTRACT_ADDRESS } from '../contractConfig';

const CODE_SNIPPETS = {
  solidity: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrustBridge {
    uint256 public constant MIN_GOAL = 10 ether;
    uint256 public constant HARD_CAP = 20 ether;
    
    // In-block excess refund split
    function contribute() external payable {
        require(totalRaised < HARD_CAP, "Cap saturated");
        uint256 headroom = HARD_CAP - totalRaised;
        uint256 accepted = msg.value > headroom ? headroom : msg.value;
        uint256 excess = msg.value - accepted;
        
        totalRaised += accepted;
        contributions[msg.sender] += accepted;
        
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
    }
}`,
  agentic: `# NVIDIA Nemotron Multi-Agent Risk Pipeline
from agents.evaluator import AnomalyEngine

engine = AnomalyEngine(weights_path="models/iso_forest.pkl")
score = engine.evaluate_proposal({
    "goal_eth": 10.0,
    "milestone_count": 4,
    "deliverable_cids": [
        "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
    ]
})
# Mandatory Regulatory Advisory Check
assert score.disclaimer == (
    "This is an AI-generated advisory assessment "
    "and not a financial verdict."
)`,
  invariants: `PROTOCOL INVARIANT MATRIX
1. Headroom Saturation:
   - Cap: 20.00 ETH strict ceiling
   - Goal: 10.00 ETH triggers Tranche 1 unlock
2. Sequential 4-Tranche Stepper:
   - Tranche 1: 20% (Automatic on 10 ETH goal)
   - Tranche 2: 25% (Evidence Review + Verifier Sig)
   - Tranche 3: 25% (Evidence Review + Verifier Sig)
   - Tranche 4: 30% (Final Production / Release)
3. Cryptographic Proof:
   - Off-Chain KYC + Verifier multi-sig quorum`
};

export default function Documentation() {
  const [activeTab, setActiveTab] = useState('solidity');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
      <div className="border-b border-slate-200 dark:border-[var(--border-subtle)] pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-[var(--text-primary)]">
          TrustBridge System Architecture & Protocol Docs
        </h2>
        <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mt-0.5">
          Academic BTech research prototype specification: ML models, Agentic AI, and Solidity escrow
        </p>
      </div>

      <div className="space-y-5 text-xs leading-relaxed text-slate-600 dark:text-[var(--text-secondary)]">
        {/* Core Invariants Card */}
        <div className="bg-white/90 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm backdrop-blur-xl space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-[var(--text-primary)]">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>1. Protocol Invariants & Guardrails</span>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-[var(--text-secondary)] font-mono text-[11px]">
            <li>Minimum Goal: 10 ETH (enables Tranche 1 unlock condition)</li>
            <li>Hard Cap: 20 ETH (excess contribution automatically split and refunded in same block)</li>
            <li>Zero AI Key Management: AI models never hold private keys or trigger transactions directly</li>
            <li>Identity Data Off-Chain: KYC checks performed off-chain; never recorded in contract storage</li>
          </ul>
        </div>

        {/* Tabbed Interactive Code Reference Card */}
        <div className="bg-white/90 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-[var(--border-subtle)] rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[var(--border-subtle)] pb-3">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-[var(--text-primary)]">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>2. Technical Code Reference</span>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: 'solidity', label: 'TrustBridge.sol' },
                { id: 'agentic', label: 'Agent Pipeline' },
                { id: 'invariants', label: 'Invariant Matrix' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <button
                onClick={handleCopy}
                className="ml-2 p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 cursor-pointer"
                title="Copy code snippet"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 border border-white/10 font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">
            <code>{CODE_SNIPPETS[activeTab]}</code>
          </pre>

          <p className="text-[11px] text-slate-500 dark:text-[var(--text-muted)]">
            Verified contract deployed on Sepolia at{' '}
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#code`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-mono underline inline-flex items-center gap-1"
            >
              <span>{CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-6)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        {/* Machine Learning Card */}
        <div className="bg-white/90 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm backdrop-blur-xl space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-[var(--text-primary)]">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <span>3. Machine Learning & Agentic Telemetry</span>
          </div>
          <p>
            A Random Forest & Logistic Regression classifier evaluates campaign probability at launch time using objective metadata (goal, duration, description word count, milestone counts). AI outputs are purely advisory and feature mandatory disclaimers.
          </p>
        </div>
      </div>
    </div>
  );
}
