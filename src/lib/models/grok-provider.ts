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

export class GrokProvider implements ModelProvider {
  name = 'Grok API (xAI)';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'grok-2-1212') {
    this.apiKey = apiKey || process.env.GROK_API_KEY || '';
    this.model = process.env.GROK_MODEL || model;
  }

  private async callChat(systemPrompt: string, userPrompt: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('GROK_API_KEY is not configured in environment variables or settings.');
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
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
      throw new Error(`Grok API request failed (${response.status}): ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    return JSON.parse(content);
  }

  async researchLeads(campaign: Campaign, criteria: string): Promise<ValidatedLeadResearch> {
    const systemPrompt = `You are Grok, an AI researcher. Extract leads strictly from verifiable public facts. Return JSON matching schema_version "v1" and discovered_leads array.`;
    const raw = await this.callChat(systemPrompt, `Campaign: ${campaign.name}. Criteria: ${criteria}`);
    return LeadResearchEnvelopeSchema.parse(raw);
  }

  async generateInstructions(params: {
    campaign: Campaign;
    leads: Lead[];
    contextNotes?: string;
  }): Promise<ValidatedInstructionEnvelope> {
    const systemPrompt = `You are Grok. Plan outreach instructions for these verified leads. Never invent contact details. Return JSON with schema_version "v1".`;
    const raw = await this.callChat(systemPrompt, JSON.stringify(params));
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
    const systemPrompt = `Analyze execution report accurately. Return JSON with 'analysis' and 'next_actions'.`;
    return await this.callChat(systemPrompt, JSON.stringify(params));
  }

  async auditLinkedInProfile(profileText: {
    headline: string;
    about: string;
    experience: string[];
    skills: string[];
  }): Promise<ValidatedProfileAudit> {
    const systemPrompt = `Audit the LinkedIn profile. Highlight positioning gaps. Return JSON matching LinkedInProfileAuditSchema.`;
    const raw = await this.callChat(systemPrompt, JSON.stringify(profileText));
    return LinkedInProfileAuditSchema.parse(raw);
  }

  async draftLinkedInPost(brief: {
    topic: string;
    projectOrLearningEvidence: string;
    targetAudience: string;
    tone?: string;
  }): Promise<ValidatedLinkedInDraft> {
    const systemPrompt = `Draft a LinkedIn post using only the provided real project facts. Return JSON matching LinkedInDraftPostSchema.`;
    const raw = await this.callChat(systemPrompt, JSON.stringify(brief));
    return LinkedInDraftPostSchema.parse(raw);
  }
}
