-- Migration: Fix published_posts view to include content column
-- The view was missing content and content_html columns needed for blog display
-- (These were accidentally omitted when recreating views in 012_enable_rls.sql)

DROP VIEW IF EXISTS public.published_posts;

CREATE VIEW public.published_posts AS
SELECT
  id,
  slug,
  title,
  excerpt,
  content,
  content_html,
  published_at,
  run_number,
  post_type,
  view_count,
  meta_title,
  meta_description,
  og_image_url
FROM blog_posts
WHERE status = 'published'
ORDER BY published_at DESC;

GRANT SELECT ON public.published_posts TO anon, authenticated, service_role;
