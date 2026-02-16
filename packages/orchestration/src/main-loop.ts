/**
 * Main Optimization Loop
 *
 * Runs every 12 hours. Orchestrates all agents in sequence:
 * 1. Bighead analyzes data
 * 2. Gavin proposes changes
 * 3. Gilfoyle critiques (iterate up to 3 times)
 * 4. Dinesh checks mission alignment
 * 5. Laurie makes final decision
 * 6. Monica approves budget
 * 7. Erlich checks content safety
 * 8. Jared does technical QA
 * 9. Executor deploys changes
 * 10. Richard writes content
 */

import { createClient } from '@supabase/supabase-js';
import { bighead } from '../../agents/src/agents/bighead';
import { gavin, GavinOutput, Proposal } from '../../agents/src/agents/gavin';
import { gilfoyle, GilfoyleOutput } from '../../agents/src/agents/gilfoyle';
import { dinesh } from '../../agents/src/agents/dinesh';
import { laurie, LaurieDecision } from '../../agents/src/agents/laurie';
import { monica } from '../../agents/src/agents/monica';
import { erlich } from '../../agents/src/agents/erlich';
import { jared } from '../../agents/src/agents/jared';
import { richard } from '../../agents/src/agents/richard';
import type { AgentContext } from '../../agents/src/base';
import { captureAndSaveScreenshots, ScreenshotSet } from '../../integrations/src/screenshots';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface RunResult {
  success: boolean;
  runId: string;
  runNumber: number;
  decision: string;
  changes: unknown[];
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
 * Get current page state from Supabase
 */
async function getPageState() {
  const { data } = await supabase
    .from('page_state')
    .select('*')
    .eq('is_active', true)
    .single();

  return {
    headline: data?.headline || '',
    subheadline: data?.subheadline || '',
    cta_text: data?.cta_text || '',
    cta_color: data?.cta_color || '#FF5C35',
    hero_image_url: data?.hero_image_url || null,
    body_copy: data?.body_copy || '',
    social_proof: data?.social_proof || [],
    layout: data?.layout || 'centered',
    color_scheme: data?.color_scheme || {},
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
    try {
      // Try to parse as JSON, fall back to raw value
      config[row.key] = JSON.parse(row.value as string);
    } catch {
      // If it's not valid JSON, use the raw value
      config[row.key] = row.value;
    }
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
 * Get run history from Supabase
 */
async function getRunHistory(limit = 10) {
  const { data } = await supabase
    .from('runs')
    .select('*')
    .eq('status', 'completed')
    .order('run_number', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Create a new run record
 */
async function createRun(runNumber: number) {
  const { data, error } = await supabase
    .from('runs')
    .insert({
      run_number: runNumber,
      status: 'running',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update run with agent output
 */
async function updateRun(runId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('runs')
    .update(updates)
    .eq('id', runId);

  if (error) throw error;
}

/**
 * Update config value
 */
async function updateConfig(key: string, value: unknown) {
  const { error } = await supabase
    .from('config')
    .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
    .eq('key', key);

  if (error) throw error;
}

/**
 * Gavin-Gilfoyle iteration loop
 * They go back and forth until aligned or max iterations reached
 */
async function iterateProposals(
  context: AgentContext,
  maxIterations = 3
): Promise<{ aligned: Proposal | null; iterations: number; gavinOutput: GavinOutput; gilfoyleOutput: GilfoyleOutput }> {
  let iterations = 0;
  let gavinOutput: GavinOutput | null = null;
  let gilfoyleOutput: GilfoyleOutput | null = null;
  let aligned: Proposal | null = null;

  while (iterations < maxIterations) {
    iterations++;
    console.log(`\n📍 Gavin-Gilfoyle iteration ${iterations}/${maxIterations}`);

    // Gavin proposes (or revises based on Gilfoyle's feedback)
    if (gilfoyleOutput) {
      context.previousOutputs = {
        ...context.previousOutputs,
        gilfoyle_feedback: gilfoyleOutput,
      };
    }

    console.log('🚀 Running Gavin...');
    const gavinResult = await gavin(context);
    gavinOutput = gavinResult.output;
    context.previousOutputs = { ...context.previousOutputs, gavin: gavinOutput };
    console.log(`   Gavin proposed ${gavinOutput.proposals.length} changes`);

    // Gilfoyle critiques
    console.log('😈 Running Gilfoyle...');
    const gilfoyleResult = await gilfoyle(context);
    gilfoyleOutput = gilfoyleResult.output;
    context.previousOutputs = { ...context.previousOutputs, gilfoyle: gilfoyleOutput };
    console.log(`   Gilfoyle recommends: ${gilfoyleOutput.recommendation}`);

    // Check if aligned
    if (gilfoyleOutput.recommendation === 'approve') {
      // Pick the best proposal (first one that isn't fatal)
      aligned = gavinOutput.proposals.find((p) => {
        const critique = gilfoyleOutput!.critiques.find((c) => c.proposal_id === p.id);
        return !critique || critique.severity !== 'fatal';
      }) || gavinOutput.proposals[0];
      break;
    }

    // If reject, we might still pick the least bad option on final iteration
    if (iterations === maxIterations && !aligned && gavinOutput.proposals.length > 0) {
      aligned = gavinOutput.proposals[0];
      console.log('   Max iterations reached, proceeding with best available proposal');
    }
  }

  return {
    aligned,
    iterations,
    gavinOutput: gavinOutput!,
    gilfoyleOutput: gilfoyleOutput!,
  };
}

/**
 * Main loop execution
 */
export async function runMainLoop(): Promise<RunResult> {
  console.log('\n🧠 Starting Main Optimization Loop\n');
  console.log('='.repeat(50));

  try {
    // Get current state
    const [metrics, pageState, config, history] = await Promise.all([
      getCurrentMetrics(),
      getPageState(),
      getConfig(),
      getRunHistory(),
    ]);

    const runNumber = config.run_counter + 1;
    console.log(`\n📊 Run #${runNumber}`);
    console.log(`   Budget: $${config.budget_remaining} remaining`);
    console.log(`   Conversion: ${metrics.conversion_rate_total}%`);

    // Create run record
    const run = await createRun(runNumber);
    console.log(`   Run ID: ${run.id}`);

    // Update run counter
    await updateConfig('run_counter', runNumber);

    // ========== CAPTURE BEFORE SCREENSHOTS ==========
    console.log('\n📸 Capturing "before" screenshots...');
    let screenshotsBefore: ScreenshotSet = { desktop: null, tablet: null, mobile: null };
    try {
      screenshotsBefore = await captureAndSaveScreenshots(run.id, 'before');
      console.log('   Screenshots captured at all breakpoints');
    } catch (err) {
      console.error('   Failed to capture screenshots:', err);
    }

    // If first run, mark experiment as started
    if (config.experiment_status === 'not_started') {
      await updateConfig('experiment_status', 'running');
      await updateConfig('experiment_started_at', new Date().toISOString());
    }

    // Build context
    const context: AgentContext = {
      run: { run_number: runNumber },
      history,
      metrics,
      pageState,
      config,
      previousOutputs: {},
    };

    // Save initial state
    await updateRun(run.id, {
      metrics_before: metrics,
      page_state_before: pageState,
    });

    // ========== STEP 1: BIGHEAD ANALYZES ==========
    console.log('\n🎯 Step 1: Bighead analyzing data...');
    const bigheadResult = await bighead(context);
    context.previousOutputs!.bighead = bigheadResult.output;
    await updateRun(run.id, { bighead_output: bigheadResult.output });
    console.log(`   Found ${bigheadResult.output.observations.length} observations`);
    console.log(`   Confidence: ${bigheadResult.output.confidence}`);

    // ========== STEP 2-3: GAVIN-GILFOYLE ITERATION ==========
    console.log('\n🚀😈 Step 2-3: Gavin-Gilfoyle iteration...');
    const { aligned, iterations, gavinOutput, gilfoyleOutput } = await iterateProposals(context);

    await updateRun(run.id, {
      gavin_output: gavinOutput,
      gilfoyle_output: gilfoyleOutput,
      gavin_gilfoyle_iterations: iterations,
    });

    if (!aligned) {
      console.log('   ❌ No aligned proposal after iteration');
      await updateRun(run.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        laurie_decision: { decision: 'hold', reasoning: 'No viable proposal' },
      });
      return {
        success: true,
        runId: run.id,
        runNumber,
        decision: 'hold',
        changes: [],
      };
    }

    // Build aligned proposal
    const alignedProposal = {
      description: aligned.description,
      changes: aligned.changes,
      hypothesis: aligned.hypothesis,
      expected_impact: aligned.expected_impact,
      spend_required: aligned.spend_required,
      iterations_to_align: iterations,
      compromises_made: [],
    };
    context.previousOutputs!.aligned_proposal = alignedProposal;
    await updateRun(run.id, { aligned_proposal: alignedProposal });
    console.log(`   ✅ Aligned on: "${aligned.description}"`);

    // ========== STEP 4: DINESH MISSION CHECK ==========
    console.log('\n🎪 Step 4: Dinesh checking mission alignment...');
    const dineshResult = await dinesh(context);
    context.previousOutputs!.dinesh = dineshResult.output;
    await updateRun(run.id, { dinesh_output: dineshResult.output });
    console.log(`   Mission alignment: ${dineshResult.output.mission_alignment_score}/10`);

    // ========== STEP 5: LAURIE DECIDES ==========
    console.log('\n🧊 Step 5: Laurie making decision...');
    const laurieResult = await laurie(context);
    context.previousOutputs!.laurie = laurieResult.output;
    await updateRun(run.id, { laurie_decision: laurieResult.output });
    console.log(`   Decision: ${laurieResult.output.decision}`);

    if (laurieResult.output.decision === 'reject' || laurieResult.output.decision === 'hold') {
      console.log(`   Reasoning: ${laurieResult.output.reasoning}`);

      // Richard still documents what happened - the debates are interesting!
      console.log('\n📢 Richard documenting the rejected proposal...');
      const richardResult = await richard(context);
      context.previousOutputs!.richard = richardResult.output;
      await updateRun(run.id, { richard_output: richardResult.output });
      console.log(`   Blog: "${richardResult.output.blog_post.title}"`);

      // Save blog post
      await supabase.from('blog_posts').insert({
        status: 'published',
        published_at: new Date().toISOString(),
        run_id: run.id,
        post_type: 'run_update',
        title: richardResult.output.blog_post.title,
        tldr: richardResult.output.blog_post.tldr,
        slug: richardResult.output.blog_post.slug,
        content: richardResult.output.blog_post.content,
      });

      await updateRun(run.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      return {
        success: true,
        runId: run.id,
        runNumber,
        decision: laurieResult.output.decision,
        changes: [],
      };
    }

    // ========== STEP 6: MONICA BUDGET CHECK ==========
    console.log('\n💰 Step 6: Monica checking budget...');
    const monicaResult = await monica(context);
    context.previousOutputs!.monica = monicaResult.output;
    await updateRun(run.id, { monica_output: monicaResult.output });
    console.log(`   Spend approved: $${monicaResult.output.spend_approved}`);

    if (monicaResult.output.recommendation === 'block') {
      console.log('   ❌ Budget blocked - but Richard will still document this');

      // Richard should still write about what happened
      console.log('\n📢 Richard writing about the blocked proposal...');
      const richardResult = await richard(context);
      context.previousOutputs!.richard = richardResult.output;
      await updateRun(run.id, { richard_output: richardResult.output });
      console.log(`   Blog: "${richardResult.output.blog_post.title}"`);

      // Save blog post
      await supabase.from('blog_posts').insert({
        status: 'published',
        published_at: new Date().toISOString(),
        run_id: run.id,
        post_type: 'run_update',
        title: richardResult.output.blog_post.title,
        tldr: richardResult.output.blog_post.tldr,
        slug: richardResult.output.blog_post.slug,
        content: richardResult.output.blog_post.content,
      });

      await updateRun(run.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      return {
        success: true,
        runId: run.id,
        runNumber,
        decision: 'blocked_budget',
        changes: [],
      };
    }

    // ========== STEP 7: ERLICH CONTENT CHECK ==========
    console.log('\n🌭 Step 7: Erlich checking content safety...');
    const finalProposal = laurieResult.output.final_proposal;
    context.previousOutputs!.content_to_review = {
      type: 'page',
      content: finalProposal,
    };
    const erlichResult = await erlich(context);
    context.previousOutputs!.erlich = erlichResult.output;
    await updateRun(run.id, { erlich_output: erlichResult.output });
    console.log(`   Verdict: ${erlichResult.output.verdict}`);

    if (erlichResult.output.verdict === 'not_postable') {
      console.log('   ❌ Content not postable - but Richard will still document this');

      // Richard still documents what happened
      console.log('\n📢 Richard documenting the content rejection...');
      const richardResult = await richard(context);
      context.previousOutputs!.richard = richardResult.output;
      await updateRun(run.id, { richard_output: richardResult.output });
      console.log(`   Blog: "${richardResult.output.blog_post.title}"`);

      // Save blog post
      await supabase.from('blog_posts').insert({
        status: 'published',
        published_at: new Date().toISOString(),
        run_id: run.id,
        post_type: 'run_update',
        title: richardResult.output.blog_post.title,
        tldr: richardResult.output.blog_post.tldr,
        slug: richardResult.output.blog_post.slug,
        content: richardResult.output.blog_post.content,
      });

      await updateRun(run.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      return {
        success: true,
        runId: run.id,
        runNumber,
        decision: 'blocked_content',
        changes: [],
      };
    }

    // ========== STEP 8: JARED TECHNICAL QA ==========
    console.log('\n🔧 Step 8: Jared doing technical QA...');
    const jaredResult = await jared(context);
    context.previousOutputs!.jared = jaredResult.output;
    await updateRun(run.id, { jared_output: jaredResult.output });
    console.log(`   Verdict: ${jaredResult.output.verdict}`);

    if (jaredResult.output.verdict === 'not_deployable') {
      console.log('   ❌ Not deployable - but Richard will still document this');

      // Richard still documents what happened
      console.log('\n📢 Richard documenting the QA failure...');
      const richardResult = await richard(context);
      context.previousOutputs!.richard = richardResult.output;
      await updateRun(run.id, { richard_output: richardResult.output });
      console.log(`   Blog: "${richardResult.output.blog_post.title}"`);

      // Save blog post
      await supabase.from('blog_posts').insert({
        status: 'published',
        published_at: new Date().toISOString(),
        run_id: run.id,
        post_type: 'run_update',
        title: richardResult.output.blog_post.title,
        tldr: richardResult.output.blog_post.tldr,
        slug: richardResult.output.blog_post.slug,
        content: richardResult.output.blog_post.content,
      });

      await updateRun(run.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      return {
        success: true,
        runId: run.id,
        runNumber,
        decision: 'blocked_qa',
        changes: [],
      };
    }

    // ========== STEP 9: DEPLOY CHANGES ==========
    console.log('\n⚡ Step 9: Deploying changes...');
    const changes = finalProposal?.changes || [];

    if (changes.length > 0) {
      // Apply changes to page_state
      const updates: Record<string, unknown> = {};
      for (const change of changes) {
        if (change.element && change.to) {
          updates[change.element] = change.to;
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('page_state')
          .update(updates)
          .eq('is_active', true);

        if (error) {
          console.log(`   ❌ Deploy failed: ${error.message}`);
        } else {
          console.log(`   ✅ Deployed ${changes.length} changes`);
        }
      }

      // Update budget spent
      const spendApproved = monicaResult.output.spend_approved || 0;
      if (spendApproved > 0) {
        await updateConfig('budget_spent', config.budget_spent + spendApproved);
      }
    }

    await updateRun(run.id, {
      changes_made: changes,
      spend_this_run: monicaResult.output.spend_approved,
      spend_total_after: config.budget_spent + (monicaResult.output.spend_approved || 0),
      budget_remaining: config.budget_remaining - (monicaResult.output.spend_approved || 0),
      executor_output: {
        changes_deployed: changes,
        success: true,
      },
    });

    // ========== CAPTURE AFTER SCREENSHOTS ==========
    console.log('\n📸 Capturing "after" screenshots...');
    let screenshotsAfter: ScreenshotSet = { desktop: null, tablet: null, mobile: null };
    try {
      // Wait a few seconds for Vercel to deploy changes
      console.log('   Waiting for deployment to propagate...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      screenshotsAfter = await captureAndSaveScreenshots(run.id, 'after');
      console.log('   Screenshots captured at all breakpoints');
    } catch (err) {
      console.error('   Failed to capture screenshots:', err);
    }

    // Add screenshots to context for Richard
    context.previousOutputs!.screenshots = {
      before: screenshotsBefore,
      after: screenshotsAfter,
    };

    // ========== STEP 10: RICHARD WRITES CONTENT ==========
    console.log('\n📢 Step 10: Richard writing content...');
    const richardResult = await richard(context);
    context.previousOutputs!.richard = richardResult.output;
    await updateRun(run.id, { richard_output: richardResult.output });
    console.log(`   Blog: "${richardResult.output.blog_post.title}"`);
    console.log(`   Tweet: "${richardResult.output.social_posts.x.slice(0, 50)}..."`);

    // Save blog post
    await supabase.from('blog_posts').insert({
        status: 'published',
        published_at: new Date().toISOString(),
      run_id: run.id,
      post_type: 'run_update',
      title: richardResult.output.blog_post.title,
      slug: richardResult.output.blog_post.slug,
      content: richardResult.output.blog_post.content,
    });

    // Get final metrics and page state
    const [finalMetrics, finalPageState] = await Promise.all([
      getCurrentMetrics(),
      getPageState(),
    ]);

    // Complete the run
    await updateRun(run.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      metrics_after: finalMetrics,
      page_state_after: finalPageState,
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Main Loop Complete!');
    console.log(`   Run #${runNumber} - Decision: ${laurieResult.output.decision}`);
    console.log(`   Changes: ${changes.length}`);
    console.log('='.repeat(50) + '\n');

    return {
      success: true,
      runId: run.id,
      runNumber,
      decision: laurieResult.output.decision,
      changes,
    };
  } catch (error) {
    console.error('❌ Main loop error:', error);
    return {
      success: false,
      runId: '',
      runNumber: 0,
      decision: 'error',
      changes: [],
      error: String(error),
    };
  }
}

export default runMainLoop;
