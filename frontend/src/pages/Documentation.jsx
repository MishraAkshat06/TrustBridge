import React from 'react';
import { BookOpen, Shield, Code, Cpu } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">TrustBridge System Architecture & Protocol Docs</h2>
        <p className="text-xs text-slate-500">Academic BTech research prototype specification: ML models, Agentic AI, and Solidity escrow</p>
      </div>

      <div className="space-y-4 text-xs leading-relaxed text-slate-600">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>1. Core Invariants</span>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 font-mono text-[11px]">
            <li>Minimum Goal: 10 ETH (enables Tranche 1 unlock condition)</li>
            <li>Hard Cap: 20 ETH (excess contribution automatically split and refunded in same block)</li>
            <li>Zero AI Key Management: AI models never hold private keys or trigger transactions directly</li>
            <li>Identity Data Off-Chain: KYC checks performed off-chain; never recorded in contract storage</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <Code className="w-4 h-4 text-blue-600" />
            <span>2. Smart Contract Function Reference</span>
          </div>
          <p>
            <code>TrustBridgePOC.sol</code> is deployed on Ethereum Sepolia testnet at <code>0x7B2a...4Fa1</code>. Key methods include:
          </p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
            <div>• <code>contribute() payable</code>: Handles ETH inputs, caps, and in-block refunds.</div>
            <div>• <code>approveMilestone()</code>: Restricted to authorized verifier upon meeting minGoal.</div>
            <div>• <code>requestRefund()</code>: Allows contributors to reclaim unreleased funds.</div>
            <div>• <code>creatorWithdraw()</code>: Allows creator to withdraw after milestone approval.</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>3. Machine Learning & Agentic Decision Support</span>
          </div>
          <p>
            A Random Forest & Logistic Regression classifier evaluates campaign probability at launch time using objective metadata (goal, duration, description word count, milestone counts). AI outputs are purely advisory and feature mandatory disclaimers.
          </p>
        </div>
      </div>
    </div>
  );
}
