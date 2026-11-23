import { ModelProvider } from './types';
import {
  ValidatedInstructionEnvelope,
  ValidatedLeadResearch,
  ValidatedProfileAudit,
  ValidatedLinkedInDraft,
  ModelInstructionsEnvelopeSchema,
  LinkedInProfileAuditSchema,
  LinkedInDraftPostSchema,
  LeadResearchEnvelopeSchema,
} from '../schemas/instruction';
import { ExecutionReport, Lead, Campaign } from '@/types';

export class OpenAIProvider implements ModelProvider {
  name = 'OpenAI API (GPT-4o)';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_MODEL || model;
  }

  private async callChat(systemPrompt: string, userPrompt: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables or settings.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API request failed (${response.status}): ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    return JSON.parse(content);
  }

  async researchLeads(campaign: Campaign, criteria: string): Promise<ValidatedLeadResearch> {
    const systemPrompt = `You are an AI research assistant. Your task is to extract and recommend potential business leads based strictly on verifiable public information.
Return JSON strictly adhering to schema_version "v1" and discovered_leads array.`;
    const userPrompt = `Campaign: ${campaign.name} (${campaign.purpose}). Target: ${campaign.target_audience || criteria}.`;
    const raw = await this.callChat(systemPrompt, userPrompt);
    return LeadResearchEnvelopeSchema.parse(raw);
  }

  async generateInstructions(params: {
    campaign: Campaign;
    leads: Lead[];
    contextNotes?: string;
  }): Promise<ValidatedInstructionEnvelope> {
    const systemPrompt = `You are an AI Outreach Planner. Formulate exact outreach messages for the provided leads.
RULES:
1. Do not invent recipient emails or claims.
2. Channel must be "${params.campaign.channel}".
3. Provide exact message text, message purpose, and follow-up conditions.
4. Output valid JSON matching schema_version "v1".`;

    const userPrompt = JSON.stringify({
      campaign: { id: params.campaign.id, name: params.campaign.name, purpose: params.campaign.purpose },
      leads: params.leads.map((l) => ({
        id: l.id,
        contact_name: l.full_name,
        company: l.company_name,
        recipient_identifier: l.recipient_identifier,
        evidence: l.evidence,
        source_url: l.source_url,
      })),
      context: params.contextNotes,
    });

    const raw = await this.callChat(systemPrompt, userPrompt);
    return ModelInstructionsEnvelopeSchema.parse(raw);
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
    const systemPrompt = `Analyze this execution report. Do not claim messages were delivered or read unless explicitly recorded in report. Return JSON with 'analysis' (string) and 'next_actions' (array).`;
    const userPrompt = JSON.stringify({ report: params.report, campaign: params.campaign });
    return await this.callChat(systemPrompt, userPrompt);
  }

  async auditLinkedInProfile(profileText: {
    headline: string;
    about: string;
    experience: string[];
    skills: string[];
  }): Promise<ValidatedProfileAudit> {
    const systemPrompt = `Audit the LinkedIn profile. Identify gaps in headline, About, experience, and positioning. Suggest verified improvements without inventing achievements. Return JSON.`;
    const raw = await this.callChat(systemPrompt, JSON.stringify(profileText));
    return LinkedInProfileAuditSchema.parse(raw);
  }

  async draftLinkedInPost(brief: {
    topic: string;
    projectOrLearningEvidence: string;
    targetAudience: string;
    tone?: string;
  }): Promise<ValidatedLinkedInDraft> {
    const systemPrompt = `Draft a LinkedIn post based ONLY on the provided real project evidence. Return JSON with title, content, target_audience, tags, key_takeaway.`;
    const raw = await this.callChat(systemPrompt, JSON.stringify(brief));
    return LinkedInDraftPostSchema.parse(raw);
  }
}
