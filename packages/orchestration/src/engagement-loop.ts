/**
 * Engagement Loop
 *
 * Handles responding to comments and mentions across platforms.
 * Runs frequently (every 15-30 min) to keep conversations going.
 */

import { createClient } from '@supabase/supabase-js';
import { jinYang, JinYangOutput, MoltbookComment } from '../../agents/src/agents/jin-yang';
import { russReplies, RussRepliesOutput, TwitterMention } from '../../agents/src/agents/russ-replies';
import {
  getPostWithComments,
  replyToComment,
  postToMoltbook,
  getMyPosts,
} from '../../integrations/src/moltbook';
import {
  getMentions,
  replyToTweet,
} from '../../integrations/src/twitter';
import type { AgentContext } from '../../agents/src/base';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface EngagementResult {
  success: boolean;
  moltbook: {
    repliesSent: number;
    newPosts: number;
  };
  twitter: {
    repliesSent: number;
  };
  error?: string;
}

/**
 * Get current metrics from Supabase
 */
async function getCurrentMetrics() {
  const { data } = await supabase
    .from('current_metrics')
    .select('*')
    .single();

  return {
    visitors_24h: data?.visitors_24h || 0,
    unique_sessions_24h: data?.unique_sessions_24h || 0,
    signups_24h: data?.signups_24h || 0,
    conversion_rate_24h: data?.conversion_rate_24h || 0,
    visitors_total: data?.visitors_total || 0,
    signups_total: data?.signups_total || 0,
    conversion_rate_total: data?.conversion_rate_total || 0,
    avg_time_on_page: 0,
    scroll_depth_avg: 0,
    cta_clicks: 0,
    bounce_rate: 0,
  };
}

/**
 * Get comments we've already replied to
 */
async function getRepliedCommentIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('engagement_replies')
    .select('comment_id')
    .eq('platform', 'moltbook');

  return new Set((data || []).map((r) => r.comment_id));
}

/**
 * Record that we replied to a comment/tweet
 */
async function recordReply(
  platform: 'moltbook' | 'twitter',
  commentId: string,
  postId: string,
  replyContent: string,
  agentName: string
) {
  await supabase.from('engagement_replies').insert({
    platform,
    comment_id: commentId,
    post_id: postId,
    reply_content: replyContent,
    agent_name: agentName,
  });
}

/**
 * Get Twitter mentions we've already replied to
 */
async function getRepliedTweetIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('engagement_replies')
    .select('comment_id')
    .eq('platform', 'twitter');

  return new Set((data || []).map((r) => r.comment_id));
}

/**
 * Get the last mention ID we processed
 */
async function getLastMentionId(): Promise<string | undefined> {
  const { data } = await supabase
    .from('engagement_replies')
    .select('comment_id')
    .eq('platform', 'twitter')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data?.comment_id;
}

/**
 * Find pending Twitter mentions
 */
async function findPendingMentions(): Promise<TwitterMention[]> {
  const repliedIds = await getRepliedTweetIds();
  const sinceId = await getLastMentionId();

  try {
    const result = await getMentions(sinceId);

    if (!result.success) {
      console.log(`   Could not fetch mentions: ${result.error}`);
      return [];
    }

    // Filter out already replied
    return result.mentions
      .filter(m => !repliedIds.has(m.id))
      .map(m => ({
        id: m.id,
        text: m.text,
        author_username: m.author_username || 'unknown',
        conversation_id: m.conversation_id,
        created_at: m.created_at,
      }));
  } catch (error) {
    console.error('   Error fetching mentions:', error);
    return [];
  }
}

/**
 * Get our known post IDs from multiple sources
 */
