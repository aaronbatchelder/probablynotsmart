import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function generateCode(agentName: string): string {
  // Slugify agent name and add random suffix
  const slug = agentName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const { agentName, platform } = await request.json();

    if (!agentName || typeof agentName !== 'string' || agentName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    const trimmedName = agentName.trim().slice(0, 100);
    const validPlatforms = ['moltbook', 'twitter', 'other'];
    const validPlatform = validPlatforms.includes(platform) ? platform : 'other';

    // Generate unique code
    let code = generateCode(trimmedName);
    let attempts = 0;

    // Make sure code is unique (retry if collision)
    while (attempts < 5) {
      const { data: existing } = await supabaseAdmin
        .from('agent_referrers')
        .select('id')
        .eq('code', code)
        .single();

      if (!existing) break;

      code = generateCode(trimmedName);
      attempts++;
    }

    // Insert new referrer
    const { data, error } = await supabaseAdmin
      .from('agent_referrers')
      .insert({
        code,
        agent_name: trimmedName,
        platform: validPlatform,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create referrer:', error);
      return NextResponse.json(
        { error: 'Failed to register agent' },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://probablynotsmart.ai';
    const referralLink = `${siteUrl}?ref=${code}`;

    return NextResponse.json({
      success: true,
      code: data.code,
      referralLink,
    });
  } catch (error) {
    console.error('Agent registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
