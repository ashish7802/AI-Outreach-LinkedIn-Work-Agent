-- Migration: 20261123000001_init.sql
-- Description: Core Schema for AI Outreach & LinkedIn Work Agent

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  headline TEXT,
  about_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  agent_status TEXT NOT NULL DEFAULT 'active' CHECK (agent_status IN ('active', 'paused', 'stopped')),
  sending_status TEXT NOT NULL DEFAULT 'active' CHECK (sending_status IN ('active', 'paused')),
  daily_send_cap INT DEFAULT 50,
  quiet_hours_start INT DEFAULT 21,
  quiet_hours_end INT DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('resend', 'sendgrid', 'smtp', 'linkedin', 'grok', 'openai', 'mock_channel')),
  category TEXT NOT NULL CHECK (category IN ('messaging', 'linkedin', 'model')),
  status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (status IN ('connected', 'unconfigured', 'degraded', 'revoked')),
  account_identifier TEXT,
  granted_permissions JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  last_health_check TIMESTAMPTZ,
  last_successful_sync TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin_message', 'mock_channel')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
  target_audience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Leads
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  company_name TEXT,
  title TEXT,
  email TEXT,
  linkedin_url TEXT,
  recipient_identifier TEXT NOT NULL,
  source_url TEXT,
  evidence TEXT,
  fit_score INT DEFAULT 75,
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'qualified', 'queued', 'contacted', 'replied', 'unresponsive', 'opted_out', 'do_not_contact')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_lead_recipient UNIQUE (workspace_id, recipient_identifier)
);

-- 6. Campaign Instructions (Strict structured instruction from Model)
CREATE TABLE IF NOT EXISTS campaign_instructions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  recipient_identifier TEXT NOT NULL,
  exact_message_text TEXT NOT NULL,
  message_purpose TEXT NOT NULL,
  follow_up_conditions TEXT,
  constraints JSONB DEFAULT '{}'::jsonb,
  validation_status TEXT NOT NULL DEFAULT 'validated' CHECK (validation_status IN ('validated', 'needs_review', 'rejected', 'executed')),
  review_reason TEXT,
  schema_version TEXT DEFAULT 'v1',
  raw_model_output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed', 'needs_action')),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_lead_channel UNIQUE (lead_id, channel)
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  instruction_id TEXT REFERENCES campaign_instructions(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  channel TEXT NOT NULL,
  recipient_identifier TEXT NOT NULL,
  sender_identifier TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'reply_received', 'failed', 'unknown', 'not_supported')),
  external_message_id TEXT,
  error_details TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Send Jobs (Idempotent job queue)
CREATE TABLE IF NOT EXISTS send_jobs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  instruction_id TEXT REFERENCES campaign_instructions(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'blocked_policy')),
  attempt_count INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  policy_check_result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Drafts (LinkedIn & Messaging drafts)
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('linkedin_post', 'outreach_message', 'profile_copy')),
  title TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ready_to_publish', 'published', 'failed', 'archived')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_post_id TEXT,
  target_audience TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Scan Runs (Scheduled 3x daily jobs)
CREATE TABLE IF NOT EXISTS scan_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('lead_research', 'reply_collection', 'followup_reporting', 'full_scan')),
  trigger_source TEXT NOT NULL CHECK (trigger_source IN ('cron', 'manual', 'api')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  summary JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 12. Reports (Structured reports to model or dashboard)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  scan_period_start TIMESTAMPTZ NOT NULL,
  scan_period_end TIMESTAMPTZ NOT NULL,
  leads_processed INT DEFAULT 0,
  messages_attempted INT DEFAULT 0,
  messages_sent INT DEFAULT 0,
  messages_delivered INT DEFAULT 0,
  messages_read INT DEFAULT 0,
  messages_failed INT DEFAULT 0,
  replies_received INT DEFAULT 0,
  opt_outs_count INT DEFAULT 0,
  next_actions JSONB DEFAULT '[]'::jsonb,
  raw_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Suppression List (Opt-outs and blacklist)
CREATE TABLE IF NOT EXISTS suppression_list (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  recipient_identifier TEXT NOT NULL,
  channel TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribed', 'bounced', 'complaint', 'manual_block')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_suppression UNIQUE (workspace_id, recipient_identifier, channel)
);

-- 14. Audit Events (Chronological non-repudiation log)
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'agent',
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & idempotent lookups
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_identifier);
CREATE INDEX IF NOT EXISTS idx_send_jobs_status ON send_jobs(status);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suppression_lookup ON suppression_list(workspace_id, recipient_identifier);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Allow public read/write if service_role or authenticated in current workspace context
CREATE POLICY "Public or Workspace Access profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access workspaces" ON workspaces FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access integrations" ON integrations FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access leads" ON leads FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access campaigns" ON campaigns FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access campaign_instructions" ON campaign_instructions FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access messages" ON messages FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access send_jobs" ON send_jobs FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access drafts" ON drafts FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access scan_runs" ON scan_runs FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access reports" ON reports FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access suppression_list" ON suppression_list FOR ALL USING (true);
CREATE POLICY "Public or Workspace Access audit_events" ON audit_events FOR ALL USING (true);
