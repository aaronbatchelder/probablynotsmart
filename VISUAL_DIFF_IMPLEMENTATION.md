# Visual Diff Implementation Summary

## Overview

This document summarizes the visual diff tracking system implementation for the probablynotsmart.ai landing page.

## What Was Created

### 1. Core Module: Visual Diff Engine
**File:** `/packages/integrations/src/visual-diff.ts`

Key features:
- Pixel-by-pixel image comparison using `pixelmatch` library
- Generates color-coded diff images highlighting changes
- Calculates diff percentages and identifies significant changes
- Detects changed regions (bounding boxes)
- Stores results in Supabase database
- Updates run records with summary statistics

Functions:
- `compareScreenshots()` - Compare single breakpoint
- `compareAllBreakpoints()` - Compare all breakpoints (desktop, tablet, mobile)
- `getVisualDiffs()` - Retrieve diff results from database
- Internal helpers for image processing and storage

### 2. Database Migration
**File:** `/supabase/migrations/010_visual_diffs.sql`

Creates:
- `visual_diffs` table - Stores detailed diff results per breakpoint
  - Includes URLs, metrics, diff regions, significance flags
- `runs.visual_diff_summary` column - JSONB summary of all diffs for a run
- Indexes for efficient querying

### 3. Standalone Script
**File:** `/scripts/run-visual-diff.ts`

Command-line tool for:
- Creating baseline screenshots (`--baseline`)
- Comparing current state against latest run
- Comparing specific runs (`--run-id <uuid>`)
- Generating detailed console reports

### 4. Example Integration Script
**File:** `/scripts/example-visual-diff-integration.ts`

Demonstrates:
- End-to-end workflow with before/after screenshots
- How to integrate into agent loop
- Result interpretation
- Decision-making based on diff results

### 5. Documentation

#### Comprehensive Guide
**File:** `/docs/VISUAL_DIFF_TRACKING.md`

Complete documentation including:
- Architecture overview
- Installation instructions
- Usage examples (programmatic & CLI)
- Configuration options
- Database schema
- Monitoring queries
- Troubleshooting
- Best practices
- Future enhancement ideas

#### Quick Start Guide
**File:** `/docs/VISUAL_DIFF_QUICK_START.md`

Fast reference for:
- Setup steps
- Common commands
- Code snippets
- Troubleshooting
- Useful queries

### 6. Type Definitions
**File:** `/packages/integrations/src/types/visual-diff.d.ts`

TypeScript definitions for:
- `VisualDiffResult` interface
- `VisualDiffSummary` interface
- `DiffRegion` interface
- Function signatures

### 7. Package Updates

**Modified:** `/packages/integrations/package.json`
- Added `pixelmatch` dependency
- Added `pngjs` dependency
- Added `@types/pixelmatch` dev dependency
- Added `@types/pngjs` dev dependency

**Modified:** `/packages/integrations/src/index.ts`
- Exported visual-diff module

**Modified:** `/package.json` (root)
- Added `visual-diff` npm script

## Dependencies Installed

```json
{
  "dependencies": {
    "pixelmatch": "^5.3.0",
    "pngjs": "^7.0.0"
  },
  "devDependencies": {
    "@types/pixelmatch": "^5.2.0",
    "@types/pngjs": "^6.0.0"
  }
}
```

## Database Schema

### `visual_diffs` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| run_id | UUID | Foreign key to runs table |
| breakpoint | TEXT | desktop/tablet/mobile |
| before_screenshot_url | TEXT | URL of before screenshot |
| after_screenshot_url | TEXT | URL of after screenshot |
| diff_image_url | TEXT | URL of diff image (nullable) |
| total_pixels | INTEGER | Total pixels in image |
| diff_pixels | INTEGER | Number of changed pixels |
| diff_percentage | DECIMAL(5,2) | Percentage of pixels changed |
| threshold | DECIMAL(3,2) | Threshold used for comparison |
| is_significant | BOOLEAN | Whether change is significant |
| diff_regions | JSONB | Bounding boxes of changes |
| created_at | TIMESTAMPTZ | Timestamp |

