-- Add TL;DR field to blog posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tldr TEXT;

-- Add comment
COMMENT ON COLUMN blog_posts.tldr IS '1-2 sentence summary for readers who won''t read the full post';
