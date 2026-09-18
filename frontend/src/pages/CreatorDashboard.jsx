import React, { useState } from 'react';
import { Upload, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';

export default function CreatorDashboard() {
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmitEvidence(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-[#262F40] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Creator Operations & Vault</h1>
        <p className="text-xs text-slate-400">Manage campaign escrow, submit milestone evidence, and claim unlocked tranches</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121721] border border-[#262F40] rounded-lg p-5 space-y-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Current Locked Escrow</span>
          <div className="text-2xl font-mono font-bold text-white">14.50 ETH</div>
          <p className="text-[11px] text-slate-400">Total raised across all active milestones</p>
        </div>

        <div className="bg-[#121721] border border-[#262F40] rounded-lg p-5 space-y-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Available for Withdrawal</span>
          <div className="text-2xl font-mono font-bold text-emerald-400">2.90 ETH</div>
          <p className="text-[11px] text-slate-400">Tranche 1 (20%) unlocked upon meeting 10 ETH goal</p>
        </div>

        <div className="bg-[#121721] border border-[#262F40] rounded-lg p-5 space-y-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Current Milestone</span>
          <div className="text-2xl font-mono font-bold text-blue-400">Tranche 2 / 4</div>
          <p className="text-[11px] text-slate-400">PCB Fabrication & Bench Testing Proof</p>
        </div>
      </div>

      {/* Main Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-[#121721] border border-[#262F40] rounded-lg p-6 space-y-5">
          <h3 className="text-base font-semibold text-white tracking-tight">Submit Milestone 2 Evidence</h3>
          <p className="text-xs text-slate-400">
            Submit cryptographic proof, public GitHub commits, or bench test telemetry. AI evidence reviewer will inspect deliverables before verifier approval.
          </p>

          <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">GITHUB FIRMWARE REPO URL:</label>
              <input
                type="text"
                placeholder="https://github.com/org/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-[#1A2130] border border-[#262F40] rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">BENCH DEMO VIDEO / TELEMETRY LINK:</label>
              <input
                type="text"
                placeholder="https://demo.example.com"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="w-full bg-[#1A2130] border border-[#262F40] rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">TECHNICAL SUMMARY & COMMIT HASHES:</label>
              <textarea
                rows={4}
                placeholder="Completed schematic revision B, commit 4a8f9b2 passes CI tests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#1A2130] border border-[#262F40] rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-colors"
            >
              Submit Evidence to AI Reviewer
            </button>

            {submitted && (
              <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                ✓ Evidence package queued for AI parsing and verifier audit.
              </div>
            )}
          </form>
        </div>

        {/* Withdrawal Console */}
        <div className="lg:col-span-5 bg-[#121721] border border-[#262F40] rounded-lg p-6 space-y-5">
          <h3 className="text-base font-semibold text-white tracking-tight">Tranche Withdrawal Console</h3>
          <p className="text-xs text-slate-400">
            Smart contract releases ETH exclusively to creator deployer address upon milestone verifications.
          </p>

          <div className="p-4 bg-[#1A2130] border border-[#262F40] rounded space-y-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Tranche 1 (20%):</span>
              <span className="text-emerald-400">CLAIMABLE (2.90 ETH)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tranche 2 (25%):</span>
              <span className="text-slate-500">LOCKED (Pending Review)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tranche 3 (25%):</span>
              <span className="text-slate-500">LOCKED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tranche 4 (30%):</span>
              <span className="text-slate-500">LOCKED</span>
            </div>
          </div>

          <button
            className="w-full py-2.5 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <span>Execute creatorWithdraw()</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
