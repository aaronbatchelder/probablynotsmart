-- Fix analytics tracking: allow anonymous users to insert events
-- The client-side AnalyticsTracker uses the anon key, but RLS was blocking it

CREATE POLICY "Anon can insert analytics events" ON public.analytics_events
  FOR INSERT TO anon
  WITH CHECK (true);
