import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Check, X, AlertTriangle } from 'lucide-react';

export default function VerifierPortal() {
  const { campaigns, approveMilestone } = useApp();
  const [activeNotice, setActiveNotice] = useState('');

  const targetCampaign = campaigns[0];

  function handleApprove(mId) {
    approveMilestone(targetCampaign.id, mId);
    setActiveNotice(`Approved Tranche #${mId} on Sepolia! Funds unlocked.`);
    setTimeout(() => setActiveNotice(''), 4000);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-1.5 text-xs font-mono text-emerald-600 font-bold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>AUTHORIZED VERIFIER AUDIT CHAMBER</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Milestone Audit & Tranche Signer</h2>
        <p className="text-xs text-slate-500">Cross-reference AI code analysis and hardware proofs to authorize smart-contract releases</p>
      </div>

      {activeNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800">
          ✓ {activeNotice}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">PENDING EVALUATION:</span>
            <h3 className="text-base font-bold text-slate-900">{targetCampaign.title}</h3>
            <p className="text-xs font-mono text-slate-500">Milestone 2: PCB Fabrication & Bench Testing Deliverable (25% Tranche)</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            Action Required
          </span>
        </div>

        {/* AI Evidence Audit Report */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-700 font-bold">
            <span>AI Automated Evidence Extraction:</span>
            <span className="text-[11px] text-slate-400">NVIDIA Nemotron Reviewer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Verified Artifacts:</div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                <span>Gerber layout files verified in public repository</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                <span>Nordic SDK build passes CI unit test suite</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Items for Human Signer:</div>
              <div className="flex items-center space-x-2 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Inspect bench video demo timestamp (868MHz band test)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveNotice('Milestone flagged for revision. Creator notified.')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
          >
            Request More Info / Reject
          </button>

          <button
            onClick={() => handleApprove(2)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Sign On-Chain Milestone Approval</span>
          </button>
        </div>
      </div>
    </div>
  );
}
