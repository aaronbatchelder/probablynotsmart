import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Send welcome email (async, don't block signup)
async function sendWelcomeEmail(email: string, accessToken: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'ai@probablynotsmart.com';
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://probablynotsmart.com';

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping welcome email');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FEFDFB; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <h1 style="color: #1A1A1A; font-size: 28px; margin-bottom: 20px;">
      Welcome to the experiment 🤖
    </h1>

    <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      You're now following <strong>probably not smart</strong> — an autonomous AI marketing experiment where 10 AI agents control a landing page with $500 and zero human oversight.
    </p>

    <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      <strong>What happens next:</strong>
    </p>

    <ul style="color: #1A1A1A; font-size: 16px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
      <li>Every 12 hours, the AI analyzes performance and debates changes</li>
      <li>You'll get daily email updates with what happened</li>
      <li>Access to the full AI Lab Notes (exclusive blog content)</li>
      <li>Screenshots of the AI agents arguing with each other</li>
    </ul>

    <div style="background-color: #F7F5F2; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 12px 0;">
        <strong>Your subscriber access:</strong>
      </p>
      <a href="${SITE_URL}/blog" style="display: inline-block; background-color: #FF5C35; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
        Read the AI Lab Notes →
      </a>
    </div>

    <p style="color: #6B6B6B; font-size: 14px; line-height: 1.6;">
      Probably not smart. Definitely interesting.
    </p>

    <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 32px 0;">

    <p style="color: #999; font-size: 12px;">
      You're receiving this because you signed up at probablynotsmart.ai.<br>
      <a href="${SITE_URL}/unsubscribe?token=${accessToken}" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `probablynotsmart <${FROM_EMAIL}>`,
        to: email,
        subject: "You're in. The AI is watching.",
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send welcome email:', error);
    }
  } catch (error) {
    console.error('Welcome email error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with error handling
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdminClient();
    } catch (envError) {
      console.error('Supabase initialization error:', envError);
      return NextResponse.json(
        { error: 'Server configuration error. Please try again later.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, source, referrer } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get UTM parameters from referer or request
    const url = new URL(request.url);
    const utm_source = url.searchParams.get('utm_source');
    const utm_medium = url.searchParams.get('utm_medium');
    const utm_campaign = url.searchParams.get('utm_campaign');

    // Generate access token (in case DB trigger doesn't exist)
    const accessToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

    // Insert signup - only use core fields that definitely exist
    console.log('Inserting signup for:', email.toLowerCase().trim());

    // Try insert with access_token first, fall back to without if column doesn't exist
    let data;
    let error;

    try {
      const result = await supabaseAdmin
        .from('signups')
        .insert({
          email: email.toLowerCase().trim(),
          source: source || 'landing',
          referrer: referrer || null,
          utm_source,
          utm_medium,
          utm_campaign,
          access_token: accessToken,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } catch (insertError) {
      console.error('First insert attempt failed:', insertError);
      // Try without access_token
      const result = await supabaseAdmin
        .from('signups')
        .insert({
          email: email.toLowerCase().trim(),
          source: source || 'landing',
          referrer: referrer || null,
          utm_source,
          utm_medium,
          utm_campaign,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase insert error:', error);
      // Handle duplicate email - still grant access!
      if (error.code === '23505') {
        // Fetch existing signup to get their access token
        const { data: existingSignup } = await supabaseAdmin
          .from('signups')
          .select('access_token')
          .eq('email', email.toLowerCase().trim())
          .single();

        if (existingSignup?.access_token) {
          // Set access cookie for returning subscriber
          try {
            const cookieStore = await cookies();
            cookieStore.set('pns_access', existingSignup.access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/',
            });
          } catch (cookieError) {
            console.error('Cookie setting failed for returning user:', cookieError);
          }
        }

        return NextResponse.json(
          { error: "You're already signed up!", accessGranted: true },
          { status: 409 }
        );
      }
      throw error;
    }

    console.log('Signup successful, data:', data?.id);

    // Track the signup event (don't let this fail the signup)
    try {
      await supabaseAdmin.from('analytics_events').insert({
        event_type: 'signup',
        event_data: { signup_id: data.id },
        session_id: request.headers.get('x-session-id') || null,
        visitor_id: request.headers.get('x-visitor-id') || null,
        page_url: request.headers.get('referer') || null,
        referrer: referrer || null,
        user_agent: request.headers.get('user-agent') || null,
      });
    } catch (analyticsError) {
      console.error('Analytics tracking failed:', analyticsError);
      // Don't fail signup if analytics fails
    }

    // Set access cookie so they can immediately access the blog
    const tokenToUse = data.access_token || accessToken;
    try {
      const cookieStore = await cookies();
      cookieStore.set('pns_access', tokenToUse, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    } catch (cookieError) {
      console.error('Cookie setting failed:', cookieError);
      // Don't fail signup if cookie fails
    }

    // Send welcome email (async, don't block response)
    sendWelcomeEmail(data.email, tokenToUse).catch(console.error);

    return NextResponse.json(
      { success: true, message: "You're in! Check your email.", accessGranted: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
