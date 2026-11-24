import { NextResponse } from 'next/server';
import { LinkedInWorkManager } from '@/lib/linkedin/profile-optimizer';
import { authenticateRequest } from '@/lib/auth/auth-guard';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req, { allowServerApiKey: true });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.statusCode });
    }

    const body = await req.json();
    const { draft_id } = body;

    if (!draft_id) {
      return NextResponse.json({ error: 'draft_id is required' }, { status: 400 });
    }

    const workspaceId = auth.workspaceId || 'ws_default_001';
    const result = await LinkedInWorkManager.publishOrPrepareDraft(draft_id, workspaceId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
