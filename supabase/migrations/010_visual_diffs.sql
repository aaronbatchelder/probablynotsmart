-- ============================================
-- VISUAL DIFFS: Track visual changes to landing page
-- ============================================

-- Create visual_diffs table to store diff results
CREATE TABLE visual_diffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES runs(id),
    breakpoint TEXT NOT NULL CHECK (breakpoint IN ('desktop', 'tablet', 'mobile')),

    -- Image URLs
    before_screenshot_url TEXT NOT NULL,
    after_screenshot_url TEXT NOT NULL,
    diff_image_url TEXT,

    -- Diff metrics
    total_pixels INTEGER NOT NULL,
    diff_pixels INTEGER NOT NULL,
    diff_percentage DECIMAL(5, 2) NOT NULL,

    -- Threshold used for comparison
    threshold DECIMAL(3, 2) DEFAULT 0.1,

    -- Whether this diff is significant
    is_significant BOOLEAN DEFAULT FALSE,

    -- Diff regions (bounding boxes of changed areas)
    diff_regions JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visual_diffs_run_id ON visual_diffs(run_id);
CREATE INDEX idx_visual_diffs_breakpoint ON visual_diffs(breakpoint);
CREATE INDEX idx_visual_diffs_is_significant ON visual_diffs(is_significant);

-- Add visual_diff_summary column to runs table
ALTER TABLE runs
ADD COLUMN IF NOT EXISTS visual_diff_summary JSONB DEFAULT NULL;

-- The visual_diff_summary will contain:
-- {
--   "has_significant_changes": boolean,
--   "total_diff_percentage": number,
--   "diffs_by_breakpoint": {
--     "desktop": {"diff_percentage": number, "is_significant": boolean},
--     "tablet": {"diff_percentage": number, "is_significant": boolean},
--     "mobile": {"diff_percentage": number, "is_significant": boolean}
--   }
-- }
