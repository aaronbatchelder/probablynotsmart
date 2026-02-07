-- ============================================
-- DESIGN SYSTEM: Freeform page configuration
-- ============================================
-- Gavin can propose ANY changes. The agents are the guardrails.

-- ============================================
-- PAGE CONFIG: Current page state (freeform)
-- ============================================
CREATE TABLE page_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version INTEGER NOT NULL,
    updated_by_run INTEGER,

    -- Freeform config as JSONB - no rigid schema
    -- Gavin can add/remove/modify any keys
    config JSONB NOT NULL DEFAULT '{}',

    -- CSS overrides (any valid CSS)
    css_overrides TEXT,

    -- Custom HTML sections (injected if present)
    custom_sections JSONB DEFAULT '[]',

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial config matching current hardcoded page
INSERT INTO page_config (version, config) VALUES (
    1,
    '{
        "meta": {
            "title": "probablynotsmart - An AI Marketing Experiment",
            "description": "We gave an AI $500 and no supervision. Follow along as it tries to optimize this landing page."
        },
        "hero": {
            "headline": "An AI is running this page.",
            "subheadline": "We gave it $500 and no supervision. Follow along as it figures things out.",
            "cta_text": "Follow the experiment",
            "cta_style": "primary",
            "layout": "centered",
            "show_subscriber_count": true
        },
        "stats": {
            "visible": true,
            "items": ["conversion_rate", "budget_remaining", "runs_completed", "subscribers"]
        },
        "how_it_works": {
            "visible": true,
            "headline": "How it works",
            "steps": [
                {"number": "01", "title": "Every 12 hours, the AI analyzes", "description": "10 AI agents debate what changes to make"},
                {"number": "02", "title": "It makes changes (or doesn''t)", "description": "Changes are deployed automatically if approved"},
                {"number": "03", "title": "You watch it learn", "description": "Every decision is documented publicly"}
            ]
        },
        "activity": {
            "visible": true,
            "headline": "Latest",
            "show_screenshot": true
        },
        "budget": {
            "visible": true,
            "show_donate": true,
            "donate_text": "Keep the AI alive"
        },
        "final_cta": {
            "visible": true,
            "headline": "Probably not smart. Definitely interesting.",
            "subheadline": "Join the experiment.",
            "cta_text": "Follow along",
            "background": "dark"
        },
        "footer": {
            "visible": true
        },
        "theme": {
            "colors": {
                "background": "#FEFDFB",
                "background_secondary": "#F7F5F2",
                "text_primary": "#1A1A1A",
                "text_secondary": "#6B6B6B",
                "accent": "#FF5C35",
                "accent_secondary": "#7C3AED"
            },
            "fonts": {
                "heading": "system-ui",
                "body": "system-ui"
            },
            "layout": "default"
        },
        "section_order": ["hero", "stats", "how_it_works", "activity", "budget", "final_cta", "footer"]
    }'
);

CREATE INDEX idx_page_config_version ON page_config(version);
CREATE INDEX idx_page_config_active ON page_config(is_active);

-- ============================================
-- VISUAL CHANGELOG: Track all experiments
-- ============================================
CREATE TABLE visual_changelog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES runs(id),
    run_number INTEGER NOT NULL,

    -- What changed (freeform description)
    change_summary TEXT NOT NULL,
    change_details JSONB NOT NULL DEFAULT '{}',

    -- Before state
    config_before JSONB,

    -- After state
    config_after JSONB,

    -- Screenshots at multiple breakpoints (URLs to Supabase Storage)
    screenshots_before JSONB DEFAULT '{
        "desktop": null,
        "tablet": null,
        "mobile": null
    }',
    screenshots_after JSONB DEFAULT '{
        "desktop": null,
        "tablet": null,
        "mobile": null
    }',

    -- Metrics tracking
    conversion_before DECIMAL(5,2),
    conversion_after DECIMAL(5,2),  -- Updated 24h after change

    -- Agent reasoning
    gavin_reasoning TEXT,
    gilfoyle_critique TEXT,
    laurie_decision TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_changelog_run ON visual_changelog(run_number);
CREATE INDEX idx_changelog_created ON visual_changelog(created_at);

-- ============================================
-- View: Latest active config
-- ============================================
CREATE OR REPLACE VIEW current_page_config AS
SELECT *
FROM page_config
WHERE is_active = true
ORDER BY version DESC
LIMIT 1;

-- ============================================
-- View: Experiment history for gallery
-- ============================================
CREATE OR REPLACE VIEW experiment_gallery AS
SELECT
    vc.run_number,
    vc.change_summary,
    vc.change_details,
    vc.screenshots_before,
    vc.screenshots_after,
    vc.conversion_before,
    vc.conversion_after,
    CASE
        WHEN vc.conversion_before IS NOT NULL AND vc.conversion_after IS NOT NULL
        THEN (vc.conversion_after - vc.conversion_before)
        ELSE NULL
    END as conversion_change_pct,
    vc.gavin_reasoning,
    vc.gilfoyle_critique,
    vc.laurie_decision,
    vc.created_at
FROM visual_changelog vc
ORDER BY vc.run_number DESC;
