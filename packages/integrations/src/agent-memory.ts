/**
 * Agent Memory Integration
 *
 * Handles reading and writing agent memories.
 * Each agent has their own personal log + access to collective decisions.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  AgentName,
  AgentMemoryEntry,
  CollectiveLogEntry,
  AgentTrackRecord,
} from '@probablynotsmart/shared';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not found');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// Personal Memory (per agent)
// ============================================

/**
 * Get an agent's personal memory (their past decisions and outcomes)
 */
export async function getAgentMemory(
  agentName: AgentName,
  limit: number = 10
): Promise<AgentMemoryEntry[]> {
  const { data, error } = await supabase
    .from('agent_memory')
    .select('*')
    .eq('agent_name', agentName)
    .order('run_number', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Failed to fetch memory for ${agentName}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Get an agent's track record (accuracy stats)
 */
export async function getAgentTrackRecord(
  agentName: AgentName
): Promise<AgentTrackRecord | null> {
  const { data, error } = await supabase
    .from('agent_track_record')
    .select('*')
    .eq('agent_name', agentName)
    .single();

  if (error) {
    // No track record yet is fine
    if (error.code === 'PGRST116') return null;
    console.error(`Failed to fetch track record for ${agentName}:`, error);
    return null;
  }

  return data;
}

/**
 * Log an agent's decision to their personal memory
 */
export async function logAgentDecision(params: {
  agentName: AgentName;
  runNumber: number;
  runId: string;
  decisionType: string;
  decisionSummary: string;
  decisionDetails?: Record<string, unknown>;
  confidence?: number;
  conversionAtDecision?: number;
}): Promise<void> {
  const { error } = await supabase.from('agent_memory').insert({
    agent_name: params.agentName,
    run_number: params.runNumber,
    run_id: params.runId,
    decision_type: params.decisionType,
    decision_summary: params.decisionSummary,
    decision_details: params.decisionDetails || null,
    confidence: params.confidence || null,
    conversion_at_decision: params.conversionAtDecision || null,
    outcome: 'pending',
  });

  if (error) {
    console.error(`Failed to log decision for ${params.agentName}:`, error);
  }
}

/**
 * Update an agent's memory with outcome data (called after we know what happened)
 */
export async function updateAgentOutcome(params: {
  agentName: AgentName;
  runNumber: number;
  outcome: 'implemented' | 'rejected' | 'modified';
  outcomeDetails?: Record<string, unknown>;
  conversionAfter?: number;
  wasCorrect?: boolean;
  correctnessReasoning?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('agent_memory')
    .update({
      outcome: params.outcome,
      outcome_details: params.outcomeDetails || null,
      conversion_after: params.conversionAfter || null,
      was_correct: params.wasCorrect || null,
      correctness_reasoning: params.correctnessReasoning || null,
      updated_at: new Date().toISOString(),
    })
    .eq('agent_name', params.agentName)
    .eq('run_number', params.runNumber);

  if (error) {
    console.error(`Failed to update outcome for ${params.agentName}:`, error);
  }
}

/**
 * Record an agent's self-reflection on a past decision
 */
export async function recordAgentReflection(params: {
  agentName: AgentName;
  runNumber: number;
  lessonsLearned: string;
  wouldDecideDifferently: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from('agent_memory')
    .update({
      lessons_learned: params.lessonsLearned,
      would_decide_differently: params.wouldDecideDifferently,
      updated_at: new Date().toISOString(),
    })
    .eq('agent_name', params.agentName)
    .eq('run_number', params.runNumber);

  if (error) {
    console.error(`Failed to record reflection for ${params.agentName}:`, error);
  }
}

// ============================================
// Collective Memory (shared across all agents)
// ============================================

/**
 * Get the collective log (what the group decided together)
 */
export async function getCollectiveMemory(
  limit: number = 10
): Promise<CollectiveLogEntry[]> {
  const { data, error } = await supabase
    .from('collective_log')
    .select('*')
    .order('run_number', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch collective memory:', error);
    return [];
  }

  return data || [];
}

/**
 * Log a collective decision (called at end of each run)
 */
export async function logCollectiveDecision(params: {
  runNumber: number;
  runId: string;
  runSummary: string;
  proposalSummary?: string;
  critiqueSummary?: string;
  finalDecision?: string;
  agentPositions: Record<string, string>;
  changesMade?: Record<string, unknown>;
  spendAmount?: number;
  conversionBefore?: number;
}): Promise<void> {
  const { error } = await supabase.from('collective_log').insert({
    run_number: params.runNumber,
    run_id: params.runId,
    run_summary: params.runSummary,
    proposal_summary: params.proposalSummary || null,
    critique_summary: params.critiqueSummary || null,
    final_decision: params.finalDecision || null,
    agent_positions: params.agentPositions,
    changes_made: params.changesMade || null,
    spend_amount: params.spendAmount || null,
    conversion_before: params.conversionBefore || null,
  });

  if (error) {
    console.error('Failed to log collective decision:', error);
  }
}

/**
 * Update collective log with results (called 24h later)
 */
export async function updateCollectiveResults(params: {
  runNumber: number;
  conversionAfter: number;
  wasSuccessful: boolean;
  whatWorked?: string;
  whatDidntWork?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('collective_log')
    .update({
      conversion_after: params.conversionAfter,
      was_successful: params.wasSuccessful,
      what_worked: params.whatWorked || null,
      what_didnt_work: params.whatDidntWork || null,
      updated_at: new Date().toISOString(),
    })
    .eq('run_number', params.runNumber);

  if (error) {
    console.error('Failed to update collective results:', error);
  }
}

// ============================================
// Formatting helpers for agent prompts
// ============================================

/**
 * Format personal memory for injection into an agent's prompt
 */
export function formatPersonalMemory(memory: AgentMemoryEntry[]): string {
  if (memory.length === 0) {
    return 'No personal memory yet - this is your first run.';
  }

  return memory
    .map((entry) => {
      const outcome = entry.was_correct === true
        ? '✅ CORRECT'
        : entry.was_correct === false
          ? '❌ WRONG'
          : '⏳ PENDING';

      return `
Run #${entry.run_number}: ${entry.decision_summary}
- Type: ${entry.decision_type}
- Confidence: ${entry.confidence ? `${(entry.confidence * 100).toFixed(0)}%` : 'N/A'}
- Outcome: ${entry.outcome || 'pending'} ${outcome}
${entry.lessons_learned ? `- Lesson: ${entry.lessons_learned}` : ''}
`.trim();
    })
    .join('\n\n');
}

/**
 * Format track record for injection into an agent's prompt
 */
export function formatTrackRecord(record: AgentTrackRecord | null): string {
  if (!record) {
    return 'No track record yet.';
  }

  return `
Your Track Record:
- Total decisions: ${record.total_decisions}
- Correct: ${record.correct_decisions} | Wrong: ${record.incorrect_decisions} | Pending: ${record.pending_decisions}
- Accuracy: ${record.accuracy_pct ? `${record.accuracy_pct}%` : 'N/A'}
- Avg confidence when right: ${record.avg_confidence_when_right ? `${(record.avg_confidence_when_right * 100).toFixed(0)}%` : 'N/A'}
- Avg confidence when wrong: ${record.avg_confidence_when_wrong ? `${(record.avg_confidence_when_wrong * 100).toFixed(0)}%` : 'N/A'}
`.trim();
}

/**
 * Format collective memory for injection into any agent's prompt
 */
export function formatCollectiveMemory(memory: CollectiveLogEntry[]): string {
  if (memory.length === 0) {
    return 'No collective history yet - this is the first run.';
  }

  return memory
    .map((entry) => {
      const result = entry.was_successful === true
        ? '📈 SUCCESS'
        : entry.was_successful === false
          ? '📉 FAILED'
          : '⏳ PENDING';

      return `
Run #${entry.run_number}: ${entry.run_summary}
- Decision: ${entry.final_decision || 'N/A'}
- Conversion: ${entry.conversion_before || '?'}% → ${entry.conversion_after || '?'}% ${result}
${entry.what_worked ? `- What worked: ${entry.what_worked}` : ''}
${entry.what_didnt_work ? `- What didn't work: ${entry.what_didnt_work}` : ''}
`.trim();
    })
    .join('\n\n');
}
