import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

/**
 * Loader Component
 * Full-screen / container glassmorphism overlay for asynchronous blockchain & API actions.
 *
 * @param {string} [title] - Contextual heading (e.g., "Transaction in Progress")
 * @param {string} [message] - Detailed subtext (e.g., "Mining on Sepolia Testnet...")
 * @param {boolean} [showSuccess] - Optional confirmed state
 */
const Loader = ({
  title = 'Transaction in Progress',
  message = 'Please wait while the transaction is being verified on Ethereum Sepolia...',
  showSuccess = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center p-8 max-w-sm w-full mx-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
        {showSuccess ? (
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin" />
          </div>
        )}

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {message}
        </p>

        <div className="mt-5 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sepolia Escrow Settlement</span>
        </div>
      </div>
    </div>
  );
};

export default Loader;
