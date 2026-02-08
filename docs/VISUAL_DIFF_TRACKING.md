# Visual Diff Tracking for Landing Page

This document describes the visual diff tracking system for detecting and analyzing visual changes to the landing page at probablynotsmart.ai.

## Overview

The visual diff tracking system automatically:
1. Captures screenshots of the landing page at multiple breakpoints (desktop, tablet, mobile)
2. Compares screenshots to detect visual changes
3. Highlights differences with color-coded diff images
4. Stores results in Supabase for analysis
5. Generates summary reports on changes

## Architecture

### Components

#### 1. Screenshot Capture (`packages/integrations/src/screenshots.ts`)
- Uses Puppeteer to capture full-page screenshots
- Supports three breakpoints: desktop (1440x900), tablet (768x1024), mobile (375x812)
- Stores screenshots in Supabase Storage bucket `screenshots`
- Saves screenshot URLs to the `runs` table

#### 2. Visual Diff Engine (`packages/integrations/src/visual-diff.ts`)
- Uses `pixelmatch` library for pixel-by-pixel comparison
- Generates color-coded diff images highlighting changes
- Calculates diff percentage and identifies significant changes
- Stores detailed results in `visual_diffs` table
- Updates run records with summary statistics

#### 3. Database Schema

**`visual_diffs` table** (migration: `010_visual_diffs.sql`):
```sql
- id: UUID (primary key)
- run_id: UUID (references runs table)
- breakpoint: TEXT (desktop|tablet|mobile)
- before_screenshot_url: TEXT
- after_screenshot_url: TEXT
- diff_image_url: TEXT (nullable)
- total_pixels: INTEGER
- diff_pixels: INTEGER
- diff_percentage: DECIMAL(5, 2)
- threshold: DECIMAL(3, 2) (default: 0.1)
- is_significant: BOOLEAN (default: false)
- diff_regions: JSONB (bounding boxes of changed areas)
- created_at: TIMESTAMPTZ
```

**`runs` table updates**:
- `screenshots_before`: JSONB (desktop, tablet, mobile URLs)
- `screenshots_after`: JSONB (desktop, tablet, mobile URLs)
- `visual_diff_summary`: JSONB (aggregate statistics)

#### 4. Standalone Script (`scripts/run-visual-diff.ts`)
- Command-line tool for running visual diff checks
- Can create baseline screenshots or compare against latest
- Generates detailed console reports

## Installation

The required dependencies are already installed:
```bash
cd packages/integrations
npm install pixelmatch pngjs @types/pixelmatch @types/pngjs
```

## Database Migration

Run the visual diff migration:
```bash
# Apply migration via Supabase CLI
supabase db push

# Or manually run the SQL in Supabase dashboard
# File: supabase/migrations/010_visual_diffs.sql
```

Make sure the `screenshots` storage bucket exists in Supabase:
1. Go to Supabase Dashboard > Storage
2. Create bucket named `screenshots`
3. Set as Public (for easy embedding)

## Usage

### 1. Create Baseline Screenshots

Before running visual diffs, create a baseline:
```bash
npm run visual-diff -- --baseline
```

This will:
- Capture current screenshots of the landing page
- Store them in a new run with run_number = 0
- Save URLs to the database

### 2. Run Visual Diff Check

Compare current state against the most recent run:
```bash
npm run visual-diff
```

Or compare against a specific run:
```bash
npm run visual-diff -- --run-id <uuid>
```

### 3. Programmatic Usage

```typescript
import {
  captureScreenshots,
  saveScreenshotsToRun
} from '@probablynotsmart/integrations';
import {
  compareAllBreakpoints,
  getVisualDiffs
} from '@probablynotsmart/integrations';

// Capture screenshots
const runId = 'some-uuid';
const beforeScreenshots = await captureScreenshots(runId, 'before');
await saveScreenshotsToRun(runId, 'before', beforeScreenshots);

// Later, capture after screenshots
const afterScreenshots = await captureScreenshots(runId, 'after');
await saveScreenshotsToRun(runId, 'after', afterScreenshots);

// Run visual diff comparison
const summary = await compareAllBreakpoints(
  runId,
  beforeScreenshots,
  afterScreenshots,
  0.1,  // threshold: 10% pixel difference to mark as changed
  1.0   // significanceThreshold: 1% of pixels changed is significant
);

// Check results
if (summary.hasSignificantChanges) {
  console.log('Significant visual changes detected!');
  console.log(`Average change: ${summary.totalDiffPercentage}%`);
}

// Get detailed diff data
const diffs = await getVisualDiffs(runId);
for (const diff of diffs) {
  console.log(`${diff.breakpoint}: ${diff.diffPercentage}% changed`);
  console.log(`Diff image: ${diff.diffImageUrl}`);
}
```

## Configuration

### Thresholds

The visual diff system uses two thresholds:

1. **Pixel Threshold** (default: 0.1)
   - Controls sensitivity of pixel-level comparison
   - Range: 0.0 (strict) to 1.0 (lenient)
   - Lower values detect smaller color differences

2. **Significance Threshold** (default: 1.0%)
   - Percentage of changed pixels to mark as "significant"
   - If diff_percentage >= significanceThreshold, is_significant = true
   - Helps filter out noise from animations, fonts, etc.

### Breakpoints

