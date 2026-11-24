import { NextResponse } from 'next/server';
import { LinkedInWorkManager } from '@/lib/linkedin/profile-optimizer';
import { authenticateRequest } from '@/lib/auth/auth-guard';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req, { allowServerApiKey: true });
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.statusCode });
    }

    const body = await req.json().catch(() => ({}));
    const profileText = body.profileText || {
      headline: body.headline || 'Full-Stack Engineer & AI Developer',
      about: body.about || 'Passionate software engineer building applications with React, Next.js, and AI APIs.',
      experience: body.experience || ['Full-Stack Developer (2022-Present)', 'Frontend Engineer (2020-2022)'],
      skills: body.skills || ['Next.js', 'TypeScript', 'Supabase', 'Node.js', 'AI Agents'],
    };

    const workspaceId = auth.workspaceId || 'ws_default_001';
    const audit = await LinkedInWorkManager.auditProfile(profileText, workspaceId);
    return NextResponse.json({ success: true, audit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
