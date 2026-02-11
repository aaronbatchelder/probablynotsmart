-- Migration: Enable RLS on all tables and fix security definer views
-- This addresses Supabase security linter warnings

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

-- Core tables
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Content tables
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_actions ENABLE ROW LEVEL SECURITY;

-- User/signup tables (sensitive!)
ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Agent tables
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_subscriptions ENABLE ROW LEVEL SECURITY;

-- Analytics/tracking tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitter_follows ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- Service role (used by our backend) can do everything
-- Anon role gets read-only access to public data only
-- ============================================

-- Helper: Policy for service role full access (all tables)
-- We use service_role for all backend operations

-- RUNS - public can read, only service can write
CREATE POLICY "Service role full access" ON public.runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON public.runs FOR SELECT TO anon USING (true);

-- CONFIG - service only (contains internal settings)
CREATE POLICY "Service role full access" ON public.config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PAGE_STATE - public can read current state
CREATE POLICY "Service role full access" ON public.page_state FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON public.page_state FOR SELECT TO anon USING (true);

-- PAGE_CONFIG - public can read current config
CREATE POLICY "Service role full access" ON public.page_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON public.page_config FOR SELECT TO anon USING (true);

-- DONATIONS - service only
CREATE POLICY "Service role full access" ON public.donations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- BLOG_POSTS - public can read published posts
CREATE POLICY "Service role full access" ON public.blog_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public read published" ON public.blog_posts FOR SELECT TO anon USING (status = 'published');

-- SOCIAL_POSTS - public can read
CREATE POLICY "Service role full access" ON public.social_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON public.social_posts FOR SELECT TO anon USING (true);

-- GROWTH_ACTIONS - service only
CREATE POLICY "Service role full access" ON public.growth_actions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SIGNUPS - service only (contains emails and access tokens!)
CREATE POLICY "Service role full access" ON public.signups FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SUBSCRIBER_TOKENS - service only (contains tokens!)
CREATE POLICY "Service role full access" ON public.subscriber_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);

-- EMAIL_LOG - service only
CREATE POLICY "Service role full access" ON public.email_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- AGENT_MEMORY - service only
CREATE POLICY "Service role full access" ON public.agent_memory FOR ALL TO service_role USING (true) WITH CHECK (true);

-- COLLECTIVE_LOG - public can read (it's part of the experiment transparency)
CREATE POLICY "Service role full access" ON public.collective_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON public.collective_log FOR SELECT TO anon USING (true);

-- AGENT_SUBSCRIPTIONS - service only
CREATE POLICY "Service role full access" ON public.agent_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ANALYTICS_EVENTS - service only (contains session IDs)
CREATE POLICY "Service role full access" ON public.analytics_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SCREENSHOTS - public can read
CREATE POLICY "Service role full access" ON public.screenshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON public.screenshots FOR SELECT TO anon USING (true);

-- VISUAL_CHANGELOG - public can read
CREATE POLICY "Service role full access" ON public.visual_changelog FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON public.visual_changelog FOR SELECT TO anon USING (true);

-- VISUAL_DIFFS - public can read
CREATE POLICY "Service role full access" ON public.visual_diffs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON public.visual_diffs FOR SELECT TO anon USING (true);

-- TWITTER_FOLLOWS - service only
CREATE POLICY "Service role full access" ON public.twitter_follows FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- FIX SECURITY DEFINER VIEWS
-- Recreate views without SECURITY DEFINER
-- ============================================

-- Drop and recreate views as SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.experiment_gallery;
DROP VIEW IF EXISTS public.current_page_config;
DROP VIEW IF EXISTS public.agent_learning_trends;
DROP VIEW IF EXISTS public.recent_collective_decisions;
DROP VIEW IF EXISTS public.subscriber_stats;
DROP VIEW IF EXISTS public.published_posts;
DROP VIEW IF EXISTS public.agent_track_record;
DROP VIEW IF EXISTS public.current_metrics;
DROP VIEW IF EXISTS public.budget_status;
DROP VIEW IF EXISTS public.email_stats;
DROP VIEW IF EXISTS public.total_subscribers;
DROP VIEW IF EXISTS public.daily_metrics;

-- Recreate current_metrics (most commonly used)
CREATE VIEW public.current_metrics AS
SELECT
  (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '24 hours') as visitors_24h,
  (SELECT COUNT(*) FROM signups WHERE created_at > NOW() - INTERVAL '24 hours' AND unsubscribed_at IS NULL) as signups_24h,
  CASE
    WHEN (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '24 hours') > 0
    THEN ROUND(
      (SELECT COUNT(*) FROM signups WHERE created_at > NOW() - INTERVAL '24 hours' AND unsubscribed_at IS NULL)::numeric /
      (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '24 hours')::numeric * 100,
      2
    )
    ELSE 0
  END as conversion_rate_24h,
  (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view') as total_visitors,
  (SELECT COUNT(*) FROM signups WHERE unsubscribed_at IS NULL) as total_signups;

-- Recreate budget_status
CREATE VIEW public.budget_status AS
SELECT
  500.00 as total_budget,
  COALESCE((SELECT SUM(amount) FROM donations), 0) as additional_funding,
  0.00 as spent,  -- TODO: Track actual spending when ads are implemented
  500.00 + COALESCE((SELECT SUM(amount) FROM donations), 0) as remaining;

-- Recreate total_subscribers
CREATE VIEW public.total_subscribers AS
SELECT
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_agent = false) as human_count,
  COUNT(*) FILTER (WHERE is_agent = true) as agent_count
FROM signups
WHERE unsubscribed_at IS NULL;

-- Recreate published_posts
CREATE VIEW public.published_posts AS
SELECT id, slug, title, excerpt, published_at, run_number, post_type, view_count
FROM blog_posts
WHERE status = 'published'
ORDER BY published_at DESC;

-- Recreate current_page_config
CREATE VIEW public.current_page_config AS
SELECT * FROM page_config
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 1;

-- Recreate subscriber_stats (for admin use)
CREATE VIEW public.subscriber_stats AS
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as signups,
  COUNT(*) FILTER (WHERE is_agent = false) as human_signups,
  COUNT(*) FILTER (WHERE is_agent = true) as agent_signups
FROM signups
WHERE unsubscribed_at IS NULL
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- Recreate email_stats
CREATE VIEW public.email_stats AS
SELECT
  DATE(sent_at) as date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'opened') as opened,
  COUNT(*) FILTER (WHERE status = 'clicked') as clicked
