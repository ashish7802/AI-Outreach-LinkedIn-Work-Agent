import { ModelProvider } from './types';
import {
  ValidatedInstructionEnvelope,
  ValidatedLeadResearch,
  ValidatedProfileAudit,
  ValidatedLinkedInDraft,
} from '../schemas/instruction';
import { ExecutionReport, Lead, Campaign } from '@/types';

export class MockModelProvider implements ModelProvider {
  name = 'Mock AI Engine (Deterministic)';

  async researchLeads(campaign: Campaign, criteria: string): Promise<ValidatedLeadResearch> {
    const timestamp = Date.now();
    return {
      schema_version: 'v1',
      discovered_leads: [
        {
          full_name: 'Ananya Deshmukh',
          company_name: 'Vertex Data Labs',
          title: 'Head of Infrastructure',
          email: `ananya.${timestamp.toString().slice(-4)}@vertexdatalabs.example.com`,
          linkedin_url: 'https://linkedin.com/in/ananya-deshmukh-sample',
          recipient_identifier: `ananya.${timestamp.toString().slice(-4)}@vertexdatalabs.example.com`,
          source_url: 'https://vertexdatalabs.example.com/blog/migrating-to-event-driven-agents',
          evidence: 'Published detailed technical teardown on reducing LLM pipeline latency by 45%. Mentioned ongoing migration to automated worker pipelines.',
          fit_score: 94,
        },
        {
          full_name: 'Siddharth Roy',
          company_name: 'OmniChain Global',
          title: 'VP of Product & Engineering',
          email: `siddharth.${timestamp.toString().slice(-4)}@omnichain.example.com`,
          linkedin_url: 'https://linkedin.com/in/siddharth-roy-sample',
          recipient_identifier: `siddharth.${timestamp.toString().slice(-4)}@omnichain.example.com`,
          source_url: 'https://omnichain.example.com/press/series-b-automation-roadmap',
          evidence: 'Announced investment into supply-chain autonomous messaging systems and API integrations.',
          fit_score: 87,
        },
      ],
    };
  }

  async generateInstructions(params: {
    campaign: Campaign;
    leads: Lead[];
    contextNotes?: string;
  }): Promise<ValidatedInstructionEnvelope> {
    const instructions = params.leads.map((lead) => ({
      campaign_id: params.campaign.id,
      lead_id: lead.id,
      contact_name: lead.full_name,
      public_source_url: lead.source_url || '',
      evidence: lead.evidence || 'Public company engineering announcements',
      channel: params.campaign.channel,
      recipient_identifier: lead.recipient_identifier,
      exact_message_text: `Hi ${lead.full_name.split(' ')[0]},\n\nI noticed ${lead.company_name}'s recent work regarding ${lead.evidence ? lead.evidence.slice(0, 80) : 'your platform engineering roadmap'}.\n\nWe build deterministic AI worker agents with strict audit trails and zero hallucinated execution. Would you be open to a brief 10-minute exchange on your automation architecture next Tuesday?\n\nBest regards,\nEngineering Team`,
      message_purpose: 'Initial value-led outreach with verifiable context',
      suggested_send_time: new Date(Date.now() + 3600 * 1000).toISOString(),
      follow_up_conditions: 'Wait 4 business days if no reply received. Do not follow up if unsubscribed.',
      constraints: {
        channel: params.campaign.channel,
        max_tokens: 350,
      },
    }));

    return {
      schema_version: 'v1',
      campaign_id: params.campaign.id,
      generated_at: new Date().toISOString(),
      reasoning_summary: `Generated ${instructions.length} personalized messages adhering strictly to verified public evidence and workspace policies.`,
      instructions,
    };
  }

  async analyzeReportAndPlanNext(params: {
    report: ExecutionReport;
    campaign: Campaign;
  }): Promise<{
    analysis: string;
    next_actions: Array<{
      lead_id: string;
      action_type: string;
      recommended_message?: string;
      reason: string;
    }>;
  }> {
    const deliveredRate =
      params.report.messages_sent > 0
        ? Math.round((params.report.messages_delivered / params.report.messages_sent) * 100)
        : 100;

    return {
      analysis: `Campaign ${params.campaign.name} processed ${params.report.leads_processed} leads with ${params.report.messages_sent} sent messages (${deliveredRate}% confirmed delivered) and ${params.report.replies_received} inbound replies. No policy violations encountered.`,
      next_actions: [
        {
          lead_id: 'lead_002',
          action_type: 'schedule_followup',
          recommended_message: 'Hi Priya, thanks for the reply! Sharing the technical whitepaper on durable worker queues as discussed.',
          reason: 'Inbound positive reply received regarding data infrastructure.',
        },
      ],
    };
  }

