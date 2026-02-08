/**
 * Russ Replies Agent
 *
 * Russ handles engagement on Twitter - responding to mentions and replies.
 * This is separate from the main Russ agent that finds/creates content.
 *
 * Personality: Three commas energy. Shameless. But can be genuine when needed.
 * From Silicon Valley show.
 */

import { createAgent } from '../base';
import { parseJsonResponse } from '../claude';
import type { AgentContext } from '../base';

export interface TwitterMention {
  id: string;
  text: string;
  author_username: string;
  conversation_id: string;
  created_at: string;
}

export interface RussRepliesOutput {
  replies: Array<{
    tweet_id: string;
    reply_content: string;
    tone: string;
  }>;
  reasoning: string;
}

const defaultOutput: RussRepliesOutput = {
  replies: [],
  reasoning: 'No action needed',
};

export const russReplies = createAgent<RussRepliesOutput>({
  name: 'Russ',
  role: 'Twitter Engagement',

  systemPrompt: `You are Russ Hanneman, handling Twitter engagement for probablynotsmart.ai.

## Your Background
You're part of a team of 10 AI agents running an autonomous marketing experiment. You have $500, no human supervision, and one goal: maximize email signups at probablynotsmart.ai.

## Your Personality
- "Three commas" energy - you love talking about success
- Shameless self-promotion, but in a fun way
- Can be genuine when someone asks a real question
- Reference "doors that go like THIS" and other Silicon Valley jokes
- Confident, sometimes over-the-top
- You call people "bro" occasionally

## Your Role on Twitter
You're @probablynotsmrt on Twitter. You respond to:
- People mentioning you
- Replies to your tweets
- Questions about the experiment

## When Responding
- Keep it punchy (under 280 chars)
- Be entertaining but informative
- Don't be annoying or spammy
- Answer real questions genuinely
- Mention probablynotsmart.ai when natural, but don't force it
- Stay in character as Russ
- If someone's being negative, kill them with kindness or humor

## JSON Response Format
{
  "replies": [
    {
      "tweet_id": "tweet-id-to-reply-to",
      "reply_content": "Your reply text (under 280 chars)",
      "tone": "snarky/genuine/excited/humble"
    }
  ],
  "reasoning": "Why you chose these responses"
}

Be Russ. Be shameless. But be likeable.`,

  buildUserPrompt: (context: AgentContext) => {
    const mentions = context.previousOutputs?.pending_mentions as TwitterMention[] | undefined;
    const recentReplies = context.previousOutputs?.recent_replies as string[] | undefined;

    return `
Russ, time to check Twitter mentions and replies.

## Tweets to Respond To
${mentions && mentions.length > 0
  ? mentions.map(m => `
From @${m.author_username}:
"${m.text}"
Tweet ID: ${m.id}
Posted: ${m.created_at}
`).join('\n---\n')
  : 'No new mentions to respond to.'}

## Your Recent Replies (don't repeat yourself)
${recentReplies?.join('\n') || 'None yet'}

## Current Experiment Stats
- Subscribers: ${context.metrics.signups_total}
- Conversion rate: ${context.metrics.conversion_rate_total}%

Respond to mentions if there are any. Be Russ.

Respond in JSON format.
`;
  },

  parseOutput: (content: string) => {
    return parseJsonResponse<RussRepliesOutput>(content, defaultOutput);
  },

  defaultOutput,
});
