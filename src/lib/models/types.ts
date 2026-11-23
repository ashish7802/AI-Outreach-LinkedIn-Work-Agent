import {
  ValidatedInstructionEnvelope,
  ValidatedLeadResearch,
  ValidatedProfileAudit,
  ValidatedLinkedInDraft,
} from '../schemas/instruction';
import { ExecutionReport, Lead, Campaign } from '@/types';

export interface ModelProvider {
  name: string;

  /**
   * Conduct simulated or prompt-driven lead research based on campaign targets
   */
  researchLeads(campaign: Campaign, criteria: string): Promise<ValidatedLeadResearch>;

  /**
   * Generate exact structured campaign instructions from verified leads
   */
  generateInstructions(params: {
    campaign: Campaign;
    leads: Lead[];
    contextNotes?: string;
  }): Promise<ValidatedInstructionEnvelope>;

  /**
   * Analyze an execution report and formulate recommended next actions
   */
  analyzeReportAndPlanNext(params: {
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
  }>;

  /**
   * Review LinkedIn profile text, identifying gaps and suggesting copy
   */
  auditLinkedInProfile(profileText: {
    headline: string;
    about: string;
    experience: string[];
    skills: string[];
  }): Promise<ValidatedProfileAudit>;

  /**
   * Draft authentic professional LinkedIn posts based on real work/learning
   */
  draftLinkedInPost(brief: {
    topic: string;
    projectOrLearningEvidence: string;
    targetAudience: string;
    tone?: string;
  }): Promise<ValidatedLinkedInDraft>;
}
