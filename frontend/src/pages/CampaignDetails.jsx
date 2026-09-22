import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CONTRACT_ADDRESS } from '../contractConfig';
import CountBox from '../components/CountBox';
import Loader from '../components/Loader';
import CustomButton from '../components/CustomButton';
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
    contractAddress: CONTRACT_ADDRESS,
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

  async function handleContributeSubmit(e) {
    e.preventDefault();
    const val = parseFloat(contribAmount);
    if (!val || val <= 0) return;

    setTxState('PENDING');
    setTxDetails({
      amount: val,
      txHash: '',
      blockNumber: null
    });

    try {
      const res = await contributeToCampaign(c.id, contribAmount);
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
        alert(res?.msg || 'Transaction failed or was rejected by user.');
        setTxState('IDLE');
      }
    } catch (err) {
      console.error(err);
      setTxState('IDLE');
    }
  }

  function handleCopyAddress() {
    navigator.clipboard.writeText(c.contract_address || c.contractAddress || CONTRACT_ADDRESS);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto text-[var(--text-primary)]">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & 4-COLUMN METRIC GRID */}
      {/* ========================================================================= */}
      <div className="relative light-frosted-card p-6 sm:p-8 overflow-hidden">
        {/* Specular top rim reflection highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white dark:via-emerald-400/40 to-transparent"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/60 dark:border-white/10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-[#059669] dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-xs">
                {c.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-[#059669] dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot"></span>
                <span>Sepolia Escrow Active</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/60 dark:bg-white/5 text-[#64748B] dark:text-slate-400 border border-white/80 dark:border-white/10 backdrop-blur-xs">
                Chain ID: 11155111
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#0F172A] dark:text-slate-100">
              {c.title}
            </h1>

            <p className="text-sm text-[#64748B] dark:text-slate-300 max-w-3xl leading-relaxed font-normal">
              {c.summary}
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('AiRisk')}
              className="px-4 py-2.5 rounded-full bg-white/70 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-[#0F172A] dark:text-slate-100 border border-white/90 dark:border-white/20 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
            >
              <Cpu className="w-4 h-4 text-[#059669] dark:text-emerald-400" />
              <span>Full AI Audit Report</span>
            </button>
          </div>
        </div>

        {/* 4-Column Metric Grid (Liquid Frosted Stat Tiles) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
          <CountBox
            title={`${totalRaised.toFixed(2)} ETH`}
            value="Escrow Vault"
            subtitle="100% Non-Custodial"
            badge="Active"
          />
          <CountBox
            title={`${hardCap.toFixed(2)} ETH`}
            value="Cap Ceiling"
            subtitle={`Min Goal: ${minGoal.toFixed(1)} ETH`}
          />
          <CountBox
            title={`${c.deadlineDays || 24} Days`}
            value="Funding Window"
            subtitle="Ends Nov 15, 2026"
          />
          <CountBox
            title={c.creator ? `${c.creator.slice(0, 6)}...${c.creator.slice(-4)}` : '0x71C8...3e90'}
            value="Creator Verified"
            subtitle="KYC Sandbox L1"
            badge="Verified"
          />
        </div>

        {/* Dual-Target Progress Bar with Deep Frosted Groove & Bioluminescent Mint Gradient */}
        <div className="mt-8 space-y-3 pt-6 border-t border-white/60 dark:border-white/10">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#64748B] dark:text-slate-400">
              Current Raised: <strong className="text-[#020617] dark:text-slate-100 font-bold">{totalRaised.toFixed(2)} ETH</strong> ({progressPercent}%)
            </span>
            <span className="text-[#64748B] dark:text-slate-400">
              Remaining Allocation: <strong className="text-[#059669] dark:text-emerald-400 font-bold">{remaining.toFixed(2)} ETH</strong>
            </span>
          </div>

          <div className="relative w-full h-4 bg-slate-200/70 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white dark:border-white/10 shadow-inner backdrop-blur-xs">
            {/* Min Goal Marker Indicator at 50% (10 ETH) */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-amber-500 z-20 shadow-xs rounded-full"
              style={{ left: `${minGoalPercent}%` }}
              title="10 ETH Minimum Goal Target"
            ></div>

            {/* Vibrant Bioluminescent Mint-to-Cyan Gradient Fill with Active Liquid Gloss */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(0,245,160,0.45)] transition-all duration-500 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-mono">
            <span>0 ETH</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">▲ 10 ETH Min Goal (Threshold)</span>
            <span className="text-[#0F172A] dark:text-slate-200 font-semibold">20 ETH Hard Cap (Ceiling)</span>
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
          <div className="light-frosted-card p-6 sm:p-7 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#0F172A] dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#059669] dark:text-emerald-400" />
                  <span>4-Tranche Milestone Roadmap</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Funds unlocked sequentially upon independent verifier cryptographic approval
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-[#059669] dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-xs">
                Tranche {Math.min(4, Math.max(1, (c.milestones || []).findIndex(m => m.status === 'UNDER_REVIEW' || m.status === 'PENDING') + 1))} / 4 Active
              </span>
            </div>

            {/* Stepper Timeline bound dynamically to c.milestones with 3D pulse track */}
            <div className="relative space-y-4 pt-2">
              <div className="absolute left-[30px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-emerald-400 via-teal-400 to-slate-400/30 hidden sm:block pointer-events-none" />
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
                    className={`relative p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:translate-x-1 ${
                      isApproved || isClaimed
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/30 shadow-xs' 
                        : isReview
                        ? 'bg-gradient-to-r from-white/90 to-emerald-50/80 dark:from-emerald-950/40 dark:to-teal-950/30 border-emerald-400/60 dark:border-emerald-400 shadow-[0_0_20px_rgba(0,245,160,0.18)] ring-1 ring-emerald-400/40'
                        : isRejectedRetry || isFinalRejected
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-white/40 dark:bg-white/5 border-white/80 dark:border-white/10 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono z-10 ${
                          isApproved || isClaimed
                            ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : isReview
                            ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,245,160,0.5)] animate-pulse'
                            : isRejectedRetry || isFinalRejected
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-800 text-[#64748B] dark:text-slate-400'
                        }`}>
                          {isApproved || isClaimed ? '✓' : isRejectedRetry || isFinalRejected ? '✕' : (m.id || idx + 1)}
                        </div>
                        <div>
                          <div className="text-xs font-mono font-semibold text-[#64748B] dark:text-slate-400">
                            Tranche {m.id || idx + 1} ({percentage}%)
                          </div>
                          <div className="text-sm font-bold text-[#0F172A] dark:text-slate-100">{m.title}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:self-center">
                        <span className="font-mono text-xs font-bold text-[#020617] dark:text-slate-100">{trancheEth} ETH</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider backdrop-blur-xs ${
                          isApproved || isClaimed
                            ? 'bg-emerald-500/15 text-[#059669] dark:text-emerald-400 border border-emerald-500/30'
                            : isReview
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            : isRejectedRetry
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            : isFinalRejected
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-white/60 dark:bg-white/10 text-[#64748B] dark:text-slate-400 border border-white/80 dark:border-white/10'
                        }`}>
                          {m.status ? m.status.replace('_', ' ') : 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {m.evidence && (
                      <div className="mt-2 pl-10 text-xs font-mono text-[#059669] dark:text-emerald-400 flex items-center gap-1.5">
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
          <div className="light-frosted-card p-6 sm:p-7 space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/60 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-2xl bg-white/70 dark:bg-white/10 border border-white dark:border-white/20 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-[#059669] dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-slate-100">AI Risk Advisory Telemetry</h3>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400">NVIDIA Nemotron + Isolation Forest Anomaly Engine</div>
                </div>
              </div>

              {/* Confidence Badge */}
              <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[#059669] dark:text-emerald-400 font-mono text-xs font-bold backdrop-blur-xs">
                {c.mlScore || 88}% Confidence
              </div>
            </div>

            {/* Feasibility Factors & Radar Summary (Frosted Mini Glass Tiles) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white dark:border-white/10 backdrop-blur-md shadow-xs transition hover:-translate-y-0.5">
                <div className="text-[#64748B] dark:text-slate-400 text-[10px] uppercase">ML Success Prob</div>
                <div className="text-[#059669] dark:text-emerald-400 font-bold text-sm mt-0.5">{c.mlScore || 88}%</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white dark:border-white/10 backdrop-blur-md shadow-xs transition hover:-translate-y-0.5">
                <div className="text-[#64748B] dark:text-slate-400 text-[10px] uppercase">Anomaly Tier</div>
                <div className="text-cyan-700 dark:text-cyan-400 font-bold text-sm mt-0.5">{(c.riskLevel || c.risk || 'LOW').toUpperCase()}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white dark:border-white/10 backdrop-blur-md shadow-xs transition hover:-translate-y-0.5">
                <div className="text-[#64748B] dark:text-slate-400 text-[10px] uppercase">Budget Realism</div>
                <div className="text-[#020617] dark:text-slate-100 font-bold text-sm mt-0.5">{c.goal <= 20 ? '92%' : '68%'}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white dark:border-white/10 backdrop-blur-md shadow-xs transition hover:-translate-y-0.5">
                <div className="text-[#64748B] dark:text-slate-400 text-[10px] uppercase">Pitch Complete</div>
                <div className="text-[#020617] dark:text-slate-100 font-bold text-sm mt-0.5">94%</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white dark:border-white/10 backdrop-blur-md shadow-xs transition hover:-translate-y-0.5">
                <div className="text-[#64748B] dark:text-slate-400 text-[10px] uppercase">Roadmap Quality</div>
                <div className="text-[#059669] dark:text-emerald-400 font-bold text-sm mt-0.5">{(c.milestones || []).length === 4 ? 'STRONG' : 'MODERATE'}</div>
              </div>
            </div>

            {/* Key Extracted Factors */}
            <div className="space-y-2 text-xs text-[#64748B] dark:text-slate-300">
              <div className="font-semibold text-[#0F172A] dark:text-slate-100">Extracted Feasibility Factors:</div>
              <ul className="space-y-1.5 list-disc pl-4 text-[#64748B] dark:text-slate-300 leading-relaxed">
                <li>Non-custodial pull-payment contract prevents lump-sum rug pulls.</li>
                <li>Launch features adhere strictly to zero-leakage training distributions.</li>
                <li>Excess contributions in-block refunded to maintain 20 ETH ceiling.</li>
              </ul>
            </div>

            {/* Mandatory Advisory Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-800 dark:text-amber-400 text-xs leading-relaxed font-normal backdrop-blur-xs">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Advisory Notice:</strong> This is an AI-generated advisory assessment and not a financial verdict.
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT 5 COLUMNS: Contribution Panel & Escrow Safe Guards */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SLEEK CONTRIBUTION PANEL */}
          <div className="light-frosted-card p-6 sm:p-7 space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/60 dark:border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-slate-100">Back Campaign</h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400">Escrowed directly on Sepolia</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-[#64748B] dark:text-slate-400">Balance:</div>
                <div className="text-xs font-mono font-bold text-[#059669] dark:text-emerald-400">
                  {balance ? `${parseFloat(balance).toFixed(3)} ETH` : '0.000 ETH'}
                </div>
              </div>
            </div>

            {/* TRANSACTION WORKFLOW: PENDING */}
            {txState === 'PENDING' && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 text-center backdrop-blur-md">
                <div className="w-10 h-10 mx-auto rounded-full border-3 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
                <div>
                  <div className="text-sm font-bold text-[#0F172A] dark:text-slate-100">Waiting for Sepolia Block Confirmation...</div>
                  <div className="text-xs text-[#64748B] dark:text-slate-400 mt-1">Non-custodial escrow deposit in progress</div>
                </div>
                {txDetails?.txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txDetails.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#059669] dark:text-emerald-400 hover:underline"
                  >
                    <span>View on Sepolia Etherscan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* TRANSACTION WORKFLOW: CONFIRMED */}
            {txState === 'CONFIRMED' && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3.5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[#059669] dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Contribution Confirmed on Sepolia</span>
                </div>
                <div className="text-xs font-mono space-y-1.5 text-[#64748B] dark:text-slate-300 border-t border-emerald-500/20 pt-2">
                  <div className="flex justify-between">
                    <span>Accepted in Escrow:</span>
                    <span className="font-bold text-[#020617] dark:text-slate-100">{txDetails?.accepted?.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Block Number:</span>
                    <span className="font-bold text-[#020617] dark:text-slate-100">#{txDetails?.blockNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Vault Total:</span>
                    <span className="font-bold text-[#059669] dark:text-emerald-400">{totalRaised.toFixed(2)} ETH / 20.00 ETH</span>
                  </div>
                </div>
                {txDetails?.txHash && (
                  <div className="pt-1">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txDetails.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#059669] dark:text-emerald-400 hover:underline"
                    >
                      <span>Tx: {txDetails.txHash.slice(0, 10)}...{txDetails.txHash.slice(-8)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setTxState('IDLE')}
                  className="w-full mt-2 py-2.5 rounded-xl bg-white/70 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-xs font-mono text-[#0F172A] dark:text-slate-100 border border-white/80 dark:border-white/10 transition cursor-pointer shadow-xs"
                >
                  Contribute Again
                </button>
              </div>
            )}

            {/* TRANSACTION WORKFLOW: EXCESS_REFUND (DUAL-RECEIPT) */}
            {txState === 'EXCESS_REFUND' && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3.5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <Zap className="w-5 h-5 flex-shrink-0 text-amber-500" />
                  <span>Dual-Receipt: In-Block Excess Refund</span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-300 leading-relaxed">
                  Your deposit exceeded the strict 20.00 ETH hard cap. TrustBridge smart contract automatically accepted headroom and refunded excess in the exact same transaction block.
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-emerald-500/30 text-xs font-mono backdrop-blur-xs">
                    <div className="text-[10px] uppercase text-[#059669] dark:text-emerald-400 font-bold">Locked in Vault</div>
                    <div className="text-base font-bold text-[#020617] dark:text-slate-100 mt-1">{txDetails?.accepted?.toFixed(4)} ETH</div>
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5">Cap reached (20 ETH)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-amber-500/30 text-xs font-mono backdrop-blur-xs">
                    <div className="text-[10px] uppercase text-amber-700 dark:text-amber-400 font-bold">In-Block Refund</div>
                    <div className="text-base font-bold text-amber-700 dark:text-amber-400 mt-1">{txDetails?.refunded?.toFixed(4)} ETH</div>
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5">Returned to wallet</div>
                  </div>
                </div>

                {txDetails?.txHash && (
                  <div className="pt-1">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txDetails.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#059669] dark:text-emerald-400 hover:underline"
                    >
                      <span>Receipt: {txDetails.txHash.slice(0, 10)}...{txDetails.txHash.slice(-8)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setTxState('IDLE')}
                  className="w-full mt-2 py-2.5 rounded-xl bg-white/70 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-xs font-mono text-[#0F172A] dark:text-slate-100 border border-white/80 dark:border-white/10 transition cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            )}

            {/* TRANSACTION WORKFLOW: IDLE FORM */}
            {txState === 'IDLE' && (
              <form onSubmit={handleContributeSubmit} noValidate className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1.5">
                    <span>Enter Contribution</span>
                    <span className="text-[#64748B] dark:text-slate-400 font-mono">Min 0.01 ETH</span>
                  </div>

                  {/* Recessed Clear-Glass Input Channel */}
                  <div className="relative rounded-2xl bg-slate-100/60 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 focus-within:bg-white/80 dark:focus-within:bg-black/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all backdrop-blur-md overflow-hidden">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={contribAmount}
                      onChange={(e) => setContribAmount(e.target.value)}
                      placeholder="0.5"
                      className="w-full px-4 py-3.5 bg-transparent border-0 text-lg font-mono font-bold text-[#020617] dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                    <span className="absolute right-4 top-4 text-xs font-mono font-bold text-[#64748B] dark:text-slate-400 pointer-events-none">
                      ETH
                    </span>
                  </div>
                </div>

                {/* Quick-Amount Preset Pills (+0.25, +0.5, +1, +2, MAX) */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[0.25, 0.5, 1.0, 2.0].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => handleQuickSelect(val)}
                      className="flex-1 py-1.5 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold shadow-xs hover:bg-emerald-500/15 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 active:scale-95 transition-all cursor-pointer"
                    >
                      +{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleMaxSelect}
                    className="flex-1 py-1.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 backdrop-blur-md border border-emerald-400/60 text-[#059669] dark:text-emerald-400 text-xs font-mono font-bold shadow-[0_0_12px_rgba(0,245,160,0.15)] hover:bg-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    MAX
                  </button>
                </div>

                {/* Real-Time Dynamic Gas Estimation with Speed Tiers */}
                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-white dark:border-white/10 backdrop-blur-md space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#64748B] dark:text-slate-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Network Gas:</span>
                    </span>
                    <span className="text-[#020617] dark:text-slate-100 font-bold">
                      ~{gasInfo.feeEth} ETH (${gasInfo.feeUsd} USD)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <span className="text-[#64748B] dark:text-slate-400 mr-1">Speed:</span>
                    {['low', 'medium', 'fast'].map((tier) => (
                      <button
                        type="button"
                        key={tier}
                        onClick={() => setGasPriority(tier)}
                        className={`flex-1 py-1 rounded-lg capitalize transition cursor-pointer ${
                          gasPriority === tier
                            ? 'bg-[#00D09C] dark:bg-[#00F5A0] text-slate-950 font-bold shadow-xs'
                            : 'bg-white/60 dark:bg-white/10 text-[#64748B] dark:text-slate-300 border border-white dark:border-white/10 hover:bg-white dark:hover:bg-white/20'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Headroom Tracking Metric */}
                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-white dark:border-white/10 backdrop-blur-md space-y-1.5 text-xs font-mono shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] dark:text-slate-400">Cap Headroom (to 20 ETH):</span>
                    <span className="text-[#059669] dark:text-emerald-400 font-bold">{remaining.toFixed(2)} ETH</span>
                  </div>
                  {totalRaised < minGoal && (
                    <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400">
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
                    className="w-full py-3.5 rounded-full btn-fintech-primary text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-98 transition-all"
                  >
                    <span>Connect Wallet to Back</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={remaining <= 0}
                    className="w-full py-3.5 rounded-full btn-fintech-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg active:scale-98 transition-all"
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
            <div className="pt-2 text-[11px] text-[#64748B] dark:text-slate-400 text-center leading-relaxed font-normal">
              If contribution exceeds remaining capacity, excess ETH is automatically refunded within the same block.
            </div>
          </div>

          {/* ESCROW PROTECTION ARCHITECTURE CARD */}
          <div className="light-frosted-card p-5 space-y-3 text-xs relative overflow-hidden">
            <div className="font-bold text-[#0F172A] dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#059669] dark:text-emerald-400" />
              <span>How Funds Are Protected</span>
            </div>
            <p className="text-[#64748B] dark:text-slate-300 leading-relaxed">
              Milestone disbursements require proof submissions and authorized verifier multi-sig approval. Unapproved campaigns allow contributors to pull 100% refund claims directly from the smart contract.
            </p>
            <div className="pt-2 border-t border-white/60 dark:border-white/10 flex items-center justify-between text-[11px] font-mono text-[#64748B] dark:text-slate-400">
              <span>Pull-Payment Secure</span>
              <span className="text-[#059669] dark:text-emerald-400 font-semibold">Reentrancy Guarded</span>
            </div>
          </div>

        </div>

      </div>

      {txState === 'PENDING' && (
        <Loader
          title="Broadcasting Contribution"
          message="Waiting for Sepolia block inclusion and escrow balance update..."
        />
      )}
    </div>
  );
}
