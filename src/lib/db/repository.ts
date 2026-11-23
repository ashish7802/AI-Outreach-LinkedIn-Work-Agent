import fs from 'fs';
import path from 'path';
import {
  WorkspaceConfig,
  Lead,
  Campaign,
  CampaignInstruction,
  Message,
  Conversation,
  SendJob,
  Draft,
  ScanRun,
  ExecutionReport,
  SuppressionEntry,
  AuditEvent,
  Integration,
} from '@/types';
import { supabaseAdmin, isSupabaseConfigured } from './supabase';

interface LocalDatabaseState {
  workspaces: WorkspaceConfig[];
  integrations: Integration[];
  leads: Lead[];
  campaigns: Campaign[];
  instructions: CampaignInstruction[];
  conversations: Conversation[];
  messages: Message[];
  send_jobs: SendJob[];
  drafts: Draft[];
  scan_runs: ScanRun[];
  reports: ExecutionReport[];
  suppression_list: SuppressionEntry[];
  audit_events: AuditEvent[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function getInitialState(): LocalDatabaseState {
  return {
    workspaces: [
      {
        id: 'ws_default_001',
        name: 'Primary AI Outreach Workspace',
        timezone: 'Asia/Kolkata',
        agent_status: 'active',
        sending_status: 'active',
        daily_send_cap: 50,
        quiet_hours_start: 21,
        quiet_hours_end: 8,
        require_manual_review_for_new_leads: false,
        model_provider: 'mock',
        handoff_mode: 'api_orchestration',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    integrations: [
      {
        id: 'int_resend_01',
        workspace_id: 'ws_default_001',
        provider: 'resend',
        category: 'messaging',
        status: process.env.RESEND_API_KEY ? 'connected' : 'unconfigured',
        account_identifier: process.env.RESEND_FROM_EMAIL || 'outreach@yourdomain.com',
        granted_permissions: ['messages:send', 'webhooks:read'],
        settings: { from_email: process.env.RESEND_FROM_EMAIL || 'outreach@yourdomain.com' },
        last_health_check: new Date().toISOString(),
        last_successful_sync: new Date().toISOString(),
      },
      {
        id: 'int_mock_01',
        workspace_id: 'ws_default_001',
        provider: 'mock_channel',
        category: 'messaging',
        status: 'connected',
        account_identifier: 'verified-test-runner@agent.local',
        granted_permissions: ['messages:send', 'webhooks:read', 'replies:receive'],
        settings: { mode: 'test_simulation' },
        last_health_check: new Date().toISOString(),
        last_successful_sync: new Date().toISOString(),
      },
      {
        id: 'int_linkedin_01',
        workspace_id: 'ws_default_001',
        provider: 'linkedin',
        category: 'linkedin',
        status: process.env.LINKEDIN_ACCESS_TOKEN ? 'connected' : 'unconfigured',
        account_identifier: process.env.LINKEDIN_PERSON_URN || null,
        granted_permissions: process.env.LINKEDIN_ACCESS_TOKEN ? ['w_member_social'] : [],
        settings: {
          note: process.env.LINKEDIN_ACCESS_TOKEN
            ? 'Authorized via LinkedIn OAuth'
            : 'OAuth unconfigured. Ready-to-copy drafts enabled; direct publishing unavailable without authorization.',
        },
        last_health_check: null,
      },
      {
        id: 'int_model_01',
        workspace_id: 'ws_default_001',
        provider: (process.env.MODEL_PROVIDER as any) || 'mock_channel',
        category: 'model',
        status: 'connected',
        account_identifier: process.env.OPENAI_API_KEY ? 'OpenAI GPT-4o' : 'Mock AI Engine',
        granted_permissions: ['chat:completions', 'structured:json'],
        settings: { model: process.env.OPENAI_MODEL || 'gpt-4o-mini' },
        last_health_check: new Date().toISOString(),
      },
    ],
    campaigns: [
      {
        id: 'cmp_ai_consulting_01',
        workspace_id: 'ws_default_001',
        name: 'Q4 AI Automation Outreach',
        purpose: 'Offer deterministic AI workflow audits for mid-market engineering teams',
        channel: 'email',
        status: 'active',
        target_audience: 'CTOs, Heads of Engineering, Tech Leads',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    leads: [
      {
        id: 'lead_001',
        workspace_id: 'ws_default_001',
        campaign_id: 'cmp_ai_consulting_01',
        full_name: 'Marcus Vance',
        company_name: 'CloudScale Dynamics',
        title: 'VP of Engineering',
        email: 'marcus.v@cloudscaledynamics.example.com',
        linkedin_url: 'https://linkedin.com/in/marcus-vance-sample',
        recipient_identifier: 'marcus.v@cloudscaledynamics.example.com',
        source_url: 'https://cloudscaledynamics.example.com/engineering-blog/scaling-challenges',
        evidence: 'Recent public engineering blog post discussing latency bottlenecks in distributed LLM pipelines.',
        fit_score: 92,
        status: 'contacted',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'lead_002',
        workspace_id: 'ws_default_001',
        campaign_id: 'cmp_ai_consulting_01',
        full_name: 'Priya Sharma',
        company_name: 'FinFlow Systems',
        title: 'Director of Data Platforms',
        email: 'priya.sharma@finflow.example.com',
        linkedin_url: 'https://linkedin.com/in/priya-sharma-sample',
        recipient_identifier: 'priya.sharma@finflow.example.com',
        source_url: 'https://news.ycombinator.com/item?id=finflow-expansion',
        evidence: 'Announced hiring for 12 data pipeline and AI infrastructure roles last week.',
        fit_score: 88,
        status: 'replied',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'lead_003',
        workspace_id: 'ws_default_001',
        campaign_id: 'cmp_ai_consulting_01',
        full_name: 'David Chen',
        company_name: 'Nexis Analytics',
        title: 'Chief Technology Officer',
        email: 'david@nexisanalytics.example.com',
        linkedin_url: 'https://linkedin.com/in/david-chen-sample',
        recipient_identifier: 'david@nexisanalytics.example.com',
        source_url: 'https://nexisanalytics.example.com/press',
        evidence: 'Company raised Series A to build agentic data querying.',
        fit_score: 85,
        status: 'queued',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    instructions: [
      {
        id: 'inst_001',
        workspace_id: 'ws_default_001',
        campaign_id: 'cmp_ai_consulting_01',
        lead_id: 'lead_001',
        channel: 'email',
        recipient_identifier: 'marcus.v@cloudscaledynamics.example.com',
        exact_message_text: 'Hi Marcus,\n\nI read your recent blog post on latency bottlenecks in distributed LLM pipelines. We built an idempotent worker pipeline that eliminates duplicate agent sends and reduces execution latency.\n\nWould you be open to comparing notes for 10 minutes next week?\n\nBest,\nEngineering Outreach',
        message_purpose: 'Initial outreach citing blog post evidence',
        suggested_send_time: new Date(Date.now() - 86400000).toISOString(),
        follow_up_conditions: 'Wait 4 business days if no reply',
        constraints: { channel: 'email' },
        validation_status: 'executed',
        schema_version: 'v1',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    conversations: [
      {
        id: 'conv_lead_001',
        workspace_id: 'ws_default_001',
        lead_id: 'lead_001',
        campaign_id: 'cmp_ai_consulting_01',
        channel: 'email',
        status: 'open',
        last_activity_at: new Date(Date.now() - 86400000).toISOString(),
        lead_name: 'Marcus Vance',
        recipient_identifier: 'marcus.v@cloudscaledynamics.example.com',
        latest_message: 'Hi Marcus, I read your recent blog post...',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'conv_lead_002',
        workspace_id: 'ws_default_001',
        lead_id: 'lead_002',
        campaign_id: 'cmp_ai_consulting_01',
        channel: 'email',
        status: 'replied',
        last_activity_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        lead_name: 'Priya Sharma',
        recipient_identifier: 'priya.sharma@finflow.example.com',
        latest_message: 'Thanks for reaching out! We are indeed building out our data platform. Do you have a technical spec you can send over?',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
    messages: [
      {
        id: 'msg_001',
        workspace_id: 'ws_default_001',
        conversation_id: 'conv_lead_001',
        lead_id: 'lead_001',
        campaign_id: 'cmp_ai_consulting_01',
        instruction_id: 'inst_001',
        direction: 'outbound',
        channel: 'email',
        recipient_identifier: 'marcus.v@cloudscaledynamics.example.com',
        sender_identifier: 'outreach@yourdomain.com',
        body: 'Hi Marcus,\n\nI read your recent blog post on latency bottlenecks in distributed LLM pipelines. We built an idempotent worker pipeline that eliminates duplicate agent sends and reduces execution latency.\n\nWould you be open to comparing notes for 10 minutes next week?\n\nBest,\nEngineering Outreach',
        status: 'delivered',
        external_message_id: 'ext_msg_8492048',
        sent_at: new Date(Date.now() - 86400000).toISOString(),
        delivered_at: new Date(Date.now() - 86400000 + 4000).toISOString(),
        read_at: null, // Truthful: not reported by provider
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'msg_002',
        workspace_id: 'ws_default_001',
        conversation_id: 'conv_lead_002',
        lead_id: 'lead_002',
        campaign_id: 'cmp_ai_consulting_01',
        direction: 'inbound',
        channel: 'email',
        recipient_identifier: 'outreach@yourdomain.com',
        sender_identifier: 'priya.sharma@finflow.example.com',
        body: 'Thanks for reaching out! We are indeed building out our data platform. Do you have a technical spec you can send over?',
        status: 'reply_received',
        external_message_id: 'ext_inbound_99182',
        sent_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    send_jobs: [],
    drafts: [
      {
        id: 'draft_001',
        workspace_id: 'ws_default_001',
        type: 'linkedin_post',
        title: 'Architecting Deterministic AI Agents in Next.js',
        content: `When designing autonomous work agents, the number one mistake is letting an LLM decide when to call a production API.

Here is why:
- Models hallucinate rate limits
- Token retries trigger duplicate outbound messages
- Unchecked loops can blow through customer quotas in minutes

Instead, we built a 3-layer safety architecture:
1. Versioned Zod schemas validate model payloads.
2. Server-side policy engine checks quiet hours (Asia/Kolkata), suppression lists, and daily caps.
3. Every send job generates a deterministic idempotency key.

The result? An agent that acts with predictable precision.`,
        status: 'draft',
        target_audience: 'Software Engineers, Founders, AI Architects',
        tags: ['AIEngineering', 'NextJS', 'Architecture', 'TypeScript'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    scan_runs: [
      {
        id: 'scan_001',
        workspace_id: 'ws_default_001',
        scan_type: 'lead_research',
        trigger_source: 'manual',
        status: 'completed',
        summary: { leads_found: 2, qualified: 2 },
        started_at: new Date(Date.now() - 7200000).toISOString(),
        completed_at: new Date(Date.now() - 7195000).toISOString(),
      },
    ],
    reports: [
      {
        id: 'rep_001',
        workspace_id: 'ws_default_001',
        campaign_id: 'cmp_ai_consulting_01',
        scan_period_start: new Date(Date.now() - 86400000 * 7).toISOString(),
        scan_period_end: new Date().toISOString(),
        leads_processed: 3,
        messages_attempted: 1,
        messages_sent: 1,
        messages_delivered: 1,
        messages_read: 0, // Truthful reporting
        messages_failed: 0,
        replies_received: 1,
        opt_outs_count: 0,
        next_actions: [
          {
            lead_id: 'lead_002',
            action_type: 'follow_up_with_spec',
            recommended_message: 'Hi Priya, here is our architecture overview.',
            reason: 'Inbound request for technical spec received.',
          },
        ],
        raw_summary: { notes: 'High response rate on engineering blog post hooks.' },
        created_at: new Date().toISOString(),
      },
    ],
    suppression_list: [
      {
        id: 'sup_001',
        workspace_id: 'ws_default_001',
        recipient_identifier: 'optout@unwantedcorp.example.com',
        channel: 'email',
        reason: 'unsubscribed',
        added_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ],
    audit_events: [
      {
        id: 'aud_001',
        workspace_id: 'ws_default_001',
        event_type: 'agent_initialized',
        actor: 'system',
        severity: 'info',
        details: { message: 'Agent started in Asia/Kolkata timezone' },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'aud_002',
        workspace_id: 'ws_default_001',
        event_type: 'message_delivered',
        actor: 'resend_adapter',
        severity: 'info',
        details: { external_id: 'ext_msg_8492048', recipient: 'marcus.v@cloudscaledynamics.example.com' },
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };
}

class Repository {
  private loadLocal(): LocalDatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DATA_FILE)) {
        const initial = getInitialState();
        fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
        return initial;
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return getInitialState();
    }
  }

  private saveLocal(state: LocalDatabaseState): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist local database state:', err);
    }
  }

  // Workspaces
  async getWorkspace(id: string = 'ws_default_001'): Promise<WorkspaceConfig> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('workspaces').select('*').eq('id', id).single();
      if (data) return data;
    }
    const state = this.loadLocal();
    return (
      state.workspaces.find((w) => w.id === id) ||
      state.workspaces[0] ||
      getInitialState().workspaces[0]
    );
  }

  async updateWorkspace(id: string, updates: Partial<WorkspaceConfig>): Promise<WorkspaceConfig> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('workspaces')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (data) return data;
    }
    const state = this.loadLocal();
    const index = state.workspaces.findIndex((w) => w.id === id);
    if (index >= 0) {
      state.workspaces[index] = {
        ...state.workspaces[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.saveLocal(state);
      return state.workspaces[index];
    }
    throw new Error(`Workspace ${id} not found`);
  }

  // Integrations
  async getIntegrations(workspaceId: string = 'ws_default_001'): Promise<Integration[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('integrations').select('*').eq('workspace_id', workspaceId);
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.integrations.filter((i) => i.workspace_id === workspaceId);
  }

  async updateIntegration(
    id: string,
    updates: Partial<Integration>
  ): Promise<Integration> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (data) return data;
    }
    const state = this.loadLocal();
    const idx = state.integrations.findIndex((i) => i.id === id);
    if (idx >= 0) {
      state.integrations[idx] = { ...state.integrations[idx], ...updates };
      this.saveLocal(state);
      return state.integrations[idx];
    }
    throw new Error(`Integration ${id} not found`);
  }

  // Leads
  async getLeads(workspaceId: string = 'ws_default_001'): Promise<Lead[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.leads.filter((l) => l.workspace_id === workspaceId);
  }

  async addLead(lead: Omit<Lead, 'created_at' | 'updated_at'>): Promise<Lead> {
    const fullLead: Lead = {
      ...lead,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('leads').insert(fullLead).select().single();
      if (data) return data;
    }
    const state = this.loadLocal();
    // Duplicate check on recipient_identifier
    const exists = state.leads.find(
      (l) =>
        l.workspace_id === lead.workspace_id &&
        l.recipient_identifier.toLowerCase() === lead.recipient_identifier.toLowerCase()
    );
    if (exists) {
      return exists;
    }
    state.leads.unshift(fullLead);
    this.saveLocal(state);
    return fullLead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (data) return data;
    }
    const state = this.loadLocal();
    const idx = state.leads.findIndex((l) => l.id === id);
    if (idx >= 0) {
      state.leads[idx] = { ...state.leads[idx], ...updates, updated_at: new Date().toISOString() };
      this.saveLocal(state);
      return state.leads[idx];
    }
    throw new Error(`Lead ${id} not found`);
  }

  // Campaigns
  async getCampaigns(workspaceId: string = 'ws_default_001'): Promise<Campaign[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('campaigns').select('*').eq('workspace_id', workspaceId);
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.campaigns.filter((c) => c.workspace_id === workspaceId);
  }

  // Instructions
  async getInstructions(workspaceId: string = 'ws_default_001'): Promise<CampaignInstruction[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('campaign_instructions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.instructions.filter((i) => i.workspace_id === workspaceId);
  }

  async saveInstruction(
    instruction: Omit<CampaignInstruction, 'created_at'>
  ): Promise<CampaignInstruction> {
    const fullInstruction: CampaignInstruction = {
      ...instruction,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('campaign_instructions')
        .insert(fullInstruction)
        .select()
        .single();
      if (data) return data;
    }
    const state = this.loadLocal();
    state.instructions.unshift(fullInstruction);
    this.saveLocal(state);
    return fullInstruction;
  }

  async updateInstruction(
    id: string,
    updates: Partial<CampaignInstruction>
  ): Promise<CampaignInstruction> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('campaign_instructions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (data) return data;
    }
    const state = this.loadLocal();
    const idx = state.instructions.findIndex((i) => i.id === id);
    if (idx >= 0) {
      state.instructions[idx] = { ...state.instructions[idx], ...updates };
      this.saveLocal(state);
      return state.instructions[idx];
    }
    throw new Error(`Instruction ${id} not found`);
  }

  // Send Jobs
  async getSendJobs(workspaceId: string = 'ws_default_001'): Promise<SendJob[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('send_jobs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.send_jobs.filter((j) => j.workspace_id === workspaceId);
  }

  async createSendJob(job: Omit<SendJob, 'created_at' | 'updated_at'>): Promise<SendJob> {
    const fullJob: SendJob = {
      ...job,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('send_jobs').insert(fullJob).select().single();
      if (data) return data;
    }
    const state = this.loadLocal();
    // Enforce idempotency key uniqueness
    const existing = state.send_jobs.find((j) => j.idempotency_key === job.idempotency_key);
    if (existing) {
      return existing;
    }
    state.send_jobs.push(fullJob);
    this.saveLocal(state);
    return fullJob;
  }

  async updateSendJob(id: string, updates: Partial<SendJob>): Promise<SendJob> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('send_jobs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (data) return data;
    }
    const state = this.loadLocal();
    const idx = state.send_jobs.findIndex((j) => j.id === id);
    if (idx >= 0) {
      state.send_jobs[idx] = { ...state.send_jobs[idx], ...updates, updated_at: new Date().toISOString() };
      this.saveLocal(state);
      return state.send_jobs[idx];
    }
    throw new Error(`SendJob ${id} not found`);
  }

  // Messages & Conversations
  async getMessages(workspaceId: string = 'ws_default_001'): Promise<Message[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.messages.filter((m) => m.workspace_id === workspaceId);
  }

  async createMessage(message: Omit<Message, 'created_at' | 'updated_at'>): Promise<Message> {
    const fullMessage: Message = {
      ...message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('messages').insert(fullMessage).select().single();
      if (data) return data;
    }
    const state = this.loadLocal();
    state.messages.unshift(fullMessage);
    this.saveLocal(state);
    return fullMessage;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('messages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (data) return data;
    }
    const state = this.loadLocal();
    const idx = state.messages.findIndex((m) => m.id === id);
    if (idx >= 0) {
      state.messages[idx] = { ...state.messages[idx], ...updates, updated_at: new Date().toISOString() };
      this.saveLocal(state);
      return state.messages[idx];
    }
    throw new Error(`Message ${id} not found`);
  }

  async getConversations(workspaceId: string = 'ws_default_001'): Promise<Conversation[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_activity_at', { ascending: false });
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.conversations.filter((c) => c.workspace_id === workspaceId);
  }

  async upsertConversation(conv: Omit<Conversation, 'created_at' | 'updated_at'>): Promise<Conversation> {
    const fullConv: Conversation = {
      ...conv,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const state = this.loadLocal();
    const idx = state.conversations.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      state.conversations[idx] = {
        ...state.conversations[idx],
        ...conv,
        updated_at: new Date().toISOString(),
      };
      this.saveLocal(state);
      return state.conversations[idx];
    }
    state.conversations.unshift(fullConv);
    this.saveLocal(state);
    return fullConv;
  }

  // LinkedIn & Messaging Drafts
  async getDrafts(workspaceId: string = 'ws_default_001'): Promise<Draft[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('drafts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.drafts.filter((d) => d.workspace_id === workspaceId);
  }

  async createDraft(draft: Omit<Draft, 'created_at' | 'updated_at'>): Promise<Draft> {
    const fullDraft: Draft = {
      ...draft,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('drafts').insert(fullDraft).select().single();
      if (data) return data;
    }
    const state = this.loadLocal();
    state.drafts.unshift(fullDraft);
    this.saveLocal(state);
    return fullDraft;
  }

  async updateDraft(id: string, updates: Partial<Draft>): Promise<Draft> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('drafts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (data) return data;
    }
    const state = this.loadLocal();
    const idx = state.drafts.findIndex((d) => d.id === id);
    if (idx >= 0) {
      state.drafts[idx] = { ...state.drafts[idx], ...updates, updated_at: new Date().toISOString() };
      this.saveLocal(state);
      return state.drafts[idx];
    }
    throw new Error(`Draft ${id} not found`);
  }

  // Suppression List
  async getSuppressionList(workspaceId: string = 'ws_default_001'): Promise<SuppressionEntry[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('suppression_list')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.suppression_list.filter((s) => s.workspace_id === workspaceId);
  }

  async addSuppression(entry: Omit<SuppressionEntry, 'added_at'>): Promise<SuppressionEntry> {
    const fullEntry: SuppressionEntry = {
      ...entry,
      added_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('suppression_list').insert(fullEntry).select().single();
      if (data) return data;
    }
    const state = this.loadLocal();
    const exists = state.suppression_list.find(
      (s) =>
        s.workspace_id === entry.workspace_id &&
        s.recipient_identifier.toLowerCase() === entry.recipient_identifier.toLowerCase()
    );
    if (!exists) {
      state.suppression_list.push(fullEntry);
      this.saveLocal(state);
    }
    return fullEntry;
  }

  // Scan Runs & Reports
  async getScanRuns(workspaceId: string = 'ws_default_001'): Promise<ScanRun[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('scan_runs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('started_at', { ascending: false });
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.scan_runs.filter((s) => s.workspace_id === workspaceId);
  }

  async createScanRun(run: ScanRun): Promise<ScanRun> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('scan_runs').insert(run).select().single();
      if (data) return data;
    }
    const state = this.loadLocal();
    state.scan_runs.unshift(run);
    this.saveLocal(state);
    return run;
  }

  async updateScanRun(id: string, updates: Partial<ScanRun>): Promise<ScanRun> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('scan_runs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (data) return data;
    }
    const state = this.loadLocal();
    const idx = state.scan_runs.findIndex((s) => s.id === id);
    if (idx >= 0) {
      state.scan_runs[idx] = { ...state.scan_runs[idx], ...updates };
      this.saveLocal(state);
      return state.scan_runs[idx];
    }
    throw new Error(`Scan run ${id} not found`);
  }

  async getReports(workspaceId: string = 'ws_default_001'): Promise<ExecutionReport[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('reports')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.reports.filter((r) => r.workspace_id === workspaceId);
  }

  async createReport(report: Omit<ExecutionReport, 'created_at'>): Promise<ExecutionReport> {
    const fullReport: ExecutionReport = {
      ...report,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin.from('reports').insert(fullReport).select().single();
      if (data) return data;
    }
    const state = this.loadLocal();
    state.reports.unshift(fullReport);
    this.saveLocal(state);
    return fullReport;
  }

  // Audit Events
  async getAuditEvents(workspaceId: string = 'ws_default_001'): Promise<AuditEvent[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('audit_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    const state = this.loadLocal();
    return state.audit_events.filter((a) => a.workspace_id === workspaceId);
  }

  async logAudit(
    event: Omit<AuditEvent, 'id' | 'created_at'>
  ): Promise<AuditEvent> {
    const fullEvent: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...event,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin.from('audit_events').insert(fullEvent);
    }
    const state = this.loadLocal();
    state.audit_events.unshift(fullEvent);
    // Keep max 500 audit events locally
    if (state.audit_events.length > 500) {
      state.audit_events = state.audit_events.slice(0, 500);
    }
    this.saveLocal(state);
    return fullEvent;
  }
}

export const repository = new Repository();
