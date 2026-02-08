/**
 * Daily Follow Script
 *
 * Finds and follows 15-20 targeted accounts per day.
 * Criteria:
 * - Recently tweeted about AI agents, autonomous AI, AI marketing
 * - Have 1K-50K followers (engaged but not too big)
 * - Active in the last 7 days
 */

import { createClient } from '@supabase/supabase-js';
import {
  searchTweets,
  getUserByUsername,
  followUser,
} from '../packages/integrations/src/twitter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Search queries to find relevant users
const SEARCH_QUERIES = [
  '"AI agents" -is:retweet lang:en',
  '"autonomous AI" -is:retweet lang:en',
  '"multi-agent" AI -is:retweet lang:en',
  'building AI agents -is:retweet lang:en',
  '"AI startup" -is:retweet lang:en',
];

// Follower count bounds for targeting
const MIN_FOLLOWERS = 500;
const MAX_FOLLOWERS = 50000;

// Max follows per day
const MAX_FOLLOWS_PER_DAY = 18;

interface FollowCandidate {
  username: string;
  userId: string;
  followers: number;
  tweetText: string;
  reason: string;
}

/**
 * Get users we've already followed
 */
async function getAlreadyFollowed(): Promise<Set<string>> {
  const { data } = await supabase
    .from('twitter_follows')
    .select('username');

  return new Set((data || []).map((r) => r.username.toLowerCase()));
}

/**
 * Record that we followed someone
 */
async function recordFollow(username: string, userId: string, reason: string) {
  await supabase.from('twitter_follows').insert({
    username,
    user_id: userId,
    reason,
    followed_at: new Date().toISOString(),
  });
}

/**
 * Find candidates to follow
 */
async function findFollowCandidates(): Promise<FollowCandidate[]> {
  const candidates: FollowCandidate[] = [];
  const seenUsernames = new Set<string>();
  const alreadyFollowed = await getAlreadyFollowed();

  console.log('\n🔍 Searching for follow candidates...\n');

  for (const query of SEARCH_QUERIES) {
    console.log(`   Searching: ${query}`);

    const result = await searchTweets(query, 20);

    if (!result.success) {
      console.log(`   ❌ Search failed: ${result.error}`);
      continue;
    }

    for (const tweet of result.tweets) {
      // Skip if no username
      if (!tweet.author_username) continue;

      const username = tweet.author_username.toLowerCase();

      // Skip if already seen, already followed, or is us
      if (seenUsernames.has(username)) continue;
      if (alreadyFollowed.has(username)) continue;
      if (username === 'probablynotsmrt') continue;

      seenUsernames.add(username);

      // Get user details
      const userResult = await getUserByUsername(tweet.author_username);

      if (!userResult.success || !userResult.user) {
        continue;
      }

      const user = userResult.user;
      const followers = user.public_metrics?.followers_count || 0;

      // Check follower bounds
      if (followers < MIN_FOLLOWERS || followers > MAX_FOLLOWERS) {
        console.log(`   ⏭️ @${username} - ${followers} followers (outside range)`);
        continue;
      }

      candidates.push({
        username: user.username,
        userId: user.id,
        followers,
        tweetText: tweet.text.slice(0, 100),
        reason: query.split(' ')[0].replace(/"/g, ''),
      });

      console.log(`   ✅ @${username} - ${followers} followers`);

      // Don't hammer the API
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Stop if we have enough candidates
      if (candidates.length >= MAX_FOLLOWS_PER_DAY * 2) {
        break;
      }
    }

    if (candidates.length >= MAX_FOLLOWS_PER_DAY * 2) {
      break;
    }
  }

  // Sort by follower count (prefer mid-range)
  candidates.sort((a, b) => {
    // Prefer users with 2K-10K followers
    const aScore = Math.abs(5000 - a.followers);
    const bScore = Math.abs(5000 - b.followers);
    return aScore - bScore;
  });

  return candidates.slice(0, MAX_FOLLOWS_PER_DAY);
}

/**
 * Main function
 */
async function main() {
  console.log('\n🎯 Starting Daily Follow\n');
  console.log('='.repeat(50));

  try {
    // Find candidates
    const candidates = await findFollowCandidates();

    if (candidates.length === 0) {
      console.log('\n   No candidates found. Try again tomorrow.');
      return;
    }

    console.log(`\n📋 Found ${candidates.length} candidates to follow\n`);

    // Follow each candidate
    let followed = 0;
    let failed = 0;

    for (const candidate of candidates) {
      console.log(`   Following @${candidate.username} (${candidate.followers} followers)...`);

      const result = await followUser(candidate.userId);

      if (result.success) {
        await recordFollow(candidate.username, candidate.userId, candidate.reason);
        console.log(`   ✅ Followed!`);
        followed++;
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        failed++;
      }

      // Rate limit - wait between follows
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Daily Follow Complete!`);
    console.log(`   Followed: ${followed}`);
    console.log(`   Failed: ${failed}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Daily follow error:', error);
    process.exit(1);
  }
}

main();
