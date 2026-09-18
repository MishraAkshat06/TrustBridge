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
        : isDarkMode 
          ? 'bg-[#080A0F] text-slate-100' 
          : 'bg-[#F7F6F2] text-[#111827]'
    }`}>
      {/* Top Navbar */}
      <header className={`h-16 border-b px-6 flex items-center justify-between sticky top-0 z-30 ${
        currentView === 'Auth'
          ? 'bg-white/80 backdrop-blur-md border-[#E7E5DF] text-black'
          : isDarkMode 
            ? 'bg-[#0B0E14] border-[#1C2538]' 
            : 'bg-white border-[#E7E5DF]'
      }`}>
        <div className="flex items-center space-x-8">
          <div 
            onClick={() => setCurrentView('Landing')}
            className="flex items-center space-x-3 cursor-pointer"
          >
            {/* Hex Logo matching reference image */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg shadow-2xs ${
              isDarkMode 
                ? 'bg-[#181E2C] text-[#FACC15] border border-[#2B354D]' 
                : 'bg-[#1A1C20] text-[#D4AF37] border border-[#2D313A]'
            }`}>
              ⬡
            </div>
            <div>
              <span className={`font-bold text-base tracking-tight ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>TrustBridge</span>
              <div className="text-[10px] text-[#64748B] -mt-0.5 font-medium">Fund Ideas. Build Trust.</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#F0FDF4] border border-[#BBF7D0] text-[#009379]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009379]"></span>
            <span>Sepolia Testnet</span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className={`hidden md:flex items-center space-x-8 text-xs font-semibold ${
          isDarkMode ? 'text-slate-400' : 'text-[#64748B]'
        }`}>
          <button onClick={() => setCurrentView('Landing')} className={`hover:text-[#009379] transition-colors ${currentView === 'Landing' ? 'text-[#009379] font-bold' : ''}`}>Protocol</button>
          <button onClick={() => setCurrentView('Explore')} className={`hover:text-[#009379] transition-colors ${currentView === 'Explore' ? 'text-[#009379] font-bold' : ''}`}>Explore</button>
          <button onClick={() => setCurrentView('Create')} className={`hover:text-[#009379] transition-colors ${currentView === 'Create' ? 'text-[#009379] font-bold' : ''}`}>Create</button>
          <button onClick={() => setCurrentView('Docs')} className={`hover:text-[#009379] transition-colors ${currentView === 'Docs' ? 'text-[#009379] font-bold' : ''}`}>Docs</button>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Toggle pill matching reference */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="flex items-center px-2 py-1 rounded-full border border-[#E5E2DC] bg-[#F7F5F0] hover:bg-slate-100 transition-colors space-x-1 text-[#64748B]"
            title="Toggle theme"
          >
            <Sun className="w-3.5 h-3.5 text-[#D4AF37]" />
            <div className={`w-3.5 h-3.5 rounded-full ${isDarkMode ? 'bg-[#111827]' : 'bg-[#D1D5DB]'}`}></div>
          </button>
          
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-medium text-[#111827] dark:text-white px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                {user.name.slice(0, 10)}
              </span>
              <button
                onClick={logout}
                className="text-[11px] text-[#64748B] hover:text-[#D64545] font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('Auth')}
              className="px-4 py-1.5 rounded-full bg-[#111827] dark:bg-white text-white dark:text-[#111827] text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          )}

          <button 
            onClick={connectWallet}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border border-[#E5E2DC] bg-white dark:bg-[#111622] hover:bg-slate-50 text-[#111827] dark:text-white shadow-2xs transition-colors"
          >
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center text-[10px]">🦊</span>
            <span>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0x7B2a...4Fa1'}</span>
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
          {/* Simplified Left Sidebar */}
          <aside className={`w-64 border-r p-4 flex flex-col justify-between hidden lg:flex ${
            isDarkMode ? 'bg-[#0B0E14] border-[#1C2538]' : 'bg-white border-[#E7E5DF]'
          }`}>
            <div className="space-y-1">
              {[
                { id: 'Campaign', name: 'Dashboard', icon: LayoutDashboard },
                { id: 'Explore', name: 'Explore Campaigns', icon: Layers },
                { id: 'Create', name: 'Create Campaign', icon: PlusCircle },
                { id: 'Contributions', name: 'My Contributions', icon: HeartHandshake },
                { id: 'Verifier', name: 'Verifier Portal', icon: ShieldCheck },
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
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-tight transition-colors ${
                      active
                        ? isDarkMode
                          ? 'bg-[#151B27] text-[#B88A20] border-l-3 border-[#B88A20] font-semibold'
                          : 'bg-[#F7F6F2] text-[#111827] border-l-3 border-[#B88A20] font-semibold'
                        : isDarkMode
                          ? 'text-slate-400 hover:bg-[#111622] hover:text-slate-200'
                          : 'text-[#64748B] hover:bg-[#F7F6F2] hover:text-[#111827]'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${
                      active ? 'text-[#B88A20]' : 'text-[#64748B]'
                    }`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Slogan Card */}
            <div className={`p-4 rounded-xl text-xs space-y-2 border ${
              isDarkMode 
                ? 'bg-[#111622] border-[#1C2538] text-slate-300' 
                : 'bg-[#F7F6F2] border-[#E7E5DF] text-[#64748B]'
            }`}>
              <div className="font-bold text-xs text-[#111827] dark:text-white">
                Protected Campaign Funds
              </div>
              <p className="text-[11px] leading-relaxed">
                ETH is held in escrow. Funds released after approval.
              </p>
              <button
                onClick={() => setCurrentView('Explore')}
                className="w-full py-2 bg-[#111827] hover:bg-black text-white rounded-lg text-xs font-medium transition-colors"
              >
                Explore Campaigns
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

            {currentView === 'Campaign' && (
              <>
                {/* Compact Reduced-Height Campaign Header (20-25% shorter) */}
                <div className={`border rounded-2xl p-5 shadow-xs card-3d ${
                  isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#F7F6F2] dark:bg-slate-800 text-[#64748B] border border-[#E7E5DF] dark:border-slate-700">
                          {activeCampaign.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#15966D] border border-[#BBF7D0] flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#15966D]"></span>
                          <span>Active</span>
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-black dark:text-white">
                        {activeCampaign.title}
                      </h1>
                      <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
                        {activeCampaign.summary}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono text-[#64748B] border-t sm:border-t-0 sm:border-l border-[#E7E5DF] dark:border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                      <div>
                        <div className="text-[10px] uppercase text-slate-400">Creator</div>
                        <div className="font-semibold text-[#111827] dark:text-slate-200">0x3Fa8...2241F</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-400">Created</div>
                        <div className="font-semibold text-[#111827] dark:text-slate-200">Sep 12, 2024</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-400">Contributors</div>
                        <div className="font-semibold text-[#111827] dark:text-slate-200">24</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center space-x-6 border-b border-[#E7E5DF] dark:border-slate-800 text-xs font-semibold text-[#64748B]">
                  {['Overview', 'Milestones', 'Activity', 'Smart Contract'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 -mb-px transition-colors ${
                        activeTab === tab
                          ? 'text-[#B88A20] border-b-2 border-[#B88A20] font-bold'
                          : 'hover:text-[#111827] dark:hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* 2-Column Main Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Main Column: Funding Progress (Strongest Visual Hierarchy) + About */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Funding Progress (Focal Point) */}
                    <div className={`border rounded-2xl p-6 shadow-xs space-y-4 card-3d ${
                      isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white">Funding Progress</span>
                          <div className="flex items-baseline space-x-2 mt-1">
                            <span className="text-3xl font-extrabold font-mono text-black dark:text-white">{totalRaised.toFixed(2)}</span>
                            <span className="text-[#64748B] font-mono font-semibold">/ {hardCap.toFixed(2)} ETH</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold font-mono text-[#B88A20]">{progressPercent}%</div>
                          <div className="text-[10px] text-[#64748B]">funded of hard cap</div>
                        </div>
                      </div>

                      {/* Progress Bar with restrained gold styling */}
                      <div className="w-full h-3 bg-[#F7F6F2] dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#B88A20] rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-xs font-mono pt-1 border-b border-[#E7E5DF] dark:border-slate-800 pb-3 text-[#64748B]">
                        <span>10 ETH Minimum Goal</span>
                        <span>20 ETH Maximum Funding</span>
                        <span>Remaining: <strong className="text-[#B88A20] font-bold">{remaining.toFixed(2)} ETH</strong></span>
                      </div>

                      {/* 4 Stat Boxes */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        {[
                          { label: 'Minimum Goal', val: '10 ETH', sub: 'Goal Threshold' },
                          { label: 'Hard Cap', val: '20 ETH', sub: 'Maximum Ceiling' },
                          { label: 'Total Raised', val: `${totalRaised.toFixed(2)} ETH`, sub: 'Current Balance' },
                          { label: 'Contributors', val: '24', sub: 'Backer Count' },
                        ].map((box) => (
                          <div key={box.label} className={`border rounded-lg p-3 ${
                            isDarkMode ? 'border-[#1C2538] bg-[#111622]' : 'border-[#E7E5DF] bg-[#F7F6F2]'
                          }`}>
                            <div className="text-xs font-mono font-bold text-[#111827] dark:text-white">{box.val}</div>
                            <div className="text-[11px] text-[#64748B]">{box.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* How Funds Are Protected (Required Section 7) */}
                    <div className={`border rounded-xl p-5 shadow-xs space-y-3 ${
                      isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                    }`}>
                      <div className="flex items-center space-x-2 text-sm font-bold text-[#111827] dark:text-white">
                        <Shield className="w-4 h-4 text-[#15966D]" />
                        <span>How Funds Are Protected</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#64748B]">
                        <div className="p-3 bg-[#F7F6F2] dark:bg-slate-800/40 rounded-lg border border-[#E7E5DF] dark:border-slate-700 space-y-1">
                          <strong className="text-[#111827] dark:text-slate-200 block">• 10 ETH Minimum Goal:</strong>
                          <span>First tranche only unlocks after minimum campaign goal is met.</span>
                        </div>
                        <div className="p-3 bg-[#F7F6F2] dark:bg-slate-800/40 rounded-lg border border-[#E7E5DF] dark:border-slate-700 space-y-1">
                          <strong className="text-[#111827] dark:text-slate-200 block">• 20 ETH Maximum Funding:</strong>
                          <span>Excess contributions above 20 ETH are automatically refunded.</span>
                        </div>
                        <div className="p-3 bg-[#F7F6F2] dark:bg-slate-800/40 rounded-lg border border-[#E7E5DF] dark:border-slate-700 space-y-1">
                          <strong className="text-[#111827] dark:text-slate-200 block">• Milestone Approval:</strong>
                          <span>Verifier checks deliverables before creator can withdraw released funds.</span>
                        </div>
                        <div className="p-3 bg-[#F7F6F2] dark:bg-slate-800/40 rounded-lg border border-[#E7E5DF] dark:border-slate-700 space-y-1">
                          <strong className="text-[#111827] dark:text-slate-200 block">• Contributor Refunds:</strong>
                          <span>Reclaim contributed funds anytime before milestone approval.</span>
                        </div>
                      </div>
                    </div>

                    {/* About the Project */}
                    <div className={`border rounded-xl p-6 shadow-xs space-y-4 ${
                      isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                    }`}>
                      <h3 className="text-sm font-bold tracking-tight text-[#111827] dark:text-white">About the Project</h3>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        AuraMesh is a low-power IoT sensing node designed for remote environments. It uses LoRaWAN for long-range communication and includes a secure element for device identity and location proof.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {[
                          { title: 'Low Power', sub: 'Optimized for long battery life', icon: Zap },
                          { title: 'Hardware Security', sub: 'Secure element for key storage', icon: ShieldAlert },
                          { title: 'LoRaWAN', sub: 'Long-range, low-bandwidth', icon: Radio },
                          { title: 'Location Proof', sub: 'Cryptographic proof of location', icon: MapPin },
                        ].map((f) => (
                          <div key={f.title} className={`flex items-start space-x-3 p-3 rounded-lg border ${
                            isDarkMode ? 'border-[#1C2538] bg-[#111622]' : 'border-[#E7E5DF] bg-[#F7F6F2]'
                          }`}>
                            <f.icon className="w-4 h-4 text-[#B88A20] mt-0.5" />
                            <div>
                              <div className="text-xs font-bold text-[#111827] dark:text-white">{f.title}</div>
                              <div className="text-[11px] text-[#64748B]">{f.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Clean Contribution Card + Actions */}
                  <div className="lg:col-span-5 space-y-5">
                    {/* Clean Contribution Card */}
                    <div className={`border rounded-xl p-5 shadow-xs space-y-4 ${
                      isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white">Contribute</h3>
                        <span className="text-[11px] font-mono text-[#64748B]">Balance: 2.50 ETH</span>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={contribAmount}
                          onChange={(e) => setContribAmount(e.target.value)}
                          className={`w-full pl-3 pr-12 py-2 border rounded-lg font-mono text-sm font-bold focus:outline-none ${
                            isDarkMode 
                              ? 'bg-[#111622] border-[#20293D] text-white focus:border-[#B88A20]' 
                              : 'bg-white border-[#E7E5DF] text-[#111827] focus:border-[#B88A20]'
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-mono font-semibold text-[#64748B]">
                          ETH
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2">
                        {['0.1', '0.5', '1', '2', 'Max'].map((chip) => (
                          <button
                            key={chip}
                            onClick={() => setContribAmount(chip === 'Max' ? remaining.toString() : chip)}
                            className={`flex-1 py-1 rounded border text-xs font-mono transition-colors ${
                              isDarkMode 
                                ? 'bg-[#111622] hover:bg-[#182030] border-[#20293D] text-slate-300' 
                                : 'bg-[#F7F6F2] hover:bg-slate-100 border-[#E7E5DF] text-[#111827]'
                            }`}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      {/* Restrained Primary CTA Button */}
                      <button
                        onClick={handleContributeSubmit}
                        className="w-full py-3 rounded-full bg-[#111827] hover:bg-black text-[#B88A20] font-bold text-xs tracking-tight transition-all shadow-sm"
                      >
                        Contribute →
                      </button>

                      <p className="text-[11px] text-[#64748B] text-center font-mono">
                        Excess contribution above 20 ETH is automatically refunded.
                      </p>
                    </div>

                    {/* Request Refund */}
                    <div className={`border rounded-xl p-4 shadow-xs space-y-2.5 ${
                      isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                    }`}>
                      <h4 className="text-xs font-bold text-[#111827] dark:text-white">Request Refund</h4>
                      <p className="text-[11px] text-[#64748B]">
                        You can request a refund if the milestone has not been approved yet.
                      </p>
                      <button
                        onClick={handleRefundSubmit}
                        className="w-full py-2.5 rounded-full border border-[#D64545]/30 text-[#D64545] hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Refund</span>
                      </button>
                    </div>

                    {/* Creator Withdraw */}
                    <div className={`border rounded-xl p-4 shadow-xs space-y-2.5 ${
                      isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                    }`}>
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#111827] dark:text-white">
                        <span>Withdraw Released Funds</span>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Funds are released only after milestone approval.
                      </p>
                      <button
                        disabled={true}
                        className="w-full py-2.5 rounded-full bg-[#F7F6F2] dark:bg-slate-800 text-slate-400 border border-[#E7E5DF] dark:border-slate-700 text-xs font-medium cursor-not-allowed"
                      >
                        Withdraw Released Funds
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Milestone Timeline + Smart Contract + Activity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* Milestone Vertical Timeline (Released, Current, Locked, Locked) */}
                  <div className={`border rounded-2xl p-5 shadow-xs space-y-4 card-3d ${
                    isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white">Milestones</h3>
                      <span className="text-xs font-mono text-[#64748B]">2 / 4 Active</span>
                    </div>

                    <div className="space-y-4 text-xs">
                      {[
                        { title: 'Tranche 1 (20%)', sub: 'Prototype Architecture & BOM', status: 'Released', state: 'done' },
                        { title: 'Tranche 2 (25%)', sub: 'PCB Fabrication & Bench Testing', status: 'Current', state: 'active' },
                        { title: 'Tranche 3 (25%)', sub: 'Beta Deployment', status: 'Locked', state: 'locked' },
                        { title: 'Tranche 4 (30%)', sub: 'Final Testing & Release', status: 'Locked', state: 'locked' },
                      ].map((m) => (
                        <div key={m.title} className="flex items-start space-x-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            m.state === 'done'
                              ? 'bg-[#15966D] text-white' 
                              : m.state === 'active'
                              ? 'border-2 border-[#B88A20] text-[#B88A20] bg-transparent'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {m.state === 'done' ? '✓' : '•'}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-black dark:text-white">{m.title}</div>
                            <div className="text-[11px] text-[#64748B]">{m.sub}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            m.state === 'done'
                              ? 'bg-[#F0FDF4] text-[#15966D] border-[#BBF7D0]'
                              : m.state === 'active'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-[#F7F6F2] dark:bg-slate-800 text-slate-500 border-[#E7E5DF] dark:border-slate-700'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Smart Contract Card */}
                  <div className={`border rounded-2xl p-5 shadow-xs space-y-3.5 card-3d ${
                    isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white">Smart Contract</h3>
                      <ExternalLink className="w-4 h-4 text-[#64748B]" />
                    </div>

                    <div className="space-y-2 text-xs font-mono text-[#64748B]">
                      <div className="flex justify-between">
                        <span>Address</span>
                        <span className="font-semibold text-[#111827] dark:text-slate-200">0x7B2a...4Fa1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network</span>
                        <span className="text-[#15966D] font-semibold flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#15966D]"></span>
                          <span>Sepolia</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Solidity Version</span>
                        <span className="text-[#111827] dark:text-slate-200">0.8.x</span>
                      </div>
                    </div>

                    <a
                      href="https://sepolia.etherscan.io"
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full block text-center py-2 rounded-lg text-xs font-medium border transition-colors ${
                        isDarkMode 
                          ? 'bg-[#111622] hover:bg-[#182030] border-[#20293D] text-slate-200' 
                          : 'bg-[#F7F6F2] hover:bg-slate-100 border-[#E7E5DF] text-[#111827]'
                      }`}
                    >
                      View on Etherscan ↗
                    </a>
                  </div>

                  {/* Recent Activity */}
                  <div className={`border rounded-xl p-5 shadow-xs space-y-3.5 ${
                    isDarkMode ? 'border-[#1C2538] bg-[#0B0E14]' : 'border-[#E7E5DF] bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white">Recent Activity</h3>
                      <button className="text-[11px] text-[#B88A20] hover:underline font-mono">View all →</button>
                    </div>

                    <div className="space-y-2.5 text-xs font-mono">
                      {activities.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                              item.type === 'in' ? 'bg-[#F0FDF4] text-[#15966D]' : 'bg-rose-50 text-[#D64545]'
                            }`}>
                              {item.type === 'in' ? '↑' : '↓'}
                            </span>
                            <div>
                              <div className="font-semibold text-[#111827] dark:text-slate-200">{item.addr}</div>
                              <div className="text-[10px] text-[#64748B]">{item.action}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#64748B]">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
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
