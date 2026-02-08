# Visual Diff Tracking System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    VISUAL DIFF TRACKING SYSTEM                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   CAPTURE    │ ───> │   COMPARE    │ ───> │    STORE     │
│ Screenshots  │      │   Pixels     │      │   Results    │
└──────────────┘      └──────────────┘      └──────────────┘
      │                      │                      │
      v                      v                      v
  Puppeteer            pixelmatch              Supabase
  3 breakpoints        Diff images             Database
                       Metrics                  + Storage
```

## Data Flow

```
1. START OF RUN
   ↓
   Capture "before" screenshots
   ├─ Desktop (1440x900)
   ├─ Tablet (768x1024)
   └─ Mobile (375x812)
   ↓
   Upload to Supabase Storage
   ↓
   Save URLs to runs.screenshots_before

2. AGENT OPTIMIZATION
   ↓
   (Agents analyze, debate, deploy changes)

3. END OF RUN
   ↓
   Capture "after" screenshots
   ├─ Desktop (1440x900)
   ├─ Tablet (768x1024)
   └─ Mobile (375x812)
   ↓
   Upload to Supabase Storage
   ↓
   Save URLs to runs.screenshots_after

4. VISUAL DIFF COMPARISON
   ↓
   For each breakpoint:
   ├─ Download before/after images
   ├─ Parse PNG data
   ├─ Run pixelmatch comparison
   ├─ Generate diff image (red highlights)
   ├─ Calculate metrics
   ├─ Detect changed regions
   └─ Store in visual_diffs table
   ↓
   Aggregate results
   ↓
   Save summary to runs.visual_diff_summary

5. REPORTING & DECISION-MAKING
   ↓
   ├─ Console output
   ├─ Include in blog posts
   ├─ Alert agents if significant
   └─ Track over time
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTEGRATIONS PACKAGE                    │
│                  @probablynotsmart/integrations                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ screenshots.ts                                           │  │
│  │ ───────────────────────────────────────────────────────  │  │
│  │ • captureScreenshots(runId, phase)                       │  │
│  │ • saveScreenshotsToRun(runId, phase, screenshots)        │  │
│  │ • captureAndSaveScreenshots(runId, phase)                │  │
│  │                                                           │  │
│  │ Uses: Puppeteer, Supabase Storage                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ visual-diff.ts                                           │  │
│  │ ───────────────────────────────────────────────────────  │  │
│  │ • compareScreenshots(runId, breakpoint, before, after)   │  │
│  │ • compareAllBreakpoints(runId, before, after)            │  │
│  │ • getVisualDiffs(runId)                                  │  │
│  │                                                           │  │
│  │ Uses: pixelmatch, pngjs, Supabase DB + Storage           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ supabase.ts                                              │  │
│  │ ───────────────────────────────────────────────────────  │  │
│  │ • getSupabaseAdmin()                                     │  │
│  │ • supabaseAdmin client                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ runs                                                     │  │
│  │ ───────────────────────────────────────────────────────  │  │
│  │ • id (UUID, PK)                                          │  │
│  │ • run_number (INTEGER)                                   │  │
│  │ • screenshots_before (JSONB)                             │  │
│  │   ├─ desktop: url                                        │  │
│  │   ├─ tablet: url                                         │  │
│  │   └─ mobile: url                                         │  │
│  │ • screenshots_after (JSONB)                              │  │
│  │   ├─ desktop: url                                        │  │
│  │   ├─ tablet: url                                         │  │
│  │   └─ mobile: url                                         │  │
│  │ • visual_diff_summary (JSONB)                            │  │
│  │   ├─ hasSignificantChanges: boolean                      │  │
│  │   ├─ totalDiffPercentage: number                         │  │
│  │   └─ diffsByBreakpoint: {...}                            │  │
│  │ • ... (other run fields)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ FK: run_id                          │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ visual_diffs                                             │  │
│  │ ───────────────────────────────────────────────────────  │  │
│  │ • id (UUID, PK)                                          │  │
│  │ • run_id (UUID, FK to runs)                              │  │
│  │ • breakpoint (TEXT: desktop|tablet|mobile)               │  │
│  │ • before_screenshot_url (TEXT)                           │  │
│  │ • after_screenshot_url (TEXT)                            │  │
│  │ • diff_image_url (TEXT, nullable)                        │  │
│  │ • total_pixels (INTEGER)                                 │  │
│  │ • diff_pixels (INTEGER)                                  │  │
│  │ • diff_percentage (DECIMAL)                              │  │
│  │ • threshold (DECIMAL)                                    │  │
│  │ • is_significant (BOOLEAN)                               │  │
│  │ • diff_regions (JSONB)                                   │  │
│  │   └─ [{x, y, width, height}, ...]                        │  │
│  │ • created_at (TIMESTAMPTZ)                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE STORAGE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bucket: screenshots (Public)                                  │
│  ──────────────────────────────────────────────────────────    │
│                                                                 │
│  Structure:                                                     │
│  run-{uuid}/                                                    │
│  ├─ before-desktop.png                                          │
│  ├─ before-tablet.png                                           │
│  ├─ before-mobile.png                                           │
│  ├─ after-desktop.png                                           │
│  ├─ after-tablet.png                                            │
│  ├─ after-mobile.png                                            │
│  ├─ diff-desktop.png   ← Generated by visual-diff              │
│  ├─ diff-tablet.png    ← Generated by visual-diff              │
│  └─ diff-mobile.png    ← Generated by visual-diff              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Comparison Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│                     PIXELMATCH COMPARISON                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: Two PNG images (before, after)                         │
│  ↓                                                              │
│  1. Parse PNG files                                             │
│     ├─ Extract pixel data (RGBA)                                │
│     ├─ Verify dimensions match                                  │
│     └─ Create output buffer for diff image                      │
│  ↓                                                              │
│  2. Pixel-by-pixel comparison                                   │
│     ├─ For each pixel (x, y):                                   │
│     │  ├─ Calculate color difference (YIQ color space)          │
│     │  ├─ Compare against threshold (0.1)                       │
│     │  ├─ If different:                                         │
│     │  │  ├─ Mark as changed                                    │
│     │  │  └─ Set diff pixel to red (255, 0, 0)                  │
│     │  └─ If same:                                              │
│     │     └─ Keep original pixel (dimmed)                       │
│     └─ Count total changed pixels                               │
│  ↓                                                              │
│  3. Calculate metrics                                           │
│     ├─ total_pixels = width × height                            │
│     ├─ diff_pixels = count of changed pixels                    │
│     ├─ diff_percentage = (diff_pixels / total_pixels) × 100     │
│     └─ is_significant = diff_percentage >= 1.0%                 │
│  ↓                                                              │
│  4. Detect changed regions                                      │
│     ├─ Divide image into 50×50px grid                           │
│     ├─ For each grid cell:                                      │
│     │  ├─ Check if any pixels changed                           │
│     │  └─ If yes: create bounding box                           │
│     └─ Return array of regions                                  │
│  ↓                                                              │
│  5. Generate diff image                                         │
│     ├─ Encode PNG with red highlights                           │
│     ├─ Upload to Supabase Storage                               │
│     └─ Return public URL                                        │
│  ↓                                                              │
│  Output: VisualDiffResult                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

