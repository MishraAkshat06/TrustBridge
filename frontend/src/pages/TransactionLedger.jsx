import React, { useState } from 'react';
import { Layers, Search, ExternalLink, CheckCircle2, ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';

export default function TransactionLedger() {
  const [filter, setFilter] = useState('ALL');

  const events = [
    {
      txHash: '0x9a4b...321c',
      event: 'ContributionReceived',
      actor: '0x12a9...d482',
      amount: '3.50 ETH',
      block: 5932080,
      timestamp: '15 mins ago',
      details: 'Campaign hard cap capacity: 18.00 / 20.00 ETH'
    },
    {
      txHash: '0x4d12...8e91',
      event: 'ExcessRefundIssued',
      actor: '0x12a9...d482',
      amount: '0.50 ETH',
      block: 5932080,
      timestamp: '15 mins ago',
      details: 'In-block automated refund over 20 ETH hard cap'
    },
    {
      txHash: '0x7c81...f201',
      event: 'MilestoneApproved',
      actor: '0x8821...a309 (Verifier)',
      amount: '4.00 ETH (20%)',
      block: 5931750,
      timestamp: '3 hours ago',
      details: 'Milestone 1 Architecture signed & unlocked'
    },
    {
      txHash: '0x2e09...ba33',
      event: 'TrancheWithdrawn',
      actor: '0x71C...3e90 (Creator)',
      amount: '4.00 ETH',
      block: 5931640,
      timestamp: '4 hours ago',
      details: 'Creator executed pull-payment withdrawal'
    },
    {
      txHash: '0x5b3f...ee12',
      event: 'MilestoneSubmitted',
      actor: '0x71C...3e90 (Creator)',
      amount: '-',
      block: 5931500,
      timestamp: '6 hours ago',
      details: 'IPFS CID: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
    }
  ];

  const filteredEvents = filter === 'ALL' ? events : events.filter(e => e.event === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-border-color pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent-gold text-xs font-semibold tracking-wide uppercase mb-1">
            <Layers className="w-4 h-4" /> On-Chain Immutable Audit
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Ledger</h1>
          <p className="text-text-muted mt-1 text-sm">Real-time Sepolia smart contract event stream and verification logs</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {['ALL', 'ContributionReceived', 'MilestoneApproved', 'TrancheWithdrawn'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full transition font-medium ${
                filter === t
                  ? 'bg-accent-gold text-black shadow-sm'
                  : 'bg-card-bg border border-border-color text-text-muted hover:text-text-main'
              }`}
            >
              {t === 'ALL' ? 'All Events' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-card-bg border border-border-color rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-color flex items-center justify-between text-xs text-text-muted">
          <span>Displaying {filteredEvents.length} Verified Sepolia Transactions</span>
          <span className="flex items-center gap-1 text-emerald-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Chain ID: 11155111 (Sepolia)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-color text-xs text-text-muted bg-surface-alt/40">
                <th className="py-3 px-4 font-semibold">Event</th>
                <th className="py-3 px-4 font-semibold">Tx Hash</th>
                <th className="py-3 px-4 font-semibold">Block</th>
                <th className="py-3 px-4 font-semibold">Actor / Address</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Details</th>
                <th className="py-3 px-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredEvents.map((ev, idx) => (
                <tr key={idx} className="hover:bg-hover-bg transition text-xs">
                  <td className="py-4 px-4 font-medium">
                    <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] inline-flex items-center gap-1 ${
                      ev.event === 'ContributionReceived' ? 'bg-emerald-500/15 text-emerald-500' :
                      ev.event === 'MilestoneApproved' ? 'bg-blue-500/15 text-blue-400' :
                      ev.event === 'TrancheWithdrawn' ? 'bg-purple-500/15 text-purple-400' :
                      'bg-accent-gold/15 text-accent-gold'
                    }`}>
                      {ev.event}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-accent-gold hover:underline cursor-pointer">
                    {ev.txHash}
                  </td>
                  <td className="py-4 px-4 font-mono text-text-muted">{ev.block}</td>
                  <td className="py-4 px-4 font-mono text-text-main">{ev.actor}</td>
                  <td className="py-4 px-4 font-mono font-bold text-text-main">{ev.amount}</td>
                  <td className="py-4 px-4 text-text-muted max-w-xs truncate">{ev.details}</td>
                  <td className="py-4 px-4 text-text-muted whitespace-nowrap">{ev.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
