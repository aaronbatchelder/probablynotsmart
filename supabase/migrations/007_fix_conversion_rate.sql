-- ============================================
-- Fix conversion rate calculation
-- Use unique visitors (visitor_id) instead of sessions
-- Conversion = signups / unique visitors * 100
-- ============================================

DROP VIEW IF EXISTS current_metrics;

CREATE VIEW current_metrics AS
SELECT
    COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '24 hours') as visitors_24h,
    COUNT(DISTINCT visitor_id) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as unique_visitors_24h,
    COUNT(DISTINCT session_id) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as unique_sessions_24h,
    (SELECT COUNT(*) FROM signups WHERE created_at > NOW() - INTERVAL '24 hours') as signups_24h,
    ROUND(
        (SELECT COUNT(*) FROM signups WHERE created_at > NOW() - INTERVAL '24 hours')::DECIMAL /
        NULLIF(COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '24 hours'), 0) * 100,
        2
    ) as conversion_rate_24h,
    COUNT(*) FILTER (WHERE event_type = 'page_view') as visitors_total,
    COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view') as unique_visitors_total,
    (SELECT COUNT(*) FROM signups) as signups_total,
    ROUND(
        (SELECT COUNT(*) FROM signups)::DECIMAL /
        NULLIF(COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view'), 0) * 100,
        2
    ) as conversion_rate_total
FROM analytics_events;

DROP VIEW IF EXISTS daily_metrics;

CREATE VIEW daily_metrics AS
SELECT
    ae.date,
    ae.page_views,
    ae.unique_visitors,
    COALESCE(s.signups, 0) as signups,
    ae.unique_sessions,
    ROUND(
        COALESCE(s.signups, 0)::DECIMAL /
        NULLIF(ae.unique_visitors, 0) * 100,
        2
    ) as conversion_rate
FROM (
    SELECT
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
        COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view') as unique_visitors,
        COUNT(DISTINCT session_id) as unique_sessions
    FROM analytics_events
    GROUP BY DATE(created_at)
) ae
LEFT JOIN (
    SELECT DATE(created_at) as date, COUNT(*) as signups
    FROM signups
    GROUP BY DATE(created_at)
) s ON ae.date = s.date
ORDER BY ae.date DESC;
