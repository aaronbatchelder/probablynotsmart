/**
 * Social Signal Discovery
 *
 * Searches Twitter and Moltbook for relevant conversations
 * that Russ can engage with to drive traffic and signups.
 */

import { searchTweets } from './twitter';
import { searchMoltbook, getSubmoltFeed } from './moltbook';

export interface SocialSignal {
  platform: 'x' | 'moltbook';
  url: string;
  author: string;
  content: string;
  created_at: string;
  relevance_score: number;
  engagement_metrics?: {
    likes?: number;
    replies?: number;
    retweets?: number;
  };
  submolt?: string;
}

export interface SocialSignalDiscoveryResult {
  signals: SocialSignal[];
  keywords_searched: string[];
  total_found: number;
}

/**
 * Keywords relevant to probablynotsmart experiment
 */
const RELEVANT_KEYWORDS = [
  // AI & Autonomous Agents
  'autonomous AI agents',
  'AI agents',
  'AI marketing',
  'autonomous marketing',
  'AI experiments',

  // Marketing & Growth
  'marketing automation',
  'growth hacking',
  'marketing experiments',
  'startup marketing',

  // Specific tech
  'Claude AI',
  'Anthropic',
  'AI tools',

  // Meta discussions
  'AI skeptics',
  'AI hype',
  'will AI replace marketers',
];

/**
 * Relevant Moltbook submolts to monitor
 */
const RELEVANT_SUBMOLTS = [
  'ai',
  'marketing',
  'startups',
  'experiments',
  'aita', // For ethical debates
  'showmb', // Show Moltbook (agents showing their work)
];

/**
 * Calculate relevance score for a tweet or post
 */
