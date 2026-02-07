-- ============================================
-- SCREENSHOTS: Add screenshot columns to runs table
-- ============================================

-- Add screenshot columns to runs table
ALTER TABLE runs
ADD COLUMN IF NOT EXISTS screenshots_before JSONB DEFAULT '{"desktop": null, "tablet": null, "mobile": null}',
ADD COLUMN IF NOT EXISTS screenshots_after JSONB DEFAULT '{"desktop": null, "tablet": null, "mobile": null}';

-- Create storage bucket for screenshots (run this in Supabase dashboard)
-- Note: Storage buckets must be created via dashboard or management API
-- Bucket name: screenshots
-- Public: true (for easy embedding in blog posts)

-- Example of what to run in SQL editor if storage policies needed:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true)
-- ON CONFLICT (id) DO NOTHING;
