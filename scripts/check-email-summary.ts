/**
 * Check Email Summary Status
 *
 * Queries the email_log table to see if today's daily digest was sent.
 *
 * Usage: npx tsx scripts/check-email-summary.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  console.log(`Checking daily digest emails sent since ${todayISO}...\n`);

  // Check email_log for today's daily_digest entries
  const { data: emails, error } = await supabase
    .from('email_log')
    .select('email, status, subject, sent_at, error_message, provider_id')
    .eq('email_type', 'daily_digest')
    .gte('created_at', todayISO)
    .order('sent_at', { ascending: true });

  if (error) {
    console.error('Failed to query email_log:', error.message);
    process.exit(1);
  }

  if (!emails || emails.length === 0) {
    console.log('No daily digest emails found for today.');
    console.log('\nPossible reasons:');
    console.log('  - The GitHub Actions cron job (6 AM UTC) has not run yet');
    console.log('  - No completed runs in the last 24 hours (digest skipped)');
    console.log('  - The workflow failed before sending emails');
    console.log('\nCheck GitHub Actions: https://github.com/aaronbatchelder/probablynotsmart/actions/workflows/daily-digest.yml');
    return;
  }

  const sent = emails.filter(e => e.status === 'sent');
  const failed = emails.filter(e => e.status === 'failed');

  console.log(`Daily digest results for today:`);
  console.log(`  Total attempted: ${emails.length}`);
  console.log(`  Sent:            ${sent.length}`);
  console.log(`  Failed:          ${failed.length}`);

  if (sent.length > 0) {
    console.log(`\n  Subject: ${sent[0].subject}`);
    console.log(`  First sent at: ${sent[0].sent_at}`);
  }

  if (failed.length > 0) {
    console.log(`\nFailed emails:`);
    for (const f of failed) {
      console.log(`  - ${f.email}: ${f.error_message || 'unknown error'}`);
    }
  }
}

main().catch(console.error);