### Main Agent Loop

```typescript
// scripts/run-main-loop.ts

async function runMainLoop() {
  // 1. Create run record
  const run = await createRun();
  const runId = run.id;

  // 2. Capture BEFORE screenshots
  const beforeScreenshots = await captureAndSaveScreenshots(runId, 'before');

  // 3. Get current metrics
  const metricsBefore = await getMetrics();

  // 4. Run agent chain
  const bigheadOutput = await runBighead(metricsBefore);
  const gavinOutput = await runGavin(bigheadOutput);
  // ... rest of agent chain ...

  // 5. Execute changes
  await executeChanges(executorOutput);

  // 6. Capture AFTER screenshots
  const afterScreenshots = await captureAndSaveScreenshots(runId, 'after');

  // 7. Run visual diff comparison
  const visualDiff = await compareAllBreakpoints(
    runId,
    beforeScreenshots,
    afterScreenshots
  );

  // 8. Get metrics after
  const metricsAfter = await getMetrics();

  // 9. Richard writes blog post (include visual diff data)
  const blogPost = await runRichard({
    run,
    metricsBefore,
    metricsAfter,
    visualDiff,  // ← Include visual diff results
    changes: executorOutput,
  });

  // 10. Complete run
  await completeRun(runId, {
    visualDiff,
    blogPost,
    // ...
  });
}
```

### Blog Post Generation

```typescript
// Richard can include visual diff data in blog posts

const prompt = `
Write a blog post about run #${run.run_number}.

Visual Changes:
${visualDiff.hasSignificantChanges ? '⚠️ Significant visual changes detected!' : '✓ Minimal visual changes'}

Average change: ${visualDiff.totalDiffPercentage.toFixed(2)}%

Breakdown:
- Desktop: ${visualDiff.diffsByBreakpoint.desktop?.diffPercentage.toFixed(2)}%
- Tablet: ${visualDiff.diffsByBreakpoint.tablet?.diffPercentage.toFixed(2)}%
- Mobile: ${visualDiff.diffsByBreakpoint.mobile?.diffPercentage.toFixed(2)}%

Diff images:
${diffs.map(d => `- ${d.breakpoint}: ${d.diffImageUrl}`).join('\n')}

Include these diff images in the blog post to show readers exactly what changed.
`;
```

## CLI Tool Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  scripts/run-visual-diff.ts                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Modes:                                                         │
│                                                                 │
│  1. Baseline Mode (--baseline)                                  │
│     ├─ Create run with run_number = 0                           │
│     ├─ Capture current screenshots                              │
│     ├─ Save as "before" screenshots                             │
│     └─ Store for future comparisons                             │
│                                                                 │
│  2. Compare Latest Mode (default)                               │
│     ├─ Find most recent run with screenshots                    │
│     ├─ Capture current screenshots as "after"                   │
│     ├─ Run visual diff comparison                               │
│     └─ Display results                                          │
│                                                                 │
│  3. Compare Specific Run (--run-id <uuid>)                      │
│     ├─ Load specified run                                       │
│     ├─ Get "before" screenshots from run                        │
│     ├─ Capture current screenshots as "after"                   │
│     ├─ Run visual diff comparison                               │
│     └─ Display results                                          │
│                                                                 │
│  Output:                                                        │
│  ├─ Console report with metrics                                 │
│  ├─ Diff image URLs                                             │
│  └─ Database records                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## External Dependencies

