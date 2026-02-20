'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialize client-side Supabase to ensure env vars are available
let supabaseClient: SupabaseClient | null = null;

function getClientSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('Analytics: Missing Supabase env vars', { url: !!url, key: !!key });
      return null;
    }

    supabaseClient = createClient(url, key);
  }

  return supabaseClient;
}

// Generate a simple visitor ID (persisted in localStorage)
function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem('pns_visitor_id');
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('pns_visitor_id', visitorId);
  }
  return visitorId;
}

// Generate a session ID (persisted in sessionStorage)
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('pns_session_id');
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('pns_session_id', sessionId);
  }
  return sessionId;
}

export interface TrackEventParams {
  event_type: string;
  event_data?: Record<string, unknown>;
}

export async function trackEvent({ event_type, event_data = {} }: TrackEventParams) {
  try {
    const supabase = getClientSupabase();
    if (!supabase) {
      console.warn('Analytics: Supabase client not available');
      return;
    }

    const { error } = await supabase.from('analytics_events').insert({
      event_type,
      event_data,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      page_url: typeof window !== 'undefined' ? window.location.href : null,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });

    if (error) {
      console.error('Analytics error:', error);
    }
  } catch (err) {
    console.error('Failed to track event:', err);
  }
}

// Track page view
export function trackPageView() {
  trackEvent({ event_type: 'page_view' });
}

// Track scroll depth
export function trackScrollDepth(depth: number) {
  trackEvent({
    event_type: 'scroll_depth',
    event_data: { depth },
  });
}

// Track CTA click
export function trackCtaClick(cta_id: string) {
  trackEvent({
    event_type: 'cta_click',
    event_data: { cta_id },
  });
}

// Track time on page (call when leaving)
export function trackTimeOnPage(seconds: number) {
  trackEvent({
    event_type: 'time_on_page',
    event_data: { seconds },
  });
}
