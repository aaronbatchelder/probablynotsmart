'use client';

import { useEffect, useRef } from 'react';
import { trackPageView, trackScrollDepth, trackTimeOnPage } from '@/lib/analytics';

export default function AnalyticsTracker() {
  const startTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);

  useEffect(() => {
    // Track page view on mount
    trackPageView();

    // Track scroll depth
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const depth = Math.round((scrolled / scrollHeight) * 100);

      if (depth > maxScrollDepth.current) {
        maxScrollDepth.current = depth;

        // Track at 25%, 50%, 75%, 100% milestones
        if ([25, 50, 75, 100].includes(depth)) {
          trackScrollDepth(depth);
        }
      }
    };

    // Track time on page when leaving
    const handleBeforeUnload = () => {
      const seconds = Math.round((Date.now() - startTime.current) / 1000);
      trackTimeOnPage(seconds);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
}
