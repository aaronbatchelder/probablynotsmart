#!/usr/bin/env tsx
/**
 * Example: Visual Diff Integration
 *
 * This script demonstrates how to integrate visual diff tracking
 * into the main agent loop.
 *
 * Usage: npx tsx scripts/example-visual-diff-integration.ts
 */

import 'dotenv/config';
import { supabaseAdmin } from '../packages/integrations/src/supabase';
import {
  captureAndSaveScreenshots,
} from '../packages/integrations/src/screenshots';
import {
  compareAllBreakpoints,
  getVisualDiffs,
} from '../packages/integrations/src/visual-diff';

async function main() {
  console.log('='.repeat(60));
  console.log('Visual Diff Integration Example');
  console.log('='.repeat(60));

  // Step 1: Create a new run
  console.log('\n1. Creating a new run...');
  const { data: run, error: runError } = await supabaseAdmin
    .from('runs')
    .insert({
      run_number: 999, // Example run number
      status: 'running',
    })
    .select()
    .single();

  if (runError || !run) {
    console.error('Failed to create run:', runError);
    process.exit(1);
  }

  console.log(`   ✓ Created run ${run.id}`);
  const runId = run.id;

  // Step 2: Capture "before" screenshots
  console.log('\n2. Capturing BEFORE screenshots...');
  const beforeScreenshots = await captureAndSaveScreenshots(runId, 'before');
  console.log('   ✓ Before screenshots captured:');
  console.log(`     Desktop: ${beforeScreenshots.desktop || 'N/A'}`);
  console.log(`     Tablet:  ${beforeScreenshots.tablet || 'N/A'}`);
  console.log(`     Mobile:  ${beforeScreenshots.mobile || 'N/A'}`);

  // Step 3: Simulate agent making changes
  console.log('\n3. Simulating agent optimization...');
  console.log('   (In real loop, agents would analyze metrics and update page)');
  console.log('   Waiting 5 seconds to simulate changes...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Step 4: Capture "after" screenshots
  console.log('\n4. Capturing AFTER screenshots...');
  const afterScreenshots = await captureAndSaveScreenshots(runId, 'after');
  console.log('   ✓ After screenshots captured:');
  console.log(`     Desktop: ${afterScreenshots.desktop || 'N/A'}`);
  console.log(`     Tablet:  ${afterScreenshots.tablet || 'N/A'}`);
  console.log(`     Mobile:  ${afterScreenshots.mobile || 'N/A'}`);

  // Step 5: Run visual diff comparison
  console.log('\n5. Running visual diff comparison...');
  const visualDiff = await compareAllBreakpoints(
    runId,
    beforeScreenshots,
    afterScreenshots,
    0.1, // threshold
    1.0  // significanceThreshold (1%)
  );

  // Step 6: Display results
  console.log('\n6. Visual Diff Results:');
  console.log('-'.repeat(60));

  if (visualDiff.hasSignificantChanges) {
    console.log('   ⚠️  SIGNIFICANT CHANGES DETECTED');
  } else {
    console.log('   ✓ No significant changes detected');
  }

  console.log(`   Average change: ${visualDiff.totalDiffPercentage.toFixed(2)}%`);

  console.log('\n   Breakdown by device:');
  for (const [breakpoint, result] of Object.entries(
    visualDiff.diffsByBreakpoint
  )) {
    const icon = result.isSignificant ? '⚠️ ' : '  ';
    const status = result.isSignificant ? '[SIGNIFICANT]' : '';
    console.log(
      `     ${icon}${breakpoint.padEnd(8)}: ${result.diffPercentage.toFixed(2)}% ${status}`
    );
  }

  // Step 7: Get detailed diff data
  console.log('\n7. Detailed Diff Data:');
  const diffs = await getVisualDiffs(runId);

  if (diffs.length === 0) {
    console.log('   No diffs found (this is normal if screenshots are identical)');
  } else {
    for (const diff of diffs) {
      console.log(`\n   ${diff.breakpoint}:`);
      console.log(`     Total pixels:    ${diff.totalPixels.toLocaleString()}`);
      console.log(`     Changed pixels:  ${diff.diffPixels.toLocaleString()}`);
      console.log(`     Percentage:      ${diff.diffPercentage.toFixed(2)}%`);
      console.log(`     Significant:     ${diff.isSignificant ? 'YES' : 'NO'}`);
      console.log(`     Changed regions: ${diff.diffRegions.length}`);
      if (diff.diffImageUrl) {
        console.log(`     Diff image:      ${diff.diffImageUrl}`);
      }
    }
  }

  // Step 8: Update run status
  console.log('\n8. Updating run status...');
  const { error: updateError } = await supabaseAdmin
    .from('runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId);

  if (updateError) {
    console.error('   Failed to update run:', updateError);
  } else {
    console.log('   ✓ Run marked as completed');
  }

  // Step 9: How to use in decision making
  console.log('\n9. Using Visual Diff in Agent Decision Making:');
  console.log('-'.repeat(60));

  if (visualDiff.hasSignificantChanges) {
    console.log('   Action: Include visual diff data in Richard\'s blog post');
    console.log('   - Embed diff images showing changes');
    console.log('   - Mention percentage change by device');
    console.log('   - Explain what changed and why');

    console.log('\n   Action: Alert agents to verify changes');
    console.log('   - Gilfoyle should verify technical implementation');
    console.log('   - Monica should check if changes align with strategy');
    console.log('   - Erlich should review visual appeal');
  } else {
    console.log('   Action: Note minimal visual impact in logs');
    console.log('   - Changes were primarily backend/data');
    console.log('   - Or changes cancelled each other out');
    console.log('   - Or agents decided not to modify page');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✓ Example complete!');
  console.log('='.repeat(60));
  console.log(`\nRun ID: ${runId}`);
  console.log(
    `View in database: SELECT * FROM runs WHERE id = '${runId}';`
  );
  console.log(
    `View diffs: SELECT * FROM visual_diffs WHERE run_id = '${runId}';`
  );
  console.log('\nTo clean up this example run:');
  console.log(`  DELETE FROM visual_diffs WHERE run_id = '${runId}';`);
  console.log(`  DELETE FROM runs WHERE id = '${runId}';`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
