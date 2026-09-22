-- =============================================================================
-- TrustBridge Supabase Database Schema (PostgreSQL)
-- Run this in your Supabase Project Dashboard -> SQL Editor -> Run
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    creator_address TEXT NOT NULL,
    contract_address TEXT,
    goal_eth NUMERIC(10, 4) NOT NULL,
    hard_cap_eth NUMERIC(10, 4) NOT NULL DEFAULT 20.0,
    deadline_timestamp BIGINT NOT NULL,
    milestones_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    total_raised_eth NUMERIC(10, 4) NOT NULL DEFAULT 0.0,
    ml_score INTEGER NOT NULL DEFAULT 85,
    risk_level TEXT NOT NULL DEFAULT 'LOW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AI Assessments Table
CREATE TABLE IF NOT EXISTS public.ai_assessments (
    id BIGSERIAL PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Milestone Submissions Table
CREATE TABLE IF NOT EXISTS public.milestone_submissions (
    id BIGSERIAL PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    milestone_index INTEGER NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1,
    ipfs_hash TEXT NOT NULL,
    repo_url TEXT,
    demo_url TEXT,
    notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Activity Ledger (On-Chain & Off-Chain Events)
CREATE TABLE IF NOT EXISTS public.activity_ledger (
    id BIGSERIAL PRIMARY KEY,
    campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE SET NULL,
    tx_hash TEXT,
    event_type TEXT NOT NULL,
    actor_address TEXT NOT NULL,
    amount_eth NUMERIC(10, 4) DEFAULT 0.0,
    block_number BIGINT,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. KYC Sandbox Audit Table
CREATE TABLE IF NOT EXISTS public.kyc_sandbox_audits (
    id BIGSERIAL PRIMARY KEY,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    sanctions_passed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Real-Time Publications (Allows clients to subscribe to live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_ledger;

-- Row Level Security (RLS) policies
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_ledger ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active crowdfunding campaigns & verified ledgers
CREATE POLICY "Public Read Campaigns" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Public Read Activity" ON public.activity_ledger FOR SELECT USING (true);
CREATE POLICY "Public Read Assessments" ON public.ai_assessments FOR SELECT USING (true);
CREATE POLICY "Public Read Milestone Submissions" ON public.milestone_submissions FOR SELECT USING (true);
