import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight, 
  PlusCircle, 
  Link as LinkIcon, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  Brain, 
  Shield, 
  Layers, 
  CheckCircle2,
  TrendingUp,
  Mouse
} from 'lucide-react';

export default function Landing({ isDarkMode = false }) {
  const { setCurrentView, campaigns, setActiveCampaignId } = useApp();

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-24 ${
      isDarkMode 
        ? 'bg-[#06080D] text-white' 
        : 'bg-[#FAF9F6] text-[#111827]'
    }`}>
      {/* Hero Section Container */}
      <div className={`relative overflow-hidden border-b ${
        isDarkMode 
          ? 'bg-radial-[at_75%_25%] from-[#1F1708] via-[#0B0D13] to-[#06080D] border-[#1C2538]' 
          : 'bg-[#FAF9F6] border-[#EAE6DF]'
      }`}>
        {/* Luminous orbital light rings for dark mode */}
        {isDarkMode && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full border border-[#EAB308]/15 blur-[1px] animate-pulse"></div>
            <div className="absolute top-1/3 right-1/3 w-[420px] h-[420px] rounded-full border border-[#EAB308]/20 -rotate-12"></div>
            <div className="absolute top-12 right-20 w-[680px] h-[680px] rounded-full bg-[#EAB308]/10 blur-3xl"></div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Pitch */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge Tag */}
              <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border ${
                isDarkMode 
                  ? 'bg-[#181A20] border-[#2B313A] text-[#F0B90B]' 
                  : 'bg-white border-emerald-200 text-[#00875A] shadow-2xs'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#F0B90B]' : 'bg-[#00D09C]'}`}></span>
                <span>AI-Assisted • Blockchain-Enforced • Milestone Crowdfunding</span>
              </div>

              {/* Headline in Big Bold Responsive Theme Color */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.12] text-[#111827] dark:text-[#EAECEF]">
                Transparent Crowdfunding Backed by{' '}
                <span className="text-[#00D09C] dark:text-[#F0B90B]">
                  AI Auditing &amp;
                </span>{' '}
                <span className="text-[#009379] dark:text-[#FCD535]">
                  Programmable Escrow
                </span>
              </h1>

              {/* Sub-paragraph */}
              <p className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                isDarkMode ? 'text-[#848E9C]' : 'text-[#475569]'
              }`}>
                TrustBridge replaces blind trust with launch-time machine learning predictions, agentic evidence review, and strict on-chain milestone disbursements on Ethereum Sepolia.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setCurrentView('Explore')}
                  className={`px-6 py-3.5 rounded-full font-bold text-sm transition-all flex items-center space-x-2 cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#F0B90B] hover:bg-[#FCD535] text-black shadow-[0_0_20px_rgba(240,185,11,0.35)]'
                      : 'bg-gradient-to-r from-[#00D09C] to-[#009379] hover:brightness-105 text-white shadow-[0_0_20px_rgba(0,208,156,0.35)]'
                  }`}
                >
                  <span>Explore Live Escrow Vaults</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentView('Create')}
                  className={`px-6 py-3.5 rounded-full font-semibold text-sm border transition-all flex items-center space-x-2 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-[#181A20] hover:bg-[#1E2329] border-[#2B313A] text-[#EAECEF]' 
                      : 'bg-white hover:bg-slate-50 border-[#E2E8F0] text-[#111827] shadow-2xs'
                  }`}
                >
                  <PlusCircle className={`w-4 h-4 ${isDarkMode ? 'text-[#F0B90B]' : 'text-[#00D09C]'}`} />
                  <span>Create a Campaign</span>
                </button>
              </div>

              {/* 4 Feature Chips */}
              <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 border-t text-xs font-medium ${
                isDarkMode ? 'border-[#2B313A] text-[#848E9C]' : 'border-[#E2E8F0] text-[#475569]'
              }`}>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#F0B90B]' : 'text-[#00D09C]'}`} />
                  <span>On-chain Transparency</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#F0B90B]' : 'text-[#00D09C]'}`} />
                  <span>AI Risk Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#F0B90B]' : 'text-[#00D09C]'}`} />
                  <span>Automatic Refunds</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#F0B90B]' : 'text-[#00D09C]'}`} />
                  <span>Built for Real Builders</span>
                </div>
              </div>

              {/* Secure Transparent Footnote */}
              {isDarkMode && (
                <div className="pt-2 text-[10px] font-mono tracking-widest text-[#848E9C] uppercase">
                  SECURE • TRANSPARENT • ACCOUNTABLE
                </div>
              )}
            </div>

            {/* Right Hero Visual: 3D Crystal & Floating Card */}
            <div className="lg:col-span-5 relative flex items-center justify-center perspective-[1000px]">
              {/* Central Glowing 3D Ethereum Prism */}
              <div className="relative w-full max-w-md aspect-square flex flex-col items-center justify-center animate-float3d">
                {/* 3D Gold Prism Facet */}
                <div className="w-56 h-64 relative flex items-center justify-center animate-glow3d transform hover:scale-105 transition-transform duration-500">
                  <svg viewBox="0 0 100 120" className="w-full h-full">
                    <polygon points="50,5 15,55 50,75 85,55" fill="url(#prismTop)" />
                    <polygon points="50,75 15,55 50,115" fill="url(#prismLeft)" />
                    <polygon points="50,75 85,55 50,115" fill="url(#prismRight)" />
                    
                    <defs>
                      <linearGradient id="prismTop" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF7D6" />
                        <stop offset="50%" stopColor="#EAB308" />
                        <stop offset="100%" stopColor="#CA8A04" />
                      </linearGradient>
                      <linearGradient id="prismLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A16207" />
                        <stop offset="100%" stopColor="#451A03" />
                      </linearGradient>
                      <linearGradient id="prismRight" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FDE047" />
                        <stop offset="100%" stopColor="#CA8A04" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Floating Glassmorphic Card (Ideas Verified On-chain) matching image */}
                <div className={`absolute top-2 right-2 backdrop-blur-xl border rounded-2xl p-5 shadow-2xl max-w-[210px] space-y-2 card-3d ${
                  isDarkMode 
                    ? 'bg-[#101622]/85 border-[#28354E] text-white' 
                    : 'bg-white/95 border-[#EAE3D6] text-black'
                }`}>
                  <div className="text-sm font-extrabold leading-snug text-black dark:text-white">
                    Ideas Verified On-chain
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Transparent Crowdfunding for a Trusted Tomorrow.
                  </p>
                  <div className="pt-2 flex justify-end">
                    <div className="w-7 h-7 rounded-full bg-[#182030] border border-[#2B3854] flex items-center justify-center text-white">
                      <ArrowRight className="w-3.5 h-3.5 -rotate-45 text-[#10B981]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="flex items-center justify-center space-x-2 py-4 text-[10px] font-mono tracking-widest uppercase text-slate-500">
        <Mouse className="w-3.5 h-3.5" />
        <span>SCROLL TO EXPLORE</span>
      </div>

      {/* The Core Loop Section */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className={`rounded-3xl p-8 sm:p-12 border shadow-xl space-y-10 ${
          isDarkMode 
            ? 'bg-[#181A20] text-[#EAECEF] border-[#2B313A]' 
            : 'bg-white text-[#111827] border-[#E2E8F0]'
        }`}>
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="flex items-center justify-center space-x-3 text-xs font-mono font-bold tracking-widest text-[#64748B] dark:text-[#848E9C] uppercase">
              <span className="w-8 h-px bg-slate-300 dark:bg-[#2B313A]"></span>
              <span>The Core Loop</span>
              <span className="w-8 h-px bg-slate-300 dark:bg-[#2B313A]"></span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-[#EAECEF]' : 'text-[#111827]'}`}>
              How TrustBridge Guarantees Accountability
            </h2>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-[#848E9C]' : 'text-[#64748B]'}`}>
              From idea to impact, every step is verified, transparent, and automated.
            </p>
          </div>

          {/* 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                badgeColor: isDarkMode ? 'bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/30' : 'bg-emerald-50 text-[#009379] border-emerald-200',
                title: 'Pre-Launch ML Audit',
                desc: 'Logistic Regression & Random Forest models score success probability and flag structural budget anomalies at launch time.',
                icon: Brain,
                iconColor: isDarkMode ? 'text-[#F0B90B]' : 'text-[#00D09C]'
              },
              {
                step: '02',
                badgeColor: isDarkMode ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-blue-50 text-[#3B82F6] border-blue-200',
                title: 'Smart Escrow Deposit',
                desc: 'Backers fund campaigns with ETH. Smart contract enforces a strict 20 ETH ceiling and automatically refunds excess in-block.',
                icon: Shield,
                iconColor: 'text-[#3B82F6]'
              },
              {
                step: '03',
                badgeColor: isDarkMode ? 'bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/30' : 'bg-amber-50 text-[#D97706] border-amber-200',
                title: 'Milestone Proofs',
                desc: 'Creators execute roadmap tranches and upload cryptographic proof, GitHub commits, or bench test telemetry.',
                icon: Layers,
                iconColor: isDarkMode ? 'text-[#F0B90B]' : 'text-[#111827]'
              },
              {
                step: '04',
                badgeColor: isDarkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-[#8B5CF6] border-purple-200',
                title: 'Verifier Disbursement',
                desc: 'Authorized signers inspect AI evidence extraction to trigger tranche releases. Unreached goals allow instant backer refunds.',
                icon: CheckCircle2,
                iconColor: 'text-[#8B5CF6]'
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`border rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm card-3d ${
                  isDarkMode 
                    ? 'bg-[#1E2329] border-[#2B313A] text-[#EAECEF]' 
                    : 'bg-white border-[#E2E8F0] text-[#111827]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${item.badgeColor}`}>
                    {item.step}
                  </span>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>

                <div className="space-y-2">
                  <h3 className={`text-base font-bold tracking-tight ${isDarkMode ? 'text-[#EAECEF]' : 'text-[#111827]'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#848E9C]' : 'text-[#64748B]'}`}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Active Escrow Campaigns section inside/under loop container */}
          <div className="pt-6 space-y-6">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 ${
              isDarkMode ? 'border-[#2B313A]' : 'border-slate-200'
            }`}>
              <div>
                <h3 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
                  isDarkMode ? 'text-[#EAECEF]' : 'text-[#111827]'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-[#F0B90B]' : 'bg-[#00D09C]'}`}></span>
                  <span>Active Escrow Campaigns</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#848E9C]' : 'text-[#64748B]'}`}>
                  Live testnet instances with automated hard-cap bounds
                </p>
              </div>

              <button
                onClick={() => setCurrentView('Explore')}
                className={`text-xs font-bold flex items-center space-x-1.5 py-2 px-4 rounded-full border transition-colors shadow-2xs self-start sm:self-auto cursor-pointer ${
                  isDarkMode
                    ? 'border-[#2B313A] bg-[#1E2329] text-[#EAECEF] hover:text-[#F0B90B] hover:bg-[#262D36]'
                    : 'border-slate-300 bg-white text-[#111827] hover:text-[#009379] hover:bg-slate-50'
                }`}
              >
                <span>View All Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Featured Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campaigns.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs transition-all card-3d ${
                    isDarkMode 
                      ? 'bg-[#1E2329] border-[#2B313A] text-[#EAECEF] hover:border-[#F0B90B]/50' 
                      : 'bg-white border-[#E2E8F0] text-[#111827] hover:border-[#00D09C]/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={`px-2.5 py-0.5 rounded-full border ${
                        isDarkMode
                          ? 'bg-[#181A20] text-[#B7BDC6] border-[#2B313A]'
                          : 'bg-[#F0FDF4] text-[#009379] border-emerald-200'
                      }`}>
                        {c.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center space-x-1 ${
                        isDarkMode
                          ? 'bg-[#0ECB81]/10 text-[#0ECB81]'
                          : 'bg-emerald-50 text-[#009379]'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-[#0ECB81]' : 'bg-[#009379]'}`}></span>
                        <span>Active</span>
                      </span>
                    </div>

                    <h4 className={`font-bold text-base tracking-tight line-clamp-1 ${isDarkMode ? 'text-[#EAECEF]' : 'text-black'}`}>
                      {c.title}
                    </h4>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${isDarkMode ? 'text-[#848E9C]' : 'text-[#64748B]'}`}>
                      {c.summary}
                    </p>
                  </div>

                  {/* Progress Bar & Stats */}
                  <div className={`space-y-2 pt-2 border-t ${isDarkMode ? 'border-[#2B313A]' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className={`font-bold ${isDarkMode ? 'text-[#EAECEF]' : 'text-[#111827]'}`}>{c.totalRaised.toFixed(2)} ETH</span>
                      <span className={isDarkMode ? 'text-[#848E9C]' : 'text-[#64748B]'}>Cap: {c.hardCap.toFixed(2)} ETH</span>
                    </div>

                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#2B313A]' : 'bg-[#F2EFE9]'}`}>
                      <div
                        className={`h-full rounded-full ${isDarkMode ? 'bg-[#F0B90B]' : 'bg-[#00D09C]'}`}
                        style={{ width: `${(c.totalRaised / c.hardCap) * 100}%` }}
                      ></div>
                    </div>

                    <div className={`flex justify-between text-[11px] font-mono pt-1 ${isDarkMode ? 'text-[#848E9C]' : 'text-[#64748B]'}`}>
                      <span className={isDarkMode ? 'text-[#F0B90B] font-bold' : 'text-[#009379] font-bold'}>{c.mlScore}% Success Prob</span>
                      <span>{(c.hardCap - c.totalRaised).toFixed(2)} ETH Rem</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveCampaignId(c.id);
                      setCurrentView('Campaign');
                    }}
                    className="w-full text-center py-2.5 rounded-full btn-fintech-primary text-xs font-bold transition-colors cursor-pointer"
                  >
                    Inspect &amp; Contribute →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
