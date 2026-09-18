import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, BarChart2, Users, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Auth({ isDarkMode = false }) {
  const { loginOrRegister, connectWallet, account, setCurrentView } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  function handleSubmit(e) {
    e.preventDefault();
    loginOrRegister({
      name: name || (isLogin ? 'Verified Backer' : 'Akshar Vikram'),
      email: email || 'user@trustbridge.io',
      role: 'Contributor',
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
      name: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'MetaMask User',
      email: 'wallet@sepolia.eth',
      role: 'Contributor',
      kycStatus: 'Web3 Wallet Verified'
    });
    setCurrentView('Campaign');
  }

  return (
    <div className={`min-h-[calc(100vh-4rem)] w-full flex items-center justify-center px-4 lg:px-12 py-8 relative overflow-hidden transition-colors ${
      isDarkMode ? 'bg-[#090C12] text-slate-100' : 'bg-[#F6F5F0] text-[#111827]'
    }`}>
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Brand Hero Text & Badges */}
        <div className="lg:col-span-4 space-y-6 text-left">
          <div className="text-[11px] font-mono tracking-[0.25em] text-[#64748B] dark:text-slate-400 uppercase font-semibold">
            TRUSTBRIDGE
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.12] text-[#111827] dark:text-white">
            Transparent<br />
            Crowdfunding<br />
            <span className="text-[#0F946F]">for a Better</span><br />
            <span className="text-[#0F946F]">Tomorrow.</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 max-w-sm leading-relaxed">
            Back real ideas with on-chain transparency, AI-powered auditing, and milestone-based escrow on Ethereum Sepolia.
          </p>

          {/* 3 Pills: Secure Escrow, AI Auditing, Real Impact */}
          <div className="flex items-center space-x-3 pt-2">
            <div className="flex items-center space-x-2 bg-white/80 dark:bg-[#131926]/80 backdrop-blur-md px-3 py-2 rounded-xl border border-[#E5E2DC] dark:border-[#232F46] shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#0F946F] flex items-center justify-center">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-[#111827] dark:text-slate-200">Secure<br />Escrow</span>
            </div>

            <div className="flex items-center space-x-2 bg-white/80 dark:bg-[#131926]/80 backdrop-blur-md px-3 py-2 rounded-xl border border-[#E5E2DC] dark:border-[#232F46] shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#0F946F] flex items-center justify-center">
                <BarChart2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-[#111827] dark:text-slate-200">AI<br />Auditing</span>
            </div>

            <div className="flex items-center space-x-2 bg-white/80 dark:bg-[#131926]/80 backdrop-blur-md px-3 py-2 rounded-xl border border-[#E5E2DC] dark:border-[#232F46] shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#0F946F] flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-[#111827] dark:text-slate-200">Real<br />Impact</span>
            </div>
          </div>

          {/* Bottom Slogan Footer */}
          <div className="pt-6 flex items-center space-x-2 text-[10px] font-mono tracking-widest text-[#64748B] dark:text-slate-500 uppercase">
            <span className="w-5 h-0.5 bg-[#0F946F]"></span>
            <span>IDEAS → MILESTONES → IMPACT</span>
          </div>
        </div>

        {/* Center Column: Frosted Glass Login Card */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-full max-w-[400px] bg-white/75 dark:bg-[#101624]/80 backdrop-blur-2xl border border-white/90 dark:border-white/10 rounded-[32px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] space-y-4 relative">
            
            {/* Logo Mark */}
            <div className="w-11 h-11 rounded-2xl bg-[#1A1C20] text-[#D4AF37] border border-[#2D313A] flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
              ⬡
            </div>

            {/* Heading */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold tracking-tight text-[#111827] dark:text-white">
                {isLogin ? 'Welcome to TrustBridge' : 'Create an Account'}
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 max-w-[260px] mx-auto leading-normal">
                {isLogin
                  ? 'Sign in to access your escrow vaults, milestones, and contributions.'
                  : 'Start funding verified projects on Ethereum Sepolia.'}
              </p>
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 text-[#111827] text-xs font-semibold flex items-center justify-center space-x-2.5 border border-[#E5E2DC] shadow-2xs transition active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Continue with MetaMask */}
            <button
              type="button"
              onClick={handleMetaMaskAuth}
              className="w-full py-2.5 px-4 rounded-full bg-[#EAE8E2]/65 dark:bg-[#182030] hover:bg-[#E2DFD8] text-[#111827] dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-[#DDD9D0] dark:border-[#28354E] transition active:scale-[0.99]"
            >
              <span>🦊</span>
              <span>Continue with MetaMask</span>
            </button>

            {/* OR Divider */}
            <div className="flex items-center space-x-3 text-[#94A3B8] text-[10px] font-mono">
              <div className="flex-1 h-px bg-[#E5E2DC] dark:bg-[#20293D]"></div>
              <span>OR</span>
              <div className="flex-1 h-px bg-[#E5E2DC] dark:bg-[#20293D]"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#111827] dark:text-slate-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Akshar Vikram"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#EFECE6]/70 dark:bg-[#151D2C] border border-[#DDD9D0] dark:border-[#232F46] focus:border-[#0F946F] outline-none text-[#111827] dark:text-white placeholder-[#94A3B8]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#111827] dark:text-slate-300">
                  Email Address
                </label>
                <div className="flex items-center px-3 py-2.5 rounded-xl bg-[#EFECE6]/70 dark:bg-[#151D2C] border border-[#DDD9D0] dark:border-[#232F46] focus-within:border-[#0F946F] transition">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8] mr-2 flex-shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@institution.edu"
                    className="w-full text-xs bg-transparent outline-none text-[#111827] dark:text-white placeholder-[#94A3B8]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#111827] dark:text-slate-300">
                  Password
                </label>
                <div className="flex items-center px-3 py-2.5 rounded-xl bg-[#EFECE6]/70 dark:bg-[#151D2C] border border-[#DDD9D0] dark:border-[#232F46] focus-within:border-[#0F946F] transition">
                  <Lock className="w-3.5 h-3.5 text-[#94A3B8] mr-2 flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-transparent outline-none text-[#111827] dark:text-white placeholder-[#94A3B8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-white ml-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-[#0F946F] cursor-pointer"
                  />
                  <span className="text-[#111827] dark:text-slate-300 font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-[#64748B] hover:text-[#111827] dark:hover:text-white font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0F946F] hover:bg-[#0C7B5C] text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition active:scale-[0.99] mt-2 cursor-pointer"
              >
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Toggle Login/Register */}
            <div className="text-center text-[11px] text-[#64748B] dark:text-slate-400 pt-1">
              {isLogin ? "Don't have an account? " : 'Already registered? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#0F946F] hover:underline font-semibold"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Crystal Visual & Floating Tags */}
        <div className="lg:col-span-4 relative flex items-center justify-center">
          <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
            
            {/* Glowing tiered crystal pedestals */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 blur-xl"></div>
            </div>

            {/* Layered Glass Pedestal */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Top Floating Ethereum 3D Prism */}
              <div className="relative w-36 h-48 mb-2 animate-bounce" style={{ animationDuration: '4s' }}>
                <svg viewBox="0 0 100 160" className="w-full h-full drop-shadow-[0_15px_30px_rgba(15,148,111,0.35)]">
                  <defs>
                    <linearGradient id="prismLight" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#DDF3EC" />
                      <stop offset="50%" stopColor="#7CD0B8" />
                      <stop offset="100%" stopColor="#0F946F" />
                    </linearGradient>
                    <linearGradient id="prismDark" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#52B69A" />
                      <stop offset="100%" stopColor="#085B43" />
                    </linearGradient>
                    <linearGradient id="prismMid" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#34A07F" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Top Pyramid Faces */}
                  <polygon points="50,10 20,70 50,90" fill="url(#prismLight)" />
                  <polygon points="50,10 80,70 50,90" fill="url(#prismDark)" />
                  <polygon points="50,10 50,90 40,65" fill="url(#prismMid)" />

                  {/* Bottom Pyramid Faces */}
                  <polygon points="50,100 20,80 50,150" fill="url(#prismLight)" opacity="0.85" />
                  <polygon points="50,100 80,80 50,150" fill="url(#prismDark)" opacity="0.85" />
                </svg>
              </div>

              {/* Tier 1 Glass Disc */}
              <div className="w-48 h-8 rounded-[50%] bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md -mt-6 shadow-lg transform rotate-x-60"></div>
              {/* Tier 2 Glass Disc */}
              <div className="w-56 h-10 rounded-[50%] bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-md -mt-4 shadow-xl"></div>
              {/* Tier 3 Glass Disc */}
              <div className="w-64 h-12 rounded-[50%] bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-md -mt-4 shadow-2xl"></div>
            </div>

            {/* Floating Glass Badges on the right of the crystal */}
            <div className="absolute right-0 top-6 space-y-3 z-20">
              <div className="bg-white/85 dark:bg-[#131B2B]/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/80 dark:border-white/10 shadow-sm text-left max-w-[130px]">
                <div className="text-[11px] font-bold text-[#111827] dark:text-slate-100 leading-tight">
                  Ideas<br />Verified
                </div>
              </div>

              <div className="bg-white/85 dark:bg-[#131B2B]/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/80 dark:border-white/10 shadow-sm text-left max-w-[130px]">
                <div className="text-[11px] font-bold text-[#111827] dark:text-slate-100 leading-tight">
                  Funds<br />Protected
                </div>
              </div>

              <div className="bg-white/85 dark:bg-[#131B2B]/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/80 dark:border-white/10 shadow-sm text-left max-w-[130px]">
                <div className="text-[11px] font-bold text-[#111827] dark:text-slate-100 leading-tight">
                  Builders<br />Empowered
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right Quote */}
          <div className="absolute -bottom-6 right-0 text-right max-w-[200px] space-y-1">
            <p className="text-[11px] text-[#64748B] dark:text-slate-400 italic leading-snug">
              "A more open, fair, and trustworthy internet for builders."
            </p>
            <div className="text-[10px] text-[#0F946F] font-mono">—</div>
          </div>
        </div>

      </div>
    </div>
  );
}
