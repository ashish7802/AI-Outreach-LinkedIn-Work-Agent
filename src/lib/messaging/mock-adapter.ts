import { MessagingAdapter, SendResult, WebhookEventPayload } from './types';

export class MockMessagingAdapter implements MessagingAdapter {
  name = 'Mock Messaging Adapter (Simulated Test Mode Only)';
  channel = 'mock_channel';

  async sendMessage(params: {
    recipient: string;
    subject?: string;
    body: string;
    idempotencyKey: string;
  }): Promise<SendResult> {
    const extId = `sim_mock_ext_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    return {
      success: true,
      external_message_id: extId,
      initial_status: 'sent',
      raw_provider_response: {
        provider: 'mock_channel',
        external_id: extId,
        dispatched_to: params.recipient,
        body_length: params.body.length,
        simulated: true,
        simulation_note: 'This is a simulated message send for non-production development/testing only.',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async verifyWebhook(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    // In mock mode, verify mock auth token if supplied
    const token = headers['x-mock-signature'] || headers['authorization'];
    if (token && token.includes('invalid')) {
      return false;
    }
    return true;
  }

  async parseWebhook(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookEventPayload | null> {
    try {
      const data = JSON.parse(rawBody);
      return {
        provider: 'mock_channel',
        event_type: data.event_type || 'delivered',
        external_message_id: data.external_message_id,
        recipient_identifier: data.recipient_identifier,
        timestamp: data.timestamp || new Date().toISOString(),
        reply_content: data.reply_content,
        error_details: data.error_details,
        raw_payload: {
          ...data,
          simulated: true,
        },
      };
    } catch {
      return null;
    }
  }
}
