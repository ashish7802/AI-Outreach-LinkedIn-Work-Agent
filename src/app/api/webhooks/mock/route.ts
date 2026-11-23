import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { external_message_id, event_type = 'delivered', reply_content } = body;

    const workspace = await repository.getWorkspace();
    const messages = await repository.getMessages(workspace.id);

    const matchedMessage = messages.find(
      (m) => m.external_message_id === external_message_id || m.id === external_message_id
    );

    if (!matchedMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (event_type === 'delivered') {
      await repository.updateMessage(matchedMessage.id, {
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      });
    } else if (event_type === 'reply_received') {
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
        body: reply_content || 'Thanks for the message! Let us connect next week.',
        status: 'reply_received',
        external_message_id: `ext_mock_rep_${Date.now()}`,
        sent_at: new Date().toISOString(),
      });

      await repository.updateLead(matchedMessage.lead_id, {
        status: 'replied',
      });
    }

    return NextResponse.json({ success: true, message: matchedMessage.id, event_type });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
