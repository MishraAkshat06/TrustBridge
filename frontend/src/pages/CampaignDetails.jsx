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
    connectWallet,
    contributeToCampaign, 
    requestRefund, 
    estimateGas,
    setCurrentView 
  } = useApp();

  const [contribAmount, setContribAmount] = useState('0.5');
  const [gasPriority, setGasPriority] = useState('medium');
  const [txState, setTxState] = useState('IDLE'); // 'IDLE' | 'PENDING' | 'CONFIRMED' | 'EXCESS_REFUND'
  const [txDetails, setTxDetails] = useState(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [activeTab, setActiveTab] = useState('Escrow Overview');

  const c = activeCampaign || {
    id: '1',
    title: 'AuraMesh: Decentralized IoT Edge Sensing Node',
    category: 'Hardware / IoT',
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
      { id: 1, title: 'Tranche 1: Prototype Architecture & BOM', percentage: 20, status: 'APPROVED', trancheBps: 2000, evidence: 'https://github.com/auramesh/firmware-v1' },
      { id: 2, title: 'Tranche 2: PCB Fabrication & Bench Testing', percentage: 25, status: 'UNDER_REVIEW', trancheBps: 2500, evidence: 'https://demo.auramesh.io/bench-v2' },
      { id: 3, title: 'Tranche 3: Field Testing & Gateway Integration', percentage: 25, status: 'PENDING', trancheBps: 2500, evidence: '' },
      { id: 4, title: 'Tranche 4: Volume Production & SDK Release', percentage: 30, status: 'PENDING', trancheBps: 3000, evidence: '' }
    ]
  };

  const minGoal = c.goal || 10.0;
  const hardCap = c.hardCap || 20.0;
  const totalRaised = c.totalRaised || 14.50;
  const remaining = Math.max(0, hardCap - totalRaised);
  const progressPercent = Math.min(100, Math.round((totalRaised / hardCap) * 100));
  const minGoalPercent = Math.min(100, Math.round((minGoal / hardCap) * 100)); // 50%

  // Gas estimate
  const gasInfo = estimateGas ? estimateGas(gasPriority) : { feeEth: 0.0012, feeUsd: 3.85, effectiveGwei: 31.25 };

  function handleQuickSelect(val) {
    setContribAmount(val.toString());
  }

  function handleMaxSelect() {
    setContribAmount(remaining > 0 ? remaining.toFixed(2) : '0.00');
  }

  function handleContributeSubmit(e) {
    e.preventDefault();
    const val = parseFloat(contribAmount);
    if (!val || val <= 0) return;

    setTxState('PENDING');
    setTxDetails({
      amount: val,
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: 5932000 + Math.floor(Math.random() * 1000)
    });

    setTimeout(() => {
      const res = contributeToCampaign(c.id, contribAmount);
      if (res && res.success) {
        setTxDetails({
          amount: val,
          accepted: res.accepted,
          refunded: res.refunded,
          txHash: res.txHash,
          blockNumber: res.blockNumber,
          isExcessRefund: res.isExcessRefund
        });
        if (res.isExcessRefund) {
          setTxState('EXCESS_REFUND');
        } else {
          setTxState('CONFIRMED');
        }
      } else {
        setTxState('IDLE');
      }
    }, 1200);
  }

  function handleCopyAddress() {
    navigator.clipboard.writeText(c.contractAddress || '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43');
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto text-[var(--text-primary)]">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & 4-COLUMN METRIC GRID */}
      {/* ========================================================================= */}
      <div className="relative rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Subtle top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-brand)]/50 to-transparent"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] border border-[var(--border-subtle)]">
                {c.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>
                <span>Sepolia Escrow Active</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                Chain ID: 11155111
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[var(--text-primary)]">
              {c.title}
            </h1>

            <p className="text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed font-normal">
              {c.summary}
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('AiRisk')}
              className="px-4 py-2.5 rounded-full bg-[var(--bg-surface-subtle)] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Cpu className="w-4 h-4 text-[var(--accent-brand)]" />
              <span>Full AI Audit Report</span>
            </button>
          </div>
        </div>

        {/* 4-Column Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
          {/* Metric 1: Escrow Vault Status */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Escrow Vault</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[var(--text-primary)]">
              {totalRaised.toFixed(2)} <span className="text-xs text-[var(--text-muted)] font-sans font-normal">ETH</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              100% On-Chain Non-Custodial
            </div>
          </div>

          {/* Metric 2: Hard Cap Boundary */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
              <span>Cap Ceiling</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[var(--text-primary)]">
              {hardCap.toFixed(2)} <span className="text-xs text-[var(--text-muted)] font-sans font-normal">ETH</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Min Goal: <span className="text-[var(--text-primary)] font-semibold">{minGoal.toFixed(1)} ETH</span>
            </div>
          </div>

          {/* Metric 3: Countdown Timer */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Funding Window</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[var(--text-primary)]">
              {c.deadlineDays || 24} <span className="text-xs text-[var(--text-muted)] font-sans font-normal">Days Left</span>
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Ends Nov 15, 2026
            </div>
          </div>

          {/* Metric 4: Creator Contract Identity */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-xs text-[var(--text-secondary)] flex items-center justify-between">
              <span>Creator Verified</span>
              <button 
                onClick={handleCopyAddress}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
                title="Copy Address"
              >
                {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-sm font-mono font-bold text-[var(--text-primary)] truncate">
              {c.creator || '0x71C8...3e90'}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>KYC Sandbox Level 1</span>
            </div>
          </div>
        </div>

        {/* Dual-Target Progress Bar (Min Goal 10 ETH & Hard Cap 20 ETH) */}
        <div className="mt-8 space-y-3 pt-6 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-secondary)]">
              Current Raised: <strong className="text-[var(--text-primary)] font-bold">{totalRaised.toFixed(2)} ETH</strong> ({progressPercent}%)
            </span>
            <span className="text-[var(--text-secondary)]">
              Remaining Allocation: <strong className="text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] font-bold">{remaining.toFixed(2)} ETH</strong>
            </span>
          </div>

          <div className="relative w-full h-3.5 bg-[var(--bg-surface-subtle)] rounded-full overflow-hidden p-0.5 border border-[var(--border-subtle)]">
            {/* Min Goal Marker Indicator at 50% (10 ETH) */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20 shadow-xs"
              style={{ left: `${minGoalPercent}%` }}
              title="10 ETH Minimum Goal Target"
            ></div>

            {/* Smooth Gradient Fill */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[var(--accent-brand)] to-emerald-400 shadow-xs transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-mono">
            <span>0 ETH</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">▲ 10 ETH Min Goal (Threshold)</span>
            <span className="text-[var(--text-primary)] font-semibold">20 ETH Hard Cap (Ceiling)</span>
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
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[var(--accent-brand)]" />
                  <span>4-Tranche Milestone Roadmap</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Funds unlocked sequentially upon independent verifier cryptographic approval
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] border border-[var(--border-subtle)]">
                Tranche {Math.min(4, Math.max(1, (c.milestones || []).findIndex(m => m.status === 'UNDER_REVIEW' || m.status === 'PENDING') + 1))} / 4 Active
              </span>
            </div>

            {/* Stepper Timeline bound dynamically to c.milestones */}
            <div className="space-y-4 pt-2">
              {(c.milestones || []).map((m, idx) => {
                const percentage = m.percentage || (m.trancheBps ? Math.round(m.trancheBps / 100) : (idx === 0 ? 20 : idx === 3 ? 30 : 25));
                const trancheEth = ((hardCap * percentage) / 100).toFixed(2);
                const isApproved = m.status === 'APPROVED' || m.status === 'COMPLETED';
                const isClaimed = m.status === 'CLAIMED';
                const isReview = m.status === 'UNDER_REVIEW';
                const isRejectedRetry = m.status === 'REJECTED_RETRY';
                const isFinalRejected = m.status === 'FINAL_REJECTED';

                return (
                  <div 
                    key={m.id || idx + 1}
                    className={`p-4 rounded-xl border transition-all ${
                      isApproved || isClaimed
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : isReview
                        ? 'bg-[var(--accent-brand-subtle)] border-[var(--accent-brand)]/40 shadow-xs'
                        : isRejectedRetry || isFinalRejected
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-[var(--bg-surface-subtle)] border-[var(--border-subtle)] opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                          isApproved || isClaimed
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isReview
                            ? 'bg-[var(--accent-brand)] text-black font-bold shadow-xs'
                            : isRejectedRetry || isFinalRejected
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
                        }`}>
                          {isApproved || isClaimed ? '✓' : isRejectedRetry || isFinalRejected ? '✕' : (m.id || idx + 1)}
                        </div>
                        <div>
                          <div className="text-xs font-mono font-semibold text-[var(--text-muted)]">
                            Tranche {m.id || idx + 1} ({percentage}%)
                          </div>
                          <div className="text-sm font-bold text-[var(--text-primary)]">{m.title}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:self-center">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{trancheEth} ETH</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                          isApproved || isClaimed
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : isReview
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : isRejectedRetry
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : isFinalRejected
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                        }`}>
                          {m.status ? m.status.replace('_', ' ') : 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {m.evidence && (
                      <div className="mt-2 pl-10 text-xs font-mono text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] flex items-center gap-1.5">
                        <span>Proof Evidence:</span>
                        <a 
                          href={m.evidence} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline flex items-center gap-1 truncate max-w-xs sm:max-w-md"
                        >
                          {m.evidence} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI RISK & DECISION-SUPPORT PANEL */}
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-7 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-brand-subtle)] border border-[var(--border-subtle)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[var(--accent-brand)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">AI Risk Advisory Telemetry</h3>
                  <div className="text-[11px] text-[var(--text-secondary)]">NVIDIA Nemotron + Isolation Forest Anomaly Engine</div>
                </div>
              </div>

              {/* Confidence Badge */}
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                {c.mlScore || 88}% Confidence
              </div>
            </div>

            {/* Feasibility Factors & Radar Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                <div className="text-[var(--text-muted)] text-[10px] uppercase">ML Success Prob</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">{c.mlScore || 88}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                <div className="text-[var(--text-muted)] text-[10px] uppercase">Anomaly Tier</div>
                <div className="text-cyan-600 dark:text-cyan-400 font-bold text-sm mt-0.5">{(c.riskLevel || c.risk || 'LOW').toUpperCase()}</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                <div className="text-[var(--text-muted)] text-[10px] uppercase">Budget Realism</div>
                <div className="text-[var(--text-primary)] font-bold text-sm mt-0.5">{c.goal <= 20 ? '92%' : '68%'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                <div className="text-[var(--text-muted)] text-[10px] uppercase">Pitch Complete</div>
                <div className="text-[var(--text-primary)] font-bold text-sm mt-0.5">94%</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                <div className="text-[var(--text-muted)] text-[10px] uppercase">Roadmap Quality</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">{(c.milestones || []).length === 4 ? 'STRONG' : 'MODERATE'}</div>
              </div>
            </div>

            {/* Key Extracted Factors */}
            <div className="space-y-2 text-xs text-[var(--text-secondary)]">
              <div className="font-semibold text-[var(--text-primary)]">Extracted Feasibility Factors:</div>
              <ul className="space-y-1.5 list-disc pl-4 text-[var(--text-secondary)] leading-relaxed">
                <li>Non-custodial pull-payment contract prevents lump-sum rug pulls.</li>
                <li>Launch features adhere strictly to zero-leakage training distributions.</li>
                <li>Excess contributions in-block refunded to maintain 20 ETH ceiling.</li>
              </ul>
            </div>

            {/* Mandatory Advisory Disclaimer */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-600 dark:text-amber-400 text-xs leading-relaxed font-normal">
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
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-7 shadow-xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Back Campaign</h3>
                <p className="text-xs text-[var(--text-secondary)]">Escrowed directly on Sepolia</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-[var(--text-muted)]">Balance:</div>
                <div className="text-xs font-mono font-bold text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)]">
                  {balance ? `${parseFloat(balance).toFixed(3)} ETH` : '0.000 ETH'}
                </div>
              </div>
            </div>

            {/* TRANSACTION WORKFLOW: PENDING */}
            {txState === 'PENDING' && (
              <div className="p-5 rounded-xl bg-[var(--accent-brand-subtle)] border border-[var(--accent-brand)]/40 space-y-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full border-3 border-[var(--accent-brand)]/30 border-t-[var(--accent-brand)] animate-spin"></div>
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">Waiting for Sepolia Block Confirmation...</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Non-custodial escrow deposit in progress</div>
                </div>
                {txDetails?.txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txDetails.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] hover:underline"
                  >
                    <span>View on Sepolia Etherscan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* TRANSACTION WORKFLOW: CONFIRMED */}
            {txState === 'CONFIRMED' && (
              <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Contribution Confirmed on Sepolia</span>
                </div>
                <div className="text-xs font-mono space-y-1.5 text-[var(--text-secondary)] border-t border-emerald-500/20 pt-2">
                  <div className="flex justify-between">
                    <span>Accepted in Escrow:</span>
                    <span className="font-bold text-[var(--text-primary)]">{txDetails?.accepted?.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Block Number:</span>
                    <span className="font-bold text-[var(--text-primary)]">#{txDetails?.blockNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Vault Total:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalRaised.toFixed(2)} ETH / 20.00 ETH</span>
                  </div>
                </div>
                {txDetails?.txHash && (
                  <div className="pt-1">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txDetails.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] hover:underline"
                    >
                      <span>Tx: {txDetails.txHash.slice(0, 10)}...{txDetails.txHash.slice(-8)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setTxState('IDLE')}
                  className="w-full mt-2 py-2 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--hover-bg)] text-xs font-mono text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
                >
                  Contribute Again
                </button>
              </div>
            )}

            {/* TRANSACTION WORKFLOW: EXCESS_REFUND (DUAL-RECEIPT) */}
            {txState === 'EXCESS_REFUND' && (
              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3.5">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <Zap className="w-5 h-5 flex-shrink-0" />
                  <span>Dual-Receipt: In-Block Excess Refund</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Your deposit exceeded the strict 20.00 ETH hard cap. TrustBridge smart contract automatically accepted headroom and refunded excess in the exact same transaction block.
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-emerald-500/30 text-xs font-mono">
                    <div className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">Locked in Vault</div>
                    <div className="text-base font-bold text-[var(--text-primary)] mt-1">{txDetails?.accepted?.toFixed(4)} ETH</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Cap reached (20 ETH)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-amber-500/30 text-xs font-mono">
                    <div className="text-[10px] uppercase text-amber-600 dark:text-amber-400 font-bold">In-Block Refund</div>
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">{txDetails?.refunded?.toFixed(4)} ETH</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Returned to wallet</div>
                  </div>
                </div>

                {txDetails?.txHash && (
                  <div className="pt-1">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txDetails.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] hover:underline"
                    >
                      <span>Receipt: {txDetails.txHash.slice(0, 10)}...{txDetails.txHash.slice(-8)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setTxState('IDLE')}
                  className="w-full mt-2 py-2 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--hover-bg)] text-xs font-mono text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* TRANSACTION WORKFLOW: IDLE FORM */}
            {txState === 'IDLE' && (
              <form onSubmit={handleContributeSubmit} noValidate className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    <span>Enter Contribution</span>
                    <span className="text-[var(--text-muted)] font-mono">Min 0.01 ETH</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={contribAmount}
                      onChange={(e) => setContribAmount(e.target.value)}
                      placeholder="0.5"
                      className="w-full px-4 py-3 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-lg font-mono font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-brand)] transition"
                    />
                    <span className="absolute right-4 top-3.5 text-xs font-mono font-bold text-[var(--text-muted)]">
                      ETH
                    </span>
                  </div>
                </div>

                {/* Quick Select Chips (+0.25, +0.5, +1.0, +2.0 ETH, and MAX) */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[0.25, 0.5, 1.0, 2.0].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => handleQuickSelect(val)}
                      className="flex-1 py-1.5 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--hover-bg)] text-xs font-mono font-medium text-[var(--text-primary)] border border-[var(--border-subtle)] transition active:scale-95 cursor-pointer"
                    >
                      +{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleMaxSelect}
                    className="flex-1 py-1.5 rounded-lg bg-[var(--accent-brand-subtle)] hover:opacity-90 text-xs font-mono font-bold text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] border border-[var(--accent-brand)]/40 transition active:scale-95 cursor-pointer"
                  >
                    MAX
                  </button>
                </div>

                {/* Real-Time Dynamic Gas Estimation with Speed Tiers */}
                <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Network Gas:</span>
                    </span>
                    <span className="text-[var(--text-primary)] font-bold">
                      ~{gasInfo.feeEth} ETH (${gasInfo.feeUsd} USD)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <span className="text-[var(--text-muted)] mr-1">Speed:</span>
                    {['low', 'medium', 'fast'].map((tier) => (
                      <button
                        type="button"
                        key={tier}
                        onClick={() => setGasPriority(tier)}
                        className={`flex-1 py-1 rounded capitalize transition cursor-pointer ${
                          gasPriority === tier
                            ? 'bg-[var(--accent-brand)] text-black font-bold'
                            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--hover-bg)]'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Headroom Tracking Metric */}
                <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Cap Headroom (to 20 ETH):</span>
                    <span className="text-[var(--text-primary)] font-bold">{remaining.toFixed(2)} ETH</span>
                  </div>
                  {totalRaised < minGoal && (
                    <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400">
                      <span>Headroom to Min Goal (10 ETH):</span>
                      <span className="font-semibold">{(minGoal - totalRaised).toFixed(2)} ETH</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {!account ? (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="w-full py-3.5 rounded-full btn-fintech-primary text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Connect Wallet to Back</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={remaining <= 0}
                    className="w-full py-3.5 rounded-full btn-fintech-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {remaining <= 0 ? (
                      <span>Hard Cap Saturated (20.00 ETH)</span>
                    ) : (
                      <>
                        <span>Contribute via MetaMask</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </form>
            )}

            {/* In-block refund guarantee notice */}
            <div className="pt-2 text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
              If contribution exceeds remaining capacity, excess ETH is automatically refunded within the same block.
            </div>
          </div>

          {/* ESCROW PROTECTION ARCHITECTURE CARD */}
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-3 text-xs">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>How Funds Are Protected</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Milestone disbursements require proof submissions and authorized verifier multi-sig approval. Unapproved campaigns allow contributors to pull 100% refund claims directly from the smart contract.
            </p>
            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
              <span>Pull-Payment Secure</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Reentrancy Guarded</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