function calculateRelevanceScore(content: string, metrics?: { likes?: number; replies?: number }): number {
  let score = 0.5; // Base score

  const lowerContent = content.toLowerCase();

  // Boost for high-value keywords
  if (lowerContent.includes('autonomous') || lowerContent.includes('agent')) score += 0.2;
  if (lowerContent.includes('ai') || lowerContent.includes('artificial intelligence')) score += 0.1;
  if (lowerContent.includes('marketing') || lowerContent.includes('growth')) score += 0.15;
  if (lowerContent.includes('experiment')) score += 0.15;
  if (lowerContent.includes('claude') || lowerContent.includes('anthropic')) score += 0.25;

  // Boost for questions (engagement opportunities)
  if (lowerContent.includes('?')) score += 0.1;

  // Boost for skepticism (opportunity to engage)
  if (lowerContent.includes('skeptic') || lowerContent.includes('hype') || lowerContent.includes('overhyped')) score += 0.2;

  // Engagement metrics boost (if available)
  if (metrics?.likes && metrics.likes > 10) score += 0.1;
  if (metrics?.replies && metrics.replies > 5) score += 0.1;

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Search Twitter for relevant conversations
 */
async function discoverTwitterSignals(maxPerKeyword: number = 5): Promise<SocialSignal[]> {
  const signals: SocialSignal[] = [];

  // Search for a few high-priority keywords
  const priorityKeywords = RELEVANT_KEYWORDS.slice(0, 5);

  for (const keyword of priorityKeywords) {
    try {
      const result = await searchTweets(keyword, maxPerKeyword);

      if (result.success && result.tweets.length > 0) {
        for (const tweet of result.tweets) {
          const relevanceScore = calculateRelevanceScore(
            tweet.text,
            {
              likes: tweet.public_metrics?.like_count,
              replies: tweet.public_metrics?.reply_count,
            }
          );

          // Only include if relevance score is decent
          if (relevanceScore >= 0.6) {
            signals.push({
              platform: 'x',
              url: `https://twitter.com/${tweet.author_username || 'unknown'}/status/${tweet.id}`,
              author: tweet.author_username || tweet.author_id,
              content: tweet.text,
              created_at: tweet.created_at,
              relevance_score: relevanceScore,
              engagement_metrics: {
                likes: tweet.public_metrics?.like_count,
                replies: tweet.public_metrics?.reply_count,
                retweets: tweet.public_metrics?.retweet_count,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error(`[SocialSignals] Error searching Twitter for "${keyword}":`, error);
    }
  }

  console.log(`[SocialSignals] Discovered ${signals.length} Twitter signals`);
  return signals;
}

/**
 * Search Moltbook for relevant conversations
 */
async function discoverMoltbookSignals(): Promise<SocialSignal[]> {
  const signals: SocialSignal[] = [];

  // Check relevant submolts
  for (const submolt of RELEVANT_SUBMOLTS) {
    try {
      const posts = await getSubmoltFeed(submolt);

      for (const post of posts.slice(0, 5)) { // Top 5 from each submolt
        const relevanceScore = calculateRelevanceScore(post.content);

        if (relevanceScore >= 0.5) {
          signals.push({
            platform: 'moltbook',
            url: post.url,
            author: post.author,
            content: post.content,
            created_at: post.created_at,
            relevance_score: relevanceScore,
            submolt: post.submolt || submolt,
          });
        }
      }
    } catch (error) {
      console.error(`[SocialSignals] Error fetching m/${submolt}:`, error);
    }
  }

  // Also do a few keyword searches
  const moltbookKeywords = ['AI agents', 'autonomous', 'marketing experiment'];

  for (const keyword of moltbookKeywords) {
    try {
      const posts = await searchMoltbook(keyword);

      for (const post of posts.slice(0, 3)) {
        const relevanceScore = calculateRelevanceScore(post.content);

        if (relevanceScore >= 0.6) {
          signals.push({
            platform: 'moltbook',
            url: post.url,
            author: post.author,
            content: post.content,
            created_at: post.created_at,
            relevance_score: relevanceScore,
            submolt: post.submolt,
          });
        }
      }
    } catch (error) {
      console.error(`[SocialSignals] Error searching Moltbook for "${keyword}":`, error);
    }
  }

  console.log(`[SocialSignals] Discovered ${signals.length} Moltbook signals`);
  return signals;
}

/**
 * Discover social signals across all platforms
 *
 * @param options.twitterMaxPerKeyword - Max tweets per keyword (default: 5)
 * @param options.platforms - Platforms to search (default: ['x', 'moltbook'])
 * @returns Sorted list of social signals by relevance score
 */
export async function discoverSocialSignals(options?: {
  twitterMaxPerKeyword?: number;
  platforms?: ('x' | 'moltbook')[];
}): Promise<SocialSignalDiscoveryResult> {
  const {
    twitterMaxPerKeyword = 5,
    platforms = ['x', 'moltbook'],
  } = options || {};

  const allSignals: SocialSignal[] = [];

  // Discover Twitter signals
  if (platforms.includes('x')) {
    try {
      const twitterSignals = await discoverTwitterSignals(twitterMaxPerKeyword);
      allSignals.push(...twitterSignals);
    } catch (error) {
      console.error('[SocialSignals] Failed to discover Twitter signals:', error);
    }
  }

  // Discover Moltbook signals
  if (platforms.includes('moltbook')) {
    try {
      const moltbookSignals = await discoverMoltbookSignals();
      allSignals.push(...moltbookSignals);
    } catch (error) {
      console.error('[SocialSignals] Failed to discover Moltbook signals:', error);
    }
  }

  // Sort by relevance score (highest first)
  allSignals.sort((a, b) => b.relevance_score - a.relevance_score);

  // Take top 20 signals
  const topSignals = allSignals.slice(0, 20);

  console.log(`[SocialSignals] Returning ${topSignals.length} top signals (from ${allSignals.length} total)`);

  return {
    signals: topSignals,
    keywords_searched: RELEVANT_KEYWORDS,
    total_found: allSignals.length,
  };
}

/**
 * Format social signals for Russ agent context
 * Converts SocialSignal[] to the format expected by Russ
 */
export function formatSignalsForRuss(signals: SocialSignal[]): Array<{
  platform: string;
  content: string;
  author: string;
  url: string;
}> {
  return signals.map(signal => ({
    platform: signal.platform,
    content: signal.content,
    author: signal.author,
    url: signal.url,
  }));
}
