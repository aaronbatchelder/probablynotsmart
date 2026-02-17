-- Add screenshot URLs and changes summary to blog_posts
-- This allows the blog post page to show visual before/after comparison

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS screenshots_before JSONB;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS screenshots_after JSONB;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS changes_summary TEXT;

COMMENT ON COLUMN blog_posts.screenshots_before IS 'Screenshot URLs from before changes: {desktop, tablet, mobile}';
COMMENT ON COLUMN blog_posts.screenshots_after IS 'Screenshot URLs from after changes: {desktop, tablet, mobile}';
COMMENT ON COLUMN blog_posts.changes_summary IS 'Brief summary of what changed this run (2-3 sentences)';
