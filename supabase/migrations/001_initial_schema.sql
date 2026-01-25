-- ============================================
-- probablynotsmart Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- RUNS: Each optimization cycle
-- ============================================
CREATE TABLE runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_number INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),

    -- Agent outputs (stored as JSONB)
    bighead_output JSONB,
    gavin_output JSONB,
    gilfoyle_output JSONB,
    gavin_gilfoyle_iterations INTEGER DEFAULT 0,
    aligned_proposal JSONB,
    dinesh_output JSONB,
    laurie_decision JSONB,
    monica_output JSONB,
    erlich_output JSONB,
    jared_output JSONB,
    executor_output JSONB,
    richard_output JSONB,

    -- Metrics snapshot
    metrics_before JSONB,
    metrics_after JSONB,

    -- Page state
    page_state_before JSONB,
    page_state_after JSONB,
    changes_made JSONB,

    -- Spend
    spend_this_run DECIMAL(10, 2) DEFAULT 0,
    spend_total_after DECIMAL(10, 2),
    budget_remaining DECIMAL(10, 2),

    -- Metadata
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runs_run_number ON runs(run_number);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_created_at ON runs(created_at);

-- ============================================
-- ANALYTICS: Event tracking
-- ============================================
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    event_data JSONB,
    session_id TEXT,
    visitor_id TEXT,
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_country TEXT,
    ip_city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);

-- ============================================
-- SIGNUPS: Email captures
-- ============================================
CREATE TABLE signups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    source TEXT,                    -- 'landing', 'blog', 'social'
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    synced_to_ghost BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signups_email ON signups(email);
CREATE INDEX idx_signups_created_at ON signups(created_at);

-- ============================================
-- SCREENSHOTS: Before/after captures
-- ============================================
CREATE TABLE screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES runs(id),
    type TEXT NOT NULL CHECK (type IN ('before', 'after')),
    storage_path TEXT NOT NULL,
    public_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_screenshots_run_id ON screenshots(run_id);

-- ============================================
-- SOCIAL_POSTS: Published content
-- ============================================
CREATE TABLE social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES runs(id),
    platform TEXT NOT NULL CHECK (platform IN ('x', 'linkedin', 'threads')),
    post_type TEXT NOT NULL CHECK (post_type IN ('run_update', 'engagement', 'daily_digest', 'weekly_deep_dive')),
    content TEXT NOT NULL,
    external_id TEXT,               -- Platform's post ID
    external_url TEXT,              -- Link to the post
    engagement_data JSONB,          -- Likes, shares, etc (updated periodically)
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_posts_run_id ON social_posts(run_id);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);

-- ============================================
-- BLOG_POSTS: Ghost content
-- ============================================
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES runs(id),
    post_type TEXT NOT NULL CHECK (post_type IN ('run_update', 'daily', 'weekly')),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    ghost_id TEXT,                  -- Ghost's post ID
    ghost_url TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_run_id ON blog_posts(run_id);
CREATE INDEX idx_blog_posts_post_type ON blog_posts(post_type);

-- ============================================
-- GROWTH_ACTIONS: Russ's engagement log
-- ============================================
CREATE TABLE growth_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL CHECK (action_type IN ('reply', 'quote_tweet', 'like', 'follow', 'dm')),
    platform TEXT NOT NULL CHECK (platform IN ('x', 'linkedin', 'threads')),
    target_url TEXT,                -- The post being engaged with
    target_author TEXT,
    content TEXT,                   -- What Russ wrote
    gilfoyle_check JSONB,           -- Tactics review
    erlich_check JSONB,             -- Content review
    approved BOOLEAN,
    external_id TEXT,               -- Platform's response ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_growth_actions_created_at ON growth_actions(created_at);
CREATE INDEX idx_growth_actions_platform ON growth_actions(platform);

-- ============================================
-- DONATIONS: Keep the AI alive
-- ============================================
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    donor_email TEXT,
    donor_name TEXT,
    stripe_payment_id TEXT,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONFIG: Runtime configuration
