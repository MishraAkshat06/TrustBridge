import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Activity, Wallet, CheckCircle2 } from 'lucide-react';
import { BrowserProvider } from 'ethers';

import { useApp } from '../context/AppContext';

export default function Navbar() {
  const [account, setAccount] = useState('');
  const location = useLocation();
  const appContext = useApp();
  const user = appContext?.user;
  const isAuthenticated = Boolean(user);

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);
      } catch (err) {
        console.error(err);
      }
    }
  }

  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      setAccount(window.ethereum.selectedAddress);
    }
  }, []);

  const publicLinks = [
    { name: 'Protocol', path: '/' },
    { name: 'Explore', path: '/explore' },
    { name: 'Docs', path: '/docs' }
  ];

  const protectedLinks = [
    { name: 'Vault Hub', path: '/dashboard/creator' },
    { name: 'Portfolio', path: '/dashboard/contributor' },
    { name: 'Verifier', path: '/verifier' },
    { name: 'Wallet', path: '/wallet' },
    { name: 'Create', path: '/campaigns/create' }
  ];

  const visibleLinks = isAuthenticated
    ? [...publicLinks.slice(0, 2), ...protectedLinks, publicLinks[2]]
    : publicLinks;

  return (
    <header className="sticky top-0 z-50 bg-[#0B0E14]/90 backdrop-blur-md border-b border-[#262F40]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-mono font-bold text-white text-sm">
            TB
          </div>
          <div>
            <span className="font-semibold tracking-tight text-white text-lg">TrustBridge</span>
            <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Sepolia v1.0
            </span>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {visibleLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded text-xs font-medium tracking-tight transition-colors ${
                  active 
                    ? 'text-white bg-[#1A2130] border border-[#262F40]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121721]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Telemetry & Wallet (Gated: only when authenticated) */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#121721] border border-[#262F40] text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sepolia 11155111</span>
          </div>

          {isAuthenticated ? (
            account ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-[#1A2130] border border-[#262F40] font-mono text-xs text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </button>
            )
          ) : (
            <Link
              to="/auth"
              className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700 shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
