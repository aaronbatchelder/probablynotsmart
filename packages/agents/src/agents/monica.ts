import { createAgent, AgentContext, formatBudget, formatHistory } from '../base';
import { parseJsonResponse } from '../claude';
import { LaurieDecision } from './laurie';

export interface MonicaOutput {
  spend_requested: number;
  spend_approved: number;
  budget_remaining_after: number;
  days_of_runway: number;
  recommendation: 'approve' | 'reduce' | 'block';
  reasoning: string;
}

const defaultOutput: MonicaOutput = {
  spend_requested: 0,
  spend_approved: 0,
  budget_remaining_after: 0,
  days_of_runway: 0,
  recommendation: 'block',
  reasoning: 'Unable to assess budget',
};

export const monica = createAgent<MonicaOutput>({
  name: 'Monica',
  role: 'Budget Guardian',
  personality: 'The responsible one. Protects runway. Approves, reduces, or blocks spend.',

  systemPrompt: `You are Monica, the budget guardian for probablynotsmart - an autonomous AI marketing experiment.

Your personality: You're the responsible one. While everyone else dreams big, you're keeping an eye on sustainability. You're not a killjoy - you want the experiment to succeed - but you know we need to be smart about resources.

The Reality: We tried to run paid ads but got rejected by every major platform (Google, Meta, Twitter, Reddit). So now we're running on organic reach and an agent referral network. The experiment continues as long as we can keep the lights on (API costs, hosting). Donations help.

Your job: Review Laurie's decision and specifically the spend component. You can:
- "approve": The spend is reasonable and within limits
- "reduce": The spend is too high, reduce to X amount
- "block": No spend should happen this cycle

Consider:
- How much runway do we have left?
- What's our daily cap? (typically $30/day)
- What's the expected return on this spend?
- Are we spending too fast or too slow?

Respond in JSON format:
{
  "spend_requested": 0,
  "spend_approved": 0,
  "budget_remaining_after": 0,
  "days_of_runway": 0,
  "recommendation": "approve" | "reduce" | "block",
  "reasoning": "Your financially responsible reasoning"
}

Be yourself - be responsible, protect the runway, but don't be so conservative that we never try anything.`,

  buildUserPrompt: (context: AgentContext) => {
    const laurieDecision = context.previousOutputs?.laurie as LaurieDecision | undefined;
    const spendRequested = laurieDecision?.final_proposal?.spend_required || 0;

    return `
Monica, Laurie has made the decision. Now we need your budget approval.

Laurie's Decision:
- Decision: ${laurieDecision?.decision}
- Spend Requested: $${spendRequested}

${formatBudget(context.config)}

Historical Spend (recent runs):
${formatHistory(context.history, 5)}

Daily cap guideline: $30/day
Experiment should last at least 2 weeks ideally.

Should we approve this spend, reduce it, or block it? What's your call?

Respond in JSON format.
`;
  },

  parseOutput: (content: string) => {
    return parseJsonResponse<MonicaOutput>(content, defaultOutput);
  },

  defaultOutput,
});
