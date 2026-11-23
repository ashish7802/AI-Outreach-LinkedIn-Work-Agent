import { NextResponse } from 'next/server';
import { getMessagingAdapter } from '@/lib/messaging';
import { repository } from '@/lib/db/repository';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    const adapter = getMessagingAdapter('email');

    // 1. Signature Verification
    const isValid = await adapter.verifyWebhook(headers, rawBody);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // 2. Event Parsing
    const event = await adapter.parseWebhook(headers, rawBody);
    if (!event) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const workspace = await repository.getWorkspace();
    const messages = await repository.getMessages(workspace.id);

    // 3. Match message by external_message_id
    const matchedMessage = messages.find(
      (m) => m.external_message_id === event.external_message_id
    );

    if (matchedMessage) {
      if (event.event_type === 'delivered') {
        await repository.updateMessage(matchedMessage.id, {
          status: 'delivered',
          delivered_at: event.timestamp,
        });
      } else if (event.event_type === 'failed' || event.event_type === 'bounced') {
        await repository.updateMessage(matchedMessage.id, {
          status: 'failed',
          error_details: event.error_details || 'Bounced or delivery failed',
        });
        // Auto-add to suppression list on bounce
        await repository.addSuppression({
          id: `sup_${Date.now()}`,
          workspace_id: workspace.id,
          recipient_identifier: matchedMessage.recipient_identifier,
          channel: matchedMessage.channel,
          reason: 'bounced',
        });
      } else if (event.event_type === 'complaint') {
        await repository.addSuppression({
          id: `sup_${Date.now()}`,
          workspace_id: workspace.id,
          recipient_identifier: matchedMessage.recipient_identifier,
          channel: matchedMessage.channel,
          reason: 'unsubscribed',
        });
      } else if (event.event_type === 'reply_received') {
        // Link inbound reply to conversation
        const replyMsgId = `msg_in_${Date.now()}`;
        await repository.createMessage({
          id: replyMsgId,
          workspace_id: workspace.id,
          conversation_id: matchedMessage.conversation_id,
          lead_id: matchedMessage.lead_id,
          campaign_id: matchedMessage.campaign_id,
          direction: 'inbound',
          channel: matchedMessage.channel,
          recipient_identifier: matchedMessage.sender_identifier || 'agent',
          sender_identifier: matchedMessage.recipient_identifier,
          body: event.reply_content || 'Inbound reply received',
          status: 'reply_received',
          external_message_id: `ext_reply_${Date.now()}`,
          sent_at: event.timestamp,
        });

        await repository.updateLead(matchedMessage.lead_id, {
          status: 'replied',
        });

        await repository.upsertConversation({
          id: matchedMessage.conversation_id,
          workspace_id: workspace.id,
          lead_id: matchedMessage.lead_id,
          campaign_id: matchedMessage.campaign_id,
          channel: matchedMessage.channel,
          status: 'replied',
          last_activity_at: event.timestamp,
          latest_message: (event.reply_content || 'Inbound reply received').slice(0, 100),
        });
      }

      await repository.logAudit({
        workspace_id: workspace.id,
        event_type: `webhook_${event.event_type}`,
        actor: 'resend_webhook',
        severity: 'info',
        details: {
          external_id: event.external_message_id,
          event_type: event.event_type,
          recipient: event.recipient_identifier,
        },
      });
    }

    return NextResponse.json({ success: true, processed: Boolean(matchedMessage) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
