#!/usr/bin/env tsx
/**
 * Visual Diff Check Script
 *
 * This script captures screenshots of the landing page and compares them
 * with previous screenshots to detect visual changes.
 *
 * Usage:
 *   npm run visual-diff                    # Compare latest run
 *   npm run visual-diff -- --run-id <id>   # Compare specific run
 *   npm run visual-diff -- --baseline      # Create new baseline screenshots
 */

import 'dotenv/config';
import { supabaseAdmin } from '../packages/integrations/src/supabase';
import {
  captureScreenshots,
  saveScreenshotsToRun
} from '../packages/integrations/src/screenshots';
import {
  compareAllBreakpoints,
  getVisualDiffs
} from '../packages/integrations/src/visual-diff';

async function main() {
  const args = process.argv.slice(2);
  const isBaseline = args.includes('--baseline');
  const runIdIndex = args.indexOf('--run-id');
  const specifiedRunId = runIdIndex !== -1 ? args[runIdIndex + 1] : null;

  console.log('='.repeat(60));
  console.log('Visual Diff Check');
  console.log('='.repeat(60));

  if (isBaseline) {
    // Create baseline screenshots
    console.log('\nCreating baseline screenshots...');

    // Create a new run for baseline
    const { data: run, error: runError } = await supabaseAdmin
      .from('runs')
      .insert({
        run_number: 0, // Special run number for baseline
        status: 'completed',
      })
      .select()
      .single();

    if (runError || !run) {
      console.error('Failed to create baseline run:', runError);
      process.exit(1);
    }

    console.log(`\nCreated baseline run: ${run.id}`);

    // Capture screenshots
    const screenshots = await captureScreenshots(run.id, 'before');
    await saveScreenshotsToRun(run.id, 'before', screenshots);

    console.log('\n✓ Baseline screenshots created successfully!');
    console.log(`  Run ID: ${run.id}`);
    console.log(`  Desktop: ${screenshots.desktop || 'N/A'}`);
    console.log(`  Tablet: ${screenshots.tablet || 'N/A'}`);
    console.log(`  Mobile: ${screenshots.mobile || 'N/A'}`);

    return;
  }

  let runId: string;
  let beforeScreenshots: any;

  if (specifiedRunId) {
    // Use specified run ID
    runId = specifiedRunId;
    console.log(`\nUsing specified run: ${runId}`);

    // Fetch the run
    const { data: run, error: runError } = await supabaseAdmin
      .from('runs')
      .select('screenshots_before, screenshots_after')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      console.error('Failed to fetch run:', runError);
      process.exit(1);
    }

    beforeScreenshots = run.screenshots_before;

    if (!beforeScreenshots || (!beforeScreenshots.desktop && !beforeScreenshots.tablet && !beforeScreenshots.mobile)) {
      console.error('Run does not have before screenshots. Cannot perform visual diff.');
      process.exit(1);
    }
  } else {
    // Find the most recent run with screenshots
    console.log('\nFinding most recent run with screenshots...');

    const { data: runs, error: runsError } = await supabaseAdmin
      .from('runs')
      .select('id, run_number, screenshots_before, screenshots_after, created_at')
      .not('screenshots_before', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (runsError || !runs || runs.length === 0) {
      console.error('No runs with screenshots found. Run with --baseline first.');
      process.exit(1);
    }

    const latestRun = runs[0];
    runId = latestRun.id;
    beforeScreenshots = latestRun.screenshots_before;

    console.log(`\nUsing latest run: ${runId} (Run #${latestRun.run_number})`);
  }

  // Capture new screenshots
  console.log('\nCapturing current screenshots...');
  const afterScreenshots = await captureScreenshots(runId, 'after');
  await saveScreenshotsToRun(runId, 'after', afterScreenshots);

  console.log('\n✓ Screenshots captured successfully!');

  // Compare screenshots
  console.log('\nComparing screenshots...');
  const summary = await compareAllBreakpoints(
    runId,
    beforeScreenshots,
    afterScreenshots,
    0.1, // threshold: 0.1 (10% per pixel difference)
    1.0  // significanceThreshold: 1% of pixels changed
  );

  // Display results
  console.log('\n' + '='.repeat(60));
  console.log('Visual Diff Results');
  console.log('='.repeat(60));

  if (summary.hasSignificantChanges) {
    console.log('\n⚠️  SIGNIFICANT CHANGES DETECTED');
  } else {
    console.log('\n✓ No significant changes detected');
  }

  console.log(`\nAverage change: ${summary.totalDiffPercentage.toFixed(2)}%`);

  console.log('\nBreakdown by device:');
  for (const [breakpoint, result] of Object.entries(summary.diffsByBreakpoint)) {
    const icon = result.isSignificant ? '⚠️ ' : '  ';
    console.log(
      `  ${icon}${breakpoint.padEnd(8)}: ${result.diffPercentage.toFixed(2)}%`
    );
  }

  // Fetch and display detailed diff info
  const diffs = await getVisualDiffs(runId);

  if (diffs.length > 0) {
    console.log('\nDetailed changes:');
    for (const diff of diffs) {
      console.log(`\n  ${diff.breakpoint}:`);
      console.log(`    Total pixels: ${diff.totalPixels.toLocaleString()}`);
      console.log(`    Changed pixels: ${diff.diffPixels.toLocaleString()}`);
      console.log(`    Percentage: ${diff.diffPercentage.toFixed(2)}%`);
      console.log(`    Changed regions: ${diff.diffRegions.length}`);
      if (diff.diffImageUrl) {
        console.log(`    Diff image: ${diff.diffImageUrl}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✓ Visual diff check complete!');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
