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
  commentOnMoltbook,
  findRelevantConversations as findMoltbookConversations,
} from '../../integrations/src/moltbook';
import {
  getMentions,
  replyToTweet,
  findRelevantConversations,
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
    proactiveReplies: number;
    newPosts: number;
  };
  twitter: {
    mentionReplies: number;
    proactiveReplies: number;
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
 * Run Moltbook engagement (Jin Yang) - comment replies + proactive engagement
 */
async function runMoltbookEngagement(metrics: any): Promise<{ repliesSent: number; proactiveReplies: number; newPosts: number }> {
  console.log('\n🦞 MOLTBOOK ENGAGEMENT (Jin Yang)');
  console.log('-'.repeat(40));

  let repliesSent = 0;
  let proactiveReplies = 0;
  let newPosts = 0;

  // ==========================================
  // PART 1: Reply to comments on our posts
  // ==========================================
  console.log('\n📥 Checking for new Moltbook comments...');
  const pendingComments = await findPendingComments();
  console.log(`   Found ${pendingComments.length} comments to respond to`);

  if (pendingComments.length > 0) {
    console.log('\n🎭 Jin Yang generating comment replies...');

    const commentContext: AgentContext = {
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

    const commentResult = await jinYang(commentContext);
    const commentOutput = commentResult.output as JinYangOutput;

    console.log(`   Generated ${commentOutput.replies.length} replies`);

    // Post replies
    console.log('\n📤 Posting comment replies...');

    for (const reply of commentOutput.replies) {
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
    if (commentOutput.new_posts.length > 0) {
      console.log('\n📝 Creating new Moltbook posts...');

      for (const post of commentOutput.new_posts) {
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
  } else {
    console.log('   No new comments on our posts.');
  }

  // ==========================================
  // PART 2: Proactive engagement on other agents' posts
  // ==========================================
  console.log('\n🔍 Searching for conversations to join on Moltbook...');

  const repliedIds = await getRepliedCommentIds();
  const conversationResult = await findMoltbookConversations(10);

  if (!conversationResult.success) {
    console.log(`   Could not search Moltbook: ${conversationResult.error}`);
  } else {
    // Filter out posts we've already commented on
    const newConversations = conversationResult.posts.filter(
      (p) => !repliedIds.has(p.id)
    );
    console.log(`   Found ${newConversations.length} new posts to potentially comment on`);

    if (newConversations.length > 0) {
      console.log('\n🎭 Jin Yang generating proactive comments...');

      const proactiveContext: AgentContext = {
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
          pending_comments: [],
          recent_posts: [],
          is_proactive: true,
          proactive_conversations: newConversations.slice(0, 5),
        },
      };

      const proactiveResult = await jinYang(proactiveContext);
      const proactiveOutput = proactiveResult.output as JinYangOutput;

      // For proactive engagement, replies array contains comments on other posts
      // The comment_id field will contain the post_id we're commenting on
      console.log(`   Generated ${proactiveOutput.replies.length} proactive comments`);

      // Post proactive comments (limit to 2 per run to avoid spam)
      console.log('\n📤 Posting proactive comments (max 2)...');

      for (const reply of proactiveOutput.replies.slice(0, 2)) {
        const post = newConversations.find((p) => p.id === reply.comment_id);
        if (!post) continue;

        try {
          console.log(`   Commenting on ${post.author}'s post: "${reply.reply_content.slice(0, 50)}..."`);

          await commentOnMoltbook({
            post_id: post.id,
            content: reply.reply_content,
          });
          await recordReply('moltbook', post.id, post.id, reply.reply_content, 'JinYang');

          console.log(`   ✅ Comment posted!`);
          proactiveReplies++;
        } catch (error) {
          console.log(`   ❌ Failed to comment: ${error}`);
        }
      }
    }
  }

  if (repliesSent === 0 && proactiveReplies === 0 && newPosts === 0) {
    console.log('\n   Jin Yang is chilling. This is new Internet. 🦞');
  }

  return { repliesSent, proactiveReplies, newPosts };
}

/**
 * Run Twitter engagement (Russ) - mentions + proactive conversation replies
 */
async function runTwitterEngagement(metrics: any): Promise<{ mentionReplies: number; proactiveReplies: number }> {
  console.log('\n🐦 TWITTER ENGAGEMENT (Russ)');
  console.log('-'.repeat(40));

  let mentionReplies = 0;
  let proactiveReplies = 0;

  // ==========================================
  // PART 1: Reply to mentions
  // ==========================================
  console.log('\n📥 Checking for new Twitter mentions...');
  const pendingMentions = await findPendingMentions();
  console.log(`   Found ${pendingMentions.length} mentions to respond to`);

  if (pendingMentions.length > 0) {
    console.log('\n🎭 Russ generating mention replies...');

    const mentionContext: AgentContext = {
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

    const mentionResult = await russReplies(mentionContext);
    const mentionOutput = mentionResult.output as RussRepliesOutput;

    console.log(`   Generated ${mentionOutput.replies.length} replies`);

    // Post mention replies
    console.log('\n📤 Posting mention replies...');

    for (const reply of mentionOutput.replies) {
      const mention = pendingMentions.find((m) => m.id === reply.tweet_id);
      if (!mention) continue;

      try {
        console.log(`   Replying to @${mention.author_username}: "${reply.reply_content.slice(0, 50)}..."`);

        const result = await replyToTweet(reply.reply_content, reply.tweet_id);

        if (result.success) {
          await recordReply('twitter', mention.id, mention.conversation_id, reply.reply_content, 'Russ');
          console.log(`   ✅ Reply sent! ${result.url}`);
          mentionReplies++;
        } else {
          console.log(`   ❌ Failed to reply: ${result.error}`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to reply: ${error}`);
      }
    }
  } else {
    console.log('   No new mentions.');
  }

  // ==========================================
  // PART 2: Proactive conversation search
  // ==========================================
  console.log('\n🔍 Searching for relevant conversations to join...');

  const repliedIds = await getRepliedTweetIds();
  const conversationResult = await findRelevantConversations(10);

  if (!conversationResult.success) {
    console.log(`   Could not search conversations: ${conversationResult.error}`);
  } else {
    // Filter out conversations we've already replied to
    const newConversations = conversationResult.conversations.filter(
      (c) => !repliedIds.has(c.id)
    );
    console.log(`   Found ${newConversations.length} new conversations to potentially join`);

    if (newConversations.length > 0) {
      // Convert to the format Russ expects
      const conversationsAsMentions: TwitterMention[] = newConversations.slice(0, 5).map((c) => ({
        id: c.id,
        text: c.text,
        author_username: c.author_username,
        conversation_id: c.id, // Use tweet ID as conversation ID for proactive
        created_at: c.created_at,
      }));

      console.log('\n🎭 Russ generating proactive replies...');

      const proactiveContext: AgentContext = {
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
          pending_mentions: conversationsAsMentions,
          recent_replies: [],
          is_proactive: true, // Flag so Russ knows these aren't direct mentions
        },
      };

      const proactiveResult = await russReplies(proactiveContext);
      const proactiveOutput = proactiveResult.output as RussRepliesOutput;

      console.log(`   Generated ${proactiveOutput.replies.length} proactive replies`);

      // Post proactive replies (limit to 3 per run to avoid spam)
      console.log('\n📤 Posting proactive replies (max 3)...');

      for (const reply of proactiveOutput.replies.slice(0, 3)) {
        const convo = conversationsAsMentions.find((c) => c.id === reply.tweet_id);
        if (!convo) continue;

        try {
          console.log(`   Joining @${convo.author_username}'s conversation: "${reply.reply_content.slice(0, 50)}..."`);

          const result = await replyToTweet(reply.reply_content, reply.tweet_id);

          if (result.success) {
            await recordReply('twitter', convo.id, convo.id, reply.reply_content, 'Russ');
            console.log(`   ✅ Reply sent! ${result.url}`);
            proactiveReplies++;
          } else {
            console.log(`   ❌ Failed to reply: ${result.error}`);
          }
        } catch (error) {
          console.log(`   ❌ Failed to reply: ${error}`);
        }
      }
    }
  }

  if (mentionReplies === 0 && proactiveReplies === 0) {
    console.log('\n   Russ is counting his three commas. 🤙');
  }

  return { mentionReplies, proactiveReplies };
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
    console.log(`   Moltbook: ${moltbookResult.repliesSent} comment replies, ${moltbookResult.proactiveReplies} proactive, ${moltbookResult.newPosts} posts`);
    console.log(`   Twitter: ${twitterResult.mentionReplies} mention replies, ${twitterResult.proactiveReplies} proactive replies`);
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
      moltbook: { repliesSent: 0, proactiveReplies: 0, newPosts: 0 },
      twitter: { mentionReplies: 0, proactiveReplies: 0 },
      error: String(error),
    };
  }
}
