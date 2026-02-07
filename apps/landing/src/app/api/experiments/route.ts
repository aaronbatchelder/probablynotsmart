import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 60 seconds

/**
 * Experiments API
 *
 * Returns the visual changelog for the experiment gallery.
 * Shows every change Gavin proposed, what the agents thought, and the results.
 */
export async function GET() {
  try {
    // Get all experiments from visual changelog
    const { data: experiments, error } = await supabaseAdmin
      .from('visual_changelog')
      .select('*')
      .order('run_number', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch experiments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform for the gallery
    const gallery = experiments.map((exp) => ({
      run_number: exp.run_number,
      summary: exp.change_summary,
      details: exp.change_details,

      // Screenshots for comparison
      screenshots: {
        before: exp.screenshots_before,
        after: exp.screenshots_after,
      },

      // Metrics
      metrics: {
        conversion_before: exp.conversion_before,
        conversion_after: exp.conversion_after,
        change_pct:
          exp.conversion_before != null && exp.conversion_after != null
            ? exp.conversion_after - exp.conversion_before
            : null,
      },

      // Agent reasoning
      agents: {
        gavin: exp.gavin_reasoning,
        gilfoyle: exp.gilfoyle_critique,
        laurie: exp.laurie_decision,
      },

      // Config diff
      config: {
        before: exp.config_before,
        after: exp.config_after,
      },

      created_at: exp.created_at,
    }));

    return NextResponse.json({
      experiments: gallery,
      count: gallery.length,
    });
  } catch (error) {
    console.error('Experiments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}
