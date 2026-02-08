-- ============================================
-- Add Moltbook and Reddit platforms
-- Add agent_name to track which agent posted
-- Add posted_url for the actual post link
-- ============================================

-- Update social_posts platform constraint to include moltbook and reddit
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_platform_check;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_platform_check
    CHECK (platform IN ('x', 'linkedin', 'threads', 'moltbook', 'reddit'));

-- Add agent_name column to social_posts
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS agent_name TEXT;

-- Update growth_actions platform constraint
ALTER TABLE growth_actions DROP CONSTRAINT IF EXISTS growth_actions_platform_check;
ALTER TABLE growth_actions ADD CONSTRAINT growth_actions_platform_check
    CHECK (platform IN ('x', 'linkedin', 'threads', 'moltbook', 'reddit'));

-- Add agent_name column to growth_actions
ALTER TABLE growth_actions ADD COLUMN IF NOT EXISTS agent_name TEXT DEFAULT 'Russ';

-- Add action types for posting (not just engagement)
ALTER TABLE growth_actions DROP CONSTRAINT IF EXISTS growth_actions_action_type_check;
ALTER TABLE growth_actions ADD CONSTRAINT growth_actions_action_type_check
    CHECK (action_type IN ('reply', 'quote_tweet', 'like', 'follow', 'dm', 'post', 'comment'));

-- Add posted_url to track the actual URL of the published post
ALTER TABLE growth_actions ADD COLUMN IF NOT EXISTS posted_url TEXT;
