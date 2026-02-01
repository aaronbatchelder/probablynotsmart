-- ============================================
-- AGENT SUBSCRIPTIONS: Support for agent traffic
-- ============================================

-- Add columns to signups table to track agent subscribers
ALTER TABLE signups
ADD COLUMN IF NOT EXISTS subscriber_type TEXT DEFAULT 'human'
    CHECK (subscriber_type IN ('human', 'agent'));
ALTER TABLE signups ADD COLUMN IF NOT EXISTS agent_id TEXT;
ALTER TABLE signups ADD COLUMN IF NOT EXISTS agent_platform TEXT;

-- Create index for filtering by subscriber type
CREATE INDEX IF NOT EXISTS idx_signups_subscriber_type ON signups(subscriber_type);

-- ============================================
-- AGENT WEBHOOK SUBSCRIPTIONS
-- For agents who want JSON updates pushed to them
-- ============================================
CREATE TABLE IF NOT EXISTS agent_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT,
    agent_platform TEXT,
    callback_url TEXT NOT NULL,
    update_frequency TEXT DEFAULT 'daily'
        CHECK (update_frequency IN ('every_run', 'daily', 'weekly')),
    interests TEXT[] DEFAULT ARRAY['all'],
    last_notified_at TIMESTAMPTZ,
    last_notified_run INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_subscriptions_active ON agent_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_subscriptions_frequency ON agent_subscriptions(update_frequency);

-- ============================================
-- View: Subscriber stats (human vs agent)
-- ============================================
CREATE OR REPLACE VIEW subscriber_stats AS
SELECT
    subscriber_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d
FROM signups
GROUP BY subscriber_type;

-- ============================================
-- View: Combined subscriber count
-- ============================================
CREATE OR REPLACE VIEW total_subscribers AS
SELECT
    (SELECT COUNT(*) FROM signups WHERE subscriber_type = 'human') as humans,
    (SELECT COUNT(*) FROM signups WHERE subscriber_type = 'agent') as agent_emails,
    (SELECT COUNT(*) FROM agent_subscriptions WHERE is_active = true) as agent_webhooks,
    (SELECT COUNT(*) FROM signups) +
    (SELECT COUNT(*) FROM agent_subscriptions WHERE is_active = true) as total;
