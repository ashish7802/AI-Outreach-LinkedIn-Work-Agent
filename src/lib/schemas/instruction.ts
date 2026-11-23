import { z } from 'zod';

export const CampaignInstructionItemSchema = z.object({
  campaign_id: z.string().min(1, 'Campaign ID is required'),
  lead_id: z.string().min(1, 'Lead ID is required'),
  contact_name: z.string().min(1, 'Contact name is required'),
  public_source_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  evidence: z.string().min(3, 'Evidence is required'),
  channel: z.enum(['email', 'linkedin_message', 'mock_channel']),
  recipient_identifier: z.string().min(3, 'Valid recipient identifier is required'),
  exact_message_text: z.string().min(10, 'Message text must be at least 10 characters'),
  message_purpose: z.string().min(3, 'Message purpose is required'),
  suggested_send_time: z.string().optional(),
  follow_up_conditions: z.string().optional(),
  constraints: z.record(z.any()).optional().default({}),
});

export const ModelInstructionsEnvelopeSchema = z.object({
  schema_version: z.literal('v1'),
  campaign_id: z.string().min(1),
  generated_at: z.string(),
  reasoning_summary: z.string().optional(),
  instructions: z.array(CampaignInstructionItemSchema).min(1, 'At least one instruction required'),
});

export type ValidatedInstructionEnvelope = z.infer<typeof ModelInstructionsEnvelopeSchema>;
export type ValidatedInstructionItem = z.infer<typeof CampaignInstructionItemSchema>;

export const LeadResearchItemSchema = z.object({
  full_name: z.string().min(1),
  company_name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  recipient_identifier: z.string().min(3),
  source_url: z.string().url(),
  evidence: z.string().min(5),
  fit_score: z.number().int().min(1).max(100),
});

export const LeadResearchEnvelopeSchema = z.object({
  schema_version: z.literal('v1'),
  discovered_leads: z.array(LeadResearchItemSchema),
});

export type ValidatedLeadResearch = z.infer<typeof LeadResearchEnvelopeSchema>;

export const LinkedInProfileAuditSchema = z.object({
  headline_evaluation: z.object({
    current_assessment: z.string(),
    score: z.number().min(0).max(100),
    recommended_headlines: z.array(z.string()).min(1),
  }),
  about_summary_evaluation: z.object({
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    recommended_replacement_copy: z.string(),
  }),
  experience_and_positioning: z.object({
    critique: z.string(),
    actionable_improvements: z.array(z.string()),
  }),
  suggested_featured_topics: z.array(z.string()),
});

export type ValidatedProfileAudit = z.infer<typeof LinkedInProfileAuditSchema>;

export const LinkedInDraftPostSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(20, 'Post content must be substantive'),
  target_audience: z.string(),
  tags: z.array(z.string()).default([]),
  key_takeaway: z.string(),
});

export type ValidatedLinkedInDraft = z.infer<typeof LinkedInDraftPostSchema>;
