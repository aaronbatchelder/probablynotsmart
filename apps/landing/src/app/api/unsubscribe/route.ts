import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
);

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find the signup by access token
    const { data: signup, error: findError } = await supabase
      .from('signups')
      .select('id, email, unsubscribed_at')
      .eq('access_token', token)
      .single();

    if (findError || !signup) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe link' },
        { status: 404 }
      );
    }

    // Check if already unsubscribed
    if (signup.unsubscribed_at) {
      return NextResponse.json({
        message: "You're already unsubscribed.",
      });
    }

    // Mark as unsubscribed
    const { error: updateError } = await supabase
      .from('signups')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('id', signup.id);

    if (updateError) {
      console.error('Unsubscribe error:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // Log the unsubscribe event
    await supabase.from('analytics_events').insert({
      event_type: 'unsubscribe',
      event_data: { signup_id: signup.id },
    });

    return NextResponse.json({
      message: "You've been unsubscribed from probablynotsmart emails.",
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
