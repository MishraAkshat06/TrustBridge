import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  HeartHandshake, 
  ShieldCheck, 
  FileText, 
  Sun, 
  Moon, 
  Info, 
  Zap, 
  ShieldAlert, 
  Radio, 
  MapPin, 
  Lock, 
  ExternalLink, 
  RotateCcw, 
  CheckCircle2, 
  Shield, 
  Clock, 
  ArrowRight, 
  Wallet, 
  Bot,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useApp, AppProvider } from './context/AppContext';
import ThemeToggle from './components/ThemeToggle';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Explore from './pages/Explore';
import CreateCampaign from './pages/CreateCampaign';
import MyContributions from './pages/MyContributions';
import VerifierPortal from './pages/VerifierPortal';
import Documentation from './pages/Documentation';
import WalletManagement from './pages/WalletManagement';
import AiRiskReport from './pages/AiRiskReport';
import TransactionLedger from './pages/TransactionLedger';
import CampaignDetails from './pages/CampaignDetails';

function AuthGate({ targetView, onSignIn, onReturnHome }) {
  return (
    <div className="w-full py-10 flex items-center justify-center animate-fadeIn">
      <div className="w-full max-w-md p-7 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl text-center space-y-5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 blur-2xl pointer-events-none rounded-full" />
        
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-mono font-bold">
            <ShieldAlert className="w-3 h-3" />
            <span>Sign In Required</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">
            Access Restricted
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Please sign in or create an account to view and participate in <strong className="text-[var(--text-primary)]">{targetView}</strong>.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onSignIn}
            className="w-full py-3 px-5 rounded-full font-bold text-xs bg-[#15966D] hover:bg-[#117C5A] text-white shadow-[0_4px_16px_rgba(21,150,109,0.3)] flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Sign In / Sign Up with Google or Supabase</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onReturnHome}
            className="w-full py-2.5 px-5 rounded-full font-semibold text-xs border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] transition cursor-pointer"
          >
            Back to Protocol Overview
          </button>
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
          <span>Non-Custodial Escrow</span>
          <span className="text-emerald-500 font-semibold">✓ 20 ETH Hard Cap</span>
        </div>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'Landing', label: 'Protocol Overview', icon: Radio },
  { id: 'Explore', label: 'Campaign Marketplace', icon: Layers },
  { id: 'Campaign', label: 'Escrow Vault Hub', icon: LayoutDashboard },
  { id: 'Contributions', label: 'My Contributions / Portfolio', icon: HeartHandshake },
  { id: 'Verifier', label: 'Verifier Chamber', icon: ShieldCheck },
  { id: 'Wallet', label: 'Wallet & Network', icon: Wallet },
  { id: 'Create', label: 'Create Campaign', icon: PlusCircle },
  { id: 'AiRisk', label: 'AI Risk Audit', icon: Bot },
  { id: 'Ledger', label: 'Transaction Ledger', icon: Clock },
  { id: 'Docs', label: 'Documentation', icon: FileText },
];

