import { NextResponse } from 'next/server';
import { LinkedInWorkManager } from '@/lib/linkedin/profile-optimizer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { draft_id } = body;

    if (!draft_id) {
      return NextResponse.json({ error: 'draft_id is required' }, { status: 400 });
    }

    const result = await LinkedInWorkManager.publishOrPrepareDraft(draft_id);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
