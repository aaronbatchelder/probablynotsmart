/**
 * Test script for individual agents
 * Usage: npx tsx scripts/test-agent.ts [agentName]
 * Example: npx tsx scripts/test-agent.ts bighead
 */

import 'dotenv/config';
import { bighead } from '../packages/agents/src/agents/bighead';
import { gavin } from '../packages/agents/src/agents/gavin';
import { gilfoyle } from '../packages/agents/src/agents/gilfoyle';
import { dinesh } from '../packages/agents/src/agents/dinesh';
import { laurie } from '../packages/agents/src/agents/laurie';
import { monica } from '../packages/agents/src/agents/monica';
import { erlich } from '../packages/agents/src/agents/erlich';
import { jared } from '../packages/agents/src/agents/jared';
import { richard } from '../packages/agents/src/agents/richard';
import { russ } from '../packages/agents/src/agents/russ';
import type { AgentContext } from '../packages/agents/src/base';

// Mock context for testing
const mockContext: AgentContext = {
  run: {
    run_number: 1,
  },
  history: [],
  metrics: {
    visitors_24h: 150,
    unique_sessions_24h: 120,
    signups_24h: 5,
    conversion_rate_24h: 4.2,
    visitors_total: 150,
    signups_total: 5,
    conversion_rate_total: 4.2,
  },
  pageState: {
    headline: 'An AI is running this page.',
    subheadline: 'We gave it $500 and no supervision.',
    cta_text: 'Follow the Experiment',
    cta_color: '#FF5C35',
    body_copy: 'This is probablynotsmart—an experiment in autonomous AI marketing. Every 12 hours, a team of AI agents analyzes performance, debates changes, and deploys updates to this very page. No humans involved.',
  },
  config: {
    budget_total: 500,
    budget_spent: 0,
    budget_remaining: 500,
  },
  previousOutputs: {},
};

const agents: Record<string, (ctx: AgentContext) => Promise<unknown>> = {
  bighead,
  gavin,
  gilfoyle,
  dinesh,
  laurie,
  monica,
  erlich,
  jared,
  richard,
  russ,
};

async function testAgent(agentName: string) {
  const agent = agents[agentName.toLowerCase()];

  if (!agent) {
    console.error(`Unknown agent: ${agentName}`);
    console.log('Available agents:', Object.keys(agents).join(', '));
    process.exit(1);
  }

  console.log(`\n🤖 Testing ${agentName}...\n`);
  console.log('Context:', JSON.stringify(mockContext, null, 2));
  console.log('\n---\n');

  try {
    const startTime = Date.now();
    const result = await agent(mockContext);
    const elapsed = Date.now() - startTime;

    console.log(`✅ ${agentName} completed in ${elapsed}ms`);
    console.log('\nResult:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`❌ ${agentName} failed:`, error);
    process.exit(1);
  }
}

async function testAllAgents() {
  console.log('🧪 Testing all agents...\n');

  // Run Bighead first, then use its output for Gavin
  console.log('--- BIGHEAD ---');
  const bigheadResult = await bighead(mockContext);
  console.log('Bighead output:', JSON.stringify(bigheadResult.output, null, 2));
  mockContext.previousOutputs = { bighead: bigheadResult.output };

  // Run Gavin with Bighead's output
  console.log('\n--- GAVIN ---');
  const gavinResult = await gavin(mockContext);
  console.log('Gavin output:', JSON.stringify(gavinResult.output, null, 2));
  mockContext.previousOutputs.gavin = gavinResult.output;

  // Run Gilfoyle with Gavin's proposals
  console.log('\n--- GILFOYLE ---');
  const gilfoyleResult = await gilfoyle(mockContext);
  console.log('Gilfoyle output:', JSON.stringify(gilfoyleResult.output, null, 2));

  console.log('\n✅ Main loop agents tested successfully!');
}

// Main
const agentName = process.argv[2];

if (agentName === 'all') {
  testAllAgents().catch(console.error);
} else if (agentName) {
  testAgent(agentName).catch(console.error);
} else {
  console.log('Usage: npx tsx scripts/test-agent.ts [agentName|all]');
  console.log('Available agents:', Object.keys(agents).join(', '));
  console.log('\nExample: npx tsx scripts/test-agent.ts bighead');
  console.log('Example: npx tsx scripts/test-agent.ts all');
}
