import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { supabaseAdmin } from './supabase';

export interface VisualDiffResult {
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  beforeScreenshotUrl: string;
  afterScreenshotUrl: string;
  diffImageUrl: string | null;
  totalPixels: number;
  diffPixels: number;
  diffPercentage: number;
  isSignificant: boolean;
  diffRegions: DiffRegion[];
}

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VisualDiffSummary {
  hasSignificantChanges: boolean;
  totalDiffPercentage: number;
  diffsByBreakpoint: {
    desktop?: { diffPercentage: number; isSignificant: boolean };
    tablet?: { diffPercentage: number; isSignificant: boolean };
    mobile?: { diffPercentage: number; isSignificant: boolean };
  };
}

/**
 * Download an image from a URL and convert to PNG
 */
async function downloadImage(url: string): Promise<PNG> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return PNG.sync.read(buffer);
}

/**
 * Upload a PNG image to Supabase storage
 */
async function uploadDiffImage(
  runId: string,
  breakpoint: string,
  diffPng: PNG
): Promise<string | null> {
  try {
    const buffer = PNG.sync.write(diffPng);
    const fileName = `run-${runId}/diff-${breakpoint}.png`;

    const { error } = await supabaseAdmin.storage
      .from('screenshots')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error(`[VisualDiff] Failed to upload diff image:`, error);
      return null;
    }

    const { data } = supabaseAdmin.storage
      .from('screenshots')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (err) {
    console.error('[VisualDiff] Error uploading diff image:', err);
    return null;
  }
}

/**
 * Compare two screenshots and generate a visual diff
 */
export async function compareScreenshots(
  runId: string,
  breakpoint: 'desktop' | 'tablet' | 'mobile',
  beforeUrl: string,
  afterUrl: string,
  threshold: number = 0.1,
  significanceThreshold: number = 1.0 // 1% change is significant
): Promise<VisualDiffResult> {
  console.log(`[VisualDiff] Comparing ${breakpoint} screenshots...`);

  try {
    // Download both images
    const [beforePng, afterPng] = await Promise.all([
      downloadImage(beforeUrl),
      downloadImage(afterUrl),
    ]);

    // Ensure images are the same size
    if (
      beforePng.width !== afterPng.width ||
      beforePng.height !== afterPng.height
    ) {
      throw new Error(
        `Image dimensions do not match: before=${beforePng.width}x${beforePng.height}, after=${afterPng.width}x${afterPng.height}`
      );
    }

    const { width, height } = beforePng;
    const totalPixels = width * height;

    // Create diff image
    const diffPng = new PNG({ width, height });

    // Run pixelmatch comparison
    const diffPixels = pixelmatch(
      beforePng.data,
      afterPng.data,
      diffPng.data,
      width,
      height,
      {
        threshold,
        includeAA: false, // Ignore anti-aliasing
        alpha: 0.1,
        diffColor: [255, 0, 0], // Red for differences
        diffColorAlt: [255, 165, 0], // Orange for AA differences
      }
    );

    const diffPercentage = (diffPixels / totalPixels) * 100;
    const isSignificant = diffPercentage >= significanceThreshold;

    console.log(
      `[VisualDiff] ${breakpoint}: ${diffPixels.toLocaleString()} pixels changed (${diffPercentage.toFixed(2)}%)${isSignificant ? ' [SIGNIFICANT]' : ''}`
    );

    // Upload diff image if there are changes
    let diffImageUrl: string | null = null;
    if (diffPixels > 0) {
      diffImageUrl = await uploadDiffImage(runId, breakpoint, diffPng);
    }

    // Calculate diff regions (bounding boxes of changed areas)
    const diffRegions = calculateDiffRegions(diffPng.data, width, height);

    // Store result in database
    const { error: dbError } = await supabaseAdmin.from('visual_diffs').insert({
      run_id: runId,
      breakpoint,
      before_screenshot_url: beforeUrl,
      after_screenshot_url: afterUrl,
      diff_image_url: diffImageUrl,
      total_pixels: totalPixels,
      diff_pixels: diffPixels,
      diff_percentage: diffPercentage,
      threshold,
      is_significant: isSignificant,
      diff_regions: diffRegions,
    });

    if (dbError) {
      console.error('[VisualDiff] Failed to save diff to database:', dbError);
    }

    return {
      breakpoint,
      beforeScreenshotUrl: beforeUrl,
      afterScreenshotUrl: afterUrl,
      diffImageUrl,
      totalPixels,
      diffPixels,
      diffPercentage,
      isSignificant,
      diffRegions,
    };
  } catch (err) {
    console.error(`[VisualDiff] Error comparing ${breakpoint} screenshots:`, err);
    throw err;
  }
}

