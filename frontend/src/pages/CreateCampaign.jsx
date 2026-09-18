import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function CreateCampaign() {
  const { createCampaign, setCurrentView } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hardware / IoT');
  const [summary, setSummary] = useState('');
  const [goal, setGoal] = useState('10');
  const [evaluating, setEvaluating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  function handleAiPreCheck() {
    setEvaluating(true);
    setTimeout(() => {
      setAiAnalysis({
        score: 86,
        risk: 'LOW',
        feedback: 'Budget matches milestone complexity. Deliverables are measurable and suitable for escrow release.'
      });
      setEvaluating(false);
    }, 600);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title || !summary) return alert('Fill in required fields');
    createCampaign({ title, category, summary, goal });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Launch Escrow Campaign</h2>
          <p className="text-xs text-slate-500">Configure your project specs, funding milestones, and request AI validation</p>
        </div>
        <button
          onClick={() => setCurrentView('Explore')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="space-y-4 text-xs font-medium text-slate-700">
          <div>
            <label className="block text-slate-600 mb-1">CAMPAIGN TITLE *</label>
            <input
              type="text"
              required
              placeholder="e.g. NextGen Micro-Hydro Generator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 mb-1">CATEGORY</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option>Hardware / IoT</option>
                <option>Cleantech</option>
                <option>Open Source / Web3</option>
                <option>Biotech</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">TARGET GOAL (ETH) * [Hard Cap: 20 ETH]</label>
              <input
                type="number"
                min="5"
                max="20"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1">PITCH & TECHNICAL ARCHITECTURE *</label>
            <textarea
              rows={4}
              required
              placeholder="Detail hardware specs, firmware architecture, component BOM, and testing roadmap..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* AI Pre-Validation Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Pre-Launch AI Audit Check</span>
            </div>
            <button
              type="button"
              onClick={handleAiPreCheck}
              disabled={evaluating || !title}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              {evaluating ? 'Analyzing Specs...' : 'Run Feasibility Check'}
            </button>
          </div>

          {aiAnalysis && (
            <div className="pt-2 border-t border-slate-200/60 text-xs font-mono space-y-1">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AI Prediction Score: {aiAnalysis.score}% Success Prob | {aiAnalysis.risk} Risk Profile</span>
              </div>
              <p className="text-[11px] text-slate-500">{aiAnalysis.feedback}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-tight transition-colors shadow-sm"
        >
          Publish Campaign to Escrow
        </button>
      </form>
    </div>
  );
}
