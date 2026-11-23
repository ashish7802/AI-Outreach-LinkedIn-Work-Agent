-- Security hardening patch for AI Outreach Agent.
-- IMPORTANT: run only AFTER the original schema exists.
-- Single-owner workspace model for this MVP. Uses Supabase Auth user IDs.

-- Link a profile to exactly one auth user.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique
  ON public.profiles(user_id)
  WHERE user_id IS NOT NULL;

-- Workspace must have a profile owner for access via authenticated RLS.
ALTER TABLE public.workspaces
  ALTER COLUMN owner_id SET NOT NULL;

-- Remove the globally permissive policies created by the initial migration.
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

-- Helper returns the workspaces owned by the authenticated user.
CREATE OR REPLACE FUNCTION public.owned_workspace_ids()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id
  FROM public.workspaces w
  JOIN public.profiles p ON p.id = w.owner_id
  WHERE p.user_id = auth.uid()
$$;

-- Profiles are private to their corresponding authenticated user.
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Workspace owner access.
CREATE POLICY workspaces_select_owned ON public.workspaces
  FOR SELECT TO authenticated USING (id IN (SELECT public.owned_workspace_ids()));
CREATE POLICY workspaces_update_owned ON public.workspaces
  FOR UPDATE TO authenticated USING (id IN (SELECT public.owned_workspace_ids()))
  WITH CHECK (id IN (SELECT public.owned_workspace_ids()));

-- All workspace-scoped tables: owner can read/write only own workspace rows.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'integrations','leads','campaigns','campaign_instructions',
    'conversations','messages','send_jobs','drafts','scan_runs',
    'reports','suppression_list','audit_events'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (workspace_id IN (SELECT public.owned_workspace_ids()))',
      t || '_select_owned', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (workspace_id IN (SELECT public.owned_workspace_ids()))',
      t || '_insert_owned', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (workspace_id IN (SELECT public.owned_workspace_ids())) WITH CHECK (workspace_id IN (SELECT public.owned_workspace_ids()))',
      t || '_update_owned', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (workspace_id IN (SELECT public.owned_workspace_ids()))',
      t || '_delete_owned', t
    );
  END LOOP;
END $$;

-- Send job and webhook replay protection primitives.
ALTER TABLE public.send_jobs
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by text,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  UNIQUE(provider, provider_event_id)
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No client policies: webhook event writes/reads are service-role server operations only.

-- Explicitly revoke anon access on private operational tables.
REVOKE ALL ON public.profiles, public.workspaces, public.integrations,
  public.leads, public.campaigns, public.campaign_instructions,
  public.conversations, public.messages, public.send_jobs, public.drafts,
  public.scan_runs, public.reports, public.suppression_list,
  public.audit_events, public.webhook_events FROM anon;
