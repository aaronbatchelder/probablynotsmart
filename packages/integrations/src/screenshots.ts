import puppeteer, { Browser } from 'puppeteer';
import { supabaseAdmin } from './supabase';

export interface ScreenshotSet {
  desktop: string | null;
  tablet: string | null;
  mobile: string | null;
}

export interface Breakpoint {
  name: 'desktop' | 'tablet' | 'mobile';
  width: number;
  height: number;
}

export const BREAKPOINTS: Breakpoint[] = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://probablynotsmart.ai';

/**
 * Capture full-page screenshots at all breakpoints
 */
export async function captureScreenshots(
  runId: string,
  phase: 'before' | 'after'
): Promise<ScreenshotSet> {
  console.log(`[Screenshots] Capturing ${phase} screenshots for run ${runId}...`);

  let browser: Browser | null = null;
  const screenshots: ScreenshotSet = {
    desktop: null,
    tablet: null,
    mobile: null,
  };

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set a reasonable timeout
    page.setDefaultNavigationTimeout(30000);

    for (const breakpoint of BREAKPOINTS) {
      try {
        console.log(`[Screenshots] Capturing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})...`);

        // Set viewport
        await page.setViewport({
          width: breakpoint.width,
          height: breakpoint.height,
          deviceScaleFactor: 2, // Retina quality
        });

        // Navigate to the site
        await page.goto(SITE_URL, {
          waitUntil: 'networkidle0',
        });

        // Wait a bit for any animations to settle
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

        // Take full-page screenshot
        const screenshotBuffer = await page.screenshot({
          fullPage: true,
          type: 'png',
        });

        // Upload to Supabase Storage
        const fileName = `run-${runId}/${phase}-${breakpoint.name}.png`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('screenshots')
          .upload(fileName, screenshotBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error(`[Screenshots] Failed to upload ${breakpoint.name}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('screenshots')
          .getPublicUrl(fileName);

        screenshots[breakpoint.name] = urlData.publicUrl;
        console.log(`[Screenshots] ${breakpoint.name} captured: ${urlData.publicUrl}`);

      } catch (err) {
        console.error(`[Screenshots] Failed to capture ${breakpoint.name}:`, err);
      }
    }

    await browser.close();
    browser = null;

    console.log(`[Screenshots] Completed ${phase} screenshots`);
    return screenshots;

  } catch (err) {
    console.error('[Screenshots] Fatal error:', err);
    if (browser) {
      await browser.close();
    }
    return screenshots;
  }
}

/**
 * Store screenshot URLs in the runs table
 */
export async function saveScreenshotsToRun(
  runId: string,
  phase: 'before' | 'after',
  screenshots: ScreenshotSet
): Promise<void> {
  const column = phase === 'before' ? 'screenshots_before' : 'screenshots_after';

  const { error } = await supabaseAdmin
    .from('runs')
    .update({ [column]: screenshots })
    .eq('id', runId);

  if (error) {
    console.error(`[Screenshots] Failed to save ${phase} screenshots to run:`, error);
  }
}

/**
 * Convenience function to capture and save screenshots
 */
export async function captureAndSaveScreenshots(
  runId: string,
  phase: 'before' | 'after'
): Promise<ScreenshotSet> {
  const screenshots = await captureScreenshots(runId, phase);
  await saveScreenshotsToRun(runId, phase, screenshots);
  return screenshots;
}
