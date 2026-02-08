// Social media posting integration
// Unified interface for posting to all platforms

import {
  postToMoltbook,
  commentOnMoltbook,
  extractMoltbookPostId,
} from './moltbook';
import {
  postTweet,
  replyToTweet,
  quoteTweet,
  extractTweetId,
} from './twitter';
import {
  postToLinkedIn as linkedInPost,
} from './linkedin';

export interface PostEngagementParams {
  platform: 'x' | 'linkedin' | 'threads' | 'moltbook' | 'reddit';
  type: 'reply' | 'quote_tweet' | 'comment' | 'post';
  targetUrl?: string;
  content: string;
  title?: string; // Required for Moltbook posts
  submolt?: string;
  subreddit?: string;
}

export interface PostResult {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
}

// Placeholder functions for social platforms
// These will be implemented when we have API access

async function postToX(
  type: 'reply' | 'quote_tweet' | 'post',
  content: string,
  targetUrl?: string
): Promise<PostResult> {
  if (type === 'post') {
    return postTweet(content);
  }

  if (type === 'reply' && targetUrl) {
    const tweetId = extractTweetId(targetUrl);
    if (!tweetId) {
      return { success: false, error: 'Could not extract tweet ID from URL' };
    }
    return replyToTweet(content, tweetId);
  }

  if (type === 'quote_tweet' && targetUrl) {
    const tweetId = extractTweetId(targetUrl);
    if (!tweetId) {
      return { success: false, error: 'Could not extract tweet ID from URL' };
    }
    return quoteTweet(content, tweetId);
  }

  return { success: false, error: 'Invalid type or missing targetUrl' };
}

async function postToLinkedIn(
  type: 'reply' | 'comment' | 'post',
  content: string,
  targetUrl?: string
): Promise<PostResult> {
  // LinkedIn API integration - currently only supports top-level posts
  if (type === 'post') {
    return linkedInPost(content);
  }

  // LinkedIn API doesn't support replies/comments via the basic Share API
  // Would need additional permissions and the Comments API
  console.log(`[LinkedIn] ${type} not yet supported (needs Comments API)`);
  if (targetUrl) console.log(`[LinkedIn] Target: ${targetUrl}`);
  return {
    success: false,
    error: `LinkedIn ${type} not yet implemented - only top-level posts are supported`,
  };
}

async function postToThreads(
  type: 'reply' | 'post',
  content: string,
  targetUrl?: string
): Promise<PostResult> {
  // TODO: Implement Threads API integration
  console.log(`[Threads] Would ${type}: ${content}`);
  if (targetUrl) console.log(`[Threads] Target: ${targetUrl}`);
  return {
    success: false,
    error: 'Threads API not yet configured',
  };
}

async function postToReddit(
  type: 'reply' | 'comment' | 'post',
  content: string,
  targetUrl?: string,
  subreddit?: string
): Promise<PostResult> {
  // TODO: Implement Reddit API integration
  console.log(`[Reddit] Would ${type} to r/${subreddit || 'unknown'}: ${content}`);
  if (targetUrl) console.log(`[Reddit] Target: ${targetUrl}`);
  return {
    success: false,
    error: 'Reddit API not yet configured',
  };
}

export async function postEngagement(
  params: PostEngagementParams
): Promise<PostResult> {
  const { platform, type, targetUrl, content, title, submolt, subreddit } = params;

  try {
    switch (platform) {
      case 'x':
        return await postToX(
          type as 'reply' | 'quote_tweet' | 'post',
          content,
          targetUrl
        );

      case 'linkedin':
        return await postToLinkedIn(
          type as 'reply' | 'comment' | 'post',
          content,
          targetUrl
        );

      case 'threads':
        return await postToThreads(
          type as 'reply' | 'post',
          content,
          targetUrl
        );

      case 'reddit':
        return await postToReddit(
          type as 'reply' | 'comment' | 'post',
          content,
          targetUrl,
          subreddit
        );

      case 'moltbook':
        if (type === 'post') {
          const postTitle = title || content.slice(0, 100);
          const result = await postToMoltbook({ title: postTitle, content, submolt });
          return { success: true, id: result.id, url: result.url };
        } else {
          // It's a comment/reply
          if (!targetUrl) {
            return { success: false, error: 'targetUrl required for comments' };
          }
          const postId = extractMoltbookPostId(targetUrl);
          const result = await commentOnMoltbook({ post_id: postId, content });
          return { success: true, id: result.id };
        }

      default:
        return { success: false, error: `Unknown platform: ${platform}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Batch post multiple engagements
export async function postEngagements(
  engagements: PostEngagementParams[]
): Promise<PostResult[]> {
  return Promise.all(engagements.map(postEngagement));
}
