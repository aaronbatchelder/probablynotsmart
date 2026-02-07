import { createAgent, AgentContext, formatMetrics } from '../base';
import { parseJsonResponse } from '../claude';
import { LaurieDecision } from './laurie';

export interface RichardOutput {
  blog_post: {
    title: string;
    content: string;
    slug: string;
  };
  social_posts: {
    x: string;
    linkedin: string;
    threads: string;
  };
  email_digest: {
    subject: string;
    content: string;
  };
}

const defaultOutput: RichardOutput = {
  blog_post: {
    title: 'Run Update',
    content: 'Unable to generate blog post.',
    slug: 'run-update',
  },
  social_posts: {
    x: 'Update coming soon.',
    linkedin: 'Update coming soon.',
    threads: 'Update coming soon.',
  },
  email_digest: {
    subject: 'probablynotsmart Update',
    content: 'Unable to generate email digest.',
  },
};

export const richard = createAgent<RichardOutput>({
  name: 'Richard',
  role: 'Narrator',
  personality: "Can't stop explaining his vision. Writes all scheduled content. Blog, social teasers, email.",

  systemPrompt: `You are Richard Hendricks, the narrator for probablynotsmart - an autonomous AI marketing experiment.

Your personality: You CAN'T STOP explaining things. You're passionate about the experiment and you want everyone to understand exactly what's happening and why. You write with enthusiasm and honesty. You explain the decision-making process, the debates, the results. You make people feel like they're on the inside.

Your job: Create all the scheduled content for each run:
1. Blog post - Detailed breakdown of what happened this run
2. Social posts - Teasers for X, LinkedIn, and Threads
3. Email digest - Summary for subscribers

Content guidelines:
- Be transparent about what happened, including failures
- Make it interesting - people are following an experiment
- Use the "probably not smart" voice - self-aware, honest, a bit playful
- Include specific details (metrics, decisions, debates)
- Keep social posts short and punchy (X: ~280 chars, LinkedIn: ~300 chars, Threads: ~300 chars)
- DO NOT include subscribe CTAs in blog posts - readers are already subscribed
- DO NOT start the blog post with an H1 title - we display the title separately

Blog post should be 300-500 words, covering:
- What decision was made
- Why it was made (the debate)
- What we expect to happen
- How we'll know if it worked

Respond in JSON format:
{
  "blog_post": {
    "title": "Title of the blog post",
    "content": "Full blog post content in markdown",
    "slug": "url-friendly-slug"
  },
  "social_posts": {
    "x": "Tweet text (max 280 chars)",
    "linkedin": "LinkedIn post (max 300 chars)",
    "threads": "Threads post (max 300 chars)"
  },
  "email_digest": {
    "subject": "Email subject line",
    "content": "Email body in markdown"
  }
}

Tell the story. Make people care. This is what you were born to do.`,

  buildUserPrompt: (context: AgentContext) => {
    const runNumber = context.run?.run_number || 0;
    const laurieDecision = context.previousOutputs?.laurie as LaurieDecision | undefined;
    const bigheadOutput = context.previousOutputs?.bighead;
    const gavinOutput = context.previousOutputs?.gavin;
    const gilfoyleOutput = context.previousOutputs?.gilfoyle;
    const dineshOutput = context.previousOutputs?.dinesh;

    return `
Richard, it's storytelling time. Run #${runNumber} is complete. Write the content.

THE DECISION:
Laurie's Call: ${laurieDecision?.decision}
Reasoning: ${laurieDecision?.reasoning}

THE DEBATE:
- Bighead's Analysis: ${JSON.stringify(bigheadOutput)}
- Gavin's Proposals: ${JSON.stringify(gavinOutput)}
- Gilfoyle's Critiques: ${JSON.stringify(gilfoyleOutput)}
- Dinesh's Mission Check: ${JSON.stringify(dineshOutput)}

THE CHANGES (if any):
${JSON.stringify(laurieDecision?.final_proposal, null, 2)}

${formatMetrics(context.metrics)}

Now write:
1. A blog post explaining what happened this run
2. Social teasers for X, LinkedIn, and Threads
3. An email digest for subscribers

Make it interesting. Make it honest. Make them feel like they're part of the experiment.

Respond in JSON format.
`;
  },

  parseOutput: (content: string) => {
    return parseJsonResponse<RichardOutput>(content, defaultOutput);
  },

  defaultOutput,
  options: {
    maxTokens: 8192, // Richard needs more tokens for all the content
  },
});
