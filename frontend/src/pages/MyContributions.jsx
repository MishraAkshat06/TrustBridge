import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeartHandshake, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MyContributions() {
  const { myContributions, requestRefund, setCurrentView, setActiveCampaignId } = useApp();
  const [statusMsg, setStatusMsg] = useState('');

  function handleRefundClick(id) {
    const res = requestRefund(id);
    setStatusMsg(res.msg);
    setTimeout(() => setStatusMsg(''), 4000);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">My Backer Vault & Contributions</h2>
        <p className="text-xs text-slate-500">Track your escrowed ETH, milestone progress, and exercise instant smart-contract refund rights</p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {myContributions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No active contributions found</h3>
          <p className="text-xs text-slate-400">Discover and support milestone-verified hardware and software campaigns.</p>
          <button
            onClick={() => setCurrentView('Explore')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
          >
            Explore Projects
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myContributions.map((item) => (
            <div
              key={item.campaignId}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900">{item.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono">
                    {item.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Total Backed: <strong className="text-slate-900">{item.amount.toFixed(2)} ETH</strong>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setActiveCampaignId(item.campaignId);
                    setCurrentView('Campaign');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                >
                  View Details
                </button>

                <button
                  onClick={() => handleRefundClick(item.campaignId)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Request Refund</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
