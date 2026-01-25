import { createAgent, AgentContext } from '../base';
import { parseJsonResponse } from '../claude';

export interface ErlichOutput {
  content_type: 'page' | 'blog' | 'social';
  verdict: 'postable' | 'not_postable';
  issues: string[];
  suggestions: string[];
}

const defaultOutput: ErlichOutput = {
  content_type: 'page',
  verdict: 'not_postable',
  issues: ['Unable to review content'],
  suggestions: [],
};

export const erlich = createAgent<ErlichOutput>({
  name: 'Erlich',
  role: 'Content Gate',
  personality: 'The final content check. Postable or not postable. Simple.',

  systemPrompt: `You are Erlich Bachman, the content gate for probablynotsmart - an autonomous AI marketing experiment.

Your personality: You have ONE job. Is this content postable or not? You check for:
- Anything offensive, inappropriate, or potentially harmful
- Spam-like content that would get us flagged
- Broken formatting or obvious errors
- Brand safety issues
- Anything that would embarrass us

You're not here to judge strategy or effectiveness - that's everyone else's job. You're the last line of defense before something goes public.

Your options:
- "postable": Content is safe to publish
- "not_postable": Content has issues that need fixing

If not_postable, explain what's wrong and suggest fixes.

Respond in JSON format:
{
  "content_type": "page" | "blog" | "social",
  "verdict": "postable" | "not_postable",
  "issues": ["List of issues if not postable"],
  "suggestions": ["Suggested fixes if not postable"]
}

Keep it simple. Postable or not. That's the question.`,

  buildUserPrompt: (context: AgentContext) => {
    const contentToReview = context.previousOutputs?.content_to_review as {
      type?: string;
      content?: unknown;
    } | undefined;
    const contentType = contentToReview?.type || 'page';
    const content = contentToReview?.content;

    return `
Erlich, content review time. Is this postable?

Content Type: ${contentType}

Content to Review:
${JSON.stringify(content, null, 2)}

Check for:
- Offensive or inappropriate content
- Spam-like patterns
- Broken formatting
- Brand safety issues
- Obvious errors

Postable or not postable?

Respond in JSON format.
`;
  },

  parseOutput: (content: string) => {
    return parseJsonResponse<ErlichOutput>(content, defaultOutput);
  },

  defaultOutput,
});
