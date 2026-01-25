import { NextRequest, NextResponse } from 'next/server';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

/**
 * Main Loop Cron Endpoint
 * Triggered every 12 hours by Vercel Cron
 *
 * Schedule: 0 */12 * * * (every 12 hours)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🧠 Main Loop cron triggered');

  try {
    // Dynamic import to avoid loading agents on every request
    const { runMainLoop } = await import('@probablynotsmart/orchestration');

    const result = await runMainLoop();

    return NextResponse.json({
      success: result.success,
      runNumber: result.runNumber,
      decision: result.decision,
      changesCount: result.changes.length,
      error: result.error,
    });
  } catch (error) {
    console.error('Main loop cron error:', error);
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
