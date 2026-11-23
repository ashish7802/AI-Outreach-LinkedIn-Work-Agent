import { NextResponse } from 'next/server';
import { LinkedInWorkManager } from '@/lib/linkedin/profile-optimizer';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const profileText = body.profileText || {
      headline: body.headline || 'Full-Stack Engineer & AI Developer',
      about: body.about || 'Passionate software engineer building applications with React, Next.js, and AI APIs.',
      experience: body.experience || ['Full-Stack Developer (2022-Present)', 'Frontend Engineer (2020-2022)'],
      skills: body.skills || ['Next.js', 'TypeScript', 'Supabase', 'Node.js', 'AI Agents'],
    };

    const audit = await LinkedInWorkManager.auditProfile(profileText);
    return NextResponse.json({ success: true, audit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
