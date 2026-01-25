import { NextRequest, NextResponse } from 'next/server';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max

// Growth Loop Cron Endpoint
// Triggered every 2 hours by Vercel Cron
// Note: Full orchestration runs via npm run run:growth-loop locally
// This endpoint is a placeholder until we bundle orchestration properly
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('📈 Growth Loop cron triggered');

  // TODO: Integrate orchestration package properly
  // For now, log that it was triggered and return success
  // Run the full loop via: npm run run:growth-loop

  return NextResponse.json({
    success: true,
    message: 'Growth loop cron triggered. Run npm run run:growth-loop locally for full orchestration.',
    timestamp: new Date().toISOString(),
  });
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
