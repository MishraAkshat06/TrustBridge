import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * CustomButton Component
 * Standardized interactive button supporting loading spinner, variants, and a11y focus states.
 *
 * @param {string} btnType - 'button' | 'submit' | 'reset'
 * @param {string} title - Button label text
 * @param {function} [handleClick] - Click callback handler
 * @param {string} [variant] - 'primary' | 'secondary' | 'outline' | 'danger' | 'amber'
 * @param {boolean} [isLoading] - Loading spinner state
 * @param {boolean} [disabled] - Disabled state
 * @param {React.ReactNode} [icon] - Leading icon element
 * @param {string} [className] - Additional Tailwind classes
 */
const CustomButton = ({
  btnType = 'button',
  title,
  handleClick,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  icon = null,
  className = '',
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary:
      'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-sm shadow-emerald-500/20 active:scale-[0.98]',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:scale-[0.98]',
    outline:
      'border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 active:scale-[0.98]',
    danger:
      'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 active:scale-[0.98]',
    amber:
      'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-sm shadow-amber-500/20 active:scale-[0.98]',
  };

  return (
    <button
      type={btnType}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{title}</span>
        </>
      )}
    </button>
  );
};

export default CustomButton;
