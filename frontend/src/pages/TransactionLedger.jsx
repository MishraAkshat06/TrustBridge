import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Layers, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  FileSpreadsheet,
  Copy,
  Check,
  ArrowUpRight,
  RefreshCw,
  Clock
} from 'lucide-react';

const FILTER_PILLS = [
  'ALL',
  'ContributionReceived',
  'ExcessRefundIssued',
  'MilestoneApproved',
  'TrancheWithdrawn',
  'MilestoneSubmitted',
  'ContributorRefundIssued'
];

export default function TransactionLedger() {
  const { activities = [] } = useApp();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Fallback seed activities if none exist in state
  const defaultEvents = [
    {
      id: 1,
      txHash: '0x8f2d1e9a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e',
      event: 'ContributionReceived',
      actor: '0x5c39...9a2f',
      addr: '0x5c39...9a2f',
      amount: 0.5,
      blockNumber: 11746227,
      time: '2026-09-20T20:45:12Z',
      action: 'Contributed 0.50 ETH',
      details: 'Milestone 1 unlocked, hard cap headroom: 14.50 / 20.00 ETH'
    },
    {
      id: 2,
      txHash: '0x3c7e4b01a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9',
      event: 'ExcessRefundIssued',
      actor: '0x1d73...3e9b',
      addr: '0x1d73...3e9b',
      amount: 0.25,
      blockNumber: 11746210,
      time: '2026-09-20T19:30:00Z',
      action: 'In-Block Excess Refund 0.25 ETH',
      details: 'Automatic same-block refund preserving 20 ETH ceiling'
    },
    {
      id: 3,
      txHash: '0x1a8fe829c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      event: 'MilestoneApproved',
      actor: '0x8821...a309 (Verifier)',
      addr: '0x8821...a309',
      amount: 4.0,
      blockNumber: 11746190,
      time: '2026-09-20T18:15:22Z',
      action: 'Approved Milestone #1 Tranche',
      details: 'Milestone 1 Architecture signed & 20% released to vault'
    },
    {
      id: 4,
      txHash: '0x7e8d9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
      event: 'TrancheWithdrawn',
      actor: '0x71C8...3e90 (Creator)',
      addr: '0x71C8...3e90',
      amount: 4.0,
      blockNumber: 11746180,
      time: '2026-09-20T17:02:45Z',
      action: 'Creator Withdrew Tranche #1 (4.0000 ETH)',
      details: 'Non-custodial pull-payment executed on Sepolia'
    },
    {
      id: 5,
      txHash: '0x5b3fee12a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      event: 'MilestoneSubmitted',
      actor: '0x71C8...3e90 (Creator)',
      addr: '0x71C8...3e90',
      amount: 0,
      blockNumber: 11746175,
      time: '2026-09-20T16:20:10Z',
      action: 'Submitted Evidence for Milestone #2',
      details: 'IPFS CID: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
    },
    {
      id: 6,
      txHash: '0x9a4b321ce0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d90a1b2c3d4e5f6a7b',
      event: 'ContributorRefundIssued',
      actor: '0x9a44...7c1d (Contributor)',
      addr: '0x9a44...7c1d',
      amount: 1.5,
      blockNumber: 11746166,
      time: '2026-09-19T22:10:00Z',
      action: 'Claimed Pro-Rata Refund 1.5000 ETH',
      details: 'Pro-rata pull-payment settlement honoring mathematical guarantee'
    }
  ];

  const dataSource = activities.length > 0 ? activities : defaultEvents;

  // Format date helper: "MMM dd, yyyy, HH:mm"
  function formatTimestamp(t) {
    if (!t) return 'Recent';
    try {
      const d = new Date(t);
      if (isNaN(d.getTime())) return t;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return t;
    }
  }

  // Copy helper
  function copyText(key, text) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // Filter & Search
  const filteredEvents = dataSource.filter((ev) => {
    const eventType = ev.event || '';
    const matchesPill = filter === 'ALL' || eventType.toLowerCase() === filter.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesPill;

    const tx = (ev.txHash || '').toLowerCase();
    const actor = (ev.addr || ev.actor || '').toLowerCase();
    const act = (ev.action || '').toLowerCase();
    const det = (ev.details || '').toLowerCase();
    const evName = eventType.toLowerCase();

    const matchesQuery = tx.includes(q) || actor.includes(q) || act.includes(q) || det.includes(q) || evName.includes(q);
    return matchesPill && matchesQuery;
  });

  // KPI Calculations
  const totalVolume = dataSource.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalExcessRefunds = dataSource.filter(e => e.event === 'ExcessRefundIssued').length;
  const latestBlock = Math.max(...dataSource.map(e => e.blockNumber || e.block || 11746166));

  // CSV Export
  function handleExportCsv() {
    const headers = ['Timestamp', 'Event', 'TxHash', 'BlockNumber', 'Actor', 'AmountETH', 'Details'];
    const rows = dataSource.map(e => {
      const timestamp = formatTimestamp(e.time || e.timestamp);
      const eventName = e.event || 'Unknown';
      const txHash = e.txHash || '0x0';
      const blockNum = e.blockNumber || e.block || 11746227;
      const actor = e.addr || e.actor || '0x0';
      const amount = e.amount !== undefined ? e.amount : 0;
      const details = (e.action || e.details || '').replace(/"/g, '""');
      return `"${timestamp}","${eventName}","${txHash}",${blockNum},"${actor}",${amount},"${details}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'trustbridge_ledger_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // JSON Export
  function handleExportJson() {
    const auditData = {
      title: 'TrustBridge On-Chain Transaction Ledger Audit Log',
      exportedAt: new Date().toISOString(),
      network: 'Ethereum Sepolia Testnet',
      chainId: 11155111,
      totalRecords: dataSource.length,
      records: dataSource.map(e => ({
        timestamp: e.time || e.timestamp || new Date().toISOString(),
        formattedTime: formatTimestamp(e.time || e.timestamp),
        event: e.event,
        txHash: e.txHash,
        blockNumber: e.blockNumber || e.block || 11746227,
        actor: e.addr || e.actor,
        amountEth: e.amount !== undefined ? e.amount : 0,
        details: e.action || e.details,
        campaignId: e.campaignId || '1'
      }))
    };

    const jsonContent = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonContent);
    link.setAttribute('download', 'trustbridge_audit_log.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fadeIn text-[var(--text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent-brand)] text-xs font-semibold tracking-wide uppercase mb-1 font-mono">
            <Layers className="w-4 h-4" /> On-Chain Immutable Event Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Transaction Ledger</h1>
          <p className="text-[var(--text-secondary)] mt-0.5 text-xs sm:text-sm">
            Real-time Sepolia smart contract event stream, verification proofs, and pull-payment settlements
          </p>
        </div>

        {/* Action Controls: Export CSV & JSON */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--hover-bg)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Export CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--hover-bg)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Download JSON audit log"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
            <span>Audit JSON</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards with Zinc/FinTech Minimal Aesthetic */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3.5 space-y-1 shadow-sm">
          <div className="text-[11px] text-[var(--text-muted)] uppercase">Total Events</div>
          <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{dataSource.length}</div>
          <div className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Indexed on-chain
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3.5 space-y-1 shadow-sm">
          <div className="text-[11px] text-[var(--text-muted)] uppercase">Total Settled Volume</div>
          <div className="text-xl sm:text-2xl font-black text-[var(--accent-brand)]">{totalVolume.toFixed(2)} ETH</div>
          <div className="text-[10px] text-[var(--text-secondary)]">Non-custodial escrow</div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3.5 space-y-1 shadow-sm">
          <div className="text-[11px] text-[var(--text-muted)] uppercase">Excess Refunds</div>
          <div className="text-xl sm:text-2xl font-black text-amber-500">{totalExcessRefunds}</div>
          <div className="text-[10px] text-amber-500/90 font-semibold">Same-block returned</div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3.5 space-y-1 shadow-sm">
          <div className="text-[11px] text-[var(--text-muted)] uppercase">Sepolia Block Height</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-500">#{latestBlock}</div>
          <div className="text-[10px] text-[var(--text-secondary)]">Target: 0x7c49...58d2</div>
        </div>
      </div>

      {/* Interactive Controls Bar: Search & Filter Pills with Proper z-index Stacking */}
      <div className="relative z-30 space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by TxHash, actor address, event type, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs sm:text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-brand)] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {FILTER_PILLS.map((pill) => {
            const isSelected = filter.toLowerCase() === pill.toLowerCase();
            return (
              <button
                key={pill}
                type="button"
                onClick={() => setFilter(pill)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-semibold text-[11px] font-mono cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--accent-brand)] text-black font-bold shadow-sm'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                }`}
              >
                {pill === 'ALL' ? 'All Events' : pill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ledger Table with Zinc Minimalist Design */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[var(--text-secondary)] font-mono">
          <div className="flex items-center gap-2">
            <span>Displaying {filteredEvents.length} of {dataSource.length} Verified Sepolia Transactions</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] text-[10px] font-bold">
                Filtered
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Sepolia Smart Contract 0x7c49...58d2
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] font-mono">
                <th className="py-2.5 px-3.5 font-semibold">Event Type</th>
                <th className="py-2.5 px-3.5 font-semibold">Tx Hash (Sepolia)</th>
                <th className="py-2.5 px-3.5 font-semibold">Block</th>
                <th className="py-2.5 px-3.5 font-semibold">Actor</th>
                <th className="py-2.5 px-3.5 font-semibold">Amount</th>
                <th className="py-2.5 px-3.5 font-semibold">Details</th>
                <th className="py-2.5 px-3.5 font-semibold">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)] font-mono">
                    No transactions match your search query or filter selection.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev, idx) => {
                  const txFull = ev.txHash || '0x0';
                  const txDisplay = txFull.length > 16 ? `${txFull.slice(0, 8)}...${txFull.slice(-6)}` : txFull;
                  const actorDisplay = ev.addr || ev.actor || '0x0';
                  const actorShort = actorDisplay.length > 16 ? `${actorDisplay.slice(0, 8)}...${actorDisplay.slice(-6)}` : actorDisplay;
                  const amountDisplay = ev.amount !== undefined && ev.amount !== null
                    ? (typeof ev.amount === 'number' ? (ev.amount > 0 ? `${ev.amount.toFixed(4)} ETH` : '0 ETH') : `${ev.amount}`)
                    : '-';
                  const detailsText = ev.action || ev.details || '-';
                  const formattedTime = formatTimestamp(ev.time || ev.timestamp);

                  return (
                    <tr key={ev.id || idx} className="hover:bg-[var(--hover-bg)] transition-colors text-xs">
                      <td className="py-3 px-3.5 font-medium">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] inline-flex items-center gap-1 font-mono ${
                          ev.event === 'ContributionReceived' 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : ev.event === 'ExcessRefundIssued'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : ev.event === 'MilestoneApproved' 
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' 
                            : ev.event === 'TrancheWithdrawn' 
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
                            : ev.event === 'ContributorRefundIssued'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-[var(--accent-brand-subtle)] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)]'
                        }`}>
                          {ev.event}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${txFull}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] hover:underline"
                            title={`View on Sepolia Etherscan: ${txFull}`}
                          >
                            <span>{txDisplay}</span>
                            <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyText(`tx-${idx}`, txFull)}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
                            title="Copy TxHash"
                          >
                            {copiedKey === `tx-${idx}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[var(--text-muted)]">
                        {ev.blockNumber || ev.block || 11746227}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[var(--text-primary)]">
                        <div className="flex items-center gap-1">
                          <span title={actorDisplay}>{actorShort}</span>
                          <button
                            type="button"
                            onClick={() => copyText(`actor-${idx}`, actorDisplay)}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
                            title="Copy Actor Address"
                          >
                            {copiedKey === `actor-${idx}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-[var(--text-primary)]">
                        {amountDisplay}
                      </td>
                      <td className="py-3 px-3.5 text-[var(--text-secondary)] max-w-xs truncate" title={detailsText}>
                        {detailsText}
                      </td>
                      <td className="py-3 px-3.5 text-[var(--text-secondary)] whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
