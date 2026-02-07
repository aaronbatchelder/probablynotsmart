/**
 * Run Daily Digest Email
 *
 * Usage: npm run run:daily-digest
 */

import 'dotenv/config';

async function main() {
  const { send24HourDigest } = await import('../packages/integrations/src/email');

  console.log('Starting daily digest...\n');

  const result = await send24HourDigest();

  if (result.skipped) {
    console.log('No runs in last 24 hours - digest skipped');
  } else {
    console.log(`\nDaily digest complete!`);
    console.log(`Sent: ${result.sent}`);
    console.log(`Failed: ${result.failed}`);
  }
}

main().catch(console.error);