### `runs` Table Update

Added column:
- `visual_diff_summary` (JSONB) - Aggregate statistics

Structure:
```json
{
  "hasSignificantChanges": boolean,
  "totalDiffPercentage": number,
  "diffsByBreakpoint": {
    "desktop": {"diffPercentage": number, "isSignificant": boolean},
    "tablet": {"diffPercentage": number, "isSignificant": boolean},
    "mobile": {"diffPercentage": number, "isSignificant": boolean}
  }
}
```

## Usage

### CLI Commands

```bash
# Create baseline
npm run visual-diff -- --baseline

# Compare against latest
npm run visual-diff

# Compare specific run
npm run visual-diff -- --run-id <uuid>

# Run example
npx tsx scripts/example-visual-diff-integration.ts
```

### Programmatic Usage

```typescript
import {
  captureAndSaveScreenshots,
  compareAllBreakpoints,
  getVisualDiffs
} from '@probablynotsmart/integrations';

// Capture before
const before = await captureAndSaveScreenshots(runId, 'before');

// ... make changes ...

// Capture after & compare
const after = await captureAndSaveScreenshots(runId, 'after');
const summary = await compareAllBreakpoints(runId, before, after);

// Check results
if (summary.hasSignificantChanges) {
  console.log(`Visual changes: ${summary.totalDiffPercentage}%`);

  // Get detailed diff data
  const diffs = await getVisualDiffs(runId);
  for (const diff of diffs) {
    console.log(`${diff.breakpoint}: ${diff.diffPercentage}%`);
    if (diff.diffImageUrl) {
      console.log(`Diff image: ${diff.diffImageUrl}`);
    }
  }
}
```

## Integration with Main Loop

To integrate into `/scripts/run-main-loop.ts`:

```typescript
// At start of run (after creating run record)
const beforeScreenshots = await captureAndSaveScreenshots(runId, 'before');

// ... existing agent optimization logic ...

// At end of run (before marking as complete)
const afterScreenshots = await captureAndSaveScreenshots(runId, 'after');
const visualDiff = await compareAllBreakpoints(
  runId,
  beforeScreenshots,
  afterScreenshots
);

// Log results
if (visualDiff.hasSignificantChanges) {
  console.log(`⚠️  Visual changes detected: ${visualDiff.totalDiffPercentage.toFixed(2)}%`);
} else {
  console.log(`✓ Minimal visual changes: ${visualDiff.totalDiffPercentage.toFixed(2)}%`);
}

// Include in Richard's blog post content
// Richard can reference diff images and percentages
```

## How It Works

1. **Screenshot Capture**
   - Puppeteer opens the landing page at each breakpoint
   - Full-page screenshots captured at 2x scale (retina)
   - Uploaded to Supabase Storage (`screenshots` bucket)
   - URLs saved to `runs` table

2. **Visual Comparison**
   - Downloads before/after screenshots
   - Parses PNG images using `pngjs`
   - Runs `pixelmatch` pixel comparison
   - Generates diff image with red highlights
   - Calculates metrics (pixels changed, percentage)
   - Determines significance based on threshold

3. **Region Detection**
   - Divides image into 50px grid
   - Identifies grid cells with changes
   - Creates bounding boxes around changed areas
   - Stores as JSONB array

4. **Storage & Reporting**
   - Saves diff results to `visual_diffs` table
   - Updates run with summary statistics
   - Uploads diff images to storage
   - Returns results to caller

## Configuration

### Thresholds

**Pixel Threshold** (default: 0.1):
- Range: 0.0 (strict) to 1.0 (lenient)
- Controls per-pixel color difference sensitivity
- Lower = detects smaller changes

**Significance Threshold** (default: 1.0%):
- Percentage of total pixels changed
- Marks diffs as "significant" if exceeded
- Helps filter animation/font rendering noise

