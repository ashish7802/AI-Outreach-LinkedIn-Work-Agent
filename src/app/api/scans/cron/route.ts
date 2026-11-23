import { NextResponse } from 'next/server';
import { ScanOrchestrator } from '@/lib/scans/orchestrator';
import { repository } from '@/lib/db/repository';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const job = searchParams.get('job'); // 'morning' | 'midday' | 'evening'

  // Security check: optional Vercel cron secret verification
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In local or unconfigured mode, allow
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const workspace = await repository.getWorkspace();
    if (workspace.agent_status !== 'active') {
      return NextResponse.json({
        skipped: true,
        reason: `Agent is ${workspace.agent_status}`,
      });
    }

    let runResult: any;

    if (job === 'morning') {
      // Morning scan: Lead research
      runResult = await ScanOrchestrator.runLeadResearchScan(workspace.id, 'cron');
    } else if (job === 'midday') {
      // Midday scan: Reply & status collection
      runResult = await ScanOrchestrator.runReplyCollectionScan(workspace.id, 'cron');
    } else {
      // Evening scan: Follow-up eligibility & model reporting
      runResult = await ScanOrchestrator.runFollowupReportingScan(workspace.id, 'cron');
    }

    return NextResponse.json({ success: true, job, result: runResult });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
