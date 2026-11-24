import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { authenticateRequest } from '@/lib/auth/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req, { allowServerApiKey: true });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.statusCode });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'reports'; // 'reports' | 'leads' | 'audit'

    const workspaceId = auth.workspaceId || 'ws_default_001';
    const workspace = await repository.getWorkspace(workspaceId);

    if (type === 'leads') {
      const leads = await repository.getLeads(workspace.id);
      const csvHeader = 'ID,Full Name,Company,Title,Email,Channel,Fit Score,Status,Created At\n';
      const rows = leads
        .map(
          (l) =>
            `"${l.id}","${l.full_name}","${l.company_name || ''}","${l.title || ''}","${l.email || ''}","${l.recipient_identifier}","${l.fit_score}","${l.status}","${l.created_at}"`
        )
        .join('\n');
      return new NextResponse(csvHeader + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="leads_export.csv"',
        },
      });
    }

    if (type === 'audit') {
      const logs = await repository.getAuditEvents(workspace.id);
      const csvHeader = 'ID,Event Type,Actor,Severity,Timestamp,Details\n';
      const rows = logs
        .map(
          (l) =>
            `"${l.id}","${l.event_type}","${l.actor}","${l.severity}","${l.created_at}","${JSON.stringify(l.details).replace(/"/g, '""')}"`
        )
        .join('\n');
      return new NextResponse(csvHeader + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit_log.csv"',
        },
      });
    }

    // Default: reports
    const reports = await repository.getReports(workspace.id);
    const csvHeader =
      'Report ID,Campaign ID,Period Start,Period End,Leads Processed,Sent,Delivered,Read,Failed,Replies,Opt Outs,Created At\n';
    const rows = reports
      .map(
        (r) =>
          `"${r.id}","${r.campaign_id || 'ALL'}","${r.scan_period_start}","${r.scan_period_end}","${r.leads_processed}","${r.messages_sent}","${r.messages_delivered}","${r.messages_read}","${r.messages_failed}","${r.replies_received}","${r.opt_outs_count}","${r.created_at}"`
      )
      .join('\n');

    return new NextResponse(csvHeader + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="execution_reports.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
