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
    const {
      topic = 'Deterministic AI Send Policies',
      projectOrLearningEvidence = 'Built an idempotent queue with Zod validation, timezone-aware quiet hours, and suppression lists.',
      targetAudience = 'Tech Leads & AI Engineers',
      tone = 'Engineering-first, authentic',
    } = body;

    const workspaceId = auth.workspaceId || 'ws_default_001';
    const draft = await LinkedInWorkManager.draftPost({
      topic,
      projectOrLearningEvidence,
      targetAudience,
      tone,
    }, workspaceId);

    return NextResponse.json({ success: true, draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
