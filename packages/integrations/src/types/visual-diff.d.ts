/**
 * Type definitions for Visual Diff Tracking
 */

declare module '@probablynotsmart/integrations' {
  /**
   * Result of comparing screenshots at a single breakpoint
   */
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

  /**
   * A rectangular region where visual changes were detected
   */
  export interface DiffRegion {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  /**
   * Summary of visual diffs across all breakpoints
   */
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
   * Compare two screenshots at a specific breakpoint
   * @param runId - UUID of the run
   * @param breakpoint - Device breakpoint
   * @param beforeUrl - URL of the before screenshot
   * @param afterUrl - URL of the after screenshot
   * @param threshold - Pixel comparison threshold (0-1, default: 0.1)
   * @param significanceThreshold - % of changed pixels to mark as significant (default: 1.0)
   * @returns Visual diff result
   */
  export function compareScreenshots(
    runId: string,
    breakpoint: 'desktop' | 'tablet' | 'mobile',
    beforeUrl: string,
    afterUrl: string,
    threshold?: number,
    significanceThreshold?: number
  ): Promise<VisualDiffResult>;

  /**
   * Compare screenshots across all breakpoints
   * @param runId - UUID of the run
   * @param beforeScreenshots - Object with before screenshot URLs
   * @param afterScreenshots - Object with after screenshot URLs
   * @param threshold - Pixel comparison threshold (0-1, default: 0.1)
   * @param significanceThreshold - % of changed pixels to mark as significant (default: 1.0)
   * @returns Summary of visual diffs
   */
  export function compareAllBreakpoints(
    runId: string,
    beforeScreenshots: {
      desktop: string | null;
      tablet: string | null;
      mobile: string | null;
    },
    afterScreenshots: {
      desktop: string | null;
      tablet: string | null;
      mobile: string | null;
    },
    threshold?: number,
    significanceThreshold?: number
  ): Promise<VisualDiffSummary>;

  /**
   * Retrieve visual diff results for a run
   * @param runId - UUID of the run
   * @returns Array of visual diff results
   */
  export function getVisualDiffs(runId: string): Promise<VisualDiffResult[]>;
}
