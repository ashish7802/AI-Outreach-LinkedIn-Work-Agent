import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResendAdapter } from '@/lib/messaging/resend-adapter';
import { repository } from '@/lib/db/repository';
import crypto from 'crypto';

describe('Webhook Authentication, Replay Protection & Deduplication', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('verifies valid HMAC signed Resend webhook within replay window', async () => {
    const secret = 'test_webhook_secret_12345';
    const adapter = new ResendAdapter('dummy_key', 'sender@domain.com', secret);

    const rawBody = JSON.stringify({
      type: 'email.delivered',
      data: {
        email_id: 'ext_msg_998877',
        to: ['recipient@client.com'],
      },
    });

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    const headers = {
      'svix-signature': signature,
      'svix-timestamp': timestamp,
    };

    const isValid = await adapter.verifyWebhook(headers, rawBody);
    expect(isValid).toBe(true);

    const event = await adapter.parseWebhook(headers, rawBody);
    expect(event).not.toBeNull();
    expect(event?.event_type).toBe('delivered');
    expect(event?.external_message_id).toBe('ext_msg_998877');
  });

  it('rejects expired webhook signatures to prevent replay attacks (> 300 seconds)', async () => {
    const secret = 'test_webhook_secret_12345';
    const adapter = new ResendAdapter('dummy_key', 'sender@domain.com', secret);

    const rawBody = JSON.stringify({ type: 'email.delivered' });
    const expiredTimestamp = (Math.floor(Date.now() / 1000) - 400).toString(); // 400s old

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${expiredTimestamp}.${rawBody}`)
      .digest('hex');

    const headers = {
      'svix-signature': signature,
      'svix-timestamp': expiredTimestamp,
    };

    const isValid = await adapter.verifyWebhook(headers, rawBody);
    expect(isValid).toBe(false);
  });

  it('fails closed in production if WEBHOOK_SIGNING_SECRET is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.WEBHOOK_SIGNING_SECRET;

    const adapter = new ResendAdapter('dummy_key', 'sender@domain.com', '');
    const headers = {
      'svix-signature': 'any_sig',
      'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
    };

    const isValid = await adapter.verifyWebhook(headers, '{}');
    expect(isValid).toBe(false);
  });

  it('idempotently processes webhooks and detects duplicate events', async () => {
    const uniqueEventId = `evt_dedup_${Date.now()}`;

    // First arrival
    const firstAttempt = await repository.recordWebhookEvent({
      id: `whk_${Date.now()}_1`,
      provider: 'resend',
      event_id: uniqueEventId,
      event_type: 'delivered',
      recipient_identifier: 'test@client.com',
    });
    expect(firstAttempt.recorded).toBe(true);
    expect(firstAttempt.duplicate).toBe(false);

    // Duplicate replay of the exact same event
    const secondAttempt = await repository.recordWebhookEvent({
      id: `whk_${Date.now()}_2`,
      provider: 'resend',
      event_id: uniqueEventId,
      event_type: 'delivered',
      recipient_identifier: 'test@client.com',
    });
    expect(secondAttempt.recorded).toBe(false);
    expect(secondAttempt.duplicate).toBe(true);
  });
});
