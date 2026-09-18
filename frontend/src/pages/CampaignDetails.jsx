import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_CAMPAIGNS } from '../mockData';
import { ShieldCheck, AlertCircle, ExternalLink, Clock, ChevronDown, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { BrowserProvider, Contract, parseEther } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig';

export default function CampaignDetails() {
  const { id } = useParams();
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === id) || MOCK_CAMPAIGNS[0];

  const [contribAmount, setContribAmount] = useState('');
  const [txState, setTxState] = useState('IDLE'); // IDLE, SIGNING, BROADCASTING, CONFIRMED, ERROR
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleContribute() {
    if (!contribAmount || parseFloat(contribAmount) <= 0) return alert('Enter valid ETH amount');
    if (!window.ethereum) return alert('MetaMask required');

    try {
      setTxState('SIGNING');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setTxState('BROADCASTING');
      const tx = await contract.contribute({ value: parseEther(contribAmount) });
      setTxHash(tx.hash);
      
      await tx.wait();
      setTxState('CONFIRMED');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.reason || err.message || 'Transaction failed');
      setTxState('ERROR');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#262F40] pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono mb-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{campaign.category}</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Identity Verified</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{campaign.title}</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">Creator: {campaign.creator}</p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded bg-[#121721] border border-[#262F40] text-slate-300">
            <span className="text-slate-500">SEPOLIA ESCROW: </span>
            <span className="text-blue-400 font-semibold">0x7B2a...4Fa1</span>
          </div>
        </div>
      </div>

      {/* 60 / 40 Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (60% ~ 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overview Card */}
          <div className="bg-[#121721] border border-[#262F40] rounded-lg p-6 space-y-4">
            <h2 className="text-base font-semibold text-white tracking-tight">Campaign Specification & Architecture</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {campaign.summary}
            </p>
            <div className="bg-[#1A2130] border border-[#262F40] rounded p-4 font-mono text-xs text-slate-300 space-y-2">
              <div className="text-slate-400 uppercase tracking-widest text-[10px]">Bill of Materials (BOM) & Specs:</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Nordic nRF52840 SoC + Semtech SX1262 LoRa Transceiver</li>
                <li>ATECC608A Secure Element for on-device key derivation</li>
                <li>Zephyr RTOS microkernel firmware layer</li>
              </ul>
            </div>
          </div>

          {/* AI Decision Support Card */}
          <div className="bg-[#121721] border border-[#262F40] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262F40] pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AI Decision Support Telemetry</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
                {campaign.mlScore}% Success Probability
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-300 leading-relaxed">
                {campaign.riskDetails}
              </div>
              <div className="bg-[#0B0E14] border border-[#262F40] rounded p-3 text-[11px] font-mono text-slate-400">
                <strong className="text-amber-400">DISCLAIMER:</strong> Advisory AI analysis only. Generated via Scikit-Learn launch-time inference. Does not constitute a legal or financial fraud verdict.
              </div>
            </div>
          </div>

          {/* Staged Escrow Timeline */}
          <div className="bg-[#121721] border border-[#262F40] rounded-lg p-6 space-y-4">
            <h3 className="text-base font-semibold text-white tracking-tight">Milestone Escrow Schedule</h3>
            <div className="space-y-3">
              {campaign.milestones.map((m) => (
                <div key={m.id} className="bg-[#1A2130] border border-[#262F40] rounded p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{m.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Release Tranche: {m.percentage}% of Escrow
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                    m.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : m.status === 'UNDER_REVIEW'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (40% ~ 5 cols - Sticky Order Terminal) */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="bg-[#121721] border border-[#262F40] rounded-lg p-6 space-y-5 shadow-xl">
            <div className="border-b border-[#262F40] pb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Live Escrow Telemetry</span>
              <div className="flex justify-between items-baseline mt-1 font-mono">
                <span className="text-2xl font-bold text-white">{campaign.totalRaised.toFixed(2)} ETH</span>
                <span className="text-xs text-slate-400">Hard Cap: {campaign.hardCap.toFixed(2)} ETH</span>
              </div>

              {/* Capacity bar */}
              <div className="w-full h-2 bg-[#1A2130] rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(campaign.totalRaised / campaign.hardCap) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[11px] font-mono mt-2 text-slate-400">
                <span>Goal: {campaign.goal.toFixed(2)} ETH</span>
                <span className="text-emerald-400 font-semibold">{(campaign.hardCap - campaign.totalRaised).toFixed(2)} ETH Remaining</span>
              </div>
            </div>

            {/* In-block refund guarantee badge */}
            <div className="bg-[#0B0E14] border border-[#262F40] rounded p-3 text-[11px] font-mono text-slate-400">
              <span className="text-blue-400 font-semibold">HARD-CAP GUARANTEE:</span> Contributions beyond 20 ETH are automatically split and excess is refunded back to sender in the same block.
            </div>

            {/* Actions Form */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1.5">CONTRIBUTE AMOUNT (ETH):</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    className="flex-1 bg-[#1A2130] border border-[#262F40] rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={() => setContribAmount("0.5")}
                    className="px-2.5 py-1 rounded bg-[#1A2130] border border-[#262F40] text-xs font-mono text-slate-300 hover:text-white"
                  >
                    +0.5
                  </button>
                  <button 
                    onClick={() => setContribAmount("1.0")}
                    className="px-2.5 py-1 rounded bg-[#1A2130] border border-[#262F40] text-xs font-mono text-slate-300 hover:text-white"
                  >
                    +1.0
                  </button>
                </div>
              </div>

              <button
                onClick={handleContribute}
                disabled={txState === 'SIGNING' || txState === 'BROADCASTING'}
                className="w-full py-2.5 rounded bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-slate-950 tracking-tight transition-colors"
              >
                {txState === 'SIGNING' ? 'Waiting for Signature...' : txState === 'BROADCASTING' ? 'Confirming on Sepolia...' : 'Contribute ETH'}
              </button>

              <button
                className="w-full py-2 rounded bg-transparent border border-[#262F40] hover:bg-[#1A2130] text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
              >
                Request Escrow Refund
              </button>
            </div>

            {/* 4-State Transaction Status Drawer */}
            {txState !== 'IDLE' && (
              <div className="border border-[#262F40] bg-[#0B0E14] rounded p-3 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">STATUS:</span>
                  <span className={txState === 'CONFIRMED' ? 'text-emerald-400' : txState === 'ERROR' ? 'text-rose-400' : 'text-blue-400'}>
                    {txState}
                  </span>
                </div>
                {txHash && (
                  <div className="text-[11px] text-slate-500 truncate">
                    TX: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{txHash}</a>
                  </div>
                )}
                {errorMessage && (
                  <div className="text-[11px] text-rose-400">{errorMessage}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
