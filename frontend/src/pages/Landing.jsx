import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight, 
  Brain, 
  Shield, 
  Layers, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Bot, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  Activity 
} from 'lucide-react';
import { CONTRACT_ADDRESS } from '../contractConfig';

// Reusable 3D Perspective Tilt Card with theme-aware liquid specular lighting & elevation
function TiltCard({ children, className = '', maxTilt = 12, isDarkMode = false, ...props }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    
    setIsHovered(true);
    setTilt({
      x: -((y - cy) / cy) * maxTilt,
      y: ((x - cx) / cx) * maxTilt
    });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.22
    });
  };

  const handleLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const translateY = isHovered ? -4 : 0;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transform: `perspective(1000px) translateY(${translateY}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.18s cubic-bezier(0.2, 0, 0.2, 1)'
      }}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 rounded-[inherit]"
        style={{
          opacity: glare.opacity,
          background: isDarkMode
            ? `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 204, 0, 0.25) 0%, rgba(0, 230, 161, 0.12) 35%, transparent 70%)`
            : `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.65) 0%, rgba(14, 165, 233, 0.15) 35%, transparent 70%)`
        }}
      />
      {children}
    </div>
  );
}

const CAMPAIGN_PREVIEWS = {
  '1': {
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    label: 'IoT Hardware Module',
    categoryBadge: 'Hardware / IoT',
    badgeTheme: 'azure',
    desc: 'IoT sensing node & frosted hardware module'
  },
  '2': {
    imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
    label: 'Clean Energy Telemetry',
    categoryBadge: 'Cleantech',
    badgeTheme: 'emerald',
    desc: 'Clean energy / modular biogas digester telemetry'
  },
  '3': {
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    label: 'ZK Lattice Mesh',
    categoryBadge: 'Open Source / Web3',
    badgeTheme: 'azure',
    desc: 'Cryptographic lattice / zero-knowledge proof mesh'
  }
};

export default function Landing({ isDarkMode = false }) {
  const { setCurrentView, campaigns = [], setActiveCampaignId, user } = useApp();

  // 3D Diamond Mouse Tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  // Background Particles Canvas with In-Flight Color Morphing
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const isDarkRef = useRef(isDarkMode);

  useEffect(() => {
    isDarkRef.current = isDarkMode;
  }, [isDarkMode]);

  // Initialize particles once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    if (particlesRef.current.length === 0) {
      const darkActive = isDarkRef.current;
      particlesRef.current = Array.from({ length: 65 }, () => {
        const isPrimary = Math.random() > 0.4;
        const initialR = darkActive ? (isPrimary ? 255 : 0) : (isPrimary ? 14 : 16);
        const initialG = darkActive ? (isPrimary ? 204 : 230) : (isPrimary ? 165 : 185);
        const initialB = darkActive ? (isPrimary ? 0 : 161) : (isPrimary ? 233 : 129);

        return {
          x: Math.random() * (canvas.width || 1200),
          y: Math.random() * (canvas.height || 800),
          radius: Math.random() * 1.6 + 0.4,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          alpha: Math.random() * 0.5 + 0.15,
          isPrimary,
          currentR: initialR,
          currentG: initialG,
          currentB: initialB,
          targetR: initialR,
          targetG: initialG,
          targetB: initialB
        };
      });
    }

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Smooth in-flight color morphing
        p.currentR += (p.targetR - p.currentR) * 0.08;
        p.currentG += (p.targetG - p.currentG) * 0.08;
        p.currentB += (p.targetB - p.currentB) * 0.08;

        const colorStr = `rgba(${Math.round(p.currentR)}, ${Math.round(p.currentG)}, ${Math.round(p.currentB)}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = colorStr;
        ctx.shadowBlur = 8;
        ctx.shadowColor = colorStr;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Smoothly update target particle colors on theme toggle
  useEffect(() => {
    particlesRef.current.forEach((p) => {
      if (isDarkMode) {
        p.targetR = p.isPrimary ? 255 : 0;
        p.targetG = p.isPrimary ? 204 : 230;
        p.targetB = p.isPrimary ? 0 : 161;
      } else {
        p.targetR = p.isPrimary ? 14 : 16;
        p.targetG = p.isPrimary ? 165 : 185;
        p.targetB = p.isPrimary ? 233 : 129;
      }
    });
  }, [isDarkMode]);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePos({ x, y });
    setTilt({
      x: -(y / (rect.height / 2)) * 18,
      y: (x / (rect.width / 2)) * 22
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const activeCampaigns = campaigns.length > 0 ? campaigns.slice(0, 3) : [];

  return (
    <div className={`relative min-h-screen text-[#0F172A] dark:text-slate-100 font-sans selection:bg-sky-500/20 selection:text-sky-600 dark:selection:bg-[#FFCC00]/30 dark:selection:text-[#FFCC00] overflow-x-hidden p-3 sm:p-6 lg:p-8 ${!isDarkMode ? 'light-mode-canvas' : ''}`}>
      {/* 1. SEAMLESS DUAL-LAYER BACKGROUND GRADIENTS (CROSS-FADE) */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] light-mode-canvas z-0 ${isDarkMode ? 'opacity-0' : 'opacity-100'}`} />
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-gradient-to-b from-[#141619] via-[#0E1013] to-[#0C0D0F] z-0 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`} />

      {/* Atmospheric Caustic & Ambient Orbs */}
      <div className={`fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none z-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDarkMode ? 'bg-[#FFCC00]/5' : 'bg-sky-400/12'}`} />
      <div className={`fixed bottom-10 right-1/4 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none z-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDarkMode ? 'bg-[#00E6A1]/5' : 'bg-emerald-400/10'}`} />

      {/* 2. ATMOSPHERIC CAUSTIC CANVAS PARTICLES */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-75"
      />

      {/* 3. MASSIVE-RADIUS (40px+) "APP WITHIN AN APP" LIQUID PRISMATIC GLASS CONTAINER */}
      <div className="relative z-10 max-w-[1360px] mx-auto rounded-[40px] sm:rounded-[48px] bg-white/70 dark:bg-[#141619]/85 backdrop-blur-2xl border border-white/90 dark:border-[#FFCC00]/40 shadow-[0_20px_50px_-10px_rgba(14,165,233,0.12),inset_0_1.5px_2px_rgba(255,255,255,1)] dark:shadow-[0_0_80px_rgba(255,204,0,0.15),0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Crisp edge highlight / chromatic caustic accent line */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/60 dark:via-[#FFCC00] to-transparent opacity-90" />

        {/* ------------------------------------------------------------------- */}
        {/* HERO SECTION WITH CLEAN SINGLE-TIER LAYOUT */}
        {/* ------------------------------------------------------------------- */}
        <section
          ref={heroRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative px-6 sm:px-12 pt-12 sm:pt-16 pb-16 lg:pt-16 lg:pb-24 flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          {/* Left Pitch Column */}
          <div className="flex-1 space-y-6 text-left max-w-2xl">
            {/* Pill Header */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50/90 border border-sky-200/80 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#0284C7] shadow-xs dark:bg-[#262111]/80 dark:border-[#FFCC00]/30 dark:text-[#FFCC00]">
              <Zap className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#FFCC00]" />
              <span>Next Gen Decentralized Escrow Protocol</span>
            </div>

            {/* Main Headline (Scaled up single-tier layout) */}
            <h1 className="text-4xl sm:text-6xl lg:text-[62px] font-black tracking-tight leading-[1.05] text-[#0F172A] dark:text-white">
              Transparent <br />
              Crowdfunding <br />
              <span className="bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#2563EB] bg-clip-text text-transparent drop-shadow-[0_4px_25px_rgba(14,165,233,0.35)] dark:from-[#FFCC00] dark:to-[#E6B800] dark:text-[#FFCC00] dark:drop-shadow-[0_0_40px_rgba(255,204,0,0.4)]">
                Backed by AI Auditing &amp; <br className="hidden sm:inline" />
                Programmable Escrow
              </span>
            </h1>

            {/* Sub-Headline (Verbatim requirement) */}
            <p className="text-sm sm:text-base lg:text-lg text-[#334155] dark:text-slate-300/85 leading-relaxed font-normal max-w-xl">
              A sophisticated, multi-layer verification protocol designed to ensure project accountability and secure disbursements
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                onClick={() => setCurrentView(user ? 'Explore' : 'Auth')}
                className="px-8 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-[0_10px_25px_-5px_rgba(2,132,199,0.38)] dark:from-[#FFCC00] dark:to-[#E6B800] dark:text-slate-950 dark:shadow-[0_0_30px_rgba(255,204,0,0.45)] transition-all transform active:scale-95 flex items-center gap-2.5 cursor-pointer"
              >
                <span>Explore Live Escrow Vaults</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentView(user ? 'Create' : 'Auth')}
                className="px-7 py-3.5 rounded-full font-semibold text-sm bg-white/70 hover:bg-white text-[#0F172A] border border-slate-900/10 shadow-sm dark:bg-[#16181D]/90 dark:hover:bg-[#20242B] dark:text-slate-200 dark:border-white/15 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
              >
                <span>Create a Campaign</span>
                <ChevronRight className="w-4 h-4 text-[#0284C7] dark:text-[#FFCC00]" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-mono text-[#64748B] dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0D9488] dark:text-[#00E6A1]" />
                <span>100% Non-Custodial</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0284C7] dark:text-[#FFCC00]" />
                <span>20 ETH Hard Cap</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0D9488] dark:text-[#00E6A1]" />
                <span>Nemotron Verified</span>
              </div>
            </div>
          </div>


          {/* ----------------------------------------------------------------- */}
          {/* 2. 3D INTERACTIVE PRISMATIC CRYSTAL WITH SAPPHIRE-AZURE HARMONY   */}
          {/* ----------------------------------------------------------------- */}
          <div className="w-full lg:w-[480px] h-[360px] sm:h-[440px] flex items-center justify-center relative perspective-[1200px]">
            {/* Ambient Caustic Backing Glow */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-sky-400/30 via-teal-400/20 to-amber-300/15 dark:from-[#FFCC00]/25 dark:to-[#00E6A1]/15 blur-[80px] pointer-events-none" />

            {/* 3D Gyroscopic Caustic Orbital Ring X */}
            <div 
              className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-sky-400/35 dark:border-[#FFCC00]/40 pointer-events-none"
              style={{
                animation: 'gyroRotateX 14s linear infinite',
                transformStyle: 'preserve-3d',
                boxShadow: '0 0 25px rgba(14, 165, 233, 0.25)'
              }}
            />

            {/* 3D Gyroscopic Caustic Orbital Ring Y */}
            <div 
              className="absolute w-80 h-80 sm:w-[410px] sm:h-[410px] rounded-full border border-teal-400/30 dark:border-[#00E6A1]/30 pointer-events-none"
              style={{
                animation: 'gyroRotateY 18s linear infinite',
                transformStyle: 'preserve-3d',
                boxShadow: '0 0 20px rgba(13, 148, 136, 0.2)'
              }}
            />

            {/* Faint Floating Orbital Ring with Cyan/Mint Ambient Glow */}
            <div 
              className="absolute w-80 h-80 sm:w-[440px] sm:h-[440px] rounded-full border border-cyan-400/35 dark:border-[#00E6A1]/35 pointer-events-none"
              style={{
                animation: 'gyroRotateZ 22s linear infinite',
                transformStyle: 'preserve-3d',
                boxShadow: '0 0 30px rgba(14, 165, 233, 0.2), inset 0 0 20px rgba(16, 185, 129, 0.15)'
              }}
            />

            {/* 3D Floating Chip 1 (Top Right) */}
            <div
              className="absolute -top-3 -right-2 sm:right-2 z-20 px-3.5 py-1.5 rounded-2xl bg-white/90 border border-emerald-300/80 text-[#059669] backdrop-blur-xl shadow-[0_10px_25px_rgba(16,185,129,0.18)] dark:bg-[#141619]/90 dark:border-[#00E6A1]/50 dark:text-[#00E6A1] flex items-center gap-2 pointer-events-none text-xs font-mono font-bold"
              style={{
                animation: 'float3DLayer1 6s ease-in-out infinite',
                transform: `translate3d(${tilt.y * 0.7}px, ${-tilt.x * 0.7}px, 45px)`
              }}
            >
              <Cpu className="w-4 h-4 text-[#059669] dark:text-[#00E6A1]" />
              <span>AI ML Audit • 94% Verified</span>
            </div>

            {/* 3D Floating Chip 2 (Bottom Left) */}
            <div
              className="absolute -bottom-3 -left-2 sm:left-2 z-20 px-3.5 py-1.5 rounded-2xl bg-white/90 border border-sky-300/80 text-[#0284C7] backdrop-blur-xl shadow-[0_10px_25px_rgba(14,165,233,0.18)] dark:bg-[#141619]/90 dark:border-[#FFCC00]/50 dark:text-[#FFCC00] flex items-center gap-2 pointer-events-none text-xs font-mono font-bold"
              style={{
                animation: 'float3DLayer2 7s ease-in-out infinite',
                transform: `translate3d(${-tilt.y * 0.7}px, ${tilt.x * 0.7}px, 55px)`
              }}
            >
              <Shield className="w-4 h-4 text-[#0284C7] dark:text-[#FFCC00]" />
              <span>Sepolia Vault • 20 ETH Cap</span>
            </div>

            {/* Dynamic Interactive Diamond */}
            <div
              className="relative w-72 h-72 sm:w-88 sm:h-88 transition-transform duration-150 ease-out"
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.05)`,
                transformStyle: 'preserve-3d'
              }}
            >
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full drop-shadow-[0_20px_40px_rgba(14,165,233,0.18)] dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] filter"
              >
                <defs>
                  {/* Harmonized Sapphire-Azure Crystal Facet Gradients */}
                  <linearGradient id="sapphireAzureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.9" />
                    <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="#0284C7" stopOpacity="0.88" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.95" />
                  </linearGradient>

                  <linearGradient id="sapphireAzureFacet2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.95" />
                    <stop offset="45%" stopColor="#0284C7" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.92" />
                  </linearGradient>

                  {/* Warm Amber Internal Refractions (Prismatic Core Harmonized within Sapphire Azure) */}
                  <linearGradient id="warmAmberRefractionLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.92" />
                    <stop offset="30%" stopColor="#F59E0B" stopOpacity="0.75" />
                    <stop offset="65%" stopColor="#0284C7" stopOpacity="0.82" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.9" />
                  </linearGradient>

                  <linearGradient id="warmAmberRefractionRight" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.92" />
                    <stop offset="35%" stopColor="#FBBF24" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#0284C7" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.92" />
                  </linearGradient>

                  {/* Table Top Glass Facet */}
                  <linearGradient id="tableGlassGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.85" />
                    <stop offset="45%" stopColor="#BAE6FD" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  </linearGradient>

                  {/* Lower Pavilion Sapphire Refractions */}
                  <linearGradient id="pavilionSapphireLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#0284C7" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.9" />
                  </linearGradient>

                  <linearGradient id="pavilionSapphireRight" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#2563EB" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.95" />
                  </linearGradient>

                  {/* Ground Caustics Radial Gradient */}
                  <radialGradient id="groundCaustics" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(14, 165, 233, 0.4)" />
                    <stop offset="35%" stopColor="rgba(16, 185, 129, 0.25)" />
                    <stop offset="70%" stopColor="rgba(37, 99, 235, 0.12)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>

                  {/* Specular White Glint Filter */}
                  <filter id="specularGlint" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Ground Caustic Blur */}
                  <filter id="causticBlur" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>

                  {/* Tech Circuit Pattern Overlay */}
                  <pattern id="circuitPat" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 0 10 L 10 10 L 10 0 M 10 20 L 10 10 L 20 10" fill="none" stroke="#0284C7" strokeWidth="0.75" strokeOpacity="0.35" />
                    <circle cx="10" cy="10" r="1.5" fill="#38BDF8" fillOpacity="0.6" />
                  </pattern>
                </defs>

                {/* Soft Ground Caustics below diamond */}
                <ellipse cx="200" cy="378" rx="120" ry="22" fill="url(#groundCaustics)" filter="url(#causticBlur)" />
                <ellipse cx="200" cy="378" rx="85" ry="14" fill="none" stroke="rgba(14, 165, 233, 0.35)" strokeWidth="1.2" strokeDasharray="6,6" opacity="0.7" />
                <ellipse cx="200" cy="378" rx="135" ry="22" fill="none" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="0.8" strokeDasharray="3,10" opacity="0.6" />

                {/* Crown Upper Facets (Sapphire-Azure Prism) */}
                <polygon points="90,120 200,30 50,150" fill="url(#sapphireAzureGrad)" stroke="#38BDF8" strokeWidth="1" />
                <polygon points="310,120 200,30 350,150" fill="url(#sapphireAzureFacet2)" stroke="#38BDF8" strokeWidth="1" />

                {/* Outer Glass Facets (Clear Azure-Prism Table Layers) */}
                <polygon points="200,30 310,120 200,160" fill="url(#tableGlassGrad)" stroke="#38BDF8" strokeWidth="1.2" />
                <polygon points="200,30 90,120 200,160" fill="url(#tableGlassGrad)" stroke="#38BDF8" strokeWidth="1.2" />

                {/* Circuit Board Inlay on Table */}
                <polygon points="200,30 310,120 200,160 90,120" fill="url(#circuitPat)" opacity="0.8" />

                {/* Central Prismatic Facets with Warm Amber Internal Refractions */}
                <polygon points="90,120 200,160 200,360 50,150" fill="url(#warmAmberRefractionLeft)" stroke="#0284C7" strokeWidth="1.2" />
                <polygon points="310,120 200,160 200,360 350,150" fill="url(#warmAmberRefractionRight)" stroke="#0284C7" strokeWidth="1.2" />

                {/* Lower Pavilion Facets (Sapphire Azure Refraction & Specular Transmission) */}
                <polygon points="200,160 200,360 140,240" fill="url(#pavilionSapphireLeft)" fillOpacity="0.75" stroke="#60A5FA" strokeWidth="1" />
                <polygon points="200,160 200,360 260,240" fill="url(#pavilionSapphireRight)" fillOpacity="0.75" stroke="#60A5FA" strokeWidth="1" />
                <polygon points="140,240 200,360 50,150" fill="url(#sapphireAzureGrad)" fillOpacity="0.6" stroke="#38BDF8" strokeWidth="0.8" />
                <polygon points="260,240 200,360 350,150" fill="url(#sapphireAzureFacet2)" fillOpacity="0.65" stroke="#38BDF8" strokeWidth="0.8" />

                {/* Specular White Edge Reflections on Facet Creases */}
                <line x1="200" y1="30" x2="200" y2="160" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.95" />
                <line x1="200" y1="160" x2="200" y2="360" stroke="#FFFFFF" strokeWidth="2.2" strokeOpacity="1" />
                <line x1="200" y1="30" x2="90" y2="120" stroke="#FFFFFF" strokeWidth="1.6" strokeOpacity="0.9" />
                <line x1="200" y1="30" x2="310" y2="120" stroke="#FFFFFF" strokeWidth="1.6" strokeOpacity="0.9" />
                <line x1="90" y1="120" x2="200" y2="160" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.88" />
                <line x1="310" y1="120" x2="200" y2="160" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.88" />
                <line x1="50" y1="150" x2="90" y2="120" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />
                <line x1="350" y1="150" x2="310" y2="120" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />
                <line x1="50" y1="150" x2="200" y2="160" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />
                <line x1="350" y1="150" x2="200" y2="160" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />
                <line x1="140" y1="240" x2="200" y2="160" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.85" />
                <line x1="260" y1="240" x2="200" y2="160" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.85" />
                <line x1="140" y1="240" x2="200" y2="360" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.92" />
                <line x1="260" y1="240" x2="200" y2="360" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.92" />

                {/* Specular White Vertex Glints */}
                <circle cx="200" cy="160" r="3.5" fill="#FFFFFF" opacity="0.95" filter="url(#specularGlint)" />
                <circle cx="200" cy="30" r="2.5" fill="#FFFFFF" opacity="0.9" filter="url(#specularGlint)" />
                <circle cx="200" cy="360" r="2.5" fill="#FFFFFF" opacity="0.95" filter="url(#specularGlint)" />
                <circle cx="90" cy="120" r="2" fill="#FFFFFF" opacity="0.85" />
                <circle cx="310" cy="120" r="2" fill="#FFFFFF" opacity="0.85" />

                {/* Caustic Halo Rings */}
                <circle cx="200" cy="200" r="160" fill="none" stroke="#0284C7" strokeWidth="1" strokeDasharray="6,8" opacity="0.5" />
                <circle cx="200" cy="200" r="185" fill="none" stroke="#0D9488" strokeWidth="0.8" strokeDasharray="3,12" opacity="0.45" />

                {/* Blockchain Caustic Nodes */}
                <circle cx="360" cy="200" r="5" fill="#0EA5E9" />
                <circle cx="40" cy="200" r="5" fill="#0D9488" />
                <circle cx="200" cy="385" r="4" fill="#F59E0B" />
                <circle cx="200" cy="15" r="4" fill="#0284C7" />
              </svg>

              {/* Prismatic Refraction Light Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{
                  background: `radial-gradient(circle at ${mousePos.x + 150}px ${mousePos.y + 150}px, rgba(14, 165, 233, 0.22) 0%, rgba(245, 158, 11, 0.12) 40%, transparent 70%)`
                }}
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* 4.C BOLD DATA-FOCUSED PROOF STRIP                                   */}
        {/* ------------------------------------------------------------------- */}
        <section className="px-6 sm:px-10 py-6 border-y border-slate-200/80 dark:border-white/10 bg-slate-100/60 dark:bg-[#0F1115]/80 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center text-center">
            {/* Metric 1 */}
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-mono font-black text-[#059669] dark:text-[#00E6A1] tabular-nums tracking-tight">
                142+
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-slate-300">
                Campaigns Audited (AI)
              </div>
              <p className="text-[11px] font-mono text-[#475569] dark:text-slate-400">Zero-leakage launch telemetry</p>
            </div>

            {/* Metric 2 */}
            <div className="space-y-1 border-t md:border-t-0 md:border-x border-slate-200/80 dark:border-white/10 pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-mono font-black text-[#0284C7] dark:text-[#FFCC00] tabular-nums tracking-tight">
                $4.82M
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-slate-300">
                TVL Secured
              </div>
              <p className="text-[11px] font-mono text-[#475569] dark:text-slate-400">Locked in Sepolia smart contracts</p>
            </div>

            {/* Metric 3 */}
            <div className="space-y-1 border-t md:border-t-0 pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-mono font-black text-[#059669] dark:text-[#00E6A1] tabular-nums tracking-tight">
                380
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-slate-300">
                Escrow Tranches Released
              </div>
              <p className="text-[11px] font-mono text-[#475569] dark:text-slate-400">100% verifier consensus backed</p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* 4.B THE "CORE LOOP" PROCESS (FOUR DISTINCT STEPS)                    */}
        {/* ------------------------------------------------------------------- */}
        <section className="px-6 sm:px-12 py-16 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#0284C7] dark:text-[#FFCC00] uppercase">
              <span className="w-8 h-px bg-[#0284C7]/40 dark:bg-[#FFCC00]/40" />
              <span>Decentralized Governance</span>
              <span className="w-8 h-px bg-[#0284C7]/40 dark:bg-[#FFCC00]/40" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#0F172A] dark:text-white">
              The Core Loop: How TrustBridge Guarantees Accountability
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-400">
              From launch-time anomaly detection to proof-gated multi-tranche escrow release.
            </p>
          </div>

          {/* 4 Cards with Liquid Glass Refraction */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Pre-Launch ML Audit',
                desc: 'Binary classification and Isolation Forest models score pitch realism and flag launch-time budget anomalies.',
                icon: Brain,
                tag: 'Scikit-Learn + AI',
                tagType: 'azure'
              },
              {
                step: '02',
                title: 'Smart Escrow Deposit',
                desc: 'Backers fund in ETH. The contract strictly caps campaigns at 20 ETH and refunds excess in-block in the same transaction.',
                icon: Shield,
                tag: '20 ETH Hard Cap',
                tagType: 'emerald'
              },
              {
                step: '03',
                title: 'Milestone Proofs',
                desc: 'Creators submit cryptographic IPFS evidence, bench tests, and commit hashes for sequential roadmap verification.',
                icon: Layers,
                tag: 'IPFS / Commits',
                tagType: 'azure'
              },
              {
                step: '04',
                title: 'Verifier Disbursement',
                desc: 'Human consensus signers review AI validation checklists to release tranches or trigger instant pro-rata backer refunds.',
                icon: CheckCircle2,
                tag: 'Pull-Payments',
                tagType: 'emerald'
              },
            ].map((card) => (
              <TiltCard
                key={card.step}
                maxTilt={14}
                isDarkMode={isDarkMode}
                className="group glass-panel-light p-6 flex flex-col justify-between space-y-6"
              >
                <div className="flex items-center justify-between" style={{ transform: 'translateZ(20px)' }}>
                  <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                    card.tagType === 'emerald'
                      ? 'bg-emerald-50 text-[#059669] border border-emerald-200/80 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-[#00E6A1]'
                      : 'bg-sky-50 text-[#0284C7] border border-sky-200/80 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-300'
                  }`}>
                    {card.step}
                  </span>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    card.tagType === 'emerald'
                      ? 'bg-emerald-50 text-[#059669] dark:bg-white/5 dark:text-[#00E6A1]'
                      : 'bg-sky-50 text-[#0284C7] dark:bg-white/5 dark:text-sky-300'
                  }`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2" style={{ transform: 'translateZ(25px)' }}>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-white tracking-tight group-hover:text-[#0284C7] dark:group-hover:text-[#00E6A1] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed font-normal">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-[#475569] dark:text-slate-400" style={{ transform: 'translateZ(15px)' }}>
                  <span>Standard</span>
                  <span className={`${
                    card.tagType === 'emerald'
                      ? 'text-[#059669] dark:text-[#00E6A1]'
                      : 'text-[#0284C7] dark:text-sky-400'
                  } font-bold tracking-tight`}>
                    {card.tag}
                  </span>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* 4.C ACTIVE ESCROW CAMPAIGNS GRID                                    */}
        {/* ------------------------------------------------------------------- */}
        <section className="px-6 sm:px-12 py-16 border-t border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#0E1013]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669] dark:bg-[#00E6A1]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#059669] dark:text-[#00E6A1] font-bold">
                  Verified On-Chain Vaults
                </span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-[#0F172A] dark:text-white">
                Active Escrow Campaigns
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                Real-time Sepolia smart contract instances with automated 4-tranche payout schedules
              </p>
            </div>

            <button
              onClick={() => setCurrentView(user ? 'Explore' : 'Auth')}
              className="self-start sm:self-auto px-5 py-2.5 rounded-full border border-sky-300/80 bg-sky-50 hover:bg-sky-100 text-[#0284C7] dark:border-[#FFCC00]/40 dark:bg-[#FFCC00]/10 dark:hover:bg-[#FFCC00]/20 dark:text-[#FFCC00] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>View All Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards Grid with Liquid Glass Elevation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeCampaigns.map((c, idx) => {
              const goal = typeof c.goal === 'number' ? c.goal : 10.0;
              const hardCap = typeof c.hardCap === 'number' ? c.hardCap : 20.0;
              const raised = typeof c.totalRaised === 'number' ? c.totalRaised : 14.5;
              const progressPct = Math.min(100, Math.round((raised / hardCap) * 100));
              const preview = CAMPAIGN_PREVIEWS[c.id] || (
                c.title?.toLowerCase().includes('auramesh') ? CAMPAIGN_PREVIEWS['1'] :
                c.title?.toLowerCase().includes('ecopulse') ? CAMPAIGN_PREVIEWS['2'] :
                c.title?.toLowerCase().includes('verichain') ? CAMPAIGN_PREVIEWS['3'] :
                CAMPAIGN_PREVIEWS[String((idx % 3) + 1)]
              );

              return (
                <TiltCard
                  key={c.id}
                  maxTilt={10}
                  isDarkMode={isDarkMode}
                  onClick={() => {
                    setActiveCampaignId(c.id);
                    setCurrentView(user ? 'Campaign' : 'Auth');
                  }}
                  className="group relative overflow-hidden glass-panel-light cursor-pointer flex flex-col justify-between"
                >
                  {/* High-Resolution 16:9 Thumbnail Banner with Distinct Campaign Visuals */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                    <img
                      src={c.image_url || preview.imageUrl}
                      alt={c.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        if (e.target.dataset.fallbackApplied) return;
                        e.target.dataset.fallbackApplied = 'true';
                        e.target.src = preview.imageUrl;
                      }}
                    />
                    {/* Verified - AI + DAO Audit Tag in Emerald #059669 vs In Review */}
                    {c.verified ? (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono font-bold text-[#059669] dark:text-[#00E6A1] flex items-center gap-1.5 shadow-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#059669] dark:text-[#00E6A1]" />
                        <span>Verified • AI + DAO Audit</span>
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 shadow-md">
                        <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Audit In Review</span>
                      </div>
                    )}

                    {/* Category Tag in Azure #0284C7 or Emerald #059669 */}
                    <div className={`absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-semibold shadow-xs ${
                      (preview.badgeTheme === 'emerald' || c.category === 'Cleantech')
                        ? 'text-[#059669] dark:text-[#00E6A1] border border-emerald-500/30'
                        : 'text-[#0284C7] dark:text-sky-300 border border-sky-400/30'
                    }`}>
                      {preview.categoryBadge || c.category || 'Hardware / IoT'}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-[#0F172A] dark:text-white tracking-tight line-clamp-1 group-hover:text-[#0284C7] dark:group-hover:text-[#FFCC00] transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-xs text-[#475569] dark:text-slate-300 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                        {c.summary}
                      </p>
                    </div>

                    {/* Liquid Progress Track: Illuminated gradient track (from-emerald-400 to-sky-500) */}
                    <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-white/10">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="font-extrabold text-[#0F172A] dark:text-white tabular-nums tracking-tight text-sm">
                          {raised.toFixed(2)} ETH <span className="text-[11px] font-medium text-[#475569] dark:text-slate-400">raised</span>
                        </span>
                        <span className="text-[#0F172A] dark:text-slate-200 text-xs font-mono font-medium">
                          Cap: <strong className="text-[#0284C7] dark:text-sky-400 font-extrabold">{hardCap.toFixed(1)} ETH</strong>
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-200/90 dark:bg-slate-800/90 overflow-hidden relative p-[1px] shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.4)] transition-all duration-500 relative overflow-hidden"
                          style={{ width: `${progressPct}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[liquidTrackShimmer_2.5s_infinite]" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono text-[#475569] dark:text-slate-400 font-medium">
                        <span>Min Goal: <strong className="text-[#0F172A] dark:text-slate-200 font-bold">{goal.toFixed(1)} ETH</strong></span>
                        <span className="text-[#059669] dark:text-[#00E6A1] font-bold">{c.mlScore || 88}% Success Prob</span>
                      </div>
                    </div>

                    {/* Interactive Action Button: Frosted Glass Pill with Cyan Rim Glow & Arrow Shift */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCampaignId(c.id);
                        setCurrentView(user ? 'Campaign' : 'Auth');
                      }}
                      className="w-full py-2.5 px-4 rounded-full text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 bg-white/60 dark:bg-white/[0.04] text-[#0F172A] dark:text-slate-100 border border-white/90 dark:border-white/10 backdrop-blur-md shadow-xs group-hover:border-cyan-400/80 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.32),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:bg-white/85 dark:hover:bg-white/10 hover:border-cyan-400 hover:shadow-[0_0_22px_rgba(6,182,212,0.4),inset_0_1px_2px_rgba(255,255,255,0.95)] dark:group-hover:border-cyan-400/60 dark:group-hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                    >
                      <span>Inspect Escrow Tranches</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#0284C7] dark:text-cyan-400 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                    </button>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* FOOTER STRIP                                                        */}
        {/* ------------------------------------------------------------------- */}
        <footer className="px-6 sm:px-10 py-6 border-t border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-[#0A0C0E] text-xs font-mono text-[#64748B] dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0D9488] dark:bg-[#00E6A1]" />
            <span>Contract Deployed on Sepolia: {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-6)}</span>
          </div>
          <div className="text-center sm:text-right">
            <span>© 2026-27 TrustBridge Protocol • Multi-Agent Escrow</span>
          </div>
        </footer>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 5. FLOATING TRUSTBRIDGE AI CHATBOT TRIGGER                            */}
      {/* --------------------------------------------------------------------- */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            const chatEl = document.querySelector('aside[aria-label="AI Chat Assistant"] button');
            if (chatEl) chatEl.click();
          }}
          aria-label="Open TrustBridge AI Assistant"
          className="group relative flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-[#0284C7] to-[#0D9488] hover:from-[#0369A1] hover:to-[#0F766E] text-white font-bold text-xs shadow-[0_10px_25px_rgba(14,165,233,0.38)] dark:bg-[#FFCC00] dark:hover:bg-[#E6B800] dark:text-slate-950 dark:shadow-[0_0_35px_rgba(255,204,0,0.65)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/60 dark:border-white/40"
        >
          {/* Subtle pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-sky-400 dark:bg-[#FFCC00] opacity-35 animate-ping pointer-events-none" />
          <Bot className="w-4 h-4 text-white dark:text-slate-950 relative z-10" />
          <span className="relative z-10">TrustBridge AI</span>
        </button>
      </div>
    </div>
  );
}
