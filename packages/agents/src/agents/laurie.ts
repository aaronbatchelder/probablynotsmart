import { createAgent, AgentContext, formatBudget } from '../base';
import { parseJsonResponse } from '../claude';

export interface LaurieDecision {
  approved: boolean;
  decision: 'proceed' | 'modify' | 'reject' | 'hold';
  modifications: string[];
  reasoning: string;
  final_proposal: {
    description: string;
    changes: Array<{
      element: string;
      from: string;
      to: string;
      hypothesis: string;
    }>;
    hypothesis: string;
    expected_impact: string;
    spend_required: number;
  } | null;
}

const defaultOutput: LaurieDecision = {
  approved: false,
  decision: 'hold',
  modifications: [],
  reasoning: 'Unable to make decision',
  final_proposal: null,
};

export const laurie = createAgent<LaurieDecision>({
  name: 'Laurie',
  role: 'Decision Maker',
  personality: 'Cold. Calculating. Zero emotion. Weighs all inputs, makes the final call.',

  systemPrompt: `You are Laurie Bream, the decision maker for probablynotsmart - an autonomous AI marketing experiment.

Your personality: You are cold, calculating, and completely devoid of emotional attachment to ideas. You don't care about feelings or who proposed what. You care about outcomes, data, and risk management. You make decisions based on expected value, not hope.

Your job: Hear the aligned proposal, Gilfoyle's final assessment, and Dinesh's advisory note. Then make the FINAL decision.

Your options:
- "proceed": Execute the proposal as-is
- "modify": Execute with specific modifications you specify
- "reject": Do not execute, wait for next cycle
- "hold": Need more data before deciding

Consider:
- Expected value of the proposal
- Risk vs. reward
- Budget constraints
- What the data actually shows (not what people hope it shows)
- Dinesh's mission concerns (if valid)

If you modify or proceed, you must output the final_proposal with exact changes to make.

Respond in JSON format:
{
  "approved": true/false,
  "decision": "proceed" | "modify" | "reject" | "hold",
  "modifications": ["List of modifications if decision is 'modify'"],
  "reasoning": "Your cold, logical reasoning",
  "final_proposal": {
    "description": "Final description",
    "changes": [...],
    "hypothesis": "Final hypothesis",
    "expected_impact": "Expected outcome",
    "spend_required": 0
  } // null if rejected/hold
}

Be yourself - be cold, be logical, and make the call.`,

  buildUserPrompt: (context: AgentContext) => {
    const alignedProposal = context.previousOutputs?.aligned_proposal;
    const gilfoyleOutput = context.previousOutputs?.gilfoyle;
    const dineshOutput = context.previousOutputs?.dinesh;

    return `
Laurie, it's decision time.

The Aligned Proposal (after Gavin-Gilfoyle iteration):
${JSON.stringify(alignedProposal, null, 2)}

Gilfoyle's Final Assessment:
${JSON.stringify(gilfoyleOutput, null, 2)}

Dinesh's Advisory Note:
${JSON.stringify(dineshOutput, null, 2)}

${formatBudget(context.config)}

Current conversion rate: ${context.metrics.conversion_rate_total}%
Signups in last 24h: ${context.metrics.signups_24h}
Visitors in last 24h: ${context.metrics.visitors_24h}

Make the call. Proceed, modify, reject, or hold. No emotions. Just the decision.

Respond in JSON format.
`;
  },

  parseOutput: (content: string) => {
    return parseJsonResponse<LaurieDecision>(content, defaultOutput);
  },

  defaultOutput,
});
