import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  ShieldCheck, 
  BarChart2, 
  Users, 
  Eye, 
  EyeOff, 
  Shield
} from 'lucide-react';

export default function Auth({ isDarkMode = false }) {
  const { loginOrRegister, connectWallet, account, setCurrentView } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Contributor');

  function handleSubmit(e) {
    e.preventDefault();
    loginOrRegister({
      name: name || (isLogin ? 'Verified Backer' : 'Akshar Vikram'),
      email: email || 'user@institution.edu',
      role,
      kycStatus: 'Verified (Off-Chain Sandbox)'
    });
    setCurrentView('Campaign');
  }

  function handleGoogleAuth() {
    loginOrRegister({
      name: 'Google Verified User',
      email: 'user@gmail.com',
      role: 'Contributor',
      kycStatus: 'Google SSO Verified'
    });
    setCurrentView('Campaign');
  }

  function handleMetaMaskAuth() {
    connectWallet();
    loginOrRegister({
      name: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0x7B2a...4Fa1',
      email: 'web3@sepolia.eth',
      role: 'Contributor',
      kycStatus: 'MetaMask Verified'
    });
    setCurrentView('Campaign');
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-gradient-to-br from-[#FAF9F5] via-[#F3F0E8] to-[#E8E4D9] dark:from-[#080B11] dark:via-[#0E131E] dark:to-[#080A0F] text-[#0F172A] dark:text-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-10 transition-colors duration-300">
      
      {/* Ambient background soft light rays and glowing refraction */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute top-1/3 -right-24 w-[500px] h-[500px] rounded-full bg-amber-400/10 blur-3xl"></div>
        <div className="absolute -bottom-20 left-1/3 w-[600px] h-[400px] rounded-full bg-emerald-600/5 blur-3xl"></div>
        {/* Subtle geometric grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Hero Pitch & Bold Black Headings */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6 text-left">
          {/* Micro Tag */}
          <div className="text-[11px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            TRUSTBRIDGE
          </div>

          {/* Big Bold Headings in BLACK with Emerald Green Accent */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black dark:text-white leading-[1.12]">
            Transparent<br />
            Crowdfunding<br />
            <span className="text-[#15966D]">
              for a Better<br />
              Tomorrow.
            </span>
          </h1>

          {/* Subtitle Paragraph */}
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed font-normal">
            Back real ideas with on-chain transparency, AI-powered auditing, and milestone-based escrow on Ethereum Sepolia.
          </p>

          {/* 3 Feature Pills */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 backdrop-blur-md shadow-xs text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Shield className="w-4 h-4 text-[#15966D]" />
              <span>Secure Escrow</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 backdrop-blur-md shadow-xs text-xs font-semibold text-slate-800 dark:text-slate-200">
              <BarChart2 className="w-4 h-4 text-[#15966D]" />
              <span>AI Auditing</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 backdrop-blur-md shadow-xs text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Users className="w-4 h-4 text-[#15966D]" />
              <span>Real Impact</span>
            </div>
          </div>

          {/* Bottom Milestone Loop */}
          <div className="pt-6 border-t border-slate-300/50 dark:border-slate-800 flex items-center gap-3 text-[11px] font-mono tracking-widest text-slate-500 uppercase">
            <span className="w-4 h-0.5 bg-[#15966D]"></span>
            <span>IDEAS &nbsp;→&nbsp; MILESTONES &nbsp;→&nbsp; IMPACT</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: Floating Glassmorphism Login Card */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[420px] bg-white/85 dark:bg-[#0E131E]/90 backdrop-blur-2xl border border-white/90 dark:border-slate-700/60 rounded-[32px] p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] relative">
            
            {/* Top Brand Hex Cube */}
            <div className="w-12 h-12 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-center mx-auto mb-3.5 shadow-md">
              <span className="text-xl text-[#D4AF37] font-bold">⬡</span>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1 mb-5">
              <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">
                {isLogin ? 'Welcome to TrustBridge' : 'Create TrustBridge Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                {isLogin 
                  ? 'Sign in to access your escrow vaults, milestones, and contributions.' 
                  : 'Register credentials to explore, fund, or launch on Sepolia.'}
              </p>
            </div>

            {/* Social Authentication Buttons */}
            <div className="space-y-2.5 mb-4">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3 px-4 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-[0.99]"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* MetaMask Button */}
              <button
                type="button"
                onClick={handleMetaMaskAuth}
                className="w-full py-3 px-4 rounded-full bg-[#EFEFED] dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-3 border border-slate-200/80 dark:border-slate-700 transition-all active:scale-[0.99]"
              >
                <span className="text-base">🦊</span>
                <span>{account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 'Continue with MetaMask'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-slate-200/80 dark:bg-slate-700"></div>
              <span className="px-3 text-[10px] font-semibold text-slate-400 tracking-wider">OR</span>
              <div className="flex-1 h-px bg-slate-200/80 dark:bg-slate-700"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Akshar Vikram"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#EBEBE8]/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#15966D]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#EBEBE8]/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#15966D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#EBEBE8]/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#15966D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Role Permission</label>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                    {['Contributor', 'Creator', 'Verifier'].map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`py-1.5 rounded-xl border transition ${
                          role === r
                            ? 'bg-[#15966D]/15 text-[#15966D] border-[#15966D]'
                            : 'bg-white/60 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#15966D] accent-[#15966D] border-slate-300 focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password recovery instructions sent to your email.')}
                  className="text-slate-600 hover:text-[#15966D] dark:text-slate-400 transition"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 bg-[#15966D] hover:bg-[#117C5A] text-white rounded-full font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Login/Sign Up */}
            <div className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400">
              <span>{isLogin ? "Don't have an account? " : 'Already have an account? '}</span>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-[#15966D] hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 3D Crystal & Floating Glass Cards */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 relative flex flex-col items-center justify-center space-y-6">
          
          {/* 3D Ethereum Crystal Diamond & Pedestal */}
          <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
            {/* Glowing refraction glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 to-amber-300/20 blur-2xl"></div>

            {/* Layered Glass Pedestal */}
            <div className="absolute bottom-4 w-48 h-8 rounded-full bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-md shadow-lg transform rotate-x-60"></div>
            <div className="absolute bottom-8 w-40 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md shadow-md"></div>
            <div className="absolute bottom-12 w-32 h-6 rounded-full bg-emerald-500/25 border border-emerald-300/50 backdrop-blur-md shadow-sm"></div>

            {/* 3D Ethereum Diamond Crystal */}
            <div className="relative z-10 w-32 h-44 filter drop-shadow-[0_20px_25px_rgba(21,150,109,0.35)] transform hover:scale-105 transition-transform duration-500">
              <svg viewBox="0 0 100 120" className="w-full h-full">
                <polygon points="50,5 15,55 50,75 85,55" fill="url(#crystalTop)" />
                <polygon points="50,75 15,55 50,115" fill="url(#crystalBottomLeft)" />
                <polygon points="50,75 85,55 50,115" fill="url(#crystalBottomRight)" />
                
                <defs>
                  <linearGradient id="crystalTop" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E6F7F0" />
                    <stop offset="40%" stopColor="#5CD2A8" />
                    <stop offset="100%" stopColor="#15966D" />
                  </linearGradient>
                  <linearGradient id="crystalBottomLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0E684C" />
                    <stop offset="100%" stopColor="#073B2B" />
                  </linearGradient>
                  <linearGradient id="crystalBottomRight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#25B888" />
                    <stop offset="100%" stopColor="#15966D" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* 3 Floating Frosted Glass Cards */}
          <div className="w-full space-y-2.5 max-w-[200px]">
            <div className="px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 backdrop-blur-md shadow-xs text-center text-xs font-bold text-slate-800 dark:text-slate-200">
              Ideas Verified
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 backdrop-blur-md shadow-xs text-center text-xs font-bold text-slate-800 dark:text-slate-200">
              Funds Protected
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 backdrop-blur-md shadow-xs text-center text-xs font-bold text-slate-800 dark:text-slate-200">
              Builders Empowered
            </div>
          </div>

          {/* Bottom Right Quote */}
          <div className="text-right pt-4 border-t border-slate-300/40 dark:border-slate-800 w-full max-w-[220px]">
            <p className="text-[11px] italic text-slate-500 dark:text-slate-400 leading-relaxed">
              "A more open, fair, and trustworthy internet for builders."
            </p>
            <div className="w-6 h-0.5 bg-slate-400 mt-1 ml-auto"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
