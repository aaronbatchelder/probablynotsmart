import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, event_data, session_id, visitor_id } = body;

    if (!event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      );
    }

    // Get geo info from headers (set by Vercel/Cloudflare)
    const ip_country = request.headers.get('x-vercel-ip-country') || null;
    const ip_city = request.headers.get('x-vercel-ip-city') || null;

    const { error } = await supabaseAdmin.from('analytics_events').insert({
      event_type,
      event_data: event_data || {},
      session_id: session_id || null,
      visitor_id: visitor_id || null,
      page_url: request.headers.get('referer') || null,
      referrer: body.referrer || null,
      user_agent: request.headers.get('user-agent') || null,
      ip_country,
      ip_city,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
