export type AgentStatus = 'active' | 'paused' | 'stopped';
export type SendingStatus = 'active' | 'paused';
export type ChannelType = 'email' | 'linkedin_message' | 'mock_channel';

export interface WorkspaceConfig {
  id: string;
  name: string;
  timezone: string; // e.g. "Asia/Kolkata"
  agent_status: AgentStatus;
  sending_status: SendingStatus;
  daily_send_cap: number;
  quiet_hours_start: number; // 24hr format (e.g. 21 for 9 PM)
  quiet_hours_end: number;   // 24hr format (e.g. 8 for 8 AM)
  require_manual_review_for_new_leads: boolean;
  model_provider: 'mock' | 'grok' | 'openai';
  handoff_mode: 'api_orchestration' | 'manual_handoff';
  created_at: string;
  updated_at: string;
}

export type IntegrationStatus = 'connected' | 'unconfigured' | 'degraded' | 'revoked';

export interface Integration {
  id: string;
  workspace_id: string;
  provider: 'resend' | 'sendgrid' | 'smtp' | 'linkedin' | 'grok' | 'openai' | 'mock_channel';
  category: 'messaging' | 'linkedin' | 'model';
  status: IntegrationStatus;
  account_identifier?: string | null;
  granted_permissions: string[];
  settings: Record<string, any>;
  last_health_check?: string | null;
  last_successful_sync?: string | null;
  error_message?: string | null;
}

export type LeadStatus =
  | 'identified'
  | 'qualified'
  | 'queued'
  | 'contacted'
  | 'replied'
  | 'unresponsive'
  | 'opted_out'
  | 'do_not_contact';

export interface Lead {
  id: string;
  workspace_id: string;
  campaign_id?: string | null;
  full_name: string;
  company_name?: string | null;
  title?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  recipient_identifier: string;
  source_url?: string | null;
  evidence?: string | null;
  fit_score: number;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  purpose: string;
  channel: ChannelType;
  status: 'active' | 'paused' | 'completed' | 'draft';
  target_audience?: string | null;
  created_at: string;
  updated_at: string;
}

export type InstructionValidationStatus = 'validated' | 'needs_review' | 'rejected' | 'executed';

export interface CampaignInstruction {
  id: string;
  workspace_id: string;
  campaign_id: string;
  lead_id: string;
  channel: ChannelType;
  recipient_identifier: string;
  exact_message_text: string;
  message_purpose: string;
  suggested_send_time?: string | null;
  follow_up_conditions?: string | null;
  constraints?: Record<string, any>;
  validation_status: InstructionValidationStatus;
  review_reason?: string | null;
  schema_version: string;
  raw_model_output?: any;
  created_at: string;
}

export type MessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'reply_received'
  | 'failed'
  | 'unknown'
  | 'not_supported';

export interface Message {
  id: string;
  workspace_id: string;
  conversation_id: string;
  lead_id: string;
  campaign_id?: string | null;
  instruction_id?: string | null;
  direction: 'outbound' | 'inbound';
  channel: ChannelType;
  recipient_identifier: string;
  sender_identifier?: string | null;
  body: string;
  status: MessageStatus;
  external_message_id?: string | null;
  error_details?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  lead_id: string;
  campaign_id?: string | null;
  channel: ChannelType;
  status: 'open' | 'replied' | 'closed' | 'needs_action';
  last_activity_at: string;
  lead_name?: string;
  recipient_identifier?: string;
  latest_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SendJob {
  id: string;
  workspace_id: string;
  instruction_id: string;
  idempotency_key: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'blocked_policy';
  attempt_count: number;
  max_attempts: number;
  policy_check_result?: PolicyEvaluationResult | null;
  error_message?: string | null;
  locked_at?: string | null;
  locked_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEventRecord {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  recipient_identifier?: string;
  payload?: any;
  processed_at: string;
}

export interface PolicyEvaluationResult {
  passed: boolean;
  reasons: string[];
  quiet_hours_active: boolean;
  suppressed: boolean;
  daily_cap_exceeded: boolean;
  agent_paused: boolean;
  sending_paused: boolean;
  integration_ready: boolean;
  evaluated_at: string;
}

export type DraftType = 'linkedin_post' | 'outreach_message' | 'profile_copy';
export type DraftStatus = 'draft' | 'scheduled' | 'ready_to_publish' | 'published' | 'failed' | 'archived';

export interface Draft {
  id: string;
  workspace_id: string;
  type: DraftType;
  title?: string | null;
  content: string;
  status: DraftStatus;
  scheduled_for?: string | null;
  published_at?: string | null;
  external_post_id?: string | null;
  target_audience?: string | null;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ScanRun {
  id: string;
  workspace_id: string;
  scan_type: 'lead_research' | 'reply_collection' | 'followup_reporting' | 'full_scan';
  trigger_source: 'cron' | 'manual' | 'api';
  status: 'running' | 'completed' | 'failed';
  summary: Record<string, any>;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface ExecutionReport {
  id: string;
  workspace_id: string;
  campaign_id?: string | null;
  scan_period_start: string;
  scan_period_end: string;
  leads_processed: number;
  messages_attempted: number;
  messages_sent: number;
  messages_delivered: number;
  messages_read: number;
  messages_failed: number;
  replies_received: number;
  opt_outs_count: number;
  next_actions: Array<{
    lead_id: string;
    action_type: string;
    recommended_message?: string;
    reason: string;
  }>;
  raw_summary: Record<string, any>;
  created_at: string;
}

export interface SuppressionEntry {
  id: string;
  workspace_id: string;
  recipient_identifier: string;
  channel: string;
  reason: 'unsubscribed' | 'bounced' | 'complaint' | 'manual_block';
  added_at: string;
}

export interface AuditEvent {
  id: string;
  workspace_id: string;
  event_type: string;
  actor: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  details: Record<string, any>;
  created_at: string;
}
