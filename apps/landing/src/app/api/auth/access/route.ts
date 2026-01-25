import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * Grant blog access to subscribers
 *
 * POST /api/auth/access
 * Body: { email: string }
 *
 * If email is a subscriber, sets an access cookie and returns success.
 * If not a subscriber, returns accessGranted: false.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this email is a subscriber
    const { data: signup, error } = await supabaseAdmin
      .from('signups')
      .select('id, email, access_token')
      .eq('email', normalizedEmail)
      .is('unsubscribed_at', null)
      .single();

    if (error || !signup) {
      // Not a subscriber
      return NextResponse.json({
        accessGranted: false,
        message: 'This email is not subscribed to the experiment.',
      });
    }

    // Generate access token if not exists
    let accessToken = signup.access_token;
    if (!accessToken) {
      accessToken = crypto.randomUUID() + crypto.randomUUID();
      await supabaseAdmin
        .from('signups')
        .update({ access_token: accessToken })
        .eq('id', signup.id);
    }

    // Set access cookie (expires in 30 days)
    const cookieStore = await cookies();
    cookieStore.set('pns_access', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({
      accessGranted: true,
      message: 'Access granted! Refreshing...',
    });
  } catch (error) {
    console.error('Access check error:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
