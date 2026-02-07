import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const revalidate = 30; // Cache for 30 seconds

/**
 * Page Config API
 *
 * Returns the current active page configuration.
 * The landing page reads from this to render dynamically.
 */
export async function GET() {
  try {
    // Get current active config
    const { data: config, error } = await supabaseAdmin
      .from('page_config')
      .select('*')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no config exists, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          version: 0,
          config: getDefaultConfig(),
          css_overrides: null,
          custom_sections: [],
        });
      }

      console.error('Failed to fetch page config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      version: config.version,
      updated_by_run: config.updated_by_run,
      config: config.config,
      css_overrides: config.css_overrides,
      custom_sections: config.custom_sections || [],
      updated_at: config.updated_at,
    });
  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

function getDefaultConfig() {
  return {
    meta: {
      title: 'probably not smart - An AI Marketing Experiment',
      description: 'I gave an AI $500 and no supervision. Follow along as it tries to optimize this landing page.',
    },
    hero: {
      headline: 'An AI is running this page.',
      subheadline: 'I gave it $500 and no supervision. Follow along as it figures things out.',
      cta_text: 'Follow the experiment',
      cta_style: 'primary',
      layout: 'centered',
      show_subscriber_count: true,
    },
    stats: {
      visible: true,
      items: ['conversion_rate', 'budget_remaining', 'runs_completed', 'subscribers'],
    },
    how_it_works: {
      visible: true,
      headline: 'How it works',
      steps: [
        { number: '01', title: 'Every 12 hours, the AI analyzes', description: '10 AI agents debate what changes to make' },
        { number: '02', title: 'It makes changes (or doesn\'t)', description: 'Changes are deployed automatically if approved' },
        { number: '03', title: 'You watch it learn', description: 'Every decision is documented publicly' },
      ],
    },
    activity: {
      visible: true,
      headline: 'Latest',
      show_screenshot: true,
    },
    budget: {
      visible: true,
      show_donate: true,
      donate_text: 'Keep the AI alive',
    },
    final_cta: {
      visible: true,
      headline: 'Probably not smart. Definitely interesting.',
      subheadline: 'Join the experiment.',
      cta_text: 'Follow along',
      background: 'dark',
    },
    footer: {
      visible: true,
    },
    theme: {
      colors: {
        background: '#FEFDFB',
        background_secondary: '#F7F5F2',
        text_primary: '#1A1A1A',
        text_secondary: '#6B6B6B',
        accent: '#FF5C35',
        accent_secondary: '#7C3AED',
      },
      fonts: {
        heading: 'system-ui',
        body: 'system-ui',
      },
      layout: 'default',
    },
    section_order: ['hero', 'stats', 'how_it_works', 'activity', 'budget', 'final_cta', 'footer'],
  };
}
