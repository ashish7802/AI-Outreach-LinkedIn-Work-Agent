import { NextResponse } from 'next/server';
import { ScanOrchestrator } from '@/lib/scans/orchestrator';
import { authenticateRequest } from '@/lib/auth/auth-guard';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req, {
      allowCronSecret: true,
      allowServerApiKey: true,
    });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.statusCode });
    }

    const workspaceId = auth.workspaceId || 'ws_default_001';
    const result = await ScanOrchestrator.processSendQueue(workspaceId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
