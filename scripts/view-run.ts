/**
 * View full agent outputs for a run
 * Usage: npm run view-run [run_number]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function viewRun(runNumber?: number) {
  // Get the run
  let query = supabase
    .from('runs')
    .select('*')
    .order('run_number', { ascending: false });

  if (runNumber) {
    query = query.eq('run_number', runNumber);
  }

  const { data: runs, error } = await query.limit(1).single();

  if (error || !runs) {
    console.error('Failed to fetch run:', error);
    return;
  }

  const run = runs;

  console.log('\n' + '='.repeat(80));
  console.log(`RUN #${run.run_number}`);
  console.log('='.repeat(80));
  console.log(`Status: ${run.status}`);
  console.log(`Started: ${run.started_at}`);
  console.log(`Completed: ${run.completed_at || 'In progress'}`);
  console.log(`Budget remaining: $${run.budget_remaining}`);

  // Bighead
  console.log('\n' + '-'.repeat(80));
  console.log('🎯 BIGHEAD (Analyst)');
  console.log('-'.repeat(80));
  if (run.bighead_output) {
    console.log(JSON.stringify(run.bighead_output, null, 2));
  } else {
    console.log('No output');
  }

  // Gavin
  console.log('\n' + '-'.repeat(80));
  console.log('🚀 GAVIN (Optimizer) - Iterations:', run.gavin_gilfoyle_iterations);
  console.log('-'.repeat(80));
  if (run.gavin_output) {
    console.log(JSON.stringify(run.gavin_output, null, 2));
  } else {
    console.log('No output');
  }

  // Gilfoyle
  console.log('\n' + '-'.repeat(80));
  console.log('😈 GILFOYLE (Contrarian)');
  console.log('-'.repeat(80));
  if (run.gilfoyle_output) {
    console.log(JSON.stringify(run.gilfoyle_output, null, 2));
  } else {
    console.log('No output');
  }

  // Aligned Proposal
  console.log('\n' + '-'.repeat(80));
  console.log('🤝 ALIGNED PROPOSAL');
  console.log('-'.repeat(80));
  if (run.aligned_proposal) {
    console.log(JSON.stringify(run.aligned_proposal, null, 2));
  } else {
    console.log('No aligned proposal');
  }

  // Dinesh
  console.log('\n' + '-'.repeat(80));
  console.log('🎪 DINESH (Mission Anchor)');
  console.log('-'.repeat(80));
  if (run.dinesh_output) {
    console.log(JSON.stringify(run.dinesh_output, null, 2));
  } else {
    console.log('No output');
  }

  // Laurie
  console.log('\n' + '-'.repeat(80));
  console.log('🧊 LAURIE (Decision Maker)');
  console.log('-'.repeat(80));
  if (run.laurie_decision) {
    console.log(JSON.stringify(run.laurie_decision, null, 2));
  } else {
    console.log('No decision');
  }

  // Monica
  console.log('\n' + '-'.repeat(80));
  console.log('💰 MONICA (Budget Guardian)');
  console.log('-'.repeat(80));
  if (run.monica_output) {
    console.log(JSON.stringify(run.monica_output, null, 2));
  } else {
    console.log('No output');
  }

  // Erlich
  console.log('\n' + '-'.repeat(80));
  console.log('🌭 ERLICH (Content Gate)');
  console.log('-'.repeat(80));
  if (run.erlich_output) {
    console.log(JSON.stringify(run.erlich_output, null, 2));
  } else {
    console.log('No output');
  }

  // Jared
  console.log('\n' + '-'.repeat(80));
  console.log('🔧 JARED (Technical QA)');
  console.log('-'.repeat(80));
  if (run.jared_output) {
    console.log(JSON.stringify(run.jared_output, null, 2));
  } else {
    console.log('No output');
  }

  // Executor
  console.log('\n' + '-'.repeat(80));
  console.log('⚡ EXECUTOR');
  console.log('-'.repeat(80));
  if (run.executor_output) {
    console.log(JSON.stringify(run.executor_output, null, 2));
  } else {
    console.log('No output');
  }

  // Richard
  console.log('\n' + '-'.repeat(80));
  console.log('📝 RICHARD (Narrator)');
  console.log('-'.repeat(80));
  if (run.richard_output) {
    console.log(JSON.stringify(run.richard_output, null, 2));
  } else {
    console.log('No output');
  }

  // Changes
  console.log('\n' + '-'.repeat(80));
  console.log('📋 CHANGES MADE');
  console.log('-'.repeat(80));
  if (run.changes_made && run.changes_made.length > 0) {
    console.log(JSON.stringify(run.changes_made, null, 2));
  } else {
    console.log('No changes made');
  }

  console.log('\n' + '='.repeat(80));
}

const runNumber = process.argv[2] ? parseInt(process.argv[2]) : undefined;
viewRun(runNumber).catch(console.error);
