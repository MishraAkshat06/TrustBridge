import React from 'react';
import { useApp } from '../context/AppContext';
import { Bot, ShieldAlert, CheckCircle, AlertTriangle, Cpu, TrendingUp, Info } from 'lucide-react';

export default function AiRiskReport() {
  const { currentCampaign } = useApp();

  const c = currentCampaign || {
    id: 'campaign-01',
    title: 'Autonomous Multi-Agent Escrow Protocol',
    goal: '10.0 ETH',
    category: 'AI/ML',
    mlScore: 92,
    risk: 'LOW'
  };

  const metrics = [
    { label: 'ML Success Probability', value: `${c.mlScore}%`, desc: 'Calibrated Random Forest on launch-time zero leakage features' },
    { label: 'Anomaly Risk Tier', value: c.risk, desc: 'Isolation Forest contamination score (-0.12 anomaly boundary)' },
    { label: 'ROC-AUC Score', value: '0.7345', desc: 'Area Under Receiver Operating Characteristic Curve' },
    { label: 'Brier Calibration', value: '0.2095', desc: 'Quadratic mean squared difference of calibrated probability' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-border-color pb-6">
        <div className="flex items-center gap-2 text-accent-gold text-xs font-semibold tracking-wide uppercase mb-2">
          <Bot className="w-4 h-4" /> Comprehensive Advisory Audit
        </div>
        <h1 className="text-3xl font-bold tracking-tight">AI & ML Risk Assessment Report</h1>
        <p className="text-text-muted mt-1 font-mono text-sm">Target: {c.title}</p>
      </div>

      {/* Mandatory PRD Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-500">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed font-medium">
          <span className="font-bold">Mandatory Advisory Notice:</span> This is an AI-generated advisory assessment and not a financial verdict. All smart contract financial transactions remain under exclusive non-custodial user control.
        </div>
      </div>

      {/* Grid: Quantitative ML Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-sm space-y-2">
            <div className="text-xs text-text-muted">{m.label}</div>
            <div className="text-2xl font-black font-mono text-text-main">{m.value}</div>
            <p className="text-[11px] text-text-muted leading-tight">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Agent Analysis Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent 1: Campaign Analyzer */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Cpu className="w-4 h-4 text-accent-gold" /> Campaign Analyzer Agent (Nemotron)
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-border-color">
              <span className="text-text-muted">Pitch Completeness:</span>
              <span className="font-semibold text-emerald-500">94% (Comprehensive)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-color">
              <span className="text-text-muted">Roadmap Quality:</span>
              <span className="font-semibold text-emerald-500">STRONG (4 Tranches Defined)</span>
            </div>
            <div className="py-2">
              <span className="text-text-muted block mb-1">Technical Strengths:</span>
              <ul className="list-disc list-inside text-text-muted space-y-1">
                <li>Strict separation of concerns across Solidity, Flask API, and React frontend</li>
                <li>In-block mathematical excess refund logic protects against over-funding</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Agent 2: Risk Analyst */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldAlert className="w-4 h-4 text-emerald-500" /> Risk Analyst Agent (Nemotron)
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-border-color">
              <span className="text-text-muted">Budget Realism Score:</span>
              <span className="font-semibold text-emerald-500">88% (Well-aligned)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-color">
              <span className="text-text-muted">Timeline Feasibility:</span>
              <span className="font-semibold text-accent-gold">REALISTIC (60 Days Target)</span>
            </div>
            <div className="py-2">
              <span className="text-text-muted block mb-1">Identified Mitigation Points:</span>
              <ul className="list-disc list-inside text-text-muted space-y-1">
                <li>Creator allowed 1 retry grace period upon verifier evidence rejection</li>
                <li>Prorated remaining balances protected by pull-payment pattern</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Explainer Summary Card */}
      <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-gold" /> Explainer Agent Synthesis
        </h3>
        <p className="text-xs text-text-muted leading-relaxed">
          The campaign presents strong historical feature alignment. The 10.0 ETH minimum goal and 20.0 ETH hard cap strictly adhere to Sepolia testing parameters. Funds are unlocked in 4 discrete tranches (20%, 25%, 25%, 30%) preventing upfront capital drain and ensuring verifier accountability.
        </p>
      </div>
    </div>
  );
}
