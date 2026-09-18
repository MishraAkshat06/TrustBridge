import React, { useState } from 'react';
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
  const [isDarkMode, setIsDarkMode] = useState(false); // Primary experience is light theme per spec

  const minGoal = activeCampaign.goal || 10.0;
  const hardCap = activeCampaign.hardCap || 20.0;
  const totalRaised = activeCampaign.totalRaised || 0.0;
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
    <div className={`min-h-screen flex flex-col font-sans antialiased ${
      currentView === 'Auth'
        ? 'bg-[#F5F3EC] text-black'
        : 'bg-[#0B0F17] text-zinc-100'
    }`}>
      {/* Modern Institutional Web3 Navbar */}
      <header className={`h-16 border-b px-6 flex items-center justify-between sticky top-0 z-40 ${
        currentView === 'Auth'
          ? 'bg-white/80 backdrop-blur-md border-[#E7E5DF] text-black'
          : 'border-zinc-800/80 bg-zinc-950/80 backdrop-blur-lg text-zinc-100'
      }`}>
        <div className="flex items-center space-x-8">
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
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-cyan-300 bg-clip-text text-transparent">
                  TrustBridge
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 -mt-0.5 font-medium">Decentralized Escrow Protocol</div>
            </div>
          </div>

          {/* Network Indicator Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900/80 border border-zinc-800 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></span>
            <span className="text-zinc-200 font-semibold">Sepolia Testnet</span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-400">
          {[
            { id: 'Landing', label: 'Protocol' },
            { id: 'Explore', label: 'Explore' },
            { id: 'Campaign', label: 'Vault Hub' },
            { id: 'Create', label: 'Create' },
            { id: 'Docs', label: 'Docs' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`hover:text-cyan-400 transition-colors ${
                currentView === item.id ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Controls: Balance + Truncated Address */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-medium text-zinc-300 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                {user.name.slice(0, 10)}
              </span>
              <button
                onClick={logout}
                className="text-[11px] text-slate-400 hover:text-rose-400 font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('Auth')}
              className="px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              Sign In
            </button>
          )}

          {/* Wallet Button with Balance Chip */}
          <button 
            onClick={connectWallet}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono border border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 text-zinc-200 shadow-sm transition"
          >
            <span className="text-xs">🦊</span>
            <span className="font-semibold text-cyan-400">
              {balance ? `${parseFloat(balance).toFixed(2)} ETH` : '0.00 ETH'}
            </span>
            <span className="text-zinc-600">|</span>
            <span>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect'}</span>
          </button>
        </div>
      </header>

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
          <aside className="w-64 border-r border-zinc-800/70 bg-zinc-950/60 backdrop-blur-xl p-4 flex flex-col justify-between hidden lg:flex">
            <div className="space-y-1">
              {[
                { id: 'Campaign', name: 'Escrow Vault Hub', icon: LayoutDashboard },
                { id: 'Explore', name: 'Explore Campaigns', icon: Layers },
                { id: 'Create', name: 'Create Campaign', icon: PlusCircle },
                { id: 'Contributions', name: 'My Contributions', icon: HeartHandshake },
                { id: 'Verifier', name: 'Verifier Chamber', icon: ShieldCheck },
                { id: 'Wallet', name: 'Wallet & Network', icon: Wallet },
                { id: 'AiRisk', name: 'AI Risk Audit', icon: Bot },
                { id: 'Ledger', name: 'Transaction Ledger', icon: Layers },
                { id: 'Docs', name: 'Documentation', icon: FileText },
              ].map((item) => {
                const active = currentView === item.id;
                return (
                  <button
                    key={item.name}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-tight transition-all ${
                      active
                        ? 'bg-gradient-to-r from-indigo-500/15 to-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                        : 'text-slate-400 hover:bg-zinc-900/60 hover:text-zinc-100'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${
                      active ? 'text-cyan-400' : 'text-slate-500'
                    }`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Escrow Security Badge */}
            <div className="p-4 rounded-xl text-xs space-y-2 bg-zinc-900/70 border border-zinc-800/80">
              <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Non-Custodial Escrow</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                Strict 20 ETH ceiling. Funds released only on verifier signature.
              </p>
              <button
                onClick={() => setCurrentView('Explore')}
                className="w-full py-2 btn-fintech-primary text-xs font-semibold"
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
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center space-x-2">
                  {txStep === 'confirming' ? (
                    <Clock className="w-4 h-4 animate-spin text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{txDetails}</span>
                </div>
                {txStep === 'confirmed' && (
                  <span className="text-[11px] font-bold text-emerald-700">✓ On-Chain Verified</span>
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
      <footer className={`border-t py-4 px-6 flex items-center justify-between text-xs ${
        isDarkMode ? 'border-[#1C2538] text-slate-500 bg-[#0B0E14]' : 'border-[#E7E5DF] text-[#64748B] bg-white'
      }`}>
        <div className="flex items-center space-x-2 font-bold text-[#111827] dark:text-white">
          <span>◈ TrustBridge</span>
        </div>
        <div className="flex space-x-6 font-medium">
          <button onClick={() => setCurrentView('Landing')} className="hover:text-[#B88A20]">Protocol</button>
          <button onClick={() => setCurrentView('Explore')} className="hover:text-[#B88A20]">Explore</button>
          <button onClick={() => setCurrentView('Create')} className="hover:text-[#B88A20]">Create</button>
          <button onClick={() => setCurrentView('Docs')} className="hover:text-[#B88A20]">Docs</button>
        </div>
        <div className="font-mono text-[11px]">Build • Verify • Fund a Better Tomorrow.</div>
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
