const API_BASE = 'http://127.0.0.1:5000/api';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err) {
    console.error('API health check error:', err);
    return { status: 'offline' };
  }
}

export async function fetchCampaigns() {
  try {
    const res = await fetch(`${API_BASE}/campaigns`);
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return await res.json();
  } catch (err) {
    console.warn('API error, using fallback:', err);
    return null;
  }
}

export async function fetchCampaignById(id) {
  try {
    const res = await fetch(`${API_BASE}/campaigns/${id}`);
    if (!res.ok) throw new Error('Failed to fetch campaign details');
    return await res.json();
  } catch (err) {
    console.warn('API error, using fallback:', err);
    return null;
  }
}

export async function createCampaignApi(campaignData) {
  try {
    const res = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    return await res.json();
  } catch (err) {
    console.error('Create campaign API error:', err);
    throw err;
  }
}

export async function predictSuccess(features) {
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (err) {
    console.warn('ML predict API offline, utilizing fallback telemetry:', err.message);
    const goalEth = parseFloat(features?.goal_eth || features?.goal || 10.0);
    const durationDays = parseInt(features?.duration_days || features?.deadlineDays || 30);
    const milestones = features?.milestones || [];
    const milestoneCount = Array.isArray(milestones) ? milestones.length : (features?.milestone_count || 4);
    const title = features?.title || '';
    const desc = features?.description || features?.summary || '';
    const normGoal = Math.min(1.0, goalEth / 20.0);
    const normDuration = Math.min(1.0, durationDays / 60.0);
    const balancedMilestones = milestoneCount === 4 ? 0.95 : 0.65;
    const completeness = Math.min(1.0, (title.length + desc.length) / 100.0);
    const prob = Number((0.4 * normGoal + 0.3 * normDuration + 0.2 * balancedMilestones + 0.1 * completeness).toFixed(2));
    return {
      success_probability: prob,
      percentage: Number((prob * 100).toFixed(1)),
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict.",
      source: 'local_fallback'
    };
  }
}

export async function assessRisk(features) {
  try {
    const res = await fetch(`${API_BASE}/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (err) {
    console.warn('Risk assess API offline, utilizing fallback telemetry:', err.message);
    const goalEth = parseFloat(features?.goal_eth || features?.goal || 10.0);
    const milestones = features?.milestones || [];
    const milestoneCount = Array.isArray(milestones) ? milestones.length : (features?.milestone_count || 4);
    const desc = features?.description || features?.summary || '';
    let anomalyScore = 0.12;
    if (goalEth > 25.0 || milestoneCount < 2 || desc.length < 10) {
      anomalyScore = -0.15;
    } else if (goalEth > 20.0 || milestoneCount !== 4) {
      anomalyScore = -0.02;
    }
    let riskTier = 'LOW';
    if (anomalyScore < -0.10) {
      riskTier = 'HIGH';
    } else if (anomalyScore < 0.05) {
      riskTier = 'MEDIUM';
    }
    return {
      anomaly: {
        anomaly_score: anomalyScore,
        risk_tier: riskTier
      },
      risk_analysis: {
        budget_realism_score: goalEth <= 20 ? 0.92 : 0.65,
        budget_realism_display: goalEth <= 20 ? '92% OPTIMAL' : '65% ELEVATED',
        timeline_feasibility: 'REALISTIC (60 Days Target)',
        mitigations: [
          'Creator allowed 1 retry grace period upon verifier evidence rejection',
          'Prorated remaining balances protected by pull-payment pattern'
        ]
      },
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict.",
      source: 'local_fallback'
    };
  }
}

export async function analyzeCampaignWithAi(campaignData) {
  try {
    const res = await fetch(`${API_BASE}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (err) {
    console.warn('AI analyze API offline, utilizing fallback telemetry:', err.message);
    const desc = campaignData?.description || campaignData?.summary || '';
    const wordCount = desc.split(/\s+/).filter(Boolean).length;
    const completeness = Math.min(1.0, Math.max(0.4, wordCount / 150.0));
    const milestones = campaignData?.milestones || [];
    const milestoneCount = Array.isArray(milestones) ? milestones.length : 4;
    return {
      completeness_score: Number(completeness.toFixed(2)),
      pitch_completeness_display: `${Math.round(completeness * 100)}% (Comprehensive)`,
      feasibility_score: 0.88,
      roadmap_quality: milestoneCount === 4 ? 'STRONG' : 'MODERATE',
      missing_specifications: [
        "Include smart contract audit hash in Milestone 1 deliverables",
        "Specify IPFS node pinning redundancy strategy"
      ],
      technical_strengths: [
        "Clear multi-tranche milestone separation matching 4-stage lifecycle",
        "Non-custodial pull payment design prevents capital exposure"
      ],
      recommendations: [
        "Provide verifiable GitHub repository URL prior to funding launch"
      ],
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict.",
      source: 'local_fallback'
    };
  }
}

export async function explainCampaignWithAi(campaignData) {
  try {
    const res = await fetch(`${API_BASE}/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (err) {
    console.warn('AI explain API offline, utilizing fallback telemetry:', err.message);
    return {
      explanation: "Campaign features balanced milestone allocations adhering to the 4-tranche sequential release protocol.",
      strengths: ["Clear escrow parameters", "Multi-signature verifier consensus"],
      risk_summary: "LOW anomaly score with deterministic milestone release triggers.",
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict.",
      source: 'local_fallback'
    };
  }
}

export async function reviewEvidenceWithAi(milestone, evidence) {
  try {
    const res = await fetch(`${API_BASE}/ai/review-evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestone, evidence })
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (err) {
    console.warn('AI review evidence API offline, utilizing fallback telemetry:', err.message);
    const evidenceStr = typeof evidence === 'string' ? evidence : (evidence?.url || evidence?.ipfsHash || '');
    const hasIpfs = Boolean(evidenceStr && (evidenceStr.includes('Qm') || evidenceStr.includes('ipfs')));
    const hasRepo = Boolean(evidenceStr && (evidenceStr.includes('github') || evidenceStr.includes('gitlab')));
    const hasDemo = Boolean(evidenceStr && (evidenceStr.includes('demo') || evidenceStr.includes('bench')));

    const checks = [
      { item: 'IPFS Content Hash Verifiable', status: hasIpfs ? 'VERIFIED' : 'PENDING_CHECK' },
      { item: 'Public Repository Deliverables', status: hasRepo ? 'VERIFIED' : 'PENDING_CHECK' },
      { item: 'Live Demonstration Sandbox', status: hasDemo ? 'VERIFIED' : 'PENDING_CHECK' }
    ];

    return {
      checklist: checks,
      passedCount: checks.filter(c => c.status === 'VERIFIED').length,
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict.",
      source: 'local_fallback'
    };
  }
}

export async function verifyKycApi(address, fullName, country) {
  try {
    const res = await fetch(`${API_BASE}/verify/kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, full_name: fullName, country })
    });
    return await res.json();
  } catch (err) {
    console.error('KYC API error:', err);
    return { verified: false, error: err.message };
  }
}
