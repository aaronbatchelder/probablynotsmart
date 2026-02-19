import { chat, parseJsonResponse, ClaudeOptions } from './claude';

export interface AgentMemoryEntry {
  run_number: number;
  decision_type: string;
  decision_summary: string;
  confidence: number | null;
  outcome: string | null;
  was_correct: boolean | null;
  lessons_learned: string | null;
}

export interface CollectiveLogEntry {
  run_number: number;
  run_summary: string;
  final_decision: string | null;
  conversion_before: number | null;
  conversion_after: number | null;
  was_successful: boolean | null;
  what_worked: string | null;
  what_didnt_work: string | null;
}

export interface AgentTrackRecord {
  total_decisions: number;
  correct_decisions: number;
  incorrect_decisions: number;
  accuracy_pct: number | null;
}

export interface AgentContext {
  run?: {
    run_number: number;
    id?: string;
    [key: string]: unknown;
  };
  history: Array<{
    run_number: number;
    changes_made: unknown[];
    metrics_before: unknown;
    metrics_after: unknown;
    laurie_decision: unknown;
    [key: string]: unknown;
  }>;
  metrics: {
    visitors_24h: number;
    unique_sessions_24h: number;
    signups_24h: number;
    conversion_rate_24h: number;
    visitors_total: number;
    signups_total: number;
    conversion_rate_total: number;
    [key: string]: unknown;
  };
  pageState: {
    headline: string;
    subheadline: string;
    cta_text: string;
    cta_color: string;
    body_copy: string;
    [key: string]: unknown;
  };
  config: {
    budget_total: number;
    budget_spent: number;
    budget_remaining: number;
    [key: string]: unknown;
  };
  // Personal memory - this agent's past decisions
  personalMemory?: AgentMemoryEntry[];
  // Collective memory - what the group decided
  collectiveMemory?: CollectiveLogEntry[];
  // Track record - this agent's accuracy
  trackRecord?: AgentTrackRecord;
  // Additional context passed between agents
  previousOutputs?: Record<string, unknown>;
}

export interface AgentResult<T> {
  output: T;
  tokensUsed: number;
  reasoning: string;
  // For memory logging
  decisionSummary?: string;
  confidence?: number;
}

export interface AgentDefinition<T> {
  name: string;
  role: string;
  personality: string;
  systemPrompt: string;
  buildUserPrompt: (context: AgentContext) => string;
  parseOutput: (content: string) => T;
  defaultOutput: T;
  options?: Partial<ClaudeOptions>;
}

/**
 * Create an agent function from a definition
 */
export function createAgent<T>(definition: AgentDefinition<T>) {
  return async function agent(context: AgentContext): Promise<AgentResult<T>> {
    // Build the user prompt with memory injected
    let userPrompt = definition.buildUserPrompt(context);

    // Inject personal memory if available
    if (context.personalMemory && context.personalMemory.length > 0) {
      const memorySection = `
## Your Personal Memory (Your Past Decisions)

${formatPersonalMemory(context.personalMemory)}

${context.trackRecord ? formatTrackRecord(context.trackRecord) : ''}
`;
      userPrompt = memorySection + '\n\n' + userPrompt;
    }

    // Inject collective memory if available
    if (context.collectiveMemory && context.collectiveMemory.length > 0) {
      const collectiveSection = `
## Collective Memory (What We've Decided Together)

${formatCollectiveMemory(context.collectiveMemory)}
`;
      userPrompt = collectiveSection + '\n\n' + userPrompt;
    }

    const response = await chat(
      [{ role: 'user', content: userPrompt }],
      {
        system: definition.systemPrompt,
        temperature: 0.7,
        maxTokens: 4096,
        ...definition.options,
      }
    );

    let output: T;
    let reasoning = '';
    let decisionSummary: string | undefined;
    let confidence: number | undefined;

    try {
      // Try to extract reasoning if it's in the response
      const reasoningMatch = response.content.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
      if (reasoningMatch) {
        reasoning = reasoningMatch[1].trim();
      }

      output = definition.parseOutput(response.content);

      // Try to extract decision summary and confidence from output
      if (output && typeof output === 'object') {
        const outputObj = output as Record<string, unknown>;
        if ('reasoning' in outputObj && typeof outputObj.reasoning === 'string') {
          decisionSummary = outputObj.reasoning.slice(0, 200);
        }
        if ('confidence' in outputObj && typeof outputObj.confidence === 'number') {
          confidence = outputObj.confidence;
        }
      }
    } catch (error) {
      console.error(`Agent ${definition.name} failed to parse output:`, error);
      output = definition.defaultOutput;
      reasoning = `Parse error: ${error}`;
    }

    return {
      output,
      tokensUsed: response.tokensUsed.total,
      reasoning,
      decisionSummary,
      confidence,
    };
  };
}

/**
 * Helper to format metrics for prompts
 */
export function formatMetrics(metrics: AgentContext['metrics']): string {
  // Only show 24h metrics - all-time totals are corrupted by pre-Feb-16 tracking gap
  return `
Current Metrics (last 24h):
- Visitors: ${metrics.visitors_24h}
- Unique Sessions: ${metrics.unique_sessions_24h}
- Signups: ${metrics.signups_24h}
- Conversion Rate: ${metrics.conversion_rate_24h}%

Note: All-time totals are hidden due to historical tracking gap. Focus on 24h trends.
`.trim();
}

/**
 * Helper to format page state for prompts
 */
export function formatPageState(pageState: AgentContext['pageState']): string {
  return `
Current Page State:
- Headline: "${pageState.headline}"
- Subheadline: "${pageState.subheadline}"
- CTA Text: "${pageState.cta_text}"
- CTA Color: ${pageState.cta_color}
- Body Copy: "${pageState.body_copy}"
`.trim();
}

/**
 * Helper to format run history for prompts
 */
export function formatHistory(history: AgentContext['history'], limit = 5): string {
  if (history.length === 0) {
    return 'No previous runs yet. This is the first optimization cycle.';
  }

  const recent = history.slice(0, limit);
  return recent.map((run) => {
    const decision = run.laurie_decision as { decision?: string; reasoning?: string } | null;
    return `
Run #${run.run_number}:
- Decision: ${decision?.decision || 'unknown'}
- Changes: ${JSON.stringify(run.changes_made || [])}
- Metrics Before: ${JSON.stringify(run.metrics_before)}
- Metrics After: ${JSON.stringify(run.metrics_after)}
`.trim();
  }).join('\n\n');
}

/**
 * Helper to format budget for prompts
 */
export function formatBudget(config: AgentContext['config']): string {
  return `
Budget Status:
- Total: $${config.budget_total}
- Spent: $${config.budget_spent}
- Remaining: $${config.budget_remaining}
`.trim();
}

/**
 * Format personal memory for agent prompts
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
 * Format track record for agent prompts
 */
export function formatTrackRecord(record: AgentTrackRecord): string {
  return `
Your Track Record:
- Total decisions: ${record.total_decisions}
- Correct: ${record.correct_decisions} | Wrong: ${record.incorrect_decisions}
- Accuracy: ${record.accuracy_pct ? `${record.accuracy_pct}%` : 'N/A'}
`.trim();
}

/**
 * Format collective memory for agent prompts
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
