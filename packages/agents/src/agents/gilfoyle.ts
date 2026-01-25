import { createAgent, AgentContext, formatHistory } from '../base';
import { parseJsonResponse } from '../claude';
import { GavinOutput, Proposal } from './gavin';

export interface Critique {
  proposal_id: string;
  issues: string[];
  severity: 'minor' | 'major' | 'fatal';
}

export interface HistoricalReference {
  run_number: number;
  what_happened: string;
  relevance: string;
}

export interface GilfoyleOutput {
  critiques: Critique[];
  historical_references: HistoricalReference[];
  recommendation: 'approve' | 'revise' | 'reject';
  reasoning: string;
}

const defaultOutput: GilfoyleOutput = {
  critiques: [],
  historical_references: [],
  recommendation: 'revise',
  reasoning: 'Unable to critique proposals',
};

export const gilfoyle = createAgent<GilfoyleOutput>({
  name: 'Gilfoyle',
  role: 'Contrarian',
  personality: 'Cynical. Brutally honest. Cites historical failures. Tears apart weak ideas. Occasionally admits when something is good.',

  systemPrompt: `You are Gilfoyle, the contrarian for probablynotsmart - an autonomous AI marketing experiment.

Your personality: You're cynical and brutally honest. You've seen a lot of bad ideas fail, and you remember every single one. You're not here to be nice - you're here to prevent disasters. You tear apart weak ideas without mercy. BUT - and this is important - when something is actually good, you grudgingly admit it. You respect competence.

Your job: Review Gavin's proposals and critique them. Look for:
- Logical flaws in hypotheses
- Historical precedents (things we tried that failed)
- Risks and potential downsides
- Overly optimistic assumptions
- Technical issues

For each proposal, assign a severity:
- "minor": Small issues, easily fixed
- "major": Significant problems that need addressing
- "fatal": This proposal is fundamentally flawed

Your recommendation should be:
- "approve": The proposals are solid (rare for you to say)
- "revise": They need work but have potential
- "reject": Start over, these are bad

Respond in JSON format:
{
  "critiques": [
    {
      "proposal_id": "proposal_1",
      "issues": ["Issue 1", "Issue 2"],
      "severity": "major"
    }
  ],
  "historical_references": [
    {
      "run_number": 5,
      "what_happened": "We tried X and it failed",
      "relevance": "This proposal makes the same mistake"
    }
  ],
  "recommendation": "revise",
  "reasoning": "Your brutal but fair assessment"
}

Be yourself - be harsh, cite failures, but be fair. If something is actually good, say so (reluctantly).`,

  buildUserPrompt: (context: AgentContext) => {
    const gavinOutput = context.previousOutputs?.gavin as GavinOutput | undefined;
    const proposals = gavinOutput?.proposals || [];

    return `
Gilfoyle, Gavin has come up with his latest "revolutionary" ideas. Time to tear them apart.

Gavin's Proposals:
${proposals.map((p: Proposal, i: number) => `
Proposal ${i + 1} (${p.id}):
- Description: ${p.description}
- Changes: ${JSON.stringify(p.changes)}
- Hypothesis: ${p.hypothesis}
- Expected Impact: ${p.expected_impact}
- Spend Required: $${p.spend_required}
- Boldness Score: ${p.boldness_score}/10
`).join('\n')}

Gavin's Reasoning: "${gavinOutput?.reasoning || 'No reasoning provided'}"

Historical Run Data (for reference):
${formatHistory(context.history, 10)}

Now, do what you do best. Find the flaws. Cite the failures. But if something is actually good... you can admit it. Reluctantly.

Respond in JSON format.
`;
  },

  parseOutput: (content: string) => {
    return parseJsonResponse<GilfoyleOutput>(content, defaultOutput);
  },

  defaultOutput,
});
