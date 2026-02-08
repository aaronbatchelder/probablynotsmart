/**
 * Engagement Loop
 *
 * Handles responding to comments and mentions across platforms.
 * Runs frequently (every 15-30 min) to keep conversations going.
 */

import { createClient } from '@supabase/supabase-js';
import { jinYang, JinYangOutput, MoltbookComment } from '../../agents/src/agents/jin-yang';
import {
  getPostWithComments,
  replyToComment,
  postToMoltbook,
} from '../../integrations/src/moltbook';
import type { AgentContext } from '../../agents/src/base';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface EngagementResult {
  success: boolean;
  repliesSent: number;
  newPosts: number;
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
 * Record that we replied to a comment
 */
async function recordReply(
  commentId: string,
  postId: string,
  replyContent: string,
  agentName: string
) {
  await supabase.from('engagement_replies').insert({
    platform: 'moltbook',
    comment_id: commentId,
    post_id: postId,
    reply_content: replyContent,
    agent_name: agentName,
  });
}

/**
 * Get our known post IDs from database or hardcoded
 */
async function getKnownPostIds(): Promise<string[]> {
  // Try to get from database first
  const { data } = await supabase
    .from('growth_actions')
    .select('external_id')
    .eq('platform', 'moltbook')
    .not('external_id', 'is', null);

  const dbIds = (data || []).map((r) => r.external_id).filter(Boolean);

  // Also include any hardcoded IDs we know about
  const knownIds = [
    '76ba96ba-0292-46fe-ae19-14d9e8f4633c', // Jin Yang's first post
    '536bcd40-7bef-49c2-923d-92fea702b52d', // Hello from probablynotsmart.ai
  ];

  return [...new Set([...dbIds, ...knownIds])];
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
 * Run the engagement loop
 */
export async function runEngagementLoop(): Promise<EngagementResult> {
  console.log('\n💬 Starting Engagement Loop\n');
  console.log('='.repeat(50));

  try {
    // Get metrics
    const metrics = await getCurrentMetrics();
    console.log(`   Subscribers: ${metrics.signups_total}`);

    // ========== STEP 1: FIND PENDING COMMENTS ==========
    console.log('\n📥 Step 1: Checking for new comments...');
    const pendingComments = await findPendingComments();
    console.log(`   Found ${pendingComments.length} comments to respond to`);

    if (pendingComments.length === 0) {
      console.log('\n   No new comments. Jin Yang is chilling. 🦞');
      return { success: true, repliesSent: 0, newPosts: 0 };
    }

    // ========== STEP 2: JIN YANG GENERATES REPLIES ==========
    console.log('\n🎭 Step 2: Jin Yang generating replies...');

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

    // ========== STEP 3: POST REPLIES ==========
    console.log('\n📤 Step 3: Posting replies...');

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
        await recordReply(comment.id, comment.post_id, reply.reply_content, 'JinYang');

        console.log(`   ✅ Reply sent!`);
        repliesSent++;
      } catch (error) {
        console.log(`   ❌ Failed to reply: ${error}`);
      }
    }

    // ========== STEP 4: NEW POSTS (if any) ==========
    let newPosts = 0;
    if (output.new_posts.length > 0) {
      console.log('\n📝 Step 4: Creating new posts...');

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

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Engagement Loop Complete!`);
    console.log(`   Replies sent: ${repliesSent}`);
    console.log(`   New posts: ${newPosts}`);
    console.log('='.repeat(50));

    return { success: true, repliesSent, newPosts };
  } catch (error) {
    console.error('❌ Engagement loop error:', error);
    return {
      success: false,
      repliesSent: 0,
      newPosts: 0,
      error: String(error),
    };
  }
}
