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
    return await res.json();
  } catch (err) {
    console.error('ML predict error:', err);
    return { success_probability: 0.82, percentage: 82.0 };
  }
}

export async function assessRisk(features) {
  try {
    const res = await fetch(`${API_BASE}/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    return await res.json();
  } catch (err) {
    console.error('Risk assess error:', err);
    return { anomaly: { anomaly_score: 0.12, risk_tier: 'LOW' } };
  }
}

export async function analyzeCampaignWithAi(campaignData) {
  try {
    const res = await fetch(`${API_BASE}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    return await res.json();
  } catch (err) {
    console.error('AI analyze error:', err);
    return null;
  }
}

export async function explainCampaignWithAi(campaignData) {
  try {
    const res = await fetch(`${API_BASE}/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    return await res.json();
  } catch (err) {
    console.error('AI explain error:', err);
    return null;
  }
}

export async function reviewEvidenceWithAi(milestone, evidence) {
  try {
    const res = await fetch(`${API_BASE}/ai/review-evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestone, evidence })
    });
    return await res.json();
  } catch (err) {
    console.error('AI evidence review error:', err);
    return null;
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