  async auditLinkedInProfile(profileText: {
    headline: string;
    about: string;
    experience: string[];
    skills: string[];
  }): Promise<ValidatedProfileAudit> {
    return {
      headline_evaluation: {
        current_assessment:
          profileText.headline.length < 30
            ? 'Headline is somewhat generic and does not highlight your core specialization in AI agent architecture and distributed systems.'
            : 'Clear technical direction, but could emphasize business outcome impact and verifiable stack expertise.',
        score: 78,
        recommended_headlines: [
          'Full-Stack AI Agent Architect | Building Deterministic Outreach & Workflow Automation | Next.js, Supabase, TypeScript',
          'Senior AI Systems Engineer | Autonomous Business Workflows, LLM Orchestration & Distributed Integrations',
          'Lead Full-Stack Engineer | AI Agents with Auditability & Real-Time Sync | Cloud Native & Serverless',
        ],
      },
      about_summary_evaluation: {
        strengths: [
          'Demonstrates solid hands-on engineering background and full-stack capabilities.',
          'Mentions genuine production tools and modern software design principles.',
        ],
        gaps: [
          'Lacks direct mention of real-world constraints handled (e.g. rate limits, idempotency, webhook security).',
          'Call to action for prospective technical partners or clients could be sharper.',
        ],
        recommended_replacement_copy:
          "I build autonomous AI systems designed for predictability, enterprise security, and verified execution.\n\nUnlike experimental chatbots, my architectures emphasize deterministic send policies, row-level data isolation, and auditable API integrations across Next.js, Supabase, and modern model providers (Grok, OpenAI).\n\nKey focus areas:\n• Full-Stack Agentic Applications (TypeScript, Next.js App Router, Tailwind)\n• Reliable Background Automation & Idempotent Worker Queues\n• Official Integrations (LinkedIn, Transactional Email, Webhook Event Ingestion)\n\nInterested in exploring robust AI workflows? Let's connect.",
      },
      experience_and_positioning: {
        critique:
          'Positioning is strong when backed by concrete project outcomes. Highlight verifiable project metrics without claiming unverified client results.',
        actionable_improvements: [
          'Add a Featured Work link showcasing your open architecture repository and live agent dashboard.',
          'Quantify backend resilience: emphasize zero-duplicate idempotency and signed webhook handling.',
          'Pin verified technical skills: Next.js, TypeScript, Supabase, Zod, API Integrations.',
        ],
      },
      suggested_featured_topics: [
        'Deterministic Send Policies: Why AI Agents Must Never Decide Send Eligibility Alone',
        'Building Idempotent Webhook Handlers for Transactional Outreach',
        'State Machines in Next.js: Coordinating Model Outputs with Persistent Databases',
      ],
    };
  }

  async draftLinkedInPost(brief: {
    topic: string;
    projectOrLearningEvidence: string;
    targetAudience: string;
    tone?: string;
  }): Promise<ValidatedLinkedInDraft> {
    return {
      title: `Architecting Predictable AI Agents: Lessons from ${brief.topic}`,
      content: `Most AI demos break down the moment they interact with production APIs.

When building an automated work and outreach agent, letting an LLM execute actions directly is a recipe for duplicate sends, spam flags, and broken state.

Here is the deterministic architecture we implemented to solve this:

1. Strict Schema Enforcement: Every model output is validated against a versioned Zod schema before anything touches the database.
2. Server-Side Policy Guardrails: The model proposes actions; our server-side policy engine verifies quiet hours (Asia/Kolkata), rate caps, suppression lists, and pause states.
3. Idempotent Senders: Every outbound message generates a deterministic hash key so retries never double-send.
4. Truthful Status Tracking: If a provider does not support read receipts, it is marked as 'not_supported'—never guessed.

Real evidence: ${brief.projectOrLearningEvidence.slice(0, 150)}

How are you handling safety boundaries in your autonomous agents?`,
      target_audience: brief.targetAudience || 'Founders, Tech Leads, and AI Engineers',
      tags: ['AIEngineering', 'SystemArchitecture', 'NextJS', 'TypeScript', 'SoftwareEngineering'],
      key_takeaway: 'Decouple AI planning from deterministic server-side execution for safe agentic workflows.',
    };
  }
}
