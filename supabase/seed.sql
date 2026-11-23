-- Seed Data for AI Outreach & LinkedIn Work Agent

INSERT INTO workspaces (id, name, timezone, agent_status, sending_status, daily_send_cap, quiet_hours_start, quiet_hours_end)
VALUES ('ws_default_001', 'Primary Outreach Workspace', 'Asia/Kolkata', 'active', 'active', 50, 21, 8)
ON CONFLICT (id) DO NOTHING;

-- Integrations status
INSERT INTO integrations (id, workspace_id, provider, category, status, account_identifier, granted_permissions, settings)
VALUES
  ('int_resend_01', 'ws_default_001', 'resend', 'messaging', 'connected', 'outreach@agentwork.io', '["messages:send", "webhooks:read"]', '{"from_email": "outreach@agentwork.io"}'),
  ('int_linkedin_01', 'ws_default_001', 'linkedin', 'linkedin', 'unconfigured', NULL, '[]', '{"note": "OAuth required. Available permissions: none"}'),
  ('int_model_01', 'ws_default_001', 'openai', 'model', 'connected', 'sk-configured-key', '["chat:completions"]', '{"model": "gpt-4o-mini"}')
ON CONFLICT (id) DO NOTHING;

-- Campaigns
INSERT INTO campaigns (id, workspace_id, name, purpose, channel, status, target_audience)
VALUES
  ('cmp_ai_consulting_01', 'ws_default_001', 'Q4 AI Automation Outreach', 'Offer AI workflow audits for mid-market engineering teams', 'email', 'active', 'CTOs, Heads of Engineering, Tech Leads'),
  ('cmp_partner_02', 'ws_default_001', 'Strategic Agency Partnerships', 'Explore co-marketing and integration partnerships', 'email', 'active', 'Agency Owners & Founders')
ON CONFLICT (id) DO NOTHING;

-- Leads
INSERT INTO leads (id, workspace_id, campaign_id, full_name, company_name, title, email, linkedin_url, recipient_identifier, source_url, evidence, fit_score, status)
VALUES
  ('lead_001', 'ws_default_001', 'cmp_ai_consulting_01', 'Marcus Vance', 'CloudScale Dynamics', 'VP of Engineering', 'marcus.v@cloudscaledynamics.example.com', 'https://linkedin.com/in/marcus-vance-sample', 'marcus.v@cloudscaledynamics.example.com', 'https://cloudscaledynamics.example.com/engineering-blog/scaling-challenges', 'Recent public engineering blog post discussing latency bottlenecks in distributed LLM pipelines.', 92, 'contacted'),
  ('lead_002', 'ws_default_001', 'cmp_ai_consulting_01', 'Priya Sharma', 'FinFlow Systems', 'Director of Data Platforms', 'priya.sharma@finflow.example.com', 'https://linkedin.com/in/priya-sharma-sample', 'priya.sharma@finflow.example.com', 'https://news.ycombinator.com/item?id=finflow-expansion', 'Announced hiring for 12 data pipeline and AI infrastructure roles last week.', 88, 'replied'),
  ('lead_003', 'ws_default_001', 'cmp_ai_consulting_01', 'David Chen', 'Nexis Analytics', 'Chief Technology Officer', 'david@nexisanalytics.example.com', 'https://linkedin.com/in/david-chen-sample', 'david@nexisanalytics.example.com', 'https://nexisanalytics.example.com/press', 'Company raised Series A to build agentic data querying.', 85, 'queued'),
  ('lead_004', 'ws_default_001', 'cmp_partner_02', 'Elena Rostova', 'Hyperion Digital', 'Managing Director', 'elena@hyperiondigital.example.com', 'https://linkedin.com/in/elena-rostova-sample', 'elena@hyperiondigital.example.com', 'https://hyperiondigital.example.com/partners', 'Looking for specialized AI development partners for customer projects.', 89, 'identified')
ON CONFLICT (id) DO NOTHING;

-- Suppression list
INSERT INTO suppression_list (id, workspace_id, recipient_identifier, channel, reason)
VALUES
  ('sup_001', 'ws_default_001', 'optout@unwantedcorp.example.com', 'email', 'unsubscribed'),
  ('sup_002', 'ws_default_001', 'bounce@badserver.example.com', 'email', 'bounced')
ON CONFLICT (id) DO NOTHING;

-- Audit events
INSERT INTO audit_events (id, workspace_id, event_type, actor, severity, details)
VALUES
  ('aud_001', 'ws_default_001', 'agent_started', 'system', 'info', '{"message": "AI Outreach & Work Agent initialized in Asia/Kolkata timezone"}'),
  ('aud_002', 'ws_default_001', 'policy_check_passed', 'policy_engine', 'info', '{"recipient": "marcus.v@cloudscaledynamics.example.com", "channel": "email", "passed": true}'),
  ('aud_003', 'ws_default_001', 'message_sent', 'resend_adapter', 'info', '{"external_id": "msg_ext_8829102", "recipient": "marcus.v@cloudscaledynamics.example.com"}')
ON CONFLICT (id) DO NOTHING;
