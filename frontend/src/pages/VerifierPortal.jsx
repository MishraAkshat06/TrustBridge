import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Check, 
  X, 
  AlertTriangle, 
  ExternalLink, 
  Layers, 
  FileText, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Info 
} from 'lucide-react';

export default function VerifierPortal() {
  const { campaigns = [], approveMilestone, rejectMilestone } = useApp();
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id || '1');
  const [activeNotice, setActiveNotice] = useState('');
  const [noticeType, setNoticeType] = useState('success'); // 'success' | 'warning' | 'error'
  const [copiedCid, setCopiedCid] = useState(false);

  // Defensive campaign selection
  const targetCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0] || {
    id: '1',
    title: 'AuraMesh: Decentralized IoT Edge Sensing Node',
    category: 'Hardware / IoT',
    state: 'ACTIVE',
    totalRaised: 14.5,
    hardCap: 20.0,
    milestones: []
  };

  const milestones = targetCampaign?.milestones || [];
  
  // Find currently active or under-review milestone
  const defaultMilestoneId = milestones.find(m => m.status === 'UNDER_REVIEW')?.id 
    || milestones.find(m => m.status === 'PENDING')?.id 
    || milestones[0]?.id 
    || 1;

  const [selectedMilestoneId, setSelectedMilestoneId] = useState(defaultMilestoneId);

  const targetMilestone = milestones.find(m => m.id === selectedMilestoneId) || milestones[0] || {
    id: 2,
    title: 'PCB Fabrication & Bench Testing Deliverable',
    percentage: 25,
    status: 'UNDER_REVIEW',
    attempts: 1,
    evidence: 'https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
  };

  const ipfsCid = targetMilestone.evidence?.includes('ipfs/') 
    ? targetMilestone.evidence.split('ipfs/')[1] 
    : 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

  function handleCopyCid() {
    navigator.clipboard.writeText(ipfsCid);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  }

  function handleApprove() {
    if (!targetCampaign || !targetMilestone) return;
    const res = approveMilestone(targetCampaign.id, targetMilestone.id);
    setNoticeType('success');
    setActiveNotice(`Signed Consensus Approval for Tranche #${targetMilestone.id} (${targetMilestone.percentage || 25}%) on Sepolia! Funds unlocked.`);
    setTimeout(() => setActiveNotice(''), 6000);
  }

  function handleReject() {
    if (!targetCampaign || !targetMilestone) return;
    const res = rejectMilestone(targetCampaign.id, targetMilestone.id, 'Deliverable benchmarks did not satisfy consensus requirements');
    if (res?.isFinal) {
      setNoticeType('error');
      setActiveNotice(`Final Rejection executed for Tranche #${targetMilestone.id}. Grace period exhausted. Campaign transitioned to REFUNDABLE mode.`);
    } else {
      setNoticeType('warning');
      setActiveNotice(`Tranche #${targetMilestone.id} rejected with 1-retry grace period. Creator notified to submit updated evidence.`);
    }
    setTimeout(() => setActiveNotice(''), 6000);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>AUTHORIZED VERIFIER AUDIT CHAMBER</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Milestone Audit & Tranche Signer</h2>
          <p className="text-xs text-[var(--text-secondary)]">Cross-reference AI code analysis and IPFS evidence to authorize decentralized escrow releases</p>
        </div>

        {/* Multi-Campaign Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-muted)]">Campaign:</span>
          <select
            value={selectedCampaignId}
            onChange={(e) => {
              setSelectedCampaignId(e.target.value);
              const camp = campaigns.find(c => c.id === e.target.value);
              const nextM = camp?.milestones?.find(m => m.status === 'UNDER_REVIEW') || camp?.milestones?.[0];
              if (nextM) setSelectedMilestoneId(nextM.id);
            }}
            className="px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
          >
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                #{c.id} - {c.title.slice(0, 32)}... ({c.totalRaised?.toFixed(1)} ETH)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice Banner */}
      {activeNotice && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-start gap-2.5 transition animate-fadeIn ${
          noticeType === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
            : noticeType === 'error'
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400'
            : 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400'
        }`}>
          {noticeType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : noticeType === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{activeNotice}</span>
        </div>
      )}

      {/* Milestone Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {milestones.map((m, idx) => {
          const isSelected = m.id === selectedMilestoneId;
          const isApproved = m.status === 'APPROVED' || m.status === 'COMPLETED' || m.status === 'CLAIMED';
          const isReview = m.status === 'UNDER_REVIEW';
          const isRejected = m.status === 'REJECTED_RETRY' || m.status === 'FINAL_REJECTED';

          return (
            <button
              type="button"
              key={m.id || idx + 1}
              onClick={() => setSelectedMilestoneId(m.id)}
              className={`flex-1 min-w-[140px] p-3 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent-brand-subtle)] border-[var(--accent-brand)] shadow-xs'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="font-semibold text-[var(--text-muted)]">Tranche #{m.id || idx + 1}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                  isApproved 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : isReview
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : isRejected
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]'
                }`}>
                  {m.status ? m.status.replace('_', ' ') : 'PENDING'}
                </span>
              </div>
              <div className="text-xs font-bold truncate text-[var(--text-primary)]">{m.title}</div>
              <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">{m.percentage || 25}% Allocation</div>
            </button>
          );
        })}
      </div>

      {/* Main Chamber Inspection Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-4 gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">AUDIT CANDIDATE:</div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{targetCampaign.title}</h3>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
              Tranche {targetMilestone.id}: {targetMilestone.title} ({targetMilestone.percentage || 25}% of 20 ETH Cap = {((20 * (targetMilestone.percentage || 25)) / 100).toFixed(2)} ETH)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
              targetMilestone.status === 'UNDER_REVIEW'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : targetMilestone.status === 'APPROVED' || targetMilestone.status === 'CLAIMED'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : targetMilestone.status === 'REJECTED_RETRY'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}>
              {targetMilestone.status ? targetMilestone.status.replace('_', ' ') : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Deliverables & Evidence IPFS Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* IPFS CID Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--accent-brand)]" />
                <span className="font-semibold uppercase text-[10px]">Cryptographic Proof (IPFS CID)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCid}
                className="hover:text-[var(--text-primary)] flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {copiedCid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCid ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs break-all text-[var(--text-primary)] bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-subtle)]">
              {ipfsCid}
            </div>
            {targetMilestone.evidence && (
              <a
                href={targetMilestone.evidence}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)] hover:underline pt-1"
              >
                <span>Inspect Repository / Gateway Artifacts</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Grace Period & Attempt Counter */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold uppercase text-[10px]">Submission & Retry Status</span>
              </span>
              <span className="text-[11px] font-bold text-[var(--text-primary)]">
                Attempt {targetMilestone.attempts || 1} of 2
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Max Allowed Retries:</span>
                <span className="font-bold text-[var(--text-primary)]">1 Grace Period</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Current Grace State:</span>
                <span className={`font-semibold ${
                  (targetMilestone.attempts || 1) >= 2 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {(targetMilestone.attempts || 1) >= 2 ? 'Final Attempt' : '1 Retry Available'}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              If rejected on attempt 2, the smart contract locks pro-rata refund mode for all backers.
            </div>
          </div>
        </div>

        {/* AI Evidence Audit Report */}
        <div className="p-4 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] rounded-xl space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between text-[var(--text-primary)] font-bold">
            <span>AI Automated Evidence Extraction:</span>
            <span className="text-[11px] text-[var(--text-muted)]">NVIDIA Nemotron Reviewer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <div className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Verified Artifacts:</div>
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Gerber layout files verified in public repository</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Nordic SDK build passes CI unit test suite</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Items for Human Signer:</div>
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Inspect bench video demo timestamp (868MHz band test)</span>
              </div>
            </div>
          </div>

          {/* Mandatory Advisory Notice Banner */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-600 dark:text-amber-400 text-xs leading-relaxed font-normal">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="font-bold">Advisory Notice:</strong> This is an AI-generated advisory assessment and not a financial verdict.
            </span>
          </div>
        </div>

        {/* Verifier Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)] font-mono">
            Requires authorized verifier cryptographic signature
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReject}
              disabled={targetMilestone.status === 'APPROVED' || targetMilestone.status === 'CLAIMED'}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Reject / Request Revision
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={targetMilestone.status === 'APPROVED' || targetMilestone.status === 'CLAIMED'}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full btn-fintech-primary text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{targetMilestone.status === 'APPROVED' || targetMilestone.status === 'CLAIMED' ? 'Already Approved' : 'Sign Consensus Approval'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