Default breakpoints (defined in `screenshots.ts`):
```typescript
- Desktop: 1440x900
- Tablet:  768x1024
- Mobile:  375x812
```

## Output

### Console Report
```
============================================================
Visual Diff Results
============================================================

⚠️  SIGNIFICANT CHANGES DETECTED

Average change: 2.45%

Breakdown by device:
  ⚠️  desktop : 3.21%
      tablet  : 1.89%
      mobile  : 2.25%

Detailed changes:
  desktop:
    Total pixels: 2,592,000
    Changed pixels: 83,232
    Percentage: 3.21%
    Changed regions: 12
    Diff image: https://...supabase.co/.../diff-desktop.png
```

### Database Records

**`visual_diffs` table**:
- One row per breakpoint per comparison
- Contains metrics, URLs, and change regions

**`runs.visual_diff_summary`**:
```json
{
  "hasSignificantChanges": true,
  "totalDiffPercentage": 2.45,
  "diffsByBreakpoint": {
    "desktop": {
      "diffPercentage": 3.21,
      "isSignificant": true
    },
    "tablet": {
      "diffPercentage": 1.89,
      "isSignificant": true
    },
    "mobile": {
      "diffPercentage": 2.25,
      "isSignificant": true
    }
  }
}
```

### Diff Images

Diff images are stored in Supabase Storage:
- Path: `screenshots/run-{runId}/diff-{breakpoint}.png`
- Changed pixels highlighted in **red**
- Anti-aliasing differences in **orange**
- Public URLs for easy embedding

## Integration with Main Loop

To integrate visual diff tracking into the main agent loop:

```typescript
import { captureAndSaveScreenshots, compareAllBreakpoints } from '@probablynotsmart/integrations';

// In run-main-loop.ts

// 1. Capture "before" screenshots at start of run
console.log('📸 Capturing before screenshots...');
const beforeScreenshots = await captureAndSaveScreenshots(runId, 'before');

// ... agent performs optimization ...

// 2. Capture "after" screenshots at end of run
console.log('📸 Capturing after screenshots...');
const afterScreenshots = await captureAndSaveScreenshots(runId, 'after');

// 3. Run visual diff comparison
console.log('🔍 Analyzing visual changes...');
const visualDiff = await compareAllBreakpoints(
  runId,
  beforeScreenshots,
  afterScreenshots
);

// 4. Log results
if (visualDiff.hasSignificantChanges) {
  console.log(`⚠️  Significant visual changes detected: ${visualDiff.totalDiffPercentage.toFixed(2)}% average change`);
} else {
  console.log(`✓ No significant visual changes: ${visualDiff.totalDiffPercentage.toFixed(2)}% average change`);
}
```

## Monitoring & Analysis

### Query Examples

**Get runs with significant visual changes:**
```sql
SELECT
  id,
  run_number,
  visual_diff_summary->>'totalDiffPercentage' as avg_change,
  created_at
FROM runs
WHERE visual_diff_summary->>'hasSignificantChanges' = 'true'
ORDER BY created_at DESC;
```

**Get all diffs for a run:**
```sql
SELECT
  breakpoint,
  diff_percentage,
  is_significant,
  diff_image_url
FROM visual_diffs
WHERE run_id = '<uuid>'
ORDER BY breakpoint;
```

**Track visual stability over time:**
```sql
SELECT
  run_number,
  (visual_diff_summary->>'totalDiffPercentage')::numeric as avg_change,
  visual_diff_summary->>'hasSignificantChanges' as has_changes
FROM runs
WHERE visual_diff_summary IS NOT NULL
ORDER BY run_number;
```

## Troubleshooting

### Issue: Screenshots not captured
- Check Puppeteer installation and Chrome dependencies
- Verify NEXT_PUBLIC_SITE_URL is set correctly
- Check network connectivity to probablynotsmart.ai

### Issue: Visual diffs always show 100% change
- Ensure screenshots are from the same viewport size
- Check that both before/after screenshots are valid PNG files
- Verify storage bucket permissions

### Issue: False positives (animations, fonts)
- Increase pixel threshold (e.g., 0.2)
- Increase significance threshold (e.g., 2.0%)
- Add delays in screenshot capture for animations to settle

### Issue: Storage bucket not found
- Create `screenshots` bucket in Supabase Dashboard
- Set bucket as public
- Check storage policies allow authenticated inserts

## Best Practices

1. **Create baselines regularly** - After major deployments or before experiments
2. **Set appropriate thresholds** - Balance sensitivity vs. noise
3. **Review diff images** - Automated metrics may miss subtle issues
4. **Track trends** - Monitor visual_diff_summary over multiple runs
5. **Archive old diffs** - Consider cleanup strategy for storage costs

## Future Enhancements

Potential improvements:
- [ ] Selective region comparison (ignore certain page areas)
- [ ] Animated GIF generation showing before/after/diff
- [ ] Machine learning classification of change types
- [ ] Email alerts on significant changes
- [ ] Visual diff dashboard UI
- [ ] Integration with blog post generation (embed diff images)
- [ ] Performance metrics tracking (page load time, LCP, etc.)

## API Reference

See inline documentation in:
- `packages/integrations/src/visual-diff.ts`
- `packages/integrations/src/screenshots.ts`

## Support

For issues or questions:
1. Check this documentation
2. Review migration files in `supabase/migrations/`
3. Inspect console logs from visual diff runs
4. Query `visual_diffs` table for historical data
