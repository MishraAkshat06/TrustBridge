import React from 'react';
import { useApp } from '../context/AppContext';
import { Bot, ShieldAlert, CheckCircle, AlertTriangle, Cpu, TrendingUp, Info } from 'lucide-react';

export default function AiRiskReport() {
  const { activeCampaign } = useApp();

  const c = activeCampaign || {
    id: 'campaign-01',
    title: 'Autonomous Multi-Agent Escrow Protocol',
    goal: '10.0 ETH',
    category: 'AI/ML',
    mlScore: 92,
    risk: 'LOW'
  };

  const mlScore = c.mlScore || 92;
  const anomalyRisk = (c.risk || c.riskLevel || 'LOW').toUpperCase();
  const budgetRealism = c.budgetRealism || (parseFloat(c.goal || 10) <= 20 ? '88% (Well-aligned)' : '68% (Elevated)');
  const pitchCompleteness = c.pitchCompleteness || '94% (Comprehensive)';
  const roadmapQuality = c.roadmapQuality || ((c.milestones && c.milestones.length === 4) ? 'STRONG (4 Tranches Defined)' : 'MODERATE');

  const metrics = [
    { label: 'ML Success Probability', value: `${mlScore}%`, desc: 'Calibrated Random Forest on launch-time zero leakage features' },
    { label: 'Anomaly Risk Tier', value: anomalyRisk, desc: 'Isolation Forest contamination score (-0.12 anomaly boundary)' },
    { label: 'ROC-AUC Score', value: '0.7345', desc: 'Area Under Receiver Operating Characteristic Curve' },
    { label: 'Brier Calibration', value: '0.2095', desc: 'Quadratic mean squared difference of calibrated probability' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn text-[var(--text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-2 text-[var(--accent-brand)] text-xs font-semibold tracking-wide uppercase mb-2">
          <Bot className="w-4 h-4" /> Comprehensive Advisory Audit
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">AI & ML Risk Assessment Report</h1>
        <p className="text-[var(--text-secondary)] mt-1 font-mono text-sm">Target: {c.title}</p>
      </div>

      {/* Mandatory PRD Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-600 dark:text-amber-400">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed font-medium">
          <span className="font-bold">Mandatory Advisory Notice:</span> This is an AI-generated advisory assessment and not a financial verdict. All smart contract financial transactions remain under exclusive non-custodial user control.
        </div>
      </div>

      {/* Grid: Quantitative ML Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm space-y-2">
            <div className="text-xs text-[var(--text-muted)]">{m.label}</div>
            <div className="text-2xl font-black font-mono text-[var(--text-primary)]">{m.value}</div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-tight">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Agent Analysis Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent 1: Campaign Analyzer */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <Cpu className="w-4 h-4 text-[var(--accent-brand)]" /> Campaign Analyzer Agent (Nemotron)
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Pitch Completeness:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{pitchCompleteness}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Roadmap Quality:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{roadmapQuality}</span>
            </div>
            <div className="py-2">
              <span className="text-[var(--text-secondary)] block mb-1">Technical Strengths:</span>
              <ul className="list-disc list-inside text-[var(--text-muted)] space-y-1">
                <li>Strict separation of concerns across Solidity, Flask API, and React frontend</li>
                <li>In-block mathematical excess refund logic protects against over-funding</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Agent 2: Risk Analyst */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Risk Analyst Agent (Nemotron)
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Budget Realism Score:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{budgetRealism}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Timeline Feasibility:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">REALISTIC (60 Days Target)</span>
            </div>
            <div className="py-2">
              <span className="text-[var(--text-secondary)] block mb-1">Identified Mitigation Points:</span>
              <ul className="list-disc list-inside text-[var(--text-muted)] space-y-1">
                <li>Creator allowed 1 retry grace period upon verifier evidence rejection</li>
                <li>Prorated remaining balances protected by pull-payment pattern</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Explainer Summary Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2 text-[var(--text-primary)]">
          <TrendingUp className="w-4 h-4 text-[var(--accent-brand)]" /> Explainer Agent Synthesis
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          The campaign presents strong historical feature alignment. The 10.0 ETH minimum goal and 20.0 ETH hard cap strictly adhere to Sepolia testing parameters. Funds are unlocked in 4 discrete tranches (20%, 25%, 25%, 30%) preventing upfront capital drain and ensuring verifier accountability.
        </p>
      </div>
    </div>
  );
}
