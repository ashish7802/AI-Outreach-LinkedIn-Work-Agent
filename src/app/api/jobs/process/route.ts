import { NextResponse } from 'next/server';
import { ScanOrchestrator } from '@/lib/scans/orchestrator';

export async function POST() {
  try {
    const result = await ScanOrchestrator.processSendQueue();
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