-- ============================================
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial config
INSERT INTO config (key, value) VALUES
    ('budget_total', '500'),
    ('budget_spent', '0'),
    ('budget_daily_cap', '30'),
    ('run_counter', '0'),
    ('experiment_started_at', 'null'),
    ('experiment_status', '"not_started"');  -- not_started, running, paused, completed

-- ============================================
-- PAGE_STATE: Current landing page configuration
-- ============================================
CREATE TABLE page_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    headline TEXT NOT NULL,
    subheadline TEXT NOT NULL,
    cta_text TEXT NOT NULL,
    cta_color TEXT NOT NULL,
    hero_image_url TEXT,
    body_copy TEXT NOT NULL,
    social_proof JSONB DEFAULT '[]'::jsonb,
    layout TEXT NOT NULL DEFAULT 'centered',
    color_scheme JSONB NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial page state
INSERT INTO page_state (
    headline,
    subheadline,
    cta_text,
    cta_color,
    hero_image_url,
    body_copy,
    social_proof,
    layout,
    color_scheme,
    is_active
) VALUES (
    'An AI is running this page.',
    'We gave it $500 and no supervision. Follow along as it tries to get you to sign up.',
    'Follow the Experiment',
    '#FF5C35',
    NULL,
    E'This is probablynotsmart—an experiment in autonomous AI marketing.\n\nEvery 12 hours, a team of AI agents analyzes performance, debates changes, and deploys updates to this very page. No humans involved.\n\nThe goal? Maximize email signups. The budget? $500. The oversight? None.\n\nSign up to get daily updates on what the AI decided, why it decided it, and whether it''s working.\n\nProbably not smart. Definitely interesting.',
    '[]'::jsonb,
    'centered',
    '{"background": "#FEFDFB", "text": "#1A1A1A", "accent": "#FF5C35", "muted": "#6B6B6B"}'::jsonb,
    TRUE
);

-- ============================================
-- VIEWS: Useful aggregations
-- ============================================
CREATE VIEW daily_metrics AS
SELECT
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
    COUNT(*) FILTER (WHERE event_type = 'signup') as signups,
    COUNT(DISTINCT session_id) as unique_sessions,
    ROUND(
        COUNT(*) FILTER (WHERE event_type = 'signup')::DECIMAL /
        NULLIF(COUNT(DISTINCT session_id), 0) * 100,
        2
    ) as conversion_rate
FROM analytics_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE VIEW budget_status AS
SELECT
    (SELECT value::DECIMAL FROM config WHERE key = 'budget_total') as total,
    (SELECT value::DECIMAL FROM config WHERE key = 'budget_spent') as spent,
    (SELECT value::DECIMAL FROM config WHERE key = 'budget_total') -
    (SELECT value::DECIMAL FROM config WHERE key = 'budget_spent') as remaining,
    (SELECT COALESCE(SUM(amount), 0) FROM donations) as donations_received;

CREATE VIEW current_metrics AS
SELECT
    COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '24 hours') as visitors_24h,
    COUNT(DISTINCT session_id) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as unique_sessions_24h,
    COUNT(*) FILTER (WHERE event_type = 'signup' AND created_at > NOW() - INTERVAL '24 hours') as signups_24h,
    ROUND(
        COUNT(*) FILTER (WHERE event_type = 'signup' AND created_at > NOW() - INTERVAL '24 hours')::DECIMAL /
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'), 0) * 100,
        2
    ) as conversion_rate_24h,
    COUNT(*) FILTER (WHERE event_type = 'page_view') as visitors_total,
    COUNT(*) FILTER (WHERE event_type = 'signup') as signups_total,
    ROUND(
        COUNT(*) FILTER (WHERE event_type = 'signup')::DECIMAL /
        NULLIF(COUNT(DISTINCT session_id), 0) * 100,
        2
    ) as conversion_rate_total
FROM analytics_events;
