-- Track which comments we've replied to
CREATE TABLE IF NOT EXISTS engagement_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  comment_id TEXT NOT NULL,
  post_id TEXT,
  reply_content TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate replies
  UNIQUE(platform, comment_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_engagement_replies_platform_comment
ON engagement_replies(platform, comment_id);