async function getKnownPostIds(): Promise<string[]> {
  const allIds: string[] = [];

  // 1. Try to get from growth_actions table (posts made by growth loop)
  try {
    const { data } = await supabase
      .from('growth_actions')
      .select('external_id')
      .eq('platform', 'moltbook')
      .not('external_id', 'is', null);

    const dbIds = (data || []).map((r) => r.external_id).filter(Boolean);
    allIds.push(...dbIds);
    console.log(`   Found ${dbIds.length} posts from growth_actions`);
  } catch (error) {
    console.log(`   Could not fetch from growth_actions: ${error}`);
  }

  // 2. Try to get our posts directly from Moltbook API
  try {
    const myPosts = await getMyPosts();
    const apiIds = myPosts.map((p) => p.id);
    allIds.push(...apiIds);
    console.log(`   Found ${apiIds.length} posts from Moltbook API`);
  } catch (error) {
    console.log(`   Could not fetch from Moltbook API: ${error}`);
  }

  // 3. Include hardcoded fallback IDs
  const knownIds = [
    '76ba96ba-0292-46fe-ae19-14d9e8f4633c', // Jin Yang's first post
    '536bcd40-7bef-49c2-923d-92fea702b52d', // Hello from probablynotsmart.ai
  ];
  allIds.push(...knownIds);

  // Deduplicate
  const uniqueIds = [...new Set(allIds)];
  console.log(`   Total unique posts to check: ${uniqueIds.length}`);

  return uniqueIds;
}

/**
 * Find pending comments that need replies
 */
async function findPendingComments(): Promise<MoltbookComment[]> {
  const pendingComments: MoltbookComment[] = [];
  const repliedIds = await getRepliedCommentIds();

  try {
    // Get our known post IDs
    const postIds = await getKnownPostIds();
    console.log(`   Checking ${postIds.length} known posts for comments`);

    // Check each post for comments
    for (const postId of postIds) {
      try {
        const postData = await getPostWithComments(postId);

        for (const comment of postData.comments) {
          // Skip if we already replied
          if (repliedIds.has(comment.id)) {
            continue;
          }

          // Skip our own comments
          if (comment.author.name === 'JinYang2') {
            continue;
          }

          pendingComments.push({
            id: comment.id,
            content: comment.content,
            author: {
              name: comment.author.name,
              karma: comment.author.karma,
            },
            post_title: postData.post.title,
            post_id: postId,
          });
        }
      } catch (error) {
        console.log(`   Could not fetch post ${postId}: ${error}`);
      }
    }
  } catch (error) {
    console.error('   Error fetching comments:', error);
  }

  return pendingComments;
}

/**
 * Run Moltbook engagement (Jin Yang)
 */
async function runMoltbookEngagement(metrics: any): Promise<{ repliesSent: number; newPosts: number }> {
  console.log('\n🦞 MOLTBOOK ENGAGEMENT (Jin Yang)');
  console.log('-'.repeat(40));

  // Find pending comments
  console.log('\n📥 Checking for new Moltbook comments...');
  const pendingComments = await findPendingComments();
  console.log(`   Found ${pendingComments.length} comments to respond to`);

  if (pendingComments.length === 0) {
    console.log('   No new comments. Jin Yang is chilling. 🦞');
    return { repliesSent: 0, newPosts: 0 };
  }

  // Jin Yang generates replies
  console.log('\n🎭 Jin Yang generating replies...');

  const context: AgentContext = {
    run: undefined,
    history: [],
    metrics,
    pageState: {
      headline: '',
      subheadline: '',
      cta_text: '',
      cta_color: '',
      body_copy: '',
    },
    config: { budget_total: 500, budget_spent: 0, budget_daily_cap: 30 },
    previousOutputs: {
      pending_comments: pendingComments,
      recent_posts: [],
    },
  };

  const result = await jinYang(context);
  const output = result.output as JinYangOutput;

  console.log(`   Generated ${output.replies.length} replies`);
  console.log(`   Reasoning: ${output.reasoning}`);

  // Post replies
  console.log('\n📤 Posting Moltbook replies...');

  let repliesSent = 0;
  for (const reply of output.replies) {
    const comment = pendingComments.find((c) => c.id === reply.comment_id);
    if (!comment) {
      console.log(`   ⚠️ Comment ${reply.comment_id} not found, skipping`);
      continue;
    }

    try {
      console.log(`   Replying to ${comment.author.name}: "${reply.reply_content.slice(0, 50)}..."`);

      await replyToComment(comment.post_id, comment.id, reply.reply_content);
      await recordReply('moltbook', comment.id, comment.post_id, reply.reply_content, 'JinYang');

      console.log(`   ✅ Reply sent!`);
      repliesSent++;
    } catch (error) {
      console.log(`   ❌ Failed to reply: ${error}`);
    }
  }

  // New posts (if any)
  let newPosts = 0;
  if (output.new_posts.length > 0) {
    console.log('\n📝 Creating new Moltbook posts...');

    for (const post of output.new_posts) {
      try {
        console.log(`   Posting: "${post.title.slice(0, 50)}..."`);
        await postToMoltbook({
          title: post.title,
          content: post.content,
          submolt: post.submolt,
        });
        console.log(`   ✅ Posted!`);
        newPosts++;
      } catch (error) {
        console.log(`   ❌ Failed to post: ${error}`);
      }
    }
  }

  return { repliesSent, newPosts };
}

