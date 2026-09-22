import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ isDarkMode, onToggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`group relative inline-flex items-center justify-between w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] select-none border focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        isDarkMode
          ? 'bg-[#181A20] border-[#3D4552] shadow-[0_0_15px_rgba(240,185,11,0.25),inset_0_1px_2px_rgba(0,0,0,0.6)]'
          : 'bg-white/80 border-slate-200/90 shadow-[0_4px_16px_rgba(14,165,233,0.15),inset_0_1px_2px_rgba(255,255,255,0.95)] backdrop-blur-md'
      } ${className}`}
    >
      {/* Sun Icon (Light indicator) */}
      <span className="flex items-center justify-center w-6 h-6 text-amber-500 z-10 transition-transform duration-300 group-hover:rotate-45">
        <Sun className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDarkMode ? 'opacity-30' : 'opacity-100'}`} />
      </span>

      {/* Moon Icon (Dark indicator) */}
      <span className="flex items-center justify-center w-6 h-6 text-[#F0B90B] z-10 transition-transform duration-300 group-hover:-rotate-12">
        <Moon className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDarkMode ? 'opacity-100' : 'opacity-30'}`} />
      </span>

      {/* Sliding Pill Thumb */}
      <span
        className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${
          isDarkMode
            ? 'translate-x-8 bg-gradient-to-tr from-[#F0B90B] to-[#FCD535] text-slate-950 shadow-[0_2px_8px_rgba(240,185,11,0.5)]'
            : 'translate-x-0 bg-gradient-to-tr from-[#0284C7] to-[#0EA5E9] text-white shadow-[0_2px_10px_rgba(2,132,199,0.35)]'
        }`}
      >
        {isDarkMode ? (
          <Moon className="w-3 h-3 fill-slate-950 text-slate-950 animate-pulse" />
        ) : (
          <Sun className="w-3 h-3 fill-white text-white animate-pulse" />
        )}
      </span>
    </button>
  );
}
