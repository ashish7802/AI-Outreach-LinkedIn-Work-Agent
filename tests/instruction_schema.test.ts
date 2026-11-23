import { describe, it, expect } from 'vitest';
import {
  ModelInstructionsEnvelopeSchema,
  LinkedInProfileAuditSchema,
  LinkedInDraftPostSchema,
} from '@/lib/schemas/instruction';

describe('Model Instructions & Output Schema Validation', () => {
  it('validates compliant model instruction envelope', () => {
    const payload = {
      schema_version: 'v1',
      campaign_id: 'cmp_ai_01',
      generated_at: new Date().toISOString(),
      instructions: [
        {
          campaign_id: 'cmp_ai_01',
          lead_id: 'lead_100',
          contact_name: 'Sarah Connor',
          public_source_url: 'https://example.com/blog',
          evidence: 'Published research on autonomous systems',
          channel: 'email',
          recipient_identifier: 'sarah@example.com',
          exact_message_text: 'Hi Sarah, loved your engineering article on distributed state.',
          message_purpose: 'Initial introduction',
          constraints: {},
        },
      ],
    };

    const parsed = ModelInstructionsEnvelopeSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('rejects instructions with missing required fields or invalid schema version', () => {
    const invalidPayload = {
      schema_version: 'v2', // Invalid schema version
      campaign_id: 'cmp_01',
      instructions: [
        {
          // missing lead_id, contact_name, recipient_identifier, exact_message_text
          campaign_id: 'cmp_01',
          channel: 'email',
        },
      ],
    };

    const parsed = ModelInstructionsEnvelopeSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it('validates LinkedIn profile audit output schema', () => {
    const validAudit = {
      headline_evaluation: {
        current_assessment: 'Needs specialization focus',
        score: 75,
        recommended_headlines: ['Lead AI Engineer | Next.js & Supabase Architecture'],
      },
      about_summary_evaluation: {
        strengths: ['Hands on experience'],
        gaps: ['Missing quantifiable metrics'],
        recommended_replacement_copy: 'Experienced engineer focusing on deterministic workflows...',
      },
      experience_and_positioning: {
        critique: 'Clear history',
        actionable_improvements: ['Link live agent dashboard'],
      },
      suggested_featured_topics: ['Deterministic Policy Engines'],
    };

    const parsed = LinkedInProfileAuditSchema.safeParse(validAudit);
    expect(parsed.success).toBe(true);
  });
});
