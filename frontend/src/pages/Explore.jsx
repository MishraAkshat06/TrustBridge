import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search } from 'lucide-react';
import FundCard from '../components/FundCard';

export default function Explore() {
  const { campaigns, setActiveCampaignId, setCurrentView } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = campaigns.filter((c) => {
    const cat = c.category || '';
    const risk = c.riskLevel || c.risk_level || 'LOW';
    const title = c.title || '';
    const summary = c.summary || c.description || '';

    const matchCat =
      selectedCategory === 'ALL' || cat.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchRisk = selectedRisk === 'ALL' || risk === selectedRisk;
    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      summary.toLowerCase().includes(search.toLowerCase());

    return matchCat && matchRisk && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
      {/* Institutional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-semibold">
              Escrow Market
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-[var(--text-muted)]">
              Live Consensus Verification
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[var(--text-primary)]">
            Campaign Marketplace
          </h1>
          <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mt-0.5">
            Auditable decentralized escrow tranches with real-time multi-agent AI risk telemetry
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search contracts, creators, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 w-64 sm:w-72 transition-all shadow-xs backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-slate-400 dark:text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mr-1">
          Category
        </span>
        {['ALL', 'Hardware', 'Cleantech', 'Open Source'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg border transition-all text-xs cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400 font-semibold shadow-[0_0_12px_rgba(0,245,160,0.2)]'
                : 'bg-white dark:bg-[var(--bg-surface)] text-slate-600 dark:text-[var(--text-secondary)] border-slate-200 dark:border-[var(--border-subtle)] hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-white/20'
            }`}
          >
            {cat}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block"></div>

        <span className="text-slate-400 dark:text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mr-1">
          Risk Rating
        </span>
        {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((risk) => (
          <button
            key={risk}
            onClick={() => setSelectedRisk(risk)}
            className={`px-3 py-1.5 rounded-lg border transition-all text-xs cursor-pointer ${
              selectedRisk === risk
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400 font-semibold shadow-[0_0_12px_rgba(0,245,160,0.2)]'
                : 'bg-white dark:bg-[var(--bg-surface)] text-slate-600 dark:text-[var(--text-secondary)] border-slate-200 dark:border-[var(--border-subtle)] hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-white/20'
            }`}
          >
            {risk}
          </button>
        ))}
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <FundCard
            key={c.id}
            campaign={{
              ...c,
              description: c.summary || c.description,
              creator_address: c.creator,
              creator_name: c.creatorName || (c.creator ? `${c.creator.slice(0, 6)}...` : 'TrustBridge Protocol'),
              creator_verified: c.verified,
              goal_eth: c.goal || 10,
              total_raised_eth: c.totalRaised || c.raised || 0,
              ml_score: c.mlScore || 85,
              risk_level: c.riskLevel || 'LOW',
            }}
            handleClick={() => {
              setActiveCampaignId(c.id);
              setCurrentView('Campaign');
            }}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No active escrow campaigns match your search
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your category or risk filters
          </p>
        </div>
      )}
    </div>
  );
}
