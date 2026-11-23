import { repository } from '@/lib/db/repository';
import { getModelProvider } from '@/lib/models';
import { linkedInAdapter } from '@/lib/messaging/linkedin-adapter';
import { Draft } from '@/types';
import { ValidatedProfileAudit } from '@/lib/schemas/instruction';

export class LinkedInWorkManager {
  /**
   * Audit LinkedIn profile content and save structured optimization recommendations
   */
  static async auditProfile(
    profileText: {
      headline: string;
      about: string;
      experience: string[];
      skills: string[];
    },
    workspaceId: string = 'ws_default_001'
  ): Promise<ValidatedProfileAudit> {
    const workspace = await repository.getWorkspace(workspaceId);
    const model = getModelProvider(workspace.model_provider);

    const audit = await model.auditLinkedInProfile(profileText);

    // Save replacement copy as a draft for review
    await repository.createDraft({
      id: `draft_profile_${Date.now()}`,
      workspace_id: workspaceId,
      type: 'profile_copy',
      title: 'Optimized LinkedIn About Summary',
      content: audit.about_summary_evaluation.recommended_replacement_copy,
      status: 'draft',
      metadata: {
        headline_options: audit.headline_evaluation.recommended_headlines,
        audit_score: audit.headline_evaluation.score,
      },
    });

    await repository.logAudit({
      workspace_id: workspaceId,
      event_type: 'linkedin_profile_audited',
      actor: 'profile_optimizer',
      severity: 'info',
      details: {
        score: audit.headline_evaluation.score,
        gaps_identified: audit.about_summary_evaluation.gaps.length,
      },
    });

    return audit;
  }

  /**
   * Generate authentic post drafts strictly from verified work & technical learnings
   */
  static async draftPost(
    params: {
      topic: string;
      projectOrLearningEvidence: string;
      targetAudience: string;
      tone?: string;
    },
    workspaceId: string = 'ws_default_001'
  ): Promise<Draft> {
    const workspace = await repository.getWorkspace(workspaceId);
    const model = getModelProvider(workspace.model_provider);

    const draftResult = await model.draftLinkedInPost(params);

    const draft = await repository.createDraft({
      id: `draft_li_${Date.now()}`,
      workspace_id: workspaceId,
      type: 'linkedin_post',
      title: draftResult.title,
      content: draftResult.content,
      status: 'draft',
      target_audience: draftResult.target_audience,
      tags: draftResult.tags,
      metadata: {
        key_takeaway: draftResult.key_takeaway,
        source_topic: params.topic,
      },
    });

    await repository.logAudit({
      workspace_id: workspaceId,
      event_type: 'linkedin_post_drafted',
      actor: 'linkedin_work_manager',
      severity: 'info',
      details: { draft_id: draft.id, title: draft.title },
    });

    return draft;
  }

  /**
   * Publish or prepare manual copy draft
   */
  static async publishOrPrepareDraft(draftId: string, workspaceId: string = 'ws_default_001') {
    const drafts = await repository.getDrafts(workspaceId);
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    const publishResult = await linkedInAdapter.publishPost(draft);

    if (publishResult.published) {
      await repository.updateDraft(draftId, {
        status: 'published',
        published_at: new Date().toISOString(),
        external_post_id: publishResult.external_post_id,
      });

      await repository.logAudit({
        workspace_id: workspaceId,
        event_type: 'linkedin_post_published',
        actor: 'linkedin_adapter',
        severity: 'info',
        details: { draft_id: draftId, external_post_id: publishResult.external_post_id },
      });
    } else {
      await repository.updateDraft(draftId, {
        status: 'ready_to_publish',
        metadata: {
          ...draft.metadata,
          publish_limitation_reason: publishResult.reason,
          ready_copy: publishResult.draft_ready_for_manual_copy,
        },
      });

      await repository.logAudit({
        workspace_id: workspaceId,
        event_type: 'linkedin_direct_publish_unavailable',
        actor: 'linkedin_adapter',
        severity: 'warn',
        details: { draft_id: draftId, reason: publishResult.reason },
      });
    }

    return publishResult;
  }
}