### Breakpoints

Defined in `screenshots.ts`:
- Desktop: 1440x900 (16:10 aspect ratio)
- Tablet: 768x1024 (portrait iPad)
- Mobile: 375x812 (iPhone X/11/12)

## Output Examples

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
    Diff image: https://[supabase].co/.../diff-desktop.png
```

### Diff Images

Generated images show:
- **Red pixels** - Significant differences
- **Orange pixels** - Anti-aliasing differences
- **Original pixels** - No changes

Stored at: `screenshots/run-{runId}/diff-{breakpoint}.png`

## Next Steps

1. **Run Database Migration**
   ```bash
   cd supabase
   supabase db push
   ```

2. **Create Storage Bucket**
   - Supabase Dashboard > Storage
   - Create `screenshots` bucket
   - Set as Public

3. **Create Baseline**
   ```bash
   npm run visual-diff -- --baseline
   ```

4. **Test System**
   ```bash
   npx tsx scripts/example-visual-diff-integration.ts
   ```

5. **Integrate into Main Loop**
   - Add screenshot capture before/after optimization
   - Add visual diff comparison
   - Include results in agent context
   - Embed diff images in blog posts

## Maintenance

### Storage Costs
- Each screenshot: ~200-500 KB
- Each diff image: ~200-500 KB
- Per run (all breakpoints): ~1-3 MB
- Consider archival strategy for old diffs

### Performance
- Screenshot capture: ~10-30 seconds per breakpoint
- Visual diff: ~1-3 seconds per comparison
- Total per run: ~1-2 minutes

### Monitoring

Query for issues:
```sql
-- Failed comparisons (no diff data)
SELECT run_id, COUNT(*)
FROM visual_diffs
WHERE diff_pixels = 0 AND diff_image_url IS NULL
GROUP BY run_id;

-- High diff percentages (potential issues)
SELECT run_id, breakpoint, diff_percentage
FROM visual_diffs
WHERE diff_percentage > 50
ORDER BY created_at DESC;
```

## Troubleshooting

### Common Issues

1. **"Storage bucket not found"**
   - Create `screenshots` bucket in Supabase Dashboard
   - Ensure it's set as Public

2. **Screenshots identical when they shouldn't be**
   - Check viewport sizes match
   - Verify different URLs being compared
   - Increase sensitivity (lower pixel threshold)

3. **Too many false positives**
   - Increase pixel threshold (e.g., 0.2)
   - Increase significance threshold (e.g., 2.0%)
   - Add delays for animations to settle

4. **Build errors**
   - Note: There are pre-existing TypeScript errors in the project
   - Visual diff module is TypeScript-clean
   - Can ignore errors from other modules

## Files Reference

| File | Purpose |
|------|---------|
| `/packages/integrations/src/visual-diff.ts` | Core visual diff engine |
| `/packages/integrations/src/screenshots.ts` | Screenshot capture (existing) |
| `/supabase/migrations/010_visual_diffs.sql` | Database schema |
| `/scripts/run-visual-diff.ts` | CLI tool |
| `/scripts/example-visual-diff-integration.ts` | Integration example |
| `/docs/VISUAL_DIFF_TRACKING.md` | Comprehensive documentation |
| `/docs/VISUAL_DIFF_QUICK_START.md` | Quick reference |
| `/packages/integrations/src/types/visual-diff.d.ts` | Type definitions |

## Support

For questions or issues:
1. Check `/docs/VISUAL_DIFF_TRACKING.md`
2. Review example in `/scripts/example-visual-diff-integration.ts`
3. Query `visual_diffs` table for historical data
4. Check console logs from visual diff runs

## Future Enhancements

Potential improvements:
- Selective region comparison (ignore headers/footers)
- Animated GIF generation (before → after → diff)
- ML-based change classification
- Email alerts on significant changes
- Visual diff dashboard UI
- Performance metrics integration
- Automated rollback on regressions
