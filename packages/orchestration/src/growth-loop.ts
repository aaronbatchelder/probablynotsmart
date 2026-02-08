/**
 * Growth Loop
 *
 * Runs every 1-2 hours. Handles real-time engagement:
 * 1. Monitor social signals
 * 2. Russ finds opportunities and drafts engagements
 * 3. Gilfoyle checks tactics
 * 4. Erlich checks content safety
 * 5. Post approved engagements
 */

import { createClient } from '@supabase/supabase-js';
import { russ, RussOutput } from '../../agents/src/agents/russ';
import { gilfoyle } from '../../agents/src/agents/gilfoyle';
import { erlich } from '../../agents/src/agents/erlich';
import type { AgentContext } from '../../agents/src/base';
import { postEngagement as postToSocial } from '../../integrations/src/social';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface GrowthResult {
  success: boolean;
  engagementsApproved: number;
  engagementsBlocked: number;
  error?: string;
}

/**
 * Get current metrics from Supabase
 */
async function getCurrentMetrics() {
  const { data } = await supabase
    .from('current_metrics')
    .select('*')
    .single();

  return {
    visitors_24h: data?.visitors_24h || 0,
    unique_sessions_24h: data?.unique_sessions_24h || 0,
    signups_24h: data?.signups_24h || 0,
    conversion_rate_24h: data?.conversion_rate_24h || 0,
    visitors_total: data?.visitors_total || 0,
    signups_total: data?.signups_total || 0,
    conversion_rate_total: data?.conversion_rate_total || 0,
    avg_time_on_page: 0,
    scroll_depth_avg: 0,
    cta_clicks: 0,
    bounce_rate: 0,
  };
}

/**
 * Get config values from Supabase
 */
async function getConfig() {
  const { data } = await supabase
    .from('config')
    .select('key, value');

  const config: Record<string, unknown> = {};
  data?.forEach((row) => {
    config[row.key] = JSON.parse(row.value as string);
  });

  const budgetTotal = Number(config.budget_total) || 500;
  const budgetSpent = Number(config.budget_spent) || 0;

  return {
    budget_total: budgetTotal,
    budget_spent: budgetSpent,
    budget_remaining: budgetTotal - budgetSpent,
    budget_daily_cap: Number(config.budget_daily_cap) || 30,
    run_counter: Number(config.run_counter) || 0,
    experiment_started_at: config.experiment_started_at as string | null,
    experiment_status: config.experiment_status as string || 'not_started',
    site_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://probablynotsmart.com',
  };
}

/**
 * Get recent growth actions to avoid duplicate engagement
 */
async function getRecentActions(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('growth_actions')
    .select('target_url, target_author')
    .gte('created_at', since);

  return data || [];
}

/**
 * Save a growth action to the database
 */
async function saveGrowthAction(action: {
  action_type: string;
  platform: string;
  target_url?: string;
  target_author?: string;
  content?: string;
  gilfoyle_check?: unknown;
  erlich_check?: unknown;
  approved: boolean;
  external_id?: string;
  agent_name?: string;
  posted_url?: string;
}) {
  const { error } = await supabase.from('growth_actions').insert({
    ...action,
    agent_name: action.agent_name || 'Russ',
  });
  if (error) console.error('Failed to save growth action:', error);
}

/**
 * Mock function to fetch social signals
 * In production, this would use Twitter/LinkedIn/Threads APIs
 */
async function fetchSocialSignals(): Promise<Array<{
  platform: string;
  content: string;
  author: string;
  url: string;
}>> {
  // TODO: Implement actual social monitoring
  // For now, return empty array (Russ will generate hypothetical engagements)
  console.log('   📡 Social monitoring not yet implemented');
  return [];
}

/**
 * Post engagement to social platforms
 */
