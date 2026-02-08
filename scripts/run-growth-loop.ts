/**
 * Manual trigger for the Growth Loop
 * Usage: npm run run:growth-loop
 */

// Load env BEFORE any other imports
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  console.log('\n🚀 Manually triggering Growth Loop...\n');

  // Dynamic import after env is loaded
  const { runGrowthLoop } = await import('../packages/orchestration/src/growth-loop');

  const result = await runGrowthLoop();

  console.log('\n📋 Final Result:');
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
