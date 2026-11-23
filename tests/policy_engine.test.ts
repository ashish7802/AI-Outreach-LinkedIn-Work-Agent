import { describe, it, expect } from 'vitest';
import { SendPolicyEngine } from '@/lib/policy/engine';
import { WorkspaceConfig, CampaignInstruction, Integration, SuppressionEntry } from '@/types';

describe('Deterministic Send Policy Engine', () => {
  const baseWorkspace: WorkspaceConfig = {
    id: 'ws_test',
    name: 'Test Workspace',
    timezone: 'Asia/Kolkata',
    agent_status: 'active',
    sending_status: 'active',
    daily_send_cap: 10,
    quiet_hours_start: 21,
    quiet_hours_end: 8,
    require_manual_review_for_new_leads: false,
    model_provider: 'mock',
    handoff_mode: 'api_orchestration',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const validInstruction: CampaignInstruction = {
    id: 'inst_test_01',
    workspace_id: 'ws_test',
    campaign_id: 'cmp_test',
    lead_id: 'lead_test',
    channel: 'email',
    recipient_identifier: 'lead@validcompany.example.com',
    exact_message_text: 'Hello, this is a verified outbound message proposal.',
    message_purpose: 'Initial outreach',
    validation_status: 'validated',
    schema_version: 'v1',
    created_at: new Date().toISOString(),
  };

  const readyIntegration: Integration = {
    id: 'int_test',
    workspace_id: 'ws_test',
    provider: 'resend',
    category: 'messaging',
    status: 'connected',
    account_identifier: 'sender@agent.local',
    granted_permissions: ['messages:send'],
    settings: {},
  };

  it('approves send when all criteria are met outside quiet hours', () => {
    // 14:00 (2 PM) in Asia/Kolkata -> Safe daytime
    const daytime = new Date('2026-11-23T08:30:00Z'); // 14:00 IST

    const result = SendPolicyEngine.evaluate({
      instruction: validInstruction,
      workspace: baseWorkspace,
      integration: readyIntegration,
      suppressionList: [],
      todaySentCount: 2,
      currentTime: daytime,
    });

    expect(result.passed).toBe(true);
    expect(result.reasons.length).toBe(0);
  });

  it('blocks send if current time is within quiet hours (e.g. 23:00 IST)', () => {
    // 17:30 UTC = 23:00 Asia/Kolkata
    const nightTime = new Date('2026-11-23T17:30:00Z');

    const result = SendPolicyEngine.evaluate({
      instruction: validInstruction,
      workspace: baseWorkspace,
      integration: readyIntegration,
      suppressionList: [],
      todaySentCount: 0,
      currentTime: nightTime,
    });

    expect(result.passed).toBe(false);
    expect(result.quiet_hours_active).toBe(true);
    expect(result.reasons.some((r) => r.includes('quiet hours'))).toBe(true);
  });

  it('blocks send if recipient is in the suppression list', () => {
    const suppression: SuppressionEntry[] = [
      {
        id: 'sup_1',
        workspace_id: 'ws_test',
        recipient_identifier: 'lead@validcompany.example.com',
        channel: 'email',
        reason: 'unsubscribed',
        added_at: new Date().toISOString(),
      },
    ];

    const daytime = new Date('2026-11-23T08:30:00Z');
    const result = SendPolicyEngine.evaluate({
      instruction: validInstruction,
      workspace: baseWorkspace,
      integration: readyIntegration,
      suppressionList: suppression,
      todaySentCount: 0,
      currentTime: daytime,
    });

    expect(result.passed).toBe(false);
    expect(result.suppressed).toBe(true);
    expect(result.reasons.some((r) => r.includes('suppression'))).toBe(true);
  });

  it('blocks send when daily send cap is exceeded', () => {
    const daytime = new Date('2026-11-23T08:30:00Z');
    const result = SendPolicyEngine.evaluate({
      instruction: validInstruction,
      workspace: baseWorkspace,
      integration: readyIntegration,
      suppressionList: [],
      todaySentCount: 10, // cap is 10
      currentTime: daytime,
    });

    expect(result.passed).toBe(false);
    expect(result.daily_cap_exceeded).toBe(true);
  });

  it('blocks send when global agent or sending is paused', () => {
    const pausedWorkspace = { ...baseWorkspace, agent_status: 'paused' as const };
    const daytime = new Date('2026-11-23T08:30:00Z');

    const result = SendPolicyEngine.evaluate({
      instruction: validInstruction,
      workspace: pausedWorkspace,
      integration: readyIntegration,
      suppressionList: [],
      todaySentCount: 0,
      currentTime: daytime,
    });

    expect(result.passed).toBe(false);
    expect(result.agent_paused).toBe(true);
  });
});