/**
 * Calculate bounding boxes of changed regions
 */
function calculateDiffRegions(
  diffData: Buffer,
  width: number,
  height: number
): DiffRegion[] {
  const regions: DiffRegion[] = [];
  const gridSize = 50; // Divide image into 50px grid
  const visited = new Set<string>();

  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;

      // Check if this grid cell has any changes
      let hasChange = false;
      for (let dy = 0; dy < gridSize && y + dy < height; dy++) {
        for (let dx = 0; dx < gridSize && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          // Check if pixel is marked as different (red channel > 200)
          if (diffData[idx] > 200) {
            hasChange = true;
            break;
          }
        }
        if (hasChange) break;
      }

      if (hasChange) {
        visited.add(key);
        regions.push({
          x,
          y,
          width: Math.min(gridSize, width - x),
          height: Math.min(gridSize, height - y),
        });
      }
    }
  }

  return regions;
}

/**
 * Compare all breakpoints for a run and update the run summary
 */
export async function compareAllBreakpoints(
  runId: string,
  beforeScreenshots: { desktop: string | null; tablet: string | null; mobile: string | null },
  afterScreenshots: { desktop: string | null; tablet: string | null; mobile: string | null },
  threshold: number = 0.1,
  significanceThreshold: number = 1.0
): Promise<VisualDiffSummary> {
  console.log(`[VisualDiff] Comparing all breakpoints for run ${runId}...`);

  const results: VisualDiffResult[] = [];
  const breakpoints: Array<'desktop' | 'tablet' | 'mobile'> = ['desktop', 'tablet', 'mobile'];

  for (const breakpoint of breakpoints) {
    const beforeUrl = beforeScreenshots[breakpoint];
    const afterUrl = afterScreenshots[breakpoint];

    if (!beforeUrl || !afterUrl) {
      console.log(`[VisualDiff] Skipping ${breakpoint}: missing screenshots`);
      continue;
    }

    try {
      const result = await compareScreenshots(
        runId,
        breakpoint,
        beforeUrl,
        afterUrl,
        threshold,
        significanceThreshold
      );
      results.push(result);
    } catch (err) {
      console.error(`[VisualDiff] Failed to compare ${breakpoint}:`, err);
    }
  }

  // Calculate summary
  const hasSignificantChanges = results.some((r) => r.isSignificant);
  const totalDiffPercentage =
    results.reduce((sum, r) => sum + r.diffPercentage, 0) / results.length;

  const diffsByBreakpoint: VisualDiffSummary['diffsByBreakpoint'] = {};
  for (const result of results) {
    diffsByBreakpoint[result.breakpoint] = {
      diffPercentage: result.diffPercentage,
      isSignificant: result.isSignificant,
    };
  }

  const summary: VisualDiffSummary = {
    hasSignificantChanges,
    totalDiffPercentage,
    diffsByBreakpoint,
  };

  // Update run with summary
  const { error: updateError } = await supabaseAdmin
    .from('runs')
    .update({
      visual_diff_summary: summary,
    })
    .eq('id', runId);

  if (updateError) {
    console.error('[VisualDiff] Failed to update run with summary:', updateError);
  }

  console.log(
    `[VisualDiff] Summary: ${results.length} breakpoints compared, ${totalDiffPercentage.toFixed(2)}% average change${hasSignificantChanges ? ' [SIGNIFICANT CHANGES DETECTED]' : ''}`
  );

  return summary;
}

/**
 * Get visual diff results for a run
 */
export async function getVisualDiffs(runId: string): Promise<VisualDiffResult[]> {
  const { data, error } = await supabaseAdmin
    .from('visual_diffs')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[VisualDiff] Failed to fetch visual diffs:', error);
    return [];
  }

  return data.map((row) => ({
    breakpoint: row.breakpoint,
    beforeScreenshotUrl: row.before_screenshot_url,
    afterScreenshotUrl: row.after_screenshot_url,
    diffImageUrl: row.diff_image_url,
    totalPixels: row.total_pixels,
    diffPixels: row.diff_pixels,
    diffPercentage: row.diff_percentage,
    isSignificant: row.is_significant,
    diffRegions: row.diff_regions || [],
  }));
}
