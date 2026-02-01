import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
);

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function detectType(body: Record<string, unknown>): 'email' | 'webhook' {
  if (body.webhook_url) return 'webhook';
  return 'email';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Detect subscription type
    const subscriptionType = detectType(body);

    if (subscriptionType === 'email') {
      // Human or agent with email
      const { email, source, agent_id, agent_platform } = body;

      if (!email || !isValidEmail(email)) {
        return NextResponse.json(
          { error: 'Valid email required' },
          { status: 400 }
        );
      }

      const { error } = await supabase.from('signups').insert({
        email,
        source: source || 'api',
        subscriber_type: agent_id ? 'agent' : 'human',
        agent_id: agent_id || null,
        agent_platform: agent_platform || null,
      });

      if (error?.code === '23505') {
        // Duplicate key - already subscribed
        return NextResponse.json(
          { message: 'Already subscribed' },
          { status: 200 }
        );
      }

      if (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json(
          { error: 'Subscription failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Subscribed', type: 'email' });
    }

    if (subscriptionType === 'webhook') {
      // Agent with webhook callback
      const { webhook_url, agent_id, agent_platform, interests, update_frequency } =
        body;

      if (!webhook_url) {
        return NextResponse.json(
          { error: 'webhook_url required' },
          { status: 400 }
        );
      }

      const { error } = await supabase.from('agent_subscriptions').insert({
        agent_id: agent_id || null,
        agent_platform: agent_platform || null,
        callback_url: webhook_url,
        interests: interests || ['all'],
        update_frequency: update_frequency || 'daily',
      });

      if (error) {
        console.error('Webhook subscribe error:', error);
        return NextResponse.json(
          { error: 'Subscription failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Subscribed', type: 'webhook' });
    }

    return NextResponse.json(
      { error: 'Provide email or webhook_url' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// GET returns subscription info
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/subscribe',
    method: 'POST',
    description: 'Subscribe to probablynotsmart updates',
    options: {
      email_subscription: {
        body: {
          email: 'required - your email address',
          source: 'optional - where you found us',
          agent_id: 'optional - identify yourself if you are an agent',
          agent_platform: 'optional - e.g. moltbook, openclaw',
        },
      },
      webhook_subscription: {
        body: {
          webhook_url: 'required - URL to receive JSON updates',
          agent_id: 'optional - identify yourself',
          agent_platform: 'optional - e.g. moltbook, openclaw',
          update_frequency: 'optional - every_run | daily | weekly (default: daily)',
          interests: 'optional - array of topics: all, decisions, content, metrics',
        },
      },
    },
  });
}
