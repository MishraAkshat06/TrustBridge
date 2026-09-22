import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeartHandshake, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MyContributions() {
  const { myContributions, requestRefund, setCurrentView, setActiveCampaignId } = useApp();
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loadingRefund, setLoadingRefund] = useState(false);

  async function handleRefundClick(id) {
    setLoadingRefund(true);
    try {
      const res = await requestRefund(id);
      if (res && res.success) {
        setIsError(false);
        setStatusMsg(`Refund claimed successfully on Sepolia! Tx: ${res.txHash.slice(0, 10)}...`);
      } else {
        setIsError(true);
        setStatusMsg(res?.msg || 'Refund claim failed on chain.');
      }
    } catch (err) {
      setIsError(true);
      setStatusMsg(err.message || 'Refund claim failed.');
    } finally {
      setLoadingRefund(false);
      setTimeout(() => setStatusMsg(''), 6000);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-[var(--text-primary)]">
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">My Backer Vault & Contributions</h2>
        <p className="text-xs text-[var(--text-secondary)]">Track your escrowed ETH, milestone progress, and exercise instant smart-contract refund rights</p>
      </div>

      {statusMsg && (
        <div className={`p-3 border rounded-xl text-xs font-mono flex items-center space-x-2 ${
          isError 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
        }`}>
          {isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          )}
          <span>{statusMsg}</span>
        </div>
      )}

      {myContributions.length === 0 ? (
        <div className="bg-white/80 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-[var(--border-subtle)] rounded-3xl p-12 sm:p-16 text-center space-y-6 shadow-xl backdrop-blur-xl">
          {/* 3D Holographic Escrow Cube */}
          <div className="py-4">
            <div className="holo-cube-scene">
              <div className="holo-cube">
                <div className="holo-face holo-face-front">◈</div>
                <div className="holo-face holo-face-back">⬡</div>
                <div className="holo-face holo-face-right">⚡</div>
                <div className="holo-face holo-face-left">🔒</div>
                <div className="holo-face holo-face-top">🛡️</div>
                <div className="holo-face holo-face-bottom">ETH</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-[var(--text-primary)]">
              No active contributions found
            </h3>
            <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] leading-relaxed">
              Discover and support milestone-verified hardware and software campaigns with cryptographically enforced escrow.
            </p>
          </div>

          <div>
            <button
              onClick={() => setCurrentView('Explore')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono shadow-[0_0_20px_rgba(0,245,160,0.35)] transition-all hover:scale-105 cursor-pointer"
            >
              <span>Explore Active Vaults</span>
              <span>→</span>
            </button>
          </div>
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
                  disabled={loadingRefund}
                  onClick={() => handleRefundClick(item.campaignId)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingRefund ? 'animate-spin' : ''}`} />
                  <span>{loadingRefund ? 'Claiming...' : 'Request Refund'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
