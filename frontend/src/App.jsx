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

  // Persist theme selection in localStorage ('trustbridge_theme')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trustbridge_theme');
      if (saved) return saved === 'dark';
    }
    return false; // Default to Groww Light mode
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('trustbridge_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('trustbridge_theme', 'light');
      }
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const minGoal = activeCampaign?.goal || 10.0;
  const hardCap = activeCampaign?.hardCap || 20.0;
  const totalRaised = activeCampaign?.totalRaised || 0.0;
  const remaining = Math.max(0, hardCap - totalRaised);
  const progressPercent = Math.min(100, Math.round((totalRaised / hardCap) * 100));

  function handleContributeSubmit() {
    const val = parseFloat(contribAmount);
    if (!val || val <= 0) return;

    setTxStep('confirming');
    setTxDetails(`Confirming transaction of ${val.toFixed(2)} ETH...`);

    setTimeout(() => {
      const res = contributeToCampaign(activeCampaign.id, contribAmount);
      setTxStep('confirmed');
      setTxDetails(res.msg);
      setTimeout(() => {
        setTxStep(null);
        setTxDetails('');
      }, 5000);
    }, 1200);
  }

  function handleRefundSubmit() {
    setTxStep('confirming');
    setTxDetails('Processing refund request...');
    setTimeout(() => {
      const res = requestRefund(activeCampaign.id);
      setTxStep('confirmed');
      setTxDetails(res.msg);
      setTimeout(() => {
        setTxStep(null);
        setTxDetails('');
      }, 5000);
    }, 1200);
  }

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
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

          {/* Network Indicator Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></span>
            <span className="text-[var(--text-primary)] font-semibold">Sepolia Testnet</span>
          </div>
        </div>

        {/* Center Navigation Links (Core Views) */}
        <nav className="hidden xl:flex items-center space-x-5 text-xs font-semibold">
          {[
            { id: 'Landing', label: 'Protocol' },
            { id: 'Explore', label: 'Explore' },
            { id: 'Campaign', label: 'Vault Hub' },
            { id: 'Contributions', label: 'Portfolio' },
            { id: 'Verifier', label: 'Verifier' },
            { id: 'Wallet', label: 'Wallet' },
            { id: 'Create', label: 'Create' },
            { id: 'Docs', label: 'Docs' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`transition-colors py-1 cursor-pointer ${
                currentView === item.id 
                  ? 'text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] font-bold border-b-2 border-[var(--accent-brand)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Controls: Theme Toggle + Auth + Wallet */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Seamless Theme Toggle Button (Groww Light / Binance Dark) */}
          <button
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to Groww FinTech Light" : "Switch to Binance Pro Dark"}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border shadow-2xs ${
              isDarkMode
                ? 'border-[#2B313A] bg-[#181A20] text-[#F0B90B] hover:bg-[#1E2329]'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {isDarkMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[#F0B90B]" />
                <span className="font-mono">Binance Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono">Groww Light</span>
              </>
            )}
          </button>

          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-medium text-[var(--text-primary)] px-3 py-1 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-full hidden sm:inline-block">
                {user.name.slice(0, 10)}
              </span>
              <button
                onClick={logout}
                className="text-[11px] text-[var(--text-muted)] hover:text-rose-500 font-medium cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('Auth')}
              className="px-3 py-1.5 rounded-full bg-[var(--bg-surface-subtle)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold transition cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Wallet Button with Balance Chip */}
          <button 
            onClick={connectWallet}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] shadow-2xs transition cursor-pointer"
          >
            <span className="text-xs">🦊</span>
            <span className="font-semibold text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)]">
              {balance ? `${parseFloat(balance).toFixed(2)} ETH` : '0.00 ETH'}
            </span>
            <span className="text-[var(--text-muted)] hidden sm:inline">|</span>
            <span className="hidden sm:inline">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect'}</span>
          </button>
        </div>
      </header>

      {/* Mobile / Tablet Horizontal Navigation Strip */}
      <div className="xl:hidden border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
        {[
          { id: 'Landing', label: 'Protocol' },
          { id: 'Explore', label: 'Explore' },
          { id: 'Campaign', label: 'Vault Hub' },
          { id: 'Contributions', label: 'Portfolio' },
          { id: 'Verifier', label: 'Verifier' },
          { id: 'Wallet', label: 'Wallet' },
          { id: 'Create', label: 'Create' },
          { id: 'AiRisk', label: 'AI Risk' },
          { id: 'Ledger', label: 'Ledger' },
          { id: 'Docs', label: 'Docs' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
              currentView === item.id
                ? 'bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            {item.label}
          </button>
        ))}
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
          {/* Institutional Web3 Left Sidebar */}
          <aside className="w-64 border-r border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-4 flex flex-col justify-between hidden lg:flex">
            <div className="space-y-1">
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
                  <button
                    key={item.name}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-tight transition-all cursor-pointer ${
                      active
                        ? 'bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] border-l-2 border-[var(--accent-brand)] font-semibold shadow-2xs'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${
                      active ? 'text-[var(--accent-brand)]' : 'text-[var(--text-muted)]'
                    }`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Escrow Security Badge */}
            <div className="p-4 rounded-xl text-xs space-y-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
              <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Non-Custodial Escrow</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-normal">
                Strict 20 ETH ceiling. Funds released only on verifier signature.
              </p>
              <button
                onClick={() => setCurrentView('Explore')}
                className="w-full py-2 btn-fintech-primary text-xs font-semibold cursor-pointer"
              >
                Explore Vaults
              </button>
            </div>
          </aside>

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

            {currentView === 'Explore' && <Explore />}
            {currentView === 'Create' && <CreateCampaign />}
            {currentView === 'Contributions' && <MyContributions />}
            {currentView === 'Verifier' && <VerifierPortal />}
            {currentView === 'Wallet' && <WalletManagement />}
            {currentView === 'AiRisk' && <AiRiskReport />}
            {currentView === 'Ledger' && <TransactionLedger />}
            {currentView === 'Docs' && <Documentation />}

            {currentView === 'Campaign' && <CampaignDetails />}
          </main>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-surface)]">
        <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
          <span className="text-[var(--accent-brand)]">◈</span>
          <span>TrustBridge Protocol</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium text-xs">
          <button onClick={() => setCurrentView('Landing')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">Protocol</button>
          <button onClick={() => setCurrentView('Explore')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">Explore</button>
          <button onClick={() => setCurrentView('Campaign')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">Vault Hub</button>
          <button onClick={() => setCurrentView('Contributions')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">Portfolio</button>
          <button onClick={() => setCurrentView('Verifier')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">Verifier</button>
          <button onClick={() => setCurrentView('Wallet')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">Wallet</button>
          <button onClick={() => setCurrentView('Create')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">Create</button>
          <button onClick={() => setCurrentView('AiRisk')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">AI Risk</button>
          <button onClick={() => setCurrentView('Ledger')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">Ledger</button>
          <button onClick={() => setCurrentView('Docs')} className="hover:text-[var(--accent-brand)] transition cursor-pointer">Docs</button>
        </div>
        <div className="font-mono text-[11px] text-[var(--text-muted)]">Build • Verify • Fund a Better Tomorrow.</div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
