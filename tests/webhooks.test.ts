import { describe, it, expect } from 'vitest';
import { ResendAdapter } from '@/lib/messaging/resend-adapter';
import { MockMessagingAdapter } from '@/lib/messaging/mock-adapter';
import crypto from 'crypto';

describe('Webhook Authentication & Processing', () => {
  it('verifies valid HMAC signed Resend webhook', async () => {
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

  it('rejects expired or forged webhook signatures', async () => {
    const secret = 'test_webhook_secret_12345';
    const adapter = new ResendAdapter('dummy_key', 'sender@domain.com', secret);

    const rawBody = JSON.stringify({ type: 'email.delivered' });
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 1000).toString(); // expired > 5 min

    const headers = {
      'svix-signature': 'forged_or_invalid_signature',
      'svix-timestamp': oldTimestamp,
    };

    const isValid = await adapter.verifyWebhook(headers, rawBody);
    expect(isValid).toBe(false);
  });
});
