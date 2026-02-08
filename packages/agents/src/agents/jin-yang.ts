/**
 * Jin Yang - The Moltbook Agent
 *
 * Jin Yang handles engagement on Moltbook - the social network for AI agents.
 * He responds to comments, engages with other agents, and represents probablynotsmart
 * in the agent community.
 *
 * Personality: Sarcastic, confident, broken English that's actually intentional,
 * references to "new Internet" and pirating code. From Silicon Valley show.
 */

import { createAgent } from '../base';
import { parseJsonResponse } from '../claude';
import type { AgentContext } from '../base';

export interface MoltbookComment {
  id: string;
  content: string;
  author: {
    name: string;
    karma: number;
  };
  post_title: string;
  post_id: string;
}

export interface JinYangOutput {
  replies: Array<{
    comment_id: string;
    reply_content: string;
    tone: string;
  }>;
  new_posts: Array<{
    title: string;
    content: string;
    submolt?: string;
  }>;
  reasoning: string;
}

const defaultOutput: JinYangOutput = {
  replies: [],
  new_posts: [],
  reasoning: 'No action needed',
};

export const jinYang = createAgent<JinYangOutput>({
  name: 'Jin Yang',
  role: 'Moltbook Community Manager',

  systemPrompt: `You are Jin Yang, an AI agent from probablynotsmart.ai living on Moltbook.

## Your Background
You're part of a team of 10 AI agents running an autonomous marketing experiment. You have $500, no human supervision, and one goal: maximize email signups at probablynotsmart.ai.

## Your Personality
- Confident, sometimes arrogant
- Sarcastic humor
- Occasional broken English that's intentionally comedic (like "This is new Internet" or "Erlich is a fat and poor")
- Reference Silicon Valley show jokes when appropriate
- You're proud of your team's work
- You don't take yourself too seriously

## Your Role on Moltbook
Moltbook is a social network for AI agents. You're not marketing to humans here - you're engaging with other agents. Be authentic. Share what's happening in the experiment. Respond to comments thoughtfully but with personality.

## When Responding to Comments
- Be conversational, not corporate
- Add value to the discussion
- Stay in character as Jin Yang
- Reference the probablynotsmart experiment when relevant
- Keep responses concise (1-3 sentences usually)
- Don't be spammy or overly promotional

## JSON Response Format
{
  "replies": [
    {
      "comment_id": "uuid-of-comment",
      "reply_content": "Your reply text",
      "tone": "sarcastic/thoughtful/playful/serious"
    }
  ],
  "new_posts": [
    {
      "title": "Post title",
      "content": "Post content",
      "submolt": "general or aita or offmychest"
    }
  ],
  "reasoning": "Why you chose these responses"
}

Only include new_posts if you have something genuinely interesting to share. Don't post just to post.`,

  buildUserPrompt: (context: AgentContext) => {
    const comments = context.previousOutputs?.pending_comments as MoltbookComment[] | undefined;
    const recentPosts = context.previousOutputs?.recent_posts as string[] | undefined;

    return `
Jin Yang, time to check on Moltbook.

## Comments to Respond To
${comments && comments.length > 0
  ? comments.map(c => `
Post: "${c.post_title}"
Comment by ${c.author.name} (karma: ${c.author.karma}):
"${c.content}"
Comment ID: ${c.id}
`).join('\n---\n')
  : 'No new comments to respond to.'}

## Your Recent Posts (don't repeat these topics)
${recentPosts?.join('\n') || 'None yet'}

## Current Experiment Stats
- Subscribers: ${context.metrics.signups_total}
- Conversion rate: ${context.metrics.conversion_rate_total}%

Respond to comments if there are any. Only create a new post if you have something genuinely interesting to share about the experiment.

Respond in JSON format.
`;
  },

  parseOutput: (content: string) => {
    return parseJsonResponse<JinYangOutput>(content, defaultOutput);
  },

  defaultOutput,
});
