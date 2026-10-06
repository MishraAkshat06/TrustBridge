export const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

function unpack(json) {
  if (json && json.status === 'success' && json.data !== undefined) {
    return json.data;
  }
  return json;
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const json = await res.json();
    return unpack(json);
  } catch (err) {
    console.error('API health check error:', err);
    return { status: 'offline' };
  }
}

export async function fetchCampaigns() {
  try {
    const res = await fetch(`${API_BASE}/campaigns`);
    if (!res.ok) throw new Error(`Failed to fetch campaigns (HTTP ${res.status})`);
    const json = await res.json();
    return unpack(json);
  } catch (err) {
    console.error('Fetch campaigns error:', err);
    return null;
  }
}

export async function fetchCampaignById(id) {
  try {
    const res = await fetch(`${API_BASE}/campaigns/${id}`);
    if (!res.ok) throw new Error(`Campaign ${id} not found (HTTP ${res.status})`);
    const json = await res.json();
    return unpack(json);
  } catch (err) {
    console.error('Fetch campaign by ID error:', err);
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
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `Failed to create campaign (HTTP ${res.status})`);
    }
    return unpack(json);
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
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `ML prediction service unavailable (HTTP ${res.status})`);
    }
    return unpack(json);
  } catch (err) {
    console.error('ML predict API error:', err);
    return {
      error: err.message,
      model_available: false,
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict."
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
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `Risk assessment service unavailable (HTTP ${res.status})`);
    }
    return unpack(json);
  } catch (err) {
    console.error('Risk assess API error:', err);
    return {
      error: err.message,
      anomaly: { anomaly_score: 0.0, risk_tier: 'UNAVAILABLE' },
      risk_analysis: null,
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict."
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
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `AI analyzer service unavailable (HTTP ${res.status})`);
    }
    return unpack(json);
  } catch (err) {
    console.error('AI analyze API error:', err);
    return {
      error: err.message,
      completeness_score: 0,
      recommendations: ["AI evaluation currently offline. Reconnect to backend server."],
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict."
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
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `AI explainer service unavailable (HTTP ${res.status})`);
    }
    return unpack(json);
  } catch (err) {
    console.error('AI explain API error:', err);
    return {
      error: err.message,
      explanation: "AI explainer service currently unavailable.",
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict."
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
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `AI review service unavailable (HTTP ${res.status})`);
    }
    return unpack(json);
  } catch (err) {
    console.error('AI review evidence API error:', err);
    return {
      error: err.message,
      checklist: [],
      passedCount: 0,
      disclaimer: "This is an AI-generated advisory assessment and not a financial verdict."
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
    const json = await res.json();
    if (!res.ok) {
      return { verified: false, error: json.error || `KYC failed (HTTP ${res.status})` };
    }
    return unpack(json);
  } catch (err) {
    console.error('KYC API error:', err);
    return { verified: false, error: err.message };
  }
}

export async function authGoogleApi(email, name, avatar, role) {
  try {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, avatar, role })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `Authentication failed (HTTP ${res.status})`);
    }
    return unpack(json);
  } catch (err) {
    console.error('Auth Google API error:', err);
    throw err;
  }
}
