/**
 * Manual trigger for the Main Loop
 * Usage: npm run run:main-loop
 */

import 'dotenv/config';
import { runMainLoop } from '../packages/orchestration/src/main-loop';

async function main() {
  console.log('\n🚀 Manually triggering Main Loop...\n');

  const result = await runMainLoop();

  console.log('\n📋 Final Result:');
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
