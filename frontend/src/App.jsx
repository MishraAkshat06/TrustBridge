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
  Bot 
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
    <div className="min-h-screen flex flex-col font-sans antialiased bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200 relative overflow-x-hidden">
      {/* Sub-Surface Ambient Refraction Glows (Fixed behind frosted glass) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        <div className="absolute top-[5%] left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,245,160,0.12)_0%,transparent_70%)] blur-[100px] dark:bg-[radial-gradient(circle,rgba(0,245,160,0.06)_0%,transparent_70%)]" />
        <div className="absolute top-[18%] right-[8%] w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(0,210,255,0.12)_0%,transparent_70%)] blur-[100px] dark:bg-[radial-gradient(circle,rgba(0,210,255,0.05)_0%,transparent_70%)]" />
        <div className="absolute bottom-[10%] left-[30%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)] blur-[120px] dark:bg-[radial-gradient(circle,rgba(16,185,129,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Modern Institutional Web3 Navbar */}
      <header className="h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 bg-[var(--header-bg)] border-[var(--border-subtle)] text-[var(--text-primary)] backdrop-blur-md">
        <div className="flex items-center space-x-6 sm:space-x-8">
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
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                  TrustBridge
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] border border-[var(--border-subtle)] font-semibold">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] -mt-0.5 font-medium">Decentralized Escrow Protocol</div>
            </div>
          </div>
        </div>

        {/* Center Navigation Links (Core Views) */}
        <nav aria-label="Main Navigation" className="hidden xl:flex items-center space-x-5 text-xs font-semibold">
          {(() => {
            const isAuthenticated = Boolean(user);
            const publicNav = [
              { id: 'Landing', label: 'Protocol' },
              { id: 'Explore', label: 'Explore' },
              { id: 'Docs', label: 'Docs' }
            ];
            const protectedNav = [
              { id: 'Campaign', label: 'Vault Hub' },
              { id: 'Contributions', label: 'Portfolio' },
              { id: 'Verifier', label: 'Verifier' },
              { id: 'Wallet', label: 'Wallet' },
              { id: 'Create', label: 'Create' }
            ];
            const visibleNav = isAuthenticated
              ? [publicNav[0], publicNav[1], ...protectedNav, publicNav[2]]
              : publicNav;

            return visibleNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                aria-current={currentView === item.id ? 'page' : undefined}
                className={`liquid-nav-pill ${
                  currentView === item.id ? 'liquid-nav-pill-active' : ''
                }`}
              >
                {item.label}
              </button>
            ));
          })()}
        </nav>

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
        <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
          {/* Left Vertical Navigation Rail: Liquid Glass Capsule */}
          <div className="py-6 pl-5 pr-2 hidden lg:flex shrink-0">
            <aside
              aria-label="Sidebar Navigation"
              className="liquid-nav-rail py-5 px-2 flex flex-col justify-between items-center h-[calc(100vh-115px)] sticky top-20 select-none"
            >
              <div className="space-y-2.5 flex flex-col items-center w-full">
                {[
                  { id: 'Landing', name: 'Protocol Overview', icon: Radio },
                  { id: 'Campaign', name: 'Escrow Vault Hub', icon: LayoutDashboard },
                  { id: 'Explore', name: 'Explore Campaigns', icon: Layers },
                  { id: 'Contributions', name: 'My Contributions', icon: HeartHandshake },
                  { id: 'Verifier', name: 'Verifier Chamber', icon: ShieldCheck },
                  { id: 'Wallet', name: 'Wallet & Network', icon: Wallet },
                  { id: 'Create', name: 'Create Campaign', icon: PlusCircle },
                  { id: 'AiRisk', name: 'AI Risk Audit', icon: Bot },
                  { id: 'Ledger', name: 'Transaction Ledger', icon: Layers },
                  { id: 'Docs', name: 'Documentation', icon: FileText },
                ].map((item) => {
                  const active = currentView === item.id;
                  return (
                    <div key={item.name} className="relative group flex items-center justify-center">
                      <button
                        onClick={() => setCurrentView(item.id)}
                        aria-label={item.name}
                        aria-current={active ? 'page' : undefined}
                        className={`liquid-rail-item cursor-pointer ${
                          active ? 'liquid-rail-item-active' : ''
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </button>
                      {/* Floating Tooltip */}
                      <div className="absolute left-16 px-2.5 py-1 bg-slate-950 text-slate-100 text-[11px] font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10">
                        {item.name}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Escrow Security Icon */}
              <div className="relative group flex flex-col items-center pt-2">
                <button
                  onClick={() => setCurrentView('Explore')}
                  aria-label="Escrow Vaults"
                  className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 hover:scale-105 shadow-[0_0_15px_rgba(0,245,160,0.15)] transition-transform cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                </button>
                <div className="absolute left-16 bottom-2 px-2.5 py-1 bg-slate-950 text-slate-100 text-[11px] font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10">
                  Non-Custodial Escrow (20 ETH Cap)
                </div>
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
