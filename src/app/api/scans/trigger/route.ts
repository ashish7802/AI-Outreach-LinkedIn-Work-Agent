import { NextResponse } from 'next/server';
import { ScanOrchestrator } from '@/lib/scans/orchestrator';
import { repository } from '@/lib/db/repository';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { scan_type = 'full_scan', source = 'manual' } = body;

    const workspace = await repository.getWorkspace();
    if (workspace.agent_status !== 'active') {
      return NextResponse.json(
        { error: `Cannot trigger scan: Agent is currently ${workspace.agent_status}` },
        { status: 400 }
      );
    }

    let result: any = {};

    if (scan_type === 'lead_research') {
      result = await ScanOrchestrator.runLeadResearchScan(workspace.id, source);
    } else if (scan_type === 'reply_collection') {
      result = await ScanOrchestrator.runReplyCollectionScan(workspace.id, source);
    } else if (scan_type === 'followup_reporting') {
      result = await ScanOrchestrator.runFollowupReportingScan(workspace.id, source);
    } else {
      // Full 3-phase scan pipeline
      const res1 = await ScanOrchestrator.runLeadResearchScan(workspace.id, source);
      const res2 = await ScanOrchestrator.runReplyCollectionScan(workspace.id, source);
      const res3 = await ScanOrchestrator.runFollowupReportingScan(workspace.id, source);
      result = { lead_research: res1, reply_collection: res2, followup_reporting: res3 };
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
