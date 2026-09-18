import React from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, ShieldCheck, ExternalLink, ArrowDownLeft, ArrowUpRight, RefreshCw, AlertTriangle } from 'lucide-react';

export default function WalletManagement() {
  const { 
    account, 
    userRole, 
    connectWallet, 
    disconnectWallet, 
    isSepolia, 
    balance 
  } = useApp();

  const mockTxHistory = [
    { txHash: '0x8f2d...9a12', type: 'Contribution', amount: '2.50 ETH', status: 'Confirmed', time: '10 mins ago', block: 5932014 },
    { txHash: '0x3c7e...b401', type: 'Milestone Unlock', amount: '4.00 ETH', status: 'Confirmed', time: '2 hours ago', block: 5931890 },
    { txHash: '0x1a8f...e829', type: 'Excess Refund', amount: '0.25 ETH', status: 'Confirmed', time: '1 day ago', block: 5928430 }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet & Network Control</h1>
          <p className="text-text-muted mt-1">Manage Sepolia testnet connection, balances, and non-custodial credentials</p>
        </div>
        <div className="flex items-center gap-3">
          {account ? (
            <button
              onClick={disconnectWallet}
              className="px-5 py-2.5 rounded-full border border-red-500/30 text-red-500 hover:bg-red-500/10 text-sm font-semibold transition"
            >
              Disconnect Wallet
            </button>
          ) : (
            <button
              onClick={connectWallet}
              className="px-6 py-2.5 rounded-full bg-accent-gold hover:bg-accent-gold-hover text-black font-semibold text-sm shadow-md transition"
            >
              Connect MetaMask
            </button>
          )}
        </div>
      </div>

      {/* Network Alert if not Sepolia */}
      {!isSepolia && account && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-500">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Incorrect Network:</span> Please switch your wallet network to{' '}
            <span className="font-mono underline">Ethereum Sepolia (Chain ID 11155111)</span>.
          </div>
        </div>
      )}

      {/* Grid: Balance & Account Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Balance */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-text-muted text-sm mb-4">
            <span>Sepolia ETH Balance</span>
            <Wallet className="w-4 h-4 text-accent-gold" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-text-main">
            {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH'}
          </div>
          <div className="mt-4 pt-4 border-t border-border-color flex items-center justify-between text-xs text-text-muted">
            <span>Network: Ethereum Sepolia</span>
            <a 
              href="https://sepoliafaucet.com" 
              target="_blank" 
              rel="noreferrer"
              className="text-accent-gold hover:underline flex items-center gap-1"
            >
              Get Testnet ETH <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Card 2: Connected Account */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-text-muted text-sm mb-4">
            <span>Connected Identity</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-mono font-semibold break-all text-text-main">
            {account || 'Not Connected'}
          </div>
          <div className="mt-4 pt-4 border-t border-border-color flex items-center justify-between text-xs">
            <span className="text-text-muted">Role Permission:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold font-semibold uppercase text-[11px]">
              {userRole}
            </span>
          </div>
        </div>

        {/* Card 3: Security & Custody Rules */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-sm">
          <div className="text-text-muted text-sm mb-2 font-medium">Non-Custodial Escrow</div>
          <p className="text-xs text-text-muted leading-relaxed">
            TrustBridge backend and AI agents hold zero private keys. All transfers, milestone releases, and refunds require explicit cryptographic signatures in your MetaMask wallet.
          </p>
          <div className="mt-4 pt-3 border-t border-border-color text-[11px] text-emerald-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Pull-Payment Escrow Active
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent Wallet Transactions</h2>
          <button className="text-xs text-text-muted hover:text-text-main flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-color text-xs text-text-muted font-medium">
                <th className="pb-3">Type</th>
                <th className="pb-3">Tx Hash</th>
                <th className="pb-3">Block</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {mockTxHistory.map((tx, i) => (
                <tr key={i} className="hover:bg-hover-bg transition text-xs">
                  <td className="py-3.5 font-medium flex items-center gap-2">
                    {tx.type === 'Contribution' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-accent-gold" />
                    )}
                    {tx.type}
                  </td>
                  <td className="py-3.5 font-mono text-accent-gold hover:underline cursor-pointer">
                    {tx.txHash}
                  </td>
                  <td className="py-3.5 font-mono text-text-muted">{tx.block}</td>
                  <td className="py-3.5 font-mono font-semibold">{tx.amount}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-[10px]">
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-text-muted">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