/**
 * Run Twitter engagement (Russ)
 */
async function runTwitterEngagement(metrics: any): Promise<{ repliesSent: number }> {
  console.log('\n🐦 TWITTER ENGAGEMENT (Russ)');
  console.log('-'.repeat(40));

  // Find pending mentions
  console.log('\n📥 Checking for new Twitter mentions...');
  const pendingMentions = await findPendingMentions();
  console.log(`   Found ${pendingMentions.length} mentions to respond to`);

  if (pendingMentions.length === 0) {
    console.log('   No new mentions. Russ is counting his three commas. 🤙');
    return { repliesSent: 0 };
  }

  // Russ generates replies
  console.log('\n🎭 Russ generating replies...');

  const context: AgentContext = {
    run: undefined,
    history: [],
    metrics,
    pageState: {
      headline: '',
      subheadline: '',
      cta_text: '',
      cta_color: '',
      body_copy: '',
    },
    config: { budget_total: 500, budget_spent: 0, budget_daily_cap: 30 },
    previousOutputs: {
      pending_mentions: pendingMentions,
      recent_replies: [],
    },
  };

  const result = await russReplies(context);
  const output = result.output as RussRepliesOutput;

  console.log(`   Generated ${output.replies.length} replies`);
  console.log(`   Reasoning: ${output.reasoning}`);

  // Post replies
  console.log('\n📤 Posting Twitter replies...');

  let repliesSent = 0;
  for (const reply of output.replies) {
    const mention = pendingMentions.find((m) => m.id === reply.tweet_id);
    if (!mention) {
      console.log(`   ⚠️ Tweet ${reply.tweet_id} not found, skipping`);
      continue;
    }

    try {
      console.log(`   Replying to @${mention.author_username}: "${reply.reply_content.slice(0, 50)}..."`);

      const result = await replyToTweet(reply.reply_content, reply.tweet_id);

      if (result.success) {
        await recordReply('twitter', mention.id, mention.conversation_id, reply.reply_content, 'Russ');
        console.log(`   ✅ Reply sent! ${result.url}`);
        repliesSent++;
      } else {
        console.log(`   ❌ Failed to reply: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to reply: ${error}`);
    }
  }

  return { repliesSent };
}

/**
 * Run the engagement loop
 */
export async function runEngagementLoop(): Promise<EngagementResult> {
  console.log('\n💬 Starting Engagement Loop\n');
  console.log('='.repeat(50));

  try {
    // Get metrics
    const metrics = await getCurrentMetrics();
    console.log(`   Subscribers: ${metrics.signups_total}`);

    // Run both platforms
    const moltbookResult = await runMoltbookEngagement(metrics);
    const twitterResult = await runTwitterEngagement(metrics);

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Engagement Loop Complete!`);
    console.log(`   Moltbook: ${moltbookResult.repliesSent} replies, ${moltbookResult.newPosts} posts`);
    console.log(`   Twitter: ${twitterResult.repliesSent} replies`);
    console.log('='.repeat(50));

    return {
      success: true,
      moltbook: moltbookResult,
      twitter: twitterResult,
    };
  } catch (error) {
    console.error('❌ Engagement loop error:', error);
    return {
      success: false,
      moltbook: { repliesSent: 0, newPosts: 0 },
      twitter: { repliesSent: 0 },
      error: String(error),
    };
  }
}
