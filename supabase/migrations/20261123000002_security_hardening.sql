-- Migration: 20261123000002_security_hardening.sql
-- Description: Strict Workspace-Isolated Row Level Security (RLS) & Webhook Event Deduplication

-- 1. Add concurrency locking columns to send_jobs
ALTER TABLE public.send_jobs
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by TEXT,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

-- 2. Create workspace_members table for granular multi-tenant access control
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_workspace_user UNIQUE (workspace_id, user_id)
);

-- 3. Webhook Events Table (Server-only table for replay protection and idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  recipient_identifier TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_webhook_provider_event UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_provider_event ON public.webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);

-- 4. Helper Function for Workspace Membership Checking
CREATE OR REPLACE FUNCTION public.auth_has_workspace_access(ws_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = ws_id
      AND (
        w.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = ws_id
            AND wm.user_id = auth.uid()
        )
      )
  );
$$;

-- 5. Drop all permissive legacy "USING (true)" policies from 20261123000001_init.sql
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','workspaces','integrations','leads','campaigns',
    'campaign_instructions','conversations','messages','send_jobs',
    'drafts','scan_runs','reports','suppression_list','audit_events'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Public or Workspace Access ' || t, t);
  END LOOP;
END $$;

-- 6. Enable RLS on new tables
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 7. Strict Policies for User-Facing Workspace Data (Tenant Isolation)

-- Profiles: Users can only read/edit their own profile
CREATE POLICY "Users access own profile"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Workspaces: User must be owner or active member
CREATE POLICY "Members access own workspaces"
  ON public.workspaces
  FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = id AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (owner_id = auth.uid());

-- Workspace Members: Members can view team members in their workspace
CREATE POLICY "Members view workspace team"
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id));

-- Integrations: Restricted to authenticated workspace members
CREATE POLICY "Members access workspace integrations"
  ON public.integrations
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Leads: Strict workspace tenant boundary
CREATE POLICY "Members access workspace leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Campaigns: Strict workspace tenant boundary
CREATE POLICY "Members access workspace campaigns"
  ON public.campaigns
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Campaign Instructions: Strict workspace tenant boundary
CREATE POLICY "Members access workspace instructions"
  ON public.campaign_instructions
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Conversations: Strict workspace tenant boundary
CREATE POLICY "Members access workspace conversations"
  ON public.conversations
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Messages: Strict workspace tenant boundary
CREATE POLICY "Members access workspace messages"
  ON public.messages
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Send Jobs: Strict workspace tenant boundary
CREATE POLICY "Members access workspace send_jobs"
  ON public.send_jobs
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Drafts: Strict workspace tenant boundary
CREATE POLICY "Members access workspace drafts"
  ON public.drafts
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Scan Runs: Strict workspace tenant boundary
CREATE POLICY "Members access workspace scan_runs"
  ON public.scan_runs
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Reports: Strict workspace tenant boundary
CREATE POLICY "Members access workspace reports"
  ON public.reports
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Suppression List: Strict workspace tenant boundary
CREATE POLICY "Members access workspace suppression"
  ON public.suppression_list
  FOR ALL
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id))
  WITH CHECK (public.auth_has_workspace_access(workspace_id));

-- Audit Events: Read-only for authenticated members in workspace
CREATE POLICY "Members read workspace audit_events"
  ON public.audit_events
  FOR SELECT
  TO authenticated
  USING (public.auth_has_workspace_access(workspace_id));

-- 8. Server-Only Tables: Webhook Events
-- REVOKE all public and authenticated access from webhook_events.
-- Only the server-side service_role (which bypasses RLS) can read/write to webhook_events.
REVOKE ALL ON public.webhook_events FROM anon, authenticated;
