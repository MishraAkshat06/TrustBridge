import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Lock, Mail, ShieldCheck, Wallet } from 'lucide-react';

export default function Auth({ isDarkMode = false }) {
  const { loginOrRegister, connectWallet, account } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Contributor');

  function handleSubmit(e) {
    e.preventDefault();
    loginOrRegister({
      name: name || (isLogin ? 'Verified Backer' : 'Akshar Vikram'),
      email: email || 'user@trustbridge.io',
      role,
      kycStatus: 'Verified (Off-Chain Sandbox)'
    });
  }

  function handleGoogleAuth() {
    loginOrRegister({
      name: 'Google Verified User',
      email: 'user@gmail.com',
      role: 'Contributor',
      kycStatus: 'Google SSO Verified'
    });
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-[#1A1C20] text-[#D4AF37] border border-[#2D313A] flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
          ⬡
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white">
          {isLogin ? 'Sign in to TrustBridge' : 'Create TrustBridge Account'}
        </h1>
        <p className="text-xs text-[#64748B]">
          {isLogin ? 'Access your escrow vaults, milestones, and contributions' : 'Connect wallet or verify off-chain credentials to begin'}
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white dark:bg-[#0E131E] border border-[#E5E2DC] dark:border-[#1E2638] rounded-3xl p-7 shadow-xs space-y-5">
        {/* Google SSO Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full py-3 px-4 rounded-full bg-white hover:bg-slate-50 text-[#111827] text-xs font-semibold flex items-center justify-center space-x-3 border border-[#E5E2DC] shadow-2xs transition-all"
        >
          {/* Google G SVG */}
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
          <span>{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
        </button>

        {/* Wallet Alternative */}
        <button
          type="button"
          onClick={connectWallet}
          className="w-full py-3 px-4 rounded-full bg-[#FAF9F6] dark:bg-[#151B27] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#111827] dark:text-slate-200 text-xs font-semibold font-mono flex items-center justify-center space-x-2 border border-[#E5E2DC] dark:border-[#232D42] transition-colors"
        >
          <span>🦊</span>
          <span>{account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 'Continue with MetaMask'}</span>
        </button>

        <div className="flex items-center space-x-2 text-[#94A3B8] text-[11px] font-mono">
          <div className="flex-1 h-px bg-[#E5E2DC] dark:bg-[#1E2638]"></div>
          <span>OR WITH EMAIL</span>
          <div className="flex-1 h-px bg-[#E5E2DC] dark:bg-[#1E2638]"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-[#111827] dark:text-slate-200">
          {!isLogin && (
            <div>
              <label className="block text-[#64748B] mb-1">FULL NAME *</label>
              <input
                type="text"
                required
                placeholder="Akshar Vikram"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-[#151B27] border border-[#E5E2DC] dark:border-[#232D42] rounded-xl text-[#111827] dark:text-white focus:outline-none focus:border-[#009379] font-normal"
              />
            </div>
          )}

          <div>
            <label className="block text-[#64748B] mb-1">EMAIL ADDRESS *</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF9F6] dark:bg-[#151B27] border border-[#E5E2DC] dark:border-[#232D42] rounded-xl text-[#111827] dark:text-white focus:outline-none focus:border-[#009379] font-normal"
              />
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-[#64748B] mb-1">PASSWORD *</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF9F6] dark:bg-[#151B27] border border-[#E5E2DC] dark:border-[#232D42] rounded-xl text-[#111827] dark:text-white focus:outline-none focus:border-[#009379] font-normal"
              />
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[#64748B] mb-1.5">ACCOUNT TYPE *</label>
              <div className="grid grid-cols-3 gap-2 font-semibold text-center">
                {['Contributor', 'Creator', 'Verifier'].map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-xl border text-xs transition-colors ${
                      role === r 
                        ? 'bg-[#F0FDF4] text-[#009379] border-[#009379] font-bold' 
                        : 'bg-[#FAF9F6] dark:bg-[#151B27] text-[#64748B] border-[#E5E2DC] dark:border-[#232D42]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-[#009379] hover:bg-[#007E67] text-white font-bold text-xs tracking-tight transition-all shadow-sm flex items-center justify-center space-x-1.5 mt-2"
          >
            <span>{isLogin ? 'Sign In' : 'Create Verified Profile'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-[#1E2638]">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-[#64748B] hover:text-[#111827] dark:hover:text-white font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
