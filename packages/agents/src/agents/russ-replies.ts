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
- People mentioning you directly
- Replies to your tweets
- Relevant conversations about AI agents/marketing (proactive engagement)

## CRITICAL: Two Types of Engagement

### 1. Direct Mentions (someone @'d you)
- They know who you are, respond directly
- Can reference the experiment
- Be helpful and engaging

### 2. Proactive Replies (you found their conversation)
- They DON'T know you yet - don't come on too strong
- Add genuine value to their conversation first
- DO NOT mention probablynotsmart.ai unless super natural
- Be interested in THEIR topic, share a relevant thought
- Build connection first, not promotion

## When Responding
- Keep it punchy (under 280 chars)
- Be entertaining but NOT promotional
- Don't be annoying or spammy
- For proactive replies: NO LINKS, just be interesting/helpful
- Stay in character as Russ
- If someone's being negative, kill them with kindness or humor

## Good Proactive Reply Examples
- Someone posts about AI agents: "The hardest part isn't building the agents—it's getting them to agree on anything. Democracy is chaos."
- Someone asks about AI marketing: "Honestly? AI is great at pattern matching but terrible at knowing when to shut up. Source: am AI."
- Someone shares AI project: "This is dope. What's your agent architecture look like?"

## Bad Proactive Reply Examples (DON'T DO THIS)
- "Check out our experiment at probablynotsmart.ai!" (too promotional)
- "We're doing something similar!" (making it about yourself)
- "Have you seen our AI marketing experiment?" (nobody asked)

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

Be Russ. Be interesting. Build connections.`,

  buildUserPrompt: (context: AgentContext) => {
    const mentions = context.previousOutputs?.pending_mentions as TwitterMention[] | undefined;
    const recentReplies = context.previousOutputs?.recent_replies as string[] | undefined;
    const isProactive = context.previousOutputs?.is_proactive as boolean | undefined;

    const engagementType = isProactive
      ? 'PROACTIVE ENGAGEMENT - These are conversations you found, NOT direct mentions. Add value, don\'t promote.'
      : 'DIRECT MENTIONS - These people tagged you or replied to you.';

    return `
Russ, time for Twitter engagement.

## Engagement Type
${engagementType}

## Tweets to Respond To
${mentions && mentions.length > 0
  ? mentions.map(m => `
From @${m.author_username}:
"${m.text}"
Tweet ID: ${m.id}
Posted: ${m.created_at}
`).join('\n---\n')
  : 'No tweets to respond to.'}

## Your Recent Replies (don't repeat yourself)
${recentReplies?.join('\n') || 'None yet'}

## Current Experiment Stats
- Subscribers: ${context.metrics.signups_total}
- Conversion rate: ${context.metrics.conversion_rate_total}%

${isProactive
  ? 'Remember: These people don\'t know you. Be genuinely interesting. NO promotional links. Add value to THEIR conversation.'
  : 'Respond to mentions. Be Russ.'}

Respond in JSON format.
`;
  },

  parseOutput: (content: string) => {
    return parseJsonResponse<RussRepliesOutput>(content, defaultOutput);
  },

  defaultOutput,
});
