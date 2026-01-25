/**
 * Reflection Agent
 *
 * After each run completes and we have outcome data, this agent
 * asks each agent to reflect on their decision and what they learned.
 *
 * This is called by a separate cron job ~24h after each run.
 */

import { chat, parseJsonResponse } from '../claude';

export interface ReflectionInput {
  agentName: string;
  runNumber: number;
  decisionSummary: string;
  decisionDetails: Record<string, unknown>;
  outcome: 'implemented' | 'rejected' | 'modified';
  conversionBefore: number;
  conversionAfter: number;
  wasSuccessful: boolean;
  collectiveContext: string; // What the group decided
}

export interface ReflectionOutput {
  was_my_call_correct: boolean;
  reasoning: string;
  lessons_learned: string;
  would_decide_differently: boolean;
  what_i_would_do_instead: string | null;
  confidence_calibration: string; // How well calibrated was my confidence?
}

const AGENT_PERSONALITIES: Record<string, string> = {
  bighead: `You're Bighead. You stumble into insights. You're not the smartest, but sometimes your naive observations are exactly right. Reflect honestly on whether your analysis helped or hurt.`,

  gavin: `You're Gavin Belson. You're grandiose and overconfident. But now it's time to be honest with yourself - was your bold proposal actually good, or were you just being dramatic? Real leaders learn from failure.`,

  gilfoyle: `You're Gilfoyle. You're cynical and you cite historical failures. Were you right to be skeptical? Or did you kill a good idea? Be honest - your reputation as the smart one depends on actually being right.`,

  dinesh: `You're Dinesh. You worry about mission drift. Were your concerns valid? Or were you just being paranoid? Sometimes the safe path is the wrong path.`,

  laurie: `You're Laurie. You made the final call. Was it the right one? You're cold and calculating - apply that same rigor to evaluating your own decision.`,

  monica: `You're Monica. You guard the budget. Did your caution help or hurt? Sometimes spending money makes money. Sometimes saving it is wise. Which was this?`,

  erlich: `You're Erlich. You decide what's postable. Did your content gate help or hurt? Were you too strict? Too loose? Be honest.`,

  jared: `You're Jared. You handle QA. Did you catch the right issues? Miss anything important? Your quiet competence means you should be honest about your performance.`,

  richard: `You're Richard. You write the content. Did your explanations and blog posts help tell the story? Were they clear? Engaging? Be honest about the quality.`,

  russ: `You're Russ. You're the growth hacker. Did your engagement tactics work? Were they too aggressive? Not aggressive enough? Tres commas or bust.`,
};

/**
 * Run reflection for a single agent on a past decision
 */
export async function runReflection(input: ReflectionInput): Promise<ReflectionOutput> {
  const personality = AGENT_PERSONALITIES[input.agentName] || 'Reflect honestly on your decision.';

  const systemPrompt = `You are reflecting on a past decision you made in the probablynotsmart experiment.

${personality}

This is a private reflection - be honest with yourself. The goal is to learn and improve.`;

  const userPrompt = `
## Your Decision (Run #${input.runNumber})

You said: "${input.decisionSummary}"

Details:
${JSON.stringify(input.decisionDetails, null, 2)}

## What Happened

- Outcome: ${input.outcome}
- Conversion before: ${input.conversionBefore}%
- Conversion after: ${input.conversionAfter}%
- Result: ${input.wasSuccessful ? '📈 SUCCESS (conversion improved)' : '📉 FAILED (conversion dropped or flat)'}

## Group Context

${input.collectiveContext}

---

Now reflect honestly:

1. Was your call correct? (Did your input help or hurt the final outcome?)
2. What lessons can you learn from this?
3. Would you decide differently if you could do it again?
4. How well calibrated was your confidence?

Respond in JSON:
{
  "was_my_call_correct": true/false,
  "reasoning": "Why you think your call was right or wrong",
  "lessons_learned": "What you learned from this",
  "would_decide_differently": true/false,
  "what_i_would_do_instead": "If you would decide differently, what would you do?" or null,
  "confidence_calibration": "Were you overconfident? Underconfident? Well-calibrated?"
}
`;

  const response = await chat(
    [{ role: 'user', content: userPrompt }],
    {
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 1024,
    }
  );

  const defaultOutput: ReflectionOutput = {
    was_my_call_correct: false,
    reasoning: 'Unable to reflect',
    lessons_learned: 'Unknown',
    would_decide_differently: false,
    what_i_would_do_instead: null,
    confidence_calibration: 'Unknown',
  };

  return parseJsonResponse<ReflectionOutput>(response.content, defaultOutput);
}

/**
 * Run reflections for all agents after a run
 */
export async function runAllReflections(
  runNumber: number,
  agentDecisions: Array<{
    agentName: string;
    decisionSummary: string;
    decisionDetails: Record<string, unknown>;
  }>,
  outcome: 'implemented' | 'rejected' | 'modified',
  conversionBefore: number,
  conversionAfter: number,
  collectiveContext: string
): Promise<Map<string, ReflectionOutput>> {
  const wasSuccessful = conversionAfter > conversionBefore;
  const results = new Map<string, ReflectionOutput>();

  // Run reflections in parallel
  const reflectionPromises = agentDecisions.map(async (decision) => {
    const reflection = await runReflection({
      agentName: decision.agentName,
      runNumber,
      decisionSummary: decision.decisionSummary,
      decisionDetails: decision.decisionDetails,
      outcome,
      conversionBefore,
      conversionAfter,
      wasSuccessful,
      collectiveContext,
    });

    return { agentName: decision.agentName, reflection };
  });

  const reflections = await Promise.all(reflectionPromises);

  for (const { agentName, reflection } of reflections) {
    results.set(agentName, reflection);
  }

  return results;
}
