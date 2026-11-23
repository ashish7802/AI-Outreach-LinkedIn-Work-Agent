import { MessageStatus } from '@/types';

export interface SendResult {
  success: boolean;
  external_message_id?: string;
  initial_status: MessageStatus;
  raw_provider_response?: any;
  error?: string;
}

export interface WebhookEventPayload {
  provider: string;
  event_type: 'delivered' | 'read' | 'failed' | 'bounced' | 'complaint' | 'reply_received';
  external_message_id: string;
  recipient_identifier?: string;
  timestamp: string;
  reply_content?: string;
  error_details?: string;
  raw_payload: any;
}

export interface MessagingAdapter {
  name: string;
  channel: string;

  /**
   * Send the exact instructed message
   */
  sendMessage(params: {
    recipient: string;
    subject?: string;
    body: string;
    idempotencyKey: string;
  }): Promise<SendResult>;

  /**
   * Verify authenticity of incoming webhook headers & signature
   */
  verifyWebhook(headers: Record<string, string>, rawBody: string): Promise<boolean>;

  /**
   * Parse vendor webhook into unified format
   */
  parseWebhook(headers: Record<string, string>, rawBody: string): Promise<WebhookEventPayload | null>;
}
