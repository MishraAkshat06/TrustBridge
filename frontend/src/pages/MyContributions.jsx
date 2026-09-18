import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeartHandshake, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MyContributions() {
  const { myContributions, requestRefund, setCurrentView, setActiveCampaignId } = useApp();
  const [statusMsg, setStatusMsg] = useState('');

  function handleRefundClick(id) {
    const res = requestRefund(id);
    setStatusMsg(res.msg);
    setTimeout(() => setStatusMsg(''), 4000);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-[var(--text-primary)]">
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">My Backer Vault & Contributions</h2>
        <p className="text-xs text-[var(--text-secondary)]">Track your escrowed ETH, milestone progress, and exercise instant smart-contract refund rights</p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {myContributions.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <HeartHandshake className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">No active contributions found</h3>
          <p className="text-xs text-[var(--text-secondary)]">Discover and support milestone-verified hardware and software campaigns.</p>
          <button
            onClick={() => setCurrentView('Explore')}
            className="px-4 py-2 btn-fintech-primary text-xs font-bold cursor-pointer"
          >
            Explore Projects
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myContributions.map((item) => (
            <div
              key={item.campaignId}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-[var(--text-primary)]">{item.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 text-[10px] font-mono">
                    {item.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-[var(--text-secondary)]">
                  Total Backed: <strong className="text-[var(--text-primary)]">{item.amount.toFixed(2)} ETH</strong>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setActiveCampaignId(item.campaignId);
                    setCurrentView('Campaign');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-subtle)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  View Details
                </button>

                <button
                  onClick={() => handleRefundClick(item.campaignId)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Request Refund</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
