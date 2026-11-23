import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function GET() {
  try {
    const workspace = await repository.getWorkspace();
    const leads = await repository.getLeads();
    const messages = await repository.getMessages();
    const instructions = await repository.getInstructions();
    const sendJobs = await repository.getSendJobs();

    return NextResponse.json({
      workspace,
      stats: {
        total_leads: leads.length,
        contacted_leads: leads.filter((l) => l.status === 'contacted').length,
        replied_leads: leads.filter((l) => l.status === 'replied').length,
        pending_instructions: instructions.filter((i) => i.validation_status === 'validated').length,
        needs_review: instructions.filter((i) => i.validation_status === 'needs_review').length,
        total_messages: messages.length,
        queued_jobs: sendJobs.filter((j) => j.status === 'queued').length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body; // 'pause_agent' | 'resume_agent' | 'pause_sending' | 'resume_sending' | 'stop_all'

    const workspace = await repository.getWorkspace();
    let updates: any = {};

    if (action === 'pause_agent') {
      updates.agent_status = 'paused';
    } else if (action === 'resume_agent') {
      updates.agent_status = 'active';
    } else if (action === 'pause_sending') {
      updates.sending_status = 'paused';
    } else if (action === 'resume_sending') {
      updates.sending_status = 'active';
    } else if (action === 'stop_all') {
      updates.agent_status = 'stopped';
      updates.sending_status = 'paused';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await repository.updateWorkspace(workspace.id, updates);

    await repository.logAudit({
      workspace_id: workspace.id,
      event_type: `agent_control_${action}`,
      actor: 'user_action',
      severity: action === 'stop_all' ? 'warn' : 'info',
      details: { action, new_agent_status: updated.agent_status, new_sending_status: updated.sending_status },
    });

    return NextResponse.json({ success: true, workspace: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