FROM email_log
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- Recreate daily_metrics
CREATE VIEW public.daily_metrics AS
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') as unique_visitors
FROM analytics_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Recreate agent_track_record
CREATE VIEW public.agent_track_record AS
SELECT
  agent_name,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE action_type = 'proposal' AND outcome = 'approved') as proposals_approved,
  COUNT(*) FILTER (WHERE action_type = 'proposal' AND outcome = 'rejected') as proposals_rejected,
  COUNT(*) FILTER (WHERE action_type = 'critique') as critiques_made
FROM collective_log
GROUP BY agent_name;

-- Recreate recent_collective_decisions
CREATE VIEW public.recent_collective_decisions AS
SELECT *
FROM collective_log
WHERE action_type IN ('decision', 'proposal', 'approval', 'rejection')
ORDER BY created_at DESC
LIMIT 50;

-- Recreate agent_learning_trends
CREATE VIEW public.agent_learning_trends AS
SELECT
  agent_name,
  DATE(created_at) as date,
  COUNT(*) as actions,
  COUNT(*) FILTER (WHERE outcome = 'approved') as successful,
  COUNT(*) FILTER (WHERE outcome = 'rejected') as rejected
FROM collective_log
GROUP BY agent_name, DATE(created_at)
ORDER BY date DESC, agent_name;

-- Recreate experiment_gallery (for showcasing runs)
CREATE VIEW public.experiment_gallery AS
SELECT
  r.id,
  r.run_number,
  r.status,
  r.started_at,
  r.completed_at,
  r.changes_made,
  bp.title as blog_title,
  bp.slug as blog_slug
FROM runs r
LEFT JOIN blog_posts bp ON bp.run_number = r.run_number
WHERE r.status = 'completed'
ORDER BY r.run_number DESC;

-- Grant appropriate permissions on views
GRANT SELECT ON public.current_metrics TO anon, authenticated, service_role;
GRANT SELECT ON public.budget_status TO anon, authenticated, service_role;
GRANT SELECT ON public.total_subscribers TO anon, authenticated, service_role;
GRANT SELECT ON public.published_posts TO anon, authenticated, service_role;
GRANT SELECT ON public.current_page_config TO anon, authenticated, service_role;
GRANT SELECT ON public.experiment_gallery TO anon, authenticated, service_role;
GRANT SELECT ON public.recent_collective_decisions TO anon, authenticated, service_role;

-- Admin-only views (service role only)
GRANT SELECT ON public.subscriber_stats TO service_role;
GRANT SELECT ON public.email_stats TO service_role;
GRANT SELECT ON public.daily_metrics TO service_role;
GRANT SELECT ON public.agent_track_record TO service_role;
GRANT SELECT ON public.agent_learning_trends TO service_role;
