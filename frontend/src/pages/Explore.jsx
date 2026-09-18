import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, CheckCircle2 } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Campaign Marketplace</h1>
          <p className="text-xs text-slate-500">Auditable escrow campaigns with AI risk telemetry</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-48 sm:w-64 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-slate-400 text-[11px] mr-2">CATEGORY:</span>
        {['ALL', 'Hardware', 'Cleantech', 'Open Source'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              selectedCategory === cat 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold' 
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-200 mx-2"></div>

        <span className="text-slate-400 text-[11px] mr-2">RISK:</span>
        {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((risk) => (
          <button
            key={risk}
            onClick={() => setSelectedRisk(risk)}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              selectedRisk === risk 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold' 
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {risk}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((c) => {
          const isLow = c.riskLevel === 'LOW';
          const isMed = c.riskLevel === 'MEDIUM';

          return (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-emerald-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {c.category}
                  </span>
                  {c.verified ? (
                    <span className="text-emerald-700 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified ID</span>
                    </span>
                  ) : (
                    <span className="text-amber-600">Pending Review</span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {c.summary}
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Creator: {c.creator.slice(0, 8)}...{c.creator.slice(-6)}
                </div>
              </div>

              {/* Progress & Cap */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div>
                    <span className="text-slate-900 font-bold">{c.totalRaised.toFixed(2)} ETH</span>
                    <span className="text-slate-400"> / 20.00 ETH</span>
                  </div>
                  <span className="text-emerald-600 text-[11px] font-semibold">{(c.hardCap - c.totalRaised).toFixed(2)} ETH Rem</span>
                </div>

                {/* Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(c.totalRaised / c.hardCap) * 100}%` }}
                  ></div>
                </div>

                {/* Risk Pill & Actions */}
                <div className="flex items-center justify-between pt-2">
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                      isLow
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isMed
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span>{c.mlScore}% Prob | {c.riskLevel}</span>
                  </span>

                  <button
                    onClick={() => {
                      setActiveCampaignId(c.id);
                      setCurrentView('Campaign');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-800 hover:text-emerald-700 text-xs font-semibold tracking-tight transition-colors"
                  >
                    Inspect & Contribute →
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
