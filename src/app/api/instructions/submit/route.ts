import { NextResponse } from 'next/server';
import { ModelInstructionsEnvelopeSchema } from '@/lib/schemas/instruction';
import { repository } from '@/lib/db/repository';
import { authenticateRequest } from '@/lib/auth/auth-guard';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req, { allowServerApiKey: true });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.statusCode });
    }

    const body = await req.json();

    // 1. Versioned Zod schema validation
    const parsed = ModelInstructionsEnvelopeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Instruction validation failed against schema v1',
          details: parsed.error.format(),
        },
        { status: 422 }
      );
    }

    const envelope = parsed.data;
    const workspaceId = auth.workspaceId || 'ws_default_001';
    const workspace = await repository.getWorkspace(workspaceId);
    const storedInstructions = [];

    for (const item of envelope.instructions) {
      const instructionId = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      // Save as validated instruction
      const saved = await repository.saveInstruction({
        id: instructionId,
        workspace_id: workspace.id,
        campaign_id: item.campaign_id,
        lead_id: item.lead_id,
        channel: item.channel,
        recipient_identifier: item.recipient_identifier,
        exact_message_text: item.exact_message_text,
        message_purpose: item.message_purpose,
        suggested_send_time: item.suggested_send_time || null,
        follow_up_conditions: item.follow_up_conditions || null,
        constraints: item.constraints || {},
        validation_status: 'validated',
        schema_version: 'v1',
        raw_model_output: item,
      });

      storedInstructions.push(saved);
    }

    await repository.logAudit({
      workspace_id: workspace.id,
      event_type: 'instructions_received',
      actor: auth.userId || 'model_or_user',
      severity: 'info',
      details: {
        campaign_id: envelope.campaign_id,
        count: envelope.instructions.length,
      },
    });

    return NextResponse.json({
      success: true,
      count: storedInstructions.length,
      instructions: storedInstructions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
