import React, { useState, useRef } from 'react';
import { Shield, Clock, Users, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';

const CATEGORY_IMAGES = {
  'Hardware / IoT': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'Hardware': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'Cleantech': 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
  'Open Source': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  'AI / ML': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
  'Web3 Protocol': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
};

/**
 * FundCard Component
 * High-density campaign card with 3D perspective mouse tilt and Obsidian liquid glass styling.
 */
const FundCard = ({ campaign, handleClick }) => {
  const {
    id,
    title,
    description,
    category,
    image_url,
    target_eth,
    goal_eth,
    total_raised_eth,
    totalRaised,
    days_left,
    deadline_days,
    creator_address,
    creator_name,
    creator_verified,
    ml_score,
    mlScore,
    risk_level,
    riskLevel,
    backers_count,
  } = campaign;

  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const goal = Number(target_eth || goal_eth || 10);
  const raised = Number(total_raised_eth !== undefined ? total_raised_eth : (totalRaised || 0));
  const hardCap = 20.0;
  const progressPercent = Math.min(100, Math.round((raised / goal) * 100));
  const daysRemaining = days_left !== undefined ? days_left : (deadline_days || 14);
  const score = ml_score || mlScore || 85;
  const risk = risk_level || riskLevel || 'LOW';

  const truncatedAddress = creator_address
    ? `${creator_address.slice(0, 6)}...${creator_address.slice(-4)}`
    : '0x7c49...58d2';

  const defaultImage = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Web3 Protocol'];

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="group flex flex-col rounded-2xl overflow-hidden border border-slate-200/90 dark:border-[var(--border-subtle)] bg-white/90 dark:bg-[var(--bg-surface)] backdrop-blur-xl shadow-sm hover:shadow-2xl dark:hover:border-emerald-400/40 dark:hover:shadow-[0_20px_45px_-12px_rgba(0,245,160,0.22)] cursor-pointer select-none"
    >
      {/* 16:9 Image Banner */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-950/40">
        <img
          src={image_url || defaultImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        {/* Prismatic Overlay Sheen */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090E]/90 via-transparent to-transparent opacity-80" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-mono font-bold tracking-wider uppercase text-emerald-400 shadow-md">
          {category || 'Web3 Protocol'}
        </div>

        {/* Days Left Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-mono font-medium text-slate-200 shadow-md">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{daysRemaining}d left</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Creator & KYC Status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-xs">
              {(creator_name || 'T')[0].toUpperCase()}
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-[var(--text-secondary)] truncate">
              {creator_name || truncatedAddress}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {creator_verified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                KYC
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-500/10">
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-900 dark:text-[var(--text-primary)] line-clamp-1 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)] line-clamp-2 mt-1.5 leading-relaxed flex-1">
          {description}
        </p>

        {/* Dual Progress Meter */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-mono font-bold text-slate-900 dark:text-[var(--text-primary)] tabular-nums">
              {raised.toFixed(2)} ETH
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-[var(--text-muted)]">
              {progressPercent}% of {goal.toFixed(1)} ETH Goal
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-black/50 border border-transparent dark:border-white/5 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 liquid-progress-shimmer ${
                raised >= goal
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(0,245,160,0.5)]'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (raised / hardCap) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-[var(--text-muted)] mt-1.5">
            <span>Min: {goal} ETH</span>
            <span className="text-amber-500 dark:text-[#FBBF24] font-semibold">Cap: 20 ETH</span>
          </div>
        </div>

        {/* Footer: AI Risk Score & Backers */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-[var(--border-subtle)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {score}% Score
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-black/40 border border-transparent dark:border-white/10 font-mono text-slate-500 dark:text-[var(--text-secondary)]">
              {risk}
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-[var(--text-muted)]">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>{backers_count || 12}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundCard;