async function executePosting(engagement: {
  platform: string;
  content: string;
  target_url?: string;
  agent_name?: string;
  title?: string;
}): Promise<{ success: boolean; external_id?: string; posted_url?: string }> {
  const platform = engagement.platform.toLowerCase();

  // Only post to platforms we have connected
  const supportedPlatforms = ['x', 'moltbook'];

  if (!supportedPlatforms.includes(platform)) {
    console.log(`   ⏭️  [${engagement.agent_name || 'Russ'}] Skipping ${platform} (not connected): "${engagement.content.slice(0, 40)}..."`);
    return { success: false, external_id: undefined };
  }

  console.log(`   📤 [${engagement.agent_name || 'Russ'}] Posting to ${platform}: "${engagement.content.slice(0, 50)}..."`);

  try {
    const result = await postToSocial({
      platform: platform as 'x' | 'moltbook',
      type: 'post',
      content: engagement.content,
      title: engagement.title,
      targetUrl: engagement.target_url,
    });

    if (result.success) {
      console.log(`   ✅ Posted! ID: ${result.id}`);
      return { success: true, external_id: result.id, posted_url: result.url };
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    return { success: false };
  }
}

/**
 * Growth loop execution
 */
export async function runGrowthLoop(): Promise<GrowthResult> {
  console.log('\n📈 Starting Growth Loop\n');
  console.log('='.repeat(50));

  try {
    // Get current state
    const [metrics, config, recentActions] = await Promise.all([
      getCurrentMetrics(),
      getConfig(),
      getRecentActions(),
    ]);

    console.log(`   Subscribers: ${metrics.signups_total}`);
    console.log(`   Recent actions: ${recentActions.length}`);

    // Build minimal context for growth agents
    const context: AgentContext = {
      run: undefined,
      history: [],
      metrics,
      pageState: {
        headline: '',
        subheadline: '',
        cta_text: '',
        cta_color: '',
        body_copy: '',
      },
      config,
      previousOutputs: {},
    };

    // ========== STEP 1: FETCH SOCIAL SIGNALS ==========
    console.log('\n📡 Step 1: Fetching social signals...');
    const socialSignals = await fetchSocialSignals();
    context.previousOutputs!.social_signals = socialSignals;

    // ========== STEP 2: RUSS FINDS OPPORTUNITIES ==========
    console.log('\n🔥 Step 2: Russ finding opportunities...');
    const russResult = await russ(context);
    const russOutput: RussOutput = russResult.output;
    console.log(`   Found ${russOutput.opportunities_found.length} opportunities`);
    console.log(`   Drafted ${russOutput.engagements_drafted.length} engagements`);

    if (russOutput.engagements_drafted.length === 0) {
      console.log('\n✅ Growth Loop Complete - No engagements to process');
      return {
        success: true,
        engagementsApproved: 0,
        engagementsBlocked: 0,
      };
    }

    let approved = 0;
    let blocked = 0;

    // Process each drafted engagement
    for (const engagement of russOutput.engagements_drafted) {
      console.log(`\n   Processing: "${engagement.draft_content.slice(0, 40)}..."`);

      // ========== STEP 3: GILFOYLE TACTICS CHECK ==========
      // Use Gilfoyle to check if the engagement tactic is good
      context.previousOutputs!.gavin = {
        proposals: [{
          id: engagement.opportunity_id,
          description: `Engage on ${engagement.platform}`,
          changes: [],
          hypothesis: 'This engagement will drive awareness',
          expected_impact: 'Brand visibility',
          spend_required: 0,
          boldness_score: 5,
        }],
        reasoning: engagement.draft_content,
      };

      const gilfoyleResult = await gilfoyle(context);
      const tacticsApproved = gilfoyleResult.output.recommendation !== 'reject';

      // ========== STEP 4: ERLICH CONTENT CHECK ==========
      context.previousOutputs!.content_to_review = {
        type: 'social',
        content: {
          platform: engagement.platform,
          text: engagement.draft_content,
        },
      };

      const erlichResult = await erlich(context);
      const contentApproved = erlichResult.output.verdict === 'postable';

      const isApproved = tacticsApproved && contentApproved;

      // Determine action type based on engagement
      const opportunity = russOutput.opportunities_found.find(o =>
        o.url && engagement.opportunity_id?.includes(o.url.slice(-10))
      ) || russOutput.opportunities_found[0];

      const actionType = opportunity?.engagement_type === 'post' ? 'post' :
                        opportunity?.engagement_type === 'comment' ? 'comment' :
                        opportunity?.engagement_type || 'reply';

      // Save the action with agent name
      await saveGrowthAction({
        action_type: actionType,
        platform: engagement.platform,
        target_url: opportunity?.url,
        target_author: opportunity?.author,
        content: engagement.draft_content,
        gilfoyle_check: { approved: tacticsApproved, output: gilfoyleResult.output },
        erlich_check: erlichResult.output,
        approved: isApproved,
        agent_name: 'Russ',
      });

      if (isApproved) {
        // ========== STEP 5: POST ENGAGEMENT ==========
        const postResult = await executePosting({
          platform: engagement.platform,
          content: engagement.draft_content,
          agent_name: 'Russ',
        });

        if (postResult.success) {
          approved++;
          console.log(`   ✅ Approved and posted`);

          // Update the growth action with posted URL if available
          if (postResult.posted_url) {
            await supabase
              .from('growth_actions')
              .update({ posted_url: postResult.posted_url, external_id: postResult.external_id })
              .eq('content', engagement.draft_content)
              .eq('platform', engagement.platform)
              .order('created_at', { ascending: false })
              .limit(1);
          }
        }
      } else {
        blocked++;
        console.log(`   ❌ Blocked (tactics: ${tacticsApproved}, content: ${contentApproved})`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Growth Loop Complete!');
    console.log(`   Approved: ${approved}`);
    console.log(`   Blocked: ${blocked}`);
    console.log('='.repeat(50) + '\n');

    return {
      success: true,
      engagementsApproved: approved,
      engagementsBlocked: blocked,
    };
  } catch (error) {
    console.error('❌ Growth loop error:', error);
    return {
      success: false,
      engagementsApproved: 0,
      engagementsBlocked: 0,
      error: String(error),
    };
  }
}

export default runGrowthLoop;
