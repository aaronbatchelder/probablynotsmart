/**
 * Manual trigger for the Growth Loop
 * Usage: npm run run:growth-loop
 */

import 'dotenv/config';
import { runGrowthLoop } from '../packages/orchestration/src/growth-loop';

async function main() {
  console.log('\n🚀 Manually triggering Growth Loop...\n');

  const result = await runGrowthLoop();

  console.log('\n📋 Final Result:');
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