function MainLayout() {
  const {
    account,
    balance,
    connectWallet,
    user,
    logout,
    activeTab,
    setActiveTab,
    currentView,
    setCurrentView,
    activeCampaign,
    activities,
    contributeToCampaign,
    requestRefund
  } = useApp();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [contribAmount, setContribAmount] = useState('0.5');
  const [txStep, setTxStep] = useState(null); // 'confirming' | 'confirmed' | null
  const [txDetails, setTxDetails] = useState('');

  // Persist theme selection in localStorage ('trustbridge_theme' & 'theme')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trustbridge_theme') || localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    }
    return false; // Default to Groww Light mode
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('trustbridge_theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('trustbridge_theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const applyTheme = () => {
      setIsDarkMode((prev) => !prev);
    };

    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 500);

      if (document.startViewTransition) {
        document.startViewTransition(() => {
          applyTheme();
        });
        return;
      }
    }

    applyTheme();
  };

  const minGoal = activeCampaign?.goal || 10.0;
  const hardCap = activeCampaign?.hardCap || 20.0;
  const totalRaised = activeCampaign?.totalRaised || 0.0;
  const remaining = Math.max(0, hardCap - totalRaised);
  const progressPercent = Math.min(100, Math.round((totalRaised / hardCap) * 100));

  async function handleContributeSubmit() {
    const val = parseFloat(contribAmount);
    if (!val || val <= 0) return;

    setTxStep('confirming');
    setTxDetails(`Confirming transaction of ${val.toFixed(2)} ETH...`);

    try {
      const res = await contributeToCampaign(activeCampaign.id, contribAmount);
      setTxStep('confirmed');
      setTxDetails(res?.msg || 'Transaction confirmed on Sepolia');
    } catch (err) {
      setTxStep(null);
      setTxDetails('');
    } finally {
      setTimeout(() => {
        setTxStep(null);
        setTxDetails('');
      }, 5000);
    }
  }

  async function handleRefundSubmit() {
    setTxStep('confirming');
    setTxDetails('Processing refund request...');
    try {
      const res = await requestRefund(activeCampaign.id);
      setTxStep('confirmed');
      setTxDetails(res?.msg || 'Refund processed');
    } catch (err) {
      setTxStep(null);
      setTxDetails('');
    } finally {
      setTimeout(() => {
        setTxStep(null);
        setTxDetails('');
      }, 5000);
    }
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased ${isDarkMode ? 'dark bg-[#07090E]' : 'light-mode-canvas'} text-[var(--text-primary)] transition-colors duration-200 relative overflow-x-hidden`}>
      {/* Sub-Surface Ambient Refraction Glows (Fixed behind frosted glass) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        <div className="absolute top-[5%] left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(2,132,199,0.12)_0%,transparent_70%)] blur-[100px] dark:bg-[radial-gradient(circle,rgba(0,245,160,0.06)_0%,transparent_70%)]" />
        <div className="absolute top-[18%] right-[8%] w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.11)_0%,transparent_70%)] blur-[100px] dark:bg-[radial-gradient(circle,rgba(0,210,255,0.05)_0%,transparent_70%)]" />
        <div className="absolute bottom-[10%] left-[30%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.09)_0%,transparent_70%)] blur-[120px] dark:bg-[radial-gradient(circle,rgba(16,185,129,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Navigation Header Floating Capsule Pill */}
      <header className="sticky top-3 sm:top-4 z-40 w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pointer-events-none mb-2 sm:mb-3">
        <div className="navbar-floating-capsule h-16 px-4 sm:px-6 flex items-center justify-between pointer-events-auto transition-all">
          {/* Left: 3-line hamburger menu toggle + TrustBridge logo pill */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              onClick={() => setIsSidebarExpanded((prev) => !prev)}
              className="p-2.5 rounded-2xl bg-white/[0.05] dark:bg-white/[0.05] bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
              aria-label="Toggle Navigation Drawer"
            >
              {isSidebarExpanded ? <X className="w-5 h-5 text-emerald-500" /> : <Menu className="w-5 h-5" />}
            </button>

            <div 
              onClick={() => setCurrentView('Landing')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              {/* Gradient Logo Badge */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-emerald-400 p-[1px] shadow-[0_0_15px_rgba(34,211,238,0.25)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.45)] transition-all">
                <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center font-bold text-lg text-cyan-300">
                  ⬡
                </div>
              </div>
              <div className="hidden xs:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                    TrustBridge
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-50 text-[#0284C7] dark:bg-[var(--accent-brand-subtle)] dark:text-[var(--accent-brand)] border border-sky-200/80 dark:border-[var(--border-subtle)] font-semibold">
                    v2.0
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] -mt-0.5 font-medium">Decentralized Escrow Protocol</div>
              </div>
            </div>
          </div>

          {/* Center: Active breadcrumb / context indicator (Clean; repetitive 8 links removed) */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <span className="text-[var(--text-muted)] font-medium">Protocol</span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-60" />
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide">
              {currentView === 'Landing' && 'Overview'}
              {currentView === 'Explore' && 'Marketplace'}
              {currentView === 'Campaign' && (activeCampaign?.title ? `Vault > ${activeCampaign.title.slice(0, 16)}...` : 'Vault Hub')}
              {currentView === 'Contributions' && 'Portfolio'}
              {currentView === 'Verifier' && 'Verifier Chamber'}
              {currentView === 'Wallet' && 'Wallet & Network'}
              {currentView === 'Create' && 'New Campaign'}
              {currentView === 'AiRisk' && 'AI Risk Audit'}
              {currentView === 'Ledger' && 'Transaction Ledger'}
              {currentView === 'Docs' && 'Documentation'}
              {currentView === 'Auth' && 'Sign In'}
            </span>
          </div>

          {/* Right Controls: [Network Status] -> [Theme Switcher] -> [User Profile] -> [MetaMask Balance] -> [Logout] */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Network Status Pill */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
              <span className="font-semibold">Sepolia</span>
            </div>

            {/* Theme Switcher */}
            <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />

            {/* User Profile Pill / Sign In */}
            {user ? (
              <span className="text-xs font-mono font-medium text-[var(--text-primary)] px-3 py-1.5 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-full hidden sm:inline-block">
                {user.name.slice(0, 10)}
              </span>
            ) : (
              <button
                onClick={() => setCurrentView('Auth')}
                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-surface-subtle)] dark:hover:bg-[var(--border-subtle)] text-slate-800 dark:text-[var(--text-primary)] border border-slate-200 dark:border-[var(--border-subtle)] text-xs font-semibold transition cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Wallet Address Pill (Render ONLY when isAuthenticated) */}
            {user && (
              <button 
                onClick={connectWallet}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono border border-slate-200/90 dark:border-[var(--border-subtle)] bg-white/70 dark:bg-[var(--bg-surface)] hover:border-emerald-400/60 hover:shadow-[0_0_15px_rgba(0,245,160,0.25)] text-slate-700 dark:text-[var(--text-primary)] backdrop-blur-md shadow-2xs transition-all duration-300 cursor-pointer group"
              >
                <span className="text-xs group-hover:scale-110 transition-transform">🦊</span>
                <span className="font-semibold text-[#0284C7] dark:text-[var(--accent-brand)]">
                  {balance ? `${parseFloat(balance).toFixed(2)} ETH` : '0.00 ETH'}
                </span>
                <span className="text-slate-300 dark:text-[var(--text-muted)] hidden sm:inline">|</span>
                <span className="text-slate-600 dark:text-[var(--text-secondary)] font-medium hidden sm:inline">
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect'}
                </span>
              </button>
            )}

            {/* Logout Button */}
            {user && (
              <button
                onClick={logout}
                className="text-[11px] text-[var(--text-muted)] hover:text-rose-500 font-medium px-2 py-1 transition cursor-pointer"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Horizontal Navigation Strip */}
      <div className="xl:hidden border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
        {(() => {
          const isAuthenticated = Boolean(user);
          const publicMob = [
            { id: 'Landing', label: 'Protocol' },
            { id: 'Explore', label: 'Explore' },
            { id: 'Docs', label: 'Docs' }
          ];
          const protectedMob = [
            { id: 'Campaign', label: 'Vault Hub' },
            { id: 'Contributions', label: 'Portfolio' },
            { id: 'Verifier', label: 'Verifier' },
            { id: 'Wallet', label: 'Wallet' },
            { id: 'Create', label: 'Create' },
            { id: 'AiRisk', label: 'AI Risk' },
            { id: 'Ledger', label: 'Ledger' }
          ];
          const visibleMob = isAuthenticated
            ? [publicMob[0], publicMob[1], ...protectedMob, publicMob[2]]
            : publicMob;

          return visibleMob.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`liquid-nav-pill !text-[11px] !py-1 !px-3 ${
                currentView === item.id ? 'liquid-nav-pill-active' : ''
              }`}
            >
              {item.label}
            </button>
          ));
        })()}
      </div>

      {/* Sliding Glass Drawer Overlay Backdrop Mask */}
      {isSidebarExpanded && (
        <div 
          onClick={() => setIsSidebarExpanded(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-fadeIn cursor-pointer"
          aria-label="Close navigation overlay"
        />
      )}

      {/* Mobile Sliding Drawer Overlay (< lg) */}
      <aside
        aria-label="Mobile Navigation Drawer"
        className={`sidebar-slider fixed top-0 left-0 bottom-0 py-6 px-4 flex lg:hidden flex-col justify-between h-full z-50 select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-[260px] shadow-2xl ${
          isSidebarExpanded ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-emerald-400 p-[1px]">
              <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center font-bold text-sm text-cyan-300">
                ⬡
              </div>
            </div>
            <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)]">
              TrustBridge
            </span>
          </div>
          <button
            onClick={() => setIsSidebarExpanded(false)}
            className="p-2 rounded-xl bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-emerald-500 cursor-pointer"
            aria-label="Close Mobile Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5 flex flex-col w-full overflow-y-auto no-scrollbar py-4">
          {NAV_ITEMS.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsSidebarExpanded(false);
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all text-left cursor-pointer ${
                  active
                    ? 'sidebar-item-active'
                    : 'text-[var(--text-secondary)] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:text-[var(--text-primary)]'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-[11px] font-bold">20 ETH Hard Cap</div>
            <div className="text-[10px] font-mono opacity-80">Non-Custodial Escrow</div>
          </div>
        </div>
      </aside>

      {/* Floating Sliding Drawer for Landing / Auth Views when Hamburger is toggled */}
      {(currentView === 'Landing' || currentView === 'Auth') && (
        <aside
          aria-label="Floating Sidebar Navigation"
          className={`sidebar-slider fixed top-20 left-4 py-4 px-2.5 hidden lg:flex flex-col justify-between h-[calc(100vh-100px)] z-50 select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-[240px] shadow-2xl ${
            isSidebarExpanded ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-[280px] opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between px-1 mb-2">
            <button
              onClick={() => setIsSidebarExpanded(false)}
              className="w-10 h-10 rounded-2xl bg-white/[0.05] dark:bg-white/[0.05] hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-all flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Close Navigation Drawer"
            >
              <X className="w-5 h-5 text-emerald-500" />
            </button>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] pr-2">
              Menu
            </span>
          </div>

          <div className="space-y-1.5 flex flex-col items-center w-full overflow-y-auto overflow-x-hidden no-scrollbar py-1">
            {NAV_ITEMS.map((item) => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsSidebarExpanded(false);
                  }}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                    active
                      ? 'sidebar-item-active'
                      : 'text-[var(--text-secondary)] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:text-[var(--text-primary)] hover:border hover:border-slate-200/60 dark:hover:border-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="whitespace-nowrap text-sm font-medium">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(0,245,160,0.15)]">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div className="text-left">
              <div className="text-[11px] font-bold leading-tight">20 ETH Cap</div>
              <div className="text-[9px] font-mono opacity-80">Non-Custodial</div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Container */}
      {currentView === 'Landing' ? (
        <main className="flex-1">
          <Landing isDarkMode={isDarkMode} />
        </main>
      ) : currentView === 'Auth' ? (
        <main className="flex-1">
          <Auth isDarkMode={isDarkMode} />
        </main>
      ) : (
        <div className="flex-1 flex max-w-[1600px] w-full mx-auto relative">
          {/* Left Vertical Navigation Rail: Liquid Glass Drawer */}
          <div className="py-6 pl-4 sm:pl-5 pr-2 hidden lg:flex shrink-0 relative z-50">
            <aside
              aria-label="Sidebar Navigation"
              className={`sidebar-slider py-4 px-2.5 flex flex-col justify-between h-[calc(100vh-115px)] sticky top-20 select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isSidebarExpanded ? 'w-[240px] shadow-2xl' : 'w-[72px]'
              }`}
            >
              {/* Header Toggle inside drawer */}
              <div className="flex items-center justify-between px-1 mb-2">
                <button
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                  className="w-10 h-10 rounded-2xl bg-white/[0.05] dark:bg-white/[0.05] hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-all flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Toggle Navigation Drawer"
                >
                  {isSidebarExpanded ? <X className="w-5 h-5 text-emerald-500" /> : <Menu className="w-5 h-5" />}
                </button>
                {isSidebarExpanded && (
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] pr-2">
                    Menu
                  </span>
                )}
              </div>

              {/* Navigation Items */}
              <div className="space-y-1.5 flex flex-col items-center w-full overflow-y-auto overflow-x-hidden no-scrollbar py-1">
                {NAV_ITEMS.map((item) => {
                  const active = currentView === item.id;
                  return (
                    <div key={item.id} className="relative group w-full">
                      <button
                        onClick={() => {
                          setCurrentView(item.id);
                          if (isSidebarExpanded) setIsSidebarExpanded(false);
                        }}
                        aria-label={item.label}
                        aria-current={active ? 'page' : undefined}
                        className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                          active
                            ? 'sidebar-item-active'
                            : 'text-[var(--text-secondary)] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:text-[var(--text-primary)] hover:border hover:border-slate-200/60 dark:hover:border-white/10'
                        }`}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className={`whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                          isSidebarExpanded
                            ? 'opacity-100 translate-x-0 w-auto'
                            : 'opacity-0 -translate-x-2 w-0 overflow-hidden pointer-events-none'
                        }`}>
                          {item.label}
                        </span>
                      </button>
                      {!isSidebarExpanded && (
                        <div className="absolute left-16 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-950 text-slate-100 text-[11px] font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10">
                          {item.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Escrow Security Icon */}
              <div className="relative group flex items-center pt-2 w-full">
                <div className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(0,245,160,0.15)] ${
                  isSidebarExpanded ? 'justify-start' : 'justify-center'
                }`}>
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div className={`transition-all duration-200 text-left ${
                    isSidebarExpanded
                      ? 'opacity-100 translate-x-0 w-auto'
                      : 'opacity-0 -translate-x-2 w-0 overflow-hidden pointer-events-none'
                  }`}>
                    <div className="text-[11px] font-bold leading-tight">20 ETH Cap</div>
                    <div className="text-[9px] font-mono opacity-80">Non-Custodial</div>
                  </div>
                </div>
                {!isSidebarExpanded && (
                  <div className="absolute left-16 bottom-2 px-2.5 py-1 bg-slate-950 text-slate-100 text-[11px] font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10">
                    Non-Custodial Escrow (20 ETH Cap)
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Main Content Workspace */}
          <main className="flex-1 p-6 lg:p-8 space-y-5 overflow-y-auto">
            {/* Real dApp Transaction Feedback Banner */}
            {txStep && (
              <div className={`p-3.5 rounded-xl text-xs font-mono border flex items-center justify-between ${
                txStep === 'confirming'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              }`}>
                <div className="flex items-center space-x-2">
                  {txStep === 'confirming' ? (
                    <Clock className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span>{txDetails}</span>
                </div>
                {txStep === 'confirmed' && (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">✓ On-Chain Verified</span>
                )}
              </div>
            )}

            {/* Auth Guard for Protected Views */}
            {!user && currentView !== 'Docs' ? (
              <AuthGate 
                targetView={currentView === 'Campaign' ? 'Escrow Vault Hub' : currentView} 
                onSignIn={() => setCurrentView('Auth')}
                onReturnHome={() => setCurrentView('Landing')}
              />
            ) : (
              <>
                {currentView === 'Explore' && <Explore />}
                {currentView === 'Create' && <CreateCampaign />}
                {currentView === 'Contributions' && <MyContributions />}
                {currentView === 'Verifier' && <VerifierPortal />}
                {currentView === 'Wallet' && <WalletManagement />}
                {currentView === 'AiRisk' && <AiRiskReport />}
                {currentView === 'Ledger' && <TransactionLedger />}
                {currentView === 'Docs' && <Documentation />}
                {currentView === 'Campaign' && <CampaignDetails />}
              </>
            )}
          </main>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-surface)]">
        <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
          <span className="text-[var(--accent-brand)]">◈</span>
          <span>TrustBridge Protocol</span>
          <span className="text-[10px] font-mono font-normal text-[var(--text-muted)] ml-2">Sepolia Non-Custodial Escrow</span>
        </div>
        <div className="font-mono text-[11px] text-[var(--text-muted)]">Build • Verify • Fund a Better Tomorrow.</div>
      </footer>
    </div>
  );
}

import Chatbot from './components/Chatbot';

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      <Chatbot />
    </AppProvider>
  );
}
