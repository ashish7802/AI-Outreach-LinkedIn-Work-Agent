import { describe, it, expect } from 'vitest';
import { LinkedInOfficialAdapter } from '@/lib/messaging/linkedin-adapter';

describe('LinkedIn Integration Safety & Permission Checking', () => {
  it('truthfully marks publishing unavailable when credentials are not configured', async () => {
    const adapter = new LinkedInOfficialAdapter();
    const status = adapter.getIntegrationStatus();

    // In clean test environment without LINKEDIN_ACCESS_TOKEN
    expect(status.configured).toBe(false);
    expect(status.hasPublishPermission).toBe(false);
    expect(status.missingRequirements.length).toBeGreaterThan(0);

    const draft = {
      id: 'draft_1',
      workspace_id: 'ws_test',
      type: 'linkedin_post' as const,
      title: 'Architecting AI Agents',
      content: 'Production AI agents require strict server-side policy engines.',
      status: 'draft' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const publishResult = await adapter.publishPost(draft);

    expect(publishResult.published).toBe(false);
    expect(publishResult.status).toBe('unavailable');
    expect(publishResult.draft_ready_for_manual_copy).toBeDefined();
    expect(publishResult.reason).toContain('direct API publishing is unavailable');
  });
});
