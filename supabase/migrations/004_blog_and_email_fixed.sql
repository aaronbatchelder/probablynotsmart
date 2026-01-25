-- ============================================
-- BLOG & EMAIL: Gated content for subscribers
-- ============================================
-- Fixed version: Updates existing tables instead of creating

-- ============================================
-- UPDATE BLOG_POSTS: Add missing columns
-- ============================================
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS run_number INTEGER,
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS content_html TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update post_type check constraint to include new types
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_post_type_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_post_type_check
    CHECK (post_type IN ('run_update', 'daily', 'weekly', 'weekly_digest', 'special', 'announcement'));

-- Add status check constraint
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_status_check
    CHECK (status IN ('draft', 'published', 'archived'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_run_number ON blog_posts(run_number);

-- ============================================
-- SUBSCRIBER TOKENS: For gated access
-- ============================================
CREATE TABLE IF NOT EXISTS subscriber_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    token_type TEXT NOT NULL DEFAULT 'access'
        CHECK (token_type IN ('access', 'magic_link', 'unsubscribe')),
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriber_tokens_token ON subscriber_tokens(token);
CREATE INDEX IF NOT EXISTS idx_subscriber_tokens_email ON subscriber_tokens(email);

-- ============================================
-- EMAIL LOG: Track sent emails
-- ============================================
CREATE TABLE IF NOT EXISTS email_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    signup_id UUID REFERENCES signups(id),
    email_type TEXT NOT NULL
        CHECK (email_type IN ('welcome', 'daily_digest', 'weekly_digest', 'magic_link', 'special')),
    subject TEXT NOT NULL,
    blog_post_id UUID REFERENCES blog_posts(id),
    run_id UUID REFERENCES runs(id),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked')),
    provider TEXT,
    provider_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_email ON email_log(email);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);

-- ============================================
-- Update signups table: Add subscriber fields
-- ============================================
ALTER TABLE signups
ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"daily_digest": true, "weekly_digest": true, "special": true}';

-- Generate access token for existing signups that don't have one
UPDATE signups
SET access_token = encode(gen_random_bytes(32), 'hex')
WHERE access_token IS NULL;

-- ============================================
-- View: Published posts for blog
-- ============================================
CREATE OR REPLACE VIEW published_posts AS
SELECT
    id,
    slug,
    title,
    excerpt,
    content,
    content_html,
    post_type,
    published_at,
    run_number,
    view_count,
    meta_title,
    meta_description,
    og_image_url
FROM blog_posts
WHERE status = 'published'
ORDER BY published_at DESC;

-- ============================================
-- View: Email stats
-- ============================================
CREATE OR REPLACE VIEW email_stats AS
SELECT
    email_type,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE status = 'sent') as delivered,
    COUNT(*) FILTER (WHERE status = 'opened') as opened,
    COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'opened')::numeric /
        NULLIF(COUNT(*) FILTER (WHERE status = 'sent'), 0) * 100,
        1
    ) as open_rate,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'clicked')::numeric /
        NULLIF(COUNT(*) FILTER (WHERE status = 'opened'), 0) * 100,
        1
    ) as click_rate
FROM email_log
GROUP BY email_type;

-- ============================================
-- Function: Generate access token on signup
-- ============================================
CREATE OR REPLACE FUNCTION generate_signup_access_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.access_token IS NULL THEN
        NEW.access_token := encode(gen_random_bytes(32), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_generate_access_token ON signups;
CREATE TRIGGER trigger_generate_access_token
    BEFORE INSERT ON signups
    FOR EACH ROW
    EXECUTE FUNCTION generate_signup_access_token();
