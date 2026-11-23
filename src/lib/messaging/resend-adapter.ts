import crypto from 'crypto';
import { MessagingAdapter, SendResult, WebhookEventPayload } from './types';

export class ResendAdapter implements MessagingAdapter {
  name = 'Resend Transactional Email';
  channel = 'email';

  private apiKey: string;
  private fromEmail: string;
  private webhookSecret: string;

  constructor(apiKey?: string, fromEmail?: string, webhookSecret?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || '';
    this.fromEmail = fromEmail || process.env.RESEND_FROM_EMAIL || 'outreach@yourdomain.com';
    this.webhookSecret = webhookSecret || process.env.WEBHOOK_SIGNING_SECRET || '';
  }

  async sendMessage(params: {
    recipient: string;
    subject?: string;
    body: string;
    idempotencyKey: string;
  }): Promise<SendResult> {
    if (!this.apiKey) {
      return {
        success: false,
        initial_status: 'failed',
        error: 'Resend API key is unconfigured. Mark message as needs_review or configure RESEND_API_KEY.',
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'Idempotency-Key': params.idempotencyKey,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: params.recipient,
          subject: params.subject || 'Follow-up regarding your technical updates',
          text: params.body,
        }),
      });

      const resBody = await response.json();

      if (!response.ok) {
        return {
          success: false,
          initial_status: 'failed',
          error: resBody?.message || `Resend HTTP error ${response.status}`,
          raw_provider_response: resBody,
        };
      }

      return {
        success: true,
        external_message_id: resBody.id,
        initial_status: 'sent',
        raw_provider_response: resBody,
      };
    } catch (err: any) {
      return {
        success: false,
        initial_status: 'failed',
        error: err.message || 'Unknown network error calling Resend API',
      };
    }
  }

  async verifyWebhook(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    if (!this.webhookSecret) {
      // In development if no secret is set, log warning
      return true;
    }

    // Standard Svix / Resend HMAC verification: svix-signature header
    const signature = headers['svix-signature'] || headers['resend-signature'];
    const timestamp = headers['svix-timestamp'] || headers['resend-timestamp'];

    if (!signature || !timestamp) {
      return false;
    }

    // Check timestamp freshness (within 5 minutes)
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

      return signature.includes(expectedSignature);
    } catch {
      return false;
    }
  }

  async parseWebhook(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookEventPayload | null> {
    try {
      const payload = JSON.parse(rawBody);
      const type = payload.type; // e.g. 'email.delivered', 'email.bounced', 'email.complained'
      const data = payload.data || {};

      let event_type: WebhookEventPayload['event_type'] = 'delivered';
      if (type === 'email.delivered') event_type = 'delivered';
      else if (type === 'email.bounced') event_type = 'bounced';
      else if (type === 'email.complained') event_type = 'complaint';
      else if (type === 'email.replied' || type === 'inbound.email') event_type = 'reply_received';
      else return null;

      return {
        provider: 'resend',
        event_type,
        external_message_id: data.email_id || data.id,
        recipient_identifier: data.to?.[0] || data.recipient,
        timestamp: payload.created_at || new Date().toISOString(),
        reply_content: data.text || data.html,
        raw_payload: payload,
      };
    } catch {
      return null;
    }
  }
}
