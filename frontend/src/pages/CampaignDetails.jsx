import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ArrowRight, 
  Layers, 
  Zap, 
  Cpu, 
  Info,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

export default function CampaignDetails() {
  const { 
    activeCampaign, 
    account, 
    balance, 
    contributeToCampaign, 
    requestRefund, 
    setCurrentView 
  } = useApp();

  const [contribAmount, setContribAmount] = useState('0.5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSuccessMsg, setTxSuccessMsg] = useState('');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [activeTab, setActiveTab] = useState('Escrow Overview');

  const c = activeCampaign || {
    id: 'trustbridge-ai-01',
    title: 'Autonomous Multi-Agent Escrow Protocol',
    category: 'AI/ML',
    summary: 'Next-generation decentralized crowdfunding escrow combining off-chain ML anomaly scoring and human-in-the-loop multi-milestone verification on Ethereum Sepolia.',
    creator: '0x71C836056a31AC34421B37b30960533C2C143e90',
    contractAddress: '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
    goal: 10.0,
    hardCap: 20.0,
    totalRaised: 14.50,
    deadlineDays: 24,
    mlScore: 88,
    riskLevel: 'LOW',
    milestones: [
      { id: 1, title: 'Architecture & Prototype Review', percentage: 20, status: 'COMPLETED', trancheBps: 2000 },
      { id: 2, title: 'Smart Contract Sepolia Audits', percentage: 25, status: 'UNDER_REVIEW', trancheBps: 2500 },
      { id: 3, title: 'Agentic Verification Pipeline', percentage: 25, status: 'LOCKED', trancheBps: 2500 },
      { id: 4, title: 'Production Mainnet Readiness', percentage: 30, status: 'LOCKED', trancheBps: 3000 }
    ]
  };

  const minGoal = c.goal || 10.0;
  const hardCap = c.hardCap || 20.0;
  const totalRaised = c.totalRaised || 14.50;
  const remaining = Math.max(0, hardCap - totalRaised);
  const progressPercent = Math.min(100, Math.round((totalRaised / hardCap) * 100));
  const minGoalPercent = Math.min(100, Math.round((minGoal / hardCap) * 100)); // 50%

  function handleQuickSelect(val) {
    setContribAmount(val.toString());
  }

  function handleContributeSubmit(e) {
    e.preventDefault();
    const val = parseFloat(contribAmount);
    if (!val || val <= 0) return;

    setIsSubmitting(true);
    setTxSuccessMsg('');

    setTimeout(() => {
      const res = contributeToCampaign(c.id, contribAmount);
      setIsSubmitting(false);
      setTxSuccessMsg(res.msg);
      setTimeout(() => setTxSuccessMsg(''), 6000);
    }, 1200);
  }

  function handleCopyAddress() {
    navigator.clipboard.writeText(c.contractAddress || '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43');
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & 4-COLUMN METRIC GRID */}
      {/* ========================================================================= */}
      <div className="relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Subtle top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800/60">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {c.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>
                <span>Sepolia Escrow Active</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                Chain ID: 11155111
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-100">
              {c.title}
            </h1>

            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed font-normal">
              {c.summary}
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('AiRisk')}
              className="px-4 py-2.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Full AI Audit Report</span>
            </button>
          </div>
        </div>

        {/* 4-Column Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
          {/* Metric 1: Escrow Vault Status */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Escrow Vault</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-100">
              {totalRaised.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">ETH</span>
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium">
              100% On-Chain Non-Custodial
            </div>
          </div>

          {/* Metric 2: Hard Cap Boundary */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cap Ceiling</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-100">
              {hardCap.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">ETH</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Min Goal: <span className="text-zinc-200 font-semibold">{minGoal.toFixed(1)} ETH</span>
            </div>
          </div>

          {/* Metric 3: Countdown Timer */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Funding Window</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-100">
              {c.deadlineDays || 24} <span className="text-xs text-slate-400 font-sans font-normal">Days Left</span>
            </div>
            <div className="text-[11px] text-amber-400/90 font-medium">
              Ends Nov 15, 2026
            </div>
          </div>

          {/* Metric 4: Creator Contract Identity */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Creator Verified</span>
              <button 
                onClick={handleCopyAddress}
                className="text-slate-500 hover:text-zinc-300 transition"
                title="Copy Address"
              >
                {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-sm font-mono font-bold text-zinc-200 truncate">
              {c.creator || '0x71C8...3e90'}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>KYC Sandbox Level 1</span>
            </div>
          </div>
        </div>

        {/* Dual-Target Progress Bar (Min Goal 10 ETH & Hard Cap 20 ETH) */}
        <div className="mt-8 space-y-3 pt-6 border-t border-zinc-800/60">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Current Raised: <strong className="text-zinc-100 font-bold">{totalRaised.toFixed(2)} ETH</strong> ({progressPercent}%)
            </span>
            <span className="text-slate-400">
              Remaining Allocation: <strong className="text-cyan-400 font-bold">{remaining.toFixed(2)} ETH</strong>
            </span>
          </div>

          <div className="relative w-full h-3.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
            {/* Min Goal Marker Indicator at 50% (10 ETH) */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 shadow-[0_0_8px_#FBBF24]"
              style={{ left: `${minGoalPercent}%` }}
              title="10 ETH Minimum Goal Target"
            ></div>

            {/* Smooth Gradient Fill */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>0 ETH</span>
            <span className="text-amber-400 font-semibold">▲ 10 ETH Min Goal (Threshold)</span>
            <span className="text-zinc-300 font-semibold">20 ETH Hard Cap (Ceiling)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE: Stepper, Contribution Card & AI Risk Telemetry */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 7 COLUMNS: Stepped Roadmap & Decision Support */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* TRANCHE MILESTONE STEPPER (PRD 4-Tranche: 20%, 25%, 25%, 30%) */}
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>4-Tranche Milestone Roadmap</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Funds unlocked sequentially upon independent verifier cryptographic approval
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Tranche 2 / 4 Active
              </span>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-4 pt-2">
              {[
                { 
                  id: 1, 
                  tranche: 'Tranche 1 (20%)', 
                  title: 'Architecture Specification & Escrow Deployment', 
                  amount: '4.00 ETH',
                  status: 'COMPLETED',
                  desc: 'Verified Solidity contracts compiled and deployed to Sepolia testnet.'
                },
                { 
                  id: 2, 
                  tranche: 'Tranche 2 (25%)', 
                  title: 'Off-Chain ML Pipeline & Agentic Engine', 
                  amount: '5.00 ETH',
                  status: 'UNDER_REVIEW',
                  desc: 'RandomForest & IsolationForest models trained with zero data leakage telemetry.'
                },
                { 
                  id: 3, 
                  tranche: 'Tranche 3 (25%)', 
                  title: 'Multi-Sig Verifier Chamber & Evidence Sandbox', 
                  amount: '5.00 ETH',
                  status: 'LOCKED',
                  desc: 'Simulated KYC verification sandbox and cryptographic hash storage.'
                },
                { 
                  id: 4, 
                  tranche: 'Tranche 4 (30%)', 
                  title: 'Security Audits & Final Mainnet Readiness', 
                  amount: '6.00 ETH',
                  status: 'LOCKED',
                  desc: 'Comprehensive pen-testing and final milestone verification sign-off.'
                }
              ].map((m, idx) => (
                <div 
                  key={m.id}
                  className={`p-4 rounded-xl border transition-all ${
                    m.status === 'COMPLETED' 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : m.status === 'UNDER_REVIEW'
                      ? 'bg-indigo-500/5 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                      : 'bg-zinc-950/40 border-zinc-800/40 opacity-70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-400 text-zinc-950 shadow-[0_0_10px_#34D399]'
                          : m.status === 'UNDER_REVIEW'
                          ? 'bg-indigo-500 text-white shadow-[0_0_10px_#6366F1]'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {m.status === 'COMPLETED' ? '✓' : m.id}
                      </div>
                      <div>
                        <div className="text-xs font-mono font-semibold text-slate-400">{m.tranche}</div>
                        <div className="text-sm font-bold text-zinc-100">{m.title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center">
                      <span className="font-mono text-xs font-bold text-zinc-200">{m.amount}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : m.status === 'UNDER_REVIEW'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60'
                      }`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 pl-10 leading-relaxed font-normal">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI RISK & DECISION-SUPPORT PANEL */}
          <div className="rounded-2xl bg-zinc-900/80 border border-indigo-500/30 backdrop-blur-xl p-6 sm:p-7 shadow-[0_0_35px_-5px_rgba(99,102,241,0.15)] space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">AI Risk Advisory Telemetry</h3>
                  <div className="text-[11px] text-slate-400">NVIDIA Nemotron + Isolation Forest Anomaly Engine</div>
                </div>
              </div>

              {/* Confidence Badge */}
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                {c.mlScore || 88}% Confidence
              </div>
            </div>

            {/* Feasibility Factors & Radar Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <div className="text-slate-400 text-[11px]">Anomaly Tier</div>
                <div className="text-emerald-400 font-bold text-sm mt-0.5">LOW RISK</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <div className="text-slate-400 text-[11px]">Budget Realism</div>
                <div className="text-cyan-400 font-bold text-sm mt-0.5">92% OPTIMAL</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <div className="text-slate-400 text-[11px]">Milestone Balance</div>
                <div className="text-indigo-400 font-bold text-sm mt-0.5">4 TRANCHES</div>
              </div>
            </div>

            {/* Key Extracted Factors */}
            <div className="space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-zinc-200">Extracted Feasibility Factors:</div>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-400 leading-relaxed">
                <li>Non-custodial pull-payment contract prevents lump-sum rug pulls.</li>
                <li>Launch features adhere strictly to zero-leakage training distributions.</li>
                <li>Excess contributions in-block refunded to maintain 20 ETH ceiling.</li>
              </ul>
            </div>

            {/* Mandatory Advisory Disclaimer */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-400 text-xs leading-relaxed font-normal">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Advisory Notice:</strong> This is an AI-generated advisory assessment and not a financial verdict.
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT 5 COLUMNS: Contribution Panel & Escrow Safe Guards */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SLEEK CONTRIBUTION PANEL */}
          <div className="rounded-2xl bg-zinc-900/85 border border-zinc-800/80 backdrop-blur-xl p-6 sm:p-7 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Back Campaign</h3>
                <p className="text-xs text-slate-400">Escrowed directly on Sepolia</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-slate-400">Balance:</div>
                <div className="text-xs font-mono font-bold text-cyan-400">
                  {balance ? `${parseFloat(balance).toFixed(3)} ETH` : '0.000 ETH'}
                </div>
              </div>
            </div>

            {/* Feedback alert */}
            {txSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                {txSuccessMsg}
              </div>
            )}

            <form onSubmit={handleContributeSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Enter Contribution</span>
                  <span className="text-slate-400 font-mono">Min 0.01 ETH</span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remaining}
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    placeholder="0.5"
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-lg font-mono font-bold text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-400 transition"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-mono font-bold text-slate-400">
                    ETH
                  </span>
                </div>
              </div>

              {/* Quick Select Chips */}
              <div className="flex items-center gap-2 pt-1">
                {[0.5, 1.0, 2.0, 5.0].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => handleQuickSelect(val)}
                    className="flex-1 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs font-mono text-zinc-300 border border-zinc-700/60 transition active:scale-95"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              {/* Remaining Capacity Metric */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Remaining Capacity:</span>
                <span className="text-zinc-200 font-bold">{remaining.toFixed(2)} ETH</span>
              </div>

              {/* Animated Action Button */}
              <button
                type="submit"
                disabled={isSubmitting || remaining <= 0}
                className="w-full py-3.5 rounded-full btn-fintech-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    <span>Confirming via MetaMask...</span>
                  </>
                ) : remaining <= 0 ? (
                  <span>Hard Cap Reached (20 ETH)</span>
                ) : (
                  <>
                    <span>Contribute via MetaMask</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* In-block refund guarantee notice */}
            <div className="pt-2 text-[11px] text-slate-400 text-center leading-relaxed">
              If your contribution exceeds remaining capacity, excess ETH is automatically refunded within the same block.
            </div>
          </div>

          {/* ESCROW PROTECTION ARCHITECTURE CARD */}
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 space-y-3 text-xs">
            <div className="font-bold text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How Funds Are Protected</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Milestone disbursements require proof submissions and authorized verifier multi-sig approval. Unapproved campaigns allow contributors to pull 100% refund claims directly from the smart contract.
            </p>
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Pull-Payment Secure</span>
              <span className="text-emerald-400">Reentrancy Guarded</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
