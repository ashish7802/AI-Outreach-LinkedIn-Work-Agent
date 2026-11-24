import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getMessagingAdapter } from '@/lib/messaging';
import { MockMessagingAdapter } from '@/lib/messaging/mock-adapter';

describe('Messaging Adapter Isolation & Production Safeguards', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('prohibits silent fallback to mock adapter in production when RESEND_API_KEY is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.RESEND_API_KEY;

    expect(() => getMessagingAdapter('email')).toThrow(
      /Mock messaging fallback is strictly prohibited in production/i
    );
  });

  it('rejects mock_channel requests in production environment', () => {
    process.env.NODE_ENV = 'production';

    expect(() => getMessagingAdapter('mock_channel')).toThrow(
      /mock_channel cannot be utilized in production environment/i
    );
  });

  it('explicitly labels mock adapter output as simulated in test mode', async () => {
    const adapter = new MockMessagingAdapter();
    const result = await adapter.sendMessage({
      recipient: 'test@example.com',
      body: 'Test content',
      idempotencyKey: 'idem_test',
    });

    expect(result.success).toBe(true);
    expect(result.external_message_id?.startsWith('sim_mock_')).toBe(true);
    expect(result.raw_provider_response?.simulated).toBe(true);
    expect(result.raw_provider_response?.simulation_note).toBeDefined();
  });
});
