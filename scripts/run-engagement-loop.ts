/**
 * Manual trigger for the Engagement Loop
 * Usage: npm run run:engagement-loop
 */

// Load env BEFORE any other imports
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  console.log('\n🚀 Manually triggering Engagement Loop...\n');

  // Dynamic import after env is loaded
  const { runEngagementLoop } = await import('../packages/orchestration/src/engagement-loop');

  const result = await runEngagementLoop();

  console.log('\n📋 Final Result:');
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
