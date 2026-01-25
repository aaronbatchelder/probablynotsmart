import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Metrics Snapshot Cron Endpoint
 * Takes a snapshot of current metrics every hour
 *
 * Schedule: 0 * * * * (every hour)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('📊 Metrics snapshot cron triggered');

  try {
    // Get current metrics
    const { data: metrics } = await supabaseAdmin
      .from('current_metrics')
      .select('*')
      .single();

    // Get budget status
    const { data: budget } = await supabaseAdmin
      .from('budget_status')
      .select('*')
      .single();

    // Log for monitoring (these would be stored in a time-series DB in production)
    console.log('Current metrics:', {
      timestamp: new Date().toISOString(),
      visitors_24h: metrics?.visitors_24h || 0,
      signups_24h: metrics?.signups_24h || 0,
      conversion_rate_24h: metrics?.conversion_rate_24h || 0,
      budget_remaining: budget?.remaining || 0,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        visitors_24h: metrics?.visitors_24h || 0,
        signups_24h: metrics?.signups_24h || 0,
        conversion_rate: metrics?.conversion_rate_24h || 0,
      },
      budget: {
        remaining: budget?.remaining || 0,
        spent: budget?.spent || 0,
      },
    });
  } catch (error) {
    console.error('Metrics snapshot error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
