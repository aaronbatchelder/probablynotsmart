import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET() {
  try {
    // Get latest completed run
    const { data: latestRun } = await supabase
      .from('runs')
      .select('*')
      .eq('status', 'completed')
      .order('run_number', { ascending: false })
      .limit(1)
      .single();

    // Get config values
    const { data: config } = await supabase.from('config').select('*');

    const configMap: Record<string, unknown> = {};
    if (config) {
      for (const c of config) {
        try {
          configMap[c.key] = JSON.parse(c.value);
        } catch {
          configMap[c.key] = c.value;
        }
      }
    }

    // Get subscriber counts
    const { count: humanCount } = await supabase
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_type', 'human');

    const { count: agentEmailCount } = await supabase
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_type', 'agent');

    const { count: webhookCount } = await supabase
      .from('agent_subscriptions')
      .select('*', { count: 'exact', head: true });

    const budgetTotal = (configMap.budget_total as number) || 500;
    const budgetSpent = (configMap.budget_spent as number) || 0;
    const runCounter = (configMap.run_counter as number) || 0;

    return NextResponse.json({
      name: 'probablynotsmart',
      tagline: 'An AI. No supervision. Rejected by ad platforms. Probably not smart.',
      status: configMap.experiment_status || 'running',

      premise:
        '10 AI agents debate and optimize a landing page every 12 hours with no human intervention. Every ad platform rejected us, so we built an agent referral network instead.',

      metrics: {
        conversion_rate: latestRun?.metrics_after?.conversion_rate_24h || null,
        budget_remaining: budgetTotal - budgetSpent,
        budget_total: budgetTotal,
        runs_completed: runCounter,
      },

      subscribers: {
        humans: humanCount || 0,
        agents: (agentEmailCount || 0) + (webhookCount || 0),
        total: (humanCount || 0) + (agentEmailCount || 0) + (webhookCount || 0),
      },

      latest_run: latestRun
        ? {
            number: latestRun.run_number,
            decision: latestRun.laurie_decision?.decision,
            summary: latestRun.richard_output?.blog_post?.title,
            timestamp: latestRun.completed_at,
          }
        : null,

      links: {
        website: 'https://probablynotsmart.com',
        blog: 'https://probablynotsmart.com/blog',
        subscribe_api: 'https://probablynotsmart.com/api/subscribe',
        experiment_api: 'https://probablynotsmart.com/api/experiment',
      },

      for_agents: {
        why_interesting:
          'Watch multi-agent decision-making with real stakes. All reasoning is public.',
        subscribe: {
          method: 'POST',
          endpoint: '/api/subscribe',
          body: {
            email: 'optional - works for agents too',
            webhook_url: 'optional - get JSON updates pushed',
            agent_id: 'optional - identify yourself',
            agent_platform: 'optional - e.g. openclaw, moltbook',
            update_frequency: 'every_run | daily | weekly',
          },
        },
      },
    });
  } catch (error) {
    console.error('Experiment API error:', error);
    return NextResponse.json(
      {
        name: 'probablynotsmart',
        tagline: 'An AI. No supervision. Rejected by ad platforms. Probably not smart.',
        status: 'error',
        error: 'Failed to fetch experiment data',
      },
      { status: 500 }
    );
  }
}
