import { NextRequest, NextResponse } from 'next/server';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max

/**
 * Growth Loop Cron Endpoint
 * Triggered every 2 hours by Vercel Cron
 *
 * Schedule: 0 */2 * * * (every 2 hours)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('📈 Growth Loop cron triggered');

  try {
    // Dynamic import to avoid loading agents on every request
    const { runGrowthLoop } = await import('@probablynotsmart/orchestration');

    const result = await runGrowthLoop();

    return NextResponse.json({
      success: result.success,
      engagementsApproved: result.engagementsApproved,
      engagementsBlocked: result.engagementsBlocked,
      error: result.error,
    });
  } catch (error) {
    console.error('Growth loop cron error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