```
┌──────────────────┐
│   puppeteer      │  Screenshot capture
│   v24.37.2+      │  • Headless Chrome browser
└──────────────────┘  • Full-page screenshots
                      • Viewport control
                      • Network idle detection

┌──────────────────┐
│   pixelmatch     │  Image comparison
│   v5.3.0+        │  • Pixel-level diffing
└──────────────────┘  • YIQ color space
                      • Anti-aliasing detection
                      • Configurable threshold

┌──────────────────┐
│   pngjs          │  PNG processing
│   v7.0.0+        │  • Parse PNG files
└──────────────────┘  • Extract pixel data
                      • Encode PNG files

┌──────────────────┐
│   @supabase      │  Storage & Database
│   /supabase-js   │  • Image storage
└──────────────────┘  • Metadata storage
                      • Public URLs
```

## Performance Characteristics

```
Operation                  Time         Notes
─────────────────────────────────────────────────────────────
Screenshot (1 breakpoint)  10-30s       Depends on page complexity
Screenshot (all 3)         30-90s       Parallel not possible (Puppeteer)
Image comparison           1-3s         Per breakpoint
Diff image generation      1-2s         Per breakpoint
Storage upload             1-2s         Per image
Total per run              ~1-2min      End-to-end

Storage Requirements
─────────────────────────────────────────────────────────────
Before screenshot          ~300KB       Per breakpoint, full-page PNG
After screenshot           ~300KB       Per breakpoint, full-page PNG
Diff image                 ~300KB       Per breakpoint, highlighted PNG
Total per run              ~2.7MB       All screenshots + diffs
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERROR SCENARIOS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Screenshot Capture Failure                                  │
│     ├─ Network timeout                                          │
│     ├─ Page load error                                          │
│     └─ Puppeteer crash                                          │
│     → Log error, continue with available screenshots            │
│                                                                 │
│  2. Storage Upload Failure                                      │
│     ├─ Network error                                            │
│     ├─ Quota exceeded                                           │
│     └─ Permission denied                                        │
│     → Log error, store URL as null                              │
│                                                                 │
│  3. Image Download Failure                                      │
│     ├─ 404 Not Found                                            │
│     ├─ Network timeout                                          │
│     └─ Invalid URL                                              │
│     → Skip comparison for that breakpoint                       │
│                                                                 │
│  4. Comparison Failure                                          │
│     ├─ Dimension mismatch                                       │
│     ├─ Invalid PNG data                                         │
│     └─ Out of memory                                            │
│     → Log error, mark as failed                                 │
│                                                                 │
│  5. Database Write Failure                                      │
│     ├─ Connection error                                         │
│     ├─ Constraint violation                                     │
│     └─ Permission denied                                        │
│     → Log error, return results anyway                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Security Considerations

```
1. Storage Access
   ├─ Bucket: Public (read-only)
   ├─ Uploads: Service role key required
   └─ URLs: Publicly accessible

2. Database Access
   ├─ Reads: Service role or anon key
   ├─ Writes: Service role key required
   └─ Row Level Security: Not enforced (service role)

3. Screenshot Content
   ├─ No PII captured
   ├─ Public website only
   └─ No authentication state

4. API Keys
   ├─ SUPABASE_SERVICE_ROLE_KEY: In .env
   ├─ Never committed to repo
   └─ Rotated periodically
```

## Monitoring & Observability

```
Key Metrics to Track:
─────────────────────────────────────────────────────────────
1. Screenshot capture success rate
2. Visual diff comparison completion rate
3. Average diff percentage over time
4. Frequency of significant changes
5. Storage usage growth
6. Processing time per run

Queries for Monitoring:
─────────────────────────────────────────────────────────────
-- Runs with visual diffs
SELECT COUNT(*) FROM runs WHERE visual_diff_summary IS NOT NULL;

-- Average diff percentage
SELECT AVG((visual_diff_summary->>'totalDiffPercentage')::numeric)
FROM runs WHERE visual_diff_summary IS NOT NULL;

-- Significant changes frequency
SELECT COUNT(*) FROM runs
WHERE visual_diff_summary->>'hasSignificantChanges' = 'true';

-- Storage usage
SELECT COUNT(*) * 2.7 as mb_used FROM runs
WHERE screenshots_before IS NOT NULL;
```

---

For implementation details, see:
- `/docs/VISUAL_DIFF_TRACKING.md` - Full documentation
- `/docs/VISUAL_DIFF_QUICK_START.md` - Quick reference
- `/VISUAL_DIFF_IMPLEMENTATION.md` - Implementation summary
