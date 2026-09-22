import React from 'react';

/**
 * CountBox Component (FinTech Telemetry Card)
 * Displays key financial & milestone metrics with tabular numerals and theme styling.
 *
 * @param {string} title - Primary numeric or status metric
 * @param {string} value - Descriptive header/label
 * @param {string} [subtitle] - Optional auxiliary metric (e.g. "of 20 ETH Cap")
 * @param {string} [badge] - Optional status badge chip
 * @param {string} [className] - Custom container classes
 */
const CountBox = ({ title, value, subtitle, badge, className = '' }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-white dark:border-white/10 bg-white/50 dark:bg-slate-900/60 backdrop-blur-xl shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-white/70 dark:hover:bg-slate-900/80 hover:border-white dark:hover:border-white/20 ${className}`}
    >
      <div className="flex items-center gap-1.5 w-full justify-center">
        <h4 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-[#020617] dark:text-slate-100 tabular-nums text-center truncate">
          {title}
        </h4>
        {badge && (
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#059669] dark:text-emerald-400 border border-emerald-500/30 backdrop-blur-xs">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-1 text-center">
        {value}
      </p>
      {subtitle && (
        <span className="text-[11px] font-mono text-[#64748B]/80 dark:text-slate-500 mt-0.5 text-center">
          {subtitle}
        </span>
      )}
    </div>
  );
};

export default CountBox;
