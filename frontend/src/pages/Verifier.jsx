import React, { useState } from 'react';
import { ShieldCheck, Check, X, ExternalLink, AlertTriangle } from 'lucide-react';

export default function Verifier() {
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-[#262F40] pb-6">
        <div className="flex items-center space-x-2 text-xs font-mono text-blue-400 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AUTHORIZED AUDIT CHAMBER</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Milestone Verification Workbench</h1>
        <p className="text-xs text-slate-400">Review AI evidence extractions, cross-check deliverables, and sign on-chain approvals</p>
      </div>

      <div className="bg-[#121721] border border-[#262F40] rounded-lg p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#262F40] pb-4 gap-2">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">PENDING AUDIT:</span>
            <h2 className="text-lg font-bold text-white">Campaign #1: AuraMesh IoT Node</h2>
            <div className="text-xs font-mono text-slate-400">Milestone 2: PCB Fabrication & Bench Testing Proof (25% Tranche)</div>
          </div>
          <div className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
            Requires Signer Action
          </div>
        </div>

        {/* AI Evidence Audit Report */}
        <div className="bg-[#1A2130] border border-[#262F40] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 font-semibold uppercase">AI Evidence Reviewer Output:</span>
            <span className="text-[11px] font-mono text-slate-400">Model: Nemotron-Agent-v2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-2">
              <span className="text-slate-400">VERIFIED DELIVERABLES:</span>
              <ul className="space-y-1.5 text-slate-200">
                <li className="flex items-center space-x-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Hardware schematic files (Gerber format) present in repo</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Zephyr RTOS initialization commit confirmed</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400">FLAGGED FOR AUDITOR ATTENTION:</span>
              <ul className="space-y-1.5 text-slate-200">
                <li className="flex items-center space-x-2 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Bench video demo shows 868MHz band; check regional spec compliance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#262F40]">
          <button
            onClick={() => { setRejected(true); setApproved(false); }}
            className="w-full sm:w-auto px-5 py-2.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject Milestone & Trigger Refund Policy</span>
          </button>

          <button
            onClick={() => { setApproved(true); setRejected(false); }}
            className="w-full sm:w-auto px-5 py-2.5 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-mono font-bold transition-colors flex items-center justify-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve Milestone & Release Next Tranche</span>
          </button>
        </div>

        {approved && (
          <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            ✓ On-chain transaction broadcast: <code>approveMilestone()</code> executed on Sepolia. Tranche 2 unlocked.
          </div>
        )}

        {rejected && (
          <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
            ✕ Milestone rejected. Escrow locked into refundable failure state for contributors.
          </div>
        )}
      </div>
    </div>
  );
}
