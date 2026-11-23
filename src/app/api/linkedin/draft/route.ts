import { NextResponse } from 'next/server';
import { LinkedInWorkManager } from '@/lib/linkedin/profile-optimizer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topic = 'Deterministic AI Send Policies',
      projectOrLearningEvidence = 'Built an idempotent queue with Zod validation, timezone-aware quiet hours, and suppression lists.',
      targetAudience = 'Tech Leads & AI Engineers',
      tone = 'Engineering-first, authentic',
    } = body;

    const draft = await LinkedInWorkManager.draftPost({
      topic,
      projectOrLearningEvidence,
      targetAudience,
      tone,
    });

    return NextResponse.json({ success: true, draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
