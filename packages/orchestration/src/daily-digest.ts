/**
 * Daily Digest Email
 *
 * Runs at 6AM UTC daily.
 * Sends a summary of all runs from the last 24 hours to subscribers.
 */

import { send24HourDigest } from '../../integrations/src/email';

async function main() {
  console.log('\n📧 Starting Daily Digest Email\n');
  console.log('='.repeat(50));
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    const result = await send24HourDigest();

    if (result.skipped) {
      console.log('\n⏭️  No runs in last 24 hours - digest skipped');
    } else {
      console.log(`\n✅ Daily digest complete!`);
      console.log(`   Sent: ${result.sent}`);
      console.log(`   Failed: ${result.failed}`);
    }

    console.log('\n' + '='.repeat(50));
  } catch (error) {
    console.error('❌ Daily digest error:', error);
    process.exit(1);
  }
}

main();
