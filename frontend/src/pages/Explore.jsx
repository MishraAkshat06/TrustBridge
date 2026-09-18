import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ShieldCheck, ArrowUpRight, Activity } from 'lucide-react';

export default function Explore() {
  const { campaigns, setActiveCampaignId, setCurrentView } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = campaigns.filter((c) => {
    const matchCat = selectedCategory === 'ALL' || c.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchRisk = selectedRisk === 'ALL' || c.riskLevel === selectedRisk;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchRisk && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-[var(--text-primary)]">
      {/* Institutional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] border border-[var(--border-subtle)] font-semibold">
              Escrow Market
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">Live Consensus Verification</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Campaign Marketplace
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Auditable decentralized escrow tranches with real-time multi-agent AI risk telemetry
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search contracts, creators, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-brand)] w-64 sm:w-72 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mr-1">Category</span>
        {['ALL', 'Hardware', 'Cleantech', 'Open Source'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg border transition-all text-xs cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] border-[var(--accent-brand)] font-semibold shadow-xs'
                : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
            }`}
          >
            {cat}
          </button>
        ))}

        <div className="h-4 w-px bg-[var(--border-subtle)] mx-2 hidden sm:block"></div>

        <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mr-1">Risk Rating</span>
        {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((risk) => (
          <button
            key={risk}
            onClick={() => setSelectedRisk(risk)}
            className={`px-3 py-1.5 rounded-lg border transition-all text-xs cursor-pointer ${
              selectedRisk === risk
                ? 'bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] border-[var(--accent-brand)] font-semibold shadow-xs'
                : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
            }`}
          >
            {risk}
          </button>
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => {
          const isLow = c.riskLevel === 'LOW';
          const isMed = c.riskLevel === 'MEDIUM';
          const hardCap = c.hardCap || 20;
          const minGoal = c.goal || 10;
          const raised = c.totalRaised || c.raised || 0;
          const capPct = Math.min((raised / hardCap) * 100, 100);
          const goalPct = (minGoal / hardCap) * 100;

          return (
            <div
              key={c.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-md rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[var(--border-strong)] hover:-translate-y-1 transition-all duration-200 group"
            >
              {/* Top Meta */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {c.category}
                  </span>
                  {c.verified ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>KYC Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <span>Pending Audit</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight leading-snug group-hover:text-[var(--accent-brand)] transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {c.summary}
                </p>

                {/* Creator Chip */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1">
                  <span>Creator:</span>
                  <span className="text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                    {c.creator.slice(0, 6)}...{c.creator.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Progress & Dual-Target Telemetry */}
              <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <div>
                    <span className="text-[var(--text-primary)] font-bold text-sm">{raised.toFixed(2)} ETH</span>
                    <span className="text-[var(--text-muted)] text-[11px]"> / {hardCap.toFixed(1)} ETH Cap</span>
                  </div>
                  <span className="text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] text-[11px] font-semibold">
                    {capPct.toFixed(1)}% Filled
                  </span>
                </div>

                {/* Dual-Target Progress Bar */}
                <div className="relative w-full h-2.5 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-full overflow-visible">
                  {/* Min Goal Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                    style={{ left: `${goalPct}%` }}
                    title={`Goal: ${minGoal} ETH`}
                  />
                  {/* Progress Fill */}
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[var(--accent-brand)] transition-all duration-500"
                    style={{ width: `${capPct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>Min Goal: {minGoal} ETH</span>
                  <span>Rem: {(hardCap - raised).toFixed(2)} ETH</span>
                </div>

                {/* AI Risk Score Pill & Inspect Button */}
                <div className="flex items-center justify-between pt-2">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium border ${
                      isLow
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : isMed
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <Activity className="w-3 h-3" />
                    <span>AI: {c.mlScore}% {c.riskLevel}</span>
                  </span>

                  <button
                    onClick={() => {
                      setActiveCampaignId(c.id);
                      setCurrentView('Campaign');
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] text-xs font-semibold tracking-tight transition-all shadow-xs cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
