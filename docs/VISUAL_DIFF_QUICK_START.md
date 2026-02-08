# Visual Diff Tracking - Quick Start Guide

Quick reference for using the visual diff tracking system.

## Setup (One-time)

1. **Run the migration:**
```bash
cd supabase
supabase db push
# Or manually run: migrations/010_visual_diffs.sql
```

2. **Create storage bucket:**
- Go to Supabase Dashboard > Storage
- Create bucket named `screenshots`
- Set as Public

3. **Dependencies already installed:**
- `pixelmatch` - Image comparison
- `pngjs` - PNG parsing
- `puppeteer` - Screenshot capture

## Quick Commands

### Create baseline screenshots:
```bash
npm run visual-diff -- --baseline
```

### Run visual diff check:
```bash
npm run visual-diff
```

### Check specific run:
```bash
npm run visual-diff -- --run-id <uuid>
```

## Code Integration

### Basic Usage:
```typescript
import { captureAndSaveScreenshots, compareAllBreakpoints } from '@probablynotsmart/integrations';

// Capture before
const before = await captureAndSaveScreenshots(runId, 'before');

// ... make changes ...

// Capture after
const after = await captureAndSaveScreenshots(runId, 'after');

// Compare
const diff = await compareAllBreakpoints(runId, before, after);

// Check results
if (diff.hasSignificantChanges) {
  console.log(`Changes detected: ${diff.totalDiffPercentage}%`);
}
```

### In Main Loop:
```typescript
// At start of run
const beforeScreenshots = await captureAndSaveScreenshots(runId, 'before');

// ... agents optimize page ...

// At end of run
const afterScreenshots = await captureAndSaveScreenshots(runId, 'after');
const visualDiff = await compareAllBreakpoints(runId, beforeScreenshots, afterScreenshots);

// Include in agent context
if (visualDiff.hasSignificantChanges) {
  // Alert agents, include in blog post, etc.
}
```

## File Locations

- **Module:** `/packages/integrations/src/visual-diff.ts`
- **Screenshots:** `/packages/integrations/src/screenshots.ts`
- **Script:** `/scripts/run-visual-diff.ts`
- **Migration:** `/supabase/migrations/010_visual_diffs.sql`
- **Docs:** `/docs/VISUAL_DIFF_TRACKING.md`
- **Example:** `/scripts/example-visual-diff-integration.ts`

## Key Functions

| Function | Purpose |
|----------|---------|
| `captureScreenshots(runId, phase)` | Take screenshots at all breakpoints |
| `saveScreenshotsToRun(runId, phase, screenshots)` | Save URLs to database |
| `captureAndSaveScreenshots(runId, phase)` | Combined capture + save |
| `compareScreenshots(runId, breakpoint, beforeUrl, afterUrl)` | Compare single breakpoint |
| `compareAllBreakpoints(runId, before, after)` | Compare all breakpoints |
| `getVisualDiffs(runId)` | Fetch diff results from database |

## Database Tables

### `visual_diffs`
Stores individual diff results per breakpoint.

Key fields:
- `run_id` - Links to runs table
- `breakpoint` - desktop, tablet, or mobile
- `diff_percentage` - % of pixels changed
- `is_significant` - Boolean flag (>= 1% change)
- `diff_image_url` - Public URL to highlighted diff

### `runs.visual_diff_summary`
JSONB field with aggregate statistics:
```json
{
  "hasSignificantChanges": boolean,
  "totalDiffPercentage": number,
  "diffsByBreakpoint": { ... }
}
```

## Configuration

### Thresholds:
```typescript
compareAllBreakpoints(
  runId,
  before,
  after,
  0.1,  // pixel threshold (0-1, lower = stricter)
  1.0   // significance threshold (% changed)
);
```

### Breakpoints:
Defined in `screenshots.ts`:
- Desktop: 1440x900
- Tablet: 768x1024
- Mobile: 375x812

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Storage bucket not found" | Create `screenshots` bucket in Supabase |
| Screenshots always 100% different | Check viewport sizes match |
| No screenshots captured | Verify NEXT_PUBLIC_SITE_URL is set |
| Build errors | Ignore pre-existing TypeScript errors in other files |

## Useful Queries

### Recent diffs:
```sql
SELECT run_id, breakpoint, diff_percentage, is_significant
FROM visual_diffs
ORDER BY created_at DESC
LIMIT 10;
```

### Runs with significant changes:
```sql
SELECT id, run_number,
       visual_diff_summary->>'totalDiffPercentage' as change
FROM runs
WHERE visual_diff_summary->>'hasSignificantChanges' = 'true';
```

### Diff images:
```sql
SELECT breakpoint, diff_image_url
FROM visual_diffs
WHERE run_id = '<uuid>' AND diff_image_url IS NOT NULL;
```

## Next Steps

1. Run baseline: `npm run visual-diff -- --baseline`
2. Make a page change (or wait for agent loop)
3. Run diff check: `npm run visual-diff`
4. Review results in console and database
5. Integrate into main loop (see example script)

For full documentation, see: `/docs/VISUAL_DIFF_TRACKING.md`
